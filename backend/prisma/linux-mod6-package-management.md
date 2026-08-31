# Module 6 — Package Management

## Why This Matters

Software does not install itself. Every tool, library, and service you use on a Linux server was installed by a package manager. Understanding how package managers work — how to install, remove, update, and troubleshoot software — is fundamental to maintaining a system.

Different distributions use different package managers. Debian and Ubuntu use APT. RHEL, CentOS, Fedora, and Rocky Linux use YUM or DNF. Both ecosystems have their own tools, conventions, and quirks. This module covers both, because you will encounter both in production. You will also learn how to manage repositories, pin versions, set up local mirrors, and troubleshoot package issues.

## APT: The Debian/Ubuntu Package Manager

APT (Advanced Package Tool) handles the entire lifecycle of software packages on Debian-based systems. It manages dependencies automatically, resolves conflicts, and keeps track of what is installed, what is available, and what needs updating.

### Installing Software

```bash
sudo apt update                         # Refresh package lists from repositories
sudo apt install nginx                  # Install a package
sudo apt install nginx=1.18.0-0ubuntu1  # Install a specific version
sudo apt install -y nginx               # Install without prompting for confirmation
sudo apt install curl wget git htop     # Install multiple packages at once
```

The `apt update` step downloads the latest package lists (not the packages themselves) from all configured repositories. Without it, `apt install` uses cached lists that may be stale and may not know about the latest versions. Always run `update` before `install` or `upgrade`.

When you install a package, APT automatically resolves dependencies. If nginx requires `libpcre3`, `zlib1g`, and `libssl1.1`, APT installs them too:

```bash
sudo apt install nginx -s              # Simulate the install (show what would happen)
```
```
Reading package lists... Done
Building dependency tree... Done
The following additional packages will be installed:
  fonts-liberation libnginx-mod-http-image-filter libnginx-mod-http-xslt-filter
  libnginx-mod-mail libnginx-mod-stream libpcre3 libssl-dev nginx nginx-common
  nginx-core zlib1g
Suggested packages:
  libnginx-mod-http-dav-ext nginx-doc
The following NEW packages will be installed:
  fonts-liberation libnginx-mod-http-image-filter libnginx-mod-http-xslt-filter
  libnginx-mod-mail libnginx-mod-stream libpcre3 libssl-dev nginx nginx-common
  nginx-core zlib1g
0 upgraded, 11 newly installed, 0 to remove and 0 not upgraded.
Need to get 2,345 kB of archives.
After this operation, 7,890 kB of additional disk space will be used.
```

The `-s` flag simulates the installation without making changes. Use it to verify what will happen before committing.

### Removing Software

```bash
sudo apt remove nginx                   # Remove the package (keep config files)
sudo apt purge nginx                    # Remove the package AND config files
sudo apt autoremove                     # Remove packages installed as dependencies that are no longer needed
sudo apt autoremove --purge             # Autoremove with config file cleanup
```

`apt remove` leaves configuration files in place so you can reinstall without losing your settings. This is useful if you plan to reinstall later or want to keep a backup of the configuration.

`apt purge` deletes everything — the binary, the configuration files, and any associated files that were not part of the package. Use this when you want a clean removal.

`autoremove` is essential for keeping a system clean. When you install package A which depends on package B, and then remove package A, package B is often left behind as an "orphaned dependency." `autoremove` identifies and removes these.

```bash
# Show what autoremove would remove
apt autoremove --dry-run
```

### Updating Software

```bash
sudo apt update                         # Update package lists only
sudo apt upgrade                        # Upgrade all upgradable packages
sudo apt full-upgrade                   # Upgrade all, removing packages that conflict
sudo apt dist-upgrade                   # Same as full-upgrade (deprecated alias)
```

The difference between `upgrade` and `full-upgrade` is important:

- `upgrade` will not remove installed packages. If upgrading package A would require removing package B (because of a conflict), `upgrade` keeps the old version of A.
- `full-upgrade` may remove conflicting packages. It resolves dependency changes by removing packages that are no longer compatible.

For most servers, `full-upgrade` is the safer choice because it handles dependency changes correctly. For desktops where you might have complex multimedia or development packages, `upgrade` is more conservative.

