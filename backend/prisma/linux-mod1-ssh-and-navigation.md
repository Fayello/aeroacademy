# Module 1 — SSH and Terminal Navigation

## Why This Matters

Every interaction you have with a Linux server starts at a terminal. Whether you are logging into a single server or managing a fleet of two hundred, the fundamentals of SSH connectivity and shell navigation are the bedrock of everything else you will do. This module covers the tools and habits that separate someone who fumbles with a server from someone who moves through it confidently.

You will learn how SSH authentication actually works under the hood, how to configure it so you never type a password again, and how to navigate the filesystem at speed. We will build muscle memory with commands, work through real output, and finish with a scenario that simulates the kind of work you will actually do in production.

## SSH: How It Actually Works

SSH (Secure Shell) is a protocol that encrypts traffic between two machines over an unencrypted network. When you type `ssh user@server`, a series of things happen in rapid succession. Your client contacts the server on port 22 (by default), the server presents its host key, both sides negotiate encryption parameters, and then either a password prompt appears or a key-based authentication handshake occurs.

The encrypted tunnel that gets established uses symmetric encryption for the data flowing in both sides, while the initial key exchange uses asymmetric cryptography. Once the tunnel is up, the session is as secure as the underlying cipher allows.

The two authentication methods you will encounter most often are password authentication and public-key authentication. Password authentication is the default, but it is also the weakest. An attacker who can reach port 22 can attempt passwords indefinitely. Public-key authentication eliminates this attack surface entirely because the server rejects any connection attempt that does not present a valid key.

## Generating SSH Keys

The standard command for creating an SSH key pair is `ssh-keygen`. On most modern systems, this generates a 2048-bit RSA key by default. You should use Ed25519 instead, which is faster, smaller, and more resistant to certain side-channel attacks.

```bash
ssh-keygen -t ed25519 -C "admin@xpertclass.academy"
```

When you run this, you will see output like:

```
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/admin/.ssh/id_ed25519): 
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /home/admin/.ssh/id_ed25519
Your public key has been saved in /home/admin/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:3xKj8...admin@xpertclass.academy
The key's randomart image is:
+--[ED25519 256]--+
|     .o+.        |
|    . . o        |
|     . . o       |
|    .   S        |
|   . . o .       |
|  o o + B        |
| . = + X .       |
|  . . + .        |
|   o..          |
+----[SHA256]-----+
```

The private key stays on your machine at `~/.ssh/id_ed25519`. Never share it. The public key at `~/.ssh/id_ed25519.pub` gets placed on the servers you want to access.

The passphrase adds a second layer of protection. If someone steals your private key file, they still cannot use it without the passphrase. Use one. Every time.

## Deploying Your Public Key to a Server

The quickest way to copy a key to a remote server is `ssh-copy-id`:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub admin@192.168.1.50
```

This connects to the server (password authentication still works at this point), reads your public key, and appends it to `~/.ssh/authorized_keys` on the remote machine. After this, you can log in without a password:

```bash
ssh admin@192.168.1.50
```

```
Enter passphrase for key '/home/admin/.ssh/id_ed25519': 
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)
admin@web-prod-01:~$
```

If `ssh-copy-id` is not available (for example, on a Windows machine without Git Bash), you can do it manually:

```bash
cat ~/.ssh/id_ed25519.pub | ssh admin@192.168.1.50 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

## SSH Agent and Agent Forwarding

Typing your key passphrase every time you connect gets tedious. The SSH agent holds your decrypted keys in memory so you only need to enter the passphrase once per session.

Start the agent and add your key:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

```
Agent pid 14823
Enter passphrase for /home/admin/.ssh/id_ed25519: 
Identity added: /home/admin/.ssh/id_ed25519 (admin@xpertclass.academy)
```

Now every `ssh` connection in that terminal session uses the loaded key automatically.

Agent forwarding lets you hop through a bastion host to reach internal servers without copying your key onto the bastion. Enable it with `-A`:

```bash
ssh -A admin@bastion.example.com
```

From the bastion, you can now SSH to any server that has your public key in its `authorized_keys`, without the bastion ever storing your private key. The authentication handshake is forwarded back to your local agent.

**Security note:** Agent forwarding creates a socket on the bastion that a root user on that machine could theoretically intercept. Only use it on hosts you trust, or better yet, use ProxyJump instead.

## The SSH Config File

The `~/.ssh/config` file eliminates the need to remember IP addresses, usernames, and flags. A well-crafted config looks like this:

