-- Lab 1: Ubuntu CLI Mastery - 10 NEW flags (total 15)
-- All new flags use uuid() for IDs

INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES
('a1b00001-0000-4000-8000-000000000001', (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery'), 'Directory Builder', 'Create the directory tree /home/student/project/src/utils using mkdir -p. Then run: ls -R /home/student/project. How many times does "utils" appear in the output?', 75, '$2b$10$placeholder');

INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES
('a1b00001-0000-4000-8000-000000000002', (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery'), 'File Mover', 'Create /home/student/old_name.txt with content "migrate me". Rename it to /home/student/new_name.txt using mv. Run: cat /home/student/new_name.txt. What is the content?', 75, '$2b$10$placeholder');

INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES
('a1b00001-0000-4000-8000-000000000003', (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery'), 'Chain Commander', 'Run this exact chain: touch /home/student/a.txt /home/student/b.txt /home/student/c.txt && ls /home/student/*.txt | wc -l. How many .txt files exist?', 100, '$2b$10$placeholder');

INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES
('a1b00001-0000-4000-8000-000000000004', (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery'), 'Glob Master', 'Run: touch /home/student/{1..5}.log && ls /home/student/*.log | wc -l. How many .log files were created?', 75, '$2b$10$placeholder');

INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES
('a1b00001-0000-4000-8000-000000000005', (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery'), 'Redirect Wizard', 'Run: echo "first" > /tmp/redirect.txt && echo "second" >> /tmp/redirect.txt && wc -l < /tmp/redirect.txt. How many lines?', 75, '$2b$10$placeholder');

INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES
('a1b00001-0000-4000-8000-000000000006', (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery'), 'Pipe Composer', 'Run: cat /etc/passwd | cut -d: -f7 | sort | uniq | head -3. Submit the 3 shell types separated by spaces.', 100, '$2b$10$placeholder');

INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES
('a1b00001-0000-4000-8000-000000000007', (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery'), 'Script Crafter', 'Create /home/student/sysinfo.sh that prints: "HOSTNAME=$(hostname)" on line 1 and "USER=$(whoami)" on line 2. Make it executable (chmod +x). Run it. Submit line 1 output.', 100, '$2b$10$placeholder');

INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES
('a1b00001-0000-4000-8000-000000000008', (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery'), 'Find & Exec', 'Run: find /etc -name "*.conf" -type f 2>/dev/null | head -5 | wc -l. How many .conf files were found in the first 5 results?', 100, '$2b$10$placeholder');

INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES
('a1b00001-0000-4000-8000-000000000009', (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery'), 'Tar Packer', 'Create /home/student/bundle/ with files a.txt, b.txt, c.txt (each with any content). Pack them: tar czf /tmp/bundle.tar.gz -C /home/student bundle. Then run: tar tzf /tmp/bundle.tar.gz | wc -l. How many entries?', 100, '$2b$10$placeholder');

INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES
('a1b00001-0000-4000-8000-000000000010', (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery'), 'Diff Detective', 'Create /home/student/file1.txt with "hello" and /home/student/file2.txt with "world". Run: diff /home/student/file1.txt /home/student/file2.txt | grep -c "^[<>]". How many diff lines?', 100, '$2b$10$placeholder');
