"use client";

import { useEffect, useState } from "react";


export function DashboardHeader() {
    const [schoolName, setSchoolName] = useState("SOMEDU");
    const [userRole, setUserRole] = useState("");
    const [profile, setProfile] = useState<{ firstName: string, lastName: string, class?: string | null } | null>(null);

    useEffect(() => {
        // Parse cookies
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        };

        const schoolId = getCookie("school_id");
        const role = getCookie("user_role");

        if (role) setUserRole(role);

        const loadData = async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const { getCurrentUserProfile } = await import("@/lib/actions/auth");
            const supabase = createClient();

            // Fetch School Name
            if (schoolId) {
                const { data } = await supabase.from("schools").select("name").eq("id", schoolId).single();
                if (data) setSchoolName(data.name);
            }

            // Fetch Profile
            const profileData = await getCurrentUserProfile();
            if (profileData) setProfile(profileData);
        };

        loadData();
    }, []);

    const roleLabel = userRole === "owner" ? "Maamulaha Sare"
        : userRole === "admin" ? "Maamulaha Dugsiga"
            : userRole === "teacher" ? "Macalinka"
                : userRole === "student" ? "Ardayga"
                    : "SOMEDU User";

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 z-20 sticky top-0 shadow-sm shadow-slate-200/50 dark:shadow-none transition-colors duration-200 shrink-0">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <span className="text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[120px] md:max-w-none">{schoolName}</span>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                <div className="flex items-center gap-2 hidden md:flex">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">{roleLabel}</span>
                    {(userRole === "admin" || userRole === "owner") && (
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[9px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">
                            {userRole === "owner" ? "Super Admin" : "Admin"}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pr-4 md:border-r md:border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-900 dark:bg-slate-700 flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-slate-900/10 dark:shadow-none shrink-0">
                        {profile ? `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() : "??"}
                    </div>
                    <div className="hidden md:flex flex-col">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-none">
                            {profile ? `${profile.firstName} ${profile.lastName}` : "Waa la sugayaa..."}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-1">
                            {roleLabel} {profile?.class ? `• ${profile.class}` : ""}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
