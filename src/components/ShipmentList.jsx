import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Search, ChevronLeft, ChevronRight, Filter, Package, Check, Plus, Eye, Truck, Trash2, Calendar, FileText, Clock } from 'lucide-react';
import ShipmentDetailsModal from './ShipmentDetailsModal';

const EMPTY_FILTER = {};

export default function ShipmentList({ filter = EMPTY_FILTER, title = "Search & View Deliveries", isWorker = false, currentBranchId = null, limit = 10, onNewReception, staffProfile }) {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'received', 'delivered'
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = limit;

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedShipment, setSelectedShipment] = useState(null);

    // Performance Optimization: Cache the full list for instant "Back"
    const fullListCache = useRef([]);
    const isInitialLoad = useRef(true);

    // Search Debounce Logic
    useEffect(() => {
        // Only debounce if there is a term, clearing search should be instant
        if (!searchTerm) return;

        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchShipments = useCallback(async (isSilent = false) => {
        // Show loading if it's NOT a silent refresh and NO current data
        // If we have data, we keep it visible for zero-flicker
        if (!isSilent && shipments.length === 0) setLoading(true);

        try {
            let query = supabase
                .from('shipments')
                .select(`
                    *,
                    origin_branch:origin_branch_id(name),
                    destination_branch:destination_branch_id(name)
                `, { count: 'exact' });

            // Apply Source Filters (Branch, etc.)
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            // Special Branch Filter
            if (isWorker) {
                if (currentBranchId) {
                    query = query.eq('destination_branch_id', currentBranchId);
                } else {
                    setShipments([]);
                    return;
                }
            }

            // Status Filter
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            // Search (Using debounced value)
            if (debouncedSearch) {
                query = query.or(`tracking_number.ilike.%${debouncedSearch}%,receiver_name.ilike.%${debouncedSearch}%,receiver_phone.ilike.%${debouncedSearch}%,sender_name.ilike.%${debouncedSearch}%,sender_phone.ilike.%${debouncedSearch}%,bus_number.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const finalData = data || [];
            setShipments(finalData);

            // Update cache if this is the "default" view
            if (!debouncedSearch && statusFilter === 'all' && page === 1) {
                fullListCache.current = finalData;
            }

            if (count) setTotalPages(Math.ceil(count / pageSize));
        } catch (error) {
            console.error('Error fetching shipments:', error);
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    }, [filter, isWorker, currentBranchId, statusFilter, debouncedSearch, page, pageSize, shipments.length]);

    // Unified Fetch Effect
    useEffect(() => {
        const isBgRefresh = !isInitialLoad.current && refreshTrigger > 0;
        fetchShipments(isBgRefresh);
    }, [fetchShipments, refreshTrigger]);

    // Realtime Subscription
    useEffect(() => {
        if (isWorker && !currentBranchId) return;

        const channel = supabase
            .channel(`shipment-list-${currentBranchId || 'all'}`)
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

                    if (!isWorker || (currentBranchId && affectedBranchId === currentBranchId)) {
                        setRefreshTrigger(prev => prev + 1);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentBranchId, isWorker]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);

        // INSTANT BACK: If search is cleared, restore data immediately
        if (!val) {
            setDebouncedSearch('');
            setShipments(fullListCache.current);
            setPage(1);
        }
    };

    const handleKeyDown = (e) => {
        // INSTANT SEARCH: Trigger immediately on Enter
        if (e.key === 'Enter') {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }
    };

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
            fetchShipments(true);
            return true;
        } catch (error) {
            console.error('Error updating shipment:', error);
            setTakenError(`Failed to mark as taken: ${error.message}`);
            return false;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-sans min-h-[600px] flex flex-col relative">
            {/* Error Banner */}
            {takenError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center justify-between z-10">
                    <span>{takenError}</span>
                    <button onClick={() => setTakenError(null)} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
                </div>
            )}

            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 shrink-0 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1 hidden sm:block">Branch Inventory Management</p>
                    </div>
                    {isWorker && onNewReception && (
                        <button
                            onClick={onNewReception}
                            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-xs font-black rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 uppercase tracking-tighter"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span>New Reception</span>
                        </button>
                    )}
                </div>

                <div className="mt-5 flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${searchTerm !== debouncedSearch ? 'text-green-500 scale-110' : 'text-gray-300 group-focus-within:text-green-500'}`} size={18} />
                        <input
                            type="text"
                            placeholder="Search receiver, phone, bus # or item..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-100 hover:border-gray-200 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 rounded-2xl text-sm font-medium transition-all outline-none placeholder-gray-300"
                        />
                    </div>

                    <div className="flex bg-gray-100/80 p-1.5 rounded-2xl shrink-0 border border-gray-100">
                        {['all', 'received', 'delivered'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {s === 'all' ? 'All' : s === 'received' ? 'Not Taken' : 'Taken'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto relative min-h-[400px]">
                {/* Desktop View */}
                <div className="hidden md:block">
                    <table className="w-full table-fixed">
                        <thead className="bg-gray-50/50 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="w-[20%] px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Receiver & Sender</th>
                                <th className="w-[25%] px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="w-[12%] px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Bus #</th>
                                <th className="w-[18%] px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Route</th>
                                <th className="w-[10%] px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="w-[15%] px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y divide-gray-100 transition-opacity duration-300 ${loading && shipments.length > 0 ? 'opacity-40' : 'opacity-100'}`}>
                            {loading && shipments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">Fetching Data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : shipments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Package size={48} className="text-gray-300" />
                                            <span className="font-black text-xs uppercase tracking-widest text-gray-400">No Records Found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                shipments.map((shipment) => (
                                    <tr
                                        key={shipment.id}
                                        className="group hover:bg-gray-50/80 transition-all cursor-pointer border-l-2 border-transparent hover:border-green-500"
                                        onClick={() => setSelectedShipment(shipment)}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-gray-900 text-sm mb-1">{shipment.receiver_name}</div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-gray-500 font-bold">{shipment.receiver_phone}</span>
                                                <span className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter">Sender: {shipment.sender_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-xs font-medium text-gray-600 line-clamp-2 leading-relaxed italic">
                                                {shipment.description || "No description provided"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            {shipment.bus_number ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-lg border border-green-100 uppercase tracking-tighter">
                                                    <Truck size={12} strokeWidth={3} /> {shipment.bus_number}
                                                </span>
                                            ) : (
                                                <span className="text-gray-200">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                <span className="text-gray-900">{shipment.origin_branch?.name || '??'}</span>
                                                <div className="h-[1px] w-4 bg-gray-200"></div>
                                                <span className="text-green-600">{shipment.destination_branch?.name || '??'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-[10px] text-gray-400 font-bold whitespace-nowrap">
                                            {new Date(shipment.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <StatusBadge status={shipment.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {shipments.map((shipment) => (
                        <div key={shipment.id} className="p-5 active:bg-gray-50 transition-colors" onClick={() => setSelectedShipment(shipment)}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-black text-gray-900 text-sm tracking-tight">{shipment.receiver_name}</h4>
                                    <p className="text-[11px] font-bold text-gray-400 tracking-widest">{shipment.receiver_phone}</p>
                                </div>
                                <StatusBadge status={shipment.status} />
                            </div>

                            {shipment.description && (
                                <div className="mb-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-600 leading-relaxed italic">"{shipment.description}"</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-300">
                                <span className="flex items-center gap-1"><Truck size={12} /> {shipment.bus_number || 'No Bus'}</span>
                                <span>{new Date(shipment.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination */}
            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Page <span className="text-gray-900">{page}</span> of {totalPages}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 bg-white hover:text-gray-900 transition-all disabled:opacity-30"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 bg-white hover:text-gray-900 transition-all disabled:opacity-30"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Background Sync Indicator */}
            {loading && shipments.length > 0 && (
                <div className="absolute top-4 right-6 pointer-events-none">
                    <div className="px-3 py-1 bg-green-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                        Syncing
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedShipment && (
                <ShipmentDetailsModal
                    shipment={selectedShipment}
                    onClose={() => setSelectedShipment(null)}
                    isWorker={isWorker}
                    currentBranchId={currentBranchId}
                    onMarkAsTaken={handleMarkAsTaken}
                    onDeleteSuccess={() => {
                        setSelectedShipment(null);
                        fetchShipments(true);
                    }}
                    staffProfile={staffProfile}
                />
            )}
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        delivered: 'bg-green-100 text-green-700 border-green-200',
        pending: 'bg-orange-100 text-orange-700 border-orange-200',
        received: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    const labels = {
        delivered: 'Taken',
        pending: 'Not Taken',
        received: 'In Transit',
    };

    const s = status || 'pending';

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[s]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s === 'delivered' ? 'bg-green-500' : s === 'received' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
            {labels[s] || s}
        </span>
    );
}
