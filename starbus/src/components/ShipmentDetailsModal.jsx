import { X, Package, MapPin, User, Calendar, Truck, FileText } from 'lucide-react';

export default function ShipmentDetailsModal({ shipment, onClose }) {
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
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up font-sans">

                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                                <Package size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 leading-none">Shipment Details</h2>
                                <p className="text-sm text-gray-500 mt-1 font-mono tracking-wide">{shipment.tracking_number}</p>
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
                <div className="p-8 max-h-[70vh] overflow-y-auto">

                    {/* Status Banner */}
                    <div className="mb-8 flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Status</span>
                            <StatusBadge status={shipment.status} />
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Last Updated</span>
                            <p className="text-sm font-medium text-gray-900">
                                {shipment.status === 'delivered' ? formatDate(shipment.delivered_at) : formatDate(shipment.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Route Info */}
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MapPin size={16} className="text-gray-400" /> Route Information
                            </h3>
                            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden">
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10 -translate-y-1/2"></div>

                                <div className="bg-white pr-4 relative z-10">
                                    <p className="text-xs text-gray-500 mb-1">Origin</p>
                                    <p className="font-bold text-lg text-gray-900">{shipment.origin_branch?.name || 'Unknown'}</p>
                                </div>
                                <div className="bg-white px-2 relative z-10 text-gray-400">
                                    <Truck size={20} />
                                </div>
                                <div className="bg-white pl-4 relative z-10 text-right">
                                    <p className="text-xs text-gray-500 mb-1">Destination</p>
                                    <p className="font-bold text-lg text-gray-900">{shipment.destination_branch?.name || 'Unknown'}</p>
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
                                    <p className="text-xs text-gray-500 mb-0.5">Name</p>
                                    <p className="font-bold text-gray-900">{shipment.sender_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                                    <p className="font-medium text-gray-900">{shipment.sender_phone}</p>
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
                                    <p className="text-xs text-gray-500 mb-0.5">Name</p>
                                    <p className="font-bold text-gray-900">{shipment.receiver_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                                    <p className="font-medium text-gray-900">{shipment.receiver_phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FileText size={16} className="text-gray-400" /> Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Registered By</p>
                                    {/* This would require joining with profiles or storing name, currently just ID or simplified */}
                                    <p className="font-medium text-gray-900 truncate">Staff ID: {shipment.received_by?.slice(0, 8)}...</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Created At</p>
                                    <p className="font-medium text-gray-900">{formatDate(shipment.created_at)}</p>
                                </div>
                                {shipment.description && (
                                    <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Description / Notes</p>
                                        <p className="font-medium text-gray-900">{shipment.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 p-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
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
