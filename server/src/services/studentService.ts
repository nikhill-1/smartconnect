import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import path from 'path';
import { PoolClient } from 'pg';
import { requirePool, withTransaction } from '../db/connection';
import { ValidationError } from './circularService';

export interface StudentRow {
  id: number;
  pin: string;
  name: string;
  department: string;
  year: number | null;
  section: string;
  email: string;
  phone: string;
  mustChangePassword: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface MarkRow {
  id: number;
  semester: string;
  subject: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
}

export interface AttendanceRow {
  id: number;
  semester: string;
  subject: string;
  classesHeld: number;
  classesAttended: number;
  percentage: number;
}

export interface AcademicRecord {
  student: StudentRow;
  marks: MarkRow[];
  attendance: AttendanceRow[];
  overallAttendance: number | null;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  errors: { row: number; message: string }[];
}

export const ATTENDANCE_REQUIREMENT = 75;

export function normalizePin(pin: string): string {
  return String(pin || '').trim().toUpperCase();
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function mapStudent(r: any): StudentRow {
  return {
    id: r.id,
    pin: r.pin,
    name: r.name,
    department: r.department,
    year: r.year,
    section: r.section,
    email: r.email,
    phone: r.phone,
    mustChangePassword: r.must_change_password,
    isActive: r.is_active,
    lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : null,
  };
}

function mapMark(r: any): MarkRow {
  const obtained = Number(r.marks_obtained);
  const max = Number(r.max_marks);
  return {
    id: r.id,
    semester: r.semester,
    subject: r.subject,
    examType: r.exam_type,
    marksObtained: obtained,
    maxMarks: max,
    percentage: max > 0 ? round((obtained / max) * 100) : 0,
  };
}

function mapAttendance(r: any): AttendanceRow {
  const held = Number(r.classes_held);
  const attended = Number(r.classes_attended);
  return {
    id: r.id,
    semester: r.semester,
    subject: r.subject,
    classesHeld: held,
    classesAttended: attended,
    percentage: held > 0 ? round((attended / held) * 100) : 0,
  };
}

export async function authenticateStudent(pin: string, password: string): Promise<StudentRow | null> {
  const res = await requirePool().query('SELECT * FROM students WHERE pin = $1', [normalizePin(pin)]);
  const row = res.rows[0];
  if (!row || !row.is_active) return null;
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  await requirePool().query('UPDATE students SET last_login_at = NOW() WHERE id = $1', [row.id]);
  return mapStudent(row);
}

export async function getStudentById(id: number): Promise<StudentRow | null> {
  const res = await requirePool().query('SELECT * FROM students WHERE id = $1', [id]);
  return res.rows[0] ? mapStudent(res.rows[0]) : null;
}

export async function changeStudentPassword(id: number, current: string, next: string): Promise<void> {
  const res = await requirePool().query('SELECT pin, password_hash FROM students WHERE id = $1', [id]);
  const row = res.rows[0];
  if (!row || !(await bcrypt.compare(current, row.password_hash))) {
    throw new ValidationError('Your current password is incorrect.');
  }
  if (next.length < 8) throw new ValidationError('The new password must be at least 8 characters long.');
  if (next.toUpperCase() === row.pin) throw new ValidationError('The new password cannot be your PIN.');
  if (next === current) throw new ValidationError('The new password must be different from the current one.');
  const hash = await bcrypt.hash(next, 10);
  await requirePool().query('UPDATE students SET password_hash = $2, must_change_password = FALSE WHERE id = $1', [id, hash]);
}

export async function resetStudentPassword(id: number): Promise<string | null> {
  const res = await requirePool().query('SELECT pin FROM students WHERE id = $1', [id]);
  if (!res.rows[0]) return null;
  const initial = res.rows[0].pin as string;
  const hash = await bcrypt.hash(initial, 10);
  await requirePool().query('UPDATE students SET password_hash = $2, must_change_password = TRUE WHERE id = $1', [id, hash]);
  return initial;
}

export interface StudentInput {
  pin: string;
  name: string;
  department?: string;
  year?: number | null;
  section?: string;
  email?: string;
  phone?: string;
  password?: string;
  isActive?: boolean;
}

function validateStudentInput(input: StudentInput): void {
  if (!normalizePin(input.pin)) throw new ValidationError('PIN is required.');
  if (!String(input.name || '').trim()) throw new ValidationError('Name is required.');
  if (input.year !== undefined && input.year !== null && (!Number.isInteger(input.year) || input.year < 1 || input.year > 6)) {
    throw new ValidationError('Year must be a whole number between 1 and 6.');
  }
}

async function upsertStudentWith(client: PoolClient, input: StudentInput): Promise<'inserted' | 'updated'> {
  validateStudentInput(input);
  const pin = normalizePin(input.pin);
  const existing = await client.query('SELECT id FROM students WHERE pin = $1', [pin]);
  if (existing.rows[0]) {
    await client.query(
      `UPDATE students SET name=$2, department=$3, year=$4, section=$5, email=$6, phone=$7, is_active=$8 WHERE id=$1`,
      [
        existing.rows[0].id, input.name.trim(), (input.department || '').trim(), input.year ?? null,
        (input.section || '').trim(), (input.email || '').trim(), (input.phone || '').trim(), input.isActive ?? true,
      ]
    );
    if (input.password) {
      await client.query('UPDATE students SET password_hash=$2, must_change_password=TRUE WHERE id=$1', [
        existing.rows[0].id,
        await bcrypt.hash(input.password, 10),
      ]);
    }
    return 'updated';
  }
  const hash = await bcrypt.hash(input.password || pin, 10);
  await client.query(
    `INSERT INTO students (pin, name, department, year, section, email, phone, password_hash, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      pin, input.name.trim(), (input.department || '').trim(), input.year ?? null, (input.section || '').trim(),
      (input.email || '').trim(), (input.phone || '').trim(), hash, input.isActive ?? true,
    ]
  );
  return 'inserted';
}

export async function upsertStudent(input: StudentInput): Promise<StudentRow> {
  await withTransaction((client) => upsertStudentWith(client, input));
  const res = await requirePool().query('SELECT * FROM students WHERE pin = $1', [normalizePin(input.pin)]);
  return mapStudent(res.rows[0]);
}

export async function deleteStudent(id: number): Promise<boolean> {
  const res = await requirePool().query('DELETE FROM students WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function listStudents(params: {
  search?: string;
  department?: string;
  limit: number;
  offset: number;
}): Promise<{ items: StudentRow[]; total: number }> {
  const where: string[] = [];
  const values: any[] = [];
  if (params.search) {
    values.push(`%${params.search}%`);
    where.push(`(pin ILIKE $${values.length} OR name ILIKE $${values.length})`);
  }
  if (params.department) {
    values.push(params.department);
    where.push(`lower(department) = lower($${values.length})`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = await requirePool().query(`SELECT COUNT(*)::int AS n FROM students ${clause}`, values);
  values.push(params.limit, params.offset);
  const res = await requirePool().query(
    `SELECT * FROM students ${clause} ORDER BY pin LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { items: res.rows.map(mapStudent), total: total.rows[0].n };
}

export async function getAcademicRecord(studentId: number): Promise<AcademicRecord | null> {
  const student = await getStudentById(studentId);
  if (!student) return null;
  const marks = await requirePool().query(
    'SELECT * FROM student_marks WHERE student_id = $1 ORDER BY semester, subject, exam_type',
    [studentId]
  );
  const attendance = await requirePool().query(
    'SELECT * FROM student_attendance WHERE student_id = $1 ORDER BY semester, subject',
    [studentId]
  );
  const attendanceRows = attendance.rows.map(mapAttendance);
  const held = attendanceRows.reduce((sum, a) => sum + a.classesHeld, 0);
  const attended = attendanceRows.reduce((sum, a) => sum + a.classesAttended, 0);
  return {
    student,
    marks: marks.rows.map(mapMark),
    attendance: attendanceRows,
    overallAttendance: held > 0 ? round((attended / held) * 100) : null,
  };
}

export interface MarkInput {
  semester: string;
  subject: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
}

function validateMark(input: MarkInput): void {
  if (!String(input.semester || '').trim() || !String(input.subject || '').trim()) {
    throw new ValidationError('Semester and subject are required.');
  }
  if (!Number.isFinite(input.marksObtained) || !Number.isFinite(input.maxMarks)) {
    throw new ValidationError('Marks must be numbers.');
  }
  if (input.maxMarks <= 0) throw new ValidationError('Maximum marks must be greater than zero.');
  if (input.marksObtained < 0 || input.marksObtained > input.maxMarks) {
    throw new ValidationError('Marks obtained must be between 0 and the maximum marks.');
  }
}

async function upsertMarkWith(client: PoolClient, studentId: number, input: MarkInput): Promise<'inserted' | 'updated'> {
  validateMark(input);
  const res = await client.query(
    `INSERT INTO student_marks (student_id, semester, subject, exam_type, marks_obtained, max_marks)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (student_id, semester, subject, exam_type)
     DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, max_marks = EXCLUDED.max_marks, updated_at = NOW()
     RETURNING (xmax = 0) AS inserted`,
    [
      studentId, input.semester.trim(), input.subject.trim(),
      (input.examType || 'final').trim().toLowerCase(), input.marksObtained, input.maxMarks,
    ]
  );
  return res.rows[0].inserted ? 'inserted' : 'updated';
}

export async function upsertMark(studentId: number, input: MarkInput): Promise<void> {
  await withTransaction((client) => upsertMarkWith(client, studentId, input));
}

export async function deleteMark(studentId: number, markId: number): Promise<boolean> {
  const res = await requirePool().query('DELETE FROM student_marks WHERE id = $1 AND student_id = $2', [markId, studentId]);
  return (res.rowCount ?? 0) > 0;
}

export interface AttendanceInput {
  semester: string;
  subject: string;
  classesHeld: number;
  classesAttended: number;
}

function validateAttendance(input: AttendanceInput): void {
  if (!String(input.semester || '').trim() || !String(input.subject || '').trim()) {
    throw new ValidationError('Semester and subject are required.');
  }
  if (!Number.isInteger(input.classesHeld) || !Number.isInteger(input.classesAttended)) {
    throw new ValidationError('Class counts must be whole numbers.');
  }
  if (input.classesHeld < 0 || input.classesAttended < 0 || input.classesAttended > input.classesHeld) {
    throw new ValidationError('Classes attended must be between 0 and classes held.');
  }
}

async function upsertAttendanceWith(client: PoolClient, studentId: number, input: AttendanceInput): Promise<'inserted' | 'updated'> {
  validateAttendance(input);
  const res = await client.query(
    `INSERT INTO student_attendance (student_id, semester, subject, classes_held, classes_attended)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (student_id, semester, subject)
     DO UPDATE SET classes_held = EXCLUDED.classes_held, classes_attended = EXCLUDED.classes_attended, updated_at = NOW()
     RETURNING (xmax = 0) AS inserted`,
    [studentId, input.semester.trim(), input.subject.trim(), input.classesHeld, input.classesAttended]
  );
  return res.rows[0].inserted ? 'inserted' : 'updated';
}

export async function upsertAttendance(studentId: number, input: AttendanceInput): Promise<void> {
  await withTransaction((client) => upsertAttendanceWith(client, studentId, input));
}

export async function deleteAttendance(studentId: number, attendanceId: number): Promise<boolean> {
  const res = await requirePool().query(
    'DELETE FROM student_attendance WHERE id = $1 AND student_id = $2',
    [attendanceId, studentId]
  );
  return (res.rowCount ?? 0) > 0;
}

export type ImportType = 'students' | 'marks' | 'attendance';

const HEADER_ALIASES: Record<string, string> = {
  pin: 'pin', pinno: 'pin', pinnumber: 'pin', rollno: 'pin', rollnumber: 'pin', htno: 'pin', hallticketno: 'pin',
  name: 'name', studentname: 'name',
  department: 'department', dept: 'department', branch: 'department',
  year: 'year', section: 'section', sec: 'section',
  email: 'email', mail: 'email', phone: 'phone', mobile: 'phone', password: 'password',
  semester: 'semester', sem: 'semester',
  subject: 'subject', subjectname: 'subject', course: 'subject',
  examtype: 'examtype', exam: 'examtype', type: 'examtype',
  marksobtained: 'marksobtained', obtained: 'marksobtained', marks: 'marksobtained', score: 'marksobtained',
  maxmarks: 'maxmarks', max: 'maxmarks', totalmarks: 'maxmarks', total: 'maxmarks', outof: 'maxmarks',
  classesheld: 'classesheld', held: 'classesheld', totalclasses: 'classesheld',
  classesattended: 'classesattended', attended: 'classesattended',
};

function cellValueToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    const v = value as any;
    if (v.result !== undefined) return cellValueToString(v.result);
    if (v.text !== undefined) return String(v.text).trim();
    if (Array.isArray(v.richText)) return v.richText.map((r: any) => r.text).join('').trim();
    return '';
  }
  return String(value).trim();
}

export async function parseSpreadsheetRows(buffer: Buffer, filename: string): Promise<Record<string, string>[]> {
  const ext = path.extname(filename).toLowerCase();
  const workbook = new ExcelJS.Workbook();
  if (ext === '.csv') {
    await workbook.csv.read(Readable.from(buffer));
  } else if (ext === '.xlsx') {
    await workbook.xlsx.load(buffer as any);
  } else {
    throw new ValidationError('Upload an .xlsx or .csv file.');
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ValidationError('The file has no worksheet.');

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    const key = cellValueToString(cell.value).toLowerCase().replace(/[^a-z]/g, '');
    headers[col] = HEADER_ALIASES[key] || key;
  });

  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = { __row: String(rowNumber) };
    let hasData = false;
    headers.forEach((header, col) => {
      if (!header) return;
      const text = cellValueToString(row.getCell(col).value);
      if (text) hasData = true;
      record[header] = text;
    });
    if (hasData) rows.push(record);
  });
  return rows;
}

