# Module 8: Shell Scripting

## Why This Matters

You can do almost anything from the command line, but doing it repeatedly is tedious and error-prone. Shell scripts let you automate tasks, chain commands with logic, handle errors, and build tools that other people can use. A well-written backup script, deployment script, or health check script saves hours of manual work and eliminates the mistakes that come with doing things by hand.

This module teaches you to write bash scripts that are reliable, readable, and production-ready. We will cover variables, conditionals, loops, functions, error handling, and real-world patterns. Every example is something you will actually use in operations.

## The Script Structure

Every bash script starts with a shebang:

```bash
#!/bin/bash
```

This tells the system to use `/bin/bash` to interpret the script. On some systems, `#!/usr/bin/env bash` is preferred because it finds bash in the current `PATH`, making the script more portable.

A minimal script:

```bash
#!/bin/bash
echo "Hello, $(hostname)"
```

Make it executable and run it:

```bash
chmod +x hello.sh
./hello.sh
```
```
Hello, web-prod-01
```

The `chmod +x` step is required. Without it, the system does not know the file is a script. You could also run it explicitly with `bash hello.sh`, but the shebang convention is better because it makes the script self-documenting.

## Variables

### Setting and Using Variables

```bash
#!/bin/bash
NAME="admin"
SERVER_COUNT=5
LOG_DIR="/var/log/myapp"

echo "User: $NAME"
echo "Servers: $SERVER_COUNT"
echo "Log directory: ${LOG_DIR}"
```

Rules:
- No spaces around the `=` sign (this is a common mistake)
- No spaces in the variable name
- Use `${VAR}` when the variable is adjacent to other text
- Always double-quote variables to prevent word splitting and globbing

```bash
# Wrong: word splitting and globbing problems
rm $FILES

# If FILES="file1.txt file2.txt", this runs: rm file1.txt file2.txt (intended)
# But if FILES="", this runs: rm (no arguments, error)
# And if FILES="*.txt", this expands the glob before the variable

# Correct
rm "$FILES"
```

### Command Substitution

```bash
#!/bin/bash
CURRENT_DATE=$(date +%Y-%m-%d)
HOSTNAME=$(hostname)
UPTIME=$(uptime -p)

echo "Report for $HOSTNAME on $CURRENT_DATE"
echo "Uptime: $UPTIME"
```

Both `$(command)` and `` `command` `` work, but `$(command)` is preferred because it nests cleanly:

```bash
# With $()
echo "Files: $(ls | wc -l)"

# With backticks (harder to read)
echo "Files: `ls | wc -l`"

# Nested backticks (nightmare)
echo "Files: `ls | wc -l` in $(date +%Y)"
```

### Special Variables

```bash
#!/bin/bash
echo "Script name: $0"
echo "First argument: $1"
echo "Second argument: $2"
echo "All arguments: $@"
echo "Number of arguments: $#"
echo "PID of script: $$"
echo "Exit code of last command: $?"
```

```bash
./script.sh hello world
```
```
Script name: ./script.sh
First argument: hello
Second argument: world
All arguments: hello world
Number of arguments: 2
PID of script: 12345
Exit code of last command: 0
```

### Default Values

```bash
#!/bin/bash
DB_HOST="${1:-localhost}"              # Use $1, or "localhost" if not provided
DB_PORT="${DB_PORT:-5432}"             # Use $DB_PORT env var, or 5432
LOG_LEVEL="${LOG_LEVEL:-info}"         # Default to "info"

echo "Connecting to $DB_HOST:$DB_PORT (log level: $LOG_LEVEL)"
```

```bash
# Require a variable to be set (error if not)
DB_NAME="${DB_NAME:?ERROR: DB_NAME is not set}"
```

### String Operations

