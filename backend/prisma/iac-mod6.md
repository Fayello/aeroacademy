# Module 6: Ansible

Terraform provisions infrastructure. Ansible configures it. That is the division of labor in most IaC setups. Terraform creates the servers, load balancers, and databases. Ansible installs packages, manages configuration files, deploys applications, and handles everything that happens on the operating system after the infrastructure exists.

Ansible is agentless. It SSHes into machines, pushes small Python scripts called modules, runs them, and removes them when done. There is no daemon to install, no agent to manage, no special port to open. You point Ansible at a server with SSH credentials and it works.

This module covers Ansible's inventory system, playbooks, roles, and a real scenario of configuring multiple servers from scratch.

## Inventory and Groups

Ansible needs to know which servers to manage and how to connect to them. This is the inventory.

**Static inventory** is a simple INI or YAML file:

```ini
# inventory/hosts.ini

[webservers]
web1 ansible_host=10.0.1.10 ansible_user=deploy
web2 ansible_host=10.0.1.11 ansible_user=deploy

[databases]
db1 ansible_host=10.0.2.10 ansible_user=deploy

[all:vars]
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_private_key_file=~/.ssh/deploy_key
```

**YAML inventory** is more readable for complex setups:

```yaml
# inventory/hosts.yml
all:
  children:
    webservers:
      hosts:
        web1:
          ansible_host: 10.0.1.10
          ansible_user: deploy
        web2:
          ansible_host: 10.0.1.11
          ansible_user: deploy
    databases:
      hosts:
        db1:
          ansible_host: 10.0.2.10
          ansible_user: deploy
  vars:
    ansible_python_interpreter: /usr/bin/python3
    ansible_ssh_private_key_file: ~/.ssh/deploy_key
```

**Groups and group variables**: You can assign variables to entire groups. This is how you tell all webservers to use the same configuration:

```ini
[webservers]
web1 ansible_host=10.0.1.10
web2 ansible_host=10.0.1.11

[webservers:vars]
http_port=80
app_env=production
nginx_worker_processes=4
max_upload_size=50M
```

**Dynamic inventory**: When your infrastructure is in the cloud, servers come and go. Dynamic inventory scripts query cloud APIs to build the inventory in real time:

```yaml
# ansible.cfg
[defaults]
inventory = aws_ec2.yml

# aws_ec2.yml
plugin: amazon.aws.aws_ec2

regions:
  - us-east-1

filters:
  tag:Environment: production
  instance-state-name: running

keyed_groups:
  - key: tags.Role
    prefix: role
    separator: "_"
  - key: placement.availability_zone
    prefix: az
```

This automatically discovers EC2 instances tagged with Environment: production and groups them by their Role tag. When a new instance launches, Ansible sees it on the next run. When an instance terminates, it disappears from the inventory.

**Host patterns**: You can target specific hosts or groups in your playbooks:

```bash
# Run against all hosts
ansible-playbook -i inventory/hosts.yml site.yml

# Run against webservers group only
ansible-playbook -i inventory/hosts.yml site.yml --limit webservers

# Run against a specific host
ansible-playbook -i inventory/hosts.yml site.yml --limit web1

# Run against hosts matching a pattern
ansible-playbook -i inventory/hosts.yml site.yml --limit "web*,db1"

# Run against everything except a group
ansible-playbook -i inventory/hosts.yml site.yml --limit "all:!databases"
```

**Connection parameters**: Ansible connects to remote hosts via SSH by default. You can configure this per host or per group:

```yaml
# inventory/hosts.yml
all:
  children:
    webservers:
      hosts:
        web1:
          ansible_host: 10.0.1.10
          ansible_port: 22
          ansible_user: deploy
          ansible_ssh_private_key_file: ~/.ssh/deploy_key
```

Or globally in ansible.cfg:

```ini
[defaults]
inventory = inventory/hosts.yml
remote_user = deploy
private_key_file = ~/.ssh/deploy_key
host_key_checking = False
timeout = 30

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False
```

The become settings tell Ansible to escalate to root using sudo. This is necessary for most system configuration tasks.

## Playbooks

