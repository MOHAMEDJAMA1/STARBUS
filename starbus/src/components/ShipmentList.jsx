import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, ChevronLeft, ChevronRight, Filter, Package, Check, Plus, Eye } from 'lucide-react';
import ShipmentDetailsModal from './ShipmentDetailsModal';

const EMPTY_FILTER = {};

export default function ShipmentList({ filter = EMPTY_FILTER, title = "Search & View Deliveries", isWorker = false, currentBranchId = null, limit = 10, onNewReception }) {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = limit;

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedShipment, setSelectedShipment] = useState(null);

    const fetchShipments = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('shipments')
                .select(`
                    *,
                    origin_branch:origin_branch_id(name),
                    destination_branch:destination_branch_id(name)
                `, { count: 'exact' });

            // Apply Filters
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            // Special Branch Filter (OR origin or destination)
            if (currentBranchId && isWorker) {
                query = query.or(`origin_branch_id.eq.${currentBranchId},destination_branch_id.eq.${currentBranchId}`);
            }

            // Search
            if (searchTerm) {
                query = query.or(`tracking_number.ilike.%${searchTerm}%,receiver_name.ilike.%${searchTerm}%,receiver_phone.ilike.%${searchTerm}%`);
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            setShipments(data);
            if (count) setTotalPages(Math.ceil(count / pageSize));
        } catch (error) {
            console.error('Error fetching shipments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShipments();
    }, [filter, page, searchTerm, refreshTrigger]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('shipment-list-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'shipments'
                },
                (payload) => {
                    // console.log('Change received!', payload);
                    setRefreshTrigger(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const [takenError, setTakenError] = useState(null);

    const handleMarkAsTaken = async (id) => {
        setTakenError(null);
        try {
            const { error } = await supabase
                .from('shipments')
                .update({
                    status: 'delivered',
                    delivered_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            // Realtime will refresh the list automatically
        } catch (error) {
            console.error('Error updating shipment:', error);
            setTakenError(`Failed to mark as taken: ${error.message}`);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-sans">
            {/* Error Banner */}
            {takenError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center justify-between">
                    <span>{takenError}</span>
                    <button onClick={() => setTakenError(null)} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
                </div>
            )}
            {/* Header / Toolbar */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1 hidden sm:block">Manage and track product receptions at your branch.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isWorker && onNewReception && (
                            <button
                                onClick={onNewReception}
                                className="flex items-center gap-2 px-3 py-2.5 sm:px-4 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-green-500/20 transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>New Reception</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search receiver name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-green-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Mobile Card View (hidden on md+) */}
            <div className="md:hidden divide-y divide-gray-100">
                {loading ? (
                    <div className="py-10 text-center text-gray-400 text-sm">Loading...</div>
                ) : shipments.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">No shipments found.</div>
                ) : shipments.map((shipment) => (
                    <div key={shipment.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedShipment(shipment)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{shipment.receiver_name}</p>
                                <p className="text-xs text-gray-500">{shipment.receiver_phone}</p>
                            </div>
                            <StatusBadge status={shipment.status} />
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                            <span>{shipment.origin_branch?.name || '?'}</span>
                            <span>→</span>
                            <span>{shipment.destination_branch?.name || '?'}</span>
                            <span className="ml-auto">{new Date(shipment.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelectedShipment(shipment)} className="w-full sm:flex-1 py-2.5 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                                <Eye size={16} /> View Details
                            </button>
                            {shipment.status !== 'delivered' && shipment.status !== 'cancelled' && isWorker && String(currentBranchId || '').trim().toLowerCase() === String(shipment.destination_branch_id || '').trim().toLowerCase() && (
                                <button onClick={() => handleMarkAsTaken(shipment.id)} className="w-full sm:flex-1 py-2.5 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <Check size={16} /> Mark as Taken
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sender</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Receiver</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">From / To</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading shipments...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : shipments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    No shipments found.
                                </td>
                            </tr>
                        ) : (
                            shipments.map((shipment) => (
                                <tr
                                    key={shipment.id}
                                    className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedShipment(shipment)} // Row click opens modal
                                >
                                    {/* Sender */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                                <Package size={20} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{shipment.sender_name}</p>
                                                {/* Hidden or secondary info if needed */}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Receiver */}
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-sm">{shipment.receiver_name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{shipment.receiver_phone}</div>
                                    </td>

                                    {/* Route */}
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{shipment.origin_branch?.name || 'Unknown'}</span>
                                            <span className="text-gray-400 text-xs">→</span>
                                            <span className="font-medium text-gray-900">{shipment.destination_branch?.name || 'Unknown'}</span>
                                        </div>
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                        {new Date(shipment.created_at).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <StatusBadge status={shipment.status} />
                                    </td>

                                    {/* Action */}
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        {/* Stop prop ensures button click doesn't trigger row click logic if they conflict, though row opens modal anyway */}

                                        <div className="flex items-center justify-end gap-2">
                                            {/* Details Button */}
                                            <button
                                                onClick={() => setSelectedShipment(shipment)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {/* Mark Taken Button */}
                                            {shipment.status !== 'delivered' && shipment.status !== 'cancelled' ? (
                                                isWorker && String(currentBranchId || '').trim().toLowerCase() === String(shipment.destination_branch_id || '').trim().toLowerCase() ? (
                                                    <button
                                                        onClick={() => handleMarkAsTaken(shipment.id)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm shadow-green-200 transition-all active:scale-95"
                                                    >
                                                        Mark as Taken
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-medium hidden">
                                                        {isWorker ? 'In Transit / NotDest' : 'View Only'}
                                                    </span>
                                                )
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                <span className="text-sm text-gray-500">
                    Showing page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Details Modal */}
            {selectedShipment && (
                <ShipmentDetailsModal
                    shipment={selectedShipment}
                    onClose={() => setSelectedShipment(null)}
                    isWorker={isWorker}
                    currentBranchId={currentBranchId}
                    onMarkAsTaken={handleMarkAsTaken}
                />
            )}
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        delivered: 'bg-green-100 text-green-700 ring-1 ring-green-600/20', // Taken
        pending: 'bg-orange-100 text-orange-700 ring-1 ring-orange-600/20',
        received: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20',
        cancelled: 'bg-red-100 text-red-700 ring-1 ring-red-600/20',
    };

    const labels = {
        delivered: 'Taken',
        pending: 'Not Taken', // Or Pending
        received: 'In Transit',
        cancelled: 'Cancelled'
    };

    const statusKey = status || 'pending';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[statusKey]}`}>
            {statusKey === 'delivered' && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
            {statusKey === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
            {labels[statusKey] || status}
        </span>
    );
}
