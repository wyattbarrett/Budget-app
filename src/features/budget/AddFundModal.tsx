import React, { useState } from 'react';
import { useBudget } from './useBudget';

interface AddFundModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddFundModal: React.FC<AddFundModalProps> = ({ isOpen, onClose }) => {
    const { addNewFund } = useBudget();
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [priority, setPriority] = useState('5');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addNewFund({
                name,
                targetAmount: parseFloat(targetAmount),
                currentAmount: 0,
                priority: parseInt(priority)
            });
            onClose();
            setName('');
            setTargetAmount('');
            setPriority('5');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-surface-dark border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-white">
                <h3 className="text-xl font-bold mb-4 font-display">Add Cash Account</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Account Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-primary focus:border-primary text-white placeholder-gray-600"
                            placeholder="e.g. Groceries"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Monthly Target</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                required
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                className="block w-full pl-7 pr-3 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-primary focus:border-primary text-white placeholder-gray-600"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Priority (1-10)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-xl font-bold text-primary w-8 text-center">{priority}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Higher priority gets funded first.</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-glow-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
