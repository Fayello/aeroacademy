# Module 6 — Ansible

## What You'll Actually Do

You'll write Ansible playbooks that configure a system — installing packages, managing files, setting up users. You'll work with inventory files, templates, and handlers. The goal is to understand configuration management as a complement to infrastructure provisioning.

## What Ansible Does

Terraform creates infrastructure. Ansible configures what's on it. You spin up an EC2 instance with Terraform, then use Ansible to install nginx, deploy your app, and configure the firewall.

Ansible is agentless. It connects to machines over SSH and runs commands. No daemon to install, no client to manage. You give it an inventory of hosts and a playbook of tasks, and it makes those hosts match the desired state.

## Inventory

An inventory file lists the machines Ansible manages.

```ini
# inventory.ini
[webservers]
web1 ansible_host=10.0.1.10
web2 ansible_host=10.0.1.11

[dbservers]
db1 ansible_host=10.0.2.10

[all:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/id_rsa
```

For dynamic inventory (cloud environments), Ansible connects to APIs to discover hosts automatically.

## Playbooks

A playbook is a YAML file describing what to do on your hosts.

```yaml
# playbook.yml
---
- name: Configure web servers
  hosts: webservers
  become: yes

  vars:
    app_version: "2.1.0"

  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600

    - name: Install nginx
      apt:
        name: nginx
        state: present

    - name: Deploy nginx config
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/sites-available/default
      notify: Restart nginx

    - name: Ensure nginx is running
      service:
        name: nginx
        state: started
        enabled: yes

  handlers:
    - name: Restart nginx
      service:
        name: nginx
        state: restarted
```

Run it with:

```bash
ansible-playbook -i inventory.ini playbook.yml
```

## Modules

Ansible has hundreds of built-in modules. Each module manages a specific resource type.

```yaml
tasks:
  - name: Create app user
    user:
      name: appuser
      shell: /bin/bash
      groups: sudo
      state: present

  - name: Copy application config
    template:
      src: app.conf.j2
      dest: /etc/app/config.yaml
      owner: appuser
      group: appuser
      mode: '0644'

  - name: Ensure firewall allows HTTP
    ufw:
      rule: allow
      port: '80'
      proto: tcp

  - name: Start the application
    systemd:
      name: myapp
      state: started
      enabled: yes
```

## Templates

Jinja2 templates let you generate config files from variables.

```jinja2
{# templates/nginx.conf.j2 #}
server {
    listen 80;
    server_name {{ server_name }};

    location / {
        proxy_pass http://127.0.0.1:{{ app_port }};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```yaml
- name: Deploy nginx config
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/conf.d/app.conf
  vars:
    server_name: app.example.com
    app_port: 3000
```

## Roles

Roles organize playbooks into reusable pieces. A role is a directory structure with tasks, handlers, templates, and variables.

```
roles/
  nginx/
    tasks/
      main.yml
    handlers/
      main.yml
    templates/
      nginx.conf.j2
    defaults/
      main.yml
```

```yaml
# playbook.yml
---
- hosts: webservers
  roles:
    - nginx
    - app-deploy
    - firewall
```

## Idempotency

Ansible is idempotent by design. Running the same playbook twice produces the same result. The `state` parameter controls this — `present` ensures something exists, `absent` ensures it doesn't.

```yaml
# First run: creates the file
# Second run: no change
- name: Deploy config
  copy:
    src: config.yaml
    dest: /etc/app/config.yaml

# Ensures the package is removed
- name: Remove old package
  apt:
    name: legacy-app
    state: absent
```

## Assessment

**Lab Task**: Write an Ansible playbook that creates a local "server" setup using local execution (`connection: local`). The playbook should: (1) create a directory structure at `/tmp/ansible-lab/` representing a web server, (2) generate an `index.html` file from a Jinja2 template that includes a hostname variable, (3) create a `config.json` with at least 5 configuration values, (4) set up a simulated "service" by creating a script file that writes a timestamp to a log file. Run the playbook twice and verify idempotency.

**Time**: 35 minutes

**Grading**:
- Playbook runs without errors on first execution (20 points)
- Directory structure and files created correctly (25 points)
- Jinja2 template generates correct output with variable substitution (25 points)
- Second run shows no changes (idempotent) (30 points)

## Evidence

- First `ansible-playbook` run output
- Second `ansible-playbook` run output showing no changes
- Contents of generated files (`index.html`, `config.json`, the script)
- The playbook YAML and template files committed
