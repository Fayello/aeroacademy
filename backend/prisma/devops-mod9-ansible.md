# Module 9 — Configuration Management with Ansible

## What Ansible Does

Ansible automates configuration management, application deployment, and task automation. It connects to remote servers over SSH, executes tasks, and reports results. There is no agent to install on remote servers — Ansible uses SSH, which is already there.

The core concept is the playbook: a YAML file that describes what should happen on remote servers. Playbooks use modules (small programs that perform specific tasks) to execute operations. The `apt` module installs packages. The `template` module renders configuration files. The `service` module starts and stops services. The `copy` module transfers files.

Ansible is agentless. It connects to servers via SSH, executes tasks, and disconnects. This means there is no daemon to manage, no agent to update, and no security footprint on the managed servers. If you can SSH into a server, Ansible can manage it.

Ansible is also idempotent. Running a playbook twice produces the same result as running it once. If a package is already installed, Ansible does not try to install it again. If a configuration file already matches the template, Ansible does not overwrite it. This makes playbooks safe to run repeatedly.

## Inventory Files

The inventory defines which servers Ansible manages. It can be a simple INI file or a more complex YAML structure.

### Simple INI Inventory

```ini
# inventory/hosts.ini
[webservers]
web1.example.com
web2.example.com
web3.example.com

[dbservers]
db1.example.com
db2.example.com

[monitoring]
prometheus.example.com
grafana.example.com

[all:vars]
ansible_user=deploy
ansible_ssh_private_key_file=~/.ssh/deploy_key
ansible_python_interpreter=/usr/bin/python3

[webservers:vars]
http_port=80
app_env=production

[dbservers:vars]
db_name=aeroacademy
db_user=appuser
```

Groups organize servers by function. The `[all:vars]` section sets variables for all servers. Group-specific variables are set in `[groupname:vars]`.

### Dynamic Inventory

For cloud environments, dynamic inventory scripts query the cloud provider for server lists:

```yaml
# inventory/aws_ec2.yml
plugin: amazon.aws.aws_ec2
regions:
  - us-east-1
filters:
  tag:Environment: production
  instance-state-name: running
keyed_groups:
  - key: tags.Role
    prefix: role
  - key: placement.availability_zone
    prefix: az
hostnames:
  - private-ip-address
```

This generates inventory dynamically from AWS EC2. Servers are grouped by their `Role` tag. No static file to maintain — the inventory always reflects the current state.

### Inventory Structure

```
inventory/
  production/
    hosts.ini
    group_vars/
      all.yml
      webservers.yml
      dbservers.yml
    host_vars/
      web1.yml
      web2.yml
  staging/
    hosts.ini
    group_vars/
      all.yml
```

`group_vars/` contains variables for groups. `host_vars/` contains variables for individual hosts. This structure allows per-environment and per-host configuration without duplicating playbooks.

## Playbooks

Playbooks are the core of Ansible. They define tasks, handlers, and roles for configuring servers.

### Basic Playbook

```yaml
# playbooks/webserver.yml
---
- name: Configure web servers
  hosts: webservers
  become: yes
  vars:
    app_version: "2.1.0"
    nginx_worker_processes: auto

  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      tags: packages

    - name: Install required packages
      apt:
        name:
          - nginx
          - nodejs
          - npm
          - certbot
          - python3-certbot-nginx
        state: present
      tags: packages

    - name: Create app directory
      file:
        path: /opt/myapp
        state: directory
        owner: deploy
        group: deploy
        mode: '0755'

    - name: Copy application code
      copy:
        src: ../dist/
        dest: /opt/myapp/
        owner: deploy
        group: deploy
      notify: Restart app
      tags: deploy

    - name: Deploy nginx configuration
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/sites-available/myapp
        owner: root
        group: root
        mode: '0644'
      notify: Reload nginx
      tags: config

    - name: Enable nginx site
      file:
        src: /etc/nginx/sites-available/myapp
        dest: /etc/nginx/sites-enabled/myapp
        state: link
      notify: Reload nginx

    - name: Remove default nginx site
      file:
        path: /etc/nginx/sites-enabled/default
        state: absent
      notify: Reload nginx

    - name: Start and enable nginx
      service:
        name: nginx
        state: started
        enabled: yes

    - name: Configure firewall
      ufw:
        rule: allow
        port: '{{ item }}'
        proto: tcp
      loop:
        - '80'
        - '443'

    - name: Enable firewall
      ufw:
        state: enabled
        policy: deny

  handlers:
    - name: Restart app
      service:
        name: myapp
        state: restarted

    - name: Reload nginx
      service:
        name: nginx
        state: reloaded
```

