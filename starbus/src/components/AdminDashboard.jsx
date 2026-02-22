import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Truck, Box, TrendingUp, DollarSign, Clock, MoreHorizontal, Download, Search, Filter } from 'lucide-react';
import CreateBranchForm from './CreateBranchForm';
import CreateWorkerForm from './CreateWorkerForm';
import BranchStatsView from './BranchStatsView';
import ShipmentList from './ShipmentList';

// Mock data for things not in DB yet
const MOCK_REVENUE = 85200;

export default function AdminDashboard({ activeView }) {
    const [stats, setStats] = useState({
        total_received: 0,
        total_taken: 0,
        total_not_taken: 0,
        active_branches: 0
    });
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Date Filtering State
    const [selectedDateFilter, setSelectedDateFilter] = useState('all');
    const [customDate, setCustomDate] = useState('');

    const queryDate = useState(() => {
        // We use useState initializer or useMemo? Logic is same as worker
        // Wait, useState initializer runs once. Need useMemo for Derived state.
        // Changing to regular constant derived from render or useMemo.
        // Actually react `useState` does not re-calc on re-render.
        // Let's use useMemo.
        return null;
    })[0]; // Placeholder, need separate useMemo

    // Derived Query Date
    const activeQueryDate = (() => {
        if (selectedDateFilter === 'all') return null;
        if (selectedDateFilter === 'custom') return customDate || null;

        const date = new Date();
        if (selectedDateFilter === 'yesterday') {
            date.setDate(date.getDate() - 1);
        }
        return date.toISOString().split('T')[0];
    })();


    useEffect(() => {
        const fetchStats = async () => {
            // Fetch Global Stats (target_branch_id: null)
            const { data, error } = await supabase
                .rpc('get_branch_stats', {
                    target_branch_id: null,
                    query_date: activeQueryDate
                });

            if (data) {
                setStats(prev => ({
                    ...prev,
                    total_received: data.received,
                    total_taken: data.taken,
                    total_not_taken: data.not_taken,
                    // active_branches: 0 // Keep existing or update separately
                }));
            }
            if (error) console.error('Error fetching global stats:', error);
        };
        fetchStats();
    }, [activeView, activeQueryDate]);

    useEffect(() => {
        if (activeView === 'overview' || activeView === 'branches') {
            const fetchBranches = async () => {
                const { data } = await supabase.from('branches').select('*').order('name');
                if (data) {
                    setBranches(data);
                    // Update active branches count
                    setStats(prev => ({ ...prev, active_branches: data.length }));
                }
            };
            fetchBranches();
        }
    }, [activeView]);

    // Calculate efficiency (Taken / Received * 100)
    const calculateEfficiency = (received, taken) => {
        if (!received || received === 0) return 0;
        return Math.round((taken / received) * 100);
    };

    // Filter branches
    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // SUB-VIEW: Branch Details
    if (selectedBranch) {
        return <BranchStatsView branch={selectedBranch} onBack={() => setSelectedBranch(null)} />;
    }

    // VIEW: Staff Management
    if (activeView === 'users') {
        return (
            <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Staff</h2>
                <CreateWorkerForm />
            </div>
        );
    }

    // VIEW: All Shipments
    if (activeView === 'all_shipments') {
        return (
            <ShipmentList
                title="System-Wide Shipments"
                isWorker={false} // Admin Mode
            />
        );
    }

    // VIEW: Admin Overview (Main Dashboard)
    return (
        <div className="space-y-8 font-sans">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {activeView === 'overview' ? 'Super Admin Overview' : 'Branch Management'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {activeView === 'overview' ? 'Monitor system performance and branch activities.' : 'Manage and create branches.'}
                    </p>
                </div>
                <div className="flex gap-3">
                    {activeView === 'overview' && (
                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                            <button
                                onClick={() => setSelectedDateFilter('all')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedDateFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                All Time
                            </button>
                            <button
                                onClick={() => setSelectedDateFilter('today')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedDateFilter === 'today' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setSelectedDateFilter('yesterday')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedDateFilter === 'yesterday' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Yesterday
                            </button>
                            <input
                                type="date"
                                className={`text-xs font-bold bg-transparent focus:outline-none p-1.5 rounded-md ${selectedDateFilter === 'custom' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                                onChange={(e) => {
                                    setCustomDate(e.target.value);
                                    setSelectedDateFilter('custom');
                                }}
                                value={customDate}
                            />
                        </div>
                    )}
                    {(activeView === 'branches' || activeView === 'overview') && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95">
                            <Download size={16} /> Export Report
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid - ONLY ON OVERVIEW */}
            {activeView === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Card 1: Total Received */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Box size={22} />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Total Received</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.total_received.toLocaleString()}</h3>
                    </div>

                    {/* Card 2: Total Taken */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <Truck size={22} />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+8%</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Total Taken</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.total_taken.toLocaleString()}</h3>
                    </div>

                    {/* Card 3: Total Not Taken */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                <Clock size={22} />
                            </div>
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">-5%</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Total Not Taken</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.total_not_taken.toLocaleString()}</h3>
                    </div>

                    {/* Card 4: Active Branches */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                <Users size={22} />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">Stable</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Active Branches</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.active_branches}</h3>
                    </div>
                </div>
            )}

            {/* Branch Performance Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {activeView === 'overview' ? 'Branch Performance Breakdown' : 'All Branches'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {activeView === 'overview' ? 'Real-time product intake and dispatch status by branch' : 'List of all system branches'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search branch name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {activeView === 'branches' && ( // Show Add Branch in branches view
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                        <CreateBranchForm onSuccess={() => {
                            // Refresh branches
                            supabase.from('branches').select('*').order('name').then(({ data }) => {
                                if (data) {
                                    setBranches(data);
                                    setStats(prev => ({ ...prev, active_branches: data.length }));
                                }
                            });
                        }} />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left">Branch Name</th>
                                <th className="px-6 py-4 text-left">Location</th>
                                <th className="px-6 py-4 text-left">Received</th>
                                <th className="px-6 py-4 text-left">Taken</th>
                                <th className="px-6 py-4 text-left">Efficiency</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBranches.map((branch) => (
                                <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-primary">
                                                <Truck size={20} />
                                            </div>
                                            <span className="font-semibold text-gray-900">{branch.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{branch.location || 'N/A'}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">--</td> {/* Needs specific stats call per branch if we want row numbers, or join */}
                                    <td className="px-6 py-4 font-medium text-gray-900">--</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: '0%' }}></div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-600">--%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedBranch(branch)}
                                            className="text-sm font-medium text-primary hover:text-green-700"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredBranches.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No branches found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
