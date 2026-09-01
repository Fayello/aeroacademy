# Module 4 — Web Scraping for Security

Web applications are the most common attack surface. Every penetration test starts with mapping the target — discovering pages, endpoints, parameters, and technologies. Web scraping is how you automate that discovery. This module teaches you to build security tools that interact with web servers programmatically.

## Why Web Scraping for Security

Web applications are complex. A typical application has hundreds of pages, dozens of API endpoints, multiple authentication mechanisms, and intricate session handling. Manually testing each page for vulnerabilities is impractical. You need automation.

Web scraping for security serves two purposes: discovery and testing. Discovery means finding everything the application exposes — pages, forms, API endpoints, hidden parameters, error messages. Testing means sending crafted inputs to those discovered elements and analyzing the responses for vulnerabilities. Both require programmatic interaction with web servers.

The difference between legitimate web scraping and security scraping is intent and technique. Legitimate scrapers extract data for aggregation or analysis. Security scrapers probe for weaknesses. The HTTP requests look similar, but security scraping involves injecting payloads, testing error conditions, and manipulating parameters in ways that legitimate users don't.

Python is the natural choice for security scraping because the libraries are mature and well-documented. The `requests` library handles HTTP complexity gracefully. BeautifulSoup parses even malformed HTML. Together, they give you the ability to interact with any web application programmatically. This module builds on those libraries to create tools that discover and test web applications systematically.

## The requests Library In Depth

You used `requests.get` in Module 1. Now let's go deeper. Real web applications use sessions, cookies, authentication, custom headers, and various encoding schemes. You need to handle all of them.

### Sessions and Cookies

Most web applications track state through sessions. When you log in, the server sets a session cookie. Every subsequent request must include that cookie. `requests.Session` handles this automatically:

```python
import requests

# Create a session
session = requests.Session()

# Login
login_data = {
    "username": "admin",
    "password": "password123",
    "csrf_token": "abc123"  # Often required
}

# First, get the login page to extract CSRF token
login_page = session.get("https://target.com/login")
# Parse CSRF token from HTML (covered later with BeautifulSoup)

# Submit login
response = session.post(
    "https://target.com/login",
    data=login_data,
    allow_redirects=True
)

# Session now holds authentication cookies
# Subsequent requests are authenticated
dashboard = session.get("https://target.com/dashboard")
print(dashboard.status_code)  # 200 if logged in
```

### Handling JavaScript-Heavy Applications

Modern web applications use JavaScript extensively. Single-page applications render content client-side, meaning the HTML you fetch with `requests` contains no actual content — just JavaScript that renders it later. This complicates web scraping significantly.

For JavaScript-rendered content, you need a browser automation tool like Selenium or Playwright. These tools drive a real browser that executes JavaScript, rendering the page fully before you extract content.

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Set up headless browser
options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
driver = webdriver.Chrome(options=options)

# Navigate and wait for JavaScript to render
driver.get("https://target.com")
wait = WebDriverWait(driver, 10)
element = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "content")))

# Now extract content
html = driver.page_source
driver.quit()
```

For most security testing, `requests` is sufficient because you're testing the server-side — inputs, parameters, headers. JavaScript rendering matters when you need to discover dynamically loaded content or test client-side vulnerabilities.

### Handling Authentication

Different applications use different auth mechanisms:

```python
# Basic Auth
response = requests.get(
    "https://target.com/api",
    auth=("admin", "password123")
)

# Token-based Auth (Bearer)
headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."}
response = requests.get("https://target.com/api", headers=headers)

# API Key in header
headers = {"X-API-Key": "your-api-key-here"}
response = requests.get("https://target.com/api", headers=headers)

# API Key in query parameter
params = {"api_key": "your-api-key-here"}
response = requests.get("https://target.com/api", params=params)

# Client certificates
response = requests.get(
    "https://target.com",
    cert=("client.pem", "client.key")
)
```

### Request Configuration

Control timeouts, redirects, SSL verification, and proxying:

```python
# Timeouts — always set them
response = requests.get("https://target.com", timeout=(5, 30))
# (connect_timeout, read_timeout)

# Redirect control
response = requests.get(
    "https://target.com",
    allow_redirects=False,  # Don't follow redirects
    max_redirects=3         # Limit redirects
)

# SSL verification (disable for testing)
response = requests.get(
    "https://self-signed.target.com",
    verify=False
)

