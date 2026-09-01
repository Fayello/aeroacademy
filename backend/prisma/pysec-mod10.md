# Module 10: Building Custom Security Tools

You've spent nine modules learning individual techniques. This module teaches you to package them into professional, reusable tools. A security tool isn't just a script: it has a CLI interface, configuration management, error handling, plugins, and distribution. This module covers the software engineering practices that turn scripts into tools.

## Why Build Custom Security Tools

Commercial security tools are expensive and generic. They scan for known vulnerabilities using standardized checks. They produce reports that look impressive but often miss context-specific risks. They cannot adapt to your unique environment, your specific threat model, or your particular investigation needs.

Custom tools solve problems that commercial tools cannot. Maybe you need a scanner that integrates with your ticketing system, creating Jira tickets for each finding automatically. Maybe you need a log analyzer that correlates events across multiple proprietary systems. Maybe you need a forensics tool that parses a custom file format specific to your industry. These are problems that no commercial tool addresses because they are specific to your organization.

Building custom tools also deepens your understanding of security. When you implement a port scanner, you learn exactly how TCP connections work. When you build a web vulnerability scanner, you understand HTTP at a protocol level. When you create a malware analyzer, you see how malicious code is structured. The implementation teaches you more than using someone else's tool ever could.

The final reason is career growth. Security professionals who can build tools are more valuable than those who can only use them. Tool building demonstrates programming skill, security knowledge, and the ability to solve novel problems. These are the skills that distinguish senior engineers from junior analysts. The tools you build become portfolio pieces that demonstrate your capabilities to employers and clients.

## Plugin Architecture

Real security tools are extensible. You don't hardcode every check: you define a plugin interface and let users add their own. This is how Nessus, Metasploit, and Burp Suite work.

