import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Package, MapPin, User, Calendar, Truck, FileText, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';


export default function ShipmentDetailsModal({ shipment, onClose, isWorker, currentBranchId, onMarkAsTaken, error, clearError }) {
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            const { error } = await supabase
                .from('shipments')
                .delete()
                .eq('id', shipment.id);

            if (error) throw error;
            onClose();
        } catch (err) {
            console.error('Error deleting shipment:', err);
            alert('Failed to delete shipment: ' + err.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up font-sans flex flex-col max-h-[95vh] relative">

                {/* Confirm Delete Overlay */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-md flex items-center justify-center p-6 text-center animate-fade-in">
                        <div className="max-w-xs scale-in">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Delivery?</h3>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. Are you sure you want to remove this shipment?</p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {deleteLoading ? 'Deleting...' : 'Yes, Delete Delivery'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-4 sm:p-6 flex justify-between items-start shrink-0">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1 sm:mb-2">
                            <div className="bg-green-100 text-green-700 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                <Package size={20} className="sm:hidden" />
                                <Package size={24} className="hidden sm:block" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-none truncate">Shipment Details</h2>
                                <p className="text-[10px] sm:text-sm text-gray-500 mt-1 font-mono tracking-wide truncate">{shipment.tracking_number}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (clearError) clearError();
                            onClose();
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">

                    {/* Status Banner */}
                    <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 text-center sm:text-left">Current Status</span>
                            <div className="flex justify-center sm:justify-start">
                                <StatusBadge status={shipment.status} />
                            </div>
                        </div>
                        <div className="text-center sm:text-right">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Updated</span>
                            <p className="text-sm font-medium text-gray-900">
                                {shipment.status === 'delivered' ? formatDate(shipment.delivered_at) : formatDate(shipment.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

                        {/* Route Info */}
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MapPin size={14} /> Route Information
                            </h3>
                            <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 rounded-xl p-4 sm:p-5 relative overflow-hidden gap-4 sm:gap-0">
                                <div className="absolute hidden sm:block top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10 -translate-y-1/2"></div>

                                <div className="bg-white sm:pr-4 relative z-10 w-full sm:w-auto text-center sm:text-left">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Origin</p>
                                    <p className="font-bold text-base sm:text-lg text-gray-900">{shipment.origin_branch?.name || 'Unknown'}</p>
                                </div>
                                <div className="bg-white px-3 relative z-10 text-gray-300 transform sm:rotate-0 rotate-90 py-2 sm:py-0">
                                    <Truck size={24} />
                                </div>
                                <div className="bg-white sm:pl-4 relative z-10 w-full sm:w-auto text-center sm:text-right">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Destination</p>
                                    <p className="font-bold text-base sm:text-lg text-gray-900">{shipment.destination_branch?.name || 'Unknown'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Sender */}
                        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User size={16} className="text-gray-400" /> Sender
                            </h3>
                            <div className="space-y-3">
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
                        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User size={16} className="text-gray-400" /> Receiver
                            </h3>
                            <div className="space-y-3">
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
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 overflow-hidden">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Registered By</p>
                                    <p className="text-sm font-medium text-gray-900 truncate">Staff ID: {shipment.received_by?.slice(0, 8)}...</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Created At</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(shipment.created_at)}</p>
                                </div>
                                {shipment.bus_number && (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Bus Number</p>
                                        <p className="text-sm font-bold text-green-600 flex items-center gap-2">
                                            <Truck size={14} />
                                            {shipment.bus_number}
                                        </p>
                                    </div>
                                )}
                                {shipment.description && (
                                    <div className="col-span-1 sm:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Description / Notes</p>
                                        <p className="text-sm font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">{shipment.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Error Message inside Modal */}
                {error && (
                    <div className="mx-4 sm:mx-6 mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                            <span className="font-medium">{error}</span>
                        </div>
                        <button onClick={clearError} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none p-1">×</button>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="bg-gray-50 border-t border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end shrink-0">

                    {/* Delete Button - Visible if not delivered */}
                    {shipment.status !== 'delivered' && (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all active:scale-95"
                        >
                            <Trash2 size={18} />
                            Delete
                        </button>
                    )}

                    {/* Mark as Taken Button */}
                    {shipment.status !== 'delivered' && shipment.status !== 'cancelled' && isWorker && (
                        <button
                            onClick={async () => {
                                setLoading(true);
                                const success = await onMarkAsTaken(shipment.id);
                                setLoading(false);
                                if (success) {
                                    onClose();
                                }
                            }}
                            disabled={loading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-70"
                        >
                            <CheckCircle size={18} />
                            {loading ? 'Updating...' : 'Mark as Taken'}
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (clearError) clearError();
                            onClose();
                        }}
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
        received: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20',
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
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${styles[statusKey]}`}>
            {labels[statusKey] || status}
        </span>
    );
}