Playbooks are the heart of Ansible. A playbook is a YAML file that describes what should happen on remote hosts. It is a list of plays, and each play maps a group of hosts to a list of tasks.

**Basic playbook structure**:

```yaml
# deploy-web.yml
---
- name: Configure web servers
  hosts: webservers
  become: yes
  vars:
    app_version: "2.1.0"
    app_port: 8080

  tasks:
    - name: Install required packages
      ansible.builtin.apt:
        name:
          - nginx
          - python3
          - python3-pip
          - git
        state: present
        update_cache: yes
        cache_valid_time: 3600

    - name: Create application user
      ansible.builtin.user:
        name: appuser
        shell: /bin/bash
        home: /home/appuser
        create_home: yes
        system: yes

    - name: Clone application repository
      ansible.builtin.git:
        repo: https://github.com/company/myapp.git
        dest: /opt/myapp
        version: "v{{ app_version }}"
        force: yes

    - name: Install Python dependencies
      ansible.builtin.pip:
        requirements: /opt/myapp/requirements.txt
        virtualenv: /opt/myapp/venv

    - name: Deploy nginx configuration
      ansible.builtin.template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/sites-available/myapp
        owner: root
        group: root
        mode: "0644"
      notify: Reload nginx

    - name: Enable nginx site
      ansible.builtin.file:
        src: /etc/nginx/sites-available/myapp
        dest: /etc/nginx/sites-enabled/myapp
        state: link
      notify: Reload nginx

    - name: Ensure services are running
      ansible.builtin.systemd:
        name: "{{ item }}"
        state: started
        enabled: yes
      loop:
        - nginx
        - myapp

  handlers:
    - name: Reload nginx
      ansible.builtin.systemd:
        name: nginx
        state: reloaded
```

**Task anatomy**: Each task has a name for documentation, a module like apt, git, or template, and parameters specific to that module. Tasks run in order. If a task fails, Ansible stops unless you use ignore_errors: yes. Tasks are idempotent, meaning running them twice produces the same result as running them once.

**Variables**: You can define variables in multiple places:

```yaml
# In the playbook
- hosts: webservers
  vars:
    app_version: "2.1.0"

  vars_files:
    - vars/production.yml

  tasks:
    - name: Use a variable
      ansible.builtin.debug:
        msg: "Deploying version {{ app_version }}"
```

Variables can also come from inventory, command line, or role defaults. Ansible has a specific variable precedence order.

**Conditionals** let tasks run only when certain conditions are met:

```hcl
- name: Install Docker on Ubuntu
  ansible.builtin.apt:
    name: docker.io
    state: present
  when: ansible_os_family == "Debian"

- name: Install Docker on RedHat
  ansible.builtin.yum:
    name: docker
    state: present
  when: ansible_os_family == "RedHat"

- name: Deploy monitoring agent
  ansible.builtin.get_url:
    url: "https://releases.monitoring.com/agent.sh"
    dest: /tmp/install.sh
  when: enable_monitoring | default(false)

- name: Create extra storage volume
  community.aws.ebs_volume:
    volume_size: 100
    device_name: /dev/sdf
    state: present
  when: needs_extra_storage | default(false)
```

**Loops** repeat tasks over lists:

```yaml
- name: Create multiple users
  ansible.builtin.user:
    name: "{{ item.name }}"
    groups: "{{ item.groups }}"
    state: present
  loop:
    - { name: "alice", groups: "admin" }
    - { name: "bob", groups: "developer" }
    - { name: "charlie", groups: "developer" }

- name: Install packages
  ansible.builtin.apt:
    name: "{{ item }}"
    state: present
  loop:
    - nginx
    - python3
    - redis
    - postgresql-client

- name: Copy configuration files
  ansible.builtin.copy:
    src: "{{ item.src }}"
    dest: "{{ item.dest }}"
    owner: root
    group: root
    mode: "{{ item.mode }}"
  loop:
    - { src: "files/nginx.conf", dest: "/etc/nginx/nginx.conf", mode: "0644" }
    - { src: "files/app.conf", dest: "/etc/app/config.yml", mode: "0600" }
```

**Error handling** is important for production playbooks:

