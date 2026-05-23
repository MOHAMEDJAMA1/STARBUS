import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import ShipmentList from './ShipmentList';

export default function BranchStatsView({ branch, onBack }) {
    const [stats, setStats] = useState({ received: 0, taken: 0, not_taken: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBranchStats = async () => {
            setLoading(true);
            setError(null);

            // Try the RPC function first
            const { data, error: rpcError } = await supabase
                .rpc('get_branch_stats', { target_branch_id: branch.id, query_date: null });

            if (rpcError) {
                console.error('RPC Error:', rpcError);
                // Fallback: manually count from shipments table
                await fetchStatsFallback();
            } else if (data) {
                setStats({
                    received: data.received ?? 0,
                    taken: data.taken ?? 0,
                    not_taken: data.not_taken ?? 0,
                });
            }
            setLoading(false);
        };

        const fetchStatsFallback = async () => {
            // Count directly from shipments table as fallback
            const { data: allShipments, error: sError } = await supabase
                .from('shipments')
                .select('id, status')
                .eq('destination_branch_id', branch.id);

            if (sError) {
                setError('Could not load stats: ' + sError.message);
                return;
            }

            const rows = allShipments || [];
            setStats({
                received: rows.length,
                taken: rows.filter(s => s.status === 'delivered').length,
                not_taken: rows.filter(s => s.status !== 'delivered').length,
            });
        };

        fetchBranchStats();
    }, [branch.id]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back Header */}
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 text-sm font-medium"
                >
                    <ArrowLeft size={18} /> Back to Overview
                </button>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{branch.name}</h2>
                <p className="text-gray-500">{branch.location}</p>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            {loading ? (
                <div className="flex justify-center py-8 text-green-600">
                    <div className="animate-pulse flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Loading stats...
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Received</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.received}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Taken</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.taken}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Not Taken (Pending)</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.not_taken}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Shipments for this Branch */}
            <ShipmentList
                filter={{ destination_branch_id: branch.id }}
                title={`${branch.name} — Shipments`}
                isWorker={false}
            />
        </div>
    );
}
