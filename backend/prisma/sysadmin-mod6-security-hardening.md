# Module 6: Security Hardening

A Linux server connected to the internet is under constant attack. Automated bots scan for open ports, default credentials, and unpatched vulnerabilities every minute of every day. Security hardening is not about achieving perfect security. It is about reducing attack surface, making exploitation harder, and detecting when something goes wrong. This module covers practical hardening based on real-world requirements, including SSH hardening, firewall configuration, kernel hardening, file permission controls, and the specific steps needed for PCI compliance. You will learn to harden a server from a default installation to a security-audited configuration.

## CIS Benchmarks

The Center for Internet Security publishes hardening benchmarks for every major Linux distribution. These are detailed step-by-step guides covering hundreds of configuration changes. Rather than memorizing every setting, understand the categories and apply them systematically: initial setup including filesystem configuration and software updates, services including disabling unnecessary services, network configuration including firewall rules, logging and auditing, access control including user accounts and authentication, and system maintenance.

Download the relevant benchmark for your distribution from the CIS website. The benchmarks are organized by sections with specific steps, expected results, and automated remediation scripts. Apply them section by section, testing after each section to ensure nothing breaks.

Automated scanning tools validate compliance. Install OpenSCAP and the security guide for your distribution. Run scans against specific profiles like CIS or PCI-DSS. The scanner produces XML results and an HTML report showing compliant and non-compliant settings with remediation steps. Run scans regularly to catch configuration drift.

## SSH Hardening

SSH is the most targeted service on any Linux server. Every hardening guide starts here because SSH is the primary remote access method and a successful attack means full server control.

### Key-Based Authentication

Disable password authentication entirely in `/etc/ssh/sshd_config` by setting `PubkeyAuthentication yes`, `PasswordAuthentication no`, and `ChallengeResponseAuthentication no`. Generate ED25519 keys which are preferred over RSA because they are shorter, faster, and more secure. If you must use RSA, the minimum key size is 4096 bits. Never use DSA keys: they are deprecated and insecure.

Distribute public keys with `ssh-copy-id` which handles permissions and formatting correctly. Verify the key works before disabling password authentication. Test with `ssh -i ~/.ssh/id_ed25519 user@server` and confirm it connects without a password prompt.

### Restrict SSH Access

Change the default port from 22 to something else to reduce automated scanning noise. This is not security through obscurity: it significantly reduces log noise from bots. Disable root login with `PermitRootLogin no`. Limit authentication attempts with `MaxAuthTries 3`. Set login grace period with `LoginGraceTime 30`. Configure idle timeout with `ClientAliveInterval 300` and `ClientAliveCountMax 2` which disconnects after 10 minutes of inactivity.

Disable X11 forwarding, TCP forwarding, and agent forwarding unless specifically needed. Each forwarding type creates potential attack vectors. Restrict to specific address families with `AddressFamily inet` for IPv4 only or `AddressFamily inet6` for IPv6 only. Set log level to `VERBOSE` for detailed logging that helps with incident investigation.

Always validate the configuration with `sshd -t` before restarting sshd. A syntax error in sshd_config can lock you out of the server.

### Fail2ban

Fail2ban monitors log files for repeated failed login attempts and temporarily bans offending IPs. Install it, configure `jail.local` with `bantime`, `findtime`, and `maxretry` settings, enable specific jails for SSH and other services, and enable the service. Check status with `fail2ban-client status` and banned IPs with `fail2ban-client banned`. Manually unban IPs when needed for legitimate users who triggered the ban.

The default configuration monitors SSH but you can add jails for any service by creating filter files that match log patterns. For example, a filter for nginx authentication failures that matches "invalid user" in the access log.

### SSH Audit

Check your SSH configuration against security guidelines with `ssh-audit`. This shows supported key exchange algorithms, host key algorithms, ciphers, and MACs. Remove weak algorithms by specifying only strong ones in `KexAlgorithms`, `Ciphers`, `MACs`, and `HostKeyAlgorithms`. The audit tool rates your configuration and suggests improvements.