```bash
# See what would be upgraded without upgrading
apt list --upgradable
```
```
Listing... Done
nginx/jammy-updates 1.18.0-0ubuntu1.1 amd64 [upgradable from: 1.18.0-0ubuntu1]
openssl/jammy-updates 3.0.2-0ubuntu1.15 amd64 [upgradable from: 3.0.2-0ubuntu1.14]
```

### Searching and Inspecting

```bash
apt search nginx                        # Search for packages by name or description
apt show nginx                          # Show detailed package information
apt list --installed                    # List all installed packages
apt list --upgradable                   # List packages with available updates
apt-cache depends nginx                 # Show package dependencies
apt-cache rdepends nginx                # Show what depends on this package (reverse dependencies)
apt-cache policy nginx                  # Show installed version and available versions
apt-cache stats                         # Show package cache statistics
```

```bash
apt-cache policy nginx
```
```
nginx:
  Installed: (none)
  Candidate: 1.18.0-0ubuntu1
  Version table:
     1.18.0-0ubuntu1 500
        500 http://archive.ubuntu.com/ubuntu jammy-updates/universe amd64 Packages
     1.14.0-0ubuntu1 500
        500 http://archive.ubuntu.com/ubuntu jammy/universe amd64 Packages
```

This output is valuable: it shows that nginx is not installed, version 1.18.0 is the candidate (the version that would be installed), and it comes from the `jammy-updates` repository. The `500` is the priority — higher numbers are preferred.

```bash
apt show nginx
```
```
Package: nginx
Version: 1.18.0-0ubuntu1
Priority: optional
Section: httpd
Maintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>
Installed-Size: 1234 kB
Depends: nginx-core (= 1.18.0-0ubuntu1), nginx-full (= 1.18.0-0ubuntu1)
Recommends: nginx-extras
Suggests: nginx-doc
Homepage: http://nginx.org/
Download-Size: 456 kB
APT-Sources: http://archive.ubuntu.com/ubuntu jammy-updates/universe amd64 Packages
Description: small, powerful, scalable web/proxy server
 nginx [engine x] is an HTTP and reverse proxy server, as well as
 a mail proxy server, written by Igor Sysoev.
```

The `Depends` line shows what nginx requires. The `Recommends` line shows optional packages that enhance functionality. The `Suggests` line shows packages that are helpful but not necessary.

### Downloading Without Installing

```bash
apt download nginx                      # Download the .deb file to current directory
apt-get download nginx                  # Same thing
```

Useful for inspecting a package before installing it, or for installing it on an offline machine. You can examine the contents:

```bash
dpkg -c nginx_1.18.0-0ubuntu1_amd64.deb
```

### Checking Package Integrity

```bash
apt-key list                           # List trusted GPG keys
apt-key fingerprint                    # Show key fingerprints
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys KEY_ID  # Import a key
```

## YUM/DNF: The RHEL/CentOS Package Manager

DNF is the successor to YUM on RHEL 8+, CentOS Stream, Fedora, and Rocky Linux. YUM is still available on RHEL 7 and older CentOS. The commands are nearly identical — DNF is largely a drop-in replacement with better performance and dependency resolution.

### Installing Software

```bash
sudo dnf install nginx                  # Install a package
sudo dnf install nginx-1.22.1-1.el8    # Install a specific version
sudo dnf groupinstall "Development Tools"  # Install a group of packages
sudo dnf install -y nginx               # Install without prompting
sudo dnf install /tmp/package.rpm       # Install a local RPM file
```

DNF groups bundle related packages. The "Development Tools" group includes `gcc`, `make`, `autoconf`, and other build essentials.

```bash
# List available groups
dnf group list

# Show what is in a group
dnf group info "Development Tools"
```

### Removing Software

```bash
sudo dnf remove nginx                   # Remove a package
sudo dnf autoremove                     # Remove unused dependencies
sudo dnf remove --autoremove nginx      # Remove package and its orphaned dependencies
```

### Updating Software

```bash
sudo dnf check-update                   # Check for available updates (returns exit code 100 if updates exist)
sudo dnf upgrade                        # Upgrade all packages
sudo dnf update                         # Same as upgrade
sudo dnf upgrade nginx                  # Upgrade only nginx
```

The `check-update` command is useful in scripts:

```bash
dnf check-update > /dev/null 2>&1
if [ $? -eq 100 ]; then
    echo "Updates available"
fi
```

### Searching and Inspecting

```bash
dnf search nginx                        # Search for packages by name or description
dnf info nginx                          # Show package details
dnf list installed                      # List installed packages
dnf list updates                        # List available updates
dnf provides /usr/bin/vim               # Find which package provides a file
dnf depends nginx                       # Show what nginx requires
dnf repoquery --requires nginx          # Same as depends
dnf repoquery --whatrequires nginx      # Show what depends on nginx
dnf repoquery --list nginx              # List files in the nginx package
dnf repoquery --info nginx              # Show package info
```

```bash
dnf info nginx
```
```
Installed Packages
Name         : nginx
Version      : 1.22.1
Release      : 1.el8
Architecture : x86_64
Size         : 1.8 M
Source       : nginx-1.22.1-1.el8.src.rpm
Repository   : appstream
Summary      : A high performance web server and reverse proxy server
URL          : http://nginx.org/
License      : 2-clause BSD-like license
Description  : nginx [engine x] is an HTTP and reverse proxy server, as well as
             : a mail proxy server, written by Igor Sysoev.
```

### Transaction History

DNF/YUM tracks every transaction. You can review, inspect, and undo changes:

```bash
dnf history
```
```
ID     Command line                                    Date and time       Action(s)      Altered
-----------------------------------------------------------------------------------------------
    42 install nginx                                   2024-01-15 10:30     Install        8
    41 update openssl                                  2024-01-14 08:00     Upgrade        3
    40 install curl                                    2024-01-13 15:45     Install        2
    39 remove oldapp                                   2024-01-12 12:00     Erase          1
    38 update kernel                                   2024-01-11 06:00     Upgrade        1
```

```bash
dnf history info 42                 # Show details of transaction 42
dnf history undo 42                 # Undo transaction 42 (remove nginx and its deps)
dnf history rollback 41             # Roll back everything after transaction 41
```

This is a powerful feature. If an upgrade breaks something, you can roll it back. The `undo` command removes what was installed and reinstalls what was removed.

```bash
dnf history undo 42 --assumeno      # Show what would be undone without doing it
```

## dpkg and rpm: Low-Level Package Tools

APT and YUM/DNF are frontends that handle dependencies, repositories, and version resolution. The underlying tools are `dpkg` (Debian) and `rpm` (Red Hat).

### dpkg

```bash
dpkg -i package.deb                   # Install a local .deb file
dpkg -r package                       # Remove a package (keep config)
dpkg -P package                       # Purge a package (remove config)
dpkg -l                               # List all installed packages
dpkg -l | grep nginx                  # Search installed packages
dpkg -L nginx                         # List files installed by a package
dpkg -S /usr/bin/vim                  # Find which package owns a file
dpkg --configure -a                   # Fix broken configurations
dpkg -s nginx                         # Show package status and info
```

When `dpkg` leaves packages in a broken state (for example, after a failed install or interrupted upgrade):

```bash
sudo dpkg --configure -a              # Reconfigure all unpacked but unconfigured packages
sudo apt --fix-broken install         # Fix broken dependencies
sudo apt install -f                   # Same as --fix-broken install
```

### rpm

```bash
rpm -ivh package.rpm                  # Install a local .rpm file (verbose, hash progress)
rpm -Uvh package.rpm                  # Upgrade an installed package (install if not present)
rpm -Fvh package.rpm                  # Freshen (only upgrade if already installed)
rpm -e package                         # Remove a package
rpm -qa                               # List all installed packages
rpm -qa | grep nginx                  # Search installed packages
rpm -ql nginx                         # List files installed by a package
rpm -qf /usr/bin/vim                  # Find which package owns a file
rpm -qi nginx                         # Show package info
rpm -Va                               # Verify all installed packages (check for modifications)
rpm -K package.rpm                    # Verify the package signature
```

The `-Va` flag is useful for security auditing. It compares installed files against their original checksums and flags any modifications:

```bash
rpm -Va | head -20
```
```
S.5....T.  c /etc/ssh/sshd_config
S.5....T.  c /etc/pam.d/sshd
```

