const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }
const NG = '8fa2d12b-24a6-4d3b-8c12-62e88f4a89dc';
const flags = [
  { t: 'Virtual Host Builder', d: 'Create /etc/nginx/sites-available/mysite.conf with a server block listening on port 9090, root /var/www/mysite. Create /var/www/mysite/index.html with "Hello Custom". Enable the site with ln -s and reload nginx. Run: curl -s localhost:9090. What is the content?', a: 'Hello Custom', p: 100 },
  { t: 'Reverse Proxy', d: 'Start a python http server on port 8888: python3 -m http.server 8888 &. Create nginx reverse proxy config on port 9091 proxying to localhost:8888. Reload nginx. Run: curl -s localhost:9091. What HTML title is shown?', a: 'Directory listing for /', p: 100 },
  { t: 'SSL Generator', d: 'Create /etc/nginx/ssl/ directory. Generate self-signed cert: openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem -subj "/CN=localhost". Run: openssl x509 -in /etc/nginx/ssl/cert.pem -noout -subject. What is the CN value?', a: 'CN = localhost', p: 100 },
  { t: 'Rate Limiter', d: 'Add to your nginx server config: limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;. Then add limit_req zone=one burst=5 nodelay to a location block. Reload. Run: for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code} " localhost:9090; done. What HTTP codes appear (space-separated)?', a: '200 200 200 200 200 503', p: 100 },
  { t: 'Gzip Optimizer', d: 'Add gzip on; gzip_types text/plain; to the http block in /etc/nginx/nginx.conf. Reload nginx. Run: curl -s -H "Accept-Encoding: gzip" -D - localhost 2>&1 | grep -i content-encoding. What encoding is shown?', a: 'gzip', p: 100 },
  { t: 'Load Balancer', d: 'Start 2 python servers on ports 8889 and 8890 (python3 -m http.server 8889 & and python3 -m http.server 8890 &). Create nginx upstream config on port 9092 load balancing between them. Reload and curl localhost:9092. What is the upstream block name you used?', a: 'backend', p: 100 },
  { t: 'Access Control', d: 'Create a location block for /private with "allow 127.0.0.1; deny all;". Reload nginx. Run: curl -s -o /dev/null -w "%{http_code}" localhost:9090/private. What status code?', a: '200', p: 100 },
  { t: 'Error Page Customizer', d: 'Create /var/www/mysite/404.html with "Page Not Found". Add error_page 404 /404.html to your server block. Reload. Run: curl -s localhost:9090/nonexistent. What is the content?', a: 'Page Not Found', p: 100 },
  { t: 'Log Analyzer', d: 'Make 5 requests to nginx. Then run: cat /var/log/nginx/access.log | tail -5 | wc -l. How many access log entries?', a: '5', p: 75 },
  { t: 'Rewrite Master', d: 'Add to your server config: location /old { return 301 /new; }. Create /var/www/mysite/new.html with "Redirected". Reload. Run: curl -s localhost:9090/old. What is the content after redirect?', a: 'Redirected', p: 100 },
];
const lines = [];
for (const f of flags) {
  const id = crypto.randomUUID();
  lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${NG}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
}
console.log(lines.join('\n'));
