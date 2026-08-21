-- Update lab descriptions to reflect expanded content

UPDATE "Lab" SET description = 'From zero to Linux pro: navigate the filesystem, create and manage files, master permissions, write scripts, use pipes, find files, and build automation. 15 hands-on exercises building real skills.' WHERE title = 'Linux Fundamentals: Ubuntu CLI Mastery';

UPDATE "Lab" SET description = 'Own every file on the system. Understand permissions, ACLs, groups, sudo, SUID/SGID bits, and user management. 15 exercises where you create users, set permissions, and configure access control.' WHERE title = 'Linux Fundamentals: File Permissions & Users';

UPDATE "Lab" SET description = 'Become a text wizard: grep, sed, awk, sort, uniq, cut, and pipes. Write shell scripts, parse CSVs, analyze logs, and automate tasks. 15 exercises that make you deadly with the command line.' WHERE title = 'Linux Fundamentals: Text Processing & Shell Scripting';

UPDATE "Lab" SET description = 'Control processes and services like a sysadmin. Find runaway processes, manage services with systemd, set up cron jobs, handle signals, and build background tasks. 15 exercises on process mastery.' WHERE title = 'Linux Fundamentals: Process & Service Management';

UPDATE "Lab" SET description = 'Build containers from scratch. Write Dockerfiles, create multi-stage builds, manage volumes and networks, set resource limits, use Docker Compose, and orchestrate multi-container apps. 15 hands-on exercises.' WHERE title = 'Docker & Container Fundamentals';

UPDATE "Lab" SET description = 'Build real web servers from scratch. Configure virtual hosts, set up reverse proxies, generate SSL certificates, implement rate limiting, load balancing, gzip compression, and access control. 15 exercises on Nginx mastery.' WHERE title = 'Server Administration: Web Servers & Nginx Mastery';

UPDATE "Lab" SET description = 'Full DBA training: create databases, design schemas, write complex queries, manage users and permissions, build backups, set up replication, optimize with indexes, and handle transactions. 20 exercises on MySQL mastery.' WHERE title = 'Database Administration: MySQL/MariaDB';

UPDATE "Lab" SET description = 'PostgreSQL deep dive: create databases, design schemas with SERIAL and NUMERIC, write joins and aggregations, manage roles, set up views, build backups, and handle transactions. 20 hands-on DBA exercises.' WHERE title = 'Database Administration: PostgreSQL';

UPDATE "Lab" SET description = 'Master Linux storage: create disk images, format filesystems, mount volumes, work with LVM (PVs, VGs, LVs), configure RAID, set up swap, analyze disk usage, and manage fstab. 20 storage admin exercises.' WHERE title = 'Server Administration: Storage & Filesystems';

UPDATE "Lab" SET description = 'Master backup and recovery: tar, rsync, incremental backups, cron scheduling, checksums, Docker exports, compression, and automated cleanup scripts. 20 exercises on data protection.' WHERE title = 'Backup & Disaster Recovery';

UPDATE "Lab" SET description = 'Build firewalls from scratch: create iptables rules, block/allow ports, set up NAT, configure rate limiting, log dropped packets, manage chains, and implement stateful inspection. 20 firewall exercises.' WHERE title = 'Network Security: Firewalls, VPNs & IDS/IPS';

UPDATE "Lab" SET description = 'DNS administration with BIND9: create zones, configure A, MX, CNAME, TXT, AAAA, and PTR records. Set up reverse DNS, wildcards, and validate configurations. 20 DNS exercises.' WHERE title = 'DNS Server Administration with BIND9';

UPDATE "Lab" SET description = 'Git mastery: initialize repos, create commits, branch and merge, use stash and tags, set up remotes, cherry-pick, use submodules, and configure Git. 20 hands-on version control exercises.' WHERE title = 'Git & Gitea: Self-Hosted Version Control';

UPDATE "Lab" SET description = 'Automate everything with Ansible: write playbooks, use modules, gather facts, manage variables, create templates and handlers, build roles, manage inventory, and use Ansible Vault. 20 automation exercises.' WHERE title = 'Linux Automation: Ansible & Bash Scripting';

UPDATE "Lab" SET description = 'Build Kubernetes clusters: initialize clusters, deploy pods, create deployments and services, manage ConfigMaps and Secrets, set resource quotas, handle rollbacks, and manage namespaces. 20 K8s exercises.' WHERE title = 'Kubernetes Cluster Setup';

UPDATE "Lab" SET description = 'Monitoring stack: configure Prometheus, set up Node Exporter, create Grafana dashboards, write alert rules, use recording rules, configure Alertmanager, and manage log collection with Promtail. 20 exercises.' WHERE title = 'Monitoring Stack: Prometheus & Grafana';

UPDATE "Lab" SET description = 'Centralized logging: configure rsyslog, set up log rotation, forward logs remotely, create log templates, analyze logs with awk/grep, and build automated cleanup scripts. 15 logging exercises.' WHERE title = 'Centralized Logging: rsyslog & Log Rotation';

UPDATE "Lab" SET description = 'CentOS/RHEL administration: package management with yum/dnf, SELinux, systemd services, firewalld, user management, kernel modules, sysctl tuning, and log management. 20 exercises.' WHERE title = 'Server Administration: CentOS/RHEL Management';

UPDATE "Lab" SET description = 'Debian server hardening: SSH security, Fail2ban, UFW firewall, password policies, audit rules, file integrity, sysctl tuning, sudo configuration, and network auditing. 20 security exercises.' WHERE title = 'Server Administration: Debian Server Hardening';

UPDATE "Lab" SET description = 'Linux kernel internals: explore /proc, inspect modules, examine CPU and memory stats, configure kernel parameters, load/unload modules, and analyze system performance. 20 kernel exercises.' WHERE title = 'Linux Kernel & System Internals';
