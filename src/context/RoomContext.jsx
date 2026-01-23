import React, { createContext, useContext, useState, useEffect } from 'react';
import * as firebaseService from '../services/firebaseService';

const RoomContext = createContext();

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseDetails, setExpenseDetails] = useState({ beneficiariesMap: {}, paymentsMap: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletedExpense, setDeletedExpense] = useState(null);
  
  // Selected month for dashboard
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Load rooms on mount
  useEffect(() => {
    loadRooms();
  }, []);

  // Load room data when room changes
  useEffect(() => {
    if (currentRoom) {
      loadRoomData(currentRoom.id);
      // Save to localStorage for persistence
      localStorage.setItem('currentRoomId', currentRoom.id);
    }
  }, [currentRoom?.id]);

  // Restore room from localStorage on mount
  useEffect(() => {
    const savedRoomId = localStorage.getItem('currentRoomId');
    if (savedRoomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === savedRoomId);
      if (room) setCurrentRoom(room);
    }
    setLoading(false);
  }, [rooms]);

  const loadRooms = async () => {
    try {
      setError(null);
      const roomList = await firebaseService.getRooms();
      setRooms(roomList);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Failed to load rooms. Please check your internet connection.');
    }
  };

  const loadRoomData = async (roomId) => {
    try {
      setLoading(true);
      setError(null);
      
      const [memberList, expenseList] = await Promise.all([
        firebaseService.getMembersByRoom(roomId),
        firebaseService.getExpensesByRoom(roomId)
      ]);
      
      setMembers(memberList);
      setExpenses(expenseList);
      
      // Load expense details (beneficiaries and payments)
      if (expenseList.length > 0) {
        const details = await firebaseService.loadAllExpenseDetails(expenseList);
        setExpenseDetails(details);
      } else {
        setExpenseDetails({ beneficiariesMap: {}, paymentsMap: {} });
      }
    } catch (err) {
      console.error('Error loading room data:', err);
      setError('Failed to load room data.');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (name) => {
    try {
      setError(null);
      const roomId = await firebaseService.createRoom(name);
      await loadRooms();
      const newRoom = { id: roomId, name };
      setCurrentRoom(newRoom);
      return roomId;
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room.');
      throw err;
    }
  };

  const selectRoom = (room) => {
    setCurrentRoom(room);
    if (!room) {
      localStorage.removeItem('currentRoomId');
      setMembers([]);
      setExpenses([]);
      setExpenseDetails({ beneficiariesMap: {}, paymentsMap: {} });
    }
  };

  const addMember = async (name) => {
    if (!currentRoom) return;
    try {
      setError(null);
      await firebaseService.addMember(currentRoom.id, name);
      await loadRoomData(currentRoom.id);
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member.');
      throw err;
    }
  };

  const removeMember = async (memberId) => {
    try {
      setError(null);
      await firebaseService.deleteMember(memberId);
      await loadRoomData(currentRoom.id);
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member.');
      throw err;
    }
  };

  const addExpense = async (expenseData) => {
    if (!currentRoom) return;
    try {
      setError(null);
      await firebaseService.addExpense({
        ...expenseData,
        roomId: currentRoom.id
      });
      await loadRoomData(currentRoom.id);
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense.');
      throw err;
    }
  };

  const deleteExpense = async (expenseId) => {
    try {
      setError(null);
      
      // Store expense data before deletion for undo
      const expense = expenses.find(e => e.id === expenseId);
      const beneficiaries = expenseDetails.beneficiariesMap[expenseId] || [];
      const payments = expenseDetails.paymentsMap[expenseId] || [];
      
      if (expense) {
        setDeletedExpense({
          expense,
          beneficiaries,
          payments,
          roomId: currentRoom.id
        });
      }

      await firebaseService.deleteExpense(expenseId);
      await loadRoomData(currentRoom.id);
      
      return true;
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense.');
      throw err;
    }
  };

  // Restore deleted expense (undo)
  const undoDeleteExpense = async () => {
    if (!deletedExpense) return;
    
    try {
      setError(null);
      const { expense, beneficiaries, payments, roomId } = deletedExpense;
      
      // Recreate the expense
      await firebaseService.addExpense({
        roomId,
        itemName: expense.itemName,
        totalAmount: expense.totalAmount,
        date: expense.date?.toDate?.() || expense.date,
        beneficiaries: beneficiaries.map(b => ({
          memberId: b.memberId,
          shareAmount: b.shareAmount
        })),
        payments: payments.map(p => ({
          memberId: p.memberId,
          amount: p.paidAmount
        }))
      });
      
      setDeletedExpense(null);
      await loadRoomData(roomId);
    } catch (err) {
      console.error('Error restoring expense:', err);
      setError('Failed to restore expense.');
      throw err;
    }
  };

  const clearDeletedExpense = () => {
    setDeletedExpense(null);
  };

  const refreshData = () => {
    if (currentRoom) {
      loadRoomData(currentRoom.id);
    }
  };

  const value = {
    // State
    currentRoom,
    rooms,
    members,
    expenses,
    expenseDetails,
    loading,
    error,
    selectedMonth,
    deletedExpense,
    
    // Actions
    createRoom,
    selectRoom,
    addMember,
    removeMember,
    addExpense,
    deleteExpense,
    undoDeleteExpense,
    clearDeletedExpense,
    refreshData,
    setSelectedMonth,
    loadRooms
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};
