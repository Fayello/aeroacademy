-- Generated from prisma/lab-repair-batch-50.ts.
-- Existing lab and flag IDs are preserved so learner history remains intact.

UPDATE "Lab"
SET
  "description" = 'Author and audit a hardened systemd unit file without requiring systemd to run inside the practice container.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Author and audit a hardened systemd unit file without requiring systemd to run inside the practice container.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Create hardened.service as a portable unit-file exercise
2. Add ProtectSystem=strict and ProtectHome=yes
3. Restrict capabilities to CAP_NET_BIND_SERVICE
4. Enable namespace, temporary-directory, and device isolation
5. Enable NoNewPrivileges and inspect each directive with grep

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Create hardened.service as a portable unit-file exercise","Add ProtectSystem=strict and ProtectHome=yes","Restrict capabilities to CAP_NET_BIND_SERVICE","Enable namespace, temporary-directory, and device isolation","Enable NoNewPrivileges and inspect each directive with grep"]'::jsonb
WHERE "title" = 'Systemd Service Hardening';

UPDATE "LabFlag"
SET "description" = 'Add ProtectSystem=strict to hardened.service, then submit the matching line. Required result: ProtectSystem=strict'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Systemd Service Hardening'
)
AND "title" = 'Harden Starter';

UPDATE "LabFlag"
SET "description" = 'Add CapabilityBoundingSet=CAP_NET_BIND_SERVICE and submit the matching line. Required result: CapabilityBoundingSet=CAP_NET_BIND_SERVICE'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Systemd Service Hardening'
)
AND "title" = 'Capability Dropper';

UPDATE "LabFlag"
SET "description" = 'Add RestrictNamespaces=yes and submit the matching line. Required result: RestrictNamespaces=yes'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Systemd Service Hardening'
)
AND "title" = 'Namespace Guard';

UPDATE "LabFlag"
SET "description" = 'Add PrivateTmp=yes and PrivateDevices=yes. Submit both values separated by one space. Required result: PrivateTmp=yes PrivateDevices=yes'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Systemd Service Hardening'
)
AND "title" = 'Filesystem Isolator';

UPDATE "LabFlag"
SET "description" = 'Add NoNewPrivileges=yes and submit the matching line. Required result: NoNewPrivileges=yes'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Systemd Service Hardening'
)
AND "title" = 'Privilege Guard';

UPDATE "Lab"
SET
  "description" = 'Design and validate an LVM and RAID recovery plan using portable configuration files instead of privileged block devices.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Design and validate an LVM and RAID recovery plan using portable configuration files instead of privileged block devices.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Create storage-plan.sh without executing its privileged commands
2. Record the RAID 1 creation command for two loop devices
3. Record the logical-volume creation and extension commands
4. Record the simulated RAID failure command
5. Record the volume-group metadata backup command and inspect every line

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Create storage-plan.sh without executing its privileged commands","Record the RAID 1 creation command for two loop devices","Record the logical-volume creation and extension commands","Record the simulated RAID failure command","Record the volume-group metadata backup command and inspect every line"]'::jsonb
WHERE "title" = 'LVM & RAID Configuration Lab';

UPDATE "LabFlag"
SET "description" = 'Write the documented mdadm RAID 1 command to storage-plan.sh and submit that line. Required result: mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/loop0 /dev/loop1'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'LVM & RAID Configuration Lab'
)
AND "title" = 'RAID Builder';

UPDATE "LabFlag"
SET "description" = 'Write the documented lvcreate command to storage-plan.sh and submit that line. Required result: lvcreate -L 1G -n labvol labvg'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'LVM & RAID Configuration Lab'
)
AND "title" = 'Volume Creator';

UPDATE "LabFlag"
SET "description" = 'Write the documented mdadm failure-simulation command and submit that line. Required result: mdadm /dev/md0 --fail /dev/loop0'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'LVM & RAID Configuration Lab'
)
AND "title" = 'RAID Recovery';

UPDATE "LabFlag"
SET "description" = 'Write the documented lvextend command to storage-plan.sh and submit that line. Required result: lvextend -L +1G /dev/labvg/labvol'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'LVM & RAID Configuration Lab'
)
AND "title" = 'LVM Extender';

UPDATE "LabFlag"
SET "description" = 'Write the documented vgcfgbackup command to storage-plan.sh and submit that line. Required result: vgcfgbackup labvg'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'LVM & RAID Configuration Lab'
)
AND "title" = 'Metadata Saver';

UPDATE "Lab"
SET
  "description" = 'Author deterministic NFS and Samba access-control configurations without requiring kernel-mounted network shares.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Author deterministic NFS and Samba access-control configurations without requiring kernel-mounted network shares.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Create an exports.conf file for /export/shared
2. Apply rw, sync, no_subtree_check, and root_squash options
3. Create smb.conf with user security mode
4. Restrict the Samba share to sambagroup
5. Create a verification checklist for showmount output

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Create an exports.conf file for /export/shared","Apply rw, sync, no_subtree_check, and root_squash options","Create smb.conf with user security mode","Restrict the Samba share to sambagroup","Create a verification checklist for showmount output"]'::jsonb
WHERE "title" = 'NFS & Samba File Sharing';

UPDATE "LabFlag"
SET "description" = 'Add the documented /export/shared export line and submit it exactly. Required result: /export/shared 192.168.0.0/24(rw,sync,no_subtree_check)'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'NFS & Samba File Sharing'
)
AND "title" = 'NFS Exporter';

UPDATE "LabFlag"
SET "description" = 'Set security = user in smb.conf and submit the matching line. Required result: security = user'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'NFS & Samba File Sharing'
)
AND "title" = 'Samba Builder';

