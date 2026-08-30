# Module 9 — Malware Analysis Scripts

## What You'll Actually Do

Perform static analysis on suspicious files using Python. Extract strings, identify entropy anomalies, parse PE/ELF headers, and build analysis reports. This is about understanding what a file does without executing it.

## String extraction and analysis

```python
import re
from collections import Counter

def extract_strings(filepath, min_length=4):
    """Extract all printable strings from a binary."""
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

def categorize_strings(strings):
    """Sort strings into categories for analysis."""
    categories = {
        'urls': [],
        'ips': [],
        'emails': [],
        'file_paths': [],
        'registry_keys': [],
        'commands': [],
        'crypto': [],
        'suspicious': []
    }

    url_pattern = re.compile(r'https?://[a-zA-Z0-9./?=&_-]+')
    ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
    email_pattern = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    win_path = re.compile(r'[A-Z]:\\[^\s<>"]+')
    unix_path = re.compile(r'/[a-z][a-z0-9_/]+')
    reg_key = re.compile(r'HKEY_[A-Z_]+\\[^\s<>"]+')

    suspicious_keywords = [
        'password', 'credential', 'token', 'keylog', 'inject',
        'mimikatz', 'psexec', 'meterpreter', 'reverse', 'shell',
        'payload', 'encrypt', 'decrypt', 'ransom', 'bitcoin',
        'wallet', 'tor', 'onion', 'c2', 'command', 'control'
    ]

    for s in strings:
        if url_pattern.search(s):
            categories['urls'].append(s)
        if ip_pattern.search(s):
            categories['ips'].append(s)
        if email_pattern.search(s):
            categories['emails'].append(s)
        if win_path.search(s):
            categories['file_paths'].append(s)
        if unix_path.search(s):
            categories['file_paths'].append(s)
        if reg_key.search(s):
            categories['registry_keys'].append(s)

        # Command-like strings
        if any(cmd in s.lower() for cmd in ['cmd.exe', 'powershell', 'bash', '/bin/sh', 'curl', 'wget', 'nc']):
            categories['commands'].append(s)

        # Crypto-related
        if any(c in s.lower() for c in ['aes', 'rsa', 'sha', 'md5', 'base64', 'encrypt', 'decrypt']):
            categories['crypto'].append(s)

        # Suspicious
        if any(kw in s.lower() for kw in suspicious_keywords):
            categories['suspicious'].append(s)

    # Deduplicate
    for k in categories:
        categories[k] = list(set(categories[k]))

    return categories

def analyze_strings(filepath):
    """Full string analysis pipeline."""
    print(f"[*] Extracting strings from {filepath}...")
    strings = extract_strings(filepath)
    print(f"[*] Found {len(strings)} strings")

    categories = categorize_strings(strings)

    print(f"\n[*] Analysis Results:")
    print(f"  URLs:           {len(categories['urls'])}")
    print(f"  IP addresses:   {len(categories['ips'])}")
    print(f"  Email addresses:{len(categories['emails'])}")
    print(f"  File paths:     {len(categories['file_paths'])}")
    print(f"  Registry keys:  {len(categories['registry_keys'])}")
    print(f"  Commands:       {len(categories['commands'])}")
    print(f"  Crypto refs:    {len(categories['crypto'])}")
    print(f"  Suspicious:     {len(categories['suspicious'])}")

    if categories['suspicious']:
        print(f"\n[!] Suspicious strings found:")
        for s in categories['suspicious'][:20]:
            print(f"    {s}")

    return categories
```

## Entropy analysis

```python
import math
from collections import Counter

def calculate_entropy(data):
    """Calculate Shannon entropy of data. High entropy = encrypted/packed."""
    if not data:
        return 0

    counter = Counter(data)
    length = len(data)
    entropy = 0

    for count in counter.values():
        probability = count / length
        if probability > 0:
            entropy -= probability * math.log2(probability)

    return entropy

def entropy_analysis(filepath, block_size=256):
    """Analyze entropy across the file to detect packing/encryption."""
    with open(filepath, 'rb') as f:
        data = f.read()

    # Overall entropy
    overall = calculate_entropy(data)
    print(f"Overall entropy: {overall:.4f} / 8.0")

    if overall > 7.5:
        print("  [!] Very high entropy — likely packed or encrypted")
    elif overall > 6.5:
        print("  [~] Medium-high entropy — may contain compressed data")
    elif overall > 4.0:
        print("  [+] Normal entropy — likely unpacked code")
    else:
        print("  [+] Low entropy — mostly null bytes or repetitive data")

    # Section-by-section entropy
    print(f"\nEntropy by {block_size}-byte blocks:")
    blocks = [data[i:i+block_size] for i in range(0, len(data), block_size)]
    entropies = [calculate_entropy(block) for block in blocks]

    # Visual histogram
    max_ent = max(entropies) if entropies else 1
    for i, ent in enumerate(entropies[:50]):  # First 50 blocks
        bar = '#' * int((ent / 8.0) * 40)
        print(f"  Block {i:3d}: {ent:.2f} {bar}")

    return {
        'overall': overall,
        'block_entropies': entropies,
        'high_entropy_blocks': [i for i, e in enumerate(entropies) if e > 7.0]
    }
```

