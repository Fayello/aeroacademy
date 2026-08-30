# Module 10 — Building Custom Security Tools

## What You'll Actually Do

Combine everything you've learned into a complete security tool. Design the architecture, build a plugin system, add CLI interface, integrate logging, and package it for deployment. This is the capstone — you're building something you'd actually use.

## Tool architecture

```python
#!/usr/bin/env python3
"""
Security Toolkit — a modular framework for custom security tools.
"""
import argparse
import importlib
import sys
import json
from datetime import datetime
from pathlib import Path

class SecurityToolkit:
    """Main framework class. Loads and runs analysis modules."""

    def __init__(self):
        self.modules = {}
        self.results = {}
        self.config = {}

    def register_module(self, name, module):
        """Register an analysis module."""
        self.modules[name] = module
        print(f"  Registered: {name}")

    def load_modules_from(self, module_dir):
        """Dynamically load modules from a directory."""
        module_path = Path(module_dir)
        for py_file in module_path.glob('*.py'):
            if py_file.name.startswith('_'):
                continue
            module_name = py_file.stem
            spec = importlib.util.spec_from_file_location(
                module_name, py_file
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            if hasattr(module, 'register'):
                module.register(self)

    def run_module(self, name, target, **kwargs):
        """Run a single analysis module."""
        if name not in self.modules:
            print(f"Module '{name}' not found")
            return None

        print(f"\n[*] Running {name}...")
        try:
            result = self.modules[name].analyze(target, **kwargs)
            self.results[name] = {
                'timestamp': datetime.now().isoformat(),
                'target': str(target),
                'result': result
            }
            return result
        except Exception as e:
            print(f"  Error: {e}")
            return None

    def run_all(self, target, **kwargs):
        """Run all registered modules."""
        print(f"\n{'='*60}")
        print(f"Running all modules against: {target}")
        print(f"{'='*60}")

        for name in self.modules:
            self.run_module(name, target, **kwargs)

        return self.results

    def export_results(self, output_dir, format='json'):
        """Export all results to files."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        if format == 'json':
            out_file = output_path / f'results_{timestamp}.json'
            with open(out_file, 'w') as f:
                json.dump(self.results, f, indent=2, default=str)
        elif format == 'markdown':
            out_file = output_path / f'results_{timestamp}.md'
            with open(out_file, 'w') as f:
                f.write(f"# Security Analysis Report\n\n")
                f.write(f"Generated: {datetime.now().isoformat()}\n\n")
                for name, data in self.results.items():
                    f.write(f"## {name}\n\n")
                    f.write(f"Target: {data['target']}\n\n")
                    f.write(f"```json\n{json.dumps(data['result'], indent=2, default=str)}\n```\n\n")

        print(f"Results exported to {out_file}")
        return out_file
```

## Building analysis modules

```python
# modules/string_analyzer.py

def register(toolkit):
    """Register this module with the toolkit."""
    toolkit.register_module('strings', StringAnalyzer())

class StringAnalyzer:
    """Extract and analyze strings from files."""

    def analyze(self, filepath, **kwargs):
        min_length = kwargs.get('min_length', 4)
        strings = self.extract_strings(filepath, min_length)
        categorized = self.categorize(strings)

        return {
            'total_strings': len(strings),
            'categories': {k: len(v) for k, v in categorized.items()},
            'findings': categorized
        }

    def extract_strings(self, filepath, min_length):
        strings = []
        current = b''
        with open(filepath, 'rb') as f:
            while True:
                byte = f.read(1)
                if not byte:
                    break
                if 32 <= byte[0] <= 126:
                    current += byte
                else:
                    if len(current) >= min_length:
                        strings.append(current.decode('ascii', errors='ignore'))
                    current = b''
        return strings

    def categorize(self, strings):
        import re
        categories = {
            'urls': [], 'ips': [], 'emails': [],
            'file_paths': [], 'suspicious': []
        }

        suspicious = ['password', 'mimikatz', 'shell', 'reverse', 'payload', 'encrypt']

        for s in strings:
            if re.search(r'https?://', s):
                categories['urls'].append(s)
            if re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', s):
                categories['ips'].append(s)
            if re.search(r'@', s) and '.' in s:
                categories['emails'].append(s)
            if re.search(r'[/\\]', s) and len(s) > 8:
                categories['file_paths'].append(s)
            if any(kw in s.lower() for kw in suspicious):
                categories['suspicious'].append(s)

        return categories
```

