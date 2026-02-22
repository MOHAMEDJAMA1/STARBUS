import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            if (user) navigate('/');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">

            {/* Top Navbar */}
            <div className="w-full px-8 py-6 flex justify-between items-center bg-white border-b border-gray-100">
                <div className="flex items-center gap-3">
                    {/* Logo Icon */}
                    <div className="w-8 h-8 flex items-center justify-center">
                        <div className="w-6 h-6 bg-green-500 transform rotate-45 rounded-sm flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">STARBUS</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">

                {/* Main Text */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in to STARBUS</h1>
                    <p className="text-gray-500 font-medium">Logistics & Branch Management Portal</p>
                </div>

                {/* Card */}
                <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl overflow-hidden relative">

                    {/* Card Header Pattern */}
                    <div className="h-40 bg-green-100/50 relative flex items-center justify-center overflow-hidden">
                        {/* Dot Pattern Overlay */}
                        <div className="absolute inset-0 opacity-30"
                            style={{
                                backgroundImage: 'radial-gradient(#22c55e 1.5px, transparent 1.5px)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '10px 10px'
                            }}>
                        </div>

                        {/* Center Icon */}
                        <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md">
                            <Truck size={32} className="text-green-500" fill="currentColor" strokeWidth={0} />
                        </div>
                    </div>

                    <div className="p-8 pt-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">

                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-gray-700">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                        placeholder="e.g., name@starbus.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-bold text-gray-700">Password</label>
                                    <a href="#" className="text-xs font-bold text-green-600 hover:text-green-700">Forgot?</a>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium tracking-widest"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 mt-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all hover:shadow-xl hover:shadow-green-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Logging in...' : 'Login to Dashboard'}
                                <ArrowRight size={20} />
                            </button>

                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium py-3">
                                <ShieldCheck size={14} />
                                Secure biometric & SSO ready
                            </div>
                        </form>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="mt-12 text-center space-y-3">
                    <div className="flex justify-center gap-8 text-sm text-gray-500 font-medium">
                        <a href="#" className="hover:text-gray-800 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-800 transition-colors">Terms of Service</a>
                    </div>
                    <p className="text-xs text-gray-400">© 2024 STARBUS LOGISTICS. ALL RIGHTS RESERVED.</p>
                </div>

            </div>
        </div >
    );
}
