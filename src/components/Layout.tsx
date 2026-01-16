import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from './OfflineIndicator';
import { useDebtWatcher } from '../features/debt/useDebtWatcher';
import { Sidebar } from './Sidebar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useDebtWatcher();
    const location = useLocation();
    const isDashboard = location.pathname === '/';

    return (
        <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-gray-900 dark:text-white transition-colors duration-300 overflow-hidden fixed inset-0">
            <OfflineIndicator />

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <div className="hidden md:block h-full">
                <Sidebar variant="static" />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">

                {/* Scrollable Content - Conditional Scroll */}
                <div className={`flex-1 w-full ${isDashboard ? 'overflow-hidden' : 'overflow-y-auto'} overflow-x-hidden pb-24 md:pb-0 scroll-smooth`}>
                    <div className={`w-full ${isDashboard ? 'h-full' : 'max-w-7xl mx-auto'}`}>
                        {children}
                    </div>
                </div>

                {/* Mobile Bottom Nav (Hidden on Desktop) */}
                <div className="md:hidden">
                    <BottomNav />
                </div>
            </div>
        </div>
    );
};
