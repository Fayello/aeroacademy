const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }
const PG = '993d7511-1cc8-48e1-a817-9a73b1425405';
const flags = [
  { t: 'Database Creator', d: 'Create database shopdb using createdb. Run: psql -l | grep shopdb. What is the output?', a: 'shopdb', p: 50 },
  { t: 'Table Architect', d: 'Create table products (id SERIAL PRIMARY KEY, name VARCHAR(50), price NUMERIC(10,2), stock INT DEFAULT 0). Run: \\d products | wc -l. How many lines of column info?', a: '5', p: 75 },
  { t: 'Data Inserter', d: 'Insert into products: ("Laptop", 999.99, 10), ("Mouse", 29.99, 100). Run: SELECT COUNT(*) FROM products. How many rows?', a: '2', p: 75 },
  { t: 'Query Master', d: 'Run: SELECT name FROM products WHERE price > 50 ORDER BY price DESC LIMIT 1. What product?', a: 'Laptop', p: 75 },
  { t: 'Index Builder', d: 'Create index idx_products_name on products(name). Run: \\di | grep idx_products_name. What index name is shown?', a: 'idx_products_name', p: 100 },
  { t: 'Role Manager', d: 'Create role appuser LOGIN PASSWORD \'secret123\'; Grant CONNECT on shopdb to appuser. Run: \\du | grep appuser. What is listed?', a: 'appuser', p: 100 },
  { t: 'Backup Creator', d: 'Run: pg_dump shopdb > /tmp/pgbackup.sql && wc -l /tmp/pgbackup.sql. How many lines?', a: '1', p: 100 },
  { t: 'Join Artist', d: 'Create table orders (id SERIAL PRIMARY KEY, product_id INT REFERENCES products(id), quantity INT). Insert 2 orders. Run: SELECT p.name, o.quantity FROM products p JOIN orders o ON p.id=o.product_id. How many rows (excluding header)?', a: '2', p: 100 },
  { t: 'Aggregation Expert', d: 'Run: SELECT SUM(price * stock) as inventory_value FROM products. What is the total?', a: '12999.80', p: 100 },
  { t: 'Transaction Tester', d: 'Run: psql shopdb -c "BEGIN; UPDATE products SET stock=stock-1 WHERE name=\'Laptop\'; COMMIT;" && psql shopdb -c "SELECT stock FROM products WHERE name=\'Laptop\'". What is the stock?', a: '9', p: 100 },
  { t: 'View Creator', d: 'Create view cheap_products AS SELECT name, price FROM products WHERE price < 50. Run: SELECT * FROM cheap_products. What product?', a: 'Mouse', p: 100 },
  { t: 'Permission Auditor', d: 'Run: psql -c "SELECT has_table_privilege(\'appuser\', \'products\', \'SELECT\')". What is the result?', a: 't', p: 75 },
  { t: 'Schema Inspector', d: 'Run: psql shopdb -c "\\dt" | grep -c "product". How many tables match?', a: '1', p: 75 },
  { t: 'Serial Expert', d: 'Insert 3 more products. Run: SELECT MAX(id) FROM products. What is the highest id?', a: '5', p: 100 },
  { t: 'Data Updater', d: 'Run: UPDATE products SET price=price*1.1 WHERE name=\'Mouse\' and SELECT price FROM products WHERE name=\'Mouse\'. What is the new price (rounded to 2 decimals)?', a: '32.99', p: 100 },
];
const lines = [];
for (const f of flags) {
  const id = crypto.randomUUID();
  lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${PG}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
}
console.log(lines.join('\n'));
