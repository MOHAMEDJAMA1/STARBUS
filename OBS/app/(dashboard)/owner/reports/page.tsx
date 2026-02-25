"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";

export default function OwnerReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const { getSystemReports } = await import("@/lib/actions/owner");
            const data = await getSystemReports();
            setReports(data);
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Warbixinno</h1>
                <p className="text-slate-500 font-medium">Guudmar guud ee waxqabadka dhammaan dugsiyada</p>
            </div>

            {reports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Render report cards or charts here */}
                    {reports.map((report, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h3 className="font-bold text-slate-900">{report.school_name}</h3>
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Ardayda:</span>
                                    <span className="font-bold">{report.student_count}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Celceliska:</span>
                                    <span className="font-bold text-blue-600">{report.average_score}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="Ma jiraan warbixinno"
                    description="Xog ku filan weli lagama helin dugsiyada si loo soo bandhigo warbixin. Hubi in xogta nidaamka la cusboonaysiiyay."
                    icon="analytics"
                    actionLabel="Cusboonaysii"
                    onAction={loadReports}
                />
            )}
        </div>
    );
}
