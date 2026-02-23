import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Lock, Mail, User } from 'lucide-react';

export default function CreateWorkerForm() {
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        branch_id: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        // Fetch branches for dropdown
        const fetchBranches = async () => {
            const { data } = await supabase.from('branches').select('id, name');
            if (data) setBranches(data);
        };
        fetchBranches();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: formData
            });

            // Network/invocation error (function unreachable) — show the real error
            if (error) throw new Error(error.message || String(error));

            // Function-level error (returned in body)
            if (data?.error) throw new Error(data.error);

            setMessage({ type: 'success', text: data?.warning || 'Worker account created successfully!' });
            setFormData({ email: '', password: '', full_name: '', branch_id: '' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl font-sans">
            <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <UserPlus size={20} />
                </div>
                Add New Branch Worker
            </h3>

            {message.text && (
                <div className={`p-4 rounded-lg mb-6 text-sm font-medium flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${message.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}></span>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            required
                            placeholder="Ali Ahmed"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-gray-400"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="email"
                            required
                            placeholder="worker@starbus.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-gray-400"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="password"
                            required
                            placeholder="Min 6 characters"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-gray-400"
                            minLength={6}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Assign to Branch</label>
                    <div className="relative">
                        <select
                            required
                            value={formData.branch_id}
                            onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                            className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select Branch</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg shadow-green-500/20 transition-all hover:shadow-xl hover:shadow-green-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Worker...' : 'Create Worker Account'}
                    </button>
                </div>
            </form>
        </div>
    );
}
