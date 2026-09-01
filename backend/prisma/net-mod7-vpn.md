# Module 7: VPN Technologies

VPNs create encrypted tunnels over untrusted networks, allowing remote users or sites to communicate as if they were on the same local network. The technology behind VPNs ranges from simple password-based solutions to complex public-key infrastructure with hardware acceleration. Understanding the trade-offs between security, performance, and complexity is essential for choosing and deploying the right VPN solution.

This module covers site-to-site vs remote access VPNs, WireGuard, OpenVPN, IPSec (IKEv2, transport vs tunnel mode), split tunneling, and the practical process of connecting branch offices via VPN.

## Site-to-Site vs Remote Access VPN

The distinction is straightforward:

**Site-to-site VPN**: Connects two entire networks together. A router or firewall at each site establishes the tunnel. Users at both sites can access resources on the other side without any client software: the VPN is transparent. This is used to connect branch offices to headquarters, or to connect on-premises infrastructure to cloud VPCs.

**Remote access VPN**: Connects individual users to a network. Each user runs a VPN client on their device, establishing a tunnel to a VPN server. This is used for remote workers, mobile devices, and temporary access.

The technical difference is in the tunnel endpoints:
- Site-to-site: The tunnel terminates on network devices (routers/firewalls), and the encrypted traffic is forwarded to/from the internal network.
- Remote access: The tunnel terminates on a VPN server, and the client device becomes a member of the remote network.

When designing a VPN deployment, you need to consider:
- How many sites need to connect?
- How many remote users need access?
- What protocols and applications need to traverse the tunnel?
- What are the bandwidth and latency requirements?
- What security standards must the VPN meet?

## WireGuard

WireGuard is a modern VPN protocol that emphasizes simplicity, speed, and strong cryptography. It uses a single cryptographic suite (Noise protocol framework, Curve25519, ChaCha20, Poly1305, BLAKE2s) and has a codebase of approximately 4,000 lines: compared to tens of thousands for OpenVPN and IPSec.

### WireGuard Concepts

WireGuard uses public-key cryptography. Each peer (client or server) has:
- A **private key**: Kept secret, used to decrypt incoming traffic and sign outgoing traffic.
- A **public key**: Derived from the private key, shared with other peers.
- A **preshared key**: An optional symmetric key for post-quantum resistance.

The tunnel is identified by the public keys of both peers. There are no certificates, no complex handshakes, and no certificate authorities. This simplicity is WireGuard's greatest strength: and also its limitation. There is no built-in certificate management, so key distribution must be handled out-of-band (copying public keys manually, using a configuration management tool, or deploying a custom key management system).

### WireGuard Server Configuration

On a Linux server (10.0.0.1):

```bash
# Install WireGuard
apt install wireguard

# Generate server keys
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key
```

Server configuration (`/etc/wireguard/wg0.conf`):
```ini
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <server_private_key>

# Post-up rules: enable NAT and forwarding
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Peer: Client 1
[Peer]
PublicKey = <client1_public_key>
PresharedKey = <preshared_key_1>
AllowedIPs = 10.0.0.2/32
```

### WireGuard Client Configuration

On a Linux client:

```bash
# Generate client keys
wg genkey | tee /etc/wireguard/client_private.key | wg pubkey > /etc/wireguard/client_public.key
```

Client configuration (`/etc/wireguard/wg0.conf`):
```ini
[Interface]
Address = 10.0.0.2/24
PrivateKey = <client_private_key>
DNS = 8.8.8.8

[Peer]
PublicKey = <server_public_key>
PresharedKey = <preshared_key_1>
Endpoint = 203.0.113.50:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

`AllowedIPs = 0.0.0.0/0` means all traffic from the client goes through the VPN (full tunnel). For split tunneling, use `AllowedIPs = 10.0.0.0/8, 192.168.1.0/24` to only route specific subnets through the VPN.

`PersistentKeepalive = 25` sends a keepalive packet every 25 seconds to maintain the tunnel through NAT devices. Without this, the tunnel would drop after the NAT mapping times out (typically 30-60 seconds of inactivity).

### Starting WireGuard

```bash
# Start the tunnel
wg-quick up wg0

# Check status
wg show

