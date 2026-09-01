# Module 7: SSH Hardening

## Why This Matters

SSH is the front door to your server. If an attacker can log in over SSH, they own the machine. The default SSH configuration on most Linux distributions is functional but not hardened: it allows password authentication, permits root login, runs on port 22 (the most scanned port on the internet), and has no brute-force protection.

SSH hardening is not optional. It is one of the first things you do on any new server, and it is the first thing you audit when you suspect a breach. This module covers every layer of SSH security, from key-based authentication to intrusion detection, and walks through a complete hardening scenario.

## The Threat Model

Before hardening, understand what you are defending against:

1. **Brute-force attacks**: automated bots trying thousands of username/password combinations against port 22. These bots scan the entire internet, targeting every IP address that has port 22 open. They can attempt thousands of passwords per minute.

2. **Credential stuffing**: using leaked passwords from other breaches to attempt login. If a user reuses their password across services, a breach at one service exposes all accounts using that password.

3. **Unauthorized access**: someone who should not have access trying to log in. This could be a disgruntled former employee, a contractor whose access was not revoked, or an attacker who obtained credentials through phishing.

4. **Privilege escalation**: an attacker who compromises a low-privilege account and tries to become root. Once they have a shell, they can exploit kernel vulnerabilities, misconfigured sudo rules, or SUID binaries.

5. **Man-in-the-middle**: an attacker intercepting SSH connections to capture credentials or modify traffic. This is less common on modern networks but possible on shared infrastructure or compromised networks.

Each hardening measure addresses one or more of these threats. Understanding the threat model helps you prioritize which measures to implement first.

## Step 1: Key-Based Authentication Only

The single most impactful hardening measure is disabling password authentication entirely. This eliminates brute-force attacks against passwords. If there is no password to guess, the attack fails.

### Verify Key-Based Auth Works First

Before disabling passwords, confirm that key-based authentication is set up for all users who need access:

```bash
# On the server, check that authorized_keys has the right keys
cat ~/.ssh/authorized_keys
```

Each key should be on its own line. Verify you can log in with your key:

```bash
ssh -i ~/.ssh/id_ed25519 admin@server
```

If this works without a password prompt, you are ready to disable password authentication.

### Edit sshd_config

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sudo nano /etc/ssh/sshd_config
```

Change or add these lines:

```
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
```

The `UsePAM yes` line is important on Ubuntu/Debian systems. PAM handles account validation (password expiration, account lockout, etc.). Without it, some PAM-based features may not work correctly.

Restart sshd:

```bash
sudo systemctl restart sshd
```

### Test the Configuration

```bash
# From a new terminal, try to log in
ssh admin@server

# This should succeed (key-based)
# Then try with password explicitly
ssh -o PubkeyAuthentication=no admin@server
# This should fail
```

Keep your current SSH session open while you test. If something goes wrong, you still have access to fix it.

### Verify All Users Can Still Access

```bash
# Test from each user account
ssh -i /home/deploy/.ssh/id_ed25519 deploy@server
ssh -i /home/ops/.ssh/id_ed25519 ops@server
```

If any user cannot log in after disabling password authentication, their public key is missing from `~/.ssh/authorized_keys`. Add it before proceeding.

## Step 2: Disable Root Login

Root should never log in directly over SSH. If an attacker compromises the root password (or guesses it), they have full control of the server. By forcing users to log in as regular users and use `sudo`, you get audit trails and reduce the attack surface:

```
PermitRootLogin no
```

If you absolutely need root login (for example, during initial provisioning with some cloud providers), use `prohibit-password` instead of `no`:

```
PermitRootLogin prohibit-password
```

This allows root to log in with keys but not with passwords. It is a middle ground: still secure against brute-force, but allows key-based root access for automation.

### Alternative: Use a Deploy User with sudo

Instead of logging in as root, create a dedicated user for administration:

```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy
```

Then configure sudo to not require a password for specific commands:

```bash
echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/journalctl, /usr/bin/apt, /usr/bin/dnf" | sudo tee /etc/sudoers.d/deploy
sudo chmod 440 /etc/sudoers.d/deploy
```

This lets the deploy user restart services and view logs without a password, while still requiring a password for destructive operations.

## Step 3: Change the Default Port

Port 22 is the most scanned port on the internet. Changing it to something else eliminates the vast majority of automated scan traffic. Bots that scan every IP address on port 22 will not find your server:

```
Port 2222
```

or

```
Port 49152
```

Choose a port in the range 1024-65535. Ports below 1024 are privileged and require root. Ports above 49152 are dynamic/private and unlikely to conflict with other services.

After changing the port:

```bash
# Restart sshd
sudo systemctl restart sshd

