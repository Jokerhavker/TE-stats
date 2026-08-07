import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
let mongodbUrl = process.env.MONGODB_URL;

if (!mongodbUrl && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URL=(.+)/);
    if (match) {
        mongodbUrl = match[1].trim().replace(/^"(.*)"$/, '$1');
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
        const collection = db.collection('matches');

        const alpineMatcher = { $in: [/^alpine$/i] };

        const mapNameResult = await collection.updateMany(
            { mapName: alpineMatcher },
            { $set: { mapName: 'SOLARA' } }
        );
        console.log(`- Updated ${mapNameResult.modifiedCount} matches with mapName ALPINE -> SOLARA`);

        const mapResult = await collection.updateMany(
            { map: alpineMatcher },
            { $set: { map: 'SOLARA' } }
        );
        console.log(`- Updated ${mapResult.modifiedCount} matches with map ALPINE -> SOLARA`);

        const remaining = await collection.countDocuments({
            $or: [{ mapName: alpineMatcher }, { map: alpineMatcher }]
        });
        console.log(`- Remaining ALPINE matches: ${remaining}`);

        console.log('\nMigration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.close();
    }
}

migrate();
