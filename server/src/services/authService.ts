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
}

// Generate JWT token for admin session
export function generateToken(user: AdminUser): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
}

// Verify credentials (replaces insecure client-side admin.js check)
export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  const expectedUser = config.adminUsername;
  const expectedPass = config.adminPassword;

  if (username !== expectedUser) {
    return null;
  }

  // Check password - supports both direct match during initial configuration and bcrypt hash
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

// Express authentication middleware for protected routes
export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
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
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.',
    });
  }
}

// Audited course PIN mappings for authenticated administrators (protected from public exposure)
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
