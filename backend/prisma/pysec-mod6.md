# Module 6 — Automation Scripts

Security work is repetitive. You check the same logs every day. You scan the same networks on a schedule. You generate the same reports for the same stakeholders. Python excels at automating this repetition. This module teaches you to build automation scripts that run security checks without manual intervention.

## Why Automation Matters in Security

Security teams are understaffed. The average organization faces thousands of security alerts per day. A human analyst cannot review each one manually. Automation is not a luxury — it is a necessity for any security program that operates at scale.

Consider what happens without automation. Every morning, an analyst logs in and checks the firewall logs for suspicious connections. They scan the network for new devices. They review authentication logs for failed login attempts. They check that critical services are running. Each task takes fifteen minutes. Four tasks per day, five days per week, equals five hours of repetitive work. Automation reduces this to zero — the scripts run on a schedule, generate reports, and only alert the analyst when something needs attention.

The real value of automation is consistency. A human analyst might forget to check a log file during a busy week. An automated script runs every time, on schedule, without fail. It doesn't get tired, distracted, or overwhelmed. It applies the same criteria consistently, which means it catches anomalies that a human might miss simply because they were looking at the wrong thing at the wrong time.

Python is the language of security automation because it reads like pseudocode, has libraries for everything, and runs on every operating system. A Python script that monitors log files can run on a Linux server, a Windows workstation, or a cloud instance. The same script can parse Apache logs, Windows event logs, or custom application logs. This flexibility makes Python the default choice for security automation.

## File Operations

Security scripts read logs, parse configs, write reports, and manage files. Python's file handling is straightforward, but you need to handle encoding, permissions, and error conditions.

### Reading Files

```python
# Basic file reading
with open("/var/log/auth.log", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Reading line by line (memory efficient for large files)
with open("/var/log/auth.log", "r") as f:
    for line in f:
        process_line(line)

# Reading with a buffer (for very large files)
with open("/var/log/auth.log", "r") as f:
    while True:
        chunk = f.read(8192)
        if not chunk:
            break
        process_chunk(chunk)

# Reading binary files
with open("suspicious.exe", "rb") as f:
    data = f.read()
    hex_dump = data.hex()
```

### Writing Files

```python
# Write a report
with open("report.txt", "w") as f:
    f.write("Security Scan Report\n")
    f.write("=" * 40 + "\n")
    for finding in findings:
        f.write(f"[{finding['severity']}] {finding['type']}\n")

# Write JSON
import json

with open("results.json", "w") as f:
    json.dump(results, f, indent=2, default=str)

# Append to a log
with open("scan_history.log", "a") as f:
    f.write(f"{datetime.now().isoformat()} - Scan completed\n")

# Write CSV
import csv

with open("findings.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["severity", "type", "description"])
    writer.writeheader()
    writer.writerows(findings)
```

### File Path Handling

Use `pathlib` for cross-platform path operations:

```python
from pathlib import Path

# Build paths
log_dir = Path("/var/log/security")
scan_results = log_dir / "scans" / "2024"

# Create directories
scan_results.mkdir(parents=True, exist_ok=True)

# Check if file exists
config_file = Path("config.yaml")
if config_file.exists():
    print(f"Config found: {config_file.absolute()}")
else:
    print("Config not found")

# List files with patterns
log_files = list(Path("/var/log").glob("*.log"))
recent_files = [f for f in log_files if f.stat().st_mtime > time.time() - 86400]

# Get file info
for f in log_files:
    print(f"Name: {f.name}")
    print(f"Size: {f.stat().st_size} bytes")
    print(f"Modified: {f.stat().st_mtime}")
```

## Scheduling with cron

Cron runs your scripts on a schedule. Every security automation needs cron.

### Cron Syntax

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, 0=Sunday)
│ │ │ │ │
* * * * * command

# Examples:
# Run every day at 2 AM
0 2 * * * /usr/bin/python3 /opt/scripts/scan.py

# Run every hour
0 * * * * /usr/bin/python3 /opt/scripts/check_logs.py

# Run every 15 minutes
*/15 * * * * /usr/bin/python3 /opt/scripts/monitor.py

# Run Monday-Friday at 8 AM
0 8 * * 1-5 /usr/bin/python3 /opt/scripts/daily_report.py

# Run on the first day of every month at midnight
0 0 1 * * /usr/bin/python3 /opt/scripts/monthly_scan.py
```

### Setting Up Cron from Python

```python
import subprocess
from pathlib import Path

