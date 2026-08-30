# Module 3 — User Administration at Scale


## What You'll Actually Do

You have50 servers. Users come and go. You need to create accounts, manage SSH keys, enforce password policies, handle sudo access, and offboard people cleanly — across all servers, not just one.

## Centralized Identity — LDAP/Active Directory

One user database, all servers authenticate against it.

**SSSD (System Security Services Daemon):**
```bash
apt install sssd sssd-tools libnss-ldap
```

Configure `/etc/sssd/sssd.conf`:
```ini
[sssd]
domains = company.local
services = nss, pam

[domain/company.local]
id_provider = ad
auth_provider = ad
access_provider = ad
ad_domain = company.local
krb5_store_password_if_offline = True
```

Now `id alice` works on every server that uses SSSD. Create user in AD → available everywhere.

## Password Policies

**Enforce via PAM:**
```bash
# /etc/security/pwquality.conf
minlen = 12
dcredit = -1    # at least1 digit
ucredit = -1    # at least1 uppercase
lcredit = -1    # at least1 lowercase
ocredit = -1    # at least1 special
maxrepeat = 3   # no more than3 repeated chars
```

**Password aging:**
```bash
# /etc/login.defs
PASS_MAX_DAYS   90
PASS_MIN_DAYS   7
PASS_WARN_AGE   14
```

**Force password change:**
```bash
chage -M 0 alice   # forces change on next login
chage -l alice     # show policy
```

## SSH Key Management

**Deploy keys to all servers:**
```bash
#!/bin/bash
USERS=("alice" "bob" "charlie")
SERVERS=("web1" "web2" "db1" "db2")

for user in "${USERS[@]}"; do
    for server in "${SERVERS[@]}"; do
        ssh-copy-id -i ~/.ssh/id_ed25519.pub "${user}@${server}"
    done
done
```

**Centralized keys with LDAP:**
Store SSH public keys in LDAP attribute `sshPublicKey`. All servers read from LDAP.

## Sudo Management

**Grant sudo to a group:**
```bash
echo "%devops ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/devops
chmod 440 /etc/sudoers.d/devops
```

**Audit sudo usage:**
```bash
grep sudo /var/log/auth.log | tail -20
```

**Remove sudo access:**
```bash
rm /etc/sudoers.d/devops
```

## Offboarding — When Someone Leaves

```bash
#!/bin/bash
USER=$1

# Lock account
usermod -L $USER

# Set shell to nologin
usermod -s /sbin/nologin $USER

# Remove from all groups
groups $USER | awk '{for(i=2;i<=NF;i++) gpasswd -d '$USER' $i}'

# Kill all sessions
pkill -u $USER

# Archive home directory
tar czf /archive/${USER}_$(date +%Y%m%d).tar.gz /home/$USER

# Remove home directory
userdel -r $USER

echo "Offboarded: $USER"
```

**Do this for every server.** With Ansible, you do it once for all.

## Audit User Activity

```bash
# Last logins
last -20
lastlog

# Currently logged in
who
w

# Process ownership
ps aux | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# Check for orphaned files
find / -nouser -o -nogroup 2>/dev/null
```

## Real Task: Onboard a New Team

```bash
# 1. Create users
for user in alice bob charlie; do
    useradd -m -s /bin/bash -G devops $user
    echo "$user:$(openssl rand -base64 12)" | chpasswd
    chage -M 90 $user
done

# 2. Deploy SSH keys
for user in alice bob charlie; do
    ssh-copy-id -i ~/.ssh/id_ed25519.pub ${user}@server
done

# 3. Configure sudo
echo "%devops ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/devops
chmod 440 /etc/sudoers.d/devops

# 4. Verify
for user in alice bob charlie; do
    echo "=== $user ==="
    id $user
    ssh ${user}@server "sudo whoami"
done
```

## Assessment

**Lab task (20 min):**

1. Create3 users with proper password policies
2. Configure SSH key-based authentication for all3
3. Set up sudo access for a group
4. Write an offboarding script that locks, archives, and removes a user
5. Audit current user sessions and find orphaned files

**Grading:**
- Users created with policies: 20%
- SSH keys deployed: 20%
- Sudo configured: 20%
- Offboarding script works: 25%
- Audit completed: 15%

## Evidence

- **OutcomeEvidence:** `SYS-LO3 — User Administration at Scale`
- **Mastery:** `UserSkill: linux-user-admin`

## Unlock

Module4 — Service Management. You can manage users. Now you learn how to manage complex service stacks.

## Sources

- `man useradd`, `man usermod`, `man userdel`, `man chage`
- `man sudoers`, `man sssd`

