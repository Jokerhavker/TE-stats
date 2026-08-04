import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGODB_URL || "";

async function exportDatabase() {
  if (!uri) {
    console.error("MONGODB_URL is not set in environment variables.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });

  try {
    await client.connect();
    console.log("Connected successfully.");

    const dbName = 's8ul_esports';
    const db = client.db(dbName);

    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collection(s): ${collections.map(c => c.name).join(', ') || 'None'}`);

    const exportData = {
      exportedAt: new Date().toISOString(),
      database: dbName,
      totalCollections: collections.length,
      collections: {}
    };

    let totalDocs = 0;
    for (const colInfo of collections) {
      const colName = colInfo.name;
      const docs = await db.collection(colName).find({}).toArray();
      exportData.collections[colName] = docs;
      totalDocs += docs.length;
      console.log(`- ${colName}: ${docs.length} document(s)`);
    }

    const exportFileName = `database_export_${Date.now()}.json`;
    const outputPath = path.join(process.cwd(), exportFileName);
    const latestPath = path.join(process.cwd(), 'database_export.json');

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
    fs.writeFileSync(latestPath, JSON.stringify(exportData, null, 2), 'utf-8');

    console.log(`\nExport complete!`);
    console.log(`Total documents exported: ${totalDocs}`);
    console.log(`Saved to:\n  - ${outputPath}\n  - ${latestPath}`);
  } catch (error) {
    console.error("Error during database export:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

exportDatabase();
