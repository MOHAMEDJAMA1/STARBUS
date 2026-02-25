import { ReactNode } from "react";

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: string;
    action?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ title, description, icon = "inbox", action, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <span className="material-icons text-4xl text-slate-300">{icon}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-slate-500 mb-6 max-w-sm text-sm">{description}</p>
            {action && (
                <div>
                    {action}
                </div>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
