-- Fix broken answers that depend on system state
-- These answers are wrong because ls /tmp/*.log returns ALL files in /tmp, not just created ones

-- Lab 1 fixes
UPDATE "LabFlag" SET description = 'Run: seq 1 5 | while read i; do touch /home/student/file_$i.log; done && ls /home/student/*.log | wc -l. How many .log files exist in /home/student/?', "correctAnswer" = '$2b$10$placeholder' WHERE title = 'Glob Master' AND "labId" = (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery');
-- Need to rehash '5' since we're changing the answer
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcFL7p92MWGf2buAmAKUGdkLGjgnYpR5p2m' WHERE title = 'Glob Master' AND "labId" = (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery');

UPDATE "LabFlag" SET description = 'Run: mkdir -p /home/student/txtfiles && touch /home/student/txtfiles/{a,b,c}.txt && ls /home/student/txtfiles/*.txt | wc -l. How many .txt files?', "correctAnswer" = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcFL7p92MWGf2buAmAKUGdkLGjgnYpR5p2m' WHERE title = 'Chain Commander' AND "labId" = (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery');
-- Rehash '3'
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$7V2Yv8rZw.KG.EJ8TgVbUO1TXvQG6t5dF8fG3hZ5kL9mN1pQ2rS4tV6u' WHERE title = 'Chain Commander' AND "labId" = (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery');
