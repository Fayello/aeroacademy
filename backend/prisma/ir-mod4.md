# Module 4 — Eradication

## What You'll Actually Do

The threat is contained. Now you remove it completely. You'll hunt for persistence mechanisms, clean compromised systems, and verify that every trace of the attacker is gone. Skip this step and they'll be back in a week.

## Finding Persistence

Attackers don't want to break in twice. They'll plant backdoors, scheduled tasks, and modified configs to maintain access.

```bash
# Linux — check for suspicious cron jobs
for user in $(cut -f1 -d: /etc/passwd); do
  echo "=== $user ==="
  crontab -l -u $user 2>/dev/null
done
cat /etc/crontab
ls -la /etc/cron.*
ls -la /var/spool/cron/

# Check systemd timers (modern cron replacement)
systemctl list-timers --all
ls -la /etc/systemd/system/
ls -la /lib/systemd/system/

# Check startup scripts
ls -la /etc/init.d/
ls -la /etc/rc.local
ls -la /etc/profile.d/

# Check for modified binaries
debsums --changed 2>/dev/null          # Debian/Ubuntu
rpm -Va 2>/dev/null                    # RHEL/CentOS

# Check for unauthorized SSH keys
find / -name authorized_keys -type f 2>/dev/null
grep -r "ssh-rsa" /home/*/.ssh/ /root/.ssh/ 2>/dev/null

# Check for suspicious user accounts
grep -v "nologin\|false" /etc/passwd
awk -F: '$3 == 0 {print}' /etc/passwd   # UID 0 accounts
```

```bash
# Windows — check for persistence
# Scheduled Tasks
schtasks /query /fo LIST /v | findstr /i "author\command"

# Startup Registry
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\Run
reg query HKCU\Software\Microsoft\Windows\CurrentVersion\Run
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\RunOnce

# Services
sc query type= service state= all | findstr /i "binpath"

# WMI subscriptions
wmic /namespace:\\root\subscription PATH __EventConsumer GET /FORMAT:list
wmic /namespace:\\root\subscription PATH __EventFilter GET /FORMAT:list

# Check for new user accounts
net user
net localgroup administrators
```

## Removing Threats

```bash
# Remove malicious cron entries
crontab -e -u compromised_user
# Delete the offending line

# Remove backdoor SSH keys
rm /home/user/.ssh/authorized_keys
# Rebuild from known-good

# Kill malicious processes
ps aux | grep suspicious_process
kill -9 <PID>

# Remove malicious packages
dpkg -l | grep suspicious_package
sudo apt purge suspicious_package

# Clean up modified binaries
sudo apt reinstall package_name

# Remove persistence from systemd
sudo rm /etc/systemd/system/malicious.service
sudo systemctl daemon-reload
```

## System Rebuild vs Clean

Sometimes cleaning isn't enough. If the system is deeply compromised, rebuild from a known-good image.

```text
Decision criteria:
  CLEAN if:
    - Attack was limited (single backdoor, one account)
    - You can verify the system state
    - No kernel-level rootkit suspected
    - Time pressure is extreme

  REBUILD if:
    - Multiple persistence mechanisms found
    - Kernel or core binaries modified
    - Rootkit suspected
    - You can't verify the system is clean
    - Compliance requires it
```

```bash
# Verify system integrity after cleaning
# Compare against known-good baseline
sha256sum /usr/bin/sshd
# Compare with baseline hash

# Check for rootkits
sudo chkrootkit
sudo rkhunter --check

# Verify running processes
ps aux | awk '{print $11}' | sort -u
# Compare against expected process list
```

## Verification Checklist

```text
Before declaring eradication complete:
□ All identified persistence mechanisms removed
□ All compromised accounts locked and credentials rotated
□ All modified files restored or system rebuilt
□ Malware/backdoors removed from disk
□ No suspicious processes running
□ Network connections to attacker infrastructure blocked
□ All affected services patched against initial vulnerability
□ Baseline integrity check passed
□ Second scan confirms no IOCs remain
```

## Real Task: Hunt and Clean

```text
Scenario: You have a compromised Linux server that's now isolated.

Known indicators:
- Attacker had root access
- IP 198.51.100.77 was communicating with a C2 server
- A suspicious process was found running on port 4444
- The server handles internal API traffic

Your job:
1. Search for all persistence mechanisms
2. Identify every file the attacker modified
3. Remove all backdoors and persistence
4. Verify the system is clean
5. Document everything you found
```

## Assessment

**Lab task (30 min):**

1. Audit a system for persistence mechanisms
2. Find at least 3 types of persistence (cron, SSH keys, startup scripts, etc.)
3. Remove all identified persistence
4. Verify system integrity after cleanup
5. Document all findings and actions taken

**Grading:**
- Persistence hunting thorough: 25%
- All persistence types found: 20%
- Cleanup complete: 20%
- Verification performed: 15%
- Documentation detailed: 20%

## Evidence

- **OutcomeEvidence:** `IR-LO4 — Eradication`
