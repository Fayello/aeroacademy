# Module 2 — Users, Groups, and Permissions

## Why This Matters

Linux is a multi-user operating system. Every process, every file, every network socket belongs to a user and potentially a group. Understanding how users and groups work, and how permissions control access, is not optional knowledge — it is the difference between a server that is reasonably secure and one that is wide open.

You will encounter permission problems constantly. A cron job runs as root but needs to write to a directory owned by a web user. A developer needs read access to logs but should not be able to delete them. A shared directory needs to let anyone create files but prevent anyone from deleting someone else's work. These are everyday problems, and this module gives you the tools to solve them.

## The User Database: /etc/passwd

Every user on a Linux system has an entry in `/etc/passwd`. This file is world-readable (it has to be — many programs need to look up usernames and UIDs). Here is what a typical entry looks like:

```bash
cat /etc/passwd | grep admin
```
```
admin:x:1000:1000:Admin User:/home/admin:/bin/bash
```

The fields, separated by colons, are:

1. **Username** — `admin`
2. **Password** — `x` means the password hash is stored in `/etc/shadow`
3. **UID** — `1000` (the numeric user ID)
4. **GID** — `1000` (the primary group ID)
5. **GECOS** — `Admin User` (full name and optional comment fields)
6. **Home directory** — `/home/admin`
7. **Shell** — `/bin/bash`

System users (created for services like `www-data`, `mysql`, `nobody`) typically have UIDs below 1000. Human users start at 1000. The root user is always UID 0.

You can look up a user quickly:

```bash
getent passwd admin
```
```
admin:x:1000:1000:Admin User:/home/admin:/bin/bash
```

`getent` queries the system's name service switch (NSS), which may include LDAP or other directory services, not just `/etc/passwd`. In most simple setups they return the same thing, but `getent` is the correct tool for lookups.

## The Password File: /etc/shadow

The shadow file holds password hashes and aging information. It is only readable by root:

```bash
sudo cat /etc/shadow | grep admin
```
```
admin:$6$rounds=656000$kX2a...hash...$kX2a...hash...:19405:0:99999:7:::
```

The fields are:

1. **Username**
2. **Password hash** — the algorithm identifier, salt, and hash combined
3. **Last password change** — days since epoch (Jan 1, 1970)
4. **Minimum password age** — days before the user can change the password again
5. **Maximum password age** — days before the password expires
6. **Warning period** — days before expiry to warn the user
7. **Inactivity period** — days after expiry before the account is locked
8. **Expiration date** — absolute date the account is disabled
9. **Reserved**

The `!` or `*` at the beginning of the hash means the account is locked (no password login possible). The `$6$` prefix indicates a SHA-512 hash, which is the current standard.

You can check password aging for a user:

```bash
chage -l admin
```
```
Last password change                : Jan 15, 2024
Password expires                    : never
Password inactive                   : never
Account expires                     : never
Minimum number of days between password change  : 0
Maximum number of days between password change  : 99999
Number of days of warning before password expires : 7
```

## The Group Database: /etc/group

Groups are defined in `/etc/group`:

```bash
cat /etc/group | grep developers
```
```
developers:x:5000:alice,bob,charlie
```

Fields:

1. **Group name** — `developers`
2. **Password** — `x` (rarely used; groups can have passwords for `newgrp` but this is uncommon)
3. **GID** — `5000`
4. **Members** — comma-separated list of supplementary members

Every user has a primary group (the GID in `/etc/passwd`) and can belong to multiple supplementary groups. When a user creates a file, the file's group is set to the user's primary group by default.

## Creating and Managing Users

### useradd

`useradd` is the low-level command for creating users. Most distributions provide `adduser` as a friendlier wrapper, but `useradd` gives you full control:

```bash
sudo useradd -m -s /bin/bash -G sudo,docker deploy
```

This creates a user named `deploy` with:
- `-m` — create a home directory at `/home/deploy`
- `-s /bin/bash` — set the login shell to bash
- `-G sudo,docker` — add to the `sudo` and `docker` groups as supplementary groups

Without `-m`, no home directory is created. Without `-s`, the default shell is `/bin/sh`, which is less interactive. Without `-G`, the user only belongs to their primary group (a new group with the same name as the user, by default on Debian/Ubuntu).

Set a password immediately:

```bash
sudo passwd deploy
```
```
New password: 
Retype new password: 
passwd: password updated successfully
```

On systems using `unattended-upgrades` or cloud-init, you may need to unlock the account:

```bash
sudo passwd -u deploy
```

### usermod

`usermod` modifies existing users:

