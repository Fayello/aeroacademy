# Module 7 — SSH and Remote Administration


## What You'll Actually Do

Your server's SSH is running with default settings. Password authentication is on, root login is allowed, and there's no rate limiting. You'll lock it down: key-only auth, disable root login, change the port, and set up fail2ban. This is the difference between "we have a server" and "we have a server nobody can break into."

## SSH Keys — Ditch the Password

Password auth is slow and vulnerable to brute force. Keys are better.

**Generate a key pair (on your local machine):**
```bash
ssh-keygen -t ed25519 -C "alice@company.com"
# Generating public/private ed25519 key pair.
# Enter file: ~/.ssh/id_ed25519
# Enter passphrase: (optional but recommended)
```

**Copy the public key to the server:**
```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub alice@server
```

**Now SSH without a password:**
```bash
ssh -i ~/.ssh/id_ed25519 alice@server
```

**Why ed25519 over RSA:** Shorter keys, faster, more secure. RSA2048 is still fine but ed25519 is better.

## Harden sshd_config

Edit `/etc/ssh/sshd_config`:

```bash
# Disable root login
PermitRootLogin no

# Key-only authentication
PasswordAuthentication no
ChallengeResponseAuthentication no
PubkeyAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Limit SSH to specific users
AllowUsers alice bob deploy

# Change default port (optional but reduces noise)
Port 2222

# Set idle timeout
ClientAliveInterval 300
ClientAliveCountMax 2

# Log level
LogLevel VERBOSE
```

Apply:
```bash
systemctl restart sshd
```

**IMPORTANT:** Before you restart sshd, make sure you can SSH in with keys. Open a new terminal and test. If you lock yourself out, you'll need console access from your hosting provider.

## fail2ban — Ban IPs That Try Too Hard

```bash
apt install fail2ban
```

Create `/etc/fail2ban/jail.local`:
```ini
[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

- `maxretry = 3` — 3 failed attempts and you're banned
- `bantime = 3600` — banned for1 hour
- `findtime = 600` — within a10-minute window

```bash
systemctl enable fail2ban
systemctl start fail2ban
```

**Check bans:**
```bash
fail2ban-client status sshd
# Banned IP list: 198.51.100.50 198.51.100.51
# Currently banned: 2
```

**Unban an IP:**
```bash
fail2ban-client set sshd unbanip 198.51.100.50
```

## SSH Tunneling — Access Services Securely

Your app runs on port8080 on the server but you don't want to expose it. Tunnel it:

```bash
ssh -L 8080:localhost:8080 alice@server
```

Now `localhost:8080` on your machine connects to `server:8080`. Encrypted through SSH.

**Remote port forward (expose local service to server):**
```bash
ssh -R 9090:localhost:3000 alice@server
```

Server's port9090 connects to your machine's port3000.

**Jump host (bastion):**
```bash
ssh -J alice@bastion:22 bob@internal-server
```

Traffic goes through bastion to reach the internal server. Common in cloud setups where internal servers don't have public IPs.

## Real Task: Lock Down a Server

```bash
# 1. Generate key on your machine
ssh-keygen -t ed25519 -C "deploy@company"

# 2. Copy to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@server

# 3. Test key login in a NEW terminal
ssh -i ~/.ssh/id_ed25519 root@server

# 4. Harden sshd
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 5. Install fail2ban
sudo apt install -y fail2ban
# create jail.local
sudo systemctl enable --now fail2ban

# 6. Verify
ssh -p 2222 -i ~/.ssh/id_ed25519 deploy@server
```

## Failure Scenario: Locked Out

You edit `sshd_config`, set `PermitRootLogin no`, then restart sshd. Your only way in was root with a password. You're locked out.

**Fix:** Use your hosting provider's console (AWS EC2 Instance Connect, DigitalOcean Recovery Mode, etc.) to log in and fix the config.

**Prevention:** Always test SSH in a new terminal before restarting sshd. Keep a backup session open.

## Assessment

**Lab task (20 min):**

1. Generate an SSH key pair
2. Copy the public key to the server
3. Verify passwordless login works
4. Disable password authentication in sshd_config
5. Disable root login
6. Install and configure fail2ban with3 retries and1 hour ban
7. Verify fail2ban is running and check the status
8. Test SSH tunneling by forwarding a local port to the server

**Grading:**
- Key-based auth working: 25%
- Password auth disabled: 20%
- Root login disabled: 15%
- fail2ban configured and running: 25%
- Tunnel tested: 15%

## Evidence

- **OutcomeEvidence:** `LIN-LO7 — SSH Hardening`
- **Mastery:** `UserSkill: linux-ssh-security`

## Unlock

Module8 — Shell Scripting. You can secure the front door. Now you learn how to automate the boring stuff.

## Sources

- `man sshd_config`, `man ssh-keygen`, `man ssh-copy-id`
- `man fail2ban-client`
- OpenSSH manual

