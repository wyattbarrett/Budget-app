import React, { useState } from 'react';
import { useStore, Bill, SinkingFund } from '../../store';
import { transferFunds } from './reallocationLogic';
import { useAuth } from '../../context/AuthContext';

interface ReallocateModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetBill: Bill | null;
    shortageAmount: number;
    onSuccess: (sourceFundId: string, amount: number) => void;
}

export const ReallocateModal: React.FC<ReallocateModalProps> = ({ isOpen, onClose, targetBill, shortageAmount, onSuccess }) => {
    const { user } = useAuth();
    const { sinkingFunds } = useStore();
    const [step, setStep] = useState<'selection' | 'resolution'>('selection');
    const [selectedFund, setSelectedFund] = useState<SinkingFund | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);

    if (!isOpen || !targetBill) return null;

    // Filter funds that have enough cash (or at least some)
    const availableFunds = sinkingFunds.filter(f => f.currentAmount > 0);

    const handleTransfer = async (sourceFund: SinkingFund) => {
        if (!user) return;
        setIsTransferring(true);
        try {
            await transferFunds(user.uid, sourceFund, targetBill, shortageAmount);
            setSelectedFund(sourceFund);
            setStep('resolution');
            onSuccess(sourceFund.id, shortageAmount);
        } catch (error) {
            console.error(error);
            // Todo: Show error toast
        } finally {
            setIsTransferring(false);
        }
    };

    const handleClose = () => {
        setStep('selection');
        setSelectedFund(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-surface-dark border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm h-[600px] flex flex-col relative overflow-hidden">

                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-10">
                    {step === 'selection' && (
                        <button onClick={handleClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-white">close</span>
                        </button>
                    )}
                </div>

                {step === 'selection' && (
                    <div className="flex-1 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h2 className="text-xl font-bold text-white mb-6">Reallocate Funds</h2>

                        {/* Critical Need Card */}
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-8">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-red-500">warning</span>
                                <span className="text-red-500 font-bold text-xs tracking-wider uppercase">Critical Funding Need</span>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="size-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                                    <span className="material-symbols-outlined">bolt</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">{targetBill.name}</h3>
                                    <p className="text-red-400 text-xs">Due in soon</p>
                                </div>
                                <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/20 uppercase font-bold">Overdue Risk</span>
                            </div>

                            <div className="flex justify-between items-end mb-2">
                                <span className="text-gray-400 text-sm">Current Shortage</span>
                                <span className="text-3xl font-bold text-red-500">-${shortageAmount.toFixed(2)}</span>
                            </div>

                            {/* Shortage Bar */}
                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden flex">
                                <div className="h-full bg-red-500 w-[70%] rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                                <span>Paid: $0.00</span>
                                <span>Total: ${targetBill.amount}</span>
                            </div>
                        </div>

                        <h3 className="text-white font-bold mb-4">Source Funds From</h3>

                        {/* Source List */}
                        <div className="flex-1 overflow-y-auto space-y-3 -mr-2 pr-2 custom-scrollbar">
                            {availableFunds.map(fund => (
                                <div key={fund.id} className="bg-surface-dark border border-white/5 rounded-2xl p-4 group hover:border-emerald-500/30 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <span className="material-symbols-outlined">savings</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold">{fund.name}</h4>
                                                <p className="text-emerald-500 text-xs">Available Budget</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-white font-bold text-lg">${fund.currentAmount.toFixed(2)}</span>
                                            <span className="text-gray-500 text-[10px]">Resets n/a</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleTransfer(fund)}
                                        disabled={isTransferring || fund.currentAmount < shortageAmount}
                                        className="w-full bg-emerald-900/30 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl py-3 flex items-center justify-between px-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:bg-emerald-600 group-hover:text-white"
                                    >
                                        <div className="size-6 rounded-full bg-emerald-500/20 group-hover:bg-white/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </div>
                                        <span className="text-xs font-bold tracking-widest uppercase">
                                            {fund.currentAmount < shortageAmount ? 'Insufficient Funds' : `Cover $${shortageAmount.toFixed(2)}`}
                                        </span>
                                        <div className="w-6"></div> {/* Spacer for centering */}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'resolution' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
                        <div className="absolute top-4 left-4">
                            <span className="text-gray-500 text-xs font-bold tracking-widest uppercase">Resolution</span>
                        </div>

                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                            <div className="size-24 bg-surface-dark border-4 border-emerald-500 rounded-full flex items-center justify-center relative z-10 shadow-2xl">
                                <span className="material-symbols-outlined text-emerald-500 text-5xl">check</span>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">Fully Funded!</h2>
                        <p className="text-gray-400 text-sm mb-12">{targetBill.name} is ready for payment.</p>

                        {/* Receipt Card */}
                        <div className="w-full bg-surface-dark border border-white/5 rounded-2xl overflow-hidden mb-8">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <span className="material-symbols-outlined text-sm">bolt</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-emerald-500 uppercase font-bold">Target</p>
                                        <p className="text-white font-bold text-sm">{targetBill.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-500 font-bold text-lg">${shortageAmount.toFixed(2)}</p>
                                    <div className="flex items-center gap-1 justify-end text-[10px] text-emerald-500">
                                        <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                        <span>READY</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-white/2 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <span className="material-symbols-outlined text-sm">savings</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-amber-500 uppercase font-bold">Source</p>
                                        <p className="text-white font-bold text-sm">{selectedFund?.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 line-through text-xs">${selectedFund?.currentAmount.toFixed(2)}</span>
                                        <span className="material-symbols-outlined text-gray-500 text-xs">arrow_forward</span>
                                        <span className="text-white font-bold text-lg">${((selectedFund?.currentAmount || 0) - shortageAmount).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <span>Back to Dashboard</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
