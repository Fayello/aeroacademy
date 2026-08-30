# Module 9 — Configuration Management with Ansible

**Course:** DevOps & Platform Engineering | **Path:** DevOps (9 of 10)

---

## What You'll Actually Do

You'll automate server configuration across multiple machines. Write a playbook once, apply it to hundreds of servers.

---

## Ansible Basics

```yaml
# playbook.yml
- hosts: webserver
  become: yes
  vars:
    app_port: 8080

  tasks:
    - name: Install packages
      apt:
        name: [nginx, curl, htop]
        state: present
        update_cache: yes

    - name: Copy nginx config
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: Restart nginx

    - name: Ensure nginx is running
      service:
        name: nginx
        state: started
        enabled: yes

    - name: Create app user
      user:
        name: appuser
        shell: /bin/bash
        groups: sudo
        append: yes

  handlers:
    - name: Restart nginx
      service:
        name: nginx
        state: restarted
```

---

## Inventory

```ini
# hosts.ini
[webserver]
web1 ansible_host=192.168.1.10
web2 ansible_host=192.168.1.11

[database]
db1 ansible_host=192.168.1.20

[all:vars]
ansible_user=deploy
ansible_ssh_private_key_file=~/.ssh/deploy_key
```

---

## Roles

```text
roles/
  nginx/
    tasks/main.yml
    handlers/main.yml
    templates/nginx.conf.j2
    defaults/main.yml
```

---

## Commands

```bash
# Ping all hosts
ansible all -m ping

# Run ad-hoc command
ansible webserver -m shell -a "uptime"

# Run playbook
ansible-playbook -i hosts.ini playbook.yml

# Check mode (dry run)
ansible-playbook playbook.yml --check

# Limit to specific host
ansible-playbook playbook.yml --limit web1
```

---

## Assessment

**Lab task (25 min):**

1. Write an Ansible inventory for 3 servers
2. Create a playbook to install and configure nginx
3. Use variables and templates
4. Add handlers
5. Run the playbook

**Grading:**
- Inventory correct: 15%
- Playbook working: 25%
- Variables/templates: 20%
- Handlers tested: 15%
- Execution successful: 25%

---

## Evidence

- **OutcomeEvidence:** `DEV-LO9 — Configuration Management`
