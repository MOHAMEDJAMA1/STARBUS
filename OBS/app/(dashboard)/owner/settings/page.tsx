"use client";

export default function OwnerSettingsPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Hagaajin</h1>
                <p className="text-slate-500 font-medium">Maamul goobaha nidaamka SOMEDU</p>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <h2 className="font-black text-lg uppercase tracking-tight mb-6">Xogta Muhiimka ah</h2>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Magaca Nidaamka</label>
                            <input disabled className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500" value="SOMEDU Performance Management" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nooca Nidaamka</label>
                            <input disabled className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500" value="SaaS - Enterprise Edition" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 opacity-60">
                    <h2 className="font-black text-lg uppercase tracking-tight mb-6">Amniga & Gelitaanka</h2>
                    <p className="text-sm text-slate-500 italic">Goobahan waxaa loo qoondeeyay in la diyaariyo wejiga xiga.</p>
                </div>
            </div>
        </div>
    );
}
