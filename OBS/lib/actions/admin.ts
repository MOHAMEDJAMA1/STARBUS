"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { AttendanceRecord } from "@/types/data";

export async function getAdminDashboardData() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get schoolId from cookie or user metadata
    const schoolId = cookieStore.get("school_id")?.value;
    if (!schoolId) return null; // Or handle error

    // Fetch Stats
    // Managers (Admins) in this school
    const { count: managerCount } = await supabase.from("users").select("*", { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'admin');
    const { count: teacherCount } = await supabase.from("users").select("*", { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'teacher');
    const { count: studentCount } = await supabase.from("users").select("*", { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'student');
    const { count: classCount } = await supabase.from("classes").select("*", { count: 'exact', head: true }).eq('school_id', schoolId);

    // Fetch Recent Announcements
    const { getRecentAnnouncements } = await import("@/lib/actions/announcements");
    const announcements = await getRecentAnnouncements(schoolId);

    // Fetch Attendance Stats
    const attendanceStats = await getAttendanceStats(schoolId);

    return {
        stats: {
            managers: managerCount || 0,
            teachers: teacherCount || 0,
            students: studentCount || 0,
            classes: classCount || 0
        },
        announcements: announcements || [],
        attendanceStats: attendanceStats || []
    };
}

// Helper actions for Admin Timetable Features

export async function getAdminClasses(schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from("classes").select("*").eq("school_id", schoolId).order("grade").order("section");
    return data || [];
}

export async function getAdminTeachers(schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch teachers with their subjects
    const { data } = await supabase
        .from("users")
        .select(`
            *,
            teacher_subjects(subject_id)
        `)
        .eq("school_id", schoolId)
        .eq("role", "teacher");

    return data?.map(t => ({
        id: t.id,
        firstName: t.first_name,
        lastName: t.last_name,
        email: t.email,
        phone: t.phone,
        role: t.role,
        subjectIds: t.teacher_subjects?.map((ts: any) => ts.subject_id) || []
    })) || [];
}

export async function getAdminSubjects(schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from("subjects").select("*").eq("school_id", schoolId);
    return data || [];
}

export async function getClassTimetable(schoolId: string, classId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data } = await supabase.from("timetable")
        .select("*")
        .eq("school_id", schoolId)
        .eq("class_id", classId);

    return data?.map(t => ({
        id: t.id,
        dayOfWeek: t.day_of_week,
        periodNumber: t.period_number,
        classId: t.class_id,
        subjectId: t.subject_id,
        teacherId: t.teacher_id,
        schoolId: t.school_id
    })) || [];
}

export async function assignTimetableSlot(schoolId: string, slot: any) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Check if slot exists
    const { data: existing } = await supabase.from("timetable")
        .select("id")
        .eq("school_id", schoolId)
        .eq("class_id", slot.classId)
        .eq("day_of_week", slot.dayOfWeek)
        .eq("period_number", slot.periodNumber)
        .single();

    const payload = {
        school_id: schoolId,
        class_id: slot.classId,
        day_of_week: slot.dayOfWeek,
        period_number: slot.periodNumber,
        subject_id: slot.subjectId,
        teacher_id: slot.teacherId
    };

    let result;
    if (existing) {
        result = await supabase.from("timetable").update(payload).eq("id", existing.id);
    } else {
        result = await supabase.from("timetable").insert(payload);
    }

    if (result.error) throw new Error(result.error.message);
    return { success: true };
}

