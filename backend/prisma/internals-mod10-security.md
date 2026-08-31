# Module 10 — Kernel Security

## Defense in Depth at the Kernel Level

Kernel security is not about a single mechanism — it is about layers. Even if an attacker gains root access through a vulnerable application, kernel security features can prevent them from reading other users' files, loading malicious modules, or modifying the system. This module covers the kernel's security mechanisms: SELinux, AppArmor, seccomp-bpf, kernel lockdown, and Secure Boot.

## SELinux: Mandatory Access Control

SELinux (Security-Enhanced Linux) implements mandatory access control (MAC). In standard Linux (discretionary access control, or DAC), the file owner decides who can access the file. In MAC, the system policy decides — even root cannot override the policy unless explicitly allowed.

### How SELinux Works

SELinux labels every process and every file with a **security context**. When a process tries to access a file, the kernel checks the process's context against the file's context and the system policy. If the policy does not explicitly allow the access, it is denied — even for root.

```bash
# View SELinux context of a process
ps -eZ | grep httpd
# system_u:system_r:httpd_t:s0    1234 ?  00:00:01 httpd

# View SELinux context of a file
ls -Z /var/www/html/index.html
# system_u:object_r:httpd_sys_content_t:s0 /var/www/html/index.html

# View your current context
id -Z
# unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
```

### Security Context Format

The context has four fields:

```
user:role:type:level
```

- **user**: SELinux user mapping (not the same as Linux user)
- **role**: Role-based access control (not heavily used in targeted policy)
- **type**: The most important field — determines access rules
- **level**: MLS/MCS level (used for multi-level security and containers)

### SELinux Modes

```bash
# Check current mode
getenforce
# Enforcing, Permissive, or Disabled

# View detailed status
sestatus
# SELinux status:              enabled
# SELinuxfs mount:             /sys/fs/selinux
# SELinux root directory:      /etc/selinux
# Loaded policy name:          targeted
# Current mode:                enforcing
# Mode from config file:       enforcing
# Policy MLS status:           enabled
# Policy deny_unknown status:  allowed
# Memory protection checking:  actual (secure)

# Change mode temporarily
setenforce 0    # Permissive (logs but does not block)
setenforce 1    # Enforcing

# Change mode permanently (requires reboot)
# Edit /etc/selinux/config
# SELINUX=enforcing
```

**Permissive mode** logs policy violations without enforcing them. This is essential for troubleshooting — you can see what would be denied without breaking anything.

### SELinux Booleans

Booleans are on/off switches for common policy adjustments:

```bash
# List all booleans
getsebool -a | head -20
# httpd_can_network_connect --> off
# httpd_can_network_connect_db --> off
# httpd_enable_homedirs --> off
# httpd_use_nfs --> off

# Allow httpd to connect to the network
setsebool httpd_can_network_connect on

# Make it persistent across reboots
setsebool -P httpd_can_network_connect on

# Allow a specific boolean for a specific context
setsebool -P httpd_can_network_connect_db on
```

Common booleans:

| Boolean | Purpose |
|---------|---------|
| `httpd_can_network_connect` | Allow HTTP server to make outbound connections |
| `httpd_can_network_connect_db` | Allow HTTP server to connect to databases |
| `httpd_enable_homedirs` | Allow HTTP server to access user home directories |
| `ssh_sysadm_login` | Allow SSH login as sysadm role |
| `selinuxuser_execmod` | Allow users to execute modified libraries |
| `container_manage_cgroup` | Allow containers to manage cgroups |

### Fixing SELinux Denials

When a service is blocked by SELinux, the audit log shows the denial:

```bash
# View recent denials
ausearch -m AVC --start recent
# type=AVC msg=audit(1234567890.123:456): avc:  denied  { write } for  
#   pid=1234 comm="httpd" name="config.php" dev="sda2" ino=789012
#   scontext=system_u:system_r:httpd_t:s0
#   tcontext=system_u:object_r:httpd_sys_rw_content_t:s0 
#   tclass=file permissive=0

# Generate a fix with audit2allow
ausearch -m AVC --start recent | audit2allow -M mymodule
# Generates mymodule.te (policy module) and mymodule.pp (compiled module)

# Apply the fix
semodule -i mymodule.pp

# Or use audit2allow for a quick boolean-based fix
ausearch -m AVC --start recent | audit2allow -b
# Suggests: setsebool -P httpd_can_network_connect 1
```

