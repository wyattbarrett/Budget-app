import React from 'react';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from './OfflineIndicator';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex flex-col h-screen max-w-md mx-auto relative bg-background-dark shadow-2xl overflow-hidden">
            <OfflineIndicator />
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 no-scrollbar">
                {children}
            </div>
            <BottomNav />
        </div>
    );
};