# Open the new port in the firewall
sudo iptables -A INPUT -p tcp --dport 2222 -j ACCEPT

# Close the old port (if it was open)
sudo iptables -D INPUT -p tcp --dport 22 -j ACCEPT

# Save rules
sudo iptables-save > /etc/iptables/rules.v4

# Test in a NEW terminal before closing the current session
ssh -p 2222 admin@server
```

**Do not close your current session until you have confirmed the new port works.** This is the most common way people lock themselves out of a server.

Update your local SSH config:

```
Host server
    HostName 203.0.113.10
    Port 2222
    User admin
    IdentityFile ~/.ssh/id_ed25519
```

Now `ssh server` automatically uses port 2222.

## Step 4: Restrict SSH Access by User

Only allow specific users to log in over SSH. Everything not explicitly allowed is denied:

```
AllowUsers admin deploy ops
# or
AllowGroups ssh-users admins
```

If you use `AllowGroups`, make sure the users you want to allow are in that group:

```bash
sudo groupadd ssh-users
sudo usermod -aG ssh-users admin
sudo usermod -aG ssh-users deploy
sudo usermod -aG ssh-users ops
```

This is a defense-in-depth measure. Even if an attacker obtains a valid password for a service account (like `www-data` or `mysql`), they cannot log in over SSH because those accounts are not in the allowed list.

## Step 5: Timeouts and Limits

Reduce the attack surface by limiting connection lifetime and authentication attempts:

```
# Disconnect idle sessions after 5 minutes
ClientAliveInterval 300
ClientAliveCountMax 2

# Limit authentication attempts
MaxAuthTries 3

# Limit the number of concurrent unauthenticated connections
MaxStartups 10:30:60

# Set a login grace time (seconds to authenticate before disconnecting)
LoginGraceTime 30
```

- `ClientAliveInterval 300` + `ClientAliveCountMax 2`: the server sends a keepalive every 300 seconds. After 2 missed responses (10 minutes total), the connection is dropped. This prevents abandoned sessions from remaining open indefinitely.

- `MaxAuthTries 3`: after 3 failed attempts within a single connection, the connection is terminated. The client must reconnect. This slows down brute-force attacks within a single connection.

- `MaxStartups 10:30:60`: when 10 unauthenticated connections are active, new connections are rate-limited (30% chance of being dropped). At 60, all new connections are dropped. This prevents an attacker from opening thousands of concurrent connections.

- `LoginGraceTime 30`: the server waits 30 seconds for authentication before disconnecting. If a user cannot authenticate within 30 seconds, something is wrong.

## Step 6: Disable Unused Authentication Methods

```
KerberosAuthentication no
GSSAPIAuthentication no
HostbasedAuthentication no
```

If you are not using Kerberos, GSSAPI, or host-based authentication, disable them. Each enabled method is a potential attack vector. These are rarely used outside of enterprise environments.

## Step 7: Protocol and Cipher Hardening

Modern SSH servers support multiple algorithms for key exchange, encryption, and message authentication. Some of these algorithms are weak or vulnerable. Restrict the server to only strong algorithms:

```
# Use only SSH protocol 2 (the default on modern systems, but explicit is better)
Protocol 2