def add_cron_job(schedule, command, comment=None):
    """Add a cron job"""
    crontab_line = f"{schedule} {command}"
    if comment:
        crontab_line = f"# {comment}\n{crontab_line}"

    # Get current crontab
    result = subprocess.run(
        ["crontab", "-l"],
        capture_output=True,
        text=True
    )

    current_crontab = result.stdout if result.returncode == 0 else ""

    # Check if job already exists
    if command in current_crontab:
        print(f"Job already exists: {command}")
        return

    # Add new job
    new_crontab = current_crontab + "\n" + crontab_line + "\n"

    # Write new crontab
    process = subprocess.Popen(
        ["crontab", "-"],
        stdin=subprocess.PIPE,
        text=True
    )
    process.communicate(input=new_crontab)
    print(f"Added cron job: {schedule} {command}")

def remove_cron_job(command):
    """Remove a cron job by command string"""
    result = subprocess.run(
        ["crontab", "-l"],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        return

    lines = result.stdout.split("\n")
    new_lines = [line for line in lines if command not in line]

    process = subprocess.Popen(
        ["crontab", "-"],
        stdin=subprocess.PIPE,
        text=True
    )
    process.communicate(input="\n".join(new_lines))
    print(f"Removed cron job containing: {command}")

# Usage
add_cron_job(
    "0 2 * * *",
    "/usr/bin/python3 /opt/scripts/nightly_scan.py",
    comment="Nightly security scan"
)
```

### Error Handling in Automated Scripts

Automation scripts run unattended, which means errors must be handled without human intervention. A script that crashes at 2 AM and sends no alert is worse than no script at all because it creates a false sense of security.

The fundamental principle is: never let a single failure crash the entire script. Each check should be independent. If the port scan fails, the log analysis should still run. If the email alert fails, the report should still be generated. Wrap each major operation in a try-except block and log the error.

```python
def run_check(check_func, check_name, logger):
    """Run a check with error handling"""
    try:
        result = check_func()
        logger.info(f"{check_name}: completed ({len(result)} findings)")
        return result
    except ConnectionError as e:
        logger.error(f"{check_name}: network error - {e}")
        return []
    except FileNotFoundError as e:
        logger.error(f"{check_name}: file not found - {e}")
        return []
    except Exception as e:
        logger.error(f"{check_name}: unexpected error - {e}")
        return []

# Each check runs independently
findings = []
findings.extend(run_check(check_ports, "Port Scan", logger))
findings.extend(run_check(check_services, "Service Check", logger))
findings.extend(run_check(check_logs, "Log Analysis", logger))
```

Alert fatigue is a real problem. If your script sends an email for every minor finding, analysts start ignoring the alerts. Configure alert thresholds — only send alerts for critical and high severity findings. Medium and low findings go into the report but don't trigger immediate notifications.

Timeout handling is essential for network checks. A port scan that hangs forever blocks all subsequent checks. Set timeouts on every network operation and on the overall check. If a check takes longer than expected, log a warning and move on.

### Systemd Timers (Alternative to Cron)

On modern Linux systems, systemd timers offer more features than cron:

```python
# Generate a systemd timer unit file
timer_unit = """[Unit]
Description=Security Scan Timer
After=network.target

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
"""

service_unit = """[Unit]
Description=Security Scan Service

[Service]
Type=oneshot
User=security
ExecStart=/usr/bin/python3 /opt/scripts/scan.py
StandardOutput=journal
StandardError=journal
"""

# Write the files
from pathlib import Path

Path("/etc/systemd/system/security-scan.timer").write_text(timer_unit)
Path("/etc/systemd/system/security-scan.service").write_text(service_unit)
```

## Logging

Every security script needs proper logging. You need to know what happened, when, and why.

### Basic Logging Setup

```python
import logging
from datetime import datetime
from pathlib import Path

def setup_logging(log_file=None, level=logging.INFO):
    """Configure logging for security scripts"""
    log_format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    handlers = [logging.StreamHandler()]

    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(log_file))

    logging.basicConfig(
        level=level,
        format=log_format,
        datefmt=date_format,
        handlers=handlers
    )

    return logging.getLogger("security")

