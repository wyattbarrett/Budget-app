import React from 'react';
import { Debt } from '../../store';

interface SnowballAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    snowballAmount: number;
    targetDebt?: Debt;
    minPaymentsTotal: number;
}

export const SnowballAllocationModal: React.FC<SnowballAllocationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    snowballAmount,
    targetDebt,
    minPaymentsTotal
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface-dark w-full max-w-md rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">

                {/* Header with Snow Animation */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        {/* Simple CSS Snowflakes */}
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="absolute text-white text-xl animate-pulse" style={{
                                top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`
                            }}>❄</div>
                        ))}
                    </div>

                    <div className="relative z-10">
                        <div className="mx-auto size-20 bg-teal-500/20 rounded-full flex items-center justify-center mb-4 shadow-glow-teal">
                            <span className="material-symbols-outlined text-4xl text-teal-400">snowboarding</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">Debt Snowball Active</h2>
                        <p className="text-teal-400 text-xs font-bold uppercase tracking-widest">Phase 2: Acceleration</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
                            <span className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Minimums Covered</span>
                            <span className="block text-white font-bold text-lg">${minPaymentsTotal.toLocaleString()}</span>
                            <span className="text-[10px] text-emerald-500 flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">check_circle</span> Paid
                            </span>
                        </div>
                        <div className="bg-teal-500/10 p-4 rounded-2xl border border-teal-500/20 text-center">
                            <span className="block text-[10px] text-teal-400 uppercase font-bold mb-1">Snowball Power</span>
                            <span className="block text-white font-bold text-lg">+${snowballAmount.toLocaleString()}</span>
                            <span className="text-[10px] text-teal-400 flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">bolt</span> Drip
                            </span>
                        </div>
                    </div>

                    {/* Target Card */}
                    {targetDebt ? (
                        <div className="border border-white/10 rounded-2xl p-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                            <div className="flex justify-between items-center mb-2 pl-2">
                                <span className="text-xs text-gray-400 font-bold uppercase">Target Acquired</span>
                                <span className="bg-teal-500 text-[#0a0f1c] text-[10px] font-bold px-2 py-0.5 rounded-full">Smallest Debt</span>
                            </div>
                            <div className="flex items-center justify-between pl-2">
                                <span className="text-xl font-bold text-white">{targetDebt.name}</span>
                                <div className="text-right">
                                    <span className="block text-white font-bold">+${(targetDebt.minPayment + snowballAmount).toLocaleString()}</span>
                                    <span className="text-xs text-gray-500">Total Payment</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 text-sm py-4">No debts found. You are free!</div>
                    )}

                    {/* Action */}
                    <button
                        onClick={onConfirm}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-[#0a0f1c] font-bold py-4 rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <span>CONFIRM ALLOCATION</span>
                        <span className="material-symbols-outlined">check_circle</span>
                    </button>

                    <button onClick={onClose} className="w-full text-xs text-center text-gray-500 hover:text-white uppercase tracking-widest font-bold">
                        Adjust Allocation
                    </button>
                </div>
            </div>
        </div>
    );
};
