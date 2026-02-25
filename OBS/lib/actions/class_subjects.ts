"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// ==================== CLASS-SUBJECT MANAGEMENT ====================

/**
 * Assign a subject to a class
 */
export async function assignSubjectToClass(classId: string, subjectId: string, schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("class_subjects")
        .insert({
            class_id: classId,
            subject_id: subjectId,
            school_id: schoolId
        });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

/**
 * Remove a subject from a class
 */
export async function removeSubjectFromClass(classId: string, subjectId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("class_subjects")
        .delete()
        .eq("class_id", classId)
        .eq("subject_id", subjectId);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

/**
 * Get all subjects assigned to a class
 */
export async function getClassSubjects(classId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
        .from("class_subjects")
        .select(`
            id,
            subject_id,
            subjects (id, name, code)
        `)
        .eq("class_id", classId);

    if (error) {
        console.error("Error fetching class subjects:", error);
        return [];
    }

    return data?.map(cs => ({
        id: cs.id,
        subjectId: cs.subject_id,
        name: (Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects)?.name || "",
        code: (Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects)?.code || ""
    })) || [];
}

/**
 * Bulk assign subjects to multiple classes
 * Useful for assigning same subjects to all sections (e.g., 6-A, 6-B, 6-C)
 */
export async function bulkAssignSubjects(classIds: string[], subjectIds: string[], schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Create all combinations of class-subject pairs
    const assignments = classIds.flatMap(classId =>
        subjectIds.map(subjectId => ({
            class_id: classId,
            subject_id: subjectId,
            school_id: schoolId
        }))
    );

    const { error } = await supabase
        .from("class_subjects")
        .insert(assignments);

    if (error) {
        return { error: error.message };
    }

    return { success: true, count: assignments.length };
}

/**
 * Get all classes with their assigned subjects count
 */
export async function getClassesWithSubjectCount(schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: classes } = await supabase
        .from("classes")
        .select(`
            id,
            name,
            level,
            class_subjects (count)
        `)
        .eq("school_id", schoolId)
        .order("name");

    return classes?.map(c => ({
        id: c.id,
        name: c.name,
        level: c.level,
        subjectCount: c.class_subjects?.[0]?.count || 0
    })) || [];
}
