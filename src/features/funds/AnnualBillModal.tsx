import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { differenceInMonths } from 'date-fns';

interface AnnualBillModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AnnualBillModal: React.FC<AnnualBillModalProps> = ({ isOpen, onClose }) => {
    const { addSinkingFund } = useStore();
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [dueDate, setDueDate] = useState('');

    // Calculator State
    const [dripAmount, setDripAmount] = useState(0);
    const [monthsRemaining, setMonthsRemaining] = useState(0);

    // Calculate Drip whenever inputs change
    useEffect(() => {
        if (!targetAmount || !dueDate) {
            setDripAmount(0);
            return;
        }

        const target = parseFloat(targetAmount);
        const start = new Date();
        const end = new Date(dueDate);

        // Simple calc: Months remaining
        // In real app, be more precise with pay periods
        const months = differenceInMonths(end, start);
        const validMonths = Math.max(1, months); // Prevent divide by zero
        setMonthsRemaining(validMonths);

        // Assume Bi-Weekly (2 paychecks / month approx)
        // Drip = Target / (Months * 2)
        const paychecks = validMonths * 2;
        const drip = target / paychecks;

        setDripAmount(drip);

    }, [targetAmount, dueDate]);


    const handleSave = () => {
        if (!name || !targetAmount || !dueDate) return;

        addSinkingFund({
            id: crypto.randomUUID(),
            name,
            targetAmount: parseFloat(targetAmount),
            currentAmount: 0,
            priority: 10, // High priority for Annual Bills
            type: 'annual',
            dueDate: new Date(dueDate).toISOString(),
            icon: 'calendar_clock' // Default icon
        });

        // Reset and close
        setName('');
        setTargetAmount('');
        setDueDate('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-surface-dark w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                {/* Header */}
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Add Annual Bill</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Name Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">What is this for?</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Car Insurance"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">edit</span>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="text-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Amount</label>
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-2xl text-gray-500 font-bold">$</span>
                            <input
                                type="number"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                placeholder="1,200"
                                className="bg-transparent text-5xl font-bold text-white w-48 text-center outline-none"
                            />
                        </div>
                    </div>

                    {/* Date Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg focus:outline-none focus:border-emerald-500 transition-colors cal-icon-white"
                        />
                    </div>

                    {/* Funding Plan Card */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-bl-xl">
                            FUNDING PLAN
                        </div>

                        <div className="grid grid-cols-2 gap-8 text-center mt-2">
                            <div>
                                <span className="block text-xs text-gray-500 mb-1">Monthly</span>
                                <span className="text-xl font-bold text-white">
                                    ${(dripAmount * 2).toFixed(2)}
                                </span>
                                <span className="block text-[10px] text-gray-600 mt-1">{monthsRemaining} contributions</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500 mb-1">Per Paycheck</span>
                                <span className="text-xl font-bold text-emerald-400">
                                    ${dripAmount.toFixed(2)}
                                </span>
                                <span className="block text-[10px] text-gray-600 mt-1">Bi-weekly</span>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={!name || !targetAmount || !dueDate}
                        className="w-full bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <span>Set Goal</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>

                </div>
            </div>
        </div>
    );
};
