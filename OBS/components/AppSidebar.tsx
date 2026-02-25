"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
    name: string;
    href: string;
    icon: string;
    badge?: string;
    section?: string;
}

const roleNavItems: Record<string, NavItem[]> = {
    admin: [
        { name: "Dulmar", href: "/admin", icon: "dashboard" },
        { name: "Fasallada", href: "/admin/classes", icon: "class" },
        { name: "Maadooyinka", href: "/admin/subjects", icon: "library_books" },
        { name: "Macallimiinta", href: "/admin/teachers", icon: "badge" },
        { name: "Ardayda", href: "/admin/students", icon: "school" },
        { name: "Xaadirinta", href: "/admin/attendance", icon: "analytics" },
        { name: "Imtixaanaadka (Exams)", href: "/admin/exams", icon: "assignment", section: "Akademik" },
        { name: "Warbixinta Ardayda", href: "/admin/reports", icon: "bar_chart", section: "Akademik" },
        { name: "Jadwalka", href: "/admin/timetable", icon: "calendar_today", section: "Nidaamka" },
        { name: "Upload Excel", href: "/admin/upload", icon: "upload_file", section: "Nidaamka" },
        { name: "Farriimaha", href: "/admin/messages", icon: "email", section: "Nidaamka" },
        { name: "Hagaajin", href: "/admin/settings", icon: "settings", section: "Nidaamka" },
    ],
    teacher: [
        { name: "Dulmar", href: "/teacher", icon: "dashboard" },
        { name: "Jadwalka", href: "/teacher/schedule", icon: "calendar_month" },
        { name: "Fasallada", href: "/teacher/classes", icon: "groups" },
        { name: "Xaadirinta", href: "/teacher/attendance", icon: "how_to_reg" },
        { name: "Imtixaannada", href: "/teacher/exams", icon: "assignment" },
        { name: "Dhibcaha", href: "/teacher/grades", icon: "grade" },
        { name: "Farriimaha", href: "/teacher/messages", icon: "email", section: "Maamulka" },
        { name: "Hagaajin", href: "/teacher/settings", icon: "settings", section: "Maamulka" },
    ],
    student: [
        { name: "Dulmar", href: "/student", icon: "dashboard" },
        { name: "Jadwalka", href: "/student/timetable", icon: "calendar_today" },
        { name: "Maadooyinka", href: "/student/subjects", icon: "library_books" },
        { name: "Xaadirinta", href: "/student/attendance", icon: "pie_chart" },
        { name: "Imtixaannada", href: "/student/exams", icon: "event_note" },
        { name: "Natiijooyinka", href: "/student/results", icon: "assignment_turned_in" },
    ],
    owner: [
        { name: "Dulmar", href: "/owner", icon: "dashboard" },
        { name: "Dugsiyada", href: "/owner/schools", icon: "school" },
        { name: "Warbixinno", href: "/owner/reports", icon: "analytics" },
        { name: "Hagaajin", href: "/owner/settings", icon: "settings", section: "Nidaamka" },
    ],
};

export function AppSidebar() {
    const pathname = usePathname();

    // Determine role based on path start
    const currentRole = pathname.startsWith("/admin")
        ? "admin"
        : pathname.startsWith("/teacher")
            ? "teacher"
            : pathname.startsWith("/student")
                ? "student"
                : pathname.startsWith("/owner")
                    ? "owner"
                    : null;

    if (!currentRole) return null;

    return (
        <aside className="hidden md:flex w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex-col h-screen fixed z-30">
            <SidebarContent currentRole={currentRole} pathname={pathname} />
        </aside>
    );
}

interface SidebarContentProps {
    currentRole: string;
    pathname: string;
}

export function SidebarContent({ currentRole, pathname }: SidebarContentProps) {
    const navItems = roleNavItems[currentRole] || [];
    const [profile, setProfile] = useState<{ firstName: string, lastName: string, role: string, class: string | null } | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            const { getCurrentUserProfile } = await import("@/lib/actions/auth");
            const data = await getCurrentUserProfile();
            if (data) setProfile(data);
        };
        loadProfile();
    }, []);

    // Group items by section (if any)
    const mainItems = navItems.filter((item) => !item.section);
    const systemItems = navItems.filter((item) => item.section === "Nidaamka");
    const adminItems = navItems.filter((item) => item.section === "Maamulka");
    const academicItems = navItems.filter((item) => item.section === "Akademik");

    const getInitials = (f: string, l: string) => `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase();

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-blue-500/10">
                    <img src="/logo.png" alt="SOMEDU" className="w-full h-full object-contain" />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight leading-none text-white italic uppercase italic">SOMEDU</h1>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {currentRole === "admin" ? "Maamulaha Dugsiga" :
                            currentRole === "teacher" ? "Macalinka" :
                                currentRole === "student" ? "Ardayga" : "Maamulaha Sare"}
                    </span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {mainItems.length > 0 && (
                    <>
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Liiska Guud</p>
                        {mainItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group duration-200",
                                    pathname === item.href
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <span className={cn("material-icons text-sm", pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-blue-400")}>{item.icon}</span>
                                <span className="text-sm font-medium">{item.name}</span>
                                {item.badge && (
                                    <span className="ml-auto bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </>
                )}

                {academicItems.length > 0 && (
                    <div className="pt-8">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Akademik</p>
                        {academicItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group duration-200",
                                    pathname === item.href
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <span className={cn("material-icons text-sm", pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-blue-400")}>{item.icon}</span>
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                )}

                {systemItems.length > 0 && (
                    <div className="pt-8">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Nidaamka</p>
                        {systemItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group duration-200",
                                    pathname === item.href
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <span className={cn("material-icons text-sm", pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-blue-400")}>{item.icon}</span>
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                )}

                {adminItems.length > 0 && (
                    <div className="pt-8">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Maamulka</p>
                        {adminItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group duration-200",
                                    pathname === item.href
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <span className={cn("material-icons text-sm", pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-blue-400")}>{item.icon}</span>
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                )}

            </nav>

            <div className="p-4 border-t border-slate-800 mt-auto">
                <div className="bg-slate-800/50 rounded-2xl p-3 flex items-center gap-3 border border-slate-700/50">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xl shadow-blue-600/20 ring-2 ring-slate-800">
                        {profile ? getInitials(profile.firstName, profile.lastName) : "??"}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">
                            {profile ? `${profile.firstName} ${profile.lastName}` : "Waa la sugayaa..."}
                            {profile?.class && (
                                <span className="ml-2 px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-[9px] font-bold">
                                    {profile.class}
                                </span>
                            )}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold truncate uppercase tracking-widest">
                            {currentRole === "owner" ? "Super Admin" :
                                currentRole === "admin" ? "Manager" :
                                    currentRole === "teacher" ? "Macalin" : "Arday"}
                        </p>
                    </div>
                    <Link href="/sign-in" className="text-slate-600 hover:text-red-500 transition-all p-1.5 hover:bg-red-500/10 rounded-lg">
                        <span className="material-icons text-lg">logout</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