# Usage
logger = setup_logging("/var/log/security/scan.log")
logger.info("Scan started")
logger.warning("Connection timeout to 192.168.1.50")
logger.error("Failed to parse log file")
```

### Structured Logging

For security analysis, structured logs are more useful than plain text:

```python
import json
import logging
from datetime import datetime

class StructuredFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra fields
        if hasattr(record, "extra_data"):
            log_entry["data"] = record.extra_data

        return json.dumps(log_entry)

def setup_structured_logging(log_file):
    handler = logging.FileHandler(log_file)
    handler.setFormatter(StructuredFormatter())

    logger = logging.getLogger("security")
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

    return logger

# Usage
logger = setup_structured_logging("/var/log/security/structured.log")
logger.info("Scan completed", extra={"extra_data": {
    "target": "192.168.1.0/24",
    "open_ports": [22, 80, 443],
    "duration_seconds": 45
}})
```

### Security Event Logging

Log security-specific events for audit trails:

```python
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

class SecurityEventLogger:
    def __init__(self, log_file):
        self.log_file = Path(log_file)
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

    def log_event(self, event_type: str, details: Dict[str, Any],
                  severity: str = "INFO", source: str = "unknown"):
        event = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "severity": severity,
            "source": source,
            "details": details
        }

        with open(self.log_file, "a") as f:
            f.write(json.dumps(event) + "\n")

    def log_scan_start(self, target, scan_type):
        self.log_event("SCAN_START", {
            "target": target,
            "scan_type": scan_type
        })

    def log_scan_complete(self, target, findings_count, duration):
        self.log_event("SCAN_COMPLETE", {
            "target": target,
            "findings": findings_count,
            "duration_seconds": duration
        })

    def log_finding(self, finding_type, target, details):
        self.log_event("FINDING", {
            "type": finding_type,
            "target": target,
            **details
        }, severity="WARNING" if finding_type in ("SQL_INJECTION", "XSS") else "INFO")

    def log_alert(self, alert_type, message, details=None):
        self.log_event("ALERT", {
            "alert_type": alert_type,
            "message": message,
            "details": details or {}
        }, severity="CRITICAL")

# Usage
event_logger = SecurityEventLogger("/var/log/security/events.jsonl")
event_logger.log_scan_start("192.168.1.0/24", "port_scan")
event_logger.log_finding("OPEN_PORT", "192.168.1.1", {"port": 22, "service": "SSH"})
event_logger.log_scan_complete("192.168.1.0/24", findings_count=5, duration=30)
```

## Configuration Management

Security scripts need configuration — target lists, thresholds, notification settings. Store configuration in files, not in code.

### YAML Configuration

```python
import yaml
from pathlib import Path

DEFAULT_CONFIG = {
    "scan": {
        "targets": ["192.168.1.0/24"],
        "ports": "1-1024",
        "timeout": 3,
        "threads": 100
    },
    "alerting": {
        "enabled": True,
        "email": "admin@company.com",
        "slack_webhook": None,
        "severity_threshold": "MEDIUM"
    },
    "logging": {
        "level": "INFO",
        "file": "/var/log/security/scan.log"
    },
    "scheduling": {
        "port_scan": "0 2 * * *",
        "vuln_scan": "0 3 * * 0",
        "log_analysis": "*/15 * * * *"
    }
}

def load_config(config_file="config.yaml"):
    """Load configuration from YAML file"""
    config_path = Path(config_file)

    if config_path.exists():
        with open(config_path) as f:
            config = yaml.safe_load(f)
    else:
        config = DEFAULT_CONFIG
        save_config(config, config_file)

    return config

def save_config(config, config_file="config.yaml"):
    """Save configuration to YAML file"""
    with open(config_file, "w") as f:
        yaml.dump(config, f, default_flow_style=False)

def get_config_value(config, key_path, default=None):
    """Get nested config value using dot notation"""
    keys = key_path.split(".")
    value = config

    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return default

    return value

# Usage
config = load_config()
targets = get_config_value(config, "scan.targets", ["localhost"])
timeout = get_config_value(config, "scan.timeout", 3)
```

### Environment Variables

Sensitive configuration should come from environment variables, not files:

```python
import os
from pathlib import Path

def load_env_config():
    """Load configuration from environment variables"""
    return {
        "database_url": os.getenv("DATABASE_URL", "postgresql://localhost/security"),
        "api_key": os.getenv("SECURITY_API_KEY"),
        "smtp_password": os.getenv("SMTP_PASSWORD"),
        "slack_token": os.getenv("SLACK_TOKEN"),
    }

