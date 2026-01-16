import { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Bill, SinkingFund } from '../../store';

export const useBudget = () => {
    const { user } = useAuth();
    // Loading is now handled globally or via async action state if needed.
    // We can return a static false or remove it. For now, let's keep the signature compatible.
    const [loading] = useState(false);

    // Sync handled by Global useDataSync in Layout.tsx
    // We only expose actions here.

    // Actions
    const addNewBill = async (bill: Omit<Bill, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'bills'), bill);
    };

    const deleteBill = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'bills', id));
    };

    const addNewFund = async (fund: Omit<SinkingFund, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'sinkingFunds'), fund);
    };

    const deleteFund = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'sinkingFunds', id));
    };

    // Helper to update fund balance (used in allocation)
    const updateFundBalance = async (id: string, newAmount: number) => {
        if (!user) return;
        await updateDoc(doc(db, 'users', user.uid, 'sinkingFunds', id), {
            currentAmount: newAmount
        });
    }

    return {
        loading,
        addNewBill,
        deleteBill,
        addNewFund,
        deleteFund,
        updateFundBalance
    };
};
