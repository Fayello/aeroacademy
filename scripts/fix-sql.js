const fs = require('fs');
const lines = fs.readFileSync('all-flags.sql', 'utf8').split('\n');
const fixed = lines.map(line => {
  if (!line.startsWith('INSERT')) return line;
  // Find description field - between 3rd and 4th single quote boundaries
  // Pattern: VALUES ('uuid', 'uuid', 'title', 'DESCRIPTION', points, 'hash');
  // We need to escape backslashes only inside the description string
  const match = line.match(/^(INSERT INTO "LabFlag" \(id, "labId", title, description, points, "correctAnswer"\) VALUES \('[^']+', '[^']+', '[^']+', ')(.*)(', \d+, '\$2b\$[^']+'\);)$/);
  if (match) {
    const prefix = match[1];
    let desc = match[2];
    const suffix = match[3];
    // Escape backslashes in description only
    desc = desc.replace(/\\/g, '\\\\');
    return prefix + desc + suffix;
  }
  return line;
});
fs.writeFileSync('all-flags-safe.sql', fixed.join('\n'));
console.log('Fixed', fixed.filter(l => l.startsWith('INSERT')).length, 'lines');
