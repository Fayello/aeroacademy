#!/bin/bash
echo "=== COMPREHENSIVE FLAG VERIFICATION ==="
mkdir -p /home/student 2>/dev/null
PASS=0
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "PASS: $name = $actual"
    PASS=$((PASS+1))
  else
    echo "FAIL: $name expected='$expected' got='$actual'"
    FAIL=$((FAIL+1))
  fi
}

# === LAB 1: Ubuntu CLI ===
echo "--- LAB 1: Ubuntu CLI ---"
check "Filesystem Navigator" "ubuntu" "$(grep ^ID= /etc/os-release | cut -d= -f2 | tr -d '"')"
check "Permission Reader" "root" "$(ls -la /etc/shadow | awk '{print $3}')"
check "Directory Builder" "2" "$(mkdir -p /home/student/project/src/utils && ls -R /home/student/project | grep -c 'utils')"
check "File Mover" "migrate me" "$(echo 'migrate me' > /home/student/old_name.txt && mv /home/student/old_name.txt /home/student/new_name.txt && cat /home/student/new_name.txt)"
check "Hidden Finder" "0" "$(ls -la /root 2>/dev/null | grep '^\.' | wc -l)"
check "Text Pipe Master" "1" "$(echo 'hello world' | tr ' ' '\n' | sort | uniq -c | sort -rn | head -1 | awk '{print $1}')"
check "Glob Master" "5" "$(seq 1 5 | while read i; do touch /home/student/gm_$i.log; done && ls /home/student/gm_*.log | wc -l)"
check "Redirect Wizard" "2" "$(echo 'first' > /tmp/rw.txt && echo 'second' >> /tmp/rw.txt && wc -l < /tmp/rw.txt)"
check "Chmod Challenge" "700" "$(touch /home/student/secret.sh && chmod 700 /home/student/secret.sh && stat -c '%a' /home/student/secret.sh)"
check "Find & Exec" "5" "$(find /etc -name '*.conf' -type f 2>/dev/null | head -5 | wc -l)"
check "Diff Detective" "1c1" "$(echo 'hello' > /home/student/file1.txt && echo 'world' > /home/student/file2.txt && diff /home/student/file1.txt /home/student/file2.txt | head -1)"

# === LAB 2: Permissions ===
echo "--- LAB 2: Permissions ---"
check "Permission Decode" "-rw-r--r--" "$(touch /home/student/data.txt && chmod 644 /home/student/data.txt && stat -c '%A' /home/student/data.txt)"
check "Ownership Transfer" "root" "$(touch /home/student/shared.txt && chown root /home/student/shared.txt && stat -c '%U' /home/student/shared.txt)"
check "Group Write" "-rw-rw-r--" "$(touch /home/student/team.txt && chmod g+w /home/student/team.txt && stat -c '%A' /home/student/team.txt)"
check "Recursive Chmod" "drwxr-xr-x" "$(mkdir -p /home/student/dir1/sub1/sub2 && chmod -R 755 /home/student/dir1 && stat -c '%A' /home/student/dir1/sub1/sub2)"
check "chmod Master" "700" "$(touch /home/student/secret.txt && chmod 700 /home/student/secret.txt && stat -c '%a' /home/student/secret.txt)"
check "Sticky Bit Expert" "1777" "$(mkdir -p /tmp/shared && chmod 1777 /tmp/shared && stat -c '%a' /tmp/shared)"
check "Umask Detective" "-rw-r--r--" "$(umask 022 && touch /home/student/umask_test.txt && stat -c '%A' /home/student/umask_test.txt)"
check "Effective Group" "root" "$(id -gn root)"
check "Password Vault" "password_set" "$(useradd -m alice3 2>/dev/null; echo 'alice3:secret123' | chpasswd 2>/dev/null && echo 'password_set')"

