"use client";

import { DashboardHeader } from "@/components/DashboardHeader";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        managers: 0,
        teachers: 0,
        students: 0,
        classes: 0
    });
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [attendanceStats, setAttendanceStats] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const { getAdminDashboardData } = await import("@/lib/actions/admin");
                const data = await getAdminDashboardData();
                if (data) {
                    setStats(data.stats);
                    setAnnouncements(data.announcements);
                    setAttendanceStats(data.attendanceStats);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <>
            <DashboardHeader />

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dulmarka Dashboard-ka</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Sannad Dugsiyeedka 2026-2027</span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Simisterka Gu'ga</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                    <Link href="/admin/students" className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded border border-border-light dark:border-slate-800 shadow-sm transition-colors hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer block group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-icons">groups</span>
                            </div>
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded border border-green-100 dark:border-green-800">
                                <span className="material-icons text-[10px]">trending_up</span> 2.4%
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Ardayda Guud</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{loading ? "..." : stats.students}</h3>
                    </Link>
                    <Link href="/admin/teachers" className="bg-white dark:bg-slate-900 p-6 rounded border border-border-light dark:border-slate-800 shadow-sm transition-colors hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer block group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-icons">person_2</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                                Deggan
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider group-hover:text-purple-600 transition-colors">Tirada Shaqaalaha</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{loading ? "..." : stats.teachers + stats.managers}</h3>
                    </Link>
                    <Link href="/admin/classes" className="bg-white dark:bg-slate-900 p-6 rounded border border-border-light dark:border-slate-800 shadow-sm transition-colors hover:border-orange-300 dark:hover:border-orange-700 cursor-pointer block group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-icons">class</span>
                            </div>
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-800">
                                <span className="material-icons text-[10px]">trending_down</span> 0.8%
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider group-hover:text-orange-600 transition-colors">Fasallada</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{loading ? "..." : stats.classes}</h3>
                    </Link>
                </div>

                <div className="grid grid-cols-12 gap-6 mb-8">
                    <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 rounded border border-border-light dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-tight">Warbixinta Xaadirinta (Fasallada)</h3>
                            <button className="text-primary dark:text-blue-400 text-xs font-bold flex items-center gap-1 hover:underline">
                                Arag Faahfaahin <span className="material-icons text-xs">arrow_forward</span>
                            </button>
                        </div>
                        <div className="p-6 flex-1">
                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {attendanceStats.length > 0 ? (
                                    attendanceStats.map((stat, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                                    {stat.class.name} <span className="text-slate-400 font-normal">({stat.class.education_level})</span>
                                                </span>
                                                <span className={`font-bold ${stat.attendanceRate >= 90 ? 'text-emerald-500' :
                                                    stat.attendanceRate >= 75 ? 'text-blue-500' :
                                                        'text-red-500'
                                                    }`}>
                                                    {stat.attendanceRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${stat.attendanceRate >= 90 ? 'bg-emerald-500' :
                                                        stat.attendanceRate >= 75 ? 'bg-blue-500' :
                                                            'bg-red-500'
                                                        }`}
                                                    style={{ width: `${stat.attendanceRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-400 py-8 text-xs">
                                        Weli xog xaadirin ah lama helin.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 rounded border border-border-light dark:border-slate-800 shadow-sm flex flex-col transition-colors">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-tight">Ogeysiisyada Gudaha</h3>
                        </div>
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[400px]">
                            {announcements.length > 0 ? (
                                announcements.map((ann) => (
                                    <div key={ann.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700 border-l-4 border-l-primary">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{ann.title}</p>
                                            <span className="text-[9px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">
                                                {ann.targetClass}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{ann.content}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                                                {ann.authorRole === 'teacher' ? 'Macallin' : 'Maamul'} {ann.authorName}
                                            </span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                                                {timeAgo(ann.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <span className="material-icons text-3xl mb-2 opacity-50">notifications_off</span>
                                    <p className="text-xs">Weli fariimo lama dirin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <footer className="h-10 border-t border-border-light dark:border-slate-800 flex items-center justify-between mt-auto bg-white dark:bg-slate-900 text-[10px] text-slate-400 dark:text-slate-500 font-bold transition-colors">
                    <p>© 2026 SOMEDU - PERFORMANCE SYSTEM V1.0.0</p>
                    <div className="flex gap-4">
                        <a className="hover:text-primary dark:hover:text-white transition-colors uppercase tracking-widest" href="#">Privacy Policy</a>
                        <a className="hover:text-primary dark:hover:text-white transition-colors uppercase tracking-widest" href="#">Support Desk</a>
                    </div>
                </footer>
            </div>
        </>
    );
}

function timeAgo(date: string | Date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return past.toLocaleDateString();
}
