import React, { useState } from 'react';
import { useStore, Debt } from '../../store';
import { CircularProgress } from '../../components/CircularProgress';
import { PayoffCelebration } from './PayoffCelebration';
import { AddDebtModal } from './AddDebtModal';
import { DebtService } from './DebtService';
import { useAuth } from '../../context/AuthContext';

/**
 * The Debt Snowball component.
 * Visualizes debt payoff progress using the Ramsey Snowball Method (smallest balance first).
 * Includes celebration mechanics and momentum tracking.
 *
 * @returns {JSX.Element} The rendered DebtSnowball component
 */
export const DebtSnowball: React.FC = () => {
    const { user } = useAuth();
    const { debts } = useStore();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [celebrationData, setCelebrationData] = useState<{ name: string, freed: number, power: number } | null>(null);

    // Sort by smallest balance first (Ramsey Snowball Method)
    const sortedDebts = [...debts].sort((a, b) => a.currentBalance - b.currentBalance);

    const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);

    // MVP: Estimate "Total Paid" by comparing initial amounts to current amounts.
    // TODO: Implement transaction history for precise tracking.
    const startDebt = debts.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalPaid = Math.max(0, startDebt - totalDebt);
    const progress = startDebt > 0 ? (totalPaid / startDebt) * 100 : 0;

    const handlePayoff = async (debt: Debt) => {
        if (!user) return; // Guard

        // Recycle the minimum payment into the Snowball Power for future allocations
        useStore.getState().recycleDebtPayment(debt.minPayment);

        // Calculate new power for celebration (Current Power + Freed Min Payment)
        const newPower = useStore.getState().availableSnowballPower;

        setCelebrationData({
            name: debt.name,
            freed: debt.minPayment,
            power: newPower
        });

        // Remove the debt from Cloud
        await DebtService.deleteDebt(user.uid, debt.id);
    };

    return (
        <div className="min-h-full bg-background-dark p-4 md:p-8 font-sans text-white">
            <div className="max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <span className="material-symbols-outlined text-teal-400 text-4xl">ac_unit</span>
                        Debt Snowball
                    </h1>
                    <button onClick={() => setIsAddOpen(true)} className="size-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center hover:bg-teal-500/30 transition-colors">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>

                {/* Momentum Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-8 text-center mb-10 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <span className="material-symbols-outlined text-9xl">snowboarding</span>
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="mb-6">
                            <CircularProgress
                                percentage={progress}
                                size={140}
                                color="#2DD4BF"
                                strokeWidth={12}
                                icon="snowflake"
                            />
                        </div>

                        <p className="text-teal-400 text-sm font-bold tracking-widest uppercase mb-2">Snowball Momentum</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">${totalPaid.toLocaleString()} Paid</h2>

                        <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                            <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                                <span className="block text-xs text-gray-400 uppercase mb-1">Remaining Balance</span>
                                <span className="font-bold text-2xl text-white">${totalDebt.toLocaleString()}</span>
                            </div>
                            <button className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-2xl p-4 font-bold text-sm transition-all flex items-center justify-center gap-2 group">
                                View History
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Priority List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-xl">Payoff Priority</h3>
                        <span className="text-xs text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wide">Smallest to Largest</span>
                    </div>

                    {sortedDebts.length === 0 ? (
                        <div className="text-center py-20 bg-surface-dark border border-dashed border-white/10 rounded-3xl">
                            <div className="size-20 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-gray-500 text-4xl">celebration</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Debt Free!</h3>
                            <p className="text-gray-400 mb-6 max-w-sm mx-auto">You are debt free! Or you haven't added any yet.</p>
                            <button onClick={() => setIsAddOpen(true)} className="bg-teal-500 hover:bg-teal-400 text-[#0a0f1c] px-6 py-3 rounded-xl font-bold transition-colors">Add Liability</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {sortedDebts.map((debt, index) => {
                                const isTarget = index === 0;
                                const percentPaid = ((debt.totalAmount - debt.currentBalance) / debt.totalAmount) * 100;

                                return (
                                    <div key={debt.id} className={`relative bg-surface-dark border ${isTarget ? 'border-teal-500 shadow-[0_0_30px_rgba(45,212,191,0.1)]' : 'border-white/5'} rounded-2xl p-6 transition-all hover:bg-surface-dark/80`}>
                                        {isTarget && (
                                            <div className="absolute -top-3 right-6 bg-teal-500 text-[#0a0f1c] text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                                                <span className="material-symbols-outlined text-sm">target</span>
                                                NEXT TARGET
                                            </div>
                                        )}

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            {/* Info */}
                                            <div className="flex items-center gap-5 flex-1">
                                                <div className={`size-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${isTarget ? 'bg-teal-500/20 text-teal-400' : 'bg-black/40 text-gray-600'}`}>
                                                    <span className="material-symbols-outlined">{isTarget ? 'bolt' : 'credit_card'}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-xl">{debt.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-sm text-gray-400">${debt.currentBalance.toLocaleString()} remaining</span>
                                                        <span className="text-gray-600">•</span>
                                                        <span className="text-sm text-gray-500">{debt.apr}% APR</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress */}
                                            <div className="flex-1 md:max-w-md">
                                                <div className="flex justify-between text-xs text-gray-400 mb-2">
                                                    <span className="font-medium uppercase tracking-wider">Progress</span>
                                                    <span className="font-bold text-white">{Math.round(percentPaid)}%</span>
                                                </div>
                                                <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${isTarget ? 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-gray-700'}`}
                                                        style={{ width: `${percentPaid}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="md:w-48 text-right">
                                                {isTarget ? (
                                                    <button
                                                        className="w-full bg-teal-500 hover:bg-teal-400 text-[#0a0f1c] font-bold py-3 rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                                                        onClick={() => {
                                                            if (confirm(`Simulate payoff for ${debt.name}?`)) {
                                                                handlePayoff(debt);
                                                            }
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined">bolt</span>
                                                        Pay Off
                                                    </button>
                                                ) : (
                                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Min Payment</p>
                                                        <p className="font-mono text-lg font-bold text-white">${debt.minPayment}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                    nextTargetName={sortedDebts[0]?.name}
                />
            </div>
        </div>
    );
};
