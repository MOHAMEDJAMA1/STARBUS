"use client";

import { useEffect, useState } from "react";
import { Student, Class } from "@/types/data";

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");
    const [password, setPassword] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Reset Password
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [studentToReset, setStudentToReset] = useState<{ id: string, name: string } | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);

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
                const { getAdminStudents, getAdminClasses } = await import("@/lib/actions/admin");
                const [s, c] = await Promise.all([
                    // @ts-ignore
                    getAdminStudents(schoolId),
                    // @ts-ignore
                    getAdminClasses(schoolId),
                ]);
                // @ts-ignore
                setStudents(s);
                // @ts-ignore
                setClasses(c);
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
                const { createStudent } = await import("@/lib/actions/admin");
                const res = await createStudent(schoolId, firstName, lastName, email, selectedClassId || undefined, password);
                if (res.error) {
                    alert(res.error);
                } else {
                    setIsCreateModalOpen(false);
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setSelectedClassId("");
                    setPassword("");
                    alert(`Student created! Email: ${email}\nPassword: ${password || 'TempPassword123!'}`);
                    loadData();
                }
            } catch (e) {
                console.error(e);
                alert("Failed to create student");
            }
        }
        const handleResetPassword = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!studentToReset) return;

            setIsResetting(true);
            try {
                const { resetSchoolUserPassword } = await import("@/lib/actions/admin");
                const res = await resetSchoolUserPassword(studentToReset.id, newPassword);
                if (res.error) {
                    alert(res.error);
                } else {
                    alert(`Password reset successfully!\nNew Password: ${res.password}`);
                    setIsResetModalOpen(false);
                    setNewPassword("");
                    setStudentToReset(null);
                }
            } catch (e) {
                console.error(e);
                alert("Failed to reset password");
            }
            setIsResetting(false);
        };

        const [searchQuery, setSearchQuery] = useState("");

        const filteredStudents = students.filter(student =>
            (student.firstName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (student.lastName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (student.email || "").toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Students Management</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage and View all enrolled students</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="material-icons text-sm">add</span>
                        Add New Student
                    </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500 px-2">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-900">{filteredStudents.length}</span> Students Found
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left py-4 px-4 md:px-6 text-xs font-black text-slate-500 uppercase tracking-widest">Name</th>
                                    <th className="text-left py-4 px-4 md:px-6 text-xs font-black text-slate-500 uppercase tracking-widest">Class</th>
                                    <th className="text-left py-4 px-4 md:px-6 text-xs font-black text-slate-500 uppercase tracking-widest">Email</th>
                                    <th className="text-right py-4 px-4 md:px-6 text-xs font-black text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 animate-pulse font-bold">
                                            Loading students...
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No students found matching "{searchQuery}"
                                        </td>
                                    </tr>
                                ) : (filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {student.firstName} {student.lastName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-xs font-bold">
                                                {/* @ts-ignore */}
                                                {student.className || "Unassigned"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{student.email}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setStudentToReset({ id: student.id, name: `${student.firstName} ${student.lastName}` });
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
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {
                    isCreateModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-slate-800">New Student</h3>
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
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Assigned Class</label>
                                        <select
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={selectedClassId}
                                            onChange={e => setSelectedClassId(e.target.value)}
                                        >
                                            <option value="">Select a Class...</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>
                                            ))}
                                        </select>
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
                                            {isCreating ? 'Creating...' : 'Create Student'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {
                    isResetModalOpen && studentToReset && (
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
                                        Are you sure you want to reset the password for <strong>{studentToReset.name}</strong>?
                                    </p>
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">New Temporary Password</label>
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
                    )
                }
            </div >
        );
    }
}
