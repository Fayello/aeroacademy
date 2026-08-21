#!/bin/bash
apt-get update -qq && apt-get install -y -qq sudo > /dev/null 2>&1
useradd -m -s /bin/bash student 2>/dev/null
echo "student:lab123" | chpasswd
echo "student ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/student
chmod 0440 /etc/sudoers.d/student

echo "=== PASSWD LINES ==="
wc -l < /etc/passwd

echo "=== SHELLS ==="
cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3

echo "=== STUDENT EXISTS ==="
id student

echo "=== SUDO WORKS ==="
su - student -c "sudo whoami"

echo "=== CRON LINE ==="
apt-get install -y -qq cron > /dev/null 2>&1
service cron start 2>/dev/null
echo "* * * * * echo cron_ok > /tmp/cron_proof" | crontab -
crontab -l | head -1

echo "=== SSH STATUS ==="
apt-get install -y -qq openssh-server > /dev/null 2>&1
service ssh start 2>/dev/null
service ssh status 2>&1 | head -1

echo "=== PROCESS COUNT ==="
ps aux | wc -l

echo "=== FD COUNT ==="
ls /proc/self/fd/ | wc -l
