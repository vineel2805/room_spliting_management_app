import { 
  signInWithPopup, 
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
  arrayUnion
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const googleProvider = new GoogleAuthProvider();

// ============ AUTH OPERATIONS ============

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google login error:', error);
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
    oderId: user.uid,
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
    oderId: user.uid,
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
