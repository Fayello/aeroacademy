#!/bin/bash
set -e

echo "=== CORRECT ANSWER VERIFICATION ==="

# Lab 1
echo "LAB1_PipeComposer: $(cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3)"
echo "LAB1_HiddenFinder: $(ls -la /root 2>/dev/null | grep '^\.' | wc -l)"
echo "LAB1_EnvDetective: $(echo $PATH | tr ':' '\n' | wc -l)"
echo "LAB1_DirBuilder: $(mkdir -p /tmp/proj/src/utils && ls -R /tmp/proj | grep -c 'utils')"
echo "LAB1_DiffDetective: $(echo 'hello' > /tmp/f1.txt && echo 'world' > /tmp/f2.txt && diff /tmp/f1.txt /tmp/f2.txt | head -1)"

# Lab 2
echo "LAB2_PermissionDecode: $(touch /tmp/data.txt && chmod 644 /tmp/data.txt && stat -c '%A' /tmp/data.txt)"
echo "LAB2_GroupWrite: $(touch /tmp/team.txt && chmod g+w /tmp/team.txt && stat -c '%A' /tmp/team.txt)"
echo "LAB2_RecursiveChmod: $(mkdir -p /tmp/dir1/sub1/sub2 && chmod -R 755 /tmp/dir1 && stat -c '%A' /tmp/dir1/sub1/sub2)"
echo "LAB2_UmaskDetective: $(umask 022 && touch /tmp/umask_test.txt && stat -c '%A' /tmp/umask_test.txt)"
echo "LAB2_OwnershipTransfer: $(touch /tmp/shared.txt && chown root /tmp/shared.txt && stat -c '%U' /tmp/shared.txt)"
echo "LAB2_PasswordVault: echo 'test:secret123' | chpasswd 2>/dev/null && echo 'password_set'"
echo "LAB2_FindWorldWritable: $(find /tmp -maxdepth 1 -perm -o+w -type d 2>/dev/null | wc -l)"
echo "LAB2_EffectiveGroup: $(id -gn root 2>/dev/null)"
echo "LAB2_PasswdFieldParse: $(awk -F: '$3>=1000{print $1}' /etc/passwd | head -3)"

# Lab 3
echo "LAB3_CSVParser: $(echo -e 'name,age,city\nAlice,25,NYC\nBob,30,LA\nCharlie,35,SF' > /tmp/data.csv && awk -F, 'NR>1{sum+=$3}END{print sum}' /tmp/data.csv)"
echo "LAB3_LogFilter: $(echo -e 'INFO ok\nERROR fail\nINFO ok' > /tmp/app.log && grep -c ERROR /tmp/app.log)"
echo "LAB3_WordCounter: $(echo 'the cat sat on the mat' | wc -w)"
echo "LAB3_SedReplaceAll: $(echo 'aaa bbb aaa ccc aaa' | sed 's/aaa/XXX/g' | grep -o XXX | wc -l)"
echo "LAB3_ColumnExtractor: $(echo -e 'alice,90\nbob,85\ncharlie,95' > /tmp/grades.csv && awk -F, '$2>=90{print $1}' /tmp/grades.csv)"
echo "LAB3_SortCount: $(echo -e 'banana\napple\ncherry\nbanana\napple' | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')"
echo "LAB3_ScriptLoop: $(echo -e '#!/bin/bash\nsum=0\nfor i in $(seq 1 10); do sum=$((sum+i)); done\necho $sum' > /tmp/count.sh && bash /tmp/count.sh)"
echo "LAB3_RegexMatcher: $(echo 'test@email.com' | grep -oP '[a-zA-Z0-9]+@' | tr -d '@')"
echo "LAB3_StringTransform: $(echo 'Hello World' | tr 'A-Z' 'a-z' | sed 's/world/AERO/')"
echo "LAB3_LineAddress: $(for i in $(seq 1 10); do echo "line$i"; done > /tmp/lines.txt && sed -n '3,7p' /tmp/lines.txt | wc -l)"

# Lab 4
echo "LAB4_ProcessHunter: $(cat /proc/1/comm)"
echo "LAB4_SignalHandler: $(kill -0 1 2>&1; echo $?)"
echo "LAB4_BackgroundJob: $(pgrep sleep | head -1 || echo 1)"
echo "LAB4_ProcessTree: $(ps aux | wc -l)"
echo "LAB4_FileDescriptor: $(ls /proc/self/fd/ | wc -l)"
echo "LAB4_MemoryInspector: $(free -m | awk '/Mem:/{print $2}')"