Playbooks have three main sections:

**hosts** — Which servers to run on. Can be a group name, a hostname, or a pattern.

**vars** — Variables available in the playbook. Can be overridden by inventory variables, extra variables, or role defaults.

**tasks** — The actual work. Each task has a name (for documentation), a module (the action), and parameters. Tasks run sequentially.

**handlers** — Tasks that run only when notified. If the nginx configuration changes, the handler reloads nginx. If it does not change, the handler does not run. Handlers run at the end of the play, not immediately when notified.

### Task Control Flow

```yaml
tasks:
  - name: Check if app is running
    command: systemctl is-active myapp
    register: app_status
    ignore_errors: yes

  - name: Deploy new version
    copy:
      src: ../dist/
      dest: /opt/myapp/
    when: app_status.rc == 0

  - name: Install dependencies
    apt:
      name: "{{ item }}"
      state: present
    loop:
      - nginx
      - nodejs
      - npm
    loop_control:
      label: "{{ item }}"
    tags: packages

  - name: Run database migrations
    command: npx prisma migrate deploy
    args:
      chdir: /opt/myapp
    environment:
      DATABASE_URL: "{{ db_connection_string }}"
    register: migration_result
    retries: 3
    delay: 5
    until: migration_result.rc == 0
```

The `when` directive runs a task conditionally. The `loop` directive iterates over a list. The `register` directive captures task output. The `retries`/`until` directive retries a task until it succeeds.

## Jinja2 Templates

Ansible uses Jinja2 templates for generating configuration files. Templates can reference variables, use conditionals, and loop over lists.

### Template Example

```jinja2
{# templates/nginx.conf.j2 #}
worker_processes {{ nginx_worker_processes }};

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    sendfile on;
    keepalive_timeout 65;

    upstream app_backend {
        {% for host in groups['webservers'] %}
        server {{ hostvars[host]['ansible_host'] }}:3000;
        {% endfor %}
    }

    server {
        listen 80;
        server_name {{ server_name }};

        {% if ssl_enabled %}
        listen 443 ssl;
        ssl_certificate /etc/ssl/{{ server_name }}.crt;
        ssl_certificate_key /etc/ssl/{{ server_name }}.key;
        {% endif %}

        location / {
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        {% if enable_metrics %}
        location /metrics {
            proxy_pass http://app_backend;
        }
        {% endif %}
    }
}
```

Templates use `{{ }}` for variable interpolation and `{% %}` for control flow. The `groups['webservers']` variable references the inventory group. The `hostvars[host]['ansible_host']` variable accesses host-specific variables.

### Template with Filters

```jinja2
{# Display database connection info #}
Database: {{ db_host }}:{{ db_port }}/{{ db_name }}
User: {{ db_user }}
Password: {{ db_password | hide }}
SSL Mode: {{ db_ssl_mode | default('require') }}

{# Format a list #}
Packages to install:
{% for pkg in required_packages %}
  - {{ pkg.name }} ({{ pkg.version | default('latest') }})
{% endfor %}

{# Conditional with default #}
{% if app_debug | default(false) %}
debug_mode = true
log_level = DEBUG
{% else %}
debug_mode = false
log_level = INFO
{% endif %}

{# JSON output #}
{{ app_config | to_json }}
```

Filters transform values. `hide` replaces sensitive data with `***`. `default` provides fallback values. `to_json` converts to JSON format.

## Roles

Roles organize playbooks into reusable components. A role encapsulates tasks, handlers, templates, files, and variables into a standard directory structure.

### Role Directory Structure

