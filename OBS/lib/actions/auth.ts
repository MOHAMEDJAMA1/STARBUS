"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    if (!user) {
        return { error: "Login failed" };
    }

    // Fetch user role and details from public.users
    const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError || !userProfile) {
        // Fallback or error handling
        console.error("Profile fetch error", profileError);
        return { error: "User profile not found. Please contact support." };
    }

    // Check for password change requirement
    if (userProfile.must_change_password) {
        cookieStore.set("must_change_password", "true", { path: "/" });
    } else {
        cookieStore.delete("must_change_password");
    }

    // Set role cookie for middleware convenience (optional, strictly middleware should verify token)
    // But our middleware logic relies on `user_role` cookie currently
    cookieStore.set("user_role", userProfile.role, { path: "/" });
    cookieStore.set("user_id", userProfile.id, { path: "/" });
    if (userProfile.school_id) {
        cookieStore.set("school_id", userProfile.school_id, { path: "/" });
    }

    // Redirect based on role
    if (userProfile.must_change_password) {
        return redirect("/change-password");
    }

    switch (userProfile.role) {
        case "owner":
            return redirect("/owner");
        case "admin":
            return redirect("/admin");
        case "teacher":
            return redirect("/teacher");
        case "student":
            return redirect("/student");
        default:
            return redirect("/");
    }
}

export async function updatePassword(formData: FormData) {
    const newPassword = formData.get("password") as string;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const userId = cookieStore.get("user_id")?.value;
    if (!userId) {
        return { error: "Session expired. Please sign in again." };
    }

    // 1. Update password in Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (authError) {
        return { error: authError.message };
    }

    // 2. Clear the must_change_password flag in the database
    const { error: dbError } = await supabase
        .from("users")
        .update({ must_change_password: false })
        .eq("id", userId);

    if (dbError) {
        console.error("Failed to update must_change_password flag", dbError);
        // We continue because auth took the change, but this is a sync issue.
    }

    // 3. Clear the cookie flag
    cookieStore.delete("must_change_password");

    // Fetch user details for redirection
    const { data: userProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

    if (!userProfile) return redirect("/sign-in");

    // Redirect to respective dashboard
    switch (userProfile.role) {
        case "owner":
            return redirect("/owner");
        case "admin":
            return redirect("/admin");
        case "teacher":
            return redirect("/teacher");
        case "student":
            return redirect("/student");
        default:
            return redirect("/");
    }
}

export async function getCurrentUserProfile() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const userId = cookieStore.get("user_id")?.value;
    if (!userId) return null;

    const { data: user, error } = await supabase
        .from("users")
        .select("*, classes(grade, section)")
        .eq("id", userId)
        .single();

    if (error || !user) {
        console.error("Profile fetch error in sidebar", error);
        return null;
    }

    return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        class: user.classes ? `${user.classes.grade}${user.classes.section}` : null,
        schoolId: user.school_id
    };
}

export async function signOut() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();

    // Clear custom cookies
    cookieStore.delete("user_role");
    cookieStore.delete("user_id");
    cookieStore.delete("school_id");
    cookieStore.delete("must_change_password");

    return redirect("/sign-in");
}
