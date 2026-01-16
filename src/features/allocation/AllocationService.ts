import { collection, doc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Bill, SinkingFund, Debt, PendingAllocation } from '../../store';

export const AllocationService = {
    commitAllocation: async (
        userId: string,
        pendingAllocation: PendingAllocation,
        bills: Bill[],
        sinkingFunds: SinkingFund[],
        debts: Debt[],
        settingsCurrentEF: number
    ) => {
        const batch = writeBatch(db);
        const now = Timestamp.now();

        // 1. Log Income Transaction
        const incomeRef = doc(collection(db, 'users', userId, 'transactions'));
        batch.set(incomeRef, {
            date: now,
            amount: pendingAllocation.totalIncome,
            type: 'income',
            description: 'Paycheck Income',
        });

        // 2. Log Bill Allocations & Update last_funded_date
        Object.entries(pendingAllocation.allocations).forEach(([billId, amount]) => {
            if (amount > 0) {
                const bill = bills.find(b => b.id === billId);
                const ref = doc(collection(db, 'users', userId, 'transactions'));
                batch.set(ref, {
                    date: now,
                    amount: amount,
                    type: 'allocation_bill',
                    description: `Allocated to ${bill?.name || 'Bill'}`,
                    relatedId: billId,
                    category: 'Fixed Bills'
                });

                if (bill) {
                    const billRef = doc(db, 'users', userId, 'bills', billId);
                    batch.set(billRef, { last_funded_date: now }, { merge: true });
                }
            }
        });

        // 3. Log Sinking Fund Allocations & Update Balances
        Object.entries(pendingAllocation.sinkingFundsAllocation).forEach(([fundId, amount]) => {
            if (amount > 0) {
                const fund = sinkingFunds.find(f => f.id === fundId);
                const ref = doc(collection(db, 'users', userId, 'transactions'));
                batch.set(ref, {
                    date: now,
                    amount: amount,
                    type: 'allocation_fund',
                    description: `Allocated to ${fund?.name || 'Fund'}`,
                    relatedId: fundId,
                    category: 'Sinking Funds'
                });

                const fundRef = doc(db, 'users', userId, 'sinkingFunds', fundId);
                const currentBalance = fund?.currentAmount || 0;
                batch.set(fundRef, { currentAmount: currentBalance + amount }, { merge: true });
            }
        });

        // 4. Log EF Allocation & Update Settings
        if (pendingAllocation.emergencyFundAllocation > 0) {
            const ref = doc(collection(db, 'users', userId, 'transactions'));
            batch.set(ref, {
                date: now,
                amount: pendingAllocation.emergencyFundAllocation,
                type: 'allocation_fund',
                description: 'Allocated to Emergency Fund',
                relatedId: 'emergency_fund',
                category: 'Savings'
            });

            const settingsRef = doc(db, 'users', userId, 'settings', 'general');
            batch.set(settingsRef, { currentEF: settingsCurrentEF + pendingAllocation.emergencyFundAllocation }, { merge: true });
        }

        // 5. Log Debt Allocations & Update Balances
        Object.entries(pendingAllocation.debtAllocations).forEach(([debtId, amount]) => {
            if (amount > 0) {
                const debt = debts.find(d => d.id === debtId);
                const ref = doc(collection(db, 'users', userId, 'transactions'));
                batch.set(ref, {
                    date: now,
                    amount: amount,
                    type: 'allocation_debt',
                    description: `Payment to ${debt?.name || 'Debt'}`,
                    relatedId: debtId,
                    category: 'Debt'
                });

                const debtRef = doc(db, 'users', userId, 'debts', debtId);
                const currentBalance = debt?.currentBalance || 0;
                const newBalance = Math.max(0, currentBalance - amount);
                batch.set(debtRef, { currentBalance: newBalance }, { merge: true });
            }
        });

        // 6. Log Paycheck Audit History
        const auditRef = doc(collection(db, 'users', userId, 'paycheck_history'));
        batch.set(auditRef, {
            id: auditRef.id,
            date: now,
            totalIncome: pendingAllocation.totalIncome,
            allocations: {
                bills: pendingAllocation.allocations,
                funds: pendingAllocation.sinkingFundsAllocation,
                debts: pendingAllocation.debtAllocations,
                emergencyFund: pendingAllocation.emergencyFundAllocation,
                snowball: pendingAllocation.snowballAmount
            }
        });

        await batch.commit();
    }
};
