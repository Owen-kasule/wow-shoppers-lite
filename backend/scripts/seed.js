const dotenv = require('dotenv');
const { Client } = require('pg');
const { runSqlFile } = require('./runSqlFile');
const dns = require('dns');

dotenv.config();

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

function getClientConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL. Create backend/.env from backend/.env.example');
  }

  const databaseSsl = process.env.DATABASE_SSL;
  const useSsl =
    databaseSsl === 'true' ||
    connectionString.includes('supabase.co') ||
    connectionString.includes('pooler.supabase.com');

  return {
    connectionString,
    ...(useSsl
      ? {
          ssl: {
            rejectUnauthorized: false
          }
        }
      : {})
  };
}

async function main() {
  const client = new Client(getClientConfig());
  await client.connect();
  try {
    await runSqlFile(client, 'db/seed.sql');
    // eslint-disable-next-line no-console
    console.log('Seed complete.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  process.exit(1);
});
