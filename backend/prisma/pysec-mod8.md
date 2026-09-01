# Module 8 — Forensics Scripts

Digital forensics is the process of collecting, preserving, and analyzing digital evidence. When a security incident happens, you need to reconstruct what happened from the artifacts left behind — log files, memory dumps, disk images, and network captures. Python is the go-to language for forensic analysis because it lets you parse binary formats, extract patterns, and generate timelines at scale.

## Log Parsing

Logs are the bread and butter of forensics. Every system generates them — auth logs, web server logs, DNS logs, application logs. The challenge is parsing inconsistent formats and extracting meaningful information.

### Apache/Nginx Access Logs

```python
import re
from datetime import datetime
from collections import Counter, defaultdict

# Combined log format
LOG_PATTERN = re.compile(
    r'(?P<ip>[\d\.]+)\s+-\s+'
    r'(?P<user>\S+)\s+'
    r'\[(?P<timestamp>[^\]]+)\]\s+'
    r'"(?P<method>\w+)\s+(?P<path>\S+)\s+(?P<protocol>\S+)"\s+'
    r'(?P<status>\d{3})\s+'
    r'(?P<size>\d+|-)\s+'
    r'"(?P<referrer>[^"]*)"\s+'
    r'"(?P<user_agent>[^"]*)"'
)

def parse_apache_log(log_file):
    entries = []

    with open(log_file, "r", errors="ignore") as f:
        for line in f:
            match = LOG_PATTERN.match(line)
            if match:
                entry = match.groupdict()
                entry["status"] = int(entry["status"])
                entry["size"] = int(entry["size"]) if entry["size"] != "-" else 0
                entry["timestamp"] = datetime.strptime(
                    entry["timestamp"], "%d/%b/%Y:%H:%M:%S %z"
                )
                entries.append(entry)

    return entries

def analyze_web_log(entries):
    stats = {
        "total_requests": len(entries),
        "unique_ips": set(),
        "status_codes": Counter(),
        "paths": Counter(),
        "user_agents": Counter(),
        "methods": Counter(),
        "suspicious": []
    }

    for entry in entries:
        stats["unique_ips"].add(entry["ip"])
        stats["status_codes"][entry["status"]] += 1
        stats["paths"][entry["path"]] += 1
        stats["user_agents"][entry["user_agent"]] += 1
        stats["methods"][entry["method"]] += 1

        # Detect suspicious patterns
        suspicious_patterns = [
            (r"(\.\./)+", "Path traversal"),
            (r"<script", "XSS attempt"),
            (r"union\s+select", "SQL injection"),
            (r"/etc/passwd", "File inclusion"),
            (r"\.env", "Config file access"),
            (r"\.git", "Git directory access"),
            (r"wp-admin|wp-login", "WordPress probing"),
            (r"phpmyadmin", "phpMyAdmin probing"),
        ]

        for pattern, description in suspicious_patterns:
            if re.search(pattern, entry["path"], re.IGNORECASE):
                stats["suspicious"].append({
                    "ip": entry["ip"],
                    "path": entry["path"],
                    "type": description,
                    "timestamp": entry["timestamp"]
                })

    stats["unique_ips"] = len(stats["unique_ips"])
    return stats

# Usage
entries = parse_apache_log("/var/log/apache2/access.log")
stats = analyze_web_log(entries)

print(f"Total requests: {stats['total_requests']}")
print(f"Unique IPs: {stats['unique_ips']}")
print(f"Status codes: {dict(stats['status_codes'])}")
print(f"Suspicious requests: {len(stats['suspicious'])}")

for s in stats["suspicious"][:10]:
    print(f"  {s['timestamp']} {s['ip']} - {s['type']}: {s['path']}")
```

### Correlating Evidence Across Sources

The real power of forensic analysis comes from correlating evidence across multiple sources. A single log entry tells you something happened. Multiple log entries from different sources tell you a story.

Consider a typical compromise scenario. The authentication log shows a failed login, then a successful login from the same IP. The web server log shows a request for the admin panel from the same IP thirty seconds later. The process log shows a new process spawned by the web server user. The network log shows an outbound connection to an unknown IP. Each event alone is unremarkable. Together, they tell a story of credential theft, unauthorized access, and data exfiltration.

