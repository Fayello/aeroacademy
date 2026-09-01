# Module 5: Network Configuration

A server with no network is a very expensive paperweight. Network misconfiguration is one of the most common causes of service outages, and fixing it often means losing access to the very system you need to fix. This module covers network configuration across major distributions, including NetworkManager, Netplan, static and DHCP setup, bonding, bridging, VLANs, and DNS configuration. You will learn to configure a multi-homed server which is one of the most practical network administration scenarios.

## Network Configuration Landscape

Linux network configuration has historically been distribution-specific but two tools dominate today. **NetworkManager** is the standard on RHEL/CentOS 7+, Fedora, Ubuntu 18.04+, and Debian 10+. It handles dynamic configuration, Wi-Fi, VPN, and modern network features. **Netplan** is Ubuntu's abstraction layer over NetworkManager or systemd-networkd that uses YAML configuration files to generate backend configs. Older systems used `ifcfg` files on RHEL/CentOS 6, `/etc/network/interfaces` on Debian, or manual `ip` commands. You will still encounter these on legacy systems.

Understanding which tool your distribution uses is important because the configuration syntax differs significantly. NetworkManager uses `nmcli` and `.nmconnection` files. Netplan uses YAML files in `/etc/netplan/`. The older `ifcfg` files are simple key-value pairs. Each approach achieves the same result but the commands and file formats are different.

## Diagnosing Network Issues

Before changing anything, understand the current state. Use `ip addr show` for IP addresses, `ip route show` for the routing table, `cat /etc/resolv.conf` and `resolvectl status` for DNS, `ss -tlnp` for listening TCP ports, `ss -ulnp` for UDP, `ss -s` for connection statistics, `ethtool` for interface and driver info, `ping` for basic connectivity, `traceroute` for path analysis, and `mtr` for combined ping and traceroute. For DNS debugging, use `dig`, `nslookup`, and `host` commands.

Common first-aid includes restarting NetworkManager or networkd, forcing DHCP renewal with `dhclient -r` followed by `dhclient`, checking cable and link issues with `ethtool` (look for "Link detected: yes"), and verifying interfaces are up with `ip link set`.

### Systematic Troubleshooting Checklist

Work through network issues in this order: physical layer (cable connected, link detected with `ethtool`), interface state (up and has IP with `ip addr`), gateway reachable (ping gateway IP), DNS working (dig external domain), external connectivity (ping 8.8.8.8 bypassing DNS), firewall not blocking (check rules with `iptables -L -n` or `nft list ruleset`), and service listening (`ss -tlnp | grep :port`).

## NetworkManager (nmcli)

NetworkManager is the modern standard. Even if you prefer manual configuration, understanding nmcli is essential for troubleshooting. Use `nmcli connection show` for all connections, `--active` for active ones, `device status` for device state, and `connection show` followed by a connection name for details.

### Setting a Static IP

Use `nmcli connection modify` with the connection name, `ipv4.method manual`, `ipv4.addresses` with CIDR notation, `ipv4.gateway`, and `ipv4.dns`. Apply changes with `nmcli connection up`. Example: `nmcli connection modify "System eth0" ipv4.method manual ipv4.addresses 10.0.0.50/24 ipv4.gateway 10.0.0.1 ipv4.dns "8.8.8.8,8.8.4.4"`.

### Setting DHCP

Use `nmcli connection modify` with `ipv4.method auto` and clear the dns and gateway fields. Apply with `connection up`. DHCP is the default for most NetworkManager connections.

### Adding a Second IP Address

Use `nmcli connection modify` with the `+ipv4.addresses` prefix to add without replacing existing addresses. This is useful for servers that need to be accessible from multiple subnets.

### Creating a New Connection

Use `nmcli connection add` with `type ethernet`, connection name, interface name, and IP configuration. For Wi-Fi, use `type wifi` with `ssid` and `wifi-sec` settings. Set `autoconnect yes` to connect automatically at boot.

### NetworkManager Configuration Files

Connections are stored in `/etc/NetworkManager/system-connections/` as `.nmconnection` files in INI format with sections for `[connection]`, `[ipv4]`, `[ipv6]`, and `[wifi]`. After editing, reload with `nmcli connection reload` and reapply with `connection up`.

### NetworkManager Dispatcher Scripts

