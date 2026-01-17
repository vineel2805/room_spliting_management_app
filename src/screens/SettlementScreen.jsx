import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { 
  calculateMonthlyTotals, 
  generateObligations, 
  compressToNetBalances, 
  calculateSettlementsFromBalances 
} from '../services/calculationService';

const SettlementScreen = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { 
    currentRoom, 
    members, 
    expenses, 
    expenseDetails,
    selectedMonth 
  } = useRoom();

  const { beneficiariesMap, paymentsMap } = expenseDetails;

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
          
          {settlements.length === 0 ? (
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
              {settlements.map((s, idx) => (
                <div key={idx} className="bg-surface rounded-card p-4 shadow-card">
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
                    <span className="text-xs text-text-muted">Amount</span>
                    <span className="text-lg font-semibold text-primary">₹{s.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
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
    </div>
  );
};

export default SettlementScreen;
