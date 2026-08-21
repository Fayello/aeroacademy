-- =============================================
-- LAB REDESIGN: Narrative-Driven Investigations
-- Labs 1-4: Ubuntu Fundamentals Series
-- =============================================

-- =============================================
-- LAB 1: Ubuntu CLI Mastery
-- Narrative: "The Vanishing Sysadmin"
-- =============================================

UPDATE "Lab" SET
  description = 'A senior sysadmin has disappeared. Their terminal session is still open on a production server. Your mission: investigate the system, find the clues they left behind, and reconstruct what happened. You have full access — but be careful what you touch.',
  briefing = '### Incident Report: Missing Sysadmin

**Date:** Today  
**Priority:** HIGH  
**Your role:** Junior Security Analyst

A senior sysadmin was last seen working on this server 12 hours ago. They stopped responding to messages. Their terminal session is still open.

Your CISO has authorized you to investigate. You have full access to the server as `student` (password: `lab123`).

### Your Mission

Explore the system systematically. The sysadmin left clues scattered across the filesystem — in hidden files, in process listings, in disk configurations. Each clue leads to the next.

**Rules:**
- Do NOT modify files in /etc or /var — observation only
- Do NOT kill any running processes
- You CAN create files in /home/student and /tmp
- Log every finding — you will need to submit proof

### Investigation Protocol

1. **Reconnaissance** — Identify the operating system and environment
2. **Evidence Collection** — Find what the sysadmin was working on
3. **Access Analysis** — Understand the permission model
4. **Process Investigation** — Determine what is running on this server
5. **Infrastructure Recon** — Map the underlying system architecture

Good luck, analyst. The clock is ticking.',
  tasks = '["Step 1 — Identify the OS: Read the system release file to determine what Linux distribution this server runs. Command: cat /etc/os-release", "Step 2 — The sysadmin left a note: Check /home/student for any files they created. List the directory and read any text files you find.", "Step 3 — Check /etc/shadow permissions: Run ls -la /etc/shadow to see who owns the password file. This tells you about the system security model.", "Step 4 — Investigate running processes: Run ps aux to see all processes. Find PID 1 — this is the init system that controls everything.", "Step 5 — Check disk layout: Run df -h to see all mounted filesystems. Notice the filesystem type — this reveals whether you are in a container or bare metal."]'
WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery';

