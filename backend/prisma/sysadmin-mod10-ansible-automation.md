# Module 10 — Ansible Automation

Manually configuring one server takes five minutes. Configuring 50 servers the same way takes five hours by hand or five minutes with Ansible. Automation is not optional when you manage more than a handful of servers. Ansible is agentless, uses SSH, and writes automation in human-readable YAML. This module covers inventory management, playbook authoring, Jinja2 templating, roles, Vault secrets, and a real-world server provisioning scenario. You will learn to automate server provisioning so that new servers are configured identically every time.

## Why Ansible

Ansible connects to servers over SSH and executes tasks. No agent to install, no daemon to maintain. You write what you want the servers to look like and Ansible makes them match. If a server already matches, nothing changes. If it does not, Ansible fixes it. This idempotent behavior means you can run the same playbook repeatedly without side effects.

Key concepts: the **control node** is the machine where you run Ansible commands, **managed nodes** are the servers Ansible configures, **inventory** lists the managed nodes, **modules** are units of work (install a package, copy a file, start a service), **playbooks** are sets of plays containing tasks that run on specific hosts, **roles** are reusable structures for playbooks with tasks, handlers, templates, and files, and **variables** customize behavior across hosts or groups.

## Installing Ansible

Install with `dnf install ansible-core` on RHEL/CentOS, `apt install ansible` on Debian/Ubuntu, or `pip install ansible` for the latest version. Verify with `ansible --version`. The pip installation typically gives the latest version and is recommended for development environments.

## Inventory

The inventory defines which servers Ansible manages. It can be static (files you edit) or dynamic (generated from cloud APIs or other sources).

### Static Inventory

INI format groups hosts by function. Define groups like `[webservers]` and `[dbservers]` with hostnames or IP addresses. Add group variables under `[groupname:vars]` and global variables under `[all:vars]`. YAML format provides the same structure with more readability.

Test inventory with `ansible all -m ping` to verify connectivity, `ansible webservers -m shell -a "uptime"` to run commands, and `ansible-inventory --graph` to visualize the structure.

### Dynamic Inventory

For cloud environments, generate inventory dynamically. AWS EC2 dynamic inventory uses the `amazon.aws.aws_ec2` plugin which queries the AWS API and groups instances by tags, regions, or availability zones. This is essential for auto-scaling environments where instances come and go.

### Inventory Best Practices

Use descriptive group names that reflect function (webservers, dbservers, cache-servers) rather than environment. Put host-specific variables in `host_vars/` directories and group variables in `group_vars/`. Use `group_vars/all.yml` for variables shared across all hosts. Keep secrets in Ansible Vault encrypted files.

## Playbooks

Playbooks define the desired state of managed nodes. Each play maps a group of hosts to a set of tasks. Tasks use modules to achieve the desired state. If a task would change something, Ansible reports it as changed. If the system already matches the desired state, Ansible reports it as ok.

### Basic Playbook Structure

A playbook has a name, targets hosts, optionally escalates privileges with `become: yes`, defines variables, lists tasks, and defines handlers. Each task has a name for documentation and uses a module with parameters.

### Task Patterns

**Handlers** run only when notified by a task and only once at the end of a play. This prevents unnecessary service restarts when multiple configuration files change. Use `notify` in tasks and define handlers in a separate section.

**Loops** iterate over lists with the `loop` directive. Use `item` to reference the current element. For complex loops with dictionaries, use `loop` with list of dicts and reference with `item.keyname`.

**Conditionals** use `when` to run tasks based on facts like `ansible_os_family`, registered variables, or boolean conditions. This allows the same playbook to work across different distributions.

**Error handling** uses `ignore_errors`, `register`, and `block/rescue/always` for try-catch patterns. Block wraps tasks that might fail, rescue handles failures, and always runs regardless of outcome.

**Privilege escalation** uses `become: yes` to run tasks as root. You can set become per-task or per-play. Combine with `become_user` to run as a specific user other than root.

