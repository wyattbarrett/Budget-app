import React, { useState } from 'react';
import { Plus, Trash } from 'lucide-react';

interface Bill {
    id: string;
    name: string;
    amount: string;
    dueDay: string;
}

interface Props {
    onFinish: () => void;
    onBack: () => void;
}

export const StepInitialBills: React.FC<Props> = ({ onFinish, onBack }) => {
    const [bills, setBills] = useState<Bill[]>([
        { id: '1', name: 'Rent/Mortgage', amount: '', dueDay: '1' }
    ]);

    const addBill = () => {
        setBills([...bills, { id: Math.random().toString(), name: '', amount: '', dueDay: '1' }]);
    };

    const removeBill = (id: string) => {
        setBills(bills.filter(b => b.id !== id));
    };

    const updateBill = (id: string, field: keyof Bill, value: string) => {
        setBills(bills.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Saving bills:", bills);
        // TODO: Save to global store or Firestore
        onFinish();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {bills.map((bill) => (
                    <div key={bill.id} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500">Bill Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Electric"
                                value={bill.name}
                                onChange={(e) => updateBill(bill.id, 'name', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md text-sm border p-1"
                            />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-gray-500">Amount</label>
                            <input
                                type="number"
                                required
                                placeholder="0.00"
                                value={bill.amount}
                                onChange={(e) => updateBill(bill.id, 'amount', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md text-sm border p-1"
                            />
                        </div>
                        <div className="w-16">
                            <label className="block text-xs font-medium text-gray-500">Due Day</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                required
                                value={bill.dueDay}
                                onChange={(e) => updateBill(bill.id, 'dueDay', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md text-sm border p-1"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeBill(bill.id)}
                            className="mt-6 text-red-500 hover:text-red-700"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addBill}
                className="w-full flex items-center justify-center py-2 border-2 border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50"
            >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Bill
            </button>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    Back
                </button>
                <button
                    type="submit"
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Finish Setup
                </button>
            </div>
        </form>
    );
};
