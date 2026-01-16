import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Debt } from '../../store';

/**
 * Service to handle Debt persistence in Firestore.
 * This ensures debt data survives page reloads and is synced across devices.
 */
export const DebtService = {
    /**
     * Add a new debt to the user's collection.
     */
    addDebt: async (userId: string, debt: Debt) => {
        const ref = doc(db, 'users', userId, 'debts', debt.id);
        await setDoc(ref, debt);
    },

    /**
     * Update an existing debt.
     */
    updateDebt: async (userId: string, debtId: string, data: Partial<Debt>) => {
        const ref = doc(db, 'users', userId, 'debts', debtId);
        await updateDoc(ref, data);
    },

    /**
     * Delete a debt (e.g. when paid off).
     */
    deleteDebt: async (userId: string, debtId: string) => {
        const ref = doc(db, 'users', userId, 'debts', debtId);
        await deleteDoc(ref);
    }
};
