import React from 'react';

interface FortressCelebrationProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
}

export const FortressCelebration: React.FC<FortressCelebrationProps> = ({ isOpen, onClose, amount }) => {
    // Simple CSS confetti logic or similar visual if no lib.
    // For this environment, I'll simulate "Confetti" with simple CSS particles in the background.

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[70] animate-in zoom-in-90 duration-500 overflow-hidden">

            {/* Background Particles (Simulated Confetti) */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-emerald-400 rounded-sm animate-confetti"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `-10%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${3 + Math.random() * 2}s`,
                            backgroundColor: ['#10B981', '#34D399', '#FBBF24', '#ffffff'][Math.floor(Math.random() * 4)]
                        }}
                    ></div>
                ))}
            </div>

            <div className="text-center relative z-10 p-6 max-w-md w-full">

                {/* Badge */}
                <div className="mx-auto size-40 relative mb-8 animate-bounce-slow">
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 rounded-full size-full border-4 border-amber-300 shadow-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-6xl text-white drop-shadow-md">shield_lock</span>
                        {/* Shine effect */}
                        <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                    </div>
                    {/* Floating stars */}
                    <div className="absolute -top-2 -right-2 text-yellow-300 text-4xl animate-spin-slow">✦</div>
                    <div className="absolute bottom-4 -left-4 text-yellow-300 text-2xl animate-ping-slow">★</div>
                </div>

                <h2 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">Milestone 1 Reached!</h2>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                    You have a <span className="text-emerald-400 font-bold">${amount.toLocaleString()}</span> safety net.<br />
                    That's real peace of mind.
                </p>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400">history</span>
                    <span className="text-sm font-bold text-gray-300">BUILT IN 5 PAYCHECKS</span>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    <span className="material-symbols-outlined">lock</span>
                    <span>SECURE THE FORTRESS</span>
                </button>
                <p className="text-xs text-gray-500 mt-4 uppercase tracking-widest cursor-pointer hover:text-white" onClick={onClose}>Tap to claim your achievement</p>
            </div>

            <style>{`
                @keyframes confetti {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .animate-confetti {
                    animation-name: confetti;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                .animate-bounce-slow {
                    animation: bounce 3s infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(-5%); }
                    50% { transform: translateY(5%); }
                }
            `}</style>
        </div>
    );
};
