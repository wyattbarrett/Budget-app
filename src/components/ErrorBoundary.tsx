import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        // Optional: navigating to home might be safer, but just resetting state allows retry
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-center text-white font-sans">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="size-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-3xl">error_outline</span>
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-gray-400 text-sm mb-6">
                            The application encountered an unexpected error. We've logged this issue.
                        </p>

                        <div className="bg-black/20 rounded p-4 mb-6 text-left overflow-hidden">
                            <p className="font-mono text-xs text-red-300 break-words">
                                {this.state.error?.message || 'Unknown Error'}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReload}
                                className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Reload App
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-surface-highlight border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/5 transition-colors"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