export async function getAdminExams(schoolId: string) {
    console.log(`[getAdminExams] Fetching exams for school: ${schoolId}`);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // SIMPLIFIED: Fetch raw exams, plus subjects and classes for manual mapping
    const [examsRes, subjectsRes, classesRes] = await Promise.all([
        supabase.from("exams").select("*").eq("school_id", schoolId),
        supabase.from("subjects").select("id, name").eq("school_id", schoolId),
        supabase.from("classes").select("id, name, grade, section").eq("school_id", schoolId)
    ]);

    const rawExams = examsRes.data || [];
    const subjects = subjectsRes.data || [];
    const classes = classesRes.data || [];

    if (examsRes.error) {
        console.error("[getAdminExams] SUPABASE ERROR:", examsRes.error);
        return [];
    }

    // Create lookup maps
    const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
    const classMap = new Map(classes.map(c => [c.id, `${c.grade}-${c.section}`]));

    console.log(`[getAdminExams] Success! Found ${rawExams.length} exams.`);

    // Map manually
    return rawExams.map(e => ({
        id: e.id,
        title: `${(e.exam_type || 'Unknown').toUpperCase()} - ${e.exam_date}`,
        date: e.exam_date,
        startTime: e.start_time,
        endTime: e.end_time,
        type: e.exam_type,
        subjectId: e.subject_id,
        subjectName: subjectMap.get(e.subject_id) || "Unknown Subject",
        classId: e.class_id,
        className: classMap.get(e.class_id) || "Unknown Class",
        schoolId: e.school_id
    }));
}

export async function createExam(schoolId: string, title: string, date: string, subjectId: string, classId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.from("exams").insert({
        school_id: schoolId,
        title,
        date,
        subject_id: subjectId,
        class_id: classId
    });

    if (error) return { error: error.message };
    return { success: true };
}

export async function createClass(schoolId: string, name: string, grade: number, section: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Check duplicate?
    const { data: existing } = await supabase.from("classes")
        .select("id")
        .eq("school_id", schoolId)
        .eq("grade", grade)
        .eq("section", section)
        .single();

    if (existing) return { error: "Class already exists" };

    const { error } = await supabase.from("classes").insert({
        school_id: schoolId,
        name,
        grade,
        section,
        education_level: grade <= 6 ? "Primary" : grade <= 9 ? "Secondary" : "High School"
    });

    if (error) return { error: error.message };
    return { success: true };
}

export async function createSubject(schoolId: string, name: string, code: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Check duplicate code
    const { data: existing } = await supabase.from("subjects")
        .select("id")
        .eq("school_id", schoolId)
        .eq("code", code)
        .single();

    if (existing) return { error: "Subject code already exists" };

    const { error } = await supabase.from("subjects").insert({
        school_id: schoolId,
        name,
        code
    });

    if (error) return { error: error.message };
    return { success: true };
}

export async function getAdminStudents(schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from("users").select("*, classes(name, grade, section)").eq("school_id", schoolId).eq("role", "student");
    return data?.map(s => {
        const cls = Array.isArray(s.classes) ? s.classes[0] : s.classes;
        return {
            id: s.id,
            firstName: s.first_name,
            lastName: s.last_name,
            email: s.email,
            role: s.role,
            classId: s.class_id,
            className: cls ? `${cls.grade}-${cls.section}` : "Unassigned"
        };
    }) || [];
}

async function createSchoolUser(schoolId: string, firstName: string, lastName: string, email: string, role: string, password?: string, extraData: any = {}) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return { error: "Missing Service Role Key" };

    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Auto-append domain if missing
    let finalEmail = email.trim();
    if (!finalEmail.includes("@")) {
        finalEmail = `${finalEmail}@som.edu`;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: finalEmail,
        password: password || "TempPassword123!",
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName, role, school_id: schoolId }
    });

    if (authError) return { error: authError.message };
    if (!authData.user) return { error: "Failed to create user" };

    const { error: profileError } = await supabaseAdmin.from("users").upsert({
        id: authData.user.id,
        email: finalEmail,
        first_name: firstName,
        last_name: lastName,
        role,
        school_id: schoolId,
        must_change_password: true,
        ...extraData
    });

    if (profileError) {
        console.error("Profile creation error", profileError);
        // Clean up auth user?
        return { error: "User created but profile failed: " + profileError.message };
    }
    return { success: true };
}

export async function createTeacher(schoolId: string, firstName: string, lastName: string, email: string, password?: string) {
    return createSchoolUser(schoolId, firstName, lastName, email, "teacher", password);
}

export async function createStudent(schoolId: string, firstName: string, lastName: string, email: string, classId?: string, password?: string) {
    return createSchoolUser(schoolId, firstName, lastName, email, "student", password, classId ? { class_id: classId } : {});
}