# Output:
# interface: wg0
#   public key: <server_public_key>
#   private key: (hidden)
#   listening port: 51820
#
# peer: <client1_public_key>
#   endpoint: 198.51.100.10:41234
#   allowed ips: 10.0.0.2/32
#   latest handshake: 32 seconds ago
#   transfer: 1.24 MiB received, 3.56 MiB sent

# Stop the tunnel
wg-quick down wg0
```

### WireGuard for Site-to-Site

To connect two offices:

Site A (192.168.1.0/24):
```ini
[Interface]
Address = 10.0.0.1/24
PrivateKey = <siteA_private_key>
ListenPort = 51820

[Peer]
PublicKey = <siteB_public_key>
Endpoint = 198.51.100.10:51820
AllowedIPs = 10.0.0.2/32, 192.168.2.0/24
```

Site B (192.168.2.0/24):
```ini
[Interface]
Address = 10.0.0.2/24
PrivateKey = <siteB_private_key>
ListenPort = 51820

[Peer]
PublicKey = <siteA_public_key>
Endpoint = 203.0.113.50:51820
AllowedIPs = 10.0.0.1/32, 192.168.1.0/24
```

Both sides also need routing:
```bash
# Site A: route to Site B's LAN
ip route add 192.168.2.0/24 via 10.0.0.2

# Site B: route to Site A's LAN
ip route add 192.168.1.0/24 via 10.0.0.1
```

### WireGuard Performance

WireGuard's performance advantage comes from its implementation in the Linux kernel. Userspace VPNs (like OpenVPN) must copy packets between kernel and user space, adding overhead. WireGuard processes packets entirely in kernel space.

Typical throughput comparisons on the same hardware:
- WireGuard: ~3-5 Gbps
- OpenVPN (TCP): ~500 Mbps - 1 Gbps
- OpenVPN (UDP): ~1-2 Gbps
- IPSec (with hardware acceleration): ~5-10 Gbps

WireGuard also has lower latency because of its simpler handshake. The initial handshake completes in one round trip (compared to two for IKEv2). Subsequent handshakes (after a tunnel timeout) use an optimized renegotiation that is even faster.

## OpenVPN

OpenVPN is the most widely deployed open-source VPN solution. It uses OpenSSL for encryption, supports TCP and UDP transport, and can operate in two modes:

**SSL/TLS mode (certificate-based)**: Each client has a certificate signed by a CA. The server authenticates clients using their certificates. This is the standard production deployment.

**Static key mode (pre-shared)**: A single pre-shared key is used by both client and server. Simpler but less secure: no perfect forward secrecy, and compromising the key compromises all past and future traffic.

### OpenVPN Server Configuration

Generate the PKI:
```bash
# Install EasyRSA
apt install easy-rsa
make-cadir /etc/openvpn/easy-rsa
cd /etc/openvpn/easy-rsa

# Initialize PKI
./easyrsa init-pki

# Build CA
./easyrsa build-ca

# Generate server certificate and key
./easyrsa build-server-full server nopass

# Generate client certificate
./easyrsa build-client-full client1 nopass

# Generate Diffie-Hellman parameters
./easyrsa gen-dh

# Generate TLS-Auth key
openvpn --genkey --secret /etc/openvpn/ta.key
```

Server configuration (`/etc/openvpn/server.conf`):
```ini
port 1194
proto udp
dev tun

ca /etc/openvpn/easy-rsa/pki/ca.crt
cert /etc/openvpn/easy-rsa/pki/issued/server.crt
key /etc/openvpn/easy-rsa/pki/private/server.key
dh /etc/openvpn/easy-rsa/pki/dh.pem
tls-auth /etc/openvpn/ta.key 0

server 10.8.0.0 255.255.255.0
ifconfig-pool-persist /var/log/openvpn/ipp.txt

# Push routes to clients
push "route 192.168.1.0 255.255.255.0"
push "route 172.16.0.0 255.240.0.0"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"

# Allow clients to see each other
client-to-client

# Keep tunnel alive
keepalive 10 120

# Use AES-256-GCM
cipher AES-256-GCM
auth SHA256

# Reduce daemon privileges
user nobody
group nogroup

# Persist state
persist-key
persist-tun

# Logging
status /var/log/openvpn/status.log
log-append /var/log/openvpn/openvpn.log
verb 3

# Maximum clients
max-clients 50
```

### OpenVPN Client Configuration

Client configuration (`/etc/openvpn/client.conf`):
```ini
client
dev tun
proto udp