```bash
sudo usermod -aG docker alice      # Add alice to docker group (-a = append)
sudo usermod -s /sbin/nologin oldsvc  # Prevent oldsvc from logging in
sudo usermod -L deploy             # Lock the deploy account
sudo usermod -U deploy             # Unlock the deploy account
```

The `-a` flag with `-G` is critical. Without `-a`, `usermod -G docker alice` replaces all of alice's supplementary groups with just `docker`. With `-aG`, it appends.

### userdel

```bash
sudo userdel deploy                # Remove user, leave home directory
sudo userdel -r deploy             # Remove user and home directory
```

Removing a user without `-r` leaves their home directory and files behind. These orphaned files are owned by a UID that no longer maps to a username, which can cause confusion. If you want to preserve the files, consider renaming the directory or archiving it.

## Creating and Managing Groups

```bash
sudo groupadd developers           # Create a new group
sudo groupmod -n newname oldname   # Rename a group
sudo groupdel developers           # Delete a group
```

The `-n` flag on `groupmod` renames a group without changing its GID. This preserves all file ownership mappings.

Check group membership:

```bash
groups alice
```
```
alice : alice developers sudo docker
```

Or:

```bash
id alice
```
```
uid=1001(alice) gid=1001(alice) groups=1001(alice),5000(developers),27(sudo),999(docker)
```

`id` is the more complete command because it shows both UID and GID along with all group memberships.

## Basic Permissions: chmod

Every file and directory has three sets of permissions: owner, group, and other. Each set can grant read (r), write (w), and execute (x) permissions.

### Symbolic Mode

```bash
chmod u+x script.sh                 # Add execute for owner
chmod g+w output.log                # Add write for group
chmod o-rwx secret.key              # Remove all permissions for others
chmod a+r readme.md                 # Add read for everyone
```

### Numeric (Octal) Mode

Each permission has a numeric value: r=4, w=2, x=1. Three digits represent owner, group, and other:

```bash
chmod 755 script.sh                 # rwxr-xr-x (owner: full, group/others: read+execute)
chmod 644 config.yml                # rw-r--r-- (owner: read+write, group/others: read)
chmod 700 private.key               # rwx------ (owner: full, no access for anyone else)
chmod 600 id_rsa                    # rw------- (owner: read+write, no execute)
chmod 660 shared.log                # rw-rw---- (owner+group: read+write)
```

The most common permissions you will use:

- `755` for executables and directories that everyone can traverse
- `644` for regular files that everyone can read but only the owner can modify
- `700` for private directories (SSH keys, personal data)
- `600` for private files (SSH keys, credentials)
- `777` — almost never correct. If you find yourself setting this, something is wrong with your permission model.

### Recursive chmod

```bash
chmod -R 755 /var/www/html/         # Apply to all files and directories
```

Be careful with recursive chmod on mixed file sets. Setting everything to `755` makes all files executable. A more precise approach:

```bash
find /var/www/html -type d -exec chmod 755 {} +
find /var/www/html -type f -exec chmod 644 {} +
```

This sets directories to `755` and files to `644`, which is usually what you want.

## Ownership: chown and chgrp

### chown

`chown` changes the owner and optionally the group of a file:

```bash
sudo chown deploy:deploy /opt/app              # Owner and group
sudo chown -R www-data:www-data /var/www/html  # Recursive
sudo chown :developers /opt/shared/            # Group only (the colon is optional on most systems)
sudo chown deploy /opt/app/deploy.sh           # Owner only
```

The recursive flag `-R` is the most common way to change ownership of an entire directory tree.

### chgrp

`chgrp` changes only the group:

```bash
sudo chgrp developers /opt/shared/
sudo chgrp -R developers /opt/shared/          # Recursive
```

`chgrp` is simpler when you only need to change the group, but `chown` with its colon syntax can do the same thing.

## Special Permission Bits

### SUID (Set User ID)

When the SUID bit is set on an executable, it runs with the privileges of the file's owner, not the user who executed it. The classic example is `passwd`:

```bash
ls -la /usr/bin/passwd
```
```
-rwsr-xr-x 1 root root 68208 Jan  5 10:30 /usr/bin/passwd
```

The `s` in the owner execute position (`rws`) means `passwd` runs as root. This is why a regular user can change their own password — the program runs with root privileges to write to `/etc/shadow`.

To set SUID:

```bash
chmod u+s /usr/local/bin/myprogram
# or equivalently
chmod 4755 /usr/local/bin/myprogram
```

SUID is a security-sensitive permission. Any SUID binary running as root is a potential privilege escalation vector. Audit SUID binaries regularly:

```bash
find / -perm -4000 -type f 2>/dev/null
```

