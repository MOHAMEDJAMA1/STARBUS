"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function AttendancePage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [students, setStudents] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const { getTeacherClasses, getTeacherSubjects } = await import("@/lib/actions/teacher");
            const [classesData, subjectsData] = await Promise.all([
                getTeacherClasses(),
                getTeacherSubjects()
            ]);
            setClasses(classesData || []);
            setSubjects(subjectsData || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (selectedClassId && selectedSubjectId) {
            loadStudentsAndAttendance();
        } else {
            setStudents([]);
            setAttendanceData({});
        }
    }, [selectedClassId, selectedSubjectId, date]);

    const loadStudentsAndAttendance = async () => {
        if (!selectedClassId || !selectedSubjectId) return;

        try {
            const { getClassStudents, getAttendance } = await import("@/lib/actions/teacher");
            // @ts-ignore
            const [stu, att] = await Promise.all([
                getClassStudents(selectedClassId),
                // @ts-ignore
                getAttendance("", selectedClassId, date, selectedSubjectId)
            ]);

            setStudents(stu || []);

            const initial: Record<string, string> = {};
            stu.forEach((s: any) => initial[s.id] = "present");

            if (att && att.length > 0) {
                att.forEach((a: any) => {
                    initial[a.student_id] = a.status;
                });
            }
            setAttendanceData(initial);

        } catch (e) {
            console.error(e);
        }
    };

    const handleAttendanceChange = (studentId: string, status: string) => {
        setAttendanceData(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        if (!selectedSubjectId) {
            alert("Please select a subject.");
            return;
        }

        setIsSaving(true);
        try {
            const { saveAttendance } = await import("@/lib/actions/teacher");

            const records = Object.entries(attendanceData).map(([studentId, status]) => ({
                student_id: studentId,
                class_id: selectedClassId,
                subject_id: selectedSubjectId,
                date: date,
                status
            }));

            const res = await saveAttendance(records);
            if (res.error) {
                const errorMsg = typeof res.error === 'string' ? res.error : res.error.message;
                alert("Error saving: " + errorMsg);
            } else {
                alert("Attendance saved successfully!");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save.");
        }
        setIsSaving(false);
    };

    const currentClass = classes.find(c => c.id === selectedClassId);
    const currentSubject = subjects.find(s => s.id === selectedSubjectId);

    return (
        <>
            <DashboardHeader />
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Xaadirinta Ardayda</h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">Diiwaangeli xaadirinta fasalladaada maaddada aad dhigeyso</p>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 md:mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Dooro Fasal</label>
                            <select
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                <option value="">-- Dooro Fasal --</option>
                                {classes.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Dooro Maaddo</label>
                            <select
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                            >
                                <option value="">-- Dooro Maaddo --</option>
                                {subjects.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Dooro Taariikh</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {selectedClassId && selectedSubjectId ? (
                    students.length > 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/50 gap-4">
                                <div>
                                    <h2 className="font-bold text-slate-900 text-lg">
                                        Liiska Ardayda - {currentClass?.name}
                                    </h2>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{currentSubject?.name}</span>
                                        <span>•</span>
                                        <span>{new Date(date).toLocaleDateString('so-SO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => {
                                            const newAttendance = { ...attendanceData };
                                            students.forEach(s => newAttendance[s.id] = 'present');
                                            setAttendanceData(newAttendance);
                                        }}
                                        className="w-full md:w-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 md:py-1.5 rounded-lg hover:bg-emerald-100 transition-colors text-center"
                                    >
                                        Dhammaan Way Joogaan
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase font-black tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Magaca Ardayga</th>
                                            <th className="px-6 py-4 text-center">Xaaladda</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {students.map((student: any) => (
                                            <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-800">
                                                    {student.first_name} {student.last_name}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        {[
                                                            {
                                                                id: 'present', label: 'Jooga', color: 'bg-emerald-500',
                                                                activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2'
                                                            },
                                                            {
                                                                id: 'absent', label: 'Ma Joogo', color: 'bg-red-500',
                                                                activeClass: 'bg-red-500 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-500 ring-offset-2'
                                                            },
                                                            {
                                                                id: 'late', label: 'Raagy', color: 'bg-amber-500',
                                                                activeClass: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-500 ring-offset-2'
                                                            },
                                                        ].map((status) => (
                                                            <button
                                                                key={status.id}
                                                                onClick={() => handleAttendanceChange(student.id, status.id)}
                                                                className={`px-3 py-2 md:px-4 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all transform active:scale-95 whitespace-nowrap ${attendanceData[student.id] === status.id
                                                                    ? status.activeClass
                                                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                                    }`}
                                                            >
                                                                {status.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full md:w-auto bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Waa la keydinayaa...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons text-sm">save</span>
                                            Keydi Xaadirinta
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                            <span className="material-icons text-5xl mb-2 opacity-20">groups</span>
                            <p className="font-medium">Laguma helin arday fasalkan</p>
                        </div>
                    )
                ) : (
                    <div className="text-center text-slate-400 py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <span className="material-icons text-5xl mb-2 opacity-20">touch_app</span>
                        <p className="font-medium">Fadlan dooro fasal iyo maaddo si aad u aragto liiska ardayda</p>
                    </div>
                )}
            </div>
        </>
    );
}