### Container SELinux Labels

Containers use Multi-Category Security (MCS) to isolate containers from each other:

```bash
# Docker containers get unique MCS labels
ps -eZ | grep containerd
# system_u:system_r:container_t:s0:c123,c456  containerd-shim ...

# Container A (c123,c456) cannot access Container B (c789,c012)
# This is enforced by SELinux even if both containers run as root

# View container SELinux policy
sesearch -A -t container_t
# Allow container_t self:capability { chown dac_override fowner ... }
# Allow container_t container_file_t:file { create unlink ... }
# Allow container_t tmp_t:file { create unlink ... }

# Custom SELinux policy for containers
cat > container_custom.te << 'EOF'
policy_module(container_custom, 1.0)

# Allow container_t to access specific host directories
allow container_t custom_data_t:dir { search read open };
allow container_t custom_data_t:file { read open getattr };
EOF
```

### SELinux Troubleshooting Workflow

When a service fails with SELinux, follow this systematic approach:

```bash
# Step 1: Check if the issue is SELinux-related
ausearch -m AVC --start recent --interpret
# If "denied" messages appear, SELinux is blocking the access

# Step 2: Identify the source and target contexts
# Source: The process trying to access
# Target: The file/resource being accessed
# Type: The object class (file, dir, socket, etc.)

# Step 3: Try the quick fix first (boolean)
ausearch -m AVC --start recent | audit2allow -b
# Suggests: setsebool -P <boolean> on

# Step 4: If no boolean works, check for file context issues
ls -Z <target_file>
# If the context is wrong, relabel it
semanage fcontext -a -t <correct_type> "<path>(/.*)?"
restorecon -Rv <path>

# Step 5: If still blocked, create a custom module
ausearch -m AVC --start recent | audit2allow -M myfix
semodule -i myfix.pp

# Step 6: Verify the fix
ausearch -m AVC --start recent  # No new denials
systemctl restart <service>     # Service starts successfully
```

## AppArmor: Profile-Based Access Control

## AppArmor: Profile-Based Access Control

AppArmor is an alternative to SELinux that uses path-based access control. Instead of labeling every file with a security context, AppArmor defines profiles that specify what files a program can access.

### AppArmor Modes

```bash
# Check AppArmor status
aa-status
# apparmor module is loaded.
# 37 profiles are loaded.
# 37 profiles are in enforce mode.
# 0 profiles are in complain mode.

# Profiles in enforce mode block violations
# Profiles in complain mode only log violations
```

### AppArmor Profiles

An AppArmor profile defines what a program can do:

```bash
# /etc/apparmor.d/usr.sbin.nginx
#include <tunables/global>

/usr/sbin/nginx {
    #include <abstractions/base>
    #include <abstractions/nameservice>
    #include <abstractions/openssl>

    # Capabilities
    capability net_bind_service,
    capability setuid,
    capability setgid,

    # Network access
    network inet stream,
    network inet6 stream,

    # File access
    /etc/nginx/** r,
    /var/log/nginx/** w,
    /var/lib/nginx/** rw,
    /var/www/** r,
    /run/nginx.pid rw,
    /tmp/ r,

    # Deny everything else
    deny /etc/shadow r,
    deny /root/** rwx,
}
```

### Managing AppArmor Profiles

```bash
# Put a profile in complain mode (for testing)
aa-complain /usr/sbin/nginx

# Put a profile in enforce mode
aa-enforce /usr/sbin/nginx

# Reload all profiles
apparmor_parser -r /etc/apparmor.d/usr.sbin.nginx

# Disable a profile
ln -s /etc/apparmor.d/usr.sbin.nginx /etc/apparmor.d/disable/
apparmor_parser -R /etc/apparmor.d/usr.sbin.nginx

# Generate a profile from a running program
aa-genprof /usr/sbin/nginx
# Runs the program, monitors its file access, and generates a profile
```

### AppArmor vs SELinux

| Aspect | SELinux | AppArmor |
|--------|---------|----------|
| Access model | Label-based (every file) | Path-based (specific paths) |
| Configuration | Policy modules | Profiles per program |
| Complexity | Steeper learning curve | Easier to configure |
| Granularity | More granular | Less granular |
| Default on | RHEL, CentOS, Fedora | Ubuntu, SUSE, Debian |
| Container support | Docker, Kubernetes | Docker, Kubernetes |