```bash
#!/bin/bash
STRING="Hello, World!"

echo "Length: ${#STRING}"                  # 13
echo "Substring: ${STRING:0:5}"           # Hello
echo "Uppercase: ${STRING^^}"             # HELLO, WORLD!
echo "Lowercase: ${STRING,,}"             # hello, world!
echo "Replace: ${STRING/World/Linux}"     # Hello, Linux!
echo "Remove prefix: ${STRING#Hello, }"   # World!
echo "Remove suffix: ${STRING%!}"         # Hello, World
```

### Arrays

```bash
#!/bin/bash
SERVERS=("web-01" "web-02" "web-03" "db-01" "db-02")
LOGS=("/var/log/syslog" "/var/log/auth.log" "/var/log/nginx/access.log")

# Access elements
echo "First server: ${SERVERS[0]}"
echo "All servers: ${SERVERS[@]}"
echo "Number of servers: ${#SERVERS[@]}"

# Loop through array
for server in "${SERVERS[@]}"; do
    echo "Pinging $server..."
    ping -c 1 "$server" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  $server is reachable"
    else
        echo "  $server is UNREACHABLE"
    fi
done

# Add to array
SERVERS+=("cache-01")

# Remove element by index (unset)
unset 'SERVERS[2]'

# Slice an array
echo "First 3 servers: ${SERVERS[@]:0:3}"
```

Arrays are zero-indexed. `${SERVERS[@]}` expands to all elements, and `${#SERVERS[@]}` gives the count. Always quote `"${SERVERS[@]}"` to preserve elements that contain spaces.

## Arithmetic

```bash
#!/bin/bash
A=10
B=3

# Bash arithmetic (integer only)
echo "Addition: $((A + B))"           # 13
echo "Subtraction: $((A - B))"        # 7
echo "Multiplication: $((A * B))"     # 30
echo "Division: $((A / B))"           # 3 (integer division)
echo "Modulus: $((A % B))"            # 1
echo "Power: $((A ** B))"            # 1000

# Floating point (requires bc)
RESULT=$(echo "scale=2; $A / $B" | bc)
echo "Float division: $RESULT"        # 3.33

# Increment/decrement
COUNT=0
COUNT=$((COUNT + 1))
echo "Count: $COUNT"
```

For more complex math, use `bc`:

```bash
#!/bin/bash
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
THRESHOLD=80

if [ "$DISK_USAGE" -gt "$THRESHOLD" ]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}%"
fi

# Calculate percentage
TOTAL=123456789
USED=98765432
PERCENT=$(echo "scale=1; $USED * 100 / $TOTAL" | bc)
echo "Usage: ${PERCENT}%"
```

## Conditionals: if, elif, else, case

### if Statements

```bash
#!/bin/bash
FILE="/etc/nginx/nginx.conf"

if [ -f "$FILE" ]; then
    echo "$FILE exists and is a regular file"
elif [ -d "$FILE" ]; then
    echo "$FILE is a directory"
elif [ -L "$FILE" ]; then
    echo "$FILE is a symbolic link"
else
    echo "$FILE does not exist"
fi
```

Test operators:

| Operator | Meaning |
|----------|---------|
| `-f FILE` | File exists and is a regular file |
| `-d DIR` | Directory exists |
| `-e PATH` | Path exists (file or directory) |
| `-r FILE` | File is readable by the current user |
| `-w FILE` | File is writable by the current user |
| `-x FILE` | File is executable by the current user |
| `-s FILE` | File exists and has size > 0 |
| `-z STRING` | String is empty (length 0) |
| `-n STRING` | String is not empty |
| `STRING1 = STRING2` | Strings are equal |
| `STRING1 != STRING2` | Strings are not equal |
| `STRING1 =~ REGEX` | String matches regex (bash 3+) |
| `INT1 -eq INT2` | Integers are equal |
| `INT1 -ne INT2` | Integers are not equal |
| `INT1 -gt INT2` | INT1 greater than INT2 |
| `INT1 -lt INT2` | INT1 less than INT2 |
| `INT1 -ge INT2` | INT1 greater than or equal to INT2 |
| `INT1 -le INT2` | INT1 less than or equal to INT2 |