def setup_env_file():
    """Create .env file template"""
    env_template = """# Security Tool Configuration
DATABASE_URL=postgresql://localhost/security
SECURITY_API_KEY=your-api-key-here
SMTP_PASSWORD=your-smtp-password
SLACK_TOKEN=your-slack-token
"""
    env_path = Path(".env")
    if not env_path.exists():
        env_path.write_text(env_template)
        print("Created .env file — fill in your values")

# Usage
config = load_env_config()
if not config["api_key"]:
    print("Warning: SECURITY_API_KEY not set")
```

## Real Scenario: Automating Security Checks

Let's build a complete security automation system that runs checks on a schedule, logs results, and sends alerts.

```python
#!/usr/bin/env python3
"""
Automated Security Check System
Runs periodic security checks and generates reports.
"""

import os
import json
import socket
import subprocess
import logging
import smtplib
from datetime import datetime, timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Optional
import yaml

# Configuration
CONFIG_FILE = Path(__file__).parent / "config.yaml"
LOG_DIR = Path("/var/log/security")
REPORT_DIR = Path("/var/reports/security")

DEFAULT_CONFIG = {
    "network": {
        "scan_targets": ["192.168.1.0/24"],
        "critical_ports": [22, 80, 443, 445, 3306, 3389, 5432, 6379, 8080],
        "timeout": 2
    },
    "alerts": {
        "email_enabled": False,
        "email_recipients": [],
        "smtp_server": "smtp.company.com",
        "smtp_port": 587
    },
    "thresholds": {
        "max_failed_logins": 10,
        "max_open_ports_per_host": 20,
        "max_dns_queries_per_minute": 100
    }
}


