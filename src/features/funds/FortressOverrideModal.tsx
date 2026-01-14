import React, { useState } from 'react';

interface FortressOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUnlock: () => void;
}

export const FortressOverrideModal: React.FC<FortressOverrideModalProps> = ({ isOpen, onClose, onUnlock }) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = () => {
        if (inputValue === 'EMERGENCY') {
            onUnlock();
            setInputValue('');
            setError(false);
            onClose();
        } else {
            setError(true);
            setInputValue(''); // Clear for dramatic effect
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
            <div className="bg-surface-dark border border-red-500/30 rounded-3xl max-w-sm w-full p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]">

                {/* Warning Icon */}
                <div className="mx-auto size-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-glow-danger">
                    <span className="material-symbols-outlined text-red-500 text-4xl">warning</span>
                </div>

                <h2 className="text-2xl font-display font-bold text-white mb-2">IS THIS A TRUE <span className="text-red-500">EMERGENCY?</span></h2>

                <div className="my-6 bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Untouchable Protocol</span>
                        <div className="w-8 h-4 bg-red-500/20 rounded-full relative">
                            <div className="absolute right-0.5 top-0.5 size-3 bg-red-500 rounded-full shadow-sm"></div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        You are attempting to access your <strong className="text-white">Fortress Funds</strong>. This action breaks your savings streak immediately.
                    </p>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] uppercase font-bold text-red-500 tracking-widest animate-pulse">Confirmation Required • Awaiting Input</p>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value.toUpperCase());
                            setError(false);
                        }}
                        placeholder="TYPE 'EMERGENCY'"
                        className={`w-full bg-black/40 border-2 ${error ? 'border-red-500 animate-shake' : 'border-white/10 focus:border-red-500'} rounded-xl py-4 text-center font-mono text-xl tracking-[0.2em] text-white placeholder-white/20 outline-none transition-all`}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={inputValue !== 'EMERGENCY'}
                        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined">lock_open</span>
                        <span>UNLOCK FUNDS</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
                    >
                        Cancel - Keep Funds Safe
                    </button>
                </div>
            </div>
        </div>
    );
};
