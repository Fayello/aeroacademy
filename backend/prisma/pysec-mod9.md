# Module 9 — Malware Analysis Scripts

Malware analysis is the process of understanding what a malicious program does. Static analysis examines the code without running it. Dynamic analysis runs it in a sandbox. This module focuses on static analysis with Python — extracting strings, parsing PE files, matching YARA rules, and calculating entropy. These techniques let you triage suspicious files quickly without risking infection.

## Why Malware Analysis Matters

Every organization faces malware. Phishing emails deliver malicious attachments. Drive-by downloads compromise browsers. Supply chain attacks inject malicious code into legitimate software. When a suspicious file appears on a system, someone needs to determine: what does it do, is it actually malicious, and what damage did it cause?

Malware analysis answers these questions. Static analysis examines the file without executing it, extracting indicators of compromise — IP addresses, domain names, file paths, registry keys. These indicators help you identify the malware family, attribute it to a threat actor, and find related samples. Dynamic analysis runs the malware in a controlled environment, observing its behavior — files created, network connections made, registry keys modified.

The practical challenge is volume. Security operations centers receive thousands of suspicious files daily. Most are benign — false positives from antivirus heuristics, encrypted archives flagged as suspicious, or legitimate tools misidentified as malware. You cannot run dynamic analysis on every file. It's too slow and too risky. Static analysis provides rapid triage. A file with high entropy, suspicious API calls, and known malicious strings gets priority for deeper analysis. A file with normal entropy, standard library imports, and no suspicious strings can be dismissed quickly.

Python is ideal for malware analysis because it handles binary data naturally, has libraries for parsing file formats, and lets you write custom analysis logic quickly. The techniques in this module — string extraction, PE parsing, entropy calculation, YARA matching — form the foundation of automated malware triage systems used by security operations centers worldwide.

## Static Analysis: String Extraction

The simplest and often most revealing analysis technique: extract readable strings from a binary. Malware authors can't hide everything. IP addresses, domain names, file paths, registry keys, and error messages all appear as strings.

```python
import re
from pathlib import Path
from collections import Counter

def extract_strings(filepath, min_length=4, encoding="ascii"):
    """Extract strings from a binary file"""
    strings = []

    with open(filepath, "rb") as f:
        data = f.read()

    # ASCII strings
    current = []
    for byte in data:
        if 32 <= byte <= 126:
            current.append(chr(byte))
        else:
            if len(current) >= min_length:
                strings.append("".join(current))
            current = []

    # Unicode (UTF-16LE) strings
    if encoding == "unicode":
        current = []
        for i in range(0, len(data) - 1, 2):
            char = data[i] + data[i + 1] * 256
            if 32 <= char <= 126:
                current.append(chr(char))
            else:
                if len(current) >= min_length:
                    strings.append("".join(current))
                current = []

    return strings

def categorize_strings(strings):
    """Categorize extracted strings"""
    categories = {
        "urls": [],
        "ips": [],
        "file_paths": [],
        "registry_keys": [],
        "emails": [],
        "commands": [],
        "crypto_patterns": [],
        "suspicious": [],
    }

    patterns = {
        "urls": r"https?://[^\s\"'<>]+",
        "ips": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
        "file_paths": r"[A-Z]:\\[^\s\"']+|/[a-z][^\s\"']+",
        "registry_keys": r"HK(?:LM|CU|U|CR|CC)\\[^\s\"']+",
        "emails": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    }

    for string in strings:
        for category, pattern in patterns.items():
            if re.search(pattern, string, re.IGNORECASE):
                categories[category].append(string)

        # Suspicious patterns
        suspicious = [
            "cmd.exe", "powershell", "wscript", "cscript",
            "regedit", "taskkill", "net user", "netsh",
            "certutil", "bitsadmin", "mshta", "rundll32",
            "CreateRemoteThread", "VirtualAllocEx", "WriteProcessMemory",
            "SetWindowsHookEx", "GetAsyncKeyState",
            "password", "credential", "token", "keylog",
        ]

        for pattern in suspicious:
            if pattern.lower() in string.lower():
                categories["suspicious"].append(string)
                break

    return categories

def analyze_strings(filepath):
    """Complete string analysis"""
    strings = extract_strings(filepath)
    categories = categorize_strings(strings)

    print(f"File: {filepath}")
    print(f"Total strings: {len(strings)}")

    for category, items in categories.items():
        if items:
            unique = list(set(items))
            print(f"\n{category.upper()} ({len(unique)}):")
            for item in unique[:10]:
                print(f"  {item}")

    return categories

# Usage
results = analyze_strings("suspicious.exe")
```