## Firewall Configuration

A firewall is your first line of defense. Configure it to allow only what is needed. The principle is deny by default, allow specific traffic.

### nftables (Modern)

nftables is the successor to iptables on modern systems. Create a table, add chains with hook points and default policies, and add rules to the chains. The typical setup has a `filter` table with `input`, `forward`, and `output` chains. Set input and forward policies to `drop` and output to `accept`.

Add rules to allow established connections with `ct state established,related accept`, loopback traffic with `iif lo accept`, SSH on your custom port, HTTP/HTTPS, and ICMP. Save the ruleset to `/etc/nftables.conf` and enable the `nftables` service.

Use rate limiting for SSH: `tcp dport 22 ct state new limit rate 3/minute accept` prevents brute force by limiting new connections to 3 per minute per IP.

### iptables (Legacy)

Still widely used on older systems. Set default policies to `drop`, allow established connections with `-m conntrack --ctstate ESTABLISHED,RELATED`, allow loopback, and add rules for specific services. Log dropped packets for debugging with `--log-prefix "IPTables-Dropped: "`.

Save rules with `service iptables save` on RHEL/CentOS or install `iptables-persistent` on Debian/Ubuntu. The persistence package automatically loads rules on boot.

### Firewalld (RHEL/CentOS)

Firewalld is a dynamic firewall manager that uses zones. Add services and ports with `firewall-cmd` using the `--permanent` flag, then reload. List all rules for a zone. Firewalld provides a higher-level interface than raw iptables commands and is the default on RHEL/CentOS 7+.

## Kernel Hardening with sysctl

Create a security-focused sysctl configuration in `/etc/sysctl.d/99-security.conf` with settings to disable IP forwarding and source routing (unless the server is a router), disable ICMP redirects, enable SYN flood protection with `tcp_syncookies`, log suspicious packets with `log_martians`, ignore ICMP broadcast requests, enable reverse path filtering for anti-spoofing with `rp_filter`, restrict dmesg access, restrict kernel pointer exposure, restrict ptrace scope, enable full ASLR randomization with `randomize_va_space=2`, disable SysRq key, restrict core dumps with `suid_dumpable=0`, disable unprivileged BPF, and disable unprivileged user namespaces unless using containers.

Apply the configuration with `sysctl -p /etc/sysctl.d/99-security.conf` and verify with `sysctl -a | grep` for specific parameters. Test that the system still works after hardening: some applications may require specific kernel settings.

## File Permissions

### umask

The default file creation mask determines permissions for new files. Set a restrictive umask of `027` for servers which creates files with 640 (rw-r-----) and directories with 750 (rwxr-x---). Make it persistent in `/etc/profile` or `/etc/login.defs`.

### File Permission Audit

Find dangerous permissions: world-writable files with `find / -xdev -type f -perm -0002 -ls`, SUID files that could allow privilege escalation with `find / -xdev -type f -perm -4000 -ls`, SGID files with `perm -2000`, files owned by nobody, and unowned files. Remove SUID from binaries that do not need it and use capabilities instead for specific privileges.

Review the SUID binaries carefully. Some are necessary (like `sudo`, `passwd`, `su`) but others may be exploitable. Remove SUID from programs like `mount`, `umount`, and `ping` if you can use capabilities or alternatives.

### Access Control Lists (ACLs)

ACLs provide fine-grained permission control beyond traditional Unix permissions. Grant specific users or groups access with `setfacl -m u:alice:r`, set default ACLs for inheritance on new files with `setfacl -d -m g:developers:rw`, view ACLs with `getfacl`, and remove with `setfacl -x` or `-b`. ACLs are stored on the filesystem as extended attributes and require filesystem support (ext4, XFS, Btrfs all support them).

## PCI DSS Compliance

