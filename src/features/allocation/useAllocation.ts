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
            isConfirmed: false
        });
    };

    const confirmAllocation = async () => {
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

            // 2. Log Bill Allocations
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

                // We'll update the store locally, but we should also persist to settings in Firestore
                // Note: Settings sync is handled separately but for consistency:
                const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
                batch.update(settingsRef, { currentEF: settings.currentEF + pendingAllocation.emergencyFundAllocation });
            }

            // 5. Log Debt Allocations & Update Balances (CRITICAL FIX)
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
                    // Ensure we don't go below zero (optional but good sanity check)
                    const newBalance = Math.max(0, currentBalance - amount);
                    batch.update(debtRef, { currentBalance: newBalance });
                }
            });


            // 5. Log Paycheck Audit History
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
        confirmAllocation,
        isConfirming
    };
};