### AppArmor Profile Development

Writing AppArmor profiles requires understanding what the application actually needs:

```bash
# Step 1: Put profile in complain mode
aa-complain /usr/sbin/nginx

# Step 2: Run the application normally
systemctl restart nginx
# Access the web server, run typical workloads

# Step 3: Check the log for denied accesses
grep "apparmor=\"DENIED\"" /var/log/syslog
# apparmor="DENIED" profile="usr.sbin.nginx" name="/etc/nginx/secret.conf" 
#   pid=1234 comm="nginx" requested_mask="r"

# Step 4: Update the profile to allow legitimate access
# Add the denied path to the profile

# Step 5: Switch to enforce mode
aa-enforce /usr/sbin/nginx
systemctl restart nginx

# Step 6: Verify no legitimate operations are blocked
# Check for DENIED entries in syslog
```

### AppArmor for Containers

```bash
# Docker uses AppArmor profiles for container isolation
# Default profile: docker-default

# View the default profile
cat /etc/apparmor.d/docker-default

# Run a container with a custom profile
docker run --security-opt apparmor=my_custom_profile alpine sh

# Create a profile for a container application
cat > /etc/apparmor.d/my_container << 'EOF'
#include <tunables/global>

profile my_container flags=(attach_disconnected,mediate_deleted) {
    #include <abstractions/base>

    # Allow basic operations
    /bin/** rmix,
    /usr/bin/** rmix,
    /lib/** rmix,
    /lib64/** rmix,

    # Allow reading config
    /etc/nginx/** r,

    # Allow writing logs
    /var/log/nginx/** w,

    # Deny everything else
    deny /etc/shadow r,
    deny /proc/*/mem r,
    deny /sys/firmware/** r,
}
EOF

# Load the profile
apparmor_parser -r /etc/apparmor.d/my_container

# Test
docker run --security-opt apparmor=my_container alpine cat /etc/shadow
# Operation not permitted (AppArmor blocks it)
```

### AppArmor vs seccomp for Containers

Both provide defense in depth for containers, but at different layers:

| Layer | AppArmor | seccomp |
|-------|----------|---------|
| What it controls | File access, capabilities | System call access |
| Configuration | Profile per program | Filter per system call |
| Kernel interaction | LSM hooks | seccomp-bpf filters |
| Complementary | Yes — use both together | Yes — use both together |

For containers, the recommended approach is:
1. Use AppArmor for file and capability restrictions
2. Use seccomp for system call filtering
3. Use user namespaces for privilege separation
4. Use cgroups for resource limits

## Seccomp-bpf: System Call Filtering

Seccomp-bpf (covered briefly in Module 5) deserves deeper treatment for security. It restricts which system calls a process can make, reducing the attack surface.

### Security Use Cases

**Preventing privilege escalation:**

```c
// Block dangerous system calls
scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL);

// Allow only safe syscalls
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(read), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(write), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(close), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit_group), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(mmap), 1,
    SCMP_A0(SCMP_CMP_MASKED_EQ, PROT_EXEC, 0));  // Block executable mappings

// Block these regardless
seccomp_rule_add(ctx, SCMP_ACT_KILL, SCMP_SYS(execve), 0);
seccomp_rule_add(ctx, SCMP_ACT_KILL, SCMP_SYS(clone), 1,
    SCMP_A0(SCMP_CMP_MASKED_EQ, CLONE_NEWUSER, CLONE_NEWUSER));
seccomp_rule_add(ctx, SCMP_ACT_KILL, SCMP_SYS(keyctl), 0);
seccomp_rule_add(ctx, SCMP_ACT_KILL, SCMP_SYS(add_key), 0);
seccomp_rule_add(ctx, SCMP_ACT_KILL, SCMP_SYS(request_key), 0);

seccomp_load(ctx);
```

**Logging syscalls (for auditing):**

```c
// Allow but log specific syscalls
seccomp_rule_add(ctx, SCMP_ACT_LOG, SCMP_SYS(connect), 0);
// The process can call connect(), but it will be logged to syslog
```

### Docker Default Seccomp Profile

Docker applies a default seccomp profile that blocks ~44 dangerous syscalls. Key blocked syscalls:

