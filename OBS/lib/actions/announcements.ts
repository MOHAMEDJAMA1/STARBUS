"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(title: string, content: string, targetClassId: string | null) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const role = user.user_metadata.role;

    // Validate role
    if (!['teacher', 'admin', 'owner'].includes(role)) {
        return { error: "Unauthorized" };
    }

    const { error } = await supabase.from("announcements").insert({
        title,
        content,
        author_id: user.id,
        author_role: role,
        target_class_id: targetClassId === "all" ? null : targetClassId
    });

    if (error) return { error: error.message };

    revalidatePath("/teacher/messages");
    revalidatePath("/student");
    return { success: true };
}

export async function getTeacherAnnouncements() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get teacher's school_id
    const { data: teacherProfile } = await supabase
        .from("users")
        .select("school_id")
        .eq("id", user.id)
        .single();

    if (!teacherProfile) return [];

    // Fetch announcements from the same school (Inbox)
    // We filter where the author is in the same school.
    const { data } = await supabase
        .from("announcements")
        .select(`
            *,
            users:author_id!inner (first_name, last_name, role, school_id)
        `)
        .eq("users.school_id", teacherProfile.school_id)
        .order("created_at", { ascending: false });

    return data?.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        createdAt: a.created_at, // Map snake_case to camelCase
        author: a.users ? `${a.users.first_name} ${a.users.last_name}` : 'Unknown',
        authorRole: a.users?.role,
        targetClassId: a.target_class_id
    })) || [];
}

export async function getStudentAnnouncements() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get student's class
    const { data: student } = await supabase
        .from("users")
        .select("class_id")
        .eq("id", user.id)
        .single();

    if (!student) return [];

    // Fetch announcements: global (null) OR matching class_id
    // Supabase OR syntax is a bit specific:
    // target_class_id.is.null,target_class_id.eq.CLASS_ID

    let query = supabase
        .from("announcements")
        .select(`
            *,
            users (first_name, last_name, role)
        `)
        .order("created_at", { ascending: false });

    if (student.class_id) {
        query = query.or(`target_class_id.is.null,target_class_id.eq.${student.class_id}`);
    } else {
        query = query.is("target_class_id", null);
    }

    const { data } = await query;
    return data || [];
}

export async function getTeacherClasses() {
    // Helper to get classes a teacher is assigned to (for the dropdown)
    // We reuse logic from `actions/admin` or `teacher` but let's implement a simple one here.
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch classes linked to this teacher...
    // The schema is `class_subjects`? Or `classes` if they are main teacher?
    // Let's assume `class_subjects` links teacher to class.

    const { data } = await supabase
        .from("class_subjects")
        .select("classes(id, name, grade, section)")
        .eq("teacher_id", user.id);

    // Deduplicate
    const classesMap = new Map();
    data?.forEach((item: any) => {
        if (item.classes) {
            classesMap.set(item.classes.id, item.classes);
        }
    });

    return Array.from(classesMap.values());
}

export async function getRecentAnnouncements(schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data } = await supabase
        .from("announcements")
        .select(`
            *,
            users!inner(school_id, first_name, last_name, role),
            classes (name)
        `)
        .eq("users.school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(5);

    return data?.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        createdAt: a.created_at,
        authorName: `${a.users?.first_name} ${a.users?.last_name}`,
        authorRole: a.users?.role,
        targetClass: a.classes?.name || "All Classes"
    })) || [];
}
