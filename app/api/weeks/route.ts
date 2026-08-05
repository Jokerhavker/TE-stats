import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { db } = await getDb();
        const collection = db.collection('tournament_weeks');
        const { searchParams } = new URL(request.url);
        const tournamentId = searchParams.get('tournamentId');

        const query = tournamentId ? { tournamentId } : {};
        const weeks = await collection.find(query).toArray();

        return NextResponse.json(weeks);
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
        const collection = db.collection('tournament_weeks');
        const week = await request.json();

        const result = await collection.insertOne(week);
        return NextResponse.json(result, { status: 201 });
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
        await db.collection('tournament_weeks').deleteOne({ id });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}