remote 203.0.113.50 1194

resolv-retry infinite
nobind
persist-key
persist-tun

ca ca.crt
cert client1.crt
key client1.key
tls-auth ta.key 1

cipher AES-256-GCM
auth SHA256

verb 3

# Redirect all traffic through VPN (full tunnel)
redirect-gateway def1 bypass-dhcp

# Use specific DNS
dhcp-option DNS 8.8.8.8
```

### OpenVPN Management Interface

OpenVPN provides a management interface for monitoring and control:

```ini
# In server.conf
management 127.0.0.1 7505
```

Connect to it:
```bash
telnet 127.0.0.1 7505

# List connected clients
> clients

# Disconnect a specific client
> kill client1

# View status
> status
```

### OpenVPN Performance Tuning

OpenVPN's performance depends heavily on configuration choices:

**UDP vs TCP transport**: UDP is faster because it avoids TCP's overhead (sequence numbers, acknowledgments, retransmissions). TCP-in-TCP can cause "TCP meltdown": if the outer TCP connection drops packets, it retransmits, adding latency to the inner TCP connection. Always prefer UDP for VPN transport unless you need to traverse a firewall that only allows TCP.

**Cipher selection**: AES-256-GCM is the recommended cipher. It provides authenticated encryption (combined encryption and integrity) and is hardware-accelerated on modern CPUs. Avoid older ciphers like Blowfish or RC4.

**MTU considerations**: OpenVPN adds overhead to each packet (encryption headers, UDP headers). The default MTU of 1500 is often too large. Set `tun-mtu 1400` or `mssfix 1360` to avoid fragmentation.

## IPSec: IKEv2 and Tunnel/Transport Modes

IPSec is a suite of protocols for securing IP communications. It provides encryption (ESP), authentication (AH), and key management (IKE). IPSec is commonly used for site-to-site VPNs and is built into most operating systems and network devices.

### IPSec Components

**IKE (Internet Key Exchange)**: Negotiates security associations (SAs): agreed-upon encryption algorithms, keys, and lifetimes.

**ESP (Encapsulating Security Payload)**: Encrypts and authenticates the payload. This is the primary protocol for VPN tunnels.

**AH (Authentication Header)**: Authenticates the entire packet (header + payload) but does not encrypt. Rarely used because it conflicts with NAT.

### IKEv1 vs IKEv2

**IKEv1**: Two-phase negotiation. Phase 1 establishes a secure channel (ISAKMP SA). Phase 2 establishes the IPSec SA for actual data protection. Configuration is more complex.

**IKEv2**: Streamlined negotiation. Combines the phases more efficiently. Supports MOBIKE (Mobility and Multihoming) for roaming clients. Faster reconnection when the tunnel drops. Preferred for modern deployments.

### Transport vs Tunnel Mode

**Transport mode**: Only the payload is encrypted. The original IP header is preserved. Used for host-to-host communication (both endpoints are IPSec-aware).

```
Original packet: [IP Header][TCP/UDP Header][Data]
Transport mode:  [IP Header][ESP Header][Encrypted(TCP/UDP Header + Data)][ESP Trailer][ESP Auth]
```

**Tunnel mode**: The entire original packet (including IP header) is encrypted and encapsulated in a new IP packet. Used for site-to-site VPNs and remote access VPNs.

```
Original packet: [IP Header][TCP/UDP Header][Data]
Tunnel mode:     [New IP Header][ESP Header][Encrypted(IP Header + TCP/UDP Header + Data)][ESP Trailer][ESP Auth]
```

### IPSec Configuration (Linux with strongSwan)

strongSwan is the standard IPSec implementation for Linux.

Server configuration (`/etc/ipsec.conf`):
```ini
config setup
    charondebug="ike 2, knl 2, cfg 2"

conn site-to-site
    keyexchange=ikev2
    left=203.0.113.50
    leftsubnet=192.168.1.0/24
    right=198.51.100.10
    rightsubnet=192.168.2.0/24
    ike=aes256-sha256-modp2048!
    esp=aes256-sha256!
    authby=secret
    auto=start
