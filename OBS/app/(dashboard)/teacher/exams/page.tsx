"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function TeacherExamsPage() {
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        setLoading(true);
        try {
            const { getTeacherExams } = await import("@/lib/actions/teacher");
            const data = await getTeacherExams();
            setExams(data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const getExamTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            midterm: "Baaris-Dhexe",
            final: "Imtixaan Ugu Dambeeya",
            quiz: "Tijaabo",
            assignment: "Shaqo",
            project: "Mashruuc"
        };
        return labels[type] || type;
    };

    return (
        <>
            <DashboardHeader />

            <div className="p-8 max-w-7xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Jadwalka Imtixaannada</h1>
                    <p className="text-slate-500 mt-1">Arag imtixaannada maadooyinkaaga</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-emerald-500"></div>
                    </div>
                ) : exams.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center border-dashed">
                        <span className="material-icons text-6xl text-slate-300 mb-4">event_busy</span>
                        <h3 className="font-bold text-slate-900 mb-2">Imtixaan lama qorsheyn</h3>
                        <p className="text-slate-500">Weli imtixaan laguma qorin maadooyinkaaga</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map((exam) => (
                            <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 mb-2 inline-block">
                                            {getExamTypeLabel(exam.exam_type)}
                                        </span>
                                        <h3 className="font-bold text-slate-900 text-lg">{exam.subjects?.name}</h3>
                                        <p className="text-sm text-slate-500 font-medium mt-1">
                                            Fasalka: {exam.classes?.name}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        <span className="material-icons">event</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <span className="material-icons text-lg opacity-50">calendar_today</span>
                                        <span className="font-medium text-sm">
                                            {new Date(exam.exam_date).toLocaleDateString('so-SO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <span className="material-icons text-lg opacity-50">schedule</span>
                                        <span className="font-medium text-sm">
                                            {exam.start_time} - {exam.end_time}
                                        </span>
                                    </div>
                                    {exam.location && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <span className="material-icons text-lg opacity-50">location_on</span>
                                            <span className="font-medium text-sm">{exam.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
