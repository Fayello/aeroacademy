#!/bin/bash
# Simulate exact lab container: ubuntu:22.04 + student user
apt-get update -qq > /dev/null 2>&1
apt-get install -y -qq sudo > /dev/null 2>&1
useradd -m -s /bin/bash student 2>/dev/null
echo "student:lab123" | chpasswd
echo "student ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/student
chmod 0440 /etc/sudoers.d/student

echo "--- EXACT FLAG TESTS ---"
echo -n "User Deleter: "; useradd tempuser 2>/dev/null; userdel tempuser 2>&1; id tempuser 2>&1
echo -n "Passwd Field Parse: "; awk -F: '$3>=1000{print $1}' /etc/passwd | head -3
echo -n "Pipeline Master: "; cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3
echo -n "Process Inspector: "; ps -p 1 -o comm=
echo -n "Disk Space Expert: "; df -h / | tail -1
echo -n "Hidden Finder: "; ls -la /root 2>/dev/null | grep '^\.' | wc -l
echo -n "File Creator: "; echo 'AERO{UBUNTU_FILE_CREATE}' > /home/student/proof.txt; cat /home/student/proof.txt
