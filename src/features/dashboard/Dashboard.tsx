import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { useAllocation } from '../allocation/useAllocation';

import { ReallocateModal } from '../reallocation/ReallocateModal';
import { DripAllocationModal } from '../allocation/DripAllocationModal';
import { SnowballAllocationModal } from '../allocation/SnowballAllocationModal';
import { Bill } from '../../store';
import { calculateNextPayDate, isBillDue } from '../allocation/allocationLogic';
import { ShortfallResolutionModal } from './ShortfallResolutionModal';

import { PaydayEntryModal } from './PaydayEntryModal';
import { Sidebar } from '../../components/Sidebar';

export const Dashboard: React.FC = () => {
    const { settings, bills, pendingAllocation } = useStore();
    // Removed useAllocation from here to prevent re-renders on typing
    const { confirmAllocation, isConfirming } = useAllocation(); // We still need confirm, but that state changes rarely
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Reallocation Modal State
    const [isReallocateOpen, setIsReallocateOpen] = useState(false);
    const [selectedUrgentBill, setSelectedUrgentBill] = useState<Bill | null>(null);
    const [shortageAmount, setShortageAmount] = useState(0);

    const handleUrgentBillClick = (bill: Bill) => {
        const allocatedInPending = pendingAllocation?.allocations[bill.id] || 0;
        const shortage = parseFloat(bill.amount) - allocatedInPending;

        if (shortage > 0) {
            setSelectedUrgentBill(bill);
            setShortageAmount(shortage);
            setIsReallocateOpen(true);
        }
    };

    // Memoize Dates
    const { today, currentCycleEnd } = useMemo(() => {
        const t = new Date();
        const end = settings.nextPayDate ? new Date(settings.nextPayDate) : calculateNextPayDate(t, settings.payFrequency);
        return { today: t, currentCycleEnd: end };
    }, [settings.nextPayDate, settings.payFrequency]);

    // Memoize Bills Logic
    const { urgentBills, activeBills } = useMemo(() => {
        const urgent = bills.filter((bill: Bill) => isBillDue(bill, today, currentCycleEnd));
        const active = bills.filter((bill: Bill) => !urgent.includes(bill));
        return { urgentBills: urgent, activeBills: active };
    }, [bills, today, currentCycleEnd]);

    // Memoize Totals
    const { leftToBudget, shortfallAmount, hasShortfall } = useMemo(() => {
        const totalAllocated = pendingAllocation ?
            Object.values(pendingAllocation.allocations).reduce((a: number, b: number) => a + b, 0) + pendingAllocation.emergencyFundAllocation + Object.values(pendingAllocation.sinkingFundsAllocation).reduce((a: number, b: number) => a + b, 0)
            : 0;

        const left = pendingAllocation ? pendingAllocation.totalIncome - totalAllocated : 0;

        // Calculate required expenses (Urgent Bills + Debt Minimums)
        const totalDebtMins = useStore.getState().debts.reduce((sum, d) => sum + d.minPayment, 0);
        const requiredTotal = urgentBills.reduce((sum, b) => sum + parseFloat(b.amount), 0) + totalDebtMins;
        const shortfall = pendingAllocation ? pendingAllocation.totalIncome < requiredTotal : false;
        const sAmount = shortfall ? requiredTotal - (pendingAllocation?.totalIncome || 0) : 0;

        return { leftToBudget: left, shortfallAmount: sAmount, hasShortfall: shortfall };
    }, [pendingAllocation, urgentBills]);


    const [isSnowballModalOpen, setIsSnowballModalOpen] = useState(false);
    const [isDripModalOpen, setIsDripModalOpen] = useState(false);

    const handleConfirmClick = () => {
        if (pendingAllocation && pendingAllocation.snowballAmount > 0) {
            setIsSnowballModalOpen(true);
        } else if (pendingAllocation && Object.keys(pendingAllocation.sinkingFundsAllocation).length > 0) {
            setIsDripModalOpen(true);
        } else {
            confirmAllocation();
        }
    };

    const handleSnowballConfirm = () => {
        setIsSnowballModalOpen(false);
        // Chain to Drip if needed
        if (pendingAllocation && Object.keys(pendingAllocation.sinkingFundsAllocation).length > 0) {
            setIsDripModalOpen(true);
        } else {
            confirmAllocation();
        }
    };

    const [isShortfallModalOpen, setIsShortfallModalOpen] = useState(false);

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex justify-center w-full font-sans transition-colors duration-300">
            {/* ... (Existing Layout) ... */}
            <div className="flex flex-col gap-6 w-full max-w-md mx-auto relative">

                {/* Top App Bar */}
                <header className="flex items-center justify-between px-6 py-5 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 rounded-full bg-surface-dark border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIsSidebarOpen(true)}>
                            <span className="material-symbols-outlined text-white text-[20px]">menu</span>
                        </div>
                    </div>
                    <h1 className="text-white text-lg font-extrabold tracking-tight">Magic Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <div
                            onClick={() => setIsModalOpen(true)}
                            className="relative flex items-center justify-center size-10 rounded-full bg-surface-dark border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-white text-[20px]">add_card</span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col px-4 pb-24 overflow-y-auto space-y-6">

                    {/* Paycheck Header Card */}
                    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg border border-white/5 group ${hasShortfall ? 'bg-danger/20 border-danger/50' : 'bg-gradient-to-br from-[#1d2f29] to-[#131f1b]'}`}>
                        {/* Use Local Texture */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('/cubes.png')] bg-repeat"></div>

                        <div className="relative z-10 flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`font-bold text-sm tracking-wider uppercase mb-1 ${hasShortfall ? 'text-danger' : 'text-primary'}`}>
                                        {hasShortfall ? 'Critical Shortfall' : 'Current Paycheck'}
                                    </p>
                                    <h2 className="text-white text-3xl font-bold font-display tracking-tight">
                                        {hasShortfall ? `-$${shortfallAmount.toFixed(2)}` : `$${leftToBudget.toFixed(2)}`}
                                    </h2>
                                    <p className="text-gray-400 text-sm font-medium mt-1">
                                        {hasShortfall ? 'needed to cover bills' : 'Left to Budget'}
                                    </p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/5">
                                    <p className="text-white text-xs font-semibold">
                                        {today.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {currentCycleEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-lg ${pendingAllocation ? (hasShortfall ? 'text-danger' : 'text-primary') : 'text-gray-500'}`}>
                                        {pendingAllocation ? (hasShortfall ? 'error' : 'check_circle') : 'pending'}
                                    </span>
                                    <span className="text-gray-300 text-sm">
                                        {pendingAllocation ? (hasShortfall ? 'Action Required' : 'Review Allocation') : 'No Allocation Run'}
                                    </span>
                                </div>
                                {pendingAllocation && (
                                    hasShortfall ? (
                                        <button
                                            onClick={() => setIsShortfallModalOpen(true)}
                                            className="bg-danger hover:bg-danger/90 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-all animate-pulse"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">build</span>
                                            Resolve
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleConfirmClick}
                                            disabled={isConfirming}
                                            className="bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isConfirming ? (
                                                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-[18px]">save</span>
                                            )}
                                            {isConfirming ? 'Saving...' : 'Confirm & Log'}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Urgent Section */}
                    {urgentBills.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest px-1">Attention Needed</h3>
                            {urgentBills.map(bill => (
                                <div
                                    key={bill.id}
                                    onClick={() => handleUrgentBillClick(bill)}
                                    className="relative flex flex-col gap-4 rounded-xl bg-surface-dark p-4 shadow-glow-danger border border-danger/30 cursor-pointer hover:bg-surface-dark/80 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center rounded-xl bg-danger/10 shrink-0 size-12 border border-danger/20 text-danger">
                                                <span className="material-symbols-outlined">warning</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white text-base font-bold leading-tight">{bill.name}</h4>
                                                <p className="text-danger text-sm font-medium mt-0.5">Due Day: {bill.dueDay}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-white font-mono font-bold">${bill.amount}</span>
                                            <span className="text-white/40 text-xs">Allocated: ${pendingAllocation?.allocations[bill.id]?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Active Budget Section */}
                    <div className="space-y-3">
                        <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest px-1">Funding Priorities</h3>

                        {/* Mapping user bills */}
                        {activeBills.map(bill => (
                            <div key={bill.id} className="group flex flex-col gap-3 rounded-xl bg-surface-dark p-4 shadow-lg border border-white/5 hover:border-primary/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center rounded-xl bg-primary/10 shrink-0 size-12 text-primary group-hover:scale-105 transition-transform">
                                            <span className="material-symbols-outlined">receipt_long</span>
                                        </div>
                                        <div>
                                            <h4 className="text-white text-base font-bold">{bill.name}</h4>
                                            <p className="text-gray-400 text-xs mt-0.5">Due Day: {bill.dueDay}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-mono font-bold text-lg">${pendingAllocation?.allocations[bill.id]?.toFixed(2) || '0'}</p>
                                        <p className="text-white/40 text-xs font-medium">of ${bill.amount}</p>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="relative h-3 w-full rounded-full bg-black/40 overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-glow-primary transition-all duration-500"
                                        style={{ width: pendingAllocation ? `${(pendingAllocation.allocations[bill.id] / parseFloat(bill.amount)) * 100}%` : '0%' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ghosted Section */}
                    <div className="space-y-3 pt-2">
                        <h3 className="text-muted-text text-xs font-bold uppercase tracking-widest px-1">Covered & Completed</h3>
                        <div className="flex items-center justify-between rounded-xl bg-surface-dark/40 p-4 border border-white/5 opacity-70 grayscale-[0.5]">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center rounded-xl bg-surface-highlight/50 shrink-0 size-10 text-muted-text">
                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                </div>
                                <div>
                                    <h4 className="text-muted-text text-base font-bold line-through decoration-white/20">All Caught Up</h4>
                                    <p className="text-muted-text text-xs font-medium">No paid bills yet</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-8"></div>
                </main>

                {/* Floating Action Button (FAB) */}
                <div className="fixed bottom-28 right-6 z-30">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center size-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-[28px]">add</span>
                    </button>
                </div>
            </div>

            {/* Payday Modal - ISOLATED COMPONENT */}
            <PaydayEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Reallocation Modal */}
            <ReallocateModal
                isOpen={isReallocateOpen}
                onClose={() => setIsReallocateOpen(false)}
                targetBill={selectedUrgentBill}
                shortageAmount={shortageAmount}
                onSuccess={() => { }}
            />

            {/* Snowball Modal */}
            <SnowballAllocationModal
                isOpen={isSnowballModalOpen}
                onClose={() => setIsSnowballModalOpen(false)}
                onConfirm={handleSnowballConfirm}
                snowballAmount={pendingAllocation?.snowballAmount || 0}
                targetDebt={useStore.getState().debts.filter(d => d.currentBalance > 0).sort((a, b) => a.currentBalance - b.currentBalance)[0]}
                minPaymentsTotal={pendingAllocation ? Object.values(pendingAllocation.debtAllocations || {}).reduce((a, b) => a + b, 0) : 0}
            />

            {/* Shortfall Resolution Modal */}
            <ShortfallResolutionModal
                isOpen={isShortfallModalOpen}
                onClose={() => setIsShortfallModalOpen(false)}
                shortfallAmount={shortfallAmount}
                onSuccess={() => { }}
            />

            {/* Drip Allocation Modal */}
            <DripAllocationModal
                isOpen={isDripModalOpen}
                onClose={() => setIsDripModalOpen(false)}
                onConfirm={() => {
                    confirmAllocation();
                    setIsDripModalOpen(false);
                }}
                incomeAmount={pendingAllocation ? pendingAllocation.totalIncome : 0}
            />
        </div>
    );
};
