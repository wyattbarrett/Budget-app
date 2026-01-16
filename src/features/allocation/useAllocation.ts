import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../store';
import { AllocationService } from './AllocationService';
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
            await AllocationService.commitAllocation(
                user.uid,
                pendingAllocation,
                bills,
                sinkingFunds,
                debts,
                settings.currentEF
            );

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