## PE File Parsing

Windows executables follow the Portable Executable (PE) format. Parsing it reveals imports, sections, compilation timestamps, and other metadata useful for analysis.

```python
import struct
from pathlib import Path
from datetime import datetime, timedelta

class PEParser:
    """Minimal PE file parser for malware analysis"""

    def __init__(self, filepath):
        self.filepath = Path(filepath)
        self.data = self.filepath.read_bytes()
        self.dos_header = {}
        self.pe_header = {}
        self.sections = []
        self.imports = []

    def parse_dos_header(self):
        """Parse DOS header"""
        if self.data[:2] != b"MZ":
            raise ValueError("Not a valid PE file")

        self.dos_header = {
            "e_magic": self.data[:2],
            "e_lfanew": struct.unpack_from("<I", self.data, 60)[0]
        }
        return self.dos_header

    def parse_pe_header(self):
        """Parse PE header"""
        pe_offset = self.dos_header["e_lfanew"]

        # Verify PE signature
        if self.data[pe_offset:pe_offset + 4] != b"PE\x00\x00":
            raise ValueError("Invalid PE signature")

        # COFF Header
        coff_offset = pe_offset + 4
        machine = struct.unpack_from("<H", self.data, coff_offset)[0]
        num_sections = struct.unpack_from("<H", self.data, coff_offset + 2)[0]
        timestamp = struct.unpack_from("<I", self.data, coff_offset + 4)[0]

        # Convert timestamp
        try:
            compile_time = datetime(1970, 1, 1) + timedelta(seconds=timestamp)
        except (OSError, ValueError):
            compile_time = "Invalid"

        # Optional Header
        optional_offset = coff_offset + 20
        magic = struct.unpack_from("<H", self.data, optional_offset)[0]
        is_pe32plus = magic == 0x20b

        if is_pe32plus:
            image_base = struct.unpack_from("<Q", self.data, optional_offset + 24)[0]
        else:
            image_base = struct.unpack_from("<I", self.data, optional_offset + 28)[0]

        self.pe_header = {
            "machine": hex(machine),
            "num_sections": num_sections,
            "compile_time": compile_time,
            "timestamp": timestamp,
            "image_base": hex(image_base),
            "is_pe32plus": is_pe32plus,
            "magic": hex(magic),
        }
        return self.pe_header

    def parse_sections(self):
        """Parse section headers"""
        pe_offset = self.dos_header["e_lfanew"]
        num_sections = self.pe_header["num_sections"]

        # Section headers start after optional header
        if self.pe_header["is_pe32plus"]:
            section_offset = pe_offset + 4 + 20 + 112  # PE32+
        else:
            section_offset = pe_offset + 4 + 20 + 96   # PE32

        self.sections = []
        for i in range(num_sections):
            offset = section_offset + (i * 40)
            section_data = self.data[offset:offset + 40]

            name = section_data[:8].rstrip(b"\x00").decode("ascii", errors="ignore")
            virtual_size = struct.unpack_from("<I", section_data, 8)[0]
            virtual_address = struct.unpack_from("<I", section_data, 12)[0]
            raw_size = struct.unpack_from("<I", section_data, 16)[0]
            raw_offset = struct.unpack_from("<I", section_data, 20)[0]
            characteristics = struct.unpack_from("<I", section_data, 36)[0]

            self.sections.append({
                "name": name,
                "virtual_size": virtual_size,
                "virtual_address": hex(virtual_address),
                "raw_size": raw_size,
                "raw_offset": raw_offset,
                "characteristics": hex(characteristics),
                "executable": bool(characteristics & 0x20000000),
                "writable": bool(characteristics & 0x80000000),
                "readable": bool(characteristics & 0x40000000),
            })

        return self.sections

    def get_entropy(self):
        """Calculate entropy for each section"""
        import math

        for section in self.sections:
            offset = section["raw_offset"]
            size = section["raw_size"]

            if size == 0:
                section["entropy"] = 0
                continue

            section_data = self.data[offset:offset + size]

            # Calculate byte frequency
            freq = [0] * 256
            for byte in section_data:
                freq[byte] += 1

            # Calculate entropy
            entropy = 0
            for count in freq:
                if count > 0:
                    p = count / size
                    entropy -= p * math.log2(p)

            section["entropy"] = round(entropy, 4)

        return self.sections

    def analyze(self):
        """Complete PE analysis"""
        self.parse_dos_header()
        self.parse_pe_header()
        self.parse_sections()
        self.get_entropy()

        print(f"File: {self.filepath}")
        print(f"Machine: {self.pe_header['machine']}")
        print(f"Compiled: {self.pe_header['compile_time']}")
        print(f"Image Base: {self.pe_header['image_base']}")
        print(f"PE32+: {self.pe_header['is_pe32plus']}")
        print(f"\nSections:")
        for section in self.sections:
            entropy_flag = " [HIGH ENTROPY]" if section["entropy"] > 7.0 else ""
            print(f"  {section['name']:8s} VA:{section['virtual_address']:10s} "
                  f"Raw:{section['raw_size']:8d} Entropy:{section['entropy']:.2f}{entropy_flag}")

        return {
            "header": self.pe_header,
            "sections": self.sections
        }

# Usage
parser = PEParser("suspicious.exe")
result = parser.analyze()
```