### Base Plugin Interface

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class SecurityPlugin(ABC):
    """Base class for all security plugins"""

    @property
    @abstractmethod
    def name(self) -> str:
        """Plugin name"""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Plugin description"""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """Plugin version"""
        pass

    @abstractmethod
    def run(self, target: str, options: Optional[Dict] = None) -> List[Dict]:
        """
        Run the plugin against a target.

        Args:
            target: Target to scan (IP, URL, file path, etc.)
            options: Plugin-specific options

        Returns:
            List of findings, each a dict with at least 'type', 'severity', 'details'
        """
        pass

    def validate_options(self, options: Dict) -> bool:
        """Validate plugin options. Override for custom validation."""
        return True

    def __repr__(self):
        return f"<Plugin: {self.name} v{self.version}>"
```

### Plugin Loader

```python
import importlib
import pkgutil
from pathlib import Path
from typing import Dict

class PluginManager:
    """Dynamic plugin loader and manager"""

    def __init__(self, plugin_dir="plugins"):
        self.plugin_dir = Path(plugin_dir)
        self.plugins: Dict[str, SecurityPlugin] = {}

    def discover_plugins(self):
        """Discover and load all plugins in the plugin directory"""
        if not self.plugin_dir.exists():
            self.plugin_dir.mkdir(parents=True)

        # Add plugin directory to Python path
        import sys
        sys.path.insert(0, str(self.plugin_dir.parent))

        for module_info in pkgutil.iter_modules([str(self.plugin_dir)]):
            module_name = module_info.name
            if module_name.startswith("_"):
                continue

            try:
                module = importlib.import_module(f"{self.plugin_dir.name}.{module_name}")

                # Find plugin classes in the module
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if (isinstance(attr, type) and
                        issubclass(attr, SecurityPlugin) and
                        attr is not SecurityPlugin):

                        plugin = attr()
                        self.plugins[plugin.name] = plugin
                        print(f"  Loaded plugin: {plugin.name} v{plugin.version}")

            except Exception as e:
                print(f"  Failed to load {module_name}: {e}")

    def get_plugin(self, name: str) -> SecurityPlugin:
        """Get a plugin by name"""
        return self.plugins.get(name)

    def list_plugins(self):
        """List all loaded plugins"""
        for name, plugin in self.plugins.items():
            print(f"  {name} v{plugin.version}: {plugin.description}")

    def run_plugin(self, name: str, target: str, options: Dict = None):
        """Run a specific plugin"""
        plugin = self.get_plugin(name)
        if not plugin:
            raise ValueError(f"Plugin not found: {name}")

        if options and not plugin.validate_options(options):
            raise ValueError(f"Invalid options for {name}")

        return plugin.run(target, options or {})
```

### Example Plugin Implementation

```python
# plugins/port_scanner.py
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional

# Import base class (adjust path as needed)
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from tool_base import SecurityPlugin

class PortScannerPlugin(SecurityPlugin):
    """Scan target for open ports"""

    @property
    def name(self) -> str:
        return "port_scanner"

    @property
    def description(self) -> str:
        return "TCP port scanner with service detection"

    @property
    def version(self) -> str:
        return "1.0.0"

    COMMON_SERVICES = {
        21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
        53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
        443: "HTTPS", 993: "IMAPS", 995: "POP3S",
        3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
        6379: "Redis", 8080: "HTTP-Alt", 8443: "HTTPS-Alt"
    }

    def validate_options(self, options: Dict) -> bool:
        if "ports" in options:
            if isinstance(options["ports"], str):
                # Validate port range format
                try:
                    for part in options["ports"].split(","):
                        if "-" in part:
                            start, end = part.split("-")
                            int(start)
                            int(end)
                        else:
                            int(part)
                except ValueError:
                    return False
        return True

    def run(self, target: str, options: Optional[Dict] = None) -> List[Dict]:
        options = options or {}
        ports = self._parse_ports(options.get("ports", "1-1024"))
        threads = options.get("threads", 100)
        timeout = options.get("timeout", 2)

        findings = []

        def scan_port(port):
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((target, port))
            sock.close()
            return port, result == 0

        with ThreadPoolExecutor(max_workers=threads) as executor:
            futures = {
                executor.submit(scan_port, port): port
                for port in ports
            }
            for future in as_completed(futures):
                port, is_open = future.result()
                if is_open:
                    service = self.COMMON_SERVICES.get(port, "Unknown")
                    findings.append({
                        "type": "OPEN_PORT",
                        "severity": "INFO",
                        "port": port,
                        "service": service,
                        "target": target,
                        "details": f"Port {port} ({service}) is open"
                    })

        return sorted(findings, key=lambda x: x["port"])

    def _parse_ports(self, port_spec):
        ports = set()
        for part in port_spec.split(","):
            if "-" in part:
                start, end = part.split("-", 1)
                ports.update(range(int(start), int(end) + 1))
            else:
                ports.add(int(part))
        return sorted(ports)

# Register plugin
PLUGIN_CLASS = PortScannerPlugin
```

## CLI with argparse and click

A good CLI makes your tool usable. `argparse` is built-in. `click` is cleaner for complex tools.

### argparse Implementation

```python
import argparse
import sys
import json
from datetime import datetime

def build_parser():
    parser = argparse.ArgumentParser(
        prog="secscan",
        description="Custom Security Scanner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s scan 192.168.1.1 -p 22,80,443
  %(prog)s scan 192.168.1.0/24 --ports 1-1024 --threads 200
  %(prog)s analyze suspicious.exe
  %(prog)s report --format json --output results.json
"""
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Scan command
    scan_parser = subparsers.add_parser("scan", help="Scan target")
    scan_parser.add_argument("target", help="Target IP or hostname")
    scan_parser.add_argument("-p", "--ports", default="1-1024",
                           help="Port range (default: 1-1024)")
    scan_parser.add_argument("-t", "--threads", type=int, default=100,
                           help="Number of threads (default: 100)")
    scan_parser.add_argument("--timeout", type=int, default=2,
                           help="Connection timeout in seconds (default: 2)")
    scan_parser.add_argument("-o", "--output", help="Output file")
    scan_parser.add_argument("-f", "--format", choices=["text", "json", "csv"],
                           default="text", help="Output format")

    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze file")
    analyze_parser.add_argument("file", help="File to analyze")
    analyze_parser.add_argument("--strings", action="store_true",
                              help="Extract strings")
    analyze_parser.add_argument("--entropy", action="store_true",
                              help="Calculate entropy")
    analyze_parser.add_argument("--all", action="store_true",
                              help="Run all analysis")

    # List plugins command
    subparsers.add_parser("plugins", help="List available plugins")

    # Report command
    report_parser = subparsers.add_parser("report", help="Generate report")
    report_parser.add_argument("-i", "--input", required=True,
                             help="Input results file")
    report_parser.add_argument("-o", "--output", help="Output report file")
    report_parser.add_argument("-f", "--format", choices=["text", "json", "html"],
                             default="text")

    return parser

