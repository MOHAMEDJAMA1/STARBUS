"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
            <div className="bg-red-50 p-6 rounded-full mb-4">
                <span className="material-icons text-6xl text-red-500">error_outline</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong!</h2>
            <p className="text-slate-500 mb-6 max-w-md">
                We encountered an unexpected error while processing your request. Please try again.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Reload Page
                </button>
                <button
                    onClick={() => reset()}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
