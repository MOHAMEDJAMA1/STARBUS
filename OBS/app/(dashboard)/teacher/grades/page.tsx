"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function GradeEntryPage() {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [selectedExamType, setSelectedExamType] = useState("midterm");

    const [grades, setGrades] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const { getTeacherClasses, getTeacherSubjects } = await import("@/lib/actions/teacher");
            const [cls, sub] = await Promise.all([
                getTeacherClasses(),
                getTeacherSubjects()
            ]);
            setClasses(cls || []);
            setSubjects(sub || []);
        } catch (error) {
            console.error("Failed to load data", error);
        }
        setLoading(false);
    };

    const handleSearch = async () => {
        if (!selectedClassId || !selectedSubjectId) return;

        setLoading(true);
        try {
            const { getClassStudents, getResults } = await import("@/lib/actions/teacher");
            // @ts-ignore
            const [studs, currentResults] = await Promise.all([
                getClassStudents(selectedClassId),
                // @ts-ignore
                getResults("", selectedClassId, selectedSubjectId, selectedExamType)
            ]);

            setStudents(studs || []);

            const gradeMap: Record<string, number> = {};
            if (currentResults) {
                currentResults.forEach((r: any) => {
                    gradeMap[r.studentId] = r.score;
                });
            }
            setGrades(gradeMap);

        } catch (error) {
            console.error(error);
        }

        setLoading(false);
    };

    // Re-fetch when exam type changes if we already have students loaded
    useEffect(() => {
        if (selectedClassId && selectedSubjectId && students.length > 0) {
            handleSearch();
        }
    }, [selectedExamType]);

    const handleGradeChange = (studentId: string, score: string) => {
        const numScore = parseInt(score);
        if (!isNaN(numScore) && numScore >= 0 && numScore <= 100) {
            setGrades(prev => ({ ...prev, [studentId]: numScore }));
        } else if (score === "") {
            const newGrades = { ...grades };
            delete newGrades[studentId];
            setGrades(newGrades);
        }
    };



    const handleSave = async () => {
        setSaving(true);
        try {
            const { saveGrades } = await import("@/lib/actions/teacher");

            const resultsToSave = Object.keys(grades).map(studentId => ({
                student_id: studentId,
                class_id: selectedClassId,
                subject_id: selectedSubjectId,
                score: grades[studentId],
                max_score: 100,
                exam_type: selectedExamType, // Use selected type
                exam_name: selectedExamType === 'midterm' ? 'Midterm Exam' : 'Final Exam',
                date: new Date().toISOString().split('T')[0],
                percentage: grades[studentId]
            }));

            const res = await saveGrades(resultsToSave);
            if (res.error) {
                // @ts-ignore
                alert("Error saving: " + (res.error.message || "Unknown error"));
            } else {
                alert("Dhibcaha waa la keydiyay!");
            }
        } catch (e) {
            console.error(e);
            alert("Khalad ayaa dhacay markii la keydinayay.");
        }
        setSaving(false);
    };

    return (
        <>
            <DashboardHeader />
            <div className="p-4 md:p-8 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full">
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Geli Dhibcaha</h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">Dooro fasalka, maadada, iyo nooca imtixaanka si aad u geliso dhibcaha.</p>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 md:mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Fasalka (Class)</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700"
                        >
                            <option value="">Dooro Fasalka...</option>
                            {classes.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name} - {c.grade}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Maadada (Subject)</label>
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700"
                        >
                            <option value="">Dooro Maadada...</option>
                            {subjects.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nooca Imtixaanka</label>
                        <select
                            value={selectedExamType}
                            onChange={(e) => setSelectedExamType(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700"
                        >
                            <option value="midterm">Midterm Exam</option>
                            <option value="final">Final Exam</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <button
                            onClick={handleSearch}
                            disabled={!selectedClassId || !selectedSubjectId || loading}
                            className="w-full px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 h-[50px]"
                        >
                            {loading ? "Raadinaya..." : "Raadi"}
                        </button>
                    </div>
                </div>

                {students.length > 0 && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 text-lg">Liiska Ardayda ({students.length}) - {selectedExamType === 'midterm' ? 'Midterm' : 'Final'}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[600px]">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-xs tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-slate-100">Ardayga</th>
                                        <th className="px-6 py-4 border-b border-slate-100 w-48 text-center">Dhibcaha (0-100)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {students.map((student: any) => (
                                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                {student.first_name} {student.last_name}
                                                <span className="block text-xs text-slate-400 font-normal mt-0.5">ID: {student.username || student.id.substring(0, 6)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={grades[student.id] ?? ""}
                                                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                                        className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-center font-black text-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                        placeholder="-"
                                                    />
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
                                disabled={saving}
                                className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? "Waa la keydinayaa..." : "Keydi Dhibcaha"}
                            </button>
                        </div>
                    </div>
                )}

                {!loading && students.length === 0 && selectedClassId && selectedSubjectId && (
                    <div className="text-center text-slate-400 py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <span className="material-icons text-5xl mb-2 opacity-20">group_off</span>
                        <p className="font-medium">Laguma helin arday fasalkan</p>
                    </div>
                )}
            </div>
        </>
    );
}
