import React from 'react';
import { Bill } from '../../store';
import { AlertTriangle, Check, Lock } from 'lucide-react';

interface Props {
    bill: Bill;
    isDue: boolean;
    allocation?: number;
}

export const BillCard: React.FC<Props> = ({ bill, isDue, allocation = 0 }) => {
    const amount = parseFloat(bill.amount);
    const isFullyFunded = allocation >= amount;
    const isUnderfunded = isDue && !isFullyFunded;

    return (
        <div className={`
        relative p-4 rounded-xl border transition-all duration-200
        ${!isDue ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-sm'}
        ${isUnderfunded ? 'border-red-300 bg-red-50' : ''}
        ${isFullyFunded && isDue ? 'border-green-200 bg-green-50' : ''}
    `}>
            <div className="flex justify-between items-center mb-2">
                <h3 className={`font-semibold ${isUnderfunded ? 'text-red-700' : 'text-gray-800'}`}>
                    {bill.name}
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Due {bill.dueDay}
                </span>
            </div>

            <div className="flex justify-between items-end">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Target</p>
                    <p className="text-lg font-bold text-gray-900">${amount.toFixed(2)}</p>
                </div>

                {isDue && (
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Allocated</p>
                        <div className="flex items-center gap-1 justify-end">
                            <p className={`text-xl font-bold ${isFullyFunded ? 'text-green-600' : isUnderfunded ? 'text-red-600' : 'text-blue-600'}`}>
                                ${allocation.toFixed(2)}
                            </p>
                            {isFullyFunded && <Check className="w-4 h-4 text-green-600" />}
                            {isUnderfunded && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        </div>
                    </div>
                )}

                {!isDue && (
                    <div className="text-right text-gray-400 flex items-center gap-1">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm">Not Due</span>
                    </div>
                )}
            </div>

            {/* Progress Bar for funded bills */}
            {isDue && (
                <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-1.5 rounded-full ${isFullyFunded ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min((allocation / amount) * 100, 100)}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};