# Restrict key exchange algorithms
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512

# Restrict ciphers
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com

# Restrict MACs
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Restrict host key algorithms
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256
```

These settings use only modern, secure algorithms:

- **Key exchange**: Curve25519 and Diffie-Hellman groups 16 and 18 are the strongest available. Older groups (1, 2, 14) are vulnerable to precomputation attacks.
- **Ciphers**: ChaCha20-Poly1305 and AES-GCM are authenticated encryption algorithms that provide both confidentiality and integrity. Older ciphers like CBC mode are vulnerable to padding oracle attacks.
- **MACs**: SHA-512 and SHA-256 in ETM (Encrypt-then-MAC) mode provide strong integrity verification.
- **Host key algorithms**: Ed25519 and RSA with SHA-2 are the strongest host key algorithms.

### Verify Your Configuration

After applying these settings, test the cipher negotiation:

```bash
ssh -vv -p 2222 admin@server 2>&1 | grep "kex:"
```
```
debug1: kex: algorithm: curve25519-sha256@libssh.org
debug1: kex: host key algorithm: ssh-ed25519
debug1: kex: server->client cipher: chacha20-poly1305@openssh.com MAC: <implicit> compression: none
debug1: kex: client->server cipher: chacha20-poly1305@openssh.com MAC: <implicit> compression: none
```

This confirms that the server is using the strong algorithms you configured.

## Step 8: Disable X11 Forwarding and TCP Forwarding (If Not Needed)

```
X11Forwarding no
AllowTcpForwarding no
AllowStreamLocalForwarding no
GatewayPorts no
PermitTunnel no
```

X11 forwarding is a security risk if you do not need graphical applications on the server. It creates a channel that could be exploited.

TCP forwarding can be used to tunnel traffic through your server, which may violate network policy. An attacker who compromises your server could use it as a proxy to attack other systems.

If you need agent forwarding for jump hosts, enable it selectively:

```
Match User ops
    ForwardAgent yes
```

The `Match` directive applies settings only to specific users or groups, allowing you to customize access per user.

## Complete Hardened sshd_config

Here is a complete hardened configuration for reference:

```
# /etc/ssh/sshd_config

Port 2222
ListenAddress 0.0.0.0

# Authentication
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no
HostbasedAuthentication no

# Access control
PermitRootLogin no
AllowUsers admin deploy ops
MaxAuthTries 3
MaxStartups 10:30:60
LoginGraceTime 30

# Timeouts
ClientAliveInterval 300
ClientAliveCountMax 2

# Forwarding
X11Forwarding no
AllowTcpForwarding no
AllowStreamLocalForwarding no
GatewayPorts no
PermitTunnel no

# Cryptography
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Banner
Banner /etc/issue.net

# PAM
UsePAM yes
```

### Adding a Legal Banner

A legal banner warns unauthorized users that they are being monitored:

```bash
sudo tee /etc/issue.net <<'EOF'
*******************************************************************
* This system is for authorized users only. All activity is      *
* monitored and logged. Unauthorized access is prohibited and    *
* may result in legal action.                                    *
*******************************************************************
EOF
```

Add `Banner /etc/issue.net` to `sshd_config` to display this before the login prompt.

## fail2ban: Brute-Force Protection

Even with key-based authentication and a non-standard port, you should have intrusion detection. fail2ban monitors log files and bans IPs that show malicious behavior.

### Installation

```bash
# Debian/Ubuntu
sudo apt install fail2ban

# RHEL/CentOS
sudo dnf install fail2ban
```

### Configuration

Do not edit `/etc/fail2ban/jail.conf` directly: it gets overwritten on upgrades. Create a local override:

```bash
sudo cp /etc/fail2ban/jail.local /etc/fail2ban/jail.local 2>/dev/null || true
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
# Ban for 1 hour
bantime = 3600

# Detection window (10 minutes)
findtime = 600