```

Pre-shared keys (`/etc/ipsec.secrets`):
```ini
203.0.113.50 198.51.100.10 : PSK "shared-secret-key-here"
```

### IPSec with IKEv2 for Remote Access

Server configuration:
```ini
conn remote-access
    keyexchange=ikev2
    left=203.0.113.50
    leftsubnet=0.0.0.0/0
    right=%any
    rightsourceip=10.0.0.0/24
    ike=aes256-sha256-modp2048!
    esp=aes256-sha256!
    authby=pubkey
    leftcert=server-cert.pem
    auto=add
```

Client configuration:
```ini
conn home
    keyexchange=ikev2
    left=%defaultroute
    leftsourceip=%config
    right=203.0.113.50
    rightsubnet=0.0.0.0/0
    rightid=server.example.com
    ike=aes256-sha256-modp2048!
    esp=aes256-sha256!
    authby=pubkey
    leftcert=client-cert.pem
    auto=start
```

## Split Tunneling vs Full Tunnel

**Full tunnel**: All traffic from the client goes through the VPN, including internet traffic. This routes all traffic through the corporate network, which:
- Provides visibility and control for the organization
- Adds latency for internet access (traffic goes to the VPN server and back)
- Increases bandwidth usage on the VPN server
- Is required for compliance in regulated industries

**Split tunnel**: Only traffic destined for the corporate network goes through the VPN. Internet traffic goes directly through the local gateway. This:
- Reduces VPN server load
- Provides better performance for internet access
- Reduces bandwidth costs
- But limits visibility and control over remote users' internet activity

### Configuration Examples

WireGuard split tunnel (client):
```ini
[Peer]
AllowedIPs = 192.168.1.0/24, 10.0.0.0/8
```

WireGuard full tunnel (client):
```ini
[Peer]
AllowedIPs = 0.0.0.0/0
```

OpenVPN split tunnel:
```ini
# In client.conf
# Comment out redirect-gateway to enable split tunnel
# redirect-gateway def1 bypass-dhcp

# Push only specific routes
push "route 192.168.1.0 255.255.255.0"
```

### Security Implications

Split tunneling creates a security risk: while the VPN is active, the client has two routes to the internet: one through the VPN and one directly. An attacker could potentially route traffic through the direct connection to bypass corporate security controls.

Some organizations enforce full tunneling through group policy and use always-on VPN configurations to ensure the tunnel is active before the user can access any resources.

## VPN Security Considerations

VPNs create trusted pathways through untrusted networks. Misconfigured VPNs can expose your internal network more than having no VPN at all.

### Key Exchange Security

The security of a VPN depends entirely on the key exchange. Weak key exchange parameters render the encryption useless.

```bash
# Check WireGuard key strength
wg genkey | wg pubkey
# WireGuard always uses Curve25519 (128-bit security): no configuration needed

# Check IPSec key parameters (strongSwan)
# In /etc/ipsec.conf, ensure strong parameters:
# ike=aes256-sha256-modp2048!  (not modp1024)
# esp=aes256-sha256!
```

### Perfect Forward Secrecy

PFS ensures that compromising a long-term key does not compromise past session keys. WireGuard has PFS built in (ephemeral keys for every session). OpenVPN and IPSec require explicit configuration:

```bash
# OpenVPN: Enable TLS-Crypt (includes PFS via ephemeral keys)
tls-crypt /etc/openvpn/ta.key

# IPSec: Use DH groups >= 2048-bit
# In strongSwan:
# ike=aes256-sha256-modp2048!
```

### VPN Kill Switch

A kill switch ensures all traffic stops if the VPN tunnel drops, preventing data leakage over the direct internet connection.

```bash
# WireGuard kill switch (PostDown rules)
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -D INPUT -i wg0 -j ACCEPT
PostDown = iptables -A OUTPUT -o eth0 -j DROP
PostDown = iptables -D OUTPUT -o eth0 -j DROP

# OpenVPN kill switch
# In client.conf
route-nopull
route 0.0.0.0 128.0.0.0 vpn_gateway
route 128.0.0.0 128.0.0.0 vpn_gateway
```

## Real Scenario: Connecting Branch Offices via VPN

Your company has three offices:
- HQ (New York): 192.168.1.0/24, public IP 203.0.113.50
- Branch A (Chicago): 192.168.2.0/24, public IP 198.51.100.10
- Branch B (London): 192.168.3.0/24, public IP 192.0.2.10

All offices have broadband internet with static public IPs. You need to connect all three offices so that users in any office can access resources in the other offices.

### Design Decision: WireGuard Hub-and-Spoke

HQ acts as the hub. Branch offices connect to HQ. Traffic between branches goes through HQ. This simplifies routing (each branch only needs one tunnel) and centralizes management.

### Configuration

**HQ (Hub): /etc/wireguard/wg0.conf:**
```ini
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <hq_private_key>

PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Branch A
[Peer]
PublicKey = <branchA_public_key>
PresharedKey = <psk_a>
AllowedIPs = 10.0.0.2/32, 192.168.2.0/24
Endpoint = 198.51.100.10:51820

# Branch B
[Peer]
PublicKey = <branchB_public_key>
PresharedKey = <psk_b>
AllowedIPs = 10.0.0.3/32, 192.168.3.0/24
Endpoint = 192.0.2.10:51820
```

**Branch A: /etc/wireguard/wg0.conf:**
```ini
[Interface]
Address = 10.0.0.2/24
ListenPort = 51820
PrivateKey = <branchA_private_key>

PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT

# HQ (hub)
[Peer]
PublicKey = <hq_public_key>
PresharedKey = <psk_a>
AllowedIPs = 10.0.0.1/32, 192.168.1.0/24, 192.168.3.0/24
Endpoint = 203.0.113.50:51820
PersistentKeepalive = 25
```

Note: Branch A's AllowedIPs includes Branch B's subnet (192.168.3.0/24) because traffic to Branch B goes through HQ.

**Branch B: /etc/wireguard/wg0.conf:**
```ini
[Interface]
Address = 10.0.0.3/24
ListenPort = 51820
PrivateKey = <branchB_private_key>

PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT

# HQ (hub)
[Peer]
PublicKey = <hq_public_key>
PresharedKey = <psk_b>
AllowedIPs = 10.0.0.1/32, 192.168.1.0/24, 192.168.2.0/24
Endpoint = 203.0.113.50:51820
PersistentKeepalive = 25
```

### Routing

HQ needs to forward traffic between branches:
```bash
# Already handled by PostUp iptables rules
# The FORWARD chain accepts all wg0 traffic
```

Each branch needs to know how to reach the other branch's subnet:
```bash
# Branch A: route to Branch B's LAN via the VPN tunnel
ip route add 192.168.3.0/24 via 10.0.0.1

# Branch B: route to Branch A's LAN via the VPN tunnel
ip route add 192.168.2.0/24 via 10.0.0.1
```

These routes are automatically added when WireGuard processes the AllowedIPs, but verifying them is important:
```bash
# On Branch A
ip route show | grep 192.168.3
# Should show: 192.168.3.0/24 via 10.0.0.1 dev wg0
```

### Firewall Rules

HQ firewall needs to allow WireGuard traffic:
```bash
# Allow WireGuard on UDP port 51820
iptables -A INPUT -p udp --dport 51820 -j ACCEPT

# Allow forwarding between VPN and internal networks
iptables -A FORWARD -i wg0 -o eth0 -j ACCEPT
iptables -A FORWARD -i eth0 -o wg0 -j ACCEPT
```

### Monitoring

```bash
# Check tunnel status
wg show

# Verify connectivity
ping 10.0.0.2  # From HQ to Branch A
ping 192.168.2.10  # From HQ to Branch A's LAN

# Check for handshake freshness
wg show wg0 latest-handshakes

# Monitor bandwidth usage
iftap -i wg0
```

### Failover Considerations

If HQ goes down, branches cannot communicate with each other (hub-and-spoke limitation). For higher availability:

1. Set up a secondary hub (e.g., Branch A can also act as a hub).
2. Configure both peers on each branch:
```ini
# Branch A: primary peer is HQ, secondary peer is Branch B directly
[Peer]
PublicKey = <hq_public_key>
AllowedIPs = 10.0.0.1/32, 192.168.1.0/24
Endpoint = 203.0.113.50:51820

[Peer]
PublicKey = <branchB_public_key>
AllowedIPs = 10.0.0.3/32, 192.168.3.0/24
Endpoint = 192.0.2.10:51820
PersistentKeepalive = 25
```

WireGuard will try the primary peer first and fail over to the secondary if the primary becomes unreachable. The failover time depends on the PersistentKeepalive value and the detection of peer unreachable status. With PersistentKeepalive set to 25 seconds, failover typically occurs within 60-90 seconds.

## VPN Troubleshooting

When a VPN tunnel fails to establish or passes no traffic, methodical troubleshooting is essential.

### Common VPN Issues

**Tunnel establishes but no traffic passes:**
```bash
# Check routing on both sides
ip route show | grep 192.168