export async function getAttendanceStats(schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: classes } = await supabase.from("classes").select("id, name, grade, section").eq("school_id", schoolId);
    if (!classes) return [];

    const stats = await Promise.all(classes.map(async (cls) => {
        const { count: studentCount } = await supabase.from("users").select("id", { count: 'exact' }).eq("class_id", cls.id);

        // Calculate attendance rate (present / total records)
        const { data: attendance } = await supabase.from("attendance").select("status").eq("class_id", cls.id);
        const total = attendance?.length || 0;
        const present = attendance?.filter(a => a.status === 'present').length || 0;
        const rate = total > 0 ? (present / total) * 100 : 0;

        return {
            class: cls,
            totalStudents: studentCount || 0,
            attendanceRate: rate
        };
    }));

    return stats;
}

export async function getExamReports(schoolId: string, examId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (!examId) return [];

    const { data: exam } = await supabase.from("exams").select("*, classes(*)").eq("id", examId).single();
    if (!exam) return [];

    const { data: results } = await supabase.from("results").select("score, max_score").eq("exam_id", examId);

    if (!results || results.length === 0) return [];

    const scores = results.map(r => (r.score / r.max_score) * 100);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);

    // Return formatting matching the UI expectation (array of class stats)
    return [{
        class: exam.classes, // aggregated class details
        studentCount: results.length,
        averageScore: average,
        lowestScore: min,
        highestScore: max
    }];
}

export async function getStudentReport(studentId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get student details
    const { data: student } = await supabase
        .from("users")
        .select(`
            *,
            classes (id, name, grade, section)
        `)
        .eq("id", studentId)
        .single();

    if (!student) return null;

    // Get attendance records
    const { data: attendanceRecords } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId);

    const totalDays = attendanceRecords?.length || 0;
    const present = attendanceRecords?.filter(a => a.status === "Present").length || 0;
    const absent = attendanceRecords?.filter(a => a.status === "Absent").length || 0;
    const late = attendanceRecords?.filter(a => a.status === "Late").length || 0;
    const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    // Get exam results
    const { data: results } = await supabase
        .from("results")
        .select(`
            *,
            subjects (name),
            exams (title)
        `)
        .eq("student_id", studentId);

    const mappedResults = results?.map(r => ({
        id: r.id,
        subjectName: r.subjects?.name,
        examTitle: r.exams?.title,
        score: r.score,
        grade: r.score >= 90 ? "A" : r.score >= 80 ? "B" : r.score >= 70 ? "C" : r.score >= 60 ? "D" : "F"
    })) || [];

    const averageScore = results && results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 0;

    return {
        student: {
            id: student.id,
            firstName: student.first_name,
            lastName: student.last_name,
            studentNo: student.student_no,
            className: `${student.classes?.grade}${student.classes?.section}`
        },
        attendance: {
            totalDays,
            present,
            absent,
            late,
            percentage
        },
        results: mappedResults,
        averageScore
    };
}

// Helper function to check if username exists and generate unique one
async function generateUniqueUsername(supabase: any, baseUsername: string, schoolId: string): Promise<string> {
    let username = baseUsername;
    let counter = 1;

    while (true) {
        const { data } = await supabase
            .from("users")
            .select("id")
            .eq("email", username)
            .eq("school_id", schoolId)
            .single();

        if (!data) return username; // Username is available

        username = baseUsername + counter;
        counter++;
    }
}

