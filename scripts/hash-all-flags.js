const bcrypt = require('bcrypt');

function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim();
}

const flags = [
  // Lab 2: File Permissions & Users (verified)
  { title: 'ACL Master', answer: 'user:alice:rwx' },
  { title: 'Group Manager', answer: 'student : student admin_group' },
  { title: 'Sticky Bit Expert', answer: '1777' },
  { title: 'User Creator', answer: '1002' },
  { title: 'chmod Master', answer: '700' },

  // Lab 3: Text Processing & Shell Scripting (verified)
  { title: 'Pipeline Master', answer: '_apt backup bin daemon games' },
  { title: 'Script Writer', answer: '21' },
  { title: 'awk Architect', answer: 'root daemon bin' },
  { title: 'grep Guru', answer: '1' },
  { title: 'sed Specialist', answer: 'Hello AEROACADEMY' },

  // Lab 4: Process & Service Management (redesigned for Docker)
  { title: 'Cron Crafter', answer: 'cron_ok' },
  { title: 'Process Hunter', answer: 'tail' },
  { title: 'Service Architect', answer: 'sshd is running' },
  { title: 'Signal Handler', answer: '0' },
  { title: 'Systemd Master', answer: 'is running' },

  // Lab 8: Debian Hardening
  { title: 'Root Auditor', answer: '1' },
  { title: 'SSH Hardened', answer: '2222' },
  { title: 'Firewall Active', answer: '3' },
  { title: 'fail2ban Guard', answer: '0' },
  { title: 'AIDE Watcher', answer: 'AIDE found NO differences' },

  // Lab 9: CentOS
  { title: 'SELinux Master', answer: 'enforcing' },
  { title: 'Package Expert', answer: 'nginx' },
  { title: 'Firewall Commander', answer: '80/tcp' },
  { title: 'SELinux Auditor', answer: 'no denials' },
  { title: 'Systemd Architect', answer: 'enabled' },

  // Lab 10: rsyslog
  { title: 'Log Analysis Output', answer: '0' },
  { title: 'rsyslog.conf Rules', answer: 'imtcp' },
  { title: 'TLS Port', answer: '6514' },
  { title: 'Logrotate Config Syntax', answer: 'rotate' },
  { title: 'Rotation Count', answer: '8' },

  // Lab 5: vAPI
  { title: 'BOLA Specialist', answer: 'creditCard' },
  { title: 'JWT Architect', answer: 'admin' },

  // Lab 6: DVWA
  { title: 'Database Version', answer: '10.1.26-MariaDB-0+deb9u1' },
  { title: 'RCE Execution', answer: 'uid=33(www-data)' },
  { title: 'Credential Brute Force', answer: 'password' },
  { title: 'Web Shell Deployment', answer: 'www-data' },
  { title: 'Admin Session Token', answer: 'sessionid' },
  { title: 'System Password File', answer: 'root:x:0:0:root:/root:/bin/bash' },

  // Lab 7: Juice Shop
  { title: 'Admin Access', answer: 'admin123' },
  { title: 'Hidden Feedback', answer: 'Nothing useful available here!' },

  // Lab 28: WebGoat
  { title: 'Deserialization King', answer: 'admin' },
  { title: 'Path Traversal Expert', answer: 'root:x:0:0' },

  // Lab 29: NodeGoat
  { title: 'Mass Assignment Hunter', answer: 'admin' },
  { title: 'NoSQL Master', answer: 'admin' },

  // Lab 13: MySQL/MariaDB
  { title: 'Database Engine', answer: 'InnoDB' },
  { title: 'SQL Commands Output', answer: 'information_schema mysql performance_schema' },
  { title: 'User Privileges', answer: 'SELECT' },
  { title: 'Replication Status', answer: 'No' },
  { title: 'Backup Verification', answer: '0' },

  // Lab 14: Nginx
  { title: 'Load Balancer', answer: '3' },
  { title: 'Rate Limiter', answer: 'mylimit' },
  { title: 'Reverse Proxy Pro', answer: 'test is successful' },
  { title: 'SSL Engineer', answer: '200' },
  { title: 'Vhost Builder', answer: 'AERO{NGINX_VHOST}' },

  // Lab 15: PostgreSQL
  { title: 'Default Port', answer: '5432' },
  { title: 'Role Attributes', answer: 'CREATEDB' },
  { title: 'pg_hba.conf Entries', answer: 'md5' },
  { title: 'WAL Archive Status', answer: '0' },

  // Lab 16: BIND9
  { title: 'dig Query Results', answer: '192.168.1.10' },
  { title: 'named.conf Options', answer: 'recursion no' },
  { title: 'SOA Record Values', answer: '2024010101' },
  { title: 'Zone File Syntax', answer: 'example.local.' },
  { title: 'DNSSEC Key Generation', answer: '2' },

  // Lab 17: Storage
  { title: 'FS Expert', answer: 'ext4' },
  { title: 'PV Creator', answer: '/dev/sdb' },
  { title: 'VG Master', answer: '20.00' },
  { title: 'LV Engineer', answer: '10.00' },
  { title: 'RAID Builder', answer: '1' },

  // Lab 18: Backup
  { title: 'Backup Checksum', answer: '64' },
  { title: 'Cron Schedule', answer: '0 2 * * *' },
  { title: 'Rotation Script Logic', answer: '8' },
  { title: 'tar Archive Sizes', answer: 'xz' },
  { title: 'rsync Dry-Run Output', answer: '3' },

  // Lab 19: Docker
  { title: 'Container Runner', answer: 'myapp' },
  { title: 'Dockerfile Author', answer: 'Successfully built' },
  { title: 'Compose Architect', answer: '3' },
  { title: 'Network Engineer', answer: 'bridge' },
  { title: 'Volume Master', answer: 'data' },

  // Lab 20: Postfix & Dovecot
  { title: 'Dovecot Config', answer: 'imap' },
  { title: 'Postfix main.cf', answer: 'mail.example.com' },
  { title: 'TLS Certificate', answer: '/etc/ssl/certs/mail.pem' },
  { title: 'Mail Delivery Test', answer: 'Mail queue is empty' },
  { title: 'Port Configuration', answer: '993' },

  // Lab 21: Git & Gitea
  { title: 'Branch Master', answer: 'feature/login' },
  { title: 'Gitea Deployer', answer: 'Up' },
  { title: 'Repo Creator', answer: 'test-project' },
  { title: 'Hook Engineer', answer: 'pre-push hook executed' },
  { title: 'Conflict Resolver', answer: '3' },

  // Lab 22: Ansible
  { title: 'Inventory Master', answer: '3' },
  { title: 'Playbook Writer', answer: '0' },
  { title: 'Role Builder', answer: 'main.yml' },
  { title: 'Vault Keeper', answer: 'Vault password:' },
  { title: 'Backup Script', answer: 'backup_' },

  // Lab 23: Prometheus & Grafana
  { title: 'PromQL Query', answer: '1' },
  { title: 'prometheus.yml Config', answer: '15s' },
  { title: 'Scrape Targets', answer: '1' },
  { title: 'Alert Rules', answer: '1' },
  { title: 'Grafana Dashboard JSON', answer: 'Node Exporter Full' },

  // Lab 24: Kali Recon
  { title: 'Port Scanner', answer: '2' },
  { title: 'Service Detector', answer: 'OpenSSH' },
  { title: 'DNS Enumerator', answer: 'A' },
  { title: 'Script Kiddie', answer: 'Apache' },
  { title: 'OSINT Collector', answer: '10' },

  // Lab 25: Linux Kernel
  { title: 'Kernel Identifier', answer: '5.10.0' },
  { title: 'Memory Analyst', answer: '1' },
  { title: 'Module Inspector', answer: '1' },
  { title: 'Proc Reader', answer: 'QEMU' },
  { title: 'Sysctl Tuner', answer: '0' },

  // Lab 26: OpenSCAP
  { title: 'Profile Name', answer: 'xccdf_org.ssgproject.content_profile_cis' },
  { title: 'CVE Counts', answer: '0' },
  { title: 'Compliance Score', answer: '50' },
  { title: 'OpenSCAP Scan Results', answer: '100' },
  { title: 'Remediation Status', answer: '0' },

  // Lab 27: ModSecurity
  { title: 'CRS Activation', answer: 'On' },
  { title: 'modsecurity.conf Settings', answer: 'DetectionOnly' },
  { title: 'Custom Rule Syntax', answer: 'SecRule' },
  { title: 'SQL Injection Test', answer: '403' },
  { title: 'XSS Rule ID', answer: '941100' },

  // Lab 30: Kali Vuln Scanning
  { title: 'DB Connected', answer: 'online' },
  { title: 'Exploit Finder', answer: 'exploits/multi/' },
  { title: 'Module Master', answer: 'SSH' },
  { title: 'Payload Crafter', answer: 'ELF' },
  { title: 'Script Writer', answer: '0' },

  // Lab 31: Kubernetes
  { title: 'kubectl get nodes', answer: '1' },
  { title: 'Calico Status', answer: 'Running' },
  { title: 'Pod Status', answer: '1' },
  { title: 'Service ClusterIP', answer: '10.96.' },
  { title: 'Container Runtime', answer: 'docker' },

  // Lab 32: Network Security
  { title: 'Firewall Builder', answer: 'DROP' },
  { title: 'VPN Engineer', answer: 'server.conf' },
  { title: 'IDS Architect', answer: 'snort' },
  { title: 'Packet Analyst', answer: 'capture.pcap' },
  { title: 'nftables Pro', answer: 'blocked_ips' },

  // Lab 33: Kernel Debugging
  { title: 'strace Output Patterns', answer: '1' },
  { title: 'perf stat Results', answer: '1' },
  { title: 'ltrace Output', answer: '1' },
  { title: '/proc/[pid]/status Fields', answer: 'sleeping' },
  { title: 'Flame Graph Title', answer: 'Flame Graph' },

  // Lab 34: System Hardening
  { title: 'Lynis Scanner', answer: '50' },
  { title: 'AIDE Initialized', answer: 'AIDE initialized' },
  { title: 'CIS Compliant', answer: 'no' },
  { title: 'Audit Watcher', answer: '/etc/passwd' },
  { title: 'Report Generator', answer: '10' },

  // Lab 35: Metasploitable
  { title: 'Target Found', answer: '1' },
  { title: 'Service Enumerator', answer: '1' },
  { title: 'vsftpd Exploit', answer: 'uid=0(root)' },
  { title: 'Meterpreter Session', answer: 'Linux' },
  { title: 'Hash Dumper', answer: '0' },

  // Lab 12: HAProxy
  { title: 'haproxy.cfg Frontend', answer: '0.0.0.0:80' },
  { title: 'haproxy.cfg Backend', answer: '3' },
  { title: 'VIP Address', answer: '192.168.1.100' },
  { title: 'keepalived.conf VRRP Script', answer: '2' },
  { title: 'Health Check Type', answer: 'httpchk' },

  // Lab: Parrot Security
  { title: 'Firmware Analyst', answer: 'JPEG' },
  { title: 'Metadata Hunter', answer: 'Canon' },
  { title: 'Packet Inspector', answer: '1' },
  { title: 'Chain of Custody', answer: '64' },
  { title: 'File Recoverer', answer: '1' },
];

