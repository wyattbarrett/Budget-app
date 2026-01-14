import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../store';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { getAuth, deleteUser } from 'firebase/auth';

interface Collaborator {
    email: string;
    role: string;
    addedAt: Date;
}

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const { settings, setSettings } = useStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'sharing' | 'danger'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Profile State
    const [profileData, setProfileData] = useState({
        displayName: settings.displayName || '',
        primaryCurrency: settings.primaryCurrency || 'USD',
        payFrequency: settings.payFrequency,
        nextPayDate: settings.nextPayDate ? format(new Date(settings.nextPayDate), 'yyyy-MM-dd') : '',
        starterEFGoal: settings.starterEFGoal
    });

    // Sharing State
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);

    // Delete Account State
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadSettings = async () => {
            if (user) {
                const docRef = doc(db, 'users', user.uid, 'settings', 'general');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as any;
                    setSettings({
                        ...data,
                        nextPayDate: data.nextPayDate ? data.nextPayDate.toDate() : null,
                    });
                    setProfileData({
                        displayName: data.displayName || '',
                        primaryCurrency: data.primaryCurrency || 'USD',
                        payFrequency: data.payFrequency,
                        nextPayDate: data.nextPayDate ? format(data.nextPayDate.toDate(), 'yyyy-MM-dd') : '',
                        starterEFGoal: data.starterEFGoal
                    });
                }
                loadCollaborators();
            }
        };
        loadSettings();
    }, [user, setSettings]);

    const loadCollaborators = async () => {
        if (!user) return;
        try {
            const snap = await getDocs(collection(db, 'users', user.uid, 'collaborators'));
            const cols = snap.docs.map(d => ({
                email: d.id, // ID is email
                ...d.data(),
                addedAt: d.data().addedAt?.toDate()
            })) as Collaborator[];
            setCollaborators(cols);
        } catch (error) {
            console.error("Error loading collaborators", error);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsLoading(true);
        setMessage('');

        try {
            const nextPayDateDate = profileData.nextPayDate ? new Date(profileData.nextPayDate) : null;
            if (nextPayDateDate) nextPayDateDate.setHours(12, 0, 0, 0);

            const newSettings = {
                displayName: profileData.displayName,
                primaryCurrency: profileData.primaryCurrency,
                payFrequency: profileData.payFrequency,
                nextPayDate: nextPayDateDate,
                starterEFGoal: Number(profileData.starterEFGoal)
            };

            await setDoc(doc(db, 'users', user.uid, 'settings', 'general'), {
                ...newSettings,
                currentEF: settings.currentEF
            }, { merge: true });

            setSettings(newSettings);
            setMessage('Profile saved successfully!');
        } catch (error) {
            console.error(error);
            setMessage('Error saving profile.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!user || !inviteEmail) return;
        setInviteLoading(true);
        try {
            // Sanitize email as doc ID? Firestore doc IDs can contain special chars but good practice to trim
            const emailId = inviteEmail.trim().toLowerCase();
            await setDoc(doc(db, 'users', user.uid, 'collaborators', emailId), {
                role: 'editor',
                addedAt: Timestamp.now()
            });
            setInviteEmail('');
            loadCollaborators();
        } catch (error) {
            console.error("Error adding collaborator", error);
            alert("Failed to invite user.");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRevoke = async (email: string) => {
        if (!user) return;
        if (!confirm(`Remove ${email}?`)) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'collaborators', email));
            loadCollaborators();
        } catch (error) {
            console.error("Error removing collaborator", error);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || deleteConfirm !== 'DELETE') return;
        setIsDeleting(true);
        try {
            // 1. Delete Subcollections (Manual loop as recursive delete is admin only usually, or requires cloud function)
            // For MVP client-side, we try our best.
            const collections = ['bills', 'sinkingFunds', 'collaborators', 'paycheck_history'];
            for (const col of collections) {
                const snap = await getDocs(collection(db, 'users', user.uid, col));
                const promises = snap.docs.map(d => deleteDoc(d.ref));
                await Promise.all(promises);
            }

            // 2. Delete Settings
            await deleteDoc(doc(db, 'users', user.uid, 'settings', 'general'));

            // 3. Delete User Doc
            await deleteDoc(doc(db, 'users', user.uid));

            // 4. Delete Auth
            const auth = getAuth();
            if (auth.currentUser) {
                await deleteUser(auth.currentUser);
            }

            // 5. Cleanup Store
            localStorage.clear();
            window.location.href = '/'; // Hard reload to clear everything
        } catch (error: any) {
            console.error("Delete failed", error);
            alert("Delete failed: " + error.message);
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 pb-32 max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-white mb-2">Account & Settings</h1>

            {/* Tabs */}
            <div className="flex p-1 bg-surface-dark/50 border border-white/5 rounded-xl">
                {(['profile', 'sharing', 'danger'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === tab
                            ? 'bg-primary text-white shadow-lg'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab === 'profile' ? 'Profile' : tab === 'sharing' ? 'Sharing' : 'Danger Zone'}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold border border-primary/30">
                                {user?.email?.[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Signed in as</p>
                                <p className="text-white font-medium">{user?.email}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Joined: {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                                <input
                                    type="text"
                                    value={profileData.displayName}
                                    onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                                    placeholder="Enter your name"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Primary Currency</label>
                                <select
                                    value={profileData.primaryCurrency}
                                    onChange={e => setProfileData({ ...profileData, primaryCurrency: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CAD">CAD ($)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500">payments</span>
                            Budget Configuration
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pay Frequency</label>
                                <select
                                    value={profileData.payFrequency}
                                    onChange={e => setProfileData({ ...profileData, payFrequency: e.target.value as any })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="bi-weekly">Bi-Weekly</option>
                                    <option value="semi-monthly">Semi-Monthly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Next Pay Date</label>
                                <input
                                    type="date"
                                    value={profileData.nextPayDate}
                                    onChange={e => setProfileData({ ...profileData, nextPayDate: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Emergency Fund Goal</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={profileData.starterEFGoal}
                                        onChange={e => setProfileData({ ...profileData, starterEFGoal: Number(e.target.value) })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 pl-8 text-white focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    {message && <p className="text-center text-emerald-400 font-bold text-sm">{message}</p>}
                </div>
            )}

            {/* Sharing Tab */}
            {activeTab === 'sharing' && (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-2">Collaborators</h3>
                        <p className="text-gray-400 text-xs mb-6">People listed here have full <strong>Read & Write</strong> access to your budget. They can modify allocations, edit categories, and delete transactions.</p>

                        <div className="flex gap-2 mb-6">
                            <input
                                type="email"
                                placeholder="friend@example.com"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
                            />
                            <button
                                onClick={handleInvite}
                                disabled={!inviteEmail || inviteLoading}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {inviteLoading ? '...' : 'Invite'}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {collaborators.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-xl">
                                    <span className="material-symbols-outlined text-gray-600 text-4xl mb-2">group_off</span>
                                    <p className="text-gray-500 text-sm">You haven't shared your budget yet.</p>
                                </div>
                            ) : (
                                collaborators.map(c => (
                                    <div key={c.email} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                                                {c.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-bold">{c.email}</p>
                                                <p className="text-[10px] text-gray-500">Access since {c.addedAt ? format(c.addedAt, 'MMM d, yyyy') : 'Recently'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(c.email)}
                                            className="text-gray-500 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
                <div className="animate-in slide-in-from-right duration-300">
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <span className="material-symbols-outlined">warning</span>
                            <h3 className="font-bold">Delete Account</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            This action is <strong>irreversible</strong>. It will permanently delete your account, all associated budget data, history, and remove you from any shared budgets.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-red-400 uppercase mb-1">Type "DELETE" to confirm</label>
                                <input
                                    type="text"
                                    value={deleteConfirm}
                                    onChange={e => setDeleteConfirm(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full bg-black/20 border border-red-500/30 rounded-xl p-3 text-white focus:border-red-500 focus:outline-none"
                                />
                            </div>

                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirm !== 'DELETE' || isDeleting}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                            >
                                {isDeleting ? 'Deleting Everything...' : 'Permanently Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