## YARA Rule Matching

YARA is the pattern matching Swiss Army knife for malware analysts. You write rules that describe malware characteristics, then scan files against those rules.

```python
import yara
from pathlib import Path

# Compile YARA rules from strings
YARA_RULES = """
rule malware_strings {
    meta:
        description = "Detects common malware strings"
        severity = "high"

    strings:
        $s1 = "cmd.exe /c" nocase
        $s2 = "powershell -enc" nocase
        $s3 = "certutil -urlcache" nocase
        $s4 = "bitsadmin /transfer" nocase
        $s5 = "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
        $s6 = "schtasks /create" nocase
        $s7 = "netsh firewall" nocase

    condition:
        3 of them
}

rule suspicious_api {
    meta:
        description = "Detects suspicious Windows API calls"
        severity = "high"

    strings:
        $api1 = "VirtualAllocEx"
        $api2 = "WriteProcessMemory"
        $api3 = "CreateRemoteThread"
        $api4 = "SetWindowsHookEx"
        $api5 = "GetAsyncKeyState"
        $api6 = "OpenProcess"
        $api7 = "AdjustTokenPrivileges"

    condition:
        3 of them
}

rule packed_executable {
    meta:
        description = "Detects potentially packed executables"
        severity = "medium"

    strings:
        $upx = "UPX"
        $aspack = "ASPack"
        $petite = "PEtite"
        $themida = "Themida"

    condition:
        any of them
}
"""

class YaraScanner:
    def __init__(self, rules_source=None):
        if rules_source:
            self.rules = yara.compile(source=rules_source)
        else:
            self.rules = yara.compile(source=YARA_RULES)

    def scan_file(self, filepath):
        """Scan a file with YARA rules"""
        matches = self.rules.match(str(filepath))

        results = []
        for match in matches:
            results.append({
                "rule": match.rule,
                "description": match.meta.get("description", ""),
                "severity": match.meta.get("severity", "unknown"),
                "strings": [(s.identifier, s.instances) for s in match.strings],
                "tags": match.tags
            })

        return results

    def scan_directory(self, directory, extensions=None):
        """Scan all files in a directory"""
        if extensions is None:
            extensions = [".exe", ".dll", ".scr", ".com", ".bat", ".ps1", ".vbs"]

        results = {}
        path = Path(directory)

        for filepath in path.rglob("*"):
            if filepath.suffix.lower() in extensions:
                file_results = self.scan_file(filepath)
                if file_results:
                    results[str(filepath)] = file_results

        return results

# Usage
scanner = YaraScanner()
results = scanner.scan_file("suspicious.exe")

for result in results:
    print(f"Rule: {result['rule']}")
    print(f"Severity: {result['severity']}")
    print(f"Description: {result['description']}")
    print()
```

