import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { useAuth } from '../../context/AuthContext';
import { analyzeMonth, MonthlyAnalysis } from './analysisLogic';
import { CircularProgress } from '../../components/CircularProgress';
import { Link } from 'react-router-dom';

export const Reports: React.FC = () => {
    const { user } = useAuth();
    const { sinkingFunds } = useStore();
    const [analysis, setAnalysis] = useState<MonthlyAnalysis | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!user) return;
            try {
                // Analyze current month for demo
                const result = await analyzeMonth(user.uid, new Date(), sinkingFunds);
                setAnalysis(result);
            } catch (error) {
                console.error("Failed to analyze", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [user, sinkingFunds]);

    if (loading) return <div className="p-8 text-center text-gray-500">Generating Report...</div>;
    if (!analysis) return <div className="p-8 text-center text-gray-500">No data available.</div>;

    return (
        <div className="min-h-screen bg-background-dark p-4 pb-24 font-sans text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pt-2">
                <Link to="/" className="p-2 rounded-full bg-surface-dark border border-white/5 text-gray-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div className="text-center">
                    <h1 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Monthly Wrap-up</h1>
                    <h2 className="text-xl font-bold text-white">{analysis.month}</h2>
                </div>
                <Link to="/reports/history" className="p-2 rounded-full bg-surface-dark border border-white/5 text-gray-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">history</span>
                </Link>
            </div>

            {/* Accuracy Card */}
            <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 mb-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent pointer-events-none"></div>
                <h3 className="text-lg font-bold text-white mb-6 bg-transparent">November Accuracy</h3>

                <div className="scale-125 mb-4 relative">
                    <CircularProgress
                        percentage={analysis.accuracyScore}
                        size={180}
                        strokeWidth={12}
                        color={analysis.accuracyScore > 80 ? '#10B981' : '#F59E0B'}
                        showText={false}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                        <span className="text-5xl font-bold text-white tracking-tighter">{analysis.accuracyScore}%</span>
                        <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${analysis.accuracyScore > 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                            <span className="material-symbols-outlined text-xs">
                                {analysis.accuracyScore > 80 ? 'check_circle' : 'warning'}
                            </span>
                            {analysis.accuracyScore > 80 ? 'On Track' : 'Needs Review'}
                        </div>
                    </div>
                </div>

                <p className="text-center text-gray-400 text-sm max-w-[200px] leading-relaxed">
                    {analysis.accuracyScore > 80
                        ? "You stayed within range for most categories. A solid month of disciplined spending!"
                        : "Detailed planning needed. Several reallocations occurred this month."
                    }
                </p>
            </div>

            {/* Top Reallocations */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <span className="material-symbols-outlined text-gray-400 -rotate-90">alt_route</span>
                    <h3 className="font-bold text-white">Top Reallocations</h3>
                </div>

                <div className="bg-surface-dark border border-white/5 rounded-2xl p-2 space-y-2">
                    {analysis.reallocations.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">No reallocations this month. Great planning!</div>
                    ) : (
                        analysis.reallocations.map(re => (
                            <div key={re.id} className="p-4 rounded-xl bg-white/2 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-surface-highlight flex items-center justify-center text-gray-300">
                                        <span className="material-symbols-outlined">
                                            {/* Simple icon mapping based on common names */}
                                            {re.sourceName.includes('Dining') ? 'restaurant' :
                                                re.sourceName.includes('Cloth') ? 'checkroom' : 'savings'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                                            <span>{re.sourceName}</span>
                                            <span className="material-symbols-outlined text-xs text-gray-500">arrow_forward</span>
                                            <span className="text-emerald-400">{re.targetName}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{re.reason || 'Reallocated funds'}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-white">${re.amount}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Calibration */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">tune</span>
                        <h3 className="font-bold text-white">Calibration</h3>
                    </div>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 uppercase">Suggested Tweaks</span>
                </div>

                <div className="space-y-3">
                    {analysis.suggestions.map(sugg => (
                        <div key={sugg.id} className="bg-surface-dark border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                                    <span className="material-symbols-outlined">
                                        {sugg.fundName.includes('Groc') ? 'shopping_cart' : 'movie'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{sugg.fundName}</h4>
                                    <p className="text-xs text-gray-500">{sugg.reason}</p>
                                </div>
                            </div>

                            <button className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors ${sugg.type === 'increase'
                                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}>
                                {sugg.type === 'increase' ? `Add $${sugg.amount}` : `Reduce $${sugg.amount}`}
                                <span className="material-symbols-outlined text-[14px]">
                                    {sugg.type === 'increase' ? 'add_circle' : 'remove_circle'}
                                </span>
                            </button>
                        </div>
                    ))}
                    {analysis.suggestions.length === 0 && (
                        <div className="p-6 text-center text-gray-500 text-sm bg-surface-dark border border-white/5 rounded-2xl">
                            No calibration needed. Your budget is optimized!
                        </div>
                    )}
                </div>
            </div>

            {/* Launch CTA */}
            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                <span className="material-symbols-outlined">rocket_launch</span>
                <span>Launch Next Month's Plan</span>
            </button>

        </div>
    );
};