| Syscall | Why Blocked |
|---------|-------------|
| `mount` | Prevent filesystem modification |
| `umount2` | Prevent filesystem modification |
| `reboot` | Prevent system shutdown |
| `sethostname` | Prevent hostname change |
| `setdomainname` | Prevent domain change |
| `ptrace` | Prevent process tracing |
| `kexec_load` | Prevent kernel loading |
| `bpf` | Prevent eBPF program loading |
| `userfaultfd` | Prevent memory mapping exploits |
| `keyctl` | Prevent kernel keyring manipulation |

```bash
# View Docker's default profile
cat /etc/docker/seccomp.json | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin), indent=2))" | head -50

# Run with a custom profile
docker run --security-opt seccomp=/path/to/profile.json alpine sh

# Run without seccomp (dangerous, for debugging only)
docker run --security-opt seccomp=unconfined alpine sh
```

### Seccomp in Systemd

```ini
[Service]
# Allow only basic system service syscalls
SystemCallFilter=@system-service
# Block debug, mount, obsolete, reboot, swap, clock
SystemCallFilter=~@debug @mount @obsolete @reboot @swap @clock
# Only allow native architecture
SystemCallArchitectures=native
# Prevent acquiring new privileges
NoNewPrivileges=yes
```

## Kernel Lockdown Mode

Linux kernel lockdown mode restricts what even root can do. It prevents modification of the running kernel, which blocks rootkits and persistent threats.

### Lockdown Levels

```bash
# Check current lockdown status
cat /sys/kernel/security/lockdown
# [none] integrity confidentiality

# The three levels:
# none:        No restrictions
# integrity:   Prevents modifying kernel code/data (blocks kexec, /dev/mem, etc.)
# confidentiality: Also prevents reading kernel memory, extracting keys, etc.
```

### Enabling Lockdown

```bash
# Via kernel command line
# lockdown=integrity    # or lockdown=confidentiality

# Via sysfs (only allows going to a more restrictive level)
echo integrity > /sys/kernel/security/lockdown

# Check what lockdown blocks
dmesg | grep lockdown
# Lockdown: swapper/0: hibernation command restricted
# Lockdown: insmod: unsigned module loading restricted
```

### What Lockdown Blocks

| Feature | integrity | confidentiality |
|---------|-----------|-----------------|
| Loading unsigned modules | Blocked | Blocked |
| Using /dev/mem | Blocked | Blocked |
| Using /dev/kmem | Blocked | Blocked |
| kexec_load | Blocked | Blocked |
| Hibernation | Blocked | Blocked |
| ioperm/iopl | Blocked | Blocked |
| Reading kernel memory via /proc/kcore | Allowed | Blocked |
| Reading ACPI tables via /sys/firmware | Allowed | Blocked |
| CPU MSR access | Blocked | Blocked |

## Secure Boot: Chain of Trust

Secure Boot ensures that only signed code runs during the boot process. It creates a chain of trust from firmware to kernel.

### The Chain of Trust

```
UEFI Firmware
    ↓ (verifies signature)
Bootloader (GRUB)
    ↓ (verifies signature)
Kernel
    ↓ (verifies signature)
Modules (if module signing enabled)
```

### Secure Boot Configuration

```bash
# Check Secure Boot status
mokutil --sb-state
# SecureBoot enabled

# View enrolled keys
mokutil --list-enrolled

# Check if a file is signed
sbverify --cert /path/to/MOK.pem /boot/vmlinuz-$(uname -r)
```

### Signing Custom Kernels

```bash
# Generate a signing key
openssl req -new -x509 -newkey rsa:2048 -keyout MOK.priv -out MOK.der -days 3650 -nodes -subj "/CN=My Signing Key/"

# Sign a kernel
sbsign --key MOK.priv --cert MOK.der /boot/vmlinuz-$(uname -r) -o /boot/vmlinuz-$(uname -r)-signed

# Sign a module
/usr/src/kernels/$(uname -r)/scripts/sign-file sha256 MOK.priv MOK.der mymodule.ko

# Enroll the key (requires reboot and MOK Manager)
mokutil --import MOK.der
# Enter a one-time password, then reboot into MOK Manager to confirm
```

### Module Signing

```bash
# Check if module signing is enforced
cat /sys/kernel/security/lockdown
# If "integrity" or "confidentiality" is set, unsigned modules are blocked

# Check kernel config
cat /proc/config.gz | gunzip | grep MODULE_SIG
# CONFIG_MODULE_SIG=y
# CONFIG_MODULE_SIG_FORCE=y
# CONFIG_MODULE_SIG_SHA256=y

# Sign a module
/usr/src/kernels/$(uname -r)/scripts/sign-file sha256 /path/to/signing_key.priv /path/to/signing_key.x509 mymodule.ko

# Verify module signature
modinfo mymodule | grep signer
# signer:     My Signing Key
```

