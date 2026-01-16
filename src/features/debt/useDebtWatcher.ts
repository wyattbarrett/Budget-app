import { useEffect, useRef } from 'react';
import { useStore, Debt } from '../../store';
import confetti from 'canvas-confetti';

export const useDebtWatcher = () => {
    // Keep track of previous debts to detect changes
    const previousDebtsRef = useRef<Debt[]>([]);

    useEffect(() => {
        // Initial sync
        previousDebtsRef.current = useStore.getState().debts;

        // Subscribe to store changes
        const unsubscribe = useStore.subscribe((state) => {
            const currentDebts = state.debts;

            // Note: subscribing to (state, prevState) is supported in some middleware/versions 
            // but standard zustand subscribe(selector) or subscribe(callback) receives the whole state.
            // Let's rely on our Ref for robust diffing if prevState isn't reliably available or if using transient updates.
            // Actually, vanilla `subscribe(listener)` gives `(state, prevState)`.

            // Diffing Logic
            currentDebts.forEach(currentDebt => {
                const prevDebt = previousDebtsRef.current.find(d => d.id === currentDebt.id);

                // Check if this debt just hit 0
                if (prevDebt && prevDebt.currentBalance > 0 && currentDebt.currentBalance === 0) {
                    // It was paid off!
                    handleDebtPaid(currentDebt);
                }
            });

            // Check for newly added debts? No, only payoffs.

            // Update ref
            previousDebtsRef.current = currentDebts;
        });

        return () => unsubscribe();
    }, []);

    const handleDebtPaid = (debt: Debt) => {
        // 1. Celebration
        triggerConfetti();

        // 2. Automation: Capture min payment for snowball
        // We only add it if it hasn't been recycled yet? 
        // The prompt implies "When a debt is marked 'Paid,' automatically capture its minimumPayment".
        // Assuming we just add it once.
        if (debt.minPayment > 0) {
            console.log(`[Debt Watcher] Recycling $${debt.minPayment} from ${debt.name}`);
            useStore.getState().recycleDebtPayment(debt.minPayment);
        }

        // 3. Cleanup: Remove the debt
        // We defer this slightly to ensure UI updates aren't jarred immediately? 
        // No, instant is fine, confetti covers it.
        useStore.getState().removeDebt(debt.id);
    };

    const triggerConfetti = () => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio: number, opts: any) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
                colors: ['#2dd4bf', '#10b981', '#34d399', '#ffffff'] // Emerald and White
            });
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        fire(0.2, {
            spread: 60,
        });
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    };
};
