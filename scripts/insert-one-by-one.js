const fs = require('fs');
const { execSync } = require('child_process');

const sql = fs.readFileSync('all-flags.sql', 'utf8');
const inserts = sql.split('\n').filter(l => l.startsWith('INSERT'));

let success = 0;
let failed = 0;

for (let i = 0; i < inserts.length; i++) {
  const insert = inserts[i];
  // Pipe each INSERT individually through psql
  const cmd = `echo ${JSON.stringify(insert)} | ssh -o ConnectTimeout=10 -i ~/.ssh/fayelldev_ed25519 fayelldev@169.58.158.83 "cat | sudo docker exec -i aeroacademy-db-1 psql -U user -d aeroacademy" 2>&1`;
  try {
    const out = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
    if (out.includes('INSERT 0 1')) {
      success++;
    } else {
      console.log(`FAIL ${i+1}: ${insert.substring(0, 80)}... → ${out.trim().substring(0, 100)}`);
      failed++;
    }
  } catch (e) {
    console.log(`ERR ${i+1}: ${e.message.substring(0, 100)}`);
    failed++;
  }
  if ((i+1) % 50 === 0) console.log(`Progress: ${i+1}/${inserts.length} (${success} ok, ${failed} failed)`);
}

console.log(`\nDone: ${success} inserted, ${failed} failed out of ${inserts.length}`);
