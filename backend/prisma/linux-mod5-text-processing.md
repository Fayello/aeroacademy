# Module 5 — Text Processing

## Why This Matters

Linux systems generate enormous amounts of text — log files, configuration files, CSV exports, API responses, database dumps. The ability to search, transform, and analyze text at the command line is what separates someone who manually opens files in an editor from someone who can process 10GB of logs in seconds without breaking a sweat.

Every tool in this module is designed to compose. You chain them together with pipes, building complex transformations from simple, focused commands. This is the Unix philosophy in action, and it is the most powerful feature of the Linux command line.

## grep: Finding Text in Files

`grep` searches for patterns in files and prints matching lines. It is the most used text search tool on Linux, and understanding its full capabilities will save you significant time.

### Basic Usage

```bash
grep "ERROR" /var/log/syslog
```
```
Jan 15 10:30:01 web01 CRON[12345]: (root) CMD (test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily ))
Jan 15 10:30:15 web01 app[6789]: ERROR: Connection refused to database at 10.0.0.10:5432
Jan 15 10:30:15 web01 app[6789]: ERROR: Retrying in 5 seconds...
Jan 15 10:31:00 web01 nginx[5678]: 2024/01/15 10:31:00 [error] 5678#0: *12345 upstream timed out
```

The pattern is a regular expression, and grep matches it against every line in the file. Lines that match are printed to stdout. Lines that do not match are silently discarded.

### Essential Flags

```bash
grep -i "error" /var/log/syslog         # Case-insensitive
grep -r "password" /etc/                 # Recursive search through all files in directory
grep -rn "listen" /etc/nginx/nginx.conf  # Show line numbers
grep -c "404" /var/log/nginx/access.log  # Count matching lines (just a number)
grep -v "DEBUG" app.log                  # Invert match (exclude lines containing DEBUG)
grep -l "deprecated" src/*.py            # Show only filenames with matches
grep -L "deprecated" src/*.py            # Show files that do NOT match
grep -w "root" /etc/passwd               # Match whole words only
grep -A3 "Traceback" error.log           # Show 3 lines AFTER the match
grep -B2 "Exception" error.log           # Show 2 lines BEFORE the match
grep -A5 -B2 "Exception" error.log       # Show 5 lines before and 2 after (context)
grep --include="*.log" -r "ERROR" /var/  # Only search files matching *.log
grep -m5 "connection" app.log            # Stop after 5 matches
```

The `-A`, `-B`, and `-C` (context, which shows both before and after) flags are essential for debugging. A single error line rarely tells you the full story — you need the surrounding context.

```bash
grep -C5 "OutOfMemoryError" java.log
```
```
[2024-01-15 10:30:00] INFO: Processing batch 1234
[2024-01-15 10:30:01] INFO: Loading 50000 records into memory
[2024-01-15 10:30:02] WARN: Heap usage at 87%
[2024-01-15 10:30:03] INFO: Processing record 25000
[2024-01-15 10:30:04] WARN: Heap usage at 92%
[2024-01-15 10:30:05] ERROR: java.lang.OutOfMemoryError: Java heap space
    at com.example.Loader.loadBatch(Loader.java:145)
    at com.example.Loader.run(Loader.java:89)
    at com.example.Main.main(Main.java:23)
[2024-01-15 10:30:06] ERROR: Batch processing failed, rolling back
[2024-01-15 10:30:07] INFO: Connection pool released
```

Now you can see the sequence: heap usage climbing, then the OOM error, then the rollback. Without context, you would only see the error.

### Extended Regular Expressions (egrep)

`egrep` is equivalent to `grep -E` and supports extended regex syntax without needing to escape special characters:

```bash
egrep "ERROR|WARN|FATAL" /var/log/syslog
```
```
Jan 15 10:30:15 web01 app[6789]: ERROR: Connection refused
Jan 15 10:31:00 web01 nginx[5678]: 2024/01/15 10:31:00 [error] 5678#0: upstream timed out
Jan 15 10:35:22 web01 app[6789]: WARN: Memory usage at 85%
Jan 15 10:40:00 web01 kernel: [45678.123] FATAL: Out of memory
```

