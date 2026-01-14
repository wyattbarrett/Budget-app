import { useState } from 'react';
import { collection, doc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../store';
import { allocateFunds } from './allocationLogic';

export const useAllocation = () => {
    const { user } = useAuth();
    const { settings, bills, sinkingFunds, debts, setPendingAllocation, pendingAllocation, availableSnowballPower } = useStore();
    const [paycheckAmount, setPaycheckAmount] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);

    const runAllocation = () => {
        // ... (existing runAllocation code)
        const amount = parseFloat(paycheckAmount);
        // Security Hardening: strict input validation
        if (isNaN(amount) || amount <= 0 || amount > 1000000) {
            console.error("Invalid paycheck amount");
            return;
        }

        const result = allocateFunds(
            amount,
            bills,
            sinkingFunds,
            debts,
            settings.payFrequency,
            new Date(),
            settings.nextPayDate ? new Date(settings.nextPayDate) : null,
            settings.currentEF,
            settings.starterEFGoal,
            availableSnowballPower
        );

        setPendingAllocation({
            totalIncome: amount,
            allocations: result.billAllocations,
            emergencyFundAllocation: result.emergencyFundAllocation,
            sinkingFundsAllocation: result.sinkingFundsAllocation,
            debtAllocations: result.debtAllocations,
            snowballAmount: result.snowballAmount,
            // Pass statuses through via extended type or just use standard store mechanism? 
            // Ideally PendingAllocation should track this. Use 'allocations' for amounts. 
            // We'll store statuses in a separate ephemeral state or just recalculated in logic?
            // For now, let's attach it to 'allocations' metadata if possible, but store type is strict.
            // Simpler: Just rely on dashboard re-calculating status since it uses the same logic?
            // User requirement: "If (Bill.due_date - 2) falls inside that window... set status: 'REQUIRED'".
            // We just added `billStatuses` to result. Ideally update Store types, but to avoid store refactoring:
            // The Dashboard consumes `pendingAllocation` amounts. 
            // We can re-run `getBillStatus` in dashboard UI for visual purposes.
            isConfirmed: false
        });
    };

    const commitAllocation = async () => {
        if (!user || !pendingAllocation) return;
        setIsConfirming(true);

        try {
            const batch = writeBatch(db);
            const now = Timestamp.now();

            // 1. Log Income Transaction
            const incomeRef = doc(collection(db, 'users', user.uid, 'transactions'));
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
                    const ref = doc(collection(db, 'users', user.uid, 'transactions'));
                    batch.set(ref, {
                        date: now,
                        amount: amount,
                        type: 'allocation_bill',
                        description: `Allocated to ${bill?.name || 'Bill'}`,
                        relatedId: billId,
                        category: 'Fixed Bills'
                    });

                    // Update Bill last_funded_date
                    if (bill) {
                        const billRef = doc(db, 'users', user.uid, 'bills', billId);
                        batch.update(billRef, {
                            last_funded_date: now
                        });
                    }
                }
            });

            // 3. Log Sinking Fund Allocations & Update Balances
            Object.entries(pendingAllocation.sinkingFundsAllocation).forEach(([fundId, amount]) => {
                if (amount > 0) {
                    const fund = sinkingFunds.find(f => f.id === fundId);
                    const ref = doc(collection(db, 'users', user.uid, 'transactions'));
                    batch.set(ref, {
                        date: now,
                        amount: amount,
                        type: 'allocation_fund',
                        description: `Allocated to ${fund?.name || 'Fund'}`,
                        relatedId: fundId,
                        category: 'Sinking Funds'
                    });

                    // Update Fund Balance
                    const fundRef = doc(db, 'users', user.uid, 'sinkingFunds', fundId);
                    const currentBalance = fund?.currentAmount || 0;
                    batch.update(fundRef, { currentAmount: currentBalance + amount });
                }
            });

            // 4. Log EF Allocation & Update Settings
            if (pendingAllocation.emergencyFundAllocation > 0) {
                const ref = doc(collection(db, 'users', user.uid, 'transactions'));
                batch.set(ref, {
                    date: now,
                    amount: pendingAllocation.emergencyFundAllocation,
                    type: 'allocation_fund',
                    description: 'Allocated to Emergency Fund',
                    relatedId: 'emergency_fund',
                    category: 'Savings'
                });

                const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
                batch.update(settingsRef, { currentEF: settings.currentEF + pendingAllocation.emergencyFundAllocation });
            }

            // 5. Log Debt Allocations & Update Balances
            Object.entries(pendingAllocation.debtAllocations).forEach(([debtId, amount]) => {
                if (amount > 0) {
                    const debt = debts.find(d => d.id === debtId);
                    const ref = doc(collection(db, 'users', user.uid, 'transactions'));
                    batch.set(ref, {
                        date: now,
                        amount: amount,
                        type: 'allocation_debt',
                        description: `Payment to ${debt?.name || 'Debt'}`,
                        relatedId: debtId,
                        category: 'Debt'
                    });

                    // Update Debt Balance
                    const debtRef = doc(db, 'users', user.uid, 'debts', debtId);
                    const currentBalance = debt?.currentBalance || 0;
                    const newBalance = Math.max(0, currentBalance - amount);
                    batch.update(debtRef, { currentBalance: newBalance });
                }
            });


            // 6. Log Paycheck Audit History (Snapshot)
            const auditRef = doc(collection(db, 'users', user.uid, 'paycheck_history'));
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
            setPendingAllocation(null);
            setPaycheckAmount('');
            setIsConfirming(false);

        } catch (error) {
            console.error("Error confirming allocation:", error);
            setIsConfirming(false);
        }
    };

    return {
        paycheckAmount,
        setPaycheckAmount,
        runAllocation,
        commitAllocation, // Renamed from confirmAllocation
        isConfirming
    };
};
