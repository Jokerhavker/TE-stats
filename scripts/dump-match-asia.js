require('dotenv').config();
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URL;
(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('s8ul_esports');
  
  const tournament = await db.collection('tournaments').findOne({ name: /ASIA CHAMPIONSHIP/i });
  console.log('Tournament ID:', tournament?._id.toString());
  
  if (tournament) {
    const match = await db.collection('matches').findOne({ tournamentId: tournament._id.toString() });
    console.log(JSON.stringify(match, null, 2));
  }
  
  await client.close();
})();