```python
# modules/entropy_analyzer.py

import math
from collections import Counter

def register(toolkit):
    toolkit.register_module('entropy', EntropyAnalyzer())

class EntropyAnalyzer:
    """Analyze file entropy to detect packing/encryption."""

    def analyze(self, filepath, **kwargs):
        block_size = kwargs.get('block_size', 256)

        with open(filepath, 'rb') as f:
            data = f.read()

        overall = self.calculate_entropy(data)
        blocks = [data[i:i+block_size] for i in range(0, len(data), block_size)]
        block_entropies = [self.calculate_entropy(b) for b in blocks]

        high_count = sum(1 for e in block_entropies if e > 7.0)

        assessment = 'normal'
        if overall > 7.5:
            assessment = 'likely_packed'
        elif overall > 6.5:
            assessment = 'possibly_compressed'
        elif high_count > len(blocks) * 0.3:
            assessment = 'partially_packed'

        return {
            'overall_entropy': round(overall, 4),
            'block_count': len(blocks),
            'high_entropy_blocks': high_count,
            'assessment': assessment
        }

    def calculate_entropy(self, data):
        if not data:
            return 0
        counter = Counter(data)
        length = len(data)
        entropy = 0
        for count in counter.values():
            p = count / length
            if p > 0:
                entropy -= p * math.log2(p)
        return entropy
```

## CLI interface

```python
def build_parser():
    """Build the argument parser."""
    parser = argparse.ArgumentParser(
        description='Security Toolkit — modular analysis framework',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s analyze malware_sample.exe
  %(prog)s analyze malware_sample.exe --modules strings,entropy
  %(prog)s scan 192.168.1.0/24 --ports 22,80,443
  %(prog)s report results.json --format markdown
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Analyze command
    analyze = subparsers.add_parser('analyze', help='Analyze a file')
    analyze.add_argument('target', help='File to analyze')
    analyze.add_argument('--modules', '-m', help='Comma-separated modules to run')
    analyze.add_argument('--output', '-o', help='Output directory')
    analyze.add_argument('--format', '-f', choices=['json', 'markdown'], default='json')

    # Scan command
    scan = subparsers.add_parser('scan', help='Network scan')
    scan.add_argument('target', help='Target IP or CIDR')
    scan.add_argument('--ports', '-p', help='Comma-separated ports')
    scan.add_argument('--timeout', '-t', type=int, default=1)

    # Report command
    report = subparsers.add_parser('report', help='Generate report from results')
    report.add_argument('results_file', help='JSON results file')
    report.add_argument('--format', '-f', choices=['json', 'markdown', 'html'])

    return parser

def main():
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    toolkit = SecurityToolkit()
    toolkit.load_modules_from('modules')

    if args.command == 'analyze':
        modules = args.modules.split(',') if args.modules else None
        if modules:
            for mod in modules:
                toolkit.run_module(mod.strip(), args.target)
        else:
            toolkit.run_all(args.target)

        if args.output:
            toolkit.export_results(args.output, args.format)

    elif args.command == 'scan':
        from modules.network_scanner import scan_target
        ports = [int(p) for p in args.ports.split(',')] if args.ports else [22, 80, 443]
        results = scan_target(args.target, ports, args.timeout)
        print(json.dumps(results, indent=2))

    elif args.command == 'report':
        with open(args.results_file) as f:
            data = json.load(f)
        # Generate report from loaded data
        print(json.dumps(data, indent=2, default=str))

if __name__ == '__main__':
    main()
```

## Plugin system

