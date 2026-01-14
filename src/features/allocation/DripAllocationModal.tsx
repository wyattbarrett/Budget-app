import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { differenceInMonths } from 'date-fns';

interface DripAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    incomeAmount: number;
}

export const DripAllocationModal: React.FC<DripAllocationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    incomeAmount
}) => {
    const { sinkingFunds } = useStore();

    // 1. Identify Annual Funds & Calculate Drip
    const { annualFunds, totalDrip, drips } = useMemo(() => {
        const annuals = sinkingFunds.filter(f => f.type === 'annual');
        let total = 0;
        const dripMap = new Map<string, number>();

        annuals.forEach(fund => {
            // Re-calc drip logic (centralize this in a helper later)
            if (fund.targetAmount && fund.dueDate) {
                const months = Math.max(1, differenceInMonths(new Date(fund.dueDate), new Date()));
                const paychecks = months * 2;
                const drip = fund.targetAmount / paychecks;
                dripMap.set(fund.id, drip);
                total += drip;
            }
        });

        return { annualFunds: annuals, totalDrip: total, drips: dripMap };
    }, [sinkingFunds]);


    const remainingForFlexible = incomeAmount - totalDrip;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <button onClick={onClose} className="p-2 text-gray-400">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <button className="p-2 text-gray-400">
                    <span className="material-symbols-outlined">more_horiz</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Inflow Header */}
                <div className="text-center mb-8">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">INFLOW</span>
                    <h2 className="text-4xl font-display font-bold text-white my-2">${incomeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                        <span className="material-symbols-outlined text-gray-400 text-sm">calendar_today</span>
                        <span className="text-xs text-gray-400">Paycheck #2: Oct 15</span>
                    </div>
                </div>

                {/* Reserved Section (Drip) */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <span className="material-symbols-outlined text-sm">lock</span>
                        </div>
                        <h3 className="font-bold text-white text-sm">Reserved for Goals</h3>
                        <span className="ml-auto text-[10px] font-bold bg-emerald-500 text-black px-2 py-0.5 rounded uppercase">Auto-Drip</span>
                    </div>

                    <div className="space-y-3">
                        {annualFunds.length === 0 ? (
                            <p className="text-center text-gray-500 text-xs py-2">No annual bills configured.</p>
                        ) : (
                            annualFunds.map(fund => (
                                <div key={fund.id} className="bg-surface-dark border border-white/5 rounded-xl p-3 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-surface-highlight/50 flex items-center justify-center text-gray-300">
                                            <span className="material-symbols-outlined">{fund.icon || 'verified_user'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{fund.name}</h4>
                                            <p className="text-[10px] text-gray-500">
                                                Annual • Due {new Date(fund.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-white text-sm">-${(drips.get(fund.id) || 0).toFixed(2)}</span>
                                        <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-500">
                                            <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                            <span>Allocated</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-emerald-500/20 flex justify-between items-center">
                        <span className="text-emerald-500 text-xs font-bold">Total Drip Allocation</span>
                        <span className="text-emerald-400 font-bold text-lg">${totalDrip.toFixed(2)}</span>
                    </div>
                </div>

                {/* Flexible Spending Section */}
                <div>
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="font-bold text-white text-lg">Flexible Spending</h3>
                        <span className="text-xs text-emerald-400 font-bold">${remainingForFlexible.toFixed(2)} Planned</span>
                    </div>

                    {/* Mock Categories for Visualization */}
                    <div className="space-y-3 opacity-60 pointer-events-none grayscale">
                        <div className="bg-surface-dark rounded-xl p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-400">shopping_cart</span>
                                <span className="font-bold text-white">Groceries</span>
                            </div>
                            <span className="font-bold text-white">$400</span>
                        </div>
                        <div className="bg-surface-dark rounded-xl p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-400">restaurant</span>
                                <span className="font-bold text-white">Dining Out</span>
                            </div>
                            <span className="font-bold text-white">$150</span>
                        </div>
                    </div>

                    <div className="mt-4 border-2 border-dashed border-white/10 rounded-xl p-4 text-center text-gray-500 text-xs">
                        + Add Category (Locked for Auto-Drip View)
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-surface-dark border-t border-white/10">
                <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-gray-400 text-xs">Remaining to Assign</span>
                    <span className="text-emerald-400 font-bold text-lg">${remainingForFlexible.toFixed(2)}</span>
                </div>
                <button
                    onClick={onConfirm}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <span>Confirm Allocation</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};
