import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { db, isMongo } = await getDb();
        const { searchParams } = new URL(request.url);
        const tournamentId = searchParams.get('tournamentId');
        const all = searchParams.get('all') === 'true';

        // Build query filter - if tournamentId is provided, only fetch that tournament's matches
        const query: any = {};
        if (tournamentId && !all) {
            query.tournamentId = tournamentId;
        }

        console.log(`[GET /api/matches] Fetching matches${tournamentId ? ` for tournament ${tournamentId}` : ' (all)'} - isMongo: ${isMongo}`);

        const matches = await db.collection('matches').find(query).sort({ timestamp: -1 }).toArray();
        console.log(`[GET /api/matches] Retrieved ${matches?.length || 0} match documents`);

        if (!matches || matches.length === 0) {
            return NextResponse.json([], {
                headers: { 'Cache-Control': 'no-store, max-age=0' }
            });
        }

        const cleanMatches = matches.map(({ _id, ...m }: any) => ({
            ...m,
            playerStats: m.playerStats || m.players || []
        }));

        return NextResponse.json(cleanMatches, {
            headers: { 'Cache-Control': 'no-store, max-age=0' }
        });
    } catch (error) {
        console.error("[GET /api/matches] Error:", error);
        return NextResponse.json({ error: 'Database operations failed', details: String(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { db, isMongo } = await getDb();
        const match = await request.json();
        
        if (!match || !match.id) {
            console.error('[POST /api/matches] Invalid match payload submitted:', match);
            return NextResponse.json({ error: 'Invalid match payload. Missing id.' }, { status: 400 });
        }

        const { _id, ...cleanMatch } = match;
        console.log(`[POST /api/matches] Upserting match ID: ${cleanMatch.id} (Tournament: ${cleanMatch.tournamentId}) to ${isMongo ? 'MongoDB' : 'In-Memory DB'}`);

        const result = await db.collection('matches').updateOne(
            { id: cleanMatch.id },
            { $set: cleanMatch },
            { upsert: true }
        );

        console.log(`[POST /api/matches] Successfully saved match ID ${cleanMatch.id}`);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("[POST /api/matches] Error saving match to database:", error);
        return NextResponse.json({ error: 'Database operations failed', details: String(error) }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { db, isMongo } = await getDb();
        const match = await request.json();

        if (!match || !match.id) {
            console.error('[PUT /api/matches] Invalid match payload submitted:', match);
            return NextResponse.json({ error: 'Invalid match payload. Missing id.' }, { status: 400 });
        }

        const { id, _id, ...data } = match;
        console.log(`[PUT /api/matches] Updating match ID: ${id} in ${isMongo ? 'MongoDB' : 'In-Memory DB'}`);

        const result = await db.collection('matches').updateOne({ id }, { $set: data }, { upsert: true });
        return NextResponse.json(result);
    } catch (error) {
        console.error("[PUT /api/matches] Error updating match in database:", error);
        return NextResponse.json({ error: 'Database operations failed', details: String(error) }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { db, isMongo } = await getDb();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            console.error('[DELETE /api/matches] Missing ID parameter');
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        console.log(`[DELETE /api/matches] Deleting match ID: ${id} from ${isMongo ? 'MongoDB' : 'In-Memory DB'}`);
        const result = await db.collection('matches').deleteOne({ id });
        return NextResponse.json(result);
    } catch (error) {
        console.error("[DELETE /api/matches] Error deleting match from database:", error);
        return NextResponse.json({ error: 'Database operations failed', details: String(error) }, { status: 500 });
    }
}