function requireColumns(rows: Record<string, string>[], columns: string[]): void {
  if (rows.length === 0) throw new ValidationError('The file has no data rows.');
  const missing = columns.filter((c) => !(c in rows[0]));
  if (missing.length > 0) {
    throw new ValidationError(`Missing column(s): ${missing.join(', ')}. Download the template to see the expected headers.`);
  }
}

export async function importRows(type: ImportType, rows: Record<string, string>[]): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, errors: [] };

  if (type === 'students') requireColumns(rows, ['pin', 'name']);
  if (type === 'marks') requireColumns(rows, ['pin', 'semester', 'subject', 'marksobtained', 'maxmarks']);
  if (type === 'attendance') requireColumns(rows, ['pin', 'semester', 'subject', 'classesheld', 'classesattended']);

  await withTransaction(async (client) => {
    const pinToId = new Map<string, number>();
    if (type !== 'students') {
      const all = await client.query('SELECT id, pin FROM students');
      all.rows.forEach((r: any) => pinToId.set(r.pin, r.id));
    }

    for (const row of rows) {
      const rowNumber = Number(row.__row);
      await client.query('SAVEPOINT row_import');
      try {
        let outcome: 'inserted' | 'updated';
        if (type === 'students') {
          const yearText = row.year ? Number(row.year) : null;
          outcome = await upsertStudentWith(client, {
            pin: row.pin,
            name: row.name,
            department: row.department,
            year: yearText !== null && Number.isFinite(yearText) ? yearText : null,
            section: row.section,
            email: row.email,
            phone: row.phone,
            password: row.password || undefined,
          });
        } else {
          const studentId = pinToId.get(normalizePin(row.pin));
          if (!studentId) throw new ValidationError(`No student found with PIN ${row.pin}. Import students first.`);
          if (type === 'marks') {
            outcome = await upsertMarkWith(client, studentId, {
              semester: row.semester,
              subject: row.subject,
              examType: row.examtype || 'final',
              marksObtained: Number(row.marksobtained),
              maxMarks: Number(row.maxmarks),
            });
          } else {
            outcome = await upsertAttendanceWith(client, studentId, {
              semester: row.semester,
              subject: row.subject,
              classesHeld: Number(row.classesheld),
              classesAttended: Number(row.classesattended),
            });
          }
        }
        await client.query('RELEASE SAVEPOINT row_import');
        result[outcome] += 1;
      } catch (err: any) {
        await client.query('ROLLBACK TO SAVEPOINT row_import');
        result.errors.push({ row: rowNumber, message: err.message });
      }
    }
  });
  return result;
}

const TEMPLATES: Record<ImportType, { headers: string[]; sample: (string | number)[] }> = {
  students: {
    headers: ['PIN', 'Name', 'Department', 'Year', 'Section', 'Email', 'Phone', 'Password'],
    sample: ['22124-CS-160', 'Student Name', 'CSE', 2, 'A', 'student@example.com', '9000000000', ''],
  },
  marks: {
    headers: ['PIN', 'Semester', 'Subject', 'ExamType', 'MarksObtained', 'MaxMarks'],
    sample: ['22124-CS-160', '3', 'Data Structures', 'mid1', 24, 30],
  },
  attendance: {
    headers: ['PIN', 'Semester', 'Subject', 'ClassesHeld', 'ClassesAttended'],
    sample: ['22124-CS-160', '3', 'Data Structures', 40, 34],
  },
};

export async function buildTemplate(type: ImportType): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(type);
  sheet.addRow(TEMPLATES[type].headers).font = { bold: true };
  sheet.addRow(TEMPLATES[type].sample);
  sheet.columns.forEach((column) => {
    column.width = 20;
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function isImportType(value: string): value is ImportType {
  return value === 'students' || value === 'marks' || value === 'attendance';
}
