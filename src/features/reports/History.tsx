import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

interface PaycheckAudit {
    id: string;
    date: any; // Firestore Timestamp
    totalIncome: number;
    allocations: {
        bills: Record<string, number>;
        funds: Record<string, number>;
        debts: Record<string, number>;
        emergencyFund: number;
        snowball: number;
    };
}

export const History: React.FC = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<PaycheckAudit[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            try {
                const q = query(
                    collection(db, 'users', user.uid, 'paycheck_history'),
                    orderBy('date', 'desc'),
                    limit(20)
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaycheckAudit));
                setHistory(data);
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user]);

    if (loading) return <div className="p-6 text-center text-gray-500">Loading history...</div>;

    return (
        <div className="min-h-screen bg-background-dark p-4 pb-24 font-sans text-white">
            <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">history</span>
                Audit Log
            </h1>

            <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No paychecks recorded yet.</div>
                ) : (
                    history.map(item => {
                        const date = item.date?.toDate ? item.date.toDate() : new Date(item.date);
                        const isExpanded = expandedId === item.id;

                        // Calculate totals for summary
                        const billsTotal = Object.values(item.allocations.bills || {}).reduce((a, b) => a + b, 0);
                        const fundsTotal = Object.values(item.allocations.funds || {}).reduce((a, b) => a + b, 0);
                        const debtsTotal = Object.values(item.allocations.debts || {}).reduce((a, b) => a + b, 0);
                        const efTotal = item.allocations.emergencyFund || 0;
                        const snowballTotal = item.allocations.snowball || 0;

                        return (
                            <div key={item.id} className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                                <div
                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">payments</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">${item.totalIncome.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">{format(date, 'MMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-500">
                                        {isExpanded ? 'expand_less' : 'expand_more'}
                                    </span>
                                </div>

                                {isExpanded && (
                                    <div className="bg-black/20 p-4 border-t border-white/5 text-sm space-y-2 animate-in slide-in-from-top-2">
                                        <div className="flex justify-between text-gray-300">
                                            <span>Fixed Bills</span>
                                            <span className="font-mono text-white">${billsTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300">
                                            <span>Debt Minimums</span>
                                            <span className="font-mono text-white">${debtsTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300">
                                            <span>Sinking Funds</span>
                                            <span className="font-mono text-white">${fundsTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300">
                                            <span>Emergency Fund</span>
                                            <span className="font-mono text-white">${efTotal.toFixed(2)}</span>
                                        </div>
                                        {snowballTotal > 0 && (
                                            <div className="flex justify-between text-primary font-bold bg-primary/10 p-2 rounded-lg mt-2">
                                                <span>Snowball Power</span>
                                                <span className="font-mono">${snowballTotal.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="pt-2 text-[10px] text-gray-600 font-mono text-center uppercase tracking-widest">
                                            ID: {item.id}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
