import { useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useStore, Bill, SinkingFund, Debt } from '../store';

/**
 * Centralized hook to sync all user data from Firestore to the global Store.
 * This should be mounted ONCE in the main Layout to ensure data is fresh
 * without causing redundant network requests across components.
 */
export const useDataSync = () => {
    const { user } = useAuth();
    const { setBills, setSinkingFunds, setDebts } = useStore();

    useEffect(() => {
        if (!user) {
            setBills([]);
            setSinkingFunds([]);
            setDebts([]);
            return;
        }

        // Refs
        const billsRef = collection(db, 'users', user.uid, 'bills');
        const fundsRef = collection(db, 'users', user.uid, 'sinkingFunds');
        const debtsRef = collection(db, 'users', user.uid, 'debts');

        // Listeners
        const unsubBills = onSnapshot(query(billsRef), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
            setBills(data);
        }, (error) => {
            console.error("Error syncing bills:", error);
        });

        const unsubFunds = onSnapshot(query(fundsRef), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SinkingFund));
            setSinkingFunds(data);
        }, (error) => {
            console.error("Error syncing funds:", error);
        });

        const unsubDebts = onSnapshot(query(debtsRef), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt));
            setDebts(data);
        }, (error) => {
            console.error("Error syncing debts:", error);
        });

        return () => {
            unsubBills();
            unsubFunds();
            unsubDebts();
        };
    }, [user, setBills, setSinkingFunds, setDebts]);
};
