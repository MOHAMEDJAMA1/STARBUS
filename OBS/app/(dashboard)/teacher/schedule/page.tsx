"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


export default function TeacherSchedulePage() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSchedule();
    }, []);

    const loadSchedule = async () => {
        setLoading(true);
        try {
            const { getTeacherWeeklySchedule } = await import("@/lib/actions/teacher");
            const data = await getTeacherWeeklySchedule();
            setSchedule(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const getSlot = (day: string, period: number) => {
        return schedule.find(s => s.dayOfWeek === day && s.periodNumber === period);
    };

    return (
        <>
            <DashboardHeader />

            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-icons text-primary">calendar_month</span>
                        Jadwalka Usbuuciga
                    </h1>
                    <p className="text-slate-500 mt-1">Jadwalkaaga oo dhan ee usbuucan</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[1200px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-slate-700 w-24">Waqtiga</th>
                                        {DAYS.map(day => (
                                            <th key={day} className="px-4 py-3 text-center font-bold text-slate-700 min-w-[140px]">
                                                {day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(() => {
                                        const maxPeriod = Math.max(8, ...schedule.map(s => s.periodNumber));
                                        const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

                                        return periods.map(period => (
                                            <tr key={period} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-4 font-bold text-slate-600 text-center bg-slate-50">
                                                    Period {period}
                                                </td>
                                                {DAYS.map(day => {
                                                    const slot = getSlot(day, period);
                                                    return (
                                                        <td key={`${day}-${period}`} className="px-2 py-2">
                                                            {slot ? (
                                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors">
                                                                    <p className="font-bold text-slate-900 text-xs mb-1">{slot.subjectName}</p>
                                                                    <p className="text-[10px] text-slate-600 font-medium">Fasalka {slot.className}</p>
                                                                </div>
                                                            ) : (
                                                                <div className="h-16 flex items-center justify-center text-slate-300">
                                                                    <span className="material-icons text-sm">remove</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
