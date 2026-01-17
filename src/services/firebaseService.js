import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============ ROOM OPERATIONS ============

export const createRoom = async (roomName) => {
  const roomRef = await addDoc(collection(db, 'rooms'), {
    name: roomName,
    createdAt: Timestamp.now()
  });
  return roomRef.id;
};

export const getRooms = async () => {
  const querySnapshot = await getDocs(collection(db, 'rooms'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getRoom = async (roomId) => {
  const docRef = doc(db, 'rooms', roomId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const deleteRoom = async (roomId) => {
  await deleteDoc(doc(db, 'rooms', roomId));
};

// ============ MEMBER OPERATIONS ============

export const addMember = async (roomId, memberName) => {
  const memberRef = await addDoc(collection(db, 'members'), {
    roomId,
    name: memberName,
    createdAt: Timestamp.now()
  });
  return memberRef.id;
};

export const getMembersByRoom = async (roomId) => {
  const q = query(
    collection(db, 'members'), 
    where('roomId', '==', roomId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const deleteMember = async (memberId) => {
  await deleteDoc(doc(db, 'members', memberId));
};

// ============ EXPENSE OPERATIONS ============

export const addExpense = async (expenseData) => {
  const { roomId, itemName, totalAmount, date, beneficiaryIds, payments } = expenseData;
  
  // Create main expense document
  const expenseRef = await addDoc(collection(db, 'expenses'), {
    roomId,
    itemName,
    totalAmount: parseFloat(totalAmount),
    date: Timestamp.fromDate(new Date(date)),
    createdAt: Timestamp.now()
  });
  
  const expenseId = expenseRef.id;
  
  // Add beneficiaries (who should split the cost)
  for (const memberId of beneficiaryIds) {
    await addDoc(collection(db, 'expense_beneficiaries'), {
      expenseId,
      memberId
    });
  }
  
  // Add payments (who actually paid)
  for (const payment of payments) {
    await addDoc(collection(db, 'expense_payments'), {
      expenseId,
      memberId: payment.memberId,
      paidAmount: parseFloat(payment.amount)
    });
  }
  
  return expenseId;
};

export const getExpensesByRoom = async (roomId) => {
  const q = query(
    collection(db, 'expenses'),
    where('roomId', '==', roomId)
  );
  const querySnapshot = await getDocs(q);
  const expenses = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  // Sort by date descending in memory to avoid requiring a composite index
  return expenses.sort((a, b) => {
    const dateA = a.date?.toDate?.() || new Date(a.date);
    const dateB = b.date?.toDate?.() || new Date(b.date);
    return dateB - dateA;
  });
};

export const getExpenseBeneficiaries = async (expenseId) => {
  const q = query(
    collection(db, 'expense_beneficiaries'),
    where('expenseId', '==', expenseId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getExpensePayments = async (expenseId) => {
  const q = query(
    collection(db, 'expense_payments'),
    where('expenseId', '==', expenseId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const deleteExpense = async (expenseId) => {
  // Delete beneficiaries
  const beneficiaries = await getExpenseBeneficiaries(expenseId);
  for (const b of beneficiaries) {
    await deleteDoc(doc(db, 'expense_beneficiaries', b.id));
  }
  
  // Delete payments
  const payments = await getExpensePayments(expenseId);
  for (const p of payments) {
    await deleteDoc(doc(db, 'expense_payments', p.id));
  }
  
  // Delete expense
  await deleteDoc(doc(db, 'expenses', expenseId));
};

// ============ BATCH LOAD HELPERS ============

export const loadAllExpenseDetails = async (expenses) => {
  const beneficiariesMap = {};
  const paymentsMap = {};
  
  for (const expense of expenses) {
    beneficiariesMap[expense.id] = await getExpenseBeneficiaries(expense.id);
    paymentsMap[expense.id] = await getExpensePayments(expense.id);
  }
  
  return { beneficiariesMap, paymentsMap };
};
