const dotenv = require('dotenv');
const { Client } = require('pg');
const dns = require('dns');

dotenv.config();

if (typeof dns.setDefaultResultOrder === 'function') {
  // Prefer IPv4 to avoid networks that refuse IPv6 to Supabase
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
    const result = await client.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('categories', 'products')
      ORDER BY table_name ASC;
      `
    );

    const found = new Set(result.rows.map((r) => r.table_name));
    const ok = found.has('categories') && found.has('products');

    if (!ok) {
      // eslint-disable-next-line no-console
      console.error('DB check failed. Missing tables:', {
        categories: found.has('categories'),
        products: found.has('products')
      });
      process.exitCode = 1;
      return;
    }

    // eslint-disable-next-line no-console
    console.log('DB check OK: migration appears applied (categories, products found).');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('DB check error:', error);
  process.exit(1);
});
