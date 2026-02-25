"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

interface Grade {
    id: string;
    examType: string;
    examName: string;
    score: number;
    maxScore: number;
    percentage: number;
    date: string;
    subjectName: string;
}

export default function StudentGradesPage() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const { getStudentGrades } = await import("@/lib/actions/student");
                const data = await getStudentGrades();
                setGrades(data.map((g: any) => ({
                    id: g.id,
                    examType: g.exam_type,
                    examName: g.exam_name,
                    score: g.score,
                    maxScore: g.max_score,
                    percentage: g.percentage,
                    date: g.date,
                    subjectName: g.subjects?.name || "Unknown"
                })));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, []);

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return "text-green-600 bg-green-50";
        if (percentage >= 80) return "text-blue-600 bg-blue-50";
        if (percentage >= 70) return "text-yellow-600 bg-yellow-50";
        if (percentage >= 60) return "text-orange-600 bg-orange-50";
        return "text-red-600 bg-red-50";
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
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dhibcaha</h1>
                    <p className="text-slate-500 mt-1">Arag natiijadaada imtixaannada</p>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-20">Waa la soo raraa...</div>
                ) : grades.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                        <span className="material-icons text-6xl text-slate-300 mb-4">assessment</span>
                        <h3 className="font-bold text-slate-900 mb-2">Dhibco lama helin</h3>
                        <p className="text-slate-500">Macallimiintu weli ma gelin dhibcahaaga</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {grades.map((grade) => (
                            <div key={grade.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-slate-900 text-lg">{grade.subjectName}</h3>
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase">
                                                {getExamTypeLabel(grade.examType)}
                                            </span>
                                        </div>
                                        {grade.examName && (
                                            <p className="text-slate-600 font-medium mb-1">{grade.examName}</p>
                                        )}
                                        <p className="text-sm text-slate-500">
                                            {new Date(grade.date).toLocaleDateString('so-SO', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 font-medium mb-1">Dhibco</p>
                                            <p className="text-2xl font-black text-slate-900">
                                                {grade.score}/{grade.maxScore}
                                            </p>
                                        </div>

                                        <div className={`px-6 py-4 rounded-xl ${getGradeColor(grade.percentage)}`}>
                                            <p className="text-xs font-bold opacity-75 mb-1">Boqolkiiba</p>
                                            <p className="text-3xl font-black">{grade.percentage.toFixed(1)}%</p>
                                        </div>
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