```bash
# Match IP addresses
egrep "^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" access.log

# Match dates
egrep "[0-9]{4}-[0-9]{2}-[0-9]{2}" logfile.txt

# Match lines with at least 3 words
egrep "(\S+\s+){3,}" file.txt

# Match email addresses
egrep -o "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" file.txt
```

The `-o` flag outputs only the matching part of the line, not the entire line. This is useful for extracting specific data patterns.

### Fixed String Search (fgrep)

`fgrep` (or `grep -F`) searches for fixed strings, not regex. It is significantly faster when you do not need pattern matching:

```bash
fgrep "10.0.0.5" access.log
```

Use `grep -F` instead of `fgrep` — `fgrep` is deprecated on some systems. The difference matters when your search string contains regex metacharacters like `.`, `*`, or `+`. With `grep`, the string `10.0.0.5` would match `10X0Y0Z5` because `.` matches any character. With `grep -F`, it matches only the literal string `10.0.0.5`.

### grep with Regular Expressions

```bash
# Basic regex
grep "^root" /etc/passwd               # Lines starting with "root"
grep "bash$" /etc/passwd               # Lines ending with "bash"
grep "^$" file.txt                     # Empty lines
grep "[0-9]" file.txt                  # Lines containing at least one digit
grep "^[^#]" /etc/ssh/sshd_config     # Lines not starting with # (non-comment lines)

# Extended regex (grep -E)
grep -E "^root:|^admin:" /etc/passwd   # Lines starting with root: or admin:
grep -E "^[0-9]+\.[0-9]+" data.txt    # Lines starting with a decimal number
grep -E "error|warning|critical" log   # Any of these words
grep -E "\b[A-Z][a-z]+\b" file.txt    # Words starting with uppercase
```

### Practical grep Patterns

```bash
# Find all failed SSH login attempts
grep "Failed password" /var/log/auth.log | tail -20

# Find processes using a specific port
grep -rn "8080" /etc/nginx/ /etc/apache2/

# Find TODO comments in source code
grep -rn "TODO\|FIXME\|HACK\|XXX" src/

# Show only the IP addresses from an access log and count them
grep -oE "([0-9]{1,3}\.){3}[0-9]{1,3}" access.log | sort | uniq -c | sort -rn | head -10

# Find configuration files that contain a specific value
grep -rl "production" /etc/ 2>/dev/null

# Find lines that do NOT match a pattern
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"   # Non-comment, non-blank lines

# Find lines matching a pattern in multiple files with filenames
grep -rnH "function" src/*.js src/*.ts

# Binary-safe search (treat binary files as text)
grep -a "password" /var/log/syslog.1.gz   # Search inside compressed files (slow but works)

# Show byte offset of match
grep -b "ERROR" app.log
```

## sed: Stream Editor

`sed` is a stream editor that performs text transformations line by line. It reads input, applies operations, and writes the result. Unlike a text editor, sed processes text as a stream — it does not load the entire file into memory, making it efficient for large files.

### Substitution

The most common sed operation:

```bash
sed 's/old/new/' file.txt               # Replace first occurrence per line
sed 's/old/new/g' file.txt              # Replace all occurrences per line
sed 's/old/new/gi' file.txt             # Replace all, case-insensitive
sed -i 's/old/new/g' file.txt           # Edit the file in-place
sed -i.bak 's/old/new/g' file.txt      # In-place with backup
```

The `s` command does substitution. The delimiter is `/` by default, but you can use any character:

```bash
sed 's|/usr/local|/opt|g' path.txt      # Use | as delimiter
sed 's#old#new#g' file.txt              # Use # as delimiter (useful for paths)
```

The `g` flag replaces all occurrences on each line (without it, only the first is replaced). The `i` flag edits the file in-place. Always use the backup extension (`-i.bak`) when modifying important files — it is cheap insurance.

```bash
# Change a setting in a config file
sed -i.bak 's/^max_connections = 100/max_connections = 200/' /etc/postgresql/15/main/postgresql.conf

# Replace a placeholder in a template
sed -i "s/__HOSTNAME__/$(hostname)/" /opt/app/config.yml

# Remove blank lines
sed '/^$/d' file.txt

# Delete lines matching a pattern
sed '/^#/d' /etc/ssh/sshd_config         # Remove all comments
sed '/^$/d' /etc/ssh/sshd_config         # Remove all blank lines

# Combine: remove comments and blank lines
sed '/^#/d; /^$/d' /etc/ssh/sshd_config

# Replace only on lines matching a pattern
sed '/server/s/80/8080/' config.txt      # On lines containing "server", replace 80 with 8080
```

