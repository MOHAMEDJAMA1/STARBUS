"use client";

import { useEffect, useState } from "react";

export default function StudentTimetablePage() {
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const { getStudentTimetable } = await import("@/lib/actions/student");
                const data = await getStudentTimetable();
                setTimetable(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTimetable();
    }, []);

    const getTimetableSlot = (day: string, period: number) => {
        return timetable.find(t => t.dayOfWeek === day && t.periodNumber === period);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Jadwalka Fasalka</h1>
                <p className="text-slate-500 text-sm font-medium">Jadwalka toddobaadka oo dhan ee fasalkaaga</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto pb-2">
                        <table className="w-full text-left text-sm min-w-[1000px]">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 sticky left-0 bg-slate-50 z-20 shadow-sm">Period</th>
                                    {DAYS.map(day => (
                                        <th key={day} className="px-6 py-4 text-center min-w-[120px]">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(() => {
                                    const maxPeriod = Math.max(8, ...timetable.map(t => t.periodNumber));
                                    const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

                                    return periods.map(period => (
                                        <tr key={period} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 sticky left-0 bg-white z-20 shadow-sm">
                                                Period {period}
                                            </td>
                                            {DAYS.map(day => {
                                                const slot = getTimetableSlot(day, period);
                                                return (
                                                    <td key={`${day}-${period}`} className="px-6 py-4 text-center">
                                                        {slot ? (
                                                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                                                <p className="font-bold text-blue-900 text-sm">{slot.subjectName}</p>
                                                                <p className="text-xs text-blue-600 mt-1">{slot.teacherName}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-300 text-xs">-</div>
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
    );
}
