# Module 3 — Containment

## What You'll Actually Do

The threat is confirmed. Now you stop it from spreading. You'll isolate systems without destroying evidence, lock down compromised accounts, and block attacker infrastructure — all while keeping the business running as much as possible.

## Containment Strategy

Containment is about making decisions fast with incomplete information. The two priorities:

```text
1. Stop the immediate damage
2. Preserve evidence for investigation
```

Don't power off machines — that destroys volatile memory. Don't nuke systems from orbit — you need them for forensics. Contain, don't destroy.

## Network Isolation

```bash
# Block an IP at the firewall (Linux)
sudo iptables -I INPUT -s 203.0.113.45 -j DROP
sudo iptables -I OUTPUT -d 203.0.113.45 -j DROP

# Persist the rule
sudo iptables-save > /etc/iptables/rules.v4

# Block a subnet
sudo iptables -I INPUT -s 203.0.113.0/24 -j DROP

# UFW equivalent
sudo ufw deny from 203.0.113.45
sudo ufw deny from 203.0.113.0/24

# Windows Firewall — block an IP
netsh advfirewall firewall add rule name="Block Attacker" dir=in action=block remoteip=203.0.113.45
```

```bash
# Isolate a host from the network (but keep console access)
# Option 1: Move to quarantine VLAN
# (Switch config — varies by vendor)
sudo ip link set ens3 down          # Nuclear option — last resort
sudo ip route add blackhole 0.0.0.0/0  # Drop all outbound traffic

# Option 2: Add firewall rules that only allow management
sudo iptables -F
sudo iptables -A INPUT -s 10.0.0.1/32 -j ACCEPT   # Management station only
sudo iptables -A INPUT -j DROP
sudo iptables -A OUTPUT -j DROP
```

## Account Lockdown

```bash
# Linux — disable account without deleting it
sudo passwd --lock compromised_user
sudo chage -E 0 compromised_user

# Revoke SSH keys
sudo rm /home/compromised_user/.ssh/authorized_keys
# Or comment out the key
sudo sed -i 's/^ssh-rsa/ disabled-ssh-rsa/' /home/compromised_user/.ssh/authorized_keys

# Check for other access methods
sudo grep -r "compromised_user" /etc/sudoers*
sudo crontab -l -u compromised_user    # Check for cron jobs

# AWS — revoke active sessions
aws iam update-login-profile --user-name compromised_user --password-reset-required
aws iam delete-access-key --user-name compromised_user --access-key-id AKIA...

# Azure — disable account and revoke tokens
az ad user update --id user@domain.com --account-enabled false
```

## Credential Rotation

```bash
# Force password reset (Linux)
sudo passwd --expire compromised_user

# Check for service accounts using the same password
grep -r "service_account" /etc/systemd/system/
grep -r "password" /etc/cron.d/

# Rotate database credentials
ALTER USER 'app_user'@'localhost' IDENTIFIED BY 'new_secure_password';
FLUSH PRIVILEGES;

# Rotate API keys
# 1. Generate new key
# 2. Update application config
# 3. Verify new key works
# 4. Revoke old key
```

## Containment Decision Matrix

```text
Scenario: Workstation compromise
  → Isolate from network (keep console access)
  → Preserve memory (don't reboot)
  → Capture volatile data before full containment

Scenario: Server compromise
  → Redirect traffic to standby
  → Keep original server intact for forensics
  → Block attacker IP at perimeter

Scenario: Account compromise
  → Lock the account immediately
  → Revoke all active sessions and tokens
  → Check for new accounts or keys created

Scenario: Ransomware spreading
  → Disconnect affected segment immediately
  → Block SMB traffic between VLANs
  → Preserve encryption keys for potential recovery
```

## Real Task: Contain a Compromise

```text
Situation:
  - You confirmed a server (10.0.1.25) is compromised
  - Attacker IP: 198.51.100.77
  - The server handles customer logins
  - Attacker has been running commands for ~2 hours

Steps to execute:
1. Block the attacker IP at the firewall
2. Redirect traffic from the compromised server to a standby
3. Preserve the original server for forensic analysis
4. Rotate all credentials the compromised server had access to
5. Check for lateral movement to other systems
6. Document every action with timestamps
```

## Assessment

**Lab task (25 min):**

1. Block a simulated attacker IP at the firewall
2. Isolate a compromised host while preserving evidence
3. Lock down a compromised account and revoke its sessions
4. Rotate credentials for affected services
5. Verify containment (attacker can no longer reach the system)
6. Document all containment actions with timestamps

**Grading:**
- Network isolation effective: 20%
- Account lockdown complete: 20%
- Credential rotation thorough: 20%
- Evidence preserved: 15%
- Documentation clear and timestamped: 15%
- Verification performed: 10%

## Evidence

- **OutcomeEvidence:** `IR-LO3 — Containment`
