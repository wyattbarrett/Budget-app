import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const { settings } = useStore();

    if (!isOpen) return null;

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const navItems = [
        { label: 'Dashboard', icon: 'dashboard', path: '/' },
        { label: 'Budget', icon: 'account_balance_wallet', path: '/budget' },
        { label: 'Snowball', icon: 'ac_unit', path: '/snowball' },
        { label: 'Funds', icon: 'savings', path: '/funds' },
        { label: 'Reports', icon: 'pie_chart', path: '/reports' },
        { label: 'Settings', icon: 'settings', path: '/settings' },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Sidebar Content */}
            <div className="fixed inset-y-0 left-0 w-64 bg-surface-dark border-r border-white/10 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm truncate max-w-[120px]">{user?.email?.split('@')[0]}</h3>
                                <p className="text-gray-400 text-xs">Menu</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Nav Links */}
                    <div className="flex-1 py-4 overflow-y-auto">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 space-y-2">
                        <div className="px-4 py-2 bg-black/20 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">EF Goal</p>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white font-mono">${settings.currentEF}</span>
                                <span className="text-gray-500">/ ${settings.starterEFGoal}</span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full mt-2">
                                <div
                                    className="bg-emerald-500 h-full rounded-full"
                                    style={{ width: `${Math.min(100, (settings.currentEF / settings.starterEFGoal) * 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl transition-colors"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            <span className="font-bold text-sm">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
