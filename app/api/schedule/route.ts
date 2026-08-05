import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        const { db } = await getDb();
        const schedule = await db.collection('schedule').find({}).sort({ timestamp: 1 }).toArray();
        return NextResponse.json(schedule || []);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;
        const { db } = await getDb();
        const item = await request.json();
        const result = await db.collection('schedule').insertOne(item);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;
        const { db } = await getDb();
        const { id, _id, ...data } = await request.json();
        const result = await db.collection('schedule').updateOne({ id }, { $set: data });
        return NextResponse.json(result);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;
        const { db } = await getDb();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        const result = await db.collection('schedule').deleteOne({ id });
        return NextResponse.json(result);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}
