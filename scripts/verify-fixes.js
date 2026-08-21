const bcrypt = require('bcrypt');
function n(a) { return a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(); }

(async () => {
  const tests = [
    { title: 'Pipeline Master', ans: '/bin/bash /bin/sync /usr/sbin/nologin', hash: '$2b$10$W/O5JrtNfH/DDB2UBVO0u.tXrSdyJ3BtgBvrhQmmW.JBEL2M81H/6' },
    { title: 'Passwd Field Parse', ans: 'nobody student', hash: '$2b$10$IUwEesuUrgouYw9lKUUjHueWBTJ/BeDbgPHVjzOn5k.sVwE88k1TS' },
    { title: 'Script Writer (Text)', ans: '20', hash: '$2b$10$RpSRhN.NU9frhDIGDLBBFO82z.Z0P5NBGEWObIGltwcAkznuETqFu' },
  ];
  for (const t of tests) {
    const ok = await bcrypt.compare(n(t.ans), t.hash);
    console.log(ok ? `PASS: ${t.title} = "${t.ans}"` : `FAIL: ${t.title}`);
  }
})();