```python
import importlib
import inspect
from pathlib import Path

class PluginManager:
    """Load and manage analysis plugins."""

    def __init__(self, plugin_dir='plugins'):
        self.plugin_dir = Path(plugin_dir)
        self.plugins = {}

    def discover(self):
        """Find all plugins in the plugin directory."""
        if not self.plugin_dir.exists():
            return

        for py_file in self.plugin_dir.glob('*.py'):
            if py_file.name.startswith('_'):
                continue

            module_name = py_file.stem
            spec = importlib.util.spec_from_file_location(module_name, py_file)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Find classes that inherit from AnalysisPlugin
            for name, obj in inspect.getmembers(module, inspect.isclass):
                if hasattr(obj, 'PLUGIN_NAME') and hasattr(obj, 'analyze'):
                    plugin = obj()
                    self.plugins[plugin.PLUGIN_NAME] = plugin
                    print(f"  Loaded plugin: {plugin.PLUGIN_NAME}")

    def run(self, plugin_name, target, **kwargs):
        if plugin_name not in self.plugins:
            raise ValueError(f"Plugin '{plugin_name}' not found")
        return self.plugins[plugin_name].analyze(target, **kwargs)

    def list_plugins(self):
        for name, plugin in self.plugins.items():
            desc = getattr(plugin, 'DESCRIPTION', 'No description')
            print(f"  {name}: {desc}")

# Base class for plugins
class AnalysisPlugin:
    """Base class for all analysis plugins."""
    PLUGIN_NAME = 'base'
    DESCRIPTION = 'Base plugin'
    VERSION = '1.0'

    def analyze(self, target, **kwargs):
        raise NotImplementedError

    def get_info(self):
        return {
            'name': self.PLUGIN_NAME,
            'description': self.DESCRIPTION,
            'version': self.VERSION
        }
```

## Example custom tool — IOC extractor