export async function uploadStudentsExcel(dataJson: string, schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const data = JSON.parse(dataJson);

    const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ row: number; data: any; errors: string[] }>
    };

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel rows start at 2 (1 is header)

        try {
            // Validate row
            const errors: string[] = [];

            if (!row.first_name || typeof row.first_name !== 'string' || row.first_name.trim() === '') {
                errors.push('first_name is required');
            }
            if (!row.last_name || typeof row.last_name !== 'string' || row.last_name.trim() === '') {
                errors.push('last_name is required');
            }
            if (!row.level || !['Primary', 'Secondary', 'HighSchool'].includes(row.level)) {
                errors.push('level must be "Primary", "Secondary", or "HighSchool"');
            }
            if (!row.class || typeof row.class !== 'string') {
                errors.push('class is required');
            }

            if (errors.length > 0) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors });
                continue;
            }

            // Parse class (e.g., "6A" -> grade: 6, section: "A")
            const classMatch = row.class.match(/^(\d+)([A-Za-z])$/);
            if (!classMatch) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: ['class must be in format: number + letter (e.g., "6A")'] });
                continue;
            }

            const grade = parseInt(classMatch[1]);
            const section = classMatch[2].toUpperCase();

            // Check/create class
            let classId: string;
            const { data: existingClass } = await supabase
                .from("classes")
                .select("id")
                .eq("school_id", schoolId)
                .eq("grade", grade)
                .eq("section", section)
                .single();

            if (existingClass) {
                classId = existingClass.id;
            } else {
                // Create new class
                const { data: newClass, error: classError } = await supabase
                    .from("classes")
                    .insert({
                        school_id: schoolId,
                        name: `${grade}${section}`,
                        grade,
                        section,
                        education_level: row.level
                    })
                    .select("id")
                    .single();

                if (classError || !newClass) {
                    results.failed++;
                    results.errors.push({ row: rowNumber, data: row, errors: [`Failed to create class: ${classError?.message}`] });
                    continue;
                }
                classId = newClass.id;
            }

            // Generate username and password
            const fullName = `${row.first_name} ${row.last_name}`.trim();
            const baseUsername = fullName.toLowerCase().replace(/\s+/g, '');

            let username;
            if (row.username && typeof row.username === 'string' && row.username.trim() !== '') {
                // Use provided username (e.g. Admission ID)
                // We should check if it exists or let createSchoolUser fail/generate?
                // createSchoolUser creates email from username.
                // We should probably check if it's already taken to be safe or just trust the unique constraint error handling.
                // Let's rely on checking availability to be user friendly.
                const desiredUsername = row.username.trim();
                const { data: existingUser } = await supabase.from("users").select("id").eq("email", desiredUsername.includes('@') ? desiredUsername : `${desiredUsername}@som.edu`).eq("school_id", schoolId).single();

                if (existingUser) {
                    results.failed++;
                    results.errors.push({ row: rowNumber, data: row, errors: [`Username '${desiredUsername}' is already taken`] });
                    continue;
                }
                username = desiredUsername;
            } else {
                // Auto-generate
                username = await generateUniqueUsername(supabase, baseUsername, schoolId);
            }

            const password = baseUsername + row.class.toLowerCase().replace(/\s+/g, '');

            // Create student user via createSchoolUser
            const result = await createSchoolUser(
                schoolId,
                row.first_name,
                row.last_name,
                username,
                'student',
                password,
                { class_id: classId }
            );

            if (result.error) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: [result.error] });
            } else {
                results.success++;
            }
        } catch (e: any) {
            results.failed++;
            results.errors.push({ row: rowNumber, data: row, errors: [e.message || 'Unknown error'] });
        }
    }

    return results;
}

