import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import MembersScreen from './screens/MembersScreen';
import SettlementScreen from './screens/SettlementScreen';
import ExpenseListScreen from './screens/ExpenseListScreen';

function App() {
  return (
    <RoomProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/add" element={<AddExpenseScreen />} />
            <Route path="/members" element={<MembersScreen />} />
            <Route path="/settle/:id" element={<SettlementScreen />} />
            <Route path="/expenses" element={<ExpenseListScreen />} />
            <Route path="/groups" element={<HomeScreen />} />
          </Routes>
          <BottomNav />
        </div>
      </Router>
    </RoomProvider>
  );
}

export default App;
