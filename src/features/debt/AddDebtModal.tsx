import React, { useState } from 'react';
import { useStore } from '../../store';

export const AddDebtModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { addDebt } = useStore();
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [minPayment, setMinPayment] = useState('');
    const [apr, setApr] = useState('');

    const handleSubmit = () => {
        if (!name || !balance || !minPayment) return;
        addDebt({
            id: crypto.randomUUID(),
            name,
            totalAmount: parseFloat(balance),
            currentBalance: parseFloat(balance),
            minPayment: parseFloat(minPayment),
            apr: parseFloat(apr) || 0,
        });
        setName(''); setBalance(''); setMinPayment(''); setApr('');
        onClose();
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
                    <button onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold hover:text-white">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-400">Add Debt</button>
                </div>
            </div>
        </div>
    );
};
