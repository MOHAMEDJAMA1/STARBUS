"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Get subjects assigned to the student's class
 * This shows what subjects the student is taking based on their class
 */
export async function getStudentSubjects() {
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

    if (!student || !student.class_id) return [];

    // Get subjects assigned to the student's class
    const { data } = await supabase
        .from("class_subjects")
        .select(`
            id,
            subject_id,
            subjects (id, name, code)
        `)
        .eq("class_id", student.class_id);

    return data?.map(cs => {
        const subject = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
        return {
            id: subject?.id || "",
            name: subject?.name || "",
            code: subject?.code || ""
        };
    }) || [];
}
