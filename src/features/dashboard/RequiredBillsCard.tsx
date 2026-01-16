import React from 'react';
import { Bill, PendingAllocation } from '../../store';

interface RequiredBillsCardProps {
    activeBills: Bill[];
    pendingAllocation: PendingAllocation | null;
}

export const RequiredBillsCard: React.FC<RequiredBillsCardProps> = ({ activeBills, pendingAllocation }) => {
    return (
        <div className="space-y-3 flex-none pb-8">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest px-1">Funding Priorities (Required)</h3>

            {activeBills.length > 0 ? (
                activeBills.map(bill => (
                    <div key={bill.id} className="group flex flex-col gap-3 rounded-xl bg-surface-dark p-4 shadow-2xl border border-white/5 hover:border-primary/30 transition-colors">
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
                        <div className="relative h-3 w-full rounded-full bg-black/40 overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-glow-primary transition-all duration-500"
                                style={{ width: pendingAllocation ? `${(pendingAllocation.allocations[bill.id] / parseFloat(bill.amount)) * 100}%` : '0%' }}
                            ></div>
                        </div>
                    </div>
                ))
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-surface-dark border border-white/5 border-dashed">
                    <div className="size-20 rounded-full bg-surface-highlight/20 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-4xl">spa</span>
                    </div>
                    <h3 className="text-white font-bold text-lg">Financial Peace</h3>
                    <p className="text-gray-400 text-sm mt-1 max-w-xs text-center">Your required bills for this cycle are fully paid or invalid. Enjoy the momentum!</p>
                </div>
            )}
        </div>
    );
};
