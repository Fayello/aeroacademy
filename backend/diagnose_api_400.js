const http = require('http');

function post(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 400) reject({ status: res.statusCode, data: json });
          else resolve(json);
        } catch (e) {
          reject({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  const labId = '0d2206cd-81cc-462d-87b6-c6b478a8222d'; // NodeGoat
  try {
    console.log('Logging in...');
    const login = await post('http://127.0.0.1:4000/auth/login', {
      email: 'user@aeroacademy.org',
      password: 'password123'
    });
    const token = login.access_token;
    console.log('Login successful');

    console.log(`Starting lab ${labId}...`);
    const start = await post(`http://127.0.0.1:4000/labs/start/${labId}`, null, token);
    console.log('Start success:', start);
  } catch (err) {
    console.error('FAILED:', JSON.stringify(err, null, 2));
  }
}

test();