# Proxy support
proxies = {
    "http": "http://127.0.0.1:8080",
    "https": "http://127.0.0.1:8080"
}
response = requests.get("http://target.com", proxies=proxies)

# Custom headers
headers = {
    "User-Agent": "SecurityScanner/1.0",
    "Accept": "text/html,application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://target.com/"
}
response = requests.get("https://target.com", headers=headers)
```

## BeautifulSoup for HTML Parsing

HTML is messy. You need to extract specific elements — links, forms, inputs, scripts. BeautifulSoup makes this tolerable.

```python
from bs4 import BeautifulSoup
import requests

# Fetch and parse a page
response = requests.get("https://target.com", timeout=10)
soup = BeautifulSoup(response.text, "html.parser")

# Extract all links
links = []
for a_tag in soup.find_all("a", href=True):
    href = a_tag["href"]
    text = a_tag.get_text(strip=True)
    links.append({"url": href, "text": text})

# Extract all forms
forms = []
for form in soup.find_all("form"):
    action = form.get("action", "")
    method = form.get("method", "GET").upper()
    inputs = []

    for input_tag in form.find_all(["input", "textarea", "select"]):
        name = input_tag.get("name")
        input_type = input_tag.get("type", "text")
        value = input_tag.get("value", "")
        inputs.append({
            "name": name,
            "type": input_type,
            "value": value
        })

    forms.append({
        "action": action,
        "method": method,
        "inputs": inputs
    })

# Extract meta tags
meta_tags = {}
for meta in soup.find_all("meta"):
    name = meta.get("name") or meta.get("property")
    content = meta.get("content")
    if name and content:
        meta_tags[name] = content

# Extract scripts
scripts = []
for script in soup.find_all("script", src=True):
    scripts.append(script["src"])

# Extract comments (potential hidden info)
comments = []
for comment in soup.find_all(string=lambda text: isinstance(text, type(soup.new_string("")))):
    if "<!--" in str(comment):
        comments.append(str(comment))
```

### Extracting Specific Patterns

Security testing often requires finding specific patterns in HTML:

```python
from bs4 import BeautifulSoup
import re

def extract_security_info(html):
    soup = BeautifulSoup(html, "html.parser")
    info = {
        "hidden_inputs": [],
        "comments": [],
        "javascript_vars": [],
        "email_addresses": [],
        "internal_ips": [],
    }

    # Hidden form inputs (tokens, IDs, etc.)
    for inp in soup.find_all("input", type="hidden"):
        info["hidden_inputs"].append({
            "name": inp.get("name"),
            "value": inp.get("value")
        })

    # HTML comments
    for comment in soup.find_all(string=lambda text: "-->" in str(text)):
        info["comments"].append(str(comment).strip())

    # JavaScript variables that might leak info
    for script in soup.find_all("script"):
        text = script.string or ""
        # Find variable assignments
        matches = re.findall(r"var\s+(\w+)\s*=\s*['\"]([^'\"]+)['\"]", text)
        for var_name, value in matches:
            info["javascript_vars"].append({"name": var_name, "value": value})

    # Email addresses
    text = soup.get_text()
    emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    info["email_addresses"] = list(set(emails))

    # Internal IPs
    ips = re.findall(r"\b(?:10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b", text)
    info["internal_ips"] = list(set(ips))

    return info
```

## Session Handling for Security Testing

Security testing requires maintaining state across requests — logged-in sessions, CSRF tokens, multi-step authentication flows.

### CSRF Token Handling

Most modern applications use CSRF tokens. You need to extract them before submitting forms:

```python
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

