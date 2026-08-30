# Module 1 — SSH into a Box and Don't Get Lost


## What You'll Actually Do

You get a server. IP address, username, password. You need to log in, find your way around, figure out what's installed, where things live, and how to get back out — without breaking anything.

That's it. No theory about "the history of Unix." No table of keyboard shortcuts you'll never memorize. You'll SSH in, poke around, and learn enough to not be lost.

## The Shell Is Not a Mystery

When you SSH into a Linux box, you land in a shell. The shell is a program that reads what you type, figures out what you mean, and runs it. That's all.

```
user@server:~$
```

That `$` prompt means: "I'm listening. Type something."

You type `ls`. The shell finds `/bin/ls`, runs it, and prints the output. You type `cd /etc`. The shell changes your current directory. No magic.

**What you need to know right now:**
- `pwd` — where am I?
- `ls` — what's here?
- `cd` — go somewhere
- `clear` — screen is messy, start over
- `exit` — log out

Try it. SSH in, type `pwd`. You'll see `/home/youruser`. That's your home directory. Type `ls` — probably empty. Type `cd /` — now you're at the root of the filesystem. Type `ls` again — you'll see `bin`, `etc`, `home`, `var`, `tmp`, and others.

## The Filesystem Hierarchy Is Not Random

Linux has a directory structure. Every directory has a purpose. You don't need to memorize all of them — you need to know where things live.

| Directory | What lives there |
|-----------|-----------------|
| `/` | Root. Everything starts here. |
| `/home` | User directories. `/home/alice`, `/home/bob`. |
| `/etc` | Configuration files. Every service stores its config here. |
| `/var` | Variable data. Logs (`/var/log`), databases, mail. |
| `/tmp` | Temporary files. Gets wiped on reboot. Don't put anything important here. |
| `/bin` | Essential binaries. `ls`, `cp`, `mv`, `cat`. |
| `/usr/bin` | Non-essential binaries. Most of what you'll use. |
| `/opt` | Third-party software. Docker, Java, custom apps. |
| `/root` | Root user's home. Not `/root/home` — just `/root`. |

**The rule:** If you're looking for a config file, check `/etc`. If you're looking for logs, check `/var/log`. If you're looking for a binary you installed, check `/usr/local/bin` or `/opt`.

Type `ls /etc` and scroll through it. You'll see files you recognize — `passwd`, `shadow`, `hosts`, `ssh`. These are config files. You'll work with them later.

Type `ls /var/log` and look at what's there. `syslog`, `auth.log`, `dmesg`. These are logs. When something breaks, you look here first.

## Finding Things When You Don't Know Where They Are

You will not remember where everything is. Nobody does. You use tools.

**`find`** — search by name, type, time, size:
```bash
find / -name "nginx.conf" 2>/dev/null
```
That searches the entire filesystem for `nginx.conf`. The `2>/dev/null` hides permission errors so you don't see a wall of "Operation not permitted."

**`which`** — find a binary:
```bash
which nginx
# /usr/sbin/nginx
```

**`whereis`** — find binary, source, and man page:
```bash
whereis nginx
# nginx: /usr/sbin/nginx /usr/lib/nginx /etc/nginx /usr/share/nginx /usr/share/man/man8/nginx.8.gz
```

**`man`** — read the manual for a command:
```bash
man ls
```
Arrow keys to scroll, `q` to quit. Yes, you'll use `man` more than you think.

**`history`** — see what you've typed before:
```bash
history | grep ssh
```
Useful when you ran a command 20 minutes ago and can't remember what it was.

## Files Are Just Bytes

Linux doesn't care about file extensions the way Windows does. A file is a file is a file. The `.txt` or `.sh` or `.conf` is a hint for humans, not a rule for the system.

**Create a file:**
```bash
touch myfile.txt
```
Creates an empty file. That's all `touch` does (unless the file already exists — then it updates the timestamp).

**Write to a file:**
```bash
echo "hello world" > myfile.txt
```
`echo` prints text. `>` redirects that text into the file. If the file had content, it's gone — `>` overwrites.

**Append to a file:**
```bash
echo "another line" >> myfile.txt
```
`>>` appends. `>` overwrites. Remember this — you'll use it in scripts.

**Read a file:**
```bash
cat myfile.txt
# hello world
# another line
```

**Copy a file:**
```bash
cp myfile.txt backup.txt
```

**Move/rename a file:**
```bash
mv myfile.txt /tmp/myfile.txt
mv oldname.txt newname.txt
```

**Delete a file:**
```bash
rm myfile.txt
```
No trash can. No undo. `rm` deletes. Be careful.

**Create a directory:**
```bash
mkdir mydir
```

