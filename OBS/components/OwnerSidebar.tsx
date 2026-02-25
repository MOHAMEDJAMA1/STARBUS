"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function OwnerSidebar() {
    const pathname = usePathname();

    const links = [
        { href: "/owner", label: "Dulmar", icon: "dashboard" },
        { href: "/owner/schools", label: "Dugsiyada", icon: "school" },
        { href: "/owner/reports", label: "Warbixinno", icon: "analytics" },
        { href: "/owner/settings", label: "Hagaajin", icon: "settings" },
    ];

    return (
        <aside className="hidden md:flex w-64 flex-shrink-0 bg-slate-900 text-white flex-col h-screen fixed z-30">
            <div className="h-20 flex items-center px-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded p-1.5 shadow-lg shadow-blue-500/10">
                        <img src="/logo.png" alt="SOMEDU" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight text-white uppercase">SOMEDU</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Maamulaha Sare</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <span className="material-icons text-xl">{link.icon}</span>
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                        SO
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">System Owner</p>
                        <p className="text-xs text-slate-500 truncate">owner@somedu.com</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
