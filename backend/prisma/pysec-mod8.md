# Module 8 — Forensics Scripts

## What You'll Actually Do

Write Python scripts for incident response: parse logs at scale, analyze memory dumps for IOCs, extract artifacts from disk images, and build forensic timelines. These are the tools you'll reach for when something goes wrong.

## Log parsing at scale

```python
import re
import json
from collections import defaultdict, Counter
from datetime import datetime, timedelta

class LogAnalyzer:
    """Multi-format log parser with timeline generation."""

    def __init__(self):
        self.events = []

    def parse_syslog(self, path):
        """Parse syslog-style logs."""
        pattern = r'(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(\S+?)(?:\[(\d+)\])?\:\s+(.*)'
        with open(path, 'r', errors='ignore') as f:
            for line in f:
                match = re.match(pattern, line)
                if match:
                    self.events.append({
                        'timestamp': match.group(1),
                        'host': match.group(2),
                        'service': match.group(3),
                        'pid': match.group(4),
                        'message': match.group(5),
                        'source': path
                    })

    def parse_event_logs(self, path):
        """Parse Windows-style event logs (exported as text)."""
        pattern = r'(\d+/\d+/\d+\s+\d+:\d+:\d+\s+(?:AM|PM))\s+(\w+)\s+(.*)'
        with open(path, 'r', errors='ignore') as f:
            for line in f:
                match = re.match(pattern, line)
                if match:
                    self.events.append({
                        'timestamp': match.group(1),
                        'level': match.group(2),
                        'message': match.group(3),
                        'source': path
                    })

    def parse_json_logs(self, path):
        """Parse JSON-formatted logs (one JSON object per line)."""
        with open(path, 'r', errors='ignore') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    self.events.append({
                        'timestamp': entry.get('timestamp', ''),
                        'level': entry.get('level', ''),
                        'message': entry.get('message', entry.get('msg', '')),
                        'source': path,
                        'raw': entry
                    })
                except json.JSONDecodeError:
                    pass

    def build_timeline(self):
        """Sort all events chronologically."""
        self.events.sort(key=lambda x: x.get('timestamp', ''))
        return self.events

    def search(self, pattern, case_sensitive=False):
        """Search all events for a pattern."""
        flags = 0 if case_sensitive else re.IGNORECASE
        regex = re.compile(pattern, flags)
        return [e for e in self.events if regex.search(str(e))]

    def extract_iocs(self):
        """Extract indicators of compromise from all events."""
        iocs = {
            'ips': set(),
            'domains': set(),
            'hashes': set(),
            'emails': set(),
            'urls': set()
        }

        ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
        domain_pattern = re.compile(r'\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b')
        hash_pattern = re.compile(r'\b[a-fA-F0-9]{32,64}\b')
        email_pattern = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
        url_pattern = re.compile(r'https?://[^\s<>"]+')

        for event in self.events:
            text = json.dumps(event)
            iocs['ips'].update(ip_pattern.findall(text))
            iocs['domains'].update(domain_pattern.findall(text))
            iocs['hashes'].update(hash_pattern.findall(text))
            iocs['emails'].update(email_pattern.findall(text))
            iocs['urls'].update(url_pattern.findall(text))

        return {k: list(v) for k, v in iocs.items()}

    def generate_report(self):
        """Generate a summary report."""
        timeline = self.build_timeline()
        iocs = self.extract_iocs()

        report = {
            'total_events': len(timeline),
            'sources': list(set(e['source'] for e in timeline)),
            'time_range': {
                'first': timeline[0]['timestamp'] if timeline else None,
                'last': timeline[-1]['timestamp'] if timeline else None,
            },
            'iocs': {k: len(v) for k, v in iocs.items()},
            'timeline': timeline[:100]  # First 100 events
        }
        return report
```

## Memory analysis

