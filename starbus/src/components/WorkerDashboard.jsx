import { useEffect, useState, useMemo } from 'react';
import ReceiveShipmentForm from './ReceiveShipmentForm';
import ShipmentList from './ShipmentList';
import { supabase } from '../lib/supabase';
import { Package, CheckCircle, Clock } from 'lucide-react';

export default function WorkerDashboard({ profile, activeView, onViewChange }) {
    // Stats matching the Mockup
    const [stats, setStats] = useState({
        received: 0,
        pending: 0,
        taken: 0
    });

    // Date Filtering State
    const [selectedDateFilter, setSelectedDateFilter] = useState('all'); // 'all', 'today', 'yesterday'
    const [customDate, setCustomDate] = useState('');

    // Compute the actual date string (YYYY-MM-DD) or null for API
    const queryDate = useMemo(() => {
        if (selectedDateFilter === 'all') return null;
        if (selectedDateFilter === 'custom') return customDate || null;

        const date = new Date();
        if (selectedDateFilter === 'yesterday') {
            date.setDate(date.getDate() - 1);
        }
        return date.toISOString().split('T')[0];
    }, [selectedDateFilter, customDate]);

    // Memoize filter filter for ShipmentList (Always show ALL shipments list, unless we want to filter list too?)
    // Note: User asked for Stats "on the side" to show data for the date. 
    // The list can remain "Inventory" focused (current active items) or filtered.
    // For now, let's keep the LIST as "Active Inventory" (no date filter) but STATS as Date Filtered.
    // Memoize filter filter for ShipmentList
    const branchFilter = useMemo(() => {
        // We pass empty filter here because ShipmentList now handles the OR logic 
        // using currentBranchId when isWorker is true
        return {};
    }, []);

    useEffect(() => {
        if (!profile?.branch_id) return;

        const fetchStats = async () => {
            // Note: We pass query_date to filtering logic
            const { data, error } = await supabase
                .rpc('get_branch_stats', {
                    target_branch_id: profile.branch_id,
                    query_date: queryDate
                });

            if (data) {
                setStats({
                    received: data.received,
                    pending: data.not_taken,
                    taken: data.taken
                });
            }
            if (error) console.error('Error fetching branch stats:', error);
        };

        fetchStats();

        // Realtime Subscription (Filtered)
        // Refresh stats on any change, even if date filtered (e.g. if I mark taken today, today's taken stat should go up)
        const subscription = supabase
            .channel(`dashboard-stats-${profile.branch_id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'shipments',
                    filter: `destination_branch_id=eq.${profile.branch_id}`
                },
                (payload) => {
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [profile?.branch_id, queryDate]);

    if (!profile) return <div className="p-8 text-center text-gray-500">Loading worker profile...</div>;

    if (activeView === 'receive') {
        return <ReceiveShipmentForm staffProfile={profile} onSuccess={() => onViewChange('worker_overview')} />;
    }

    if (activeView === 'inventory') {
        return <ShipmentList filter={branchFilter} title="Branch Inventory" isWorker={true} currentBranchId={profile?.branch_id} onNewReception={() => onViewChange('receive')} />;
    }

    // Guard: Branch not assigned
    if (!profile?.branch_id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm font-sans uppercase tracking-tight">
                <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Clock size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Branch Not Assigned</h3>
                <p className="text-sm font-bold text-gray-500 max-w-sm mb-8 leading-relaxed">
                    Your account has been created, but it hasn't been linked to a specific branch yet.
                    Please contact a Super Admin to assign you to a branch.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-[10px] text-gray-400 font-mono break-all font-bold">
                        User ID: {profile?.id}
                    </div>
                </div>
            </div>
        );
    }

    // Default: Worker Overview
    return (
        <div className="space-y-8 font-sans">

            {/* Date Filter & Stats Header */}
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Performance Stats</h3>
                    <p className="text-sm text-gray-500">
                        {selectedDateFilter === 'all'
                            ? 'Showing all-time statistics.'
                            : `Showing statistics for ${queryDate || 'selected date'}.`
                        }
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
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
                    {/* Simple Custom Date Trigger */}
                    <div className="relative">
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
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Received */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Received</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.received.toLocaleString()}</p>
                    </div>
                </div>

                {/* Total Not Taken (Pending) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Not Taken</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                    </div>
                </div>

                {/* Total Taken */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Taken</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.taken.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Main Shipment List */}
            {/* The "New Reception" button is passed here to be rendered in the header of the list */}
            <ShipmentList
                filter={branchFilter}
                title="Search & View Deliveries"
                isWorker={true}
                currentBranchId={profile?.branch_id}
                limit={10}
                onNewReception={() => onViewChange('receive')}
            />
        </div>
    );
}
