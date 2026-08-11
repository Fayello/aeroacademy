#!/usr/bin/env python3
"""Add SSH Configuration and Security lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# SSH Configuration and Security

### Learning Objectives
- Generate and manage SSH key pairs
- Configure SSH server for hardened security
- Set up SSH jump hosts and tunneling
- Use ssh-agent and config for efficient workflows

### Section 1: SSH Key Management

```bash
# Generate ED25519 key pair (recommended)
ssh-keygen -t ed25519 -C "user@example.com"

# Generate RSA key pair (4096-bit)
ssh-keygen -t rsa -b 4096 -C "user@example.com"

# Copy public key to server
ssh-copy-id user@server

# List keys
ssh-add -l
```

### Section 2: Hardened sshd_config

```bash
# /etc/ssh/sshd_config

# Authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
MaxAuthTries 3
MaxSessions 5

# Access Control
AllowUsers admin deploy
AllowGroups sshusers

# Cryptography
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Session
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 30

# Forwarding
AllowTcpForwarding no
X11Forwarding no
AllowAgentForwarding no

# Logging
LogLevel VERBOSE
```

### Section 3: SSH Config for Efficiency

```bash
# ~/.ssh/config
Host server1
    HostName 192.168.1.10
    User admin
    Port 2222
    IdentityFile ~/.ssh/server1_key

Host jump
    HostName jump.example.com
    User admin

Host internal-*
    ProxyJump jump
    User admin

Host internal-db
    HostName 10.0.0.50
```

```bash
# Connect using config aliases
ssh server1
ssh internal-db  # Automatically jumps through jump host
```

### Section 4: SSH Tunneling

```bash
# Local port forwarding (access remote MySQL locally)
ssh -L 3306:localhost:3306 user@db-server

# Remote port forwarding (expose local service)
ssh -R 8080:localhost:3000 user@public-server

# Dynamic SOCKS proxy
ssh -D 1080 user@server

# Use with proxychains
proxychains curl http://internal-service.local
```

### Section 5: SSH Agent

```bash
# Start agent
eval "$(ssh-agent -s)"

# Add key
ssh-add ~/.ssh/id_ed25519

# Forward agent to server
ssh -A user@server

# List loaded keys
ssh-add -l
```

### Key Takeaways
- Use ED25519 keys for best performance and security
- Disable password authentication in production
- Use SSH config files to simplify complex connection patterns
- SSH tunneling provides secure access to internal services
- Limit root login and use AllowUsers/AllowGroups for access control

### References
1. "SSH, The Secure Shell" by Daniel Barrett
2. [OpenSSH Server Configuration](https://man.openbsd.org/sshd_config)
3. [SSH Tunneling Guide](https://www.ssh.com/ssh/tunneling/)"""

questions = [
    {"text": "Which SSH key type is recommended for modern use?", "answers": [
        {"text": "RSA 2048", "isCorrect": False},
        {"text": "DSA", "isCorrect": False},
        {"text": "ED25519", "isCorrect": True},
        {"text": "ECDSA", "isCorrect": False}
    ]},
    {"text": "What sshd_config directive disables root login?", "answers": [
        {"text": "DenyRoot yes", "isCorrect": False},
        {"text": "PermitRootLogin no", "isCorrect": True},
        {"text": "RootAccess disabled", "isCorrect": False},
        {"text": "LoginAsRoot no", "isCorrect": False}
    ]},
    {"text": "What does ssh-copy-id do?", "answers": [
        {"text": "Creates a new SSH key", "isCorrect": False},
        {"text": "Copies public key to remote server", "isCorrect": True},
        {"text": "Copies private key securely", "isCorrect": False},
        {"text": "Generates SSH config", "isCorrect": False}
    ]},
    {"text": "What does ProxyJump in SSH config enable?", "answers": [
        {"text": "Direct connection", "isCorrect": False},
        {"text": "Jump host/bastion access pattern", "isCorrect": True},
        {"text": "SOCKS proxy", "isCorrect": False},
        {"text": "Agent forwarding", "isCorrect": False}
    ]},
    {"text": "What does the -L flag do in SSH?", "answers": [
        {"text": "Local port forwarding", "isCorrect": True},
        {"text": "List all connections", "isCorrect": False},
        {"text": "Login with specific user", "isCorrect": False},
        {"text": "Local agent forwarding", "isCorrect": False}
    ]},
    {"text": "Why should AgentForwarding be disabled on production servers?", "answers": [
        {"text": "It reduces performance", "isCorrect": False},
        {"text": "A compromised server could use forwarded agent keys", "isCorrect": True},
        {"text": "It only works with RSA keys", "isCorrect": False},
        {"text": "It conflicts with firewall rules", "isCorrect": False}
    ]}
]

lesson = {
    "title": "SSH Configuration and Security", "order": 4, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][0]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added SSH Configuration and Security lesson")