### SGID (Set Group ID)

SGID on a directory means new files created inside it inherit the directory's group, rather than the creating user's primary group. This is essential for shared directories:

```bash
sudo chmod g+s /opt/shared/
ls -la /opt/
```
```
drwxrwsr-x 2 deploy developers 4096 Jan 15 10:30 shared
```

The `s` in the group execute position indicates SGID is set.

SGID on an executable means it runs with the group privileges of the file's owner.

### Sticky Bit

The sticky bit on a directory means only the file owner (and root) can delete files inside it, even if the directory is world-writable. The canonical example is `/tmp`:

```bash
ls -ld /tmp
```
```
drwxrwxrwt 12 root root 4096 Feb 12 10:00 /tmp
```

The `t` in the other execute position is the sticky bit. Without it, any user could delete any other user's files in `/tmp`.

To set the sticky bit:

```bash
chmod +t /opt/shared/
# or
chmod 1777 /opt/shared/
```

## ACLs: Fine-Grained Access Control

Standard Unix permissions (owner/group/other) are sometimes too coarse. Access Control Lists (ACLs) let you grant permissions to specific users or groups without changing ownership.

### getfacl — Reading ACLs

```bash
getfacl /opt/shared/report.pdf
```
```
# file: opt/shared/report.pdf
# owner: alice
# group: developers
user::rw-
user:bob:r--
group::rw-
mask::rwx
other::r--
```

This shows that bob has read access to alice's file, even though bob is not the owner and the standard group permissions do not explicitly mention bob.

### setfacl — Setting ACLs

```bash
# Give bob read access
setfacl -m u:bob:r /opt/shared/report.pdf

# Give the finance group full access
setfacl -m g:finance:rwx /opt/shared/finance/

# Grant default ACL (applies to new files created in the directory)
setfacl -d -m g:developers:rwx /opt/shared/

# Remove an ACL entry
setfacl -x u:bob /opt/shared/report.pdf

# Remove all ACLs
setfacl -b /opt/shared/report.pdf
```

When ACLs are applied, the `ls -l` output shows a `+` sign:

```bash
ls -la /opt/shared/
```
```
-rw-rw-r--+ 1 alice developers 45672 Jan 15 10:30 report.pdf
```

The `+` after the permission bits indicates that an ACL is in effect. Use `getfacl` to see the details.

### Why ACLs Matter

Consider a shared project directory for 50 developers. Some developers are on the backend team, some on frontend, some on DevOps. You want:

- Everyone can read the README and shared docs
- Backend team can read and write backend code
- Frontend team can read and write frontend code
- DevOps can read everything and write to CI/CD configs
- The security team can read everything but not write

Without ACLs, you would need to create a separate group for each combination of access, which becomes unmanageable. With ACLs:

```bash
setfacl -d -m g:backend:rwx /opt/project/backend/
setfacl -d -m g:frontend:rwx /opt/project/frontend/
setfacl -d -m g:devops:rwx /opt/project/
setfacl -m g:security:rx /opt/project/
```

The `-d` flag sets default ACLs, which are inherited by new files and subdirectories.

## Understanding Permission Numbers

The numeric permission system can be confusing at first. Here is a complete reference:

| Octal | Binary | Permissions | Meaning |
|-------|--------|-------------|---------|
| 0 | 000 | --- | No access |
| 1 | 001 | --x | Execute only |
| 2 | 010 | -w- | Write only |
| 3 | 011 | -wx | Write and execute |
| 4 | 100 | r-- | Read only |
| 5 | 101 | r-x | Read and execute |
| 6 | 110 | rw- | Read and write |
| 7 | 111 | rwx | Full access |

So `chmod 755` means: owner gets 7 (rwx), group gets 5 (r-x), others get 5 (r-x). This is the standard for executables and directories.

`chmod 644` means: owner gets 6 (rw-), group gets 4 (r--), others get 4 (r--). This is the standard for regular files.

When you see a permission like `rwsr-xr-x` (with `s` instead of `x` in the owner position), that is SUID. When you see `rwxr-xr-t` (with `t` instead of `x` in the others position), that is the sticky bit.

### Permission Masks and umask

When you create a file, the permissions are determined by the file creation mode minus the umask:

```bash
# Default file creation mode is 666 (rw-rw-rw-)
# Default directory creation mode is 777 (rwxrwxrwx)
# umask 022 subtracts from these

# Files:  666 - 022 = 644 (rw-r--r--)
# Dirs:   777 - 022 = 755 (rwxr-xr-x)

# With umask 027:
# Files:  666 - 027 = 640 (rw-r-----)
# Dirs:   777 - 027 = 750 (rwxr-x---)
```

