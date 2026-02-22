import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Phone, MapPin, Calendar, FileText, X, Save, Truck } from 'lucide-react';

export default function ReceiveShipmentForm({ staffProfile, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [formData, setFormData] = useState({
        sender_name: '',
        sender_phone: '',
        receiver_name: '',
        receiver_phone: '',
        origin_branch_id: '', // New Field: From City (Selectable)
        description: '',
        delivery_date: '',
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBranches = async () => {
            const { data } = await supabase.from('branches').select('id, name, location');
            if (data) {
                setBranches(data);

                // Initialize CURRENT branch and set default form data
                const current = data.find(b => b.id === staffProfile.branch_id);
                setCurrentBranch(current);

                // Lock Origin to Current Branch
                setFormData(prev => ({
                    ...prev,
                    origin_branch_id: staffProfile.branch_id
                }));
            }
        };
        fetchBranches();
    }, [staffProfile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Generate specific tracking number
        const trackingNumber = `STAR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

        try {
            const { error } = await supabase.from('shipments').insert({
                tracking_number: trackingNumber,
                origin_branch_id: formData.origin_branch_id,
                destination_branch_id: formData.destination_branch_id,
                sender_name: formData.sender_name,
                sender_phone: formData.sender_phone,
                receiver_name: formData.receiver_name,
                receiver_phone: formData.receiver_phone,
                description: formData.description,
                received_by: staffProfile.id,
                status: 'received',
                created_at: new Date().toISOString(),
            });

            if (error) throw error;

            // --- Send WhatsApp Notification ---
            const originBranch = branches.find(b => b.id === formData.origin_branch_id);
            const destBranch = branches.find(b => b.id === formData.destination_branch_id);

            supabase.functions.invoke('send-whatsapp', {
                body: {
                    receiver_phone: formData.receiver_phone,
                    receiver_name: formData.receiver_name,
                    sender_name: formData.sender_name,
                    tracking_number: trackingNumber,
                    origin_branch: originBranch?.name || 'Unknown',
                    destination_branch: destBranch?.name || 'Unknown',
                },
            }).then(({ error: waError }) => {
                if (waError) {
                    // Non-blocking: log it but don't fail the user's flow
                    console.warn('WhatsApp notification failed (non-critical):', waError.message);
                } else {
                    console.log('WhatsApp notification sent successfully.');
                }
            });

            alert(`Shipment Received! Tracking Number: ${trackingNumber}`);
            onSuccess();
            // Reset form but keep origin locked
            // Reset form but keep origin selections
            setFormData(prev => ({
                sender_name: '',
                sender_phone: '',
                receiver_name: '',
                receiver_phone: '',
                origin_branch_id: prev.origin_branch_id, // Keep last selected origin
                destination_branch_id: '',
                description: '',
                delivery_date: '',
            }));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-4xl mx-auto font-sans">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span>Deliveries</span>
                    <span>›</span>
                    <span className="text-gray-900 font-bold">Register Arrival</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Register Received Package</h2>
                <p className="text-gray-500 mt-1">Register a package that has arrived at <span className="font-bold text-gray-900">{currentBranch?.name || 'this branch'}</span>.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sender Information */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold text-lg">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                                <User size={18} />
                            </div>
                            <h3>Sender Information</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        name="sender_name"
                                        value={formData.sender_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Sender Name"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        name="sender_phone"
                                        value={formData.sender_phone}
                                        onChange={handleChange}
                                        required
                                        placeholder="Sender Phone"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receiver Information */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold text-lg">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                <User size={18} />
                            </div>
                            <h3>Receiver Information</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        name="receiver_name"
                                        value={formData.receiver_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Receiver Name"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        name="receiver_phone"
                                        value={formData.receiver_phone}
                                        onChange={handleChange}
                                        required
                                        placeholder="Receiver Phone"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Route & Logistics */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold text-lg">
                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                            <Truck size={18} />
                        </div>
                        <h3>Route & Logistics</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">From City (Origin)</label>
                            <div className="relative">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    name="origin_branch_id"
                                    value={formData.origin_branch_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-transparent focus:bg-white border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all appearance-none font-medium cursor-pointer"
                                >
                                    <option value="">Select Origin Branch</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">To City (Destination)</label>
                            <div className="relative">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    name="destination_branch_id"
                                    value={formData.destination_branch_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-transparent focus:bg-white border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all appearance-none font-medium cursor-pointer"
                                >
                                    <option value="">Select Destination Branch</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Arrival Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    name="delivery_date"
                                    value={formData.delivery_date}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-600 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Package Description (Optional)</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Describe items, fragility, or special handling instructions..."
                            className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none font-medium"
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onSuccess} // Or a separate cancel handler
                        className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <X size={18} />
                        Cancel Registration
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold uppercase tracking-wide rounded-xl shadow-lg shadow-green-500/20 transition-all hover:shadow-xl hover:shadow-green-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {loading ? 'Processing...' : 'Register Arrival'}
                    </button>
                </div>

            </form >
        </div >
    );
}