### Custom YARA Rules from Samples

```python
def generate_yara_rule(sample_files, rule_name="auto_generated"):
    """Generate a YARA rule from multiple malware samples"""
    all_strings = {}

    for filepath in sample_files:
        with open(filepath, "rb") as f:
            data = f.read()

        # Extract unique strings
        current = []
        for byte in data:
            if 32 <= byte <= 126:
                current.append(chr(byte))
            else:
                if len(current) >= 6:
                    string = "".join(current)
                    if string not in all_strings:
                        all_strings[string] = 0
                    all_strings[string] += 1
                current = []

    # Find strings common to all samples
    num_samples = len(sample_files)
    common_strings = {
        s: count for s, count in all_strings.items()
        if count >= num_samples * 0.5  # Present in at least half the samples
    }

    # Select top strings
    top_strings = sorted(common_strings.items(), key=lambda x: x[1], reverse=True)[:20]

    # Generate rule
    rule = f"rule {rule_name} {{\n"
    rule += "    meta:\n"
    rule += f'        description = "Auto-generated rule from {num_samples} samples"\n\n'
    rule += "    strings:\n"

    for i, (string, count) in enumerate(top_strings):
        # Escape string for YARA
        escaped = string.replace("\\", "\\\\").replace('"', '\\"')
        rule += f'        $s{i} = "{escaped}"\n'

    rule += f"\n    condition:\n"
    rule += f"        {min(5, len(top_strings))} of them\n"
    rule += "}"

    return rule

# Usage
rule = generate_yara_rule(["sample1.exe", "sample2.exe", "sample3.exe"])
print(rule)
```

## Entropy Calculation

Entropy measures randomness. Encrypted or compressed data has high entropy (near 8.0). Normal code has lower entropy (4.0-6.0). High entropy sections in executables suggest packing or encryption.

```python
import math
from pathlib import Path

def calculate_entropy(data):
    """Calculate Shannon entropy of data"""
    if not data:
        return 0.0

    freq = [0] * 256
    for byte in data:
        freq[byte] += 1

    entropy = 0.0
    for count in freq:
        if count > 0:
            probability = count / len(data)
            entropy -= probability * math.log2(probability)

    return entropy

def analyze_file_entropy(filepath):
    """Analyze entropy across a file"""
    with open(filepath, "rb") as f:
        data = f.read()

    file_entropy = calculate_entropy(data)
    print(f"File: {filepath}")
    print(f"Overall entropy: {file_entropy:.4f}")
    print(f"File size: {len(data)} bytes")

    # Analyze in blocks
    block_size = 1024
    print(f"\nEntropy by block ({block_size} bytes):")

    high_entropy_regions = []
    for i in range(0, len(data), block_size):
        block = data[i:i + block_size]
        block_entropy = calculate_entropy(block)

        if block_entropy > 7.0:
            high_entropy_regions.append((i, block_entropy))

        # Visual bar
        bar_length = int(block_entropy * 5)
        bar = "█" * bar_length
        offset_hex = hex(i)
        print(f"  {offset_hex:>10s} |{bar:<40s}| {block_entropy:.2f}")

    if high_entropy_regions:
        print(f"\nHigh entropy regions (>7.0): {len(high_entropy_regions)}")
        for offset, entropy in high_entropy_regions[:5]:
            print(f"  Offset {hex(offset)}: entropy {entropy:.4f}")

    # Interpretation
    print(f"\nInterpretation:")
    if file_entropy > 7.5:
        print("  VERY HIGH entropy - likely encrypted or compressed")
    elif file_entropy > 7.0:
        print("  HIGH entropy - possibly packed or encrypted")
    elif file_entropy > 6.0:
        print("  MODERATE entropy - normal for compiled code")
    elif file_entropy > 4.0:
        print("  LOW entropy - likely uncompressed code/data")
    else:
        print("  VERY LOW entropy - possibly mostly zeros or simple data")

    return file_entropy, high_entropy_regions

# Usage
entropy, regions = analyze_file_entropy("suspicious.exe")
```

