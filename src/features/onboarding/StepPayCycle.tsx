import React, { useState } from 'react';
import { useStore } from '../../store';

interface Props {
    onNext: () => void;
}

export const StepPayCycle: React.FC<Props> = ({ onNext }) => {
    const { settings, setSettings } = useStore();
    const [frequency, setFrequency] = useState(settings.payFrequency);
    const [nextDate, setNextDate] = useState(settings.nextPayDate ? new Date(settings.nextPayDate).toISOString().split('T')[0] : '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSettings({
            payFrequency: frequency,
            nextPayDate: nextDate ? new Date(nextDate) : null
        });
        onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">How often do you get paid?</label>
                <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly (Every 2 weeks)</option>
                    <option value="semi-monthly">Semi-Monthly (Twice a month)</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">When is your next paycheck?</label>
                <input
                    type="date"
                    required
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                    We will use this to calculate your budget cycles.
                </p>
            </div>

            <div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Next: Add Bills
                </button>
            </div>
        </form>
    );
};