## Real Scenario: Implementing Mandatory Access Control

### The Problem

A production web server running nginx and a custom PHP application was compromised through a file upload vulnerability. The attacker gained web server privileges (www-data) and was able to:
1. Read `/etc/shadow` (found weak password hashes)
2. Scan the internal network
3. Write files to arbitrary locations

The DAC permissions were correct — www-data should not have been able to read `/etc/shadow`. But the file was world-readable (a misconfiguration from an earlier debugging session).

### Solution: Implement SELinux

**Step 1: Enable SELinux**

```bash
# Check current status
getenforce
# Disabled

# Enable SELinux (requires reboot)
sed -i 's/SELINUX=disabled/SELINUX=enforcing/' /etc/selinux/config
touch /.autorelabel  # Force relabel on next boot
reboot
```

**Step 2: Verify nginx is confined**

```bash
# After reboot, nginx should run in httpd_t
ps -eZ | grep nginx
# system_u:system_r:httpd_t:s0    1234 ?  00:00:00 nginx
# system_u:system_r:httpd_t:s0    1235 ?  00:00:00 nginx

# nginx can only access files labeled httpd_sys_content_t or similar
ls -Z /var/www/html/
# system_u:object_r:httpd_sys_content_t:s0 index.php
# system_u:object_r:httpd_sys_content_t:s0 upload/
```

**Step 3: Deny network access from web server**

```bash
# Block httpd from making outbound connections
setsebool -P httpd_can_network_connect off

# If the app needs to connect to a database on localhost
setsebool -P httpd_can_network_connect_db on

# Test: try to scan the network from the web server
su -s /bin/bash www-data -c "nc -zv 192.168.1.1 22"
# nc: connect to 192.168.1.1 port 22 (tcp) failed: Permission denied
# SELinux blocks the connection
```

**Step 4: Restrict file access**

```bash
# nginx should only read web content and write to upload directory
# Create a custom policy module for this

# Generate a custom type for upload files
cat > upload.te << 'EOF'
policy_module(my_upload, 1.0)

type upload_t;
files_type(upload_t)

# Allow httpd to read upload files
allow httpd_t upload_t:file read;
allow httpd_t upload_t:dir search;
EOF

# Compile and install
checkmodule -M -m -o upload.mod upload.pp
semodule_package -o upload.pp -m upload.mod
semodule -i upload.pp

# Label the upload directory
semanage fcontext -a -t upload_t "/var/www/html/upload(/.*)?"
restorecon -Rv /var/www/html/upload/
```

**Step 5: Prevent reading sensitive files**

```bash
# Verify www-data cannot read shadow
su -s /bin/bash www-data -c "cat /etc/shadow"
# cat: /etc/shadow: Permission denied

# Even as root within the httpd_t context, access is denied
su -s /bin/bash www-data -c "cat /etc/shadow"
# SELinux blocks this even though www-data is the Linux user

# Check the audit log for any remaining denials
ausearch -m AVC --start recent
# If any denials, use audit2allow to create appropriate rules
```

### Prevention: AppArmor Alternative

For systems using AppArmor instead of SELinux:

```bash
# Create an AppArmor profile for nginx
cat > /etc/apparmor.d/usr.sbin.nginx << 'EOF'
#include <tunables/global>

/usr/sbin/nginx {
    #include <abstractions/base>
    #include <abstractions/nameservice>

    capability net_bind_service,
    capability setuid,
    capability setgid,

    network inet stream,
    network inet6 stream,

    /etc/nginx/** r,
    /var/log/nginx/** w,
    /var/lib/nginx/** rw,
    /var/www/html/** r,
    /var/www/html/upload/** rw,
    /run/nginx.pid rw,

    deny /etc/shadow r,
    deny /etc/gshadow r,
    deny /root/** rwx,
    deny /home/** rwx,
}
EOF

# Load the profile
apparmor_parser -r /etc/apparmor.d/usr.sbin.nginx

# Test
aa-enforce /usr/sbin/nginx
nginx -t  # Reload to apply
```

### Monitoring MAC Effectiveness

