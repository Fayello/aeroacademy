# Module 6 — Automation Scripts for Security Operations

## What You'll Actually Do

Write scripts that automate the tedious parts of security work — file monitoring, log rotation, scheduled scans, alerting, and report generation. These scripts will save you hours every week.

## File operations and monitoring

```python
import os
import hashlib
import time
from pathlib import Path

def hash_file(path):
    """SHA256 hash of a file — for integrity checking."""
    sha256 = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            sha256.update(chunk)
    return sha256.hexdigest()

def monitor_directory(path, interval=5):
    """Watch for file changes in a directory."""
    snapshot = {}
    for f in Path(path).rglob('*'):
        if f.is_file():
            snapshot[str(f)] = {
                'size': f.stat().st_size,
                'mtime': f.stat().st_mtime,
                'hash': hash_file(f)
            }

    print(f"Monitoring {path}... (Ctrl+C to stop)")
    while True:
        time.sleep(interval)
        current = {}
        for f in Path(path).rglob('*'):
            if f.is_file():
                current[str(f)] = {
                    'size': f.stat().st_size,
                    'mtime': f.stat().st_mtime,
                    'hash': hash_file(f)
                }

        # New files
        for f in current:
            if f not in snapshot:
                print(f"  [+] NEW: {f}")

        # Modified files
        for f in current:
            if f in snapshot and current[f]['hash'] != snapshot[f]['hash']:
                print(f"  [~] MODIFIED: {f}")

        # Deleted files
        for f in snapshot:
            if f not in current:
                print(f"  [-] DELETED: {f}")

        snapshot = current

# Run it
# monitor_directory('/etc', interval=10)
```

## Log parsing and analysis

```python
import re
from collections import Counter, defaultdict
from datetime import datetime

def parse_auth_log(path):
    """Parse /var/log/auth.log for security events."""
    events = []
    patterns = {
        'failed_login': r'Failed password for (\S+) from (\S+)',
        'accepted_login': r'Accepted (\S+) for (\S+) from (\S+)',
        'invalid_user': r'Invalid user (\S+) from (\S+)',
        'sudo': r'(\S+) : TTY=(\S+) ; PWD=(\S+) ; USER=(\S+) ; COMMAND=(.*)',
    }

    with open(path, 'r', errors='ignore') as f:
        for line in f:
            for event_type, pattern in patterns.items():
                match = re.search(pattern, line)
                if match:
                    events.append({
                        'type': event_type,
                        'data': match.groups(),
                        'raw': line.strip()
                    })
    return events

def analyze_failed_logins(events):
    """Identify brute-force attempts."""
    failed = [e for e in events if e['type'] == 'failed_login']
    by_ip = Counter(e['data'][1] for e in failed)
    by_user = Counter(e['data'][0] for e in failed)

    print("Top attacker IPs:")
    for ip, count in by_ip.most_common(10):
        print(f"  {ip}: {count} attempts")

    print("\nMost targeted users:")
    for user, count in by_user.most_common(10):
        print(f"  {user}: {count} attempts")

    # Detect brute force (more than 10 attempts from same IP)
    for ip, count in by_ip.items():
        if count >= 10:
            print(f"  [!] BRUTE FORCE: {ip} made {count} failed attempts")

    return by_ip

def parse_apache_log(path):
    """Parse Apache/Nginx combined log format."""
    pattern = r'(\S+) \S+ \S+ \[(.+?)\] "(\S+) (\S+) \S+" (\d+) (\d+)'
    entries = []
    with open(path, 'r', errors='ignore') as f:
        for line in f:
            match = re.match(pattern, line)
            if match:
                entries.append({
                    'ip': match.group(1),
                    'time': match.group(2),
                    'method': match.group(3),
                    'path': match.group(4),
                    'status': int(match.group(5)),
                    'size': int(match.group(6))
                })
    return entries

def detect_web_attacks(entries):
    """Look for common web attack patterns."""
    attack_patterns = [
        (r'(\.\./)+', 'path_traversal'),
        (r'<script', 'xss_attempt'),
        (r'(union|select|insert|drop|delete)\s', 'sql_injection'),
        (r'cmd=|exec\(|system\(', 'command_injection'),
        (r'/etc/passwd', 'file_inclusion'),
        (r'\.env|\.git|wp-admin', 'recon_scan'),
    ]

    attacks = defaultdict(list)
    for entry in entries:
        for pattern, attack_type in attack_patterns:
            if re.search(pattern, entry['path'], re.IGNORECASE):
                attacks[attack_type].append(entry)

    for attack_type, instances in attacks.items():
        print(f"  [{attack_type}] {len(instances)} occurrences")
        for inst in instances[:3]:
            print(f"    {inst['ip']} -> {inst['path']}")

    return attacks
```

## Scheduling and automation

