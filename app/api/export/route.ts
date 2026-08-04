import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const { db, isMongo } = await getDb();

    let exportData: Record<string, any> = {
      exportedAt: new Date().toISOString(),
      isMongo,
      collections: {}
    };

    if (isMongo && 'listCollections' in db) {
      const collections = await db.listCollections().toArray();
      for (const colInfo of collections) {
        const colName = colInfo.name;
        const docs = await db.collection(colName).find({}).toArray();
        exportData.collections[colName] = docs;
      }
    } else {
      // In-memory fallback export
      const collectionNames = ['matches', 'players', 'schedule', 'sessions', 'settings', 'tournaments', 'tournament_weeks'];
      for (const colName of collectionNames) {
        const docs = await db.collection(colName).find({}).toArray();
        exportData.collections[colName] = docs;
      }
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="database_export.json"'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to export database' }, { status: 500 });
  }
}