```yaml
- name: Try to stop old service
  ansible.builtin.systemd:
    name: old-service
    state: stopped
  ignore_errors: yes

- name: Run database migration
  ansible.builtin.command:
    cmd: python manage.py migrate
    chdir: /opt/myapp
  register: migration_result
  failed_when: "'ERROR' in migration_result.stderr"

- name: Show migration output
  ansible.builtin.debug:
    var: migration_result.stdout_lines
  when: migration_result.rc == 0

- name: Rollback on failure
  ansible.builtin.command:
    cmd: python manage.py migrate --reverse
    chdir: /opt/myapp
  when: migration_result.rc != 0
```

**Blocks** group tasks for error handling:

```yaml
- name: Deploy application with rollback
  block:
    - name: Pull new image
      ansible.builtin.docker_image:
        name: myapp
        tag: "{{ new_version }}"
        state: present

    - name: Stop old container
      ansible.builtin.docker_container:
        name: myapp
        state: absent

    - name: Start new container
      ansible.builtin.docker_container:
        name: myapp
        image: "myapp:{{ new_version }}"
        state: started
        restart_policy: unless-stopped

  rescue:
    - name: Rollback to previous version
      ansible.builtin.docker_container:
        name: myapp
        image: "myapp:{{ current_version }}"
        state: started
        restart_policy: unless-stopped

  always:
    - name: Notify deployment status
      ansible.builtin.uri:
        url: "https://hooks.slack.com/services/{{ slack_webhook }}"
        method: POST
        body_format: json
        body:
          text: "Deployment {{ 'succeeded' if deployment_success else 'failed and rolled back' }}"
```

**Templates**: Ansible uses Jinja2 templates for dynamic configuration files:

```jinja2
# templates/nginx.conf.j2
server {
    listen {{ nginx_port | default(80) }};
    server_name {{ server_name }};

    location / {
        proxy_pass http://127.0.0.1:{{ app_port }};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /opt/myapp/static/;
        expires 30d;
    }

    access_log /var/log/nginx/{{ server_name }}-access.log;
    error_log /var/log/nginx/{{ server_name }}-error.log;
}
```

```yaml
- name: Deploy nginx config
  ansible.builtin.template:
    src: templates/nginx.conf.j2
    dest: /etc/nginx/sites-available/myapp
  vars:
    server_name: myapp.example.com
    nginx_port: 80
    app_port: 8080
```

## Roles

Roles are Ansible's way of organizing reusable code. A role packages tasks, handlers, templates, files, and variables into a structured directory that other playbooks can include.

**Role directory structure**:

```
roles/
└── nginx/
    ├── tasks/
    │   └── main.yml
    ├── handlers/
    │   └── main.yml
    ├── templates/
    │   └── nginx.conf.j2
    ├── files/
    │   └── custom-error.html
    ├── vars/
    │   └── main.yml
    ├── defaults/
    │   └── main.yml
    └── meta/
        └── main.yml
```

**defaults/main.yml** contains default values that callers can override:

```yaml
# roles/nginx/defaults/main.yml
nginx_port: 80
nginx_worker_processes: auto
nginx_worker_connections: 1024
nginx_client_max_body_size: 10M
nginx_server_name: localhost
```

**tasks/main.yml** contains the main task list:

```yaml
# roles/nginx/tasks/main.yml
---
- name: Install nginx
  ansible.builtin.apt:
    name: nginx
    state: present
    update_cache: yes

- name: Deploy nginx configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    owner: root
    group: root
    mode: "0644"
  notify: Reload nginx

- name: Deploy custom error page
  ansible.builtin.copy:
    src: custom-error.html
    dest: /usr/share/nginx/html/custom-error.html
    owner: www-data
    group: www-data
    mode: "0644"

- name: Ensure nginx is running
  ansible.builtin.systemd:
    name: nginx
    state: started
    enabled: yes
```

**handlers/main.yml** contains handlers that tasks trigger:

```yaml
# roles/nginx/handlers/main.yml
---
- name: Reload nginx
  ansible.builtin.systemd:
    name: nginx
    state: reloaded

- name: Restart nginx
  ansible.builtin.systemd:
    name: nginx
    state: restarted
```

