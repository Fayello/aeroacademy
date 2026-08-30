# Module 6 — Digital Forensics Fundamentals

## What You'll Actually Do

You need to figure out what happened, when, and how — with evidence that holds up if this goes to court or a regulatory investigation. You'll learn to handle digital evidence properly, maintain chain of custody, and document your findings in a way that's defensible.

## Why Forensics Matters

Every incident response has a forensics component. Even if you never go to court, you need to answer:
- What data was accessed?
- How did the attacker get in?
- How long were they in the environment?
- What else is affected?

Get the evidence wrong and your answers are worthless.

## Evidence Handling Principles

```text
1. Don't touch the original evidence
   - Work with copies
   - The original stays in a sealed, tamper-evident bag

2. Document everything
   - Who handled it, when, and what they did
   - Hash the evidence before and after every action

3. Maintain chain of custody
   - A log showing every person who had the evidence
   - From collection to final disposition

4. Preserve volatile evidence first
   Memory → Network connections → Running processes → Disk
   (This order matters — memory is lost on reboot)
```

## Creating Forensic Images

```bash
# Disk image using dd (bit-for-bit copy)
sudo dd if=/dev/sda of=/evidence/server_disk.img bs=4M status=progress

# Verify the image
sudo md5sum /dev/sda /evidence/server_disk.img
sudo sha256sum /dev/sda /evidence/server_disk.img

# Better: use dcfldd (forensic-aware dd)
sudo dcfldd if=/dev/sda of=/evidence/server_disk.img bs=4M hash=sha256 hashlog=/evidence/hashlog.txt

# Even better: use ewfacquire (Expert Witness Format)
ewfacquire /dev/sda -t /evidence/server_disk -C 001 -e evidence01 \
  -d sha256 -S 1GiB -m fast -f fatsafeguard
```

## Volatile Evidence Collection

```bash
# Order of collection (most volatile first)
# 1. Memory dump
sudo dd if=/dev/mem of=/evidence/memory.dump bs=1M
# Or using LiME (Linux Memory Extractor)
sudo insmod lime.ko "path=/evidence/memory.lime format=lime"

# 2. Running processes
ps auxwwf > /evidence/processes.txt
ps -eo pid,ppid,user,cmd --sort=start_time > /evidence/processes_detail.txt

# 3. Network connections
ss -tunap > /evidence/network_connections.txt
netstat -anp > /evidence/netstat.txt

# 4. Open files
lsof > /evidence/open_files.txt

# 5. Loaded kernel modules
lsmod > /evidence/kernel_modules.txt

# 6. System information
uname -a > /evidence/system_info.txt
date > /evidence/collection_time.txt
uptime > /evidence/uptime.txt
```

## Chain of Custody Form

```text
INCIDENT EVIDENCE LOG
=====================
Case ID:        IR-2026-001
Evidence ID:    EVD-001
Description:    Disk image of compromised server (10.0.1.25)
Collected by:   Jane Smith
Date collected: 2026-08-25 14:30 UTC
Collection method: dd if=/dev/sda of=/evidence/server.img

HASH VALUES (SHA256):
Before collection: abc123def456...
After collection:  abc123def456... (verified same)

CHAIN OF CUSTODY:
Date/Time      | Person            | Action
2026-08-25 14:30 | Jane Smith     | Collected disk image
2026-08-25 15:00 | Jane Smith     | Stored in evidence locker
2026-08-25 16:00 | Bob Jones      | Retrieved for analysis
2026-08-25 16:15 | Bob Jones      | Created working copy
2026-08-25 16:30 | Bob Jones      | Returned original to evidence locker

Storage location: Evidence Locker Room B, Cabinet 3, Slot 7
```

## Hashing and Verification

```bash
# Calculate hash before evidence handling
sha256sum /evidence/server.img > /evidence/server.img.sha256

# Verify hash hasn't changed
sha256sum -c /evidence/server.img.sha256
# Output: server.img: OK

# MD5 and SHA256 together (belt and suspenders)
md5sum /evidence/server.img > /evidence/server.img.md5
sha256sum /evidence/server.img > /evidence/server.img.sha256
```

## Real Task: Process a Forensic Evidence Package

```text
You're given:
- A disk image (suspected compromised server)
- A chain of custody form (incomplete)
- A case file describing the incident

Your job:
1. Complete the chain of custody form
2. Verify the disk image hash
3. Create a working copy (never work on original)
4. Collect volatile evidence from the running system
5. Document your actions in the evidence log
6. Identify the three most critical pieces of evidence to examine first
```

## Assessment

**Lab task (30 min):**

1. Create a forensic disk image of a drive
2. Calculate and verify hash values
3. Complete a chain of custody form
4. Collect volatile evidence from a running system
5. Document all forensic actions with timestamps
6. Identify priority evidence for investigation

**Grading:**
- Disk image created correctly: 20%
- Hashing and verification: 15%
- Chain of custody complete: 20%
- Volatile evidence collected in order: 15%
- Documentation thorough: 15%
- Priority evidence identified: 15%

## Evidence

- **OutcomeEvidence:** `IR-LO6 — Digital Forensics Fundamentals`