PCI DSS applies to any system that processes, stores, or transmits cardholder data. The key technical requirements are: install and maintain a firewall between cardholder data and untrusted networks with all rules documented; change all vendor defaults and disable unnecessary services; protect stored data with minimum retention and encryption; use TLS 1.2 or higher for all transmissions and disable SSL and older TLS versions; develop secure systems and install security patches within one month; restrict access by business need-to-know with role-based access control; identify and authenticate users with unique IDs, disable inactive accounts after 90 days, and lock out after failed attempts; restrict physical access; implement audit trails with synchronized time sources using NTP; test security systems regularly with vulnerability scans; and maintain and review security policies annually.

### Automated Compliance Scanning

Use OpenSCAP with the PCI-DSS profile to scan for compliance. The scan produces results and a report showing compliant and non-compliant settings. Use Lynis for general security auditing which outputs a hardening index and specific recommendations. Address findings systematically, prioritizing critical vulnerabilities first.

### Audit Logging

Enable comprehensive audit logging with the `auditd` daemon. Configure rules in `/etc/audit/rules.d/` to track authentication events, file access, privilege escalation, and configuration changes. Monitor audit logs with `ausearch` and `aureport`. Forward audit logs to a central log server for retention and analysis. PCI DSS requires audit trail history for at least one year with at least three months immediately available.

## Practical Assessment

**Lab Task:** Server hardening for PCI compliance (60 minutes)

1. Harden SSH: change port, disable password auth, restrict to key-based auth only, configure fail2ban
2. Configure nftables or iptables firewall with default-deny policy
3. Apply kernel hardening via sysctl
4. Audit file permissions: find and fix SUID/SGID, world-writable files
5. Set umask to 027 for new users
6. Configure auditd to log authentication events
7. Run an OpenSCAP or Lynis scan and document findings
8. Create a compliance report showing before/after state
9. Document all changes in a hardening runbook
10. Verify the system remains functional after hardening

**Grading criteria:** SSH hardened with key-only auth and fail2ban (15 points), firewall configured with default-deny and only required ports open (20 points), kernel sysctl hardening applied (10 points), file permission audit completed and dangerous permissions fixed (10 points), audit logging configured and working (10 points), compliance scan completed with documented findings (15 points), system remains functional after hardening (10 points), complete hardening runbook (10 points).

## Security Monitoring and Incident Detection

### Log-Based Detection

Monitor authentication logs for brute force attempts: `journalctl -u sshd | grep "Failed password" | awk '{print $11}' | sort | uniq -c | sort -rn`. Set up alerts for repeated failures from the same IP. Monitor for privilege escalation: `journalctl | grep "sudo:" | grep "COMMAND"`. Watch for unauthorized SSH key additions: `ausearch -k ssh_authorized_keys`.

### File Integrity Monitoring

Use AIDE (Advanced Intrusion Detection Environment) or Tripwire to monitor file changes. Install AIDE, initialize the database with `aide --init`, move the database to the correct location, and schedule regular checks with `aide --check`. AIDE compares current file states against the baseline and reports changes to system binaries, configuration files, and permissions.

### Network Monitoring

Monitor for unexpected outbound connections: `ss -tlnp` for listening ports, `ss -tnp` for established connections. Use `tcpdump` for packet capture during incident investigation. Set up alerts for connections to known malicious IPs using threat intelligence feeds.

### User Activity Monitoring

Track user logins: `last`, `lastb` for failed logins, `lastlog` for last login per user. Monitor sudo usage: `journalctl | grep sudo`. Track cron job execution: `journalctl -u crond`. Review open files with suspicious users: `lsof -u username`.

## Security Hardening Checklist

Use this checklist for systematic hardening. Mark each item as you complete it.

### System-Level
- [ ] Disable unused services (`systemctl disable --now service-name`)
- [ ] Remove unnecessary packages (`dnf remove package-name`)
- [ ] Enable automatic security updates (`dnf install dnf-automatic`)
- [ ] Configure NTP for time synchronization
- [ ] Set proper umask (027 or 077)
- [ ] Enable SELinux or AppArmor

### Network-Level
- [ ] Configure firewall with default-deny policy
- [ ] Close all unnecessary ports
- [ ] Disable ICMP redirects
- [ ] Enable reverse path filtering
- [ ] Disable IP forwarding (unless router)
- [ ] Configure SYN flood protection

