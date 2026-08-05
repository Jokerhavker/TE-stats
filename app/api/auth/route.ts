import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  MAX_ATTEMPTS,
  SESSION_DURATION_MS,
  getClientIp,
  getLoginRateLimitStatus,
  recordLoginAttempt,
  safeEqual,
  verifySessionToken,
  getBearerToken,
  type UserRole,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const password = body?.password;
    if (typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: noStore });
    }

    const ip = getClientIp(request);
    const status = await getLoginRateLimitStatus(ip);
    if (status.blocked) {
      return NextResponse.json(
        { error: 'Too many failed attempts', retryAfterSeconds: status.remainingSeconds },
        { status: 429, headers: noStore }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const ledgerPassword = process.env.LEDGER_PASSWORD || '';

    let role: UserRole | null = null;
    if (adminPassword && safeEqual(password, adminPassword)) {
      role = 'admin';
    } else if (ledgerPassword && safeEqual(password, ledgerPassword)) {
      role = 'ledger';
    }

    if (!role) {
      await recordLoginAttempt(ip, false);
      const info = await getLoginRateLimitStatus(ip);
      if (info.blocked) {
        return NextResponse.json(
          { error: 'Too many failed attempts', retryAfterSeconds: info.remainingSeconds },
          { status: 429, headers: noStore }
        );
      }
      const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - info.attempts);
      return NextResponse.json(
        { error: 'Invalid authorization token', attemptsRemaining },
        { status: 401, headers: noStore }
      );
    }

    await recordLoginAttempt(ip, true);

    const { db } = await getDb();
    const now = Date.now();
    const session = {
      id: randomUUID(),
      token: randomUUID(),
      userId: role,
      userRole: role,
      sessionName: role === 'admin' ? 'Admin Session' : 'Ledger Session',
      deviceType: 'N/A',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'N/A',
      loginTime: now,
      lastActivityTime: now,
      expiresAt: now + SESSION_DURATION_MS,
      isActive: true,
    };
    await (db as any).collection('admin_sessions').insertOne(session);

    return NextResponse.json(
      { token: session.token, role: session.userRole, sessionId: session.id },
      { status: 200, headers: noStore }
    );
  } catch (error) {
    console.error('[/api/auth] Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500, headers: noStore });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionToken(getBearerToken(request));
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
    }
    return NextResponse.json({ role: session.userRole }, { headers: noStore });
  } catch (error) {
    console.error('[/api/auth] Validate error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500, headers: noStore });
  }
}