# === LAB 3: Text Processing ===
echo "--- LAB 3: Text Processing ---"
check "Word Counter" "6" "$(echo 'the cat sat on the mat' | wc -w)"
check "grep Guru" "1" "$(grep -c root /etc/passwd)"
check "sed Specialist" "Hello AEROACADEMY" "$(echo 'Hello World' | sed 's/World/AEROACADEMY/')"
check "CSV Parser" "90" "$(echo -e 'name,age,city\nAlice,25,NYC\nBob,30,LA\nCharlie,35,SF' > /home/student/data.csv && awk -F, 'NR>1{sum+=$2}END{print sum}' /home/student/data.csv)"
check "Log Filter" "1" "$(echo -e 'INFO ok\nERROR fail\nINFO ok' > /home/student/app.log && grep -c ERROR /home/student/app.log)"
check "sed Replace All" "3" "$(echo 'aaa bbb aaa ccc aaa' | sed 's/aaa/XXX/g' | grep -o XXX | wc -l)"
check "Sort Count" "banana" "$(echo -e 'banana\napple\ncherry\nbanana\napple' | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')"
check "Script Loop" "55" "$(echo -e '#!/bin/bash\nsum=0\nfor i in $(seq 1 10); do\n  sum=$((sum+i))\ndone\necho $sum' > /home/student/count.sh && bash /home/student/count.sh)"
check "Regex Matcher" "test" "$(echo 'test@email.com' | grep -oP '[a-zA-Z0-9]+@' | tr -d '@')"
check "String Transform" "hello AERO" "$(echo 'Hello World' | tr 'A-Z' 'a-z' | sed 's/world/AERO/')"
check "Line Address" "5" "$(for i in $(seq 1 10); do echo "line$i"; done > /home/student/lines.txt && sed -n '3,7p' /home/student/lines.txt | wc -l)"
check "Pipeline Master" "/bin/bash /bin/sh /bin/sync" "$(cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3)"
check "Script Writer" "22" "$(wc -l < /etc/passwd)"

# === LAB 4: Process & Service ===
echo "--- LAB 4: Process ---"
check "Signal Handler" "0" "$(kill -0 1 2>&1; echo $?)"
check "Process Tree" "5" "$(ps aux | wc -l)"
check "File Descriptor" "4" "$(ls /proc/self/fd/ | wc -l)"
check "Signal Messenger" "0" "$(kill -USR1 1 2>&1; echo $?)"
check "Hard Limit" "524288" "$(cat /proc/1/limits | grep 'Max open files' | awk '{print $5}')"
check "Soft Limit" "1024" "$(cat /proc/1/limits | grep 'Max open files' | awk '{print $4}')"

# === DOCKER LAB ===
echo "--- DOCKER LAB ---"
check "File Creator" "I built this container" "$(echo 'I built this container' > /home/student/container_proof.txt && cat /home/student/container_proof.txt)"
check "String Length" "11" "$(echo -n 'AEROACADEMY' | wc -c)"
check "Sort Master" "alice" "$(echo -e 'charlie\nalice\nbob' | sort | head -1)"
check "File Duplicator" "" "$(echo 'clone me' > /home/student/original.txt && cp /home/student/original.txt /home/student/clone.txt && diff /home/student/original.txt /home/student/clone.txt)"
check "Script Writer Docker" "CONTAINER_OK" "$(echo '#!/bin/bash' > /home/student/inspect.sh && echo 'echo CONTAINER_OK' >> /home/student/inspect.sh && chmod +x /home/student/inspect.sh && bash /home/student/inspect.sh)"
check "Permission Setter" "0" "$(touch /home/student/locked.txt && chmod 000 /home/student/locked.txt && stat -c '%a' /home/student/locked.txt)"
check "Multi-Line Writer" "3" "$(echo -e 'apple\nbanana\ncherry' > /home/student/data.txt && wc -l /home/student/data.txt | awk '{print $1}')"
check "Text Searcher" "2" "$(echo 'hello world foo bar hello world' > /home/student/search.txt && grep -o 'hello' /home/student/search.txt | wc -l)"
check "Unique Counter" "3" "$(echo -e 'a\na\nb\nb\nb\nc' | sort | uniq -c | sort -rn | head -1 | awk '{print $1}')"
check "Hex Converter" "ff" "$(echo 255 | xargs printf '%x')"
check "Path Resolver" "/home/student" "$(realpath /home/student/.)"
check "Process Killer" "0" "$(sleep 999 & sleep 0.5 && kill $(pgrep sleep | head -1) 2>/dev/null; sleep 0.5; pgrep sleep | wc -l)"

echo ""
echo "=== RESULTS: $PASS passed, $FAIL failed ==="
