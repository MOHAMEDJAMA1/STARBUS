"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function TeacherClassesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const { getTeacherClasses } = await import("@/lib/actions/teacher");
            const data = await getTeacherClasses();
            setClasses(data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <>
            <DashboardHeader />

            <div className="p-8 max-w-7xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fasalladaada</h1>
                    <p className="text-slate-500 mt-1">Liiska fasallada aad wax u dhigto</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-emerald-500"></div>
                    </div>
                ) : classes.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <span className="material-icons text-5xl mb-2 opacity-20">school</span>
                        <p className="font-medium">Laguma qorin fasallo</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((cls) => (
                            <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20">
                                            {cls.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{cls.name}</h3>
                                            <p className="text-sm text-slate-500 font-medium">Fasalka {cls.grade}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Qeybta:</span>
                                            <span className="font-bold text-slate-900">{cls.section}</span>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <a href="/teacher/attendance" className="flex-1 py-2 text-center text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                                                Xaadirinta
                                            </a>
                                            <a href="/teacher/grades" className="flex-1 py-2 text-center text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                                Dhibcaha
                                            </a>
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