class WebSession:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:102.0) Gecko/20100101 Firefox/102.0"
        })

    def get_page(self, path):
        url = urljoin(self.base_url, path)
        response = self.session.get(url, timeout=10, verify=False)
        return response

    def extract_csrf_token(self, html, form_id=None):
        soup = BeautifulSoup(html, "html.parser")

        if form_id:
            form = soup.find("form", id=form_id)
        else:
            form = soup.find("form")

        if not form:
            return None

        # Look for common CSRF token field names
        token_names = ["csrf_token", "_csrf", "csrfmiddlewaretoken",
                      "_token", "authenticity_token", "__RequestVerificationToken"]

        for input_tag in form.find_all("input"):
            name = input_tag.get("name", "")
            if name in token_names:
                return input_tag.get("value")

        return None

    def login(self, login_path, username, password, extra_data=None):
        # Get login page
        response = self.get_page(login_path)
        csrf_token = self.extract_csrf_token(response.text)

        # Prepare login data
        data = {
            "username": username,
            "password": password
        }
        if csrf_token:
            data["csrf_token"] = csrf_token
        if extra_data:
            data.update(extra_data)

        # Submit login
        login_url = urljoin(self.base_url, login_path)
        response = self.session.post(login_url, data=data, timeout=10)

        return response

    def authenticated_get(self, path, params=None):
        """Make an authenticated GET request"""
        url = urljoin(self.base_url, path)
        response = self.session.get(url, params=params, timeout=10, verify=False)
        return response

    def authenticated_post(self, path, data=None, json=None):
        """Make an authenticated POST request"""
        url = urljoin(self.base_url, path)
        response = self.session.post(url, data=data, json=json, timeout=10)
        return response

# Usage
web = WebSession("https://target.com")
web.login("/login", "admin", "password123")
dashboard = web.authenticated_get("/dashboard")
```

### Handling Multi-Step Authentication

Some applications use multi-step authentication — username first, then password, then maybe a second factor:

```python
class MultiStepAuth:
    def __init__(self, base_url):
        self.session = requests.Session()
        self.base_url = base_url

    def step1_enter_username(self, username):
        """First step: submit username"""
        response = self.session.get(f"{self.base_url}/login")
        soup = BeautifulSoup(response.text, "html.parser")
        token = self.extract_token(soup)

        response = self.session.post(
            f"{self.base_url}/login",
            data={"username": username, "step": "1", "token": token}
        )
        return response

    def step2_enter_password(self, password):
        """Second step: submit password"""
        soup = BeautifulSoup(
            self.session.get(f"{self.base_url}/login/step2").text,
            "html.parser"
        )
        token = self.extract_token(soup)

        response = self.session.post(
            f"{self.base_url}/login/step2",
            data={"password": password, "step": "2", "token": token}
        )
        return response

    def extract_token(self, soup):
        for inp in soup.find_all("input", type="hidden"):
            if "token" in inp.get("name", "").lower():
                return inp.get("value")
        return None
```

## API Interaction

Modern applications expose APIs. Testing them requires understanding JSON, pagination, rate limiting, and API-specific authentication.

```python
import requests
import time
import json

class APIClient:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })
        if api_key:
            self.session.headers["Authorization"] = f"Bearer {api_key}"

    def get(self, endpoint, params=None):
        url = f"{self.base_url}{endpoint}"
        response = self.session.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()

    def post(self, endpoint, data=None):
        url = f"{self.base_url}{endpoint}"
        response = self.session.post(url, json=data, timeout=10)
        response.raise_for_status()
        return response.json()

    def put(self, endpoint, data=None):
        url = f"{self.base_url}{endpoint}"
        response = self.session.put(url, json=data, timeout=10)
        response.raise_for_status()
        return response.json()

    def delete(self, endpoint):
        url = f"{self.base_url}{endpoint}"
        response = self.session.delete(url, timeout=10)
        response.raise_for_status()
        return response.json()

    def paginate(self, endpoint, page_size=100, max_pages=None):
        """Handle paginated API responses"""
        all_results = []
        page = 1

        while True:
            params = {"page": page, "per_page": page_size}
            result = self.get(endpoint, params=params)

            if isinstance(result, list):
                all_results.extend(result)
                if len(result) < page_size:
                    break
            elif isinstance(result, dict):
                if "results" in result:
                    all_results.extend(result["results"])
                    if len(result["results"]) < page_size:
                        break
                elif "data" in result:
                    all_results.extend(result["data"])
                    if len(result["data"]) < page_size:
                        break

            page += 1
            if max_pages and page > max_pages:
                break

            time.sleep(0.1)  # Rate limiting

        return all_results

    def fuzz_endpoint(self, endpoint, method="GET", payloads=None):
        """Test an endpoint with various payloads"""
        results = []

        for payload in (payloads or ["test", "<script>alert(1)</script>", "' OR 1=1--"]):
            try:
                if method == "GET":
                    response = self.session.get(
                        f"{self.base_url}{endpoint}",
                        params={"q": payload},
                        timeout=5
                    )
                elif method == "POST":
                    response = self.session.post(
                        f"{self.base_url}{endpoint}",
                        json={"input": payload},
                        timeout=5
                    )

                results.append({
                    "payload": payload,
                    "status": response.status_code,
                    "length": len(response.text),
                    "reflects": payload in response.text
                })
            except Exception as e:
                results.append({
                    "payload": payload,
                    "error": str(e)
                })

        return results

