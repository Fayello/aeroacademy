# Module 5 — Network Configuration

**Course:** Linux Systems Administration | **Path:** Linux Sysadmin (5 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 30 min | **Prerequisite:** Module 4 — Service Management

---

## What You'll Actually Do

New server arrives. You need to configure static IPs, set up VLANs, configure bonding, manage DNS, and set up network monitoring. Not just "ping works" — production networking.

---

## Netplan (Ubuntu) / NetworkManager

**Netplan config:**
```bash
cat > /etc/netplan/01-config.yaml << 'EOF'
network:
  version: 2
  ethernets:
    ens3:
      addresses:
        - 10.0.0.5/24
      gateway4: 10.0.0.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
      dhcp4: false
EOF

netplan apply
```

**Bonding (link aggregation):**
```yaml
network:
  bonds:
    bond0:
      interfaces: [ens3, ens4]
      parameters:
        mode: 802.3ad
        lacp-rate: fast
      addresses: [10.0.0.5/24]
```

**VLANs:**
```yaml
network:
  vlans:
    vlan100:
      id: 100
      link: ens3
      addresses: [10.100.0.5/24]
```

---

## Routing

```bash
# Show routes
ip route show

# Add static route
ip route add 192.168.2.0/24 via 10.0.0.254

# Delete route
ip route del 192.168.2.0/24

# Persistent route (netplan)
routes:
  - to: 192.168.2.0/24
    via: 10.0.0.254
```

---

## DNS Configuration

```bash
cat /etc/resolv.conf
# nameserver 8.8.8.8
# nameserver 8.8.4.4
# search company.local

# Local overrides
cat >> /etc/hosts << 'EOF'
10.0.0.10 db.internal
10.0.0.11 cache.internal
10.0.0.12 app.internal
EOF
```

**systemd-resolved:**
```bash
systemctl status systemd-resolved
resolvectl status
```

---

## Firewall — iptables Deep Dive

```bash
# Show rules with line numbers
iptables -L -n --line-numbers

# Allow HTTP
iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# Allow from specific subnet
iptables -A INPUT -s 10.0.0.0/24 -j ACCEPT

# Block an IP
iptables -A INPUT -s 198.51.100.50 -j DROP

# Save rules
iptables-save > /etc/iptables/rules.v4

# Restore
iptables-restore < /etc/iptables/rules.v4
```

**ufw equivalents:**
```bash
ufw allow from 10.0.0.0/24 to any port 22
ufw deny from 198.51.100.50
```

---

## Network Monitoring

```bash
# Real-time connections
ss -tunlp
ss -s    # summary

# Traffic by interface
ip -s link

# Packet capture
tcpdump -i ens3 -n port 80
tcpdump -i ens3 -w capture.pcap    # write to file

# Bandwidth monitoring
iftop       # real-time bandwidth by connection
nethogs     # bandwidth by process
```

---

## Bonding Types

| Mode | Name | Load balancing | Fault tolerance |
|------|------|----------------|-----------------|
| 0 | balance-rr | Round-robin | Yes |
| 1 | active-backup | No | Yes (one active) |
| 2 | balance-xor | XOR | Yes |
| 3 | broadcast | All | Yes |
| 4 | 802.3ad | LACP | Yes |
| 5 | balance-tlb | Adaptive TX | Yes |
| 6 | balance-alb | Adaptive | Yes |

**Most common:** Mode1 (active-backup) for redundancy, Mode4 (802.3ad) for throughput.

---

## Real Task: Configure Production Networking

```bash
# 1. Set static IP
cat > /etc/netplan/01-config.yaml << 'EOF'
network:
  version: 2
  ethernets:
    ens3:
      addresses: [10.0.0.5/24]
      routes:
        - to: default
          via: 10.0.0.1
      nameservers:
        addresses: [10.0.0.2, 8.8.8.8]
EOF
netplan apply

# 2. Configure bonding
cat > /etc/netplan/02-bond.yaml << 'EOF'
network:
  bonds:
    bond0:
      interfaces: [ens3, ens4]
      parameters:
        mode: active-backup
        primary: ens3
      addresses: [10.0.0.5/24]
      gateway4: 10.0.0.1
EOF
netplan apply

# 3. Firewall
ufw default deny incoming
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 4. Monitor
tcpdump -i ens3 -c 100 -n port 80
```

---

## Assessment

**Lab task (25 min):**

1. Configure static IP and DNS
2. Set up network bonding (active-backup)
3. Configure iptables/ufw with specific rules
4. Set up static routes
5. Capture and analyze network traffic with tcpdump
6. Monitor bandwidth with iftop/nethogs

**Grading:**
- Static IP configured: 15%
- Bonding working: 20%
- Firewall rules correct: 25%
- Routes configured: 15%
- Traffic captured: 15%
- Monitoring tested: 10%

---

## Evidence

- **OutcomeEvidence:** `SYS-LO5 — Network Configuration`
- **Mastery:** `UserSkill: linux-network-config`

---

## Unlock

Module6 — Security Hardening. You can configure the network. Now you learn how to secure it.

---

## Sources

- `man netplan`, `man iptables`, `man tcpdump`
- `man ss`, `man ip`

---

## AI Provenance

- **Draft:** LLM (2025-08-31)
- **Voice:** Network engineer who's configured production switches
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
