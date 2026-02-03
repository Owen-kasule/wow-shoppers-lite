function shouldUseSsl(databaseUrl, databaseSsl) {
  if (databaseSsl === 'true') return true;
  if (databaseSsl === 'false') return false;

  const url = String(databaseUrl || '');
  return url.includes('supabase.com') || url.includes('pooler.supabase.com');
}

function getPgConfig() {
  const connectionString = process.env.DATABASE_URL;
  const databaseSsl = process.env.DATABASE_SSL;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL. Create backend/.env from backend/.env.example');
  }

  const useSsl = shouldUseSsl(connectionString, databaseSsl);

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

module.exports = { getPgConfig };
