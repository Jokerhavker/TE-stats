import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { db, isMongo } = await getDb();
        console.log(`[GET /api/matches] Database connection status - isMongo: ${isMongo}`);

        const matches = await db.collection('matches').find({}).sort({ timestamp: -1 }).toArray();
        console.log(`[GET /api/matches] Retrieved ${matches?.length || 0} match documents from ${isMongo ? 'MongoDB' : 'In-Memory DB'}`);

        if (!matches || matches.length === 0) {
            console.warn('[GET /api/matches] Warning: Database returned empty matches array or no records found.');
            return NextResponse.json([], {
                headers: { 'Cache-Control': 'no-store, max-age=0' }
            });
        }

        // Clean MongoDB _id fields and inspect kill data
        let totalKillsLogged = 0;
        const cleanMatches = matches.map(({ _id, ...m }: any) => {
            const stats = m.playerStats || m.players || [];
            const matchKills = stats.reduce((acc: number, p: any) => acc + (Number(p.kills) || 0), 0);
            totalKillsLogged += matchKills;
            return {
                ...m,
                playerStats: stats
            };
        });

        console.log(`[GET /api/matches] Successfully parsed ${cleanMatches.length} matches with total ${totalKillsLogged} eliminations.`);

        return NextResponse.json(cleanMatches, {
            headers: { 'Cache-Control': 'no-store, max-age=0' }
        });
    } catch (error) {
        console.error("[GET /api/matches] Critical error querying matches database:", error);
        return NextResponse.json({ error: 'Database operations failed', details: String(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;
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
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;
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
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;
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

