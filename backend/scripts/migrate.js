const dotenv = require('dotenv');
const { Client } = require('pg');
const { runSqlFile } = require('./runSqlFile');
const { getPgConfig } = require('../db/pgConfig');

dotenv.config();

async function main() {
  const client = new Client(getPgConfig());
  await client.connect();
  try {
    await runSqlFile(client, 'db/schema.sql');
    // eslint-disable-next-line no-console
    console.log('Migration complete.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', error);
  process.exit(1);
});