# Ban after 3 failed attempts
maxretry = 3

# Use iptables for banning
banaction = iptables-multiport

# Ignore localhost
ignoreip = 127.0.0.1/8 ::1

# Email notifications (optional)
# destemail = admin@example.com
# sender = fail2ban@example.com
# action = %(action_mwl)s

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

### Starting fail2ban

```bash
sudo systemctl enable --now fail2ban
```

### Managing fail2ban

```bash
sudo fail2ban-client status                  # Overall status
sudo fail2ban-client status sshd             # SSH jail status
sudo fail2ban-client set sshd unbanip 1.2.3.4  # Unban an IP manually
sudo fail2ban-client set sshd banip 5.6.7.8   # Ban an IP manually
sudo fail2ban-client get sshd banned          # List all banned IPs
sudo fail2ban-client set sshd bantime 7200    # Change ban time to 2 hours
```

```bash
sudo fail2ban-client status sshd
```
```
Status for the jail: sshd
|- Filter
|  |- Currently failed:	2
|  |- Total failed:	1567
|  `- File list:	/var/log/auth.log
`- Actions
   |- Currently banned:	5
   |- Total banned:	234
   `- Banned IP list:	10.0.0.50 10.0.0.100 203.0.113.5 198.51.100.12 192.0.2.45
```

### Custom fail2ban Filters

If you have a custom service that logs failed authentication attempts, you can create a custom filter:

```ini
# /etc/fail2ban/filter.d/myapp.conf
[Definition]
failregex = ^.*Failed login from <HOST>.*$
            ^.*Authentication failed from <HOST>.*$
ignoreregex =
```

Then add a jail for it in `jail.local`:

```ini
[myapp]
enabled = true
port = 8080
filter = myapp
logpath = /var/log/myapp/auth.log
maxretry = 5
bantime = 7200
```

### Monitoring fail2ban Activity

```bash
# Watch the fail2ban log in real time
sudo tail -f /var/log/fail2ban.log

# Show ban history
sudo grep "Ban" /var/log/fail2ban.log | tail -20

# Show unban history
sudo grep "Unban" /var/log/fail2ban.log | tail -20
```

## SSH Jump Hosts and Bastion Hosts

A bastion host (or jump host) sits between the public internet and your internal servers. You SSH to the bastion first, then from there to internal servers. This means only the bastion needs a public IP.

### Without ProxyJump (Old Way)

```bash
ssh -A admin@bastion          # Log into bastion with agent forwarding
ssh admin@internal-db         # From bastion, log into internal server
```

Agent forwarding is risky: a root user on the bastion could intercept your SSH agent socket and use your keys.

### With ProxyJump (New Way)

```bash
ssh -J admin@bastion admin@internal-db
```

Or in `~/.ssh/config`:

```
Host bastion
    HostName 203.0.113.10
    User admin
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

Host internal-*
    ProxyJump bastion
    User admin
    IdentityFile ~/.ssh/id_ed25519
```

Now typing `ssh internal-db-01` automatically goes through the bastion. Your private key never leaves your machine: the SSH handshake is proxied through the bastion. This is more secure than agent forwarding.

### Hardening the Bastion

The bastion is the only server exposed to the internet. It should be hardened more aggressively:

```bash
# /etc/ssh/sshd_config on the bastion
Port 2222
PermitRootLogin no
PasswordAuthentication no
AllowUsers admin ops
MaxAuthTries 2
ClientAliveInterval 120
ClientAliveCountMax 3
X11Forwarding no
AllowTcpForwarding yes           # Needed for ProxyJump
AllowStreamLocalForwarding no
```

The bastion needs `AllowTcpForwarding yes` to support ProxyJump. Everything else is locked down.

## Real Scenario: Hardening SSH After a Brute-Force Attempt

You receive an alert: a server has seen 10,000 failed SSH login attempts in the past hour. The `auth.log` shows:

```bash
sudo grep "Failed password" /var/log/auth.log | wc -l
```
```
10234
```

```bash
sudo grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -10
```
```
  4567 203.0.113.50
  2345 198.51.100.23
  1234 192.0.2.100
   876 10.0.0.50
   543 172.16.0.100
   321 192.168.1.50
   210 10.0.1.200
   109 172.16.1.100
    56 192.168.2.50
    34 10.0.2.100