UPDATE "LabFlag"
SET "description" = 'Set valid users = @sambagroup and submit the matching line. Required result: valid users = @sambagroup'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'NFS & Samba File Sharing'
)
AND "title" = 'Access Controller';

UPDATE "LabFlag"
SET "description" = 'Include root_squash in the NFS options and submit the option name. Required result: root_squash'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'NFS & Samba File Sharing'
)
AND "title" = 'Squash Manager';

UPDATE "LabFlag"
SET "description" = 'Record the local export inspection command in verify.sh and submit it. Required result: showmount -e localhost'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'NFS & Samba File Sharing'
)
AND "title" = 'Share Tester';

UPDATE "Lab"
SET
  "description" = 'Audit deliberately unsafe cron fixtures and document escalation risks without creating a real privileged backdoor.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Audit deliberately unsafe cron fixtures and document escalation risks without creating a real privileged backdoor.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Create a sandbox crontab and enumerate its entries
2. Identify a tar wildcard-injection fixture
3. Identify a writable PATH-hijack fixture
4. Record the unsafe script modification as evidence without executing it
5. Write a verification command for detecting an unexpected root identity

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Create a sandbox crontab and enumerate its entries","Identify a tar wildcard-injection fixture","Identify a writable PATH-hijack fixture","Record the unsafe script modification as evidence without executing it","Write a verification command for detecting an unexpected root identity"]'::jsonb
WHERE "title" = 'Cron Exploitation & Privilege Escalation';

UPDATE "LabFlag"
SET "description" = 'Record the documented all-user cron enumeration loop in audit.sh and submit it. Required result: for user in $(cut -d: -f1 /etc/passwd); do crontab -u $user -l 2>/dev/null; done'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cron Exploitation & Privilege Escalation'
)
AND "title" = 'Cron Enumerator';

UPDATE "LabFlag"
SET "description" = 'Place the documented tar checkpoint tokens in evidence.txt without executing them, then submit the line. Required result: --checkpoint=1 --checkpoint-action=exec=sh root.sh'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cron Exploitation & Privilege Escalation'
)
AND "title" = 'Wildcard Exploiter';

UPDATE "LabFlag"
SET "description" = 'Record the documented PATH-hijack command as an unsafe finding and submit it. Required result: echo /bin/bash > /tmp/abusable && chmod +x /tmp/abusable'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cron Exploitation & Privilege Escalation'
)
AND "title" = 'PATH Hijacker';

UPDATE "LabFlag"
SET "description" = 'Record the documented SUID modification command as evidence only and submit it. Required result: echo ''chmod +s /bin/bash'' >> /opt/cron-backup.sh'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cron Exploitation & Privilege Escalation'
)
AND "title" = 'Script Inflater';

UPDATE "LabFlag"
SET "description" = 'Record the documented root-identity verification pipeline and submit it. Required result: id | grep -q root'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Cron Exploitation & Privilege Escalation'
)
AND "title" = 'Root Captured';

UPDATE "Lab"
SET
  "description" = 'Design and inspect an iptables policy file without modifying the container or host network namespace.',
  "dockerImage" = 'aeroacademy/ubuntu-practice:22.04',
  "briefing" = '### Mission Objective
Design and inspect an iptables policy file without modifying the container or host network namespace.

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. It does not expose host devices, host networking, or a full init system. Build and inspect configuration artifacts without applying them to the host.

### Workflow
1. Create firewall.rules as a non-executed policy artifact
2. Record a default INPUT drop policy
3. Record explicit SSH and HTTP allow rules
4. Record a custom private-range blocking chain and logging rule
5. Record an SSH connection-limit rule and inspect all entries with grep

Create all files under `/home/student/lab-work`. Checks use exact file content, so results remain stable after resets and on new deployments.',
  "tasks" = '["Create firewall.rules as a non-executed policy artifact","Record a default INPUT drop policy","Record explicit SSH and HTTP allow rules","Record a custom private-range blocking chain and logging rule","Record an SSH connection-limit rule and inspect all entries with grep"]'::jsonb
WHERE "title" = 'Firewall Configuration with iptables';

UPDATE "LabFlag"
SET "description" = 'Write the documented default INPUT policy to firewall.rules and submit the line. Required result: iptables -P INPUT DROP'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Firewall Configuration with iptables'
)
AND "title" = 'Policy Setter';

UPDATE "LabFlag"
SET "description" = 'Write the documented SSH and HTTP allow commands on one line and submit it. Required result: iptables -A INPUT -p tcp --dport 22 -j ACCEPT && iptables -A INPUT -p tcp --dport 80 -j ACCEPT'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Firewall Configuration with iptables'
)
AND "title" = 'Port Opener';

UPDATE "LabFlag"
SET "description" = 'Write the documented BLOCK_RANGE chain commands on one line and submit it. Required result: iptables -N BLOCK_RANGE && iptables -A BLOCK_RANGE -s 10.0.0.0/8 -j DROP'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Firewall Configuration with iptables'
)
AND "title" = 'IP Blocker';

UPDATE "LabFlag"
SET "description" = 'Write the documented dropped-packet logging command and submit it. Required result: iptables -A INPUT -j LOG --log-prefix ''DROPPED: '''
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Firewall Configuration with iptables'
)
AND "title" = 'Log Dropper';

UPDATE "LabFlag"
SET "description" = 'Write the documented SSH connection-limit command and submit it. Required result: iptables -A INPUT -p tcp --dport 22 -m connlimit --connlimit-above 3 -j DROP'
WHERE "labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Firewall Configuration with iptables'
)
AND "title" = 'Rate Limiter';
