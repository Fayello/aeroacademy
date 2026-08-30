# Module 7 — Memory Forensics

## What You'll Actually Do

Disk forensics shows you what the attacker saved. Memory forensics shows you what the attacker did while running. You'll use Volatility to analyze RAM dumps, extract running processes, network connections, injected code, and encryption keys that never touched the disk.

## Why Memory Matters

```text
What's in memory that's NOT on disk:
- Running processes (including malware that deletes itself)
- Network connections and open sockets
- Encryption keys and passwords
- Command history
- Injected DLLs and shellcode
- Clipboard contents
- Logged-in user sessions

If you reboot, all of this is gone.
This is why you collect memory BEFORE anything else.
```

## Acquiring Memory

```bash
# Linux — using LiME (Linux Memory Extractor)
# Load the kernel module to dump memory
sudo insmod lime.ko "path=/evidence/memory.lime format=lime"

# Alternative: /dev/mem (limited on newer kernels)
sudo dd if=/dev/mem of=/evidence/memory.raw bs=1M count=4096

# Windows — using winpmem or DumpIt
# winpmem (free, open source)
winpmem_mini_x64.exe evidence/memory.raw

# DumpIt (simple, just run it)
DumpIt.exe
# Output goes to current directory as memory.raw
```

## Volatility — The Memory Forensics Framework

```bash
# Identify the memory image profile
volatility -f memory.raw imageinfo

# List running processes
volatility -f memory.raw --profile=Win7SP1x64 pslist
volatility -f memory.raw --profile=Win7SP1x64 pstree

# List processes (including hidden ones via cross-referencing)
volatility -f memory.raw --profile=Win7SP1x64 psscan

# Extract process memory
volatility -f memory.raw --profile=Win7SP1x64 procdump -p 1234 --dump-dir /evidence/

# Extract a specific process's memory for analysis
volatility -f memory.raw --profile=Win7SP1x64 memdump -p 1234 --dump-dir /evidence/
```

## Network Connections from Memory

```bash
# Show all network connections
volatility -f memory.raw --profile=Win7SP1x64 netscan

# Show connections with process association
volatility -f memory.raw --profile=Win7SP1x64 connections
volatility -f memory.raw --profile=Win7SP1x64 sockets

# Look for suspicious outbound connections
volatility -f memory.raw --profile=Win7SP1x64 netscan | grep -v "127.0.0.1"
```

## Finding Injected Code

```bash
# Detect process hollowing and injection
volatility -f memory.raw --profile=Win7SP1x64 malfind

# Look for suspicious memory regions
volatility -f memory.raw --profile=Win7SP1x64 procinfo

# Check for hidden processes
volatility -f memory.raw --profile=Win7SP1x64 psscan | sort -k5 -n

# Compare pslist (what OS sees) vs psscan (raw scan)
# Differences = hidden processes
```

## Extracting Credentials and Keys

```bash
# Dump password hashes from memory
volatility -f memory.raw --profile=Win7SP1x64 hashdump

# Extract Kerberos tickets
volatility -f memory.raw --profile=Win7SP1x64 kerberos

# Find encryption keys (for ransomware cases)
volatility -f memory.raw --profile=Win7SP1x64`

# Check for cached credentials
volatility -f memory.raw --profile=Win7SP1x64 cachedump
```

## Analyzing Linux Memory

```bash
# Volatility supports Linux too
volatility -f memory.lime --profile=LinuxProfile linux_pslist
volatility -f memory.lime --profile=LinuxProfile linux_pidshist
volatility -f memory.lime --profile=LinuxProfile linux_bash
volatility -f memory.lime --profile=LinuxProfile linux_check_syscall
volatility -f memory.lime --profile=LinuxProfile linux_check_afinfo
volatility -f memory.lime --profile=LinuxProfile linux_volatility_check.c
```

## Real Task: Analyze a Memory Dump

```text
You're given:
- A memory dump from a compromised workstation
- The system was running Windows 10
- Suspicious network activity was detected before containment

Your analysis:
1. Identify the profile and verify the image
2. List all processes and find anything suspicious
3. Check network connections for C2 communication
4. Look for injected code or process hollowing
5. Extract any credentials or encryption keys
6. Identify the malware's behavior and indicators
```

## Assessment

**Lab task (30 min):**

1. Acquire a memory dump from a test system
2. Use Volatility to identify the image profile
3. List all processes and identify suspicious ones
4. Find network connections associated with malware
5. Detect injected code using malfind
6. Extract indicators of compromise from memory

**Grading:**
- Memory acquired correctly: 15%
- Profile identified: 10%
- Process analysis thorough: 20%
- Network connections analyzed: 20%
- Injected code detected: 15%
- IOCs extracted and documented: 20%

## Evidence

- **OutcomeEvidence:** `IR-LO7 — Memory Forensics`
