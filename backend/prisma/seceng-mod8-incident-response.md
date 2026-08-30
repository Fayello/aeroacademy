# Module 8 — Incident Response

**Course:** Security Engineering | **Path:** Security Engineering (8 of 10)

---

## What You'll Actually Do

Something bad happened. A data breach, a compromised server, a ransomware attack. You'll follow a structured response process: detect, contain, eradicate, recover, and learn.

---

## The IR Process

```text
1. Preparation — before anything happens
2. Detection & Analysis — identify and assess
3. Containment — stop the bleeding
4. Eradication — remove the threat
5. Recovery — restore normal operations
6. Post-Incident — learn and improve
```

---

## Preparation

```text
- Incident response plan documented
- IR team identified and trained
- Communication channels established
- Forensics toolkit ready
- Backup and recovery tested
- Contact list (legal, PR, law enforcement)
```

---

## Detection & Analysis

```bash
# What happened?
dmesg | tail -20
journalctl --since "1 hour ago" -p err
grep "Failed password" /var/log/auth.log | tail -20

# Is it still happening?
ss -tunlp           # unexpected listening ports
ps aux --sort=-rss  # unexpected high memory
find / -mtime -1 -type f  # recently modified files

# Scope of impact
# Which systems are affected?
# What data might be exposed?
# Is it ongoing?
```

---

## Containment

```text
Short-term: Isolate the affected system
- Disconnect from network (but don't power off — preserve memory)
- Block attacker IP at firewall
- Disable compromised accounts

Long-term: Prevent spread
- Segment network
- Patch the vulnerability
- Reset all credentials that might be compromised
```

---

## Eradication

```text
- Remove malware/backdoors
- Patch the vulnerability
- Rebuild compromised systems from known-good images
- Verify clean state
```

---

## Recovery

```text
- Restore from backups (verified clean)
- Monitor closely for re-infection
- Gradually restore services
- Verify functionality
```

---

## Post-Incident

```text
- Timeline of events
- What worked, what didn't
- Root cause analysis
- Lessons learned
- Update IR plan
- Share with team (blameless)
```

---

## Real Task: Respond to an Incident

```text
Alert: Multiple failed login attempts from 198.51.100.50

1. Detection: grep auth.log, confirm brute force
2. Containment: ufw deny from 198.51.100.50
3. Analysis: Check if any login succeeded
4. If compromised: isolate, check for backdoors, reset credentials
5. Eradication: fix vulnerability (rate limiting, key-only auth)
6. Recovery: verify system integrity
7. Post-incident: document, update IR plan
```

---

## Assessment

**Lab task (25 min):**

1. Follow an IR playbook for a simulated incident
2. Contain a compromised system
3. Analyze logs to determine scope
4. Eradicate the threat
5. Document the incident

**Grading:**
- IR process followed: 25%
- Containment effective: 25%
- Analysis thorough: 20%
- Eradication complete: 15%
- Documentation clear: 15%

---

## Evidence

- **OutcomeEvidence:** `SEC-LO8 — Incident Response`