```
roles/
  nginx/
    tasks/
      main.yml
    handlers/
      main.yml
    templates/
      nginx.conf.j2
    files/
      nginx.conf
    defaults/
      main.yml
    vars/
      main.yml
    meta/
      main.yml
```

### Role Tasks

```yaml
# roles/nginx/tasks/main.yml
---
- name: Install nginx
  apt:
    name: nginx
    state: present
  tags: packages

- name: Deploy nginx configuration
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    owner: root
    group: root
    mode: '0644'
  notify: Reload nginx

- name: Ensure nginx is running
  service:
    name: nginx
    state: started
    enabled: yes
```

### Role Handlers

```yaml
# roles/nginx/handlers/main.yml
---
- name: Reload nginx
  service:
    name: nginx
    state: reloaded
```

### Role Defaults

```yaml
# roles/nginx/defaults/main.yml
---
nginx_worker_processes: auto
nginx_worker_connections: 1024
nginx_keepalive_timeout: 65
server_name: localhost
```

Defaults are the lowest priority variables. They can be overridden by inventory variables, playbook variables, or extra variables.

### Using Roles

```yaml
# playbooks/webserver.yml
---
- name: Configure web servers
  hosts: webservers
  become: yes

  roles:
    - common
    - nginx
    - nodejs
    - myapp
```

Roles run in the order specified. Each role is self-contained and can be reused across playbooks. Roles can also be sourced from Ansible Galaxy, a community repository of shared roles.

### Role Dependencies

```yaml
# roles/myapp/meta/main.yml
---
dependencies:
  - role: nginx
    vars:
      server_name: myapp.example.com
  - role: nodejs
  - role: postgresql
    vars:
      db_name: myapp
```

Dependencies ensure that required roles run before the dependent role. The `vars` section overrides the dependent role's defaults.

## Ansible Vault

Ansible Vault encrypts sensitive data: passwords, API keys, certificates. Encrypted files can be committed to version control safely.

### Creating Encrypted Files

```bash
# Create a new encrypted file
ansible-vault create secrets.yml

# Edit an encrypted file
ansible-vault edit secrets.yml

# Encrypt an existing file
ansible-vault encrypt existing.yml

# Decrypt a file
ansible-vault decrypt secrets.yml

# View encrypted content
ansible-vault view secrets.yml
```

### Encrypted File Content

```yaml
# secrets.yml (encrypted)
db_password: supersecret123
api_key: abcdefghijklmnop
jwt_secret: myjwtsecret
ssl_private_key: |
  -----BEGIN PRIVATE KEY-----
  MIIEvgIBADANBgkqhkiG9w0BAQEFAASC...
  -----END PRIVATE KEY-----
```

### Using Encrypted Variables in Playbooks

```yaml
---
- name: Deploy application
  hosts: webservers
  become: yes
  vars_files:
    - secrets.yml

  tasks:
    - name: Deploy application configuration
      template:
        src: app.config.j2
        dest: /opt/myapp/config.json
      vars:
        db_password: "{{ db_password }}"
        api_key: "{{ api_key }}"
```

Run the playbook with the vault password:

```bash
ansible-playbook deploy.yml --ask-vault-pass

# Or use a password file
ansible-playbook deploy.yml --vault-password-file=.vault_pass
```

### Encrypted Variables Within YAML

```yaml
# group_vars/production/secrets.yml
---
db_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  383561396562343364626265666138643761...
```

Individual variables can be encrypted inline using `ansible-vault encrypt_string`:

```bash
ansible-vault encrypt_string 'supersecret123' --name 'db_password'
```

This outputs YAML with an encrypted variable that can be pasted into any YAML file. The `encrypt_string` command is particularly useful for adding individual secrets to existing YAML files without encrypting the entire file.

### Vault Password Management

The vault password is the master key for all encrypted data. Protecting it is critical:

1. **Never commit the vault password to version control.** Store it in a password manager, a secrets service, or a file with restricted permissions.
2. **Use different vault passwords for different environments.** A compromised staging vault password should not grant access to production secrets.
3. **Rotate the vault password periodically.** Re-encrypt all vault files with the new password.
4. **Limit vault password access.** Not everyone on the team needs the production vault password.