```bash
# SELinux: Monitor denials
ausearch -m AVC --start today | aureport --avc --summary

# AppArmor: Monitor profile violations
aa-status
cat /var/log/syslog | grep "apparmor=\"DENIED\""

# Both: Set up alerts for security events
cat > /etc/audit/rules.d/security.rules << 'EOF'
# Monitor SELinux/AppArmor denials
-a always,exit,arch=b64 -F arch!=b64 -S execve -k mac_denied
-a always,exit,arch=b64 -S setxattr -S lsetxattr -S fsetxattr -k mac_denied
EOF
augenrules --load
```

## Assessment

### Lab Task 1: SELinux Configuration (30 minutes)

1. Check the current SELinux status and mode
2. List the SELinux context of running services (httpd, sshd, etc.)
3. Create a test file and set its SELinux context
4. Write a simple SELinux denial (try to access a file from the wrong context)
5. View the denial in the audit log and generate a fix with audit2allow
6. Document the complete process

**Grading**: Status check (10%), context listing (15%), context modification (15%), denial generation (20%), audit analysis (20%), documentation (20%)

### Lab Task 2: AppArmor Profile Creation (30 minutes)

1. Create an AppArmor profile for a simple application (e.g., `/bin/cat`)
2. The profile should allow reading from `/tmp/` only
3. Test the profile in complain mode
4. Verify denied access to `/etc/shadow` and `/root/`
5. Switch to enforce mode and verify the restrictions work
6. Document the profile and test results

**Grading**: Profile syntax (20%), complain mode test (20%), deny verification (20%), enforce mode (20%), documentation (20%)

### Lab Task 3: Seccomp Filter (25 minutes)

1. Write a C program that uses only basic syscalls (read, write, open, close, exit)
2. Create a seccomp filter that blocks `socket()` and `connect()` calls
3. Test that the program works without network syscalls
4. Verify that attempting to create a socket is blocked
5. Document the filter and test results

**Grading**: Program implementation (20%), seccomp filter (30%), network blocking (20%), documentation (30%)

### Lab Task 4: Secure Boot and Module Signing (25 minutes)

1. Check if Secure Boot is enabled on the system
2. Generate a test signing key pair
3. Sign a kernel module with the test key
4. Verify the module signature
5. Document the signing process and key management

**Grading**: Secure Boot check (15%), key generation (25%), module signing (25%), verification (15%), documentation (20%)

## Evidence

### Kernel Security Understanding

Evidence of mastery includes:

- Reading and interpreting SELinux contexts and policy rules
- Configuring SELinux booleans to allow legitimate service operations
- Troubleshooting SELinux denials using audit logs and audit2allow
- Creating and managing AppArmor profiles for applications
- Understanding the difference between DAC and MAC
- Configuring seccomp-bpf filters to reduce attack surface
- Understanding kernel lockdown modes and their effects
- Configuring Secure Boot and signing custom kernels and modules
- Choosing the right MAC system for different environments

### Key Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `getenforce` | Check SELinux mode |
| `sestatus` | Detailed SELinux status |
| `ls -Z <file>` | View file SELinux context |
| `ps -eZ` | View process SELinux context |
| `ausearch -m AVC` | Search for SELinux denials |
| `audit2allow -a` | Generate policy from denials |
| `setsebool -P <bool> on` | Set SELinux boolean persistently |
| `aa-status` | AppArmor status |
| `aa-complain <profile>` | Set profile to complain mode |
| `aa-enforce <profile>` | Set profile to enforce mode |
| `aa-genprof <binary>` | Generate profile from execution |
| `cat /sys/kernel/security/lockdown` | Kernel lockdown status |
| `mokutil --sb-state` | Secure Boot status |
| `sbverify <cert> <file>` | Verify binary signature |
| `semodule -i <module.pp>` | Install SELinux policy module |
| `semanage fcontext -a` | Add file context rule |
| `restorecon -Rv <path>` | Apply SELinux file contexts |

### Security Layers Summary

| Layer | Mechanism | Protects Against |
|-------|-----------|------------------|
| Boot | Secure Boot | Boot-time rootkits |
| Kernel | Lockdown mode | Kernel modification |
| MAC | SELinux/AppArmor | Unauthorized access |
| Syscall | seccomp-bpf | Dangerous syscalls |
| Network | iptables/nftables | Network attacks |
| Container | Namespaces + cgroups | Container escapes |
| File | DAC permissions | Unauthorized file access |