import { useState } from 'react';
import { X, Package, MapPin, User, Calendar, Truck, FileText, CheckCircle } from 'lucide-react';


export default function ShipmentDetailsModal({ shipment, onClose, isWorker, currentBranchId, onMarkAsTaken }) {
    const [loading, setLoading] = useState(false);

    if (!shipment) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up font-sans flex flex-col max-h-[90vh]">


                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-4 sm:p-6 flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1 sm:mb-2">
                            <div className="bg-green-100 text-green-700 p-1.5 sm:p-2 rounded-lg">
                                <Package size={20} className="sm:hidden" />
                                <Package size={24} className="hidden sm:block" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-none">Shipment Details</h2>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-mono tracking-wide">{shipment.tracking_number}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-8 overflow-y-auto flex-1">

                    {/* Status Banner */}
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Status</span>
                            <StatusBadge status={shipment.status} />
                        </div>
                        <div className="sm:text-right">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Updated</span>
                            <p className="text-sm font-medium text-gray-900">
                                {shipment.status === 'delivered' ? formatDate(shipment.delivered_at) : formatDate(shipment.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Route Info */}
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MapPin size={14} /> Route Information
                            </h3>
                            <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 rounded-xl p-4 sm:p-5 relative overflow-hidden gap-6 sm:gap-0">
                                <div className="absolute hidden sm:block top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10 -translate-y-1/2"></div>

                                <div className="bg-white sm:pr-4 relative z-10 w-full sm:w-auto text-center sm:text-left">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Origin</p>
                                    <p className="font-bold text-base sm:text-lg text-gray-900">{shipment.origin_branch?.name || 'Unknown'}</p>
                                </div>
                                <div className="bg-white px-3 relative z-10 text-gray-300 transform sm:rotate-0 rotate-90">
                                    <Truck size={24} />
                                </div>
                                <div className="bg-white sm:pl-4 relative z-10 w-full sm:w-auto text-center sm:text-right">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Destination</p>
                                    <p className="font-bold text-base sm:text-lg text-gray-900">{shipment.destination_branch?.name || 'Unknown'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Sender */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User size={16} className="text-gray-400" /> Sender
                            </h3>
                            <div className="space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Name</p>
                                    <p className="text-sm font-bold text-gray-900">{shipment.sender_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">{shipment.sender_phone}</p>
                                </div>

                            </div>
                        </div>

                        {/* Receiver */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User size={16} className="text-gray-400" /> Receiver
                            </h3>
                            <div className="space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Name</p>
                                    <p className="text-sm font-bold text-gray-900">{shipment.receiver_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">{shipment.receiver_phone}</p>
                                </div>

                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FileText size={14} /> Logistics Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Registered By</p>
                                    <p className="text-sm font-medium text-gray-900 truncate">Staff ID: {shipment.received_by?.slice(0, 8)}...</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Created At</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(shipment.created_at)}</p>
                                </div>
                                {shipment.description && (
                                    <div className="col-span-1 sm:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Description / Notes</p>
                                        <p className="text-sm font-medium text-gray-900 leading-relaxed">{shipment.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end shrink-0">
                    {/* Mark as Taken Button in Modal - Extremely Robust Comparison */}
                    {shipment.status !== 'delivered' && shipment.status !== 'cancelled' && isWorker && String(currentBranchId || '').trim().toLowerCase() === String(shipment.destination_branch_id || '').trim().toLowerCase() && (
                        <button
                            onClick={async () => {
                                setLoading(true);
                                await onMarkAsTaken(shipment.id);
                                setLoading(false);
                                onClose();
                            }}
                            disabled={loading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-70"
                        >
                            <CheckCircle size={18} />
                            {loading ? 'Updating...' : 'Mark as Taken'}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        delivered: 'bg-green-100 text-green-700 ring-1 ring-green-600/20',
        pending: 'bg-orange-100 text-orange-700 ring-1 ring-orange-600/20',
        received: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20', // "In Transit" logic
        cancelled: 'bg-red-100 text-red-700 ring-1 ring-red-600/20',
    };

    const labels = {
        delivered: 'Taken',
        pending: 'Not Taken',
        received: 'In Transit',
        cancelled: 'Cancelled'
    };

    const statusKey = status || 'pending';

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[statusKey]}`}>
            {labels[statusKey] || status}
        </span>
    );
}