For CI/CD pipelines, store the vault password as a CI secret and pass it using `--vault-password-file`:

## Ad-Hoc Commands

Ad-hoc commands execute single tasks across servers without writing a playbook.

```bash
# Check connectivity
ansible all -m ping

# Run a command
ansible webservers -m command -a "uptime"

# Run a shell command (supports pipes, redirects)
ansible webservers -m shell -a "df -h | grep /dev/sda"

# Install a package
ansible webservers -m apt -a "name=nginx state=present" --become

# Copy a file
ansible webservers -m copy -a "src=./app.tar.gz dest=/tmp/app.tar.gz"

# Manage services
ansible webservers -m service -a "name=nginx state=restarted" --become

# Gather facts
ansible web1.example.com -m setup

# Check disk usage
ansible all -m shell -a "df -h /" -o

# Run a playbook in check mode (dry run)
ansible-playbook deploy.yml --check --diff
```

Ad-hoc commands are useful for quick operations: checking server status, running one-off commands, or testing connectivity. For anything repeated, write a playbook.

The `--check --diff` flags on playbook runs show what would change without actually changing anything. This is essential for verifying playbooks before running them in production.

## Ansible Best Practices

### Idempotency

Every task should be idempotent — running it twice produces the same result as running it once. The `apt` module with `state: present` is idempotent. The `command` module with `creates` is idempotent. The `shell` module without conditions is not idempotent.

```yaml
# Good: idempotent
- name: Install nginx
  apt:
    name: nginx
    state: present

# Good: idempotent with creates
- name: Generate SSL certificate
  command: openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/key.pem -out /etc/ssl/cert.pem
  args:
    creates: /etc/ssl/cert.pem

# Bad: not idempotent
- name: Restart nginx
  command: systemctl restart nginx
```

The `creates` argument tells Ansible to skip the task if the file already exists. This makes the `command` module idempotent.

### Error Handling

Ansible provides several ways to handle errors gracefully:

```yaml
tasks:
  - name: Try to restart the service
    service:
      name: myapp
      state: restarted
    register: restart_result
    ignore_errors: yes

  - name: Fall back to start if restart fails
    service:
      name: myapp
      state: started
    when: restart_result is failed

  - name: Notify on failure
    debug:
      msg: "Service restart failed, attempted start instead"
    when: restart_result is failed
```

The `ignore_errors: yes` directive allows the task to fail without stopping the playbook. The `register` directive captures the result, and `when: restart_result is failed` conditionally runs the fallback task.

### Tags for Selective Execution

Tags let you run specific parts of a playbook:

```yaml
tasks:
  - name: Install packages
    apt:
      name: nginx
    tags: packages

  - name: Deploy configuration
    template:
      src: nginx.conf.j2
      dest: /etc/nginx/nginx.conf
    tags: config

  - name: Deploy application
    copy:
      src: ../dist/
      dest: /opt/myapp/
    tags: deploy
```

Run only tagged tasks:

```bash
ansible-playbook site.yml --tags "config,deploy"
ansible-playbook site.yml --skip-tags "packages"
```

This is useful for deployment playbooks where you want to skip package installation (packages do not change often) and only deploy code and configuration.

### Parallel Execution

Ansible runs tasks in parallel across hosts by default. The `forks` parameter controls how many hosts are processed simultaneously:

```bash
# Process 20 hosts in parallel (default is 5)
ansible-playbook site.yml -f 20

# Process all hosts simultaneously
ansible-playbook site.yml -f 50
```

For tasks that should run on one host at a time (database migrations, leader election), use `serial`:

```yaml
- name: Run database migrations
  hosts: dbservers
  serial: 1
  tasks:
    - name: Run prisma migrate
      command: npx prisma migrate deploy
```

The `serial: 1` directive processes one host at a time. If migration fails on the first host, the playbook stops and does not attempt the remaining hosts.

### Performance Optimization

