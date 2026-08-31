# Module 3 — User Administration at Scale

Managing ten users is easy. Managing 500 users across dozens of servers, with different access levels, group memberships, and authentication backends, that is where things get interesting. This module covers local user management, PAM authentication, LDAP and Active Directory integration, centralized sudo configuration, and the practical patterns for handling user administration in environments with more than a handful of machines. You will learn to set up centralized authentication so that a single user account works on every server in your fleet.

## The Local User Database

Linux stores user information in flat files. Understanding these files is fundamental because even when you use LDAP or Active Directory, the local files still exist and serve as the fallback authentication source. If the centralized directory is unreachable, the system falls back to local authentication for accounts that exist in `/etc/passwd`.

### /etc/passwd

Each line represents one user with seven colon-separated fields. The first field is the login name, which is the string users type at the login prompt. The second field is the password field — it shows `x` when the password hash is stored in `/etc/shadow`, or it may be empty for accounts with no password (which should never exist on a production system). The third field is the user ID number where 0 is root, 1-999 are reserved for system accounts, and 1000+ are regular user accounts. The fourth field is the primary group ID which should match a GID in `/etc/group`. The fifth field is the GECOS field containing the full name, office number, extension, and home phone — most systems only use the full name. The sixth field is the home directory path. The seventh field is the login shell.

The shell field is important for service accounts. Set it to `/sbin/nologin` or `/bin/false` to prevent interactive login for accounts like `nginx` or `postgresql` that should never be used for SSH. When a user's shell is set to nologin, they can still own files and run services but cannot get an interactive shell.

### /etc/shadow

Contains password hashes and aging information. The format includes the algorithm identifier (6 = SHA-512, 5 = SHA-256, 1 = MD5), the salt, and the hash itself. Additional fields track days since the epoch of the last password change, minimum and maximum days between changes, warning days before expiration, inactive days after expiration before the account is disabled, the expiration date as days since the epoch, and reserved fields.

You rarely edit this file directly. Use `chage` for password aging operations like setting maximum password age with `-M`, minimum days between changes with `-m`, warning periods with `-W`, and account expiration dates with `-E`. Use `chage -l` to list all aging information for a user.

### /etc/group

Group definitions with four fields: group name, password field (usually `x`), GID, and a comma-separated member list. Use `getent` to query any of these databases. The `getent` command works with local files, LDAP, and SSSD, making it the reliable way to check user and group information regardless of the authentication backend.

### /etc/gshadow

Secure group information including the encrypted group password, group administrators who can add/remove members, and the member list. Group passwords are rarely used on modern systems — use sudo instead for privilege escalation.

## User Management Commands

### Creating Users

The `useradd` command creates new users. Key flags include `-m` to create the home directory, `-d` to specify the home path, `-s` for the login shell, `-G` for supplementary groups, and `-c` for the GECOS comment field. For a locked service account, use `-r` for system user, `-s /sbin/nologin` for no login shell, `-M` to skip home directory creation, and a non-existent home path.

The default values come from `/etc/default/useradd` and `/etc/login.defs`. Review and customize these files for your environment. Key settings in `/etc/default/useradd` include `GROUP` for the default GID for new users, `HOME` for the base home directory path, `INACTIVE` for password inactivity period, `EXPIRE` for account expiration date, and `SHELL` for the default shell.

### Modifying Users

The `usermod` command changes user properties. Use `-aG` to add a user to a group without removing existing groups. The `-a` flag is critical because without it, `usermod -G` replaces all supplementary groups with only the specified one. With `-a` it appends while keeping existing groups. You can also change home directories with `-d` and `-m`, lock and unlock accounts with `-L` and `-U`, change login shells, and set account expiration dates with `-e`.

### Deleting Users

Before deleting, check for running processes with `pgrep -u` and `lsof -u`. Kill processes or warn the user before removal. For shared accounts (never recommended, but they exist), check `/var/spool/mail/`, cron jobs, and any files owned by the user before removing them. The `userdel` command with `-r` removes the home directory and mail spool.

### Setting Passwords

Use `passwd` for interactive password setting and `echo` with `chpasswd` for batch operations in scripts. For batch password generation, use `openssl rand` to create random passwords and pipe them through `chpasswd`. The `-e` flag forces the user to change their password on first login.

## PAM: Pluggable Authentication Modules

PAM is the framework that handles authentication, authorization, session management, and password quality for virtually every service on the system. When you SSH into a server, PAM orchestrates the authentication chain by reading configuration files from `/etc/pam.d/` and processing modules in order.

### PAM Stacks

Each PAM configuration file has four types of directives. **Auth** modules verify the user is who they claim to be using passwords, keys, or tokens. **Account** modules verify the account is valid, not expired, not locked, and allowed access at this time. **Password** modules handle password changes. **Session** modules set up and tear down sessions including mounting home directories and logging access.

### Module Flags

