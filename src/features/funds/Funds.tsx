import React, { useState } from 'react';
import { useStore } from '../../store';
import { CircularProgress } from '../../components/CircularProgress';
import { AddFundModal } from '../budget/AddFundModal';
import { AnnualBillModal } from './AnnualBillModal';
import { EmergencyFundFortress } from './EmergencyFundFortress';
import { AddTransactionModal } from '../transactions/AddTransactionModal';

import { useNavigate } from 'react-router-dom';

export const Funds: React.FC = () => {
    const navigate = useNavigate();
    const { sinkingFunds, settings } = useStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

    // Calculate EF percentage
    const efPercentage = settings.starterEFGoal > 0
        ? (settings.currentEF / settings.starterEFGoal) * 100
        : 0;

    const [isAnnualModalOpen, setIsAnnualModalOpen] = useState(false);
    const [isFortressOpen, setIsFortressOpen] = useState(false);

    // Filter funds
    const annualFunds = sinkingFunds.filter(f => f.type === 'annual');
    const simpleFunds = sinkingFunds.filter(f => f.type !== 'annual');

    // Annual Fund Totals
    const annualTarget = annualFunds.reduce((sum, f) => sum + f.targetAmount, 0);
    const annualSaved = annualFunds.reduce((sum, f) => sum + f.currentAmount, 0);

    return (
        <div className="min-h-screen bg-background-dark p-4 pb-24 font-sans text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-surface-dark border border-white/5 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Sinking Funds</h1>
                <button
                    onClick={() => setIsAnnualModalOpen(true)}
                    className="size-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                </button>
            </div>

            {/* Annual Overview Section (New) */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2 px-1">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Annual Overview</h2>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">+12% vs Last Year</span>
                </div>

                <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <span className="material-symbols-outlined text-8xl">calendar_month</span>
                    </div>

                    <div className="mb-6 relative z-10">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Allocated</p>
                        <h3 className="text-3xl font-display font-bold text-white mb-1">
                            ${annualSaved.toLocaleString()} <span className="text-lg text-gray-500 font-normal">/ ${annualTarget.toLocaleString()}</span>
                        </h3>
                    </div>

                    {/* Annual Funds List with Pace Line */}
                    <div className="space-y-4 relative z-10">
                        {annualFunds.length === 0 ? (
                            <div className="text-center py-4 bg-black/20 rounded-xl border border-dashed border-white/10">
                                <p className="text-gray-500 text-xs">No annual bills set up.</p>
                                <button onClick={() => setIsAnnualModalOpen(true)} className="text-emerald-400 text-xs font-bold mt-2">Add One</button>
                            </div>
                        ) : (
                            annualFunds.map(fund => {
                                // Pace Calculation Logic
                                // For MVP: simple date based.
                                // Ideal Saved = (Days Passed / Total Duration) * Target
                                // If saved < Ideal -> Behind Schedule
                                const target = fund.targetAmount;
                                const current = fund.currentAmount;
                                const percentage = Math.min((current / target) * 100, 100);

                                // Mock Pace: Assume we are 50% through the year for visualization if no startDate
                                // In real app, store startDate.
                                const pacePercentage = 60; // Mock "Today" line
                                const isBehind = percentage < pacePercentage;
                                const gap = isBehind ? Math.round((pacePercentage / 100 * target) - current) : 0;

                                return (
                                    <div key={fund.id} className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-gray-400 text-sm">
                                                    {fund.icon || 'calendar_clock'}
                                                </span>
                                                <span className="font-bold text-sm text-white">{fund.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {isBehind && (
                                                    <span className="material-symbols-outlined text-amber-500 text-[10px]">warning</span>
                                                )}
                                                <span className="text-[10px] text-gray-500">
                                                    {fund.dueDate ? `Due ${new Date(fund.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'No Due Date'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative h-2 bg-black/40 rounded-full w-full overflow-hidden mb-1">
                                            {/* Actual Progress */}
                                            <div
                                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isBehind ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                            {/* Pace Marker (The "Target Pace" line) */}
                                            <div
                                                className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10"
                                                style={{ left: `${pacePercentage}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className={`${isBehind ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                ${current} saved
                                            </span>
                                            {isBehind ? (
                                                <span className="text-amber-500 font-bold">Target gap: -${gap}</span>
                                            ) : (
                                                <span className="text-emerald-500 font-bold">On Track</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Simple Sinking Funds (Lifestyle) */}
            <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Lifestyle & Savings</h2>
                <div className="grid grid-cols-2 gap-4">
                    {/* Render Simple Sinking Funds */}
                    {simpleFunds.map(fund => {
                        const percentage = fund.targetAmount > 0
                            ? (fund.currentAmount / fund.targetAmount) * 100
                            : 0;

                        return (
                            <div key={fund.id} className="bg-surface-dark border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-md hover:border-white/10 transition-colors">
                                <CircularProgress
                                    percentage={percentage}
                                    size={60}
                                    color="#10B981"
                                    icon="savings"
                                />
                                <div className="text-center">
                                    <h3 className="font-bold text-sm truncate w-24">{fund.name}</h3>
                                    <p className="text-xs text-gray-400">
                                        <span className="text-emerald-400 font-bold">${Math.round(fund.currentAmount)}</span>
                                        <span className="text-white/20"> / </span>
                                        <span>${fund.targetAmount}</span>
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {/* Add New Fund Box (Small) */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-surface-dark border-2 border-dashed border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-white hover:border-white/20 transition-all"
                    >
                        <div className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">add</span>
                        </div>
                        <span className="font-medium text-xs">New Goal</span>
                    </button>
                </div>
            </div>

            {/* Emergency Fund Card */}
            <div
                onClick={() => setIsFortressOpen(true)}
                className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6 flex items-center justify-between shadow-md cursor-pointer hover:bg-surface-dark/80 transition-colors group"
            >
                <div>
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">Emergency Fund</h3>
                    <p className="text-xs text-gray-500 mb-2">Goal: ${settings.starterEFGoal.toLocaleString()}</p>
                    <p className="text-emerald-400 text-xl font-display font-bold">${settings.currentEF.toLocaleString()}</p>
                    <p className="text-xs text-gray-600"> / ${settings.starterEFGoal.toLocaleString()}</p>
                </div>
                <div className="relative">
                    <CircularProgress
                        percentage={efPercentage}
                        size={64}
                        color="#10B981"
                        icon="medical_services"
                    />
                    {/* Lock Icon Badge if locked */}
                    <div className="absolute -bottom-1 -right-1 bg-surface-dark rounded-full p-1 border border-white/10">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">lock</span>
                    </div>
                </div>
            </div>

            {/* Add Transaction FAB */}
            <div className="fixed bottom-24 right-4 z-40">
                <button
                    onClick={() => setIsTransactionModalOpen(true)}
                    className="flex items-center justify-center size-14 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-[28px]">add</span>
                </button>
            </div>

            {/* Modals */}
            <AddFundModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <AnnualBillModal isOpen={isAnnualModalOpen} onClose={() => setIsAnnualModalOpen(false)} />
            <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} />
            <EmergencyFundFortress isOpen={isFortressOpen} onClose={() => setIsFortressOpen(false)} />
        </div>
    );
};