# Usage
api = APIClient("https://api.target.com/v1", api_key="your-key")
users = api.paginate("/users")
for user in users:
    print(user)
```

## Real Scenario: Building a Vulnerability Scanner

Combine everything — session handling, HTML parsing, API interaction, and pattern matching — to build a vulnerability scanner.

```python
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs
import re
import time
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

class VulnScanner:
    def __init__(self, target_url):
        self.target_url = target_url
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:102.0) Gecko/20100101 Firefox/102.0"
        })
        self.session.verify = False
        self.findings = []
        self.visited = set()
        self.forms = []

    def crawl(self, path="/", depth=3):
        """Crawl the website and discover pages and forms"""
        if depth <= 0 or path in self.visited:
            return

        self.visited.add(path)
        url = urljoin(self.target_url, path)

        try:
            response = self.session.get(url, timeout=10)
            print(f"  Crawled: {path} ({response.status_code})")
        except Exception as e:
            print(f"  Error crawling {path}: {e}")
            return

        soup = BeautifulSoup(response.text, "html.parser")

        # Extract forms
        for form in soup.find_all("form"):
            action = form.get("action", "")
            method = form.get("method", "GET").upper()
            inputs = []

            for inp in form.find_all(["input", "textarea", "select"]):
                name = inp.get("name")
                if name:
                    inputs.append({
                        "name": name,
                        "type": inp.get("type", "text"),
                        "value": inp.get("value", "")
                    })

            if inputs:
                form_url = urljoin(url, action)
                self.forms.append({
                    "url": form_url,
                    "method": method,
                    "inputs": inputs
                })

        # Follow links
        if depth > 0:
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                parsed = urlparse(href)

                # Only follow links on the same domain
                if parsed.netloc == "" or parsed.netloc == urlparse(self.target_url).netloc:
                    next_path = parsed.path or "/"
                    if next_path not in self.visited:
                        time.sleep(0.5)  # Be polite
                        self.crawl(next_path, depth - 1)

    def check_xss(self):
        """Test forms for reflected XSS"""
        print("\n[*] Testing for XSS...")

        xss_payloads = [
            '<script>alert("XSS")</script>',
            '"><script>alert(1)</script>',
            "'-alert(1)-'",
            '"><img src=x onerror=alert(1)>',
            'javascript:alert(1)',
        ]

        for form in self.forms:
            for payload in xss_payloads:
                data = {}
                for inp in form["inputs"]:
                    data[inp["name"]] = payload

                try:
                    if form["method"] == "GET":
                        response = self.session.get(
                            form["url"],
                            params=data,
                            timeout=5
                        )
                    else:
                        response = self.session.post(
                            form["url"],
                            data=data,
                            timeout=5
                        )

                    if payload in response.text:
                        self.findings.append({
                            "type": "Reflected XSS",
                            "severity": "HIGH",
                            "url": form["url"],
                            "input": [inp["name"] for inp in form["inputs"]],
                            "payload": payload
                        })
                        print(f"  [!] XSS found at {form['url']}")
                        break

                except Exception:
                    continue

    def check_sqli(self):
        """Test forms for SQL injection"""
        print("\n[*] Testing for SQL Injection...")

        sqli_payloads = [
            "'",
            "' OR '1'='1",
            "' OR '1'='1'--",
            "1; DROP TABLE users--",
            "' UNION SELECT NULL--",
            "admin'--",
        ]

        error_patterns = [
            "you have an error in your sql syntax",
            "warning: mysql",
            "unclosed quotation mark",
            "microsoft ole db provider for odbc drivers",
            "pg_query", "pg_exec",
            "sqlite3.operationalerror",
            "ora-01756",
        ]

        for form in self.forms:
            for payload in sqli_payloads:
                data = {}
                for inp in form["inputs"]:
                    data[inp["name"]] = payload

                try:
                    if form["method"] == "GET":
                        response = self.session.get(
                            form["url"],
                            params=data,
                            timeout=5
                        )
                    else:
                        response = self.session.post(
                            form["url"],
                            data=data,
                            timeout=5
                        )

                    # Check for SQL error messages
                    response_lower = response.text.lower()
                    for pattern in error_patterns:
                        if pattern in response_lower:
                            self.findings.append({
                                "type": "SQL Injection",
                                "severity": "CRITICAL",
                                "url": form["url"],
                                "input": [inp["name"] for inp in form["inputs"]],
                                "payload": payload,
                                "evidence": pattern
                            })
                            print(f"  [!] SQLi found at {form['url']}")
                            break

                except Exception:
                    continue

    def check_headers(self):
        """Check for security headers"""
        print("\n[*] Checking security headers...")

        try:
            response = self.session.get(self.target_url, timeout=10)
        except Exception:
            return

        security_headers = {
            "X-Frame-Options": "Missing X-Frame-Options header (clickjacking)",
            "X-Content-Type-Options": "Missing X-Content-Type-Options (MIME sniffing)",
            "X-XSS-Protection": "Missing X-XSS-Protection header",
            "Strict-Transport-Security": "Missing HSTS header",
            "Content-Security-Policy": "Missing Content-Security-Policy",
            "Referrer-Policy": "Missing Referrer-Policy",
        }

        for header, description in security_headers.items():
            if header.lower() not in [h.lower() for h in response.headers]:
                self.findings.append({
                    "type": "Missing Security Header",
                    "severity": "MEDIUM",
                    "header": header,
                    "description": description
                })
                print(f"  [!] {description}")

        # Check for information disclosure headers
        disclosure_headers = ["Server", "X-Powered-By", "X-AspNet-Version"]
        for header in disclosure_headers:
            if header.lower() in [h.lower() for h in response.headers]:
                value = response.headers.get(header)
                self.findings.append({
                    "type": "Information Disclosure",
                    "severity": "LOW",
                    "header": header,
                    "value": value
                })
                print(f"  [!] {header}: {value}")

    def check_directory_listing(self):
        """Check for directory listing"""
        print("\n[*] Checking for directory listing...")

        common_dirs = [
            "/", "/admin/", "/backup/", "/config/", "/data/",
            "/db/", "/debug/", "/dev/", "/docs/", "/dump/",
            "/files/", "/hidden/", "/internal/", "/logs/",
            "/private/", "/secret/", "/staging/", "/test/",
            "/uploads/", "/var/", "/vendor/", "/.git/"
        ]

        for directory in common_dirs:
            try:
                url = urljoin(self.target_url, directory)
                response = self.session.get(url, timeout=5)

                if response.status_code == 200:
                    # Check for directory listing indicators
                    indicators = [
                        "Index of",
                        "Directory listing",
                        "<title>Index of",
                        "Parent Directory"
                    ]

                    for indicator in indicators:
                        if indicator.lower() in response.text.lower():
                            self.findings.append({
                                "type": "Directory Listing",
                                "severity": "MEDIUM",
                                "url": url,
                                "evidence": indicator
                            })
                            print(f"  [!] Directory listing found at {url}")
                            break

            except Exception:
                continue

    def check_sensitive_files(self):
        """Check for exposed sensitive files"""
        print("\n[*] Checking for sensitive files...")

        sensitive_files = [
            "/.env", "/config.php", "/wp-config.php",
            "/database.yml", "/.git/config", "/.htaccess",
            "/phpinfo.php", "/info.php", "/test.php",
            "/robots.txt", "/sitemap.xml", "/crossdomain.xml",
            "/.DS_Store", "/Thumbs.db", "/web.config",
            "/.htpasswd", "/backup.sql", "/dump.sql"
        ]

        for filepath in sensitive_files:
            try:
                url = urljoin(self.target_url, filepath)
                response = self.session.get(url, timeout=5)

                if response.status_code == 200 and len(response.text) > 0:
                    self.findings.append({
                        "type": "Sensitive File Exposed",
                        "severity": "HIGH",
                        "url": url,
                        "size": len(response.text)
                    })
                    print(f"  [!] Sensitive file: {url} ({len(response.text)} bytes)")

            except Exception:
                continue

    def run(self):
        """Run full scan"""
        print(f"Starting scan of {self.target_url}")
        print(f"{'='*60}")

        # Crawl
        print("\n[*] Crawling website...")
        self.crawl(depth=2)
        print(f"  Found {len(self.visited)} pages")
        print(f"  Found {len(self.forms)} forms")

        # Run checks
        self.check_headers()
        self.check_directory_listing()
        self.check_sensitive_files()
        self.check_xss()
        self.check_sqli()

        # Report
        print(f"\n{'='*60}")
        print(f"SCAN RESULTS")
        print(f"{'='*60}")
        print(f"Pages crawled: {len(self.visited)}")
        print(f"Forms found: {len(self.forms)}")
        print(f"Findings: {len(self.findings)}")

        if self.findings:
            print(f"\nFINDINGS:")
            for i, finding in enumerate(self.findings, 1):
                print(f"\n  {i}. [{finding['severity']}] {finding['type']}")
                for key, value in finding.items():
                    if key not in ("type", "severity"):
                        print(f"     {key}: {value}")

        return self.findings

    def export_report(self, filename):
        """Export findings to JSON"""
        with open(filename, "w") as f:
            json.dump(self.findings, f, indent=2, default=str)
        print(f"\nReport exported to {filename}")