def main():
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "scan":
        handle_scan(args)
    elif args.command == "analyze":
        handle_analyze(args)
    elif args.command == "plugins":
        handle_plugins(args)
    elif args.command == "report":
        handle_report(args)

def handle_scan(args):
    """Handle scan command"""
    print(f"Scanning {args.target}...")

    # Import and use the appropriate scanner
    from port_scanner import scan_ports

    results = scan_ports(
        args.target,
        args.ports,
        threads=args.threads,
        timeout=args.timeout
    )

    if args.format == "json":
        output = json.dumps(results, indent=2)
    elif args.format == "csv":
        import csv
        import io
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["port", "service", "status"])
        writer.writeheader()
        writer.writerows(results)
        output = output.getvalue()
    else:
        output = f"\nOpen ports on {args.target}:\n"
        for r in results:
            output += f"  Port {r['port']:5d} | {r['service']:12s} | {r['status']}\n"

    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
        print(f"Results saved to {args.output}")
    else:
        print(output)

# if __name__ == "__main__":
#     main()
```

### click Implementation

```python
import click
import json
from datetime import datetime

@click.group()
@click.version_option(version="1.0.0")
def cli():
    """Security Scanner - Custom Security Tool"""
    pass

@cli.command()
@click.argument("target")
@click.option("-p", "--ports", default="1-1024", help="Port range")
@click.option("-t", "--threads", default=100, help="Thread count")
@click.option("--timeout", default=2, help="Timeout seconds")
@click.option("-o", "--output", help="Output file")
@click.option("-f", "--format", type=click.Choice(["text", "json", "csv"]),
              default="text")
def scan(target, ports, threads, timeout, output, format):
    """Scan target for open ports"""
    click.echo(f"Scanning {target}...")

    # Scanner logic here
    results = []  # Placeholder

    if format == "json":
        output_text = json.dumps(results, indent=2)
    else:
        output_text = f"Found {len(results)} open ports"

    if output:
        with open(output, "w") as f:
            f.write(output_text)
        click.echo(f"Saved to {output}")
    else:
        click.echo(output_text)

@cli.command()
@click.argument("filepath")
@click.option("--strings", is_flag=True, help="Extract strings")
@click.option("--entropy", is_flag=True, help="Calculate entropy")
@click.option("--all-analysis", is_flag=True, help="Run all analysis")
def analyze(filepath, strings, entropy, all_analysis):
    """Analyze a file for suspicious content"""
    click.echo(f"Analyzing {filepath}...")

    if all_analysis or (not strings and not entropy):
        strings = entropy = True

    results = {}
    if strings:
        results["strings"] = extract_strings(filepath)
    if entropy:
        results["entropy"] = calculate_entropy(filepath)

    click.echo(json.dumps(results, indent=2))

@cli.command()
def plugins():
    """List available plugins"""
    manager = PluginManager()
    manager.discover_plugins()
    manager.list_plugins()

@cli.command()
@click.option("-i", "--input", "input_file", required=True)
@click.option("-o", "--output", help="Output file")
@click.option("-f", "--format", type=click.Choice(["text", "json", "html"]))
def report(input_file, output, format):
    """Generate analysis report"""
    click.echo(f"Generating report from {input_file}...")

# if __name__ == "__main__":
#     cli()
```

## Packaging and Distribution

Your tool needs to be installable. Python packages let users `pip install` your tool.

### Project Structure

```
security-tool/
├── pyproject.toml
├── README.md
├── LICENSE
├── security_tool/
│   ├── __init__.py
│   ├── cli.py
│   ├── scanner.py
│   ├── analyzer.py
│   ├── plugins/
│   │   ├── __init__.py
│   │   ├── port_scanner.py
│   │   └── web_scanner.py
│   └── utils/
│       ├── __init__.py
│       └── helpers.py
└── tests/
    ├── __init__.py
    ├── test_scanner.py
    └── test_analyzer.py
