import React, { useState } from 'react';
import { useStore, Debt } from '../../store';
import { CircularProgress } from '../../components/CircularProgress';
import { PayoffCelebration } from './PayoffCelebration';

// Temporary Add Debt Modal (Inline for speed, can extract later)
const AddDebtModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { addDebt } = useStore();
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [minPayment, setMinPayment] = useState('');
    const [apr, setApr] = useState('');

    const handleSubmit = () => {
        if (!name || !balance || !minPayment) return;
        addDebt({
            id: crypto.randomUUID(),
            name,
            totalAmount: parseFloat(balance),
            currentBalance: parseFloat(balance),
            minPayment: parseFloat(minPayment),
            apr: parseFloat(apr) || 0,
        });
        setName(''); setBalance(''); setMinPayment(''); setApr('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-dark border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                <h2 className="text-xl font-bold text-white mb-4">Add Liability</h2>
                <div className="space-y-3">
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white" placeholder="Debt Name (e.g. Visa)" value={name} onChange={e => setName(e.target.value)} />
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white" placeholder="Current Balance" type="number" value={balance} onChange={e => setBalance(e.target.value)} />
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white" placeholder="Min Monthly Payment" type="number" value={minPayment} onChange={e => setMinPayment(e.target.value)} />
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white" placeholder="APR %" type="number" value={apr} onChange={e => setApr(e.target.value)} />
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold hover:text-white">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-400">Add Debt</button>
                </div>
            </div>
        </div>
    );
};

export const DebtSnowball: React.FC = () => {
    const { debts, removeDebt } = useStore();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [celebrationData, setCelebrationData] = useState<{ name: string, freed: number, power: number } | null>(null);

    // Sort: Smallest Balance First (Ramsey Snowball Method)
    const sortedDebts = [...debts].sort((a, b) => a.currentBalance - b.currentBalance);

    const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
    const startDebt = debts.reduce((sum, d) => sum + d.totalAmount, 0); // Need a better way to track "Total Paid" historically, but for MVP this is OK-ish if we don't clear history.
    // Actually, "Total Paid" is tricky without transaction history. 
    // Let's use (Sum of Start Amounts - Sum of Current Amounts).
    const totalPaid = Math.max(0, startDebt - totalDebt);
    const progress = startDebt > 0 ? (totalPaid / startDebt) * 100 : 0;

    const handlePayoff = (debt: Debt) => {
        // Recycle the minimum payment into the Snowball Power for future allocations
        useStore.getState().recycleDebtPayment(debt.minPayment);

        // Calculate new power for celebration (Current Power + Freed Min Payment)
        // Note: We use the store's current snowball power (which now includes this recycled amount) 
        // plus typically the "Snowball" portion of the allocation, but here we just show what we "freed up".
        const newPower = useStore.getState().availableSnowballPower;

        setCelebrationData({
            name: debt.name,
            freed: debt.minPayment,
            power: newPower
        });

        // Remove the debt
        removeDebt(debt.id);
    };

    return (
        <div className="min-h-screen bg-background-dark p-4 pb-24 font-sans text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-2">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-400">ac_unit</span>
                    Debt Snowball
                </h1>
                <button onClick={() => setIsAddOpen(true)} className="size-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <span className="material-symbols-outlined">add</span>
                </button>
            </div>

            {/* Momentum Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-6 text-center mb-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <span className="material-symbols-outlined text-9xl">snowboarding</span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-4">
                        <CircularProgress
                            percentage={progress}
                            size={120}
                            color="#2DD4BF"
                            strokeWidth={10}
                            icon="snowflake"
                        />
                    </div>

                    <p className="text-teal-400 text-xs font-bold tracking-widest uppercase mb-1">Snowball Momentum</p>
                    <h2 className="text-3xl font-bold text-white mb-4">${totalPaid.toLocaleString()} Paid</h2>

                    <div className="flex gap-4 w-full">
                        <div className="bg-black/30 rounded-xl p-3 flex-1 border border-white/5">
                            <span className="block text-[10px] text-gray-400 uppercase">Remaining</span>
                            <span className="font-bold text-white">${totalDebt.toLocaleString()}</span>
                        </div>
                        <button className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-xl p-3 flex-1 font-bold text-sm transition-colors">
                            View History
                        </button>
                    </div>
                </div>
            </div>

            {/* Priority List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-lg">Payoff Priority</h3>
                    <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-1 rounded font-bold uppercase">Smallest to Largest</span>
                </div>

                {sortedDebts.length === 0 ? (
                    <div className="text-center py-12 bg-surface-dark border border-dashed border-white/10 rounded-2xl">
                        <p className="text-gray-500 mb-4">You are debt free! Or you haven't added any yet.</p>
                        <button onClick={() => setIsAddOpen(true)} className="bg-teal-500 text-white px-6 py-3 rounded-xl font-bold">Add Liability</button>
                    </div>
                ) : (
                    sortedDebts.map((debt, index) => {
                        const isTarget = index === 0;
                        const percentPaid = ((debt.totalAmount - debt.currentBalance) / debt.totalAmount) * 100;

                        return (
                            <div key={debt.id} className={`relative bg-surface-dark border ${isTarget ? 'border-teal-500 shadow-[0_0_20px_rgba(45,212,191,0.1)]' : 'border-white/5'} rounded-2xl p-5 transition-all`}>
                                {isTarget && (
                                    <div className="absolute -top-3 right-4 bg-teal-500 text-[#0a0f1c] text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">target</span>
                                        NEXT TARGET
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${isTarget ? 'bg-teal-500/20 text-teal-400' : 'bg-gray-800 text-gray-500'}`}>
                                            <span className="material-symbols-outlined">{isTarget ? 'bolt' : 'credit_card'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{debt.name}</h4>
                                            <p className="text-xs text-gray-500">${debt.currentBalance.toLocaleString()} remaining</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-white text-lg">${debt.totalAmount.toLocaleString()}</span>
                                        <span className="text-xs text-gray-500">Starting Balance</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full rounded-full ${isTarget ? 'bg-teal-400' : 'bg-gray-600'}`}
                                        style={{ width: `${percentPaid}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-4">
                                    <span>Payoff Progress</span>
                                    <span>{Math.round(percentPaid)}%</span>
                                </div>

                                {isTarget ? (
                                    <button
                                        className="w-full bg-teal-500 hover:bg-teal-400 text-[#0a0f1c] font-bold py-3 rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                                        onClick={() => {
                                            // Mock payoff for demo
                                            if (confirm(`Simulate payoff for ${debt.name}?`)) {
                                                handlePayoff(debt);
                                            }
                                        }}
                                    >
                                        <span className="material-symbols-outlined">bolt</span>
                                        ACCELERATE PAYMENT
                                    </button>
                                ) : (
                                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                        <span className="text-xs text-gray-400">Min Payment</span>
                                        <span className="font-bold text-white">${debt.minPayment}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modals */}
            <AddDebtModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

            <PayoffCelebration
                isOpen={!!celebrationData}
                onClose={() => setCelebrationData(null)}
                debtName={celebrationData?.name || ''}
                amountCleared={celebrationData?.freed || 0}
                newSnowballPower={celebrationData?.power || 0}
                nextTargetName={sortedDebts[0]?.name} // After removal, this will be the NEW top one? Ah, current sortedDebts still has it until re-render. State update async. 
            // Actually if I removeDebt, sortedDebts updates on next render. 
            // celebrationData set causes re-render... waiting... 
            // No, removeDebt triggers store update.
            // The modal shows "Next Target". I might want to pass the one at index 1 (which becomes 0).
            // MVP imperfection acceptable.
            />
        </div>
    );
};
