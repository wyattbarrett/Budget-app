import { db } from '../../lib/firebase';
import { runTransaction, doc, collection, Timestamp } from 'firebase/firestore';
import { Bill, SinkingFund } from '../../store';

export const transferFunds = async (
    userId: string,
    sourceFund: SinkingFund,
    targetBill: Bill,
    amount: number
): Promise<void> => {
    if (amount <= 0) throw new Error("Transfer amount must be positive");

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Read fresh data for source fund to ensure balance
            const fundRef = doc(db, 'users', userId, 'sinkingFunds', sourceFund.id);
            const fundDoc = await transaction.get(fundRef);

            if (!fundDoc.exists()) {
                throw new Error("Source fund does not exist");
            }

            const currentFundBalance = fundDoc.data().currentAmount || 0;
            if (currentFundBalance < amount) {
                throw new Error("Insufficient funds");
            }

            // 2. Perform updates
            // Decrement Fund
            transaction.update(fundRef, {
                currentAmount: currentFundBalance - amount
            });

            // 3. Log Transactions
            const now = Timestamp.now();

            // Outgoing from Fund
            const txOutRef = doc(collection(db, 'users', userId, 'transactions'));
            transaction.set(txOutRef, {
                date: now,
                amount: -amount,
                type: 'reallocation_out',
                description: `Transferred to ${targetBill.name}`,
                relatedId: sourceFund.id,
                category: 'Reallocation'
            });

            // Incoming to Bill (Allocated)
            const txInRef = doc(collection(db, 'users', userId, 'transactions'));
            transaction.set(txInRef, {
                date: now,
                amount: amount,
                type: 'allocation_bill', // Treat as a manual allocation
                description: `Covered by ${sourceFund.name}`,
                relatedId: targetBill.id,
                category: 'Fixed Bills'
            });

            // Note: We are NOT updating a 'currentAllocated' on the bill itself in this MVP 
            // because allocations are calculated dynamically or just logged. 
            // In a real app, we might want to store 'paidSoFar' on the bill if we want the Dashboard to update instantly without re-reading all transactions.
            // For now, the Dashboard's "Allocated" view relies on `pendingAllocation` state which is transient.
            // To make this permanent on the Dashboard, we'd need to fetch "Total Allocated to Bill X this cycle".
            // optimization: Let's assume the Dashboard will show this manual allocation if we add it to a local state or refetch.
        });
    } catch (error) {
        console.error("Reallocation failed:", error);
        throw error;
    }
};
