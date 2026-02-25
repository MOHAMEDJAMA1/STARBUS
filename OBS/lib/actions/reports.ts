"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function searchStudentsByName(schoolId: string, query: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (!query || query.length < 2) return [];

    console.log(`[Search] Searching for '${query}' in school '${schoolId}'`);
    const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, class:class_id(name)")
        .eq("school_id", schoolId)
        .eq("role", "student")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10);

    if (error) console.error("[Search] Error:", error);
    console.log(`[Search] Found ${data?.length || 0} students`);
    return data || [];
}

export async function getStudentFullProfile(studentId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Basic Info
    const { data: student } = await supabase
        .from("users")
        .select("first_name, last_name, email, class:class_id(id, name, grade, section)")
        .eq("id", studentId)
        .single();

    if (!student) return null;

    // 2. Attendance Stats
    const { data: attendance } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", studentId);

    const total = attendance?.length || 0;
    const present = attendance?.filter(a => a.status === 'present').length || 0;
    const absent = attendance?.filter(a => a.status === 'absent').length || 0;
    const late = attendance?.filter(a => a.status === 'late').length || 0;

    // 3. Exam Grades
    const { data: grades } = await supabase
        .from("grades")
        .select("*, subjects(name)")
        .eq("student_id", studentId)
        .order("date", { ascending: false });

    return {
        info: student,
        attendance: { total, present, absent, late },
        grades: grades || []
    };
}
