import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { db } = await getDb();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        let query: any = { isActive: true };
        if (userId) {
            query.userId = userId;
        }

        const sessions = await db.collection('admin_sessions')
            .find(query)
            .sort({ lastActivityTime: -1 })
            .toArray();

        return NextResponse.json(sessions || []);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { db } = await getDb();
        const session = await request.json();

        // Set expiration to 2 days from now
        const expiresAt = Date.now() + (2 * 24 * 60 * 60 * 1000);

        const newSession = {
            id: Math.random().toString(36).substr(2, 9),
            ...session,
            loginTime: Date.now(),
            lastActivityTime: Date.now(),
            expiresAt,
            isActive: true
        };

        await db.collection('admin_sessions').insertOne(newSession);
        return NextResponse.json(newSession, { status: 201 });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { db } = await getDb();
        const { id, ...data } = await request.json();

        const result = await db.collection('admin_sessions').updateOne(
            { id },
            { 
                $set: {
                    ...data,
                    lastActivityTime: Date.now()
                }
            }
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { db } = await getDb();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const result = await db.collection('admin_sessions').updateOne(
            { id },
            { $set: { isActive: false, lastActivityTime: Date.now() } }
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}