**Required** means the module must succeed but processing continues so the user does not know which specific module failed. **Requisite** means it must succeed and fails immediately if not. **Sufficient** means if it succeeds and no prior required module failed, remaining modules are skipped. **Optional** means success or failure does not matter unless it is the only module.

### Password Quality

Enforce strong passwords with `pam_pwquality`. Configure in `/etc/security/pwquality.conf` with settings for minimum length (`minlen`), digit count (`dcredit`), uppercase count (`ucredit`), lowercase count (`lcredit`), special character count (`ocredit`), maximum consecutive identical characters (`maxrepeat`), and whether to disallow parts of the username in the password (`gecoscheck`).

### Account Locking with pam_faillock

After too many failed login attempts, `pam_faillock` locks the account for a configurable period. Configure it in the PAM stack with `deny` and `unlock_time` parameters. Check lock status with `faillock --user` and reset locks with `faillock --user --reset`. The `faillock` command provides a clean interface for managing account locks without directly editing PAM configuration.

### Two-Factor Authentication with PAM

Google Authenticator or TOTP-based 2FA can be added to PAM by installing the `google-authenticator` package, running the per-user setup command, and adding the `pam_google_authenticator` module to the appropriate PAM configuration file. SSH must be configured to use keyboard-interactive authentication for 2FA to work. This means setting `ChallengeResponseAuthentication yes` in `/etc/ssh/sshd_config` and ensuring the PAM stack includes the authenticator module.

### Limiting Access with pam_access

The `pam_access` module controls who can log in from where by reading `/etc/security/access.conf`. You can allow specific users from specific networks, allow admin groups from anywhere, and deny everyone else. This is useful for restricting SSH access to known IP ranges. The syntax uses `+` for allow, `-` for deny, followed by the user or group, followed by the source.

## LDAP and Active Directory Integration

When you have more than a few servers, managing users locally on each one becomes unmanageable. LDAP or Active Directory which speaks LDAP centralizes user accounts so they are managed in one place.

### Why Centralized Authentication

A single user database for all servers means consistent SSH access across the fleet, centralized group-based access control, users added once and available everywhere, and users removed once and revoked everywhere. This eliminates the security risk of forgotten accounts on servers that were decommissioned.

### SSSD: The Modern Approach

SSSD (System Security Services Daemon) is the standard way to integrate Linux with LDAP or Active Directory. It caches credentials locally so users can still log in if the directory server is unreachable. Install the `sssd` and `sssd-ldap` packages along with realm tools for AD integration.

### Joining an AD Domain

Use `realm discover` to find the domain, `realm join` with domain admin credentials to join, and `realm list` to verify. This creates `/etc/sssd/sssd.conf` with the domain configuration. SSSD handles authentication, user enumeration, and group resolution automatically. The join process configures the machine account in AD and sets up the keytab for Kerberos authentication.

### Manual LDAP Configuration

For non-AD LDAP servers like OpenLDAP or 389-DS, configure `/etc/sssd/sssd.conf` with `id_provider`, `auth_provider`, `sudo_provider`, the LDAP URI, search base, TLS settings, and caching options. Set permissions to 600 on the config file and enable SSSD. Configure `/etc/nsswitch.conf` to include `sss` for passwd, group, shadow, and sudoers lookups. The order in nsswitch.conf matters — `files sss` means check local files first, then SSSD.

### LDAP Sudo Rules

Store sudo rules in LDAP so they apply consistently across all servers. Create `sudoRole` entries with the `sudoUser`, `sudoHost`, `sudoCommand`, and `sudoOption` attributes. This eliminates the need to maintain `/etc/sudoers` files on every server.

## Sudoers Configuration

The `/etc/sudoers` file controls who can run what as root. Never edit it with a regular editor. Always use `visudo` which validates syntax before saving. For organized rule management, create files in `/etc/sudoers.d/` with `visudo -f`.

### Rules

Rules follow the pattern of user or group, host specification, command specification, and options. You can grant full root access to a group, allow specific users to run anything without a password, restrict specific users to specific commands with arguments, and limit rules to specific hosts for multi-server environments.

### Sudoers Defaults

Configure defaults in `/etc/sudoers` for `timestamp_timeout` to require password re-entry, `logfile` to capture sudo commands, `requiretty` to force a terminal, `secure_path` to limit the PATH during sudo, and `lecture` settings. For groups that should never need a password, set the `NOPASSWD` option. The `secure_path` is important for security — it prevents users from running arbitrary commands through sudo by controlling which directories are searched.

### Sudo Logging

Configure sudo to log to a file and capture I/O logs for security auditing. The I/O log captures every keystroke during a sudo session. Monitor sudo usage by searching `auth.log` or `secure` for sudo entries. Set up log rotation for sudo logs to prevent them from growing unbounded.

## Centralized Authentication Scenario

Real scenario: a company with 30 servers needs centralized user management. Users are currently managed locally on each server with different passwords. You need to consolidate everything.

### Step 1: Deploy LDAP Server

Set up an OpenLDAP or 389-DS instance using Docker for testing or a dedicated server for production. For production, use a replicated LDAP setup with at least two servers for high availability.

