"use client";

import { useEffect, useState } from "react";
import { School } from "@/types/data";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

export default function OwnerDashboard() {
    const [stats, setStats] = useState({ schools: 0, managers: 0, teachers: 0, students: 0 });
    const [schools, setSchools] = useState<School[]>([]);

    useEffect(() => {
        // Load initial stats
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const { getOwnerDashboardData } = await import("@/lib/actions/owner");
            const data = await getOwnerDashboardData();
            setSchools(data.schools);
            setStats(data.stats);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Guudmar Nidaamka</h1>
                <p className="text-slate-500 mt-1">Waxaa maamula SOMEDU Performance Platform</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard title="Wadarta Dugsiyada" value={stats.schools} icon="school" color="blue" />
                <StatCard title="Maamulayaasha" value={stats.managers} icon="admin_panel_settings" color="indigo" />
                <StatCard title="Wadarta Macallimiinta" value={stats.teachers} icon="people" color="emerald" />
                <StatCard title="Wadarta Ardayda" value={stats.students} icon="groups" color="amber" />
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Dugsiyadii U Dambeeyay</h2>
                <Link href="/owner/schools" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                    Maamul Dhammaan Dugsiyada <span className="material-icons text-sm">arrow_forward</span>
                </Link>
            </div>

            {schools.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {schools.slice(0, 3).map(school => (
                        <div key={school.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                                    🏫
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{school.name}</h3>
                                    <p className="text-xs text-slate-500 font-mono">{school.slug}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded w-fit">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Active
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="Weli dugsi ma jiro"
                    description="Ku billow adigoo abuuraya dugsigii ugu horreeyay nidaamka."
                    icon="domain_disabled"
                    actionLabel="Abuur Dugsi"
                    onAction={() => window.location.href = '/owner/schools'}
                />
            )}
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
    }[color] || "bg-slate-50 text-slate-600 border-slate-100";

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 border ${colorClasses}`}>
                <span className="material-icons text-2xl">{icon}</span>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{value}</h3>
        </div>
    );
}