### Authentication
- [ ] Disable password authentication for SSH
- [ ] Configure key-based SSH authentication
- [ ] Set up fail2ban
- [ ] Enforce password complexity (PAM pwquality)
- [ ] Configure account lockout (PAM faillock)
- [ ] Set password expiration policies

### File System
- [ ] Audit SUID/SGID binaries
- [ ] Remove world-writable permissions
- [ ] Set proper /tmp and /var/tmp mount options (noexec, nosuid)
- [ ] Configure disk space quotas
- [ ] Enable file integrity monitoring

### Logging
- [ ] Enable persistent journal storage
- [ ] Configure remote syslog forwarding
- [ ] Set up auditd with appropriate rules
- [ ] Configure log rotation
- [ ] Enable log forwarding to SIEM

## Practical Assessment

**Lab Task:** Server hardening for PCI compliance (60 minutes)

1. Harden SSH: change port, disable password auth, restrict to key-based auth only, configure fail2ban
2. Configure nftables or iptables firewall with default-deny policy
3. Apply kernel hardening via sysctl
4. Audit file permissions: find and fix SUID/SGID, world-writable files
5. Set umask to 027 for new users
6. Configure auditd to log authentication events
7. Run an OpenSCAP or Lynis scan and document findings
8. Create a compliance report showing before/after state
9. Document all changes in a hardening runbook
10. Verify the system remains functional after hardening

**Grading criteria:** SSH hardened with key-only auth and fail2ban (15 points), firewall configured with default-deny and only required ports open (20 points), kernel sysctl hardening applied (10 points), file permission audit completed and dangerous permissions fixed (10 points), audit logging configured and working (10 points), compliance scan completed with documented findings (15 points), system remains functional after hardening (10 points), complete hardening runbook (10 points).

## Advanced Firewall Configuration

### Stateful Firewall Rules

Use connection tracking to allow only established connections. This prevents unsolicited inbound traffic while allowing outbound-initiated connections. Configure with `ct state established,related accept` in nftables or `-m conntrack --ctstate ESTABLISHED,RELATED` in iptables.

### Rate Limiting

Implement rate limiting for services prone to abuse. For SSH: limit new connections to 3 per minute per IP. For HTTP: limit requests per IP to prevent DDoS. Use nft limit expression or iptables recent module.

### GeoIP Blocking

Block traffic from specific countries using GeoIP data. This is useful for servers that only serve local customers. Use `xt_geoip` module for iptables or nftables with geoip modules.

### Application-Layer Filtering

Use web application firewalls (ModSecurity, naxsi) for HTTP traffic. These inspect request content and block SQL injection, XSS, and other application attacks. Deploy as nginx/Apache modules.

## Practical Assessment

**Lab Task:** Server hardening for PCI compliance (60 minutes)

1. Harden SSH: change port, disable password auth, restrict to key-based auth only, configure fail2ban
2. Configure nftables or iptables firewall with default-deny policy
3. Apply kernel hardening via sysctl
4. Audit file permissions: find and fix SUID/SGID, world-writable files
5. Set umask to 027 for new users
6. Configure auditd to log authentication events
7. Run an OpenSCAP or Lynis scan and document findings
8. Create a compliance report showing before/after state
9. Document all changes in a hardening runbook
10. Verify the system remains functional after hardening

**Grading criteria:** SSH hardened with key-only auth and fail2ban (15 points), firewall configured with default-deny and only required ports open (20 points), kernel sysctl hardening applied (10 points), file permission audit completed and dangerous permissions fixed (10 points), audit logging configured and working (10 points), compliance scan completed with documented findings (15 points), system remains functional after hardening (10 points), complete hardening runbook (10 points).

## Evidence

Collect the following for your portfolio: hardened SSH configuration (`/etc/ssh/sshd_config`), firewall ruleset documentation, output of `sysctl -a` showing security parameters, screenshot of Lynis or OpenSCAP compliance scan results, file permission audit results, auditd configuration and sample logs, and complete hardening runbook with before/after comparison.