# Usage
scanner = VulnScanner("https://target.com")
findings = scanner.run()
scanner.export_report("scan_results.json")
```

## Assessment

### Lab Task: Web Vulnerability Scanner

Build a web vulnerability scanner that tests for at least 4 different vulnerability types. Time limit: 120 minutes.

**Requirements:**
1. Crawl target website (at least 2 levels deep)
2. Discover and catalog all forms
3. Test for at least one injection vulnerability (XSS or SQLi)
4. Check for missing security headers
5. Check for directory listing
6. Check for exposed sensitive files
7. Generate a report with findings and severity ratings
8. Handle errors gracefully (timeouts, connection refused)

**Deliverables:**
- Source code (`webscan.py`)
- Scan results against a test target
- Written summary of findings

**Grading Criteria:**
- Crawling works correctly (20 points)
- Form discovery works (15 points)
- At least one vulnerability check works (25 points)
- Security header checks work (15 points)
- Report is well-formatted (15 points)
- Error handling is solid (10 points)

### Bonus Challenges

- Add authentication support (login and scan authenticated areas)
- Implement blind SQL injection detection (time-based)
- Add CMS-specific checks (WordPress, Joomla, Drupal)
- Implement rate limiting to avoid overwhelming the target

## Ethical and Legal Considerations

Web vulnerability scanning operates in a legal gray area. Scanning your own systems is legal. Scanning systems you have written permission to test is legal. Scanning systems without authorization is illegal in most jurisdictions, regardless of your intentions.

Before scanning any target, ensure you have explicit written authorization. A verbal "go ahead" is not sufficient. You need a document that specifies the scope of testing, the methods allowed, and the timeline. This document protects you legally and sets clear expectations with the target organization.

Rate limiting is an ethical obligation. Even with authorization, an aggressive scan can disrupt services. Sending thousands of requests per second to a web application can overwhelm it, causing denial of service for legitimate users. Always implement rate limiting in your scanners. Start slowly, verify the target can handle the load, and increase speed gradually. When in doubt, scan slowly.

The testing scope matters. SQL injection testing involves sending malicious payloads to database queries. This can cause data corruption or deletion if the application doesn't sanitize inputs properly. Cross-site scripting testing involves injecting JavaScript that executes in browsers. If you test against a production system with real users, your payloads execute in their browsers. Always test against development or staging environments when possible. When testing production, coordinate with the application team and test during maintenance windows.

Data handling is another concern. Your scanner might capture sensitive data — passwords, API keys, personal information. This data must be handled securely, stored encrypted, and deleted after the engagement. Never log sensitive data in plaintext. Never share it with unauthorized parties. The same data protection principles that apply to the target's data apply to data you collect during testing.

## Evidence

Web vulnerability scanning is the bread and butter of application security. The tool you built here is a simplified version of what commercial scanners do. The difference is scale and sophistication — they handle more edge cases, more vulnerability types, and more complex web applications. But the core approach is the same: crawl, discover, test, report.

The key lesson is that web security testing is about understanding how web applications work, not about memorizing vulnerability signatures. If you understand sessions, you can test for session fixation. If you understand databases, you can test for SQL injection. The Python is just the automation layer.

**Libraries covered:** requests, bs4 (BeautifulSoup), urllib.parse, re, json, concurrent.futures

**Concepts covered:** HTTP sessions, CSRF tokens, HTML parsing, form extraction, XSS testing, SQL injection testing, security header analysis, directory listing detection, sensitive file discovery