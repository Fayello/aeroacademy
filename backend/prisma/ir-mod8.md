# Module 8 — Disk Forensics

## What You'll Actually Do

The disk is where attackers leave artifacts: modified files, deleted evidence, hidden data, and traces of their tools. You'll mount forensic images, recover deleted files, analyze file systems, and extract timeline data that shows what happened and when.

## Working with Disk Images

```bash
# Mount a forensic image read-only (never write to original)
mkdir -p /mnt/evidence
sudo mount -o ro,loop,offset=0 /evidence/disk.img /mnt/evidence

# For E01 (Expert Witness Format) images
sudo ewfmount /evidence/disk.E01 /mnt/ewf/
ls /mnt/ewf/ewf1    # The raw image

# For AFF images
sudo affmount /evidence/disk.aff /mnt/aff/
ls /mnt/aff/

# List filesystem info
file /evidence/disk.img
fdisk -l /evidence/disk.img
```

## File Recovery

```bash
# Recover deleted files with foremost
foremost -i /evidence/disk.img -o /output/recovered/

# Recover with testdisk (interactive)
testdisk /evidence/disk.img

# Carve specific file types
photorec /evidence/disk.img

# Recover from NTFS (undelete)
tsk_recover /evidence/disk.img /output/recovered/

# Search for specific content
strings /evidence/disk.img | grep -i "password"
strings /evidence/disk.img | grep -E "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"
```

## File System Analysis

```bash
# Linux filesystem — find recently modified files
find /mnt/evidence -type f -mtime -7 -ls

# Find files by owner
find /mnt/evidence -type f -user root -ls

# Find SUID/SGID files
find /mnt/evidence -type f \( -perm -4000 -o -perm -2000 \) -ls

# Find files with extended attributes
find /mnt/evidence -type f -exec ls -la {} \;

# Check for hidden files
find /mnt/evidence -name ".*" -type f

# NTFS — check Alternate Data Streams
getfattr -d -m - /mnt/evidence/*

# Check for hidden partitions
fdisk -l /mnt/evidence/disk.img | grep -v "Disk /dev"
```

## Timeline Analysis

```bash
# Create a filesystem timeline
fls -r -m "" /mnt/evidence/disk.img > /output/timeline.body

# Convert to human-readable format
mactime -b /output/timeline.body -d > /output/timeline.csv

# Find files modified during the incident window
fls -r -t "2026-08-25 14:00..2026-08-25 16:00" /mnt/evidence/disk.img

# Check file system journal for deleted entries
icat /mnt/evidence/disk.img $MFT > /output/mft.raw
```

## Analyzing Windows Artifacts

```bash
# Registry hives
# System:     /mnt/evidence/Windows/System32/config/SYSTEM
# Software:   /mnt/evidence/Windows/System32/config/SOFTWARE
# SAM:        /mnt/evidence/Windows/System32/config/SAM
# Security:   /mnt/evidence/Windows/System32/config/SECURITY
# NTUSER.DAT: /mnt/evidence/Users/<username>/NTUSER.DAT

# Parse registry with reglookup
reglookup /mnt/evidence/Windows/System32/config/SOFTWARE > /output/software_reg.csv

# Extract USB device history
reglookup -p "Microsoft/Windows/CurrentVersion/Explorer/DriveIcons" \
  /mnt/evidence/Windows/System32/config/SYSTEM

# Browser history (Chrome)
# Location: /Users/<user>/AppData/Local/Google/Chrome/User Data/Default/History
# Copy and open with sqlite3
sqlite3 History "SELECT url, title, last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 50;"

# Recent files
ls -la /mnt/evidence/Users/*/AppData/Roaming/Microsoft/Windows/Recent/
```

## Real Task: Analyze a Compromised Disk

```text
You're given:
- A disk image from a compromised workstation
- The system was used by an employee who accessed sensitive data
- Timestamps suggest the compromise started 3 days ago

Your analysis:
1. Mount the image and identify the filesystem
2. Create a timeline of file activity during the incident window
3. Recover any deleted files
4. Check for hidden files or alternate data streams
5. Examine browser history for data exfiltration
6. Look for evidence of tools the attacker used
```

## Assessment

**Lab task (30 min):**

1. Mount a forensic disk image safely
2. Create a filesystem timeline for the incident window
3. Recover at least 2 deleted files
4. Identify hidden or suspicious files
5. Analyze Windows artifacts (registry, browser history)
6. Document all findings with timestamps

**Grading:**
- Image mounted correctly: 10%
- Timeline created: 20%
- Deleted files recovered: 15%
- Hidden files identified: 15%
- Windows artifacts analyzed: 20%
- Documentation complete: 20%

## Evidence

- **OutcomeEvidence:** `IR-LO8 — Disk Forensics`