```
Host bastion
    HostName 203.0.113.10
    User admin
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ForwardAgent yes

Host internal-*
    ProxyJump bastion
    User admin
    IdentityFile ~/.ssh/id_ed25519

Host web-prod-*
    HostName 192.168.1.%h
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    ForwardX11 no

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    AddKeysToAgent yes
```

With this config, typing `ssh bastion` connects to `203.0.113.10` as `admin` using your Ed25519 key. Typing `ssh internal-db-01` automatically jumps through the bastion. Typing `ssh web-prod-03` connects to `192.168.1.web-prod-03` (you would adjust the HostName pattern to match your actual IP scheme).

The `AddKeysToAgent yes` directive tells SSH to automatically add the key to your agent when you use it, so you do not need to run `ssh-add` manually.

The `ServerAliveInterval 60` line sends a keepalive packet every 60 seconds, preventing your connection from dropping due to idle timeouts.

## Terminal Navigation: The Core Commands

### pwd — Where Am I?

`pwd` prints the current working directory:

```bash
pwd
```
```
/home/admin/projects/webapp
```

This sounds trivial until you are three levels deep in a symlink maze and need to confirm your actual location.

### ls — What Is Here?

`ls` lists directory contents. The flags you will use most often:

```bash
ls -la /etc/nginx/
```
```
total 72
drwxr-xr-x   8 root root 4096 Jan 15 10:23 .
drwxr-xr-x 102 root root 4096 Feb 12 09:41 ..
drwxr-xr-x   2 root root 4096 Jan 15 10:23 conf.d
-rw-r--r--   1 root root 1077 Jan 15 10:23 fastcgi.conf
-rw-r--r--   1 root root 1007 Jan 15 10:23 fastcgi_params
-rw-r--r--   1 root root 5349 Jan 15 10:23 mime.types
-rw-r--r--   1 root root 2656 Jan 15 10:23 nginx.conf
drwxr-xr-x   2 root root 4096 Jan 15 10:23 sites-available
drwxr-xr-x   2 root root 4096 Jan 15 10:23 sites-enabled
```

The `-l` flag gives you the long format (permissions, owner, size, date). The `-a` flag shows hidden files (anything starting with `.`). Together, `-la` is probably the single most common flag combination in Linux.

Other useful variants:

- `ls -ltr` — sort by modification time, newest last. Useful for finding recently changed files.
- `ls -lhS` — sort by size, human-readable. Good for finding what is eating disk space.
- `ls -1` — one entry per line. Useful when piping to other commands.

### cd — Changing Directory

```bash
cd /var/log              # Absolute path
cd nginx                 # Relative path (goes into ./nginx)
cd ..                    # Parent directory
cd ~                     # Home directory (same as just typing cd)
cd -                     # Previous directory (toggle between two locations)
```

The `cd -` trick is underrated. If you are in `/var/log` and then `cd /opt/app`, typing `cd -` takes you back to `/var/log`, and typing it again takes you back to `/opt/app`.

### find — Locating Files

`find` is the Swiss Army knife of file searching. It traverses directory trees and applies conditions:

```bash
find /var/log -name "*.log" -mtime -7
```
```
/var/log/syslog
/var/log/auth.log
/var/log/nginx/access.log
/var/log/nginx/error.log
```

This finds all files ending in `.log` under `/var/log` that were modified in the last 7 days.

More examples:

```bash
find / -type f -size +100M                     # Files larger than 100MB anywhere
find /home -user deploy -name "*.conf"          # conf files owned by deploy
find /tmp -mmin -30 -type f                    # Files modified in last 30 minutes
find /var/log -name "*.gz" -delete             # Delete all gzipped logs
```

The `-exec` flag lets you run a command on each result:

```bash
find /var/log -name "*.log" -exec grep -l "ERROR" {} \;
```

Use `+` instead of `\;` when possible — it batches filenames into fewer command invocations, which is faster:

```bash
find /var/log -name "*.log" -exec grep -l "ERROR" {} +
```

### locate — Fast File Lookup

`locate` uses a pre-built database instead of traversing the filesystem in real time. It is fast but the database may be stale:

```bash
locate nginx.conf
```
```
/etc/nginx/nginx.conf
/usr/lib/nginx/modules/ngx_http_geoip_module.so
/home/admin/projects/webapp/config/nginx.conf
```

Update the database manually:

```bash
sudo updatedb
```

`locate` is useful when you know part of a filename but not where it lives. For everything else, `find` gives you more control.

## File Operations

### cp — Copying