The `[ ]` is equivalent to the `test` command. You can also use `[[ ]]` which is a bash extension with additional features:

```bash
# Using [[ ]] (bash-specific, more features)
if [[ "$FILE" == *.conf ]]; then
    echo "Configuration file"
fi

if [[ "$STRING" =~ ^[0-9]+$ ]]; then
    echo "String contains only digits"
fi

# [[ ]] allows && and || inside the test
if [[ -f "$FILE" && -r "$FILE" ]]; then
    echo "File exists and is readable"
fi
```

### Comparing Strings

```bash
#!/bin/bash
ENV="${ENV:-production}"

if [ "$ENV" = "production" ]; then
    echo "Running in production mode"
    LOG_LEVEL="warn"
elif [ "$ENV" = "staging" ]; then
    echo "Running in staging mode"
    LOG_LEVEL="info"
else
    echo "Running in development mode"
    LOG_LEVEL="debug"
fi
```

### Case Statements

```bash
#!/bin/bash
ACTION="${1:-status}"

case "$ACTION" in
    start)
        echo "Starting service..."
        systemctl start myapp
        ;;
    stop)
        echo "Stopping service..."
        systemctl stop myapp
        ;;
    restart)
        echo "Restarting service..."
        systemctl restart myapp
        ;;
    status)
        systemctl status myapp
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
```

The `;;` terminates each case. The `*` is the default (like `else`). The `|` separates multiple patterns:

```bash
case "$ACTION" in
    start|stop|restart)
        systemctl "$ACTION" myapp
        ;;
    reload)
        systemctl reload myapp
        ;;
    *)
        echo "Unknown action: $ACTION"
        exit 1
        ;;
esac
```

Case statements with glob patterns:

```bash
case "$filename" in
    *.tar.gz|*.tgz)
        tar -xzf "$filename"
        ;;
    *.tar.bz2|*.tbz2)
        tar -xjf "$filename"
        ;;
    *.tar.xz|*.txz)
        tar -xJf "$filename"
        ;;
    *.zip)
        unzip "$filename"
        ;;
    *.gz)
        gunzip "$filename"
        ;;
    *)
        echo "Unknown archive format: $filename"
        exit 1
        ;;
esac
```

## Loops: for, while, until

### for Loop

```bash
#!/bin/bash
# Iterate over a list
for server in web-01 web-02 web-03 db-01; do
    echo "Checking $server..."
    ssh -o ConnectTimeout=3 "$server" "uptime" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "  WARNING: $server is not responding"
    fi
done
```

```bash
#!/bin/bash
# Iterate over files
for logfile in /var/log/*.log; do
    if [ -f "$logfile" ]; then
        lines=$(wc -l < "$logfile")
        size=$(du -h "$logfile" | cut -f1)
        echo "$logfile: $lines lines, $size"
    fi
done
```

```bash
#!/bin/bash
# Iterate over a range
for i in $(seq 1 10); do
    echo "Number: $i"
done

# Or with brace expansion
for port in {8080..8090}; do
    echo "Port $port"
done

# Or with C-style syntax
for ((i=1; i<=10; i++)); do
    echo "Number: $i"
done
```

```bash
#!/bin/bash
# Iterate over command output
for user in $(awk -F: '$3 >= 1000 {print $1}' /etc/passwd); do
    echo "Human user: $user"
done
```

### while Loop

```bash
#!/bin/bash
# Read a file line by line
while IFS= read -r line; do
    echo "Processing: $line"
done < /etc/hosts
```

```bash
#!/bin/bash
# Wait for a service to become available
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo "Service is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for service... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Service did not become ready within timeout"
    exit 1
fi
```

```bash
#!/bin/bash
# Process a queue file
while IFS= read -r task; do
    echo "Processing task: $task"
    # Process the task
    echo "$task" >> /var/log/tasks/processed.log
done < /var/log/tasks/queue.log

# Remove processed tasks
> /var/log/tasks/queue.log
```

### until Loop