## The Real Scenario: Setting Up a Shared Directory for 50 Developers

Here is the problem statement: you have 50 developers across four teams (backend, frontend, mobile, DevOps). They need a shared directory at `/opt/project` where:

- Everyone can read all files
- Each team can only write to their own subdirectory
- No one can delete another team's files
- New files automatically inherit the correct group
- A few senior architects need write access across all directories

Here is the implementation:

**Step 1: Create groups.**

```bash
sudo groupadd backend
sudo groupadd frontend
sudo groupadd mobile
sudo groupadd devops
sudo groupadd architects
```

**Step 2: Add users to groups.**

```bash
sudo usermod -aG backend alice bob charlie
sudo usermod -aG frontend diana eve frank
sudo usermod -aG mobile grace henry
sudo usermod -aG devops irene jack
sudo usermod -aG architects kate leo
```

Do this for all 50 users. In practice, you would script this from a CSV or LDAP export.

**Step 3: Create the directory structure.**

```bash
sudo mkdir -p /opt/project/{backend,frontend,mobile,devops,shared}
```

**Step 4: Set ownership and permissions.**

```bash
sudo chown -R root:root /opt/project
sudo chmod -R 775 /opt/project
```

**Step 5: Set SGID on all directories so new files inherit the parent group.**

```bash
sudo find /opt/project -type d -exec chmod g+s {} +
```

**Step 6: Set default ACLs for team directories.**

```bash
# Backend team owns their directory
sudo setfacl -R -m g:backend:rwx /opt/project/backend/
sudo setfacl -R -d -m g:backend:rwx /opt/project/backend/

# Frontend team owns their directory
sudo setfacl -R -m g:frontend:rwx /opt/project/frontend/
sudo setfacl -R -d -m g:frontend:rwx /opt/project/frontend/

# Mobile team owns their directory
sudo setfacl -R -m g:mobile:rwx /opt/project/mobile/
sudo setfacl -R -d -m g:mobile:rwx /opt/project/mobile/

# DevOps team owns their directory
sudo setfacl -R -m g:devops:rwx /opt/project/devops/
sudo setfacl -R -d -m g:devops:rwx /opt/project/devops/

# Everyone can read everything
sudo setfacl -R -m g:backend:rx /opt/project/frontend/
sudo setfacl -R -m g:backend:rx /opt/project/mobile/
sudo setfacl -R -m g:backend:rx /opt/project/devops/
sudo setfacl -R -m g:frontend:rx /opt/project/backend/
sudo setfacl -R -m g:frontend:rx /opt/project/mobile/
sudo setfacl -R -m g:frontend:rx /opt/project/devops/
sudo setfacl -R -m g:mobile:rx /opt/project/backend/
sudo setfacl -R -m g:mobile:rx /opt/project/frontend/
sudo setfacl -R -m g:mobile:rx /opt/project/devops/
sudo setfacl -R -m g:devops:rx /opt/project/backend/
sudo setfacl -R -m g:devops:rx /opt/project/frontend/
sudo setfacl -R -m g:devops:rx /opt/project/mobile/
```

**Step 7: Grant architects full access everywhere.**

```bash
sudo setfacl -R -m g:architects:rwx /opt/project/
sudo setfacl -R -d -m g:architects:rwx /opt/project/
```

**Step 8: Prevent deletion of other teams' files with the sticky bit.**

```bash
sudo chmod +t /opt/project/backend/
sudo chmod +t /opt/project/frontend/
sudo chmod +t /opt/project/mobile/
sudo chmod +t /opt/project/devops/
```

**Step 9: Verify.**

```bash
getfacl /opt/project/backend/
```

```
# file: opt/project/backend/
# owner: root
# group: root
user::rwx
user:backend:rwx
user:architects:rwx
group::rwx
group:backend:rwx
group:architects:rwx
mask::rwx
other::rwx
default:user::rwx
default:user:backend:rwx
default:user:architects:rwx
default:group::rwx
default:group:backend:rwx
default:group:architects:rwx
default:mask::rwx
default:other::rwx
```

**Step 10: Test with actual users.**

```bash
# As alice (backend), create a file
su - alice -c "echo 'backend code' > /opt/project/backend/app.py"

# As diana (frontend), try to write to backend
su - diana -c "echo 'hack' > /opt/project/backend/app.py"  # Should fail

# As diana, create a file in frontend
su - diana -c "echo 'frontend code' > /opt/project/frontend/index.html"

# As alice, read frontend
su - alice -c "cat /opt/project/frontend/index.html"  # Should succeed

# As alice, write to frontend
su - alice -c "echo 'nope' > /opt/project/frontend/index.html"  # Should fail
```

