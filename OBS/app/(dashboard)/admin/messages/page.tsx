"use client";

import { useEffect, useState } from "react";
import { createAnnouncement, getTeacherAnnouncements } from "@/lib/actions/announcements";
import { getAdminClasses } from "@/lib/actions/admin";   // Reuse admin class fetcher

export default function AdminMessagesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Form states
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedClass, setSelectedClass] = useState(""); // "" = Select, "all" = All School

    useEffect(() => {
        const load = async () => {
            // We need schoolId for getAdminClasses. 
            // Ideally we fetch it or pass it. But getAdminClasses reads cookie on server.
            // Wait, getAdminClasses is a server action, it can read cookies inside.
            // We need to pass schoolId to it though? 
            // Let's check `getAdminClasses` signature. It takes `schoolId`.
            // We need to fetch schoolId on client? No, better to make a wrapper or fetching server-side.
            // Actually, `getTeacherClasses` works for teacher because it derives from auth user.
            // Let's rely on a new server action or fetching user profile to get schoolId.

            // Quick fix: Fetch profile then fetch classes
            const { getCurrentUserProfile } = await import("@/lib/actions/auth");
            const profile = await getCurrentUserProfile();
            if (profile && profile.schoolId) {
                const { getAdminClasses } = await import("@/lib/actions/admin");
                const cls = await getAdminClasses(profile.schoolId);
                setClasses(cls);
            }

            // reuse getTeacherAnnouncements because it fetches by 'author_id' which works for Admin too
            const anns = await getTeacherAnnouncements();
            setAnnouncements(anns);
            setLoading(false);
        };
        load();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        // if selectedClass is "all", we pass "all" to action which converts to null (global)
        const target = selectedClass === "all" ? "all" : selectedClass;

        const result = await createAnnouncement(title, content, target);
        if (result.success) {
            alert("Farriinta waa la diray!");
            setTitle("");
            setContent("");
            setSelectedClass("");
            // Refresh list
            const anns = await getTeacherAnnouncements();
            setAnnouncements(anns);
        } else {
            alert("Khalad ayaa dhacay: " + result.error);
        }
        setSending(false);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Farriimaha (Announcements)</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Compose Message */}
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="material-icons text-blue-600">edit</span>
                        Qor Farriin Cusub
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ciwaanka (Title)</label>
                            <input
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                placeholder="Tusaale: Ogeysiis Muhiim ah..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ku Socota (Target)</label>
                            <select
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value)}
                                required
                            >
                                <option value="">Dooro Cidda...</option>
                                <option value="all" className="font-bold text-blue-600">-- Dugsiga Oo Dhan (All School) --</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>Fasalka {c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nuxurka (Content)</label>
                            <textarea
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all h-32"
                                placeholder="Qor farriintaada halkan..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            {sending ? "Waa la dirayaa..." : "Dir Farriinta"}
                            <span className="material-icons text-sm">send</span>
                        </button>
                    </form>
                </div>

                {/* Sent Messages History */}
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-[600px]">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="material-icons text-emerald-600">history</span>
                        Farriimaha Hore
                    </h2>

                    <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-2">
                        {loading ? (
                            <p className="text-center text-slate-400 text-sm">Soo dadajinaya...</p>
                        ) : announcements.length === 0 ? (
                            <div className="text-center py-10">
                                <span className="material-icons text-4xl text-slate-200 mb-2">inbox</span>
                                <p className="text-slate-400 text-sm">Weli farriin maadan dirin.</p>
                            </div>
                        ) : (
                            announcements.map((msg) => (
                                <div key={msg.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800">{msg.title}</h3>
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                                            {new Date(msg.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-3 mb-2">{msg.content}</p>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Ku socota: {msg.target_class_id ? "Fasal Gaar ah" : "Dhammaan Dugsiga"}
                                        </span>
                                        <span className="material-icons text-slate-300 text-sm">done_all</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
