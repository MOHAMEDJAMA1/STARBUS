"use client";

import { useEffect, useState } from "react";
import { Class } from "@/types/data";

export default function AdminAttendancePage() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const loadData = async () => {
        setLoading(true);
        const schoolId = getCookie("school_id");
        if (schoolId) {
            try {
                const { getAttendanceStats } = await import("@/lib/actions/admin");
                // @ts-ignore
                const data = await getAttendanceStats(schoolId);
                // @ts-ignore
                setStats(data);
            } catch (e) {
                console.error(e);
            }
        }
        setLoading(false);
    };

    const globalRate = stats.length
        ? stats.reduce((acc, curr) => acc + curr.attendanceRate, 0) / stats.length
        : 0;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-icons text-primary">analytics</span>
                    Attendance Reports
                </h1>
                <p className="text-slate-500">Overview of student attendance across the school.</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Overview Card */}
                    <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 font-medium mb-1 uppercase tracking-wider text-xs">Average Daily Attendance</p>
                                <h2 className="text-5xl font-black">{globalRate.toFixed(1)}%</h2>
                                <p className="mt-2 text-sm text-blue-100 bg-white/10 inline-block px-3 py-1 rounded-full">
                                    <span className="font-bold">All Time</span>
                                </p>
                            </div>
                            <div className="hidden md:block">
                                <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center">
                                    <span className="material-icons text-4xl">trending_up</span>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Pattern */}
                        <div className="absolute right-0 bottom-0 opacity-10">
                            <span className="material-icons text-[200px] -mb-10 -mr-10">groups</span>
                        </div>
                    </div>

                    {/* Class Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Class Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[700px]">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 md:px-6 py-4">Class</th>
                                        <th className="px-4 md:px-6 py-4 text-center">Students</th>
                                        <th className="px-4 md:px-6 py-4">Attendance Rate</th>
                                        <th className="px-4 md:px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No attendance data available.</td>
                                        </tr>
                                    ) : (
                                        stats.map((stat) => (
                                            <tr key={stat.class.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 md:px-6 py-4 font-bold text-slate-700">
                                                    Grade {stat.class.grade}-{stat.class.section}
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-center font-mono text-slate-500">
                                                    {stat.totalStudents}
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${stat.attendanceRate >= 95 ? 'bg-emerald-500' :
                                                                    stat.attendanceRate >= 85 ? 'bg-blue-500' : 'bg-amber-500'
                                                                    }`}
                                                                style={{ width: `${stat.attendanceRate}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="font-bold text-slate-700 w-12 text-right">
                                                            {stat.attendanceRate.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-right">
                                                    {stat.attendanceRate >= 95 ? (
                                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">Excellent</span>
                                                    ) : stat.attendanceRate >= 90 ? (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">Good</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">Average</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
