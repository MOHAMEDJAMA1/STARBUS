"use client";

import { DashboardHeader } from "@/components/DashboardHeader";
import { useEffect, useState } from "react";
import Link from "next/link";

interface TeacherDashboardData {
    teacherName: string;
    subject: string;
    todayClasses: Array<{
        period: number;
        className: string;
        subjectName: string;
    }>;
    totalClasses: number;
    totalStudents: number;
}

export default function TeacherDashboard() {
    const [data, setData] = useState<TeacherDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
    const todayName = DAYS_OF_WEEK[today.getDay()];

    useEffect(() => {
        const loadData = async () => {
            try {
                const { getTeacherDashboardData } = await import("@/lib/actions/teacher");
                const result = await getTeacherDashboardData();
                setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <>
            <DashboardHeader />

            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dulmarka Macallinka</h1>
                    <p className="text-slate-500 mt-1">Ku soo dhawoow {data?.teacherName || ''}.</p>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-20">Waa la soo raraa...</div>
                ) : (
                    <div className="space-y-8 max-w-3xl mx-auto">
                        {/* Teacher Info Card */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-xl text-white">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30 shrink-0">
                                    <span className="material-icons text-3xl">school</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium opacity-90">Macallin</p>
                                    <h2 className="text-xl md:text-2xl font-black truncate" title={data?.teacherName}>{data?.teacherName}</h2>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                <p className="text-xs font-bold opacity-75 uppercase tracking-wider mb-1">Maadada</p>
                                <p className="text-3xl font-black">{data?.subject || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Announcements Section */}
                        <div className="mt-8 mb-8">
                            <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                                <span className="material-icons text-emerald-600">campaign</span>
                                Farriimaha & Ogeysiisyada
                            </h3>

                            <TeacherAnnouncementsList />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function timeAgo(date: string | Date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return past.toLocaleDateString();
}

function TeacherAnnouncementsList() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { getTeacherAnnouncements } = await import("@/lib/actions/announcements");
            const data = await getTeacherAnnouncements();
            setAnnouncements(data);
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return <div className="text-sm text-slate-400">Soo dadajinaya farriimaha...</div>;

    if (announcements.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
                <p className="text-slate-400 text-sm font-medium">Hadda ma jiraan farriimo cusub.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((msg) => (
                <div key={msg.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div>
                            <h4 className="font-bold text-slate-900 text-md">{msg.title}</h4>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                {msg.author || 'Maamulka'}
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                            {timeAgo(msg.createdAt)}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mt-2 relative z-10">{msg.content}</p>
                    <span className="material-icons absolute -bottom-4 -right-4 text-8xl text-slate-50 opacity-50 -z-0 rotate-12">campaign</span>
                </div>
            ))}
        </div>
    );
}
