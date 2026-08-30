# Module 5 — Text Processing and Pipelines

**Course:** Linux Fundamentals | **Path:** Linux (5 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 25 min | **Prerequisite:** Module 4 — Networking

---

## What You'll Actually Do

You have a 2GB log file. You need to find every failed login from IP `198.51.100.50` in the last hour, count them, and pipe the result to an email. You're not opening this in a text editor. You're using the shell.

---

## Pipes — The Core Idea

Linux commands do one thing well. You chain them together with pipes `|`. The output of one becomes the input of the next.

```bash
cat /var/log/auth.log | grep "Failed password" | wc -l
```

- `cat` reads the file
- `grep` filters lines containing "Failed password"
- `wc -l` counts the lines

That's a pipeline. Three small tools doing one thing each, connected.

---

## grep — Find the Lines You Want

```bash
grep "error" /var/log/syslog
```
Prints every line containing "error".

**Case insensitive:**
```bash
grep -i "error" /var/log/syslog
```

**Invert match (lines that DON'T match):**
```bash
grep -v "debug" /var/log/syslog
```

**Recursive search (all files in a directory):**
```bash
grep -r "password" /etc/
```

**Count matches:**
```bash
grep -c "Failed password" /var/log/auth.log
# 47
```

**Show line numbers:**
```bash
grep -n "error" /var/log/syslog
# 142:Jan 15 10:30:00 server nginx[842]: [error] ...
```

**Extended regex (more patterns):**
```bash
grep -E "Failed password|Invalid user" /var/log/auth.log
```

**Real use:** Find all SSH brute-force attempts:
```bash
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -10
```
This extracts the IP addresses, counts unique occurrences, sorts by count, and shows the top10 attackers.

---

## sed — Stream Editor

sed edits text as it flows through. Good for search-and-replace.

**Replace first occurrence per line:**
```bash
sed 's/old/new/' file.txt
```

**Replace all occurrences:**
```bash
sed 's/old/new/g' file.txt
```

**Delete lines:**
```bash
sed '/^#/d' config.conf
```
Removes all comment lines (lines starting with `#`).

**In-place edit (modifies the file):**
```bash
sed -i 's/DEBUG/INFO/' /etc/myapp/config.conf
```

**Real use:** Fix a config file without opening it:
```bash
sed -i 's/listen 127.0.0.1:8080/listen 0.0.0.0:8080/' /etc/nginx/sites-available/myapp
systemctl reload nginx
```

---

## awk — Column Processing

awk splits lines into fields and lets you work with them.

```bash
awk '{print $1, $3}' /var/log/syslog
```
Prints the first and third field of every line. Default field separator is whitespace.

**Custom separator:**
```bash
awk -F: '{print $1, $3}' /etc/passwd
```
Prints username and UID from `/etc/passwd` (`:` separated).

**Filter with conditions:**
```bash
awk '$3 > 1000 {print $1}' /etc/passwd
```
Prints usernames with UID > 1000 (real users, not system accounts).

**Real use:** Find processes using more than50% CPU:
```bash
ps aux | awk '$3 > 50 {print $11, $3"%"}'
# nginx 78.2%
# python 52.1%
```

**Real use:** Parse nginx access log for top IPs:
```bash
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -5
# 1234 198.51.100.50
# 876  10.0.0.15
```

---

## sort, uniq, wc — The Supporting Cast

**sort:**
```bash
sort file.txt              # alphabetical
sort -n file.txt           # numeric
sort -r file.txt           # reverse
sort -k2 -t: /etc/passwd   # sort by second field, colon-separated
```

**uniq — deduplicate (input must be sorted):**
```bash
sort file.txt | uniq       # remove duplicates
sort file.txt | uniq -c    # count duplicates
sort file.txt | uniq -d    # show only duplicates
```

**wc — count:**
```bash
wc -l file.txt    # lines
wc -w file.txt    # words
wc -c file.txt    # bytes
```

---

## cut and paste — Column Operations

**Cut by delimiter:**
```bash
cut -d: -f1,3 /etc/passwd
# root:0
# alice:1001
# bob:1002
```
`-d:` delimiter is colon. `-f1,3` fields1 and3.

**Cut by character:**
```bash
cut -c1-10 file.txt
```
First10 characters of each line.

---

## xargs — Build Commands from Input

xargs takes input and turns it into command arguments.

**Kill all processes matching a name:**
```bash
pgrep nginx | xargs kill
```

**Delete files older than7 days:**
```bash
find /var/log -name "*.gz" -mtime +7 | xargs rm
```

**Parallel execution:**
```bash
cat hosts.txt | xargs -P 4 -I {} ssh {} "uptime"
```
Runs `uptime` on 4 hosts in parallel.

---

## Real Task: Log Analysis Pipeline

You need to produce a security report:

```bash
# Top10 attacking IPs (last 24h)
grep "Failed password" /var/log/auth.log \
  | awk '{print $11}' \
  | sort | uniq -c | sort -rn \
  | head -10

# Failed login count per hour
grep "Failed password" /var/log/auth.log \
  | awk '{print $3}' \
  | cut -d: -f1-2 \
  | sort | uniq -c

# Find all users who logged in from outside the country
grep "Accepted publickey" /var/log/auth.log \
  | awk '{print $1, $3, $9, $11}' \
  | sort -k3
```

Each pipeline is small. Each command does one thing. Chained together, they answer complex questions in seconds.

---

## Failure Scenario: The awk That Broke Production

You write:
```bash
awk '{print $2}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -5
```

Output:
```
123456 198.51.100.50
 23456 10.0.0.15
```

You think `$2` is the IP. But the nginx log format is:
```
198.51.100.50 - - [15/Jan/2025:10:30:00 +0000] "GET /api/v1/users HTTP/1.1" 200 1234
```

`$1` is the IP, not `$2`. You counted the hyphen (`-`) — the ident field. Your report is wrong.

**Lesson:** Always check the actual format of the file before writing a pipeline. `head -1` or `awk 'NR==1'` to see one line first.

---

## Assessment

**Lab task (20 min):**

1. Create a file with 50 lines of sample data (name, score, department)
2. Use `awk` to filter lines where score > 80
3. Use `sort` and `uniq` to count employees per department
4. Use `sed` to replace all "Engineering" with "Eng" in the file
5. Create a pipeline that finds the top3 scorers
6. Use `cut` to extract just the name column
7. Combine `grep`, `awk`, and `sort` to produce a report from a sample log file

**Grading:**
- awk filter correct: 20%
- sort/uniq count correct: 20%
- sed replacement correct: 15%
- Pipeline produces correct output: 30%
- Clean execution: 15%

---

## Evidence

- **OutcomeEvidence:** `LIN-LO5 — Text Processing & Pipelines`
- **Mastery:** `UserSkill: linux-text-processing` — +0.5 clean, +0.3 with hints

---

## Unlock

Module6 — Package Management. You can process data. Now you learn how to install and manage software.

---

## Sources

- `man grep`, `man sed`, `man awk`, `man sort`, `man uniq`, `man cut`, `man xargs`
- `info awk` — GNU awk manual (more detailed than man page)

---

## AI Provenance

- **Draft:** LLM (2025-08-31) with practitioner review
- **Voice:** Engineer who's parsed too many logs at3 AM
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