**Delete a directory and its contents:**
```bash
rm -rf mydir
```
`-r` recursive (delete everything inside). `-f` force (don't ask). `rm -rf` is the command that makes sysadmins sweat. Use it carefully.

## Permissions — Who Can Do What

Every file and directory has permissions. They look like this:

```
-rwxr-xr-- 1 alice devops 4096 Jan 15 10:30 deploy.sh
```

Break it down:
- `-` — type (`-` = file, `d` = directory)
- `rwx` — owner can read, write, execute
- `r-x` — group can read and execute
- `r--` — everyone else can only read

**Read (r) =4, Write (w) =2, Execute (x) =1.** Add them up.

| Permission | Meaning | Numeric |
|-----------|---------|---------|
| `rwx` | Full access |7 |
| `r-x` | Read and execute |5 |
| `r--` | Read only |4 |
| `---` | Nothing |0 |

**Change permissions:**
```bash
chmod 755 deploy.sh    # rwxr-xr-x
chmod 644 config.conf  # rw-r--r--
chmod 600 secret.key   # rw-------
```

**Change ownership:**
```bash
chown alice:devops deploy.sh
```

**Why this matters:** If your deploy script has `644` permissions, it won't execute. If your private key has `644` permissions, SSH will refuse to use it ("bad permissions"). You'll hit this. It's annoying until you understand it.

## Putting It Together: Your First Real Task

A new server arrives. You SSH in as `root`. You need to:

1. Create a user `deploy`:
```bash
useradd -m -s /bin/bash deploy
```
`-m` creates home directory. `-s` sets the shell.

2. Set a password:
```bash
passwd deploy
```

3. Create the app directory:
```bash
mkdir -p /opt/myapp
chown deploy:deploy /opt/myapp
```

4. Create a config file:
```bash
cat > /opt/myapp/config.env << 'EOF'
APP_PORT=8080
DB_HOST=localhost
DB_NAME=myapp
EOF
chmod 600 /opt/myapp/config.env
```

5. Verify:
```bash
ls -la /opt/myapp/
# should show deploy:deploy ownership, config.env with 600 permissions
```

You've just set up a basic app directory with proper ownership and permissions. That's real work.

## Failure Scenario: What Happens When Permissions Are Wrong

You create a deploy script:
```bash
echo '#!/bin/bash\necho "Deploying..."' > /opt/myapp/deploy.sh
```

You try to run it:
```bash
/opt/myapp/deploy.sh
# bash: /opt/myapp/deploy.sh: Permission denied
```

Why? Because `echo` creates a file with `644` permissions. No execute bit. The shell can't run it.

Fix:
```bash
chmod +x /opt/myapp/deploy.sh
/opt/myapp/deploy.sh
# Deploying...
```

Or set it at creation:
```bash
chmod 755 /opt/myapp/deploy.sh
```

You'll see "Permission denied" a hundred times before you learn to check `ls -la` first. That's normal.

## Assessment

**Pass threshold:** Complete the lab, not score on a quiz.

**Lab task (20 min, isolated environment):**

1. SSH into the provided server as `root`
2. Create user `webadmin` with bash shell and home directory
3. Create directory `/var/www/mysite` owned by `webadmin:www-data`
4. Create file `index.html` in that directory with content `<h1>Hello</h1>`
5. Set permissions: `webadmin` can read/write/execute, `www-data` can read/execute, everyone else can read
6. Create a deploy script `/opt/deploy.sh` that copies `index.html` to `/var/www/html/` and restarts nginx
7. Make the script executable and run it
8. Verify the site is accessible with `curl localhost`

**Grading:**
- User exists with correct shell/home: 15%
- Directory ownership correct: 15%
- File content correct: 10%
- Permissions correct (not just "something works"): 25%
- Script works end-to-end: 25%
- Completed without hints: 10%

**If you need hints:** That's fine for first attempt. Mastery is measured on clean execution.

## Evidence Generated

Upon completion:
- **OutcomeEvidence:** `LIN-LO1 — Shell Navigation & Permissions`
- **Mastery:** `UserSkill: linux-shell-fundamentals` — +0.5 if clean, +0.3 if with hints
- **Telemetry:** `permission_accuracy`, `task_completion`, `hint_usage`, `time_on_lab`

If cohort shows <70% on permissions (step5), the adaptive engine proposes a micro-lesson: *"Why 644 breaks your deploy script."*

## Unlock

Module2 — Users, Groups, and Permission Management unlocks when this module is complete. Not XP, not time. You can SSH in, navigate, create files, and set permissions. Module2 assumes that and goes deeper.

## Sources

- `man useradd`, `man chmod`, `man chown` — the actual documentation
- `man hier` — filesystem hierarchy standard
- Linux Foundation — Linux System Administrator's Guide
- `ssh_config(5)`, `sshd_config(5)` — SSH configuration

