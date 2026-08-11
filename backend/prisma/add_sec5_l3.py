#!/usr/bin/env python3
"""Add VPN Configuration lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# VPN Configuration

### Learning Objectives
- Understand VPN technologies (OpenVPN, WireGuard, IPSec)
- Configure a WireGuard VPN server
- Set up OpenVPN with certificate-based authentication
- Implement split tunneling and routing

### Section 1: VPN Technologies Comparison

| Feature | WireGuard | OpenVPN | IPSec |
|---------|-----------|---------|-------|
| Speed | Fastest | Good | Good |
| Codebase | ~4,000 lines | ~100,000 lines | Complex |
| Configuration | Simple | Moderate | Complex |
| UDP Only | Yes | TCP/UDP | UDP |
| Mobile Support | Excellent | Good | Good |

### Section 2: WireGuard Server Setup

```bash
# Install WireGuard
sudo apt install wireguard

# Generate server keys
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key

# /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <server_private_key>
PostUp = iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE

[Peer]
PublicKey = <client_public_key>
AllowedIPs = 10.0.0.2/32
```

### Section 3: WireGuard Client Configuration

```ini
# /etc/wireguard/wg0.conf (client)
[Interface]
Address = 10.0.0.2/24
PrivateKey = <client_private_key>
DNS = 8.8.8.8

[Peer]
PublicKey = <server_public_key>
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0  # Route all traffic through VPN
PersistentKeepalive = 25
```

### Section 4: OpenVPN Server Setup

```bash
# Install OpenVPN and Easy-RSA
sudo apt install openvpn easy-rsa

# Initialize PKI
make-cadir ~/openvpn-ca
cd ~/openvpn-ca
./easyrsa init-pki
./easyrsa build-ca
./easyrsa gen-req server nopass
./easyrsa sign-req server server
openvpn --genkey secret /etc/openvpn/ta.key

# Generate client certificate
./easyrsa gen-req client1 nopass
./easyrsa sign-req client client1
```

### Section 5: OpenVPN Server Configuration

```conf
# /etc/openvpn/server.conf
port 1194
proto udp
dev tun

ca /etc/openvpn/ca.crt
cert /etc/openvpn/server.crt
key /etc/openvpn/server.key
dh /etc/openvpn/dh2048.pem
tls-auth /etc/openvpn/ta.key 0

server 10.8.0.0 255.255.255.0
push "redirect-gateway def1"
push "dhcp-option DNS 8.8.8.8"

keepalive 10 120
cipher AES-256-GCM
user nobody
group nogroup
persist-key
persist-tun
status /var/log/openvpn-status.log
verb 3
```

### Section 6: Management Commands

```bash
# WireGuard
sudo wg-quick up wg0
sudo wg-quick down wg0
sudo wg show

# OpenVPN
sudo systemctl start openvpn@server
sudo systemctl status openvpn@server
```

### Key Takeaways
- WireGuard is faster and simpler than OpenVPN
- OpenVPN offers more flexibility with TCP/UDP and extensive configuration
- Use certificate-based authentication for both
- Split tunneling routes only specific traffic through VPN
- Always use TLS authentication in addition to certificates

### References
1. [WireGuard Documentation](https://www.wireguard.com/)
2. [OpenVPN How-To](https://openvpn.net/community-resources/)
3. [WireGuard vs OpenVPN comparison](https://www.wireguard.com/performances/)"""

questions = [
    {"text": "What is the main advantage of WireGuard over OpenVPN?", "answers": [
        {"text": "Supports more protocols", "isCorrect": False},
        {"text": "Faster performance and simpler configuration", "isCorrect": True},
        {"text": "Better Windows support", "isCorrect": False},
        {"text": "Supports more encryption algorithms", "isCorrect": False}
    ]},
    {"text": "What does AllowedIPs = 0.0.0.0/0 mean in WireGuard?", "answers": [
        {"text": "Block all traffic", "isCorrect": False},
        {"text": "Route all IPv4 traffic through the VPN", "isCorrect": True},
        {"text": "Only allow local traffic", "isCorrect": False},
        {"text": "Allow traffic to any single IP", "isCorrect": False}
    ]},
    {"text": "What does the PostUp directive do in WireGuard?", "answers": [
        {"text": "Starts the VPN tunnel", "isCorrect": False},
        {"text": "Runs a command after the interface is up", "isCorrect": True},
        {"text": "Updates the server configuration", "isCorrect": False},
        {"text": "Connects to a peer", "isCorrect": False}
    ]},
    {"text": "What tool is used to manage OpenVPN certificates?", "answers": [
        {"text": "openssl", "isCorrect": False},
        {"text": "easy-rsa", "isCorrect": True},
        {"text": "certbot", "isCorrect": False},
        {"text": "ca-certificates", "isCorrect": False}
    ]},
    {"text": "What does push 'redirect-gateway def1' do in OpenVPN?", "answers": [
        {"text": "Redirects DNS only", "isCorrect": False},
        {"text": "Routes all client traffic through the VPN", "isCorrect": True},
        {"text": "Redirects specific subnets", "isCorrect": False},
        {"text": "Enables split tunneling", "isCorrect": False}
    ]},
    {"text": "Which command shows WireGuard interface status?", "answers": [
        {"text": "wg status", "isCorrect": False},
        {"text": "wg show", "isCorrect": True},
        {"text": "wireguard status", "isCorrect": False},
        {"text": "ip link show wg0", "isCorrect": False}
    ]}
]

lesson = {
    "title": "VPN Configuration", "order": 3, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][1]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added VPN Configuration lesson")
