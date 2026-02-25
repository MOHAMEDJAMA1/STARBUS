import { AppSidebar } from "@/components/AppSidebar";
import { MobileSidebar } from "@/components/MobileSidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background-main dark:bg-slate-950 font-display antialiased transition-colors duration-200">
            <AppSidebar />
            <MobileSidebar />

            {/* 
                Mobile: pt-16 for header space.
                Desktop: overflow-hidden usually implies internal scroll zones (flex-1 overflow-y-auto).
                We ensure 'main' is a flexible column.
            */}
            <main className="flex-1 md:ml-64 flex flex-col min-w-0 pt-16 md:pt-0 min-h-screen">
                {children}
            </main>
        </div>
    );
}
