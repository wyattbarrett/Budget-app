import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, Bill, SinkingFund, Debt } from './index';

describe('Zustand Store', () => {
    beforeEach(() => {
        useStore.setState({
            bills: [],
            sinkingFunds: [],
            debts: [],
            settings: {
                payFrequency: 'bi-weekly',
                nextPayDate: null,
                starterEFGoal: 1000,
                currentEF: 0,
                displayName: '',
                primaryCurrency: 'USD',
            },
            availableSnowballPower: 0,
        });
    });

    describe('Bills', () => {
        it('should add a bill', () => {
            const bill: Bill = { id: '1', name: 'Rent', amount: '1000', dueDay: '1' };
            useStore.getState().addBill(bill);
            expect(useStore.getState().bills).toContainEqual(bill);
        });

        it('should remove a bill', () => {
            const bill: Bill = { id: '1', name: 'Rent', amount: '1000', dueDay: '1' };
            useStore.getState().setBills([bill]);
            useStore.getState().removeBill('1');
            expect(useStore.getState().bills).toHaveLength(0);
        });

        it('should update a bill', () => {
            const bill: Bill = { id: '1', name: 'Rent', amount: '1000', dueDay: '1' };
            useStore.getState().setBills([bill]);
            useStore.getState().updateBill('1', 'amount', '1200');
            expect(useStore.getState().bills[0].amount).toBe('1200');
        });
    });

    describe('Sinking Funds', () => {
        it('should add a sinking fund', () => {
            const fund: SinkingFund = { id: '1', name: 'Vacation', targetAmount: 5000, currentAmount: 0, priority: 5 };
            useStore.getState().addSinkingFund(fund);
            expect(useStore.getState().sinkingFunds).toContainEqual(fund);
        });

        it('should update a sinking fund', () => {
            const fund: SinkingFund = { id: '1', name: 'Vacation', targetAmount: 5000, currentAmount: 0, priority: 5 };
            useStore.getState().setSinkingFunds([fund]);
            useStore.getState().updateSinkingFund('1', { currentAmount: 100 });
            expect(useStore.getState().sinkingFunds[0].currentAmount).toBe(100);
        });
    });

    describe('Emergency Fund', () => {
        it('should update EF', () => {
            useStore.getState().updateEF(500);
            expect(useStore.getState().settings.currentEF).toBe(500);
        });
    });

    describe('Debts', () => {
        it('should add a debt', () => {
            const debt: Debt = { id: '1', name: 'Visa', totalAmount: 1000, currentBalance: 1000, minPayment: 25, apr: 20 };
            useStore.getState().addDebt(debt);
            expect(useStore.getState().debts).toContainEqual(debt);
        });

        it('should recycle debt payment into snowball power', () => {
            useStore.getState().recycleDebtPayment(50);
            expect(useStore.getState().availableSnowballPower).toBe(50);
        });
    });
});