```

**Immediate response:**

```bash
# Step 1: Ban the top attackers immediately
sudo fail2ban-client set sshd banip 203.0.113.50
sudo fail2ban-client set sshd banip 198.51.100.23
sudo fail2ban-client set sshd banip 192.0.2.100

# Step 2: Check if any attacks succeeded
sudo grep "Accepted password" /var/log/auth.log | tail -20
```

If you see any `Accepted password` entries from unknown IPs, those accounts may be compromised.

```bash
# Step 3: Check for successful logins from the attacking IPs
sudo grep "Accepted" /var/log/auth.log | grep -E "203.0.113.50|198.51.100.23|192.0.2.100"
```

**Step 4: If any accounts were compromised, disable them immediately.**

```bash
sudo passwd -l compromised_user
sudo usermod -s /sbin/nologin compromised_user
```

**Step 5: Implement the full hardening stack.**

```bash
# Backup current config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.pre-hardening

# Apply hardened config
sudo nano /etc/ssh/sshd_config
# (Apply the hardened config from earlier in this module)

# Install and configure fail2ban
sudo apt install fail2ban -y
sudo nano /etc/fail2ban/jail.local
# (Apply the fail2ban config from earlier in this module)

# Restart services
sudo systemctl restart sshd
sudo systemctl restart fail2ban
```

**Step 6: Add a firewall rule to rate-limit new SSH connections.**

```bash
# Limit new SSH connections to 5 per minute per IP
sudo iptables -A INPUT -p tcp --dport 2222 -m state --state NEW -m recent --set --name SSH
sudo iptables -A INPUT -p tcp --dport 2222 -m state --state NEW -m recent --update --seconds 60 --hitcount 5 --name SSH -j DROP

# Save
sudo iptables-save > /etc/iptables/rules.v4
```

**Step 7: Verify everything works.**

```bash
# Test SSH access with your key
ssh -p 2222 admin@server

# Verify fail2ban is running
sudo fail2ban-client status sshd

# Verify the firewall rules
sudo iptables -L INPUT -v -n | grep 2222
```

**Step 8: Monitor for the next 24 hours.**

```bash
# Watch for new bans
sudo fail2ban-client status sshd

# Check for any successful logins
sudo journalctl -u sshd --since "1 hour ago" | grep "Accepted"

# Watch the auth log in real time
sudo tail -f /var/log/auth.log | grep "Failed"

# Check fail2ban logs
sudo tail -f /var/log/fail2ban.log
```

**Step 9: Document the incident.**

Create an incident report with:
- Timeline of events
- Attacking IP addresses
- Whether any accounts were compromised
- Changes made to the server
- Evidence that the changes are working

## SSH Key Management at Scale

When you manage SSH keys across many servers, you need a system for distributing, rotating, and revoking keys.

### Centralized Key Management

For organizations with more than a handful of servers, consider a centralized approach:

```bash
# Create a script that distributes keys to all servers
#!/bin/bash
set -euo pipefail

PUBKEY=$(cat ~/.ssh/id_ed25519.pub)
SERVERS=("web-01" "web-02" "web-03" "db-01" "db-02" "cache-01")

for server in "${SERVERS[@]}"; do
    echo "Deploying key to $server..."
    # Use existing key to deploy new key
    ssh-copy-id -i ~/.ssh/id_ed25519.pub -o ProxyJump=bastion admin@$server 2>/dev/null
    
    # Verify
    if ssh -o BatchMode=yes -o ConnectTimeout=5 -i ~/.ssh/id_ed25519 admin@$server "exit 0" 2>/dev/null; then
        echo "  [OK] $server"
    else
        echo "  [FAIL] $server"
    fi
