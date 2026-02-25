"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

interface AttendanceSummary {
    subjectId: string;
    subjectName: string;
    totalClasses: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
}

export default function StudentAttendancePage() {
    const [attendance, setAttendance] = useState<AttendanceSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const { getStudentAttendanceSummary } = await import("@/lib/actions/student");
                const data = await getStudentAttendanceSummary();
                setAttendance(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    const getStatusColor = (percentage: number) => {
        if (percentage >= 90) return "text-green-600 bg-green-50 border-green-200";
        if (percentage >= 75) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <>
            <DashboardHeader />

            <div className="p-8 max-w-7xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Xaadirnimada</h1>
                    <p className="text-slate-500 mt-1">Arag xaadirnimadaada maaddo kasta</p>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-20">Waa la soo raraa...</div>
                ) : attendance.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                        <span className="material-icons text-6xl text-slate-300 mb-4">event_busy</span>
                        <h3 className="font-bold text-slate-900 mb-2">Xaadirnimo lama diiwaan gelin</h3>
                        <p className="text-slate-500">Macallimiintu weli ma diiwan gelinayan xaadirnimadaada</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {attendance.map((item) => (
                            <div key={item.subjectId} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="font-bold text-slate-900 text-lg">{item.subjectName}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${getStatusColor(item.percentage)}`}>
                                        {item.percentage.toFixed(1)}%
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 font-medium">Wadarta Fasalka:</span>
                                        <span className="font-bold text-slate-900">{item.totalClasses}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                            <span className="material-icons text-sm">check_circle</span>
                                            Jooga:
                                        </span>
                                        <span className="font-bold text-green-600">{item.present}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                                            <span className="material-icons text-sm">cancel</span>
                                            Maqnaa:
                                        </span>
                                        <span className="font-bold text-red-600">{item.absent}</span>
                                    </div>
                                    {item.late > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
                                                <span className="material-icons text-sm">schedule</span>
                                                Daahay:
                                            </span>
                                            <span className="font-bold text-orange-600">{item.late}</span>
                                        </div>
                                    )}
                                    {item.excused > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                                                <span className="material-icons text-sm">info</span>
                                                Fasax:
                                            </span>
                                            <span className="font-bold text-blue-600">{item.excused}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${item.percentage >= 90 ? 'bg-green-500' :
                                                    item.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
