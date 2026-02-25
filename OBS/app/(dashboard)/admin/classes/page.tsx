"use client";

import { useEffect, useState } from "react";
import { Class } from "@/types/data";

export default function ClassesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // New Class Form
    const [name, setName] = useState("");
    const [grade, setGrade] = useState(1);
    const [section, setSection] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const loadClasses = async () => {
        setIsLoading(true);
        const schoolId = getCookie("school_id");
        if (schoolId) {
            try {
                const { getAdminClasses } = await import("@/lib/actions/admin");
                // @ts-ignore
                const data = await getAdminClasses(schoolId);
                // @ts-ignore
                setClasses(data);
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
                const { createClass } = await import("@/lib/actions/admin");
                const res = await createClass(schoolId, name, Number(grade), section);
                if (res.error) {
                    alert(res.error);
                } else {
                    setIsCreateModalOpen(false);
                    setName("");
                    setSection("");
                    setGrade(1);
                    loadClasses();
                }
            } catch (e) {
                console.error(e);
                alert("Failed to create class");
            }
        }
        setIsCreating(false);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Classes Management</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    + Add New Class
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                            <tr>
                                <th className="px-4 md:px-6 py-4">Name</th>
                                <th className="px-4 md:px-6 py-4">Section</th>
                                <th className="px-4 md:px-6 py-4">Grade Level</th>
                                <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        Loading classes...
                                    </td>
                                </tr>
                            ) : classes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        No classes found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                classes.map((cls) => (
                                    <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 md:px-6 py-4 font-medium text-slate-900">{cls.name || `${cls.grade}-${cls.section}`}</td>
                                        <td className="px-4 md:px-6 py-4 text-slate-600 font-mono">{cls.section}</td>
                                        <td className="px-4 md:px-6 py-4 text-slate-600">{cls.grade}th Grade</td>
                                        <td className="px-4 md:px-6 py-4 text-right">
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
                            <h3 className="font-bold text-lg text-slate-800">New Class</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Class Name (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Class 1A"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Grade Level</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={grade}
                                        onChange={e => setGrade(Number(e.target.value))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Section</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. A"
                                        value={section}
                                        onChange={e => setSection(e.target.value)}
                                        required
                                    />
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
                                    {isCreating ? 'Creating...' : 'Create Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