## Password Policies

Linux provides tools to enforce password quality and aging policies.

### Installing Password Quality

```bash
# Debian/Ubuntu
sudo apt install libpam-pwquality

# RHEL/CentOS (usually pre-installed)
sudo dnf install pam_pwquality
```

### Configuring Password Rules

```bash
# /etc/security/pwquality.conf
minlen = 14
dcredit = -1
ucredit = -1
lcredit = -1
ocredit = -1
maxrepeat = 3
dictcheck = 1
```

The credit values:
- `-1` means at least one character of that type is required
- `1` means one character of that type is allowed (not required)

So `dcredit = -1` requires at least one digit. `ucredit = -1` requires at least one uppercase letter.

### Password Aging

```bash
# Set maximum password age to 90 days
sudo chage -M 90 admin

# Set warning period to 14 days
sudo chage -W 14 admin

# Force password change on next login
sudo chage -d 0 admin

# View password aging info
sudo chage -l admin
```

### Account Locking

```bash
# Lock an account (disable password login)
sudo passwd -l admin
# or
sudo usermod -L admin

# Unlock an account
sudo passwd -u admin
# or
sudo usermod -U admin

# Auto-lock inactive accounts after 30 days
sudo useradd -f 30 -M newuser
```

## Common Mistakes

**Using chmod 777 as a quick fix:**

```bash
# This is almost never the right answer
chmod -R 777 /var/www/
```

If a permission problem requires `777`, you do not understand the permission model. Figure out which user the process runs as and grant only the necessary permissions.

**Forgetting the -a flag with usermod -G:**

```bash
# WRONG — removes alice from all other groups
sudo usermod -G docker alice

# CORRECT — appends to existing groups
sudo usermod -aG docker alice
```

**Not understanding the sticky bit:**

Without the sticky bit on a shared directory, any user with write access can delete any file. This is one of the most common security oversights on multi-user systems.

**Confusing chown and chmod:**

`chown` changes who owns the file. `chmod` changes what the owner/group/others can do. They solve different problems.

## Assessment

**Lab: Users, Groups, and Permissions (40 minutes)**

Scenario: You are setting up a shared development environment for a team. The server has three existing users: `alice`, `bob`, and `charlie`. You need to configure users, groups, and permissions so that:

- A new user `deploy` is created for CI/CD operations
- A group `developers` is created and all four users are added to it
- A shared directory `/opt/shared` allows all developers to read and write
- A subdirectory `/opt/shared/confidential` is accessible only to `alice` and `bob`
- A web directory `/var/www/app` is owned by `www-data:developers` with correct permissions

**Tasks:**

1. Create the `deploy` user with a bash home directory, bash shell, and membership in the `sudo` group. Set the password to `deploy123` (for lab use only).
2. Create the `developers` group and add all four users to it.
3. Create `/opt/shared` and set its permissions so that the `developers` group owns it and all members can read, write, and execute. New files must inherit the `developers` group.
4. Create `/opt/shared/confidential` inside the shared directory. Set permissions so that only `alice` and `bob` (plus root) can access it.
5. Create `/var/www/app` and set ownership to `www-data:developers` with permissions `775` for directories and `664` for files.
6. As `deploy`, create a test file in `/opt/shared` and verify its group is `developers`.
7. As `bob`, create a file in `/opt/shared/confidential`. Verify that `charlie` cannot read it.
8. Set an ACL on `/opt/shared` granting `charlie` read-only access to a specific file created by `alice`.
9. List all SUID binaries on the system.
10. Verify all configurations with `getfacl` and `ls -la` commands, capturing output.

**Grading Criteria:**

- deploy user created correctly (home, shell, groups): 10 points
- developers group created with all members: 10 points
- /opt/shared permissions and SGID: 15 points
- /opt/shared/confidential permissions: 15 points
- /var/www/app ownership and permissions: 10 points
- deploy test file has correct group: 5 points
- charlie cannot access confidential directory: 10 points
- ACL granting charlie read access to specific file: 10 points
- SUID binaries listed: 5 points
- Clean verification output captured: 10 points

**Total: 100 points. Pass threshold: 70 points.**

## Evidence

After completing this lab, you should have:

- Confirmed that `deploy` can log in and write to `/opt/shared` with correct group ownership.
- Confirmed that `charlie` is denied access to `/opt/shared/confidential`.
- Confirmed that an ACL correctly grants selective access to a single file.
- A complete set of `getfacl` and `ls -la` output showing the final permission state.
- Understanding of how to use groups, sticky bits, SGID, and ACLs together to create a secure shared environment.
