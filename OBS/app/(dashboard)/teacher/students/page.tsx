"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function TeacherStudentsPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [takingAttendance, setTakingAttendance] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const { getTeacherClasses } = await import("@/lib/actions/teacher");
            const data = await getTeacherClasses();
            setClasses(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleClassClick = async (classData: any) => {
        setSelectedClass(classData);
        setTakingAttendance(false);

        try {
            const { getClassStudents } = await import("@/lib/actions/teacher");
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
            };
            const schoolId = getCookie("school_id");
            if (schoolId) {
                const data = await getClassStudents(classData.id);
                setStudents(data);

                // Initialize attendance state
                const initialAttendance: Record<string, string> = {};
                data.forEach((student: any) => {
                    initialAttendance[student.id] = "Present";
                });
                setAttendance(initialAttendance);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveAttendance = async () => {
        if (!selectedClass) return;

        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        };

        const schoolId = getCookie("school_id");
        const teacherId = getCookie("user_id");
        const today = new Date().toISOString().split('T')[0];

        const records = students.map(student => ({
            studentId: student.id,
            classId: selectedClass.id,
            subjectId: null, // Can be enhanced to select subject
            teacherId: teacherId,
            schoolId: schoolId,
            date: today,
            periodNumber: 1, // Can be enhanced to select period
            status: attendance[student.id] || "Present"
        }));

        try {
            const { saveAttendance } = await import("@/lib/actions/teacher");
            const result = await saveAttendance(records);
            if (!result.error) {
                alert("Jowdarka si guul leh ayaa loo keydiyay!");
                setTakingAttendance(false);
            } else {
                alert("Khalad ayaa dhacay: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("Khalad ayaa dhacay");
        }
    };

    return (
        <>
            <DashboardHeader />

            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-icons text-primary">groups</span>
                        Fasallada & Ardayda
                    </h1>
                    <p className="text-slate-500 mt-1">Maamul fasallada aad bartid iyo qaadista jowdarka</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-12 gap-6">
                        {/* Classes List */}
                        <div className="col-span-12 lg:col-span-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <h2 className="font-bold text-slate-800 mb-4">Fasalladaada</h2>
                                {classes.length === 0 ? (
                                    <p className="text-slate-500 text-sm">Weli fasallo laguma qorin</p>
                                ) : (
                                    <div className="space-y-2">
                                        {classes.map((cls) => (
                                            <button
                                                key={cls.id}
                                                onClick={() => handleClassClick(cls)}
                                                className={`w-full text-left p-4 rounded-lg border transition-all ${selectedClass?.id === cls.id
                                                    ? "bg-primary text-white border-primary shadow-lg"
                                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <p className="font-bold">Fasalka {cls.grade}{cls.section}</p>
                                                <p className={`text-xs mt-1 ${selectedClass?.id === cls.id ? "text-blue-100" : "text-slate-500"}`}>
                                                    {cls.education_level}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Student Roster */}
                        <div className="col-span-12 lg:col-span-8">
                            {!selectedClass ? (
                                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                                    <span className="material-icons text-6xl text-slate-300 mb-4">touch_app</span>
                                    <p className="text-slate-500 font-medium">Dooro fasal si aad u aragto ardayda</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h2 className="font-bold text-slate-800">Fasalka {selectedClass.grade}{selectedClass.section}</h2>
                                            <p className="text-sm text-slate-500 mt-1">{students.length} Arday</p>
                                        </div>
                                        {!takingAttendance ? (
                                            <button
                                                onClick={() => setTakingAttendance(true)}
                                                className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                                            >
                                                <span className="material-icons text-sm">check_circle</span>
                                                Qaad Jowdarka
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setTakingAttendance(false)}
                                                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-200 transition-colors"
                                                >
                                                    Jooji
                                                </button>
                                                <button
                                                    onClick={handleSaveAttendance}
                                                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                                                >
                                                    <span className="material-icons text-sm">save</span>
                                                    Keydi
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm min-w-[600px]">
                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-bold text-slate-700">Lambarka</th>
                                                    <th className="px-6 py-4 text-left font-bold text-slate-700">Magaca</th>
                                                    <th className="px-6 py-4 text-left font-bold text-slate-700">Email</th>
                                                    {takingAttendance && (
                                                        <th className="px-6 py-4 text-center font-bold text-slate-700">Jowdarka</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {students.map((student) => (
                                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-slate-600">{student.studentNo}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-800">
                                                            {student.firstName} {student.lastName}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600">{student.email}</td>
                                                        {takingAttendance && (
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    {["Present", "Absent", "Late"].map((status) => (
                                                                        <button
                                                                            key={status}
                                                                            onClick={() => setAttendance({ ...attendance, [student.id]: status })}
                                                                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${attendance[student.id] === status
                                                                                ? status === "Present"
                                                                                    ? "bg-emerald-600 text-white"
                                                                                    : status === "Absent"
                                                                                        ? "bg-red-600 text-white"
                                                                                        : "bg-amber-600 text-white"
                                                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                                                }`}
                                                                        >
                                                                            {status}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