The output shows what changed: `S` means size differs, `5` means MD5 checksum differs, `T` means modification time differs, `c` means it is a configuration file.

## Local Package Installation

Both ecosystems support installing from local files:

```bash
# Debian/Ubuntu
sudo dpkg -i package.deb && sudo apt --fix-broken install

# Or simpler
sudo apt install ./package.deb
```

The `./` prefix tells APT to look in the current directory rather than searching repositories. The `--fix-broken install` step after `dpkg -i` is necessary because the local package may have dependencies that were not resolved during installation.

```bash
# RHEL/CentOS
sudo rpm -ivh package.rpm
# or
sudo dnf localinstall package.rpm
# or (simplest)
sudo dnf install ./package.rpm
```

## Repository Configuration

### Debian/Ubuntu

Repositories are defined in `/etc/apt/sources.list` and files under `/etc/apt/sources.list.d/`:

```bash
cat /etc/apt/sources.list
```
```
deb http://archive.ubuntu.com/ubuntu jammy main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu jammy-updates main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu jammy-security main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu jammy-backports main restricted universe multiverse
```

Each line defines a repository with:
- Protocol (deb)
- URL
- Distribution (jammy)
- Components (main, restricted, universe, multiverse)

Components:
- `main` — officially supported, open-source software
- `restricted` — officially supported, closed-source software (drivers, firmware)
- `community-maintained` — free software, community-supported
- `non-free` — closed-source software, not officially supported

Adding a third-party repository:

```bash
# Add a GPG key
curl -fsSL https://packages.example.com/gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/example.gpg

# Add the repository
echo "deb [signed-by=/usr/share/keyrings/example.gpg] https://packages.example.com/stable jammy main" | sudo tee /etc/apt/sources.list.d/example.list

# Update and install
sudo apt update
sudo apt install example-package
```

The `signed-by` directive tells APT to verify packages using this specific key, not the system-wide keyring. This is more secure because each repository has its own key.

### RHEL/CentOS

Repositories are defined in `/etc/yum.repos.d/`:

```bash
cat /etc/yum.repos.d/CentOS-Stream-AppStream.repo
```
```
[appstream]
name=CentOS Stream 8 - AppStream
baseurl=https://mirror.stream.centos.org/8-stream/AppStream/x86_64/os/
gpgcheck=1
enabled=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-centosofficial
```

Each repo file contains sections in INI format. Key directives:

- `name` — human-readable name
- `baseurl` — URL to the repository
- `gpgcheck` — verify package signatures (always 1 in production)
- `enabled` — whether the repository is active
- `gpgkey` — path to the GPG key for verification

Adding a repository:

```bash
# Create a repo file
sudo tee /etc/yum.repos.d/example.repo <<EOF
[example]
name=Example Repository
baseurl=https://packages.example.com/rpm/stable/x86_64/
enabled=1
gpgcheck=1
gpgkey=https://packages.example.com/gpg.key
EOF

sudo dnf install example-package
```

Or using the `dnf config-manager`:

```bash
sudo dnf config-manager --add-repo https://packages.example.com/example.repo
```

### Priority and Mirrors

On Debian/Ubuntu, you can set repository priorities:

```bash
# /etc/apt/preferences.d/example
Package: *
Pin: origin packages.example.com
Pin-Priority: 900
```

On RHEL/CentOS, you can set the `priority` directive in the repo file:

```ini
[example]
name=Example Repository
baseurl=https://packages.example.com/rpm/stable/x86_64/
enabled=1
gpgcheck=1
priority=10
```

Lower numbers mean higher priority. Default priority is 99.

## Version Pinning and Holding

Sometimes you need to lock a package to a specific version to prevent upgrades from breaking your application. This is common for production servers where a specific version of Node.js, Python, or nginx is required by the application.

### Debian/Ubuntu (apt-mark)

```bash
sudo apt-mark hold nginx               # Prevent nginx from being upgraded
sudo apt-mark unhold nginx             # Allow nginx to be upgraded again
apt-mark showhold                      # Show all held packages
```

```bash
# Hold a specific version
sudo apt-mark hold nginx=1.18.0-0ubuntu1
```

When you run `apt upgrade`, held packages are skipped. You will see a message like:

```
nginx is held back.
```