## Jinja2 Templates

Ansible uses Jinja2 for templating. Templates generate configuration files with dynamic content using variables, loops, conditionals, and filters. Deploy with the `template` module specifying `src` and `dest` paths.

### Template Syntax

Variables use `{{ variable_name }}`. Conditionals use `{% if condition %}...{% endif %}`. Loops use `{% for item in list %}...{% endfor %}`. Comments use `{# comment #}`.

### Common Filters

`default('fallback')` provides default values. `join(', ')` joins lists. `to_json` converts to JSON. `upper` and `lower` change case. `basename` extracts filename from path. `hash('sha256')` hashes strings. `map(attribute='name')` extracts attributes from lists. `combine(override_dict)` merges dictionaries. `format(idx)` formats strings.

### Template Best Practices

Keep templates simple and readable. Use variables for values that change between hosts. Use loops for repeated patterns. Include comments explaining non-obvious configuration. Test templates with `ansible-playbook --check --diff` to see what would change without applying.

## Roles

Roles organize playbooks into reusable components with a standard directory structure. This promotes consistency and sharing across projects.

### Directory Structure

```
roles/nginx/
  tasks/main.yml       # Main task list
  handlers/main.yml    # Handlers
  templates/           # Jinja2 templates
  files/               # Static files
  vars/main.yml        # Role variables
  defaults/main.yml    # Default variables (lowest priority)
  meta/main.yml        # Dependencies and metadata
```

### Creating Roles

Use `ansible-galaxy role init nginx` to scaffold the structure. Define tasks in `tasks/main.yml`, handlers in `handlers/main.yml`, templates in `templates/`, and defaults in `defaults/main.yml`. Defaults have the lowest priority and are overridden by vars, extra vars, and playbook variables.

### Role Dependencies

Define dependencies in `meta/main.yml` with the `dependencies` key. Dependencies run before the role itself. Use vars to pass configuration to dependencies. Limit dependency depth to avoid circular dependencies.

### Using Roles in Playbooks

Apply roles with the `roles` directive in playbooks. Pass variables inline with role syntax. Roles execute in order. Combine with pre_tasks and post_tasks for setup and verification.

### Ansible Galaxy

Download community roles with `ansible-galaxy install`. Manage dependencies with `requirements.yml` for reproducible installations. Collections like `community.general` and `ansible.posix` provide additional modules.

## Ansible Vault

Vault encrypts sensitive data like passwords, API keys, and certificates. Encrypted files can be safely committed to version control.

### Vault Operations

Create encrypted files with `ansible-vault create`, edit with `ansible-vault edit`, encrypt existing files with `ansible-vault encrypt`, decrypt with `ansible-vault decrypt`, view with `ansible-vault view`, and change passwords with `ansible-vault rekey`. Use `ansible-vault encrypt_string` to encrypt individual variables inline.

### Using Vault in Playbooks

Reference vault variables in playbooks through `vars_files`. Run playbooks with `--ask-vault-pass` for interactive password entry or `--vault-password-file` for automated decryption. Store the vault password file securely with restricted permissions.

### Variable Precedence

Vault variables follow Ansible's variable precedence rules. Extra vars (`-e`) have highest priority, then playbook vars, then role vars, then inventory vars, then defaults. Understanding precedence prevents unexpected behavior when overriding encrypted values.

## Server Provisioning Scenario

Real scenario: provision 10 new web servers from scratch with base packages, nginx, application deployment, monitoring agent, and security hardening all using Ansible.

### Project Structure

Organize with `inventory.yml` for host definitions, `site.yml` as the main playbook, `requirements.yml` for Galaxy dependencies, `group_vars/` for variable definitions, and `roles/` for common, nginx, app, monitoring, and security roles.

### Main Playbook

The `site.yml` playbook targets webservers with `become: yes`, runs pre_tasks for apt cache update and hostname setting, applies roles in order (common, security, nginx, app, monitoring), and runs post_tasks to verify services are running.

