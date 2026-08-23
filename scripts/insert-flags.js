const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

function normalize(a) { return a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(); }
function h(a) { return bcrypt.hashSync(normalize(a), 10); }

const client = new Client({
  host: '169.58.158.83',
  port: 5432,
  database: 'aeroacademy',
  user: 'user',
  password: 'password',
  ssl: false,
});

const LABS = {
  'Ubuntu CLI': '322a1e1c-b550-4cdb-b3f2-b7d59f9f503a',
  'Permissions': 'def2c670-6ec3-4a82-8df9-e1b74237df6e',
  'Text Processing': 'e5b52cdf-1435-4b77-896a-41a270c88021',
  'Process': '989bd7ac-13fd-4e6f-b502-3ff3b334c350',
  'Docker': '8f5af76d-8355-42dd-bbd2-37a10a896dc1',
  'Nginx': '50d6a493-7898-473d-8287-137229593da9',
  'MySQL': '11dc0358-43a4-4f7c-b6eb-e12274be5ff9',
  'PostgreSQL': '88de7b45-d1c8-4d13-97df-66805199f591',
  'Storage': 'd4eb2f04-7abb-485c-94ae-d6aa46e99935',
  'Backup': 'eb5f9027-80b5-4611-a37d-b3223cf314d2',
  'Network': '884ee166-21d8-4336-a519-6ccdf111068c',
  'DNS': 'e0decd06-4a2e-4f94-965a-79854928514d',
  'Git': 'db2d2817-5c84-4d6e-b1a7-2e1051fee251',
  'Ansible': 'ea46a43d-c6a5-40e9-93bb-e7f40f2a8572',
  'Monitoring': '91168c5d-2af5-4998-b0aa-5480fa2b43da',
  'Logging': '4a07684f-30df-4ece-b9bc-57a2727769d4',
  'K8s': '19796c88-1a0a-4c0c-ba7d-4422edecb4fe',
  'CentOS': '39444481-c0f1-4af3-9ac9-7223c18963a7',
  'Debian': 'f6d4f425-9d67-4506-ae35-c713d671e033',
  'Kernel': '8cb79cf7-a12b-4e99-a050-9f067f2b604d',
};

async function insertFlags(flags) {
  let inserted = 0;
  for (const f of flags) {
    try {
      await client.query(
        `INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), f.labId, f.title, f.desc, f.points, h(f.answer)]
      );
      inserted++;
    } catch (e) {
      if (e.code !== '23505') console.error(`Error: ${f.title}: ${e.message}`);
    }
  }
  return inserted;
}

async function main() {
  await client.connect();
  console.log('Connected to DB');

  // Clear existing flags
  await client.query('DELETE FROM "LabSubmission"');
  await client.query('DELETE FROM "LabFlag"');
  console.log('Cleared existing flags');

  const allFlags = [];

  // Import all flag definitions from gen scripts by requiring them
  // But since they output SQL, we need to parse or just define inline

  // Actually, let's just read the SQL file and parse INSERT statements
  const fs = require('fs');
  const sql = fs.readFileSync('all-flags.sql', 'utf8');
  const inserts = sql.split('\n').filter(l => l.startsWith('INSERT'));

  for (const insert of inserts) {
    // Parse: INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('uuid', 'labId', 'title', 'desc', points, 'hash');
    const match = insert.match(/VALUES \('([^']+)', '([^']+)', '([^']+)', '(.+)', (\d+), '(\$2b\$[^']+)'\)/);
    if (match) {
      try {
        await client.query(
          `INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ($1, $2, $3, $4, $5, $6)`,
          [match[1], match[2], match[3], match[4], parseInt(match[5]), match[6]]
        );
      } catch (e) {
        if (e.code === '23505') {} // duplicate, skip
        else console.error(`Error on ${match[3]}: ${e.message}`);
      }
    }
  }

  const result = await client.query('SELECT COUNT(*) FROM "LabFlag"');
  console.log(`Total flags: ${result.rows[0].count}`);

  await client.end();
}

main().catch(console.error);
