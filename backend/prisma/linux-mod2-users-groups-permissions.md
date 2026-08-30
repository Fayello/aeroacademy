# Module 2 — Users, Groups, and Permission Management


## What You'll Actually Do

You need to create users for your team. Alice needs access to the web app. Bob needs access to the database. Charlie is an intern who should see logs but not touch anything. You'll create them, put them in groups, set permissions so they can do their jobs without breaking each other's work.

This is the part where "just give everyone root" stops being funny and starts being a liability.

## Users and Groups

Linux is a multi-user system. Every process runs as a user. Every file belongs to a user. Permissions are tied to users and groups.

**`/etc/passwd`** — every user on the system:
```bash
cat /etc/passwd | head -5
# root:x:0:0:root:/root:/bin/bash
# daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
# alice:x:1001:1001:Alice Chen:/home/alice:/bin/bash
```

Format: `username:password:UID:GID:comment:home:shell`
- The `x` means the password is in `/etc/shadow` (not readable by normal users)
- UID 0 = root. UID 1-999 = system users. UID 1000+ = real people.
- Shell `/usr/sbin/nologin` = account can't log in (for service accounts)

**`/etc/shadow`** — password hashes. Only root can read this:
```bash
sudo cat /etc/shadow | grep alice
# alice:$6$rounds=656000$...:19830:0:99999:7:::
```

**Create a user:**
```bash
useradd -m -s /bin/bash -G devops alice
```
`-m` creates home, `-s` sets shell, `-G` adds to group (secondary).

**Set password:**
```bash
passwd alice
```

**Delete a user:**
```bash
userdel -r alice
```
`-r` removes home directory. Without `-r`, the home stays behind.

**Modify a user:**
```bash
usermod -aG docker alice   # add to docker group (append, don't overwrite)
usermod -s /sbin/nologin charlie  # disable login
```

## Groups

Groups control shared access. If Alice and Bob are both in the `devops` group, and a directory is owned by `devops`, they both have access.

**Create a group:**
```bash
groupadd devops
```

**Add user to group:**
```bash
usermod -aG devops alice
```
`-a` = append. Without `-a`, `usermod -G` replaces all secondary groups. This is a common mistake.

**Remove user from group:**
```bash
gpasswd -d alice devops
```

**Check groups:**
```bash
groups alice
# alice : alice devops
id alice
# uid=1001(alice) gid=1001(alice) groups=1001(alice),1002(devops)
```

**`/etc/group`** — group definitions:
```bash
cat /etc/group | grep devops
# devops:x:1002:alice,bob
```

## Permission Models: Owner, Group, Other

You saw this in Module1. Now you understand what it actually means.

```
-rwxr-xr-- 1 alice devops 4096 Jan 15 10:30 deploy.sh
```

- **Owner (alice):** rwx — can do everything
- **Group (devops):** r-x — can read and execute, not write
- **Other:** r-- — can only read

**The practical consequence:** If Bob is in `devops`, he can run `deploy.sh` but can't edit it. If Charlie is not in `devops`, he can only read it (if he knows the path).

## Special Permissions

Three special bits that matter in production:

**SUID (4000):** Runs as the file owner, not the current user.
```bash
ls -la /usr/bin/passwd
# -rwsr-xr-x 1 root root ... /usr/bin/passwd
```
The `s` in the owner's execute position means: when anyone runs `passwd`, it runs as root. That's how普通 users can change their own password — `passwd` writes to `/etc/shadow`, which requires root.

**SGID (2000):** Runs as the file group, or on directories, new files inherit the group.
```bash
chmod g+s /var/www/shared/
ls -la /var/www/
# drwxrwsr-x 2 root www-data ... shared/
```
Files created inside `shared/` will be owned by `www-data` group. Useful for shared directories.

**Sticky bit (1000):** Only the file owner can delete files in the directory.
```bash
chmod +t /tmp
ls -la / | grep tmp
# drwxrwxrwt 10 root root 4096 ... tmp
```
The `t` means: anyone can create files in `/tmp`, but only the owner can delete their own. Without this, anyone could delete anyone else's files in `/tmp`.

## umask — Default Permissions

When you create a file, it gets default permissions. That's controlled by `umask`.

```bash
umask
# 0022
```

Default file permissions = `666 - umask = 644` (rw-r--r--).
Default directory permissions = `777 - umask = 755` (rwxr-xr-x).