```yaml
# Enable SSH pipelining (reduces SSH connections)
# In ansible.cfg:
# [ssh_connection]
# pipelining = True

# Use facts caching
# In ansible.cfg:
# [defaults]
# fact_caching = jsonfile
# fact_caching_connection = /tmp/ansible_facts_cache
# fact_caching_timeout = 3600

# Disable fact gathering for roles that do not need it
- name: Deploy application
  hosts: webservers
  gather_facts: no
  roles:
    - deploy
```

Fact gathering collects system information (OS, IP, memory, disk) and takes 5-10 seconds per host. If your playbook does not use facts, disable it with `gather_facts: no`.

## AWX/Tower for Web-Based Management

## Real Story: Automating 200 Server Configuration in 30 Minutes

A hosting company acquired a smaller provider and inherited 200 Linux servers. The servers were configured inconsistently: different SSH configurations, different package versions, different user accounts, different security settings. Some had firewall rules, some did not. Some had monitoring agents, some did not. The wiki listed the servers but had no information about their configuration.

The operations team was given two weeks to standardize the servers. Manual configuration would take weeks, and errors would be inevitable. They chose Ansible.

The first step was creating an inventory. They exported the server list from the provisioning system and organized it into groups:

```ini
# inventory/hosts.ini
[web]
web[001:100].example.com

[db]
db[001:020].example.com

[cache]
cache[001:010].example.com

[monitoring]
mon[001:005].example.com

[all:vars]
ansible_user=deploy
ansible_ssh_private_key_file=~/.ssh/automation_key
ansible_python_interpreter=/usr/bin/python3
```

The second step was creating roles for common configurations:

1. **common** — Base packages, NTP configuration, SSH hardening, user accounts
2. **security** — Firewall rules, fail2ban, SSH key management, password policies
3. **monitoring** — Node exporter, Prometheus configuration, alert rules
4. **webserver** — Nginx configuration, SSL certificates, application deployment
5. **database** — PostgreSQL configuration, backup scripts, replication setup
6. **cache** — Redis configuration, memory limits, persistence settings

The third step was creating playbooks for each configuration category:

```yaml
# playbooks/harden-all.yml
---
- name: Security hardening for all servers
  hosts: all
  become: yes
  roles:
    - common
    - security

# playbooks/configure-web.yml
- name: Configure web servers
  hosts: web
  become: yes
  roles:
    - common
    - security
    - monitoring
    - webserver

# playbooks/configure-db.yml
- name: Configure database servers
  hosts: db
  become: yes
  roles:
    - common
    - security
    - monitoring
    - database
```

The team ran the playbooks in stages:

**Day 1: Audit.** They ran all playbooks in check mode to see what would change. The output was massive — 47,000 changes across 200 servers. They reviewed the changes and adjusted the playbooks for edge cases (servers with custom configurations that should not be changed).

**Day 2-3: Common configuration.** They ran the common role on all servers. This standardized SSH configurations, installed base packages, configured NTP, and created the deploy user account. The role took about 30 seconds per server, completing all 200 servers in 20 minutes.

**Day 4-5: Security hardening.** They ran the security role on all servers. This configured firewalls, installed fail2ban, restricted SSH access, and applied password policies. Some servers had custom firewall rules that needed to be preserved, so they added exceptions to the role.

**Day 6-7: Monitoring.** They installed node exporters on all servers and configured Prometheus to scrape them. Within an hour, they had visibility into all 200 servers.

**Day 8-10: Application-specific configuration.** They ran the webserver, database, and cache roles on the appropriate servers. Each role took about 5 minutes per server.

The final result: all 200 servers were configured consistently with the desired state. New servers could be provisioned and configured in 15 minutes by running the playbooks. Configuration drift was detected by running playbooks in check mode weekly. When a server was found to have drifted (someone made a manual change), the playbooks corrected it automatically.

The entire project took 8 working days instead of the estimated 3 weeks. The playbooks became the documentation for the server configuration, replacing the outdated wiki. New team members could understand the configuration by reading the playbooks.

## AWX/Tower for Web-Based Management

AWX is the open-source version of Ansible Tower. It provides a web interface for managing Ansible playbooks, inventories, and credentials.

### AWX Features