Correlation requires timestamps. Every log source must have accurate, synchronized timestamps. Use NTP to synchronize clocks across systems. When correlating events, account for clock skew — a few seconds of difference between systems is normal. Events within a few seconds of each other on different systems might be causally related.

Correlation also requires context. An IP address alone doesn't tell you much. But an IP address combined with a username, a process name, and a destination domain tells you exactly what happened. Build your correlation logic to match on multiple fields, not just one.

The timeline you built in this module is a correlation tool. It merges events from different sources into a single chronological view. When you see an authentication event followed immediately by a process creation event followed by a network connection, the sequence suggests compromise. The timeline makes these sequences visible.

### Windows Event Logs

Windows event logs are XML-based. You can parse them with Python:

```python
import xml.etree.ElementTree as ET
from datetime import datetime
from collections import Counter

def parse_windows_event_log(evtx_file):
    """Parse Windows Event Log (EVTX format)"""
    # Note: For actual EVTX files, use libevtx or python-evtx
    # This works with exported XML files

    tree = ET.parse(evtx_file)
    root = tree.getroot()

    events = []
    ns = {"e": "http://schemas.microsoft.com/win/2004/08/events/event"}

    for event in root.findall(".//e:Event", ns):
        system = event.find("e:System", ns)
        if system is None:
            continue

        event_id = system.findtext("e:EventID", namespaces=ns)
        time_created = system.findtext("e:TimeCreated/@SystemTime", namespaces=ns)
        channel = system.findtext("e:Channel", namespaces=ns)
        level = system.findtext("e:Level", namespaces=ns)

        # Get event data
        data = {}
        event_data = event.find(".//e:EventData", ns)
        if event_data is not None:
            for data_item in event_data.findall("e:Data", ns):
                name = data_item.get("Name")
                value = data_item.text
                if name and value:
                    data[name] = value

        events.append({
            "event_id": int(event_id) if event_id else 0,
            "time": time_created,
            "channel": channel,
            "level": int(level) if level else 0,
            "data": data
        })

    return events

def analyze_event_logs(events):
    """Analyze Windows event logs for suspicious activity"""
    findings = []

    # Suspicious event IDs
    suspicious_ids = {
        4625: "Failed logon",
        4648: "Explicit credential logon",
        4672: "Special privileges assigned",
        4688: "New process created",
        4697: "Service installed",
        4698: "Scheduled task created",
        4720: "User account created",
        4722: "User account enabled",
        4732: "Member added to local group",
        4776: "NTLM authentication",
        1102: "Audit log cleared",
    }

    event_counter = Counter()
    failed_logons = []

    for event in events:
        event_counter[event["event_id"]] += 1

        # Track failed logons
        if event["event_id"] == 4625:
            target_user = event["data"].get("TargetUserName", "Unknown")
            source_ip = event["data"].get("IpAddress", "Unknown")
            failed_logons.append({
                "time": event["time"],
                "user": target_user,
                "source_ip": source_ip
            })

        # Alert on suspicious events
        if event["event_id"] in suspicious_ids:
            description = suspicious_ids[event["event_id"]]
            if event["event_id"] in (1102, 4697, 4698, 4720):
                findings.append({
                    "type": description,
                    "severity": "HIGH",
                    "time": event["time"],
                    "details": event["data"]
                })

    # Detect brute force
    if len(failed_logons) > 10:
        findings.append({
            "type": "Potential brute force",
            "severity": "HIGH",
            "count": len(failed_logons),
            "accounts": set(fl["user"] for fl in failed_logons)
        })

    return findings, event_counter

# Usage (with exported XML)
events = parse_windows_event_log("exported_events.xml")
findings, counter = analyze_event_logs(events)

print("Event ID distribution:")
for eid, count in counter.most_common(20):
    description = ""
    if eid in suspicious_ids:
        description = f" - {suspicious_ids[eid]}"
    print(f"  {eid}: {count}{description}")

print(f"\nFindings: {len(findings)}")
for f in findings:
    print(f"  [{f['severity']}] {f['type']}")
```

## Memory Analysis Basics

Memory forensics extracts evidence from RAM dumps. A running system's memory contains network connections, running processes, encryption keys, and malware artifacts that never touch the disk.

### Basic Memory Analysis with Volatility

