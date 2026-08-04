import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { db, isMongo } = await getDb();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category'); // 'official' or 'scrim'

        if (!isMongo) {
            return NextResponse.json({ error: 'MongoDB required for aggregate queries' }, { status: 501 });
        }

        const matchQuery: any = {};
        if (category) {
            const tournaments = await db.collection('tournaments').find({ category }).toArray();
            const tournamentIds = tournaments.map((t: any) => t.id || t._id.toString());
            matchQuery.tournamentId = { $in: tournamentIds };
        }

        const pipeline = [
            { $match: matchQuery },
            // Handle both structure types (players and playerStats arrays)
            { $project: { players: { $ifNull: ["$playerStats", "$players"] } } },
            { $unwind: "$players" },
            {
                $group: {
                    // Match the same logic used in the frontend resolvePlayer helper
                    _id: { $toLower: { $trim: { input: { $toString: { $ifNull: ["$players.playerId", { $ifNull: ["$players.id", "$players.name"] }] } } } } },
                    kills: { $sum: { $toInt: { $ifNull: ["$players.kills", 0] } } },
                    played: { $sum: 1 }
                }
            }
        ];

        console.log(`[GET /api/players/stats] Running aggregate pipeline. Category: ${category || 'ALL'}`);
        const stats = await (db.collection('matches') as any).aggregate(pipeline).toArray();
        
        // Format the output into a cleaner key-value dictionary { playerId: { kills, played } }
        const formattedStats: Record<string, { kills: number, played: number }> = {};
        stats.forEach((s: any) => {
            if (s._id) {
                formattedStats[s._id] = {
                    kills: s.kills,
                    played: s.played
                };
            }
        });

        return NextResponse.json(formattedStats, {
            headers: { 'Cache-Control': 'no-store, max-age=0' }
        });
    } catch (error) {
        console.error("[GET /api/players/stats] Error:", error);
        return NextResponse.json({ error: 'Database operations failed', details: String(error) }, { status: 500 });
    }
}