done
```

### Key Rotation

SSH keys should be rotated periodically (every 6-12 months). The process:

1. Generate a new key pair
2. Deploy the new public key to all servers (alongside the old key)
3. Verify the new key works
4. Remove the old key from all servers
5. Remove the old private key from your machine

```bash
# Step 1: Generate new key
ssh-keygen -t ed25519 -C "admin@xpertclass.academy-$(date +%Y%m%d)" -f ~/.ssh/id_ed25519_new

# Step 2: Deploy to servers
for server in web-01 web-02 web-03; do
    ssh-copy-id -i ~/.ssh/id_ed25519_new.pub admin@$server
done

# Step 3: Test
ssh -i ~/.ssh/id_ed25519_new admin@web-01 "echo works"

# Step 4: Remove old key from servers
for server in web-01 web-02 web-03; do
    ssh admin@$server "sed -i '/OLD_KEY_FINGERPRINT/d' ~/.ssh/authorized_keys"
done

# Step 5: Remove old private key
rm ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub
mv ~/.ssh/id_ed25519_new ~/.ssh/id_ed25519
mv ~/.ssh/id_ed25519_new.pub ~/.ssh/id_ed25519.pub
```

### Emergency Key Revocation

If a private key is compromised, you need to revoke it immediately from all servers:

```bash
#!/bin/bash
# Revoke a compromised key from all servers
COMPROMISED_KEY="ssh-ed25519 AAAA...compromised..."

for server in web-01 web-02 web-03 db-01 db-02; do
    echo "Removing compromised key from $server..."
    ssh admin@$server "sed -i '/$COMPROMISED_KEY/d' ~/.ssh/authorized_keys"
done
```

## Assessment

**Lab: SSH Hardening (30 minutes)**

Scenario: A server is running with default SSH configuration. You need to harden it based on a security audit finding.

**Tasks:**

1. Back up the current `/etc/ssh/sshd_config` to `/etc/ssh/sshd_config.pre-hardening`.
2. Create a hardened SSH configuration that implements:
   - Key-based authentication only
   - Root login disabled
   - Port changed to 2222
   - Only users `admin` and `deploy` allowed
   - X11 forwarding disabled
   - Max 3 authentication attempts
   - Client alive interval of 300 seconds
   - VERBOSE logging
3. Install and configure fail2ban with:
   - 3 max retries
   - 1 hour ban time
   - 10 minute find time
   - SSH jail enabled on port 2222
4. Add a legal banner to `/etc/issue.net` warning unauthorized users.
5. Apply the iptables rule to rate-limit new SSH connections (5 per minute per IP).
6. Restart sshd and fail2ban.
7. Test that SSH still works with key-based authentication on the new port.
8. Simulate a brute-force attempt (from a different machine or by temporarily enabling password auth and using wrong passwords). Verify that fail2ban bans the IP.
9. Check the fail2ban status and verify the ban was applied.
10. Document all changes made to `/tmp/ssh_hardening_report.txt`.

**Grading Criteria:**

- Backup created: 3 points
- Hardened config includes all 8 required directives: 32 points
- fail2ban installed and configured correctly: 15 points
- Legal banner added: 5 points
- iptables rate-limiting rule added: 10 points
- Services restarted successfully: 5 points
- SSH tested and working on new port: 10 points
- fail2ban ban verified: 10 points
- Documentation complete: 10 points

**Total: 100 points. Pass threshold: 70 points.**

## Evidence

After completing this lab, you should have:

- A hardened SSH configuration that eliminates password authentication.
- fail2ban actively monitoring and banning brute-force attempts.
- A firewall rule limiting connection rates.
- A legal warning banner displayed before login.
- Documentation of all changes for audit purposes.
- A server that is significantly harder to attack via SSH.