class SecurityAutomation:
    def __init__(self, config_file=CONFIG_FILE):
        self.config = self._load_config(config_file)
        self._setup_logging()
        self.logger = logging.getLogger("security_auto")

        # Ensure directories exist
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        REPORT_DIR.mkdir(parents=True, exist_ok=True)

    def _load_config(self, config_file):
        config_path = Path(config_file)
        if config_path.exists():
            with open(config_path) as f:
                return yaml.safe_load(f)
        return DEFAULT_CONFIG

    def _setup_logging(self):
        log_file = LOG_DIR / "automation.log"
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s",
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )

    # ---- Port Scanning ----

    def quick_port_scan(self, target: str, ports: List[int]) -> Dict[int, bool]:
        """Quick scan of specific ports"""
        results = {}

        def check_port(port):
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(self.config["network"]["timeout"])
            result = sock.connect_ex((target, port))
            sock.close()
            return port, result == 0

        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = {
                executor.submit(check_port, port): port
                for port in ports
            }
            for future in as_completed(futures):
                port, is_open = future.result()
                results[port] = is_open

        return results

    def check_open_ports(self):
        """Check for unexpected open ports"""
        self.logger.info("Checking open ports...")
        findings = []

        for target in self.config["network"]["scan_targets"]:
            ports = self.config["network"]["critical_ports"]
            results = self.quick_port_scan(target, ports)

            open_ports = [port for port, is_open in results.items() if is_open]

            if len(open_ports) > self.config["thresholds"]["max_open_ports_per_host"]:
                findings.append({
                    "type": "EXCESSIVE_OPEN_PORTS",
                    "severity": "HIGH",
                    "target": target,
                    "details": f"Host has {len(open_ports)} open ports: {open_ports}"
                })

            for port in open_ports:
                self.logger.info(f"  Port {port} open on {target}")

        return findings

    # ---- Service Monitoring ----

    def check_service_availability(self):
        """Check that critical services are running"""
        self.logger.info("Checking service availability...")
        findings = []

        critical_services = {
            "web": ("192.168.1.1", 80),
            "database": ("192.168.1.1", 5432),
            "ssh": ("192.168.1.1", 22),
        }

        for name, (host, port) in critical_services.items():
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((host, port))
            sock.close()

            if result != 0:
                findings.append({
                    "type": "SERVICE_DOWN",
                    "severity": "CRITICAL",
                    "target": f"{host}:{port}",
                    "details": f"Service {name} is not responding"
                })
                self.logger.error(f"Service DOWN: {name} at {host}:{port}")
            else:
                self.logger.info(f"Service OK: {name} at {host}:{port}")

        return findings

    # ---- Log Analysis ----

    def analyze_auth_log(self, log_file="/var/log/auth.log"):
        """Analyze authentication logs for suspicious activity"""
        self.logger.info(f"Analyzing {log_file}...")
        findings = []

        if not Path(log_file).exists():
            self.logger.warning(f"Log file not found: {log_file}")
            return findings

        failed_logins = {}
        recent_cutoff = datetime.now() - timedelta(hours=1)

        with open(log_file, "r", errors="ignore") as f:
            for line in f:
                if "Failed password" in line:
                    # Parse failed login
                    parts = line.split()
                    try:
                        # Find the source IP
                        for i, part in enumerate(parts):
                            if part == "from" and i + 1 < len(parts):
                                ip = parts[i + 1]
                                failed_logins[ip] = failed_logins.get(ip, 0) + 1
                    except (IndexError, ValueError):
                        continue

        # Check thresholds
        threshold = self.config["thresholds"]["max_failed_logins"]
        for ip, count in failed_logins.items():
            if count >= threshold:
                findings.append({
                    "type": "BRUTE_FORCE_ATTEMPT",
                    "severity": "HIGH",
                    "target": ip,
                    "details": f"{count} failed login attempts from {ip}"
                })
                self.logger.warning(f"Brute force detected from {ip}: {count} attempts")

        return findings

    # ---- Configuration Checks ----

    def check_file_permissions(self):
        """Check permissions on sensitive files"""
        self.logger.info("Checking file permissions...")
        findings = []

        sensitive_files = {
            "/etc/passwd": "644",
            "/etc/shadow": "640",
            "/etc/ssh/sshd_config": "600",
        }

        for filepath, expected_mode in sensitive_files.items():
            path = Path(filepath)
            if path.exists():
                import stat
                actual_mode = oct(path.stat().st_mode)[-3:]

                if actual_mode != expected_mode:
                    findings.append({
                        "type": "PERMISSION_ISSUE",
                        "severity": "MEDIUM",
                        "target": filepath,
                        "details": f"Expected {expected_mode}, got {actual_mode}"
                    })
                    self.logger.warning(f"Permission issue: {filepath} is {actual_mode}")

        return findings

    # ---- Reporting ----

    def generate_report(self, findings: List[Dict]) -> str:
        """Generate a security report"""
        report_time = datetime.now().isoformat()
        critical = [f for f in findings if f["severity"] == "CRITICAL"]
        high = [f for f in findings if f["severity"] == "HIGH"]
        medium = [f for f in findings if f["severity"] == "MEDIUM"]

        report = f"""
Security Automation Report
Generated: {report_time}
{'=' * 60}

Summary:
  Critical: {len(critical)}
  High:     {len(high)}
  Medium:   {len(medium)}
  Total:    {len(findings)}

"""

        if findings:
            report += "Findings:\n"
            for i, finding in enumerate(findings, 1):
                report += f"""
  {i}. [{finding['severity']}] {finding['type']}
     Target: {finding['target']}
     Details: {finding['details']}
"""
        else:
            report += "No findings. All checks passed.\n"

        return report

    def send_alert(self, findings: List[Dict]):
        """Send alerts for critical findings"""
        if not self.config["alerts"]["email_enabled"]:
            return

        critical = [f for f in findings if f["severity"] in ("CRITICAL", "HIGH")]
        if not critical:
            return

        subject = f"Security Alert: {len(critical)} critical/high findings"
        body = self.generate_report(critical)

        try:
            smtp = smtplib.SMTP(
                self.config["alerts"]["smtp_server"],
                self.config["alerts"]["smtp_port"]
            )
            smtp.starttls()

            for recipient in self.config["alerts"]["email_recipients"]:
                msg = f"Subject: {subject}\n\n{body}"
                smtp.sendmail("security@company.com", recipient, msg)

            smtp.quit()
            self.logger.info(f"Alert sent to {len(self.config['alerts']['email_recipients'])} recipients")
        except Exception as e:
            self.logger.error(f"Failed to send alert: {e}")

    # ---- Main Execution ----

    def run_all_checks(self):
        """Run all security checks"""
        self.logger.info("=" * 60)
        self.logger.info("Starting security automation run")
        start_time = datetime.now()

        all_findings = []

        # Run each check
        checks = [
            ("Port Scan", self.check_open_ports),
            ("Service Availability", self.check_service_availability),
            ("Auth Log Analysis", self.analyze_auth_log),
            ("File Permissions", self.check_file_permissions),
        ]

        for check_name, check_func in checks:
            try:
                self.logger.info(f"Running: {check_name}")
                findings = check_func()
                all_findings.extend(findings)
                self.logger.info(f"Completed: {check_name} ({len(findings)} findings)")
            except Exception as e:
                self.logger.error(f"Failed: {check_name}: {e}")
                all_findings.append({
                    "type": "CHECK_FAILED",
                    "severity": "MEDIUM",
                    "target": check_name,
                    "details": str(e)
                })

        # Generate report
        duration = (datetime.now() - start_time).total_seconds()
        report = self.generate_report(all_findings)

        # Save report
        report_file = REPORT_DIR / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        report_file.write_text(report)
        self.logger.info(f"Report saved: {report_file}")

        # Send alerts
        self.send_alert(all_findings)

        self.logger.info(f"Security automation completed in {duration:.1f} seconds")
        self.logger.info(f"Total findings: {len(all_findings)}")

        return all_findings


