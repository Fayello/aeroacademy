# Module 4 — Web Scraping for Security

## What You'll Actually Do

Write scripts that interact with web applications programmatically — scraping targets, interacting with APIs, testing for common web vulnerabilities, and automating reconnaissance.

## requests — the foundation

```python
import requests

# Basic GET
r = requests.get('https://httpbin.org/get')
print(r.status_code)
print(r.headers)
print(r.text[:200])

# POST with data
r = requests.post('https://httpbin.org/post', data={
    'username': 'admin',
    'password': 'test'
})

# Custom headers — essential for avoiding detection
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
}
r = requests.get('https://httpbin.org/headers', headers=headers)

# Session handling — cookies persist across requests
session = requests.Session()
session.get('https://httpbin.org/cookies/set/session_id/abc123')
r = session.get('https://httpbin.org/cookies')
print(r.json())
```

## BeautifulSoup — HTML parsing

```python
from bs4 import BeautifulSoup
import requests

def scrape_links(url):
    """Extract all links from a page."""
    r = requests.get(url, timeout=10)
    soup = BeautifulSoup(r.text, 'html.parser')
    links = []
    for a in soup.find_all('a', href=True):
        links.append(a['href'])
    return links

def find_forms(url):
    """Enumerate forms on a page — useful for input testing."""
    r = requests.get(url, timeout=10)
    soup = BeautifulSoup(r.text, 'html.parser')
    forms = []
    for form in soup.find_all('form'):
        inputs = []
        for inp in form.find_all(['input', 'textarea', 'select']):
            inputs.append({
                'name': inp.get('name'),
                'type': inp.get('type', 'text'),
                'value': inp.get('value', '')
            })
        forms.append({
            'action': form.get('action', ''),
            'method': form.get('method', 'GET').upper(),
            'inputs': inputs
        })
    return forms

def extract_metadata(url):
    """Pull useful metadata from a page."""
    r = requests.get(url, timeout=10)
    soup = BeautifulSoup(r.text, 'html.parser')
    meta = {
        'title': soup.title.string if soup.title else 'No title',
        'meta_tags': {},
        'scripts': [],
        'comments': []
    }
    for tag in soup.find_all('meta'):
        name = tag.get('name') or tag.get('property')
        if name:
            meta['meta_tags'][name] = content = tag.get('content', '')

    for script in soup.find_all('script', src=True):
        meta['scripts'].append(script['src'])

    # Extract HTML comments — often leak info
    import re
    comments = re.findall(r'<!--(.*?)-->', r.text, re.DOTALL)
    meta['comments'] = [c.strip() for c in comments if c.strip()]

    return meta
```

## API interaction

```python
import requests
import json

class APIClient:
    def __init__(self, base_url, token=None):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        if token:
            self.session.headers['Authorization'] = f'Bearer {token}'

    def get(self, endpoint, params=None):
        r = self.session.get(f'{self.base_url}{endpoint}', params=params)
        r.raise_for_status()
        return r.json()

    def post(self, endpoint, data=None):
        r = self.session.post(f'{self.base_url}{endpoint}', json=data)
        r.raise_for_status()
        return r.json()

    def put(self, endpoint, data=None):
        r = self.session.put(f'{self.base_url}{endpoint}', json=data)
        r.raise_for_status()
        return r.json()

    def delete(self, endpoint):
        r = self.session.delete(f'{self.base_url}{endpoint}')
        r.raise_for_status()
        return r.status_code

# Usage
api = APIClient('https://jsonplaceholder.typicode.com')
users = api.get('/users')
print(json.dumps(users[0], indent=2))
```

## Web reconnaissance script

```python
#!/usr/bin/env python3
"""Quick web recon script for a target."""
import requests
from bs4 import BeautifulSoup
import re
import json

def recon(target_url):
    results = {
        'url': target_url,
        'headers': {},
        'forms': [],
        'links': [],
        'emails': [],
        'comments': [],
        'technologies': []
    }

    r = requests.get(target_url, timeout=10)

    # Server headers
    results['headers'] = dict(r.headers)

    # Technology detection
    server = r.headers.get('Server', '')
    powered_by = r.headers.get('X-Powered-By', '')
    if server:
        results['technologies'].append(f'Server: {server}')
    if powered_by:
        results['technologies'].append(f'Powered-By: {powered_by}')

    # Check for common headers missing
    security_headers = [
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Content-Security-Policy',
        'X-XSS-Protection'
    ]
    missing = [h for h in security_headers if h not in r.headers]
    if missing:
        results['missing_security_headers'] = missing

    soup = BeautifulSoup(r.text, 'html.parser')

    # Forms
    results['forms'] = find_forms(target_url)

    # Links
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.startswith(('http://', 'https://')):
            results['links'].append(href)

    # Emails
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', r.text)
    results['emails'] = list(set(emails))

    # HTML comments
    comments = re.findall(r'<!--(.*?)-->', r.text, re.DOTALL)
    results['comments'] = [c.strip() for c in comments if c.strip()]

    return results

def find_forms(url):
    r = requests.get(url, timeout=10)
    soup = BeautifulSoup(r.text, 'html.parser')
    forms = []
    for form in soup.find_all('form'):
        inputs = []
        for inp in form.find_all(['input', 'textarea', 'select']):
            inputs.append({
                'name': inp.get('name'),
                'type': inp.get('type', 'text')
            })
        forms.append({
            'action': form.get('action', ''),
            'method': form.get('method', 'GET'),
            'inputs': inputs
        })
    return forms

if __name__ == '__main__':
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else 'https://example.com'
    results = recon(url)
    print(json.dumps(results, indent=2))
```

## Directory brute-forcing

```python
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

def check_path(base_url, path, timeout=5):
    url = f"{base_url.rstrip('/')}/{path}"
    try:
        r = requests.get(url, timeout=timeout, allow_redirects=False)
        if r.status_code not in (404, 403):
            return (path, r.status_code, len(r.content))
    except requests.RequestException:
        pass
    return None

def directory_bruteforce(base_url, wordlist_path, threads=10):
    with open(wordlist_path, 'r', errors='ignore') as f:
        paths = [line.strip() for line in f if line.strip()]

    found = []
    with ThreadPoolExecutor(max_workers=threads) as executor:
        futures = {executor.submit(check_path, base_url, p): p for p in paths}
        for future in as_completed(futures):
            result = future.result()
            if result:
                path, status, size = result
                print(f"  [{status}] /{path} ({size} bytes)")
                found.append(result)
    return found

if __name__ == '__main__':
    import sys
    target = sys.argv[1]
    wordlist = sys.argv[2] if len(sys.argv) > 2 else 'common.txt'
    directory_bruteforce(target, wordlist)
```

## Assessment

**Lab Task — Build a web recon tool (60 minutes)**

1. Write a script that takes a URL and outputs: headers, missing security headers, forms, external links, emails in HTML comments
2. Add a directory brute-force function using a provided wordlist
3. Handle errors gracefully (timeouts, connection refused, SSL errors)
4. Add rate limiting (max 5 requests/second) to avoid overwhelming targets
5. Test against your own lab web application (DVWA, Juice Shop, or similar)

**Grading:**
- Header analysis and missing security header detection: 20 pts
- Form enumeration: 15 pts
- Email/comment extraction: 15 pts
- Directory brute-forcing with threading: 25 pts
- Rate limiting implemented: 10 pts
- Error handling throughout: 15 pts

## Evidence

- Your recon script
- Output against a test target
- List of any credentials, comments, or sensitive data found
- Notes on how the missing security headers could be exploited
