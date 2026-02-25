"use client";

import { useEffect, useState } from "react";
import { Class, Subject, Teacher, TimetableEntry, DAYS_OF_WEEK, PERIODS, DayOfWeek } from "@/types/data";
import { cn } from "@/lib/utils";

export default function TimetablePage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userLoaded, setUserLoaded] = useState(false);

    // Assignment Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ day: DayOfWeek; period: number } | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            loadTimetable(selectedClassId);
        } else {
            setTimetable([]);
        }
    }, [selectedClassId]);

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return undefined; // Server side check
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const loadInitialData = async () => {
        setIsLoading(true);
        const schoolId = getCookie("school_id");

        if (schoolId) {
            try {
                const { getAdminClasses, getAdminTeachers, getAdminSubjects } = await import("@/lib/actions/admin");
                const [c, t, s] = await Promise.all([
                    getAdminClasses(schoolId),
                    getAdminTeachers(schoolId),
                    getAdminSubjects(schoolId),
                ]);
                // @ts-ignore
                setClasses(c);
                // @ts-ignore
                setTeachers(t);
                // @ts-ignore
                setSubjects(s);
                // @ts-ignore
                if (c.length > 0) setSelectedClassId(c[0].id);
                setUserLoaded(true);
            } catch (e) {
                console.error(e);
            }
        }
        setIsLoading(false);
    };

    const loadTimetable = async (classId: string) => {
        const schoolId = getCookie("school_id") || "";
        if (!schoolId) return;

        // Don't set main loading to true to avoid flicker on class switch, maybe just local?
        // But for MVP, fine.

        try {
            const { getClassTimetable } = await import("@/lib/actions/admin");
            // @ts-ignore
            const data = await getClassTimetable(schoolId, classId);
            // @ts-ignore
            setTimetable(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSlotClick = (day: DayOfWeek, period: number) => {
        setSelectedSlot({ day, period });

        // Check if slot already has content
        const existing = timetable.find(t => t.dayOfWeek === day && t.periodNumber === period);
        if (existing) {
            setSelectedSubjectId(existing.subjectId);
            setSelectedTeacherId(existing.teacherId);
        } else {
            setSelectedSubjectId("");
            setSelectedTeacherId("");
        }

        setIsModalOpen(true);
        setErrorMsg("");
    };

    const handleSaveSlot = async () => {
        if (!selectedSlot || !selectedClassId || !selectedSubjectId || !selectedTeacherId) {
            setErrorMsg("Please select both subject and teacher.");
            return;
        }

        setIsSaving(true);
        const schoolId = getCookie("school_id") || "";

        try {
            const { assignTimetableSlot } = await import("@/lib/actions/admin");
            await assignTimetableSlot(schoolId, {
                classId: selectedClassId,
                dayOfWeek: selectedSlot.day,
                periodNumber: selectedSlot.period,
                subjectId: selectedSubjectId,
                teacherId: selectedTeacherId
            });
            await loadTimetable(selectedClassId);
            setIsModalOpen(false);
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to assign slot.");
        }
        setIsSaving(false);
    };

    const getSlotContent = (day: DayOfWeek, period: number) => {
        const entry = timetable.find(t => t.dayOfWeek === day && t.periodNumber === period);
        if (!entry) return null;

        const sub = subjects.find(s => s.id === entry.subjectId);
        const tea = teachers.find(t => t.id === entry.teacherId);

        return (
            <div className="flex flex-col h-full justify-center">
                <span className="font-bold text-slate-800 text-sm">{sub?.name}</span>
                <span className="text-xs text-slate-500 truncate">{tea?.firstName} {tea?.lastName}</span>
            </div>
        );
    };

    if (!userLoaded && !isLoading) {
        return <div className="p-8">Please log in to view timetable.</div>;
    }

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 flex-shrink-0">
                <h1 className="text-2xl font-bold text-slate-800">Timetable Management</h1>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Select Class:</label>
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full md:w-auto bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <div className="min-w-[800px]">
                        {/* Header Row */}
                        <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                            <div className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-widest border-r border-slate-200">
                                Period
                            </div>
                            {DAYS_OF_WEEK.map(day => (
                                <div key={day} className="p-4 text-center font-bold text-slate-700 text-sm border-r border-slate-200 last:border-r-0">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Timetable Grid */}
                        <div>
                            {(() => {
                                const maxPeriodInData = Math.max(0, ...timetable.map(t => t.periodNumber));
                                const displayPeriodsCount = Math.max(8, maxPeriodInData); // Show at least 8, or more if data exists
                                const dynamicPeriods = PERIODS.slice(0, displayPeriodsCount);

                                return dynamicPeriods.map((period) => (
                                    <div key={period.periodNumber}>
                                        <div className="grid grid-cols-6 border-b border-slate-100 last:border-b-0">
                                            <div className="p-4 border-r border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center">
                                                <span className="font-black text-slate-300 text-lg">{period.periodNumber}</span>
                                                <span className="text-[10px] text-slate-400 font-mono mt-1">{period.startTime} - {period.endTime}</span>
                                            </div>
                                            {DAYS_OF_WEEK.map(day => (
                                                <div
                                                    key={`${day}-${period.periodNumber}`}
                                                    className="border-r border-slate-100 last:border-r-0 p-2 relative group cursor-pointer hover:bg-slate-50 transition-colors h-24" // enforce height
                                                    onClick={() => handleSlotClick(day, period.periodNumber)}
                                                >
                                                    {getSlotContent(day, period.periodNumber) || (
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="material-icons text-slate-300">add</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignment Modal */}
            {isModalOpen && selectedSlot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">
                            Edit Slot: {selectedSlot.day} - Period {selectedSlot.period}
                        </h3>

                        {errorMsg && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-center gap-2">
                                <span className="material-icons text-sm">error</span>
                                {errorMsg}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                >
                                    <option value="">Select Subject...</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                >
                                    <option value="">Select Teacher...</option>
                                    {teachers
                                        // Filter teachers if needed, but for MVP keep simple
                                        .map(t => (
                                            <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSlot}
                                disabled={isSaving}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save Assignment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
