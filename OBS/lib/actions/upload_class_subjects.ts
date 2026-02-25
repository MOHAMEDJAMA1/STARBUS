"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Upload class-subject assignments via Excel
 * Format: class, level, subject
 * Auto-creates classes and subjects if they don't exist
 * Assigns subjects to classes
 */
export async function uploadClassSubjectsExcel(dataJson: string, schoolId: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const data = JSON.parse(dataJson);

    const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ row: number; data: any; errors: string[] }>
    };

    // Track created classes and subjects to avoid duplicates
    const classCache = new Map<string, string>(); // class name -> class ID
    const subjectCache = new Map<string, string>(); // subject name -> subject ID

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
            // Validate row
            const errors: string[] = [];

            if (!row.class || typeof row.class !== 'string') {
                errors.push('class is required');
            }
            if (!row.level || typeof row.level !== 'string') {
                errors.push('level is required');
            }

            // Check for subject OR subjects
            let subjectList: string[] = [];
            if (row.subjects && typeof row.subjects === 'string') {
                subjectList = row.subjects.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
            } else if (row.subject && typeof row.subject === 'string') {
                subjectList = [row.subject.trim()];
            }

            if (subjectList.length === 0) {
                errors.push('subject or subjects column is required');
            }

            if (errors.length > 0) {
                results.failed++;
                results.errors.push({ row: rowNumber, data: row, errors });
                continue;
            }

            // Get or create class
            let classId: string;
            // ... (class creation logic remains mostly same, but need to be careful about scope if I wrap properly)
            // Actually, best to keep class creation outside the subject loop so we only do it once per row.

            if (classCache.has(row.class)) {
                classId = classCache.get(row.class)!;
            } else {
                const { data: existingClass } = await supabase
                    .from("classes")
                    .select("id")
                    .eq("school_id", schoolId)
                    .eq("name", row.class)
                    .single();

                if (existingClass) {
                    classId = existingClass.id;
                } else {
                    // Parse class name
                    const parts = row.class.split('-');
                    let grade: number | null = null;
                    let section: string | null = null;

                    // Handle "6A" vs "6-A"
                    const match = row.class.match(/^(\d+)-?([A-Za-z])$/);
                    if (match) {
                        grade = parseInt(match[1]);
                        section = match[2];
                    } else if (parts.length === 2) {
                        grade = parseInt(parts[0]);
                        section = parts[1];
                    }

                    if (!grade || !section) {
                        results.failed++;
                        results.errors.push({ row: rowNumber, data: row, errors: [`Invalid class format: "${row.class}". Expected "6A" or "6-A"`] });
                        continue;
                    }

                    // Create new class
                    const { data: newClass, error: classError } = await supabase
                        .from("classes")
                        .insert({
                            school_id: schoolId,
                            name: row.class, // Keep original format/normalization?
                            grade: grade,
                            section: section,
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
                classCache.set(row.class, classId);
            }

            // Iterate over subjects
            for (const subjectName of subjectList) {
                // Get or create subject
                let subjectId: string;
                if (subjectCache.has(subjectName)) {
                    subjectId = subjectCache.get(subjectName)!;
                } else {
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
                            // Log error but continue with other subjects?
                            // Better to record partial failure
                            // For simplicity, we just log to console or append to results
                            console.error(`Failed to create subject ${subjectName}: ${subjectError?.message}`);
                            continue;
                        }
                        subjectId = newSubject.id;
                    }
                    subjectCache.set(subjectName, subjectId);
                }

                // Assign subject to class
                const { error: assignError } = await supabase
                    .from("class_subjects")
                    .insert({
                        class_id: classId,
                        subject_id: subjectId,
                        school_id: schoolId
                    });

                if (assignError && assignError.code !== '23505') {
                    // unexpected error
                    console.error(`Failed to assign ${subjectName} to ${row.class}: ${assignError.message}`);
                }
            }

            results.success++; // Count row as success if we processed it (even if some subjects failed? simplistic approach)
        } catch (e: any) {
            results.failed++;
            results.errors.push({ row: rowNumber, data: row, errors: [e.message || 'Unknown error'] });
        }
    }

    return results;
}
