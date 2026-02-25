export type Role = "owner" | "admin" | "teacher" | "student";

export interface School {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    isActive: boolean;
    createdAt: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    schoolId?: string; // Optional for Owner
    avatarUrl?: string;
    mustChangePassword?: boolean;
}

export interface Teacher extends User {
    role: "teacher";
    specialization: string;
    subjectIds: string[];
}

export interface Student extends User {
    role: "student";
    studentNo: string;
    classId: string;
    parentEmail?: string;
}

export type EducationLevel = "Primary" | "Secondary" | "High School";

export interface Class {
    id: string;
    name: string; // e.g. "6"
    section: string; // e.g. "A"
    educationLevel: EducationLevel;
    grade: number; // Numeric grade level (1-12)
    schoolId: string;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    schoolId: string;
}

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface Exam {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    subjectId: string;
    classId: string;
    lessonId?: string; // Optional if it's a general exam period like "Midterms"
    startTime?: string; // ISO String - Optional if just using date
    endTime?: string; // ISO String - Optional
    schoolId?: string; // Global or per school
}

export interface Result {
    id: string;
    examId: string; // Optional if just ad-hoc grade entry, but usually linked to an 'Exam' entity
    studentId: string;
    classId: string;
    subjectId: string;
    teacherId: string;
    score: number;
    schoolId: string;
}

export interface AttendanceRecord {
    id: string;
    studentId: string;
    classId: string;
    date: string; // YYYY-MM-DD
    periodNumber: number;
    status: "Present" | "Absent" | "Late" | "Excused";
    schoolId: string;
}

export interface TimetableEntry {
    id: string;
    classId: string;
    dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
    periodNumber: number;
    subjectId: string;
    teacherId: string;
    schoolId: string;
}

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const PERIODS = Array.from({ length: 12 }, (_, i) => ({
    periodNumber: i + 1,
    startTime: `${8 + i}:00`, // refined later if needed
    endTime: `${8 + i}:45`
}));
