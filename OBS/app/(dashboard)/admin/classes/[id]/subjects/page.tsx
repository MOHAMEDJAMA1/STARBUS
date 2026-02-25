"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Subject {
    id: string;
    name: string;
    code: string;
}

interface ClassSubject {
    id: string;
    subjectId: string;
    name: string;
    code: string;
}

export default function ClassSubjectsPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id as string;

    const [className, setClassName] = useState("");
    const [assignedSubjects, setAssignedSubjects] = useState<ClassSubject[]>([]);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    useEffect(() => {
        loadData();
    }, [classId]);

    const loadData = async () => {
        setIsLoading(true);
        const schoolId = getCookie("school_id");
        if (schoolId) {
            try {
                const { getClassSubjects } = await import("@/lib/actions/class_subjects");
                const { getAdminSubjects, getAdminClasses } = await import("@/lib/actions/admin");

                const [assigned, all, classes] = await Promise.all([
                    getClassSubjects(classId),
                    getAdminSubjects(schoolId),
                    getAdminClasses(schoolId)
                ]);

                setAssignedSubjects(assigned);
                setAllSubjects(all);

                const currentClass = classes.find((c: any) => c.id === classId);
                setClassName(currentClass?.name || `${currentClass?.grade}-${currentClass?.section}`);
            } catch (e) {
                console.error(e);
            }
        }
        setIsLoading(false);
    };

    const handleAssign = async () => {
        if (!selectedSubjectId) return;

        setIsAssigning(true);
        const schoolId = getCookie("school_id");
        if (schoolId) {
            try {
                const { assignSubjectToClass } = await import("@/lib/actions/class_subjects");
                const result = await assignSubjectToClass(classId, selectedSubjectId, schoolId);

                if (result.error) {
                    alert(result.error);
                } else {
                    setSelectedSubjectId("");
                    loadData();
                }
            } catch (e) {
                console.error(e);
                alert("Failed to assign subject");
            }
        }
        setIsAssigning(false);
    };

    const handleRemove = async (subjectId: string) => {
        if (!confirm("Remove this subject from the class?")) return;

        try {
            const { removeSubjectFromClass } = await import("@/lib/actions/class_subjects");
            const result = await removeSubjectFromClass(classId, subjectId);

            if (result.error) {
                alert(result.error);
            } else {
                loadData();
            }
        } catch (e) {
            console.error(e);
            alert("Failed to remove subject");
        }
    };

    const availableSubjects = allSubjects.filter(
        s => !assignedSubjects.some(as => as.subjectId === s.id)
    );

    return (
        <div className="p-8">
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm mb-4 flex items-center gap-1"
                >
                    <span className="material-icons text-sm">arrow_back</span>
                    Back to Classes
                </button>
                <h1 className="text-2xl font-bold text-slate-800">
                    Manage Subjects - {className}
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Assign subjects that students in this class will take
                </p>
            </div>

            {/* Assign New Subject */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <h2 className="font-bold text-lg text-slate-800 mb-4">Assign Subject</h2>
                <div className="flex gap-3">
                    <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={availableSubjects.length === 0}
                    >
                        <option value="">
                            {availableSubjects.length === 0 ? "All subjects assigned" : "Select a subject"}
                        </option>
                        {availableSubjects.map(subject => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name} {subject.code ? `(${subject.code})` : ''}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedSubjectId || isAssigning}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAssigning ? "Assigning..." : "Assign"}
                    </button>
                </div>
            </div>

            {/* Assigned Subjects List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="font-bold text-lg text-slate-800">
                        Assigned Subjects ({assignedSubjects.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Subject Name</th>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                        Loading subjects...
                                    </td>
                                </tr>
                            ) : assignedSubjects.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                        No subjects assigned yet. Assign subjects above.
                                    </td>
                                </tr>
                            ) : (
                                assignedSubjects.map((subject) => (
                                    <tr key={subject.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{subject.name}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono">{subject.code || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRemove(subject.subjectId)}
                                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
