import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { auth, db } from '../config/firebase';

const googleProvider = new GoogleAuthProvider();

// ============ AUTH OPERATIONS ============

/**
 * Login with Google - automatically handles web vs native platforms
 * Web: Uses popup (better UX)
 * Native (Android/iOS): Uses redirect (required for Capacitor WebView)
 */
export const loginWithGoogle = async () => {
  try {
    // Check if running on native platform (Android/iOS via Capacitor)
    if (Capacitor.isNativePlatform()) {
      // On native platforms, use redirect method (popup doesn't work well in WebView)
      await signInWithRedirect(auth, googleProvider);
      // The result will be handled by getRedirectResult on page load
      return null;
    } else {
      // On web, use popup for better UX
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

/**
 * Handle redirect result for native platforms
 * Call this on app initialization to complete the sign-in flow
 */
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Redirect result error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ============ ROOM CODE GENERATION ============

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ============ ROOM OPERATIONS WITH AUTH ============

export const createRoomWithAuth = async (roomName, password, user) => {
  if (!user) throw new Error('Must be logged in to create a room');
  
  // Generate unique room code
  let roomCode = generateRoomCode();
  let isUnique = false;
  
  // Ensure code is unique
  while (!isUnique) {
    const existing = await getDocs(
      query(collection(db, 'rooms'), where('code', '==', roomCode))
    );
    if (existing.empty) {
      isUnique = true;
    } else {
      roomCode = generateRoomCode();
    }
  }
  
  // Create room with code and password
  const roomRef = await addDoc(collection(db, 'rooms'), {
    name: roomName,
    code: roomCode,
    password: password, // In production, hash this!
    createdBy: user.uid,
    createdAt: Timestamp.now(),
    memberUids: [user.uid]
  });
  
  // Add creator as first member
  await addDoc(collection(db, 'members'), {
    roomId: roomRef.id,
    name: user.displayName || user.email?.split('@')[0] || 'User',
    userId: user.uid,
    email: user.email,
    photoURL: user.photoURL,
    createdAt: Timestamp.now()
  });
  
  return { roomId: roomRef.id, roomCode };
};

export const joinRoomWithCode = async (code, password, user) => {
  if (!user) throw new Error('Must be logged in to join a room');
  
  // Find room by code
  const roomQuery = await getDocs(
    query(collection(db, 'rooms'), where('code', '==', code.toUpperCase()))
  );
  
  if (roomQuery.empty) {
    throw new Error('Room not found. Check the code and try again.');
  }
  
  const roomDoc = roomQuery.docs[0];
  const roomData = roomDoc.data();
  
  // Verify password
  if (roomData.password !== password) {
    throw new Error('Incorrect password.');
  }
  
  // Check if user is already a member
  if (roomData.memberUids && roomData.memberUids.includes(user.uid)) {
    return { roomId: roomDoc.id, alreadyMember: true };
  }
  
  // Add user to room's memberUids
  await updateDoc(doc(db, 'rooms', roomDoc.id), {
    memberUids: arrayUnion(user.uid)
  });
  
  // Add user as a member
  await addDoc(collection(db, 'members'), {
    roomId: roomDoc.id,
    name: user.displayName || user.email?.split('@')[0] || 'User',
    userId: user.uid,
    email: user.email,
    photoURL: user.photoURL,
    createdAt: Timestamp.now()
  });
  
  return { roomId: roomDoc.id, alreadyMember: false };
};

export const getUserRooms = async (user) => {
  if (!user) return [];
  
  try {
    const roomQuery = await getDocs(
      query(collection(db, 'rooms'), where('memberUids', 'array-contains', user.uid))
    );
    
    return roomQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user rooms:', error);
    return [];
  }
};

export const getRoomByCode = async (code) => {
  const roomQuery = await getDocs(
    query(collection(db, 'rooms'), where('code', '==', code.toUpperCase()))
  );
  
  if (roomQuery.empty) return null;
  
  const roomDoc = roomQuery.docs[0];
  return { id: roomDoc.id, ...roomDoc.data() };
};

/**
 * Calculate a member's overall balance across ALL expenses in a room
 * Takes into account recorded settlements
 * @returns {number} Balance (positive = gets back, negative = owes)
 */
export const calculateMemberOverallBalance = async (roomId, memberId) => {
  // Get all expenses for this room
  const expensesQuery = await getDocs(
    query(collection(db, 'expenses'), where('roomId', '==', roomId))
  );
  
  let totalSpends = 0;  // What they paid
  let totalShare = 0;   // What they owe
  
  for (const expenseDoc of expensesQuery.docs) {
    const expense = expenseDoc.data();
    
    // Get beneficiaries for this expense
    const beneficiariesQuery = await getDocs(
      query(collection(db, 'expense_beneficiaries'), where('expenseId', '==', expenseDoc.id))
    );
    const beneficiaries = beneficiariesQuery.docs.map(d => d.data());
    
    // Get payments for this expense
    const paymentsQuery = await getDocs(
      query(collection(db, 'expense_payments'), where('expenseId', '==', expenseDoc.id))
    );
    const payments = paymentsQuery.docs.map(d => d.data());
    
    // Calculate member's share (what they should pay)
    const isBeneficiary = beneficiaries.find(b => b.memberId === memberId);
    if (isBeneficiary) {
      if (isBeneficiary.shareAmount !== undefined && isBeneficiary.shareAmount !== null) {
        totalShare += isBeneficiary.shareAmount;
      } else {
        const sharePerPerson = expense.totalAmount / beneficiaries.length;
        totalShare += sharePerPerson;
      }
    }
    
    // Calculate member's spends (what they actually paid)
    const memberPayments = payments.filter(p => p.memberId === memberId);
    totalSpends += memberPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  }
  
  // Calculate balance from expenses
  let balance = totalSpends - totalShare;
  
  // Now account for settlements
  // Get settlements where this member RECEIVED money (reduces their positive balance)
  const receivedQuery = await getDocs(
    query(collection(db, 'settlements'), 
      where('roomId', '==', roomId),
      where('toMemberId', '==', memberId)
    )
  );
  const receivedAmount = receivedQuery.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
  
  // Get settlements where this member PAID money (reduces their negative balance)
  const paidQuery = await getDocs(
    query(collection(db, 'settlements'), 
      where('roomId', '==', roomId),
      where('fromMemberId', '==', memberId)
    )
  );
  const paidAmount = paidQuery.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
  
  // Adjust balance:
  // - If they received settlement money, reduce what they're owed
  // - If they paid settlement money, reduce what they owe
  balance = balance - receivedAmount + paidAmount;
  
  return Math.round(balance * 100) / 100;
};

/**
 * Leave a room - only allowed if balance is settled (zero)
 */
export const leaveRoom = async (roomId, user) => {
  if (!user) throw new Error('Must be logged in to leave a room');
  
  // Get room data
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (!roomSnap.exists()) {
    throw new Error('Room not found');
  }
  
  const roomData = roomSnap.data();
  
  // Find user's member document in this room
  const memberQuery = await getDocs(
    query(
      collection(db, 'members'), 
      where('roomId', '==', roomId),
      where('userId', '==', user.uid)
    )
  );
  
  if (memberQuery.empty) {
    throw new Error('You are not a member of this room');
  }
  
  const memberDoc = memberQuery.docs[0];
  const memberId = memberDoc.id;
  
  // Check balance across ALL expenses
  const balance = await calculateMemberOverallBalance(roomId, memberId);
  
  if (Math.abs(balance) > 0.01) {
    if (balance > 0) {
      throw new Error(`You cannot leave yet. You are owed ₹${balance.toLocaleString('en-IN')}. Please settle up first.`);
    } else {
      throw new Error(`You cannot leave yet. You owe ₹${Math.abs(balance).toLocaleString('en-IN')}. Please settle up first.`);
    }
  }
  
  // Check if user is the creator and only member
  if (roomData.createdBy === user.uid && roomData.memberUids?.length === 1) {
    throw new Error('You are the only member. Delete the room instead of leaving.');
  }
  
  // Remove user from room's memberUids
  await updateDoc(roomRef, {
    memberUids: arrayRemove(user.uid)
  });
  
  // Delete member document
  await deleteDoc(doc(db, 'members', memberId));
  
  return true;
};
