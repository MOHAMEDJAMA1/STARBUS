"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

interface SubjectGrade {
    subjectId: string;
    subjectName: string;
    midterm?: {
        score: number;
        maxScore: number;
        percentage: number;
        date: string;
    };
    final?: {
        score: number;
        maxScore: number;
        percentage: number;
        date: string;
    };
    overallPercentage: number;
    status: 'pass' | 'fail' | 'pending';
}

export default function StudentResultsPage() {
    const [results, setResults] = useState<SubjectGrade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const { getStudentResults } = await import("@/lib/actions/student");
                const data = await getStudentResults();
                setResults(data as SubjectGrade[]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const getStatusBadge = (status: string) => {
        if (status === 'pass') {
            return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black rounded-full uppercase">Guuleysan</span>;
        } else if (status === 'fail') {
            return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-full uppercase">Fashilan</span>;
        } else {
            return <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-black rounded-full uppercase">Sugitaan</span>;
        }
    };

    return (
        <>
            <DashboardHeader />

            <div className="p-8 max-w-7xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Natiijooyinka</h1>
                    <p className="text-slate-500 mt-1">Arag natiijadaada maaddo kasta</p>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-20">Waa la soo raraa...</div>
                ) : results.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                        <span className="material-icons text-6xl text-slate-300 mb-4">assignment</span>
                        <h3 className="font-bold text-slate-900 mb-2">Natiijo lama helin</h3>
                        <p className="text-slate-500">Macallimiintu weli ma gelin natiijadaada</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <div className="min-w-[900px]">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm">
                                    <div className="col-span-3">Maadada</div>
                                    <div className="col-span-2 text-center">Midterm</div>
                                    <div className="col-span-2 text-center">Final</div>
                                    <div className="col-span-2 text-center">Overall</div>
                                    <div className="col-span-3 text-center">Status</div>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y divide-slate-100">
                                    {results.map((subject) => (
                                        <div key={subject.subjectId} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-slate-50 transition-colors">
                                            {/* Subject Name */}
                                            <div className="col-span-3 flex items-center">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{subject.subjectName}</h3>
                                                </div>
                                            </div>

                                            {/* Midterm */}
                                            <div className="col-span-2 flex items-center justify-center">
                                                {subject.midterm ? (
                                                    <div className="text-center">
                                                        <div className="font-bold text-slate-900">
                                                            {subject.midterm.score}/{subject.midterm.maxScore}
                                                        </div>
                                                        <div className={`text-sm font-bold ${subject.midterm.percentage >= 60 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {subject.midterm.percentage.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm font-medium">—</span>
                                                )}
                                            </div>

                                            {/* Final */}
                                            <div className="col-span-2 flex items-center justify-center">
                                                {subject.final ? (
                                                    <div className="text-center">
                                                        <div className="font-bold text-slate-900">
                                                            {subject.final.score}/{subject.final.maxScore}
                                                        </div>
                                                        <div className={`text-sm font-bold ${subject.final.percentage >= 60 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {subject.final.percentage.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm font-medium">—</span>
                                                )}
                                            </div>

                                            {/* Overall */}
                                            <div className="col-span-2 flex items-center justify-center">
                                                {subject.overallPercentage > 0 ? (
                                                    <div className={`text-2xl font-black ${subject.overallPercentage >= 60 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {subject.overallPercentage.toFixed(1)}%
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm font-medium">—</span>
                                                )}
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-3 flex items-center justify-center">
                                                {getStatusBadge(subject.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
