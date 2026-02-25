"use client";

import { useEffect, useState } from "react";
import { Teacher, Subject } from "@/types/data";

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        const schoolId = getCookie("school_id");
        if (schoolId) {
            try {
                const { getAdminTeachers, getAdminSubjects } = await import("@/lib/actions/admin");
                const [t, s] = await Promise.all([
                    // @ts-ignore
                    getAdminTeachers(schoolId),
                    // @ts-ignore
                    getAdminSubjects(schoolId),
                ]);
                // @ts-ignore
                setTeachers(t);
                // @ts-ignore
                setSubjects(s);
            } catch (e) {
                console.error(e);
            }
        }
        setIsLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        const schoolId = getCookie("school_id");
        if (schoolId) {
            try {
                const { createTeacher } = await import("@/lib/actions/admin");
                const res = await createTeacher(schoolId, firstName, lastName, email, password);
                if (res.error) {
                    alert(res.error);
                } else {
                    setIsCreateModalOpen(false);
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setPassword("");
                    alert(`Teacher created! Email: ${email}\nPassword: ${password || 'TempPassword123!'}`);
                    loadData();
                }
            } catch (e) {
                console.error(e);
                alert("Failed to create teacher");
            }
        }
        setIsCreating(false);
    };

    // Reset Password
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [teacherToReset, setTeacherToReset] = useState<{ id: string, name: string } | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherToReset) return;

        setIsResetting(true);
        try {
            const { resetSchoolUserPassword } = await import("@/lib/actions/admin");
            const res = await resetSchoolUserPassword(teacherToReset.id, newPassword);
            if (res.error) {
                alert(res.error);
            } else {
                alert(`Password reset successfully!\nNew Password: ${res.password}`);
                setIsResetModalOpen(false);
                setNewPassword("");
                setTeacherToReset(null);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to reset password");
        }
        setIsResetting(false);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Teachers Management</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    + Add New Teacher
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[900px]">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                            <tr>
                                <th className="px-4 md:px-6 py-4">Name</th>
                                <th className="px-4 md:px-6 py-4">Specialization</th>
                                <th className="px-4 md:px-6 py-4">Subjects Taught</th>
                                <th className="px-4 md:px-6 py-4">Email</th>
                                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Loading teachers...
                                    </td>
                                </tr>
                            ) : teachers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No teachers found.
                                    </td>
                                </tr>
                            ) : (
                                teachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 md:px-6 py-4 font-medium text-slate-900">
                                            {teacher.firstName} {teacher.lastName}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-slate-600">{teacher.specialization || "-"}</td>
                                        <td className="px-4 md:px-6 py-4 text-slate-600">
                                            <div className="flex flex-wrap gap-1">
                                                {teacher.subjectIds && teacher.subjectIds.length > 0 ? teacher.subjectIds.map((sid) => {
                                                    const sub = subjects.find(s => s.id === sid);
                                                    return sub ? (
                                                        <span key={sid} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
                                                            {sub.name}
                                                        </span>
                                                    ) : null;
                                                }) : <span className="text-slate-400 text-xs">No subjects assigned</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-slate-500">{teacher.email}</td>
                                        <td className="px-4 md:px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setTeacherToReset({ id: teacher.id, name: `${teacher.firstName} ${teacher.lastName}` });
                                                    setNewPassword("");
                                                    setIsResetModalOpen(true);
                                                }}
                                                className="text-orange-500 hover:text-orange-700 font-medium text-xs flex items-center gap-1 bg-orange-50 px-2 py-1 rounded border border-orange-100"
                                                title="Reset Password"
                                            >
                                                <span className="material-icons text-sm">lock_reset</span> Reset
                                            </button>
                                            <button className="text-primary hover:underline font-medium text-xs flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                                <span className="material-icons text-sm">edit</span> Edit
                                            </button>
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
                            <h3 className="font-bold text-lg text-slate-800">New Teacher</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Username / Email (Login)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Username or email@som.edu"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Temporary Password</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter temporary password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <p className="text-xs text-slate-400 mt-1">Leave empty for default: TempPassword123!</p>
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
                                    {isCreating ? 'Creating...' : 'Create Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isResetModalOpen && teacherToReset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-red-100">
                        <div className="p-6 border-b border-red-50 bg-red-50/30 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <span className="material-icons text-orange-500">lock_reset</span>
                                Reset Password
                            </h3>
                            <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 text-sm mb-4">
                                Are you sure you want to reset the password for <strong>{teacherToReset.name}</strong>?
                            </p>
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">New Temporary Password</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Leave empty for default: <strong>TempPassword123!</strong></p>
                                </div>
                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsResetModalOpen(false)}
                                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isResetting}
                                        className="flex-1 px-4 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                                    >
                                        {isResetting ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
