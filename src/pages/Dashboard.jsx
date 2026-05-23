import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import WorkerDashboard from '../components/WorkerDashboard';
import AdminDashboard from '../components/AdminDashboard';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [activeView, setActiveView] = useState('overview'); // Default view
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const [branchName, setBranchName] = useState(null); // Add state for branch name

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError) throw authError;

                if (!user) {
                    navigate('/login');
                    return;
                }
                setUser(user);

                // Fetch profile — use maybeSingle() to avoid crash if 0 or 2+ rows
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) throw profileError;
                if (!profileData) {
                    throw new Error('Your account profile was not found. Please contact your administrator.');
                }

                setProfile(profileData);

                // Fetch Branch Name if worker
                if (profileData.role === 'branch_worker' && profileData.branch_id) {
                    const { data: branchData } = await supabase
                        .from('branches')
                        .select('name')
                        .eq('id', profileData.branch_id)
                        .maybeSingle();

                    if (branchData) {
                        setBranchName(branchData.name);
                    }
                }

                // Set default view based on role
                if (profileData?.role === 'branch_worker') {
                    setActiveView('worker_overview');
                } else {
                    setActiveView('overview');
                }
            } catch (err) {
                console.error('Dashboard Error:', err);
                setError(err.message);
            }
        };

        getUser();
    }, [navigate]);

    if (error) return (
        <div className="flex flex-col items-center justify-center h-screen text-red-600 p-4 bg-gray-50">
            <h3 className="text-xl font-bold mb-2">Error Loading Dashboard</h3>
            <p>{error}</p>
            <button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-800">
                Back to Login
            </button>
        </div>
    );

    if (!profile) return (
        <div className="flex items-center justify-center h-screen bg-gray-50 text-green-600 font-medium">
            <div className="animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Loading...
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                role={profile.role}
                activeView={activeView}
                onViewChange={setActiveView}
                userEmail={user.email}
                branchName={branchName}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto pt-[60px] lg:pt-0">
                <div className="p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                {activeView === 'overview' && 'Dashboard Overview'}
                                {activeView === 'worker_overview' && 'Dashboard Overview'}
                                {activeView === 'branches' && 'Branch Management'}
                                {activeView === 'all_shipments' && 'All Shipments'}
                                {activeView === 'users' && 'Staff Management'}
                                {activeView === 'receive' && 'New Delivery'}
                                {activeView === 'inventory' && 'Branch Inventory'}
                                {activeView === 'settings' && 'Settings'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {activeView === 'overview' && 'Welcome back, Super Admin.'}
                                {activeView === 'worker_overview' && `Welcome back, ${profile.full_name || 'Worker'}.`}
                                {activeView === 'users' && 'Manage your team and branch access.'}
                            </p>
                        </div>
                    </div>

                    {/* Dynamic Content */}
                    <div className="animate-fade-in">
                        {profile.role === 'branch_worker' ? (
                            <WorkerDashboard profile={profile} activeView={activeView} onViewChange={setActiveView} />
                        ) : (
                            <AdminDashboard activeView={activeView} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
