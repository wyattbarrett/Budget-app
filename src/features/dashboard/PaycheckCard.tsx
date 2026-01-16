import React from 'react';
import { PendingAllocation } from '../../store';

interface PaycheckCardProps {
    pendingAllocation: PendingAllocation | null;
    hasShortfall: boolean;
    shortfallAmount: number;
    leftToBudget: number;
    today: Date;
    currentCycleEnd: Date;
    isConfirming: boolean;
    onConfirm: () => void;
    onResolveShortfall: () => void;
}

export const PaycheckCard: React.FC<PaycheckCardProps> = ({
    pendingAllocation,
    hasShortfall,
    shortfallAmount,
    leftToBudget,
    today,
    currentCycleEnd,
    isConfirming,
    onConfirm,
    onResolveShortfall
}) => {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 shadow-2xl border border-white/5 group min-w-0 ${hasShortfall ? 'bg-danger/20 border-danger/50' : 'bg-gradient-to-br from-[#1d2f29] to-[#131f1b] bg-surface-dark'}`}>
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('/cubes.png')] bg-repeat"></div>

            <div className="relative z-10 flex flex-col gap-1">
                <div className="flex justify-between items-start">
                    <div>
                        <p className={`font-bold text-sm tracking-wider uppercase mb-1 ${hasShortfall ? 'text-danger' : 'text-primary'}`}>
                            {hasShortfall ? 'Critical Shortfall' : 'Current Paycheck'}
                        </p>
                        <h2 className={`text-3xl font-bold font-display tracking-tight ${!hasShortfall && leftToBudget === 0 ? 'text-primary' : 'text-white'}`}>
                            {hasShortfall ? `-$${shortfallAmount.toFixed(2)}` : `$${leftToBudget.toFixed(2)}`}
                        </h2>
                        <p className="text-gray-400 text-sm font-medium mt-1">
                            {hasShortfall ? 'needed to cover bills' : 'Left to Budget'}
                        </p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/5">
                        <p className="text-white text-xs font-semibold">
                            {today.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {currentCycleEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-lg ${pendingAllocation ? (hasShortfall ? 'text-danger' : 'text-primary') : 'text-gray-500'}`}>
                            {pendingAllocation ? (hasShortfall ? 'error' : 'check_circle') : 'pending'}
                        </span>
                        <span className="text-gray-300 text-sm">
                            {pendingAllocation ? (hasShortfall ? 'Action Required' : 'Review Allocation') : 'No Allocation Run'}
                        </span>
                    </div>
                    {pendingAllocation && (
                        hasShortfall ? (
                            <button
                                onClick={onResolveShortfall}
                                className="bg-danger hover:bg-danger/90 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-all animate-pulse"
                            >
                                <span className="material-symbols-outlined text-[18px]">build</span>
                                Resolve
                            </button>
                        ) : (
                            <button
                                onClick={onConfirm}
                                disabled={isConfirming}
                                className="bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isConfirming ? (
                                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                )}
                                {isConfirming ? 'Saving...' : 'Confirm & Log'}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