```python
import subprocess
import json
from pathlib import Path

class MemoryAnalyzer:
    def __init__(self, memory_dump, volatility_path="volatility3"):
        self.memory_dump = Path(memory_dump)
        self.volatility = volatility_path

    def run_plugin(self, plugin, additional_args=""):
        """Run a Volatility plugin"""
        cmd = f"{self.volatility} -f {self.memory_dump} {plugin} {additional_args}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout

    def list_processes(self):
        """List running processes"""
        output = self.run_plugin("windows.pslist")
        return output

    def list_network_connections(self):
        """List network connections"""
        output = self.run_plugin("windows.netscan")
        return output

    def extract_command_history(self):
        """Extract command history"""
        output = self.run_plugin("cmdline")
        return output

    def extract_dlls(self):
        """List loaded DLLs"""
        output = self.run_plugin("windows.dlllist")
        return output

    def check_injection(self):
        """Check for process injection"""
        output = self.run_plugin("windows.malfind")
        return output

    def extract_hashes(self):
        """Extract password hashes"""
        output = self.run_plugin("windows.hashdump")
        return output

    def full_analysis(self):
        """Run comprehensive analysis"""
        results = {}

        plugins = [
            ("processes", "windows.pslist"),
            ("network", "windows.netscan"),
            ("cmdlines", "cmdline"),
            ("handles", "windows.handles"),
            ("malfind", "windows.malfind"),
        ]

        for name, plugin in plugins:
            print(f"Running {name}...")
            results[name] = self.run_plugin(plugin)

        return results

# Usage
analyzer = MemoryAnalyzer("memory.dmp")
processes = analyzer.list_processes()
print(processes)
```

### Manual Memory Analysis

When Volatility isn't available, you can do basic analysis manually:

```python
import re
from collections import Counter

def extract_strings_from_memory(memory_dump, min_length=4):
    """Extract ASCII strings from memory dump"""
    strings = []

    with open(memory_dump, "rb") as f:
        data = f.read()

    # Extract ASCII strings
    current_string = ""
    for byte in data:
        if 32 <= byte <= 126:  # Printable ASCII
            current_string += chr(byte)
        else:
            if len(current_string) >= min_length:
                strings.append(current_string)
            current_string = ""

    return strings

def analyze_memory_strings(strings):
    """Analyze extracted strings for suspicious content"""
    findings = []

    patterns = {
        "IP addresses": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
        "URLs": r"https?://[^\s]+",
        "File paths": r"[A-Z]:\\[^\s]+",
        "Registry keys": r"HK(?:LM|CU|U|CR)\\[^\s]+",
        "Email addresses": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        "Passwords": r"(?:password|passwd|pwd)\s*[=:]\s*\S+",
    }

    for name, pattern in patterns.items():
        matches = re.findall(pattern, "\n".join(strings))
        if matches:
            findings.append({
                "type": name,
                "count": len(matches),
                "samples": matches[:5]
            })

    return findings

# Usage
strings = extract_strings_from_memory("memory.dump")
findings = analyze_memory_strings(strings)

for f in findings:
    print(f"\n{f['type']} ({f['count']} found):")
    for sample in f["samples"]:
        print(f"  {sample}")
```

## File Carving

File carving extracts files from raw disk images or memory dumps. When a file is deleted, the data often remains on disk — the filesystem just marks the space as available.

### Carving Files by Header/Footer

```python
import struct
from pathlib import Path

# File signatures (magic bytes)
FILE_SIGNATURES = {
    "jpg": {
        "header": b"\xff\xd8\xff",
        "footer": b"\xff\xd9",
    },
    "png": {
        "header": b"\x89PNG\r\n\x1a\n",
        "footer": b"IEND\xaeB`\x82",
    },
    "pdf": {
        "header": b"%PDF",
        "footer": b"%%EOF",
    },
    "zip": {
        "header": b"PK\x03\x04",
        "footer": b"PK\x05\x06",  # End of central directory
    },
    "gif": {
        "header": b"GIF89a",
        "footer": b"\x00;",
    },
    "docx": {
        "header": b"PK\x03\x04",  # DOCX is a ZIP file
        "footer": b"PK\x05\x06",
    },
    "exe": {
        "header": b"MZ",
        "footer": None,  # No reliable footer
    },
}

