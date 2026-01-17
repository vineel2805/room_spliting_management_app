import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import GradientHeader from '../components/GradientHeader';
import PrimaryButton from '../components/PrimaryButton';

const AddExpenseScreen = () => {
  const navigate = useNavigate();
  const { currentRoom, members, addExpense } = useRoom();
  
  const [itemName, setItemName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [beneficiaries, setBeneficiaries] = useState({});
  const [payers, setPayers] = useState([{ memberId: '', amount: '' }]);
  const [saving, setSaving] = useState(false);

  const toggleBeneficiary = (memberId) => {
    setBeneficiaries(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const selectAllBeneficiaries = () => {
    const allSelected = {};
    members.forEach(m => { allSelected[m.id] = true; });
    setBeneficiaries(allSelected);
  };

  const clearAllBeneficiaries = () => {
    setBeneficiaries({});
  };

  const updatePayer = (index, field, value) => {
    setPayers(prev => {
      const newPayers = [...prev];
      newPayers[index] = { ...newPayers[index], [field]: value };
      return newPayers;
    });
  };

  const addPayer = () => {
    setPayers([...payers, { memberId: '', amount: '' }]);
  };

  const removePayer = (index) => {
    if (payers.length > 1) {
      setPayers(payers.filter((_, i) => i !== index));
    }
  };

  // Auto-fill single payer amount only when amount is empty
  const handleSinglePayerSelect = (memberId) => {
    if (payers.length === 1 && totalAmount && !payers[0].amount) {
      setPayers([{ memberId, amount: totalAmount }]);
    } else {
      updatePayer(0, 'memberId', memberId);
    }
  };

  const calculatePaidTotal = () => {
    return payers.reduce((sum, payer) => sum + (parseFloat(payer.amount) || 0), 0);
  };

  const paidTotal = calculatePaidTotal();
  const totalAmountNum = parseFloat(totalAmount) || 0;
  const isPaidValid = totalAmountNum > 0 && Math.abs(paidTotal - totalAmountNum) < 0.01;
  const selectedBeneficiaries = Object.keys(beneficiaries).filter(id => beneficiaries[id]);
  const validPayers = payers.filter(p => p.memberId && parseFloat(p.amount) > 0);
  
  const isFormValid = 
    itemName.trim() && 
    totalAmountNum > 0 && 
    selectedBeneficiaries.length > 0 && 
    validPayers.length > 0 &&
    isPaidValid;

  const handleSave = async () => {
    if (!isFormValid || saving) return;
    
    setSaving(true);
    try {
      await addExpense({
        itemName: itemName.trim(),
        totalAmount: totalAmountNum,
        date: date,
        beneficiaryIds: selectedBeneficiaries,
        payments: validPayers.map(p => ({
          memberId: p.memberId,
          amount: parseFloat(p.amount)
        }))
      });
      navigate(-1);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!currentRoom) {
    return (
      <div className="min-h-screen pb-20">
        <GradientHeader title="Add Expense" />
        <div className="px-4 py-6 text-center">
          <p className="text-gray-500 mb-4">Please select a room first</p>
          <PrimaryButton variant="gradient" onClick={() => navigate('/')}>
            Go to Home
          </PrimaryButton>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <GradientHeader title="Add Expense" />
        <div className="px-4 py-6 text-center">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-gray-500 mb-4">Add members first before adding expenses</p>
          <PrimaryButton variant="gradient" onClick={() => navigate('/members')}>
            Add Members
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36">
      <GradientHeader 
        title="Add Expense"
        rightIcon={
          <button onClick={() => navigate(-1)} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* Item name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What was this expense for?
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g., Rice, Electricity Bill, Internet"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-orange"
          />
        </div>

        {/* Total amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">₹</span>
            <input
              type="text"
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => {
                const val = e.target.value;
                // Allow empty, numbers, and decimal point only
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setTotalAmount(val);
                }
              }}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-orange text-lg"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-orange"
          />
        </div>

        {/* Beneficiaries - Who uses this? */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Who uses this? <span className="text-gray-400">(Split equally)</span>
            </label>
            <div className="flex gap-2">
              <button 
                onClick={clearAllBeneficiaries}
                className="text-xs text-gray-500 font-medium"
              >
                Clear
              </button>
              <button 
                onClick={selectAllBeneficiaries}
                className="text-xs text-accent-orange font-medium"
              >
                Select All
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {members.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  beneficiaries[member.id] 
                    ? 'bg-orange-50 border-accent-orange' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={beneficiaries[member.id] || false}
                  onChange={() => toggleBeneficiary(member.id)}
                  className="w-5 h-5 text-accent-orange rounded focus:ring-2 focus:ring-accent-orange"
                />
                <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials(member.name)}
                </div>
                <span className="text-base font-medium text-gray-900 flex-1">
                  {member.name}
                </span>
                {beneficiaries[member.id] && totalAmountNum > 0 && selectedBeneficiaries.length > 0 && (
                  <span className="text-sm text-gray-500">
                    ₹{(totalAmountNum / selectedBeneficiaries.length).toFixed(2)}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Payers - Who paid? */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Who paid? <span className="text-gray-400">(Can be different amounts)</span>
          </label>
          <div className="space-y-3">
            {payers.map((payer, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
                <div className="flex items-center gap-3">
                  <select
                    value={payer.memberId}
                    onChange={(e) => {
                      if (index === 0 && payers.length === 1) {
                        handleSinglePayerSelect(e.target.value);
                      } else {
                        updatePayer(index, 'memberId', e.target.value);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  >
                    <option value="">Select who paid</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  {payers.length > 1 && (
                    <button
                      onClick={() => removePayer(index)}
                      className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={payer.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow empty, numbers, and decimal point only
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        updatePayer(index, 'amount', val);
                      }
                    }}
                    placeholder="Amount paid"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addPayer}
              className="w-full py-3 text-accent-orange font-medium border-2 border-dashed border-accent-orange rounded-xl hover:bg-orange-50 transition-colors"
            >
              + Add Another Payer
            </button>
          </div>
        </div>

        {/* Validation Message */}
        {totalAmount && (
          <div className={`p-4 rounded-xl ${
            isPaidValid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={isPaidValid ? 'text-green-700' : 'text-red-700'}>
                Total Paid
              </span>
              <span className={`font-bold ${isPaidValid ? 'text-green-700' : 'text-red-700'}`}>
                ₹{paidTotal.toFixed(2)} / ₹{totalAmountNum.toFixed(2)}
              </span>
            </div>
            {!isPaidValid && (
              <p className="text-red-600 text-sm mt-1">
                ⚠️ Paid amounts must equal the total amount
              </p>
            )}
            {isPaidValid && (
              <p className="text-green-600 text-sm mt-1">
                ✓ Amounts match perfectly!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-gray-50 via-gray-50 pt-4">
        <PrimaryButton 
          variant="gradient" 
          fullWidth
          onClick={handleSave}
          disabled={!isFormValid || saving}
        >
          {saving ? 'Saving...' : 'Save Expense'}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default AddExpenseScreen;