Create scripts in `/etc/NetworkManager/dispatcher.d/` that run when interfaces come up or down. These scripts receive environment variables like `INTERFACE`, `ACTION` (up, down, dhcp4-change), and connection details. Use them for custom routing, firewall rules, or service restarts.

## Netplan (Ubuntu)

Ubuntu 18.04+ uses Netplan as a YAML abstraction. Configuration files live in `/etc/netplan/`. The `version` field should be 2. The `renderer` field selects between `networkd` for servers and `NetworkManager` for desktops. Define ethernet interfaces with `dhcp4` for automatic or static `addresses`, `routes`, and `nameservers`. Apply with `netplan try` (which reverts after 120 seconds if not confirmed) or `netplan apply` for permanent changes.

Always use `netplan try` for remote servers to prevent lockouts. If the new configuration is wrong, it reverts automatically after the timeout. This is your safety net for remote configuration changes.

### Multiple Interfaces in Netplan

Define multiple interfaces under the `ethernets` key. Each interface gets its own configuration block. Add routes with the `routes` key using `to` and `via` directives. Add DNS servers with the `nameservers` key.

## Static versus DHCP

Use DHCP for development and staging environments, workstations, laptops, cloud instances, and lab environments where IPs change frequently. Use static for production servers, DNS servers, load balancers, and any server that other systems connect to by IP. Even with DHCP, you can ensure consistent IPs through DHCP reservations on the server or by using NetworkManager's `dhcp-hostname` option.

## NIC Bonding

Bonding combines multiple physical NICs into a single logical interface for increased throughput or redundancy. The most common modes are **active-backup** (mode 1) for simple failover with no special switch configuration, and **802.3ad** (mode 4) for LACP-based load balancing that requires switch support.

Create bonds with `nmcli` by adding a type bond connection with `bond.options` specifying mode and miimon (link monitoring interval in milliseconds), then add slave interfaces with `slave-type bond`. Verify with `cat /proc/net/bonding/bond0` which shows the bond mode, slave status, and link failure counts.

For active-backup mode, the bond monitors link state with MII monitoring. If the active link fails, traffic switches to the backup link within milliseconds. For 802.3ad mode, the switch must be configured for LACP to aggregate multiple links into a single logical connection.

## NIC Bridging

Bridges connect multiple network segments at Layer 2. They are essential for virtualization where VMs need to connect to the physical network. Create bridges with `nmcli` by adding a type `bridge` connection and then adding slave interfaces with `slave-type bridge`. For KVM, configure the bridge with STP disabled for simplicity and connect VMs to it.

Bridges act like a virtual switch. All interfaces connected to the bridge can communicate with each other at Layer 2. The bridge itself can have an IP address for host management while VMs get their own IPs on the bridged network.

## VLANs

Virtual LANs segment a single physical network into multiple logical networks. They are essential for separating production, management, and backup traffic. Create VLANs with `nmcli` by adding a type `vlan` connection with the VLAN ID and parent device. Each VLAN gets its own IP subnet and routing.

Verify VLAN configuration with `cat /proc/net/vlan/config`. VLAN tagging happens at the switch port level: configure the switch to trunk multiple VLANs on the port connected to the Linux server.

## DNS Configuration

### /etc/resolv.conf

The traditional DNS configuration file with `nameserver` entries, a `search` directive for domain suffixes, and `options` for timeout, attempts, and round-robin. The `search` directive lets you resolve short names by appending domain suffixes automatically. For example, with `search example.com prod.example.com`, the name `db` resolves to `db.example.com` first, then `db.prod.example.com`.

### systemd-resolved

Modern systems use `systemd-resolved` as a local DNS resolver with caching. Check status with `resolvectl status`, view statistics, flush caches, and query directly. Configure via `/etc/systemd/resolved.conf` with DNS servers, fallback servers, domain routing, DNSSEC, and DNS over TLS settings. Link `/etc/resolv.conf` to the systemd-resolved stub resolver at `/run/systemd/resolve/resolv.conf`.

### Split DNS

Route different domains through different DNS servers using `resolvectl domain` to associate specific domains with specific interfaces and DNS servers. This is useful for internal domains that need to resolve through corporate DNS while public domains use external DNS.

### DNS Debugging

Use `dig` for detailed DNS queries. `dig +trace` shows the full resolution path from root servers. `dig @server` queries a specific nameserver. `dig -x` performs reverse DNS lookups. Check TTL values to understand caching behavior. Use `resolvectl statistics` to see cache hit rates.

## Configuring a Multi-Homed Server

