import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const MAX_ATTEMPTS = 5;
export const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000;
export const SESSION_DURATION_MS = 2 * 24 * 60 * 60 * 1000;

export type UserRole = 'admin' | 'ledger';

export interface AuthSession {
  id: string;
  token: string;
  userRole: UserRole;
  userId: string;
  sessionName: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
  loginTime: number;
  lastActivityTime: number;
  expiresAt: number;
  isActive: boolean;
}

export function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

export function getBearerToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return '';
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  if (!token) {
    return null;
  }
  const { db } = await getDb();
  const session = await (db as any).collection('admin_sessions').findOne({ token, isActive: true });
  if (!session) {
    return null;
  }
  if (session.expiresAt <= Date.now()) {
    return null;
  }
  return session as AuthSession;
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ session: AuthSession } | NextResponse> {
  const session = await verifySessionToken(getBearerToken(request));
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { session };
}

export interface RateLimitStatus {
  attempts: number;
  blocked: boolean;
  remainingSeconds: number;
}

export async function getLoginRateLimitStatus(ip: string): Promise<RateLimitStatus> {
  const { db } = await getDb();
  const attempt = await (db as any).collection('admin_login_attempts').findOne({ ip });
  const now = Date.now();
  if (attempt && attempt.blockedUntil && attempt.blockedUntil > now) {
    return {
      attempts: attempt.attempts || 0,
      blocked: true,
      remainingSeconds: Math.ceil((attempt.blockedUntil - now) / 1000),
    };
  }
  return { attempts: attempt?.attempts || 0, blocked: false, remainingSeconds: 0 };
}

export async function recordLoginAttempt(ip: string, success: boolean): Promise<void> {
  const { db } = await getDb();
  const collection = (db as any).collection('admin_login_attempts');
  const existing = await collection.findOne({ ip });
  const now = Date.now();

  if (success) {
    if (existing) {
      await collection.updateOne({ ip }, { $set: { attempts: 0, lastAttempt: now, blockedUntil: null } });
    }
    return;
  }

  const attempts = (existing?.attempts || 0) + 1;
  const patch: Record<string, unknown> = { attempts, lastAttempt: now };
  if (attempts >= MAX_ATTEMPTS) {
    patch.blockedUntil = now + BLOCK_DURATION_MS;
  }

  if (existing) {
    await collection.updateOne({ ip }, { $set: patch });
  } else {
    await collection.insertOne({ ip, ...patch });
  }
}