```

### pyproject.toml

```toml
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "security-tool"
version = "1.0.0"
description = "Custom security scanning and analysis tool"
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.8"
authors = [
    {name = "Security Team"}
]
dependencies = [
    "requests>=2.28.0",
    "beautifulsoup4>=4.11.0",
    "pyyaml>=6.0",
    "click>=8.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "pytest-cov>=4.0",
    "flake8>=6.0",
    "mypy>=1.0",
]

[project.scripts]
secscan = "security_tool.cli:main"

[project.urls]
Homepage = "https://github.com/company/security-tool"
Documentation = "https://docs.company.com/security-tool"

[tool.setuptools.packages.find]
include = ["security_tool*"]

[tool.pytest.ini_options]
testpaths = ["tests"]

[tool.mypy]
python_version = "3.8"
warn_return_any = true
warn_unused_configs = true
```

### Setup.py (Legacy)

```python
from setuptools import setup, find_packages

setup(
    name="security-tool",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "requests>=2.28.0",
        "beautifulsoup4>=4.11.0",
        "pyyaml>=6.0",
        "click>=8.0.0",
    ],
    entry_points={
        "console_scripts": [
            "secscan=security_tool.cli:main",
        ],
    },
    author="Security Team",
    description="Custom security scanning and analysis tool",
    python_requires=">=3.8",
)
```

### Building and Installing

```bash
# Install in development mode
pip install -e .

# Install from pyproject.toml
pip install -e ".[dev]"

# Build distribution
python -m build

# Install from wheel
pip install dist/security_tool-1.0.0-py3-none-any.whl