### Common Role

Installs base packages (vim, curl, wget, htop, net-tools, git), configures sysctl for performance tuning, creates the deploy user with sudo access, and sets authorized SSH keys.

### Security Role

Installs security packages (fail2ban, ufw), configures SSH hardening through lineinfile module, sets up UFW with specific rules for SSH, HTTP, and HTTPS, enables the firewall, and restarts sshd through handlers when configuration changes.

### Nginx Role

Deploys nginx configuration from Jinja2 templates, creates virtual host configurations, manages site-specific settings, and handles service lifecycle. Templates use variables for worker processes, connections, and virtual host definitions.

### Group Variables

Defines timezone, SSH keys, firewall rules, nginx configuration parameters, application version, and other host-group-specific settings. Use vault-encrypted files for sensitive values like database passwords and API keys.

### Running the Provisioning

Install Galaxy dependencies first, run in check mode for dry run, test on one server to validate, then run on all servers. Verify with ping, service status, disk space checks, and SSH configuration validation. Document the complete process in a runbook.

## Practical Assessment

**Lab Task:** Ansible automation project (70 minutes)

1. Create a structured Ansible project with inventory and roles
2. Write an inventory file with at least 2 host groups
3. Create a common role that installs base packages and configures sysctl
4. Create an nginx role with a Jinja2 template for the configuration
5. Create a security role that hardens SSH and configures a firewall
6. Write a main playbook that applies all roles in order
7. Use Ansible Vault to encrypt database credentials
8. Create a handler that restarts nginx when the config changes
9. Use loops to create multiple user accounts
10. Use conditionals to handle different OS families
11. Run the playbook in check mode (dry run)
12. Run the playbook for real and verify the configuration

**Grading criteria:** Project structure follows conventions (10 points), inventory correctly defines host groups and variables (10 points), common role installs packages and configures sysctl (15 points), nginx role with Jinja2 template deploys correctly (15 points), security role hardens SSH and firewall (15 points), Vault encrypts sensitive data (10 points), handlers trigger on configuration changes (10 points), loops and conditionals used correctly (10 points), playbook runs successfully and configures target servers (5 points).

## Advanced Ansible Patterns

### Dynamic Inventory for Cloud

For AWS, use the `amazon.aws.aws_ec2` plugin. Configure in `aws_ec2.yml` with regions, filters, and keyed_groups for automatic grouping by tags. This eliminates static inventory maintenance for cloud environments.

### Ansible for Configuration Drift Detection

Run playbooks in `--check` mode regularly to detect configuration drift. Schedule weekly runs that report but do not fix drift. This alerts you when servers deviate from their intended state without automatically changing them.

### Callback Plugins

Use callback plugins to customize Ansible output. The `timer` plugin shows execution time. The `profile_tasks` plugin shows time per task. The `json` plugin outputs JSON for integration with other tools. Enable in `ansible.cfg` or on the command line.

### Fact Caching

Cache gathered facts to speed up subsequent playbook runs. Use JSON file cache or Redis. Configure in `ansible.cfg` with `gathering = smart` and `fact_caching = jsonfile`. This is useful for large inventories where fact gathering takes significant time.

### Custom Modules

Write custom modules in Python when existing modules don't meet your needs. Modules receive arguments via JSON, execute logic, and return JSON results. Place in `library/` directory in your playbook root. Custom modules let you implement any automation logic.

## Ansible Best Practices

### Project Organization

```
project/
  ansible.cfg          # Project-specific config
  inventory/
    production/
      hosts.yml
    staging/
      hosts.yml
  group_vars/
    all.yml
    webservers.yml
  host_vars/
    web1.yml
  roles/
    common/
    nginx/
    app/
  playbooks/
    site.yml
    webservers.yml
    dbservers.yml
  files/
  templates/
  vault/
    secrets.yml        # Encrypted
```

### Idempotency

