"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (password.length < 6) {
            setError("Lambarka sirta ah waa inuu ka koobnaadaa ugu yaraan 6 xarfo.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Lambarka sirta ah isma laha.");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("password", password);

            const { updatePassword } = await import("@/lib/actions/auth");
            const result = await updatePassword(formData);

            if (result?.error) {
                setError(result.error);
                setLoading(false);
            }
            // Redirect happens in the server action

        } catch (err) {
            console.error("Password change error", err);
            setError("Khalad ayaa dhacay. Fadlan isku day markale.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding */}
            <div className="hidden lg:flex flex-col bg-slate-900 text-white p-12 justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <div className="bg-white p-3 rounded-2xl mb-8 w-fit shadow-2xl shadow-blue-500/20">
                        <img src="/logo.png" alt="SOMEDU Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter mb-4 text-white uppercase italic">SOMEDU</h1>
                    <p className="text-slate-400 text-lg max-w-sm leading-relaxed font-medium">
                        Madal waxbarasho oo casri ah, looguna talagalay horumarinta dugsiyada Soomaaliyeed.
                    </p>
                </div>
                <div className="relative z-10 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    © 2026 SOMEDU PERFORMANCE. All rights reserved.
                </div>

                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
            </div>

            {/* Right: Form */}
            <div className="flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bedel Lambarka Sirta</h2>
                        <p className="text-slate-500 mt-2 text-sm">Ammaanka awgiis, fadlan bedel lambarkaaga sirta ah markaad ugu horreyso.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
                                <span className="material-icons text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Lambarka Sirta Cusub</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-icons text-slate-400 group-focus-within:text-primary transition-colors text-sm">lock</span>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 focus:bg-white text-sm font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Xaqiiji Lambarka Sirta</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-icons text-slate-400 group-focus-within:text-primary transition-colors text-sm">lock_clock</span>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 focus:bg-white text-sm font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                "Bedel & Gal"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
