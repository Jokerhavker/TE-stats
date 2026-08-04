import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const { db } = await getDb();
        const collection = db.collection('settings');
        const settings = await collection.findOne({ id: 'system' });

        if (!settings) {
            const defaultSettings = {
                id: 'system',
                mode: 'normal',
                updatedAt: Date.now()
            };
            await collection.updateOne(
                { id: 'system' },
                { $setOnInsert: defaultSettings },
                { upsert: true }
            );
            return NextResponse.json(defaultSettings);
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { db } = await getDb();
        const collection = db.collection('settings');
        const body = await request.json();

        const { _id, id: bodyId, ...updateData } = body;
        const result = await collection.updateOne(
            { id: 'system' },
            { $set: { ...updateData, updatedAt: Date.now() } },
            { upsert: true }
        );
        return NextResponse.json(result);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Database operations failed' }, { status: 500 });
    }
}
