import { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useStore, Bill, SinkingFund } from '../../store';

export const useBudget = () => {
    const { user } = useAuth();
    const { setBills, setSinkingFunds } = useStore();
    const [loading, setLoading] = useState(true);

    // Sync Bills and Funds
    useEffect(() => {
        if (!user) {
            setBills([]);
            setSinkingFunds([]);
            setLoading(false);
            return;
        }

        const billsRef = collection(db, 'users', user.uid, 'bills');
        const fundsRef = collection(db, 'users', user.uid, 'sinkingFunds');

        const unsubBills = onSnapshot(billsRef, (snapshot) => {
            const billsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
            setBills(billsData);
        });

        const unsubFunds = onSnapshot(fundsRef, (snapshot) => {
            const fundsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SinkingFund));
            setSinkingFunds(fundsData);
            setLoading(false);
        });

        return () => {
            unsubBills();
            unsubFunds();
        };
    }, [user, setBills, setSinkingFunds]);

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
