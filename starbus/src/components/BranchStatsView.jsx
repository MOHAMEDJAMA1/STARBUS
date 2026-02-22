import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, CheckCircle, Clock } from 'lucide-react';

export default function BranchStatsView({ branch, onBack }) {
    const [stats, setStats] = useState({
        received: 0,
        taken: 0,
        not_taken: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranchStats = async () => {
            const { data, error } = await supabase
                .rpc('get_branch_stats', { target_branch_id: branch.id });

            if (data) {
                setStats(data);
            }
            if (error) console.error(error);
            setLoading(false);
        };
        fetchBranchStats();
    }, [branch.id]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                >
                    ← Back
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{branch.name} Stats</h2>
                    <p className="text-gray-500">{branch.location}</p>
                </div>
            </div>

            {/* Stats Grid */}
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
        </div>
    );
}
