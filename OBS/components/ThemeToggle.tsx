"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
    const [theme, setTheme] = useState("light");

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("theme") || "light";
        setTheme(savedTheme);
        // We don't toggle here because the script in layout.tsx handled the initial class
        // But we ensure state sync
        if (savedTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    if (!mounted) {
        return <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 w-full h-[56px] animate-pulse"></div>;
    }

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 w-full"
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-slate-700 text-slate-400'}`}>
                <span className="material-icons text-lg">light_mode</span>
            </div>
            <div className="flex-1 text-left">
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200 block">Muuqaalka (Theme)</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{theme === 'light' ? 'Iftiin (Light)' : 'Madow (Dark)'}</span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                <span className="material-icons text-lg">dark_mode</span>
            </div>
        </button>
    );
}
