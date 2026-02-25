"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

interface Exam {
    id: string;
    subjectName: string;
    examType: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    notes?: string;
}

export default function StudentExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const { getStudentExams } = await import("@/lib/actions/student");
                const data = await getStudentExams();
                setExams(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const getExamTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            midterm: "Midterm",
            final: "Final Exam",
            quiz: "Quiz",
            assignment: "Assignment",
            project: "Project"
        };
        return labels[type] || type;
    };

    const getExamTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            midterm: "bg-blue-100 text-blue-700 border-blue-200",
            final: "bg-purple-100 text-purple-700 border-purple-200",
            quiz: "bg-yellow-100 text-yellow-700 border-yellow-200",
            assignment: "bg-green-100 text-green-700 border-green-200",
            project: "bg-pink-100 text-pink-700 border-pink-200"
        };
        return colors[type] || "bg-slate-100 text-slate-700";
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (time: string) => {
        return time; // Already in HH:MM format
    };

    return (
        <>
            <DashboardHeader />

            <div className="p-8 max-w-7xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Imtixaannada</h1>
                    <p className="text-slate-500 mt-1">Jadwalka imtixaannadaada soo socda</p>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-20">Waa la soo raraa...</div>
                ) : exams.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                        <span className="material-icons text-6xl text-slate-300 mb-4">event_note</span>
                        <h3 className="font-bold text-slate-900 mb-2">Imtixaan lama qorsheyn</h3>
                        <p className="text-slate-500">Weli ma jiraan imtixaanno la qorsheeyay</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {exams.map((exam) => (
                            <div key={exam.id} className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:shadow-lg transition-all">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    {/* Left: Subject and Type */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-black text-slate-900">{exam.subjectName}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getExamTypeColor(exam.examType)}`}>
                                                {getExamTypeLabel(exam.examType)}
                                            </span>
                                        </div>
                                        {exam.notes && (
                                            <p className="text-sm text-slate-600 mt-2">{exam.notes}</p>
                                        )}
                                    </div>

                                    {/* Right: Date, Time, Location */}
                                    <div className="flex flex-col gap-3 md:items-end">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <span className="material-icons text-sm">calendar_today</span>
                                            <span className="font-bold">{formatDate(exam.date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <span className="material-icons text-sm">schedule</span>
                                            <span className="font-medium">{formatTime(exam.startTime)} - {formatTime(exam.endTime)}</span>
                                        </div>
                                        {exam.location && (
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <span className="material-icons text-sm">location_on</span>
                                                <span className="font-medium">{exam.location}</span>
                                            </div>
                                        )}
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