```bash
cp file.txt backup.txt                    # Copy a file
cp -r directory/ backup/                  # Copy a directory recursively
cp -a source/ dest/                       # Archive mode (preserves permissions, timestamps, symlinks)
cp -i file.txt dest/                      # Prompt before overwriting
cp --backup=numbered file.txt dest/       # Create numbered backups
```

The `-a` flag is critical when copying configuration directories or anything where permissions matter. Without it, the copied files inherit your umask, which may be more permissive than the originals.

### mv — Moving and Renaming

`mv` moves or renames files:

```bash
mv oldname.txt newname.txt                # Rename
mv file.txt /tmp/                         # Move
mv -i *.log /var/archive/                 # Move with overwrite protection
```

`mv` does not ask for confirmation by default. An accidental `mv` that overwrites a file is gone. Use `-i` (interactive) or `-n` (no-clobber) when you are uncertain.

### rm — Removing

```bash
rm file.txt                               # Delete a file
rm -i file.txt                            # Prompt before deleting
rm -rf directory/                         # Delete directory and contents recursively
```

**There is no trash can in the Linux terminal.** `rm` is permanent. The `-f` flag (force) suppresses prompts and error messages for nonexistent files. Combined with `-r`, it deletes everything in sight.

Never run `rm -rf /` or `rm -rf *` from the wrong directory. If your prompt shows `/` or something unexpected, stop and verify with `pwd` before executing.

A safer habit is to use `rm -i` as your default and override it with `-f` only when you are certain:

```bash
alias rm='rm -i'
```

### touch — Creating Empty Files and Updating Timestamps

```bash
touch newfile.txt                         # Create an empty file (or update timestamp)
touch -t 202401151030 file.txt            # Set specific timestamp
```

`touch` is also commonly used in build systems and scripts to create sentinel files that track whether a step has been executed.

### mkdir — Creating Directories

```bash
mkdir newdir                              # Create a single directory
mkdir -p path/to/nested/dir              # Create parent directories as needed
```

The `-p` flag is essential. Without it, `mkdir -p path/to/nested/dir` fails if `path/to` does not exist. With `-p`, it creates every missing component.

## Globbing and Wildcards

Shell globbing expands patterns before the command runs:

```bash
ls *.log                                  # All files ending in .log
ls file?.txt                              # file1.txt, fileA.txt, but not file10.txt
ls file[0-9].txt                          # file0.txt through file9.txt
ls {access,error}.log                     # access.log and error.log
cp config.yml{,.bak}                      # Expands to: cp config.yml config.yml.bak
```

The brace expansion on the last line is a shell feature, not a glob. It generates arguments before the command runs. This is extremely useful for quick backups:

```bash
mv nginx.conf{,.old}
cp docker-compose.yml{,.backup.$(date +%Y%m%d)}
```

Globbing happens automatically in most contexts, but not inside quotes. `echo "*.txt"` prints the literal string `*.txt`, while `echo *.txt` expands the pattern.

## Tab Completion

Pressing Tab in a bash shell completes the current word based on available files and commands. Pressing Tab twice shows all possibilities:

```bash
cd /var/l<TAB>
# Completes to: cd /var/log/

ls /etc/ng<TAB><TAB>
# Shows: nginx/  nsswitch.conf
```

Tab completion works for commands, file paths, hostnames (with SSH), and even some command-specific options. It is the single biggest speed improvement for terminal use. If you are typing full paths by hand, you are wasting time.

## History

Bash keeps a history of commands in `~/.bash_history`. Useful operations:

```bash
history                                  # Show all history
history | grep "docker"                  # Search history
!!                                       # Repeat last command
!grep                                    # Repeat last command starting with "grep"
!$                                       # Last argument of previous command
```

The history search shortcut `Ctrl+R` is invaluable. Press it and start typing — bash shows the most recent command matching your input. Press Enter to execute it, or the right arrow key to edit it first.

```bash
(reverse-i-search)`deploy': ssh bastion 'cd /opt && ./deploy.sh'
```

You can increase the history size by adding to `~/.bashrc`:

```bash
export HISTSIZE=50000
export HISTFILESIZE=100000
export HISTCONTROL=ignoredups:erasedups
```

The `ignoredups:erasedups` setting prevents duplicate entries and removes earlier duplicates when you exit, keeping the history clean.

## Putting It Together: Setting Up SSH for 20 Servers

Imagine you are onboarding onto a new infrastructure with 20 Ubuntu servers — web servers, database servers, monitoring hosts, and a bastion. Here is the realistic workflow.

**Step 1: Generate your key pair.**

```bash
ssh-keygen -t ed25519 -C "admin@xpertclass.academy" -f ~/.ssh/id_prod
```

Using a separate key for production (rather than reusing your default key) gives you a clear separation. If the production key is compromised, you revoke it without affecting other environments.

**Step 2: Configure SSH.**

Create `~/.ssh/config`:

```
Host bastion
    HostName 203.0.113.10
    User admin
    IdentityFile ~/.ssh/id_prod
    ForwardAgent yes