```bash
#!/bin/bash
# until is the inverse of while: runs until the condition is true
until curl -s http://localhost:8080/health > /dev/null 2>&1; do
    echo "Service not ready, waiting..."
    sleep 2
done
echo "Service is ready"
```

### Breaking and Continuing

```bash
#!/bin/bash
# break exits the loop
for file in *.log; do
    if [ ! -f "$file" ]; then
        continue    # Skip non-files
    fi
    echo "Processing $file"
    if grep -q "CRITICAL" "$file"; then
        echo "CRITICAL error found in $file"
        break       # Stop processing
    fi
done
```

`continue` skips to the next iteration. `break` exits the loop entirely.

## Functions

Functions group related logic into reusable blocks:

```bash
#!/bin/bash
check_service() {
    local host="$1"
    local port="$2"
    local timeout="${3:-3}"
    
    if nc -z -w "$timeout" "$host" "$port" 2>/dev/null; then
        echo "$host:$port is open"
        return 0
    else
        echo "$host:$port is closed or unreachable"
        return 1
    fi
}

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message"
}

# Use the functions
log "INFO" "Starting health check..."
check_service "localhost" "8080"
check_service "localhost" "5432"
check_service "localhost" "6379" 5
```

Key points:
- Use `local` for variables inside functions to avoid polluting the global scope
- Use `return` for exit codes (0 = success, non-zero = failure)
- Use `echo` or `printf` for output
- Use `"$@"` to pass all arguments to another function

```bash
#!/bin/bash
run_on_all() {
    local servers=("web-01" "web-02" "web-03" "db-01" "db-02")
    local command="$@"
    
    for server in "${servers[@]}"; do
        echo "=== $server ==="
        ssh -o ConnectTimeout=5 "$server" "$command" 2>&1
    done
}

run_on_all "uptime && free -h | grep Mem"
```

### Functions with Return Values

Functions can return values through stdout (captured with `$()`), not through `return` (which is limited to 0-255):

```bash
#!/bin/bash
get_ip() {
    local interface="$1"
    ip -4 addr show "$interface" | awk '/inet / {print $2}' | cut -d/ -f1
}

MY_IP=$(get_ip eth0)
echo "My IP: $MY_IP"
```

## Exit Codes

Every command returns an exit code. 0 means success, anything else means failure:

```bash
#!/bin/bash
grep "root" /etc/passwd > /dev/null
if [ $? -eq 0 ]; then
    echo "root user found"
else
    echo "root user NOT found"
fi
```

You can simplify with direct testing:

```bash
#!/bin/bash
if grep -q "root" /etc/passwd; then
    echo "root user found"
fi
```

### exit Statements

```bash
#!/bin/bash
CONFIG_FILE="/etc/myapp/config.yml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Config file not found: $CONFIG_FILE"
    exit 1
fi

if [ ! -r "$CONFIG_FILE" ]; then
    echo "ERROR: Config file not readable: $CONFIG_FILE"
    exit 2
fi

# If we get here, everything is fine
echo "Config loaded successfully"
exit 0
```

Convention:
- `0`: success
- `1`: general error
- `2`: misuse of shell command
- `126`: command not executable
- `127`: command not found
- `128+n`: fatal signal `n`
- `255`: exit code out of range

## Error Handling: set -euo pipefail

This is the single most important line you can put in a production script:

```bash
#!/bin/bash
set -euo pipefail
```

- `-e`: exit immediately if any command fails (returns non-zero)
- `-u`: treat unset variables as errors (instead of silently expanding to empty strings)
- `-o pipefail`: if any command in a pipeline fails, the entire pipeline fails

Without `set -euo pipefail`:

```bash
#!/bin/bash
# This will silently continue even if the backup fails
cp /important/data /backup/
rm /important/data
```

With `set -euo pipefail`:

```bash
#!/bin/bash
set -euo pipefail
# If cp fails, the script exits immediately. rm never runs.
cp /important/data /backup/
rm /important/data
```