To upgrade a held package, you must first unhold it, then upgrade, then re-hold:

```bash
sudo apt-mark unhold nginx
sudo apt install nginx=1.20.0-0ubuntu1
sudo apt-mark hold nginx
```

### RHEL/CentOS (versionlock plugin)

```bash
sudo dnf install dnf-plugin-versionlock

sudo dnf versionlock add nginx         # Lock current version
sudo dnf versionlock delete nginx      # Remove the lock
sudo dnf versionlock list              # Show all locked packages
sudo dnf versionlock clear             # Remove all locks
```

### Pinning with Preferences (Debian)

For more granular control, create a preferences file:

```bash
# /etc/apt/preferences.d/nginx
Package: nginx
Pin: version 1.18.0-0ubuntu1
Pin-Priority: 1001
```

Priority values:

| Priority | Meaning |
|----------|---------|
| `> 1000` | Install this version even if it is a downgrade |
| `100-999` | Prefer this version over others |
| `< 100` | Only install this version if no other is available |

```bash
# Prefer packages from a specific repository
Package: *
Pin: origin security.ubuntu.com
Pin-Priority: 900

# Prefer a specific distribution
Package: *
Pin: release a=focal-security
Pin-Priority: 900
```

## Real Scenario: Setting Up a Local Package Mirror

Running `apt update` or `dnf update` across hundreds of servers wastes bandwidth and takes time. A local mirror caches packages on your network, serving updates from a local server. This reduces internet bandwidth usage, speeds up installations, and ensures consistency across your fleet.

### Step 1: Set Up a Mirror Server

On a Debian/Ubuntu system, use `apt-mirror`:

```bash
sudo apt install apt-mirror nginx
```

Edit `/etc/apt/mirror.list`:

```
set base_path /var/spool/apt-mirror
set mirror_path $base_path/mirror
set skel_path $base_path/skel
set var_path $base_path/var
set cleanscript $var_path/clean.sh

deb http://archive.ubuntu.com/ubuntu jammy main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu jammy-updates main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu jammy-security main restricted universe multiverse

deb-i386 http://archive.ubuntu.com/ubuntu jammy main restricted universe multiverse

clean http://archive.ubuntu.com/ubuntu
```

Run the mirror:

```bash
sudo apt-mirror
```

This downloads approximately 100-200GB depending on the components you selected. Plan for disk space. You can monitor progress:

```bash
tail -f /var/spool/apt-mirror/var/log/mirror.log
```

### Step 2: Serve the Mirror with nginx

```bash
sudo tee /etc/nginx/sites-available/mirror <<'EOF'
server {
    listen 80;
    server_name mirror.internal;
    root /var/spool/apt-mirror/mirror;

    location / {
        autoindex on;
    }

    # Cache control
    location ~* \.(deb|gz|xz)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/mirror /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### Step 3: Point Your Servers at the Mirror

On each client server, replace the repository URLs:

```bash
sudo tee /etc/apt/sources.list <<EOF
deb http://mirror.internal/ubuntu jammy main restricted universe multiverse
deb http://mirror.internal/ubuntu jammy-updates main restricted universe multiverse
deb http://mirror.internal/ubuntu jammy-security main restricted universe multiverse
EOF

sudo apt update
```

Now all 100 servers pull packages from your local mirror instead of hitting the internet.

### Step 4: Automate Mirror Updates

Create a cron job to update the mirror daily:

```bash
# /etc/cron.d/apt-mirror
0 3 * * * root /usr/bin/apt-mirror > /var/log/apt-mirror.log 2>&1
```

### Step 5: Set Up a Mirror for RHEL/CentOS

```bash
sudo dnf install yum-utils

# Sync repositories
reposync -p /var/www/html/mirror --repoid=baseos --download-metadata
reposync -p /var/www/html/mirror --repoid=appstream --download-metadata
reposync -p /var/www/html/mirror --repoid=extras --download-metadata
```

Create a cron job:

```bash
# /etc/cron.d/reposync
0 2 * * * root /usr/bin/reposync -p /var/www/html/mirror --repoid=baseos --download-metadata --newest-only > /var/log/reposync.log 2>&1
```

### Step 6: Serve with nginx on RHEL

```bash
sudo tee /etc/nginx/conf.d/mirror.conf <<'EOF'
server {
    listen 80;
    server_name mirror.internal;
    root /var/www/html/mirror;

    location / {
        autoindex on;
    }
}
EOF