### Entropy Visualization

```python
def generate_entropy_heatmap(filepath, output_html="entropy_map.html"):
    """Generate an HTML entropy visualization"""
    with open(filepath, "rb") as f:
        data = f.read()

    block_size = 256
    entropies = []

    for i in range(0, len(data), block_size):
        block = data[i:i + block_size]
        entropies.append(calculate_entropy(block))

    # Generate HTML with color-coded heatmap
    html = """<!DOCTYPE html>
<html>
<head><title>Entropy Analysis</title>
<style>
.cell { width: 4px; height: 4px; display: inline-block; margin: 0; }
</style>
</head>
<body>
<h2>Entropy Analysis: """ + Path(filepath).name + """</h2>
<p>Size: """ + f"{len(data)} bytes" + """</p>
<div>
"""
    for entropy in entropies:
        # Map entropy to color (0=blue, 4=green, 6=yellow, 8=red)
        if entropy < 4:
            r, g, b = 0, 0, int(entropy / 4 * 255)
        elif entropy < 6:
            r, g, b = 0, int((entropy - 4) / 2 * 255), 255
        else:
            r, g, b = int((entropy - 6) / 2 * 255), 255, int((8 - entropy) / 2 * 255)

        html += f'<div class="cell" style="background:rgb({r},{g},{b})" title="Entropy: {entropy:.2f}"></div>\n'

    html += """</div>
<div>
<p><span style="background:rgb(0,0,255);padding:5px">Low (0-4)</span>
<span style="background:rgb(0,255,255);padding:5px">Medium (4-6)</span>
<span style="background:rgb(255,255,0);padding:5px">High (6-7)</span>
<span style="background:rgb(255,0,0);padding:5px;padding:5px">Very High (7-8)</span></p>
</div>
</body></html>"""

    Path(output_html).write_text(html)
    print(f"Heatmap saved to {output_html}")

# Usage
generate_entropy_heatmap("suspicious.exe")
```

## Real Scenario: Analyzing a Suspicious Executable

Combine all techniques to analyze a suspicious file:

```python
#!/usr/bin/env python3
"""
Malware Analysis Script
Performs static analysis on suspicious executables.
"""

import re
import math
import json
from pathlib import Path
from datetime import datetime
from collections import Counter
from typing import Dict, List, Any

class MalwareAnalyzer:
    def __init__(self, filepath):
        self.filepath = Path(filepath)
        self.data = self.filepath.read_bytes()
        self.results = {
            "file": str(self.filepath),
            "size": len(self.data),
            "md5": None,
            "sha256": None,
            "strings": {},
            "entropy": {},
            "pe_info": None,
            "yara_matches": [],
            "indicators": [],
            "risk_score": 0,
        }

    def calculate_hashes(self):
        """Calculate file hashes"""
        import hashlib

        self.results["md5"] = hashlib.md5(self.data).hexdigest()
        self.results["sha256"] = hashlib.sha256(self.data).hexdigest()
        print(f"MD5: {self.results['md5']}")
        print(f"SHA256: {self.results['sha256']}")

    def extract_strings(self, min_length=6):
        """Extract and categorize strings"""
        strings = []

        # ASCII
        current = []
        for byte in self.data:
            if 32 <= byte <= 126:
                current.append(chr(byte))
            else:
                if len(current) >= min_length:
                    strings.append("".join(current))
                current = []

        # Categorize
        urls = []
        ips = []
        paths = []
        suspicious = []

        url_pattern = re.compile(r'https?://[^\s"\'<>]+')
        ip_pattern = re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')

        suspicious_keywords = [
            "cmd.exe", "powershell", "wscript", "cscript",
            "regsvr32", "rundll32", "mshta", "certutil",
            "CreateRemoteThread", "VirtualAllocEx", "WriteProcessMemory",
            "password", "credential", "token", "keylog",
            "mimikatz", "lazagne", "bloodhound",
        ]

        for string in strings:
            if url_pattern.search(string):
                urls.append(string)
            if ip_pattern.search(string):
                ips.append(string)
            if "\\" in string and ("windows" in string.lower() or "system32" in string.lower()):
                paths.append(string)
            for keyword in suspicious_keywords:
                if keyword.lower() in string.lower():
                    suspicious.append(string)
                    break

        self.results["strings"] = {
            "total": len(strings),
            "urls": list(set(urls)),
            "ips": list(set(ips)),
            "paths": list(set(paths)),
            "suspicious": list(set(suspicious)),
        }

        print(f"\nStrings: {len(strings)} total")
        if urls:
            print(f"  URLs: {list(set(urls))[:5]}")
        if ips:
            print(f"  IPs: {list(set(ips))[:5]}")
        if suspicious:
            print(f"  Suspicious: {list(set(suspicious))[:5]}")

    def analyze_entropy(self):
        """Analyze entropy distribution"""
        block_size = 1024
        entropies = []

        for i in range(0, len(self.data), block_size):
            block = self.data[i:i + block_size]
            entropies.append(self._calculate_entropy(block))

        overall = self._calculate_entropy(self.data)
        high_entropy_blocks = sum(1 for e in entropies if e > 7.0)

        self.results["entropy"] = {
            "overall": round(overall, 4),
            "average_block": round(sum(entropies) / len(entropies), 4) if entropies else 0,
            "high_entropy_blocks": high_entropy_blocks,
            "total_blocks": len(entropies),
        }

        print(f"\nEntropy: {overall:.4f} (overall)")
        if high_entropy_blocks > 0:
            print(f"  High entropy blocks: {high_entropy_blocks}/{len(entropies)}")
            print(f"  Possible packing/encryption detected")

    def _calculate_entropy(self, data):
        if not data:
            return 0.0
        freq = [0] * 256
        for byte in data:
            freq[byte] += 1
        entropy = 0.0
        for count in freq:
            if count > 0:
                p = count / len(data)
                entropy -= p * math.log2(p)
        return entropy

    def parse_pe(self):
        """Parse PE header if applicable"""
        if self.data[:2] != b"MZ":
            print("\nNot a PE file")
            return

        try:
            pe_offset = struct.unpack_from("<I", self.data, 60)[0]
            if self.data[pe_offset:pe_offset + 4] != b"PE\x00\x00":
                return

            timestamp = struct.unpack_from("<I", self.data, pe_offset + 4 + 4)[0]
            compile_time = datetime(1970, 1, 1) + __import__('datetime').timedelta(seconds=timestamp)

            self.results["pe_info"] = {
                "compile_time": str(compile_time),
                "timestamp": timestamp,
            }

            print(f"\nPE Info:")
            print(f"  Compiled: {compile_time}")
        except Exception as e:
            print(f"PE parsing error: {e}")

    def calculate_risk_score(self):
        """Calculate a risk score based on findings"""
        score = 0

        # Entropy-based scoring
        if self.results["entropy"]["overall"] > 7.5:
            score += 30
        elif self.results["entropy"]["overall"] > 7.0:
            score += 20

        # Suspicious strings
        suspicious_count = len(self.results["strings"].get("suspicious", []))
        score += min(suspicious_count * 5, 30)

        # External IPs
        ip_count = len(self.results["strings"].get("ips", []))
        if ip_count > 0:
            score += 10

        # URLs
        url_count = len(self.results["strings"].get("urls", []))
        if url_count > 0:
            score += 10

        # Cap at 100
        score = min(score, 100)
        self.results["risk_score"] = score

        print(f"\nRisk Score: {score}/100")
        if score >= 70:
            print("  CRITICAL - Likely malicious")
        elif score >= 50:
            print("  HIGH - Suspicious, investigate further")
        elif score >= 30:
            print("  MEDIUM - Some indicators present")
        else:
            print("  LOW - Few indicators")

    def generate_report(self):
        """Generate complete analysis report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "file": str(self.filepath),
            "analysis": self.results
        }

        output_file = self.filepath.with_suffix(".analysis.json")
        with open(output_file, "w") as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\nReport saved: {output_file}")
        return report

    def run(self):
        """Run complete analysis"""
        print(f"Malware Analysis: {self.filepath}")
        print("=" * 50)

        self.calculate_hashes()
        self.extract_strings()
        self.analyze_entropy()
        self.parse_pe()
        self.calculate_risk_score()
        self.generate_report()

# Usage
analyzer = MalwareAnalyzer("suspicious.exe")
analyzer.run()
```

