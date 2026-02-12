const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const dotenv = require('dotenv');

dotenv.config();

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

const databaseSsl = process.env.DATABASE_SSL;
const useSsl =
  databaseSsl === 'true' ||
  DATABASE_URL.includes('supabase.co') ||
  DATABASE_URL.includes('pooler.supabase.com');

const clientConfig = {
  connectionString: DATABASE_URL,
  ...(useSsl
    ? {
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {})
};

async function runMigration() {
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected to database');

    const sqlFile = path.join(__dirname, '..', 'db', 'add_updated_at.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    await client.query(sql);
    console.log('✓ Migration successful: added updated_at column and trigger to orders table');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
