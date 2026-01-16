import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function ClientUpdateManager() {
    // Log current version for debugging
    if (import.meta.env.MODE === 'production') {
        console.log(`Running App Version: ${__APP_VERSION__}`);
    }

    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            console.log('SW Registered: ' + r);
            if (r) {
                // Check for updates every minute
                setInterval(() => {
                    console.log('Checking for SW update...');
                    r.update();
                }, 60 * 1000);
            }
        },
    });

    useEffect(() => {
        if (needRefresh) {
            console.log('New content available, forcing reload...');
            updateServiceWorker(true);
        }
    }, [needRefresh, updateServiceWorker]);

    return null;
}