## Assessment

### Lab Task: Malware Sample Analysis

Analyze a suspicious executable and produce a complete report. Time limit: 120 minutes.

**Requirements:**
1. Calculate file hashes (MD5, SHA256)
2. Extract and categorize strings (URLs, IPs, paths, suspicious)
3. Calculate and interpret entropy
4. Parse PE header if applicable
5. Calculate a risk score
6. Generate a JSON report

**Deliverables:**
- Analysis script (`malware_analyzer.py`)
- Analysis report (JSON file)
- Written summary with risk assessment

**Grading Criteria:**
- Hashes are correct (10 points)
- Strings are extracted and categorized (25 points)
- Entropy is calculated and interpreted correctly (20 points)
- PE parsing works (15 points)
- Risk score is reasonable (15 points)
- Report is complete (15 points)

### Bonus Challenges

- Implement YARA rule matching
- Generate an entropy heatmap visualization
- Compare multiple samples to find commonalities
- Extract and deobfuscate PowerShell commands

## Malware Analysis Safety

Malware analysis involves handling malicious software. Even static analysis carries risk — a accidental double-click, a misconfigured tool that executes the sample, or a decompression routine that triggers malicious code. Safety protocols are not optional.

Work in an isolated environment. Use a virtual machine with no network access. Disable shared folders between the host and the VM. Take a snapshot before analysis so you can revert to a clean state. The VM should be disposable — if it gets infected, delete it and create a new one.

Never analyze malware on a production system or a system connected to your network. A single mistake can infect your entire organization. The few minutes saved by analyzing on your workstation are not worth the risk of a company-wide outbreak.

Store malware samples securely. Encrypt the storage directory. Use access controls to limit who can access the samples. Never email malware samples — use secure file transfer. Never upload samples to public services — they might distribute the malware to other users.

Document everything. When you find a malicious sample, document where you found it, what system it was on, and what it was doing. This documentation is essential for incident response and legal proceedings. Hash the sample and record the hashes. These hashes help other analysts identify the same malware in their environments.

Static analysis is safe because you never execute the code. You examine the inert binary, extract strings, calculate entropy, and parse headers. The malware sits on disk doing nothing while you analyze it. This safety is why static analysis is the first step in any malware investigation — it provides intelligence without risk.

## Evidence

Malware analysis is how you understand threats. You can't defend against what you don't understand. The techniques you learned here — string extraction, PE parsing, entropy analysis, YARA matching — are the first steps in any malware investigation.

The key insight is that static analysis is fast and safe. You never run the malware. You examine its inert form and extract intelligence. This is triage — determining which samples need deeper analysis and which can be dismissed.

**Libraries covered:** re, math, json, hashlib, struct, pathlib, collections

**Concepts covered:** String extraction, PE file parsing, entropy calculation, YARA rules, hash computation, risk scoring, static malware analysis