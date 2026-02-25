"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import Link from "next/link";

interface StudentInfo {
    firstName: string;
    lastName: string;
    className: string;
    todayClasses: Array<{
        period: number;
        subject: string;
        teacher: string;
    }>;
}

export default function StudentDashboard() {
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const today = new Date();
    const todayName = DAYS_OF_WEEK[today.getDay() === 0 ? 6 : today.getDay() - 1];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { getStudentInfo } = await import("@/lib/actions/student");
                const result = await getStudentInfo();
                setStudentInfo(result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <>
            <DashboardHeader />

            <div className="p-8 max-w-7xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dulmarka Ardayga</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Ku soo dhawoow {studentInfo?.firstName || ''}. Halkan waxaad ka arki kartaa macluumaadkaaga.</p>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400 py-20">Waa la soo raraa...</div>
                ) : (
                    <div className="space-y-8">
                        {/* Student Info Card */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-xl text-white max-w-3xl mx-auto">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30 shrink-0">
                                    <span className="material-icons text-3xl">person</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium opacity-90">Ardayga</p>
                                    <h2 className="text-xl md:text-2xl font-black truncate" title={`${studentInfo?.firstName} ${studentInfo?.lastName}`}>
                                        {studentInfo?.firstName} {studentInfo?.lastName}
                                    </h2>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                <p className="text-xs font-bold opacity-75 uppercase tracking-wider mb-1">Fasalka</p>
                                <p className="text-3xl font-black">{studentInfo?.className || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Announcements Section */}
                        <div className="mt-8 mb-8 max-w-3xl mx-auto">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                                <span className="material-icons text-blue-600 dark:text-blue-400">campaign</span>
                                Farriimaha & Ogeysiisyada
                            </h3>

                            <StudentAnnouncementsList />
                        </div>
                    </div>
                )}
                <div className="mt-8 mb-8">
                    {/* Duplicate removed */}
                </div>
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

function StudentAnnouncementsList() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { getStudentAnnouncements } = await import("@/lib/actions/announcements");
            const data = await getStudentAnnouncements();
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
                <div key={msg.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-md">{msg.title}</h4>
                            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                                {msg.users ? `${msg.users.first_name} ${msg.users.last_name} (${['admin', 'owner'].includes(msg.author_role) ? 'Maamulka' : msg.author_role})` : 'Maamulka'}
                            </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                            {timeAgo(msg.created_at)}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2 relative z-10">{msg.content}</p>
                    {/* Decorative bg icon */}
                    <span className="material-icons absolute -bottom-4 -right-4 text-8xl text-slate-50 dark:text-slate-700/30 opacity-50 -z-0 rotate-12">campaign</span>
                </div>
            ))}
        </div>
    );
}