### Address Ranges

sed can operate on specific lines:

```bash
sed '5d' file.txt                        # Delete line 5
sed '1,10d' file.txt                     # Delete lines 1 through 10
sed '10,$d' file.txt                     # Delete from line 10 to end
sed '/start/,/end/d' file.txt           # Delete from line matching "start" to line matching "end"
sed '1,5s/foo/bar/g' file.txt           # Substitute only on lines 1-5
```

```bash
# Print only lines 20-30
sed -n '20,30p' /var/log/syslog

# Extract a section between markers
sed -n '/\[database\]/,/\[cache\]/p' config.ini

# Extract a section and modify it
sed -n '/\[server\]/,/\[server\]/s/listen=127.0.0.1/listen=0.0.0.0/p' config.ini
```

### Insert, Append, and Replace Lines

```bash
# Insert a line before line 5
sed '5i\# New configuration line' config.txt

# Append a line after line 5
sed '5a\# Added line' config.txt

# Replace entire line 10
sed '10c\# This is the new line 10' config.txt

# Add a line after a pattern
sed '/\[server\]/a\listen=0.0.0.0' config.ini

# Add a line before a pattern
sed '/\[server\]/i\[network]' config.ini
```

### Complex sed Operations

```bash
# Convert CSV to simple list (extract field 3)
sed 's/,*$//' file.csv | cut -d',' -f3

# Strip HTML tags
sed 's/<[^>]*>//g' index.html

# Add line numbers to a file
sed = file.txt | sed 'N;s/\n/\t/'

# Replace the last occurrence on each line
sed 's/\(.*\)=/\1:/' config.txt

# Double-space every line
sed 'G' file.txt

# Remove trailing whitespace
sed 's/[[:space:]]*$//' file.txt

# Convert DOS line endings to Unix
sed -i 's/\r$//' file.txt

# Extract the domain from email addresses
sed 's/.*@//; s/\..*//' emails.txt

# Comment out lines containing a pattern
sed '/debug/s/^/#/' config.txt

# Uncomment lines containing a pattern
sed '/debug/s/^#//' config.txt

# Swap two words
sed 's/\(foo\) \(bar\)/\2 \1/' file.txt

# Print the first and last lines of a file
sed -n '1p; ${p}' file.txt
```

## awk: Pattern Scanning and Processing

awk is a programming language disguised as a command-line tool. It processes input line by line, splits each line into fields, and performs actions based on patterns. It is more powerful than grep and sed combined, and learning its fundamentals will transform your ability to work with structured text.

### Basic Usage

```bash
awk '{print $1}' file.txt               # Print the first field of each line
awk '{print $1, $3}' file.txt           # Print fields 1 and 3 (separated by space)
awk -F: '{print $1}' /etc/passwd        # Use : as field separator
awk '{print NR, $0}' file.txt           # Print line number and entire line
awk 'NR == 5' file.txt                  # Print line 5
awk 'NR >= 10 && NR <= 20' file.txt    # Print lines 10-20
awk 'END {print NR}' file.txt           # Print total number of lines
```

### Fields and Records

By default, awk splits lines on whitespace. The field separator is changed with `-F`:

```bash
# Parse /etc/passwd
awk -F: '{print "User:", $1, "Shell:", $7}' /etc/passwd | head -5
```
```
User: root Shell: /bin/bash
User: daemon Shell: /usr/sbin/nologin
User: bin Shell: /usr/sbin/nologin
User: sys Shell: /usr/sbin/nologin
User: sync Shell: /bin/sync
```

Special variables:

| Variable | Meaning |
|----------|---------|
| `$0` | The entire line |
| `$1`, `$2`, ... | Individual fields |
| `NR` | Current line (record) number |
| `NF` | Number of fields in the current line |
| `FS` | Input field separator |
| `OFS` | Output field separator |
| `RS` | Record separator (default: newline) |
| `FILENAME` | Name of the current file |

