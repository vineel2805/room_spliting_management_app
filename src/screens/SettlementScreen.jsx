import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { 
  calculateMonthlyTotals, 
  generateObligations, 
  compressToNetBalances, 
  calculateSettlementsFromBalances 
} from '../services/calculationService';
import { recordSettlement, getSettlementsByRoom } from '../services/firebaseService';

const SettlementScreen = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentRoom, 
    members, 
    expenses, 
    expenseDetails,
    selectedMonth 
  } = useRoom();

  const { beneficiariesMap, paymentsMap } = expenseDetails;
  const [settledPayments, setSettledPayments] = useState([]);
  const [settlingIndex, setSettlingIndex] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load existing settlements for this month
  useEffect(() => {
    const loadSettlements = async () => {
      if (currentRoom) {
        setLoading(true);
        const settlements = await getSettlementsByRoom(
          currentRoom.id, 
          selectedMonth.year, 
          selectedMonth.month
        );
        setSettledPayments(settlements);
        setLoading(false);
      }
    };
    loadSettlements();
  }, [currentRoom, selectedMonth]);

  // Find current user's member ID
  const currentUserMember = members.find(m => m.oderId === user?.uid);

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  const memberTotals = calculateMonthlyTotals(
    expenses, members, beneficiariesMap, paymentsMap, selectedMonth.year, selectedMonth.month
  );
  const obligations = generateObligations(
    expenses, members, beneficiariesMap, paymentsMap, selectedMonth.year, selectedMonth.month
  );
  const netBalances = compressToNetBalances(obligations, members);
  const settlements = calculateSettlementsFromBalances(netBalances);

  const creditors = Object.values(netBalances)
    .filter(m => m.netBalance > 0.01)
    .sort((a, b) => b.netBalance - a.netBalance);
  const debtors = Object.values(netBalances)
    .filter(m => m.netBalance < -0.01)
    .sort((a, b) => a.netBalance - b.netBalance);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Check if a settlement is already marked as settled
  const isSettled = (fromId, toId, amount) => {
    return settledPayments.some(s => 
      s.fromMemberId === fromId && 
      s.toMemberId === toId && 
      Math.abs(s.amount - amount) < 0.01
    );
  };

  // Check if current user is the receiver (can settle)
  const canSettle = (toMemberId) => {
    return currentUserMember && currentUserMember.id === toMemberId;
  };

  const handleSettle = async (settlement, index) => {
    setSettlingIndex(index);
    try {
      await recordSettlement({
        roomId: currentRoom.id,
        fromMemberId: settlement.fromMemberId,
        fromMemberName: settlement.fromName,
        toMemberId: settlement.toMemberId,
        toMemberName: settlement.toName,
        amount: settlement.amount,
        settledByUid: user.uid,
        year: selectedMonth.year,
        month: selectedMonth.month
      });
      
      // Refresh settlements
      const updated = await getSettlementsByRoom(
        currentRoom.id,
        selectedMonth.year,
        selectedMonth.month
      );
      setSettledPayments(updated);
      setShowConfirm(null);
    } catch (err) {
      console.error('Error settling:', err);
      alert('Failed to mark as settled');
    } finally {
      setSettlingIndex(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-surface px-5 pt-12 pb-4 border-b border-divider">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-secondary mb-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-[22px] font-semibold text-text-primary">Settlement</h1>
        <p className="text-xs text-text-muted mt-1">{months[selectedMonth.month]} {selectedMonth.year}</p>
      </div>

      <div className="px-5 py-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-success-light rounded-card p-4">
            <p className="text-xs text-text-muted mb-1">Total to Receive</p>
            <p className="text-xl font-semibold text-success">
              ₹{creditors.reduce((sum, c) => sum + c.netBalance, 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-text-muted mt-1">{creditors.length} {creditors.length === 1 ? 'person' : 'people'}</p>
          </div>
          <div className="bg-error-light rounded-card p-4">
            <p className="text-xs text-text-muted mb-1">Total to Pay</p>
            <p className="text-xl font-semibold text-error">
              ₹{Math.abs(debtors.reduce((sum, d) => sum + d.netBalance, 0)).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-text-muted mt-1">{debtors.length} {debtors.length === 1 ? 'person' : 'people'}</p>
          </div>
        </div>

        {/* Settlements */}
        <div className="mb-6">
          <h3 className="text-base font-medium text-text-primary mb-3">
            Optimal Settlements ({settlements.length})
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-surface rounded-card p-4 shadow-card">
                  <div className="skeleton h-10 w-full rounded mb-3" />
                  <div className="skeleton h-6 w-32 rounded" />
                </div>
              ))}
            </div>
          ) : settlements.length === 0 ? (
            <div className="bg-surface rounded-card p-8 shadow-card text-center">
              <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-base font-medium text-text-primary mb-1">All Settled!</p>
              <p className="text-sm text-text-secondary">Everyone is even for this month.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((s, idx) => {
                const settled = isSettled(s.fromMemberId, s.toMemberId, s.amount);
                const userCanSettle = canSettle(s.toMemberId);
                
                return (
                  <div key={idx} className={`bg-surface rounded-card p-4 shadow-card ${settled ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-error-light flex items-center justify-center text-error font-semibold text-sm">
                        {(s.fromName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{s.fromName || 'Unknown'}</p>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                        <p className="text-sm font-medium text-text-primary truncate">{s.toName || 'Unknown'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-success-light flex items-center justify-center text-success font-semibold text-sm">
                        {(s.toName || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-divider flex items-center justify-between">
                      <div>
                        <span className="text-xs text-text-muted">Amount</span>
                        <p className={`text-lg font-semibold ${settled ? 'text-text-muted line-through' : 'text-primary'}`}>
                          ₹{s.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      
                      {settled ? (
                        <div className="flex items-center gap-2 text-success">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-sm font-medium">Settled</span>
                        </div>
                      ) : userCanSettle ? (
                        <button
                          onClick={() => setShowConfirm(idx)}
                          disabled={settlingIndex === idx}
                          className="px-4 py-2 bg-success text-white text-sm font-medium rounded-button hover:bg-success/90 disabled:opacity-50 transition-colors"
                        >
                          {settlingIndex === idx ? 'Settling...' : 'Mark Settled'}
                        </button>
                      ) : (
                        <span className="text-xs text-text-muted italic">Waiting for {s.toName} to confirm</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Balance List */}
        <div>
          <h3 className="text-base font-medium text-text-primary mb-3">Net Balances</h3>
          <div className="bg-surface rounded-card shadow-card divide-y divide-divider overflow-hidden">
            {Object.values(netBalances)
              .sort((a, b) => b.netBalance - a.netBalance)
              .map((m) => (
                <div key={m.memberId} className="flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                    m.netBalance > 0.01 ? 'bg-success-light text-success' : m.netBalance < -0.01 ? 'bg-error-light text-error' : 'bg-background text-text-muted'
                  }`}>
                    {(m.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <p className="flex-1 text-sm font-medium text-text-primary">{m.name || 'Unknown'}</p>
                  <p className={`text-sm font-semibold ${
                    m.netBalance > 0.01 ? 'text-success' : m.netBalance < -0.01 ? 'text-error' : 'text-text-muted'
                  }`}>
                    {m.netBalance > 0.01 ? '+' : ''}₹{m.netBalance.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Confirm Settlement Modal */}
      {showConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <div className="bg-surface rounded-card p-6 w-full max-w-sm shadow-xl animate-slide-up">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Confirm Settlement</h3>
            <p className="text-sm text-text-secondary mb-4">
              Did you receive <span className="font-semibold text-primary">₹{settlements[showConfirm]?.amount.toLocaleString('en-IN')}</span> from <span className="font-semibold">{settlements[showConfirm]?.fromName}</span>?
            </p>
            <p className="text-xs text-text-muted mb-6">
              This will mark the payment as settled and save it to your history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 h-11 rounded-button border border-divider text-text-secondary text-sm font-medium hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSettle(settlements[showConfirm], showConfirm)}
                disabled={settlingIndex === showConfirm}
                className="flex-1 h-11 rounded-button bg-success text-white text-sm font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
              >
                {settlingIndex === showConfirm ? 'Saving...' : 'Yes, Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementScreen;
