# Module 10 — Automation with Ansible

**Course:** Linux Systems Administration | **Path:** Linux Sysadmin (10 of 10) | **Status:** DRAFT → FACT_CHECK → TECHNICAL_REVIEW → PUBLISHED
**Estimated time:** 30 min | **Prerequisite:** Module 9 — Virtualization

---

## What You'll Actually Do

You have50 servers. You need to update them all, deploy a new service, and change a config. One by one? No. You'll write Ansible playbooks that do it across all servers in parallel.

---

## Ansible — Agentless Automation

Ansible SSHs into servers and runs commands. No agent to install. No daemon to manage.

**Install:**
```bash
pip install ansible
```

**Inventory (who to manage):**
```ini
# /etc/ansible/hosts
[web]
web1 ansible_host=10.0.0.10
web2 ansible_host=10.0.0.11

[db]
db1 ansible_host=10.0.0.20

[all:vars]
ansible_user=deploy
ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

**Test connectivity:**
```bash
ansible all -m ping
# web1 | SUCCESS => {"ping": "pong"}
# web2 | SUCCESS => {"ping": "pong"}
# db1 | SUCCESS => {"ping": "pong"}
```

---

## Ad-Hoc Commands

```bash
# Run a command on all servers
ansible all -m shell -a "uptime"

# Check disk usage
ansible web -m shell -a "df -h /"

# Install a package
ansible web -m apt -a "name=nginx state=present" --become

# Copy a file
ansible web -m copy -a "src=./config.conf dest=/etc/nginx/config.conf" --become
```

---

## Playbooks — The Real Power

```yaml
# deploy-web.yml
---
- hosts: web
  become: yes
  vars:
    app_version: "1.2.3"
    app_port: 8080

  tasks:
    - name: Install dependencies
      apt:
        name: [nginx, nodejs, npm]
        state: present
        update_cache: yes

    - name: Copy nginx config
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/sites-available/myapp
      notify: Reload nginx

    - name: Deploy application
      copy:
        src: "dist/myapp-{{ app_version }}.tar.gz"
        dest: /opt/myapp/
      notify: Restart app

    - name: Enable and start services
      systemd:
        name: "{{ item }}"
        state: started
        enabled: yes
      loop:
        - nginx
        - myapp

  handlers:
    - name: Reload nginx
      systemd:
        name: nginx
        state: reloaded

    - name: Restart app
      systemd:
        name: myapp
        state: restarted
```

**Run it:**
```bash
ansible-playbook deploy-web.yml
```

---

## Roles — Reusable Playbooks

```
roles/
  nginx/
    tasks/main.yml
    handlers/main.yml
    templates/nginx.conf.j2
    defaults/main.yml
  postgresql/
    tasks/main.yml
    templates/pg_hba.conf.j2
```

**Use a role:**
```yaml
---
- hosts: web
  become: yes
  roles:
    - nginx
    - postgresql
    - { role: myapp, app_port: 8080 }
```

---

## Variables and Templates

**Jinja2 template:**
```jinja2
# templates/nginx.conf.j2
upstream app {
{% for host in groups['web'] %}
    server {{ hostvars[host]['ansible_host'] }}:{{ app_port }};
{% endfor %}
}

server {
    listen 80;
    location / {
        proxy_pass http://app;
    }
}
```

**Variable files:**
```yaml
# group_vars/web.yml
app_port: 8080
app_version: "1.2.3"

# host_vars/web1.yml
app_port: 8081
```

---

## Real Task: Automate Server Fleet

```yaml
# fleet-setup.yml
---
- hosts: all
  become: yes
  tasks:
    - name: Update system
      apt:
        upgrade: yes
        update_cache: yes

    - name: Install monitoring
      apt:
        name: prometheus-node-exporter
        state: present

    - name: Configure SSH
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: "{{ item.regexp }}"
        line: "{{ item.line }}"
      loop:
        - { regexp: '#PermitRootLogin', line: 'PermitRootLogin no' }
        - { regexp: '#PasswordAuthentication', line: 'PasswordAuthentication no' }
      notify: Restart sshd

    - name: Deploy firewall rules
      ufw:
        rule: allow
        port: "{{ item }}"
        proto: tcp
      loop:
        - "22"
        - "80"
        - "443"

    - name: Enable firewall
      ufw:
        state: enabled
        policy: deny

  handlers:
    - name: Restart sshd
      systemd:
        name: sshd
        state: restarted
```

```bash
ansible-playbook fleet-setup.yml
```

One playbook,50 servers,5 minutes. That's automation.

---

## Ansible Vault — Secrets

```bash
# Create encrypted variable
ansible-vault create group_vars/db.yml

# Edit
ansible-vault edit group_vars/db.yml

# Run with vault password
ansible-playbook deploy.yml --ask-vault-pass

# Or use vault password file
ansible-playbook deploy.yml --vault-password-file=.vault_pass
```

---

## Assessment

**Lab task (25 min):**

1. Set up Ansible inventory with3 servers
2. Test connectivity with ping
3. Write a playbook that installs nginx and deploys a config
4. Create a role for nginx with templates
5. Use Jinja2 templates for dynamic configs
6. Automate SSH hardening across all servers
7. Use Ansible Vault for secrets

**Grading:**
- Inventory configured: 10%
- Connectivity working: 10%
- Playbook deployed: 25%
- Role created: 20%
- Templates working: 15%
- SSH hardened: 10%
- Vault used: 10%

---

## Evidence

- **OutcomeEvidence:** `SYS-LO10 — Automation with Ansible`
- **Mastery:** `UserSkill: linux-ansible-automation` — final competency for Linux Systems Administration

---

## Course Complete

You can now:
- Boot and troubleshoot Linux systems
- Manage storage, LVM, and filesystems
- Administer users at scale
- Manage complex service stacks
- Configure production networking
- Harden servers to CIS standards
- Set up backup and recovery
- Monitor with Prometheus/Grafana
- Virtualize with KVM
- Automate with Ansible

**Next course:** Linux Internals (under the hood) or Networking (deeper).

---

## Sources

- `man ansible`, `man ansible-playbook`
- Ansible documentation

---

## AI Provenance

- **Draft:** LLM (2025-08-31)
- **Voice:** Engineer who's automated his way out of50-server updates
- **Status:** DRAFT → FACT_CHECK ✓ → TECHNICAL_REVIEW → PUBLISHED
