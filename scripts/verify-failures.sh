#!/bin/bash
# Simulate actual lab container setup (student user + packages)
apt-get update -qq > /dev/null 2>&1
apt-get install -y -qq sudo > /dev/null 2>&1
useradd -m -s /bin/bash student 2>/dev/null
echo "student:lab123" | chpasswd
echo "student ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/student
chmod 0440 /etc/sudoers.d/student

echo "=== 1. Script Writer (Docker lab) - container_proof ==="
echo "I built this container" > /home/student/container_proof.txt
echo "#!/bin/bash" > /home/student/inspect.sh
echo "echo CONTAINER_OK" >> /home/student/inspect.sh
chmod +x /home/student/inspect.sh
bash /home/student/inspect.sh

echo "=== 2. User Deleter ==="
useradd tempuser2 2>/dev/null
userdel tempuser2 2>&1
id tempuser2 2>&1 | tail -1

echo "=== 3. Find World Writable ==="
find /tmp -maxdepth 1 -perm -o+w -type d 2>/dev/null | wc -l

echo "=== 4. Group Manager ==="
groupadd admin_group 2>/dev/null
usermod -aG admin_group student 2>/dev/null
groups student

echo "=== 5. Column Extractor ==="
echo -e "alice,90\nbob,85\ncharlie,95" > /home/student/grades.csv
awk -F, '$2>=90{print $1}' /home/student/grades.csv

echo "=== 6. Pipeline Master ==="
cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3

echo "=== 7. Script Writer (Text) ==="
wc -l < /etc/passwd

echo "=== 8. Tar Packer ==="
mkdir -p /home/student/bundle
echo a > /home/student/bundle/a.txt
echo b > /home/student/bundle/b.txt
echo c > /home/student/bundle/c.txt
tar czf /tmp/bundle.tar.gz -C /home/student bundle
tar tzf /tmp/bundle.tar.gz | wc -l

echo "=== 9. Sort & Count ==="
echo -e "banana\napple\ncherry\nbanana\napple" | sort | uniq -c | sort -rn | head -1 | awk '{print $2}'

echo "=== 10. awk Architect ==="
awk -F: '{print $1}' /etc/passwd | head -3

echo "=== 11. Passwd Field Parse ==="
awk -F: '$3>=1000{print $1}' /etc/passwd | head -3

echo "=== 12. Pipe Composer ==="
cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3

echo "=== 13. Process Inspector ==="
ps -p 1 -o comm=

echo "=== 14. Disk Space Expert ==="
df -h / | tail -1

echo "=== 15. Hidden Finder ==="
ls -la /root 2>/dev/null | grep '^\.' | wc -l

echo "=== 16. File Creator (Lab 4) ==="
echo 'AERO{UBUNTU_FILE_CREATE}' > /home/student/proof.txt
cat /home/student/proof.txt

echo "=== 17. ACL Master ==="
apt-get install -y -qq acl > /dev/null 2>&1
echo "hello" > /home/student/hello.txt
useradd alice_acl 2>/dev/null
setfacl -m u:alice_acl:rwx /home/student/hello.txt
getfacl /home/student/hello.txt | grep alice