sudo systemctl restart nginx
```

### Step 7: Client Configuration for RHEL

```bash
sudo tee /etc/yum.repos.d/local.repo <<EOF
[local-baseos]
name=Local BaseOS
baseurl=http://mirror.internal/centos/baseos/
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-centosofficial
enabled=1

[local-appstream]
name=Local AppStream
baseurl=http://mirror.internal/centos/appstream/
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-centosofficial
enabled=1
EOF

# Disable the default repos to use the local mirror
sudo dnf config-manager --set-enabled local-baseos local-appstream
```

## Common Mistakes

**Forgetting to run apt update before apt install:**

```bash
# This may install an old version or fail entirely
sudo apt install nginx

# Always do this first
sudo apt update
sudo apt install nginx
```

**Using apt-get instead of apt for interactive use:**

`apt-get` is the original command-line interface. `apt` is a newer, user-friendly wrapper that shows progress bars and colored output. For interactive use, `apt` is better. For scripts, `apt-get` is preferred because it does not produce output that interferes with logging.

**Not holding critical packages before upgrades:**

If you are running a production application that depends on a specific version of Node.js, Python, or nginx, hold that package before running a system-wide upgrade:

```bash
sudo apt-mark hold nodejs nginx
sudo apt full-upgrade
sudo apt-mark unhold nodejs nginx
```

**Ignoring security updates:**

```bash
# Check what security updates are available
apt list --upgradable 2>/dev/null | grep -i security
```

Enable automatic security updates on production servers:

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

**Mixing dpkg and apt:**

Do not run `dpkg -i` and `apt install` interchangeably. Use `apt install ./package.deb` instead of `dpkg -i package.deb && apt --fix-broken install`. The APT method handles dependencies automatically.

**Not cleaning the apt cache:**

APT downloads packages to `/var/cache/apt/archives/` before installing them. Over time, this cache grows large:

```bash
# Show cache size
du -sh /var/cache/apt/archives/

# Clean old packages (keeps the latest version of installed packages)
sudo apt clean

# Remove all cached packages
sudo apt clean all

# Autoclean removes only packages that can no longer be downloaded
sudo apt autoclean
```

## Assessment

**Lab: Package Management (25 minutes)**

Scenario: You need to install, configure, and manage software on both a Debian-based and RHEL-based system.

**Tasks:**

1. On a Debian/Ubuntu system, update the package list and install `htop`, `tmux`, and `curl`.
2. Show the details of the `nginx` package (installed or not).
3. Find which package owns the file `/usr/bin/top`.
4. List all installed packages and save the output to `/tmp/installed_packages.txt`.
5. Install a specific version of `nginx` (1.18.0 or the version available in your repository).
6. Hold the `nginx` package to prevent upgrades.
7. Verify that `nginx` is in the held list.
8. Add a third-party repository (for example, the Docker repository for Ubuntu) and install a package from it.
9. Show the APT cache size and clean it.
10. On a RHEL/CentOS system (if available), install `httpd` using `dnf`.
11. Show the transaction history and find the transaction that installed `httpd`.
12. Remove the `httpd` package and verify it was removed.

**Grading Criteria:**

- htop, tmux, curl installed: 10 points
- nginx package details shown: 8 points
- File-to-package mapping found: 7 points
- Installed packages listed and saved: 10 points
- nginx installed at specific version: 12 points
- nginx held successfully: 10 points
- Held package verified: 5 points
- Third-party repository added and used: 18 points
- APT cache cleaned: 5 points
- httpd installed on RHEL (if available): 8 points
- Transaction history found: 4 points
- httpd removed and verified: 3 points

**Total: 100 points. Pass threshold: 70 points.**

## Evidence

After completing this lab, you should have:

- Successfully installed and managed packages on at least one Linux distribution.
- Demonstrated version pinning to prevent unwanted upgrades.
- Added a third-party repository and installed software from it.
- Cleaned the package cache to free disk space.
- On RHEL, demonstrated transaction history and package removal.
- Understanding of the differences between APT and YUM/DNF workflows.
