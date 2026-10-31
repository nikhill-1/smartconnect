import { Router, Response } from 'express';
import {
  requireAdminAuth,
  requireStudentAuth,
  generateStudentToken,
  isLoginLocked,
  recordLoginFailure,
  clearLoginFailures,
  AuthenticatedRequest,
} from '../services/authService';
import { DatabaseUnavailableError } from '../db/connection';
import { ValidationError } from '../services/circularService';
import {
  authenticateStudent,
  changeStudentPassword,
  getAcademicRecord,
  getStudentById,
  listStudents,
  upsertStudent,
  deleteStudent,
  resetStudentPassword,
  upsertMark,
  deleteMark,
  upsertAttendance,
  deleteAttendance,
  parseSpreadsheetRows,
  importRows,
  buildTemplate,
  isImportType,
  normalizePin,
} from '../services/studentService';
import { spreadsheetMiddleware } from './uploads';

export const studentRouter = Router();
export const adminStudentRouter = Router();

function handleError(res: Response, err: any, fallbackMessage: string): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ success: false, error: err.message });
    return;
  }
  if (err instanceof DatabaseUnavailableError) {
    res.status(503).json({ success: false, error: err.message });
    return;
  }
  console.error('[StudentAPI]', err);
  res.status(500).json({ success: false, error: fallbackMessage });
}

function publicStudent(s: { id: number; pin: string; name: string; department: string; year: number | null; section: string; mustChangePassword: boolean }) {
  return {
    id: s.id,
    pin: s.pin,
    name: s.name,
    department: s.department,
    year: s.year,
    section: s.section,
    mustChangePassword: s.mustChangePassword,
  };
}

studentRouter.post('/login', async (req, res): Promise<void> => {
  try {
    const pin = normalizePin(req.body?.pin);
    const password = String(req.body?.password || '');
    if (!pin || !password) {
      res.status(400).json({ success: false, error: 'PIN and password are required.' });
      return;
    }

    const lockKey = `student:${pin}:${req.ip}`;
    const lockedFor = isLoginLocked(lockKey);
    if (lockedFor > 0) {
      res.status(429).json({ success: false, error: `Too many failed attempts. Try again in ${lockedFor} minute(s).` });
      return;
    }

    const student = await authenticateStudent(pin, password);
    if (!student) {
      recordLoginFailure(lockKey);
      res.status(401).json({ success: false, error: 'Invalid PIN or password.' });
      return;
    }

    clearLoginFailures(lockKey);
    res.json({
      success: true,
      token: generateStudentToken(student),
      student: publicStudent(student),
    });
  } catch (err) {
    handleError(res, err, 'Login failed due to a server error.');
  }
});

studentRouter.get('/me', requireStudentAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const student = await getStudentById(req.student!.studentId);
    if (!student || !student.isActive) {
      res.status(401).json({ success: false, error: 'This account is no longer active.' });
      return;
    }
    res.json({ success: true, student: publicStudent(student) });
  } catch (err) {
    handleError(res, err, 'Failed to load your profile.');
  }
});

studentRouter.post('/change-password', requireStudentAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    await changeStudentPassword(
      req.student!.studentId,
      String(req.body?.currentPassword || ''),
      String(req.body?.newPassword || '')
    );
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    handleError(res, err, 'Failed to change the password.');
  }
});

studentRouter.get('/academics', requireStudentAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const record = await getAcademicRecord(req.student!.studentId);
    if (!record) {
      res.status(404).json({ success: false, error: 'Student record not found.' });
      return;
    }
    res.json({
      success: true,
      student: publicStudent(record.student),
      marks: record.marks,
      attendance: record.attendance,
      overallAttendance: record.overallAttendance,
    });
  } catch (err) {
    handleError(res, err, 'Failed to load your academic record.');
  }
});

adminStudentRouter.use('/students', requireAdminAuth);
adminStudentRouter.use('/import', requireAdminAuth);
adminStudentRouter.use('/templates', requireAdminAuth);
adminStudentRouter.use('/marks', requireAdminAuth);
adminStudentRouter.use('/attendance', requireAdminAuth);

function paging(query: any): { limit: number; offset: number; page: number } {
  const limit = Math.min(Math.max(parseInt(String(query.limit || '25'), 10) || 25, 1), 200);
  const page = Math.max(parseInt(String(query.page || '1'), 10) || 1, 1);
  return { limit, offset: (page - 1) * limit, page };
}

adminStudentRouter.get('/students', async (req, res): Promise<void> => {
  try {
    const { limit, offset, page } = paging(req.query);
    const result = await listStudents({
      search: req.query.search ? String(req.query.search).slice(0, 80) : undefined,
      department: req.query.department ? String(req.query.department) : undefined,
      limit,
      offset,
    });
    res.json({ success: true, page, limit, ...result });
  } catch (err) {
    handleError(res, err, 'Failed to load students.');
  }
});

