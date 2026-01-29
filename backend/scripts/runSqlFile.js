const fs = require('fs');
const path = require('path');

async function runSqlFile(client, relativePath) {
  const filePath = path.join(__dirname, '..', relativePath);
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query(sql);
}

module.exports = { runSqlFile };
