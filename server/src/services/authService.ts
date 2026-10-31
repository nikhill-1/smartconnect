import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface AdminUser {
  id: string;
  username: string;
  role: string;
}

export interface AuthTokenPayload {
  userId: string;
  username: string;
  role: string;
  studentId?: number;
  pin?: string;
}

export interface StudentSession {
  studentId: number;
  pin: string;
  name: string;
}

export function generateToken(user: AdminUser): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.adminSessionExpiresIn as jwt.SignOptions['expiresIn'] }
  );
}

export function generateStudentToken(student: { id: number; pin: string; name: string }): string {
  return jwt.sign(
    {
      userId: `student-${student.id}`,
      username: student.name,
      role: 'student',
      studentId: student.id,
      pin: student.pin,
    },
    config.jwtSecret,
    { expiresIn: config.studentSessionExpiresIn as jwt.SignOptions['expiresIn'] }
  );
}

export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  const expectedUser = config.adminUsername;
  const expectedPass = config.adminPassword;

  if (username !== expectedUser) {
    return null;
  }

  const isMatch = password === expectedPass || (await bcrypt.compare(password, expectedPass).catch(() => false));
  if (!isMatch) {
    return null;
  }

  return {
    id: 'admin-1',
    username,
    role: 'administrator',
  };
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
  student?: StudentSession;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in with admin credentials.',
    });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    if (decoded.role !== 'administrator') {
      res.status(403).json({
        success: false,
        error: 'Administrator access is required.',
      });
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.',
    });
  }
}

export const AUDITED_COURSE_PIN_REGISTRY: Record<string, { pin: string; courseName: string; spreadsheetUrl: string }> = {
  '22124-cs-160': {
    pin: '22124-cs-160',
    courseName: 'CSE Department Course Section 160',
    spreadsheetUrl: 'https://1drv.ms/x/c/76bcd8d7c93fffca/EZYfYGroehBMkWoaTR_CI_cB-wa3vVWMWuvpyDuD9Axz4g?e=60oE8S',
  },
  '22124-cs-131': {
    pin: '22124-cs-131',
    courseName: 'CSE Department Course Section 131',
    spreadsheetUrl: 'https://1drv.ms/x/c/76bcd8d7c93fffca/EQOAz3rgzW1AmQPU2VFbHK4BCqzqWxmBlrGVl23wV76MSg?e=D2XjsW',
  },
  '22124-cs-134': {
    pin: '22124-cs-134',
    courseName: 'CSE Department Course Section 134',
    spreadsheetUrl: 'https://1drv.ms/x/c/76bcd8d7c93fffca/EUx27YM8zo5EmQP2bEeQLU8Bz60FWiLpsFgNE8gVI_GlPg?e=ecAy5n',
  },
  '22124-cs-179': {
    pin: '22124-cs-179',
    courseName: 'CSE Department Course Section 179',
    spreadsheetUrl: 'https://1drv.ms/x/c/76bcd8d7c93fffca/EVbOmXoAPWZPlvKRvvth8aMBPyANks0ETncA2y64m0Hr9g?e=0nqzDY',
  },
};


function decodeStudentToken(header: string | undefined): StudentSession | null {
  if (!header || !header.startsWith('Bearer ')) return null;
  const decoded = jwt.verify(header.substring(7), config.jwtSecret) as AuthTokenPayload;
  if (decoded.role !== 'student' || !decoded.studentId || !decoded.pin) return null;
  return { studentId: decoded.studentId, pin: decoded.pin, name: decoded.username };
}

export function requireStudentAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const session = decodeStudentToken(req.headers.authorization);
    if (!session) {
      res.status(401).json({ success: false, error: 'Student login required.' });
      return;
    }
    req.student = session;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Your session has expired. Please log in again.' });
  }
}

export function readOptionalStudentSession(header: string | undefined): { session: StudentSession | null; expired: boolean } {
  if (!header) return { session: null, expired: false };
  try {
    return { session: decodeStudentToken(header), expired: false };
  } catch {
    return { session: null, expired: true };
  }
}

const failedLogins = new Map<string, { count: number; lockedUntil: number }>();

export function isLoginLocked(key: string): number {
  const entry = failedLogins.get(key);
  if (!entry) return 0;
  if (entry.lockedUntil > Date.now()) {
    return Math.ceil((entry.lockedUntil - Date.now()) / 60000);
  }
  if (entry.lockedUntil !== 0) {
    failedLogins.delete(key);
  }
  return 0;
}

export function recordLoginFailure(key: string): void {
  const entry = failedLogins.get(key) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= config.loginMaxAttempts) {
    entry.lockedUntil = Date.now() + config.loginLockMinutes * 60000;
    entry.count = 0;
  }
  failedLogins.set(key, entry);
}

export function clearLoginFailures(key: string): void {
  failedLogins.delete(key);
}