# Check firewall rules (most common cause)
iptables -L FORWARD -v -n

# Check if NAT is masquerading VPN traffic
iptables -t nat -L -v -n

# Check MTU (VPN overhead reduces effective MTU)
ping -M do -s 1300 10.0.0.1
```

**Tunnel does not establish:**
```bash
# Check if the VPN port is reachable
nc -u -zv 203.0.113.50 51820

# Check if the service is running
systemctl status wg-quick@wg0

# Check logs
journalctl -u wg-quick@wg0 -f

# Verify keys match
wg show | grep "public key"
```

**Intermittent tunnel drops:**
```bash
# Check for NAT timeout issues
# Increase PersistentKeepalive to 15-25 seconds
# Check for asymmetric routing
traceroute 10.0.0.1

# Monitor tunnel stability
watch -n 5 wg show
```

## VPN Protocol Comparison

Choosing the right VPN protocol depends on your specific requirements. Here is a practical comparison to guide your decision.

### Performance Comparison

Throughput measurements on identical hardware (Intel Xeon, 10 Gbps NIC):
- WireGuard: 3.5 Gbps (kernel-space, minimal overhead)
- OpenVPN (UDP, AES-256-GCM): 1.2 Gbps (userspace, TLS overhead)
- OpenVPN (TCP, AES-256-GCM): 800 Mbps (TCP-in-TCP overhead)
- IPSec (IKEv2, AES-256): 4.2 Gbps (kernel-space, hardware acceleration)

Latency overhead per packet:
- WireGuard: ~0.1 ms
- OpenVPN: ~0.5 ms
- IPSec: ~0.2 ms

### Compatibility

- WireGuard: Built into Linux 5.6+. Windows, Mac, iOS, Android via official clients. Limited enterprise integration.
- OpenVPN: Available on all platforms. Mature, widely supported. Easy to deploy through firewalls (uses TCP 443).
- IPSec: Built into every major OS and network device. Standard for enterprise and site-to-site VPNs. Complex configuration.

### When to Use Each

**Use WireGuard when:**
- Performance is critical
- You need simplicity and speed
- You are comfortable with key management
- The network is Linux-heavy

**Use OpenVPN when:**
- You need maximum compatibility
- You need to traverse restrictive firewalls (TCP 443)
- You need certificate-based authentication
- You need fine-grained access control

**Use IPSec when:**
- You need to connect to existing enterprise infrastructure
- You need FIPS-validated cryptography
- You need hardware-accelerated encryption
- You are building a site-to-site VPN to a cloud provider

## Assessment

**Lab Exercise: VPN Deployment (60 minutes)**

Task 1 (25 minutes): Set up a WireGuard VPN between two VMs or containers:
- Server VM: 10.0.0.1/24, public IP configured
- Client VM: 10.0.0.2/24
- Configure the tunnel and verify connectivity with ping
- Configure split tunneling so only 192.168.1.0/24 traffic goes through the VPN
- Verify with traceroute that internet traffic goes direct

Task 2 (20 minutes): Compare WireGuard, OpenVPN, and IPSec for the following scenarios:
- A startup with 20 remote employees needs simple remote access
- A manufacturing company needs to connect 50 sites with hardware-accelerated encryption
- A government agency requires FIPS-validated cryptography

Justify your recommendation for each.

Task 3 (15 minutes): You discover that a WireGuard tunnel is up but traffic is not passing. List five possible causes and the diagnostic commands to check each.

**Grading Criteria:**
- VPN configuration correctness: 30 points
- Protocol comparison depth: 25 points
- Troubleshooting methodology: 25 points
- Security considerations: 20 points

## Evidence

Save the following to your portfolio:
1. WireGuard configuration files for both server and client
2. Output of `wg show` demonstrating an active tunnel with traffic counters
3. Protocol comparison analysis for Task 2
4. Troubleshooting checklist for Task 3 with specific commands and expected outputs

VPNs are fundamental to modern network architecture. The trend is toward WireGuard for simplicity and performance, OpenVPN for compatibility and flexibility, and IPSec for enterprise integration and compliance requirements. Understanding all three gives you the ability to choose the right tool for each situation.