Real scenario: a server with two network interfaces on different subnets. eth0 connects to the production network (10.0.0.0/24) and eth1 connects to the management network (192.168.1.0/24). The server needs to be accessible from both networks with traffic going through the correct interface.

### The Challenge

By default, Linux uses a single default gateway which means traffic for the wrong network may try to exit the wrong interface. Multi-homing requires careful routing configuration.

### Step 1: Configure Interfaces

Set static IPs on both interfaces. The production interface gets the default gateway. The management interface gets no gateway. This ensures the default route goes through the production network.

### Step 2: Add Static Routes

Add routes for the management network through the management interface gateway using `nmcli connection modify` with `+ipv4.routes`. This tells the kernel to send traffic for 192.168.1.0/24 through the management gateway.

### Step 3: Configure Source-Based Routing

Create custom routing tables in `/etc/iproute2/rt_tables`, add routes to each table with `ip route add ... table`, and add rules to select the routing table based on source IP with `ip rule add from`. This ensures traffic originating from each IP goes out the correct interface regardless of the default route.

### Step 4: Firewall Rules

Ensure the server accepts traffic on both interfaces with appropriate rules for SSH from management and web traffic from production. Use `iptables` or `nftables` to filter traffic by source network.

### Step 5: Verify

Test connectivity from both networks, verify routing with `ip route get`, and check which interface traffic uses with `traceroute -i`. Document the complete configuration in a runbook.

## Practical Assessment

**Lab Task:** Multi-homed server configuration (55 minutes)

1. Configure a server with two network interfaces on different subnets
2. Set static IPs on both interfaces
3. Configure source-based routing so traffic exits the correct interface
4. Set up a VLAN on one interface
5. Create a bridge interface for a virtual network
6. Configure DNS with systemd-resolved including split DNS
7. Verify connectivity from both networks
8. Test that traffic routing is correct using traceroute
9. Set up a NIC bond for redundancy
10. Document the complete network configuration

**Grading criteria:** Both interfaces configured with correct IPs (10 points), static routes configured correctly (15 points), source-based routing working (20 points), VLAN created and functional (10 points), bridge interface working (10 points), DNS configured with split resolution (10 points), NIC bond operational (10 points), complete documentation (5 points).

## NetworkManager Advanced Features

### Connection Profiles

NetworkManager stores connection profiles in `/etc/NetworkManager/system-connections/`. Each profile is a `.nmconnection` file with sections for connection metadata, IPv4/IPv6 configuration, and physical interface settings. Use `nmcli connection show "name"` to see all settings. Use `nmcli connection modify` to change individual settings without editing files directly.

### Autoconnect and Priority

Connections with `autoconnect=yes` start automatically at boot. When multiple connections match the same interface, `autoconnect-priority` determines which wins. Higher numbers mean higher priority. This is useful for failover scenarios where a backup connection should only activate if the primary fails.

### Dispatcher Scripts

Create scripts in `/etc/NetworkManager/dispatcher.d/` that run when interfaces change state. Scripts receive environment variables: `DEVICE` (interface name), `ACTION` (up, down, dhcp4-change, dhcp6-change), and `CONNECTION_UUID`. Use these for custom routing, firewall rules, or service restarts on network changes.

## systemd-networkd Alternative

For servers that do not need NetworkManager's full feature set, systemd-networkd is a lighter alternative. Configure with `.network` files in `/etc/systemd/network/`. Each file matches interfaces by name or type and specifies addressing, routing, and DNS.

### systemd-networkd Configuration Example

```ini
# /etc/systemd/network/10-eth0.network
[Match]
Name=eth0

[Network]
Address=10.0.0.50/24
Gateway=10.0.0.1
DNS=8.8.8.8
DNS=8.8.4.4
```

Enable with `systemctl enable --now systemd-networkd`. Use `networkctl status` and `networkctl list` to inspect. systemd-networkd is lighter than NetworkManager but lacks dynamic features like Wi-Fi management and VPN integration.

## DNS Deep Dive

### DNS Record Types

Understanding DNS record types helps with troubleshooting and configuration. **A** records map names to IPv4 addresses. **AAAA** records map to IPv6. **CNAME** records create aliases. **MX** records specify mail servers. **TXT** records store arbitrary text (used for SPF, DKIM, domain verification). **SRV** records specify service locations. **PTR** records do reverse lookups.

### DNS Caching and TTL