- **Web interface** — Run playbooks from a browser without SSH access
- **Credential management** — Store vault passwords, SSH keys, and cloud credentials securely
- **RBAC** — Control who can run which playbooks on which servers
- **Job scheduling** — Run playbooks on a schedule (daily security scan, weekly configuration audit)
- **Audit logging** — Track who ran what, when, and what changed
- **REST API** — Integrate with CI/CD pipelines and other tools

### Running Playbooks in AWX

1. Create a Project pointing to your Git repository
2. Create an Inventory from your inventory files
3. Create Credentials for SSH keys and vault passwords
4. Create a Job Template that links a playbook, inventory, and credentials
5. Run the Job Template from the web interface

AWX stores job output, tracks changes, and provides rollback capabilities. It is useful for teams that need a web interface for non-technical users or that need audit trails for compliance.

## Assessment

**Lab Task 1: Basic Playbook Development (60 minutes)**

Create an Ansible playbook that:
1. Installs nginx and Node.js on target servers
2. Deploys an nginx configuration from a Jinja2 template
3. Creates a systemd service for the application
4. Configures the firewall to allow HTTP and HTTPS
5. Starts and enables all services

Test the playbook against a local VM or container.

Grading criteria: All tasks complete correctly (40%), Jinja2 template works (20%), handlers notify correctly (15%), idempotency verified (15%), playbook is well-documented (10%).

**Lab Task 2: Role Development (60 minutes)**

Create an Ansible role for PostgreSQL that includes:
1. Installation of PostgreSQL
2. Configuration from templates
3. Creation of databases and users
4. Backup script deployment
5. Monitoring agent installation

The role should be reusable across different environments with different configurations.

Grading criteria: Role directory structure is correct (20%), all tasks work (30%), templates are parameterized (20%), role is reusable (15%), documentation explains usage (15%).

**Lab Task 3: Ansible Vault and Secrets Management (45 minutes)**

1. Create an encrypted variables file with database passwords and API keys
2. Create a playbook that uses encrypted variables
3. Demonstrate running the playbook with vault password
4. Create a password file for automated runs
5. Show how to rotate secrets by re-encrypting the vault file

Document the security implications and best practices for managing secrets with Ansible Vault.

Grading criteria: Vault encryption works correctly (30%), playbook uses secrets correctly (25%), password file works (15%), secret rotation demonstrated (15%), security documentation (15%).

**Lab Task 4: Idempotency Testing (45 minutes)**

1. Write a playbook with 10 tasks that configure a server
2. Run the playbook twice
3. Verify that the second run produces no changes (idempotency)
4. Identify and fix any tasks that are not idempotent
5. Document how to verify idempotency using --check and --diff flags

Grading criteria: Playbook is fully idempotent (40%), --check and --diff used correctly (25%), non-idempotent tasks identified and fixed (20%), documentation explains idempotency (15%).

## Evidence

Ansible is documented in the official Ansible documentation (docs.ansible.com). The playbook format, task syntax, and module usage are based on the Ansible documentation. The inventory format (INI and YAML) is documented in the Ansible inventory guide.

The role directory structure follows the Ansible Galaxy standard. Roles can be shared via Ansible Galaxy (galaxy.ansible.com), which hosts thousands of community-contributed roles. The role dependencies mechanism is documented in the Ansible role dependencies documentation.

Ansible Vault is documented in the Ansible Vault guide. The encryption uses AES-256 and is industry-standard for secret management. The `ansible-vault encrypt_string` command is documented in the Ansible Vault command reference.

The Jinja2 template syntax is documented in the Jinja2 documentation (jinja.palletsprojects.com). Ansible uses Jinja2 as its template engine, and the template syntax is a subset of the full Jinja2 specification.

AWX is the open-source version of Ansible Tower, both developed by Red Hat. AWX is documented at docs.ansible.com/awx. The web interface, API, and job scheduling features are documented in the AWX user guide.

The server configuration story is based on common patterns in configuration management. The approach (audit, common configuration, security hardening, application-specific configuration) follows industry best practices for large-scale server management. The use of Ansible for configuration management at scale has been documented by companies including Red Hat, HashiCorp, and numerous enterprises.