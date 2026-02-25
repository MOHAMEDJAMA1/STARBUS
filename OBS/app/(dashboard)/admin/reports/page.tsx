"use client";

import { useState } from "react";

interface StudentResult {
    id: string;
    first_name: string;
    last_name: string;
    class: { name: string };
}

interface FullProfile {
    info: any;
    attendance: any;
    grades: any[];
}

import { searchStudentsByName, getStudentFullProfile } from "@/lib/actions/reports";
import { getCurrentUserProfile } from "@/lib/actions/auth";

function generateSummary(profile: FullProfile) {
    const { attendance, grades } = profile;
    const total = attendance.total || 0;
    const present = attendance.present || 0;
    const attendanceRate = total > 0 ? (present / total) * 100 : null;

    const validGrades = grades.filter((g: any) => g.percentage != null);
    const avgGrade = validGrades.length > 0
        ? validGrades.reduce((sum: number, g: any) => sum + g.percentage, 0) / validGrades.length
        : null;

    const reasons: string[] = [];

    // --- Xaadirinta ---
    if (attendanceRate === null) {
        reasons.push("Xog ku saabsan xaadiriinta ma la diiwaan-gelinin.");
    } else if (attendanceRate >= 90) {
        reasons.push(`Ardaygan Xaadirintiisu  aad ayay u wanaagsan tahay — ardaygu wuxuu yimid ${attendanceRate.toFixed(0)}% waqtiga.`);
    } else if (attendanceRate >= 75) {
        reasons.push(`Xaadirin wanaagsan — ${attendanceRate.toFixed(0)}%.`);
    } else if (attendanceRate >= 60) {
        reasons.push(`Xaadiriintiisu waa ${attendanceRate.toFixed(0)}% oo ka hooseysa 75% ee lagu tala galay — fasalada badan ayuu ka maqna.`);
    } else {
        reasons.push(`Ardaygan Xaadirintiisu aad ayey u hooseysaa — ${attendanceRate.toFixed(0)}% kaliya. Ardaygu badanaa wuu maqan yahay.`);
    }

    // --- Natiijooyinka guud ---
    if (avgGrade === null) {
        reasons.push("Wax natiijooyin imtixaan ah oo la diiwaan-geliyay ma jiraan.");
    } else if (avgGrade >= 80) {
        reasons.push(`Waxbarashadiisu aad bay u fiican tahay — celceliska goolku waa ${avgGrade.toFixed(1)}%.`);
    } else if (avgGrade >= 60) {
        reasons.push(`Waxqabadkiisu celceliskiisu waa ${avgGrade.toFixed(1)}%. Weli waxaa jira fursad wax laga hagaajiyo.`);
    } else if (avgGrade >= 50) {
        reasons.push(`Waxqabadka guud waa mid xadka ku dhow — celceliska goolku waa ${avgGrade.toFixed(1)}%. Ardaygu waa inuu dadaal badan sameeyo.`);
    } else {
        reasons.push(`Waxqabadka waxbarasho ee guud way liidata — celceliska waa ${avgGrade.toFixed(1)}% kaliya. Xalin degdeg ah ayaa loo baahan yahay.`);
    }

    // --- Per-subject breakdown ---
    const subjectMap: Record<string, { name: string; scores: number[] }> = {};
    for (const g of validGrades) {
        const name = (g.subjects?.name) || "Unknown Subject";
        if (!subjectMap[name]) subjectMap[name] = { name, scores: [] };
        subjectMap[name].scores.push(g.percentage);
    }
    const subjectAverages = Object.values(subjectMap).map(s => ({
        name: s.name,
        avg: s.scores.reduce((a: number, b: number) => a + b, 0) / s.scores.length,
    }));
    const failingSubjects = subjectAverages.filter(s => s.avg < 50);
    const excellentSubjects = subjectAverages.filter(s => s.avg >= 85);
    for (const s of failingSubjects) {
        reasons.push(`Ardaygu waxa ku adag ${s.name} — wuxuu helay ${s.avg.toFixed(0)}% oo ah darajad fashil ah.`);
    }
    for (const s of excellentSubjects) {
        reasons.push(`Ardaygu aad ayuu ugu fiican yahay ${s.name} — wuxuu helay ${s.avg.toFixed(0)}%.`);
    }

    // Determine verdict
    const attOk = attendanceRate === null || attendanceRate >= 75;
    const gradeOk = avgGrade === null || avgGrade >= 60;
    const attGood = attendanceRate === null || attendanceRate >= 90;
    const gradeGood = avgGrade === null || avgGrade >= 80;
    const attBad = attendanceRate !== null && attendanceRate < 60;
    const gradeBad = avgGrade !== null && avgGrade < 50;

    if (attGood && gradeGood) {
        return { verdict: "Excellent", label: "Arday Heer Sare ah", icon: "star", color: "emerald", reasons };
    } else if (attOk && gradeOk) {
        return { verdict: "Good", label: "Arday Wanaagsan", icon: "thumb_up", color: "blue", reasons };
    } else if (attBad && gradeBad) {
        return { verdict: "Struggling", label: "Dhibaato Leh — Caawimo Loo Baahan Yahay", icon: "warning", color: "red", reasons };
    } else {
        return { verdict: "Attention", label: "Warbixinta ardayga", icon: "error_outline", color: "amber", reasons };
    }
}

