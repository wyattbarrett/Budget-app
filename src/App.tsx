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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white">Loading...</div>;

    if (!user) return <Navigate to="/login" replace />;

    return <>{children}</>;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-background-dark font-sans text-white">
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route path="/" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="/settings" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Settings />
                                </Layout>
                            </ProtectedRoute>
                        } />

                        <Route path="/funds" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Funds />
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
                                    <DebtSnowball />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        {/* Placeholder routes for Nav items */}
                        <Route path="/budget" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Budget />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/reports/history" element={
                            <ProtectedRoute>
                                <Layout>
                                    <History />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/reports" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Reports />
                                </Layout>
                            </ProtectedRoute>
                        } />

                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    )
}

export default App
