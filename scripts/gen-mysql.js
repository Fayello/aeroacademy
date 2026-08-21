const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }
const MY = 'a8fac5e7-9113-42af-87b9-3bcd48ac27e7';
const flags = [
  { t: 'Database Creator', d: 'Create a database called shopdb. Run: mysql -u root -e "SHOW DATABASES" | grep shopdb. What is the output?', a: 'shopdb', p: 50 },
  { t: 'Table Architect', d: 'Create table products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50), price DECIMAL(10,2), stock INT DEFAULT 0). Run: DESCRIBE products | wc -l. How many columns (minus 1 for header)?', a: '4', p: 75 },
  { t: 'Data Inserter', d: 'Insert into products: ("Laptop", 999.99, 10), ("Mouse", 29.99, 100). Run: SELECT COUNT(*) FROM products. How many rows?', a: '2', p: 75 },
  { t: 'Query Master', d: 'Run: SELECT name FROM products WHERE price > 50 ORDER BY price DESC LIMIT 1. What product name?', a: 'Laptop', p: 75 },
  { t: 'Index Builder', d: 'Create index on products(name). Run: SHOW INDEX FROM products WHERE Key_name != "PRIMARY" | wc -l. How many non-primary indexes?', a: '1', p: 100 },
  { t: 'User Manager', d: 'Create user "appuser"@"localhost" identified by "secret123". Grant SELECT,INSERT on shopdb.*. Run: SHOW GRANTS FOR "appuser"@"localhost" | grep "ON shopdb.*". What privileges are shown?', a: 'SELECT, INSERT', p: 100 },
  { t: 'Backup Creator', d: 'Run: mysqldump -u root shopdb > /tmp/backup.sql && wc -l /tmp/backup.sql. How many lines in the backup file?', a: '1', p: 100 },
  { t: 'Join Artist', d: 'Create table orders (id INT PRIMARY KEY AUTO_INCREMENT, product_id INT, quantity INT, FOREIGN KEY (product_id) REFERENCES products(id)). Insert 2 orders. Run: SELECT p.name, o.quantity FROM products p JOIN orders o ON p.id=o.product_id | wc -l. How many result rows (minus header)?', a: '2', p: 100 },
  { t: 'Aggregation Expert', d: 'Run: SELECT SUM(price * stock) as inventory_value FROM products. What is the total inventory value?', a: '12999.80', p: 100 },
  { t: 'Transaction Tester', d: 'Run: mysql -u root shopdb -e "START TRANSACTION; UPDATE products SET stock=stock-1 WHERE name=\'Laptop\'; COMMIT;" && mysql -u root shopdb -e "SELECT stock FROM products WHERE name=\'Laptop\'". What is the stock?', a: '9', p: 100 },
  { t: 'View Creator', d: 'Create view cheap_products as SELECT name, price FROM products WHERE price < 50. Run: SELECT * FROM cheap_products. What product appears?', a: 'Mouse', p: 100 },
  { t: 'Permission Auditor', d: 'Run: mysql -u root -e "SELECT user FROM mysql.user" | grep appuser. What user is listed?', a: 'appuser', p: 75 },
  { t: 'Schema Inspector', d: 'Run: mysql -u root shopdb -e "SHOW TABLES" | wc -l. How many tables exist (minus header)?', a: '2', p: 75 },
  { t: 'Auto Increment Expert', d: 'Insert 3 more products. Run: SELECT MAX(id) FROM products. What is the highest id?', a: '5', p: 100 },
  { t: 'Data Updater', d: 'Run: UPDATE products SET price=price*1.1 WHERE name="Mouse" && mysql -u root shopdb -e "SELECT price FROM products WHERE name=\'Mouse\'". What is the new price (rounded to 2 decimals)?', a: '32.99', p: 100 },
];
const lines = [];
for (const f of flags) {
  const id = crypto.randomUUID();
  lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${MY}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
}
console.log(lines.join('\n'));