```bash
# Print the last field of each line
awk '{print $NF}' file.txt

# Print the second-to-last field
awk '{print $(NF-1)}' file.txt

# Print the number of fields in each line
awk '{print NR": "NF" fields"}' file.txt

# Change the output separator
awk -F: '{OFS=","; print $1, $3, $7}' /etc/passwd | head -5
```
```
root,0,/bin/bash
daemon,1,/usr/sbin/nologin
bin,2,/usr/sbin/nologin
sys,3,/usr/sbin/nologin
sync,4,/bin/sync
```

### Patterns and Actions

```bash
# Print only lines containing "ERROR"
awk '/ERROR/' /var/log/app.log

# Print lines where field 3 is greater than 100
awk '$3 > 100' data.txt

# Print lines where field 1 is "root"
awk -F: '$1 == "root"' /etc/passwd

# Print lines where field 3 starts with "10.0"
awk -F: '$3 ~ /^10.0/' /etc/hosts

# Conditional action
awk '{if ($3 > 100) print $1, $3; else print $1, "low"}' data.txt

# Range of patterns
awk '/START/,/END/' file.txt          # Print everything between START and END
```

### BEGIN and END Blocks

awk executes `BEGIN` before processing any input and `END` after all input is processed:

```bash
# Count lines and print average of field 2
awk 'BEGIN {sum=0; count=0} {sum+=$2; count++} END {if(count>0) print "Average:", sum/count; else print "No data"}' data.txt
```

```bash
# Print a header and footer
awk 'BEGIN {print "=== Report ==="} {print NR": "$0} END {print "=== End ==="}' file.txt
```

```bash
# Calculate the sum of a column
awk '{total += $3} END {print "Total:", total}' sales.csv
```

### Practical awk Commands

```bash
# Count HTTP response codes from access log
awk '{print $9}' access.log | sort | uniq -c | sort -rn
```
```
  15234 200
   2345 301
    890 404
    234 500
     56 502
```

```bash
# Find the top 10 IP addresses by request count
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10
```

```bash
# Sum up values in a CSV column
awk -F, '{sum+=$4} END {print "Total:", sum}' sales.csv

# Calculate percentage of total
awk -F, '{
    sum+=$4
    amounts[NR]=$4
    names[NR]=$1
} END {
    for(i=1;i<=NR;i++)
        printf "%-20s $%10.2f (%.1f%%)\n", names[i], amounts[i], amounts[i]/sum*100
}' sales.csv
```

```bash
# Extract and format data
awk -F: '{printf "%-20s %s\n", $1, $3}' /etc/passwd | sort -k2 -n

# Find lines where field 4 is between 100 and 200
awk -F, '$4 >= 100 && $4 <= 200' data.csv

# Remove duplicate lines (like sort -u but preserves order)
awk '!seen[$0]++' file.txt

# Merge two files by a common field (like a SQL join)
awk -F, 'NR==FNR {a[$1]=$2; next} $1 in a {print $0, a[$1]}' file1.csv file2.csv

# Print every other line
awk 'NR%2==1' file.txt

# Print lines between two patterns (exclusive)
awk '/BEGIN/,/END/ { if (/BEGIN/ || /END/) next; print }' file.txt

# Convert columns to rows
awk '{for(i=1;i<=NF;i++) print $i}' file.txt
```

## sort, uniq, cut, tr, wc

### sort

```bash
sort file.txt                           # Alphabetical sort (default)
sort -n file.txt                        # Numeric sort
sort -r file.txt                        # Reverse order
sort -k2 -t, data.csv                  # Sort by field 2, using comma as separator
sort -u file.txt                        # Sort and remove duplicates
sort -h file.txt                        # Human-readable sort (1K, 2M, 3G)
sort -V versions.txt                    # Version number sort (1.2 < 1.10)
sort -f file.txt                        # Case-insensitive sort
sort -M months.txt                      # Month name sort (Jan < Feb < Mar)
sort -R file.txt                        # Random shuffle
sort -t: -k3 -n /etc/passwd            # Sort /etc/passwd by UID
```

Multiple sort keys:

```bash
# Sort by field 1 alphabetically, then by field 2 numerically
sort -k1,1 -k2,2n data.txt

# Sort by extension, then filename
sort -t. -k2 -k1 file.txt
```

### uniq

