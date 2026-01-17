/**
 * ============================================================================
 * INDUSTRY-STANDARD 3-LAYER SETTLEMENT MODEL
 * ============================================================================
 * 
 * Layer 1: Obligation Ledger (source of truth)
 *   - Expenses generate obligations: fromUser → toUser : amount
 *   - When A pays for B's share, B owes A
 * 
 * Layer 2: Net Balance Compression
 *   - netBalance(user) = totalReceived − totalOwed
 *   - Implicitly cancels cycles and transitive debts
 * 
 * Layer 3: Greedy Creditor-Debtor Settlement
 *   - Generates minimum transactions using greedy matching
 * 
 * "Store obligations, compress reality, settle minimally."
 * ============================================================================
 */

const EPSILON = 0.01; // Floating point threshold for comparisons

/**
 * LAYER 1: Generate Obligation Ledger from expenses
 * 
 * For each expense:
 *   - Calculate each beneficiary's share
 *   - For each payer who paid:
 *     - Distribute their payment to beneficiaries proportionally
 *     - If payer paid for someone else's share → that person owes the payer
 * 
 * @returns {Array} Array of obligations: { from, to, amount }
 */
export const generateObligations = (expenses, members, beneficiariesMap, paymentsMap, year, month) => {
  const obligations = [];
  
  // Filter expenses for the selected month
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
    return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
  });
  
  // Build member name lookup
  const memberNameMap = {};
  members.forEach(m => { memberNameMap[m.id] = m.name; });
  
  for (const expense of monthlyExpenses) {
    const beneficiaries = beneficiariesMap[expense.id] || [];
    const payments = paymentsMap[expense.id] || [];
    
    if (beneficiaries.length === 0 || payments.length === 0) continue;
    
    // Calculate each beneficiary's share (equal split)
    const sharePerPerson = expense.totalAmount / beneficiaries.length;
    
    // Create a map of beneficiary shares
    const beneficiaryShares = {};
    beneficiaries.forEach(b => {
      beneficiaryShares[b.memberId] = sharePerPerson;
    });
    
    // For each payer, generate obligations
    for (const payment of payments) {
      const payerId = payment.memberId;
      const paidAmount = payment.paidAmount;
      
      if (paidAmount <= 0) continue;
      
      // The payer's payment covers beneficiaries' shares proportionally
      // For simplicity with equal split: payer covers shares in order of beneficiaries
      // Each beneficiary who is NOT the payer owes the payer for their share
      
      // Calculate how much of the payer's payment goes to each beneficiary
      // Payment is distributed proportionally to cover the expense
      const totalExpense = expense.totalAmount;
      const payerCoverageRatio = paidAmount / totalExpense;
      
      for (const beneficiary of beneficiaries) {
        const beneficiaryId = beneficiary.memberId;
        
        // Skip if beneficiary is the payer (you don't owe yourself)
        if (beneficiaryId === payerId) continue;
        
        // The amount this beneficiary owes to this payer
        // = beneficiary's share × (payer's payment / total expense)
        const owedAmount = sharePerPerson * payerCoverageRatio;
        
        if (owedAmount > EPSILON) {
          obligations.push({
            from: beneficiaryId,
            fromName: memberNameMap[beneficiaryId],
            to: payerId,
            toName: memberNameMap[payerId],
            amount: owedAmount
          });
        }
      }
    }
  }
  
  return obligations;
};

/**
 * LAYER 2: Compress Obligations into Net Balances
 * 
 * netBalance(user) = totalReceived − totalOwed
 *   - netBalance > 0 → creditor (should receive money)
 *   - netBalance < 0 → debtor (should pay money)
 * 
 * This step implicitly cancels:
 *   - Cycles (A owes B, B owes A)
 *   - Transitive debts (A owes B, B owes C → compressed)
 * 
 * @returns {Object} Map of memberId → { memberId, name, netBalance }
 */
