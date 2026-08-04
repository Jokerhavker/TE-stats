require('dotenv').config();
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URL;
(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('s8ul_esports');
  
  const matches = await db.collection('matches').find({}).limit(50).toArray();
  const ids = new Set();
  
  matches.forEach(m => {
    const stats = m.playerStats || m.players || [];
    stats.forEach(ps => {
      ids.add(ps.playerId || ps.id || ps.name || 'UNKNOWN');
    });
  });
  
  console.log('Unique Player IDs/Names found in matches:');
  console.log(Array.from(ids));
  
  await client.close();
})();