Write tasks to be idempotent — running them multiple times produces the same result. Use modules like `copy`, `template`, `package`, and `service` which are inherently idempotent. Avoid `shell` and `command` modules unless you implement idempotency checks with `creates`, `removes`, or `when` conditions.

### Testing

Test playbooks with `--check --diff` for dry runs. Use Molecule for role testing with Docker. Create test inventories with test variables. Run against staging before production. Use `ansible-lint` to check for common mistakes and best practices.

## Practical Assessment

**Lab Task:** Ansible automation project (70 minutes)

1. Create a structured Ansible project with inventory and roles
2. Write an inventory file with at least 2 host groups
3. Create a common role that installs base packages and configures sysctl
4. Create an nginx role with a Jinja2 template for the configuration
5. Create a security role that hardens SSH and configures a firewall
6. Write a main playbook that applies all roles in order
7. Use Ansible Vault to encrypt database credentials
8. Create a handler that restarts nginx when the config changes
9. Use loops to create multiple user accounts
10. Use conditionals to handle different OS families
11. Run the playbook in check mode (dry run)
12. Run the playbook for real and verify the configuration

**Grading criteria:** Project structure follows conventions (10 points), inventory correctly defines host groups and variables (10 points), common role installs packages and configures sysctl (15 points), nginx role with Jinja2 template deploys correctly (15 points), security role hardens SSH and firewall (15 points), Vault encrypts sensitive data (10 points), handlers trigger on configuration changes (10 points), loops and conditionals used correctly (10 points), playbook runs successfully and configures target servers (5 points).

## Troubleshooting Ansible

### Common Issues and Fixes

**SSH connection failures:** Verify inventory, check SSH key permissions (600 for private, 644 for public), ensure `ansible_user` is correct, test with `ssh -i key user@host`. Check firewall rules allow SSH.

**Permission denied:** Ensure `become: yes` is set, verify sudo is configured, check that the remote user has sudo privileges.

**Module failures:** Run with `-vvv` for verbose output. Check module documentation with `ansible-doc module_name`. Verify parameters are correct for the module version.

**Variable precedence issues:** Use `ansible -m debug -a "var=variable_name"` to check variable values. Understand the 22 levels of variable precedence. Use `ansible --playbook-dir` to set playbook directory.

### Debugging Techniques

Use `debug` module to print variable values. Use `register` to capture task output and inspect in later tasks. Use `--step` for interactive confirmation. Use `--start-at-task` to resume from a specific task. Use `--limit` to test on a single host.

## Practical Assessment

**Lab Task:** Ansible automation project (70 minutes)

1. Create a structured Ansible project with inventory and roles
2. Write an inventory file with at least 2 host groups
3. Create a common role that installs base packages and configures sysctl
4. Create an nginx role with a Jinja2 template for the configuration
5. Create a security role that hardens SSH and configures a firewall
6. Write a main playbook that applies all roles in order
7. Use Ansible Vault to encrypt database credentials
8. Create a handler that restarts nginx when the config changes
9. Use loops to create multiple user accounts
10. Use conditionals to handle different OS families
11. Run the playbook in check mode (dry run)
12. Run the playbook for real and verify the configuration

**Grading criteria:** Project structure follows conventions (10 points), inventory correctly defines host groups and variables (10 points), common role installs packages and configures sysctl (15 points), nginx role with Jinja2 template deploys correctly (15 points), security role hardens SSH and firewall (15 points), Vault encrypts sensitive data (10 points), handlers trigger on configuration changes (10 points), loops and conditionals used correctly (10 points), playbook runs successfully and configures target servers (5 points).

## Evidence

Collect the following for your portfolio: complete project directory structure, `inventory.yml` file contents, all role task files (`tasks/main.yml`), Jinja2 template used for nginx configuration, vault-encrypted `secrets.yml` showing it is encrypted, output of `ansible-playbook site.yml --check --diff`, output of `ansible-playbook site.yml` showing successful execution, and verification commands showing the configuration was applied correctly.