export async function uploadTeachersExcel(dataJson: string, schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const data = JSON.parse(dataJson);

    const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ row: number; data: any; errors: string[] }>
    };

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
            // Validate row
            const errors: string[] = [];

            if (!row.first_name || typeof row.first_name !== 'string' || row.first_name.trim() === '') {
                errors.push('first_name is required');
            }
            if (!row.last_name || typeof row.last_name !== 'string' || row.last_name.trim() === '') {
                errors.push('last_name is required');
            }
            if (!row.subject || typeof row.subject !== 'string' || row.subject.trim() === '') {
                errors.push('subject is required');
            }

            if (errors.length > 0) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors });
                continue;
            }

            // Handle multiple subjects
            const subjectNames = row.subject.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
            const subjectIds: string[] = [];

            for (const subjectName of subjectNames) {
                // Check/create subject
                let subjectId: string;
                const { data: existingSubject } = await supabase
                    .from("subjects")
                    .select("id")
                    .eq("school_id", schoolId)
                    .eq("name", subjectName)
                    .single();

                if (existingSubject) {
                    subjectId = existingSubject.id;
                } else {
                    // Create new subject
                    const subjectCode = subjectName.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
                    const { data: newSubject, error: subjectError } = await supabase
                        .from("subjects")
                        .insert({
                            school_id: schoolId,
                            name: subjectName,
                            code: subjectCode
                        })
                        .select("id")
                        .single();

                    if (subjectError || !newSubject) {
                        results.failed++;
                        results.errors.push({ row: rowNumber, data: row, errors: [`Failed to create subject ${subjectName}: ${subjectError?.message}`] });
                        continue;
                    }
                    subjectId = newSubject.id;
                }
                subjectIds.push(subjectId);
            }

            if (subjectIds.length === 0) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: ['No valid subjects found'] });
                continue;
            }

            // Generate username
            const fullName = `${row.first_name} ${row.last_name}`.trim();
            const baseUsername = fullName.toLowerCase().replace(/\s+/g, '');
            const username = await generateUniqueUsername(supabase, baseUsername, schoolId);
            const password = "Password123";

            // Create teacher user
            const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
            const supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            );

            const finalEmail = username.includes('@') ? username : `${username}@som.edu`;

            // Create auth user
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: finalEmail,
                password: password,
                email_confirm: true,
                user_metadata: { first_name: row.first_name, last_name: row.last_name, role: 'teacher', school_id: schoolId }
            });

            if (authError || !authData.user) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: [authError?.message || 'Failed to create user'] });
                continue;
            }

            const teacherId = authData.user.id;

            // Create user profile
            const { error: profileError } = await supabaseAdmin.from("users").upsert({
                id: teacherId,
                email: finalEmail,
                first_name: row.first_name,
                last_name: row.last_name,
                role: 'teacher',
                school_id: schoolId,
                must_change_password: true
            });

            if (profileError) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: [`Profile creation failed: ${profileError.message}`] });
                continue;
            }

            // Link teacher to subjects
            for (const sId of subjectIds) {
                const { error: linkError } = await supabaseAdmin
                    .from("teacher_subjects")
                    .insert({
                        teacher_id: teacherId,
                        subject_id: sId
                    });

                if (linkError) {
                    console.error('Failed to link teacher to subject:', linkError);
                }
            }

            // ASSIGN TEACHER TO CLASSES (New Logic)
            if (row.classes && typeof row.classes === 'string') {
                const classNames = row.classes.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0);

                for (const className of classNames) {
                    // Find Class
                    const { data: cls } = await supabase
                        .from("classes")
                        .select("id")
                        .eq("school_id", schoolId)
                        .eq("name", className) // Assuming exact match like "6A" or "6-A" depending on format
                        .single();

                    if (cls) {
                        // Upsert into class_subjects with teacher_id
                        // We need to link ALL subjects this teacher teaches to this class?
                        // OR does the CSV imply "Teacher teaches THESE subjects to THESE classes"?
                        // Usually yes.
                        // We iterate all subjectIds we just processed.

                        for (const sId of subjectIds) {
                            // Check/Create link
                            const { data: existingLink } = await supabase
                                .from("class_subjects")
                                .select("id")
                                .eq("class_id", cls.id)
                                .eq("subject_id", sId)
                                .single();

                            if (existingLink) {
                                await supabaseAdmin
                                    .from("class_subjects")
                                    .update({ teacher_id: teacherId })
                                    .eq("id", existingLink.id);
                            } else {
                                await supabaseAdmin
                                    .from("class_subjects")
                                    .insert({
                                        class_id: cls.id,
                                        subject_id: sId,
                                        school_id: schoolId,
                                        teacher_id: teacherId
                                    });
                            }
                        }
                    } else {
                        console.warn(`Class ${className} not found for teacher assignment`);
                    }
                }
            }

            results.success++;

        } catch (e: any) {
            results.failed++;
            results.errors.push({ row: rowNumber, data: row, errors: [e.message || 'Unknown error'] });
        }
    }

    return results;
}