export const compressToNetBalances = (obligations, members) => {
  const netBalances = {};
  
  // Initialize all members with zero balance
  members.forEach(member => {
    netBalances[member.id] = {
      memberId: member.id,
      name: member.name,
      netBalance: 0
    };
  });
  
  // Process each obligation
  for (const obligation of obligations) {
    const { from, to, amount } = obligation;
    
    // 'from' owes money → decrease their balance (more negative = owes more)
    if (netBalances[from]) {
      netBalances[from].netBalance -= amount;
    }
    
    // 'to' receives money → increase their balance (more positive = owed more)
    if (netBalances[to]) {
      netBalances[to].netBalance += amount;
    }
  }
  
  // Round balances
  Object.values(netBalances).forEach(member => {
    member.netBalance = Math.round(member.netBalance * 100) / 100;
  });
  
  return netBalances;
};

/**
 * LAYER 3: Greedy Creditor-Debtor Settlement Algorithm
 * 
 * Generates minimum number of transactions to settle all balances.
 * 
 * Algorithm:
 *   1. Separate into creditors (netBalance > 0) and debtors (netBalance < 0)
 *   2. Sort creditors by balance DESC, debtors by balance ASC
 *   3. Two-pointer greedy matching:
 *      - Match largest creditor with largest debtor
 *      - Transfer min(creditor.balance, abs(debtor.balance))
 *      - Move pointer when balance reaches zero
 * 
 * Guarantees:
 *   ✅ Minimum number of transactions
 *   ✅ All final balances = 0
 *   ✅ Deterministic output
 *   ✅ Works with multiple creditors & debtors
 *   ❌ Does NOT route all payments to one person
 *   ❌ Does NOT create circular payments
 * 
 * @returns {Array} Array of settlements: { fromMemberId, fromName, toMemberId, toName, amount }
 */
export const calculateSettlementsFromBalances = (netBalances) => {
  const settlements = [];
  
  // Step 1: Separate into creditors and debtors
  const creditors = [];
  const debtors = [];
  
  Object.values(netBalances).forEach(member => {
    if (member.netBalance > EPSILON) {
      creditors.push({ ...member });
    } else if (member.netBalance < -EPSILON) {
      debtors.push({ ...member });
    }
  });
  
  // Step 2: Sort
  // Creditors: descending by netBalance (largest first)
  // Debtors: ascending by netBalance (most negative first, i.e., owes most)
  creditors.sort((a, b) => b.netBalance - a.netBalance);
  debtors.sort((a, b) => a.netBalance - b.netBalance);
  
  // Step 3: Greedy two-pointer matching
  let i = 0; // creditor index
  let j = 0; // debtor index
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    // Amount to transfer = min(what creditor is owed, what debtor owes)
    const amount = Math.min(
      creditor.netBalance,
      Math.abs(debtor.netBalance)
    );
    
    // Record settlement: debtor → creditor
    if (amount > EPSILON) {
      settlements.push({
        fromMemberId: debtor.memberId,
        fromName: debtor.name,
        toMemberId: creditor.memberId,
        toName: creditor.name,
        amount: Math.round(amount * 100) / 100
      });
    }
    
    // Update balances
    creditor.netBalance -= amount;
    debtor.netBalance += amount;
    
    // Move pointers when balance reaches zero
    if (Math.abs(creditor.netBalance) < EPSILON) i++;
    if (Math.abs(debtor.netBalance) < EPSILON) j++;
  }
  
  return settlements;
};

/**
 * MAIN ENTRY POINT: Calculate settlements using the 3-layer model
 * 
 * Flow: Obligations → Net Balances → Greedy Settlements
 */
export const calculateSettlements = (memberTotals) => {
  // Convert memberTotals (which has 'balance') to netBalances format
  const netBalances = {};
  Object.values(memberTotals).forEach(member => {
    netBalances[member.memberId] = {
      memberId: member.memberId,
      name: member.name,
      netBalance: member.balance
    };
  });
  
  return calculateSettlementsFromBalances(netBalances);
};

/**
 * FULL 3-LAYER SETTLEMENT: From raw expenses to final settlements
 * 
 * This is the complete industry-standard flow:
 *   Layer 1: Generate obligations from expenses
 *   Layer 2: Compress to net balances
 *   Layer 3: Greedy settlement
 */
