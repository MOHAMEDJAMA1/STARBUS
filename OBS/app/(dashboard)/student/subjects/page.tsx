"use client";

import { useEffect, useState } from "react";

interface Subject {
    id: string;
    name: string;
    code: string;
}

export default function StudentSubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        setIsLoading(true);
        try {
            const { getStudentSubjects } = await import("@/lib/actions/student_subjects");
            const data = await getStudentSubjects();
            setSubjects(data);
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Maadooyinka</h1>
                <p className="text-slate-500 text-sm font-medium">Maadooyinka aad qaadanayso ee fasalkaaga</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="material-icons text-6xl text-slate-300 mb-4">school</span>
                        <p className="text-slate-500 font-medium">
                            Weli maadooyin laguma darin fasalkaaga
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                            Maamulaha ayaa ku dari doona maadooyinka
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {subjects.map((subject) => (
                            <div
                                key={subject.id}
                                className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="material-icons text-blue-600 text-3xl">
                                        menu_book
                                    </span>
                                    {subject.code && (
                                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            {subject.code}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 mb-1">
                                    {subject.name}
                                </h3>
                                <p className="text-blue-600 text-sm font-medium">
                                    Maadada Fasalka
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
