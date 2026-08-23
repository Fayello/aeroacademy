const crypto = require('crypto');
const bcrypt = require('bcrypt');

const labs = [
  {
    id: 'c211f80d-bba0-4d2b-9004-5958c731a6b6',
    name: 'ModSecurity WAF',
    slug: 'modsecurity-waf',
    description: 'Web Application Firewall with ModSecurity and Nginx',
    flags: [
      {
        question: 'Install modsecurity-nginx connector: apt install libmodsecurity-dev. Run: nginx -V 2>&1 | grep -o modsecurity. What module name is shown?',
        hint: 'apt install libmodsecurity-dev && nginx -V 2>&1 | grep -o modsecurity',
        answer: 'apt install libmodsecurity-dev',
        value: 'MODSECURITY_INSTALLED'
      },
      {
        question: 'Enable OWASP Core Rule Set: clone the CRS repo into /etc/nginx/modsecurity/. Run: ls /etc/nginx/modsecurity/owasp-crs/rules/ | head -5. How many rule files are listed?',
        hint: 'git clone https://github.com/coreruleset/coreruleset /etc/nginx/modsecurity/owasp-crs && ls /etc/nginx/modsecurity/owasp-crs/rules/ | head -5',
        answer: 'git clone https://github.com/coreruleset/coreruleset /etc/nginx/modsecurity/owasp-crs',
        value: 'OWASP_CRS_ENABLED'
      },
      {
        question: 'Test SQL injection detection: curl -s -o /dev/null -w "%{http_code}" "http://localhost/?id=1%27%20OR%201=1--". What HTTP status code is returned?',
        hint: 'curl -s -o /dev/null -w "%{http_code}" "http://localhost/?id=1%27%20OR%201=1--"',
        answer: 'curl -s -o /dev/null -w "%{http_code}" "http://localhost/?id=1%27%20OR%201=1--"',
        value: 'SQLI_DETECTED'
      },
      {
        question: 'Test XSS detection: curl -s -o /dev/null -w "%{http_code}" "http://localhost/?q=<script>alert(1)</script>". What HTTP status code is returned?',
        hint: 'curl -s -o /dev/null -w "%{http_code}" "http://localhost/?q=<script>alert(1)</script>"',
        answer: 'curl -s -o /dev/null -w "%{http_code}" "http://localhost/?q=<script>alert(1)</script>"',
        value: 'XSS_DETECTED'
      },
      {
        question: 'View ModSecurity audit logs: tail -30 /var/log/modsec_audit.log. What event IDs are visible in the log output?',
        hint: 'tail -30 /var/log/modsec_audit.log',
        answer: 'tail -30 /var/log/modsec_audit.log',
        value: 'AUDIT_LOGS_VIEWED'
      },
      {
        question: 'Configure a custom rule to block the /admin path: add SecRule REQUEST_URI to deny requests beginning with /admin in modsecurity.conf. Run: nginx -t. What output does the config test produce?',
        hint: 'Add SecRule REQUEST_URI deny /admin in modsecurity.conf and run nginx -t',
        answer: 'nginx -t',
        value: 'CUSTOM_RULE_CONFIGURED'
      },
      {
        question: 'Set up rule exclusion for rule 941100: add SecRuleRemoveById 941100 to a custom config file in /etc/nginx/modsecurity/. Run: nginx -t. What is the test result?',
        hint: 'Add SecRuleRemoveById 941100 to exclusion file and run nginx -t',
        answer: 'SecRuleRemoveById 941100',
        value: 'RULE_EXCLUSION_SET'
      },
      {
        question: 'Check blocked request counts: grep -c "Access denied" /var/log/modsec_audit.log. How many blocked requests appear in the log?',
        hint: 'grep -c "Access denied" /var/log/modsec_audit.log',
        answer: 'grep -c "Access denied" /var/log/modsec_audit.log',
        value: 'BLOCKED_REQUESTS_COUNTED'
      },
      {
        question: 'Configure paranoia level: set SecRuleEngine On and SecPcreMatchLimit 100000 in modsecurity.conf. Run: nginx -t && curl -s -o /dev/null -w "%{http_code}" http://localhost/. What status code is returned?',
        hint: 'Set SecRuleEngine On and SecPcreMatchLimit 100000 then run nginx -t',
        answer: 'SecRuleEngine On',
        value: 'PARANOIA_LEVEL_CONFIGURED'
      }
    ]
  },
  {
    id: '1de4f6e8-cea4-4770-a4f0-a37fd6303941',
    name: 'Kali Recon and OSINT',
    slug: 'kali-recon-osint',
    description: 'Reconnaissance and OSINT tools on Kali Linux',
    flags: [
      {
        question: 'Run nmap scan on localhost: nmap -sV localhost 2>&1 | head -20. How many open ports are detected?',
        hint: 'nmap -sV localhost 2>&1 | head -20',
        answer: 'nmap -sV localhost',
        value: 'NMAP_LOCALHOST_SCAN'
      },
      {
        question: 'Use whois on a domain: whois example.com 2>&1 | grep -i "registrar". What registrar information is shown?',
        hint: 'whois example.com 2>&1 | grep -i "registrar"',
        answer: 'whois example.com',
        value: 'WHOIS_DOMAIN_LOOKUP'
      },
      {
        question: 'Run dig for DNS records: dig example.com ANY +short 2>&1 | head -10. What record types are returned?',
        hint: 'dig example.com ANY +short 2>&1 | head -10',
        answer: 'dig example.com ANY +short',
        value: 'DIG_DNS_RECORDS'
      },
      {
        question: 'Use nikto basic scan: nikto -h http://localhost 2>&1 | head -30. How many vulnerabilities does nikto identify?',
        hint: 'nikto -h http://localhost 2>&1 | head -30',
        answer: 'nikto -h http://localhost',
        value: 'NIKTO_BASIC_SCAN'
      },
      {
        question: 'Run directory enumeration: dirb http://localhost /usr/share/wordlists/dirb/common.txt 2>&1 | tail -20. How many directories are found?',
        hint: 'dirb http://localhost /usr/share/wordlists/dirb/common.txt 2>&1 | tail -20',
        answer: 'dirb http://localhost /usr/share/wordlists/dirb/common.txt',
        value: 'DIRB_ENUMERATION'
      },
      {
        question: 'Use whatweb to identify technologies: whatweb http://localhost 2>&1 | head -5. What technologies are detected on the target?',
        hint: 'whatweb http://localhost 2>&1 | head -5',
        answer: 'whatweb http://localhost',
        value: 'WHATWEB_TECH_DETECTION'
      },
      {
        question: 'Run subfinder for subdomains: subfinder -d example.com -silent 2>&1 | head -10. How many subdomains are discovered?',
        hint: 'subfinder -d example.com -silent 2>&1 | head -10',
        answer: 'subfinder -d example.com -silent',
        value: 'SUBFINDER_ENUMERATION'
      },
      {
        question: 'Use httpx to probe web servers: echo "http://localhost" | httpx -silent -status-code 2>&1. What HTTP status code is returned?',
        hint: 'echo "http://localhost" | httpx -silent -status-code 2>&1',
        answer: 'echo "http://localhost" | httpx -silent -status-code',
        value: 'HTTPX_PROBE'
      },
      {
        question: 'Run amass for OSINT: amass enum -passive -d example.com 2>&1 | head -10. How many assets does amass enumerate?',
        hint: 'amass enum -passive -d example.com 2>&1 | head -10',
        answer: 'amass enum -passive -d example.com',
        value: 'AMASS_OSINT'
      }
    ]
  },
  {
    id: '2984df50-7e04-45a3-b5c1-05c5769d13ec',
    name: 'Kali Exploitation',
    slug: 'kali-exploitation',
    description: 'Exploitation and penetration testing tools on Kali Linux',
    flags: [
      {
        question: 'Run metasploit console: msfconsole -q -x "show exploits; exit" 2>&1 | head -20. How many exploit modules are listed?',
        hint: 'msfconsole -q -x "show exploits; exit" 2>&1 | head -20',
        answer: 'msfconsole -q -x "show exploits; exit"',
        value: 'MSFCONSOLE_STARTED'
      },
      {
        question: 'Search for exploits with msfconsole: msfconsole -q -x "search eternalblue; exit" 2>&1 | head -15. How many matching modules are found?',
        hint: 'msfconsole -q -x "search eternalblue; exit" 2>&1 | head -15',
        answer: 'msfconsole -q -x "search eternalblue; exit"',
        value: 'MSFCONSOLE_SEARCH'
      },
      {
        question: 'Use searchsploit: searchsploit apache 2.4 2>&1 | head -20. How many exploits are listed for Apache?',
        hint: 'searchsploit apache 2.4 2>&1 | head -20',
        answer: 'searchsploit apache 2.4',
        value: 'SEARCHSPLOIT_USED'
      },
      {
        question: 'Run hydra for brute force: hydra -l admin -P /usr/share/wordlists/rockyou.txt ftp://localhost -t 4 -f 2>&1 | tail -10. What credential is found?',
        hint: 'hydra -l admin -P /usr/share/wordlists/rockyou.txt ftp://localhost -t 4 -f 2>&1 | tail -10',
        answer: 'hydra -l admin -P /usr/share/wordlists/rockyou.txt ftp://localhost -t 4 -f',
        value: 'HYDRA_BRUTE_FORCE'
      },
      {
        question: 'Use sqlmap for SQL injection: sqlmap -u "http://localhost/?id=1" --batch --dbs 2>&1 | head -30. What databases are discovered?',
        hint: 'sqlmap -u "http://localhost/?id=1" --batch --dbs 2>&1 | head -30',
        answer: 'sqlmap -u "http://localhost/?id=1" --batch --dbs',
        value: 'SQLMAP_INJECTION'
      },
      {
        question: 'Run john the ripper on a hash: write an md5 hash to /tmp/hash.txt and run john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt. What password does john crack?',
        hint: 'echo "5f4dcc3b5aa765d61d8327deb882cf99" > /tmp/hash.txt && john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt /tmp/hash.txt',
        answer: 'john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt /tmp/hash.txt',
        value: 'JOHN_CRACKED_HASH'
      },
      {
        question: 'Use hashcat to crack an MD5 hash: hashcat -m 0 -a 0 /tmp/hash.txt /usr/share/wordlists/rockyou.txt --show. What is the cracked hash and password pair?',
        hint: 'hashcat -m 0 -a 0 /tmp/hash.txt /usr/share/wordlists/rockyou.txt --show',
        answer: 'hashcat -m 0 -a 0 /tmp/hash.txt /usr/share/wordlists/rockyou.txt --show',
        value: 'HASHCAT_MODE_USED'
      },
      {
        question: 'Run responder for network poisoning: responder -I eth0 -wrf 2>&1 | head -20. What interfaces and protocols does responder listen on?',
        hint: 'responder -I eth0 -wrf 2>&1 | head -20',
        answer: 'responder -I eth0 -wrf',
        value: 'RESPONDER_RUNNING'
      },
      {
        question: 'Use impacket smbclient to list shares: impacket-smbclient localhost/share -U guest -N 2>&1 | head -10. What shares are accessible via SMB?',
        hint: 'impacket-smbclient localhost/share -U guest -N 2>&1 | head -10',
        answer: 'impacket-smbclient localhost/share -U guest -N',
        value: 'IMPACKET_SMBCLIENT_USED'
      }
    ]
  },
  {
    id: '45dfba8f-3775-4595-b47f-8b8654beb43f',
    name: 'Parrot Security',
    slug: 'parrot-security',
    description: 'Security testing tools on Parrot Security OS',
    flags: [
      {
        question: 'Check installed security tools: apt list --installed 2>&1 | grep -E "aircrack|burp|john|ettercap" | head -10. How many security tools are installed?',
        hint: 'apt list --installed 2>&1 | grep -E "aircrack|burp|john|ettercap" | head -10',
        answer: 'apt list --installed',
        value: 'TOOLS_CHECKED'
      },
      {
        question: 'Run aircrack-ng for wireless analysis: aircrack-ng --help 2>&1 | head -15. What attack modes does aircrack support?',
        hint: 'aircrack-ng --help 2>&1 | head -15',
        answer: 'aircrack-ng --help',
        value: 'AIRCRACK_NG_HELP'
      },
      {
        question: 'Use burpsuite from command line: burpsuite --help 2>&1 | head -10. What command line options are available?',
        hint: 'burpsuite --help 2>&1 | head -10',
        answer: 'burpsuite --help',
        value: 'BURPSUITE_CLI'
      },
      {
        question: 'Run john for password cracking: john --list=formats 2>&1 | head -20. What hash formats does john support?',
        hint: 'john --list=formats 2>&1 | head -20',
        answer: 'john --list=formats',
        value: 'JOHN_FORMATS_LISTED'
      },
      {
        question: 'Use mitmproxy: mitmproxy --version 2>&1. What version of mitmproxy is installed?',
        hint: 'mitmproxy --version 2>&1',
        answer: 'mitmproxy --version',
        value: 'MITMPROXY_VERSION'
      },
      {
        question: 'Run sslstrip test: sslstrip --help 2>&1 | head -10. What options are available in sslstrip?',
        hint: 'sslstrip --help 2>&1 | head -10',
        answer: 'sslstrip --help',
        value: 'SSLSTRIP_OPTIONS'
      },
      {
        question: 'Use Ettercap for ARP spoofing: ettercap --version 2>&1. What version of ettercap is running?',
        hint: 'ettercap --version 2>&1',
        answer: 'ettercap --version',
        value: 'ETTERCAP_VERSION'
      },
      {
        question: 'Run Wireshark and tshark capture: tshark -D 2>&1 | head -5. How many network interfaces can tshark capture on?',
        hint: 'tshark -D 2>&1 | head -5',
        answer: 'tshark -D',
        value: 'TSHARK_INTERFACES'
      },
      {
        question: 'Use netdiscover for host discovery: netdiscover -r 192.168.1.0/24 -c 5 2>&1 | head -10. How many hosts are discovered on the network?',
        hint: 'netdiscover -r 192.168.1.0/24 -c 5 2>&1 | head -10',
        answer: 'netdiscover -r 192.168.1.0/24 -c 5',
        value: 'NETDISCOVER_HOSTS'
      }
    ]
  },
  {
    id: '869c9fbc-601d-460d-8ef1-fcac9a62d08a',
    name: 'Metasploitable',
    slug: 'metasploitable',
    description: 'Exploiting vulnerable services on Metasploitable',
    flags: [
      {
        question: 'Nmap scan the target for open ports: nmap -sV -p- 192.168.1.100 2>&1 | head -30. How many open ports are found on the target?',
        hint: 'nmap -sV -p- 192.168.1.100 2>&1 | head -30',
        answer: 'nmap -sV -p- 192.168.1.100',
        value: 'NMAP_METASPLOITABLE_SCAN'
      },
      {
        question: 'Identify vsftpd backdoor: nmap -sV -p 21 192.168.1.100 2>&1 | grep ftp. What version of vsftpd is running?',
        hint: 'nmap -sV -p 21 192.168.1.100 2>&1 | grep ftp',
        answer: 'nmap -sV -p 21 192.168.1.100',
        value: 'VSFTPD_BACKDOOR_IDENTIFIED'
      },
      {
        question: 'Exploit Tomato CMS: use msfconsole to search for tomato and note the exploit modules. Run: msfconsole -q -x "search tomato; exit" 2>&1 | head -10. What exploit modules are found?',
        hint: 'msfconsole -q -x "search tomato; exit" 2>&1 | head -10',
        answer: 'msfconsole -q -x "search tomato; exit"',
        value: 'TOMATO_CMS_EXPLOITED'
      },
      {
        question: 'Find and exploit vulnerable web apps: curl -s http://192.168.1.100:8080/ 2>&1 | head -20. What web application is running on port 8080?',
        hint: 'curl -s http://192.168.1.100:8080/ 2>&1 | head -20',
        answer: 'curl -s http://192.168.1.100:8080/',
        value: 'WEB_APPS_FOUND'
      },
      {
        question: 'Use enum4linux for Samba enumeration: enum4linux -a 192.168.1.100 2>&1 | head -30. What shares and users are discovered?',
        hint: 'enum4linux -a 192.168.1.100 2>&1 | head -30',
        answer: 'enum4linux -a 192.168.1.100',
        value: 'ENUM4LINUX_SAMBA_ENUM'
      },
      {
        question: 'Check for anonymous FTP access: echo "user anonymous anonymous" | ftp 192.168.1.100 2>&1 | head -10. Does anonymous login succeed?',
        hint: 'echo "user anonymous anonymous" | ftp 192.168.1.100 2>&1 | head -10',
        answer: 'echo "user anonymous anonymous" | ftp 192.168.1.100',
        value: 'ANONYMOUS_FTP_CHECKED'
      },
      {
        question: 'Run nikto against the target: nikto -h 192.168.1.100 2>&1 | head -30. How many vulnerabilities does nikto report?',
        hint: 'nikto -h 192.168.1.100 2>&1 | head -30',
        answer: 'nikto -h 192.168.1.100',
        value: 'NIKTO_METASPLOITABLE_SCAN'
      },
      {
        question: 'Exploit UnrealIRCd backdoor: search for unreal ircd in msfconsole and note the backdoor module. Run: msfconsole -q -x "search unreal ircd; exit" 2>&1 | head -10. What exploit module is found?',
        hint: 'msfconsole -q -x "search unreal ircd; exit" 2>&1 | head -10',
        answer: 'msfconsole -q -x "search unreal ircd; exit"',
        value: 'UNREALIRC_BACKDOOR_FOUND'
      },
      {
        question: 'Find database credentials: enum4linux -a 192.168.1.100 2>&1 | grep -i mysql. What MySQL related information is discovered?',
        hint: 'enum4linux -a 192.168.1.100 2>&1 | grep -i mysql',
        answer: 'enum4linux -a 192.168.1.100',
        value: 'DATABASE_CREDENTIALS_FOUND'
      }
    ]
  }
];

function validateDescription(desc, labName, flagQuestion) {
  if (desc.includes("'")) {
    throw new Error(`Single quote found in description for [${labName}] ${flagQuestion}`);
  }
  if (desc.includes('\\')) {
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
  const labInsert = `INSERT INTO "Lab" ("id", "name", "slug", "description", "createdAt", "updatedAt") VALUES ('${lab.id}', '${lab.name}', '${lab.slug}', '${lab.description}', NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;`;
  console.log(labInsert);

  for (let i = 0; i < lab.flags.length; i++) {
    const flag = lab.flags[i];
    const flagId = crypto.randomUUID();
    const hash = hashAnswer(flag.answer);

    const insert = `INSERT INTO "Flag" ("id", "labId", "position", "question", "hint", "answerHash", "value", "points", "createdAt", "updatedAt") VALUES ('${flagId}', '${lab.id}', ${i + 1}, '${flag.question.replace(/'/g, "''")}', '${flag.hint.replace(/'/g, "''")}', '${hash}', '${flag.value}', ${(i + 1) * 10}, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;`;
    console.log(insert);
  }
}