-- Update Lab 1 flag descriptions to be narrative-driven
UPDATE "LabFlag" SET description = 'RECONNAISSANCE: Read /etc/os-release to identify the OS. What distribution name is reported? (one word, lowercase)' 
WHERE title = 'Filesystem Navigator' AND "labId" = (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery');

UPDATE "LabFlag" SET description = 'EVIDENCE COLLECTION: The sysadmin left a proof file. Create /home/student/proof.txt with the exact content: AERO{UBUNTU_FILE_CREATE}. Submit that flag string as your answer.' 
WHERE title = 'File Creator' AND "labId" = (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery');

UPDATE "LabFlag" SET description = 'ACCESS ANALYSIS: Who owns /etc/shadow? Run ls -la /etc/shadow and identify the user in the owner column. This file controls all login passwords.' 
WHERE title = 'Permission Reader' AND "labId" = (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery');

UPDATE "LabFlag" SET description = 'PROCESS INVESTIGATION: What is PID 1? Run ps -p 1 -o comm= to get the process name. This tells you whether this is a real server, a container, or a VM.' 
WHERE title = 'Process Inspector' AND "labId" = (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery');

UPDATE "LabFlag" SET description = 'INFRASTRUCTURE RECON: Run df -h and check the last column of the root filesystem. What filesystem type is in use? This reveals whether you are on bare metal or inside a container.' 
WHERE title = 'Disk Space Expert' AND "labId" = (SELECT id FROM "Lab" WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery');


-- =============================================
-- LAB 2: File Permissions & Users
-- Narrative: "The Permission Puzzle"
-- =============================================

UPDATE "Lab" SET
  description = 'You discovered a restricted directory on the server with sensitive files. Some are readable, some are not. A colleague tells you: "The sysadmin locked everything down before disappearing. If you can figure out the permission model, you can trace what they were protecting."',
  briefing = '### Investigation: Restricted Directory

You found a directory at /home/student that contains sensitive files with unusual permissions. Some files are readable by everyone, some only by root, and some require special group membership.

Your colleague suspects the sysadmin was testing an access control system before they vanished. Your job: understand the permission model, create the right users and groups, and prove you can navigate the access control system.

### Objectives

You will:
1. Manipulate file permissions with chmod
2. Create users and groups to simulate a real team
3. Use ACLs for fine-grained access control
4. Understand special permission bits (setuid, sticky bit)

### Key Commands You Will Need

- `chmod` — change file permissions
- `useradd` — create new users
- `groupadd` — create new groups
- `setfacl` / `getfacl` — access control lists
- `stat` — detailed file info
- `id` — check user identity

**Remember:** You are `student` with password `lab123`. Use `sudo` when needed.',
  tasks = '["Step 1 — Create a test file and lock it down: Create /home/student/hello.txt, then chmod 600 to make it owner-only readable.", "Step 2 — Build the team: Create group admin_group, create user alice, add student to admin_group.", "Step 3 — Test ACLs: Use setfacl to give alice read access to hello.txt, then verify with getfacl.", "Step 4 — Explore special bits: Create /tmp/shared with sticky bit (1777). Understand what sticky bit means.", "Step 5 — Map the user landscape: Create user bob, run id bob, and understand the UID/GID system."]'
WHERE title = 'Linux Fundamentals: File Permissions & Users';

UPDATE "LabFlag" SET description = 'ACCESS CONTROL: After setting ACLs on hello.txt for user alice, run getfacl /home/student/hello.txt | grep alice. What permission string is shown for alice?' 
WHERE title = 'ACL Master';

UPDATE "LabFlag" SET description = 'GROUP MEMBERSHIP: After creating group admin_group and adding student to it, run groups student. What groups are listed? (format: "user : group1 group2")' 
WHERE title = 'Group Manager';

UPDATE "LabFlag" SET description = 'SPECIAL BITS: Create /tmp/shared and apply sticky bit with chmod 1777. Run stat -c "%a" /tmp/shared. What permission number is shown?' 
WHERE title = 'Sticky Bit Expert';

UPDATE "LabFlag" SET description = 'USER MANAGEMENT: Create user bob with a home directory. Run id bob to see the full identity. What is bob\\'s primary GID number? (just the number)' 
WHERE title = 'User Creator';

UPDATE "LabFlag" SET description = 'PERMISSION MASTERY: Create /home/student/secret.txt and set it to owner-only access (chmod 700). Run stat -c "%a" to verify. What permission number is shown?' 
WHERE title = 'chmod Master';


-- =============================================
-- LAB 3: Text Processing & Shell Scripting
-- Narrative: "The Log Decoder"
-- =============================================

UPDATE "Lab" SET
  description = 'The sysadmin was analyzing server logs before they disappeared. Their shell history shows they were hunting for something in the data — grepping, parsing, transforming. Can you follow their trail and decode what they found?',
  briefing = '### Investigation: Shell History Analysis

The missing sysadmin\\'s shell history reveals they spent hours processing text data — extracting patterns, filtering noise, and writing scripts. They were clearly investigating something.

You found their working directory at /home/student with sample data files. Their notes suggest they were building a pipeline to decode encrypted messages hidden in system logs.

### Your Mission

Recreate their text processing pipeline. Each tool you master (grep, sed, awk, cut, sort) reveals another piece of the puzzle. Write scripts to automate the analysis.

### Key Skills

- **grep** — search for patterns in files and output
- **sed** — stream editing, find and replace
- **awk** — field processing and text manipulation
- **cut** — extract specific fields from structured data
- **sort / uniq** — organize and deduplicate
- **pipe |** — chain commands together

### Data Sources

- `/etc/passwd` — user account database
- `/etc/passwd` field structure: `username:password:UID:GID:comment:home:shell`

**Tip:** Pipe character (`|`) sends the output of one command as input to the next. This is how Linux pipelines work.',
  tasks = '["Step 1 — Data pipeline: Run cat /etc/passwd | cut -d: -f1 | sort | head -5 to extract the first 5 sorted usernames.", "Step 2 — Pattern matching: Use grep to search for specific patterns. Try grep root /etc/passwd.", "Step 3 — Text transformation: Create a sample file and use sed to replace words. echo Hello World | sed s/World/AEROACADEMY/", "Step 4 — Field extraction: Use awk to print specific fields. awk -F: \"{print \\$1}\" /etc/passwd | head -3", "Step 5 — Write a script: Create count_users.sh that counts users in /etc/passwd and run it."]'
WHERE title = 'Linux Fundamentals: Text Processing & Shell Scripting';

UPDATE "LabFlag" SET description = 'PIPELINE: Run cat /etc/passwd | cut -d: -f1 | sort | head -5. Submit the 5 usernames separated by spaces (alphabetical order).' 
WHERE title = 'Pipeline Master';

UPDATE "LabFlag" SET description = 'SCRIPTING: Write and execute a script that counts the total number of lines in /etc/passwd. Submit just the number.' 
WHERE title = 'Script Writer';

UPDATE "LabFlag" SET description = 'AWK MASTERY: Run awk -F: \"{print \\$1}\" /etc/passwd | head -3 to extract usernames. Submit the first 3 separated by spaces.' 
WHERE title = 'awk Architect';

UPDATE "LabFlag" SET description = 'LOG ANALYSIS: Run grep -c root /etc/passwd to count lines containing "root". Submit the count.' 
WHERE title = 'grep Guru';

UPDATE "LabFlag" SET description = 'STREAM EDITING: Run echo "Hello World" | sed "s/World/AEROACADEMY/". Submit the exact output.' 
WHERE title = 'sed Specialist';


-- =============================================
-- LAB 4: Process & Service Management
-- Narrative: "The Ghost Service"
-- =============================================

UPDATE "Lab" SET
  description = 'A mysterious service keeps restarting on the server. The sysadmin was trying to identify and control it before they vanished. Process trees, cron jobs, signals — you need to master them all to solve this mystery.',
  briefing = '### Investigation: The Ghost Service

Something is running on this server that should not be. The sysadmin\\'s last log entry reads: "Found unauthorized process. PID changes every reboot. Tracing..."

They were investigating a process that keeps respawning. You need to:
1. Find it
2. Understand how it survives
3. Learn to control processes and services

### Investigation Areas

- **Process enumeration** — find running processes
- **Process lifecycle** — start, stop, signal processes
- **Background jobs** — nohup, & and job control
- **Scheduling** — cron jobs for recurring tasks
- **Services** — manage system services

### Key Commands

- `ps aux` / `pgrep` / `pstree` — process inspection
- `kill` — send signals to processes
- `nohup` — run processes immune to hangup
- `crontab -e` — edit cron schedule
- `service` — manage services without systemd

**Note:** This is a Docker container. Systemd is not PID 1. Use `service` commands instead of `systemctl`.',
  tasks = '["Step 1 — Find PID 1: Run cat /proc/1/comm to see what the init process is. In Docker, this is usually tail or sleep.", "Step 2 — Start a background job: Run nohup sleep 3600 & then verify it exists with pgrep sleep.", "Step 3 — Signal handling: Run kill -0 1 to test if PID 1 is alive. The exit code tells you the result.", "Step 4 — Start the SSH service: Run service ssh start then check its status with service ssh status.", "Step 5 — Cron investigation: Add a cron job with echo \"*/5 * * * * echo test\" | crontab - and list with crontab -l."]'
WHERE title = 'Linux Fundamentals: Process & Service Management';

UPDATE "LabFlag" SET description = 'INIT SYSTEM: Run cat /proc/1/comm to identify PID 1. What process name is shown? (In Docker containers, this reveals the entrypoint)' 
WHERE title = 'Process Hunter';

UPDATE "LabFlag" SET description = 'SERVICE MANAGEMENT: Start the SSH service with service ssh start, then run service ssh status 2>&1. What status line is shown? Submit the exact output.' 
WHERE title = 'Service Architect';

UPDATE "LabFlag" SET description = 'SIGNAL TESTING: Run kill -0 1 2>&1; echo $?. This tests if PID 1 is alive without killing it. What exit code is returned?' 
WHERE title = 'Signal Handler';

UPDATE "LabFlag" SET description = 'PROCESS MONITORING: After starting SSH, run service ssh status 2>&1. Does it show as running? Submit "is running" or "is not running".' 
WHERE title = 'Systemd Master';

UPDATE "LabFlag" SET description = 'CRON SETUP: Create a cron job that echoes "cron_ok" to /tmp/cron_proof every minute. Wait for it to execute, then submit the file contents.' 
WHERE title = 'Cron Crafter';

-- =============================================
-- Verify changes
-- =============================================
SELECT 'Lab redesign complete. Labs updated: ' || COUNT(*) FROM "Lab" WHERE title IN (
  'Linux Fundamentals: Ubuntu CLI Mastery',
  'Linux Fundamentals: File Permissions & Users',
  'Linux Fundamentals: Text Processing & Shell Scripting',
  'Linux Fundamentals: Process & Service Management'
);
