import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashAnswer(answer: string): Promise<string> {
  return bcrypt.hash(answer.trim().toLowerCase(), SALT_ROUNDS);
}

function encryptCredentials(credentials: any[], key: string): string {
  const crypto = require('crypto');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(key, key, 32), iv);
  let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export async function seedLinuxLabs(key: string) {
  console.log('Seeding Linux labs...');

  const labs = [
    // ═══════════════════════════════════════════
    // TIER 1: BEGINNER — Linux Fundamentals
    // ═══════════════════════════════════════════
    {
      title: 'Linux Fundamentals: Ubuntu CLI Mastery',
      description: 'Master the Ubuntu command line from zero. Navigate the filesystem, manage files, understand permissions, and run basic system commands.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 800,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Welcome to Linux
This lab provides a fresh Ubuntu 22.04 environment. You will learn the essential commands that every Linux user must know.

### Getting Started
- Open the terminal
- You are logged in as \`student\` with password \`lab123\`
- Explore the filesystem using the commands you've learned

### Objectives
Complete each task below by running the correct commands in the terminal.`,
      tasks: [
        'Navigate to the /etc directory and list its contents',
        'Create a directory called "myproject" in your home directory',
        'Create a file called "hello.txt" with the content "Hello XpertClass"',
        'Copy hello.txt to /tmp/hello_backup.txt',
        'Find all files in /etc that end with ".conf"',
        'Display the current username, hostname, and current directory',
        'List all running processes with "ps aux"',
        'Check the disk usage of the / partition using "df -h"',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'Filesystem Navigator', description: 'Navigate to /var/log and run: cat /etc/hostname. Submit the hostname.', correctAnswer: 'aero-lab-ubuntu', points: 100 },
        { title: 'File Creator', description: 'Create /home/student/proof.txt with content "AERO{UBUNTU_FILE_CREATE}". Submit the flag.', correctAnswer: 'AERO{UBUNTU_FILE_CREATE}', points: 150 },
        { title: 'Permission Reader', description: 'Run: ls -la /etc/shadow. What user owns this file?', correctAnswer: 'root', points: 100 },
        { title: 'Process Inspector', description: 'Run: ps aux | grep sshd. What is the PID of the sshd process?', correctAnswer: '1', points: 150 },
        { title: 'Disk Space Expert', description: 'Run: df -h / | tail -1. What is the total size of the root partition?', correctAnswer: '7.8G', points: 200 },
      ],
    },
    {
      title: 'Linux Fundamentals: File Permissions & Users',
      description: 'Deep-dive into Linux permissions, user management, groups, and access control lists. Understand chmod, chown, and the permission model.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 900,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Mastering Linux Permissions
Linux security starts with understanding its permission model. Every file and directory has an owner, a group, and a set of permissions.

### Lab Environment
- Ubuntu 22.04 with pre-created test files
- You are logged in as \`student\` (password: lab123)
- Some files require root access to modify

### Permission Format
\`\`\`
-rwxr-xr-- 1 root staff 4096 Jan 1 00:00 filename
|rwx|r-x|r--|
|own|grp|oth|
\`\`\``,
      tasks: [
        'Change the permissions of /home/student/hello.txt to read-write for owner only (chmod 600)',
        'Create a new group called "developers" and add the student user to it',
        'Create a new user "alice" and set her password',
        'Set the setuid bit on /usr/bin/passwd and verify it',
        'Create a file owned by root in /tmp with sticky bit permissions',
        'Use setfacl to give user alice read access to /home/student/hello.txt',
        'Find all files in /home that are world-writable',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'chmod Master', description: 'Create /home/student/secret.txt, set permissions to 700, then run: stat -c "%a" /home/student/secret.txt. Submit the result.', correctAnswer: '700', points: 100 },
        { title: 'Group Manager', description: 'Create group "admin_group", add student to it, run: groups student. Submit the groups listed.', correctAnswer: 'student admin_group', points: 150 },
        { title: 'User Creator', description: 'Create user "bob" with home directory, run: id bob. Submit bob\'s primary group ID number.', correctAnswer: '1001', points: 200 },
        { title: 'Sticky Bit Expert', description: 'Create /tmp/shared with sticky bit, run: stat -c "%a" /tmp/shared. Submit the permission number.', correctAnswer: '1777', points: 200 },
        { title: 'ACL Master', description: 'Set ACL on /home/student/hello.txt for alice, then run: getfacl /home/student/hello.txt | grep alice. Submit the permission string.', correctAnswer: 'r--', points: 250 },
      ],
    },
    {
      title: 'Linux Fundamentals: Text Processing & Shell Scripting',
      description: 'Master grep, sed, awk, and write your first shell scripts. Process log files and automate repetitive tasks.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1000,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### The Text Processing Powerhouse
Linux is built on text. Mastering text processing tools is the key to becoming efficient.

### Lab Environment
- Ubuntu 22.04 with pre-generated log files
- You are logged in as \`student\` (password: lab123)
- Sample data is in /home/student/data/

### Key Tools
- \`grep\` — Search text with regex
- \`sed\` — Stream editor (find & replace)
- \`awk\` — Pattern scanning and processing
- \`cut\`, \`sort\`, \`uniq\`, \`wc\` — Text manipulation`,
      tasks: [
        'Use grep to find all error messages in /var/log/syslog',
        'Use sed to replace "ERROR" with "CRITICAL" in a sample file',
        'Use awk to print the 3rd column of a CSV file',
        'Write a bash script that counts the number of users in /etc/passwd',
        'Use grep -r to search for the word "password" in /etc/',
        'Sort a list of numbers and remove duplicates using sort and uniq',
        'Use cut to extract usernames from /etc/passwd (first field)',
        'Write a script that monitors disk usage and alerts if > 80%',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'grep Guru', description: 'Run: grep -c "sshd" /var/log/syslog. Submit the count of SSHD entries.', correctAnswer: '0', points: 100 },
        { title: 'sed Specialist', description: 'Run: echo "Hello World" | sed "s/World/XpertClass/". Submit the output.', correctAnswer: 'Hello XpertClass', points: 100 },
        { title: 'awk Architect', description: 'Run: awk -F: "{print $1}" /etc/passwd | head -3. Submit the first 3 usernames.', correctAnswer: 'root daemon bin', points: 150 },
        { title: 'Script Writer', description: 'Create /home/student/count_users.sh that outputs the number of users. Run it and submit the count.', correctAnswer: '35', points: 200 },
        { title: 'Pipeline Master', description: 'Run: cat /etc/passwd | cut -d: -f1 | sort | head -5. Submit the first 5 sorted usernames.', correctAnswer: 'bin daemon games gnats irc', points: 200 },
      ],
    },
    {
      title: 'Linux Fundamentals: Process & Service Management',
      description: 'Control processes with ps, top, kill, and nohup. Manage systemd services, set up cron jobs, and understand runlevels.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1100,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Process & Service Control
Every running program is a process. Learning to manage them is critical for system administration.

### Lab Environment
- Ubuntu 22.04 with systemd
- You are logged in as \`student\` (password: lab123)
- Use \`sudo\` for system-level operations

### Key Concepts
- **PID**: Process ID — unique identifier for each process
- **PPID**: Parent Process ID
- **SIGTERM vs SIGKILL**: Graceful vs forced termination
- **systemd**: Modern init system and service manager
- **cron**: Time-based job scheduler`,
      tasks: [
        'Find the PID of the sshd service and display its process tree',
        'Start a background process with nohup and verify it survives logout',
        'Kill a process gracefully using SIGTERM, then forcefully with SIGKILL',
        'Create a systemd service file for a custom script',
        'Set up a cron job that runs every 5 minutes',
        'Use systemctl to start, stop, enable, and check the status of sshd',
        'View system logs using journalctl for the sshd service',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'Process Hunter', description: 'Run: pgrep -a sshd | head -1. Submit the full command line of sshd.', correctAnswer: '/usr/sbin/sshd -D', points: 100 },
        { title: 'Systemd Master', description: 'Run: systemctl is-active sshd. Submit the status.', correctAnswer: 'active', points: 100 },
        { title: 'Cron Crafter', description: 'Create a cron job that runs "echo cron_ok > /tmp/cron_proof" every minute. Wait and submit the file content.', correctAnswer: 'cron_ok', points: 200 },
        { title: 'Signal Handler', description: 'Send SIGTERM to process PID 1, then check: echo $? after the signal command. What is the exit code?', correctAnswer: '0', points: 250 },
        { title: 'Service Architect', description: 'Create /etc/systemd/system/test.service, enable it, run: systemctl is-enabled test.service. Submit the result.', correctAnswer: 'enabled', points: 300 },
      ],
    },

    // ═══════════════════════════════════════════
    // TIER 2: INTERMEDIATE — Server Administration
    // ═══════════════════════════════════════════
    {
      title: 'Server Administration: Debian Server Hardening',
      description: 'Harden a Debian server: SSH configuration, firewall setup, user auditing, file integrity monitoring, and fail2ban deployment.',
      dockerImage: 'debian:12',
      difficulty: 1200,
      imageUrl: '/images/labs/debian.png',
      briefing: `### Server Hardening Mission
A default Debian installation is NOT secure. Your mission is to apply industry-standard hardening.

### Lab Environment
- Debian 12 (Bookworm) with SSH access
- You are logged in as \`root\` (password: lab123)
- Services: sshd, cron, rsyslog

### Hardening Checklist
1. SSH: Disable root login, change port, use key-only auth
2. Firewall: Configure iptables/nftables
3. Users: Audit accounts, enforce password policies
4. Monitoring: Set up log monitoring and intrusion detection`,
      tasks: [
        'Disable root SSH login by editing /etc/ssh/sshd_config',
        'Change the SSH port from 22 to 2222',
        'Install and configure fail2ban to protect SSH',
        'Create a basic iptables firewall ruleset (allow SSH, HTTP, HTTPS only)',
        'Audit /etc/passwd for users with UID 0 (root-level access)',
        'Set password expiry for all users to 90 days',
        'Install and configure AIDE for file integrity monitoring',
        'Review and restrict sudo access via /etc/sudoers',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'root', password: 'lab123' }], key),
      flags: [
        { title: 'SSH Hardened', description: 'After editing sshd_config, run: grep "^Port" /etc/ssh/sshd_config. Submit the new port.', correctAnswer: '2222', points: 150 },
        { title: 'Firewall Active', description: 'Create iptables rules allowing only SSH+HTTP+HTTPS, run: iptables -L -n | grep -c ACCEPT. Submit the count.', correctAnswer: '6', points: 200 },
        { title: 'fail2ban Guard', description: 'Install fail2ban, configure SSH jail, run: fail2ban-client status sshd. Submit the number of currently banned IPs.', correctAnswer: '0', points: 200 },
        { title: 'Root Auditor', description: 'Run: awk -F: "$3==0" /etc/passwd. How many accounts have UID 0?', correctAnswer: '1', points: 150 },
        { title: 'AIDE Watcher', description: 'Install AIDE, initialize database, run: aide --check. Submit the first line of output.', correctAnswer: 'AIDE found NO differences', points: 300 },
      ],
    },
    {
      title: 'Server Administration: CentOS/RHEL Management',
      description: 'Master CentOS/RHEL administration: yum/dnf, SELinux, systemd, firewall-cmd, and enterprise package management.',
      dockerImage: 'quay.io/centos/centos:stream9',
      difficulty: 1250,
      imageUrl: '/images/labs/centos.png',
      briefing: `### Enterprise Linux Administration
CentOS Stream 9 is an upstream development platform for RHEL. Master its unique tools.

### Lab Environment
- CentOS Stream 9
- You are logged in as \`root\` (password: lab123)
- Key differences from Ubuntu: yum/dnf, SELinux, firewalld

### Enterprise Features
- **SELinux**: Mandatory Access Control
- **firewalld**: Zone-based firewall management
- **dnf**: Next-generation package manager
- **systemd**: Service and target management`,
      tasks: [
        'Install nginx using dnf and verify it is running',
        'Configure SELinux to allow nginx to serve custom content',
        'Use firewall-cmd to open ports 80 and 443 permanently',
        'Create a custom systemd unit file for a Python web application',
        'Configure yum/dnf repository for EPEL packages',
        'Set up log rotation for a custom application',
        'Use systemctl to manage multi-user and graphical targets',
        'Audit SELinux denials using ausearch and audit2why',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'root', password: 'lab123' }], key),
      flags: [
        { title: 'SELinux Master', description: 'Run: getenforce. Submit the current SELinux mode.', correctAnswer: 'Enforcing', points: 150 },
        { title: 'Firewall Commander', description: 'Run: firewall-cmd --list-ports. Submit the list of open ports.', correctAnswer: '80/tcp 443/tcp', points: 200 },
        { title: 'Package Expert', description: 'Run: dnf list installed | grep nginx. Submit the version number installed.', correctAnswer: '1.22.1', points: 150 },
        { title: 'Systemd Architect', description: 'Create a systemd unit, enable it, run: systemctl list-unit-files | grep myapp. Submit the status.', correctAnswer: 'enabled', points: 250 },
        { title: 'SELinux Auditor', description: 'Run: ausearch -m AVC --start recent 2>/dev/null | head -1. Submit the output or "no denials".', correctAnswer: 'no denials', points: 300 },
      ],
    },
    {
      title: 'Server Administration: Web Servers & Nginx Mastery',
      description: 'Deploy and configure nginx from scratch. Virtual hosts, SSL/TLS, reverse proxying, load balancing, and performance tuning.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1300,
      imageUrl: '/images/labs/nginx.png',
      briefing: `### Nginx Web Server Mastery
Nginx is the world's most popular web server. Master its configuration and architecture.

### Lab Environment
- Ubuntu 22.04 with nginx pre-installed
- You are logged in as \`student\` (password: lab123)
- SSL certificates are available in /etc/ssl/

### Nginx Architecture
- **Master Process**: Reads config, manages workers
- **Worker Processes**: Handle actual connections
- **Events**: epoll (Linux), kqueue (BSD)
- **Modules**: http, stream, mail`,
      tasks: [
        'Create a virtual host serving a custom HTML page on port 8080',
        'Configure SSL/TLS with a self-signed certificate',
        'Set up a reverse proxy to forward /api to a backend on port 3000',
        'Configure load balancing across 3 upstream servers',
        'Enable gzip compression for text/html and application/json',
        'Set up access logging with custom log format',
        'Configure rate limiting: 10 requests/second per IP',
        'Set up a location block to serve static files from /var/www/static',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'Vhost Builder', description: 'Create a server block on port 8080, create /var/www/vhost/index.html with "AERO{NGINX_VHOST}". Curl localhost:8080 and submit the content.', correctAnswer: 'AERO{NGINX_VHOST}', points: 150 },
        { title: 'SSL Engineer', description: 'Generate self-signed cert, configure HTTPS, run: curl -k https://localhost. Submit the HTTP status code.', correctAnswer: '200', points: 200 },
        { title: 'Reverse Proxy Pro', description: 'Configure proxy_pass to port 3000, run: nginx -t. Submit "test is successful" or the error.', correctAnswer: 'test is successful', points: 200 },
        { title: 'Load Balancer', description: 'Configure upstream with 3 servers, run: nginx -T | grep upstream. Submit the number of server entries.', correctAnswer: '3', points: 250 },
        { title: 'Rate Limiter', description: 'Add rate limiting zone, run: nginx -T | grep limit_req_zone. Submit the zone name.', correctAnswer: 'one', points: 300 },
      ],
    },
    {
      title: 'Server Administration: Storage & Filesystems',
      description: 'Manage Linux storage: LVM, RAID, NFS, ext4, XFS, disk partitioning, swap, and backup strategies.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1350,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Storage Management Deep Dive
Linux storage is flexible and powerful. Master LVM, RAID, and filesystem management.

### Lab Environment
- Ubuntu 22.04 with multiple virtual disks attached
- You are logged in as \`student\` (password: lab123)
- Available disks: /dev/sdb (2GB), /dev/sdc (2GB)

### Storage Stack
\`\`\`
Applications → Filesystem → LVM → Physical Disks
\`\`\``,
      tasks: [
        'Partition /dev/sdb using fdisk with 2 primary partitions',
        'Create a Physical Volume (PV) on /dev/sdb1',
        'Create a Volume Group (VG) named "data_vg" from the PV',
        'Create a 500MB Logical Volume (LV) named "projects"',
        'Format the LV with ext4 and mount it at /mnt/projects',
        'Create a RAID 1 mirror from /dev/sdb2 and /dev/sdc1',
        'Set up NFS share and export it to localhost',
        'Configure automatic mounting via /etc/fstab',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'PV Creator', description: 'Run: pvdisplay | grep "PV Name". Submit the PV name.', correctAnswer: '/dev/sdb1', points: 150 },
        { title: 'VG Master', description: 'Run: vgdisplay data_vg | grep "VG Size". Submit the VG size.', correctAnswer: '2.00 GiB', points: 200 },
        { title: 'LV Engineer', description: 'Run: lvdisplay /dev/data_vg/projects | grep "LV Size". Submit the LV size.', correctAnswer: '500.00 MiB', points: 200 },
        { title: 'FS Expert', description: 'Run: mount | grep /mnt/projects. Submit the filesystem type.', correctAnswer: 'ext4', points: 150 },
        { title: 'RAID Builder', description: 'Create RAID 1, run: cat /proc/mdstat | head -3. Submit the RAID level.', correctAnswer: 'raid1', points: 300 },
      ],
    },

    // ═══════════════════════════════════════════
    // TIER 3: ADVANCED — Kernel, Containers, Git
    // ═══════════════════════════════════════════
    {
      title: 'Linux Kernel & System Internals',
      description: 'Understand kernel architecture, modules, system calls, /proc and /sys, kernel parameters, and performance tuning.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1500,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Kernel Deep Dive
The kernel is the heart of Linux. Understanding it separates admins from engineers.

### Lab Environment
- Ubuntu 22.04 with kernel headers available
- You are logged in as \`student\` (password: lab123)
- Root access via sudo

### Key Concepts
- **Kernel Space vs User Space**
- **System Calls**: The API between user programs and kernel
- **/proc**: Virtual filesystem exposing kernel data
- **/sys**: Device and driver information
- **Kernel Modules**: Loadable kernel code`,
      tasks: [
        'Display the current kernel version and architecture',
        'List all loaded kernel modules with lsmod',
        'Load a kernel module (e.g., test_module or loop)',
        'Read /proc/cpuinfo and identify the number of CPU cores',
        'Tune a kernel parameter using sysctl (e.g., net.ipv4.ip_forward)',
        'View /proc/interrupts and identify the interrupt handler for CPU0',
        'Write a kernel module that prints "Hello Kernel" on load (if headers available)',
        'Analyze /proc/meminfo and calculate total available memory in MB',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'Kernel Identifier', description: 'Run: uname -r. Submit the kernel version.', correctAnswer: '5.15.0-78-generic', points: 100 },
        { title: 'Module Inspector', description: 'Run: lsmod | wc -l. Submit the number of loaded modules.', correctAnswer: '15', points: 150 },
        { title: 'Sysctl Tuner', description: 'Run: sysctl net.ipv4.ip_forward. Submit the current value.', correctAnswer: '0', points: 200 },
        { title: 'Proc Reader', description: 'Run: grep "model name" /proc/cpuinfo | head -1. Submit the CPU model.', correctAnswer: 'Intel(R) Core(TM) i7', points: 200 },
        { title: 'Memory Analyst', description: 'Run: awk "/MemTotal/ {print int($2/1024)}" /proc/meminfo. Submit total RAM in MB.', correctAnswer: '2048', points: 250 },
      ],
    },
    {
      title: 'Docker & Container Fundamentals',
      description: 'Master Docker: images, containers, volumes, networks, Dockerfiles, and container orchestration basics.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1400,
      imageUrl: '/images/labs/docker.png',
      briefing: `### Container Mastery
Containers are the foundation of modern infrastructure. Learn Docker from the ground up.

### Lab Environment
- Ubuntu 22.04 with Docker pre-installed
- You are logged in as \`student\` (password: lab123)
- Docker is running and accessible

### Container Architecture
\`\`\`
Application → Container Runtime → Linux Kernel (namespaces + cgroups)
\`\`\``,
      tasks: [
        'Pull the nginx:alpine image and run a container on port 8080',
        'Create a Dockerfile for a simple Node.js application',
        'Build the Docker image and tag it as myapp:latest',
        'Create a Docker volume and mount it to a container',
        'Create a Docker bridge network and connect two containers',
        'Use docker exec to run commands inside a running container',
        'Inspect container logs and resource usage',
        'Write a docker-compose.yml for a 3-tier app (frontend, api, database)',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'Container Runner', description: 'Run: docker ps --format "{{.Names}}" | head -1. Submit the container name.', correctAnswer: 'web-server', points: 150 },
        { title: 'Dockerfile Author', description: 'Create a valid Dockerfile, run: docker build -t myapp . 2>&1 | tail -1. Submit the last line.', correctAnswer: 'Successfully tagged myapp:latest', points: 200 },
        { title: 'Volume Master', description: 'Create volume, mount it, run: docker volume ls | grep data. Submit the volume name.', correctAnswer: 'data-vol', points: 200 },
        { title: 'Network Engineer', description: 'Create bridge network "app-net", run: docker network ls | grep app-net. Submit the driver.', correctAnswer: 'bridge', points: 250 },
        { title: 'Compose Architect', description: 'Create docker-compose.yml with 3 services, run: docker compose config --services | wc -l. Submit the count.', correctAnswer: '3', points: 300 },
      ],
    },
    {
      title: 'Git & Gitea: Self-Hosted Version Control',
      description: 'Master Git operations and deploy your own Gitea server. Branching, merging, rebasing, CI/CD hooks, and repository management.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1450,
      imageUrl: '/images/labs/gitea.png',
      briefing: `### Self-Hosted Git with Gitea
Gitea is a lightweight, self-hosted Git service. Deploy it and master version control.

### Lab Environment
- Ubuntu 22.04 with Docker installed
- You are logged in as \`student\` (password: lab123)
- Gitea will be deployed on port 3000

### Git Workflow
\`\`\`
Working Directory → Staging Area → Local Repository → Remote Repository
\`\`\``,
      tasks: [
        'Deploy Gitea using Docker with persistent storage',
        'Initialize the Gitea database (SQLite for simplicity)',
        'Create an admin account and a new repository',
        'Clone the repository, create a feature branch, and make commits',
        'Resolve a merge conflict between two branches',
        'Set up a Git hook that runs a test script on push',
        'Use git rebase to clean up commit history',
        'Configure branch protection rules for the main branch',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }, { service: 'Gitea', username: 'admin', password: 'gitea123' }], key),
      flags: [
        { title: 'Gitea Deployer', description: 'Deploy Gitea, run: docker ps | grep gitea. Submit the container status.', correctAnswer: 'Up', points: 150 },
        { title: 'Repo Creator', description: 'Create a repo "test-project", run: ls -la /data/gitea/repositories/admin/. Submit the directory listing.', correctAnswer: 'test-project.git', points: 200 },
        { title: 'Branch Master', description: 'Create branch "feature/login", make a commit, run: git branch. Submit the branch names.', correctAnswer: 'feature/login main', points: 200 },
        { title: 'Conflict Resolver', description: 'Create and resolve a merge conflict, run: git log --oneline | wc -l. Submit the commit count.', correctAnswer: '4', points: 250 },
        { title: 'Hook Engineer', description: 'Add a pre-push hook, push to remote, check /tmp/hook_log.txt. Submit its content.', correctAnswer: 'pre-push-executed', points: 300 },
      ],
    },

    // ═══════════════════════════════════════════
    // TIER 4: SECURITY — Kali, Parrot, Pen Testing
    // ═══════════════════════════════════════════
    {
      title: 'Kali Linux: Reconnaissance & OSINT',
      description: 'Master Kali Linux tools for information gathering: Nmap, Whois, theHarvester, Recon-ng, and OSINT techniques.',
      dockerImage: 'kalilinux/kali-rolling',
      difficulty: 1500,
      imageUrl: '/images/labs/kali.png',
      briefing: `### Reconnaissance Mission
Intelligence gathering is the first phase of any penetration test. Learn to gather information passively and actively.

### Lab Environment
- Kali Linux with security tools pre-installed
- You are logged in as \`kali\` (password: kali)
- Target: local services (no external scanning)

### Reconnaissance Pyramid
\`\`\`
Passive → Semi-Passive → Active
(OSINT)   (DNS/WHOIS)    (Nmap/Scan)
\`\`\``,
      tasks: [
        'Use Nmap to scan localhost and identify all open ports',
        'Perform a service version detection scan with -sV',
        'Use whois to gather domain registration information',
        'Use theHarvester to find email addresses and subdomains',
        'Run a Nmap script scan for known vulnerabilities',
        'Use dig to perform DNS enumeration',
        'Create an OSINT report from gathered information',
        'Use Recon-ng to build a reconnaissance database',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'kali', password: 'kali' }], key),
      flags: [
        { title: 'Port Scanner', description: 'Run: nmap -sT localhost | grep "open" | wc -l. Submit the number of open ports.', correctAnswer: '3', points: 150 },
        { title: 'Service Detector', description: 'Run: nmap -sV localhost | grep "open". Submit the first service detected.', correctAnswer: '22/tcp', points: 200 },
        { title: 'DNS Enumerator', description: 'Run: dig localhost ANY +noall +answer | head -3. Submit the first DNS record.', correctAnswer: 'localhost. IN A 127.0.0.1', points: 200 },
        { title: 'Script Kiddie', description: 'Run: nmap --script=http-title localhost | grep "Title". Submit the page title.', correctAnswer: 'Apache Default Page', points: 250 },
        { title: 'OSINT Collector', description: 'Gather all recon data into /home/kali/osint-report.md, run: wc -l on it. Submit the line count.', correctAnswer: '50', points: 300 },
      ],
    },
    {
      title: 'Kali Linux: Vulnerability Scanning & Exploitation',
      description: 'Use Metasploit, searchsploit, and vulnerability scanners to identify and exploit weaknesses in target systems.',
      dockerImage: 'kalilinux/kali-rolling',
      difficulty: 1600,
      imageUrl: '/images/labs/kali.png',
      briefing: `### Exploitation Phase
With reconnaissance complete, identify vulnerabilities and learn to exploit them in a controlled environment.

### Lab Environment
- Kali Linux with Metasploit Framework
- You are logged in as \`kali\` (password: kali)
- Practice targets: local services only

### Metasploit Workflow
\`\`\`
Search → Use → Configure → Exploit → Post-Exploitation
\`\`\``,
      tasks: [
        'Update the Metasploit database and verify connectivity',
        'Use searchsploit to find exploits for Apache 2.4.49',
        'Load the Metasploit console and search for SSH exploits',
        'Configure and run an auxiliary scanner module',
        'Use msfvenom to generate a payload',
        'Practice session management (background, list, interact)',
        'Use post-exploitation modules to gather system info',
        'Create a simple resource script for automated scanning',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'kali', password: 'kali' }], key),
      flags: [
        { title: 'DB Connected', description: 'Run: msfdb status. Submit the database state.', correctAnswer: 'online', points: 100 },
        { title: 'Exploit Finder', description: 'Run: searchsploit apache 2.4 | head -3. Submit the first exploit path.', correctAnswer: 'exploits/multi/...', points: 200 },
        { title: 'Payload Crafter', description: 'Run: msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=127.0.0.1 LPORT=4444 -f elf -o /tmp/backdoor. Submit file size.', correctAnswer: '150', points: 250 },
        { title: 'Module Master', description: 'Load auxiliary/scanner/ssh/ssh_version, run it, submit the SSH banner found.', correctAnswer: 'OpenSSH_8.4', points: 250 },
        { title: 'Script Writer', description: 'Create resource script /tmp/scan.rc, run: msfconsole -r /tmp/scan.rc. Submit exit code.', correctAnswer: '0', points: 300 },
      ],
    },
    {
      title: 'Parrot Security OS: Privacy & Forensics',
      description: 'Explore Parrot Security OS tools for digital forensics, privacy protection, and security auditing.',
      dockerImage: 'parrotsec/security',
      difficulty: 1550,
      imageUrl: '/images/labs/parrot.png',
      briefing: `### Parrot Security & Forensics
Parrot Security OS focuses on privacy, forensics, and reverse engineering.

### Lab Environment
- Parrot Security OS with forensics tools
- You are logged in as \`user\` (password: user123)
- Tools: Autopsy, binwalk, foremost, volatility

### Digital Forensics Process
\`\`\`
Acquire → Preserve → Analyze → Report
\`\`\``,
      tasks: [
        'Use binwalk to analyze a firmware image',
        'Use foremost to recover deleted files from a disk image',
        'Analyze a memory dump using volatility (or LiME)',
        'Create a forensic report of a compromised system',
        'Use autopsy to examine browser history artifacts',
        'Extract metadata from image files using exiftool',
        'Analyze network captures using tshark',
        'Document chain of custody for digital evidence',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'user', password: 'user123' }], key),
      flags: [
        { title: 'Firmware Analyst', description: 'Run: binwalk /data/firmware.bin | head -5. Submit the first embedded file type.', correctAnswer: 'Squashfs filesystem', points: 200 },
        { title: 'File Recoverer', description: 'Run: foremost -i /data/disk.img -o /tmp/recovered. Submit the number of files found.', correctAnswer: '15', points: 250 },
        { title: 'Metadata Hunter', description: 'Run: exiftool /data/photo.jpg | grep "Camera". Submit the camera model.', correctAnswer: 'Canon EOS R5', points: 200 },
        { title: 'Packet Inspector', description: 'Run: tshark -r /data/capture.pcap -Y "http" | wc -l. Submit the HTTP packet count.', correctAnswer: '250', points: 250 },
        { title: 'Chain of Custody', description: 'Create /tmp/custody.txt with proper format, submit the SHA256 hash of the file.', correctAnswer: 'a1b2c3...', points: 300 },
      ],
    },
    {
      title: 'Network Security: Firewalls, VPNs & IDS/IPS',
      description: 'Configure iptables/nftables firewalls, set up OpenVPN, deploy Snort/Suricata IDS, and analyze network traffic.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1600,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Network Defense Operations
Build layered network defenses: firewall rules, VPN tunnels, and intrusion detection.

### Lab Environment
- Ubuntu 22.04 with networking tools
- You are logged in as \`student\` (password: lab123)
- Services: iptables, OpenVPN, Snort available

### Defense Layers
\`\`\`
Firewall → IDS/IPS → VPN → Application
(First)    (Detect)   (Tunnel) (Last)
\`\`\``,
      tasks: [
        'Configure iptables with a default-deny inbound policy',
        'Create port forwarding rules with iptables DNAT',
        'Set up an OpenVPN server with PKI certificates',
        'Generate and verify OpenVPN client configurations',
        'Install and configure Snort as a network IDS',
        'Write custom Snort rules to detect port scanning',
        'Analyze pcaps with tcpdump and Wireshark (tshark)',
        'Set up nftables with named sets and rules',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'Firewall Builder', description: 'Set iptables default policy to DROP, run: iptables -L INPUT -n | head -3. Submit the policy.', correctAnswer: 'policy DROP', points: 200 },
        { title: 'VPN Engineer', description: 'Generate OpenVPN config, run: ls /etc/openvpn/ | grep server. Submit the config file name.', correctAnswer: 'server.conf', points: 250 },
        { title: 'IDS Architect', description: 'Create Snort rule: alert tcp any any -> any 22. Run: snort -T. Submit the number of rules loaded.', correctAnswer: '1', points: 250 },
        { title: 'Packet Analyst', description: 'Capture 100 packets with tcpdump, run: tcpdump -c 100 -w /tmp/capture.pcap. Submit file size.', correctAnswer: '65536', points: 200 },
        { title: 'nftables Pro', description: 'Create nftables table with named set, run: nft list ruleset | grep set. Submit the set name.', correctAnswer: 'whitelist', points: 300 },
      ],
    },
    {
      title: 'Penetration Testing: Metasploitable Practice',
      description: 'Exploit a deliberately vulnerable Metasploitable target. Practice the full penetration testing lifecycle.',
      dockerImage: 'kalilinux/kali-rolling',
      difficulty: 1700,
      imageUrl: '/images/labs/kali.png',
      briefing: `### Full Penetration Test
Practice the complete pentest lifecycle against a Metasploitable target.

### Lab Environment
- Kali Linux (attacker) — you are here
- Metasploitable target is available on the internal network
- You are logged in as \`kali\` (password: kali)

### Pentest Methodology
\`\`\`
Recon → Scan → Exploit → Post-Exploit → Report
\`\`\``,
      tasks: [
        'Discover the Metasploitable target using Nmap',
        'Enumerate services running on the target',
        'Identify and exploit the vsftpd backdoor',
        'Exploit the Samba usermap_script vulnerability',
        'Gain a Meterpreter session and escalate privileges',
        'Dump password hashes from the target',
        'Create a persistence mechanism on the target',
        'Write a complete penetration test report',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'kali', password: 'kali' }], key),
      flags: [
        { title: 'Target Found', description: 'Run: nmap -sn 172.17.0.0/24 | grep "Up" | wc -l. Submit the number of live hosts.', correctAnswer: '2', points: 150 },
        { title: 'Service Enumerator', description: 'Run: nmap -sV target_ip | grep "open" | wc -l. Submit the open port count.', correctAnswer: '12', points: 200 },
        { title: 'vsftpd Exploit', description: 'Exploit vsftpd backdoor, get shell, run: id. Submit the user ID.', correctAnswer: 'uid=0(root)', points: 300 },
        { title: 'Meterpreter Session', description: 'Get Meterpreter, run: sysinfo. Submit the target OS.', correctAnswer: 'Linux metasploitable', points: 300 },
        { title: 'Hash Dumper', description: 'Run hashdump in Meterpreter, submit the number of hashes found.', correctAnswer: '5', points: 350 },
      ],
    },
    {
      title: 'Linux Automation: Ansible & Bash Scripting',
      description: 'Automate infrastructure with Ansible playbooks, Bash scripts, and cron jobs. Manage multiple servers efficiently.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1450,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Infrastructure Automation
Manual server management doesn't scale. Learn Ansible and advanced Bash scripting.

### Lab Environment
- Ubuntu 22.04 with Ansible installed
- You are logged in as \`student\` (password: lab123)
- Local inventory (localhost) for practice

### Automation Hierarchy
\`\`\`
Shell Scripts → Ansible → Terraform → Kubernetes
(Single)      (Multi)    (Cloud)     (Container)
\`\`\``,
      tasks: [
        'Write a Bash script that backs up /etc to /backup with timestamps',
        'Create an Ansible inventory with localhost and a test group',
        'Write an Ansible playbook to install and configure nginx',
        'Use Ansible roles to organize a multi-service deployment',
        'Create a Bash script with error handling and logging',
        'Set up Ansible vault to manage encrypted secrets',
        'Write a script that parses CSV data and generates reports',
        'Create a cron job that runs your backup script daily',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'Backup Script', description: 'Create backup script, run it, check: ls /backup/ | head -1. Submit the backup filename pattern.', correctAnswer: 'etc-backup-*.tar.gz', points: 150 },
        { title: 'Inventory Master', description: 'Create Ansible inventory, run: ansible all --list-hosts | wc -l. Submit the host count.', correctAnswer: '1', points: 200 },
        { title: 'Playbook Writer', description: 'Write nginx playbook, run: ansible-playbook --check nginx.yml. Submit the "changed" count.', correctAnswer: '2', points: 250 },
        { title: 'Vault Keeper', description: 'Create encrypted var with ansible-vault, run: ansible-vault view secrets.yml 2>&1 | head -1. Submit the first line.', correctAnswer: '$ANSIBLE_VAULT', points: 250 },
        { title: 'Role Builder', description: 'Create Ansible role structure, run: ls roles/webserver/tasks/. Submit the file name.', correctAnswer: 'main.yml', points: 300 },
      ],
    },
    {
      title: 'System Hardening: CIS Benchmarks & Compliance',
      description: 'Apply CIS benchmarks, configure auditd, deploy Lynis for system auditing, and achieve compliance with security standards.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1650,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Compliance & Hardening
Meet security standards with automated hardening and continuous auditing.

### Lab Environment
- Ubuntu 22.04 with audit tools
- You are logged in as \`student\` (password: lab123)
- Tools: Lynis, auditd, aide available

### Compliance Framework
\`\`\`
Policy → Implementation → Audit → Remediation → Re-Audit
\`\`\``,
      tasks: [
        'Install and run Lynis for a full system audit',
        'Review Lynis hardening index and identify critical findings',
        'Configure auditd to monitor /etc/passwd changes',
        'Create audit rules for privileged command execution',
        'Apply CIS benchmark recommendations for SSH',
        'Configure password policies per CIS standards',
        'Set up AIDE for file integrity baseline',
        'Generate a compliance report from audit results',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'Lynis Scanner', description: 'Run: lynis audit system --quick 2>&1 | grep "Hardening index". Submit the score.', correctAnswer: '65', points: 200 },
        { title: 'Audit Watcher', description: 'Add audit rule for /etc/passwd, run: auditctl -l | grep passwd. Submit the rule.', correctAnswer: '-w /etc/passwd', points: 250 },
        { title: 'CIS Compliant', description: 'Apply SSH hardening, run: sshd -T | grep "permitrootlogin". Submit the value.', correctAnswer: 'no', points: 250 },
        { title: 'AIDE Initialized', description: 'Initialize AIDE, run: aideinit 2>&1 | tail -1. Submit the output.', correctAnswer: 'AIDE database initialized', points: 300 },
        { title: 'Report Generator', description: 'Generate compliance report at /tmp/compliance.txt, run: wc -l on it. Submit the line count.', correctAnswer: '100', points: 300 },
      ],
    },

    // ═══════════════════════════════════════════
    // TIER 5: SPECIALIST — Advanced Services
    // ═══════════════════════════════════════════
    {
      title: 'DNS Server Administration with BIND9',
      description: 'Deploy and configure BIND9 DNS server with forward/reverse zones, DNSSEC, and forwarding.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1350,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### DNS Server Mastery with BIND9
BIND9 is the most widely deployed DNS software on the Internet. Mastering it is essential for any network administrator.

### Lab Environment
- Ubuntu 22.04 with BIND9 available
- You are logged in as \`student\` (password: lab123)
- Root access via sudo for service management

### DNS Architecture
- **Authoritative Server**: Serves DNS records for a zone
- **Recursive Resolver**: Resolves queries on behalf of clients
- **Forwarding**: Delegates queries to upstream resolvers
- **DNSSEC**: Adds cryptographic signatures to DNS records

### Key Files
- \`/etc/bind/named.conf\` — Main configuration
- \`/etc/bind/named.conf.options\` — Global options
- \`/etc/bind/named.conf.local\` — Zone declarations
- \`/var/cache/bind/\` — Zone file storage`,
      tasks: [
        'Install BIND9 and bind9utils packages',
        'Configure named.conf.options with forwarders and DNSSEC validation',
        'Create a forward zone file for example.local',
        'Create a reverse zone file for 10.0.0.0/24',
        'Generate DNSSEC keys with dnssec-keygen',
        'Sign the zone with dnssec-signzone',
        'Configure BIND9 to serve as a caching-only resolver',
        'Test DNS resolution with dig and nslookup',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'SOA Record Values', description: 'In your forward zone, what is the serial number format of the SOA record? (e.g., 2024010101)', correctAnswer: '2024010101', points: 100 },
        { title: 'named.conf Options', description: 'What directive in named.conf.options disables DNS recursion for authoritative-only servers?', correctAnswer: 'recursion no', points: 150 },
        { title: 'Zone File Syntax', description: 'What is the fully qualified domain name (with trailing dot) used in an A record for the zone apex?', correctAnswer: 'example.local.', points: 150 },
        { title: 'DNSSEC Key Generation', description: 'After running dnssec-keygen -a ECDSAP256SHA256 -n ZONE example.local, how many key files are created?', correctAnswer: '2', points: 200 },
        { title: 'dig Query Results', description: 'Run: dig @localhost example.local A +short. Submit the IP address returned.', correctAnswer: '10.0.0.10', points: 250 },
      ],
    },
    {
      title: 'Mail Server with Postfix & Dovecot',
      description: 'Install and configure Postfix (SMTP) and Dovecot (IMAP/POP3) for a complete mail solution with TLS.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1400,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Complete Mail Server Setup
Build a production-ready mail server using Postfix for sending and Dovecot for receiving email.

### Lab Environment
- Ubuntu 22.04 with Postfix and Dovecot available
- You are logged in as \`student\` (password: lab123)
- Domain: mail.example.local

### Mail Flow
\`\`\`
Sender → MUA → Postfix (SMTP) → Dovecot (IMAP) → Recipient
\`\`\`

### Key Components
- **Postfix**: SMTP server for sending and relaying mail
- **Dovecot**: IMAP/POP3 server for mail retrieval
- **TLS/SSL**: Encrypts mail in transit
- **Maildir**: Per-user mail storage format`,
      tasks: [
        'Install Postfix and configure main.cf for local mail delivery',
        'Install Dovecot and configure IMAP access',
        'Generate self-signed TLS certificates for mail services',
        'Configure Postfix to use TLS for incoming and outgoing connections',
        'Create mail user accounts and test mail delivery',
        'Configure Dovecot for Maildir format storage',
        'Set up Postfix relay through an external SMTP server',
        'Test the complete mail flow with sendmail or mutt',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'Postfix main.cf', description: 'In Postfix main.cf, what is the value of myhostname after configuration?', correctAnswer: 'mail.example.local', points: 150 },
        { title: 'Dovecot Config', description: 'In /etc/dovecot/dovecot.conf, what protocol listener is enabled for IMAP?', correctAnswer: 'protocols = imap', points: 150 },
        { title: 'TLS Certificate', description: 'After generating certs, what is the default TLS certificate file path in Postfix main.cf?', correctAnswer: '/etc/ssl/certs/mail-cert.pem', points: 200 },
        { title: 'Mail Delivery Test', description: 'Send a test email, run: mailq. Submit the queue status.', correctAnswer: 'Mail queue is empty', points: 250 },
        { title: 'Port Configuration', description: 'What port does Dovecot listen on for IMAPS (IMAP over TLS)?', correctAnswer: '993', points: 100 },
      ],
    },
    {
      title: 'Database Administration: MySQL/MariaDB',
      description: 'Install MariaDB, secure the installation, manage databases/users, configure backups, and set up replication.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1300,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### MariaDB Database Administration
MariaDB is a drop-in replacement for MySQL. Master database administration fundamentals.

### Lab Environment
- Ubuntu 22.04 with MariaDB server
- You are logged in as \`student\` (password: lab123)
- Root access via sudo

### Database Workflow
\`\`\`
Install → Secure → Configure → Create DBs → Users → Backups → Replication
\`\`\`

### Key Concepts
- **GRANT**: Assigns privileges to users
- **mysqldump**: Logical backup tool
- **Binary logging**: Required for replication
- **Master-Slave**: Asynchronous replication topology`,
      tasks: [
        'Install MariaDB server and start the service',
        'Run mysql_secure_installation to harden the installation',
        'Create a database called "webapp" with UTF-8 encoding',
        'Create a database user "webuser" with SELECT, INSERT, UPDATE privileges',
        'Configure mysqldump backup for the webapp database',
        'Enable binary logging for replication',
        'Set up master-slave replication configuration',
        'Verify replication status with SHOW SLAVE STATUS',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'SQL Commands Output', description: 'Run: SHOW DATABASES; in MariaDB. Submit the list of default databases.', correctAnswer: 'information_schema mysql performance_schema sys', points: 100 },
        { title: 'User Privileges', description: 'Run: SHOW GRANTS FOR webuser@localhost;. What privilege is explicitly granted?', correctAnswer: 'SELECT, INSERT, UPDATE', points: 150 },
        { title: 'Backup Verification', description: 'After mysqldump, run: ls -la /backup/webapp*.sql. Submit the backup file size range.', correctAnswer: '1-5 KB', points: 150 },
        { title: 'Replication Status', description: 'Run: SHOW SLAVE STATUS\\G. What is the value of Slave_IO_Running?', correctAnswer: 'Yes', points: 250 },
        { title: 'Database Engine', description: 'Run: SHOW ENGINES;. What is the default storage engine for MariaDB?', correctAnswer: 'InnoDB', points: 100 },
      ],
    },
    {
      title: 'Database Administration: PostgreSQL',
      description: 'Install PostgreSQL, configure authentication, manage roles/databases, set up backups, and configure WAL archiving.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1350,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### PostgreSQL Administration
PostgreSQL is an advanced open-source relational database. Master its powerful features.

### Lab Environment
- Ubuntu 22.04 with PostgreSQL 14
- You are logged in as \`student\` (password: lab123)
- PostgreSQL runs as user \`postgres\`

### PostgreSQL Architecture
\`\`\`
Client → PostgreSQL Backend → Shared Memory → WAL → Data Files
\`\`\`

### Key Components
- **pg_hba.conf**: Client authentication configuration
- **Roles**: Combine users and groups
- **pg_dump**: Logical backup utility
- **WAL Archiving**: Point-in-time recovery`,
      tasks: [
        'Install PostgreSQL and verify the service is running',
        'Configure pg_hba.conf for password-based authentication',
        'Create a role with LOGIN and CREATEDB privileges',
        'Create a database owned by the new role',
        'Set up pg_dump backup with compression',
        'Configure WAL archiving to a local directory',
        'Create a table with sample data and run basic queries',
        'Verify backup can be restored with pg_restore',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'pg_hba.conf Entries', description: 'In pg_hba.conf, what authentication method allows password login for local connections?', correctAnswer: 'md5', points: 150 },
        { title: 'Role Attributes', description: 'Run: \\du in psql. What attribute does the custom role have besides LOGIN?', correctAnswer: 'Createdb', points: 150 },
        { title: 'Backup Verification', description: 'After pg_dump, run: pg_restore --list backup.dump | head -5. Submit the first entry type.', correctAnswer: 'TOC Entry', points: 200 },
        { title: 'WAL Archive Status', description: 'Check WAL archiving with: SELECT * FROM pg_stat_archiver;. What is the archive_count?', correctAnswer: '1', points: 250 },
        { title: 'Default Port', description: 'On which port does PostgreSQL listen by default?', correctAnswer: '5432', points: 100 },
      ],
    },
    {
      title: 'Monitoring Stack: Prometheus & Grafana',
      description: 'Deploy Prometheus for metrics collection, node_exporter for system metrics, and Grafana for visualization and alerting.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1450,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Observability with Prometheus & Grafana
Modern infrastructure monitoring combines metrics collection, storage, visualization, and alerting.

### Lab Environment
- Ubuntu 22.04 with Docker available
- You are logged in as \`student\` (password: lab123)
- Services will run on localhost

### Monitoring Stack Architecture
\`\`\`
Applications → node_exporter → Prometheus → Grafana → Dashboards
                                 ↓
                            Alertmanager → Notifications
\`\`\`

### Key Components
- **Prometheus**: Time-series database and scraper
- **node_exporter**: System metrics exporter
- **Grafana**: Visualization and dashboard platform
- **Alertmanager**: Alert routing and deduplication`,
      tasks: [
        'Deploy Prometheus using Docker with persistent storage',
        'Install and configure node_exporter for system metrics',
        'Configure Prometheus to scrape node_exporter metrics',
        'Deploy Grafana and connect it to Prometheus as a data source',
        'Import a Node Exporter dashboard in Grafana',
        'Create a Prometheus alert rule for high CPU usage',
        'Verify metric collection with PromQL queries',
        'Set up Grafana alerting for disk space threshold',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'prometheus.yml Config', description: 'In prometheus.yml, what is the scrape_interval value in global config?', correctAnswer: '15s', points: 100 },
        { title: 'Scrape Targets', description: 'In Prometheus targets page (/targets), how many targets are listed as UP?', correctAnswer: '2', points: 150 },
        { title: 'Grafana Dashboard JSON', description: 'After importing dashboard 1860, what is the dashboard title?', correctAnswer: 'Node Exporter Full', points: 200 },
        { title: 'Alert Rules', description: 'Create alert rule for CPU > 80%, run: curl localhost:9090/api/v1/rules. How many active rules?', correctAnswer: '1', points: 250 },
        { title: 'PromQL Query', description: 'Run: curl localhost:9090/api/v1/query?query=up. What is the value of the "up" metric?', correctAnswer: '1', points: 150 },
      ],
    },
    {
      title: 'Centralized Logging: rsyslog & Log Rotation',
      description: 'Configure rsyslog for centralized logging, set up log forwarding over TCP/TLS, and manage log rotation.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1200,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Centralized Logging with rsyslog
Centralized logging is essential for security auditing and troubleshooting distributed systems.

### Lab Environment
- Ubuntu 22.04 with rsyslog pre-installed
- You are logged in as \`student\` (password: lab123)
- Root access via sudo

### Logging Architecture
\`\`\`
Application → Local syslog → rsyslog → Central Server → Archive
\`\`\`

### Key Components
- **rsyslog**: Advanced syslog implementation
- **logrotate**: Automated log rotation and compression
- **TCP/TLS**: Reliable and encrypted log transport
- **Templates**: Custom log format definitions`,
      tasks: [
        'Configure rsyslog to receive remote logs on TCP port 514',
        'Set up TLS encryption for rsyslog communication',
        'Create a custom rsyslog template for application logs',
        'Configure logrotate for a custom application log',
        'Set up log forwarding from rsyslog to a remote server',
        'Create a log analysis script to parse syslog entries',
        'Configure rsyslog rate limiting to prevent log flooding',
        'Test log rotation manually and verify compression',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'rsyslog.conf Rules', description: 'In /etc/rsyslog.conf, what module is loaded for TCP input?', correctAnswer: 'imtcp', points: 100 },
        { title: 'Logrotate Config Syntax', description: 'In logrotate config, what directive specifies how many rotated logs to keep?', correctAnswer: 'rotate', points: 100 },
        { title: 'Rotation Count', description: 'Configure logrotate with "rotate 7". After 8 rotations, how many log files exist?', correctAnswer: '7', points: 150 },
        { title: 'TLS Port', description: 'What port is used for rsyslog TLS connections by default?', correctAnswer: '6514', points: 100 },
        { title: 'Log Analysis Output', description: 'Run: grep -c "error" /var/log/syslog. Submit the error count.', correctAnswer: '0', points: 150 },
      ],
    },
    {
      title: 'High Availability with Keepalived & HAProxy',
      description: 'Deploy HAProxy as load balancer, configure Keepalived for VIP failover, and test high availability scenarios.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1550,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### High Availability Infrastructure
Achieve zero-downtime with load balancing and automatic failover using HAProxy and Keepalived.

### Lab Environment
- Ubuntu 22.04 with Docker for multi-node simulation
- You are logged in as \`student\` (password: lab123)
- Multiple containers simulate backend servers

### HA Architecture
\`\`\`
Clients → HAProxy (LB) → Backend Servers (active/passive)
              ↓
        Keepalived (VIP failover)
\`\`\`

### Key Components
- **HAProxy**: Layer 4/7 load balancer
- **Keepalived**: VRRP-based VIP failover
- **VIP**: Virtual IP address shared between nodes
- **Health Checks**: Detect and remove failed backends`,
      tasks: [
        'Install and configure HAProxy as a load balancer',
        'Configure HAProxy frontend and backend for HTTP traffic',
        'Set up health checks for backend servers',
        'Install and configure Keepalived for VIP failover',
        'Configure VRRP script for automatic failover',
        'Test failover by stopping a backend server',
        'Monitor HAProxy stats page for connection metrics',
        'Configure sticky sessions in HAProxy',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'haproxy.cfg Frontend', description: 'In haproxy.cfg, what is the bind address and port for the HTTP frontend?', correctAnswer: '*:80', points: 150 },
        { title: 'haproxy.cfg Backend', description: 'How many server entries are configured in the backend section?', correctAnswer: '3', points: 150 },
        { title: 'keepalived.conf VRRP Script', description: 'In keepalived.conf, what is the interval (in seconds) for the VRRP health check?', correctAnswer: '2', points: 200 },
        { title: 'VIP Address', description: 'What is the Virtual IP address configured for failover?', correctAnswer: '192.168.1.100', points: 200 },
        { title: 'Health Check Type', description: 'What type of health check is configured in HAProxy for the backend servers?', correctAnswer: 'httpchk', points: 150 },
      ],
    },
    {
      title: 'Linux Security Auditing with OpenSCAP',
      description: 'Install OpenSCAP scanner, run CIS benchmark scans, generate compliance reports, and remediate findings.',
      dockerImage: 'centos:stream9',
      difficulty: 1500,
      imageUrl: '/images/labs/centos.png',
      briefing: `### Security Compliance with OpenSCAP
OpenSCAP provides automated security auditing against industry standards like CIS and STIG.

### Lab Environment
- CentOS Stream 9 with OpenSCAP available
- You are logged in as \`root\` (password: lab123)
- CIS CentOS Stream 9 benchmark content available

### Compliance Process
\`\`\`
Scan → Analyze → Report → Remediate → Re-Scan
\`\`\`

### Key Concepts
- **XCCDF**: XML format for security benchmarks
- **OVAL**: Open Vulnerability Assessment Language
- **CIS Benchmarks**: Center for Internet Security hardening guides
- **CVE**: Common Vulnerabilities and Exposures`,
      tasks: [
        'Install OpenSCAP scanner and SCAP Security Guide',
        'List available security profiles with oscap info',
        'Run a CIS benchmark scan against the system',
        'Generate an HTML compliance report',
        'Analyze scan results for high-severity findings',
        'Apply automated remediation for failed rules',
        'Re-scan to verify remediation effectiveness',
        'Create a custom SCAP rule for a specific check',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'root', password: 'lab123' }], key),
      flags: [
        { title: 'OpenSCAP Scan Results', description: 'After scanning, what is the total number of rules evaluated?', correctAnswer: '250', points: 150 },
        { title: 'CVE Counts', description: 'How many CVEs were found in the scan results?', correctAnswer: '15', points: 200 },
        { title: 'Compliance Score', description: 'What percentage of rules passed in the initial scan?', correctAnswer: '65', points: 200 },
        { title: 'Profile Name', description: 'What is the XCCDF profile ID for CIS CentOS Stream 9?', correctAnswer: 'xccdf_org.ssgproject.content_profile_cis', points: 150 },
        { title: 'Remediation Status', description: 'After remediation, how many rules were fixed automatically?', correctAnswer: '50', points: 250 },
      ],
    },
    {
      title: 'Kubernetes Cluster Setup',
      description: 'Install containerd runtime, initialize Kubernetes master node, join workers, and deploy applications with Calico networking.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1600,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Kubernetes Cluster Deployment
Kubernetes orchestrates containerized applications across a cluster of machines.

### Lab Environment
- Ubuntu 22.04 with Docker available
- You are logged in as \`student\` (password: lab123)
- Multiple nodes simulated via containers or VMs

### Kubernetes Architecture
\`\`\`
kubectl → API Server → etcd → Scheduler → Controller Manager
                                     ↓
                         kubelet → Container Runtime → Pods
\`\`\`

### Key Components
- **containerd**: Container runtime
- **kubeadm**: Cluster bootstrapping tool
- **Calico**: Network policy and CNI plugin
- **CoreDNS**: Cluster DNS resolution`,
      tasks: [
        'Install containerd runtime and configure systemd cgroup',
        'Disable swap and configure kernel parameters for Kubernetes',
        'Initialize the Kubernetes master node with kubeadm init',
        'Install Calico CNI plugin for pod networking',
        'Join a worker node to the cluster',
        'Deploy a sample nginx application with 3 replicas',
        'Expose the application as a NodePort service',
        'Verify cluster health with kubectl get nodes and get pods',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'kubectl get nodes', description: 'Run: kubectl get nodes. How many nodes are in Ready state?', correctAnswer: '2', points: 150 },
        { title: 'Pod Status', description: 'Run: kubectl get pods -A. How many pods are in Running state?', correctAnswer: '5', points: 200 },
        { title: 'Service ClusterIP', description: 'Run: kubectl get svc nginx. What is the ClusterIP assigned?', correctAnswer: '10.96.0.100', points: 200 },
        { title: 'Container Runtime', description: 'Run: kubectl get nodes -o wide. What is the container runtime version?', correctAnswer: 'containerd://1.6', points: 150 },
        { title: 'Calico Status', description: 'Run: kubectl get pods -n kube-system | grep calico. How many calico pods are running?', correctAnswer: '2', points: 250 },
      ],
    },
    {
      title: 'Linux Kernel Debugging & Tracing',
      description: 'Use strace, ltrace, perf, and /proc to debug system calls, library calls, and analyze performance.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1650,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Kernel Debugging & Tracing
Master the tools that reveal what happens beneath the surface of Linux processes.

### Lab Environment
- Ubuntu 22.04 with debugging tools available
- You are logged in as \`student\` (password: lab123)
- Root access via sudo for perf and tracing

### Debugging Toolkit
\`\`\`
strace  → System call tracing
ltrace  → Library call tracing
perf    → Performance profiling
/proc   → Process and kernel information
\`\`\`

### Key Concepts
- **System Calls**: Interface between user space and kernel
- **Traps**: Software interrupts for system calls
- **perf_events**: Linux performance counter subsystem
- **Flame Graphs**: Visualize call stacks and CPU usage`,
      tasks: [
        'Use strace to trace system calls of a running process',
        'Use ltrace to trace library calls of a binary',
        'Use perf stat to measure performance counters',
        'Analyze /proc/[pid]/status for process information',
        'Generate a flame graph using perf and FlameGraph scripts',
        'Use strace to identify files opened by a program',
        'Trace network-related system calls with strace',
        'Use perf record to capture profiling data and generate a report',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'strace Output Patterns', description: 'Run: strace ls /tmp 2>&1 | grep -c "openat". Submit the system call count.', correctAnswer: '15', points: 150 },
        { title: 'perf stat Results', description: 'Run: perf stat ls /dev/null. What is the task-clock value in msec?', correctAnswer: '1.5', points: 200 },
        { title: '/proc/[pid]/status Fields', description: 'Run: cat /proc/1/status | grep "^State". What is the process state?', correctAnswer: 'S (sleeping)', points: 150 },
        { title: 'ltrace Output', description: 'Run: ltrace ls /tmp 2>&1 | grep -c "opendir". Submit the count.', correctAnswer: '3', points: 200 },
        { title: 'Flame Graph Title', description: 'After generating a flame graph, what is the default SVG title?', correctAnswer: 'perf.data', points: 250 },
      ],
    },
    {
      title: 'Backup & Disaster Recovery',
      description: 'Set up rsync, tar, and automated backup systems with rotation and disaster recovery procedures.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1300,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Backup & Disaster Recovery
Protect your data with robust backup strategies and tested recovery procedures.

### Lab Environment
- Ubuntu 22.04 with backup tools available
- You are logged in as \`student\` (password: lab123)
- Multiple storage locations for backup testing

### Backup Strategy
\`\`\`
Full Backup → Incremental → Differential → Archive
(Weekly)     (Daily)       (Weekly)        (Monthly)
\`\`\`

### Key Tools
- **rsync**: Efficient incremental file synchronization
- **tar**: Archive creation with compression
- **cron**: Automated backup scheduling
- **Rotation**: Prevent backup storage exhaustion`,
      tasks: [
        'Set up rsync for incremental backups of /etc',
        'Create tar archives with different compression levels (gzip, bzip2, xz)',
        'Write a backup rotation script that keeps last 7 daily backups',
        'Test backup restoration from a tar archive',
        'Set up cron-based automated daily backups',
        'Create a full system backup excluding /proc and /sys',
        'Verify backup integrity with checksum comparison',
        'Document a disaster recovery runbook',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'rsync Dry-Run Output', description: 'Run: rsync -avz --dry-run /etc /backup/etc. How many files would be transferred?', correctAnswer: '200', points: 150 },
        { title: 'tar Archive Sizes', description: 'Create backups with tar.gz, tar.bz2, tar.xz. Which produces the smallest archive?', correctAnswer: 'tar.xz', points: 150 },
        { title: 'Rotation Script Logic', description: 'Your rotation script keeps 7 daily backups. After 10 days, how many backup files exist?', correctAnswer: '7', points: 200 },
        { title: 'Cron Schedule', description: 'Set up cron for daily backup at 2 AM. What is the cron expression?', correctAnswer: '0 2 * * *', points: 100 },
        { title: 'Backup Checksum', description: 'After creating backup, run: sha256sum backup.tar.gz. What is the hash length?', correctAnswer: '64', points: 150 },
      ],
    },
    {
      title: 'Web Application Firewall: ModSecurity',
      description: 'Install ModSecurity with nginx, configure OWASP CRS, test rules, and create custom WAF policies.',
      dockerImage: 'ubuntu:22.04',
      difficulty: 1500,
      imageUrl: '/images/labs/ubuntu.png',
      briefing: `### Web Application Firewall with ModSecurity
Protect web applications from common attacks using ModSecurity and OWASP CRS.

### Lab Environment
- Ubuntu 22.04 with nginx and ModSecurity available
- You are logged in as \`student\` (password: lab123)
- OWASP Core Rule Set (CRS) v3 available

### WAF Architecture
\`\`\`
Client Request → ModSecurity Engine → OWASP CRS Rules → nginx → Backend
                   ↓
              Custom Rules → Alert/Block
\`\`\`

### Attack Vectors Blocked
- **SQL Injection**: Malicious SQL in input fields
- **XSS**: Cross-site scripting attempts
- **Remote File Inclusion**: Path traversal attacks
- **Protocol Violations**: HTTP request anomalies`,
      tasks: [
        'Install ModSecurity and compile the nginx connector',
        'Configure ModSecurity in detection-only mode',
        'Enable the OWASP Core Rule Set (CRS)',
        'Test SQL injection protection with a crafted URL',
        'Test XSS protection with a script tag payload',
        'Create a custom rule to block a specific User-Agent',
        'Tune false positives by disabling overly aggressive rules',
        'Switch ModSecurity to blocking mode and verify',
      ],
      credentials: encryptCredentials([{ service: 'SSH', username: 'student', password: 'lab123' }], key),
      flags: [
        { title: 'modsecurity.conf Settings', description: 'In modsecurity.conf, what is the default value of SecRuleEngine?', correctAnswer: 'DetectionOnly', points: 100 },
        { title: 'CRS Activation', description: 'In CRS setup.conf, what is the default SecRuleEngine setting?', correctAnswer: 'DetectionOnly', points: 150 },
        { title: 'Custom Rule Syntax', description: 'What ModSecurity directive is used to create a custom rule?', correctAnswer: 'SecRule', points: 150 },
        { title: 'SQL Injection Test', description: 'Send request with ?id=1 OR 1=1. What HTTP status code does ModSecurity return?', correctAnswer: '403', points: 200 },
        { title: 'XSS Rule ID', description: 'What is the default OWASP CRS rule ID for XSS attack detection?', correctAnswer: '941100', points: 200 },
      ],
    },
  ];

  const createdLabs: any[] = [];

  for (const labData of labs) {
    const lab = await prisma.lab.create({
      data: {
        title: labData.title,
        description: labData.description,
        dockerImage: labData.dockerImage,
        difficulty: labData.difficulty,
        imageUrl: labData.imageUrl,
        briefing: labData.briefing,
        tasks: labData.tasks,
        credentials: labData.credentials,
      },
    });

    for (const flagData of labData.flags) {
      await prisma.labFlag.create({
        data: {
          labId: lab.id,
          title: flagData.title,
          description: flagData.description,
          correctAnswer: await hashAnswer(flagData.correctAnswer),
          points: flagData.points,
        },
      });
    }

    createdLabs.push(lab);
  }

  console.log(`  Created ${createdLabs.length} Linux labs with flags`);
  return createdLabs;
}
