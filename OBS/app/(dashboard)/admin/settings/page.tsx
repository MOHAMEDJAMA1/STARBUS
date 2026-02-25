"use client";

import { useEffect, useState } from "react";


export default function AdminSettingsPage() {
    const [email, setEmail] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setEmail(user.email || "");
        };
        loadProfile();
    }, []);

    const handleLogout = async () => {
        const { signOut } = await import("@/lib/actions/auth");
        await signOut();
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">Hagaajin (Settings)</h1>

            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">

                {/* Profile Section */}
                <div>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Macluumaad</h2>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email-kaaga</label>
                        <div className="font-medium text-slate-700">{email || "Soo dadajinaya..."}</div>
                    </div>
                </div>

                {/* Theme Section Removed */}

                {/* Logout Section */}
                <div className="pt-8 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <span className="material-icons">logout</span>
                        Ka Bax (Sign Out)
                    </button>
                </div>

            </div>
        </div>
    );
}
