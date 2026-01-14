import React from 'react';

interface PayoffCelebrationProps {
    isOpen: boolean;
    onClose: () => void;
    debtName: string;
    amountCleared: number; // e.g., the min payment that is now freed up
    newSnowballPower: number; // The new total snowball amount
    nextTargetName?: string;
}

export const PayoffCelebration: React.FC<PayoffCelebrationProps> = ({
    isOpen,
    onClose,
    debtName,
    amountCleared,
    newSnowballPower,
    nextTargetName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[80] animate-in zoom-in-90 duration-500">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Simulated golden sparkles/confetti */}
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDuration: `${1 + Math.random()}s`,
                            opacity: Math.random()
                        }}
                    ></div>
                ))}
            </div>

            <div className="bg-surface-dark border border-emerald-500/30 rounded-3xl max-w-sm w-full p-8 text-center relative overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Header */}
                <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm mb-6">Victory!</h2>

                {/* Card Animation (Implied) */}
                <div className="mx-auto size-32 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-2xl mb-6 relative group">
                    <span className="material-symbols-outlined text-6xl text-white">ac_unit</span>

                    {/* Broken Chains / Strikethrough effect */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-1 bg-red-500 rotate-45 transform scale-x-0 group-hover:scale-x-110 transition-transform duration-700 origin-center"></div>
                    </div>
                </div>

                <h1 className="text-3xl font-display font-bold text-white mb-2">
                    {debtName} is <span className="text-emerald-500 italic">GONE!</span>
                </h1>

                <p className="text-gray-400 text-sm mb-6">
                    That's another one down. Your <span className="text-white font-bold">${amountCleared}</span> payment is now officially part of your <span className="text-emerald-400 font-bold">Snowball Power</span>.
                </p>

                {/* New Power Stats */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-emerald-400">bolt</span>
                        <span className="text-xs font-bold text-emerald-400 uppercase">New Snowball Power</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        +${newSnowballPower}<span className="text-sm font-normal text-gray-400">/mo</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-bold bg-emerald-500/20 inline-block px-2 py-0.5 rounded-full">
                        +15% SPEED BOOST
                    </div>
                </div>

                {nextTargetName && (
                    <div className="mb-6">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Next Target</p>
                        <div className="bg-surface-dark border border-white/10 p-3 rounded-lg flex items-center justify-between">
                            <span className="text-white font-bold">{nextTargetName}</span>
                            <span className="text-xs text-gray-500">4 Months Saved</span>
                        </div>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    <span>CONTINUE THE FIGHT</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};
