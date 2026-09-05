-- ============================================================
-- INLINE PRACTICE SEED: Part 2
-- Linux Fundamentals, Networking & Security,
-- Containerization & DevOps, Database Administration & Security
-- ============================================================

-- ============================================================
-- 1. LINUX FUNDAMENTALS
-- ============================================================

-- Lesson: Linux Boot Process
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'Linux Boot Process';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Identify Boot Stage from Kernel Log', 'FLAG_CAPTURE', 'A system administrator runs dmesg and sees:\n\n[    0.000000] Linux version 5.15.0-78-generic (gcc version 11.3.0)\n[    0.102341] Command line: BOOT_IMAGE=/vmlinuz-5.15.0 root=/dev/sda1\n[    1.234567] Mounting root file system\n\nAt which stage of the Linux boot process are these messages generated? Return the stage name.', 'Identify the boot stage from dmesg output.', 'Kernel initialization', 'CONTAINS', ARRAY['dmesg displays kernel ring buffer messages.', 'These messages appear after the bootloader hands control to the kernel.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'GRUB Configuration Update', 'COMMAND_ANSWER', 'After modifying /etc/default/grub to change the GRUB timeout from 5 to 2 seconds, the changes are not yet applied to the bootloader. What command must be run to regenerate the GRUB configuration file on an Ubuntu system? Return the full command.', 'Identify the command to update GRUB configuration.', 'update-grub', 'EXACT', ARRAY['The /etc/default/grub file is a template.', 'A separate command regenerates /boot/grub/grub.cfg from the template.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Systemd Target Identification', 'FLAG_CAPTURE', 'A server administrator runs systemctl get-default and receives graphical.target. They want the server to boot without a graphical interface. Which systemd target should be set as default for a headless server? Return the target name.', 'Identify the correct systemd target for a server.', 'multi-user.target', 'EXACT', ARRAY['graphical.target includes a display manager.', 'multi-user.target provides a multi-user, non-graphical environment.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Secure Boot Purpose', 'SHORT_RESPONSE', 'An organization requires all production servers to have Secure Boot enabled in UEFI. What does Secure Boot protect against during the boot process? Answer in one sentence.', 'Explain what Secure Boot does.', 'Secure Boot verifies that bootloaders and kernels are digitally signed by trusted authorities, preventing unauthorized or malicious boot code from executing.', 'CONTAINS', ARRAY['Secure Boot is a UEFI feature.', 'It checks digital signatures on boot code.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Linux Boot Process - 4 exercises seeded';
END $$;

-- Lesson: File System Navigation
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'File System Navigation';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Absolute Path Identification', 'FLAG_CAPTURE', 'You are currently in /home/deploy/projects. The directory structure is:\n\n/home/deploy/projects/webapp/src/utils/\n\nYou need to reference the file config.json located at /etc/nginx/config.json. Write the absolute path to this file from anywhere on the system.', 'Construct the absolute path to a system file.', '/etc/nginx/config.json', 'EXACT', ARRAY['Absolute paths always start from the root directory /.', 'The path does not depend on your current working directory.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Find Command for Log Rotation', 'COMMAND_ANSWER', 'You need to find all .log files under /var/log that were modified in the last 24 hours. Write the complete find command that accomplishes this, searching only for regular files (not directories).', 'Write a find command with time and type filters.', 'find /var/log -name "*.log" -type f -mtime -1', 'CONTAINS', ARRAY['The -name flag filters by filename pattern.', 'The -type f flag restricts to regular files only.', 'The -mtime -1 flag means modified less than 1 day ago.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Proc vs Sys Filesystem', 'SHORT_RESPONSE', 'A junior administrator asks: "What is the difference between /proc and /sys?" Explain the purpose of each virtual filesystem in one or two sentences.', 'Explain the purpose of /proc and /sys.', '/proc is a virtual filesystem that provides process and kernel information as files, while /sys is a virtual filesystem that exposes kernel objects, device drivers, and hardware attributes in a structured hierarchy.', 'CONTAINS', ARRAY['/proc is older and provides process information.', '/sys was introduced to provide a more structured view of kernel and hardware data.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Symbolic Link Creation', 'COMMAND_ANSWER', 'You want to create a symbolic link at /usr/local/bin/myapp that points to the actual binary at /opt/myapp/bin/myapp-v2.3. Write the ln command to create this link.', 'Create a symbolic link with the correct syntax.', 'ln -s /opt/myapp/bin/myapp-v2.3 /usr/local/bin/myapp', 'CONTAINS', ARRAY['The -s flag creates a symbolic (soft) link.', 'The first argument is the target, the second is the link name.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: File System Navigation - 4 exercises seeded';
END $$;

-- Lesson: Essential Command Line Tools
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'Essential Command Line Tools';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Count Unique IPs from Access Log', 'COMMAND_ANSWER', 'Given an Apache access log at /var/log/apache2/access.log with lines like:\n192.168.1.1 - - [04/Sep/2026:10:00:01] "GET /index.html HTTP/1.1" 200 1234\n\nWrite a command pipeline that extracts the first field (IP address) from each line, sorts them uniquely, and counts how many unique IPs made requests.', 'Build a pipeline to count unique IPs.', 'awk "{print $1}" /var/log/apache2/access.log | sort | uniq | wc -l', 'CONTAINS', ARRAY['awk "{print $1}" extracts the first field from each line.', 'sort | uniq removes duplicate lines.', 'wc -l counts the number of lines.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Standard Error Redirection', 'FLAG_CAPTURE', 'A developer runs a script that produces output on both stdout and stderr. They want to send all error messages (stderr) to a file called errors.log while still seeing normal output on the terminal. Which redirection syntax accomplishes this? Return the exact syntax.', 'Identify stderr redirection syntax.', '2>errors.log', 'EXACT', ARRAY['File descriptor 1 is stdout, file descriptor 2 is stderr.', 'The 2> syntax redirects only stderr.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Process Monitoring Pipeline', 'COMMAND_ANSWER', 'You want to find the top 5 processes consuming the most CPU on your system. Write a command pipeline using ps and sort to achieve this. The output should show PID, CPU%, MEM%, and COMMAND columns.', 'Build a pipeline to find top CPU consumers.', 'ps aux --sort=-%cpu | head -n 6', 'CONTAINS', ARRAY['ps aux shows all processes with detailed information.', '--sort=-%cpu sorts by CPU usage in descending order.', 'head -n 6 skips the header and shows top 5.'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'wc Command Options', 'FLAG_CAPTURE', 'You run the command wc -l < access.log and get the output 15234. What does this number represent? Return the meaning.', 'Interpret the wc -l output.', 'The total number of lines in the access.log file', 'CONTAINS', ARRAY['The -l flag tells wc to count lines only.', 'Input is redirected from the file using <.'], 3, 20, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Essential Command Line Tools - 4 exercises seeded';
END $$;

-- Lesson: User and Group Management
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'User and Group Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Create Service Account', 'COMMAND_ANSWER', 'A DevOps engineer needs to create a system account named "deploy" for running application services. The account should have /bin/bash as its shell, /home/deploy as its home directory, and should be a member of the "docker" group. Write the useradd command.', 'Create a user with specific options.', 'useradd -m -s /bin/bash -G docker deploy', 'CONTAINS', ARRAY['The -m flag creates the home directory.', 'The -s flag sets the login shell.', 'The -G flag adds supplementary groups.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'UID Range Interpretation', 'FLAG_CAPTURE', 'An administrator checks /etc/passwd and finds a user with UID 999. According to standard Linux conventions, what type of account is this? Return the account category.', 'Interpret UID ranges.', 'System account', 'CONTAINS', ARRAY['UID 0 is root.', 'UIDs 1-999 are reserved for system accounts.', 'UIDs 1000+ are regular user accounts.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Password Aging Policy', 'COMMAND_ANSWER', 'A security policy requires that the user "jdoe" must change their password every 90 days, with a minimum of 7 days between changes, and the password will expire 14 days after the last warning. Write the chage command to configure this.', 'Configure password aging with chage.', 'chage -M 90 -m 7 -W 14 jdoe', 'CONTAINS', ARRAY['-M sets the maximum number of days a password is valid.', '-m sets the minimum number of days between password changes.', '-W sets the number of days of warning before expiry.'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Add User to Multiple Groups', 'COMMAND_ANSWER', 'The user "webdev" needs to be added to both the "www-data" and "docker" groups without removing any existing group memberships. Write the usermod command to accomplish this.', 'Add a user to multiple groups safely.', 'usermod -aG www-data,docker webdev', 'CONTAINS', ARRAY['The -a flag appends to existing group memberships.', 'The -G flag specifies supplementary groups.', 'Multiple groups can be separated by commas.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: User and Group Management - 4 exercises seeded';
END $$;

-- Lesson: File Permissions Deep Dive
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'File Permissions Deep Dive';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Octal Permission Conversion', 'FLAG_CAPTURE', 'A file has the permission string -rwxr-x---. Convert this to its octal representation. Return only the three-digit octal number.', 'Convert symbolic permissions to octal.', '750', 'EXACT', ARRAY['r=4, w=2, x=1, none=0 for each triplet.', 'Owner: rwx = 4+2+1 = 7, Group: r-x = 4+0+1 = 5, Others: --- = 0.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'SUID Binary Permission', 'COMMAND_ANSWER', 'You need to set the SUID bit on the binary /usr/local/bin/mybackup so it runs with the permissions of its owner (root). Write the chmod command using octal notation to achieve this while keeping the existing permissions (755) intact.', 'Set SUID using octal chmod.', 'chmod 4755 /usr/local/bin/mybackup', 'CONTAINS', ARRAY['The SUID bit is represented by 4 in the thousands place of octal.', '4755 = SUID (4) + owner rwx (7) + group r-x (5) + others r-x (5).'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Sticky Bit Security', 'SHORT_RESPONSE', 'A shared directory /tmp/uploads has permissions drwxrwxrwt. The "t" at the end indicates the sticky bit is set. What specific behavior does the sticky bit enforce on this directory? Answer in one sentence.', 'Explain the sticky bit purpose.', 'The sticky bit prevents users from deleting or renaming files that they do not own in the directory, even if they have write permissions.', 'CONTAINS', ARRAY['The sticky bit is commonly set on /tmp.', 'It is represented by "t" in the last position of permissions.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'ACL Permission Grant', 'COMMAND_ANSWER', 'A developer named "alice" needs read and execute access to the directory /opt/shared, but she is not the owner and not in the owning group. Write the setfacl command to grant her rwx permissions using an Access Control List.', 'Grant ACL permissions to a specific user.', 'setfacl -m u:alice:rwx /opt/shared', 'CONTAINS', ARRAY['ACLs extend standard Unix permissions.', 'The -m flag modifies the ACL entry.', 'u:alice:rwx specifies user alice with rwx permissions.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: File Permissions Deep Dive - 4 exercises seeded';
END $$;

-- Lesson: sudo and Privilege Escalation
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'sudo and Privilege Escalation';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Sudoers Rule for Deploy', 'COMMAND_ANSWER', 'Write a sudoers line that allows the user "deploy" to run systemctl restart nginx and systemctl status nginx without a password prompt. Return the exact sudoers line.', 'Create a targeted sudoers rule.', 'deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/systemctl status nginx', 'CONTAINS', ARRAY['NOPASSWD: disables the password prompt for specific commands.', 'Specify full paths to binaries in sudoers for security.'], 3, 35, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Sudo Log Location', 'FLAG_CAPTURE', 'An incident responder needs to review sudo usage on an Ubuntu server. Which log file contains the audit trail of all sudo command executions? Return the full file path.', 'Identify the sudo log file on Ubuntu.', '/var/log/auth.log', 'EXACT', ARRAY['Ubuntu uses auth.log for authentication events.', 'CentOS/RHEL uses /var/log/secure instead.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'SUID Privilege Escalation Risk', 'SHORT_RESPONSE', 'A security audit finds that /usr/bin/find has the SUID bit set and is owned by root. Explain in one sentence how an attacker could use this misconfiguration to escalate to root privileges.', 'Explain SUID-based privilege escalation.', 'An attacker can run find with -exec to execute arbitrary commands as root, such as find / -exec /bin/bash -p \\; which spawns a root shell.', 'CONTAINS', ARRAY['SUID binaries run with the owner''s privileges.', 'The -exec flag in find allows executing arbitrary commands.'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Sudoers Validation', 'COMMAND_ANSWER', 'Before editing the sudoers file, what command should always be used to ensure syntax correctness and prevent locking yourself out of root access? Return the command name.', 'Identify the safe sudoers editing method.', 'visudo', 'EXACT', ARRAY['visudo checks syntax before saving.', 'Editing /etc/sudoers directly with a text editor can lock you out if there is a syntax error.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: sudo and Privilege Escalation - 4 exercises seeded';
END $$;

-- Lesson: Bash Scripting Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'Bash Scripting Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Special Variable Identification', 'FLAG_CAPTURE', 'In a bash script, the following special variables are used: $1, $#, $@, $?, $0. Which variable contains the number of arguments passed to the script? Return only the variable name.', 'Identify the correct bash special variable.', '$#', 'EXACT', ARRAY['$1 refers to the first argument.', '$@ refers to all arguments.', '$? holds the exit status of the last command.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Safe File Check Script', 'COMMAND_ANSWER', 'Write a bash if statement that checks whether the file /etc/nginx/nginx.conf exists and is a regular file (not a directory). If it exists, echo "Nginx config found". If not, echo "Nginx config missing". Return the complete if/else block.', 'Write a conditional file existence check.', 'if [ -f /etc/nginx/nginx.conf ]; then echo "Nginx config found"; else echo "Nginx config missing"; fi', 'CONTAINS', ARRAY['The -f test checks if a path is a regular file.', 'The -d test checks if a path is a directory.', 'The then and else clauses are separated by semicolons on a single line.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Error Handling Directives', 'SHORT_RESPONSE', 'A bash script begins with the line set -euo pipefail. Explain what each of the three flags does in one sentence each: -e, -u, and -o pipefail.', 'Explain bash error handling flags.', '-e causes the script to exit immediately if any command returns a non-zero exit status. -u treats unset variables as an error and exits. -o pipefail ensures that a pipeline returns the exit status of the last command that failed, rather than just the last command.', 'CONTAINS', ARRAY['-e stands for errexit.', '-u stands for nounset.', 'pipefail catches errors in the middle of a pipeline.'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'For Loop Iteration', 'COMMAND_ANSWER', 'Write a bash for loop that iterates over the files /var/log/syslog, /var/log/auth.log, and /var/log/dmesg, and prints the filename and line count of each using wc -l. Return the complete for loop.', 'Write a for loop with command substitution.', 'for f in /var/log/syslog /var/log/auth.log /var/log/dmesg; do echo "$f: $(wc -l < "$f")"; done', 'CONTAINS', ARRAY['$(command) captures the output of a command.', 'wc -l < file reads the file via input redirection.', 'Quote variables with "$f" to handle spaces.'], 3, 35, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Bash Scripting Fundamentals - 4 exercises seeded';
END $$;

-- Lesson: Text Processing with sed and awk
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'Text Processing with sed and awk';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Sed Global Replacement', 'COMMAND_ANSWER', 'A configuration file contains multiple instances of the word "debug" that need to be replaced with "info" for production use. Write a sed command that replaces every occurrence of "debug" with "info" in the file /etc/myapp/config.yml, editing the file in place.', 'Write a sed in-place global replacement.', 'sed -i "s/debug/info/g" /etc/myapp/config.yml', 'CONTAINS', ARRAY['The s command performs substitution.', 'The g flag replaces all occurrences per line, not just the first.', 'The -i flag edits the file in place.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Awk Field Extraction from Passwd', 'COMMAND_ANSWER', 'Write an awk command that reads /etc/passwd and prints only the username (field 1) and home directory (field 6) for all users whose UID (field 3) is greater than or equal to 1000. Use : as the field separator.', 'Filter and extract fields with awk.', 'awk -F: "$3 >= 1000 {print $1, $6}" /etc/passwd', 'CONTAINS', ARRAY['-F: sets the field separator to colon.', '$3 >= 1000 filters users with UID >= 1000.', '$1 is username, $6 is home directory.'], 3, 35, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Sed Line Deletion', 'FLAG_CAPTURE', 'A developer wants to remove all comment lines (lines starting with #) and blank lines from a configuration file using sed. What sed command accomplishes this? Return the complete command.', 'Delete comments and blank lines with sed.', 'sed -e "/^#/d" -e "/^$/d" configfile', 'CONTAINS', ARRAY['^# matches lines starting with #.', '^$ matches empty lines.', 'The d command deletes matching lines.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Awk Sum Calculation', 'COMMAND_ANSWER', 'Given an access log where field 10 is the response size in bytes, write an awk command that calculates and prints the total bandwidth used (sum of all response sizes) across all requests. Return just the awk portion.', 'Calculate a sum using awk.', 'awk "{sum += $10} END {print sum}"', 'CONTAINS', ARRAY['Summing field values uses += in the pattern block.', 'END block runs after all lines are processed.', 'NR can be used to count lines if needed.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Text Processing with sed and awk - 4 exercises seeded';
END $$;

-- Lesson: Regular Expressions
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'Regular Expressions';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Email Validation Regex', 'FLAG_CAPTURE', 'Which regex pattern correctly validates a basic email address format (user@domain.tld)?\n\nA) ^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-zA-Z]+$\nB) ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\nC) ^\\w+@\\w+\\.\\w+$\nD) ^[a-z]+@[a-z]+.[a-z]+$\n\nReturn the letter of the most correct pattern.', 'Identify the correct email validation regex.', 'B', 'EXACT', ARRAY['Pattern A does not handle dots or special chars in the local part.', 'Pattern C uses \\w which only matches word characters.', 'Pattern B handles dots, plus signs, and requires a TLD of at least 2 characters.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Grep with Regex', 'COMMAND_ANSWER', 'Write a grep command that uses extended regular expressions to find all lines in /var/log/syslog that contain a timestamp in HH:MM:SS format (e.g., 14:32:07 or 09:05:59). Return the complete grep command.', 'Use grep with extended regex for timestamp matching.', 'grep -E "[0-9]{1,2}:[0-9]{2}:[0-9]{2}" /var/log/syslog', 'CONTAINS', ARRAY['The -E flag enables extended regular expressions.', '[0-9]{1,2} matches one or two digits for the hour.', '[0-9]{2} matches exactly two digits for minutes and seconds.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Regex Quantifier Meaning', 'FLAG_CAPTURE', 'In a regular expression, the quantifier {3,5} placed after a character class means what? Return the precise meaning.', 'Interpret regex quantifiers.', 'Match between 3 and 5 occurrences of the preceding element', 'CONTAINS', ARRAY['The first number is the minimum occurrences.', 'The second number is the maximum occurrences.', '{n} matches exactly n, {n,} matches n or more.'], 3, 20, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'IP Address Regex Pattern', 'COMMAND_ANSWER', 'Write a regex pattern (using grep syntax) that matches IPv4 addresses in the format of four dot-separated octets where each octet is 1-3 digits (e.g., 192.168.1.1 or 10.0.0.255). Do not worry about validating octet ranges. Return just the pattern.', 'Construct a regex for IPv4 addresses.', '[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}', 'CONTAINS', ARRAY['Each octet is 1-3 digits.', 'The dot must be escaped as \\.', 'Four octets are separated by three dots.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Regular Expressions - 4 exercises seeded';
END $$;

-- Lesson: Kernel Architecture
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'How the Kernel Boots';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Kernel Module Loading', 'COMMAND_ANSWER', 'A system administrator needs to load the br_netfilter kernel module (required for Kubernetes networking) and verify it loaded successfully. Write the two commands to accomplish this, one after the other.', 'Load and verify a kernel module.', 'modprobe br_netfilter && lsmod | grep br_netfilter', 'CONTAINS', ARRAY['modprobe loads a kernel module and its dependencies.', 'lsmod lists currently loaded modules.', 'grep verifies the module is listed.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Kernel Messages Command', 'FLAG_CAPTURE', 'What command displays the kernel ring buffer messages, which is useful for diagnosing hardware issues and driver loading during boot? Return only the command name.', 'Identify the kernel log viewer.', 'dmesg', 'EXACT', ARRAY['dmesg reads from /var/log/dmesg or the kernel ring buffer.', 'It shows messages from kernel initialization and driver loading.'], 3, 20, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Kernel Type Comparison', 'SHORT_RESPONSE', 'Linux uses a monolithic kernel architecture while QNX uses a microkernel. What is the fundamental difference between these two approaches in terms of where OS services run? Answer in one sentence.', 'Compare kernel architectures.', 'In a monolithic kernel like Linux, all OS services (file system, networking, device drivers) run in kernel space with direct hardware access, while in a microkernel like QNX, most services run in user space and communicate through the kernel via message passing.', 'CONTAINS', ARRAY['Monolithic kernels include all services in kernel space.', 'Microkernels keep services in user space for better isolation.', 'Hybrid kernels like Windows NT combine both approaches.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Module Information', 'COMMAND_ANSWER', 'You need to find out which kernel version a loaded module was compiled for. Write the command that displays detailed information about the ext4 kernel module including its version, author, and license.', 'Get detailed info about a kernel module.', 'modinfo ext4', 'EXACT', ARRAY['modinfo displays information about a kernel module.', 'It shows the filename, license, description, author, and version.', 'modprobe is for loading, modinfo is for information.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Kernel Architecture - 4 exercises seeded';
END $$;

-- Lesson: Process Management
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Process Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Graceful Process Termination', 'FLAG_CAPTURE', 'You need to gracefully stop a running Nginx worker process with PID 4523. Which signal should you send to request a clean shutdown without forcefully killing the process? Return the signal name and number.', 'Identify the correct signal for graceful shutdown.', 'SIGTERM (15)', 'EXACT', ARRAY['SIGTERM (15) requests graceful termination.', 'SIGKILL (9) forcefully terminates and cannot be caught.', 'SIGHUP (1) is used for reload/reinitialize.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Find Process by Name', 'COMMAND_ANSWER', 'Write a command to find all running processes whose command name contains "java" and display their PID, CPU usage, memory usage, and full command. Use ps with appropriate flags.', 'Search for processes by name with ps.', 'ps aux | grep "[j]ava"', 'CONTAINS', ARRAY['ps aux shows all processes with detailed info.', 'Using [j]ava as the grep pattern avoids matching the grep process itself.', 'Alternatively: pgrep -a java'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Zombie Process Explanation', 'SHORT_RESPONSE', 'A server has several processes in the "Z" (zombie) state showing in top. Explain what causes a zombie process and the correct way to clean it up. Answer in two sentences.', 'Explain zombie processes and cleanup.', 'A zombie process occurs when a child process has finished execution but its parent has not yet called wait() to read its exit status. To clean up, either send SIGCHLD to the parent to prompt it to reap the child, or kill the parent process so init (PID 1) adopts and reaps the zombie.', 'CONTAINS', ARRAY['Zombie processes have terminated but still have an entry in the process table.', 'Only the parent process can reap a zombie with wait().', 'If the parent is killed, init reaps the zombie.'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Process Priority Adjustment', 'COMMAND_ANSWER', 'A batch processing job is consuming too much CPU and affecting the web server. Write the command to start the batch job with a lower priority (nice value of 10). Then write the command to change the priority of a running process with PID 7891 to nice value 5.', 'Set process priority with nice and renice.', 'nice -n 10 /path/to/batch-job.sh && renice -n 5 -p 7891', 'CONTAINS', ARRAY['nice sets the initial nice value when starting a process.', 'renice changes the nice value of a running process.', 'Higher nice values mean lower priority (range -20 to 19).'], 3, 35, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Process Management - 4 exercises seeded';
END $$;

-- Lesson: Memory Management
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Memory Management';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Memory Usage Command', 'FLAG_CAPTURE', 'Which command displays physical and swap memory usage in human-readable format (e.g., "2.1Gi" instead of bytes)? Return the command with its most common flag.', 'Identify the memory reporting command.', 'free -h', 'EXACT', ARRAY['free displays total, used, and free memory.', 'The -h flag formats output in human-readable units.', '/proc/meminfo provides more detailed information.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Swappiness Interpretation', 'SHORT_RESPONSE', 'A Linux server has vm.swappiness set to 10. Explain what this value means in terms of how the kernel decides between using physical RAM and swap space. Answer in one sentence.', 'Interpret the swappiness parameter.', 'A swappiness value of 10 means the kernel has a strong preference for keeping processes in physical RAM and will only swap when absolutely necessary, aggressively reclaiming file cache instead.', 'CONTAINS', ARRAY['Swappiness ranges from 0 to 200 (default 60).', 'Lower values favor keeping processes in RAM.', 'Higher values favor using swap space and keeping file cache.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'OOM Killer Activation', 'FLAG_CAPTURE', 'When does the Linux OOM (Out of Memory) Killer activate? Return the specific condition that triggers it.', 'Identify when OOM Killer activates.', 'When the system runs out of physical memory and swap, and cannot allocate memory for a new process', 'CONTAINS', ARRAY['The OOM Killer is a last-resort mechanism.', 'It terminates processes to free memory.', 'dmesg shows which process was killed.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Process Memory Inspection', 'COMMAND_ANSWER', 'You suspect a Java application is leaking memory. Write the command to view the detailed memory mappings of the process with PID 3456, including its virtual memory size, resident set size, and shared pages.', 'Inspect process memory usage.', 'cat /proc/3456/status | grep -E "VmSize|VmRSS|VmShared"', 'CONTAINS', ARRAY['/proc/[pid]/status contains process status information.', 'VmSize is virtual memory size.', 'VmRSS is resident set size (physical memory used).'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Memory Management - 4 exercises seeded';
END $$;

-- Lesson: Performance Profiling
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Performance Profiling and Tracing';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'System Call Tracing Tool', 'FLAG_CAPTURE', 'Which command-line tool traces all system calls made by a program and the signals it receives? This is essential for understanding what a program is doing at the kernel level. Return the tool name.', 'Identify the system call tracing tool.', 'strace', 'EXACT', ARRAY['strace intercepts and records system calls.', 'ltrace traces library calls instead.', 'perf is used for hardware-level profiling.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Flame Graph Interpretation', 'SHORT_RESPONSE', 'When analyzing a flame graph generated from perf profiling data, what does the width of each bar represent? Answer in one sentence.', 'Explain flame graph semantics.', 'The width of each bar in a flame graph represents the proportion of time or samples spent in that function and its callees, with wider bars indicating more time spent.', 'CONTAINS', ARRAY['Flame graphs visualize call stack profiles.', 'The x-axis represents the percentage of samples.', 'The y-axis represents the call stack depth.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'CPU Bottleneck Indicator', 'FLAG_CAPTURE', 'When running top, you observe that a process has %usr at 85% and %sys at 10% with %wa at 1%. What type of performance bottleneck does this indicate? Return the bottleneck category.', 'Identify the bottleneck from top output.', 'CPU-bound', 'EXACT', ARRAY['High %usr indicates the process is spending most time in user space.', '%sys indicates kernel time, %wa indicates I/O wait.', 'Low %wa means the process is not waiting for disk I/O.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Library Call Tracing', 'COMMAND_ANSWER', 'You need to trace all library calls made by the curl command to diagnose a DNS resolution issue. Write the command that traces library calls from curl when it fetches https://example.com.', 'Use ltrace to trace library calls.', 'ltrace curl https://example.com', 'CONTAINS', ARRAY['ltrace traces calls to shared libraries.', 'It shows the function name and return value.', 'Use -c for a summary of call counts.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Performance Profiling - 4 exercises seeded';
END $$;

-- Lesson: Kernel Tuning Parameters
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Kernel Security';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Enable IP Forwarding', 'COMMAND_ANSWER', 'A server is being configured as a router between two networks. Write the sysctl command to temporarily enable IPv4 forwarding. Then write the sysctl command to verify the change took effect.', 'Enable and verify IP forwarding with sysctl.', 'sysctl -w net.ipv4.ip_forward=1 && sysctl net.ipv4.ip_forward', 'CONTAINS', ARRAY['sysctl -w sets a parameter temporarily.', 'The parameter net.ipv4.ip_forward controls packet forwarding.', 'Running sysctl without -w shows the current value.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Persistent Sysctl Configuration', 'SHORT_RESPONSE', 'You have set a kernel parameter using sysctl -w, but the change is lost after reboot. How do you make this change permanent? Describe the process in one or two sentences.', 'Explain persistent sysctl configuration.', 'Add the parameter to /etc/sysctl.conf or create a .conf file in /etc/sysctl.d/ with the format net.ipv4.ip_forward=1, then run sysctl -p to apply the configuration.', 'CONTAINS', ARRAY['sysctl -w changes are temporary.', '/etc/sysctl.conf is loaded at boot.', 'Files in /etc/sysctl.d/ are modular configuration overrides.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Socket Backlog Parameter', 'FLAG_CAPTURE', 'Which sysctl parameter controls the maximum length of the queue for incoming connections that have not yet been accepted by the application? This is critical for high-traffic web servers. Return the parameter name.', 'Identify the socket backlog parameter.', 'net.core.somaxconn', 'EXACT', ARRAY['This parameter sets the maximum socket connection backlog.', 'It affects how many connections can wait in the accept queue.', 'Web servers like Nginx benefit from increasing this value.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'ASLR Security Hardening', 'COMMAND_ANSWER', 'Address Space Layout Randomization (ASLR) is a security feature that randomizes memory addresses. Write the sysctl command to enable full ASLR on the system. What value should the parameter be set to?', 'Enable ASLR with sysctl.', 'sysctl -w kernel.randomize_va_space=2', 'CONTAINS', ARRAY['kernel.randomize_va_space controls ASLR.', '0 disables ASLR, 1 enables partial randomization.', '2 enables full randomization of all memory regions.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Kernel Tuning Parameters - 4 exercises seeded';
END $$;

-- Lesson: Resource Limits and cgroups
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Kernel & System Internals' AND l.title = 'Namespaces and Containers';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Set Open File Limit', 'COMMAND_ANSWER', 'A high-traffic web server needs to handle thousands of concurrent connections. Write the ulimit command to set the maximum number of open file descriptors for the current shell session to 65535.', 'Set the file descriptor limit with ulimit.', 'ulimit -n 65535', 'CONTAINS', ARRAY['-n controls the maximum open file descriptors.', 'ulimit -a shows all current limits.', 'For permanent changes, edit /etc/security/limits.conf.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Cgroups v2 Memory Throttling', 'SHORT_RESPONSE', 'In cgroups v2, there are two memory control parameters: memory.max and memory.high. What is the difference between them? Answer in one or two sentences.', 'Explain cgroups v2 memory parameters.', 'memory.max is a hard limit that triggers OOM kill when exceeded, while memory.high is a soft limit that throttles (slows down) the group''s memory allocation when exceeded, giving it time to free memory before hitting the hard limit.', 'CONTAINS', ARRAY['memory.max is the hard ceiling.', 'memory.high causes throttling, not immediate termination.', 'This two-tier approach provides graceful degradation.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Docker CPU Limit', 'FLAG_CAPTURE', 'When running a Docker container, which flag limits the container to using a maximum of 2 CPU cores? Return the exact flag and value syntax.', 'Identify the Docker CPU limit flag.', '--cpus=2', 'EXACT', ARRAY['The --cpus flag specifies the number of CPUs.', 'It accepts fractional values like 1.5.', '--cpu-shares sets relative weight instead of hard limits.'], 3, 20, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Check System Resource Limits', 'COMMAND_ANSWER', 'Write the command to display ALL current resource limits for the current shell session, including file size, CPU time, memory, open files, and processes. Return the command.', 'View all ulimit settings.', 'ulimit -a', 'EXACT', ARRAY['ulimit -a displays all soft limits.', 'ulimit -aH displays all hard limits.', 'Individual limits can be checked with -n (files), -u (processes), etc.'], 3, 20, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Resource Limits and cgroups - 4 exercises seeded';
END $$;


-- ============================================================
-- 2. NETWORKING & SECURITY
-- ============================================================

-- Lesson: OSI Model and TCP/IP
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'How Packets Actually Move';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'MAC Address Layer', 'FLAG_CAPTURE', 'At which OSI model layer do network switches operate using MAC addresses to forward frames? Return the layer name and number.', 'Identify the OSI layer for MAC addresses.', 'Data Link Layer (Layer 2)', 'CONTAINS', ARRAY['MAC addresses are hardware addresses burned into NICs.', 'Switches forward frames based on MAC address tables.', 'Layer 3 uses IP addresses, not MAC addresses.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'HTTP Protocol Layer', 'FLAG_CAPTURE', 'HTTP, HTTPS, DNS, FTP, and SMTP all operate at which layer of the OSI model? Return the layer name only.', 'Identify the OSI layer for application protocols.', 'Application Layer', 'EXACT', ARRAY['Application Layer is Layer 7.', 'This layer provides network services directly to applications.', 'Layer 6 (Presentation) handles encryption/compression.'], 3, 20, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'TCP Three-Way Handshake', 'SHORT_RESPONSE', 'Describe the three steps of the TCP three-way handshake that establishes a connection between a client and server. List each step in order.', 'Describe the TCP handshake process.', 'Step 1: Client sends SYN (synchronize) to server. Step 2: Server responds with SYN-ACK (synchronize-acknowledge). Step 3: Client sends ACK (acknowledge) to confirm the connection.', 'CONTAINS', ARRAY['SYN initiates the connection.', 'SYN-ACK acknowledges the SYN and sends its own.', 'ACK confirms the server''s SYN.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Common Port Numbers', 'FLAG_CAPTURE', 'Match each service to its default port number: SSH, HTTP, HTTPS, MySQL, PostgreSQL. Return the five port numbers separated by commas in that order.', 'Identify common service ports.', '22, 80, 443, 3306, 5432', 'EXACT', ARRAY['SSH uses port 22 for secure remote access.', 'HTTP is 80, HTTPS is 443.', 'MySQL uses 3306, PostgreSQL uses 5432.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: OSI Model and TCP/IP - 4 exercises seeded';
END $$;

-- Lesson: Subnetting and CIDR
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'Subnetting and IP Addressing';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Host Count Calculation', 'FLAG_CAPTURE', 'A /26 subnet mask provides how many usable host IP addresses? Use the formula 2^(host bits) - 2. Return only the final number.', 'Calculate usable hosts in a subnet.', '62', 'EXACT', ARRAY['A /26 mask has 32 - 26 = 6 host bits.', '2^6 = 64 total addresses.', 'Subtract 2 for network and broadcast addresses.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'CIDR for 14 Hosts', 'FLAG_CAPTURE', 'You need a subnet that provides exactly 14 usable host IP addresses. What CIDR prefix length should you use? Return the CIDR notation (e.g., /27).', 'Determine CIDR for specific host count.', '/28', 'EXACT', ARRAY['2^h - 2 >= 14 means h = 4 (2^4 = 16, minus 2 = 14).', '32 - 4 = 28, so /28.', '/28 provides exactly 14 usable hosts.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Private IP Range Identification', 'FLAG_CAPTURE', 'Which of these IP addresses is NOT in a private range as defined by RFC 1918: 10.0.0.1, 172.16.0.1, 192.168.1.1, or 8.8.8.1? Return the address.', 'Identify non-private IP addresses.', '8.8.8.1', 'EXACT', ARRAY['Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.', '8.8.8.x is Google''s public DNS.', 'RFC 1918 defines the private address space.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Subnet Mask Conversion', 'FLAG_CAPTURE', 'Convert the CIDR prefix /22 to its dotted decimal subnet mask. Return the full mask (e.g., 255.255.255.0).', 'Convert CIDR to dotted decimal.', '255.252.0.0', 'EXACT', ARRAY['/22 means 22 bits are set to 1.', 'First 22 bits = 11111111.11111111.11111100.00000000.', 'In decimal: 255.252.0.0.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Subnetting and CIDR - 4 exercises seeded';
END $$;

-- Lesson: DNS and Name Resolution
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'DNS';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'AAAA Record Purpose', 'FLAG_CAPTURE', 'Which DNS record type maps a domain name to an IPv6 address? Return the record type name.', 'Identify the IPv6 DNS record type.', 'AAAA', 'EXACT', ARRAY['A records map to IPv4 addresses.', 'AAAA (quad-A) records map to IPv6 addresses.', 'CNAME records create aliases to other domains.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'DNS Resolution Order', 'SHORT_RESPONSE', 'Describe the typical order of DNS resolution from the moment a user types a URL in their browser. List the steps from local to authoritative. Answer in 2-4 sentences.', 'Describe DNS resolution flow.', 'The browser first checks its local DNS cache, then the OS resolver cache, then queries the configured recursive resolver. The recursive resolver queries root servers, then TLD servers (.com, .org), then the authoritative name server for the domain. The response is cached at each level for the TTL duration.', 'CONTAINS', ARRAY['Local caches include browser, OS, and router.', 'Recursive resolvers do the heavy lifting.', 'Root servers point to TLD servers.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Dig MX Query', 'COMMAND_ANSWER', 'Write the dig command to query only the MX (mail exchange) records for the domain example.com. The output should show only the answer section.', 'Query specific DNS records with dig.', 'dig example.com MX +short', 'CONTAINS', ARRAY['dig performs DNS lookups.', 'MX records identify mail servers for a domain.', '+short outputs only the answer without extra info.'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'DNSSEC Purpose', 'SHORT_RESPONSE', 'What security problem does DNSSEC solve that regular DNS does not? Answer in one sentence.', 'Explain DNSSEC security purpose.', 'DNSSEC adds cryptographic signatures to DNS records to prevent DNS spoofing and cache poisoning by allowing resolvers to verify that responses are authentic and have not been tampered with.', 'CONTAINS', ARRAY['DNS responses are normally unauthenticated.', 'Cache poisoning injects false DNS records.', 'DNSSEC uses digital signatures to verify authenticity.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: DNS and Name Resolution - 4 exercises seeded';
END $$;

-- Lesson: Firewall Types and Configuration
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'Firewalls';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Allow SSH with iptables', 'COMMAND_ANSWER', 'Write an iptables rule that allows incoming SSH connections (port 22) from any source IP address. The rule should be appended to the INPUT chain of the filter table.', 'Write an iptables rule for SSH.', 'iptables -A INPUT -p tcp --dport 22 -j ACCEPT', 'CONTAINS', ARRAY['-A appends a rule to the chain.', '-p tcp specifies TCP protocol.', '--dport 22 specifies destination port 22 (SSH).'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Stateful vs Stateless Firewall', 'FLAG_CAPTURE', 'A firewall that tracks the state of active connections (ESTABLISHED, RELATED, NEW) and makes filtering decisions based on connection state is called what? Return the firewall type.', 'Identify the firewall type by behavior.', 'Stateful inspection firewall', 'CONTAINS', ARRAY['Packet filtering firewalls examine individual packets.', 'Stateful firewalls maintain a connection state table.', 'Application layer firewalls inspect payload content.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Default Deny Policy', 'SHORT_RESPONSE', 'A security engineer wants to implement a default-deny firewall policy. Explain what this means and why it is considered a security best practice. Answer in one or two sentences.', 'Explain the default-deny principle.', 'A default-deny policy blocks all traffic by default and only explicitly allows traffic that is needed. This is a best practice because it ensures only known, authorized traffic can pass, reducing the attack surface.', 'CONTAINS', ARRAY['Default deny means the INPUT chain policy is set to DROP.', 'Only explicitly allowed rules pass traffic.', 'This follows the principle of least privilege.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Allow Established Connections', 'COMMAND_ANSWER', 'Write the iptables rule that allows all packets belonging to established or related connections through the INPUT chain. This rule is typically placed first in a firewall configuration.', 'Allow established connections in iptables.', 'iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT', 'CONTAINS', ARRAY['ESTABLISHED matches packets in existing connections.', 'RELATED matches packets related to existing connections (like ICMP errors).', 'The conntrack module tracks connection states.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Firewall Types and Configuration - 4 exercises seeded';
END $$;

-- Lesson: VPN Technologies
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'VPN Technologies';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'WireGuard Identification', 'FLAG_CAPTURE', 'Which modern VPN protocol is known for its simplicity, small codebase (~4,000 lines vs OpenVPN''s 100,000+), and uses ChaCha20 for encryption? Return the protocol name.', 'Identify the modern VPN protocol.', 'WireGuard', 'EXACT', ARRAY['WireGuard is a newer VPN protocol.', 'It is implemented directly in the Linux kernel.', 'OpenVPN is the traditional alternative.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Split Tunneling Risk', 'SHORT_RESPONSE', 'A remote worker uses a VPN with split tunneling enabled. What security risk does split tunneling introduce compared to a full tunnel configuration? Answer in one sentence.', 'Explain split tunneling security risk.', 'Split tunneling allows VPN users to access both corporate resources and the public internet simultaneously, which means an attacker who compromises the user''s machine on the public internet could potentially pivot to the corporate network through the VPN connection.', 'CONTAINS', ARRAY['Split tunneling sends some traffic through VPN, some directly.', 'Full tunnel routes all traffic through the VPN.', 'Split tunneling reduces bandwidth usage on the VPN.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Perfect Forward Secrecy', 'FLAG_CAPTURE', 'What does the acronym PFS stand for in VPN and TLS context? What does it protect against?', 'Define Perfect Forward Secrecy.', 'PFS stands for Perfect Forward Secrecy. It ensures that even if a long-term private key is compromised, past session keys cannot be derived from it, protecting previously recorded traffic from decryption.', 'CONTAINS', ARRAY['PFS uses ephemeral key exchange (DHE or ECDHE).', 'Each session generates unique session keys.', 'Without PFS, compromising the server key decrypts all past traffic.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'VPN Protocol Selection', 'SHORT_RESPONSE', 'An organization needs to choose between IPsec and SSL/TLS VPN for remote employee access. Which is easier to deploy through firewalls and why? Answer in one or two sentences.', 'Compare VPN deployment characteristics.', 'SSL/TLS VPN (like OpenVPN) is easier to deploy through firewalls because it typically uses TCP port 443 which is almost always allowed, whereas IPsec uses multiple protocols (ESP, AH, IKE) that may be blocked by NAT devices and restrictive firewalls.', 'CONTAINS', ARRAY['IPsec operates at the network layer.', 'SSL/TLS VPN operates at the application layer.', 'IPsec requires NAT traversal (NAT-T) to work through NAT.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: VPN Technologies - 4 exercises seeded';
END $$;

-- Lesson: Network Address Translation
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'Switching and VLANs';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'PAT Identification', 'FLAG_CAPTURE', 'A home router allows 50 devices to share one public IP address by using different port numbers for each connection. Which type of NAT is this? Return the type name and its full name.', 'Identify the NAT type by description.', 'PAT (Port Address Translation)', 'CONTAINS', ARRAY['PAT maps multiple private IPs to one public IP using ports.', 'Also known as NAT overload.', 'Static NAT is one-to-one, dynamic NAT uses a pool.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'MASQUERADE Rule', 'COMMAND_ANSWER', 'Write the iptables rule that enables internet access for a network behind a Linux router by masquerading all outgoing traffic on the eth0 interface.', 'Write the iptables MASQUERADE rule.', 'iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE', 'CONTAINS', ARRAY['MASQUERADE is used in the nat table.', 'POSTROUTING chain is where NAT rewriting happens.', '-o eth0 specifies the outgoing interface.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'DNAT Port Forwarding', 'SHORT_RESPONSE', 'What does DNAT stand for and in what scenario would you use it? Answer in one sentence.', 'Explain DNAT and its use case.', 'DNAT stands for Destination Network Address Translation and is used to redirect incoming traffic from a public IP and port to a different internal IP and port, commonly used to publish internal services to the internet.', 'CONTAINS', ARRAY['DNAT changes the destination IP/port of incoming packets.', 'It is used for port forwarding.', 'SNAT (Source NAT) changes the source IP of outgoing packets.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'IP Forwarding Requirement', 'SHORT_RESPONSE', 'Why must IP forwarding be enabled on a Linux machine that performs NAT for other devices? Answer in one sentence.', 'Explain why IP forwarding is needed for NAT.', 'IP forwarding must be enabled because by default Linux drops packets that are not destined for itself, and NAT requires the kernel to route packets between different network interfaces destined for other hosts.', 'CONTAINS', ARRAY['IP forwarding allows a Linux box to act as a router.', 'It is disabled by default for security.', 'Enable with sysctl -w net.ipv4.ip_forward=1.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Network Address Translation - 4 exercises seeded';
END $$;

-- Lesson: Intrusion Detection Systems
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'Network Security Monitoring';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'NIDS vs HIDS', 'FLAG_CAPTURE', 'An IDS sensor is connected to a SPAN port on a network switch and monitors all traffic passing through the network segment. Is this a NIDS or HIDS? Return the acronym.', 'Classify the IDS deployment type.', 'NIDS', 'EXACT', ARRAY['NIDS = Network-based IDS, monitors network traffic.', 'HIDS = Host-based IDS, monitors a single system.', 'NIDS sensors are typically placed at network boundaries.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Signature-Based Detection', 'FLAG_CAPTURE', 'An IDS compares incoming network traffic against a database of known attack patterns (signatures). What is this detection method called? Return the detection type name.', 'Identify the IDS detection method.', 'Signature-based detection', 'CONTAINS', ARRAY['Signature-based detection uses predefined patterns.', 'It cannot detect zero-day attacks or new variations.', 'Anomaly-based detection establishes a baseline and alerts on deviations.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'False Positive Tuning', 'SHORT_RESPONSE', 'An IDS generates hundreds of alerts per hour for legitimate SSH connections to a production server. How should the security team handle this? Describe the tuning approach in one or two sentences.', 'Explain IDS false positive reduction.', 'The security team should create a whitelist rule that excludes SSH connections to the known production server IP from generating alerts, or adjust the alert threshold for SSH traffic, so that the team can focus on genuinely suspicious activity.', 'CONTAINS', ARRAY['False positives dilute the effectiveness of IDS.', 'Whitelisting known-good traffic reduces noise.', 'Tuning should be done iteratively without weakening detection.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'IDS vs IPS', 'FLAG_CAPTURE', 'An IDS detects a brute-force SSH attack and automatically adds a firewall rule to block the attacking IP. Is this an IDS or IPS? Return the acronym and explain the difference in one sentence.', 'Distinguish IDS from IPS.', 'IPS (Intrusion Prevention System). An IDS only generates alerts (passive), while an IPS can automatically block or modify traffic to prevent the detected attack (active).', 'CONTAINS', ARRAY['IDS = passive detection and alerting.', 'IPS = active prevention and blocking.', 'IPS sits inline with traffic, IDS uses a mirror/TAP.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Intrusion Detection Systems - 4 exercises seeded';
END $$;

-- Lesson: Log Management and SIEM
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'Network Security Monitoring';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'ELK Stack Components', 'FLAG_CAPTURE', 'The ELK Stack is a popular open-source log management solution. What do the letters E, L, and K stand for? Return the three component names separated by commas.', 'Identify ELK Stack components.', 'Elasticsearch, Logstash, Kibana', 'EXACT', ARRAY['Elasticsearch is the search and analytics engine.', 'Logstash is the data processing pipeline.', 'Kibana is the visualization dashboard.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Centralized Logging Purpose', 'SHORT_RESPONSE', 'Why is centralized log collection important for security monitoring? Explain the main advantage over checking logs on individual servers. Answer in one sentence.', 'Explain centralized logging benefit.', 'Centralized log collection allows security teams to aggregate, correlate, and search across all system logs from a single location, enabling detection of multi-stage attacks that span multiple servers which would be impossible to identify by checking individual servers.', 'CONTAINS', ARRAY['Centralized logging uses tools like rsyslog or Fluentd.', 'It enables cross-system correlation.', 'Individual server logs provide a limited, local view.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'SIEM Correlation', 'FLAG_CAPTURE', 'In SIEM, "correlation" refers to analyzing relationships between log events from different sources. Which type of attack is most effectively detected through correlation: a single failed login, or a sequence of reconnaissance, lateral movement, and data exfiltration across multiple systems? Return the attack type.', 'Understand SIEM correlation value.', 'A sequence of reconnaissance, lateral movement, and data exfiltration across multiple systems', 'CONTAINS', ARRAY['Correlation connects events across time and sources.', 'Single events rarely reveal multi-stage attacks.', 'Correlation rules define the patterns to detect.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Syslog Protocol', 'COMMAND_ANSWER', 'Write the rsyslog configuration line that sends all system logs (auth, kern, daemon) at priority info and above to a remote log server at 10.0.0.50 using TCP. Return the configuration directive.', 'Configure remote syslog forwarding.', '*.* @@10.0.0.50', 'CONTAINS', ARRAY['*.* means all facilities at all priorities.', '@@ specifies TCP (single @ is UDP).', 'The format is facility.priority @destination.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Log Management and SIEM - 4 exercises seeded';
END $$;

-- Lesson: Network Traffic Analysis
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'Packet Analysis';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Tcpdump HTTP Capture', 'COMMAND_ANSWER', 'Write the tcpdump command to capture only HTTP traffic (port 80) on the eth0 interface, limiting the capture to the first 100 packets. Save the output to a file called http_capture.pcap.', 'Capture HTTP traffic with tcpdump.', 'tcpdump -i eth0 port 80 -c 100 -w http_capture.pcap', 'CONTAINS', ARRAY['-i eth0 specifies the interface.', 'port 80 filters for HTTP traffic.', '-c 100 limits to 100 packets.', '-w saves raw packets to a file.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Beaconing Detection', 'FLAG_CAPTURE', 'A security analyst notices a workstation making DNS queries to a suspicious domain every exactly 60 seconds for the past 4 hours. This regular periodic communication pattern is an indicator of what type of activity? Return the term.', 'Identify the attack pattern.', 'Command and Control (C2) beaconing', 'CONTAINS', ARRAY['Beaconing is regular, periodic communication to C2 servers.', 'Attackers use beaconing to maintain persistent access.', 'The regularity (exactly 60 seconds) is a key indicator.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Wireshark TCP RST Filter', 'COMMAND_ANSWER', 'Write a Wireshark display filter that shows only TCP packets with the RST (reset) flag set. Return the filter expression.', 'Write a Wireshark display filter for RST packets.', 'tcp.flags.reset == 1', 'CONTAINS', ARRAY['Wireshark uses display filters for analysis.', 'tcp.flags.reset matches the RST flag.', 'RST packets indicate connection resets.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'DNS Tunneling Indicator', 'FLAG_CAPTURE', 'A network monitor observes DNS queries with unusually long subdomain names (50+ characters) containing Base64-encoded data being sent to an external domain. What type of data exfiltration technique is this? Return the technique name.', 'Identify DNS tunneling.', 'DNS tunneling', 'CONTAINS', ARRAY['DNS tunneling encodes data in DNS queries.', 'Normal DNS queries have short, readable subdomains.', 'Attackers use it to bypass firewalls since DNS is rarely blocked.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Network Traffic Analysis - 4 exercises seeded';
END $$;

-- Lesson: Network Troubleshooting Methodology
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'Network Troubleshooting';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'MTR Route Trace', 'COMMAND_ANSWER', 'Write the mtr command to trace the route and measure packet loss to the public DNS server at 8.8.8.8, sending 100 packets and running in report mode (non-interactive).', 'Use mtr for route tracing.', 'mtr -r -c 100 8.8.8.8', 'CONTAINS', ARRAY['mtr combines ping and traceroute.', '-r puts mtr in report mode (non-interactive).', '-c 100 sends 100 packets.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'CompTIA Troubleshooting Order', 'FLAG_CAPTURE', 'According to the CompTIA network troubleshooting methodology, what is the correct first step before forming any theories? Return the step name.', 'Identify the first troubleshooting step.', 'Identify the problem', 'EXACT', ARRAY['The CompTIA methodology starts with identification.', 'Step 1: Identify the problem.', 'Step 2: Establish a theory of probable cause.'], 3, 20, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Traceroute Interpretation', 'FLAG_CAPTURE', 'A traceroute to a web server shows 100% packet loss at hop 5, but the remaining hops (6-10) respond normally. What does this indicate? Return the most likely explanation.', 'Interpret traceroute packet loss.', 'Hop 5 is configured to not respond to ICMP TTL exceeded messages (firewall blocking ICMP), but traffic is still being forwarded correctly to subsequent hops', 'CONTAINS', ARRAY['Traceroute uses ICMP TTL exceeded messages.', 'A firewall may block ICMP but still forward traffic.', '100% loss at one hop with subsequent hops responding usually means ICMP filtering, not a real failure.'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'DNS Resolution Test', 'COMMAND_ANSWER', 'A user reports they cannot reach https://example.com. Write the sequence of commands you would run to determine if it is a DNS issue, a connectivity issue, or a server issue. List three commands in order.', 'Diagnose connectivity issues step by step.', 'nslookup example.com && ping -c 3 example.com && curl -I https://example.com', 'CONTAINS', ARRAY['nslookup tests DNS resolution.', 'ping tests network connectivity to the resolved IP.', 'curl tests the actual HTTP connection.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Network Troubleshooting Methodology - 4 exercises seeded';
END $$;

-- Lesson: Packet Analysis and Forensics
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'Packet Analysis';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Reconstruct HTTP Conversation', 'COMMAND_ANSWER', 'In Wireshark, you have captured HTTP traffic and want to see the full request and response body of a specific HTTP conversation. What Wireshark menu action reconstructs the complete HTTP stream? Return the action path.', 'Find HTTP stream reconstruction in Wireshark.', 'Right-click the packet -> Follow -> TCP Stream', 'CONTAINS', ARRAY['Wireshark can follow TCP streams.', 'This reconstructs the full conversation in order.', 'The result shows the request and response in plain text.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Self-Signed Certificate Indicator', 'FLAG_CAPTURE', 'During packet analysis, you observe a workstation connecting to an external server on port 443, and the TLS handshake shows a self-signed certificate that was issued moments ago. What type of attack does this indicate? Return the attack type.', 'Identify the threat from TLS anomalies.', 'Man-in-the-Middle (MITM) attack', 'CONTAINS', ARRAY['Legitimate servers use CA-signed certificates.', 'Self-signed certs on public servers indicate interception.', 'Recently generated certs are suspicious for established domains.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Pcap File Preservation', 'SHORT_RESPONSE', 'During a network forensics investigation, why is it important to preserve the original pcap file and never modify it? What forensic concept does this relate to? Answer in one or two sentences.', 'Explain evidence preservation.', 'The original pcap file must be preserved as-is to maintain its integrity as digital evidence and ensure the chain of custody. Modifying the file would invalidate it in legal proceedings and compromise the investigation, relating to the forensic principle of evidence integrity.', 'CONTAINS', ARRAY['Chain of custody requires untouched original evidence.', 'Always work on copies, never the original.', 'Use file hashes (SHA-256) to verify integrity.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Port Scan Detection', 'FLAG_CAPTURE', 'A packet capture shows a single source IP sending SYN packets to ports 22, 80, 443, 3306, and 8080 on a target server within 5 seconds, each receiving either SYN-ACK or RST responses. What type of scan is this? Return the scan name.', 'Identify the port scan type.', 'SYN scan (half-open scan)', 'CONTAINS', ARRAY['A SYN scan sends SYN packets without completing the handshake.', 'It is also called a half-open scan because the full TCP connection is never established.', 'Nmap defaults to SYN scan when run as root.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Packet Analysis and Forensics - 4 exercises seeded';
END $$;

-- Lesson: Performance Monitoring Tools
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'Network Security Monitoring';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Bandwidth Per Connection', 'FLAG_CAPTURE', 'Which command-line tool shows real-time bandwidth usage broken down by individual network connection (source IP, destination IP, port)? Return the tool name.', 'Identify the per-connection bandwidth tool.', 'iftop', 'EXACT', ARRAY['iftop shows bandwidth per connection.', 'nethogs shows bandwidth per process.', 'nload shows aggregate interface traffic.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Extended IOstat', 'COMMAND_ANSWER', 'Write the iostat command that shows extended I/O statistics (including IOPS, throughput, and latency) for all disks, refreshing every 2 seconds. Include the flag for extended statistics.', 'Use iostat for disk I/O monitoring.', 'iostat -xz 2', 'CONTAINS', ARRAY['-x shows extended statistics.', '-z omits idle devices.', 'The trailing number is the interval in seconds.'], 3, 30, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Load Average Meaning', 'SHORT_RESPONSE', 'A server with 4 CPU cores shows a load average of 6.0. What does this load average indicate about the system? Answer in one sentence.', 'Interpret load average relative to CPU count.', 'A load average of 6.0 on a 4-core system indicates the CPU is overloaded with 50% more processes waiting for CPU time than can be simultaneously served, meaning some processes are queuing.', 'CONTAINS', ARRAY['Load average represents the number of processes in runnable or waiting states.', 'Load > number of cores indicates CPU saturation.', 'Load < number of cores means the CPU is underutilized.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Network Interface Stats', 'COMMAND_ANSWER', 'Write the ss command that shows all listening TCP sockets with their process IDs and program names. This is useful for identifying which services are listening on which ports.', 'Use ss to show listening sockets.', 'ss -tulnp', 'CONTAINS', ARRAY['-t shows TCP sockets.', '-u shows UDP sockets.', '-l shows only listening sockets.', '-n shows numeric ports (no DNS resolution).', '-p shows process information.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Performance Monitoring Tools - 4 exercises seeded';
END $$;


-- ============================================================
-- 3. CONTAINERIZATION & DEVOPS
-- ============================================================

-- Lesson: Docker Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'Containerization with Docker';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Run Nginx Container', 'COMMAND_ANSWER', 'Write the docker run command to start an nginx:alpine container in detached mode, mapping host port 8080 to container port 80, and naming the container "web".', 'Start a container with specific options.', 'docker run -d -p 8080:80 --name web nginx:alpine', 'CONTAINS', ARRAY['-d runs the container in detached (background) mode.', '-p 8080:80 maps host port 8080 to container port 80.', '--name gives the container a human-readable name.', 'Use specific image tags instead of latest.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Image vs Container Difference', 'SHORT_RESPONSE', 'Explain the fundamental difference between a Docker image and a Docker container. Answer in one or two sentences.', 'Distinguish image from container.', 'A Docker image is a read-only template containing the application code, runtime, libraries, and dependencies, while a container is a running instance of an image with its own writable filesystem, network, and process space.', 'CONTAINS', ARRAY['Images are immutable templates.', 'Containers are running instances with mutable state.', 'Multiple containers can run from the same image.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Container Cleanup', 'FLAG_CAPTURE', 'What docker command removes ALL stopped containers from the system? Return the full command.', 'Identify the cleanup command.', 'docker container prune', 'CONTAINS', ARRAY['docker container prune removes stopped containers.', 'docker system prune removes containers, networks, images, and build cache.', 'docker rm removes specific containers by name or ID.'], 3, 20, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Exec into Running Container', 'COMMAND_ANSWER', 'Write the command to open an interactive bash shell inside a running container named "web". The shell should have a TTY allocated.', 'Access a running container shell.', 'docker exec -it web bash', 'CONTAINS', ARRAY['docker exec runs a command in a running container.', '-i keeps stdin open.', '-t allocates a pseudo-TTY.', 'Some containers use sh instead of bash (e.g., Alpine).'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Docker Fundamentals - 4 exercises seeded';
END $$;

-- Lesson: Image Building and Optimization
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'CI/CD Pipelines';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Layer Caching Optimization', 'COMMAND_ANSWER', 'In a Node.js Dockerfile, you have two operations: COPY . . (copies all source code) and RUN npm install. These are currently in the wrong order for optimal layer caching. Write the correct two-line Dockerfile sequence that maximizes build cache hits when only source code changes (not package.json).', 'Optimize Dockerfile layer ordering.', 'COPY package.json package-lock.json ./\nRUN npm ci --production', 'CONTAINS', ARRAY['Copy package.json first to cache the dependency layer.', 'RUN npm install after copying package files.', 'Source code changes won''t invalidate the npm install layer.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Multi-Stage Build Purpose', 'SHORT_RESPONSE', 'What is the primary purpose of multi-stage builds in Docker? Why would you use them instead of a single-stage build? Answer in one or two sentences.', 'Explain multi-stage builds.', 'Multi-stage builds separate the build environment from the runtime environment, allowing you to compile or build artifacts in a heavy builder stage and copy only the necessary output to a minimal final image, dramatically reducing image size and attack surface.', 'CONTAINS', ARRAY['Builder stages can include compilers and dev tools.', 'Final stages should only include runtime dependencies.', 'This is especially important for compiled languages like Go or Java.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Alpine Base Image', 'FLAG_CAPTURE', 'Which of these Docker base images produces the smallest final image: ubuntu:22.04, node:18, or node:18-alpine? Return the image name.', 'Identify the smallest base image.', 'node:18-alpine', 'EXACT', ARRAY['Alpine Linux is designed to be minimal (~5MB base).', 'Ubuntu images are much larger (~77MB).', 'Standard node images include many unnecessary packages.'], 3, 20, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Non-Root User Directive', 'COMMAND_ANSWER', 'Write the Dockerfile instruction that creates a non-root user called "appuser" with UID 1001 and sets it as the user for subsequent instructions. This is a critical security best practice.', 'Run containers as non-root.', 'RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser\nUSER appuser', 'CONTAINS', ARRAY['Running as root inside a container is a security risk.', 'The USER directive sets the user for subsequent instructions.', 'Use adduser/addgroup for Alpine, useradd/groupadd for Debian/Ubuntu.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Image Building and Optimization - 4 exercises seeded';
END $$;

-- Lesson: Docker Networking
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'Monitoring and Observability';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Host Network Mode', 'FLAG_CAPTURE', 'Which Docker network type removes network isolation entirely, allowing the container to use the host machine''s network stack directly? Return the network type name.', 'Identify the non-isolated network mode.', 'host', 'EXACT', ARRAY['host networking removes network isolation.', 'bridge is the default isolated network.', 'overlay enables multi-host networking.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Container DNS Resolution', 'SHORT_RESPONSE', 'How do containers on a custom Docker bridge network resolve each other by name? Explain the DNS mechanism. Answer in one or two sentences.', 'Explain container DNS resolution.', 'Docker provides an embedded DNS server at 127.0.0.11 that resolves container names and service names to their IP addresses on custom bridge networks, allowing containers to communicate using friendly names instead of IP addresses.', 'CONTAINS', ARRAY['DNS resolution only works on custom bridge networks.', 'The default bridge network requires legacy linking or IP addresses.', 'Container names must be unique within a network.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Port Mapping Syntax', 'COMMAND_ANSWER', 'Write the docker run flag that maps host port 3306 to container port 3306, but only binds to the localhost interface (not all interfaces) for security. This is for a MySQL container.', 'Configure localhost-only port binding.', '-p 127.0.0.1:3306:3306', 'CONTAINS', ARRAY['-p host:container maps ports.', 'Prefixing with 127.0.0.1 limits binding to localhost.', 'Without the prefix, it binds to 0.0.0.0 (all interfaces).'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Internal Network Isolation', 'SHORT_RESPONSE', 'You have a Docker network for your database containers that should not have any internet access. What Docker network option prevents containers on this network from reaching external hosts? Explain in one sentence.', 'Isolate containers from the internet.', 'The --internal flag creates a network that is completely isolated from external traffic, meaning containers on this network can communicate with each other but cannot reach the internet or any networks outside Docker.', 'CONTAINS', ARRAY['--internal prevents external connectivity.', 'Containers on internal networks can still talk to each other.', 'Use internal networks for databases and sensitive services.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Docker Networking - 4 exercises seeded';
END $$;

-- Lesson: Docker Compose Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'Docker Compose and Multi-Service Apps';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Compose Up Command', 'COMMAND_ANSWER', 'Write the docker compose command to start all services defined in docker-compose.yml in detached mode. The command should also build images if they don''t exist.', 'Start services with docker compose.', 'docker compose up -d --build', 'CONTAINS', ARRAY['docker compose up starts all services.', '-d runs in detached mode.', '--build forces rebuilding images before starting.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Service Dependencies', 'SHORT_RESPONSE', 'In a docker-compose.yml, what does the depends_on directive do, and what limitation does it have regarding service readiness? Answer in one or two sentences.', 'Explain compose service dependencies.', 'depends_on controls the startup order of services (the dependent service starts after the specified service), but it only waits for the container to start, not for the application inside to be ready. Use health checks with condition: service_healthy for true readiness.', 'CONTAINS', ARRAY['depends_on controls startup order.', 'It does not wait for the service to be fully ready.', 'Health checks with condition: service_healthy solve this.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Environment Variable File', 'FLAG_CAPTURE', 'In a docker-compose.yml, what is the default filename that docker compose reads for environment variable substitution (the .env file)? Return the filename.', 'Identify the default env file name.', '.env', 'EXACT', ARRAY['docker compose automatically reads .env in the project root.', 'You can specify a different file with env_file in the service definition.', 'Environment variables in .env are used for variable substitution in the compose file.'], 3, 20, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Compose Down with Volumes', 'COMMAND_ANSWER', 'Write the docker compose command that stops and removes all containers, networks, AND named volumes defined in the compose file. This is a destructive operation used for fresh starts.', 'Remove everything including volumes.', 'docker compose down -v', 'CONTAINS', ARRAY['docker compose down stops and removes containers.', '-v removes named volumes declared in the volumes section.', 'Without -v, volumes are preserved.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Docker Compose Fundamentals - 4 exercises seeded';
END $$;

-- Lesson: Multi-Service Architecture
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'Configuration Management with Ansible';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Network Segmentation Reason', 'SHORT_RESPONSE', 'In a multi-service Docker Compose application with nginx, api, and db services, why should the database container be on a separate network from the frontend? Answer in one sentence.', 'Explain network segmentation purpose.', 'Placing the database on a separate backend network ensures that only the API service can communicate with it, while the frontend nginx cannot directly access the database, limiting the blast radius if the frontend is compromised.', 'CONTAINS', ARRAY['Network segmentation limits lateral movement.', 'Frontend services should not directly access databases.', 'Different networks provide isolation at the Docker level.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Health Check Configuration', 'COMMAND_ANSWER', 'Write a health check for a web service in docker-compose.yml that checks if the service is responding on port 8000 at the /health endpoint every 30 seconds, with a 10-second timeout and 3 retries before marking as unhealthy.', 'Define a health check in compose.', 'healthcheck:\n  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]\n  interval: 30s\n  timeout: 10s\n  retries: 3', 'CONTAINS', ARRAY['The test command should return 0 for healthy.', 'curl -f returns a non-zero exit code on HTTP errors.', 'interval, timeout, and retries control the check behavior.'], 3, 35, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Service Dependency Order', 'FLAG_CAPTURE', 'In a stack with nginx (reverse proxy), api (backend), and db (PostgreSQL), which service should the api service depend on, and which should nginx depend on? Return the dependency chain as: nginx->?, api->?.', 'Determine correct service dependencies.', 'nginx->api, api->db', 'CONTAINS', ARRAY['The reverse proxy depends on the backend.', 'The backend depends on the database.', 'Each service depends on the one it directly communicates with.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Named Volume for Persistence', 'COMMAND_ANSWER', 'Write the volumes section of a docker-compose.yml that defines a named volume called "db_data" for PostgreSQL data persistence. Then show how to reference it in the db service.', 'Define and use named volumes.', 'volumes:\n  db_data:\n\nservices:\n  db:\n    image: postgres:15-alpine\n    volumes:\n      - db_data:/var/lib/postgresql/data', 'CONTAINS', ARRAY['Named volumes persist data beyond container lifecycle.', 'Define volumes at the top level and reference in services.', 'The mount path inside the container depends on the image.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Multi-Service Architecture - 4 exercises seeded';
END $$;

-- Lesson: Production Deployment
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'Infrastructure as Code with Terraform';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Memory Limit Configuration', 'COMMAND_ANSWER', 'Write the deploy.resources section in docker-compose.yml that limits a service to 512MB of RAM and 0.5 CPU cores. Include both memory and CPU limits.', 'Set resource limits in compose.', 'deploy:\n  resources:\n    limits:\n      memory: 512M\n      cpus: "0.5"', 'CONTAINS', ARRAY['deploy.resources.limits sets hard resource ceilings.', 'Memory is specified in MB or GB.', 'CPU is specified as a decimal (0.5 = half a core).'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Restart Policy', 'FLAG_CAPTURE', 'Which Docker restart policy ensures a container always restarts unless it was explicitly stopped by a user? Return the policy name.', 'Identify the correct restart policy.', 'always', 'EXACT', ARRAY['always restarts the container unless manually stopped.', 'unless-stopped restarts unless stopped, but not after daemon restart.', 'on-failure only restarts on non-zero exit codes.', 'no never restarts.'], 3, 20, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Secrets vs Environment Variables', 'SHORT_RESPONSE', 'What is the security difference between using Docker secrets and environment variables for storing sensitive data like database passwords? Answer in one or two sentences.', 'Compare secrets and env vars.', 'Docker secrets are stored encrypted, mounted as files in /run/secrets, and only accessible to services that explicitly request them, while environment variables are visible in container inspection, process listings, and Docker Compose files, making them less secure for sensitive data.', 'CONTAINS', ARRAY['Secrets are encrypted at rest and in transit.', 'Env vars can be leaked through docker inspect.', 'Secrets are preferred for production sensitive data.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Log Rotation Configuration', 'COMMAND_ANSWER', 'Write the logging configuration in docker-compose.yml that uses the json-file driver, limits each log file to 10MB, and keeps a maximum of 3 rotated log files per container.', 'Configure Docker log rotation.', 'logging:\n  driver: json-file\n  options:\n    max-size: "10m"\n    max-file: "3"', 'CONTAINS', ARRAY['json-file is the default logging driver.', 'max-size limits individual log file size.', 'max-file limits the number of rotated log files.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Production Deployment - 4 exercises seeded';
END $$;

-- Lesson: Container Orchestration Concepts
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'Kubernetes Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Smallest Kubernetes Unit', 'FLAG_CAPTURE', 'What is the smallest deployable unit in Kubernetes that contains one or more containers sharing networking and storage? Return the object name.', 'Identify the basic K8s unit.', 'Pod', 'EXACT', ARRAY['A Pod wraps one or more containers.', 'Pods share a network namespace and can share volumes.', 'Deployments manage sets of Pods.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Self-Healing Explanation', 'SHORT_RESPONSE', 'How does Kubernetes achieve self-healing for application containers? Explain the mechanism in one or two sentences.', 'Explain Kubernetes self-healing.', 'Kubernetes continuously monitors the health of Pods through liveness and readiness probes. When a liveness probe fails, the kubelet restarts the container. When a Pod is deleted or a node fails, the ReplicaSet controller creates a new Pod on a healthy node to maintain the desired replica count.', 'CONTAINS', ARRAY['Liveness probes detect when a container is stuck or dead.', 'Readiness probes control whether a Pod receives traffic.', 'ReplicaSet ensures the desired number of Pods are always running.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Service Object Purpose', 'FLAG_CAPTURE', 'What Kubernetes object provides a stable network endpoint (IP address and DNS name) for a dynamic set of Pods, enabling service discovery and load balancing? Return the object name.', 'Identify the K8s networking object.', 'Service', 'EXACT', ARRAY['A Service provides a stable endpoint for Pods.', 'Pods are ephemeral and get new IPs when restarted.', 'Services use labels to select which Pods to route to.'], 3, 20, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Deployment vs ReplicaSet', 'SHORT_RESPONSE', 'What is the relationship between a Kubernetes Deployment and a ReplicaSet? How do they work together? Answer in one or two sentences.', 'Explain Deployment and ReplicaSet relationship.', 'A Deployment manages one or more ReplicaSets, handling rollouts, rollbacks, and updates. When you update a Deployment, it creates a new ReplicaSet with the desired configuration and gradually scales down the old ReplicaSet, enabling zero-downtime rolling updates.', 'CONTAINS', ARRAY['Deployments are higher-level abstractions.', 'ReplicaSets maintain the desired number of Pod replicas.', 'Deployments handle versioning through ReplicaSet history.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Container Orchestration Concepts - 4 exercises seeded';
END $$;

-- Lesson: Deploying Node.js Applications
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'Git and Version Control';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'PM2 Cluster Mode', 'COMMAND_ANSWER', 'Write the PM2 command to start a Node.js application (app.js) in cluster mode, using all available CPU cores. This maximizes performance on multi-core servers.', 'Start Node.js app with PM2 clustering.', 'pm2 start app.js -i max', 'CONTAINS', ARRAY['pm2 start launches the application.', '-i max uses all available CPU cores.', '-i 4 would use exactly 4 instances.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Production NODE_ENV', 'FLAG_CAPTURE', 'What value should the NODE_ENV environment variable be set to for a production Node.js deployment? This disables development features and enables production optimizations.', 'Set correct NODE_ENV for production.', 'production', 'EXACT', ARRAY['NODE_ENV=production enables Express optimizations.', 'It disables verbose error messages and development features.', 'NODE_ENV=development is for local development only.'], 3, 20, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'PM2 Startup Configuration', 'COMMAND_ANSWER', 'Write the PM2 command that saves the current process list and generates a startup script so that your PM2-managed applications automatically restart when the server reboots.', 'Save PM2 process list for auto-restart.', 'pm2 save && pm2 startup', 'CONTAINS', ARRAY['pm2 save saves the current process list.', 'pm2 startup generates a system startup script.', 'Together they ensure apps survive server reboots.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Production Install Command', 'FLAG_CAPTURE', 'What npm command should be used instead of npm install in a production Dockerfile to ensure deterministic, reproducible builds using the lock file? Return the command.', 'Use the correct npm install variant.', 'npm ci --production', 'CONTAINS', ARRAY['npm ci installs from the lock file exactly.', '--production skips devDependencies.', 'npm install may update the lock file, causing non-deterministic builds.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Deploying Node.js Applications - 4 exercises seeded';
END $$;

-- Lesson: Containerized Deployment
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'Containerization with Docker';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Production npm Command', 'COMMAND_ANSWER', 'In a production Dockerfile for a Node.js application, what npm command should replace "npm install" to ensure deterministic builds from the lock file and exclude devDependencies? Return the full command with the correct flag.', 'Use npm ci for production builds.', 'npm ci --production', 'CONTAINS', ARRAY['npm ci does a clean install from package-lock.json.', '--production excludes devDependencies.', 'npm install may modify the lock file.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Non-Root Container Security', 'SHORT_RESPONSE', 'Why should Docker containers run as non-root users? Explain the security risk of running as root in a container. Answer in one or two sentences.', 'Explain non-root container security.', 'Running as root in a container means that if an attacker escapes the container or exploits a vulnerability, they gain root access on the host system. Running as a non-root user limits the damage to the container''s own filesystem and capabilities.', 'CONTAINS', ARRAY['Root inside a container can map to root on the host.', 'Container escape vulnerabilities exist in the kernel.', 'The USER directive in Dockerfile sets the runtime user.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Image Vulnerability Scanning', 'FLAG_CAPTURE', 'What is the purpose of scanning Docker images for vulnerabilities before deploying them to production? Return the security concept name.', 'Identify image scanning purpose.', 'Supply chain security', 'CONTAINS', ARRAY['Vulnerability scanning identifies known CVEs in image layers.', 'Tools like Trivy, Snyk, and Docker Scout scan images.', 'Scanning should be integrated into CI/CD pipelines.'], 3, 20, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Read-Only Filesystem', 'COMMAND_ANSWER', 'Write the docker run flag that makes the container filesystem read-only, preventing modification of system files. Combined with specific writable mounts, this significantly hardens container security.', 'Make container filesystem read-only.', '--read-only', 'EXACT', ARRAY['--read-only mounts the root filesystem as read-only.', 'Use --tmpfs for temporary writable directories.', 'Combine with --cap-drop to drop unnecessary Linux capabilities.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Containerized Deployment - 4 exercises seeded';
END $$;

-- Lesson: Zero-Downtime Deployments
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'Incident Response and SRE Practices';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Blue-Green Deployment', 'FLAG_CAPTURE', 'Which deployment strategy maintains two identical production environments and instantly switches traffic from the old to the new version? Return the deployment type name.', 'Identify the blue-green strategy.', 'Blue-Green deployment', 'EXACT', ARRAY['Blue-green maintains two full environments.', 'Traffic is switched instantly via load balancer or DNS.', 'Provides instant rollback by switching back.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Canary Deployment Concept', 'SHORT_RESPONSE', 'What is a canary deployment? Explain how it differs from a blue-green deployment in one or two sentences.', 'Explain canary deployment.', 'A canary deployment gradually rolls out changes to a small subset of users first, monitoring for errors before expanding to the full fleet. Unlike blue-green which switches all traffic instantly, canary deployments incrementally increase traffic to the new version.', 'CONTAINS', ARRAY['Canary releases test with real traffic on a small scale.', 'If errors occur, only a small percentage of users are affected.', 'Traffic percentage is gradually increased.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Rolling Update Behavior', 'FLAG_CAPTURE', 'In a Kubernetes rolling update, what happens to the existing Pods when a new version is deployed? Return the update mechanism name.', 'Identify the rolling update mechanism.', 'Rolling update', 'EXACT', ARRAY['Rolling updates gradually replace old Pods with new ones.', 'The Deployment creates new Pods before terminating old ones.', 'maxUnavailable and maxSurge control the rollout speed.'], 3, 20, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Database Migration Strategy', 'SHORT_RESPONSE', 'When deploying a new application version that changes the database schema, what migration strategy ensures zero downtime? Answer in one or two sentences.', 'Explain backward-compatible migrations.', 'Use the expand-contract pattern: first add new columns/tables without removing old ones (expand), deploy the new application version that works with both old and new schema, then remove deprecated columns in a subsequent release (contract). This ensures both old and new app versions can work with the database during the rollout.', 'CONTAINS', ARRAY['Expand-contract migrations are backward-compatible.', 'Never remove columns in the same release as the app change.', 'Feature flags can help transition between schema versions.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Zero-Downtime Deployments - 4 exercises seeded';
END $$;


-- ============================================================
-- 4. DATABASE ADMINISTRATION & SECURITY
-- ============================================================
-- NOTE: These exercises target lessons that should exist in the
-- Database Administration & Security course. If any lesson title
-- does not match, the DO block will safely insert nothing.
-- ============================================================

-- Lesson: SQL Fundamentals
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Database Administration & Security' AND l.title = 'Database Fundamentals';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'SELECT Query Construction', 'COMMAND_ANSWER', 'Write a SQL query that selects the name and email columns from a "users" table where the "created_at" column is within the last 30 days. Use CURRENT_DATE for the date comparison.', 'Write a SELECT query with WHERE clause.', 'SELECT name, email FROM users WHERE created_at >= CURRENT_DATE - INTERVAL ''30 days''', 'CONTAINS', ARRAY['SELECT specifies which columns to retrieve.', 'The WHERE clause filters rows.', 'INTERVAL ''30 days'' subtracts 30 days from the current date.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'JOIN Types', 'FLAG_CAPTURE', 'You have two tables: "orders" (with user_id) and "users" (with id). You want to list all orders with the corresponding user name, but also include orders that have no matching user. Which JOIN type should you use? Return the JOIN type name.', 'Identify the correct JOIN type.', 'LEFT JOIN', 'EXACT', ARRAY['INNER JOIN only returns matching rows from both tables.', 'LEFT JOIN returns all rows from the left table and matching rows from the right.', 'RIGHT JOIN returns all rows from the right table.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'GROUP BY Aggregation', 'COMMAND_ANSWER', 'Write a SQL query that counts the number of orders per user from the "orders" table, returning the user_id and the count of orders. Only show users with more than 5 orders.', 'Write a GROUP BY query with HAVING.', 'SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id HAVING COUNT(*) > 5', 'CONTAINS', ARRAY['GROUP BY groups rows by a column.', 'COUNT(*) counts rows in each group.', 'HAVING filters groups (unlike WHERE which filters rows).'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'INSERT Statement', 'COMMAND_ANSWER', 'Write a SQL INSERT statement that adds a new user to the "users" table with name "Alice", email "alice@example.com", and role "admin". Include the created_at timestamp.', 'Write a complete INSERT statement.', 'INSERT INTO users (name, email, role, created_at) VALUES (''Alice'', ''alice@example.com'', ''admin'', NOW())', 'CONTAINS', ARRAY['INSERT INTO specifies the table and columns.', 'VALUES provides the data for each column.', 'NOW() or CURRENT_TIMESTAMP provides the current timestamp.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: SQL Fundamentals - 4 exercises seeded';
END $$;

-- Lesson: PostgreSQL Configuration
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Database Administration & Security' AND l.title = 'PostgreSQL Administration';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Connection Limit', 'FLAG_CAPTURE', 'In postgresql.conf, which parameter controls the maximum number of concurrent connections to the PostgreSQL server? Return the parameter name.', 'Identify the connection limit parameter.', 'max_connections', 'EXACT', ARRAY['max_connections limits total simultaneous connections.', 'The default is typically 100.', 'Each connection uses shared memory, so increasing it requires more RAM.'], 3, 20, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Shared Buffers Setting', 'SHORT_RESPONSE', 'What is the recommended value for shared_buffers on a PostgreSQL server with 16GB of RAM? Explain why this value is chosen. Answer in one sentence.', 'Configure shared_buffers.', 'Set shared_buffers to 25% of total RAM (4GB for 16GB system), because PostgreSQL uses its own buffer cache separate from the OS page cache, and allocating too much leaves insufficient memory for the OS cache and other processes.', 'CONTAINS', ARRAY['shared_buffers is PostgreSQL''s main cache.', '25% of RAM is the general recommendation.', 'Too much can cause memory pressure on the OS.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'WAL Level Configuration', 'FLAG_CAPTURE', 'Which PostgreSQL WAL (Write-Ahead Log) level must be set to enable logical replication and point-in-time recovery? Return the parameter value.', 'Identify the WAL level for replication.', 'logical', 'EXACT', ARRAY['WAL levels: minimal, replica, logical.', 'replica enables physical replication and archival.', 'logical enables logical decoding for replication slots.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'pg_hba.conf Purpose', 'SHORT_RESPONSE', 'What is the purpose of the pg_hba.conf file in PostgreSQL? What does "HBA" stand for? Answer in one or two sentences.', 'Explain pg_hba.conf.', 'pg_hba.conf stands for Host-Based Authentication and controls which clients can connect to the PostgreSQL server, from which IP addresses, using which authentication method (password, certificate, etc.), and to which databases.', 'CONTAINS', ARRAY['HBA = Host-Based Authentication.', 'It is the first line of defense for client access.', 'Changes require a PostgreSQL reload to take effect.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: PostgreSQL Configuration - 4 exercises seeded';
END $$;

-- Lesson: MySQL Migration
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Database Administration & Security' AND l.title = 'MySQL Administration';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'mysqldump Command', 'COMMAND_ANSWER', 'Write the mysqldump command that backs up a database called "shopdb" with the user "admin" to a file called shopdb_backup.sql. The dump should include the database creation statement and use single-transaction mode for InnoDB consistency.', 'Back up a MySQL database.', 'mysqldump -u admin -p --single-transaction --databases shopdb > shopdb_backup.sql', 'CONTAINS', ARRAY['--single-transaction ensures consistent InnoDB backup.', '--databases includes the CREATE DATABASE statement.', 'Output is redirected to a file with >.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Data Type Mapping', 'FLAG_CAPTURE', 'When migrating from MySQL to PostgreSQL, which MySQL data type maps to PostgreSQL''s "TEXT" type? Return the MySQL type name.', 'Map MySQL types to PostgreSQL.', 'TEXT or LONGTEXT', 'CONTAINS', ARRAY['MySQL TEXT maps to PostgreSQL TEXT.', 'MySQL VARCHAR(255) also maps to PostgreSQL TEXT.', 'PostgreSQL TEXT has no practical length limit.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Migration Validation Query', 'COMMAND_ANSWER', 'After migrating a table called "products" from MySQL to PostgreSQL, write a SQL query that counts the total number of rows in both databases to verify the migration was complete. Return a query that shows the count.', 'Validate row counts after migration.', 'SELECT COUNT(*) FROM products', 'CONTAINS', ARRAY['Run the same COUNT(*) query on both source and destination.', 'Compare the results to ensure they match.', 'Also validate specific row values for critical data.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Migration Strategy Order', 'SHORT_RESPONSE', 'What is the correct order of steps for a zero-downtime database migration from MySQL to PostgreSQL? List the steps in order.', 'Outline migration steps.', 'Step 1: Set up PostgreSQL and configure replication. Step 2: Migrate schema and data. Step 3: Set up dual-write (write to both databases). Step 4: Validate data consistency. Step 5: Switch reads to PostgreSQL. Step 6: Switch writes to PostgreSQL. Step 7: Decommission MySQL.', 'CONTAINS', ARRAY['Always test the migration in staging first.', 'Dual-write ensures no data loss during transition.', 'Keep rollback capability until fully validated.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: MySQL Migration - 4 exercises seeded';
END $$;

-- Lesson: MongoDB
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Database Administration & Security' AND l.title = 'MongoDB';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Document Query Syntax', 'COMMAND_ANSWER', 'Write a MongoDB query that finds all documents in the "users" collection where the "age" field is greater than 25 and the "status" field equals "active". Return the find() method call.', 'Write a MongoDB find query.', 'db.users.find({ age: { $gt: 25 }, status: "active" })', 'CONTAINS', ARRAY['db.collection.find() queries documents.', '$gt is the greater-than comparison operator.', 'Multiple conditions in the same object are AND.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Aggregation Pipeline', 'COMMAND_ANSWER', 'Write a MongoDB aggregation pipeline that groups documents in the "orders" collection by "category" and calculates the total amount and count of orders for each category. Return the aggregate() call.', 'Build a MongoDB aggregation pipeline.', 'db.orders.aggregate([ { $group: { _id: "$category", totalAmount: { $sum: "$amount" }, orderCount: { $sum: 1 } } } ])', 'CONTAINS', ARRAY['The $group stage groups documents by a field.', '$sum accumulates values.', '_id in $group is the grouping key.'], 3, 35, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Index Creation', 'COMMAND_ANSWER', 'Write the MongoDB command to create a compound index on the "users" collection on the "email" field (ascending) and "created_at" field (descending). Name the index "email_created_idx".', 'Create a compound index in MongoDB.', 'db.users.createIndex({ email: 1, created_at: -1 }, { name: "email_created_idx" })', 'CONTAINS', ARRAY['1 represents ascending order.', '-1 represents descending order.', 'Compound indexes speed up queries on multiple fields.'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Replica Set Purpose', 'SHORT_RESPONSE', 'What is the primary purpose of a MongoDB replica set? Answer in one sentence.', 'Explain MongoDB replica sets.', 'A MongoDB replica set provides high availability and data redundancy by maintaining multiple copies of data across different servers, automatically electing a new primary if the current primary fails.', 'CONTAINS', ARRAY['A replica set has one primary and multiple secondaries.', 'The primary handles all write operations.', 'Secondaries replicate data from the primary.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: MongoDB - 4 exercises seeded';
END $$;

-- Lesson: SQL Injection Prevention
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Database Administration & Security' AND l.title = 'SQL Injection Deep Dive';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'Parameterized Query Fix', 'COMMAND_ANSWER', 'The following Python code is vulnerable to SQL injection (uses string concatenation with user input). Rewrite this using parameterized queries to prevent SQL injection. Return the fixed line of code using %s placeholder.', 'Fix SQL injection with parameterized queries.', 'cursor.execute("SELECT * FROM users WHERE username = %s", (username,))', 'CONTAINS', ARRAY['Parameterized queries separate SQL from data.', 'Use %s as placeholder in Python DB-API.', 'The parameters are passed as a tuple.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Stored Procedure Security', 'SHORT_RESPONSE', 'How do stored procedures help prevent SQL injection? What is their limitation compared to parameterized queries? Answer in one or two sentences.', 'Explain stored procedure security.', 'Stored procedures pre-compile the SQL logic on the server, reducing the attack surface by not concatenating user input into SQL strings. However, they are not a complete defense if they still use dynamic SQL internally, and parameterized queries are generally preferred for application-level protection.', 'CONTAINS', ARRAY['Stored procedures encapsulate SQL logic.', 'They can still be vulnerable if using dynamic SQL.', 'Parameterized queries are the primary defense.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Least Privilege Database User', 'SHORT_RESPONSE', 'A web application connects to a PostgreSQL database using a user called "app_user". What permissions should this user have? Answer in one or two sentences following the principle of least privilege.', 'Apply least privilege to database users.', 'The app_user should only have SELECT, INSERT, UPDATE, and DELETE permissions on the specific tables it needs, and should not have CREATE, DROP, ALTER, or administrative privileges. It should not be able to access system tables or modify the database schema.', 'CONTAINS', ARRAY['Grant only the minimum permissions needed.', 'Avoid using the database owner or superuser for applications.', 'Use separate accounts for read and write operations if possible.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'WAF SQL Injection Rule', 'COMMAND_ANSWER', 'Write a basic WAF (Web Application Firewall) rule that blocks HTTP requests containing the SQL injection pattern "OR 1=1" in any parameter value. Return the rule as a simple regex pattern.', 'Create a WAF rule for SQL injection.', '.*\\bOR\\b\\s+\\d+=\\d+.*', 'CONTAINS', ARRAY['WAF rules use regex to detect malicious patterns.', '\\b matches word boundaries.', 'The pattern should match common SQL injection payloads.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: SQL Injection Prevention - 4 exercises seeded';
END $$;

-- Lesson: Access Control
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Database Administration & Security' AND l.title = 'Database Access Control';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'GRANT Statement', 'COMMAND_ANSWER', 'Write the PostgreSQL GRANT statement that gives the user "analyst" SELECT permission on the "reports" table in the "public" schema, and also allows the analyst to connect to the database.', 'Grant database permissions.', 'GRANT CONNECT ON DATABASE mydb TO analyst;\nGRANT SELECT ON TABLE public.reports TO analyst;', 'CONTAINS', ARRAY['GRANT gives specific permissions to users.', 'CONNECT allows the user to connect to the database.', 'SELECT on specific tables limits data access.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Role-Based Access Control', 'SHORT_RESPONSE', 'Explain the difference between database roles and users in PostgreSQL. Why are roles preferred for managing permissions? Answer in one or two sentences.', 'Explain roles vs users in PostgreSQL.', 'In PostgreSQL, roles and users are the same object, but roles are designed to be groups that can be granted to multiple users. Using roles for permission management is preferred because you can define permissions once on a role and then assign that role to multiple users, making permission management scalable.', 'CONTAINS', ARRAY['PostgreSQL roles can be LOGIN or NOLOGIN.', 'NOLOGIN roles are used as permission groups.', 'Users inherit permissions from their roles.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'REVOKE Statement', 'COMMAND_ANSWER', 'Write the PostgreSQL REVOKE statement that removes DELETE permission on the "audit_log" table from the role "read_only_role".', 'Revoke specific permissions.', 'REVOKE DELETE ON TABLE audit_log FROM read_only_role;', 'CONTAINS', ARRAY['REVOKE removes previously granted permissions.', 'You can revoke specific operations (SELECT, INSERT, etc.).', 'REVOKE ALL removes all permissions.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Row-Level Security', 'SHORT_RESPONSE', 'What is Row-Level Security (RLS) in PostgreSQL and how does it enhance access control? Answer in one or two sentences.', 'Explain row-level security.', 'Row-Level Security allows you to define policies that restrict which rows a user can see or modify in a table based on their role or attributes, enabling multi-tenant applications where different users can only access their own data even when querying the same table.', 'CONTAINS', ARRAY['RLS is enabled with ALTER TABLE ... ENABLE ROW LEVEL SECURITY.', 'Policies define which rows are visible to which users.', 'RLS is enforced at the database level, not the application.'], 3, 30, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Access Control - 4 exercises seeded';
END $$;

-- Lesson: Encryption at Rest and in Transit
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Database Administration & Security' AND l.title = 'Encryption';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'SSL Connection Configuration', 'COMMAND_ANSWER', 'Write the PostgreSQL connection string parameter that enforces SSL encryption for all client connections. Include the parameter name and its value.', 'Enforce SSL connections in PostgreSQL.', 'sslmode=require', 'EXACT', ARRAY['sslmode=require forces SSL but does not verify the certificate.', 'sslmode=verify-full also verifies the server certificate.', 'sslmode=disable allows unencrypted connections.'], 3, 25, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Transparent Data Encryption', 'SHORT_RESPONSE', 'What is Transparent Data Encryption (TDE) and at what level does it protect data? Answer in one or two sentences.', 'Explain TDE.', 'Transparent Data Encryption encrypts the database files on disk (data files, logs, and backups) without requiring changes to the application. It protects against physical theft of storage media but does not protect data in memory or during transmission.', 'CONTAINS', ARRAY['TDE encrypts at rest on disk.', 'Data in memory is decrypted for processing.', 'Application code does not need to change.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Column-Level Encryption', 'COMMAND_ANSWER', 'Write a SQL query that encrypts a password column value using pgcrypto''s pgp_sym_encrypt function before inserting it into the "users" table. Use the encryption key "mysecretkey".', 'Encrypt sensitive column data.', 'INSERT INTO users (name, password) VALUES (''Alice'', pgp_sym_encrypt(''mypassword'', ''mysecretkey''))', 'CONTAINS', ARRAY['pgcrypto is a PostgreSQL extension for encryption.', 'pgp_sym_encrypt encrypts data with a symmetric key.', 'The encrypted data is stored as bytea.'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'TLS Certificate Management', 'SHORT_RESPONSE', 'Why should database servers use certificates signed by a trusted CA (Certificate Authority) rather than self-signed certificates for SSL/TLS? Answer in one sentence.', 'Explain CA-signed vs self-signed certificates.', 'CA-signed certificates are trusted by default by client applications, preventing man-in-the-middle attacks, while self-signed certificates require manual trust configuration on each client and cannot be independently verified for authenticity.', 'CONTAINS', ARRAY['Self-signed certs can be intercepted in MITM attacks.', 'CA certs are verifiable through the certificate chain.', 'Certificate pinning can further strengthen security.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Encryption - 4 exercises seeded';
END $$;

-- Lesson: Backup and Recovery
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Database Administration & Security' AND l.title = 'Backup and Recovery';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'pg_dump Command', 'COMMAND_ANSWER', 'Write the pg_dump command that creates a custom-format backup of the "shopdb" database to a file called shopdb.dump. Custom format allows parallel restore and selective table restoration.', 'Create a PostgreSQL backup.', 'pg_dump -Fc -f shopdb.dump shopdb', 'CONTAINS', ARRAY['-Fc produces a custom-format archive.', 'Custom format is more flexible than plain SQL.', 'pg_dump does not lock the database during backup.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Point-in-Time Recovery', 'SHORT_RESPONSE', 'What is point-in-time recovery (PITR) in PostgreSQL and what components does it require? Answer in one or two sentences.', 'Explain point-in-time recovery.', 'Point-in-time recovery allows you to restore a PostgreSQL database to any specific moment in time by replaying WAL (Write-Ahead Log) archives from a base backup to the desired timestamp. It requires a base backup and continuous WAL archiving to be enabled.', 'CONTAINS', ARRAY['PITR uses WAL archiving to replay changes.', 'A base backup is the starting point.', 'archive_command in postgresql.conf enables WAL archiving.'], 3, 25, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Recovery Command', 'COMMAND_ANSWER', 'After a database corruption, you need to restore from a custom-format backup file called shopdb.dump. Write the pg_restore command that restores the database, creating it if it does not exist, and showing the progress.', 'Restore from a PostgreSQL backup.', 'pg_restore -d shopdb --create --verbose shopdb.dump', 'CONTAINS', ARRAY['pg_restore restores from custom-format backups.', '--create creates the database before restoring.', '--verbose shows progress information.'], 3, 30, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Backup Strategy 3-2-1', 'SHORT_RESPONSE', 'Explain the 3-2-1 backup strategy as it applies to database backups. What does each number represent? Answer in one or two sentences.', 'Explain the 3-2-1 backup rule.', 'The 3-2-1 rule means maintaining 3 copies of your data, on 2 different types of storage media, with 1 copy stored off-site. For databases, this might be a local backup, a NAS backup, and a cloud backup in a different geographic region.', 'CONTAINS', ARRAY['3 copies provides redundancy.', '2 different media types protects against media failure.', '1 off-site copy protects against site-level disasters.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Backup and Recovery - 4 exercises seeded';
END $$;

-- Lesson: Performance Tuning
DO $$
DECLARE
  l_id UUID;
BEGIN
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Database Administration & Security' AND l.title = 'Performance Tuning';

  INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), l_id, 'EXPLAIN ANALYZE Usage', 'COMMAND_ANSWER', 'Write the SQL command to analyze the execution plan and actual runtime statistics for the query: SELECT * FROM orders WHERE user_id = 42 AND status = ''completed''. Return the complete EXPLAIN ANALYZE statement.', 'Use EXPLAIN ANALYZE for query analysis.', 'EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42 AND status = ''completed''', 'CONTAINS', ARRAY['EXPLAIN shows the execution plan.', 'EXPLAIN ANALYZE also runs the query and shows actual times.', 'Look for sequential scans on large tables as potential issues.'], 3, 30, true, 1, now(), now()),

  (gen_random_uuid(), l_id, 'Index Usage Indicators', 'FLAG_CAPTURE', 'When running EXPLAIN on a query, what output indicates that the query is NOT using an available index and is instead scanning the entire table? Return the scan type name.', 'Identify full table scans in EXPLAIN.', 'Seq Scan', 'EXACT', ARRAY['Seq Scan means sequential scan of the entire table.', 'Index Scan means the query is using an index.', 'Bitmap Index Scan is another index usage type.'], 3, 20, true, 2, now(), now()),

  (gen_random_uuid(), l_id, 'Query Plan Optimization', 'SHORT_RESPONSE', 'A query that joins two tables with 1 million rows each is taking 30 seconds to execute. EXPLAIN ANALYZE shows a Seq Scan on both tables. What is the most likely optimization to improve performance? Answer in one sentence.', 'Identify query optimization strategy.', 'Creating appropriate indexes on the join columns and WHERE clause columns would allow PostgreSQL to use Index Scans instead of Seq Scans, dramatically reducing the amount of data read and processed.', 'CONTAINS', ARRAY['Sequential scans on large tables are slow.', 'Indexes enable PostgreSQL to find rows without scanning.', 'Composite indexes can cover multiple query patterns.'], 3, 25, true, 3, now(), now()),

  (gen_random_uuid(), l_id, 'Connection Pooling Benefit', 'SHORT_RESPONSE', 'Why should applications use connection pooling instead of creating a new database connection for each request? Answer in one or two sentences.', 'Explain connection pooling benefits.', 'Creating a new database connection is expensive because it involves TCP handshake, authentication, and memory allocation. Connection pooling maintains a pool of reusable connections, reducing connection overhead and allowing the database to handle more concurrent requests efficiently.', 'CONTAINS', ARRAY['Connection creation has significant overhead.', 'Pool size should match database max_connections.', 'PgBouncer is a popular PostgreSQL connection pooler.'], 3, 25, true, 4, now(), now());

  RAISE NOTICE 'Lesson: Performance Tuning - 4 exercises seeded';
END $$;

