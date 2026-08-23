const crypto = require('crypto');
const bcrypt = require('bcrypt');

const labId = '88de7b45-d1c8-4d13-97df-66805199f591';

const flags = [
  {
    title: 'Schema Inspector',
    description: 'Run: psql shopdb -c SELECT table_name FROM information_schema.tables WHERE table_schema = public. How many tables are listed?',
    points: 75,
    answer: '4'
  },
  {
    title: 'Permission Auditor',
    description: 'Run: psql shopdb -c SELECT has_table_privilege. Syntax: psql shopdb -c SELECT has_table_privilege. What does the function return for a valid user with SELECT on products table?',
    points: 75,
    answer: 'true'
  },
  {
    title: 'Data Updater',
    description: 'Run: psql shopdb -c UPDATE products SET price=price*1.1 WHERE name LIKE Mouse. Then run: psql shopdb -c SELECT price FROM products WHERE name LIKE Mouse. What is the new price rounded to 2 decimals?',
    points: 100,
    answer: '8.25'
  },
  {
    title: 'Serial Expert',
    description: 'Insert 3 more products using INSERT INTO products. Then run: psql shopdb -c SELECT MAX(id) FROM products. What is the highest id?',
    points: 100,
    answer: '6'
  }
];

for (const flag of flags) {
  const id = crypto.randomUUID();
  const answerHash = bcrypt.hashSync(
    flag.answer.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(),
    10
  );
  
  const sql = `INSERT INTO LabFlag (id, labId, title, description, points, answerHash, answerHint, createdAt, updatedAt) VALUES ('${id}', '${labId}', '${flag.title}', '${flag.description}', ${flag.points}, '${answerHash}', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
  
  console.log(sql);
}
