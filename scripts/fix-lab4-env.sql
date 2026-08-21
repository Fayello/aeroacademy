-- Fix environment-dependent Lab 4 answers

-- Background Job: now asks how many sleep processes remain after killing (always 0)
UPDATE "LabFlag" SET 
  description = 'Run: nohup sleep 300 & sleep 1 && kill $(pgrep sleep | head -1) 2>/dev/null. Run: pgrep sleep | wc -l. How many sleep processes remain?',
  "correctAnswer" = '$2b$10$DOYwyKKKX8J5D5Nl0g/iquiwYV.uHbbp6oIKubHRGkRrmnVhz8FDK'
WHERE title = 'Background Job' AND "labId" = '88ca76ae-9628-4095-b15d-3e0a9f33037e';

-- Memory Inspector: now asks hard limit for open files (always 524288)
UPDATE "LabFlag" SET 
  description = 'Run: cat /proc/1/limits | grep "Max open files" | awk "{print $5}". What is the HARD limit for open files?',
  "correctAnswer" = '$2b$10$Gex/p1ME6P4DoeYqZYQepeoP0sC5oSrVlYttUB/gy8B88iKVNqEsC'
WHERE title = 'Memory Inspector' AND "labId" = '88ca76ae-9628-4095-b15d-3e0a9f33037e';
