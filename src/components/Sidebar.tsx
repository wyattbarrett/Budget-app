import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    variant?: 'drawer' | 'static';
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose = () => { }, variant = 'drawer' }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    if (variant === 'drawer' && !isOpen) return null;

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

    const content = (
        <div className={`flex flex-col h-full bg-surface-dark border-r border-white/10 ${variant === 'drawer' ? 'fixed inset-y-0 left-0 w-64 shadow-2xl z-[70]' : 'w-72 h-full'}`}>
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
                {variant === 'drawer' && (
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}
            </div>

            {/* Nav Links */}
            <div className="flex-1 py-4 overflow-y-auto min-h-0">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => {
                            navigate(item.path);
                            if (onClose) onClose();
                        }}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 space-y-2 mt-auto">
                {/* Theme Toggle */}
                <div className="px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Appearance</span>
                    <button
                        onClick={toggleTheme}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-dark ${theme === 'dark' ? 'bg-primary' : 'bg-gray-600'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
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
    );

    if (variant === 'static') return content;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>
            {content}
        </>
    );
};