Handlers run at the end of the play, not immediately when notified. If multiple tasks notify the same handler, it runs only once.

**meta/main.yml** contains role metadata:

```yaml
# roles/nginx/meta/main.yml
---
galaxy_info:
  author: Platform Team
  description: Nginx installation and configuration
  license: MIT
  min_ansible_version: "2.12"
  platforms:
    - name: Ubuntu
      versions:
        - focal
        - jammy
dependencies:
  - role: common
```

**Using roles in playbooks**:

```yaml
# site.yml
---
- name: Configure web servers
  hosts: webservers
  become: yes
  roles:
    - common
    - nginx
    - { role: myapp, app_port: 8080, app_version: "2.1.0" }
```

**Galaxy roles**: Ansible Galaxy is a repository of community roles:

```bash
ansible-galaxy install geerlingguy.docker
ansible-galaxy install -r requirements.yml
```

```yaml
# requirements.yml
---
roles:
  - name: geerlingguy.docker
    version: "6.1.0"
  - name: geerlingguy.nginx
    version: "3.2.0"

collections:
  - name: community.general
    version: ">=7.0.0"
  - name: community.docker
    version: ">=3.0.0"
```

## Ansible Best Practices

After working with Ansible in production, several patterns emerge that save time and prevent mistakes.

**Idempotency**: Ansible tasks should be idempotent, meaning running them twice produces the same result as running them once. Use state: present instead of state: latest for packages unless you specifically need the latest version. Use creates parameter on command tasks to skip them if the result already exists.

**Use handlers for service restarts**: Do not restart services in tasks. Use handlers that notify on change. This ensures services restart only when configuration actually changes, not on every playbook run.

**Group variables over host variables**: Put shared configuration in group_vars rather than on individual hosts. This makes it easier to see what configuration applies to a group of servers.

**Test before production**: Always run with --check --diff first. This shows what would change without actually making changes. Review the output carefully before running for real.

**Use tags for selective execution**: Tags let you run specific parts of a playbook:

```yaml
- name: Install packages
  ansible.builtin.apt:
    name: nginx
  tags: [packages, nginx]

- name: Deploy configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  tags: [config, nginx]
```

Run only tagged tasks:

```bash
ansible-playbook site.yml --tags "config"
```

## Real Scenario: Configuring Servers

Let us configure a complete web application stack: two web servers running nginx and a Python application, and one database server running PostgreSQL.

**Project structure**:

```
ansible/
├── ansible.cfg
├── inventory/
│   ├── hosts.yml
│   └── group_vars/
│       ├── webservers.yml
│       └── databases.yml
├── roles/
│   ├── common/
│   ├── nginx/
│   ├── myapp/
│   └── postgresql/
├── templates/
├── site.yml
└── requirements.yml
```

**roles/common/tasks/main.yml**:

```yaml
---
- name: Update apt cache
  ansible.builtin.apt:
    update_cache: yes
    cache_valid_time: 3600

- name: Install essential packages
  ansible.builtin.apt:
    name:
      - apt-transport-https
      - ca-certificates
      - curl
      - gnupg
      - lsb-release
      - unzip
      - vim
      - htop
      - iotop
    state: present

- name: Set timezone
  community.general.timezone:
    name: UTC

- name: Configure sysctl
  ansible.posix.sysctl:
    name: "{{ item.key }}"
    value: "{{ item.value }}"
    sysctl_set: yes
    reload: yes
  loop:
    - { key: "net.core.somaxconn", value: "65535" }
    - { key: "net.ipv4.tcp_max_syn_backlog", value: "65535" }
    - { key: "vm.swappiness", value: "10" }
```

**roles/myapp/tasks/main.yml**:

```yaml
---
- name: Create application user
  ansible.builtin.user:
    name: "{{ app_user }}"
    shell: /bin/bash
    home: "{{ app_home }}"
    create_home: yes
    system: yes

- name: Clone application repository
  ansible.builtin.git:
    repo: "{{ app_repo }}"
    dest: "{{ app_home }}"
    version: "v{{ app_version }}"
    force: yes
    recursive: yes
  become_user: "{{ app_user }}"

- name: Create virtual environment
  ansible.builtin.command:
    cmd: python3 -m venv venv
    chdir: "{{ app_home }}"
    creates: "{{ app_home }}/venv/bin/activate"

- name: Install Python dependencies
  ansible.builtin.pip:
    requirements: "{{ app_home }}/requirements.txt"
    virtualenv: "{{ app_home }}/venv"

- name: Deploy systemd service
  ansible.builtin.template:
    src: myapp.service.j2
    dest: /etc/systemd/system/myapp.service
    owner: root
    group: root
    mode: "0644"
  notify: Restart myapp

- name: Ensure application is running
  ansible.builtin.systemd:
    name: myapp
    state: started
    enabled: yes
    daemon_reload: yes
```

**roles/postgresql/tasks/main.yml**:

```yaml
---
- name: Install PostgreSQL
  ansible.builtin.apt:
    name:
      - "postgresql-{{ pg_version }}"
      - "postgresql-client-{{ pg_version }}"
      - "postgresql-contrib"
    state: present
    update_cache: yes

- name: Ensure PostgreSQL is running
  ansible.builtin.systemd:
    name: postgresql
    state: started
    enabled: yes

- name: Create database user
  community.postgresql.postgresql_user:
    name: "{{ db_user }}"
    password: "{{ db_password }}"
    role_attr_flags: CREATEDB
  become_user: postgres

- name: Create database
  community.postgresql.postgresql_db:
    name: "{{ db_name }}"
    owner: "{{ db_user }}"
    encoding: UTF-8
  become_user: postgres

- name: Configure PostgreSQL to listen on all interfaces
  ansible.builtin.lineinfile:
    path: "/etc/postgresql/{{ pg_version }}/main/postgresql.conf"
    regexp: "^#?listen_addresses"
    line: "listen_addresses = '*'"
  notify: Restart PostgreSQL
```

**site.yml**: The main playbook:

```yaml
---
- name: Configure web servers
  hosts: webservers
  become: yes
  roles:
    - common
    - nginx
    - myapp

- name: Configure database server
  hosts: databases
  become: yes
  roles:
    - common
    - postgresql
```

**Deploy**:

```bash
ansible-galaxy install -r requirements.yml
ansible-playbook -i inventory/hosts.yml site.yml --check --diff
ansible-playbook -i inventory/hosts.yml site.yml
```

**Ansible Vault** for secrets:

```bash
ansible-vault create group_vars/databases/vault.yml
ansible-vault edit group_vars/databases/vault.yml
ansible-playbook -i inventory/hosts.yml site.yml --ask-vault-pass
```

## Assessment

**Lab Task 1** (40 minutes): Create an Ansible project with a static inventory containing at least two host groups. Write a playbook that installs common packages on all hosts, installs nginx on webservers, and installs PostgreSQL on the database server. Use variables for package names and versions.

**Lab Task 2** (30 minutes): Convert the nginx and PostgreSQL configurations into roles. Each role should have tasks, handlers, defaults, and templates. Write a main playbook that applies both roles to the appropriate host groups.

**Lab Task 3** (30 minutes): Add Ansible Vault for secret management. Create an encrypted variable file for the database password. Deploy the application and verify that secrets are not exposed in playbook output.

**Grading Criteria**:
- Inventory correctly defines host groups with connection parameters (15 points)
- Playbooks use proper YAML syntax and task organization (20 points)
- Roles follow standard directory structure with tasks, handlers, defaults, and templates (25 points)
- Ansible Vault encrypts sensitive variables (20 points)
- Dry run completes without errors and actual deployment succeeds (20 points)

**Time Limit**: 100 minutes total

## Evidence

After completing this module, you should be able to:

- Write static and dynamic inventories with host groups and variables
- Create playbooks with tasks, conditionals, loops, and error handling
- Structure Ansible roles with tasks, handlers, templates, and defaults
- Use Jinja2 templates for dynamic configuration files
- Manage secrets with Ansible Vault
- Apply playbooks to multiple host groups with different configurations
- Use --check --diff for dry runs and --limit for targeted deployments

**Artifact**: An Ansible project with a complete inventory, three roles (common, nginx, postgresql), a main playbook, Jinja2 templates, and Ansible Vault-encrypted secrets.
