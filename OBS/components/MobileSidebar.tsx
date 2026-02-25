"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SidebarContent } from "./AppSidebar";

export function MobileSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar on path change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Determine role (reuse logic or pass it down if centralized)
    const currentRole = pathname.startsWith("/admin")
        ? "admin"
        : pathname.startsWith("/teacher")
            ? "teacher"
            : pathname.startsWith("/student")
                ? "student"
                : null;

    if (!currentRole) return null;

    return (
        <>
            {/* Mobile Header Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-border-light flex items-center px-4 z-40 shadow-sm">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-2"
                >
                    <span className="material-icons">menu</span>
                </button>

                {/* Branding */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center p-1 shadow-sm">
                        <img src="/logo.png" alt="SOMEDU" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight leading-none text-slate-900 italic uppercase">SOMEDU SYSTEM</h1>
                    </div>
                </div>
            </div>

            {/* Overlay & Sidebar */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Sidebar Panel */}
                    <div className="relative w-64 bg-sidebar-bg h-full shadow-2xl flex flex-col">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <span className="material-icons">close</span>
                        </button>
                        <SidebarContent currentRole={currentRole} pathname={pathname} />
                    </div>
                </div>
            )}
        </>
    );
}
