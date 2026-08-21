const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }

const fixes = [
  // Lab 1 - DiskSpaceExpert: df -h / shows "/" not "overlay" in newer ubuntu
  { title: 'Disk Space Expert', newDesc: 'Run df -h / | tail -1. What is the mount point (last column)?', newAnswer: '/', lab: 'Linux Fundamentals: Ubuntu CLI Mastery' },

  // Lab 1 - GlobMaster: test proved 5 is correct
  // Lab 1 - HiddenFinder: test proved 0 is correct
  // Lab 1 - EnvDetective: test proved 6 is correct
  // Lab 1 - DirBuilder: test proved 2 is correct

  // Lab 2 - ACLMaster: setfacl not available, need to install acl package
  { title: 'ACL Master', newDesc: 'First install ACL support: apt-get update && apt-get install -y acl. Then create /home/student/hello.txt and user alice. Set ACL: setfacl -m u:alice:rwx /home/student/hello.txt. Run: getfacl /home/student/hello.txt | grep alice. What permission string?', newAnswer: 'user:alice:rwx', lab: 'Linux Fundamentals: File Permissions & Users' },

  // Lab 2 - GroupManager: need to install acl/group tools, test proved "student : student" is current
  { title: 'Group Manager', newDesc: 'Create group admin_group: groupadd admin_group. Add student to it: usermod -aG admin_group student. Run: groups student. What groups are listed?', newAnswer: 'student : student admin_group', lab: 'Linux Fundamentals: File Permissions & Users' },

  // Lab 2 - UserCreator: test showed UID 1001 not 1002 in container
  { title: 'User Creator', newDesc: 'Create user bob with home dir: useradd -m bob. Run: id -u bob. What is bob UID number?', newAnswer: '1001', lab: 'Linux Fundamentals: File Permissions & Users' },

  // Lab 2 - SUIDHunter: test showed 8 not 3
  { title: 'SUID Hunter', newDesc: 'Run: find /usr/bin -perm -4000 2>/dev/null | wc -l. How many SUID binaries exist?', newAnswer: '8', lab: 'Linux Fundamentals: File Permissions & Users' },

  // Lab 2 - UserDeleter: test showed "no such user" not "no"
  { title: 'User Deleter', newDesc: 'Create user tempuser: useradd tempuser. Then delete it: userdel tempuser. Run: id tempuser 2>&1. What is the last word of the error?', newAnswer: 'user', lab: 'Linux Fundamentals: File Permissions & Users' },

  // Lab 2 - FileAttributeExplorer: test showed "--------------e-------" not "--------------"
  { title: 'File Attribute Explorer', newDesc: 'Run: lsattr /etc/hostname 2>/dev/null. What attributes are shown before the filename?', newAnswer: '--------------e-------', lab: 'Linux Fundamentals: File Permissions & Users' },

  // Lab 2 - DiskQuotaSetup: quotaon not available
  { title: 'Disk Quota Setup', newDesc: 'Install quota tools: apt-get install -y quota. Then run: quotaon -V 2>&1 | head -1. What is the first word of the output?', newAnswer: 'quotaon', lab: 'Linux Fundamentals: File Permissions & Users' },

  // Lab 3 - CSVParser: awk was summing city strings = 0. Fix to sum ages
  { title: 'CSV Parser', newDesc: 'Create /home/student/data.csv with: name,age,city then rows Alice,25,NYC Bob,30,LA Charlie,35,SF. Run: awk -F, "NR>1{sum+=$2}END{print sum}" /home/student/data.csv. What is the sum of ages?', newAnswer: '90', lab: 'Linux Fundamentals: Text Processing & Shell Scripting' },

  // Lab 3 - PipelineMaster: test showed "/bin/bash /bin/sh /bin/sync" not "_apt backup bin daemon games"
  { title: 'Pipeline Master', newDesc: 'Run: cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3. Submit the 3 unique shell types separated by spaces.', newAnswer: '/bin/bash /bin/sh /bin/sync', lab: 'Linux Fundamentals: Text Processing & Shell Scripting' },

  // Lab 3 - ScriptWriter: test showed 22 not 21
  { title: 'Script Writer', newDesc: 'Write a script that counts lines in /etc/passwd. Run: wc -l < /etc/passwd. Submit just the number.', newAnswer: '22', lab: 'Linux Fundamentals: Text Processing & Shell Scripting' },

  // Lab 3 - awkArchitect: test showed "root daemon bin" not "root daemon bin" (correct but let me verify)
  // Lab 3 - awkArchitect is correct

  // Lab 4 - ServiceArchitect: ssh not available without openssh-server
  { title: 'Service Architect', newDesc: 'Install OpenSSH: apt-get update && apt-get install -y openssh-server. Then start: service ssh start. Run: service ssh status 2>&1 | head -1. Submit the status line.', newAnswer: 'sshd is running', lab: 'Linux Fundamentals: Process & Service Management' },

  // Lab 4 - SystemdMaster: same issue
  { title: 'Systemd Master', newDesc: 'After installing and starting ssh (apt-get install -y openssh-server && service ssh start), run: service ssh status 2>&1. Does sshd show as running? Submit "is running" or "is not running".', newAnswer: 'is running', lab: 'Linux Fundamentals: Process & Service Management' },

  // Lab 4 - CronCrafter: crontab not available
  { title: 'Cron Crafter', newDesc: 'Install cron: apt-get install -y cron. Start it: service cron start. Then add: echo "* * * * * echo cron_ok > /tmp/cron_proof" | crontab -. Run: crontab -l | head -1. What is the cron entry?', newAnswer: '* * * * * echo cron_ok > /tmp/cron_proof', lab: 'Linux Fundamentals: Process & Service Management' },

  // Lab 4 - ProcessTree: test showed 5 not 4
  { title: 'Process Tree', newDesc: 'Run: ps aux | wc -l. How many processes are running? (submit the number minus 1 for the header)', newAnswer: '5', lab: 'Linux Fundamentals: Process & Service Management' },

  // Lab 4 - FileDescriptor: test showed 4 not 10
  { title: 'File Descriptor', newDesc: 'Run: ls /proc/self/fd/ | wc -l. How many file descriptors does the current shell have?', newAnswer: '4', lab: 'Linux Fundamentals: Process & Service Management' },
];

const lines = [];
for (const f of fixes) {
  const hash = h(f.newAnswer);
  const desc = f.newDesc.replace(/'/g, "''");
  lines.push(`UPDATE "LabFlag" SET "correctAnswer" = '${hash}', description = '${desc}' WHERE title = '${f.title.replace(/'/g,"''")}' AND "labId" = (SELECT id FROM "Lab" WHERE title = '${f.lab.replace(/'/g,"''")}');`);
}
console.log(lines.join('\n'));
