-- Add category and difficulty to courses
UPDATE "Course" SET category = 'Security', difficulty = 3 WHERE title = 'Advanced Web Vulnerabilities';
UPDATE "Course" SET category = 'Security', difficulty = 4 WHERE title = 'Incident Response & Digital Forensics';
UPDATE "Course" SET category = 'Security', difficulty = 3 WHERE title = 'Malware Analysis & Reverse Engineering';
UPDATE "Course" SET category = 'Security', difficulty = 4 WHERE title = 'Product Security Architecture & SDL';
UPDATE "Course" SET category = 'Security', difficulty = 2 WHERE title = 'Networking & Security';
UPDATE "Course" SET category = 'Security', difficulty = 3 WHERE title = 'Cloud Security & Hardening';

UPDATE "Course" SET category = 'Systems', difficulty = 1 WHERE title = 'Linux Fundamentals — From Zero to Command Line Hero';
UPDATE "Course" SET category = 'Systems', difficulty = 4 WHERE title = 'Linux Kernel & System Internals';
UPDATE "Course" SET category = 'Systems', difficulty = 2 WHERE title = 'Web Server Administration';
UPDATE "Course" SET category = 'Systems', difficulty = 3 WHERE title = 'Database Administration & Security';

UPDATE "Course" SET category = 'DevOps', difficulty = 3 WHERE title = 'Containerization & DevOps';
UPDATE "Course" SET category = 'DevOps', difficulty = 4 WHERE title = 'Kubernetes Administration & Security';
UPDATE "Course" SET category = 'DevOps', difficulty = 2 WHERE title = 'Infrastructure as Code';
UPDATE "Course" SET category = 'DevOps', difficulty = 3 WHERE title = 'Site Reliability Engineering';

UPDATE "Course" SET category = 'Development', difficulty = 2 WHERE title = 'Full-Stack JavaScript Development';
UPDATE "Course" SET category = 'Development', difficulty = 3 WHERE title = 'Python for Cybersecurity & Automation';
UPDATE "Course" SET category = 'Development', difficulty = 3 WHERE title = 'API Design & Security';

UPDATE "Course" SET category = 'AI & Data', difficulty = 4 WHERE title = 'AI Engineering & MLOps';
UPDATE "Course" SET category = 'AI & Data', difficulty = 4 WHERE title = 'Quantum Computing & Post-Quantum Cryptography';
UPDATE "Course" SET category = 'Blockchain', difficulty = 4 WHERE title = 'Blockchain Security & Smart Contracts';

-- Set duration based on estimatedHours
UPDATE "Course" SET duration = estimatedHours || 'h' WHERE estimatedHours IS NOT NULL;

-- Verify
SELECT title, category, difficulty, duration FROM "Course" ORDER BY category, difficulty;