`uniq` removes duplicate adjacent lines. It almost always follows `sort`:

```bash
sort file.txt | uniq                    # Remove duplicates
sort file.txt | uniq -c                 # Count occurrences
sort file.txt | uniq -d                 # Show only duplicates
sort file.txt | uniq -u                 # Show only unique lines
sort file.txt | uniq -ci               # Case-insensitive count
```

```bash
# Most common error messages
grep "ERROR" app.log | awk -F'] ' '{print $2}' | sort | uniq -c | sort -rn | head -5
```

```bash
# Find duplicate lines in a file (preserving first occurrence order)
awk '!seen[$0]++' file.txt

# Count unique values in field 3
awk -F, '{print $3}' data.csv | sort | uniq -c | sort -rn
```

### cut

`cut` extracts columns from each line:

```bash
cut -d: -f1 /etc/passwd                 # Extract field 1, using : as delimiter
cut -d, -f1,3 data.csv                  # Extract fields 1 and 3
cut -c1-10 file.txt                    # Extract characters 1-10
cut -c1-10 --complement file.txt       # Everything except characters 1-10
cut -d' ' -f5- access.log              # Field 5 and everything after
```

```bash
# Extract the time from syslog
cut -d' ' -f1-3 /var/log/syslog

# Extract the PID from ps output
ps aux | awk '{print $2}' | cut -d: -f1

# Extract the first column of /etc/passwd
cut -d: -f1 /etc/passwd
```

### tr

`tr` translates or deletes characters:

```bash
tr 'a-z' 'A-Z' < file.txt             # Convert to uppercase
tr -d '\r' < dosfile.txt               # Remove carriage returns (DOS to Unix)
tr -s ' ' < file.txt                   # Squeeze multiple spaces to one
tr ':' '\n' <<< "$PATH"               # Show PATH entries one per line
tr -d '[:digit:]' < file.txt          # Remove all digits
tr '[:lower:]' '[:upper:]' < file.txt # Convert to uppercase
tr -d '[:print:]' < file.txt          # Remove all printable characters
```

```bash
# Convert a comma-separated list to a newline-separated list
echo "one,two,three,four" | tr ',' '\n'

# Remove all non-alphanumeric characters
echo "Hello, World! 123" | tr -cd '[:alnum:]\n'

# Replace multiple spaces with a single space
cat messy.txt | tr -s ' '
```

### wc

`wc` counts lines, words, and characters:

```bash
wc -l file.txt                         # Count lines
wc -w file.txt                         # Count words
wc -c file.txt                         # Count characters (bytes)
wc -m file.txt                         # Count characters (multibyte-aware)
```

```bash
# Count unique IP addresses in access log
awk '{print $1}' access.log | sort -u | wc -l

# Count lines in a file that are NOT comments
grep -cv '^#' file.txt

# Count the number of files matching a pattern
find /var/log -name "*.log" | wc -l

# Check the size of a command's output
ssh server "cat /var/log/syslog" | wc -l
```

## Pipes and Redirection

Pipes (`|`) connect the output of one command to the input of another. This is the core of text processing in Linux:

```bash
# Chain commands to find the top error messages
grep "ERROR" /var/log/app.log | awk -F'] ' '{print $2}' | sort | uniq -c | sort -rn | head -10
```

Here is what happens at each stage:

1. `grep "ERROR"` — filters lines containing "ERROR"
2. `awk -F'] ' '{print $2}'` — extracts the message part (after the first `] `)
3. `sort` — groups identical messages together
4. `uniq -c` — counts each unique message
5. `sort -rn` — sorts by count in descending order
6. `head -10` — shows the top 10

### Redirection

```bash
command > file.txt                     # stdout to file (overwrite)
command >> file.txt                    # stdout to file (append)
command 2> errors.txt                  # stderr to file
command > out.txt 2> errors.txt        # stdout and stderr to different files
command > all.txt 2>&1                 # Both stdout and stderr to same file
command < input.txt                    # Read from file
command1 | command2                    # Pipe stdout to next command
command1 |& command2                   # Pipe both stdout and stderr (bash 4+)
```

### Here Documents

```bash
cat <<EOF > /etc/app.conf
server_name = web01
listen = 8080
log_level = info
EOF
```