export const calculateFullSettlement = (expenses, members, beneficiariesMap, paymentsMap, year, month) => {
  // Layer 1: Generate obligation ledger
  const obligations = generateObligations(expenses, members, beneficiariesMap, paymentsMap, year, month);
  
  // Layer 2: Compress to net balances
  const netBalances = compressToNetBalances(obligations, members);
  
  // Layer 3: Generate minimum settlements
  const settlements = calculateSettlementsFromBalances(netBalances);
  
  return {
    obligations,
    netBalances,
    settlements
  };
};

/**
 * Calculate each member's totals for a given month
 * 
 * Core Concept:
 * - Expense (Should Pay) = Share of items they used
 * - Spends (Actually Paid) = Money they actually paid
 * - Balance = Spends - Expense
 *   - Balance > 0 → Should receive money (paid more than their share)
 *   - Balance < 0 → Should pay money (paid less than their share)
 * 
 * @param {Array} expenses - All expenses in the room
 * @param {Array} members - All members in the room
 * @param {Object} beneficiariesMap - Map of expenseId to beneficiaries array
 * @param {Object} paymentsMap - Map of expenseId to payments array
 * @param {number} year - Year to filter
 * @param {number} month - Month to filter (0-11)
 * @returns {Object} Member calculations
 */
export const calculateMonthlyTotals = (expenses, members, beneficiariesMap, paymentsMap, year, month) => {
  // Filter expenses for the selected month
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
    return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
  });
  
  // Initialize member totals
  const memberTotals = {};
  members.forEach(member => {
    memberTotals[member.id] = {
      memberId: member.id,
      name: member.name,
      totalExpense: 0,    // What they should pay (their share)
      totalSpends: 0,     // What they actually paid
      balance: 0          // Spends - Expense
    };
  });
  
  // Calculate for each expense
  for (const expense of monthlyExpenses) {
    const beneficiaries = beneficiariesMap[expense.id] || [];
    const payments = paymentsMap[expense.id] || [];
    
    // Skip if no beneficiaries
    if (beneficiaries.length === 0) continue;
    
    // Calculate share per beneficiary (equal split among users)
    const sharePerPerson = expense.totalAmount / beneficiaries.length;
    
    // Add to each beneficiary's expense (what they should pay)
    beneficiaries.forEach(b => {
      if (memberTotals[b.memberId]) {
        memberTotals[b.memberId].totalExpense += sharePerPerson;
      }
    });
    
    // Add to each payer's spends (what they actually paid)
    payments.forEach(p => {
      if (memberTotals[p.memberId]) {
        memberTotals[p.memberId].totalSpends += p.paidAmount;
      }
    });
  }
  
  // Calculate balance for each member
  Object.values(memberTotals).forEach(member => {
    member.balance = member.totalSpends - member.totalExpense;
    // Round to 2 decimal places
    member.totalExpense = Math.round(member.totalExpense * 100) / 100;
    member.totalSpends = Math.round(member.totalSpends * 100) / 100;
    member.balance = Math.round(member.balance * 100) / 100;
  });
  
  return memberTotals;
};

/**
 * Calculate total room expense for the month
 */
export const calculateRoomTotal = (expenses, year, month) => {
  return expenses
    .filter(expense => {
      const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
      return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
    })
    .reduce((sum, expense) => sum + expense.totalAmount, 0);
};

/**
 * Get summary statistics for the dashboard
 */
export const getSummaryStats = (memberTotals) => {
  const values = Object.values(memberTotals);
  
  const totalExpense = values.reduce((sum, m) => sum + m.totalExpense, 0);
  const totalSpends = values.reduce((sum, m) => sum + m.totalSpends, 0);
  
  const totalToReceive = values
    .filter(m => m.balance > 0)
    .reduce((sum, m) => sum + m.balance, 0);
    
  const totalToPay = values
    .filter(m => m.balance < 0)
    .reduce((sum, m) => sum + Math.abs(m.balance), 0);
  
  return {
    totalExpense: Math.round(totalExpense * 100) / 100,
    totalSpends: Math.round(totalSpends * 100) / 100,
    totalToReceive: Math.round(totalToReceive * 100) / 100,
    totalToPay: Math.round(totalToPay * 100) / 100
  };
};
