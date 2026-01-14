import React from 'react';
import { useAllocation } from '../allocation/useAllocation';

interface PaydayEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PaydayEntryModal: React.FC<PaydayEntryModalProps> = ({ isOpen, onClose }) => {
    const { paycheckAmount, setPaycheckAmount, runAllocation } = useAllocation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-surface-dark border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-white animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-4 font-display">It's Payday! 🎉</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Paycheck Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            type="number"
                            value={paycheckAmount}
                            onChange={(e) => setPaycheckAmount(e.target.value)}
                            className="block w-full pl-7 pr-3 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-primary focus:border-primary text-white transition-all"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { runAllocation(); onClose(); }}
                        className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-glow-primary hover:bg-primary/90 transition-colors"
                    >
                        Calculate
                    </button>
                </div>
            </div>
        </div>
    );
};
