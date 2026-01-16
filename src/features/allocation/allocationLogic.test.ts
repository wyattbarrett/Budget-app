
import { describe, it, expect, beforeEach } from 'vitest';
import { calculateNextPayDate, getBillStatus, allocateFunds, calculateSnowball } from './allocationLogic';
import { Bill, Debt, SinkingFund } from '../../store';

describe('Allocation Logic', () => {
    describe('calculateNextPayDate', () => {
        it('adds 7 days for weekly frequency', () => {
            const start = new Date('2024-01-01');
            const result = calculateNextPayDate(start, 'weekly');
            expect(result.toISOString()).toContain('2024-01-08');
        });

        it('adds 14 days for bi-weekly frequency', () => {
            const start = new Date('2024-01-01');
            const result = calculateNextPayDate(start, 'bi-weekly');
            expect(result.toISOString()).toContain('2024-01-15');
        });

        it('adds 1 month for monthly frequency', () => {
            const start = new Date('2024-01-01');
            const result = calculateNextPayDate(start, 'monthly');
            expect(result.toISOString()).toContain('2024-02-01');
        });
    });

    describe('getBillStatus', () => {
        // Mock current date: Jan 10
        const today = new Date('2024-01-10T12:00:00');
        // Mock cycle end: Jan 24 (14 days later)
        const cycleEnd = new Date('2024-01-24T12:00:00');

        it('marks bill strictly due in window as REQUIRED', () => {
            // Due Jan 15 (Inside window)
            // Deadline Jan 13 (Inside window)
            const bill: Bill = { id: '1', name: 'Rent', amount: '1000', dueDay: '15' };
            const status = getBillStatus(bill, today, cycleEnd);
            expect(status).toBe('REQUIRED');
        });

        it('marks bill due far in future as GHOSTED', () => {
            // Due Jan 28 (Outside window)
            const bill: Bill = { id: '2', name: 'Far Bill', amount: '100', dueDay: '28' };
            const status = getBillStatus(bill, today, cycleEnd);
            expect(status).toBe('GHOSTED');
        });
    });

    describe('allocateFunds', () => {
        const today = new Date('2024-01-01');
        // Paycheck: 5000
        const income = 5000;

        const bills: Bill[] = [
            { id: 'b1', name: 'Rent', amount: '2000', dueDay: '5' }, // REQUIRED (Due Jan 5)
            { id: 'b2', name: 'Netflix', amount: '20', dueDay: '28' } // GHOSTED (Due Jan 28)
        ];

        const debts: Debt[] = [
            { id: 'd1', name: 'Visa', totalAmount: 1000, currentBalance: 500, minPayment: 50, apr: 20 },
            { id: 'd2', name: 'Car', totalAmount: 10000, currentBalance: 8000, minPayment: 300, apr: 5 }
        ];

        const funds: SinkingFund[] = [];

        it('prioritizes Required Bills -> Debt Mins -> Snowball', () => {
            const result = allocateFunds(
                income,
                bills,
                funds,
                debts,
                'bi-weekly',
                today,
                null,
                1000, 1000 // Satisfy EF so flow goes to Snowball
            );

            // 1. Bill (Rent): 2000 (Required)
            expect(result.billAllocations['b1']).toBe(2000);
            // 2. Bill (Netflix): 0 (Ghosted)
            expect(result.billAllocations['b2']).toBeUndefined();

            // 3. Debt Mins: 350 total
            expect(result.debtAllocations['d1']).toBeGreaterThanOrEqual(50);
            expect(result.debtAllocations['d2']).toBeGreaterThanOrEqual(300);

            // Remaining before Snowball: 5000 - 2000 - 350 = 2650
            // Snowball should target smallest debt (Visa - d1)
            // d1 Balance 500. Min 50. Needed 450.
            // Snowball allocates 450. Rolls over remaining 2200 to d2.
            expect(result.debtAllocations['d1']).toBe(500); // Capped at balance
            expect(result.debtAllocations['d2']).toBe(2500); // 300 min + 2200 rollover
            expect(result.snowballAmount).toBe(2650);
        });
    });

    describe('calculateSnowball', () => {
        let debts: Debt[];
        // Mock debts for isolation
        beforeEach(() => {
            debts = [
                { id: 'd2', name: 'Car', totalAmount: 10000, currentBalance: 5000, minPayment: 200, apr: 5 },
                { id: 'd1', name: 'Visa', totalAmount: 1000, currentBalance: 200, minPayment: 50, apr: 20 },
                { id: 'd3', name: 'Loan', totalAmount: 5000, currentBalance: 1000, minPayment: 100, apr: 8 }
            ];
        });

        it('should allocate all surplus to single debt if balance is high enough', () => {
            const surplus = 100;
            const { snowballAllocations } = calculateSnowball(surplus, debts, 0);

            // Should target d1 (smallest balance: 200)
            expect(snowballAllocations['d1']).toBe(100);
            expect(snowballAllocations['d2']).toBeUndefined();
        });

        it('should correctly roll over payments when a debt balance reaches zero', () => {
            const surplus = 500;
            // d1 balance is 200. Surplus 500.
            // Should pay off d1 (200), leaving 300.
            // Next smallest is d3 (1000). Should get remaining 300.

            const { snowballAllocations } = calculateSnowball(surplus, debts, 0);

            expect(snowballAllocations['d1']).toBe(200); // Capped at balance
            expect(snowballAllocations['d3']).toBe(300); // Rollover
            expect(snowballAllocations['d2']).toBeUndefined(); // Nothing for largest
        });
    });


    describe('Snowball Overpayment Integration', () => {
        it('should deduct already allocated amounts from balance to avoid overpayment', () => {
            const debts = [{ id: 'd1', name: 'Visa', totalAmount: 1000, currentBalance: 1000, minPayment: 50, apr: 20 }];
            const surplus = 2000;
            const alreadyAllocated = { 'd1': 50 };

            // Debt balance 1000. Already paid 50. Needed = 950.
            // Surplus 2000.
            // Expected Allocation = 950.

            const { snowballAllocations } = calculateSnowball(surplus, debts, 0, alreadyAllocated);
            expect(snowballAllocations['d1']).toBe(950);
        });
    });
});

