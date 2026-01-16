import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { useAllocation } from '../allocation/useAllocation';

import { ReallocateModal } from '../reallocation/ReallocateModal';
import { DripAllocationModal } from '../allocation/DripAllocationModal';
import { SnowballAllocationModal } from '../allocation/SnowballAllocationModal';
import { Bill } from '../../store';
import { calculateNextPayDate, getBillStatus } from '../allocation/allocationLogic';
import { ShortfallResolutionModal } from './ShortfallResolutionModal';

import { PaydayEntryModal } from './PaydayEntryModal';
import { Sidebar } from '../../components/Sidebar';
import { CircularProgress } from '../../components/CircularProgress';
import { PaycheckCard } from './PaycheckCard';
import { RequiredBillsCard } from './RequiredBillsCard';

export const Dashboard: React.FC = () => {
    const { settings, bills, pendingAllocation, sinkingFunds } = useStore();
    // Removed useAllocation from here to prevent re-renders on typing
    const { commitAllocation, isConfirming } = useAllocation(); // We still need confirm, but that state changes rarely
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Reallocation Modal State
    const [isReallocateOpen, setIsReallocateOpen] = useState(false);
    const [selectedUrgentBill, setSelectedUrgentBill] = useState<Bill | null>(null);
    const [shortageAmount, setShortageAmount] = useState(0);

    const [isSnowballModalOpen, setIsSnowballModalOpen] = useState(false);
    const [isDripModalOpen, setIsDripModalOpen] = useState(false);
    const [isShortfallModalOpen, setIsShortfallModalOpen] = useState(false);

    const handleConfirmClick = () => {
        if (pendingAllocation && pendingAllocation.snowballAmount > 0) {
            setIsSnowballModalOpen(true);
        } else if (pendingAllocation && Object.keys(pendingAllocation.sinkingFundsAllocation).length > 0) {
            setIsDripModalOpen(true);
        } else {
            commitAllocation();
        }
    };

    const handleSnowballConfirm = () => {
        setIsSnowballModalOpen(false);
        // Chain to Drip if needed
        if (pendingAllocation && Object.keys(pendingAllocation.sinkingFundsAllocation).length > 0) {
            setIsDripModalOpen(true);
        } else {
            commitAllocation();
        }
    };

    const handleUrgentBillClick = (bill: Bill) => {
        const allocatedInPending = pendingAllocation?.allocations[bill.id] || 0;
        const shortage = parseFloat(bill.amount) - allocatedInPending;
        setShortageAmount(shortage);
        setSelectedUrgentBill(bill);
        setIsReallocateOpen(true);
    };

    const handleReallocationSuccess = (sourceFundId: string, amount: number) => {
        // 1. Update Pending Allocation to show the bill is now funded (visually)
        // We add the reallocated amount to the 'allocations' map for that bill
        if (pendingAllocation && selectedUrgentBill) {
            const currentAlloc = pendingAllocation.allocations[selectedUrgentBill.id] || 0;
            const newAlloc = currentAlloc + amount;

            // We need to update the store's pending allocation
            // Since we don't have a direct 'updatePendingAllocation' action exposed often, 
            // we might need to overwrite it or use setPendingAllocation
            const updatedPending = {
                ...pendingAllocation,
                allocations: {
                    ...pendingAllocation.allocations,
                    [selectedUrgentBill.id]: newAlloc
                }
            };
            useStore.setState({ pendingAllocation: updatedPending });
        }

        // 2. Update Local Sinking Fund Balance
        const fund = useStore.getState().sinkingFunds.find(f => f.id === sourceFundId);
        if (fund) {
            // Update the specific fund in the array
            const updatedFunds = useStore.getState().sinkingFunds.map(f =>
                f.id === sourceFundId ? { ...f, currentAmount: f.currentAmount - amount } : f
            );
            useStore.setState({ sinkingFunds: updatedFunds });
        }

        setIsReallocateOpen(false);
        setSelectedUrgentBill(null);
    };

    // Memoize Dates
    const { today, currentCycleEnd } = useMemo(() => {
        const t = new Date();
        const end = settings.nextPayDate ? new Date(settings.nextPayDate) : calculateNextPayDate(t, settings.payFrequency);
        return { today: t, currentCycleEnd: end };
    }, [settings.nextPayDate, settings.payFrequency]);

    // Memoize Sinking Funds Logic
    const { totalSinkingSaved, totalSinkingGoal, sinkingPercentage } = useMemo(() => {
        if (!sinkingFunds || sinkingFunds.length === 0) return { totalSinkingSaved: 0, totalSinkingGoal: 0, sinkingPercentage: 0 };
        const saved = sinkingFunds.reduce((acc, fund) => acc + fund.currentAmount, 0);
        const goal = sinkingFunds.reduce((acc, fund) => acc + fund.targetAmount, 0);
        const pct = goal > 0 ? (saved / goal) * 100 : 0;
        return { totalSinkingSaved: saved, totalSinkingGoal: goal, sinkingPercentage: pct };
    }, [sinkingFunds]);


    // Memoize Bills Logic
    const { urgentBills, activeBills, ghostedBills } = useMemo(() => {
        const urgent: Bill[] = [];
        const active: Bill[] = [];
        const ghosted: Bill[] = [];

        bills.forEach((bill: Bill) => {
            const status = getBillStatus(bill, today, currentCycleEnd);
            if (status === 'REQUIRED') {
                active.push(bill);
            } else if (status === 'GHOSTED') {
                ghosted.push(bill);
            }
        });

        return { urgentBills: urgent, activeBills: active, ghostedBills: ghosted };
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

    return (
        <div className="bg-background-light dark:bg-background-dark h-full flex justify-center w-full font-sans transition-colors duration-300">
            {/* Sidebar Overlay (Mobile Only) */}
            <div className={`
                md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 
                ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `} onClick={() => setIsSidebarOpen(false)} />

            {/* Sidebar (Mobile Only) */}
            <div className={`
                md:hidden fixed top-0 left-0 h-full w-80 z-40 transform transition-transform duration-300 ease-in-out 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} variant="drawer" />
            </div>

            <div className="flex flex-col h-full w-full relative overflow-hidden">

                {/* Top App Bar (Mobile Only - Desktop has Sidebar) */}
                <header className="md:hidden flex-none flex items-center justify-between px-6 py-5 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0">
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

                {/* Desktop Header / Title */}
                <div className="hidden md:flex flex-none items-center justify-between px-6 pt-8 pb-4">
                    <h1 className="text-3xl font-bold font-display text-white">Dashboard</h1>
                </div>

                {/* Main Content Grid */}
                <main className="flex-1 min-h-0 px-4 md:px-6 pb-24 md:pb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">

                        {/* Main Column (Span 8) - Central Command - Independent Scroll */}
                        <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                            {/* Paycheck HUD and Add Income - GRID Layout to prevent overlap */}
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-stretch flex-none">
                                {/* Paycheck Header Card */}
                                <PaycheckCard
                                    pendingAllocation={pendingAllocation}
                                    hasShortfall={hasShortfall}
                                    shortfallAmount={shortfallAmount}
                                    leftToBudget={leftToBudget}
                                    today={today}
                                    currentCycleEnd={currentCycleEnd}
                                    isConfirming={isConfirming}
                                    onConfirm={handleConfirmClick}
                                    onResolveShortfall={() => setIsShortfallModalOpen(true)}
                                />

                                {/* Add Income Button */}
                                <div className="hidden lg:flex items-center justify-center">
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="h-full aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-dark border border-white/5 shadow-2xl hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <span className="material-symbols-outlined text-primary text-3xl">add</span>
                                        </div>
                                        <span className="text-white font-bold text-sm">Add Income</span>
                                    </button>
                                </div>
                            </div>

                            {/* Urgent Section */}
                            {urgentBills.length > 0 && (
                                <div className="space-y-3 flex-none">
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
                            <RequiredBillsCard activeBills={activeBills} pendingAllocation={pendingAllocation} />
                        </div>

                        {/* Side Column (Span 4) - Utility Rail - Independent Scroll */}
                        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                            {/* Baby Step 2: Snowball (Top) */}
                            <div className="rounded-2xl bg-surface-dark p-6 border border-white/5 shadow-2xl relative overflow-hidden group flex-none">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-white">ac_unit</span>
                                </div>
                                <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Baby Step 2: Momentum</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="size-16 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                                        <span className="material-symbols-outlined text-primary text-xl">trending_up</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg">Debt Snowball</p>
                                        <p className="text-gray-400 text-xs">Keep the momentum going!</p>
                                    </div>
                                </div>
                                <button className="w-full py-2 bg-primary/10 text-primary rounded-lg font-bold text-sm hover:bg-primary/20 transition-colors">
                                    View Snowball
                                </button>
                            </div>

                            {/* Baby Step 1: Emergency Fund (Middle) */}
                            <div className="rounded-2xl bg-surface-dark p-6 border border-white/5 shadow-2xl relative overflow-hidden flex-none">
                                <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Baby Step 1: Emergency Fund</h3>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-2xl font-bold text-white font-mono">${settings.currentEF.toLocaleString()}</span>
                                    <span className="text-xs text-gray-500 mb-1">of ${settings.starterEFGoal.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (settings.currentEF / settings.starterEFGoal) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Sinking Funds Summary (Bottom) */}
                            <div className="rounded-2xl bg-surface-dark p-6 border border-white/5 shadow-2xl flex-none">
                                <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Sinking Funds</h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-bold text-white font-mono">${totalSinkingSaved.toLocaleString()}</span>
                                        <span className="text-xs text-gray-500">Saved of ${totalSinkingGoal.toLocaleString()}</span>
                                    </div>
                                    <CircularProgress
                                        percentage={sinkingPercentage}
                                        size={60}
                                        strokeWidth={6}
                                        color="#10B981"
                                        icon="savings"
                                    />
                                </div>
                            </div>

                            {/* Ghosted Section */}
                            {ghostedBills.length > 0 && (
                                <div className="space-y-3 flex-none pb-8">
                                    <h3 className="text-muted-text text-xs font-bold uppercase tracking-widest px-1">Upcoming (Ghosted)</h3>
                                    {ghostedBills.map(bill => (
                                        <div key={bill.id} className="flex items-center justify-between rounded-xl bg-surface-dark p-4 border border-white/5 shadow-2xl opacity-40 hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center rounded-xl bg-surface-highlight/50 shrink-0 size-10 text-muted-text">
                                                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-muted-text text-base font-bold">{bill.name}</h4>
                                                    <p className="text-muted-text text-xs font-medium">Due Day: {bill.dueDay}</p>
                                                </div>
                                            </div>
                                            <span className="text-muted-text/50 font-bold">${bill.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </main>

                {/* Floating Action Button (Mobile Only) */}
                <div className="md:hidden fixed bottom-28 right-6 z-30">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center size-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-[28px]">add</span>
                    </button>
                </div>
            </div>

            {/* Payday Modal */}
            <PaydayEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            {/* Reallocation Modal */}
            <ReallocateModal
                isOpen={isReallocateOpen}
                onClose={() => setIsReallocateOpen(false)}
                targetBill={selectedUrgentBill}
                shortageAmount={shortageAmount}
                onSuccess={(sourceFundId: string, amount: number) => handleReallocationSuccess(sourceFundId, amount)}
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
                    commitAllocation();
                    setIsDripModalOpen(false);
                }}
                incomeAmount={pendingAllocation ? pendingAllocation.totalIncome : 0}
            />
        </div>
    );
};
