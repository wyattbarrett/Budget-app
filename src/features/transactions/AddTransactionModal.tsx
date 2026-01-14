import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { useAuth } from '../../context/AuthContext';
import { logExpense } from './transactionLogic';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { sinkingFunds } = useStore();

    // Form State
    const [amountStr, setAmountStr] = useState('0');
    const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
    const [memo, setMemo] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setAmountStr('0');
            setMemo('');
            setDate(new Date().toISOString().split('T')[0]);
            // Default to first fund if available
            if (sinkingFunds.length > 0 && !selectedFundId) {
                setSelectedFundId(sinkingFunds[0].id);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const amount = parseFloat(amountStr);
    const selectedFund = sinkingFunds.find(f => f.id === selectedFundId);
    const currentBalance = selectedFund?.currentAmount || 0;
    const newBalance = currentBalance - amount;
    const isOverspent = newBalance < 0;

    const handleNumPad = (value: string) => {
        if (value === 'backspace') {
            setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        } else if (value === '.') {
            if (!amountStr.includes('.')) {
                setAmountStr(prev => prev + '.');
            }
        } else {
            setAmountStr(prev => prev === '0' ? value : prev + value);
        }
    };

    const handleSubmit = async () => {
        if (!user || !selectedFundId) return; // Ensure user and fund are selected
        if (amount <= 0) return; // Amount must be positive

        // Security Hardening: Prevent nonsensical values
        if (amount > 1000000) return; // Cap the amount to prevent extremely large, potentially erroneous entries

        setIsSubmitting(true);
        try {
            await logExpense(user.uid, selectedFundId, amount, memo, new Date(date));
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 flex flex-col z-50 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">Cancel</button>
                <span className="font-bold text-white">
                    {isOverspent ? 'Add Transaction' : 'NEW ENTRY'}
                </span>
                <button
                    onClick={() => setAmountStr('0')}
                    className={`text-sm font-bold transition-colors ${isOverspent ? 'text-primary' : 'text-emerald-500'}`}
                >
                    {isOverspent ? 'Add' : 'Clear'}
                </button>
            </div>

            {/* Main Display */}
            <div className="flex-1 flex flex-col items-center pt-8 px-6">
                <div className="text-6xl font-bold text-white mb-4 tracking-tight">
                    ${amountStr}
                </div>

                {selectedFund && (
                    <div className="bg-white/5 rounded-full px-4 py-1.5 flex items-center gap-3 text-sm font-medium border border-white/5 mb-8">
                        <span className="text-gray-400 line-through">${currentBalance.toFixed(2)}</span>
                        <span className="material-symbols-outlined text-xs text-gray-500">arrow_forward</span>
                        <span className={`${isOverspent ? 'text-red-500' : 'text-emerald-500'} font-bold`}>
                            ${newBalance.toFixed(2)}
                        </span>
                    </div>
                )}

                {/* Overspent Warning Card */}
                {isOverspent && (
                    <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between animate-in zoom-in duration-300">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                <span className="material-symbols-outlined">sync_problem</span>
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Needs Reallocation</p>
                                <p className="text-red-400 text-xs">Cover the ${Math.abs(newBalance).toFixed(2)} shortage</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                    </div>
                )}

                {/* Fund Selector (Horizontal Scroll) */}
                <div className="w-full overflow-x-auto pb-4 mb-4 custom-scrollbar">
                    <div className="flex gap-3">
                        {sinkingFunds.map(fund => (
                            <button
                                key={fund.id}
                                onClick={() => setSelectedFundId(fund.id)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl min-w-[80px] border transition-all ${selectedFundId === fund.id
                                    ? 'bg-emerald-900/20 border-emerald-500/50'
                                    : 'bg-surface-dark border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className={`size-10 rounded-full flex items-center justify-center ${selectedFundId === fund.id ? 'bg-emerald-500 text-white shadow-glow-primary' : 'bg-white/5 text-gray-400'
                                    }`}>
                                    <span className="material-symbols-outlined text-[20px]">
                                        {/* Simple mapping or default icon */}
                                        savings
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold truncate w-full text-center ${selectedFundId === fund.id ? 'text-emerald-400' : 'text-gray-500'
                                    }`}>
                                    {fund.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Inputs */}
                <div className="flex gap-3 w-full mb-6">
                    <div className="flex-1 bg-surface-dark border border-white/5 rounded-xl px-4 py-3">
                        <label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Memo</label>
                        <input
                            type="text"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            className="bg-transparent text-white text-sm w-full outline-none placeholder-gray-600"
                            placeholder="What's this for?"
                        />
                    </div>
                    <div className="w-1/3 bg-surface-dark border border-white/5 rounded-xl px-4 py-3 relative">
                        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent text-white text-sm w-full outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 absolute inset-0 pl-4 pt-6 z-10"
                        />
                        <span className="text-white text-sm">{date === new Date().toISOString().split('T')[0] ? 'Today' : date.split('-').slice(1).join('/')}</span>
                    </div>
                </div>

            </div>

            {/* Numpad */}
            <div className="bg-surface-dark border-t border-white/5 p-6 pb-12">
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumPad(num.toString())}
                            className="text-2xl font-medium text-white h-16 rounded-full hover:bg-white/5 transition-colors"
                        >
                            {num}
                        </button>
                    ))}

                    {/* Backspace */}
                    <button
                        onClick={() => handleNumPad('backspace')}
                        className="flex items-center justify-center h-16 rounded-full hover:bg-white/5 transition-colors text-gray-400"
                    >
                        <span className="material-symbols-outlined">backspace</span>
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || amount <= 0}
                    className="absolute bottom-10 right-8 size-16 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                    {isSubmitting ? (
                        <span className="material-symbols-outlined animate-spin">sync</span>
                    ) : (
                        <span className="material-symbols-outlined text-3xl">check</span>
                    )}
                </button>
            </div>
        </div>
    );
};
