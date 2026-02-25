"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getTeacherDashboardData() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return null;

    // Get teacher info
    const { data: teacher } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", userId)
        .single();

    if (!teacher) return null;

    // Get teacher's subject
    const { data: teacherSubject } = await supabase
        .from("teacher_subjects")
        .select("subjects (name)")
        .eq("teacher_id", userId)
        .single();

    // Get today's classes from timetable
    const today = new Date();
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()];

    const { data: todayClasses } = await supabase
        .from("timetable")
        .select(`
            period_number,
            classes (name),
            subjects (name)
        `)
        .eq("teacher_id", userId)
        .eq("day_of_week", dayName)
        .order("period_number");

    // Count total classes assigned to teacher
    const { count: classCount } = await supabase
        .from("timetable")
        .select("class_id", { count: 'exact', head: true })
        .eq("teacher_id", userId);

    // Count total students in teacher's classes
    const { data: assignedClasses } = await supabase
        .from("timetable")
        .select("class_id")
        .eq("teacher_id", userId);

    const classIds = [...new Set(assignedClasses?.map(c => c.class_id) || [])];

    const { count: studentCount } = await supabase
        .from("users")
        .select("id", { count: 'exact', head: true })
        .in("class_id", classIds)
        .eq("role", "student");

    return {
        teacherName: `${teacher.first_name} ${teacher.last_name}`,
        subject: (Array.isArray(teacherSubject?.subjects) ? teacherSubject?.subjects[0] : teacherSubject?.subjects)?.name || "N/A",
        todayClasses: (todayClasses || []).map((t: any) => ({
            period: t.period_number,
            className: (Array.isArray(t.classes) ? t.classes[0] : t.classes)?.name || "Unknown",
            subjectName: (Array.isArray(t.subjects) ? t.subjects[0] : t.subjects)?.name || "Unknown"
        })),
        totalClasses: classCount || 0,
        totalStudents: studentCount || 0
    };
}

export async function getTeacherWeeklySchedule() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return [];

    const { data } = await supabase
        .from("timetable")
        .select(`
            day_of_week,
            period_number,
            subjects (name),
            classes (name)
        `)
        .eq("teacher_id", userId)
        .order("day_of_week")
        .order("period_number");

    return (data || []).map((t: any) => ({
        dayOfWeek: t.day_of_week,
        periodNumber: t.period_number,
        subjectName: (Array.isArray(t.subjects) ? t.subjects[0] : t.subjects)?.name || "Unknown",
        className: (Array.isArray(t.classes) ? t.classes[0] : t.classes)?.name || "Unknown"
    }));
}

export async function saveAttendance(attendanceData: any[]) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const userId = cookieStore.get("user_id")?.value;
    const schoolId = cookieStore.get("school_id")?.value;

    if (!schoolId) {
        // Fallback: fetch school_id from user profile
        const { data: user } = await supabase.from("users").select("school_id").eq("id", userId!).single();
        if (!user?.school_id) return { error: "School ID not found" };

        // Inject school_id into data
        const dataWithSchool = attendanceData.map(a => ({ ...a, school_id: user.school_id }));
        const { error } = await supabase.from("attendance").upsert(dataWithSchool);
        return { error };
    }

    const dataWithSchool = attendanceData.map(a => ({
        ...a,
        school_id: schoolId,
        teacher_id: userId // Inject teacher_id
    }));
    const { error } = await supabase
        .from("attendance")
        .upsert(dataWithSchool);

    return { error };
}

export async function saveGrades(gradesData: any[]) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const userId = cookieStore.get("user_id")?.value;
    const schoolId = cookieStore.get("school_id")?.value;

    let targetSchoolId = schoolId;
    if (!targetSchoolId) {
        const { data: user } = await supabase.from("users").select("school_id").eq("id", userId!).single();
        targetSchoolId = user?.school_id;
    }

    if (!targetSchoolId) return { error: "School ID not found" };

    // Clean data: remove 'percentage' if present, inject school_id and teacher_id
    const cleanData = gradesData.map(g => {
        const { percentage, ...rest } = g;
        return {
            ...rest,
            school_id: targetSchoolId,
            teacher_id: userId // Inject teacher_id
        };
    });

    const { error } = await supabase
        .from("grades")
        .upsert(cleanData);

    return { error };
}
export async function getTeacherClasses(schoolId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return [];

    // Get classes where teacher has a timetable entry
    const { data } = await supabase
        .from("timetable")
        .select(`
            classes (id, name, grade, section)
        `)
        .eq("teacher_id", userId);

    if (!data) return [];

    // Deduplicate classes
    const uniqueClasses = new Map();
    data.forEach((item: any) => {
        const cls = Array.isArray(item.classes) ? item.classes[0] : item.classes;
        if (cls) {
            uniqueClasses.set(cls.id, cls);
        }
    });

    return Array.from(uniqueClasses.values());
}

export async function getTeacherSubjects(schoolId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return [];

    const { data } = await supabase
        .from("teacher_subjects")
        .select(`
            subjects (id, name, code)
        `)
        .eq("teacher_id", userId);

    return data?.map((item: any) => Array.isArray(item.subjects) ? item.subjects[0] : item.subjects) || [];
}

export async function getTeacherExams() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return [];

    // Get teacher's subjects
    const { data: subjects } = await supabase
        .from("teacher_subjects")
        .select("subject_id")
        .eq("teacher_id", userId);

    const subjectIds = subjects?.map(s => s.subject_id) || [];

    if (subjectIds.length === 0) return [];

    // Get exams for these subjects
    const { data: exams } = await supabase
        .from("exams")
        .select(`
            *,
            classes (name),
            subjects (name)
        `)
        .in("subject_id", subjectIds)
        .order("exam_date", { ascending: true });

    return (exams || []).map((e: any) => ({
        ...e,
        className: (Array.isArray(e.classes) ? e.classes[0] : e.classes)?.name || "Unknown",
        subjectName: (Array.isArray(e.subjects) ? e.subjects[0] : e.subjects)?.name || "Unknown"
    }));
}

export async function getTeacherSchedule(schoolId?: string, userId?: string, dayOfWeek?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const currentUserId = cookieStore.get("user_id")?.value;

    // Use passed userId or current session userId
    const targetUserId = userId || currentUserId;

    if (!targetUserId) return [];

    let query = supabase
        .from("timetable")
        .select(`
            id,
            day_of_week,
            period_number,
            subjects (name),
            classes (name)
        `)
        .eq("teacher_id", targetUserId)
        .order("period_number");

    if (dayOfWeek) {
        query = query.eq("day_of_week", dayOfWeek);
    } else {
        query = query.order("day_of_week");
    }

    const { data } = await query;
    return data || [];
}

export async function getClassStudents(classId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data } = await supabase
        .from("users")
        .select("*")
        .eq("class_id", classId)
        .eq("role", "student")
        .order("first_name");

    return data || [];
}

export async function getAttendance(schoolId: string, classId: string, date: string, subjectId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    let query = supabase
        .from("attendance")
        .select("*")
        .eq("class_id", classId)
        .eq("date", date);

    if (subjectId) {
        query = query.eq("subject_id", subjectId);
    }

    const { data } = await query;

    return data || [];
}

export async function getResults(schoolId: string, classId: string, subjectId: string, examType?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    let query = supabase
        .from("grades")
        .select("*")
        .eq("class_id", classId)
        .eq("subject_id", subjectId);

    if (examType) {
        query = query.eq("exam_type", examType);
    }

    const { data } = await query;

    return (data || []).map((r: any) => ({
        id: r.id,
        studentId: r.student_id,
        score: r.score,
        examId: r.exam_id
    }));
}


