"use client";

import { useState } from "react";
import { parseExcelFile, createStudentTemplate, createTeacherTemplate, createTimetableTemplate, createSubjectTemplate, createExamTemplate } from "@/lib/utils/excel-utils";
import { createClassSubjectTemplate } from "@/lib/utils/excel-class-subjects";

type UploadType = "students" | "teachers" | "timetable" | "subjects" | "class-subjects" | "exams";

interface UploadResult {
    success: number;
    failed: number;
    errors: Array<{ row: number; data: any; errors: string[] }>;
}

export default function UploadPage() {
    const [uploadType, setUploadType] = useState<UploadType>("students");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const downloadTemplate = () => {
        let blob: Blob;
        if (uploadType === "students") {
            blob = createStudentTemplate();
        } else if (uploadType === "teachers") {
            blob = createTeacherTemplate();
        } else if (uploadType === "timetable") {
            blob = createTimetableTemplate();
        } else if (uploadType === "class-subjects") {
            blob = createClassSubjectTemplate();
        } else if (uploadType === "exams") {
            blob = createExamTemplate();
        } else {
            blob = createSubjectTemplate();
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${uploadType}_template.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Fadlan dooro faylka Excel");
            return;
        }

        const schoolId = getCookie("school_id");
        if (!schoolId) {
            alert("School ID not found");
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            // Parse Excel file
            const data = await parseExcelFile(file);

            if (data.length === 0) {
                alert("Faylka Excel waa madhan yahay");
                setUploading(false);
                return;
            }

            // Upload based on type
            if (uploadType === "students") {
                const { uploadStudentsExcel } = await import("@/lib/actions/admin");
                const uploadResult = await uploadStudentsExcel(JSON.stringify(data), schoolId);
                setResult(uploadResult);
            } else if (uploadType === "teachers") {
                const { uploadTeachersExcel } = await import("@/lib/actions/admin");
                const uploadResult = await uploadTeachersExcel(JSON.stringify(data), schoolId);
                setResult(uploadResult);
            } else if (uploadType === "timetable") {
                const { uploadTimetableExcel } = await import("@/lib/actions/admin");
                const uploadResult = await uploadTimetableExcel(JSON.stringify(data), schoolId);
                setResult(uploadResult);
            } else if (uploadType === "class-subjects") {
                const { uploadClassSubjectsExcel } = await import("@/lib/actions/upload_class_subjects");
                const uploadResult = await uploadClassSubjectsExcel(JSON.stringify(data), schoolId);
                setResult(uploadResult);
            } else if (uploadType === "exams") {
                const { uploadExamsExcel } = await import("@/lib/actions/admin");
                const uploadResult = await uploadExamsExcel(JSON.stringify(data), schoolId);
                setResult(uploadResult);
            } else {
                const { uploadSubjectsExcel } = await import("@/lib/actions/admin");
                const uploadResult = await uploadSubjectsExcel(JSON.stringify(data), schoolId);
                setResult(uploadResult);
            }
        } catch (e: any) {
            alert("Wax khalad ah ayaa dhacay: " + e.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Soo Geli Excel</h1>
                <p className="text-slate-500 text-sm font-medium">Samee ardayda iyo macallimiinta si toos ah Excel</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Form */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                    <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="material-icons text-blue-500">upload_file</span>
                        Soo Geli Faylka
                    </h2>

                    {/* Upload Type Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-3">Dooro Nooca</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => setUploadType("students")}
                                className={`px-4 py-4 rounded-xl font-bold transition-all ${uploadType === "students"
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                <span className="material-icons block mb-1 text-sm">school</span>
                                <span className="text-xs">Ardayda</span>
                            </button>
                            <button
                                onClick={() => setUploadType("teachers")}
                                className={`px-4 py-4 rounded-xl font-bold transition-all ${uploadType === "teachers"
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                <span className="material-icons block mb-1 text-sm">badge</span>
                                <span className="text-xs">Macallimiinta</span>
                            </button>
                            <button
                                onClick={() => setUploadType("timetable")}
                                className={`px-4 py-4 rounded-xl font-bold transition-all ${uploadType === "timetable"
                                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                <span className="material-icons block mb-1 text-sm">calendar_today</span>
                                <span className="text-xs">Jadwalka</span>
                            </button>
                            <button
                                onClick={() => setUploadType("subjects")}
                                className={`px-4 py-4 rounded-xl font-bold transition-all ${uploadType === "subjects"
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                <span className="material-icons block mb-1 text-sm">book</span>
                                <span className="text-xs">Maadooyinka</span>
                            </button>
                            <button
                                onClick={() => setUploadType("class-subjects")}
                                className={`px-4 py-4 rounded-xl font-bold transition-all ${uploadType === "class-subjects"
                                    ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                <span className="material-icons block mb-1 text-sm">class</span>
                                <span className="text-xs">Fasalka & Maadooyinka</span>
                            </button>
                            <button
                                onClick={() => setUploadType("exams")}
                                className={`px-4 py-4 rounded-xl font-bold transition-all ${uploadType === "exams"
                                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                <span className="material-icons block mb-1 text-sm">event</span>
                                <span className="text-xs">Imtixaanaadka</span>
                            </button>
                        </div>
                    </div>

                    {/* Template Download */}
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-sm text-amber-800 mb-3 font-medium">
                            <span className="material-icons text-sm align-middle mr-1">info</span>
                            Soo deji qaabka Excel si aad u aragto sida loo qoro
                        </p>
                        <button
                            onClick={downloadTemplate}
                            className="w-full px-4 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-icons">download</span>
                            Soo Deji Template ({uploadType === "students" ? "Ardayda" : uploadType === "teachers" ? "Macallimiinta" : uploadType === "timetable" ? "Jadwalka" : uploadType === "exams" ? "Imtixaanaadka" : "Maadooyinka"})
                        </button>
                    </div>

                    {/* File Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-3">Dooro Faylka Excel</label>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                        />
                        {file && (
                            <p className="mt-2 text-sm text-slate-600 flex items-center gap-2">
                                <span className="material-icons text-green-500 text-sm">check_circle</span>
                                {file.name}
                            </p>
                        )}
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full px-6 py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                Waa la soo geliyaa...
                            </>
                        ) : (
                            <>
                                <span className="material-icons">cloud_upload</span>
                                Soo Geli Excel
                            </>
                        )}
                    </button>
                </div>

                {/* Results Display */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                    <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="material-icons text-blue-500">assessment</span>
                        Natiijada
                    </h2>

                    {result ? (
                        <div>
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                    <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Guul</p>
                                    <p className="text-3xl font-black text-emerald-700">{result.success}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                                    <p className="text-xs text-red-600 font-bold uppercase mb-1">Fashil</p>
                                    <p className="text-3xl font-black text-red-700">{result.failed}</p>
                                </div>
                            </div>

                            {/* Error Details */}
                            {result.errors.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3">Khaladaadka:</h3>
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                        {result.errors.map((error, idx) => (
                                            <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                                <p className="font-bold text-red-900 mb-2">Row {error.row}</p>
                                                <p className="text-sm text-slate-600 mb-2">
                                                    {uploadType === "students"
                                                        ? `${error.data.first_name || 'N/A'} ${error.data.last_name || ''} - ${error.data.class || 'N/A'}`
                                                        : uploadType === "teachers"
                                                            ? `${error.data.first_name || 'N/A'} ${error.data.last_name || ''} - ${error.data.subject || 'N/A'}`
                                                            : uploadType === "timetable"
                                                                ? `${error.data.teacher || 'N/A'} - ${error.data.subject || 'N/A'} - ${error.data.class || 'N/A'}`
                                                                : uploadType === "exams"
                                                                    ? `${error.data.subject || 'N/A'} - ${error.data.classes || 'N/A'}`
                                                                    : `${error.data.name || 'N/A'}`
                                                    }
                                                </p>
                                                <ul className="text-sm text-red-700 space-y-1">
                                                    {error.errors.map((err, i) => (
                                                        <li key={i}>• {err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.success > 0 && result.failed === 0 && (
                                <div className="text-center py-8">
                                    <span className="material-icons text-6xl text-emerald-500 mb-4">check_circle</span>
                                    <p className="text-emerald-600 font-bold text-lg">Dhammaan waa lagu guuleystay!</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="material-icons text-6xl text-slate-300 mb-4">pending_actions</span>
                            <p className="text-slate-500 font-medium">Soo geli faylka si aad u aragto natiijada</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-3xl p-6">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span className="material-icons">help_outline</span>
                    Tilmaamaha
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-blue-800">
                    <div>
                        <p className="font-bold mb-2">Ardayda:</p>
                        <ul className="space-y-1 ml-4">
                            <li>• <strong>first_name</strong>: Magaca hore</li>
                            <li>• <strong>last_name</strong>: Magaca dambe</li>
                            <li>• <strong>level</strong>: Primary, Secondary, ama HighSchool</li>
                            <li>• <strong>class</strong>: Tusaale: 6A, 7B, 10C</li>
                            <li className="mt-2 text-xs">Username: magaca (lowercase, no spaces)</li>
                            <li className="text-xs">Password: magaca + class (lowercase)</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-bold mb-2">Macallimiinta:</p>
                        <ul className="space-y-1 ml-4">
                            <li>• <strong>first_name</strong>: Magaca hore</li>
                            <li>• <strong>last_name</strong>: Magaca dambe</li>
                            <li>• <strong>subject</strong>: Maadada ay bartaan</li>
                            <li className="mt-2 text-xs">Username: magaca (lowercase, no spaces)</li>
                            <li className="text-xs">Password: Password123</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-bold mb-2">Jadwalka:</p>
                        <ul className="space-y-1 ml-4">
                            <li>• <strong>teacher</strong>: Magaca macalinka</li>
                            <li>• <strong>subject</strong>: Maadada</li>
                            <li>• <strong>class</strong>: Fasalka (6A, 7B)</li>
                            <li>• <strong>day_of_week</strong>: Monday-Sunday</li>
                            <li>• <strong>period</strong>: 1-8</li>
                            <li className="mt-2 text-xs">Jadwalka hore waa la tirtiri doonaa</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-bold mb-2">Imtixaanaadka:</p>
                        <ul className="space-y-1 ml-4">
                            <li>• <strong>subject</strong>: Maadada (Mathematics)</li>
                            <li>• <strong>classes</strong>: Fasallada (e.g. "6A, 7B")</li>
                            <li>• <strong>date</strong>: YYYY-MM-DD</li>
                            <li>• <strong>exam_type</strong>: midterm / final</li>
                            <li>• <strong>start_time</strong>: HH:MM:SS (e.g. 09:00:00)</li>
                            <li>• <strong>end_time</strong>: HH:MM:SS</li>
                            <li className="mt-2 text-xs">Waa la sameyn doonaa imtixaan fasal walba</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
