# Module 7 — VPN Technologies

**Course:** Networking | **Path:** Networking (7 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 25 min | **Prerequisite:** Module 6 — Firewalls

---

## What You'll Actually Do

Remote workers need access to internal resources. You'll set up WireGuard for site-to-site connectivity, configure OpenVPN for remote access, and understand when to use each.

---

## VPN Types

| Type | Use case | Example |
|------|----------|---------|
| Site-to-site | Connect two offices | WireGuard between DC and branch |
| Remote access | Individual connects to network | OpenVPN for remote workers |
| Client-to-client | Individuals connect to each other | Mesh VPN (Tailscale) |

---

## WireGuard — The Modern VPN

Fast, simple, secure. Uses modern cryptography.

**Server setup:**
```bash
# Generate keys
wg genkey | tee server_private.key | wg pubkey > server_public.key

# Configure
cat > /etc/wireguard/wg0.conf << 'EOF'
[Interface]
PrivateKey = <server_private_key>
Address = 10.100.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o ens3 -j MASQUERADE

[Peer]
PublicKey = <client_public_key>
AllowedIPs = 10.100.0.2/32
EOF

wg-quick up wg0
systemctl enable wg-quick@wg0
```

**Client setup:**
```bash
# Generate keys
wg genkey | tee client_private.key | wg pubkey > client_public.key

# Configure
cat > /etc/wireguard/wg0.conf << 'EOF'
[Interface]
PrivateKey = <client_private_key>
Address = 10.100.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = <server_public_key>
Endpoint = server_ip:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF

wg-quick up wg0
```

**Check status:**
```bash
wg show
# interface: wg0
#   public key: ...
#   listening port: 51820
#
# peer: ...
#   endpoint: ...
#   allowed ips: 0.0.0.0/0
#   latest handshake: 1 minute ago
#   transfer: 1.23 GiB received, 456 MiB sent
```

---

## OpenVPN — The Classic

More configurable, works everywhere, but slower than WireGuard.

**Server:**
```bash
apt install openvpn
# Generate keys with easy-rsa
# Configure /etc/openvpn/server.conf
systemctl enable --now openvpn
```

**Client:**
```bash
# Import .ovpn config file
openvpn --config client.ovpn
```

---

## WireGuard vs OpenVPN

| Feature | WireGuard | OpenVPN |
|---------|-----------|---------|
| Speed | Very fast | Slower |
| Config | Simple | Complex |
| Codebase | ~4000 lines | ~100k lines |
| UDP only | Yes | TCP and UDP |
| Mobile | Excellent | Good |
| Maturity | Newer (2016) | Established (2001) |

**Rule of thumb:** Use WireGuard unless you need OpenVPN-specific features (TCP fallback, complex auth).

---

## Split Tunneling

Route only specific traffic through VPN, not everything.

```ini
# WireGuard — only route internal subnets
[Peer]
AllowedIPs = 10.0.0.0/8, 192.168.0.0/16
```

```ini
# OpenVPN
# push "route 10.0.0.0 255.0.0.0"
# push "route 192.168.0.0 255.255.0.0"
```

Internet traffic goes direct. Internal traffic goes through VPN.

---

## Assessment

**Lab task (20 min):**

1. Set up WireGuard server
2. Configure a WireGuard client
3. Test connectivity through the tunnel
4. Configure split tunneling
5. Compare WireGuard and OpenVPN performance

**Grading:**
- WireGuard server configured: 25%
- Client connected: 25%
- Connectivity working: 20%
- Split tunneling: 15%
- Comparison documented: 15%

---

## Evidence

- **OutcomeEvidence:** `NET-LO7 — VPN Technologies`
- **Mastery:** `UserSkill: networking-vpn`

---

## Unlock

Module8 — Network Troubleshooting. You can tunnel traffic. Now you learn how to debug when things break.

---

## Sources

- WireGuard documentation
- OpenVPN documentation
- `man wg`, `man wg-quick`

---

## AI Provenance

- **Draft:** LLM (2025-08-31)
- **Voice:** Network engineer who's set up VPNs for remote teams
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
