import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URL || "";
let cachedClient: MongoClient | null = null;
let isMongoAvailable: boolean | null = null;

// In-Memory Storage Fallback when MongoDB is not connected
const inMemoryDb: Record<string, any[]> = {
  matches: [],
  players: [
    { id: 'pahadi', name: 'PAHADI', role: 'SNIPER', deleted: false, createdAt: Date.now() },
    { id: 'ronith', name: 'RONITH', role: 'IGL', deleted: false, createdAt: Date.now() },
    { id: 'wota', name: 'WOTA', role: 'PRIMARY RUSHER', deleted: false, createdAt: Date.now() },
    { id: 'sohan', name: 'SOHAN', role: 'RUSHER/SUPPORTER', deleted: false, createdAt: Date.now() },
    { id: 'mrjay', name: 'MRJAY', role: 'RUSHER/SUPPORTER', deleted: false, createdAt: Date.now() },
  ],
  schedule: [],
  sessions: [],
  settings: [
    { id: 'system', mode: 'normal', updatedAt: Date.now() }
  ],
  tournaments: [
    {
      id: 'initial_t',
      name: 'Free Fire World Series 2024',
      active: true,
      status: 'active',
      category: 'scrim',
      createdAt: Date.now()
    }
  ],
  tournament_weeks: []
};

class InMemoryCollection {
  name: string;

  constructor(name: string) {
    this.name = name;
    if (!inMemoryDb[this.name]) {
      inMemoryDb[this.name] = [];
    }
  }

  private get items() {
    return inMemoryDb[this.name];
  }

  find(query: Record<string, any> = {}) {
    let result = [...this.items];

    // Filter logic
    if (Object.keys(query).length > 0) {
      result = result.filter(item => {
        return Object.entries(query).every(([key, val]) => {
          if (val && typeof val === 'object') {
            if ('$ne' in val) return item[key] !== val.$ne;
            if ('$in' in val) return Array.isArray(val.$in) && val.$in.includes(item[key]);
          }
          return item[key] === val;
        });
      });
    }

    return {
      sort: (sortObj: Record<string, number>) => {
        const [sortKey, dir] = Object.entries(sortObj)[0] || [];
        if (sortKey) {
          result.sort((a, b) => {
            if (a[sortKey] < b[sortKey]) return dir === 1 ? -1 : 1;
            if (a[sortKey] > b[sortKey]) return dir === 1 ? 1 : -1;
            return 0;
          });
        }
        return {
          toArray: async () => [...result]
        };
      },
      toArray: async () => [...result]
    };
  }

  async findOne(query: Record<string, any>) {
    const list = await this.find(query).toArray();
    return list[0] || null;
  }

  async insertOne(doc: any) {
    const newDoc = { _id: String(Date.now() + Math.random()), ...doc };
    this.items.push(newDoc);
    return { acknowledged: true, insertedId: newDoc._id };
  }

  async insertMany(docs: any[]) {
    const inserted = docs.map(d => ({ _id: String(Date.now() + Math.random()), ...d }));
    this.items.push(...inserted);
    return { acknowledged: true, insertedCount: inserted.length };
  }

  async updateOne(filter: Record<string, any>, update: Record<string, any>, options: { upsert?: boolean } = {}) {
    let item = await this.findOne(filter);

    if (!item) {
      if (options.upsert) {
        const newDoc = { ...filter };
        if (update.$set) Object.assign(newDoc, update.$set);
        if (update.$setOnInsert) Object.assign(newDoc, update.$setOnInsert);
        this.items.push(newDoc);
        return { acknowledged: true, upsertedCount: 1 };
      }
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    }

    if (update.$set) {
      Object.assign(item, update.$set);
    }

    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(filter: Record<string, any>, update: Record<string, any>) {
    const list = await this.find(filter).toArray();
    let modified = 0;
    list.forEach(item => {
      if (update.$set) {
        Object.assign(item, update.$set);
        modified++;
      }
    });
    return { acknowledged: true, modifiedCount: modified };
  }

  async deleteOne(filter: Record<string, any>) {
    const index = this.items.findIndex(item => {
      return Object.entries(filter).every(([k, v]) => item[k] === v);
    });
    if (index !== -1) {
      this.items.splice(index, 1);
      return { acknowledged: true, deletedCount: 1 };
    }
    return { acknowledged: true, deletedCount: 0 };
  }

  async deleteMany(filter: Record<string, any>) {
    let deletedCount = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const matches = Object.entries(filter).every(([k, v]) => item[k] === v);
      if (matches) {
        this.items.splice(i, 1);
        deletedCount++;
      }
    }
    return { acknowledged: true, deletedCount };
  }
}

class InMemoryDb {
  collection(name: string) {
    return new InMemoryCollection(name);
  }
}

export async function getDb(): Promise<{ db: Db | InMemoryDb; isMongo: boolean }> {
  if (!uri) {
    return { db: new InMemoryDb() as any, isMongo: false };
  }

  try {
    if (cachedClient) {
      try {
        await cachedClient.db('admin').command({ ping: 1 });
        return { db: cachedClient.db('s8ul_esports'), isMongo: true };
      } catch (pingErr) {
        console.warn("Cached MongoDB client dropped connection, attempting reconnection...");
        cachedClient = null;
      }
    }

    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10
    });
    await client.connect();
    cachedClient = client;
    isMongoAvailable = true;
    return { db: cachedClient.db('s8ul_esports'), isMongo: true };
  } catch (err) {
    console.warn("MongoDB connection failed, falling back to in-memory database:", err);
    // Do not lock isMongoAvailable to false permanently so subsequent calls can retry connection
    return { db: new InMemoryDb() as any, isMongo: false };
  }
}
