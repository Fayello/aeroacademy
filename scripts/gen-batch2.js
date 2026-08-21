const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }

const labs = {
  '8686b9c7-89cc-4e1f-b698-b61fc113511f': [
    { t: 'Partition Creator', d: 'Create a 100MB disk image: dd if=/dev/zero of=/tmp/disk.img bs=1M count=100. Format it ext4: mkfs.ext4 /tmp/disk.img. Run: file /tmp/disk.img. What filesystem type is detected?', a: 'ext4', p: 75 },
    { t: 'Mount Master', d: 'Create mount point /mnt/data. Mount disk image: mount -o loop /tmp/disk.img /mnt/data. Run: df -h /mnt/data | tail -1 | awk "{print $1}". What device is shown?', a: '/dev/loop0', p: 75 },
    { t: 'Filesystem Inspector', d: 'After mounting, create /mnt/data/test.txt with "hello". Run: lsblk -f | head -3. What filesystem type is shown for your loop device?', a: 'ext4', p: 100 },
    { t: 'LVM Creator', d: 'Create 2 loop devices (dd if=/dev/zero of=/tmp/disk1.img bs=1M count=50, same for disk2). Create PV: pvcreate /tmp/disk1.img /tmp/disk2.img. Run: pvdisplay | grep "PV Name" | wc -l. How many PVs?', a: '2', p: 100 },
    { t: 'VG Builder', d: 'Create volume group: vgcreate myvg /tmp/disk1.img /tmp/disk2.img. Run: vgdisplay myvg | grep "PE Size". What is the PE size?', a: '4.00 MiB', p: 100 },
    { t: 'LV Crafter', d: 'Create logical volume: lvcreate -L 30M -n mylv myvg. Run: lvdisplay /dev/myvg/mylv | grep "LV Size". What is the size?', a: '32.00 MiB', p: 100 },
    { t: 'RAID Builder', d: 'Create RAID0: mdadm --create /dev/md0 --level=0 --raid-devices=2 /tmp/disk1.img /tmp/disk2.img 2>/dev/null; Run: cat /proc/mdstat | grep md0 | awk "{print $4}". What is the status?', a: '2', p: 100 },
    { t: 'Swap Creator', d: 'Create 50MB swap: dd if=/dev/zero of=/tmp/swap.img bs=1M count=50 && mkswap /tmp/swap.img && swapon /tmp/swap.img. Run: swapon --show | wc -l. How many swap devices (minus header)?', a: '1', p: 100 },
    { t: 'DF Detective', d: 'Run: df -h --output=source,size,used,avail,target | grep tmp | head -1. What is the mount point?', a: 'tmpfs', p: 75 },
    { t: 'Fstab Editor', d: 'Add to /etc/fstab: /tmp/disk.img /mnt/data ext4 loop 0 0. Run: grep "/mnt/data" /etc/fstab | awk "{print $3}". What filesystem type is listed?', a: 'ext4', p: 100 },
    { t: 'Inode Counter', d: 'Run: df -i / | tail -1 | awk "{print $4}". How many free inodes?', a: '1', p: 100 },
    { t: 'Du Analyzer', d: 'Create files in /mnt/data (dd if=/dev/zero of=/mnt/data/bigfile bs=1M count=10). Run: du -sh /mnt/data | awk "{print $1}". What is the size?', a: '10M', p: 100 },
    { t: 'UUID Finder', d: 'Run: blkid /dev/loop0 2>/dev/null | grep -o "UUID=\\"[^ ]*\\"" | head -1. What is the UUID format? (just answer "uuid" if you can see it)', a: 'uuid', p: 75 },
    { t: 'Fdisk Explorer', d: 'Run: fdisk -l /tmp/disk.img 2>/dev/null | head -5. What disk identifier type is shown?', a: 'dos', p: 100 },
    { t: 'Cleanup Crew', d: 'Run: umount /mnt/data && losetup -D && vgremove -f myvg 2>/dev/null; echo "storage_done". What is the output?', a: 'storage_done', p: 75 },
  ],
  'a654ad57-7a70-4644-b8a5-01ef8a04146f': [
    { t: 'Tar Crafter', d: 'Create /home/student/backup_data/ with 3 files (a.txt, b.txt, c.txt). Pack: tar czf /tmp/backup.tar.gz -C /home/student backup_data. Run: tar tzf /tmp/backup.tar.gz | wc -l. How many entries?', a: '4', p: 75 },
    { t: 'Cron Scheduler', d: 'Add cron job: echo "0 * * * * echo backup_ok > /tmp/cron_proof" | crontab -. Run: crontab -l | wc -l. How many cron entries?', a: '1', p: 75 },
    { t: 'Restore Tester', d: 'Create /tmp/restore_dir/. Extract backup: tar xzf /tmp/backup.tar.gz -C /tmp/restore_dir. Run: ls /tmp/restore_dir/backup_data/ | wc -l. How many files restored?', a: '3', p: 100 },
    { t: 'Incremental Creator', d: 'Create new file d.txt. Create incremental: tar czf /tmp/incr.tar.gz -C /home/student/backup_data --newer=a.txt . Run: tar tzf /tmp/incr.tar.gz. What file is listed?', a: 'd.txt', p: 100 },
    { t: 'rsync Master', d: 'Create /tmp/src_dir/ and /tmp/dst_dir/. Create file in src. Run: rsync -av /tmp/src_dir/ /tmp/dst_dir/ && ls /tmp/dst_dir/. What file is synced?', a: 'a.txt', p: 100 },
    { t: 'Exclusion Expert', d: 'Create files: log.txt, data.csv, log2.txt. Run: tar czf /tmp/no_logs.tar.gz --exclude="log*" -C /home/student/backup_data . Run: tar tzf /tmp/no_logs.tar.gz | grep -c log. How many log files included?', a: '0', p: 100 },
    { t: 'Compression Pro', d: 'Compare: tar czf /tmp/gz.tar.gz -C /home/student/backup_data . vs tar cJf /tmp/xz.tar.xz -C /home/student/backup_data . Run: ls -la /tmp/gz.tar.gz /tmp/xz.tar.xz | awk "{print $5, $9}". Which is smaller?', a: '/tmp/xz.tar.xz', p: 100 },
    { t: 'Verify Expert', d: 'Run: tar tzf /tmp/backup.tar.gz > /tmp/list.txt && md5sum /tmp/list.txt. What is the first 8 chars of the hash?', a: '1', p: 100 },
    { t: 'Docker Backup', d: 'Run: docker run -d --name db-backup alpine:3.18 sleep 300. Then: docker export db-backup > /tmp/container_backup.tar && wc -c /tmp/container_backup.tar. How many bytes (approximately)?', a: '1', p: 100 },
    { t: 'Cron Checker', d: 'Run: cat /var/spool/cron/crontabs/root 2>/dev/null | head -1. What is the cron schedule?', a: '0 * * * * echo backup_ok > /tmp/cron_proof', p: 75 },
    { t: 'Diff Backup', d: 'Create /tmp/original/file.txt with "old". Copy to /tmp/backup_version/. Change original to "new". Run: diff /tmp/original/file.txt /tmp/backup_version/file.txt. What is shown?', a: '< old', p: 100 },
    { t: 'Archive Inspector', d: 'Run: file /tmp/backup.tar.gz. What is the detected type?', a: 'gzip compressed data', p: 75 },
    { t: 'Cleanup Script', d: 'Create /home/student/cleanup.sh that removes /tmp/restore_dir, /tmp/incr.tar.gz, /tmp/gz.tar.gz, /tmp/xz.tar.xz and echoes "cleaned". chmod +x and run. What is the output?', a: 'cleaned', p: 100 },
    { t: 'Checksum Verifier', d: 'Run: sha256sum /tmp/backup.tar.gz | awk "{print $1}" | wc -c. How many characters is the SHA256 hash?', a: '65', p: 75 },
    { t: 'Date Stamped Backup', d: 'Run: tar czf /tmp/backup_$(date +%Y%m%d).tar.gz -C /home/student/backup_data . && ls /tmp/backup_*.tar.gz | wc -l. How many date-stamped backups?', a: '1', p: 100 },
  ],
  '9bee7f1b-7afa-493a-9eec-31b006e07da1': [
    { t: 'iptables List', d: 'Run: iptables -L -n | head -3. What is the first chain name shown?', a: 'Chain INPUT (policy ACCEPT)', p: 50 },
    { t: 'Rule Creator', d: 'Run: iptables -A INPUT -p tcp --dport 8080 -j ACCEPT && iptables -L INPUT -n | grep 8080. What target is shown?', a: 'ACCEPT', p: 75 },
    { t: 'Port Blocker', d: 'Run: iptables -A INPUT -p tcp --dport 9999 -j DROP && iptables -L INPUT -n | grep 9999. What target?', a: 'DROP', p: 75 },
    { t: 'Rule Deleter', d: 'Run: iptables -D INPUT -p tcp --dport 9999 -j DROP && iptables -L INPUT -n | grep -c 9999. How many rules for port 9999?', a: '0', p: 100 },
    { t: 'Chain Creator', d: 'Run: iptables -N MYCHAIN && iptables -L | grep MYCHAIN. What chain name appears?', a: 'MYCHAIN', p: 100 },
    { t: 'IP Blocker', d: 'Run: iptables -A INPUT -s 10.10.10.10 -j DROP && iptables -L INPUT -n | grep 10.10.10.10. What target?', a: 'DROP', p: 100 },
    { t: 'Rate Limiter', d: 'Run: iptables -A INPUT -p tcp --dport 80 -m limit --limit 10/min --limit-burst 20 -j ACCEPT && iptables -L INPUT -n | grep "limit:10/min". Is limit shown? (yes/no)', a: 'yes', p: 100 },
    { t: 'State Inspector', d: 'Run: iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT && iptables -L INPUT -n | grep ESTABLISHED. What states are listed?', a: 'ESTABLISHED,RELATED', p: 100 },
    { t: 'NAT Creator', d: 'Run: iptables -t nat -A PREROUTING -p tcp --dport 8080 -j REDIRECT --to-port 80 && iptables -t nat -L PREROUTING -n | grep 8080. What target?', a: 'REDIRECT', p: 100 },
    { t: 'Rule Saver', d: 'Run: iptables-save > /tmp/iptables_rules.txt && wc -l /tmp/iptables_rules.txt. How many lines of rules?', a: '1', p: 100 },
    { t: 'Log Logger', d: 'Run: iptables -A INPUT -p tcp --dport 8080 -j LOG --log-prefix "FIREWALL: " && iptables -L INPUT -n | grep LOG. What log prefix is shown?', a: 'FIREWALL: ', p: 100 },
    { t: 'Interface Binder', d: 'Run: iptables -A INPUT -i eth0 -j ACCEPT && iptables -L INPUT -n | grep eth0. What interface is shown?', a: 'eth0', p: 100 },
    { t: 'Packet Counter', d: 'Run: iptables -Z INPUT && iptables -L INPUT -v -n | head -3. What is the pkts count for INPUT chain?', a: '0', p: 100 },
    { t: 'Flush Master', d: 'Run: iptables -F MYCHAIN && iptables -L MYCHAIN -n | wc -l. How many rules in MYCHAIN after flush?', a: '0', p: 75 },
    { t: 'Cleanup', d: 'Run: iptables -F && iptables -X MYCHAIN 2>/dev/null; iptables -t nat -F PREROUTING 2>/dev/null; echo "firewall_done". What is the output?', a: 'firewall_done', p: 75 },
  ],
  '174408c2-8db3-4dfc-80f0-ee27f14963f9': [
    { t: 'Zone Creator', d: 'Create zone file: /etc/bind/zones/aeroacademy.local. Add SOA record for aeroacademy.local. Run: named-checkzone aeroacademy.local /etc/bind/zones/aeroacademy.local 2>&1 | tail -1. What is the status?', a: 'OK', p: 75 },
    { t: 'A Record', d: 'Add A record: aeroacademy.local IN A 192.168.1.100. Run: grep "IN A" /etc/bind/zones/aeroacademy.local. What IP is shown?', a: '192.168.1.100', p: 75 },
    { t: 'MX Record', d: 'Add MX record: aeroacademy.local IN MX 10 mail.aeroacademy.local. Run: dig MX aeroacademy.local +short. What is the mail server?', a: '10 mail.aeroacademy.local.', p: 100 },
    { t: 'CNAME Record', d: 'Add CNAME: www.aeroacademy.local IN CNAME aeroacademy.local. Run: dig www.aeroacademy.local +short. What does it resolve to?', a: 'aeroacademy.local.', p: 100 },
    { t: 'Reverse Zone', d: 'Create reverse zone for 1.168.192.in-addr.arpa. Add PTR: 100 IN PTR aeroacademy.local. Run: named-checkzone 1.168.192.in-addr.arpa /etc/bind/zones/reverse.local 2>&1 | tail -1. What status?', a: 'OK', p: 100 },
    { t: 'NS Record', d: 'Add NS record: aeroacademy.local IN NS ns1.aeroacademy.local. Run: dig NS aeroacademy.local +short. What nameserver is shown?', a: 'ns1.aeroacademy.local.', p: 100 },
    { t: 'TXT Record', d: 'Add TXT record: aeroacademy.local IN TXT "v=spf1 mx -all". Run: dig TXT aeroacademy.local +short. What is the TXT value?', a: '"v=spf1 mx -all"', p: 100 },
    { t: 'Config Inspector', d: 'Run: cat /etc/bind/named.conf.local | grep "zone" | wc -l. How many zones are defined?', a: '2', p: 75 },
    { t: 'Serial Bumper', d: 'Update SOA serial to 2024010101. Run: grep serial /etc/bind/zones/aeroacademy.local | awk "{print $1}". What is the serial number?', a: '2024010101', p: 100 },
    { t: 'TTL Set', d: 'Set TTL to 3600 in the zone file. Run: grep -m1 ";" /etc/bind/zones/aeroacademy.local | awk "{print $1}". What is the TTL?', a: '3600', p: 75 },
    { t: 'AAAA Record', d: 'Add AAAA record: aeroacademy.local IN AAAA ::1. Run: dig AAAA aeroacademy.local +short. What is the IPv6 address?', a: '::1', p: 100 },
    { t: 'Wildcard Record', d: 'Add wildcard: *.aeroacademy.local IN A 192.168.1.100. Run: dig random.aeroacademy.local +short. What IP resolves?', a: '192.168.1.100', p: 100 },
    { t: 'Config Validator', d: 'Run: named-checkconf /etc/bind/named.conf 2>&1. What is the output (empty means OK)?', a: '', p: 75 },
    { t: 'Zone Dumper', d: 'Run: dig axfr aeroacademy.local @localhost 2>&1 | wc -l. How many lines in zone transfer?', a: '1', p: 100 },
    { t: 'Cleanup', d: 'Run: systemctl stop named 2>/dev/null || service named stop 2>/dev/null; echo "dns_done". What is the output?', a: 'dns_done', p: 75 },
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
