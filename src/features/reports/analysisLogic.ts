import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { SinkingFund } from '../../store';

export interface MonthlyAnalysis {
    month: string;
    accuracyScore: number;
    reallocations: ReallocationEvent[];
    suggestions: CalibrationSuggestion[];
}

export interface ReallocationEvent {
    id: string;
    sourceName: string;
    targetName: string;
    amount: number;
    reason?: string;
}

export interface CalibrationSuggestion {
    id: string;
    fundName: string;
    type: 'increase' | 'decrease';
    amount: number;
    reason: string;
}

export const analyzeMonth = async (
    userId: string,
    date: Date,
    funds: SinkingFund[]
): Promise<MonthlyAnalysis> => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const txRef = collection(db, 'users', userId, 'transactions');
    const q = query(
        txRef,
        where('date', '>=', Timestamp.fromDate(startOfMonth)),
        where('date', '<=', Timestamp.fromDate(endOfMonth))
    );

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    // 1. Identify Reallocations
    // We look for 'reallocation_out' transactions
    const reallocations: ReallocationEvent[] = transactions
        .filter(tx => tx.type === 'reallocation_out')
        .map(tx => {
            const fund = funds.find(f => f.id === tx.relatedId);
            // We need to find the matching 'reallocation_in' (allocation_bill) to know the target
            // Simplification: In a real app we'd link them via a correlation ID. 
            // Here we'll guess or parse description "Transferred to [Target Name]"
            const targetName = tx.description.replace('Transferred to ', '');

            return {
                id: tx.id,
                sourceName: fund?.name || 'Unknown Fund',
                targetName: targetName,
                amount: Math.abs(tx.amount)
            };
        })
        .sort((a, b) => b.amount - a.amount) // Highest first
        .slice(0, 3); // Top 3

    // 2. Calculate Accuracy
    // Score starts at 100.
    // Penalty: -5 points for every reallocation event (showing a miss in planning).
    // Penalty: -1 point for every $10 overspent (reallocated).
    // Min score 0.
    const totalReallocatedAmount = reallocations.reduce((sum, r) => sum + r.amount, 0);
    const eventPenalty = reallocations.length * 5;
    const amountPenalty = Math.floor(totalReallocatedAmount / 10);

    let accuracyScore = 100 - eventPenalty - amountPenalty;
    accuracyScore = Math.max(0, accuracyScore);


    // 3. Generate Suggestions (Calibration)
    // Simple Heuristics for MVP:
    // - If we reallocated FROM a fund more than once, maybe it's "Underutilized"? 
    //   (Actually usually that means we robbed it, so it might be "Over-budgeted" effectively if we view it as a slush fund. 
    //   BUT in this logic: If we take money OUT, we had "extra" there? Or we penalized that goal.
    //   Let's stick to the Design Screenshot logic:
    //   "Entertainment: Underutilized (-15% spend)" -> suggest reducing.
    //   "Groceries: Consistently tight (+5% spend)" -> suggest adding.

    const suggestions: CalibrationSuggestion[] = [];

    // Mock logic based on design for demo purposes since we don't have months of history
    // In real app: Compare 'spent' vs 'target' averaged over 3 months.

    // Check for "Source" funds in reallocations (The ones we took money FROM)
    // If we took money FROM Dining Out, maybe we allocated too much there? Or just prioritized it lower.
    // Let's suggest reducing the top source.
    if (reallocations.length > 0) {
        const topSource = reallocations[0];
        suggestions.push({
            id: 'sugg_1',
            fundName: topSource.sourceName,
            type: 'decrease',
            amount: 20, // Mock increment
            reason: 'Leftover budget moved often'
        });
    }

    // Identify tightness? 
    // If a Bill required reallocation TO it, it was "Tight".
    // We don't have a "Bill" object for the suggestion UI in the design (it shows Groceries/Entertainment which are funds).
    // Let's find a Fund that had expenses close to its balance?
    // For MVP, if we have a fund with low balance (< 10% of target) but no reallocations, maybe it's tight.

    const tightFund = funds.find(f => f.currentAmount < (f.targetAmount * 0.1) && f.targetAmount > 0);
    if (tightFund) {
        suggestions.push({
            id: 'sugg_2',
            fundName: tightFund.name,
            type: 'increase',
            amount: 50,
            reason: 'Consistently tight budget'
        });
    }

    return {
        month: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
        accuracyScore,
        reallocations,
        suggestions
    };
};