if __name__ == "__main__":
    automation = SecurityAutomation()
    findings = automation.run_all_checks()

    # Print summary
    print("\n" + "=" * 60)
    print("SECURITY CHECK SUMMARY")
    print("=" * 60)
    for f in findings:
        print(f"  [{f['severity']}] {f['type']}: {f['details']}")
    print(f"\nTotal: {len(findings)} findings")
```

Set up the cron job:

```bash
# Make executable
chmod +x /opt/scripts/security_auto.py

# Add to crontab
echo "*/15 * * * * /usr/bin/python3 /opt/scripts/security_auto.py" | crontab -
```

## Assessment

### Lab Task: Security Automation System

Build an automated security check system with scheduling, logging, and reporting. Time limit: 90 minutes.

**Requirements:**
1. Implement at least 3 different security checks (port scan, service check, log analysis)
2. Use proper logging (not just print statements)
3. Generate a formatted report
4. Support configuration via YAML file
5. Run all checks and produce a final report
6. Handle errors gracefully — one failed check shouldn't crash everything

**Deliverables:**
- Source code (`security_auto.py`)
- Configuration file (`config.yaml`)
- Sample output report

**Grading Criteria:**
- Multiple security checks work (30 points)
- Logging is proper and structured (20 points)
- Configuration management works (20 points)
- Report generation works (15 points)
- Error handling is solid (15 points)

### Bonus Challenges

- Add email alerting for critical findings
- Implement a simple web dashboard showing check results
- Add database logging for historical trend analysis
- Create systemd timer unit files for scheduling

## Testing Automation Scripts

Automation scripts run unattended. If they have bugs, the bugs run unattended too. Testing automation is essential because you won't be watching when the script runs at 2 AM.

Unit testing verifies individual functions work correctly. Test your port scanning function against a known target. Test your log parsing function against a sample log file. Test your report generation function with known inputs. Each test should have a clear assertion — "this function should return exactly these results for this input."

Integration testing verifies that components work together. Run the complete automation script against a test environment. Verify that it reads configuration correctly, runs checks without errors, generates a valid report, and sends alerts if configured. The test environment should mimic production closely enough to catch environment-specific issues.

Error injection testing verifies that your script handles failures gracefully. What happens when the network is unreachable? When a log file doesn't exist? When the SMTP server is down? When the disk is full? Your script should log the error, continue with remaining checks, and exit with a clear error message. It should never crash silently.

Regression testing verifies that changes don't break existing functionality. When you add a new check to your automation script, run the complete test suite to ensure existing checks still work. Version control helps here — you can compare current behavior with previous versions.

## Evidence

Automation is force multiplication. One security analyst running manual checks can cover a small network. The same analyst with automated checks can monitor an entire enterprise. The scripts you built here — port monitors, service checkers, log analyzers — are the building blocks of a security operations center.

The key lesson is that automation isn't just about saving time. It's about consistency. A manual check happens when someone remembers to do it. An automated check happens every time, on schedule, without fail. That consistency is what catches the 3 AM breach.

**Libraries covered:** socket, subprocess, logging, yaml, json, csv, pathlib, smtplib, concurrent.futures

**Concepts covered:** File operations, cron scheduling, structured logging, configuration management, service monitoring, report generation, email alerting