## PE file analysis

```python
import struct

class PEAnalyzer:
    """Parse PE (Windows executable) headers."""

    def __init__(self, filepath):
        with open(filepath, 'rb') as f:
            self.data = f.read()

    def parse_dos_header(self):
        """Parse the DOS header."""
        if self.data[:2] != b'MZ':
            return None

        pe_offset = struct.unpack_from('<I', self.data, 0x3C)[0]
        return {
            'magic': 'MZ',
            'pe_offset': pe_offset
        }

    def parse_pe_header(self):
        """Parse PE signature and COFF header."""
        dos = self.parse_dos_header()
        if not dos:
            return None

        offset = dos['pe_offset']
        signature = self.data[offset:offset+4]

        if signature != b'PE\x00\x00':
            return None

        machine = struct.unpack_from('<H', self.data, offset + 4)[0]
        num_sections = struct.unpack_from('<H', self.data, offset + 6)[0]
        timestamp = struct.unpack_from('<I', self.data, offset + 8)[0]

        machine_types = {0x14c: 'x86', 0x8664: 'x64', 0xAA64: 'ARM64'}

        return {
            'signature': 'PE',
            'machine': machine_types.get(machine, f'0x{machine:04x}'),
            'num_sections': num_sections,
            'timestamp': timestamp
        }

    def parse_sections(self):
        """Parse section headers."""
        dos = self.parse_dos_header()
        if not dos:
            return []

        offset = dos['pe_offset'] + 24  # Skip PE sig + COFF header
        num_sections = struct.unpack_from('<H', self.data, dos['pe_offset'] + 6)[0]

        sections = []
        for i in range(num_sections):
            sec_offset = offset + (i * 40)
            name = self.data[sec_offset:sec_offset+8].rstrip(b'\x00').decode()
            virtual_size = struct.unpack_from('<I', self.data, sec_offset + 8)[0]
            virtual_addr = struct.unpack_from('<I', self.data, sec_offset + 12)[0]
            raw_size = struct.unpack_from('<I', self.data, sec_offset + 16)[0]

            section_data = self.data[sec_offset + 20:sec_offset + 20 + raw_size] if raw_size else b''

            sections.append({
                'name': name,
                'virtual_size': virtual_size,
                'virtual_addr': virtual_addr,
                'raw_size': raw_size,
                'entropy': calculate_entropy(section_data) if section_data else 0
            })

        return sections

    def extract_imports(self):
        """Extract imported function names (simplified)."""
        # This is a simplified version — real PE import parsing is complex
        strings = extract_strings_from_data(self.data)
        api_functions = [
            'CreateFile', 'WriteFile', 'ReadFile', 'DeleteFile',
            'CreateProcess', 'ShellExecute', 'VirtualAlloc', 'VirtualProtect',
            'LoadLibrary', 'GetProcAddress', 'CreateRemoteThread',
            'WriteProcessMemory', 'InternetOpen', 'HttpSendRequest',
            'URLDownloadToFile', 'WinExec', 'system', 'popen'
        ]

        found_apis = [api for api in api_functions if api.encode() in self.data]
        return found_apis

    def analyze(self):
        """Full PE analysis."""
        results = {
            'dos_header': self.parse_dos_header(),
            'pe_header': self.parse_pe_header(),
            'sections': self.parse_sections(),
            'imports': self.extract_imports()
        }

        print(f"\n[*] PE Analysis:")
        if results['pe_header']:
            print(f"  Machine: {results['pe_header']['machine']}")
            print(f"  Sections: {results['pe_header']['num_sections']}")

        print(f"\n  Sections:")
        for sec in results['sections']:
            ent = sec['entropy']
            flag = ' [!]' if ent > 7.0 else ''
            print(f"    {sec['name']:8s}  VA: 0x{sec['virtual_addr']:08x}  "
                  f"Size: {sec['raw_size']:8d}  Entropy: {ent:.2f}{flag}")

        if results['imports']:
            print(f"\n  Notable imports:")
            for api in results['imports']:
                print(f"    {api}")

        return results

def extract_strings_from_data(data, min_length=4):
    """Extract strings from raw data."""
    strings = []
    current = b''
    for byte in data:
        if 32 <= byte <= 126:
            current += bytes([byte])
        else:
            if len(current) >= min_length:
                strings.append(current.decode('ascii', errors='ignore'))
            current = b''
    return strings
```