export async function uploadTimetableExcel(dataJson: string, schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const data = JSON.parse(dataJson);

    const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ row: number; data: any; errors: string[] }>
    };

    // Track which classes we've already cleared
    const clearedClasses = new Set<string>();

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
            // Validate row
            const errors: string[] = [];

            if (!row.teacher || typeof row.teacher !== 'string' || row.teacher.trim() === '') {
                errors.push('teacher is required');
            }
            if (!row.subject || typeof row.subject !== 'string' || row.subject.trim() === '') {
                errors.push('subject is required');
            }
            if (!row.class || typeof row.class !== 'string') {
                errors.push('class is required');
            }
            if (!row.day_of_week || typeof row.day_of_week !== 'string') {
                errors.push('day_of_week is required');
            } else {
                const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                if (!validDays.includes(row.day_of_week)) {
                    errors.push('day_of_week must be Monday-Sunday');
                }
            }
            if (!row.period || typeof row.period !== 'number') {
                errors.push('period is required and must be a number');
            } else if (row.period < 1 || row.period > 12) {
                errors.push('period must be between 1 and 12');
            }

            if (errors.length > 0) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors });
                continue;
            }

            // Parse class
            const classMatch = row.class.match(/^(\d+)([A-Za-z])$/);
            if (!classMatch) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: ['class must be in format: number + letter (e.g., "6A")'] });
                continue;
            }

            const grade = parseInt(classMatch[1]);
            const section = classMatch[2].toUpperCase();

            // Find or create class
            let classId: string;
            const { data: existingClass } = await supabase
                .from("classes")
                .select("id")
                .eq("school_id", schoolId)
                .eq("grade", grade)
                .eq("section", section)
                .single();

            if (existingClass) {
                classId = existingClass.id;
            } else {
                // Determine education level from grade
                let educationLevel = 'Primary';
                if (grade >= 7 && grade <= 9) educationLevel = 'Secondary';
                else if (grade >= 10) educationLevel = 'HighSchool';

                const { data: newClass, error: classError } = await supabase
                    .from("classes")
                    .insert({
                        school_id: schoolId,
                        name: `${grade}${section}`,
                        grade,
                        section,
                        education_level: educationLevel
                    })
                    .select("id")
                    .single();

                if (classError || !newClass) {
                    results.failed++;
                    results.errors.push({ row: rowNumber, data: row, errors: [`Failed to create class: ${classError?.message}`] });
                    continue;
                }
                classId = newClass.id;
            }

            // Clear existing timetable for this class (only once per class)
            if (!clearedClasses.has(classId)) {
                await supabase
                    .from("timetable")
                    .delete()
                    .eq("class_id", classId);
                clearedClasses.add(classId);
            }

            // Find teacher by name
            const teacherName = row.teacher.trim();
            const nameParts = teacherName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            const { data: teachers } = await supabase
                .from("users")
                .select("id")
                .eq("school_id", schoolId)
                .eq("role", "teacher")
                .or(`first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%`);

            if (!teachers || teachers.length === 0) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: [`Teacher "${teacherName}" not found`] });
                continue;
            }

            const teacherId = teachers[0].id;

            // Find or create subject
            let subjectId: string;
            const { data: existingSubject } = await supabase
                .from("subjects")
                .select("id")
                .eq("school_id", schoolId)
                .eq("name", row.subject)
                .single();

            if (existingSubject) {
                subjectId = existingSubject.id;
            } else {
                const subjectCode = row.subject.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
                const { data: newSubject, error: subjectError } = await supabase
                    .from("subjects")
                    .insert({
                        school_id: schoolId,
                        name: row.subject,
                        code: subjectCode
                    })
                    .select("id")
                    .single();

                if (subjectError || !newSubject) {
                    results.failed++;
                    results.errors.push({ row: rowNumber, data: row, errors: [`Failed to create subject: ${subjectError?.message}`] });
                    continue;
                }
                subjectId = newSubject.id;
            }

            // Create timetable entry
            const { error: timetableError } = await supabase
                .from("timetable")
                .insert({
                    school_id: schoolId,
                    class_id: classId,
                    subject_id: subjectId,
                    teacher_id: teacherId,
                    day_of_week: row.day_of_week,
                    period_number: row.period
                });

            if (timetableError) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: [`Failed to create timetable entry: ${timetableError.message}`] });
            } else {
                results.success++;
            }
        } catch (e: any) {
            results.failed++;
            results.errors.push({ row: rowNumber, data: row, errors: [e.message || 'Unknown error'] });
        }
    }

    return results;
}