def carve_files(image_path, output_dir, file_type=None):
    """Carve files from a raw disk image"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    with open(image_path, "rb") as f:
        data = f.read()

    carved_files = []

    types_to_carve = [file_type] if file_type else FILE_SIGNATURES.keys()

    for ftype in types_to_carve:
        if ftype not in FILE_SIGNATURES:
            continue

        sig = FILE_SIGNATURES[ftype]
        header = sig["header"]
        footer = sig["footer"]

        start = 0
        file_count = 0

        while True:
            # Find header
            header_pos = data.find(header, start)
            if header_pos == -1:
                break

            # Find footer
            if footer:
                footer_pos = data.find(footer, header_pos)
                if footer_pos == -1:
                    break
                file_data = data[header_pos:footer_pos + len(footer)]
            else:
                # No footer — extract a reasonable chunk
                file_data = data[header_pos:header_pos + 1024 * 1024]  # 1MB max

            # Save carved file
            filename = f"{ftype}_{file_count:04d}.{ftype}"
            filepath = output_path / filename
            filepath.write_bytes(file_data)

            carved_files.append({
                "type": ftype,
                "offset": header_pos,
                "size": len(file_data),
                "filename": filename
            })

            print(f"Carved: {filename} ({len(file_data)} bytes) at offset {header_pos}")
            file_count += 1
            start = header_pos + len(file_data)

    return carved_files

# Usage
files = carve_files("disk_image.raw", "carved_files/")
print(f"\nCarved {len(files)} files")
```

## Timeline Generation

Timelines reconstruct the sequence of events during an incident. They correlate artifacts from multiple sources into a unified chronological view.

```python
from datetime import datetime
from pathlib import Path
import json
import csv

class ForensicTimeline:
    def __init__(self):
        self.events = []

    def add_event(self, timestamp, source, event_type, details, artifact=None):
        """Add an event to the timeline"""
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.fromisoformat(timestamp)
            except ValueError:
                return

        self.events.append({
            "timestamp": timestamp,
            "source": source,
            "type": event_type,
            "details": details,
            "artifact": artifact
        })

    def add_log_event(self, log_entry, source="log"):
        """Add an event from a parsed log entry"""
        self.add_event(
            timestamp=log_entry.get("timestamp"),
            source=source,
            event_type=log_entry.get("type", "unknown"),
            details=log_entry.get("message", ""),
            artifact=log_entry.get("file")
        )

    def add_file_event(self, filepath, event_type):
        """Add a file system event"""
        path = Path(filepath)
        if path.exists():
            stat = path.stat()
            self.add_event(
                timestamp=datetime.fromtimestamp(stat.st_mtime),
                source="filesystem",
                event_type=event_type,
                details=f"{filepath} modified",
                artifact=filepath
            )

    def sort(self):
        """Sort events chronologically"""
        self.events.sort(key=lambda x: x["timestamp"])

    def filter_by_time(self, start, end):
        """Filter events within a time range"""
        return [
            e for e in self.events
            if start <= e["timestamp"] <= end
        ]

    def filter_by_type(self, event_type):
        """Filter events by type"""
        return [e for e in self.events if e["type"] == event_type]

    def export_csv(self, filepath):
        """Export timeline to CSV"""
        with open(filepath, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=[
                "timestamp", "source", "type", "details", "artifact"
            ])
            writer.writeheader()
            for event in sorted(self.events, key=lambda x: x["timestamp"]):
                row = event.copy()
                row["timestamp"] = row["timestamp"].isoformat()
                writer.writerow(row)

    def export_html(self, filepath):
        """Export timeline as HTML report"""
        sorted_events = sorted(self.events, key=lambda x: x["timestamp"])

        html = """<!DOCTYPE html>
<html>
<head><title>Forensic Timeline</title></head>
<body>
<h1>Forensic Timeline</h1>
<table border="1">
<tr><th>Time</th><th>Source</th><th>Type</th><th>Details</th></tr>
"""
        for event in sorted_events:
            html += f"""<tr>
