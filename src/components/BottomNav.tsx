import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/', icon: 'dashboard', label: 'Magic' },
        { path: '/budget', icon: 'account_balance_wallet', label: 'Budget' },
        { path: '/snowball', icon: 'ac_unit', label: 'Snowball' },
        { path: '/funds', icon: 'savings', label: 'Funds' },
        { path: '/reports', icon: 'pie_chart', label: 'Reports' },
        { path: '/settings', icon: 'settings', label: 'Settings' },
    ];

    return (
        <nav className="fixed bottom-0 w-full bg-surface-dark/95 backdrop-blur-lg border-t border-white/5 pb-safe z-40">
            <div className="flex items-center justify-between px-2 h-[88px] max-w-lg mx-auto w-full">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="flex flex-1 flex-col items-center justify-center gap-1 group py-2"
                        >
                            <span
                                className={clsx(
                                    "material-symbols-outlined text-[24px] transition-all duration-300",
                                    active ? "text-primary bg-primary/10 px-4 py-1 rounded-full scale-105" : "text-gray-500 group-hover:text-white"
                                )}
                            >
                                {item.icon}
                            </span>
                            <span
                                className={clsx(
                                    "text-[10px] font-medium transition-colors hidden sm:block",
                                    active ? "text-primary font-bold" : "text-gray-500 group-hover:text-white"
                                )}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