adminStudentRouter.post('/students', async (req, res): Promise<void> => {
  try {
    const b = req.body || {};
    const student = await upsertStudent({
      pin: String(b.pin || ''),
      name: String(b.name || ''),
      department: b.department,
      year: b.year === undefined || b.year === null || b.year === '' ? null : Number(b.year),
      section: b.section,
      email: b.email,
      phone: b.phone,
      password: b.password ? String(b.password) : undefined,
      isActive: b.isActive === undefined ? true : !!b.isActive,
    });
    res.json({ success: true, student });
  } catch (err) {
    handleError(res, err, 'Failed to save the student.');
  }
});

adminStudentRouter.delete('/students/:id', async (req, res): Promise<void> => {
  try {
    const removed = await deleteStudent(parseInt(String(req.params.id), 10));
    if (!removed) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }
    res.json({ success: true, message: 'Student and all of their records were deleted.' });
  } catch (err) {
    handleError(res, err, 'Failed to delete the student.');
  }
});

adminStudentRouter.post('/students/:id/reset-password', async (req, res): Promise<void> => {
  try {
    const initial = await resetStudentPassword(parseInt(String(req.params.id), 10));
    if (!initial) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }
    res.json({ success: true, message: 'Password reset. The student must sign in with their PIN and change it.' });
  } catch (err) {
    handleError(res, err, 'Failed to reset the password.');
  }
});

adminStudentRouter.get('/students/:id/academics', async (req, res): Promise<void> => {
  try {
    const record = await getAcademicRecord(parseInt(String(req.params.id), 10));
    if (!record) {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }
    res.json({ success: true, ...record });
  } catch (err) {
    handleError(res, err, 'Failed to load the academic record.');
  }
});

adminStudentRouter.put('/students/:id/marks', async (req, res): Promise<void> => {
  try {
    const b = req.body || {};
    await upsertMark(parseInt(String(req.params.id), 10), {
      semester: String(b.semester || ''),
      subject: String(b.subject || ''),
      examType: String(b.examType || 'final'),
      marksObtained: Number(b.marksObtained),
      maxMarks: Number(b.maxMarks),
    });
    res.json({ success: true, message: 'Marks saved.' });
  } catch (err: any) {
    if (err?.code === '23503') {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }
    handleError(res, err, 'Failed to save the marks.');
  }
});

adminStudentRouter.delete('/students/:id/marks/:markId', async (req, res): Promise<void> => {
  try {
    const removed = await deleteMark(parseInt(String(req.params.id), 10), parseInt(String(req.params.markId), 10));
    res.status(removed ? 200 : 404).json({ success: removed, ...(removed ? {} : { error: 'Mark entry not found.' }) });
  } catch (err) {
    handleError(res, err, 'Failed to delete the marks.');
  }
});

adminStudentRouter.put('/students/:id/attendance', async (req, res): Promise<void> => {
  try {
    const b = req.body || {};
    await upsertAttendance(parseInt(String(req.params.id), 10), {
      semester: String(b.semester || ''),
      subject: String(b.subject || ''),
      classesHeld: Number(b.classesHeld),
      classesAttended: Number(b.classesAttended),
    });
    res.json({ success: true, message: 'Attendance saved.' });
  } catch (err: any) {
    if (err?.code === '23503') {
      res.status(404).json({ success: false, error: 'Student not found.' });
      return;
    }
    handleError(res, err, 'Failed to save the attendance.');
  }
});

adminStudentRouter.delete('/students/:id/attendance/:attendanceId', async (req, res): Promise<void> => {
  try {
    const removed = await deleteAttendance(
      parseInt(String(req.params.id), 10),
      parseInt(String(req.params.attendanceId), 10)
    );
    res.status(removed ? 200 : 404).json({ success: removed, ...(removed ? {} : { error: 'Attendance entry not found.' }) });
  } catch (err) {
    handleError(res, err, 'Failed to delete the attendance.');
  }
});

adminStudentRouter.post('/import/:type', spreadsheetMiddleware, async (req, res): Promise<void> => {
  try {
    const type = String(req.params.type);
    if (!isImportType(type)) {
      res.status(400).json({ success: false, error: 'Import type must be students, marks or attendance.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Attach an .xlsx or .csv file in the "file" field.' });
      return;
    }
    const rows = await parseSpreadsheetRows(req.file.buffer, req.file.originalname);
    const result = await importRows(type, rows);
    res.json({
      success: true,
      message: `Import finished: ${result.inserted} added, ${result.updated} updated, ${result.errors.length} row(s) skipped.`,
      ...result,
    });
  } catch (err) {
    handleError(res, err, 'Failed to import the file.');
  }
});

adminStudentRouter.get('/templates/:type', async (req, res): Promise<void> => {
  try {
    const type = String(req.params.type);
    if (!isImportType(type)) {
      res.status(400).json({ success: false, error: 'Template type must be students, marks or attendance.' });
      return;
    }
    const buffer = await buildTemplate(type);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-template.xlsx"`);
    res.send(buffer);
  } catch (err) {
    handleError(res, err, 'Failed to build the template.');
  }
});
