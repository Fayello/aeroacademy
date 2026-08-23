const crypto = require('crypto');
const bcrypt = require('bcrypt');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }

const UBUNTU = '322a1e1c-b550-4cdb-b3f2-b7d59f9f503a';
const PERMS = 'def2c670-6ec3-4a82-8df9-e1b74237df6e';
const PROC  = '989bd7ac-13fd-4e6f-b502-3ff3b334c350';
const TEXT  = 'e5b52cdf-1435-4b77-896a-41a270c88021';
const LOG   = '4a07684f-30df-4ece-b9bc-57a2727769d4';
const MYSQL  = '11dc0358-43a4-4f7c-b6eb-e12274be5ff9';
const PG     = '88de7b45-d1c8-4d13-97df-66805199f591';
const DOCKER = '8f5af76d-8355-42dd-bbd2-37a10a896dc1';
const NGINX  = '50d6a493-7898-473d-8287-137229593da9';

const labs = {
  [UBUNTU]: [
    { t: 'Disk Usage with df and awk',
      d: 'Run df -h to list filesystem usage. Pipe the output to awk to extract the Use% column (field 5) for the root filesystem /. Strip the percent sign and report the numeric value. What is the root disk usage percentage?',
      a: 'the numeric value from Use%', p: 100 },
    { t: 'Crontab Scheduling',
      d: 'Run crontab -l to list current cron jobs. If no crontab exists, create one with crontab -e that runs echo hello >> /tmp/cron-test every 5 minutes. After saving, run crontab -l again to verify. What is the full cron entry line?',
      a: 'the cron entry line', p: 100 },
    { t: 'Symbolic and Hard Links',
      d: 'Create a file called link-source.txt containing the text hello. Then create a symbolic link called link-symlink.txt pointing to it. Also create a hard link called link-hardlink.txt pointing to it. Run ls -li on all three files. What inode number do link-source.txt and link-hardlink.txt share?',
      a: 'the shared inode number', p: 100 },
    { t: 'Signals and Traps',
      d: 'Run the command sleep 100 in the background. Find its PID with jobs or pgrep. Send it a SIGTERM signal using kill. Verify the process is gone by running ps aux | grep sleep. What signal did you send to terminate the process?',
      a: 'SIGTERM', p: 100 },
    { t: 'Disk Usage Sorting',
      d: 'Run du -sh /etc/* to list sizes of items in /etc. Pipe to sort -hr to sort by human-readable size descending. Report the name and size of the largest item. What is the largest directory or file in /etc by disk usage?',
      a: 'the largest item name and size', p: 100 },
  ],
  [PERMS]: [
    { t: 'ACLs with setfacl',
      d: 'Create a file called acl-test.txt. Use setfacl -m u:root:rwx acl-test.txt to grant root full ACL access. Then run getfacl acl-test.txt to display the ACL entries. What is the ACL permission mask value shown?',
      a: 'the ACL permission mask', p: 100 },
    { t: 'Find by Permission with -perm',
      d: 'Run find / -perm -u=s -type f 2>/dev/null to locate files with the SUID bit set. Count how many results are returned. Then pick one result and report its full path. What is the full path of one SUID file found?',
      a: 'the SUID file path', p: 100 },
    { t: 'Immutable Flag with chattr',
      d: 'Create a file called immutable-test.txt with some content. Run chattr +i immutable-test.txt to make it immutable. Attempt to write to it with echo append >> immutable-test.txt and observe the error. Then run lsattr immutable-test.txt. What attribute letter is displayed?',
      a: 'i', p: 100 },
    { t: 'Umask Configuration',
      d: 'Run umask to display the current umask value. Then set the umask to 0022 with umask 0022. Create a new file called umask-test.txt. Run ls -l umask-test.txt to check its permissions. What are the permissions of the newly created file?',
      a: 'the file permissions string', p: 100 },
    { t: 'SGID Bit on Directories',
      d: 'Create a directory called sgid-test. Run chmod g+s sgid-test to set the SGID bit. Create a file inside it called sgid-file.txt. Run ls -l on the directory and the file. What group owns the newly created file?',
      a: 'the group name', p: 100 },
  ],
  [PROC]: [
    { t: 'Create and Enable a Systemd Service',
      d: 'Create a file at /etc/systemd/system/hello.service with the following content: [Unit] Description=Hello Service, [Service] ExecStart=/bin/echo hello, [Install] WantedBy=multi-user.target. Run systemctl daemon-reload then systemctl enable hello.service. Run systemctl status hello.service. What is the Active status line?',
      a: 'the Active status', p: 100 },
    { t: 'Query Logs with journalctl',
      d: 'Run journalctl -u ssh --no-pager -n 20 to view the last 20 lines of SSH logs. Count how many log entries mention the word Accepted. What is the total count of Accepted entries?',
      a: 'the count', p: 100 },
    { t: 'Nice and Renice Priority',
      d: 'Run ps -eo pid,ni,comm | head to view nice values of running processes. Start a new process with nice -n 10 sleep 60 in the background. Find its PID. Then run renice -n -5 -p PID to lower its nice value. Run ps -eo pid,ni,comm | grep sleep to verify. What is the updated nice value?',
      a: 'the nice value', p: 100 },
    { t: 'Custom ps aux Formatting',
      d: 'Run ps -eo pid,ppid,user,%cpu,%mem,comm --sort=-%cpu to list processes sorted by CPU usage. Identify the top process. Report its PID, user, and CPU percentage. What is the PID of the highest CPU process?',
      a: 'the PID', p: 100 },
    { t: 'Nohup and Disown',
      d: 'Run nohup sleep 100 & to start a background process immune to hangups. Run disown to remove it from the job table. Verify it is still running with ps aux | grep sleep. What PID was assigned to the nohup process?',
      a: 'the PID', p: 100 },
  ],
  [TEXT]: [
    { t: 'Awk Fields and NR',
      d: 'Run awk -F: NR==1 {print NR, $1, $3} /etc/passwd to extract the first line of passwd. Then run awk -F: NF==7 {count++} END {print count} /etc/passwd to count lines with 7 fields. How many lines in /etc/passwd have exactly 7 colon-separated fields?',
      a: 'the line count', p: 100 },
    { t: 'Sed Substitution',
      d: 'Copy /etc/passwd to /tmp/sed-test.txt. Run sed -i "s/root/superuser/g" /tmp/sed-test.txt. Verify with grep superuser /tmp/sed-test.txt. How many lines were changed?',
      a: 'the number of changed lines', p: 100 },
    { t: 'Cut with Custom Delimiter',
      d: 'Run cut -d: -f1,3,6 /etc/passwd to extract username, UID, and home directory. Pipe to head -5 to see the first 5 results. What is the third field (home directory) of the second line?',
      a: 'the home directory path', p: 100 },
    { t: 'Tr Character Translation',
      d: 'Run echo "Hello World 123" | tr "[:upper:]" "[:lower:]" to convert to lowercase. Then run echo "abracadabra" | tr -d "a" to delete all a characters. What is the result of the second command?',
      a: 'brcdbr', p: 100 },
    { t: 'Sort with Key and Numeric',
      d: 'Run ps -eo pid,%cpu --no-headers | sort -k2 -rn | head -5 to list the top 5 processes by CPU usage sorted numerically descending. What is the PID of the top process?',
      a: 'the PID', p: 100 },
    { t: 'Xargs Execution',
      d: 'Run find /tmp -maxdepth 1 -type f 2>/dev/null | xargs ls -l to list all files in /tmp with full details. Count the total number of lines output. How many files were listed?',
      a: 'the file count', p: 100 },
  ],
  [LOG]: [
    { t: 'Rsyslog Forwarding',
      d: 'Add the line *.* @@127.0.0.1:514 to /etc/rsyslog.d/forward.conf. Restart rsyslog with systemctl restart rsyslog. Send a test message with logger -p local0.info test-forward-message. Check if the message appears in /var/log/syslog. What facility and level did you use?',
      a: 'local0.info', p: 100 },
    { t: 'Logger Command',
      d: 'Run logger -t myapp -p daemon.warning "disk space low" to send a warning to syslog. Then run grep myapp /var/log/syslog to find it. What tag was used in the log entry?',
      a: 'myapp', p: 100 },
    { t: 'Logrotate Custom App',
      d: 'Create /etc/logrotate.d/myapp with contents: /var/log/myapp/*.log { daily rotate 7 compress delaycompress missingok notifempty }. Create the log directory with mkdir -p /var/log/myapp and touch a dummy log file. Run logrotate -d /etc/logrotate.d/myapp to test the configuration in debug mode. How many rotations are configured?',
      a: '7', p: 100 },
    { t: 'Tail Follow with PID',
      d: 'Start a process that writes to /tmp/tailtest.log every second using: while true; do echo tick >> /tmp/tailtest.log; sleep 1; done &. Note the PID. Then run tail -f --pid=PID -n 1 /tmp/tailtest.log to follow the file until that PID exits. What flag did you use to track the writing process?',
      a: '--pid', p: 100 },
    { t: 'Dmesg Filtering',
      d: 'Run dmesg | tail -20 to view the last 20 kernel messages. Then run dmesg | grep -ci memory to count how many lines mention memory. What is the case-insensitive count of memory-related kernel messages?',
      a: 'the memory line count', p: 100 },
    { t: 'Syslog Facility Levels',
      d: 'Create /etc/rsyslog.d/custom.conf with: :programname, isequal, "mytest" /var/log/mytest.log. Restart rsyslog. Run logger -t mytest -p local5.notice "level test message". Verify the message appears in /var/log/mytest.log. What facility and severity level did you use?',
      a: 'local5.notice', p: 100 },
  ],
  [MYSQL]: [
    { t: 'JOIN Queries on Lab Data',
      d: 'Connect to MySQL with mysql -u root -p. Run SELECT l.title, COUNT(f.id) AS flag_count FROM "Lab" l JOIN "LabFlag" f ON l.id = f."labId" GROUP BY l.id, l.title ORDER BY flag_count DESC LIMIT 5; to count flags per lab. Which lab has the most flags?',
      a: 'the lab title with most flags', p: 100 },
    { t: 'Stored Procedure for Flag Search',
      d: 'Connect to MySQL. Create a stored procedure: CREATE PROCEDURE FindFlagsByPoints(IN min_pts INT) SELECT title, points FROM "LabFlag" WHERE points >= min_pts; Then call it with CALL FindFlagsByPoints(100); How many flags have 100 or more points?',
      a: 'the count of high-point flags', p: 100 },
  ],
  [PG]: [
    { t: 'EXPLAIN ANALYZE Query Plan',
      d: 'Connect to PostgreSQL with psql. Run EXPLAIN ANALYZE SELECT l.title, f.title AS flag_title, f.points FROM "Lab" l JOIN "LabFlag" f ON l.id = f."labId" WHERE f.points = 100 ORDER BY l.title LIMIT 10; to analyze the query plan. What is the execution time shown in milliseconds?',
      a: 'the execution time in ms', p: 100 },
  ],
  [DOCKER]: [
    { t: 'Docker Exec with Environment Variables',
      d: 'Run docker ps to list containers. Pick a running container. Execute docker exec CONTAINER_ID env to list all environment variables. Find the PATH variable. What is the first directory listed in the PATH?',
      a: 'the first PATH directory', p: 100 },
    { t: 'Docker Inspect Specific Data',
      d: 'Run docker ps to list containers. Pick a container and run docker inspect --format "{{.NetworkSettings.IPAddress}}" CONTAINER_ID to get its IP address. What is the IP address of the container?',
      a: 'the container IP address', p: 100 },
  ],
  [NGINX]: [
    { t: 'WebSocket Proxy Pass',
      d: 'Create /etc/nginx/conf.d/ws.conf with: server { listen 8080; location /ws { proxy_pass http://127.0.0.1:3000; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; } }. Run nginx -t to test. What header enables WebSocket support?',
      a: 'Upgrade', p: 100 },
    { t: 'Client Max Body Size',
      d: 'Create /etc/nginx/conf.d/upload.conf with: server { listen 8090; client_max_body_size 50m; location /upload { return 200 "ok"; } }. Run nginx -t to test the configuration. What is the maximum upload size configured?',
      a: '50m', p: 100 },
    { t: 'Upstream Health Checks',
      d: 'Create /etc/nginx/conf.d/upstream.conf with: upstream backend { server 127.0.0.1:3001; server 127.0.0.1:3002 backup; } server { listen 8091; location / { proxy_pass http://backend; } }. Run nginx -t to verify. What keyword marks the failover server?',
      a: 'backup', p: 100 },
    { t: 'Try Files for SPA',
      d: 'Create /etc/nginx/conf.d/spa.conf with: server { listen 8092; root /var/www/html; try_files $uri $uri/ /index.html; }. Run nginx -t to test. What fallback file is served when no route matches?',
      a: '/index.html', p: 100 },
    { t: 'Basic Authentication',
      d: 'Create a password file with htpasswd -c /etc/nginx/.htpasswd admin. Create /etc/nginx/conf.d/auth.conf with: server { listen 8093; auth_basic "Restricted"; auth_basic_user_file /etc/nginx/.htpasswd; location / { return 200 "welcome"; } }. Run nginx -t to verify. What directive enables the login prompt?',
      a: 'auth_basic', p: 100 },
  ],
};

const lines = [];
for (const [labId, flags] of Object.entries(labs)) {
  for (const f of flags) {
    const id = crypto.randomUUID();
    lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${labId}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
  }
}
console.log(lines.join('\n'));
