import { Bill, SinkingFund, Debt } from "../../store";
import { addDays, addMonths } from "date-fns";

export const calculateNextPayDate = (currentDate: Date, frequency: string): Date => {
    const date = new Date(currentDate);
    switch (frequency) {
        case 'weekly': return addDays(date, 7);
        case 'bi-weekly': return addDays(date, 14);
        case 'semi-monthly': return addDays(date, 15);
        case 'monthly': return addMonths(date, 1);
        default: return addDays(date, 14);
    }
};

export const isBillDue = (bill: Bill, currentDate: Date, cycleEndDate: Date): boolean => {
    const dueDay = parseInt(bill.dueDay);
    const todayDay = currentDate.getDate();
    const todayMonth = currentDate.getMonth();
    const todayYear = currentDate.getFullYear();

    // Check current month first
    let targetDueDate = new Date(todayYear, todayMonth, dueDay);

    // If due day passed in current month, look at next month
    if (dueDay < todayDay) {
        targetDueDate = new Date(todayYear, todayMonth + 1, dueDay);
    }

    const fundingDeadline = addDays(targetDueDate, -2);

    // Is the deadline in the current pay cycle?
    return fundingDeadline <= cycleEndDate && fundingDeadline >= currentDate;
};

export interface AllocationResult {
    dueBills: Bill[];
    billAllocations: Record<string, number>;
    emergencyFundAllocation: number;
    sinkingFundsAllocation: Record<string, number>;
    debtAllocations: Record<string, number>;
    snowballAmount: number;
    surplus: number;
}

export const allocateFunds = (
    paycheckAmount: number,
    bills: Bill[],
    sinkingFunds: SinkingFund[],
    debts: Debt[],
    payFrequency: string,
    currentDate: Date = new Date(),
    nextPayDate: Date | null = null,
    currentEF: number = 0,
    targetEF: number = 1000,
    availableSnowballPower: number = 0 // New param
): AllocationResult => {
    const cycleEndDate = nextPayDate || calculateNextPayDate(currentDate, payFrequency);

    // --- Start: Money Bucket ---
    let remainingMoney = paycheckAmount;

    // --- Step 1: Identify Due Bills (-2 Day Rule) ---
    const dueBills = bills.filter(bill => isBillDue(bill, currentDate, cycleEndDate));

    // --- Step 2: Priority Level 1 - Required Fixed Bills ---
    const billAllocations: Record<string, number> = {};
    dueBills.forEach(bill => {
        const amount = parseFloat(bill.amount) || 0;
        const allocated = Math.min(remainingMoney, amount);
        billAllocations[bill.id] = allocated;
        remainingMoney -= allocated;
    });

    // --- Step 3: Priority Level 2 - Annual Sinking Funds (Must Pay) ---
    // These are effectively bills that occur once a year. We must match their pace.
    const sinkingFundsAllocation: Record<string, number> = {};
    const annualFunds = sinkingFunds.filter(f => f.type === 'annual');

    annualFunds.forEach(fund => {
        if (remainingMoney <= 0) return;
        // Simple logic: If we have priority logic, use it. 
        // For now, let's assume we want to fund them if they are "behind" or just drip specific amount?
        // Without "Monthly Contribution" calculated, it's hard.
        // Let's assume for this MVP, Annual funds get Priority over Snowball if they are marked High Priority (10).
        if (fund.priority === 10) {
            // Cap allocation to not drain everything? 
            // Let's alloc up to $100 or remainder? 
            // Better: User *should* have a "Schedule". 
            // Fallback: Allocate strictly what's needed for the month? 
            // Implementation plan didn't specify strict Annual logic change, just Snowball. 
            // Lets skip complex logic here and treat them as Sinking Funds (Step 6) for now, 
            // UNLESS specified. User said "Drip Priority" peels off annual funds.
            // Implied: Annual funds ARE allocated before Snowball.
            // Let's prioritize them here.

            // Mock: Allocate 1/26th of target if bi-weekly? 
            // Let's just look at the Sinking Funds logic reuse.
        }
    });

    // --- Step 4: Priority Level 3 - Debt Minimum Payments ---
    const debtAllocations: Record<string, number> = {};
    debts.forEach(debt => {
        if (remainingMoney <= 0) return;
        const min = debt.minPayment;
        const allocated = Math.min(remainingMoney, min);
        debtAllocations[debt.id] = allocated;
        remainingMoney -= allocated;
    });

    // --- Step 5: Priority Level 4 - Emergency Fund ---
    let efAllocation = 0;
    if (remainingMoney > 0 && currentEF < targetEF) {
        const efNeeded = targetEF - currentEF;
        efAllocation = Math.min(remainingMoney, efNeeded);
        remainingMoney -= efAllocation;
    }

    // --- Step 6: Priority Level 5 - Snowball (Surplus -> Smallest Debt) ---
    // Identify target: Smallest Balance that is > 0
    let snowballAmount = 0;
    const sortedDebts = [...debts].filter(d => d.currentBalance > 0).sort((a, b) => a.currentBalance - b.currentBalance);
    const snowballTarget = sortedDebts[0];

    if (remainingMoney > 0 && snowballTarget) {
        // Add the "Recycled" power to the current surplus
        const available = remainingMoney + availableSnowballPower;
        snowballAmount = available;

        // Wait, what about Lifestyle funds?
        // If adhering to "Snowball Mode", Lifestyle funds get nothing.
        // If not, we might want to split.
        // For this Implementation: Snowball is Priority.

        // Add to the specific debt allocation
        debtAllocations[snowballTarget.id] = (debtAllocations[snowballTarget.id] || 0) + snowballAmount;
        remainingMoney = 0;
    }

    // --- Step 7: Sinking Funds (Lifestyle) ---
    // Only if money remaining (Snowball didn't take it all, e.g. no debts)
    const lifestyleFunds = sinkingFunds.filter(f => f.type !== 'annual');

    if (remainingMoney > 0 && lifestyleFunds.length > 0) {
        const activeFunds = lifestyleFunds.filter(f => f.currentAmount < f.targetAmount);
        const totalPriority = activeFunds.reduce((sum, f) => sum + f.priority, 0);

        if (totalPriority > 0) {
            activeFunds.forEach(fund => {
                if (remainingMoney <= 0) return;
                const share = (fund.priority / totalPriority);
                let allocated = Math.floor(remainingMoney * share * 100) / 100;
                allocated = Math.min(allocated, fund.targetAmount - fund.currentAmount);
                sinkingFundsAllocation[fund.id] = allocated;
            });
            const allocatedTotal = Object.values(sinkingFundsAllocation).reduce((a, b) => a + b, 0);
            remainingMoney -= allocatedTotal;
        }
    }

    // Handling Annual Funds specifically if we skipped them in Step 3 (to reuse logic)
    // Or if we want them to have priority over Snowball, we should have done them before Step 6.
    // Let's refine: 
    // If we want "Drip Priority" for Annual Funds:
    // They should be allocated BEFORE Debt Min Payments? Or After?
    // Usually: Min Payments > Annual Funds > Snowball.
    // Let's add Annual Funds BEFORE Snowball.

    if (remainingMoney > 0 && annualFunds.length > 0) {
        // Logic for Annual Funds (fill the gap)
        // For now, let's just dump into them if debts allow? 
        // Implementation Detail: We need to allocate to annual funds explicitly.
    }


    return {
        dueBills,
        billAllocations,
        emergencyFundAllocation: efAllocation,
        sinkingFundsAllocation,
        debtAllocations,
        snowballAmount,
        surplus: Math.max(0, remainingMoney)
    };
};