### Handling Errors

```bash
#!/bin/bash
set -euo pipefail

cleanup() {
    local exit_code=$?
    echo "Cleaning up..."
    # Remove temporary files, release locks, etc.
    rm -f /tmp/myapp_*.lock
    exit "$exit_code"
}

trap cleanup EXIT

# Main script logic
echo "Starting backup..."
# If anything fails, cleanup runs automatically
```

The `trap` command catches signals. `EXIT` fires when the script exits (for any reason). This is where you put cleanup logic.

```bash
#!/bin/bash
set -euo pipefail

# Trap different signals
trap 'echo "Received SIGINT, cleaning up..."; cleanup' INT
trap 'echo "Received SIGTERM, cleaning up..."; cleanup' TERM
trap 'echo "Received SIGHUP, reloading config..."; reload_config' HUP
trap cleanup EXIT

cleanup() {
    rm -f /tmp/myapp_*.lock
    rm -f /tmp/myapp_*.tmp
    exit "${1:-0}"
}

reload_config() {
    echo "Reloading configuration..."
    # Reload logic here
}
```

### Handling Errors in Pipelines

With `set -o pipefail`, if any command in a pipeline fails, the whole pipeline fails:

```bash
#!/bin/bash
set -euo pipefail

# If grep finds nothing, it returns 1, which fails the pipeline
if grep "ERROR" /var/log/syslog | head -5; then
    echo "Found errors"
else
    echo "No errors found (or file doesn't exist)"
fi
```

Without `pipefail`, `grep` returning 1 would be masked by `head` returning 0, and the pipeline would appear to succeed.

## Practical Patterns

### Argument Parsing

```bash
#!/bin/bash
set -euo pipefail

usage() {
    cat <<EOF
Usage: $0 [OPTIONS] <target>

Deploy an application to the specified target environment.

Options:
  -e, --env ENV       Environment (dev, staging, production) [default: production]
  -d, --dry-run       Show what would be done without doing it
  -v, --verbose       Enable verbose output
  -h, --help          Show this help message

Examples:
  $0 -e staging web-01
  $0 --dry-run --verbose production
EOF
    exit 1
}

# Defaults
ENV="production"
DRY_RUN=false
VERBOSE=false
TARGET=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        -*)
            echo "Unknown option: $1"
            usage
            ;;
        *)
            TARGET="$1"
            shift
            ;;
    esac
done

# Validate required arguments
if [ -z "$TARGET" ]; then
    echo "ERROR: No target specified"
    usage
fi

# Validate environment
case "$ENV" in
    dev|staging|production) ;;
    *)
        echo "ERROR: Invalid environment: $ENV"
        usage
        ;;
esac

echo "Environment: $ENV"
echo "Dry run: $DRY_RUN"
echo "Verbose: $VERBOSE"
echo "Target: $TARGET"
```

### Logging

```bash
#!/bin/bash
set -euo pipefail

LOG_FILE="/var/log/myapp/deploy.log"
LOG_LEVEL="${LOG_LEVEL:-INFO}"

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Only log if the level is at or above the configured level
    case "$LOG_LEVEL" in
        DEBUG) ;;
        INFO) [ "$level" = "DEBUG" ] && return ;;
        WARN) [ "$level" = "DEBUG" -o "$level" = "INFO" ] && return ;;
        ERROR) [ "$level" != "ERROR" ] && return ;;
    esac
    
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log "INFO" "Deployment started"
log "INFO" "Target: $TARGET"
log "DEBUG" "Detailed debugging information"
log "WARN" "This is a warning"
log "ERROR" "This is an error"
```

### Lock Files (Prevent Concurrent Runs)

```bash
#!/bin/bash
set -euo pipefail

LOCK_FILE="/var/run/myapp/deploy.lock"

cleanup() {
    rm -f "$LOCK_FILE"
}

# Check if another instance is running
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "ERROR: Another instance is running (PID: $PID)"
        exit 1
    else
        echo "Removing stale lock file (PID $PID no longer exists)"
        rm -f "$LOCK_FILE"
    fi
fi

# Create lock file with our PID
echo $$ > "$LOCK_FILE"
trap cleanup EXIT

# Main logic here
echo "Running deployment..."
sleep 10
echo "Deployment complete"
```

