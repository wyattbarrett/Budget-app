import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { FortressOverrideModal } from './FortressOverrideModal';
import { FortressCelebration } from './FortressCelebration';

interface EmergencyFundFortressProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EmergencyFundFortress: React.FC<EmergencyFundFortressProps> = ({ isOpen, onClose }) => {
    const { settings, setSettings } = useStore();

    // State
    const [locked, setLocked] = useState(settings.emergencyFundLocked ?? true);
    const [showOverride, setShowOverride] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // Sync store
    useEffect(() => {
        setSettings({ emergencyFundLocked: locked });
    }, [locked, setSettings]);

    // Celebration Trigger (Mock logic: if exact goal reached/passed this session)
    // For MVP, just showing it if exact match or passed, simplistic.
    // In real app, flag "celebrated" in DB.

    const percentage = Math.min((settings.currentEF / settings.starterEFGoal) * 100, 100);

    const handleUnlockAttempt = () => {
        if (locked) {
            setShowOverride(true);
        } else {
            setLocked(true); // Can always re-lock easily
        }
    };

    const handleOverrideSuccess = () => {
        setLocked(false);
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0a0f1c] z-50 flex flex-col font-sans animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-6 flex justify-between items-start">
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="text-center">
                    <p className="text-[10px] items-center justify-center font-bold tracking-[0.2em] text-gray-500 uppercase flex gap-1 mb-1">
                        Priority Zero
                    </p>
                    <h1 className="text-xl font-bold text-white">Emergency Fund</h1>
                    <p className="text-emerald-400 text-xs font-medium shadow-glow-emerald">Fortress</p>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 text-xs font-bold hover:text-white">
                    CLOSE
                </button>
            </div>

            {/* Liquid Vault Visualization */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* Outer Ring */}
                <div className="size-72 rounded-full border border-white/5 flex items-center justify-center relative shadow-2xl">
                    {/* Glowing Track */}
                    <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>

                    {/* Liquid Fill (CSS Gradient Mask or similar, simplified here as Circle) */}
                    <div
                        className="size-64 rounded-full bg-gradient-to-t from-emerald-600 to-emerald-400 relative overflow-hidden transition-all duration-1000 flex items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.3)]"
                        style={{
                            clipPath: `inset(${100 - percentage}% 0 0 0)`
                        }}
                    >
                        {/* Wave effect could go here */}
                    </div>

                    {/* Lock Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className={`size-20 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center transition-all duration-500 ${locked ? 'opacity-100' : 'opacity-0 scale-75'}`}>
                            <span className="material-symbols-outlined text-4xl text-white">lock</span>
                        </div>
                    </div>
                </div>

                {/* Amount Display */}
                <div className="mt-8 text-center relative z-20">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current Balance</p>
                    <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-display font-bold text-emerald-400 drop-shadow-lg">${settings.currentEF.toLocaleString()}</span>
                        <span className="text-xl text-gray-600 font-medium">/ ${settings.starterEFGoal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="p-6 space-y-4 pb-12">

                {/* Level Card */}
                <div className="bg-surface-dark border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-emerald-500 text-sm">shield</span>
                            <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Fortress Secured</span>
                        </div>
                        <h3 className="text-white font-bold text-sm">Level 1: Starter Fund</h3>
                        <p className="text-gray-500 text-xs">Complete & Protected</p>
                    </div>

                    <div className="size-10 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shadow-glow-emerald">
                        <span className="material-symbols-outlined">check</span>
                    </div>
                </div>

                {/* Withdrawal / Lock Control */}
                <div className="bg-surface-dark border border-white/10 rounded-2xl p-1 relative overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <h3 className="text-white font-bold text-sm">Withdrawal Access</h3>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${locked ? 'text-emerald-500' : 'text-red-500'}`}>
                                Status: {locked ? 'Untouchable' : 'Unlocked'}
                            </p>
                        </div>
                        <button
                            onClick={handleUnlockAttempt}
                            className={`w-14 h-8 rounded-full transition-colors relative ${locked ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
                        >
                            <div className={`absolute top-1 size-6 rounded-full shadow-sm transition-all duration-300 flex items-center justify-center ${locked ? 'left-7 bg-emerald-500' : 'left-1 bg-red-500'}`}>
                                <span className="material-symbols-outlined text-[14px] text-white">
                                    {locked ? 'lock' : 'lock_open'}
                                </span>
                            </div>
                        </button>
                    </div>

                    {/* System Info Bar */}
                    <div className="bg-black/40 py-2 px-4 flex justify-between items-center border-t border-white/5">
                        <span className="text-[10px] font-mono text-gray-600 uppercase">SYS.LOCK.V4.2</span>
                        <div className="flex items-center gap-1.5">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-mono text-gray-500 uppercase">Active</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-dark border border-white/5 rounded-xl p-3 text-center">
                        <span className="block text-[10px] text-gray-500 uppercase font-bold">Interest Rate</span>
                        <span className="block text-white font-bold text-lg">4.25% APY</span>
                    </div>
                    <div className="bg-surface-dark border border-white/5 rounded-xl p-3 text-center">
                        <span className="block text-[10px] text-gray-500 uppercase font-bold">Last Deposit</span>
                        <span className="block text-emerald-400 font-bold text-lg">+$250.00</span>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <FortressOverrideModal
                isOpen={showOverride}
                onClose={() => setShowOverride(false)}
                onUnlock={handleOverrideSuccess}
            />

            <FortressCelebration
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                amount={settings.currentEF}
            />

        </div>
    );
};