```python
import struct
import re

def extract_strings_from_memory(dump_path, min_length=6):
    """Extract printable strings from a memory dump."""
    strings = []
    current = b''

    with open(dump_path, 'rb') as f:
        while True:
            byte = f.read(1)
            if not byte:
                break
            if 32 <= byte[0] <= 126:  # Printable ASCII
                current += byte
            else:
                if len(current) >= min_length:
                    strings.append(current.decode('ascii'))
                current = b''

    return strings

def find_urls_in_memory(strings):
    """Extract URLs from memory strings."""
    url_pattern = re.compile(r'https?://[a-zA-Z0-9./?=&_-]+')
    urls = []
    for s in strings:
        urls.extend(url_pattern.findall(s))
    return list(set(urls))

def find_emails_in_memory(strings):
    """Extract email addresses from memory strings."""
    email_pattern = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    emails = []
    for s in strings:
        emails.extend(email_pattern.findall(s))
    return list(set(emails))

def find_ips_in_memory(strings):
    """Extract IP addresses from memory strings."""
    ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
    ips = []
    for s in strings:
        ips.extend(ip_pattern.findall(s))
    return list(set(ips))

def find可疑_processes(strings):
    """Look for suspicious process names or commands."""
    suspicious_patterns = [
        r'cmd\.exe.*\/c',
        r'powershell.*-enc',
        r'base64',
        r'mimikatz',
        r'invoke-expression',
        r' download ',
        r'nc\.exe',
        r'/bin/sh',
        r'/bin/bash.*-i',
        r'python.*-c.*import',
        r'curl.*\|.*sh',
        r'wget.*\|.*sh',
    ]

    findings = []
    for s in strings:
        for pattern in suspicious_patterns:
            if re.search(pattern, s, re.IGNORECASE):
                findings.append({'string': s, 'pattern': pattern})
    return findings

def analyze_memory_dump(dump_path):
    """Full memory analysis pipeline."""
    print(f"Analyzing {dump_path}...")

    strings = extract_strings_from_memory(dump_path)
    print(f"Extracted {len(strings)} strings")

    results = {
        'urls': find_urls_in_memory(strings),
        'emails': find_emails_in_memory(strings),
        'ips': find_ips_in_memory(strings),
        'suspicious': find_suspicious_processes(strings),
        'total_strings': len(strings)
    }

    print(f"URLs found: {len(results['urls'])}")
    print(f"Emails found: {len(results['emails'])}")
    print(f"IPs found: {len(results['ips'])}")
    print(f"Suspicious strings: {len(results['suspicious'])}")

    return results
```

## Disk image analysis

```python
import os
from pathlib import Path
from datetime import datetime

def analyze_prefetch(prefetch_dir):
    """Windows Prefetch analysis — shows recently executed programs."""
    results = []
    for f in Path(prefetch_dir).glob('*.pf'):
        # Extract metadata from filename
        name = f.stem
        parts = name.split('_')
        results.append({
            'executable': parts[0],
            'run_count': parts[-1] if len(parts) > 1 else 'unknown',
            'last_modified': datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
            'size': f.stat().st_size
        })
    return results

def analyze_browser_history(history_path):
    """Parse browser history database (Chrome/SQLite format)."""
    import sqlite3

    results = []
    try:
        conn = sqlite3.connect(history_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT urls.url, urls.title, urls.visit_count,
                   urls.last_visit_time
            FROM urls ORDER BY last_visit_time DESC LIMIT 100
        ''')
        for row in cursor.fetchall():
            results.append({
                'url': row[0],
                'title': row[1],
                'visits': row[2],
                'last_visit': row[3]
            })
        conn.close()
    except Exception as e:
        print(f"Error reading history: {e}")

    return results

def collect_artifacts(image_path, output_dir):
    """Collect key forensic artifacts from a mounted image."""
    artifacts = {
        'prefetch': ['Windows/Prefetch', '*.pf'],
        'event_logs': ['Windows/System32/winevt/Logs', '*.evtx'],
        'recent_docs': ['Users/*/Recent', '*'],
        'recycle_bin': ['$Recycle.Bin', '*'],
        'temp_files': ['Windows/Temp', '*'],
        'hosts': ['Windows/System32/drivers/etc', 'hosts'],
    }

    os.makedirs(output_dir, exist_ok=True)
    collected = {}

    for name, (rel_path, pattern) in artifacts.items():
        src = os.path.join(image_path, rel_path)
        dst = os.path.join(output_dir, name)
        if os.path.exists(src):
            os.makedirs(dst, exist_ok=True)
            # Copy relevant files
            import shutil
            for f in Path(src).glob(pattern):
                if f.is_file():
                    shutil.copy2(f, dst)
                    collected[name] = collected.get(name, 0) + 1
            print(f"  Collected {collected.get(name, 0)} {name} files")

    return collected
```