export async function uploadSubjectsExcel(dataJson: string, schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const data = JSON.parse(dataJson);

    const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ row: number; data: any; errors: string[] }>
    };

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
            // Validate row
            const errors: string[] = [];

            if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
                errors.push('name is required');
            }

            if (errors.length > 0) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors });
                continue;
            }

            // Check if subject already exists
            const { data: existingSubject } = await supabase
                .from("subjects")
                .select("id")
                .eq("school_id", schoolId)
                .eq("name", row.name)
                .single();

            if (existingSubject) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: ['Subject already exists'] });
                continue;
            }

            // Generate subject code
            const subjectCode = row.name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);

            // Create subject
            const { error: subjectError } = await supabase
                .from("subjects")
                .insert({
                    school_id: schoolId,
                    name: row.name,
                    code: subjectCode
                });

            if (subjectError) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: [subjectError.message] });
            } else {
                results.success++;
            }
        } catch (e: any) {
            results.failed++;
            results.errors.push({ row: rowNumber, data: row, errors: [e.message || 'Unknown error'] });
        }
    }

    return results;
}

export async function uploadExamsExcel(dataJson: string, schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const data = JSON.parse(dataJson);

    const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ row: number; data: any; errors: string[] }>
    };

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
            // Validate row
            const errors: string[] = [];

            if (!row.subject || typeof row.subject !== 'string' || row.subject.trim() === '') {
                errors.push('subject is required');
            }
            const dateStr = row.date || row.exam_date;
            if (!dateStr || typeof dateStr !== 'string') {
                errors.push('date is required');
            }
            if (!row.classes || typeof row.classes !== 'string') {
                errors.push('classes is required (comma separated)');
            }

            if (errors.length > 0) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors });
                continue;
            }

            // Find subject
            const { data: subject } = await supabase
                .from("subjects")
                .select("id")
                .eq("school_id", schoolId)
                .eq("name", row.subject)
                .single();

            if (!subject) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors: [`Subject "${row.subject}" not found`] });
                continue;
            }

            // Parse Classes
            const classNames = row.classes.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0);

            for (const className of classNames) {
                const { data: cls } = await supabase
                    .from("classes")
                    .select("id")
                    .eq("school_id", schoolId)
                    .eq("name", className)
                    .single();

                if (!cls) {
                    continue;
                }

                // Check for existing exam to avoid duplicates
                const { data: existingExam } = await supabase
                    .from("exams")
                    .select("id")
                    .eq("school_id", schoolId)
                    .eq("class_id", cls.id)
                    .eq("subject_id", subject.id)
                    .eq("exam_date", dateStr)
                    .single();

                if (existingExam) {
                    continue; // Skip if already exists
                }

                // Insert Exam
                const { error: insertError } = await supabase
                    .from("exams")
                    .insert({
                        school_id: schoolId,
                        class_id: cls.id,
                        subject_id: subject.id,
                        exam_type: row.exam_type?.toLowerCase() || 'midterm',
                        exam_date: dateStr,
                        start_time: row.start_time || '09:00:00',
                        end_time: row.end_time || '11:00:00',
                        location: row.location || 'Main Hall'
                    });

                if (insertError) {
                    results.errors.push({ row: rowNumber, data: row, errors: [`Failed to schedule for ${className}: ${insertError.message}`] });
                }
            }

            results.success++;

        } catch (e: any) {
            results.failed++;
            results.errors.push({ row: rowNumber, data: row, errors: [e.message || 'Unknown error'] });
        }
    }

    return results;
}

export async function resetSchoolUserPassword(userId: string, newPassword?: string) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return { error: "Missing Service Role Key" };

    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const password = newPassword || "TempPassword123!";

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password,
        user_metadata: { must_change_password: true }
    });

    if (authError) return { error: authError.message };

    // Also update the profile
    const { error: profileError } = await supabaseAdmin.from("users").update({
        must_change_password: true
    }).eq("id", userId);

    if (profileError) {
        console.error("Failed to update profile must_change_password", profileError);
    }

    return { success: true, password };
}