// Lab 4 flags that need description updates (redesigned for Docker)
const descriptionUpdates = [
  { title: 'Process Hunter', newDesc: 'Run: cat /proc/1/comm. What is the name of PID 1 (init process)?' },
  { title: 'Service Architect', newDesc: 'Start the SSH service, then run: service ssh status 2>&1. Submit the full output status line.' },
  { title: 'Signal Handler', newDesc: 'Run: kill -0 1 2>&1; echo $?. What is the exit code of checking PID 1?' },
  { title: 'Systemd Master', newDesc: 'Run: service ssh status 2>&1. Does sshd show as running? Submit "is running" or "is not running".' },
  { title: 'grep Guru', newDesc: 'Run: grep -c root /etc/passwd. Submit the count of root entries.' },
];

async function generateSQL() {
  const lines = [];
  lines.push('-- =============================================');
  lines.push('-- GENERATED FLAG UPDATES');
  lines.push('-- Normalized: trim + lowercase + collapse whitespace');
  lines.push('-- =============================================');
  lines.push('');

  // Update flag descriptions
  lines.push('-- Update flag descriptions (redesigned for Docker compatibility)');
  for (const du of descriptionUpdates) {
    const escaped = du.newDesc.replace(/'/g, "''");
    const escapedTitle = du.title.replace(/'/g, "''");
    lines.push(`UPDATE "LabFlag" SET description = '${escaped}' WHERE title = '${escapedTitle}';`);
  }
  lines.push('');

  // Update flag answers
  lines.push('-- Update flag answers (verified or redesigned)');
  for (const flag of flags) {
    const normalized = normalizeAnswer(flag.answer);
    const hash = await bcrypt.hash(normalized, 10);
    const escapedTitle = flag.title.replace(/'/g, "''");
    lines.push(`UPDATE "LabFlag" SET "correctAnswer" = '${hash}' WHERE title = '${escapedTitle}';`);
  }

  console.log(lines.join('\n'));
}

generateSQL().catch(console.error);
