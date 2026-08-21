#!/bin/bash
# Fix broken flag answers in the database

# 1. Pipeline Master - wrong shells (should be /bin/bash /bin/sync /usr/sbin/nologin)
sudo docker exec aeroacademy-db-1 psql -U user -d aeroacademy -c "UPDATE \"LabFlag\" SET \"correctAnswer\" = '\$2b\$10\$W/O5JrtNfH/DDB2UBVO0u.tXrSdyJ3BtgBvrhQmmW.JBEL2M81H/6' WHERE title = 'Pipeline Master' AND description LIKE '%Submit the 3 unique shell types%'"

# 2. Passwd Field Parse - should be 'nobody student' (not just 'nobody')
sudo docker exec aeroacademy-db-1 psql -U user -d aeroacademy -c "UPDATE \"LabFlag\" SET \"correctAnswer\" = '\$2b\$10\$IUwEesuUrgouYw9lKUUjHueWBTJ/BeDbgPHVjzOn5k.sVwE88k1TS' WHERE title = 'Passwd Field Parse'"

# 3. Script Writer (Text Processing) - should be 20 (not 22)
sudo docker exec aeroacademy-db-1 psql -U user -d aeroacademy -c "UPDATE \"LabFlag\" SET \"correctAnswer\" = '\$2b\$10\$RpSRhN.NU9frhDIGDLBBFO82z.Z0P5NBGEWObIGltwcAkznuETqFu' WHERE title = 'Script Writer' AND description LIKE '%Write a script that counts lines%' AND \"labId\" = (SELECT id FROM \"Lab\" WHERE title = 'Linux Fundamentals: Text Processing & Shell Scripting')"

echo "=== Verify fixes ==="
# Verify Pipeline Master
echo -n "Pipeline Master: "
cat << 'VERIFYEOF' | ssh -i ~/.ssh/fayelldev_ed25519 fayelldev@xpertclass.academy "sudo docker exec -i aeroacademy-backend-1 node -" 2>/dev/null | grep -E "^(PASS|FAIL)"
const bcrypt = require('bcrypt');
function n(a) { return a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(); }
(async () => {
  const tests = [
    ['/bin/bash /bin/sync /usr/sbin/nologin', '\$2b\$10\$W/O5JrtNfH/DDB2UBVO0u.tXrSdyJ3BtgBvrhQmmW.JBEL2M81H/6'],
    ['nobody student', '\$2b\$10\$IUwEesuUrgouYw9lKUUjHueWBTJ/BeDbgPHVjzOn5k.sVwE88k1TS'],
    ['20', '\$2b\$10\$RpSRhN.NU9frhDIGDLBBFO82z.Z0P5NBGEWObIGltwcAkznuETqFu'],
  ];
  for (const [ans, hash] of tests) {
    const ok = await bcrypt.compare(n(ans), hash);
    console.log(ok ? 'PASS: ' + ans : 'FAIL: ' + ans);
  }
})();
VERIFYEOF
