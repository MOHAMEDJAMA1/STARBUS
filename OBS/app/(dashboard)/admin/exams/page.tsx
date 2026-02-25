"use client";

import { useEffect, useState } from "react";
import { Exam, Class, Subject } from "@/types/data";

import { getCurrentUserProfile } from "@/lib/actions/auth";
import { getAdminExams, getAdminClasses, getAdminSubjects, createExam } from "@/lib/actions/admin";

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const profile = await getCurrentUserProfile();
            const schoolId = profile?.schoolId;

            if (schoolId) {
                const [e, c, s] = await Promise.all([
                    getAdminExams(schoolId),
                    getAdminClasses(schoolId),
                    getAdminSubjects(schoolId),
                ]);
                // @ts-ignore
                setExams(e);
                // @ts-ignore
                setClasses(c);
                // @ts-ignore
                setSubjects(s);
            }
        } catch (err) {
            console.error(err);
        }
        setIsLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setIsCreating(true);
        try {
            const profile = await getCurrentUserProfile();
            const schoolId = profile?.schoolId;

            if (schoolId) {
                const res = await createExam(schoolId, title, date, selectedSubjectId, selectedClassId);
                if (res.error) {
                    alert(res.error);
                } else {
                    setIsCreateModalOpen(false);
                    setTitle("");
                    setDate("");
                    setSelectedSubjectId("");
                    setSelectedClassId("");
                    loadData();
                }
            }
        } catch (e) {
            console.error(e);
            alert("Failed to create exam");
        }
        setIsCreating(false);
    };

    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || "Unknown Subject";
    const getClassName = (id: string) => {
        const c = classes.find(cls => cls.id === id);
        return c ? `${c.grade}-${c.section}` : "Unknown Class";
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Exams Management</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full md:w-auto bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    + Schedule New Exam
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
                    <select
                        className="w-full md:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => {
                            const val = e.target.value;
                            // Filter logic would go here
                        }}
                    >
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Class</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Exam Title</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Loading exam schedule...
                                    </td>
                                </tr>
                            ) : exams.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No exams scheduled. Use "Upload Excel" or the button above to add exams.
                                    </td>
                                </tr>
                            ) : (
                                exams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((exam) => (
                                    <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200">
                                                {getClassName(exam.classId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">{getSubjectName(exam.subjectId)}</td>
                                        <td className="px-6 py-4 text-slate-600">{exam.title}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{new Date(exam.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary hover:underline font-medium text-xs">Edit</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Schedule Exam</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Exam Type</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={title} // We reuse 'title' state for examType momentarily
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Type...</option>
                                        <option value="midterm">Midterm</option>
                                        <option value="final">Final</option>
                                        <option value="quiz">Quiz</option>
                                        <option value="assignment">Assignment</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedSubjectId}
                                        onChange={e => setSelectedSubjectId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Class</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedClassId}
                                        onChange={e => setSelectedClassId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isCreating ? 'Scheduling...' : 'Schedule Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
