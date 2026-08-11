#!/usr/bin/env python3
"""Add Network Configuration lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Network Configuration

### Learning Objectives
- Configure network interfaces using netplan and nmcli
- Set up static IP addresses and DNS resolution
- Manage network connections with NetworkManager
- Configure bonding and VLANs for advanced networking

### Section 1: Netplan (Ubuntu)

```yaml
# /etc/netplan/01-config.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: false
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
        search: [example.com]
```

```bash
# Apply netplan configuration
sudo netplan apply
sudo netplan try  # Temporary for testing
```

### Section 2: NetworkManager (nmcli)

```bash
# Show connections
nmcli connection show
nmcli device status

# Add static connection
nmcli connection add type ethernet con-name office \\
    ifname eth0 \\
    ipv4.addresses 192.168.1.100/24 \\
    ipv4.gateway 192.168.1.1 \\
    ipv4.dns "8.8.8.8 1.1.1.1" \\
    ipv4.method manual

# Activate connection
nmcli connection up office

# Modify existing connection
nmcli connection modify office ipv4.dns "8.8.8.8"
```

### Section 3: Network Bonding

```yaml
# /etc/netplan/02-bonding.yaml
network:
  version: 2
  bonds:
    bond0:
      interfaces: [eth0, eth1]
      addresses: [10.0.0.10/24]
      gateway4: 10.0.0.1
      parameters:
        mode: 802.3ad  # LACP
        mii-monitor-interval: 100
      nameservers:
        addresses: [8.8.8.8]
```

### Section 4: VLAN Configuration

```yaml
# /etc/netplan/03-vlan.yaml
network:
  version: 2
  vlans:
    vlan100:
      id: 100
      link: eth0
      addresses: [10.100.0.10/24]
    vlan200:
      id: 200
      link: eth0
      addresses: [10.200.0.10/24]
```

### Section 5: Diagnostic Commands

```bash
# Check connectivity
ping -c 4 8.8.8.8
traceroute example.com
mtr example.com  # Real-time traceroute

# Check DNS resolution
resolvectl query example.com

# Check interface statistics
ip -s link show eth0
ethtool eth0
```

### Key Takeaways
- Netplan is the modern network configuration tool for Ubuntu
- nmcli provides command-line NetworkManager management
- Bonding combines multiple interfaces for redundancy and throughput
- VLANs segment networks for security and organization
- Use mtr for real-time network path analysis

### References
1. [Netplan Documentation](https://netplan.io/)
2. [NetworkManager nmcli](https://networkmanager.dev/docs/api/latest/nmcli.html)
3. [Linux Networking Documentation](https://www.kernel.org/doc/Documentation/networking/)"""

questions = [
    {"text": "What is the correct netplan configuration command?", "answers": [
        {"text": "netplan set", "isCorrect": False},
        {"text": "netplan apply", "isCorrect": True},
        {"text": "netplan config", "isCorrect": False},
        {"text": "netplan load", "isCorrect": False}
    ]},
    {"text": "What does nmcli connection up do?", "answers": [
        {"text": "Creates a new connection", "isCorrect": False},
        {"text": "Activates a network connection", "isCorrect": True},
        {"text": "Updates connection settings", "isCorrect": False},
        {"text": "Shows connection details", "isCorrect": False}
    ]},
    {"text": "What is network bonding used for?", "answers": [
        {"text": "Encrypting network traffic", "isCorrect": False},
        {"text": "Combining multiple interfaces for redundancy/performance", "isCorrect": True},
        {"text": "Creating virtual machines", "isCorrect": False},
        {"text": "Configuring DNS", "isCorrect": False}
    ]},
    {"text": "What netplan mode provides LACP bonding?", "answers": [
        {"text": "mode: balance-rr", "isCorrect": False},
        {"text": "mode: active-backup", "isCorrect": False},
        {"text": "mode: 802.3ad", "isCorrect": True},
        {"text": "mode: balance-xor", "isCorrect": False}
    ]},
    {"text": "What tool provides real-time network path analysis?", "answers": [
        {"text": "ping", "isCorrect": False},
        {"text": "traceroute", "isCorrect": False},
        {"text": "mtr", "isCorrect": True},
        {"text": "curl", "isCorrect": False}
    ]},
    {"text": "What does the ip -s link show command display?", "answers": [
        {"text": "IP addresses only", "isCorrect": False},
        {"text": "Interface statistics including packet counts", "isCorrect": True},
        {"text": "Routing table", "isCorrect": False},
        {"text": "DNS configuration", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Network Configuration", "order": 3, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][0]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Network Configuration lesson")