Host web-*
    ProxyJump bastion
    User deploy
    IdentityFile ~/.ssh/id_prod

Host db-*
    ProxyJump bastion
    User dbadmin
    IdentityFile ~/.ssh/id_prod

Host monitor-*
    ProxyJump bastion
    User ops
    IdentityFile ~/.ssh/id_prod

Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    AddKeysToAgent yes
    StrictHostKeyChecking ask
```

**Step 3: Copy the key to all servers.**

If you have access to each server (perhaps through a temporary password or a provisioning script):

```bash
for server in bastion web-01 web-02 web-03 web-04 db-01 db-02 monitor-01 monitor-02; do
    echo "Deploying key to $server..."
    ssh-copy-id -i ~/.ssh/id_prod.pub admin@$server
done
```

Or if you are going through the bastion:

```bash
for server in web-01 web-02 web-03 web-04 db-01 db-02 monitor-01 monitor-02; do
    echo "Deploying key to $server..."
    ssh-copy-id -i ~/.ssh/id_prod.pub -o ProxyJump=bastion admin@$server
done
```

**Step 4: Test connectivity.**

```bash
for server in bastion web-01 web-02 web-03 web-04 db-01 db-02 monitor-01 monitor-02; do
    result=$(ssh -o ConnectTimeout=5 $server "hostname" 2>&1)
    if [ $? -eq 0 ]; then
        echo "[OK]   $server -> $result"
    else
        echo "[FAIL] $server -> $result"
    fi
done
```

Expected output:

```
[OK]   bastion -> bastion.internal
[OK]   web-01 -> web-01.internal
[OK]   web-02 -> web-02.internal
[OK]   web-03 -> web-03.internal
[OK]   web-04 -> web-04.internal
[OK]   db-01 -> db-01.internal
[OK]   db-02 -> db-02.internal
[OK]   monitor-01 -> monitor-01.internal
[OK]   monitor-02 -> monitor-02.internal
```

**Step 5: Add host keys to known_hosts.**

When you first SSH to each server, SSH asks whether you want to accept the host key. You can pre-populate this:

```bash
for server in bastion web-01 web-02 web-03 web-04 db-01 db-02 monitor-01 monitor-02; do
    ssh-keyscan -H $server >> ~/.ssh/known_hosts 2>/dev/null
done
```

**Step 6: Verify with a bulk command.**

Once everything is configured, run a command across all servers:

```bash
for server in web-01 web-02 web-03 web-04 db-01 db-02 monitor-01 monitor-02; do
    echo "=== $server ==="
    ssh $server "uptime && df -h / | tail -1 && free -h | grep Mem"
done
```

This gives you a snapshot of uptime, disk usage, and memory across your fleet in seconds.

**Step 7: Lock it down (covered in Module 7).**

Disable password authentication, disable root login, and consider changing the SSH port. For now, verify that key-based auth works and that you can log in to every server.

## SCP and SFTP: Transferring Files

SSH is not just for remote commands — it also transfers files securely.

### scp — Secure Copy

```bash
# Copy a file to a remote server
scp file.txt admin@server:/tmp/

# Copy a file from a remote server
scp admin@server:/var/log/syslog ./

# Copy a directory recursively
scp -r /opt/myapp admin@server:/opt/

# Copy using a specific key
scp -i ~/.ssh/id_ed25519 file.txt admin@server:/tmp/

# Copy through a bastion host
scp -o ProxyJump=bastion file.txt admin@internal-db:/tmp/
```

`scp` uses SSH under the hood, so all your SSH config, keys, and authentication apply. The syntax is similar to `cp`: source on the left, destination on the right. A path with a colon (`:`) indicates a remote location.

### rsync Over SSH

For large transfers or syncing directories, `rsync` is better than `scp` because it only transfers changed files:

```bash
rsync -avz -e "ssh -p 2222" /opt/myapp/ admin@server:/opt/myapp/
```

The flags:
- `-a` — archive mode (preserves permissions, timestamps, symlinks)
- `-v` — verbose
- `-z` — compress during transfer

```bash
# Dry run (show what would be transferred)
rsync -avzn --delete /opt/myapp/ admin@server:/opt/myapp/

