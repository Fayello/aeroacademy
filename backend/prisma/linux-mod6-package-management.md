# Module 6 — Package Management


## What You'll Actually Do

You need to install nginx, but the version in the default repo is old. You add a repo, install the right version, pin it so it doesn't auto-upgrade, and remove the old one. That's package management.

## apt (Debian/Ubuntu)

**Update package list:**
```bash
apt update
```
Downloads the latest package index. Does NOT install anything. Run this first, always.

**Install:**
```bash
apt install nginx
```

**Remove:**
```bash
apt remove nginx          # keep config
apt purge nginx           # remove config too
```

**Upgrade all packages:**
```bash
apt upgrade
```

**Search for a package:**
```bash
apt search mysql
```

**Show package info:**
```bash
apt show nginx
```

**List installed packages:**
```bash
apt list --installed
```

**Clean up:**
```bash
apt autoremove    # remove unused dependencies
apt clean         # clear downloaded package cache
```

## Adding Third-Party Repos

Default repos don't always have what you need. You add a repo.

**Add nginx repo for latest stable:**
```bash
apt install -y curl gnupg2
curl -fsSL https://nginx.org/keys/nginx_signing.key | gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" > /etc/apt/sources.list.d/nginx.list
apt update
apt install nginx
```

**Pin a version (prevent auto-upgrade):**
```bash
apt-mark hold nginx
apt-mark unhold nginx    # release the pin
```

## yum/dnf (RHEL/CentOS/Fedora)

```bash
yum install nginx        # RHEL/CentOS 7
dnf install nginx        # Fedora/RHEL 8+
yum remove nginx
yum update
yum search mysql
yum info nginx
```

Same idea, different commands.

## dpkg — Low-Level Package Operations

dpkg handles individual `.deb` files without the repository system.

**Install a .deb:**
```bash
dpkg -i package.deb
apt install -f    # fix missing dependencies after
```

**List files installed by a package:**
```bash
dpkg -L nginx
```

**Check if a file belongs to a package:**
```bash
dpkg -S /usr/sbin/nginx
# nginx: /usr/sbin/nginx
```

## Real Task: Install and Pin Specific Version

You need nginx1.24, not the default:

```bash
apt update
apt install nginx=1.24.0-1~jammy
apt-mark hold nginx
```

Verify:
```bash
nginx -v
# nginx version: nginx/1.24.0
apt-mark showhold
# nginx
```

Now `apt upgrade` won't touch nginx until you `apt-mark unhold`.

## Failure Scenario: Dependency Hell

You install `package-a` which requires `lib-foo >= 2.0`. You install `package-b` which requires `lib-foo < 2.0`. They conflict.

```bash
apt install package-a package-b
# The following packages have unmet dependencies:
#  package-b : Depends: lib-foo (< 2.0) but 2.1.0 is to be installed
```

**Fix options:**
1. Remove one of the conflicting packages
2. Find a version of `package-b` that works with `lib-foo 2.1`
3. Use containers or isolated environments to avoid the conflict entirely

In production, this is why we use Docker. Different apps, different dependencies, no conflict.

## Assessment

**Lab task (15 min):**

1. Update package lists
2. Install `nginx` and verify it's running
3. Check which version is installed
4. Find all files installed by nginx
5. Remove nginx completely (including config)
6. Verify removal

**Grading:**
- apt update successful: 10%
- nginx installed and running: 25%
- Version checked: 15%
- File list checked: 20%
- Removal complete: 30%

## Evidence

- **OutcomeEvidence:** `LIN-LO6 — Package Management`
- **Mastery:** `UserSkill: linux-package-management`

## Unlock

Module7 — SSH and Remote Administration. You can install software. Now you learn how to secure the front door.

## Sources

- `man apt`, `man dpkg`, `man yum`, `man dnf`
- Debian Wiki — Apt
- Red Hat Wiki — Yum

