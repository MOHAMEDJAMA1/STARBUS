"use client";

import { useEffect, useState } from "react";
import { School } from "@/types/data";

export default function SchoolsPage() {
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
    const [isViewManagersModalOpen, setIsViewManagersModalOpen] = useState(false);
    const [managers, setManagers] = useState<any[]>([]);
    const [loadingManagers, setLoadingManagers] = useState(false);

    // New School Form
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // New Manager Form
    const [selectedSchoolId, setSelectedSchoolId] = useState("");
    const [managerEmail, setManagerEmail] = useState("");
    const [managerFirstName, setManagerFirstName] = useState("");
    const [managerLastName, setManagerLastName] = useState("");
    const [managerPassword, setManagerPassword] = useState("");
    const [isCreatingManager, setIsCreatingManager] = useState(false);

    useEffect(() => {
        loadSchools();
    }, []);

    const loadSchools = async () => {
        setIsLoading(true);
        try {
            const { getOwnerDashboardData } = await import("@/lib/actions/owner");
            // @ts-ignore
            const data = await getOwnerDashboardData();
            if (data) {
                // @ts-ignore
                setSchools(data.schools);
            }
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    const handleCreateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const { createSchool } = await import("@/lib/actions/owner");
            const res = await createSchool(name, slug);
            if (res.error) {
                alert(res.error);
            } else {
                alert("School created!");
                setIsCreateModalOpen(false);
                loadSchools();
            }
        } catch (e) {
            console.error(e);
        }
        setIsCreating(false);
    };

    const handleCreateManager = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingManager(true);
        try {
            const { createManager } = await import("@/lib/actions/owner");
            const res = await createManager(selectedSchoolId, managerFirstName, managerLastName, managerEmail, managerPassword);
            if (res.error) {
                alert(res.error);
            } else {
                alert(`Manager created! Email: ${managerEmail}, Pwd: ${managerPassword || 'TempPassword123!'}`);
                setIsManagerModalOpen(false);
                setManagerPassword(""); // Clear password
            }
        } catch (e) {
            console.error(e);
        }
        setIsCreatingManager(false);
    };

    const handleViewManagers = async (schoolId: string) => {
        setSelectedSchoolId(schoolId);
        setIsViewManagersModalOpen(true);
        setLoadingManagers(true);
        try {
            const { getSchoolManagers } = await import("@/lib/actions/owner");
            const data = await getSchoolManagers(schoolId);
            setManagers(data);
        } catch (e) {
            console.error(e);
        }
        setLoadingManagers(false);
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Dugsiyada</h1>
                    <p className="text-slate-500 text-sm font-medium">Maamul dhammaan dugsiyada ku jira nidaamka</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2 group"
                >
                    <span className="material-icons text-lg group-hover:rotate-90 transition-transform">add</span>
                    Abuur Dugsi Cusub
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">School Name</th>
                            <th className="px-6 py-4">Slug</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Created At</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
                        ) : schools.map((school) => (
                            <tr key={school.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">{school.name}</td>
                                <td className="px-6 py-4 text-slate-600 font-mono">{school.slug}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${school.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {school.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">{new Date(school.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleViewManagers(school.id)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100/50 hover:shadow-lg hover:shadow-emerald-600/20"
                                        >
                                            <span className="material-icons text-sm">groups</span>
                                            View Managers
                                        </button>
                                        <button
                                            onClick={() => { setSelectedSchoolId(school.id); setIsManagerModalOpen(true); }}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all border border-blue-100/50 hover:shadow-lg hover:shadow-blue-600/20"
                                        >
                                            <span className="material-icons text-sm">person_add</span>
                                            Add Manager
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* modals skipped for brevity but logic handles them if UI existed */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Dugsi Cusub</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white text-slate-400 hover:text-red-500 transition-all shadow-sm">
                                <span className="material-icons text-xl">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateSchool} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Magaca Dugsiga</label>
                                <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" placeholder="Tusaale: Dugsi Sare" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Slug (Aqoonsi Khaas Ah)</label>
                                <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-mono text-sm outline-none transition-all" placeholder="tusaale-dugsi" value={slug} onChange={e => setSlug(e.target.value)} required />
                            </div>
                            <button className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all disabled:opacity-50 mt-4" disabled={isCreating}>
                                {isCreating ? "Waa la abuurayaa..." : "Abuur Dugsiga"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isManagerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Manager Cusub</h3>
                            <button onClick={() => setIsManagerModalOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white text-slate-400 hover:text-red-500 transition-all shadow-sm">
                                <span className="material-icons text-xl">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateManager} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Magaca</label>
                                    <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" placeholder="First" value={managerFirstName} onChange={e => setManagerFirstName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Abtirsiinta</label>
                                    <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" placeholder="Last" value={managerLastName} onChange={e => setManagerLastName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username / Email (Login)</label>
                                <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" placeholder="Username or email@som.edu" type="text" value={managerEmail} onChange={e => setManagerEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Temporary Password</label>
                                <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" placeholder="Enter temporary password" type="text" value={managerPassword} onChange={e => setManagerPassword(e.target.value)} />
                            </div>
                            <button className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all disabled:opacity-50 mt-4" disabled={isCreatingManager}>
                                {isCreatingManager ? "Waa la abuurayaa..." : "Abuur Maamulaha"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isViewManagersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Maamulayaasha Dugsiga</h3>
                            <button onClick={() => setIsViewManagersModalOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white text-slate-400 hover:text-red-500 transition-all shadow-sm">
                                <span className="material-icons text-xl">close</span>
                            </button>
                        </div>
                        <div className="p-8">
                            {loadingManagers ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                                </div>
                            ) : managers.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="material-icons text-6xl text-slate-300 mb-4">person_off</span>
                                    <p className="text-slate-500 font-medium">Weli maamulayaal lama aburin dugsigan</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {managers.map((manager) => (
                                        <div key={manager.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                                    {manager.firstName[0]}{manager.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{manager.firstName} {manager.lastName}</p>
                                                    <p className="text-sm text-slate-500">{manager.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Created</p>
                                                <p className="text-sm font-medium text-slate-600">{new Date(manager.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
