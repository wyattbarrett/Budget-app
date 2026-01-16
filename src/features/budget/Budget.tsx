import React, { useState } from 'react';
import { useStore } from '../../store';
import { useBudget } from './useBudget';
import { AddBillModal } from './AddBillModal';
import { AddFundModal } from './AddFundModal';
import { getOrdinal } from '../../utils/formatters';

import { useNavigate } from 'react-router-dom';

/**
 * The Master Budget Setup component.
 * Allows users to manage their zero-based budget, including income, bills, and sinking funds.
 * Visualizes the "Left to Budget" amount to ensure every dollar has a name.
 *
 * @returns {JSX.Element} The rendered Budget component
 */
export const Budget: React.FC = () => {
    const navigate = useNavigate();
    const { bills, sinkingFunds } = useStore();
    const { deleteBill, deleteFund, loading } = useBudget();

    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [isFundModalOpen, setIsFundModalOpen] = useState(false);
    const [estimatedIncome, setEstimatedIncome] = useState(5000); // Default for MVP

    // --- Budget Calculations ---
    const totalBills = bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
    const totalFunds = sinkingFunds.reduce((sum, fund) => sum + fund.targetAmount, 0);
    const totalBudgeted = totalBills + totalFunds;
    const remaining = estimatedIncome - totalBudgeted;

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Loading budget data...</div>;
    }

    return (
        <div className="min-h-screen bg-background-dark pb-32 font-sans text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-surface-dark border border-white/5 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Master Budget Setup</h1>
                <button className="p-2 rounded-full bg-surface-dark border border-white/5 text-gray-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </div>

            {/* Zero-Based Calculator Card */}
            <div className="mx-4 mb-8 bg-surface-dark border border-white/5 rounded-2xl p-6 shadow-2xl">
                <div className="grid grid-cols-3 gap-4 text-center divide-x divide-white/10">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">Est. Income</span>
                        <div className="text-white font-bold flex items-center gap-1">
                            <span className="text-sm">$</span>
                            <input
                                type="number"
                                value={estimatedIncome}
                                onChange={(e) => setEstimatedIncome(Number(e.target.value))}
                                className="bg-transparent w-16 text-center outline-none border-b border-dashed border-white/20 focus:border-white"
                            />
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">Budgeted</span>
                        <div className="text-white font-bold text-sm pt-1">
                            ${totalBudgeted.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <span className={`text-[10px] uppercase font-bold mb-1 ${remaining < 0 ? 'text-red-500' : remaining === 0 ? 'text-emerald-500' : 'text-emerald-400'
                            }`}>Remaining</span>
                        <div className={`font-bold text-sm pt-1 ${remaining < 0 ? 'text-red-500' : remaining === 0 ? 'text-emerald-500' : 'text-emerald-400'
                            }`}>
                            ${remaining.toLocaleString()}
                        </div>
                    </div>
                </div>
                {/* Progress Bar for Zero-Based Visual */}
                <div className="mt-4 h-1.5 w-full bg-black/40 rounded-full overflow-hidden flex">
                    <div
                        className={`h-full transition-all duration-500 ${remaining < 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min((totalBudgeted / estimatedIncome) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Must-Pay Bills */}
            <section className="px-4 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Must-Pay Bills</h2>
                    <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">{bills.length} Items</span>
                </div>

                <div className="space-y-3">
                    {/* Add Bill Button */}
                    <button
                        onClick={() => setIsBillModalOpen(true)}
                        className="w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-500 text-sm hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Bill
                    </button>

                    {bills.map(bill => (
                        <div key={bill.id} className="bg-surface-dark p-4 rounded-xl border border-white/5 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`size-12 rounded-xl flex items-center justify-center ${(bill.name || '').includes('Rent') ? 'bg-blue-500/10 text-blue-400' :
                                    (bill.name || '').includes('Elect') ? 'bg-amber-500/10 text-amber-400' :
                                        'bg-purple-500/10 text-purple-400'
                                    }`}>
                                    <span className="material-symbols-outlined text-[20px]">
                                        {(bill.name || '').includes('Rent') ? 'home' :
                                            (bill.name || '').includes('Elect') ? 'bolt' : 'receipt_long'}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold">{bill.name}</h3>
                                        {/* Mock Adjustment Tag from design */}
                                        {(bill.name || '').includes('Electric') && (
                                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">Adj. +$20</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">Due {getOrdinal(bill.dueDay)} • Was ${parseFloat(bill.amount) - 20}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 min-w-[80px] text-right">
                                    <span className="text-white font-mono font-bold">${parseFloat(bill.amount).toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => deleteBill(bill.id)}
                                    className="size-8 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Lifestyle & Cash Accounts */}
            <section className="px-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Lifestyle & Cash Accounts</h2>
                    <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">Sinking Funds</span>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => setIsFundModalOpen(true)}
                        className="w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-500 text-sm hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Account
                    </button>

                    {sinkingFunds.map(fund => (
                        <div key={fund.id} className="bg-surface-dark p-4 rounded-xl border border-white/5 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`size-12 rounded-xl flex items-center justify-center ${(fund.name || '').includes('Cloth') ? 'bg-pink-500/10 text-pink-400' :
                                    (fund.name || '').includes('Hair') ? 'bg-purple-500/10 text-purple-400' :
                                        (fund.name || '').includes('Groc') ? 'bg-emerald-500/10 text-emerald-400' :
                                            'bg-amber-500/10 text-amber-400'
                                    }`}>
                                    <span className="material-symbols-outlined text-[20px]">
                                        {(fund.name || '').includes('Cloth') ? 'checkroom' :
                                            (fund.name || '').includes('Hair') ? 'content_cut' :
                                                (fund.name || '').includes('Groc') ? 'shopping_basket' : 'restaurant'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">{fund.name}</h3>
                                    <p className="text-xs text-emerald-400">Current Balance: ${fund.currentAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 min-w-[80px] text-right">
                                    <span className="text-white font-mono font-bold">${fund.targetAmount.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => deleteFund(fund.id)}
                                    className="size-8 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sticky Footer */}
            <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-gradient-to-t from-background-dark via-background-dark to-transparent z-40">
                <button className="w-full bg-surface-highlight hover:bg-surface-highlight/80 text-white font-bold py-4 rounded-xl shadow-lg border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-95">
                    <span className="material-symbols-outlined flex items-center justify-center bg-white text-black rounded-full size-5 text-sm font-bold">check</span>
                    <span>Finalize Budget</span>
                </button>
                <p className="text-center text-gray-500 text-[10px] mt-2">Review all auto-adjusted amounts before finalizing.</p>
            </div>

            <AddBillModal isOpen={isBillModalOpen} onClose={() => setIsBillModalOpen(false)} />
            <AddFundModal isOpen={isFundModalOpen} onClose={() => setIsFundModalOpen(false)} />
        </div>
    );
};