```python
import schedule
import time
import subprocess
from datetime import datetime

def run_scan():
    """Run a scheduled network scan."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output = f'/var/log/scan_{timestamp}.log'

    print(f"[{timestamp}] Running scan...")
    result = subprocess.run(
        ['nmap', '-sV', '-oN', output, '192.168.1.0/24'],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        print(f"Scan failed: {result.stderr}")
    else:
        print(f"Scan saved to {output}")

def send_alert(message):
    """Send an alert (email, webhook, etc.)."""
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] ALERT: {message}\n"

    with open('/var/log/security_alerts.log', 'a') as f:
        f.write(log_entry)

    # Also print to console
    print(f"ALERT: {message}")

def cleanup_old_logs(directory, days=30):
    """Remove log files older than N days."""
    cutoff = time.time() - (days * 86400)
    removed = 0
    for f in Path(directory).glob('*.log'):
        if f.stat().st_mtime < cutoff:
            f.unlink()
            removed += 1
    print(f"Removed {removed} old log files")

# Schedule tasks
schedule.every(5).minutes.do(run_scan)
schedule.every().day.at("02:00").do(cleanup_old_logs, '/var/log/scans/', days=30)
schedule.every().hour.do(send_alert, "Hourly heartbeat check")

def run_scheduler():
    """Run the scheduler loop."""
    print("Scheduler started...")
    while True:
        schedule.run_pending()
        time.sleep(1)
```

## Report generation

```python
from datetime import datetime
import json

class SecurityReport:
    def __init__(self, title):
        self.title = title
        self.timestamp = datetime.now().isoformat()
        self.sections = []

    def add_section(self, heading, content):
        self.sections.append({'heading': heading, 'content': content})

    def to_markdown(self):
        md = f"# {self.title}\n\n"
        md += f"Generated: {self.timestamp}\n\n"
        for section in self.sections:
            md += f"## {section['heading']}\n\n"
            md += f"{section['content']}\n\n"
        return md

    def to_json(self):
        return json.dumps({
            'title': self.title,
            'timestamp': self.timestamp,
            'sections': self.sections
        }, indent=2)

    def save(self, path):
        with open(path, 'w') as f:
            if path.endswith('.md'):
                f.write(self.to_markdown())
            elif path.endswith('.json'):
                f.write(self.to_json())
        print(f"Report saved to {path}")

# Generate a scan report
report = SecurityReport("Weekly Security Scan Report")
report.add_section("Scan Summary", "Scanned 192.168.1.0/24\nFound 12 hosts\n3 open ports detected")
report.add_section("Findings", "- Host 192.168.1.50 has SSH open\n- Host 192.168.1.51 has unpatched Apache")
report.add_section("Recommendations", "1. Patch Apache on .51\n2. Restrict SSH access")
report.save('weekly_report.md')
```

## Batch file processing

```python
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib

def hash_directory(path, extensions=None):
    """Hash all files in a directory — useful for IOC collection."""
    results = {}
    files = [f for f in Path(path).rglob('*') if f.is_file()]
    if extensions:
        files = [f for f in files if f.suffix in extensions]

    def process(f):
        sha256 = hashlib.sha256()
        with open(f, 'rb') as fh:
            for chunk in iter(lambda: fh.read(8192), b''):
                sha256.update(chunk)
        return str(f), sha256.hexdigest()

    with ThreadPoolExecutor(max_workers=4) as executor:
        for path_str, file_hash in executor.map(process, files):
            results[path_str] = file_hash

    return results

def compare_directories(dir1, dir2):
    """Compare two directories and find differences."""
    hashes1 = hash_directory(dir1)
    hashes2 = hash_directory(dir2)

    only_in_1 = set(hashes1.keys()) - set(hashes2.keys())
    only_in_2 = set(hashes2.keys()) - set(hashes1.keys())
    modified = {f for f in hashes1 if f in hashes2 and hashes1[f] != hashes2[f]}

    print(f"Only in {dir1}: {len(only_in_1)} files")
    print(f"Only in {dir2}: {len(only_in_2)} files")
    print(f"Modified: {len(modified)} files")

    return {'only_dir1': only_in_1, 'only_dir2': only_in_2, 'modified': modified}
```

## Assessment

**Lab Task — Build a security automation suite (90 minutes)**

1. Write a log parser that reads Apache access logs and identifies the top 10 IPs by request count
2. Add attack pattern detection (SQL injection, XSS, path traversal attempts)
3. Build a file integrity monitor that watches a directory and alerts on changes
4. Create a report generator that produces a markdown summary of findings
5. Set up a simple scheduler that runs the log parser every 5 minutes

**Grading:**
- Log parser correctly parses Apache format: 20 pts
- Attack pattern detection works: 25 pts
- File integrity monitor detects changes: 25 pts
- Report generator produces readable output: 15 pts
- Scheduler runs without errors: 15 pts

## Evidence

- Your automation scripts
- Sample log output showing detected attacks
- Screenshot of file integrity monitor catching a change
- Generated report in markdown format
- Notes on how you'd deploy these in a real environment
