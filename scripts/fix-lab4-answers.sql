-- Fix Lab 4 answers
-- Process Hunter: answer is tail
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$B5MTS0/ddPA/J0BtRGEvre0rTtnGgPITfoH44YTKff5evisyjD6au' WHERE title = 'Process Hunter' AND "labId" = '88ca76ae-9628-4095-b15d-3e0a9f33037e';

-- Service Architect
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$Qyeubuc3Za6AnTNhoUAWfOWMhy6MTdwQZeGxX55nHZrbiN8OewKYO', description = 'Install OpenSSH first: apt-get install -y openssh-server. Then start: service ssh start. Run: echo ssh_started. What is the output?' WHERE title = 'Service Architect' AND "labId" = '88ca76ae-9628-4095-b15d-3e0a9f33037e';

-- Systemd Master
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$6TSxUtYJbw2ORNEpNY7p6uApLZzyytK23okSPgPbUBFs3CzJWbAUu', description = 'Install and start ssh: apt-get install -y openssh-server && service ssh start. Then run: service ssh status 2>&1 | head -1. Does sshd show as running? Submit exactly is running' WHERE title = 'Systemd Master' AND "labId" = '88ca76ae-9628-4095-b15d-3e0a9f33037e';

-- Cron Crafter
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$DYVOIJzEcafzfr90DKFSFOEUdPWDa1CBw5i7nqRssgNJpMbaMKz4a', description = 'Install cron: apt-get install -y cron && service cron start. Then add: echo "* * * * * echo cron_ok > /tmp/cron_proof" | crontab -. Run: crontab -l | head -1. What is the cron entry?' WHERE title = 'Cron Crafter' AND "labId" = '88ca76ae-9628-4095-b15d-3e0a9f33037e';

-- Process Tree
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$jLxPLMfDaAxFA6QBaj3ahOy.mbdqSEcwwX30CH6/rIfb1qvUL2Uzm' WHERE title = 'Process Tree' AND "labId" = '88ca76ae-9628-4095-b15d-3e0a9f33037e';

-- File Descriptor
UPDATE "LabFlag" SET "correctAnswer" = '$2b$10$EzbQWIJijRmhuNjkqxnsPO2hSBN6fv5H3fLFa66T/K.DZ8ttypxBm' WHERE title = 'File Descriptor' AND "labId" = '88ca76ae-9628-4095-b15d-3e0a9f33037e';