# Publish to PyPI (if desired)
twine upload dist/*
```

### Entry Points

```python
# security_tool/cli.py
import sys
from security_tool.scanner import PortScanner
from security_tool.analyzer import FileAnalyzer

def main():
    """Main entry point for the CLI"""
    import argparse

    parser = argparse.ArgumentParser(
        prog="secscan",
        description="Security Scanner Tool"
    )

    subparsers = parser.add_subparsers(dest="command")

    # Add subcommands
    scan_cmd = subparsers.add_parser("scan")
    scan_cmd.add_argument("target")

    analyze_cmd = subparsers.add_parser("analyze")
    analyze_cmd.add_argument("file")

    args = parser.parse_args()

    if args.command == "scan":
        scanner = PortScanner()
        results = scanner.scan(args.target)
        for r in results:
            print(r)
    elif args.command == "analyze":
        analyzer = FileAnalyzer()
        results = analyzer.analyze(args.file)
        print(results)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
```

## Real Scenario: Building a Custom Vulnerability Scanner

Combine everything: plugins, CLI, packaging: into a complete vulnerability scanner.

```python
#!/usr/bin/env python3
"""
Custom Vulnerability Scanner Framework
Extensible, configurable, and distributable.
"""

import socket
import json
import argparse
import importlib
import pkgutil
from pathlib import Path
from abc import ABC, abstractmethod
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Any, Optional
from datetime import datetime

# ---- Base Classes ----

class ScannerPlugin(ABC):
    """Base class for scanner plugins"""

    @property
    @abstractmethod
    def name(self) -> str: pass

    @property
    @abstractmethod
    def description(self) -> str: pass

    @abstractmethod
    def scan(self, target: str, options: Dict) -> List[Dict]: pass

    def validate(self, options: Dict) -> bool:
        return True


class Scanner:
    """Main scanner framework"""

    def __init__(self):
        self.plugins = {}
        self.results = []
        self._load_plugins()

    def _load_plugins(self):
        """Load all plugins from the plugins directory"""
        plugin_dir = Path(__file__).parent / "plugins"
        if not plugin_dir.exists():
            return

        for module_info in pkgutil.iter_modules([str(plugin_dir)]):
            if module_info.name.startswith("_"):
                continue

            try:
                module = importlib.import_module(f"plugins.{module_info.name}")
                if hasattr(module, "PLUGIN"):
                    plugin = module.PLUGIN
                    self.plugins[plugin.name] = plugin
            except Exception as e:
                print(f"Failed to load plugin {module_info.name}: {e}")

    def add_plugin(self, plugin: ScannerPlugin):
        """Register a plugin"""
        self.plugins[plugin.name] = plugin

    def scan(self, target: str, plugin_name: str = None, options: Dict = None):
        """Run a scan"""
        options = options or {}

        if plugin_name:
            plugins = {plugin_name: self.plugins[plugin_name]}
        else:
            plugins = self.plugins

        for name, plugin in plugins.items():
            print(f"Running {name}...")
            try:
                findings = plugin.scan(target, options)
                self.results.extend(findings)
                print(f"  Found {len(findings)} issues")
            except Exception as e:
                print(f"  Error: {e}")

        return self.results

    def report(self, format="text"):
        """Generate report"""
        if format == "json":
            return json.dumps(self.results, indent=2, default=str)

        lines = []
        lines.append(f"Scan Report - {datetime.now().isoformat()}")
        lines.append("=" * 60)
        lines.append(f"Total findings: {len(self.results)}")

        for finding in self.results:
            lines.append(f"\n[{finding.get('severity', 'UNKNOWN')}] {finding.get('type', 'Unknown')}")
            lines.append(f"  Target: {finding.get('target', 'N/A')}")
            lines.append(f"  Details: {finding.get('details', 'N/A')}")

        return "\n".join(lines)

    def export(self, filepath, format="json"):
        """Export results"""
        report = self.report(format)
        Path(filepath).write_text(report)
        print(f"Report exported to {filepath}")


# ---- Built-in Plugins ----

class PortScannerPlugin(ScannerPlugin):
    @property
    def name(self) -> str: return "port_scan"

    @property
    def description(self) -> str: return "TCP port scanner"

    def scan(self, target: str, options: Dict) -> List[Dict]:
        ports = self._parse_ports(options.get("ports", "1-1024"))
        threads = options.get("threads", 100)
        findings = []

        def check(port):
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(options.get("timeout", 2))
            result = sock.connect_ex((target, port))
            sock.close()
            return port, result == 0

        with ThreadPoolExecutor(max_workers=threads) as executor:
            futures = {executor.submit(check, p): p for p in ports}
            for future in as_completed(futures):
                port, is_open = future.result()
                if is_open:
                    findings.append({
                        "type": "OPEN_PORT",
                        "severity": "INFO",
                        "target": target,
                        "port": port,
                        "details": f"Port {port} is open"
                    })

        return findings

    def _parse_ports(self, spec):
        ports = set()
        for part in spec.split(","):
            if "-" in part:
                s, e = part.split("-", 1)
                ports.update(range(int(s), int(e) + 1))
            else:
                ports.add(int(part))
        return sorted(ports)


class WebScannerPlugin(ScannerPlugin):
    @property
    def name(self) -> str: return "web_scan"

    @property
    def description(self) -> str: return "Basic web vulnerability scanner"

    def scan(self, target: str, options: Dict) -> List[Dict]:
        import requests
        findings = []
        base_url = f"https://{target}" if not target.startswith("http") else target

        try:
            resp = requests.get(base_url, timeout=10, verify=False)
        except Exception as e:
            return [{"type": "CONNECTION_ERROR", "severity": "HIGH",
                     "target": target, "details": str(e)}]

        # Check security headers
        headers_to_check = {
            "X-Frame-Options": ("MISSING_HEADER", "MEDIUM",
                               "Clickjacking protection missing"),
            "X-Content-Type-Options": ("MISSING_HEADER", "LOW",
                                      "MIME sniffing protection missing"),
            "Strict-Transport-Security": ("MISSING_HEADER", "MEDIUM",
                                         "HSTS header missing"),
        }

        for header, (finding_type, severity, description) in headers_to_check.items():
            if header.lower() not in [h.lower() for h in resp.headers]:
                findings.append({
                    "type": finding_type,
                    "severity": severity,
                    "target": target,
                    "details": description
                })

        # Check for server header disclosure
        if "Server" in resp.headers:
            findings.append({
                "type": "INFO_DISCLOSURE",
                "severity": "LOW",
                "target": target,
                "details": f"Server header reveals: {resp.headers['Server']}"
            })

        return findings


# ---- CLI ----

def main():
    parser = argparse.ArgumentParser(
        prog="vulnscan",
        description="Custom Vulnerability Scanner"
    )

    parser.add_argument("target", help="Target to scan")
    parser.add_argument("-p", "--plugins", nargs="+",
                       help="Plugins to run (default: all)")
    parser.add_argument("--ports", default="1-1024",
                       help="Port range for port scanner")
    parser.add_argument("-o", "--output", help="Output file")
    parser.add_argument("-f", "--format", choices=["text", "json"],
                       default="text")
    parser.add_argument("--list-plugins", action="store_true",
                       help="List available plugins")

    args = parser.parse_args()

    scanner = Scanner()
    scanner.add_plugin(PortScannerPlugin())
    scanner.add_plugin(WebScannerPlugin())

    if args.list_plugins:
        print("Available plugins:")
        for name, plugin in scanner.plugins.items():
            print(f"  {name}: {plugin.description}")
        return

    options = {"ports": args.ports}

    plugin_names = args.plugins if args.plugins else None
    if plugin_names:
        for name in plugin_names:
            if name not in scanner.plugins:
                print(f"Unknown plugin: {name}")
                return

    if plugin_names:
        for name in plugin_names:
            scanner.scan(args.target, name, options)
    else:
        scanner.scan(args.target, options=options)

    print("\n" + scanner.report(args.format))

    if args.output:
        scanner.export(args.output, args.format)


if __name__ == "__main__":
    main()
```

## Assessment

### Lab Task: Build a Security Tool

Build a complete, packaged security tool with CLI, plugins, and documentation. Time limit: 120 minutes.

**Requirements:**
1. Implement a plugin architecture with at least 2 plugins
2. Create a CLI with argparse or click
3. Support at least 2 scan types (port scan + one other)
4. Generate output in text and JSON formats
5. Create a pyproject.toml for packaging
6. Include at least one unit test
7. Write a README with usage instructions

**Deliverables:**
- Complete project directory structure
- Working CLI tool
- pyproject.toml
- At least one test file
- README.md

**Grading Criteria:**
- Plugin architecture works (25 points)
- CLI is functional (20 points)
- Multiple scan types work (20 points)
- Output formatting works (15 points)
- Packaging is correct (10 points)
- Documentation is clear (10 points)

### Bonus Challenges

- Add a plugin repository (download plugins from URL)
- Implement async scanning with asyncio
- Add a web dashboard for results
- Create Docker container for the tool
- Publish to PyPI

## Maintaining Security Tools

Building a tool is the start, not the end. Security tools require ongoing maintenance. Vulnerabilities are discovered in dependencies. Operating systems change. New protocols emerge. Target environments evolve. A tool that worked last year might not work today.

Dependency management is the first maintenance task. Libraries you depend on release new versions. Some releases fix security vulnerabilities. Some introduce breaking changes. Regularly update your dependencies and test that your tool still works. Use `pip-audit` or `safety` to check for known vulnerabilities in your dependencies.

Version control is essential. Use git to track changes to your tool. Tag releases so you can return to previous versions if a update breaks something. Write meaningful commit messages so you understand why changes were made. Branch for major changes so the main branch always works.

Documentation maintenance matters as much as code maintenance. When you change functionality, update the README. When you add configuration options, document them. When you deprecate features, note the deprecation. Outdated documentation is worse than no documentation because it misleads users.

User feedback is your best source of bug reports and feature requests. When someone reports a problem, thank them and fix it. When someone suggests a feature, evaluate it against your tool's purpose. Not every suggestion belongs in your tool, but every suggestion tells you something about how people use it.

The tools you build in this course are starting points. They solve specific problems today. As you use them, you'll find bugs, missing features, and better approaches. That's normal. Software is never finished: it evolves with the problems it solves.

## Evidence

Building custom security tools is the capstone of this course. Everything you learned: socket programming, web scraping, cryptography, forensics, automation: comes together in tools that solve real problems. The difference between a script and a tool is engineering: error handling, configuration, documentation, and distribution.

The plugins you wrote demonstrate the core principle of security tool design: separation of concerns. The framework handles CLI, output, and orchestration. The plugins handle the actual scanning logic. This makes the tool extensible without modifying the core: exactly how professional security tools are built.

**Libraries covered:** abc, importlib, pkgutil, argparse, click, json, pathlib, concurrent.futures

**Concepts covered:** Plugin architecture, CLI design, project packaging, entry points, unit testing, documentation, tool distribution