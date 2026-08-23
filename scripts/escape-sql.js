const fs = require('fs');
const sql = fs.readFileSync('all-flags.sql', 'utf8');
const lines = sql.split('\n');
let fixed = 0;
const result = lines.map(line => {
  if (!line.startsWith('INSERT')) return line;
  // Find the description string - it's the 4th field
  // Split by single quotes to find description boundaries
  const parts = line.split("'");
  // parts[0] = INSERT INTO ... VALUES (
  // parts[1] = id uuid
  // parts[2] = , 
  // parts[3] = labId uuid
  // parts[4] = , 
  // parts[5] = title
  // parts[6] = , 
  // parts[7] = description  <-- this is what we need to fix
  // parts[8] = , 
  // parts[9] = points
  // parts[10] = , 
  // parts[11] = hash
  // parts[12] = );
  if (parts.length >= 13) {
    const desc = parts[7];
    if (desc.includes('\\')) {
      parts[7] = desc.replace(/\\/g, '\\\\');
      fixed++;
    }
    return parts.join("'");
  }
  return line;
});
fs.writeFileSync('all-flags-escaped.sql', result.join('\n'));
console.log(`Fixed ${fixed} descriptions with backslashes`);
console.log(`Total INSERT lines: ${result.filter(l => l.startsWith('INSERT')).length}`);
