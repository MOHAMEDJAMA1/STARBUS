import * as XLSX from 'xlsx';

// Add to existing interfaces
export interface ClassSubjectRow {
    class: string;      // e.g., "6-A"
    level: string;      // e.g., "Secondary"
    subject: string;    // e.g., "Biology"
}

// Validation function
export function validateClassSubjectRow(row: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!row.class || typeof row.class !== 'string' || row.class.trim() === '') {
        errors.push('class is required');
    }

    if (!row.level || typeof row.level !== 'string' || row.level.trim() === '') {
        errors.push('level is required (Primary, Secondary, or High School)');
    }

    if (!row.subject || typeof row.subject !== 'string' || row.subject.trim() === '') {
        errors.push('subject is required');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// Template generator
export function createClassSubjectTemplate(): Blob {
    const data = [
        { class: '6A', level: 'Secondary', subjects: 'Biology, Chemistry, Physics, Math' },
        { class: '6B', level: 'Secondary', subjects: 'Biology, Chemistry, Physics, Math' },
        { class: '1A', level: 'Primary', subjects: 'Math, English, Science, Somali' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Class Subjects');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