```python
#!/usr/bin/env python3
"""
IOC Extractor — pulls indicators of compromise from various sources.
Supports: files,pcaps, logs, memory dumps.
"""
import re
import json
import hashlib
from pathlib import Path
from collections import defaultdict

class IOCExtractor:
    """Extract IOCs from different file types."""

    def __init__(self):
        self.iocs = defaultdict(set)

    def extract_from_file(self, filepath):
        """Extract IOCs from any file."""
        path = Path(filepath)
        suffix = path.suffix.lower()

        if suffix == '.pcap':
            return self.extract_from_pcap(filepath)
        elif suffix in ('.log', '.txt'):
            return self.extract_from_text(filepath)
        elif suffix in ('.exe', '.dll', '.bin'):
            return self.extract_from_binary(filepath)
        else:
            return self.extract_from_text(filepath)

    def extract_from_text(self, filepath):
        """Extract IOCs from text-based files."""
        with open(filepath, 'r', errors='ignore') as f:
            content = f.read()

        patterns = {
            'ipv4': re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'),
            'domain': re.compile(r'\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b'),
            'url': re.compile(r'https?://[a-zA-Z0-9./?=&_-]+'),
            'email': re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'),
            'md5': re.compile(r'\b[a-fA-F0-9]{32}\b'),
            'sha1': re.compile(r'\b[a-fA-F0-9]{40}\b'),
            'sha256': re.compile(r'\b[a-fA-F0-9]{64}\b'),
            'file_path_win': re.compile(r'[A-Z]:\\[^\s<>"]+'),
            'file_path_nix': re.compile(r'/[a-z][a-z0-9_/]+\.[a-z]{2,4}'),
        }

        for ioc_type, pattern in patterns.items():
            matches = pattern.findall(content)
            self.iocs[ioc_type].update(matches)

        # Filter out false positives for domains
        self.iocs['domain'] = {
            d for d in self.iocs['domain']
            if not d.endswith(('.com', '.org', '.net', '.edu')) or
            any(c.isdigit() for c in d.split('.')[0])
        }

        return dict(self.iocs)

    def extract_from_pcap(self, filepath):
        """Extract IOCs from pcap files."""
        try:
            from scapy.all import rdpcap, IP, DNS, TCP, Raw
            packets = rdpcap(filepath)

            for pkt in packets:
                if pkt.haslayer(IP):
                    self.iocs['ipv4'].add(pkt[IP].src)
                    self.iocs['ipv4'].add(pkt[IP].dst)

                if pkt.haslayer(DNS):
                    try:
                        qname = pkt[DNS].qd.qname.decode()
                        self.iocs['domain'].add(qname)
                    except:
                        pass

                if pkt.haslayer(Raw):
                    data = pkt[Raw].load
                    # Extract from payloads
                    for pattern_name, pattern in [
                        ('url', re.compile(rb'https?://[^\s<>"]+')),
                        ('md5', re.compile(rb'\b[a-fA-F0-9]{32}\b')),
                        ('sha256', re.compile(rb'\b[a-fA-F0-9]{64}\b')),
                    ]:
                        for match in pattern.findall(data):
                            self.iocs[pattern_name].add(match.decode(errors='ignore'))

        except ImportError:
            print("Scapy not available for pcap analysis")

        return dict(self.iocs)

    def extract_from_binary(self, filepath):
        """Extract IOCs from binary files."""
        with open(filepath, 'rb') as f:
            data = f.read()

        # Extract strings
        current = b''
        strings = []
        for byte in data:
            if 32 <= byte <= 126:
                current += bytes([byte])
            else:
                if len(current) >= 4:
                    strings.append(current.decode('ascii', errors='ignore'))
                current = b''

        # Apply text patterns to extracted strings
        for s in strings:
            for pattern_name, pattern in [
                ('ipv4', re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')),
                ('domain', re.compile(r'\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b')),
                ('url', re.compile(r'https?://[^\s<>"]+')),
            ]:
                for match in pattern.findall(s):
                    self.iocs[pattern_name].add(match)

        # File hashes
        self.iocs['md5'].add(hashlib.md5(data).hexdigest())
        self.iocs['sha256'].add(hashlib.sha256(data).hexdigest())

        return dict(self.iocs)

    def export(self, format='json'):
        """Export extracted IOCs."""
        result = {k: sorted(list(v)) for k, v in self.iocs.items() if v}

        if format == 'json':
            return json.dumps(result, indent=2)
        elif format == 'csv':
            lines = ['type,value']
            for ioc_type, values in result.items():
                for value in values:
                    lines.append(f'{ioc_type},{value}')
            return '\n'.join(lines)
        return result
```

## Packaging and distribution

```python
# setup.py or pyproject.toml structure
"""
To package your tool:

1. Create pyproject.toml:
"""
PYPROJECT = """
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.backends._legacy:_Backend"

[project]
name = "pysec-toolkit"
version = "1.0.0"
description = "Custom security analysis toolkit"
requires-python = ">=3.10"
dependencies = [
    "scapy",
    "requests",
    "beautifulsoup4",
    "pycryptodome",
]

[project.scripts]
pysec = "toolkit.main:main"
"""

# Dockerfile for distribution
DOCKERFILE = """
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN pip install -e .

ENTRYPOINT ["pysec"]
"""
```

## Assessment

**Lab Task — Build and package a complete security tool (120 minutes)**

1. Design and implement a modular security tool with at least 3 analysis modules
2. Add a CLI interface with argparse (at least 2 subcommands)
3. Implement a plugin system that loads modules dynamically
4. Build an IOC extractor that handles text, binary, and pcap inputs
5. Add JSON and markdown export
6. Write a README with usage examples
7. Package the tool with pyproject.toml

**Grading:**
- Modular architecture with clean separation: 20 pts
- CLI interface with proper argument handling: 15 pts
- Plugin system works dynamically: 15 pts
- IOC extractor handles multiple file types: 20 pts
- Export in both JSON and markdown: 10 pts
- README with examples: 10 pts
- Tool runs end-to-end without errors: 10 pts

## Evidence

- Your complete tool codebase
- README with usage examples
- Screenshot of tool running against a test file
- IOC extraction results in JSON format
- Markdown report output
- Notes on how you'd extend the tool with new modules
