import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './features/auth/Login';
import { OnboardingLayout } from './features/onboarding/OnboardingLayout';
import { Dashboard } from './features/dashboard/Dashboard';
import { Settings } from './features/settings/Settings';
import { Budget } from './features/budget/Budget';
import { Funds } from './features/funds/Funds';
import { Reports } from './features/reports/Reports';
import { Layout } from './components/Layout';
import { DebtSnowball } from './features/debt/DebtSnowball';
import { History } from './features/reports/History';

/**
 * Protects routes that require authentication.
 * Redirects to /login if the user is not authenticated.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The child components to render if authenticated
 * @returns {JSX.Element} The protected content or a redirect
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white">Loading...</div>;

    if (!user) return <Navigate to="/login" replace />;

    return <>{children}</>;
}

import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ClientUpdateManager } from './components/ClientUpdateManager';

/**
 * Root component of the application.
 * Handles routing, authentication context, and theme providers.
 *
 * @returns {JSX.Element} The rendered application
 */
function App() {
    return (
        <AuthProvider>
            <ClientUpdateManager />
            <ThemeProvider>
                <Router>
                    <div className="h-screen overflow-hidden bg-background-light dark:bg-background-dark font-sans text-gray-900 dark:text-white transition-colors duration-300">
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            <Route path="/" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <ErrorBoundary>
                                            <Dashboard />
                                        </ErrorBoundary>
                                    </Layout>
                                </ProtectedRoute>
                            } />

                            <Route path="/settings" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <ErrorBoundary>
                                            <Settings />
                                        </ErrorBoundary>
                                    </Layout>
                                </ProtectedRoute>
                            } />

                            <Route path="/funds" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <ErrorBoundary>
                                            <Funds />
                                        </ErrorBoundary>
                                    </Layout>
                                </ProtectedRoute>
                            } />

                            <Route path="/onboarding/*" element={
                                <ProtectedRoute>
                                    <OnboardingLayout />
                                </ProtectedRoute>
                            } />

                            <Route path="/snowball" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <ErrorBoundary>
                                            <DebtSnowball />
                                        </ErrorBoundary>
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            {/* Placeholder routes for Nav items */}
                            <Route path="/budget" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <ErrorBoundary>
                                            <Budget />
                                        </ErrorBoundary>
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/reports/history" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <ErrorBoundary>
                                            <History />
                                        </ErrorBoundary>
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/reports" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <ErrorBoundary>
                                            <Reports />
                                        </ErrorBoundary>
                                    </Layout>
                                </ProtectedRoute>
                            } />

                        </Routes>
                    </div>
                </Router>
            </ThemeProvider>
        </AuthProvider>
    )
}

export default App
