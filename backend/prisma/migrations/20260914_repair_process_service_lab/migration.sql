-- Replace systemd-only content with tasks supported by the standard practice
-- container. The update is title-scoped so it is safe across environments
-- where lab IDs differ.
UPDATE "Lab"
SET
  "description" = 'Control processes with ps, pgrep, signals, and background jobs. Manage container-native services, cron jobs, and SSH configuration.',
  "briefing" = $briefing$
### Process & Service Control
Every running program is a process. Learn to inspect and control processes, then manage services using tools that work inside this Ubuntu practice container.

### Lab Environment
- Ubuntu 22.04 container with SSH and cron services
- You are logged in as `student` (password: lab123)
- Use `sudo` for system-level operations

### Key Concepts
- **PID**: unique process identifier
- **PPID**: parent process identifier
- **SIGTERM vs SIGKILL**: graceful versus forced termination
- **service**: container-compatible service management command
- **cron**: time-based job scheduler
$briefing$,
  "tasks" = '["Find the sshd processes and display their command names","Start a background process with nohup and verify it survives logout","Kill a process gracefully using SIGTERM, then forcefully with SIGKILL","Set up a cron job that runs every 5 minutes","Use the service command to check and restart SSH","Validate an SSH configuration change with sshd -t","Inspect authentication logs with grep and tail"]'::jsonb
WHERE "title" = 'Linux Fundamentals: Process & Service Management';

UPDATE "LabFlag"
SET
  "title" = 'Process Hunter',
  "description" = 'Run: ps -C sshd -o comm= | head -1. Submit the command name.',
  "correctAnswer" = '$2b$10$Zzecb5K8gC797fVvJs5jh.AyDBUt1jV3AhElh1DJ1VHIPeNqWNbIu'
WHERE "labId" IN (
  SELECT "id" FROM "Lab"
  WHERE "title" = 'Linux Fundamentals: Process & Service Management'
) AND "title" IN ('Process Hunter', 'Process Inspector');

UPDATE "LabFlag"
SET
  "title" = 'Service Inspector',
  "description" = 'Run: service ssh status. If the service is active, submit "running".',
  "correctAnswer" = '$2b$10$ZUKEPWcY8D8rVKFWP2IZTu7gAMwV48PPS6zqfdmrc7YMl33pqnmPC'
WHERE "labId" IN (
  SELECT "id" FROM "Lab"
  WHERE "title" = 'Linux Fundamentals: Process & Service Management'
) AND "title" IN ('Systemd Master', 'Service Manager');

UPDATE "LabFlag"
SET
  "title" = 'Cron Crafter',
  "description" = 'Create a cron job that writes cron_ok to /tmp/cron_proof every minute. Submit the file content.',
  "correctAnswer" = '$2b$10$Bxp83rpXcUsp1oXAsdSXf.c2WAOUAnpJrnUTbyIhg9wwQO7lDkS4e'
WHERE "labId" IN (
  SELECT "id" FROM "Lab"
  WHERE "title" = 'Linux Fundamentals: Process & Service Management'
) AND "title" IN ('Cron Crafter', 'Log Reader');

UPDATE "LabFlag"
SET
  "title" = 'Signal Handler',
  "description" = 'Run: sleep 300 & pid=$!; kill -15 $pid; wait $pid; echo $?. Submit the exit status.',
  "correctAnswer" = '$2b$10$rPz90AyrzVROXW/hCgppru9.DE/jT5ZXIkV7EaFzVI8NnJJCOY0C6'
WHERE "labId" IN (
  SELECT "id" FROM "Lab"
  WHERE "title" = 'Linux Fundamentals: Process & Service Management'
) AND "title" = 'Signal Handler';

UPDATE "LabFlag"
SET
  "title" = 'SSH Config Validator',
  "description" = 'Create a valid SSH drop-in configuration, then run: sudo sshd -t && echo valid. Submit the output.',
  "correctAnswer" = '$2b$10$jxTgarIjlAyB58j7NXFjmO7i8BkPjpdSfq8/Z7UIedAhV6bFIi8pe'
WHERE "labId" IN (
  SELECT "id" FROM "Lab"
  WHERE "title" = 'Linux Fundamentals: Process & Service Management'
) AND "title" IN ('Service Architect', 'Service Creator');
