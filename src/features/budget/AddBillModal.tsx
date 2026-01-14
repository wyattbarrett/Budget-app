import React, { useState } from 'react';
import { useBudget } from './useBudget';

interface AddBillModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddBillModal: React.FC<AddBillModalProps> = ({ isOpen, onClose }) => {
    const { addNewBill } = useBudget();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDay, setDueDay] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addNewBill({
                name,
                amount,
                dueDay
            });
            onClose();
            setName('');
            setAmount('');
            setDueDay('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-surface-dark border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-white">
                <h3 className="text-xl font-bold mb-4 font-display">Add Monthly Bill</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Bill Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-primary focus:border-primary text-white placeholder-gray-600"
                            placeholder="e.g. Rent"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="block w-full pl-7 pr-3 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-primary focus:border-primary text-white placeholder-gray-600"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Due Day</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="31"
                                value={dueDay}
                                onChange={(e) => setDueDay(e.target.value)}
                                className="block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-primary focus:border-primary text-white placeholder-gray-600"
                                placeholder="DD"
                            />
                        </div>
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
                            {isSubmitting ? 'Adding...' : 'Add Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