## YARA rule matching

```python
import yara

def create_yara_rules():
    """Example YARA rules for common malware patterns."""
    rules_source = """
    rule suspicious_shellcode {
        meta:
            description = "Detects common shellcode patterns"
        strings:
            $s1 = { 31 c0 50 68 2f 2f 73 68 68 2f 62 69 6e }
            $s2 = { 90 90 90 90 }
            $s3 = { cd 80 }
        condition:
            2 of them
    }

    rule crypto_strings {
        meta:
            description = "Contains cryptocurrency-related strings"
        strings:
            $s1 = "bitcoin" nocase
            $s2 = "wallet" nocase
            $s3 = "mining" nocase
            $s4 = "ransom" nocase
        condition:
            any of them
    }

    rule persistence_mechanism {
        meta:
            description = "Windows persistence indicators"
        strings:
            $s1 = "CurrentVersion\\Run" nocase
            $s2 = "CurrentVersion\\RunOnce" nocase
            $s3 = "schtasks" nocase
            $s4 = "HKLM\\SOFTWARE" nocase
        condition:
            any of them
    }
    """
    return yara.compile(source=rules_source)

def scan_file(filepath, rules):
    """Scan a file against YARA rules."""
    matches = rules.match(filepath)
    return matches

def yara_analysis(filepath):
    """Run YARA analysis on a file."""
    rules = create_yara_rules()
    matches = scan_file(filepath, rules)

    if matches:
        print(f"\n[!] YARA matches found:")
        for match in matches:
            print(f"  Rule: {match.rule}")
            print(f"  Description: {match.meta.get('description', 'N/A')}")
            for string in match.strings:
                print(f"    Matched: {string}")
    else:
        print("\n[+] No YARA matches found")

    return matches
```

## Analysis report generator

```python
import json
from datetime import datetime
import hashlib
import os

def generate_analysis_report(filepath):
    """Generate a complete malware analysis report."""
    report = {
        'file': filepath,
        'timestamp': datetime.now().isoformat(),
        'file_info': {},
        'strings_analysis': {},
        'entropy': {},
        'yara_matches': [],
        'risk_score': 0
    }

    # File info
    stat = os.stat(filepath)
    report['file_info'] = {
        'size': stat.st_size,
        'md5': hashlib.md5(open(filepath, 'rb').read()).hexdigest(),
        'sha256': hashlib.sha256(open(filepath, 'rb').read()).hexdigest(),
    }

    # Strings analysis
    report['strings_analysis'] = categorize_strings(extract_strings(filepath))

    # Entropy
    report['entropy'] = entropy_analysis(filepath)

    # YARA
    rules = create_yara_rules()
    matches = scan_file(filepath, rules)
    report['yara_matches'] = [m.rule for m in matches]

    # Risk score
    risk = 0
    if report['entropy'].get('overall', 0) > 7.0:
        risk += 25
    risk += len(report['strings_analysis'].get('suspicious', [])) * 5
    risk += len(report['yara_matches']) * 20
    if report['strings_analysis'].get('urls'):
        risk += 15
    if report['strings_analysis'].get('commands'):
        risk += 10
    report['risk_score'] = min(risk, 100)

    # Print summary
    print(f"\n{'='*60}")
    print(f"Malware Analysis Report")
    print(f"{'='*60}")
    print(f"File: {filepath}")
    print(f"Size: {report['file_info']['size']} bytes")
    print(f"MD5:  {report['file_info']['md5']}")
    print(f"SHA:  {report['file_info']['sha256']}")
    print(f"Entropy: {report['entropy'].get('overall', 'N/A')}")
    print(f"Risk Score: {report['risk_score']}/100")
    print(f"{'='*60}")

    return report
```

## Assessment

**Lab Task — Analyze a suspicious binary (90 minutes)**

1. Write a string extraction tool that categorizes output (URLs, IPs, commands, etc.)
2. Implement entropy analysis that identifies packed/encrypted sections
3. Build a basic PE header parser that shows sections and imports
4. Create YARA rules for at least 3 patterns
5. Generate a complete analysis report with a risk score

**Grading:**
- String extraction with categorization: 20 pts
- Entropy analysis identifies anomalies: 20 pts
- PE parser extracts meaningful data: 25 pts
- YARA rules work and match correctly: 15 pts
- Report generator combines all results: 15 pts
- Risk scoring is reasonable: 5 pts

## Evidence

- Your analysis scripts
- String analysis output for a test binary
- Entropy visualization showing packed sections
- PE section analysis with import list
- YARA rule matches
- Complete analysis report with risk score
