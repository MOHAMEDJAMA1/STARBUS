import * as XLSX from 'xlsx';

export interface StudentRow {
    first_name: string;
    last_name: string;
    level: string;
    class: string;
    username?: string;
}

export interface TeacherRow {
    first_name: string;
    last_name: string;
    subject: string;
}

export interface TimetableRow {
    teacher: string;
    subject: string;
    class: string;
    day_of_week: string;
    period: number;
}

export interface SubjectRow {
    name: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export interface UploadResult {
    success: number;
    failed: number;
    errors: Array<{ row: number; data: any; errors: string[] }>;
}

/**
 * Parse Excel file and return array of rows
 */
export async function parseExcelFile(file: File): Promise<any[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    return data;
}

/**
 * Generate username from full name (lowercase, no spaces)
 */
export function generateUsername(fullName: string): string {
    return fullName.toLowerCase().replace(/\s+/g, '');
}

/**
 * Generate student password: fullname + class (lowercase)
 */
export function generateStudentPassword(fullName: string, className: string): string {
    const username = generateUsername(fullName);
    return username + className.toLowerCase().replace(/\s+/g, '');
}

/**
 * Extract grade and section from class string (e.g., "6A" -> {grade: 6, section: "A"})
 */
export function parseClassName(className: string): { grade: number; section: string } | null {
    const match = className.match(/^(\d+)([A-Za-z])$/);
    if (!match) return null;
    return {
        grade: parseInt(match[1]),
        section: match[2].toUpperCase()
    };
}

/**
 * Validate student row data
 */
export function validateStudentRow(row: any): ValidationResult {
    const errors: string[] = [];

    if (!row.first_name || typeof row.first_name !== 'string' || row.first_name.trim() === '') {
        errors.push('first_name is required');
    }

    if (!row.last_name || typeof row.last_name !== 'string' || row.last_name.trim() === '') {
        errors.push('last_name is required');
    }

    if (!row.level || typeof row.level !== 'string') {
        errors.push('level is required');
    } else if (!['Primary', 'Secondary', 'HighSchool'].includes(row.level)) {
        errors.push('level must be "Primary", "Secondary", or "HighSchool"');
    }

    if (!row.class || typeof row.class !== 'string') {
        errors.push('class is required');
    } else if (!parseClassName(row.class)) {
        errors.push('class must be in format: number + letter (e.g., "6A")');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate teacher row data
 */
export function validateTeacherRow(row: any): ValidationResult {
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

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Create Excel template for students
 */
export function createStudentTemplate(): Blob {
    const data = [
        { first_name: 'Mohamed', last_name: 'Abshir', level: 'Primary', class: '6A', username: 'std1001' },
        { first_name: 'Fatima', last_name: 'Hassan', level: 'Secondary', class: '7B', username: '' },
        { first_name: 'Ahmed', last_name: 'Omar', level: 'HighSchool', class: '10C', username: 'ahmed.omar' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Create Excel template for teachers
 */
export function createTeacherTemplate(): Blob {
    const data = [
        { first_name: 'Ahmed', last_name: 'Mohamed', subject: 'Mathematics' },
        { first_name: 'Amina', last_name: 'Ali', subject: 'English' },
        { first_name: 'Hassan', last_name: 'Ibrahim', subject: 'Science' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generate subject code from subject name
 */
export function generateSubjectCode(subjectName: string): string {
    return subjectName
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 4);
}

/**
 * Validate subject row data
 */
export function validateSubjectRow(row: any): ValidationResult {
    const errors: string[] = [];

    if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
        errors.push('name is required');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate timetable row data
 */
export function validateTimetableRow(row: any): ValidationResult {
    const errors: string[] = [];

    if (!row.teacher || typeof row.teacher !== 'string' || row.teacher.trim() === '') {
        errors.push('teacher is required');
    }

    if (!row.subject || typeof row.subject !== 'string' || row.subject.trim() === '') {
        errors.push('subject is required');
    }

    if (!row.class || typeof row.class !== 'string') {
        errors.push('class is required');
    } else if (!parseClassName(row.class)) {
        errors.push('class must be in format: number + letter (e.g., "6A")');
    }

    if (!row.day_of_week || typeof row.day_of_week !== 'string') {
        errors.push('day_of_week is required');
    } else {
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (!validDays.includes(row.day_of_week)) {
            errors.push('day_of_week must be Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday');
        }
    }

    if (!row.period || typeof row.period !== 'number') {
        errors.push('period is required and must be a number');
    } else if (row.period < 1 || row.period > 12) {
        errors.push('period must be between 1 and 12');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Create Excel template for timetable
 */
export function createTimetableTemplate(): Blob {
    const data = [
        { teacher: 'Ahmed Mohamed Hassan', subject: 'Mathematics', class: '6A', day_of_week: 'Monday', period: 1 },
        { teacher: 'Ahmed Mohamed Hassan', subject: 'Mathematics', class: '6A', day_of_week: 'Tuesday', period: 2 },
        { teacher: 'Amina Ali Omar', subject: 'English', class: '6A', day_of_week: 'Monday', period: 2 },
        { teacher: 'Amina Ali Omar', subject: 'English', class: '6A', day_of_week: 'Wednesday', period: 1 },
        { teacher: 'Hassan Ibrahim Yusuf', subject: 'Science', class: '6A', day_of_week: 'Thursday', period: 3 }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Create Excel template for subjects
 */
export function createSubjectTemplate(): Blob {
    const data = [
        { name: "Mathematics" },
        { name: "English" },
        { name: "Science" },
        { name: "Biology" },
        { name: "Chemistry" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subjects");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/**
 * Create Excel template for exams
 */
export function createExamTemplate(): Blob {
    const data = [
        { subject: "Mathematics", classes: "1A, 2B", date: "2025-05-15", exam_type: "midterm", start_time: "09:00:00", end_time: "11:00:00" },
        { subject: "Science", classes: "3C", date: "2025-05-16", exam_type: "final", start_time: "08:00:00", end_time: "10:00:00" },
        { subject: "English", classes: "4A, 5B, 6C", date: "2025-05-17", exam_type: "midterm", start_time: "10:00:00", end_time: "12:00:00" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Exams");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