```bash
# Generate a config file with variable substitution
cat <<EOF > /etc/nginx/sites-available/myapp
server {
    listen 80;
    server_name ${DOMAIN};
    root /var/www/${DOMAIN};
}
EOF
```

### Process Substitution

```bash
diff <(sort file1.txt) <(sort file2.txt)
```

This sorts both files and diffs the results without creating temporary files. Process substitution creates a temporary file descriptor that the command reads from, making it appear as if the output of the command in `<()` is a file.

```bash
# Compare the same file on two different servers
diff <(ssh server1 "cat /etc/nginx/nginx.conf") <(ssh server2 "cat /etc/nginx/nginx.conf")

# Compare running processes with a saved list
diff <(ps aux --sort=-%cpu | head -20) <(cat saved_processes.txt)
```

## Real Scenario: Analyzing a 10GB Log File

You have been given a 10GB nginx access log file and asked to answer specific questions about it. The file is too large to open in an editor or import into a spreadsheet. You must use command-line tools.

**The nginx access log format:**

```
10.0.0.1 - - [15/Jan/2024:10:30:00 +0000] "GET /api/users HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
```

Fields:
1. IP address
2. Ident (usually `-`)
3. Auth user (usually `-`)
4. Timestamp
5. HTTP method
6. URL path
7. HTTP version
8. Status code
9. Response size in bytes
10. Referer
11. User agent

**Step 1: Total requests.**

```bash
wc -l access.log
```
```
87654321 access.log
```

87.6 million requests.

**Step 2: Top 20 URLs.**

```bash
awk '{print $7}' access.log | sort | uniq -c | sort -rn | head -20
```
```
  15234567 /api/users
  12345678 /api/products
   8765432 /static/css/main.css
   7654321 /static/js/app.js
   6543210 /api/orders
   5432109 /login
   4321098 /register
   3210987 /api/search
   2109876 /dashboard
   1098765 /api/notifications
    987654 /static/images/logo.png
    876543 /api/settings
    765432 /api/cart
    654321 /checkout
    543210 /api/reviews
    432109 /static/fonts/icon.woff2
    321098 /api/payments
    210987 /api/shipping
    109876 /health
     98765 /api/analytics
```

Processing 87.6 million lines took about 45 seconds on a standard disk. On SSD, it would be faster. The pipeline uses no temporary files — everything streams through pipes.

**Step 3: Top 10 IPs.**

```bash
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10
```
```
  2345678 10.0.0.100
  1234567 10.0.0.200
   876543 10.0.1.50
   654321 192.168.1.10
   543210 172.16.0.5
   432109 10.0.2.100
   321098 192.168.2.50
   210987 10.0.3.200
   109876 172.16.1.10
    98765 192.168.3.100
```

**Step 4: Count 404 errors.**

```bash
awk '$9 == 404' access.log | wc -l
```
```
2345678
```

About 2.7% of all requests resulted in 404. That is a significant number and may indicate broken links or missing resources.

**Step 5: Percentage of 500 errors.**

```bash
awk 'BEGIN {total=0; errors=0} {total++; if($9 == 500) errors++} END {printf "500 errors: %d (%.4f%%)\n", errors, errors/total*100}' access.log
```
```
500 errors: 12345 (0.0141%)
```

**Step 6: Peak hour.**

```bash
awk -F'[:\\[]' '{print $5}' access.log | sort | uniq -c | sort -rn | head -5
```
```
  8765432 14
  7654321 15
  6543210 13
  5432109 16
  4321098 12
```

Peak traffic is at 2 PM (hour 14). The top 5 hours are 12-4 PM, which is typical for a consumer-facing application.

**Step 7: URLs returning 500 errors.**

```bash
awk '$9 == 500 {print $7}' access.log | sort | uniq -c | sort -rn | head -10
```
```
   5432 /api/payments
   3210 /api/orders
   2109 /api/search
   1098 /api/users
    876 /api/products
    654 /api/cart
    543 /api/reviews
    432 /api/shipping
    321 /api/settings
    210 /api/notifications
```

The payments endpoint is responsible for 44% of all 500 errors. This is the highest priority for investigation.

**Step 8: Analyzing response times (if the log includes response time).**

If the log format includes response time as the last field:

```bash
# Average response time by URL
awk '{sum[$7]+=$(NF); count[$7]++} END {for(url in sum) printf "%8.3f avg  %6d reqs  %s\n", sum[url]/count[url], count[url], url}' access.log | sort -rn | head -10
```
```
  12.345 avg    3210 reqs  /api/search
   8.765 avg    5432 reqs  /api/payments
   5.432 avg    7654 reqs  /api/orders
   3.210 avg   15234 reqs  /api/users
   2.109 avg   12345 reqs  /api/products
   1.543 avg    6543 reqs  /api/cart
   1.098 avg    8765 reqs  /api/reviews
   0.876 avg    4321 reqs  /api/shipping
   0.543 avg    3210 reqs  /api/settings
   0.321 avg    2109 reqs  /api/notifications
```

The search endpoint averages 12.3 seconds response time — a clear performance problem. Despite having fewer requests than /api/users, it is the slowest endpoint.

**Step 9: Error rate by hour.**

```bash
awk -F'[:\\[]' '$9 >= 500 {hour[$5]++} END {for(h in hour) printf "%s:00 - %d errors\n", h, hour[h]}' access.log | sort
```
```
00:00 - 12 errors
01:00 - 8 errors
...
13:00 - 2345 errors
14:00 - 4567 errors
15:00 - 3210 errors
...
```

The error rate spikes during peak traffic hours (12-4 PM), which correlates with the high payment endpoint errors.

**Step 10: User agent analysis.**

```bash
awk -F'"' '{print $6}' access.log | sort | uniq -c | sort -rn | head -5
```
```
  4567890 Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
  2345678 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
  1234567 Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36
   876543 Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)
   654321 Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)
```

Googlebot accounts for 7.4% of traffic. This is useful for SEO analysis and for identifying bot traffic.

## Assessment

**Lab: Text Processing Pipeline (35 minutes)**

Scenario: You have been given an Apache access log file at `/var/log/apache2/access.log` (or a generated sample file). Analyze it using text processing tools to answer specific questions.

**Tasks:**

1. Count the total number of lines in the log file.
2. Extract all unique IP addresses and save them sorted to `/tmp/unique_ips.txt`.
3. Find the top 10 most-requested URLs and save to `/tmp/top_urls.txt`.
4. Count the number of requests that returned each HTTP status code (200, 301, 404, 500, etc.) and save to `/tmp/status_counts.txt`.
5. Find all requests that returned a 500 error and save the full lines to `/tmp/500_errors.txt`.
6. Using `sed`, strip all quotation marks from the log file and save the result to `/tmp/clean_log.txt`.
7. Using `awk`, calculate the total number of bytes transferred and save to `/tmp/bytes_transferred.txt`.
8. Using `awk`, find the 5 IP addresses that downloaded the most data (bytes) and save to `/tmp/heavy_downloaders.txt`.
9. Create a pipeline that finds all 404 errors, extracts the requested URLs, and counts how many times each URL was requested. Save the top 20 to `/tmp/top_404s.txt`.
10. Write a single command pipeline that shows the distribution of HTTP methods (GET, POST, PUT, DELETE, etc.) with counts. Save to `/tmp/method_distribution.txt`.
11. Using `awk`, calculate the average response size for each status code and save to `/tmp/avg_response_size.txt`.
12. Using `grep` and `sort`, find the 5 most common user agents and save to `/tmp/top_user_agents.txt`.

**Grading Criteria:**

- Total line count correct: 5 points
- Unique IPs saved and sorted: 8 points
- Top 10 URLs correct: 8 points
- Status code counts correct: 12 points
- 500 errors saved correctly: 8 points
- sed transformation correct: 8 points
- Total bytes calculated correctly: 8 points
- Heavy downloaders identified: 10 points
- Top 404 URLs correct: 10 points
- Method distribution correct: 8 points
- Average response size correct: 8 points
- Top user agents correct: 7 points

**Total: 100 points. Pass threshold: 70 points.**

## Evidence

After completing this lab, you should have:

- All 12 output files saved in `/tmp/`.
- Demonstrated ability to chain commands with pipes.
- Used `grep`, `sed`, `awk`, `sort`, `uniq`, `cut`, and `wc` in combination.
- Processed a large log file efficiently without loading it into memory.
- Extracted actionable insights from raw log data.
