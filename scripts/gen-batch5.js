const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }

const labs = {
  'cf79bf69-769f-4d51-8adb-1011c9d64c4c': [
    { t: 'Package Manager', d: 'Run: yum list installed 2>/dev/null | head -3 || dnf list installed 2>/dev/null | head -3 || echo "package_manager_available". What package manager is available?', a: 'package_manager_available', p: 50 },
    { t: 'Service Control', d: 'Run: systemctl list-units --type=service 2>/dev/null | head -3 || service --status-all 2>&1 | head -3 || echo "services_listed". What services are shown?', a: 'services_listed', p: 50 },
    { t: 'SELinux Inspector', d: 'Run: getenforce 2>/dev/null || echo "selinux_not_available". What is the SELinux status?', a: 'disabled', p: 75 },
    { t: 'Firewall Manager', d: 'Run: firewall-cmd --list-all 2>/dev/null || iptables -L -n 2>/dev/null | head -3 || echo "firewall_checked". What firewall is active?', a: 'firewall_checked', p: 75 },
    { t: 'Yum Repository', d: 'Create /etc/yum.repos.d/custom.repo with [custom], name=Custom, baseurl=http://example.com/repo, enabled=1. Run: cat /etc/yum.repos.d/custom.repo | grep "name=". What is the repo name?', a: 'Custom', p: 100 },
    { t: 'Cron Master', d: 'Create cron: echo "0 2 * * * /usr/local/bin/backup.sh" | crontab -. Run: crontab -l | head -1. What is the schedule?', a: '0 2 * * * /usr/local/bin/backup.sh', p: 100 },
    { t: 'Systemd Service', d: 'Create /etc/systemd/system/myservice.service with [Service] ExecStart=/bin/echo running. Run: systemctl daemon-reload && systemctl start myservice 2>&1 || echo "service_started". What is the output?', a: 'service_started', p: 100 },
    { t: 'Journal Inspector', d: 'Run: journalctl -n 5 2>/dev/null | head -3 || echo "journal_available". Is journalctl available?', a: 'journal_available', p: 75 },
    { t: 'User Manager', d: 'Create user: useradd -m devuser && id devuser. What UID is assigned?', a: '1', p: 100 },
    { t: 'Tmpfiles Creator', d: 'Create /etc/tmpfiles.d/custom.conf with: d /run/custom 0755 root root -. Run: cat /etc/tmpfiles.d/custom.conf | head -1. What path is created?', a: '/run/custom', p: 100 },
    { t: 'Kernel Module', d: 'Run: lsmod | head -3 | wc -l. How many kernel modules loaded (minus header)?', a: '2', p: 100 },
    { t: 'Disk Partitioner', d: 'Run: lsblk | head -3. What block devices are shown?', a: 'NAME', p: 75 },
    { t: 'Network Manager', d: 'Run: ip addr show | grep -c "inet ". How many IPv4 addresses?', a: '1', p: 100 },
    { t: 'Log Viewer', d: 'Run: tail -5 /var/log/messages 2>/dev/null || tail -5 /var/log/syslog 2>/dev/null || echo "log_viewed". What is the output?', a: 'log_viewed', p: 75 },
    { t: 'Cleanup', d: 'Run: systemctl stop myservice 2>/dev/null; echo "centos_done". What is the output?', a: 'centos_done', p: 75 },
  ],
  '83fc5040-43df-4f8a-93b9-53595004d3ae': [
    { t: 'SSH Hardener', d: 'Edit /etc/ssh/sshd_config: set PermitRootLogin no. Run: grep "PermitRootLogin" /etc/ssh/sshd_config | tail -1. What is the value?', a: 'PermitRootLogin no', p: 75 },
    { t: 'Fail2ban Config', d: 'Create /etc/fail2ban/jail.local with [sshd] enabled=true, maxretry=3. Run: cat /etc/fail2ban/jail.local | grep "maxretry". What is the value?', a: 'maxretry = 3', p: 100 },
    { t: 'UFW Firewall', d: 'Run: ufw allow 22/tcp && ufw allow 80/tcp && ufw --force enable 2>&1 | tail -1 || echo "ufw_configured". What is the output?', a: 'ufw_configured', p: 75 },
    { t: 'Password Policy', d: 'Edit /etc/login.defs: set PASS_MAX_DAYS 90. Run: grep "PASS_MAX_DAYS" /etc/login.defs | head -1. What is the value?', a: 'PASS_MAX_DAYS 90', p: 100 },
    { t: 'Audit Rules', d: 'Create /etc/audit/rules.d/custom.rules with: -w /etc/passwd -p wa -k passwd_changes. Run: cat /etc/audit/rules.d/custom.rules | grep "passwd". What file is watched?', a: '/etc/passwd', p: 100 },
    { t: 'File Integrity', d: 'Run: sha256sum /etc/passwd | awk "{print $1}" | wc -c. How many chars in the SHA256 hash?', a: '65', p: 100 },
    { t: 'Sysctl Tuner', d: 'Set: sysctl -w net.ipv4.ip_forward=0 2>/dev/null. Run: cat /proc/sys/net/ipv4/ip_forward 2>/dev/null || echo "0". What is the value?', a: '0', p: 100 },
    { t: 'User Auditor', d: 'Run: awk -F: "$3<1000{print $1}" /etc/passwd | wc -l. How many system users (UID < 1000)?', a: '1', p: 100 },
    { t: 'Sudo Config', d: 'Add to /etc/sudoers: student ALL=(ALL) NOPASSWD:ALL. Run: grep "student" /etc/sudoers | head -1. What rule is set?', a: 'student ALL=(ALL) NOPASSWD:ALL', p: 100 },
    { t: 'Cron Audit', d: 'Run: for user in $(cut -f1 -d: /etc/passwd); do crontab -u $user -l 2>/dev/null; done | wc -l. How many cron jobs across all users?', a: '0', p: 100 },
    { t: 'Log Watcher', d: 'Create /etc/logrotate.d/secure with: /var/log/secure { daily rotate 7 }. Run: cat /etc/logrotate.d/secure | grep "rotate". What number?', a: 'rotate 7', p: 100 },
    { t: 'Network Auditor', d: 'Run: ss -tlnp 2>/dev/null | head -5 | wc -l. How many listening TCP ports?', a: '5', p: 100 },
    { t: 'Process Inspector', d: 'Run: ps aux --no-headers | wc -l. How many processes running?', a: '1', p: 100 },
    { t: 'Service Auditor', d: 'Run: systemctl list-unit-files --type=service --state=enabled 2>/dev/null | head -5 | wc -l. How many enabled services (minus header)?', a: '4', p: 100 },
    { t: 'Cleanup', d: 'Run: echo "debian_done". What is the output?', a: 'debian_done', p: 75 },
  ],
  '4511f517-8fdd-49b9-8e82-7be58e87f4b9': [
    { t: 'Kernel Version', d: 'Run: uname -r. What is the kernel version?', a: '1', p: 50 },
    { t: 'Module Inspector', d: 'Run: lsmod | head -5 | wc -l. How many loaded modules (minus header)?', a: '4', p: 75 },
    { t: 'Process Explorer', d: 'Run: cat /proc/cpuinfo | grep -c "processor". How many CPUs?', a: '1', p: 75 },
    { t: 'Memory Inspector', d: 'Run: free -m | awk "/Mem:/{print $2}". How many MB total RAM?', a: '1', p: 75 },
    { t: 'Kernel Param', d: 'Run: sysctl net.ipv4.ip_forward 2>/dev/null || echo "net.ipv4.ip_forward = 0". What is the value?', a: 'net.ipv4.ip_forward = 0', p: 100 },
    { t: 'Module Loader', d: 'Run: modprobe loop 2>&1 || echo "module_loaded". Then: lsmod | grep loop | wc -l. How many loop modules?', a: '1', p: 100 },
    { t: 'Proc Inspector', d: 'Run: cat /proc/version | awk "{print $3}". What is the GCC version?', a: '1', p: 100 },
    { t: 'Interrupt Counter', d: 'Run: cat /proc/interrupts | head -5 | wc -l. How many interrupt lines?', a: '5', p: 100 },
    { t: 'Filesystem Inspector', d: 'Run: cat /proc/mounts | head -3 | wc -l. How many mounted filesystems?', a: '3', p: 100 },
    { t: 'Kernel Config', d: 'Run: cat /boot/config-$(uname -r) 2>/dev/null | grep -c "CONFIG_" || echo "0". How many kernel configs?', a: '0', p: 100 },
    { t: 'Sysrq Inspector', d: 'Run: cat /proc/sys/kernel/sysrq 2>/dev/null || echo "0". Is SysRq enabled?', a: '0', p: 100 },
    { t: 'Load Average', d: 'Run: uptime | awk -F"load average:" "{print $2}" | awk -F, "{print $1}". What is the 1-min load average?', a: '1', p: 100 },
    { t: 'Block Devices', d: 'Run: lsblk -d | head -3. What device names are shown?', a: 'NAME', p: 100 },
    { t: 'Network Stats', d: 'Run: cat /proc/net/dev | head -3 | wc -l. How many network interfaces?', a: '3', p: 100 },
    { t: 'Kernel Module Info', d: 'Run: modinfo loop 2>/dev/null | head -3 | wc -l || echo "0". How many info lines for loop module?', a: '3', p: 100 },
  ],
};

const lines = [];
for (const [labId, flags] of Object.entries(labs)) {
  for (const f of flags) {
    const id = crypto.randomUUID();
    lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${labId}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
  }
}
console.log(lines.join('\n'));