**Change umask:**
```bash
umask 027
# Now files: 640 (rw-r-----), directories: 750 (rwxr-x---)
```

In production, `027` or `022` is common. `000` is dangerous — everyone gets full access to everything you create.

## ACLs — When Owner/Group/Other Isn't Enough

Standard permissions have3 categories. Sometimes you need more granularity.

**Give Alice read access to Bob's file without adding her to a group:**
```bash
setfacl -m u:alice:r /home/bob/secret.txt
```

**Check ACLs:**
```bash
getfacl /home/bob/secret.txt
# user::rw-
# user:alice:r--
# group::r--
# mask::r--
# other::---
```

**Remove ACL:**
```bash
setfacl -x u:alice /home/bob/secret.txt
```

ACLs are useful when you have complex access requirements but don't want to create a group for every combination.

## Real Task: Multi-User Permission Setup

Your team arrives Monday morning. You need:

1. Create users:
```bash
useradd -m -s /bin/bash alice
useradd -m -s /bin/bash bob
useradd -m -s /sbin/nologin charlie
```

2. Create groups and add users:
```bash
groupadd webteam
groupadd dbteam
usermod -aG webteam alice
usermod -aG webteam bob
usermod -aG dbteam bob
```

3. Set up the app directory:
```bash
mkdir -p /var/www/myapp
chown root:webteam /var/www/myapp
chmod 2775 /var/www/myapp   # SGID + group write + sticky
```
Now anyone in `webteam` can create files, new files inherit `webteam` group, and only file owners can delete.

4. Create a secret config:
```bash
cat > /var/www/myapp/db.conf << 'EOF'
DB_HOST=db.internal
DB_PASS=s3cret
EOF
chown root:dbteam /var/www/myapp/db.conf
chmod 640 /var/www/myapp/db.conf
```
Only root and `dbteam` can read this. Alice (webteam) can't see it.

5. Verify:
```bash
su - alice
cat /var/www/myapp/db.conf
# cat: /var/www/myapp/db.conf: Permission denied

su - bob
cat /var/www/myapp/db.conf
# DB_HOST=db.internal
# DB_PASS=s3cret
```

Bob is in both groups — he can read the config and work on the web app. Alice can work on the web app but can't see database credentials. Charlie can't log in at all.

## Failure Scenario: The Permission Mess

You create a directory with `777`:
```bash
mkdir /var/shared
chmod 777 /var/shared
```

Everyone can read, write, and execute. Sounds friendly.

Then someone runs:
```bash
rm -rf /var/shared/*
```
And deletes everyone's files. Or worse, someone drops a malicious script there and another user runs it.

**The fix:**
```bash
mkdir /var/shared
groupadd shared
chown root:shared /var/shared
chmod 2775 /var/shared
```
- `2` = SGID (new files inherit group)
- `7` = owner full access
- `7` = group read/write/execute
- `5` = other read/execute (can list and enter, can't create)

Now users in `shared` can collaborate without being able to delete each other's files.

## Assessment

**Lab task (20 min):**

1. Create users `dev1`, `dev2`, `ops1`
2. Create groups `developers` and `operations`
3. Add `dev1` and `dev2` to `developers`, `ops1` to `operations`
4. Create `/var/www/app` owned by `root:developers` with SGID
5. Create `/var/log/app` owned by `root:operations` with permissions `750`
6. Create a file `deploy.conf` in `/var/www/app` readable only by `developers`
7. Verify: `dev1` can read `deploy.conf`, `ops1` cannot, `dev1` can create files in `/var/www/app`, `ops1` cannot create files in `/var/www/app`

**Grading:**
- Users/groups created correctly: 15%
- Directory ownership and permissions: 25%
- SGID behavior correct: 20%
- Access control verified: 25%
- Clean execution, no hints: 15%

## Evidence

- **OutcomeEvidence:** `LIN-LO2 — User & Group Permission Management`
- **Mastery:** `UserSkill: linux-permissions` — +0.5 clean, +0.3 with hints
- **Telemetry:** `permission_accuracy`, `group_management`, `acl_usage`, `time_on_lab`

## Unlock

Module3 — Processes and Systemd. You can manage users and permissions. Now you learn what happens when a service starts.

## Sources

- `man useradd`, `man groupadd`, `man usermod`, `man gpasswd`
- `man setfacl`, `man getfacl`
- `man chmod`, `man chown`
- `man umask`
- Linux Foundation — System Administrator's Guide