### Step 2: Populate LDAP with Users

Create organizational units for Users and Groups, add user entries with `posixAccount` and `shadowAccount` object classes, and create group entries with `posixGroup` object classes and `memberUid` attributes. Use LDIF files for bulk operations.

### Step 3: Configure SSSD on Each Server

Install SSSD, configure `/etc/sssd/sssd.conf` with the LDAP provider, enable SSSD, and configure `/etc/nsswitch.conf` to use SSS for name resolution. Test with `getent passwd` to verify LDAP users appear.

### Step 4: Set Up SSH Key Distribution

Store public keys in LDAP using the `sshPublicKey` attribute and configure sshd to read authorized keys from SSSD using the `AuthorizedKeysCommand` directive pointing to `sss_ssh_authorizedkeys`.

### Step 5: Deploy Sudo Rules via LDAP

Create LDAP sudo rules so admin access is consistent across servers. Use `sudoRole` entries with `sudoUser` referencing group names, `sudoHost` set to ALL, and `sudoCommand` listing allowed commands.

### Step 6: Testing and Rollout

Test on a single non-production server first, verify `getent` returns LDAP users, verify SSH login works, verify sudo rules apply, then roll out to remaining servers using a phased approach.

### Step 7: Cleanup

After centralized auth is working, remove local user accounts that are now in LDAP, remove local SSH keys, and remove local sudo rules. Keep a local emergency account in `/etc/passwd` for LDAP server failure scenarios.

## Emergency Access

Always maintain a local fallback account. If LDAP goes down and you have no local accounts, you are locked out of every server. Create an emergency account on every server with full sudo access and store the credentials in a sealed envelope or a secure password manager accessible without network connectivity.

## Practical Assessment

**Lab Task:** User management and centralized auth setup (60 minutes)

1. Create 5 user accounts with different shells and group memberships
2. Configure password quality requirements using PAM
3. Set up account lockout after 3 failed attempts
4. Configure sudoers rules for group-based access
5. Set up SSSD with a local LDAP server
6. Verify LDAP users can authenticate via SSH
7. Store SSH public keys in LDAP and configure sshd to read them
8. Create LDAP sudo rules and verify they apply
9. Set up a local emergency account
10. Document the complete setup in a runbook

**Grading criteria:** Correct user creation with proper shells and groups (10 points), PAM password quality enforcement working (15 points), account lockout functioning correctly (10 points), sudoers rules organized in /etc/sudoers.d/ (15 points), SSSD successfully authenticating against LDAP (20 points), SSH key distribution via LDAP working (15 points), emergency access account present and functional (5 points), complete runbook documentation (10 points).

## User Account Lifecycle Management

### Onboarding Process

When a new employee joins, create their account with a standardized script that: creates the user with the correct shell and home directory, adds them to appropriate groups, sets up their SSH key, configures their sudo access, sets password expiration policies, and logs the creation in an audit trail. Use Ansible or a custom script for consistency.

### Offboarding Process

When an employee leaves, immediately: lock the account with `usermod -L`, disable SSH access, remove SSH keys, check for running processes and cron jobs, archive their home directory, and remove the account after the retention period. The critical step is immediate account lockout — not removal — to preserve forensic evidence.

### Group-Based Access Control

Design groups by function rather than by individual. Create groups like `developers`, `ops`, `dba`, `audit`. Assign permissions to groups, then add users to groups. When a user changes roles, change their group membership rather than modifying individual permissions. This scales better and reduces errors.

### Audit Trail

Log all user management operations. Use `auditd` to track: user creation/deletion, group changes, password changes, SSH key additions, and sudo usage. Review audit logs monthly for unauthorized changes. Forward audit logs to a central server for retention and analysis.

## Practical Assessment

**Lab Task:** User management and centralized auth setup (60 minutes)

1. Create 5 user accounts with different shells and group memberships
2. Configure password quality requirements using PAM
3. Set up account lockout after 3 failed attempts
4. Configure sudoers rules for group-based access
5. Set up SSSD with a local LDAP server
6. Verify LDAP users can authenticate via SSH
7. Store SSH public keys in LDAP and configure sshd to read them
8. Create LDAP sudo rules and verify they apply
9. Set up a local emergency account
10. Document the complete setup in a runbook

**Grading criteria:** Correct user creation with proper shells and groups (10 points), PAM password quality enforcement working (15 points), account lockout functioning correctly (10 points), sudoers rules organized in /etc/sudoers.d/ (15 points), SSSD successfully authenticating against LDAP (20 points), SSH key distribution via LDAP working (15 points), emergency access account present and functional (5 points), complete runbook documentation (10 points).

## Evidence

Collect the following for your portfolio: output of `getent passwd` showing both local and LDAP users, screenshot of `sudo -l` for different users showing correct rules, SSSD configuration file contents, PAM configuration snippets for password quality and account lockout, sudoers.d file contents, screenshot of successful SSH login with LDAP credentials, and runbook documenting the complete centralized authentication setup.
