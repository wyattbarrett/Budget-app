import { db } from '../../lib/firebase';
import { runTransaction, doc, collection, Timestamp } from 'firebase/firestore';

export const logExpense = async (
    userId: string,
    fundId: string,
    amount: number,
    memo: string,
    date: Date
): Promise<void> => {
    if (amount <= 0) throw new Error("Expense amount must be positive");

    try {
        await runTransaction(db, async (transaction) => {
            const fundRef = doc(db, 'users', userId, 'sinkingFunds', fundId);
            const fundDoc = await transaction.get(fundRef);

            if (!fundDoc.exists()) {
                throw new Error("Sinking Fund does not exist");
            }

            const currentBalance = fundDoc.data().currentAmount || 0;
            // distinct from reallocation: we allow expenses to go negative (overspending) locally, 
            // or we enforce 0? The design shows "New Balance -$40.00", so we allow negative.

            // 1. Log Transaction
            const txRef = doc(collection(db, 'users', userId, 'transactions'));
            transaction.set(txRef, {
                date: Timestamp.fromDate(date),
                amount: -amount, // Expense is negative
                type: 'expense',
                description: memo || 'Expense',
                relatedId: fundId,
                category: fundDoc.data().name || 'Sinking Fund'
            });

            // 2. Update Fund Balance
            transaction.update(fundRef, {
                currentAmount: currentBalance - amount
            });
        });
    } catch (error) {
        console.error("Failed to log expense:", error);
        throw error;
    }
};