# Exclude patterns
rsync -avz --exclude='node_modules' --exclude='.git' /opt/myapp/ admin@server:/opt/myapp/
```

### sftp — Interactive File Transfer

```bash
sftp admin@server
```
```
Connected to server.
sftp> ls
remote: total 24
drwxr-xr-x 5 admin admin 4096 Jan 15 10:30 .
drwxr-xr-x 3 admin admin 4096 Jan 15 09:00 ..
-rw-r--r-- 1 admin admin  220 Jan 15 10:30 .bashrc
-rw-r--r-- 1 admin admin  807 Jan 15 10:30 .profile
drwxr-xr-x 2 admin admin 4096 Jan 15 10:30 projects
sftp> cd projects
sftp> put localfile.txt
sftp> get remotefile.txt
sftp> exit
```

`sftp` is an interactive shell for file operations on a remote server. Use it when you need to browse and transfer multiple files.

## Shortcuts and Habits Worth Building

- `Ctrl+C` — kill the current foreground process. This is your escape hatch.
- `Ctrl+Z` — suspend the current process (resume with `fg` or push to background with `bg`).
- `Ctrl+L` — clear the terminal (same as `clear`).
- `Ctrl+A` — jump to the beginning of the line.
- `Ctrl+E` — jump to the end of the line.
- `Ctrl+W` — delete the word before the cursor.
- `Ctrl+U` — delete everything from the cursor to the beginning of the line.
- `Ctrl+R` — reverse history search.

These are not optional knowledge. They are the difference between fighting your terminal and using it.

## Common Mistakes and How to Avoid Them

**Forgetting quotes around paths with spaces:**

```bash
# Wrong — bash sees two arguments
mv /home/admin/My Documents /tmp/

# Correct
mv "/home/admin/My Documents" /tmp/
```

**Confusing relative and absolute paths:**

```bash
# You are in /var/log
ls nginx        # Looks for /var/log/nginx
ls /nginx       # Looks for /nginx at the root
```

**Running commands in the wrong directory:**

```bash
# Accidentally in / instead of /home/admin
rm -rf old_project/     # Deletes /old_project/ — if it exists
```

Always check `pwd` before destructive commands.

**Over-relying on `ls` output:**

```bash
# This looks like it worked, but ls does not show hidden files
ls /etc/skel/
# Output: examples.desktop
# Missing: .bash_logout, .bashrc, .profile

ls -a /etc/skel/
# Output: .  ..  .bash_logout  .bashrc  .profile  examples.desktop
```

## Assessment

**Lab: SSH Setup and Navigation (30 minutes)**

Scenario: You have been given access to a test server at `192.168.100.50`. Your task is to set up SSH access, configure your shell environment, and demonstrate navigation skills.

**Tasks:**

1. Generate an Ed25519 SSH key pair named `id_lab` with a passphrase.
2. Copy the public key to the test server as the `admin` user.
3. Create an SSH config entry so that `ssh lab-server` connects automatically.
4. Log in to the server and verify that password authentication is no longer required.
5. On the server, create the following directory structure using the fewest commands possible:
   ```
   /opt/app/{config,logs,bin,data/{uploads,exports}}
   ```
6. Find all files in `/etc` that are larger than 1MB.
7. Find all `.conf` files in `/etc` that were modified in the last 30 days.
8. Create a file called `/tmp/navigation_proof.txt` containing:
   - The output of `pwd`
   - The output of `ls -la /etc/nginx/` (or the equivalent web server directory)
   - A list of 10 files found by `locate` that contain the word "ssh"
9. Using the `find` command, locate all SUID binaries on the system and save the list to `/tmp/suid_binaries.txt`.
10. Write a one-liner that uses `history` to count how many times you have run the `ssh` command during this lab.

**Grading Criteria:**

- Key pair generated with correct type and name: 10 points
- SSH config allows `ssh lab-server` to work: 10 points
- Directory structure created correctly: 15 points
- Large files found in /etc: 10 points
- Recent .conf files found: 10 points
- navigation_proof.txt contains all required sections: 15 points
- SUID binaries list saved correctly: 15 points
- History count command works: 5 points
- Clean command history (no obvious fumbling or repeated failed attempts): 10 points

**Total: 100 points. Pass threshold: 70 points.**

## Evidence

After completing this lab, you should have:

- A working SSH key pair that authenticates to the test server without a password.
- An SSH config file that simplifies your connection.
- A file at `/tmp/navigation_proof.txt` showing your work.
- A file at `/tmp/suid_binaries.txt` listing every SUID binary on the server.
- Familiarity with the core navigation commands and the confidence to move around a Linux filesystem quickly.
