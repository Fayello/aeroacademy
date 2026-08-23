const crypto = require('crypto');
const bcrypt = require('bcrypt');

const labs = [
  {
    id: 'd12ded91-4d15-4344-97ad-6cfdb666b74c',
    name: 'HA/Keepalived',
    slug: 'ha-keepalived',
    description: 'High Availability with Keepalived and HAProxy',
    flags: [
      {
        question: 'Install keepalived and check the default config',
        hint: 'apt install keepalived && cat /etc/keepalived/keepalived.conf',
        answer: 'apt install keepalived',
        value: 'KEEPALIVED_INSTALLED'
      },
      {
        question: 'Create a VRRP instance in keepalived.conf',
        hint: 'Edit keepalived.conf and add a vrrp_instance block',
        answer: 'vrrp_instance VI_1',
        value: 'VRRP_INSTANCE_CREATED'
      },
      {
        question: 'Configure a virtual IP address in the VRRP instance',
        hint: 'Set virtual_ipaddress to 192.168.1.100/24 in keepalived.conf',
        answer: '192.168.1.100/24',
        value: 'VIRTUAL_IP_CONFIGURED'
      },
      {
        question: 'Set up a health check script for the service',
        hint: 'Add a track_script block referencing a check script in keepalived.conf',
        answer: 'track_script',
        value: 'HEALTH_CHECK_SCRIPT'
      },
      {
        question: 'Install and configure HAProxy as the load balancer',
        hint: 'apt install haproxy && cat /etc/haproxy/haproxy.cfg | head -10',
        answer: 'apt install haproxy',
        value: 'HAPROXY_INSTALLED'
      },
      {
        question: 'Configure backend server entries in HAProxy',
        hint: 'Add server lines under the backend section of haproxy.cfg',
        answer: 'server web1 127.0.0.1:8080',
        value: 'BACKEND_SERVERS_CONFIGURED'
      },
      {
        question: 'Enable sticky sessions in HAProxy configuration',
        hint: 'Add cookie-based stickiness to the HAProxy frontend or backend',
        answer: 'cookie SERVERID insert indirect nocache',
        value: 'STICKY_SESSIONS_ENABLED'
      },
      {
        question: 'Test failover by stopping keepalived on one node',
        hint: 'systemctl stop keepalived && ip addr show eth0 | grep 192.168.1.100',
        answer: 'systemctl stop keepalived',
        value: 'FAILOVER_TESTED'
      },
      {
        question: 'Check keepalived logs for VRRP state transitions',
        hint: 'grep VRRP /var/log/syslog | tail -20',
        answer: 'grep VRRP /var/log/syslog',
        value: 'KEEPALIVED_LOGS_CHECKED'
      }
    ]
  },
  {
    id: '7bc1ef0e-30a3-4d97-84ce-e7cfc60f421e',
    name: 'Mail Server Postfix',
    slug: 'mail-server-postfix',
    description: 'Postfix mail server setup and configuration',
    flags: [
      {
        question: 'Install Postfix and inspect the main.cf file',
        hint: 'apt install postfix && cat /etc/postfix/main.cf | head -10',
        answer: 'apt install postfix',
        value: 'POSTFIX_INSTALLED'
      },
      {
        question: 'Set the hostname in Postfix main.cf',
        hint: 'Check the myhostname parameter in /etc/postfix/main.cf',
        answer: 'myhostname',
        value: 'HOSTNAME_CONFIGURED'
      },
      {
        question: 'Create a mailbox user with adduser',
        hint: 'Run: adduser testuser and set a password',
        answer: 'adduser testuser',
        value: 'MAILBOX_USER_CREATED'
      },
      {
        question: 'Send a test email using the mail command',
        hint: 'Run: echo "test" | mail -s "Test" testuser',
        answer: 'echo "test" | mail -s "Test" testuser',
        value: 'TEST_MAIL_SENT'
      },
      {
        question: 'Check the mail queue with postqueue',
        hint: 'Run: postqueue -p to see queued messages',
        answer: 'postqueue -p',
        value: 'MAIL_QUEUE_CHECKED'
      },
      {
        question: 'Install and configure Dovecot for IMAP access',
        hint: 'apt install dovecot-imapd && cat /etc/dovecot/dovecot.conf | head -5',
        answer: 'apt install dovecot-imapd',
        value: 'DOVECOT_CONFIGURED'
      },
      {
        question: 'Read mail logs to verify delivery',
        hint: 'Run: tail -20 /var/log/mail.log',
        answer: 'tail -20 /var/log/mail.log',
        value: 'MAIL_LOGS_READ'
      },
      {
        question: 'Set up mail aliases in /etc/aliases',
        hint: 'Add: testalias: testuser to /etc/aliases and run newaliases',
        answer: 'testalias: testuser',
        value: 'ALIASES_CONFIGURED'
      },
      {
        question: 'Configure Postfix as a relay host',
        hint: 'Set relayhost parameter in /etc/postfix/main.cf',
        answer: 'relayhost',
        value: 'RELAY_HOST_CONFIGURED'
      }
    ]
  },
  {
    id: '5e42dba4-6d8a-4889-9a53-97e3511e0ebc',
    name: 'Kernel Debugging',
    slug: 'kernel-debugging',
    description: 'Linux kernel inspection and debugging techniques',
    flags: [
      {
        question: 'Read the kernel version from /proc/version',
        hint: 'Run: cat /proc/version',
        answer: 'cat /proc/version',
        value: 'PROC_VERSION_READ'
      },
      {
        question: 'Use dmesg to find recent kernel messages',
        hint: 'Run: dmesg | tail -20',
        answer: 'dmesg | tail -20',
        value: 'DMESG_READ'
      },
      {
        question: 'Check currently loaded kernel modules',
        hint: 'Run: lsmod | head -10',
        answer: 'lsmod',
        value: 'LSMOD_CHECKED'
      },
      {
        question: 'Read the interrupts file to see hardware IRQ activity',
        hint: 'Run: cat /proc/interrupts | head -5',
        answer: 'cat /proc/interrupts',
        value: 'INTERRUPTS_READ'
      },
      {
        question: 'Use strace to trace system calls of a command',
        hint: 'Run: strace ls /tmp 2>&1 | head -20',
        answer: 'strace ls /tmp',
        value: 'STRACE_USED'
      },
      {
        question: 'Browse kernel parameters under /proc/sys',
        hint: 'Run: ls /proc/sys/kernel/ | head -10',
        answer: 'ls /proc/sys/kernel/',
        value: 'KERNEL_PARAMS_CHECKED'
      },
      {
        question: 'Read CPU information from /proc/cpuinfo',
        hint: 'Run: cat /proc/cpuinfo | grep "model name" | head -1',
        answer: 'cat /proc/cpuinfo',
        value: 'CPUINFO_READ'
      },
      {
        question: 'Use perf stat to profile a simple command',
        hint: 'Run: perf stat ls 2>&1 | head -10',
        answer: 'perf stat ls',
        value: 'PERF_STAT_USED'
      },
      {
        question: 'Check memory information from /proc/meminfo',
        hint: 'Run: cat /proc/meminfo | head -5',
        answer: 'cat /proc/meminfo',
        value: 'MEMINFO_CHECKED'
      }
    ]
  },
  {
    id: '419473fc-4546-42cc-bf9b-171641b05521',
    name: 'OpenSCAP',
    slug: 'openscap',
    description: 'OpenSCAP security compliance scanning and reporting',
    flags: [
      {
        question: 'Install the openscap-scanner package',
        hint: 'Run: apt install openscap-scanner',
        answer: 'apt install openscap-scanner',
        value: 'OPENSCAP_INSTALLED'
      },
      {
        question: 'List available SCAP profiles on the system',
        hint: 'Run: oscap info /usr/share/xml/scap/ssg/content/ssg-ubuntu2204-ds.xml',
        answer: 'oscap info /usr/share/xml/scap/ssg/content/ssg-ubuntu2204-ds.xml',
        value: 'SCAP_PROFILES_LISTED'
      },
      {
        question: 'Run an XCCDF evaluation against a profile',
        hint: 'Run: oscap xccdf eval --profile standard --results results.xml /usr/share/xml/scap/ssg/content/ssg-ubuntu2204-ds.xml',
        answer: 'oscap xccdf eval',
        value: 'XCCDF_EVAL_RUN'
      },
      {
        question: 'Read the scan results XML file',
        hint: 'Run: head -20 results.xml',
        answer: 'head -20 results.xml',
        value: 'SCAN_RESULTS_READ'
      },
      {
        question: 'Check results for a specific CCE identifier',
        hint: 'Run: grep CCE results.xml | head -5',
        answer: 'grep CCE results.xml',
        value: 'CCE_CHECKED'
      },
      {
        question: 'View the compliance summary from scan results',
        hint: 'Run: oscap info results.xml | grep "Score"',
        answer: 'oscap info results.xml',
        value: 'COMPLIANCE_VIEWED'
      },
      {
        question: 'Run an OVAL evaluation for a specific definition',
        hint: 'Run: oscap oval eval --results oval-results.xml /usr/share/xml/scap/ssg/content/ssg-ubuntu2204-oval.xml',
        answer: 'oscap oval eval',
        value: 'OVAL_EVAL_RUN'
      },
      {
        question: 'Check available remediation scripts',
        hint: 'Run: oscap xccdf generate fix --profile standard /usr/share/xml/scap/ssg/content/ssg-ubuntu2204-ds.xml | head -20',
        answer: 'oscap xccdf generate fix',
        value: 'REMEDIATION_CHECKED'
      },
      {
        question: 'Generate an HTML compliance report',
        hint: 'Run: oscap xccdf generate report results.xml > report.html',
        answer: 'oscap xccdf generate report',
        value: 'HTML_REPORT_GENERATED'
      }
    ]
  },
  {
    id: 'ade24958-3672-4cf3-83d8-c9ebb02742ab',
    name: 'CIS Benchmarks',
    slug: 'cis-benchmarks',
    description: 'CIS benchmark compliance checks and hardening',
    flags: [
      {
        question: 'Check password aging policy for a user',
        hint: 'Run: chage -l root',
        answer: 'chage -l root',
        value: 'PASSWORD_AGING_CHECKED'
      },
      {
        question: 'Verify the default umask setting',
        hint: 'Run: umask',
        answer: 'umask',
        value: 'UMASK_VERIFIED'
      },
      {
        question: 'Find SUID binaries on the filesystem',
        hint: 'Run: find / -perm -4000 -type f 2>/dev/null | head -10',
        answer: 'find / -perm -4000 -type f',
        value: 'SUID_BINARIES_FOUND'
      },
      {
        question: 'Verify SSH configuration settings',
        hint: 'Run: grep -E "^(PermitRootLogin|PasswordAuthentication)" /etc/ssh/sshd_config',
        answer: 'grep -E "^(PermitRootLogin|PasswordAuthentication)" /etc/ssh/sshd_config',
        value: 'SSH_CONFIG_CHECKED'
      },
      {
        question: 'Check filesystem mount options for security',
        hint: 'Run: mount | grep -E "nosuid|noexec|nodev"',
        answer: 'mount | grep -E "nosuid|noexec|nodev"',
        value: 'MOUNT_OPTIONS_CHECKED'
      },
      {
        question: 'Review permissions on cron directories',
        hint: 'Run: ls -la /etc/cron.d/',
        answer: 'ls -la /etc/cron.d/',
        value: 'CRON_PERMISSIONS_REVIEWED'
      },
      {
        question: 'Check kernel sysctl security hardening parameters',
        hint: 'Run: sysctl net.ipv4.ip_forward net.ipv4.conf.all.send_redirects',
        answer: 'sysctl net.ipv4.ip_forward net.ipv4.conf.all.send_redirects',
        value: 'SYSCTL_HARDENING_CHECKED'
      },
      {
        question: 'Verify audit rules are in place',
        hint: 'Run: auditctl -l 2>&1 | head -10',
        answer: 'auditctl -l',
        value: 'AUDIT_RULES_VERIFIED'
      },
      {
        question: 'Find world-writable files on the system',
        hint: 'Run: find / -xdev -type f -perm -0002 2>/dev/null | head -10',
        answer: 'find / -xdev -type f -perm -0002',
        value: 'WORLD_WRITABLE_FILES_FOUND'
      }
    ]
  }
];

