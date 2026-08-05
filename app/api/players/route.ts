import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { db } = await getDb();
        const collection = db.collection('players');
        const { searchParams } = new URL(request.url);
        const includeDeleted = searchParams.get('includeDeleted') === 'true';
        const onlyDeleted = searchParams.get('onlyDeleted') === 'true';

        // Handle different query scenarios
        let query: any = {};
        
        if (onlyDeleted) {
            // Only fetch deleted players for recovery management
            query = { deleted: true };
        } else if (!includeDeleted) {
            // Only fetch active players (default behavior)
            query = { deleted: { $ne: true } };
        }

        const players = await collection.find(query).toArray();

        if (players.length === 0 && !includeDeleted && !onlyDeleted) {
            const defaultPlayers = [
                { id: 'pahadi', name: 'PAHADI', role: 'SNIPER', deleted: false, createdAt: Date.now() },
                { id: 'ronith', name: 'RONITH', role: 'IGL', deleted: false, createdAt: Date.now() },
                { id: 'wota', name: 'WOTA', role: 'PRIMARY RUSHER', deleted: false, createdAt: Date.now() },
                { id: 'sohan', name: 'SOHAN', role: 'RUSHER/SUPPORTER', deleted: false, createdAt: Date.now() },
                { id: 'mrjay', name: 'MRJAY', role: 'RUSHER/SUPPORTER', deleted: false, createdAt: Date.now() },
            ];
            await collection.insertMany(defaultPlayers);
            const finalPlayers = await collection.find(query).toArray();
            return NextResponse.json(finalPlayers);
        }

        return NextResponse.json(players);
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
        const collection = db.collection('players');
        const playerData = await request.json();

        // Check if a deleted player with the same name exists
        const existingDeletedPlayer = await collection.findOne({ 
            name: playerData.name, 
            deleted: true 
        });

        if (existingDeletedPlayer) {
            // Restore the old player with their historical data intact
            const result = await collection.updateOne(
                { name: playerData.name, deleted: true },
                { 
                    $set: { 
                        deleted: false, 
                        deletedAt: null,
                        role: playerData.role || existingDeletedPlayer.role,
                        imageUrl: playerData.imageUrl || existingDeletedPlayer.imageUrl,
                        restoredAt: Date.now()
                    }
                }
            );
            return NextResponse.json({ 
                ...result, 
                recovered: true,
                playerId: existingDeletedPlayer.id,
                message: `Player "${playerData.name}" recovered! All previous match stats restored.`
            }, { status: 201 });
        }

        // Create new player
        const newPlayer = {
            ...playerData,
            deleted: false,
            createdAt: Date.now()
        };
        const result = await collection.insertOne(newPlayer);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;
        const { db } = await getDb();
        const collection = db.collection('players');
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();

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
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;
        const { db } = await getDb();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        // Soft delete: mark as deleted instead of removing
        const result = await db.collection('players').updateOne(
            { id },
            { $set: { deleted: true, deletedAt: Date.now() } }
        );
        
        return NextResponse.json({ success: true, softDeleted: true });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}