<td>{event['timestamp']}</td>
<td>{event['source']}</td>
<td>{event['type']}</td>
<td>{event['details']}</td>
</tr>
"""
        html += "</table></body></html>"

        Path(filepath).write_text(html)

    def print_summary(self):
        """Print timeline summary"""
        sorted_events = sorted(self.events, key=lambda x: x["timestamp"])

        print(f"Timeline: {len(sorted_events)} events")
        print(f"Time range: {sorted_events[0]['timestamp']} to {sorted_events[-1]['timestamp']}")
        print()

        for event in sorted_events:
            print(f"  {event['timestamp']} [{event['source']}] {event['type']}: {event['details']}")

# Usage
timeline = ForensicTimeline()

# Add events from different sources
timeline.add_event("2024-01-15T10:00:00", "auth.log", "LOGIN_FAILED",
                   "Failed login from 192.168.1.100")
timeline.add_event("2024-01-15T10:05:00", "auth.log", "LOGIN_SUCCESS",
                   "Successful login from 192.168.1.100")
timeline.add_event("2024-01-15T10:10:00", "process", "PROCESS_CREATE",
                   "Suspicious process: cmd.exe /c whoami")
timeline.add_event("2024-01-15T10:15:00", "network", "CONNECTION",
                   "Outbound connection to 10.0.0.50:4444")

timeline.sort()
timeline.print_summary()
timeline.export_csv("timeline.csv")
timeline.export_html("timeline.html")
```

## Real Scenario: Building a Log Analyzer

Combine everything into a comprehensive log analyzer for security investigations:

```python
#!/usr/bin/env python3
"""
Forensic Log Analyzer
Analyzes multiple log sources and generates an investigation report.
"""

import re
import json
import csv
from datetime import datetime, timedelta
from pathlib import Path
from collections import Counter, defaultdict
from typing import List, Dict, Any, Optional

class ForensicLogAnalyzer:
    def __init__(self):
        self.findings = []
        self.timeline = []
        self.iocs = {
            "ips": Counter(),
            "domains": Counter(),
            "file_hashes": [],
            "suspicious_paths": [],
        }

    def analyze_auth_log(self, filepath):
        """Analyze Linux auth log"""
        if not Path(filepath).exists():
            return

        failed_logins = defaultdict(list)
        sudo_usage = []
        ssh_connections = []

        with open(filepath, "r", errors="ignore") as f:
            for line in f:
                # Failed password
                if "Failed password" in line:
                    match = re.search(
                        r'Failed password for (?:invalid user )?(\S+) from ([\d\.]+)',
                        line
                    )
                    if match:
                        user, ip = match.groups()
                        failed_logins[ip].append(user)
                        self.iocs["ips"][ip] += 1
                        self.timeline.append({
                            "time": self._parse_timestamp(line),
                            "source": "auth.log",
                            "event": "LOGIN_FAILED",
                            "details": f"User: {user}, IP: {ip}"
                        })

                # Successful login
                if "Accepted" in line:
                    match = re.search(
                        r'Accepted (\S+) for (\S+) from ([\d\.]+)',
                        line
                    )
                    if match:
                        method, user, ip = match.groups()
                        self.iocs["ips"][ip] += 1
                        self.timeline.append({
                            "time": self._parse_timestamp(line),
                            "source": "auth.log",
                            "event": "LOGIN_SUCCESS",
                            "details": f"User: {user}, IP: {ip}, Method: {method}"
                        })

                # Sudo usage
                if "sudo:" in line:
                    sudo_usage.append(line.strip())

        # Detect brute force
        for ip, users in failed_logins.items():
            if len(users) >= 5:
                self.findings.append({
                    "type": "BRUTE_FORCE",
                    "severity": "HIGH",
                    "ip": ip,
                    "attempts": len(users),
                    "target_users": list(set(users))
                })

    def analyze_web_log(self, filepath):
        """Analyze web server access log"""
        if not Path(filepath).exists():
            return

        log_pattern = re.compile(
            r'([\d\.]+)\s+-\s+\S+\s+\[([^\]]+)\]\s+'
            r'"(\w+)\s+(\S+)\s+\S+"\s+(\d{3})\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"'
        )

        status_codes = Counter()
        suspicious_requests = []

        with open(filepath, "r", errors="ignore") as f:
            for line in f:
                match = log_pattern.match(line)
                if not match:
                    continue

                ip, timestamp, method, path, status, size, referrer, ua = match.groups()
                status = int(status)
                status_codes[status] += 1
                self.iocs["ips"][ip] += 1

                # Check for suspicious patterns
                suspicious_patterns = [
                    (r"\.\./", "PATH_TRAVERSAL"),
                    (r"<script", "XSS_ATTEMPT"),
                    (r"union\s+select", "SQLI_ATTEMPT"),
                    (r"/etc/passwd", "FILE_INCLUSION"),
                    (r"\.env\b", "SENSITIVE_FILE"),
                    (r"\.git", "GIT_ACCESS"),
                    (r"cmd=|exec=", "COMMAND_INJECTION"),
                ]

                for pattern, attack_type in suspicious_patterns:
                    if re.search(pattern, path, re.IGNORECASE):
                        self.findings.append({
                            "type": attack_type,
                            "severity": "HIGH",
                            "ip": ip,
                            "path": path,
                            "status": status
                        })
                        self.timeline.append({
                            "time": self._parse_timestamp_web(timestamp),
                            "source": "web.log",
                            "event": attack_type,
                            "details": f"IP: {ip}, Path: {path}"
                        })
                        break

        # Report on 4xx/5xx errors
        error_count = sum(v for k, v in status_codes.items() if k >= 400)
        if error_count > 100:
            self.findings.append({
                "type": "HIGH_ERROR_RATE",
                "severity": "MEDIUM",
                "count": error_count,
                "distribution": dict(status_codes)
            })

    def analyze_dns_log(self, filepath):
        """Analyze DNS query log"""
        if not Path(filepath).exists():
            return

        queries = []

        with open(filepath, "r", errors="ignore") as f:
            for line in f:
                # Parse DNS query (format varies by resolver)
                match = re.search(r'query:\s+(\S+)\s+from\s+([\d\.]+)', line)
                if match:
                    domain, client_ip = match.groups()
                    queries.append({"domain": domain, "ip": client_ip})
                    self.iocs["domains"][domain] += 1

        # Detect suspicious DNS patterns
        for domain, count in self.iocs["domains"].items():
            # High query count for single domain
            if count > 50:
                self.findings.append({
                    "type": "HIGH_DNS_VOLUME",
                    "severity": "MEDIUM",
                    "domain": domain,
                    "query_count": count
                })

            # Potential DNS tunneling (long subdomain)
            parts = domain.split(".")
            for part in parts:
                if len(part) > 50:
                    self.findings.append({
                        "type": "DNS_TUNNEL_SUSPECT",
                        "severity": "HIGH",
                        "domain": domain,
                        "reason": f"Unusually long label: {part[:30]}..."
                    })
                    break

    def analyze_process_log(self, filepath):
        """Analyze process execution logs"""
        if not Path(filepath).exists():
            return

        suspicious_commands = [
            "whoami", "ipconfig", "ifconfig", "net user",
            "net localgroup", "systeminfo", "tasklist",
            "certutil", "bitsadmin", "powershell -enc",
            "cmd /c", "/bin/sh", "/bin/bash",
        ]

        with open(filepath, "r", errors="ignore") as f:
            for line in f:
                line_lower = line.lower()
                for cmd in suspicious_commands:
                    if cmd.lower() in line_lower:
                        self.findings.append({
                            "type": "SUSPICIOUS_PROCESS",
                            "severity": "MEDIUM",
                            "command": line.strip(),
                            "matched_pattern": cmd
                        })
                        break

    def generate_iocs(self):
        """Generate indicators of compromise"""
        ioc_report = {
            "high_frequency_ips": [
                ip for ip, count in self.iocs["ips"].most_common(10)
                if count > 10
            ],
            "suspicious_domains": [
                domain for domain, count in self.iocs["domains"].most_common(10)
                if count > 5
            ],
        }
        return ioc_report

    def generate_report(self):
        """Generate complete forensic report"""
        # Sort timeline
        self.timeline.sort(key=lambda x: x.get("time", ""))

        report = {
            "generated": datetime.now().isoformat(),
            "summary": {
                "total_findings": len(self.findings),
                "critical": len([f for f in self.findings if f.get("severity") == "CRITICAL"]),
                "high": len([f for f in self.findings if f.get("severity") == "HIGH"]),
                "medium": len([f for f in self.findings if f.get("severity") == "MEDIUM"]),
                "timeline_events": len(self.timeline),
            },
            "findings": self.findings,
            "timeline": self.timeline,
            "iocs": self.generate_iocs()
        }

        return report

    def export_report(self, output_dir):
        """Export report in multiple formats"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        report = self.generate_report()

        # JSON report
        with open(output_path / "report.json", "w") as f:
            json.dump(report, f, indent=2, default=str)

        # CSV findings
        with open(output_path / "findings.csv", "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["type", "severity", "details"])
            writer.writeheader()
            for finding in self.findings:
                writer.writerow({
                    "type": finding["type"],
                    "severity": finding["severity"],
                    "details": json.dumps({k: v for k, v in finding.items()
                                          if k not in ("type", "severity")})
                })

        # Text timeline
        with open(output_path / "timeline.txt", "w") as f:
            for event in self.timeline:
                f.write(f"{event.get('time', 'N/A')} [{event['source']}] "
                       f"{event['event']}: {event['details']}\n")

        print(f"Report exported to {output_path}")

    def _parse_timestamp(self, log_line):
        """Parse timestamp from syslog format"""
        match = re.match(r'(\w+\s+\d+\s+[\d:]+)', log_line)
        if match:
            try:
                return datetime.strptime(match.group(1), "%b %d %H:%M:%S")
            except ValueError:
                pass
        return None

    def _parse_timestamp_web(self, timestamp_str):
        """Parse Apache timestamp format"""
        try:
            return datetime.strptime(timestamp_str, "%d/%b/%Y:%H:%M:%S %z")
        except ValueError:
            return None

# Usage
analyzer = ForensicLogAnalyzer()

# Analyze different log sources
analyzer.analyze_auth_log("/var/log/auth.log")
analyzer.analyze_web_log("/var/log/apache2/access.log")
analyzer.analyze_dns_log("/var/log/dns.log")

# Generate and export report
report = analyzer.generate_report()
print(json.dumps(report["summary"], indent=2))

analyzer.export_report("forensic_report/")
```

## Assessment

### Lab Task: Log Analysis Investigation

Analyze a set of log files from a security incident. Time limit: 90 minutes.

**Requirements:**
1. Parse at least 2 different log formats (auth log + web log)
2. Extract all IP addresses and count their frequency
3. Detect at least 3 different attack patterns (brute force, XSS, path traversal, etc.)
4. Build a timeline of events
5. Generate IOCs (Indicators of Compromise)
6. Export findings to CSV and JSON

**Deliverables:**
- Analysis script (`forensic_analyzer.py`)
- Timeline file (CSV or JSON)
- Written summary of findings

**Grading Criteria:**
- Correctly parses log formats (20 points)
- Detects brute force attacks (20 points)
- Detects web attacks (20 points)
- Timeline is chronologically ordered (15 points)
- IOCs are identified (15 points)
- Export formats work (10 points)

### Bonus Challenges

- Carve deleted files from a disk image
- Analyze Windows event logs (EVTX)
- Correlate events across multiple log sources
- Generate a graphical timeline

## Evidence Preservation

Forensic analysis depends on evidence integrity. If you modify the original evidence during analysis, your findings are worthless in court and unreliable in incident response. Evidence preservation is not optional — it's a professional obligation.

Chain of custody documents who handled the evidence, when, and what they did with it. Every time you copy a log file, analyze a disk image, or extract a memory dump, document the action. Include the timestamp, the person performing the action, the tool used, and the hash of the original and copy. This documentation proves the evidence hasn't been tampered with.

Work with copies, never originals. When you receive a pcap file, make a copy and analyze the copy. When you receive a disk image, mount it read-only and create a working copy. When you analyze log files, copy them to your analysis directory first. The originals should remain untouched throughout the investigation.

Hash verification proves evidence integrity. Calculate MD5 and SHA-256 hashes of original evidence before analysis. Recalculate hashes after analysis. If the hashes match, the evidence wasn't modified. If they don't match, something changed the evidence, and your findings are unreliable.

The tools you built in this module — log analyzers, timeline generators, IOC extractors — operate on copies. They read log files and produce reports. They don't modify the originals. This design is intentional. Forensic tools should be read-only by default.

## Evidence

Forensic analysis is how you prove what happened. In incident response, legal proceedings, or compliance audits, the evidence you extract from logs and system artifacts tells the story. The tools you built here — log parsers, timeline generators, IOC extractors — are the same ones used in professional forensic investigations.

The key skill is not just parsing logs, but correlating them. A failed login means nothing alone. A failed login followed by a successful login followed by a suspicious process execution followed by an outbound connection tells a story of compromise.

**Libraries covered:** re, json, csv, xml.etree.ElementTree, pathlib, collections, datetime

**Concepts covered:** Log parsing, regex pattern matching, file carving, timeline generation, IOC extraction, memory analysis basics, Windows event logs