// Validation: no single quotes or backslashes in descriptions
function validateDescription(desc, labName, flagQuestion) {
  if (desc.includes("'")) {
    throw new Error(`Single quote found in description for [${labName}] ${flagQuestion}`);
  }
  if (desc.includes("\\")) {
    throw new Error(`Backslash found in description for [${labName}] ${flagQuestion}`);
  }
}

for (const lab of labs) {
  for (const flag of lab.flags) {
    validateDescription(flag.question, lab.name, flag.question);
  }
}

function hashAnswer(answer) {
  return bcrypt.hashSync(
    answer.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(),
    10
  );
}

for (const lab of labs) {
  // Lab INSERT
  const labInsert = `INSERT INTO "Lab" ("id", "name", "slug", "description", "createdAt", "updatedAt") VALUES ('${lab.id}', '${lab.name}', '${lab.slug}', '${lab.description}', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;`;
  console.log(labInsert);

  // Flag INSERTs
  for (let i = 0; i < lab.flags.length; i++) {
    const flag = lab.flags[i];
    const flagId = crypto.randomUUID();
    const hash = hashAnswer(flag.answer);

    const insert = `INSERT INTO "Flag" ("id", "labId", "position", "question", "hint", "answerHash", "value", "points", "createdAt", "updatedAt") VALUES ('${flagId}', '${lab.id}', ${i + 1}, '${flag.question}', '${flag.hint}', '${hash}', '${flag.value}', ${(i + 1) * 10}, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;`;
    console.log(insert);
  }
}
