import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserSettings {
    payFrequency: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
    nextPayDate: Date | null;
    starterEFGoal: number;
    currentEF: number;
    emergencyFundLocked?: boolean;
    displayName?: string;
    primaryCurrency?: string;
}

export interface SinkingFund {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    priority: number; // 1-10, 10 is highest
    type?: 'annual' | 'simple';
    dueDate?: string; // ISO Date string
    icon?: string;
}


export interface Bill {
    id: string;
    name: string;
    amount: string;
    dueDay: string;
}

export interface Debt {
    id: string;
    name: string;
    totalAmount: number; // Starting balance
    currentBalance: number;
    minPayment: number;
    apr: number;
    dueDate?: string;
}

export interface PendingAllocation {
    totalIncome: number;
    allocations: Record<string, number>;
    emergencyFundAllocation: number;
    sinkingFundsAllocation: Record<string, number>;
    debtAllocations: Record<string, number>;
    snowballAmount: number;
    isConfirmed: boolean;
}

interface AppState {
    settings: UserSettings;
    bills: Bill[];
    sinkingFunds: SinkingFund[];
    debts: Debt[];
    pendingAllocation: PendingAllocation | null;
    availableSnowballPower: number; // New: Recycled min payments

    setSettings: (settings: Partial<UserSettings>) => void;
    setBills: (bills: Bill[]) => void;
    setSinkingFunds: (funds: SinkingFund[]) => void;
    addSinkingFund: (fund: SinkingFund) => void;
    removeSinkingFund: (id: string) => void;
    updateSinkingFund: (id: string, fund: Partial<SinkingFund>) => void;
    setDebts: (debts: Debt[]) => void;
    addDebt: (debt: Debt) => void;
    updateDebt: (id: string, debt: Partial<Debt>) => void;
    removeDebt: (id: string) => void;
    recycleDebtPayment: (amount: number) => void; // New action
    updateEF: (amount: number) => void;
    addBill: (bill: Bill) => void;
    removeBill: (id: string) => void;
    updateBill: (id: string, field: keyof Bill, value: string) => void;
    setPendingAllocation: (allocation: PendingAllocation | null) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            settings: {
                payFrequency: 'bi-weekly',
                nextPayDate: null,
                starterEFGoal: 1000,
                currentEF: 0,
                displayName: '',
                primaryCurrency: 'USD',
            },
            bills: [],
            sinkingFunds: [],
            debts: [],
            pendingAllocation: null,
            availableSnowballPower: 0,

            setSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings }
            })),
            setBills: (bills) => set({ bills }),
            setSinkingFunds: (funds) => set({ sinkingFunds: funds }),
            addSinkingFund: (fund) => set((state) => ({ sinkingFunds: [...state.sinkingFunds, fund] })),
            removeSinkingFund: (id) => set((state) => ({ sinkingFunds: state.sinkingFunds.filter(f => f.id !== id) })),
            updateSinkingFund: (id, fund) => set((state) => ({
                sinkingFunds: state.sinkingFunds.map(f => f.id === id ? { ...f, ...fund } : f)
            })),
            setDebts: (debts) => set({ debts }),
            addDebt: (debt) => set((state) => ({ debts: [...state.debts, debt] })),
            updateDebt: (id, debt) => set((state) => ({
                debts: state.debts.map(d => d.id === id ? { ...d, ...debt } : d)
            })),
            removeDebt: (id) => set((state) => ({ debts: state.debts.filter(d => d.id !== id) })),
            recycleDebtPayment: (amount) => set((state) => ({ availableSnowballPower: state.availableSnowballPower + amount })),
            updateEF: (amount) => set((state) => ({ settings: { ...state.settings, currentEF: amount } })),
            addBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),
            removeBill: (id) => set((state) => ({ bills: state.bills.filter((b) => b.id !== id) })),
            updateBill: (id, field, value) => set((state) => ({
                bills: state.bills.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
            })),
            setPendingAllocation: (allocation) => set({ pendingAllocation: allocation }),
        }),
        {
            name: 'budget-store',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// Expose store for E2E
if (typeof window !== 'undefined') {
    (window as any).useStore = useStore;
}
