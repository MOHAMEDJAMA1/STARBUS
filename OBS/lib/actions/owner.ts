"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { School } from "@/types/data";

export async function getOwnerDashboardData() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch schools
    const { data: schools, error: schoolsError } = await supabase
        .from("schools")
        .select("*")
        .order("created_at", { ascending: false });

    if (schoolsError) {
        console.error("Error fetching schools:", schoolsError);
        throw new Error(schoolsError.message);
    }

    // Fetch stats
    const { count: schoolCount } = await supabase.from("schools").select("*", { count: 'exact', head: true });
    const { count: managerCount } = await supabase.from("users").select("*", { count: 'exact', head: true }).eq('role', 'admin');
    const { count: teacherCount } = await supabase.from("users").select("*", { count: 'exact', head: true }).eq('role', 'teacher');
    const { count: studentCount } = await supabase.from("users").select("*", { count: 'exact', head: true }).eq('role', 'student');

    return {
        schools: schools?.map(s => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            logoUrl: s.logo_url,
            isActive: s.is_active,
            createdAt: s.created_at
        })) as School[] || [],
        stats: {
            schools: schoolCount || 0,
            managers: managerCount || 0,
            teachers: teacherCount || 0,
            students: studentCount || 0
        }
    };
}

export async function createSchool(name: string, slug: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Check if slug exists
    const { data: existing } = await supabase.from("schools").select("id").eq("slug", slug).single();
    if (existing) {
        return { error: "School slug already exists." };
    }

    // Use service role for owner-level school creation to bypass any RLS for this high-level action
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
        );

        const { data, error } = await supabaseAdmin.from("schools").insert({
            name,
            slug,
            is_active: true
        }).select().single();

        if (error) return { error: error.message };
        return { success: true, school: data };
    }

    // Fallback to standard client if no service key (local dev/unconfigured)
    const { data, error } = await supabase.from("schools").insert({
        name,
        slug,
        is_active: true
    }).select().single();

    if (error) {
        return { error: error.message };
    }

    return { success: true, school: data };
}

export async function getOwnerSchools() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data } = await supabase
        .from("schools")
        .select("*")
        .order("created_at", { ascending: false });

    return data || [];
}

export async function createManager(schoolId: string, firstName: string, lastName: string, email: string, password?: string) {
    // Note: We need SERVICE_ROLE_KEY to create users without signing in
    // Ensure this env var is set in Vercel/local
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
        return { error: "Server configuration error: Missing Service Role Key" };
    }

    // Dynamic import to avoid client-side bundling issues if this file is imported loosely
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // Auto-append domain if missing
    let finalEmail = email.trim();
    if (!finalEmail.includes("@")) {
        finalEmail = `${finalEmail}@som.edu`;
    }

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: finalEmail,
        password: password || "TempPassword123!", // Use custom password if provided
        email_confirm: true,
        user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: 'admin',
            school_id: schoolId
        }
    });

    if (authError) {
        return { error: authError.message };
    }

    if (!authData.user) {
        return { error: "Failed to create user" };
    }

    // 2. Ensure Public User Record Exists (if trigger didn't catch it or for safety)
    // My schema probably has a trigger, but explicitly upserting ensures data sync
    const { error: profileError } = await supabaseAdmin
        .from("users")
        .upsert({
            id: authData.user.id,
            email: finalEmail,
            first_name: firstName,
            last_name: lastName,
            role: 'admin',
            school_id: schoolId,
            must_change_password: true // Force password change
        });

    if (profileError) {
        // Rollback auth user if profile fails? 
        // For now just log error, as auth user exists.
        console.error("Profile creation error", profileError);
        return { error: "User created but profile failed: " + profileError.message };
    }

    return { success: true, user: authData.user };
}

export async function getSystemReports() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get high-level stats per school
    const { data: schools } = await supabase.from("schools").select("*");

    if (!schools) return [];

    const reports = await Promise.all(schools.map(async (school) => {
        const { count: studentCount } = await supabase
            .from("users")
            .select("*", { count: 'exact', head: true })
            .eq("school_id", school.id)
            .eq("role", "student");

        const { data: results } = await supabase
            .from("results")
            .select("score")
            .eq("school_id", school.id);

        const avgScore = results && results.length > 0
            ? results.reduce((acc, r) => acc + r.score, 0) / results.length
            : 0;

        return {
            school_id: school.id,
            school_name: school.name,
            student_count: studentCount || 0,
            average_score: Math.round(avgScore)
        };
    }));

    return reports;
}

export async function getSchoolManagers(schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, created_at")
        .eq("school_id", schoolId)
        .eq("role", "admin")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching managers:", error);
        return [];
    }

    return data?.map(m => ({
        id: m.id,
        firstName: m.first_name,
        lastName: m.last_name,
        email: m.email,
        createdAt: m.created_at
    })) || [];
}