## Timeline generation

```python
from datetime import datetime
import json

class ForensicTimeline:
    """Build a unified timeline from multiple data sources."""

    def __init__(self):
        self.events = []

    def add_event(self, timestamp, source, event_type, description, details=None):
        self.events.append({
            'timestamp': timestamp,
            'source': source,
            'type': event_type,
            'description': description,
            'details': details or {}
        })

    def add_log_events(self, log_entries, source_name):
        """Add events from parsed log entries."""
        for entry in log_entries:
            self.add_event(
                timestamp=entry.get('timestamp', ''),
                source=source_name,
                event_type=entry.get('type', 'log'),
                description=entry.get('message', str(entry)),
                details=entry
            )

    def add_file_events(self, file_path):
        """Add file system events (created, modified, accessed)."""
        stat = os.stat(file_path)
        self.add_event(
            timestamp=datetime.fromtimestamp(stat.st_mtime).isoformat(),
            source='filesystem',
            event_type='file_modified',
            description=file_path,
            details={'size': stat.st_size, 'mode': stat.st_mode}
        )

    def sort(self):
        self.events.sort(key=lambda x: x['timestamp'])

    def filter_by_time(self, start, end):
        """Filter events within a time window."""
        return [e for e in self.events if start <= e['timestamp'] <= end]

    def filter_by_type(self, event_type):
        return [e for e in self.events if e['type'] == event_type]

    def to_json(self, path):
        self.sort()
        with open(path, 'w') as f:
            json.dump(self.events, f, indent=2)
        print(f"Timeline saved: {len(self.events)} events -> {path}")

    def to_markdown(self, path):
        self.sort()
        with open(path, 'w') as f:
            f.write("# Forensic Timeline\n\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n\n")
            f.write(f"Total events: {len(self.events)}\n\n")
            for event in self.events:
                f.write(f"## {event['timestamp']} [{event['source']}]\n")
                f.write(f"**Type:** {event['type']}\n\n")
                f.write(f"{event['description']}\n\n")
                if event['details']:
                    f.write(f"```\n{json.dumps(event['details'], indent=2)}\n```\n\n")
        print(f"Timeline saved: {len(self.events)} events -> {path}")
```

## Assessment

**Lab Task — Build a forensics toolkit (90 minutes)**

1. Write a log parser that can handle at least 3 formats (syslog, JSON, custom)
2. Build a memory string extractor that finds URLs, IPs, emails, and suspicious commands
3. Create a forensic timeline tool that merges events from multiple sources
4. Generate a report showing the top 10 most suspicious activities
5. Test against provided sample data

**Grading:**
- Multi-format log parser works: 20 pts
- Memory string extraction with IOC identification: 25 pts
- Timeline merges events correctly: 25 pts
- Report is readable and highlights key findings: 15 pts
- Handles large files without crashing: 15 pts

## Evidence

- Your forensics scripts
- Sample output from log parsing
- IOCs extracted from memory dump sample
- Timeline output in markdown format
- Notes on what each finding means from an incident response perspective
