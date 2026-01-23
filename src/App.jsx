import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomProvider } from './context/RoomContext';
import { ToastProvider } from './context/ToastContext';
import BottomNav from './components/BottomNav';
import FloatingChatButton from './components/FloatingChatButton';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import MembersScreen from './screens/MembersScreen';
import SettlementScreen from './screens/SettlementScreen';
import ExpenseListScreen from './screens/ExpenseListScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Auth Route - redirects to home if already logged in
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Hide nav and chat button on chat screen
  const isChatScreen = location.pathname === '/chat';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={
          <AuthRoute>
            <LoginScreen />
          </AuthRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        } />
        <Route path="/add" element={
          <ProtectedRoute>
            <AddExpenseScreen />
          </ProtectedRoute>
        } />
        <Route path="/members" element={
          <ProtectedRoute>
            <MembersScreen />
          </ProtectedRoute>
        } />
        <Route path="/settle/:id" element={
          <ProtectedRoute>
            <SettlementScreen />
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute>
            <ExpenseListScreen />
          </ProtectedRoute>
        } />
        <Route path="/groups" element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfileScreen />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatScreen />
          </ProtectedRoute>
        } />
      </Routes>
      {isAuthenticated && !isChatScreen && <BottomNav />}
      {isAuthenticated && !isChatScreen && <FloatingChatButton />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </RoomProvider>
    </AuthProvider>
  );
}

export default App;