### Retry Logic

```bash
#!/bin/bash
set -euo pipefail

retry() {
    local max_attempts="$1"
    local delay="$2"
    shift 2
    local command=("$@")
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if "${command[@]}"; then
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts failed. Retrying in ${delay}s..."
        sleep "$delay"
        attempt=$((attempt + 1))
    done
    
    echo "All $max_attempts attempts failed"
    return 1
}

# Usage
retry 3 5 curl -s http://localhost:8080/health
```

### Temp Files and Cleanup

```bash
#!/bin/bash
set -euo pipefail

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

# Use $TMPDIR for temporary files
curl -s http://example.com/data.csv > "$TMPDIR/data.csv"
process_data "$TMPDIR/data.csv" > "$TMPDIR/result.csv"
upload_result "$TMPDIR/result.csv"
```

`mktemp -d` creates a unique temporary directory. The `trap` ensures it is cleaned up when the script exits, regardless of how it exits.

## Real Scenario: Writing a Backup Script

Here is a production-ready backup script that demonstrates everything covered in this module.

```bash
#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/myapp}"
DATABASE_NAME="${DATABASE_NAME:-myapp_production}"
DATABASE_USER="${DATABASE_USER:-backup_user}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
S3_BUCKET="${S3_BUCKET:-s3://myapp-backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DATABASE_NAME}_${DATE}.sql.gz"
LOG_FILE="${LOG_FILE:-/var/log/myapp/backup.log}"
LOCK_FILE="/var/run/myapp/backup.lock"
MAX_RETRIES=3

# Functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

cleanup() {
    local exit_code=$?
    rm -f "$LOCK_FILE"
    if [ $exit_code -ne 0 ]; then
        log "ERROR" "Backup failed with exit code $exit_code"
    fi
    exit "$exit_code"
}

check_disk_space() {
    local available
    available=$(df -BG "$BACKUP_DIR" | awk 'NR==2 {print $4}' | tr -d 'G')
    if [ "$available" -lt 5 ]; then
        log "ERROR" "Insufficient disk space: ${available}GB available, need at least 5GB"
        exit 1
    fi
    log "INFO" "Disk space check passed: ${available}GB available"
}

do_backup() {
    local attempt=1
    while [ $attempt -le $MAX_RETRIES ]; do
        log "INFO" "Backup attempt $attempt of $MAX_RETRIES..."
        
        if pg_dump -U "$DATABASE_USER" "$DATABASE_NAME" | gzip > "$BACKUP_FILE"; then
            local size
            size=$(du -h "$BACKUP_FILE" | cut -f1)
            log "INFO" "Backup completed: $BACKUP_FILE ($size)"
            return 0
        fi
        
        log "WARN" "Backup attempt $attempt failed"
        rm -f "$BACKUP_FILE"
        attempt=$((attempt + 1))
        sleep 5
    done
    
    log "ERROR" "All backup attempts failed"
    return 1
}

upload_to_s3() {
    if command -v aws &> /dev/null; then
        log "INFO" "Uploading to S3..."
        if aws s3 cp "$BACKUP_FILE" "${S3_BUCKET}/$(basename "$BACKUP_FILE")"; then
            log "INFO" "S3 upload completed"
        else
            log "ERROR" "S3 upload failed"
            return 1
        fi
    else
        log "WARN" "AWS CLI not found, skipping S3 upload"
    fi
}

cleanup_old_backups() {
    log "INFO" "Removing backups older than $RETENTION_DAYS days..."
    local count
    count=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS | wc -l)
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    log "INFO" "Removed $count old backup(s)"
}

verify_backup() {
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        if gzip -t "$BACKUP_FILE" 2>/dev/null; then
            log "INFO" "Backup verification passed"
            return 0
        fi
    fi
    log "ERROR" "Backup verification failed"
    return 1
}

# Main
main() {
    log "INFO" "=== Backup started ==="
    
    # Lock
    if [ -f "$LOCK_FILE" ]; then
        local old_pid
        old_pid=$(cat "$LOCK_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            log "ERROR" "Another backup is already running (PID: $old_pid)"
            exit 1
        else
            log "WARN" "Removing stale lock file"
            rm -f "$LOCK_FILE"
        fi
    fi
    echo $$ > "$LOCK_FILE"
    trap cleanup EXIT
    
    # Pre-flight checks
    mkdir -p "$BACKUP_DIR"
    check_disk_space
    
    # Run backup
    do_backup
    
    # Verify
    verify_backup
    
    # Upload
    upload_to_s3
    
    # Cleanup
    cleanup_old_backups
    
    log "INFO" "=== Backup completed successfully ==="
}

main "$@"
```

