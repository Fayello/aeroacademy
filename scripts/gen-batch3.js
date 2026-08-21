const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }

const labs = {
  '4e2ae291-a334-4a47-ac1d-5401bfb786b8': [
    { t: 'Repo Creator', d: 'Run: mkdir /home/student/myrepo && cd /home/student/myrepo && git init. Run: ls -la /home/student/myrepo/.git/HEAD. What does it contain?', a: 'ref: refs/heads/main', p: 50 },
    { t: 'Commit Crafter', d: 'In myrepo, create file.txt with "hello git". Run: git add . && git commit -m "first". Run: git log --oneline | wc -l. How many commits?', a: '1', p: 75 },
    { t: 'Branch Master', d: 'Run: git branch feature && git checkout feature. Run: git branch --show-current. What branch is active?', a: 'feature', p: 75 },
    { t: 'Merge Pro', d: 'On feature branch, edit file.txt to "feature edit". Commit. Switch to main, merge feature. Run: git log --oneline | wc -l. How many commits now?', a: '2', p: 100 },
    { t: 'Diff Detective', d: 'Edit file.txt to "changed". Run: git diff --stat. What file shows as changed?', a: 'file.txt', p: 75 },
    { t: 'Stash Expert', d: 'Make uncommitted changes. Run: git stash && git stash list | wc -l. How many stashes?', a: '1', p: 100 },
    { t: 'Tag Master', d: 'Run: git tag v1.0 && git tag -l | head -1. What tag is listed?', a: 'v1.0', p: 100 },
    { t: 'Remote Connector', d: 'Run: git remote add origin /tmp/remote.git && git remote -v | head -1. What URL is shown?', a: 'origin\t/tmp/remote.git (fetch)', p: 100 },
    { t: 'Blame Reader', d: 'Run: git blame file.txt | head -1. What commit hash is shown?', a: '1', p: 100 },
    { t: 'Log Artist', d: 'Run: git log --oneline --all | wc -l. How many total commits across all branches?', a: '3', p: 100 },
    { t: 'Reset Master', d: 'Run: git reset HEAD~1 && git log --oneline | wc -l. How many commits after reset?', a: '1', p: 100 },
    { t: 'Cherry Picker', d: 'Create another commit on main. Run: git cherry-pick HEAD && git log --oneline | wc -l. How many commits?', a: '3', p: 100 },
    { t: 'Submodule Starter', d: 'Run: git submodule add /tmp/submod.git modules/sub 2>/dev/null; echo "submodule_done". What is the output?', a: 'submodule_done', p: 100 },
    { t: 'Config Inspector', d: 'Run: git config --list | grep "user.name" | head -1. What user name is set?', a: '1', p: 75 },
    { t: 'Cleanup', d: 'Run: rm -rf /home/student/myrepo && echo "git_done". What is the output?', a: 'git_done', p: 75 },
  ],
  '1c30ccdf-1ad5-41e0-adb5-5dcba2071a7b': [
    { t: 'Playbook Writer', d: 'Create /home/student/playbook.yml with: hosts: localhost, tasks: [shell: echo hello]. Run: ansible-playbook playbook.yml --connection=local 2>&1 | grep "hello" | wc -l. How many "hello" lines?', a: '1', p: 75 },
    { t: 'Module Explorer', d: 'Run: ansible localhost -m shell -a "whoami" --connection=local 2>&1 | tail -1. What user is shown?', a: 'root', p: 75 },
    { t: 'Fact Gatherer', d: 'Run: ansible localhost -m setup -a "filter=ansible_hostname" --connection=local 2>&1 | grep "ansible_hostname" | head -1. What hostname is shown?', a: '1', p: 100 },
    { t: 'Variable Master', d: 'Create playbook with vars: name: student. Task: shell: echo {{ name }}. Run it. What is the output of the echo task?', a: 'student', p: 100 },
    { t: 'Template Crafter', d: 'Create Jinja2 template /home/student/test.j2 with "Hello {{ name }}". Create playbook that templates it to /tmp/output.txt with name=world. Run: cat /tmp/output.txt. What is the content?', a: 'Hello world', p: 100 },
    { t: 'Handler Master', d: 'Create playbook with handler that writes to /tmp/handler.txt. Use notify to trigger on file change. Run playbook twice (first triggers handler). Run: cat /tmp/handler.txt 2>/dev/null | head -1. What is the content?', a: '1', p: 100 },
    { t: 'Loop Expert', d: 'Create playbook with loop: [apple, banana, cherry]. Task: shell: echo {{ item }}. Run it. How many loop iterations (check output)?', a: '3', p: 100 },
    { t: 'Role Builder', d: 'Create role structure: roles/myrole/{tasks,handlers,templates}. Create tasks/main.yml with shell echo role_task. Run: ansible-playbook --connection=local -i "localhost," playbook.yml 2>&1 | grep "role_task" | wc -l.', a: '1', p: 100 },
    { t: 'Inventory Inspector', d: 'Create inventory: [web] localhost ansible_connection=local. Run: ansible-inventory --list 2>&1 | grep "web" | head -1. What group is listed?', a: 'web', p: 100 },
    { t: 'Vault Master', d: 'Run: ansible-vault create /tmp/secret.yml --vault-password-file=<(echo "mypass") 2>&1; echo "vault_created". What is the output?', a: 'vault_created', p: 100 },
    { t: 'Connection Tester', d: 'Run: ansible localhost -m ping --connection=local 2>&1 | tail -1. What is the ping result?', a: 'SUCCESS => {', p: 75 },
    { t: 'Debug Logger', d: 'Create playbook with debug task: msg: "Ansible works". Run it. What message appears in the output?', a: 'Ansible works', p: 100 },
    { t: 'File Module', d: 'Create playbook: file path=/home/student/ansible_file state=touch mode=0644. Run: stat -c "%a" /home/student/ansible_file. What permissions?', a: '644', p: 100 },
    { t: 'Package Inspector', d: 'Create playbook: apt_facts: cache_valid_time=0. Run: ansible localhost -m apt -a "name=curl state=present" --connection=local 2>&1 | grep "changed" | wc -l. How many changed?', a: '1', p: 100 },
    { t: 'Cleanup', d: 'Run: rm -f /home/student/playbook.yml /home/student/test.j2 /tmp/output.txt /tmp/handler.txt /tmp/secret.yml; echo "ansible_done". What is the output?', a: 'ansible_done', p: 75 },
  ],
};

const lines = [];
for (const [labId, flags] of Object.entries(labs)) {
  for (const f of flags) {
    const id = crypto.randomUUID();
    lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${labId}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
  }
}
console.log(lines.join('\n'));