export default function ReportsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<StudentResult[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<FullProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const profile = await getCurrentUserProfile();
            if (profile?.schoolId) {
                const results = await searchStudentsByName(profile.schoolId, query);
                // @ts-ignore
                setSearchResults(results);
            }
        } catch (e) {
            console.error(e);
        }
        setSearching(false);
    };

    const handleSelectStudent = async (studentId: string) => {
        setLoading(true);
        setSearchResults([]); // Clear search dropdown
        setSearchQuery(""); // Clear search input
        try {
            const profile = await getStudentFullProfile(studentId);
            // @ts-ignore
            setSelectedStudent(profile);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 flex-wrap">
                        <span className="material-icons text-blue-600">person_search</span>
                        Warbixinta Ardayda (Student Reports)
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Search for any student to view their full academic profile, attendance, and grades.</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-2xl">
                <div className="relative">
                    <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-base md:text-lg font-medium transition-all"
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    {searching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
                        {searchResults.map((student) => (
                            <button
                                key={student.id}
                                onClick={() => handleSelectStudent(student.id)}
                                className="w-full text-left px-6 py-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center group gap-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                        {student.first_name} {student.last_name}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">Class: {student.class?.name || "N/A"}</p>
                                </div>
                                <span className="material-icons text-slate-300 group-hover:text-blue-500 shrink-0">arrow_forward</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 animate-pulse">
                    <span className="material-icons text-5xl mb-4">school</span>
                    <p className="font-bold">Fetching student profile...</p>
                </div>
            )}

            {/* Student Profile Display */}
            {selectedStudent && !loading && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[100vw] overflow-x-hidden">

                    {/* Header Card */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-600/30 shrink-0">
                            {selectedStudent.info.first_name[0]}{selectedStudent.info.last_name[0]}
                        </div>
                        <div className="min-w-0 w-full">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2 md:mb-1 break-words leading-tight">
                                {selectedStudent.info.first_name} {selectedStudent.info.last_name}
                            </h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 text-sm font-medium text-slate-500">
                                <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 whitespace-nowrap text-xs md:text-sm">
                                    Class: {selectedStudent.info.class?.name}
                                </span>
                                <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 break-all text-xs md:text-sm">
                                    {selectedStudent.info.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Summary Card */}
                    {(() => {
                        const summary = generateSummary(selectedStudent);
                        const colorMap: Record<string, { bg: string, border: string, icon: string, badge: string, text: string }> = {
                            emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-500", badge: "bg-emerald-100 text-emerald-800", text: "text-emerald-700" },
                            blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-500", badge: "bg-blue-100 text-blue-800", text: "text-blue-700" },
                            amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-500", badge: "bg-amber-100 text-amber-800", text: "text-amber-700" },
                            red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500", badge: "bg-red-100 text-red-800", text: "text-red-700" },
                        };
                        const c = colorMap[summary.color];
                        return (
                            <div className={`p-6 md:p-8 rounded-3xl border-2 ${c.bg} ${c.border}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`material-icons text-3xl ${c.icon}`}>{summary.icon}</span>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Warbixinta Waxqabadka</p>
                                        <span className={`text-sm font-black uppercase tracking-wide px-3 py-1 rounded-full ${c.badge}`}>{summary.label}</span>
                                    </div>
                                </div>
                                <ul className="space-y-2">
                                    {summary.reasons.map((reason, i) => (
                                        <li key={i} className={`flex items-start gap-2 text-sm font-medium ${c.text}`}>
                                            <span className={`material-icons text-base mt-0.5 shrink-0 ${c.icon}`}>chevron_right</span>
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Attendance Card */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="material-icons text-amber-500">schedule</span>
                                Attendance Overview
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-row sm:flex-col items-center justify-between sm:justify-center px-6 sm:px-4">
                                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest sm:order-2 sm:mt-1">Present</p>
                                    <p className="text-2xl font-black text-emerald-600 sm:order-1">{selectedStudent.attendance.present}</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-row sm:flex-col items-center justify-between sm:justify-center px-6 sm:px-4">
                                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest sm:order-2 sm:mt-1">Absent</p>
                                    <p className="text-2xl font-black text-red-600 sm:order-1">{selectedStudent.attendance.absent}</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-row sm:flex-col items-center justify-between sm:justify-center px-6 sm:px-4">
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest sm:order-2 sm:mt-1">Total</p>
                                    <p className="text-2xl font-black text-blue-600 sm:order-1">{selectedStudent.attendance.total}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Grades Card */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="material-icons text-purple-500">grade</span>
                                Recent Performance
                            </h3>
                            <div className="space-y-4">
                                {selectedStudent.grades.length === 0 ? (
                                    <p className="text-slate-400 text-sm italic text-center py-4">No grades recorded yet.</p>
                                ) : (
                                    selectedStudent.grades.slice(0, 3).map((grade: any) => (
                                        <div key={grade.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                            <div>
                                                <p className="font-bold text-slate-800">{grade.subjects?.name}</p>
                                                <p className="text-xs text-slate-500 capitalize">{grade.exam_type} Exam</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-lg font-black ${grade.score >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {grade.score}/{grade.max_score}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Grades Table */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">All Exam Results</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 md:px-6 py-4">Subject</th>
                                        <th className="px-4 md:px-6 py-4">Exam Type</th>
                                        <th className="px-4 md:px-6 py-4">Date</th>
                                        <th className="px-4 md:px-6 py-4 text-right">Score</th>
                                        <th className="px-4 md:px-6 py-4 text-right">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {selectedStudent.grades.map((grade: any) => (
                                        <tr key={grade.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 md:px-6 py-4 font-bold text-slate-700">{grade.subjects?.name}</td>
                                            <td className="px-4 md:px-6 py-4 text-slate-600 capitalize">{grade.exam_type}</td>
                                            <td className="px-4 md:px-6 py-4 text-slate-500 text-sm">{new Date(grade.date).toLocaleDateString()}</td>
                                            <td className="px-4 md:px-6 py-4 text-right font-mono font-bold text-slate-800">{grade.score}/{grade.max_score}</td>
                                            <td className="px-4 md:px-6 py-4 text-right">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${grade.percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                    grade.percentage >= 50 ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {grade.percentage.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {!selectedStudent && !loading && (
                <div className="py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <span className="material-icons text-4xl text-slate-300">search</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Find a Student</h3>
                    <p className="text-slate-500 max-w-sm">Use the search bar above to look up a student by name and view their comprehensive academic report.</p>
                </div>
            )}
        </div>
    );
}
