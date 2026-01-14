import React, { useState, useEffect } from 'react';

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-xs font-bold font-mono py-1 px-4 text-center tracking-wider uppercase animate-pulse">
            <span className="material-symbols-outlined text-xs align-middle mr-2">wifi_off</span>
            Offline Mode • Changes saved locally
        </div>
    );
};
