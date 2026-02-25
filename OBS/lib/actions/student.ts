"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getStudentInfo() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return null;

    // Fetch student info with class and today's timetable
    const { data: student } = await supabase
        .from("users")
        .select(`
            first_name,
            last_name,
            class:class_id (
                id,
                name
            )
        `)
        .eq("id", userId)
        .single();

    if (!student) return null;

    // Get today's classes from timetable
    const today = new Date();
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()];

    const { data: todayClasses } = await supabase
        .from("timetable")
        .select(`
            period_number,
            subjects (name),
            teacher:teacher_id (first_name, last_name)
        `)
        .eq("class_id", (student.class as any)?.id)
        .eq("day_of_week", dayName)
        .order("period_number");

    return {
        firstName: student.first_name,
        lastName: student.last_name,
        className: (student.class as any)?.name || "N/A",
        todayClasses: (todayClasses || []).map((t: any) => ({
            period: t.period_number,
            subject: t.subjects?.name || "Unknown",
            teacher: t.teacher ? `${t.teacher.first_name} ${t.teacher.last_name}` : "Unknown"
        }))
    };
}

export async function getStudentAttendanceSummary() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return [];

    // Get student's class_id
    const { data: student } = await supabase
        .from("users")
        .select("class_id")
        .eq("id", userId)
        .single();

    if (!student?.class_id) return [];

    // Get all subjects for student's class
    const { data: classSubjects } = await supabase
        .from("class_subjects")
        .select(`
            subject_id,
            subjects (id, name)
        `)
        .eq("class_id", student.class_id);

    if (!classSubjects) return [];

    // Get attendance summary for each subject
    const summaries = await Promise.all(
        classSubjects.map(async (cs: any) => {
            const subjectId = cs.subject_id;
            const subjectName = cs.subjects.name;

            const { data: records } = await supabase
                .from("attendance")
                .select("status")
                .eq("student_id", userId)
                .eq("subject_id", subjectId);

            const totalClasses = records?.length || 0;
            const present = records?.filter(r => r.status === 'present').length || 0;
            const absent = records?.filter(r => r.status === 'absent').length || 0;
            const late = records?.filter(r => r.status === 'late').length || 0;
            const excused = records?.filter(r => r.status === 'excused').length || 0;
            const percentage = totalClasses > 0 ? (present / totalClasses) * 100 : 0;

            return {
                subjectId,
                subjectName,
                totalClasses,
                present,
                absent,
                late,
                excused,
                percentage
            };
        })
    );

    return summaries;
}

export async function getStudentTimetable() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const userId = cookieStore.get("user_id")?.value;
    if (!userId) return [];

    // Get student's class
    const { data: user } = await supabase
        .from("users")
        .select("class_id")
        .eq("id", userId)
        .single();

    if (!user?.class_id) return [];

    // Return timetable for the class
    const { data } = await supabase
        .from("timetable")
        .select(`
            day_of_week,
            period_number,
            subjects (name),
            teacher:teacher_id (first_name, last_name)
        `)
        .eq("class_id", user.class_id)
        .order("day_of_week")
        .order("period_number");

    return (data || []).map((t: any) => ({
        dayOfWeek: t.day_of_week,
        periodNumber: t.period_number,
        subjectName: t.subjects?.name || "Unknown",
        teacherName: t.teacher ? `${t.teacher.first_name} ${t.teacher.last_name}` : "Unknown"
    }));
}

export async function getStudentGrades() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return [];

    // Get all grades for the student
    const { data } = await supabase
        .from("grades")
        .select(`
            id,
            exam_type,
            exam_name,
            score,
            max_score,
            percentage,
            date,
            subjects (name)
        `)
        .eq("student_id", userId)
        .order("date", { ascending: false });

    return data || [];
}

export async function getStudentResults() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return [];

    // Get student's class
    const { data: student } = await supabase
        .from("users")
        .select("class_id")
        .eq("id", userId)
        .single();

    if (!student?.class_id) return [];

    // Get all subjects for student's class
    const { data: classSubjects } = await supabase
        .from("class_subjects")
        .select(`
            subject_id,
            subjects (id, name)
        `)
        .eq("class_id", student.class_id);

    if (!classSubjects) return [];

    // Get all grades for the student
    const { data: allGrades } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", userId);

    // Group grades by subject
    const results = classSubjects.map((cs: any) => {
        const subjectId = cs.subject_id;
        const subjectName = cs.subjects.name;

        const subjectGrades = allGrades?.filter(g => g.subject_id === subjectId) || [];

        const midterm = subjectGrades.find(g => g.exam_type === 'midterm');
        const final = subjectGrades.find(g => g.exam_type === 'final');

        // Calculate overall percentage only if both exams exist
        let overallPercentage = 0;
        let status: 'pass' | 'fail' | 'pending' = 'pending';

        if (midterm && final) {
            const scores = [midterm, final];
            overallPercentage = scores.reduce((sum, g: any) => sum + g.percentage, 0) / scores.length;
            status = overallPercentage >= 60 ? 'pass' : 'fail';
        }

        return {
            subjectId,
            subjectName,
            midterm: midterm ? {
                score: midterm.score,
                maxScore: midterm.max_score,
                percentage: midterm.percentage,
                date: midterm.date
            } : null,
            final: final ? {
                score: final.score,
                maxScore: final.max_score,
                percentage: final.percentage,
                date: final.date
            } : null,
            overallPercentage,
            status
        };
    });

    return results;
}

export async function getStudentExams() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const userId = cookieStore.get("user_id")?.value;

    if (!userId) return [];

    // Get student's class
    const { data: student } = await supabase
        .from("users")
        .select("class_id")
        .eq("id", userId)
        .single();

    if (!student?.class_id) return [];

    // Get all exams for student's class
    const { data: exams } = await supabase
        .from("exams")
        .select(`
            id,
            exam_type,
            exam_date,
            start_time,
            end_time,
            location,
            notes,
            subjects (name)
        `)
        .eq("class_id", student.class_id)
        .order("exam_date")
        .order("start_time");

    return (exams || []).map((exam: any) => ({
        id: exam.id,
        subjectName: exam.subjects?.name || "Unknown",
        examType: exam.exam_type,
        date: exam.exam_date,
        startTime: exam.start_time,
        endTime: exam.end_time,
        location: exam.location,
        notes: exam.notes
    }));
}

