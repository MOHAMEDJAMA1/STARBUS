import { useEffect, useState, useMemo, useCallback } from 'react';
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

    const [loadingStats, setLoadingStats] = useState(false);

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

    // Memoized branch filter
    const branchFilter = useMemo(() => ({}), []);

    // Stable function for changing view
    const handleNewReception = useCallback(() => {
        onViewChange('receive');
    }, [onViewChange]);

    const handleSuccess = useCallback(() => {
        onViewChange('worker_overview');
    }, [onViewChange]);

    const fetchStats = useCallback(async () => {
        if (!profile?.branch_id) return;

        setLoadingStats(true);
        try {
            const { data, error } = await supabase
                .rpc('get_branch_stats', {
                    target_branch_id: profile.branch_id,
                    query_date: queryDate
                });

            if (data) {
                setStats({
                    received: data.received || 0,
                    pending: data.not_taken || 0,
                    taken: data.taken || 0
                });
            }
            if (error) throw error;
        } catch (error) {
            console.error('[WorkerDash] Error fetching branch stats:', error);
        } finally {
            setLoadingStats(false);
        }
    }, [profile?.branch_id, queryDate]);

    // Update stats on initial load and meaningful changes
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Consolidated Realtime Subscription at the Dashboard level
    // SHIPMENT LIST handles its own refined Realtime refresh silently.
    // This dashboard listener ONLY handles the stats counter.
    useEffect(() => {
        if (!profile?.branch_id) return;

        const channel = supabase
            .channel(`branch-stats-refresh-${profile.branch_id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'shipments'
                },
                (payload) => {
                    const { new: newRow, old: oldRow } = payload;
                    const affectedBranchId = newRow?.destination_branch_id || newRow?.origin_branch_id ||
                        oldRow?.destination_branch_id || oldRow?.origin_branch_id;

                    if (affectedBranchId === profile.branch_id) {
                        // Silent stats refresh
                        fetchStats();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.branch_id, fetchStats]);

    if (!profile) return <div className="p-8 text-center text-gray-500">Loading worker profile...</div>;

    if (activeView === 'receive') {
        return <ReceiveShipmentForm staffProfile={profile} onSuccess={handleSuccess} />;
    }

    if (activeView === 'inventory') {
        return (
            <div className="min-h-[600px] animate-in fade-in duration-500">
                <ShipmentList
                    filter={branchFilter}
                    title="Branch Inventory"
                    isWorker={true}
                    currentBranchId={profile?.branch_id}
                    onNewReception={handleNewReception}
                    staffProfile={profile}
                />
            </div>
        );
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
                    Account identified as {profile?.email}.
                    Please contact a Super Admin to assign you to a branch.
                </p>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-[10px] text-gray-400 font-mono break-all font-bold">
                    Profile ID: {profile?.id}
                </div>
            </div>
        );
    }

    // Default: Worker Overview
    return (
        <div className="space-y-8 font-sans animate-in fade-in duration-500">

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
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-opacity duration-300 ${loadingStats ? 'opacity-60' : 'opacity-100'}`}>
                {/* Total Received */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Received</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.received.toLocaleString()}</p>
                    </div>
                    {loadingStats && <div className="absolute top-0 right-0 p-1"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div></div>}
                </div>

                {/* Total Not Taken (Pending) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Not Taken</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.pending.toLocaleString()}</p>
                    </div>
                    {loadingStats && <div className="absolute top-0 right-0 p-1"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></div></div>}
                </div>

                {/* Total Taken */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Taken</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.taken.toLocaleString()}</p>
                    </div>
                    {loadingStats && <div className="absolute top-0 right-0 p-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div></div>}
                </div>
            </div>

            {/* Main Shipment List */}
            <div className="min-h-[500px] border-t border-gray-50 pt-8">
                <ShipmentList
                    filter={branchFilter}
                    title="Search & View Deliveries"
                    isWorker={true}
                    currentBranchId={profile?.branch_id}
                    limit={10}
                    onNewReception={handleNewReception}
                />
            </div>
        </div>
    );
}
