import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const { db } = await getDb();
        const collection = db.collection('tournaments');
        const tournaments = await collection.find({}).toArray();

        if (tournaments.length === 0) {
            const defaultT = {
                id: 'initial_t',
                name: 'Free Fire World Series 2024',
                active: true,
                status: 'active',
                category: 'scrim',
                createdAt: Date.now()
            };
            await collection.updateOne(
                { id: 'initial_t' },
                { $setOnInsert: defaultT },
                { upsert: true }
            );
            const finalT = await collection.find({}).toArray();
            return NextResponse.json(finalT);
        }

        return NextResponse.json(tournaments);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { db } = await getDb();
        const collection = db.collection('tournaments');
        const tournament = await request.json();
        const category = tournament.category || 'scrim';
        if (tournament.active) {
            await collection.updateMany({}, { $set: { active: false } });
        }
        const result = await collection.insertOne(tournament);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { db } = await getDb();
        const collection = db.collection('tournaments');
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();

        if (body.active === true) {
            await collection.updateMany({ id: { $ne: id } }, { $set: { active: false } });
        }

        const { _id, id: bodyId, ...updateData } = body;
        const result = await collection.updateOne({ id }, { $set: updateData });
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
        await db.collection('tournaments').deleteOne({ id });
        await db.collection('matches').deleteMany({ tournamentId: id });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}