DNS responses include a Time-To-Live (TTL) in seconds. Lower TTLs (300) mean faster propagation of changes but more DNS queries. Higher TTLs (86400) mean fewer queries but slower propagation. For critical services, use moderate TTLs (3600) for a balance.

### Debugging DNS Resolution

Use `dig` for detailed DNS analysis. `dig +trace example.com` shows the full resolution path from root servers. `dig @8.8.8.8 example.com` queries a specific server. `dig +short example.com` returns just the answer. `dig -x 10.0.0.50` does reverse lookup. `resolvectl statistics` shows cache hit rates and query counts.

## Network Security Best Practices

### Disable Unused Network Services

Audit listening services with `ss -tlnp`. Disable any service not needed for the server's function. Common unnecessary services include `rpcbind` (unless using NFS), `avahi-daemon` (mDNS for service discovery), and `cups` (printing).

### Network Segmentation

Use VLANs to separate traffic types. Common segments: production, management, backup, and monitoring. Each segment gets its own subnet and firewall rules. Management traffic should never be routable from production networks.

### Connection Tracking

Use `conntrack` to monitor active connections. `conntrack -L` lists all tracked connections. `conntrack -S` shows statistics. Tune `net.netfilter.nf_conntrack_max` for high-connection servers. Monitor `net.netfilter.nf_conntrack_count` to ensure you don't hit limits.

## Practical Assessment

**Lab Task:** Multi-homed server configuration (55 minutes)

1. Configure a server with two network interfaces on different subnets
2. Set static IPs on both interfaces
3. Configure source-based routing so traffic exits the correct interface
4. Set up a VLAN on one interface
5. Create a bridge interface for a virtual network
6. Configure DNS with systemd-resolved including split DNS
7. Verify connectivity from both networks
8. Test that traffic routing is correct using traceroute
9. Set up a NIC bond for redundancy
10. Document the complete network configuration

**Grading criteria:** Both interfaces configured with correct IPs (10 points), static routes configured correctly (15 points), source-based routing working (20 points), VLAN created and functional (10 points), bridge interface working (10 points), DNS configured with split resolution (10 points), NIC bond operational (10 points), complete documentation (5 points).

## Network Performance Tuning

### TCP Stack Optimization

Tune the TCP stack for high-throughput workloads. Key sysctl parameters: `net.core.rmem_max` and `net.core.wmem_max` for buffer sizes, `net.ipv4.tcp_rmem` and `net.ipv4.tcp_wmem` for TCP buffer auto-tuning, `net.core.netdev_max_backlog` for packet queuing, and `net.ipv4.tcp_mtu_probing` for path MTU discovery. For high-latency links, increase buffer sizes to allow more data in flight.

### Network Interface Tuning

Use `ethtool` to tune NIC settings: increase ring buffer size with `-G`, enable offloading features with `-K`, set interrupt coalescing with `-C`, and check/modify speed with `-s`. For 10GbE+ networks, ensure the driver and firmware are up to date.

### Monitoring Network Performance

Use `iperf3` for throughput testing between servers. Use `nload` or `iftop` for real-time bandwidth monitoring. Use `sar -n DEV` for historical network statistics. Monitor `netstat -s` for TCP retransmissions: high retransmission rates indicate network problems.

## Practical Assessment

**Lab Task:** Multi-homed server configuration (55 minutes)

1. Configure a server with two network interfaces on different subnets
2. Set static IPs on both interfaces
3. Configure source-based routing so traffic exits the correct interface
4. Set up a VLAN on one interface
5. Create a bridge interface for a virtual network
6. Configure DNS with systemd-resolved including split DNS
7. Verify connectivity from both networks
8. Test that traffic routing is correct using traceroute
9. Set up a NIC bond for redundancy
10. Document the complete network configuration

**Grading criteria:** Both interfaces configured with correct IPs (10 points), static routes configured correctly (15 points), source-based routing working (20 points), VLAN created and functional (10 points), bridge interface working (10 points), DNS configured with split resolution (10 points), NIC bond operational (10 points), complete documentation (5 points).

## Evidence

Collect the following for your portfolio: output of `ip addr show` showing all interfaces, output of `ip route show` and `ip rule show`, Netplan or NetworkManager configuration files, screenshot of successful connectivity tests from both networks, output of `resolvectl status` showing DNS configuration, network topology diagram showing the multi-homed setup, and documentation of the complete network configuration.