This script uses every pattern covered in this module:
- `set -euo pipefail` for error handling
- A `trap` for cleanup on exit
- A lock file to prevent concurrent runs
- Retry logic for the actual backup
- Disk space checks before starting
- Backup verification
- S3 upload
- Old backup cleanup
- Structured logging with levels
- Functions for modularity
- Command-line arguments with defaults
- Input validation

## Assessment

**Lab: Shell Scripting (40 minutes)**

Scenario: You need to write three scripts for server operations.

**Tasks:**

1. Write a script called `health_check.sh` that:
   - Checks if nginx is running (process check)
   - Checks if port 80 is listening
   - Checks disk usage and warns if above 80%
   - Checks memory usage and warns if above 90%
   - Checks if the system load average is above 4.0
   - Outputs a JSON-formatted report to stdout
   - Uses proper error handling (set -euo pipefail)
   - Uses functions for each check
   - Takes an optional argument for the output file

2. Write a script called `deploy.sh` that:
   - Accepts a version number as a command-line argument
   - Accepts an environment flag (-e dev/staging/production)
   - Accepts a --dry-run flag that shows what would be done
   - Validates all inputs before proceeding
   - Creates a backup of the current deployment
   - Downloads the specified version from a package repository (or simulates it)
   - Restarts the application service
   - Verifies the service is healthy after restart (waits up to 30 seconds)
   - Rolls back if the health check fails
   - Has proper logging to a file and stdout
   - Has a usage message for invalid input
   - Uses a lock file to prevent concurrent deployments

3. Write a script called `log_analyzer.sh` that:
   - Takes a log file path as an argument
   - Validates the file exists and is readable
   - Outputs the total number of lines
   - Outputs the count of each log level (INFO, WARN, ERROR, FATAL)
   - Outputs the top 5 most common error messages
   - Outputs the time range covered by the log
   - Outputs the average number of log entries per hour
   - Uses awk, grep, sort, and uniq
   - Handles the case where the file does not exist or is empty
   - Produces a summary report formatted as a table

**Grading Criteria:**

- health_check.sh (30 points):
  - All five checks implemented: 15 points
  - JSON output format: 5 points
  - Error handling and functions: 10 points

- deploy.sh (40 points):
  - Argument parsing with validation: 10 points
  - Backup creation: 5 points
  - Download/install simulation: 5 points
  - Service restart and health check: 10 points
  - Rollback logic: 5 points
  - Logging, lock file, and usage: 5 points

- log_analyzer.sh (30 points):
  - All five analysis sections: 20 points
  - Error handling for missing/empty file: 5 points
  - Correct use of text processing tools: 5 points

**Total: 100 points. Pass threshold: 70 points.**

## Evidence

After completing this lab, you should have:

- Three working shell scripts that demonstrate proper bash programming practices.
- Scripts that use error handling, functions, argument parsing, and logging.
- The ability to write reliable automation scripts for production use.
- Understanding of how to build scripts that are maintainable and debuggable.
