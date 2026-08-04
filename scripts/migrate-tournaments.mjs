import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let mongodbUrl = process.env.MONGODB_URL;

if (!mongodbUrl && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URL=(.+)/);
    if (match) {
        mongodbUrl = match[1].trim();
    }
}

if (!mongodbUrl) {
    console.error('Error: MONGODB_URL not found in environment or .env.local');
    process.exit(1);
}

const client = new MongoClient(mongodbUrl);

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to MongoDB...');
        
        const db = client.db('s8ul_esports');
        const collection = db.collection('tournaments');

        // 1. Find tournaments missing fields
        const allTournaments = await collection.find({}).toArray();
        console.log(`Found ${allTournaments.length} total tournaments.`);

        const toUpdate = allTournaments.filter(t => 
            !t.category || !t.status || !t.createdAt
        );

        if (toUpdate.length === 0) {
            console.log('No tournaments need updating. All records comply with the new schema.');
            return;
        }

        console.log(`Found ${toUpdate.length} tournaments needing updates.`);

        // 2. Perform Batch Updates
        
        // Update missing categories to 'scrim'
        const categoryResult = await collection.updateMany(
            { category: { $exists: false } },
            { $set: { category: 'scrim' } }
        );
        console.log(`- Updated ${categoryResult.modifiedCount} tournaments with category: 'scrim'`);

        // Update missing status to 'active'
        const statusResult = await collection.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'active' } }
        );
        console.log(`- Updated ${statusResult.modifiedCount} tournaments with status: 'active'`);

        // Update missing createdAt to current time
        const timeResult = await collection.updateMany(
            { createdAt: { $exists: false } },
            { $set: { createdAt: Date.now() } }
        );
        console.log(`- Updated ${timeResult.modifiedCount} tournaments with missing createdAt timestamp`);

        console.log('\nMigration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.close();
    }
}

migrate();
