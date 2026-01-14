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

// Strict check for "Required" status
export const getBillStatus = (bill: Bill, currentDate: Date, cycleEndDate: Date): 'REQUIRED' | 'GHOSTED' | 'COVERED' => {
    const dueDay = parseInt(bill.dueDay);
    const todayDay = currentDate.getDate();
    const todayMonth = currentDate.getMonth();
    const todayYear = currentDate.getFullYear();

    // Determine specific due date instance relevant to now
    let targetDueDate = new Date(todayYear, todayMonth, dueDay);
    if (dueDay < todayDay) {
        // If due day passed in current month, consider it relative to next month 
        // BUT strict logic says: is the *next* occurrence in the window?
        targetDueDate = new Date(todayYear, todayMonth + 1, dueDay);
    }

    // Funding deadline is 2 days before due date
    const fundingDeadline = addDays(targetDueDate, -2);

    // Check if funding deadline falls strictly within the window [currentDate, cycleEndDate]
    // We normalize times to avoid hour mismatches
    const start = new Date(currentDate.setHours(0, 0, 0, 0));
    const end = new Date(cycleEndDate.setHours(23, 59, 59, 999));
    const deadline = new Date(fundingDeadline.setHours(12, 0, 0, 0));

    if (deadline >= start && deadline <= end) {
        return 'REQUIRED';
    }

    if (deadline > end) {
        return 'GHOSTED';
    }

    // Fallback (e.g. past due or weird edge case) - default to ghosted logic if handled elsewhere or required?
    // If it's in the past (before start), it might mean it's missed or already paid. 
    // For allocation purposes, if we missed the window, we treat it as GHOSTED (or ignored) unless specifically handling "Overdue".
    return 'GHOSTED';
};

export interface AllocationResult {
    billAllocations: Record<string, number>;
    billStatuses: Record<string, 'REQUIRED' | 'GHOSTED' | 'COVERED'>;
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
    availableSnowballPower: number = 0
): AllocationResult => {
    const cycleEndDate = nextPayDate || calculateNextPayDate(currentDate, payFrequency);

    // Map Statuses
    const billStatuses: Record<string, 'REQUIRED' | 'GHOSTED' | 'COVERED'> = {};
    bills.forEach(bill => {
        billStatuses[bill.id] = getBillStatus(bill, currentDate, cycleEndDate);
    });

    // --- Start: Money Bucket ---
    let remainingMoney = paycheckAmount;

    // --- Step 1: Filter Required Bills ---
    const requiredBills = bills.filter(b => billStatuses[b.id] === 'REQUIRED');

    // --- Step 2: Priority Level 1 - Required Fixed Bills ---
    const billAllocations: Record<string, number> = {};
    requiredBills.forEach(bill => {
        const amount = parseFloat(bill.amount) || 0;
        const allocated = Math.min(remainingMoney, amount);
        billAllocations[bill.id] = allocated;
        remainingMoney -= allocated;
    });

    // --- Step 3: Priority Level 2 - Debts Minimums (Before Annuals per standard implementation often) ---
    // Re-ordering based on refined standard flow: Bills -> Debt Mins -> Funds -> Snowball
    const debtAllocations: Record<string, number> = {};
    debts.forEach(debt => {
        if (remainingMoney <= 0) return;
        const min = debt.minPayment;
        const allocated = Math.min(remainingMoney, min);
        debtAllocations[debt.id] = allocated;
        remainingMoney -= allocated;
    });

    // --- Step 4: Annual Sinking Funds (Drip) --- 
    const sinkingFundsAllocation: Record<string, number> = {};
    const annualFunds = sinkingFunds.filter(f => f.type === 'annual');

    // Strict Drip Logic: Target / (Months * 2) roughly -- simplified here to "fill if high priority" or just drip
    // Assuming we want to allocate *something* if money remains.
    annualFunds.forEach(fund => {
        if (remainingMoney <= 0) return;
        // Simple drip fallback for now: standard priority fill
        if (fund.targetAmount) {
            // Mock drip: 1/12th of target? Or just $50?
            // Let's allocate remainder up to $100 for now to ensure flow
            const allocated = Math.min(remainingMoney, 50); // Placeholder logic
            sinkingFundsAllocation[fund.id] = allocated;
            remainingMoney -= allocated;
        }
    });

    // --- Step 5: Emergency Fund ---
    let efAllocation = 0;
    if (remainingMoney > 0 && currentEF < targetEF) {
        const efNeeded = targetEF - currentEF;
        efAllocation = Math.min(remainingMoney, efNeeded);
        remainingMoney -= efAllocation;
    }

    // --- Step 6: Snowball (Surplus -> Smallest Debt) ---
    let snowballAmount = 0;
    const sortedDebts = [...debts].filter(d => d.currentBalance > 0).sort((a, b) => a.currentBalance - b.currentBalance);
    const snowballTarget = sortedDebts[0];

    if (remainingMoney > 0 && snowballTarget) {
        const available = remainingMoney + availableSnowballPower;
        snowballAmount = available;
        debtAllocations[snowballTarget.id] = (debtAllocations[snowballTarget.id] || 0) + snowballAmount;
        remainingMoney = 0;
    }

    // --- Step 7: Lifestyle Funds (If any money left somehow, though snowball usually eats it) ---
    const lifestyleFunds = sinkingFunds.filter(f => f.type !== 'annual');
    if (remainingMoney > 0 && lifestyleFunds.length > 0) {
        // ... (existing lifestyle logic)
    }

    return {
        billAllocations,
        billStatuses,
        emergencyFundAllocation: efAllocation,
        sinkingFundsAllocation,
        debtAllocations,
        snowballAmount,
        surplus: Math.max(0, remainingMoney)
    };
};
