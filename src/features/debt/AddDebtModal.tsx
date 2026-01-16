import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DebtService } from './DebtService';

export const AddDebtModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    // Removed local store action in favor of Cloud Service + Global Sync
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [minPayment, setMinPayment] = useState('');
    const [apr, setApr] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name || !balance || !minPayment || !user) return;

        setIsSubmitting(true);
        try {
            await DebtService.addDebt(user.uid, {
                id: crypto.randomUUID(),
                name,
                totalAmount: parseFloat(balance),
                currentBalance: parseFloat(balance),
                minPayment: parseFloat(minPayment),
                apr: parseFloat(apr) || 0,
            });

            // Cleanup
            setName(''); setBalance(''); setMinPayment(''); setApr('');
            onClose();
        } catch (error) {
            console.error("Error adding debt:", error);
        } finally {
            setIsSubmitting(false);
        }
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
                    <button onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 text-gray-400 font-bold hover:text-white disabled:opacity-50">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-400 disabled:opacity-50">
                        {isSubmitting ? 'Adding...' : 'Add Debt'}
                    </button>
                </div>
            </div>
        </div>
    );
};
