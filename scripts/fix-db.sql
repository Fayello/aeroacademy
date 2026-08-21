-- Fix broken flag answers

-- 1. Pipeline Master: /bin/bash /bin/sh /bin/sync -> /bin/bash /bin/sync /usr/sbin/nologin
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$W/O5JrtNfH/DDB2UBVO0u.tXrSdyJ3BtgBvrhQmmW.JBEL2M81H/6' WHERE title = 'Pipeline Master' AND description LIKE '%Submit the 3 unique shell types%';

-- 2. Passwd Field Parse: nobody -> nobody student
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$IUwEesuUrgouYw9lKUUjHueWBTJ/BeDbgPHVjzOn5k.sVwE88k1TS' WHERE title = 'Passwd Field Parse';

-- 3. Script Writer (Text Processing): 22 -> 20
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$RpSRhN.NU9frhDIGDLBBFO82z.Z0P5NBGEWObIGltwcAkznuETqFu' WHERE title = 'Script Writer' AND "labId" = (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Text Processing & Shell Scripting');
