import { PrismaClient } from '@prisma/client';

export async function seedLinuxCourses(prisma: PrismaClient, labs: any[]) {
  console.log('Seeding Linux courses...');

  const ubuntuCliLab = labs[0];
  const permLab = labs[1];
  const textProcLab = labs[2];
  const processSvcLab = labs[3];
  const debianLab = labs[4];
  const centosLab = labs[5];
  const nginxLab = labs[6];
  const storageLab = labs[7];
  const kernelLab = labs[8];
  const dockerLab = labs[9];
  const gitLab = labs[10];
  const kaliReconLab = labs[11];
  const kaliExploitLab = labs[12];
  const parrotLab = labs[13];
  const netSecLab = labs[14];
  const metasploitableLab = labs[15];
  const ansibleLab = labs[16];
  const cisLab = labs[17];

  const coursesCreated: any[] = [];

  async function createCourseWithQuizzes(
    title: string, description: string,
    sectionsData: Array<{
      title: string; order: number;
      lessons: Array<{
        title: string; order: number; labId?: string; content: string;
        questions: Array<{ text: string; answers: Array<{ text: string; isCorrect: boolean }> }>
      }>
    }>
  ) {
    const course = await prisma.course.create({
      data: {
        title, description,
        sections: {
          create: sectionsData.map(s => ({
            title: s.title, order: s.order,
            lessons: {
              create: s.lessons.map(les => ({
                title: les.title, order: les.order, labId: les.labId, content: les.content,
              })),
            },
          })),
        },
      },
    });

    const allLessons = await prisma.lesson.findMany({ where: { section: { courseId: course.id } } });
    for (const lesson of allLessons) {
      const sectionData = sectionsData.find(s => s.lessons.some(l => l.title === lesson.title));
      const lessonData = sectionData?.lessons.find(l => l.title === lesson.title);
      if (lessonData && lessonData.questions.length > 0) {
        await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            questions: { create: lessonData.questions.map(q => ({ text: q.text, answers: { create: q.answers } })) },
          },
        });
      }
    }
    coursesCreated.push(course);
    return course;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COURSE 1: LINUX FUNDAMENTALS — FROM ZERO TO COMMAND LINE HERO
  // ═══════════════════════════════════════════════════════════════════════

  await createCourseWithQuizzes(
    'Linux Fundamentals — From Zero to Command Line Hero',
    'A comprehensive introduction to Linux. Master the command line, filesystem navigation, user/group management, permissions, shell scripting, text processing, and system information gathering.',
    [
      // ─── SECTION 1: Getting Started with Linux ───
      {
        title: 'Getting Started with Linux', order: 1,
        lessons: [
          {
            title: 'What is Linux?', order: 1, labId: ubuntuCliLab?.id,
            content: `# What is Linux?

### Learning Objectives
- Understand the history and philosophy of Linux
- Distinguish between the Linux kernel and userspace
- Identify major Linux distributions and their use cases
- Recognize the core principles of the Unix/Linux design philosophy

### Section 1: History and Origins

Linux was created in 1991 by Linus Torvalds, a Finnish computer science student at the University of Helsinki. He wanted to build a free, open-source operating system kernel as an alternative to MINIX and proprietary UNIX systems. His original Usenet post to the comp.os.minix newsgroup is one of the most famous messages in computing history:

> "I'm doing a (free) operating system (just a hobby, won't be big and professional like gnu)."

What started as a personal project quickly attracted thousands of contributors worldwide. The GNU Project, led by Richard Stallman, had already created most of the userspace tools (compiler, shell, text editor) but lacked a working kernel. Linux filled that gap, and together they formed a complete operating system.

Today, the Linux kernel is maintained by thousands of developers and is the foundation of operating systems running on everything from smartphones (Android powers over 70% of mobile devices) to supercomputers (over 96% of the world's top 500 supercomputers run Linux). It runs the majority of web servers, cloud infrastructure, and embedded systems.

The development model is unique: Linus Torvalds still oversees the kernel, but thousands of developers contribute patches through a well-defined process. Companies like Red Hat, Google, Intel, and IBM employ many kernel developers. The kernel releases a new version approximately every 9-10 weeks, each incorporating thousands of changes from hundreds of contributors.

### Section 2: The Linux Kernel vs Userspace

Understanding the distinction between kernel space and user space is fundamental to grasping how Linux works:

| Component | Description | Examples |
|-----------|-------------|----------|
| **Kernel Space** | The core of the OS. Manages hardware, memory, processes, and system calls. Runs with full hardware access (Ring 0 on x86). | Process scheduling, memory management, device drivers, file system management, network stack |
| **User Space** | Where applications run. Limited access to hardware; must communicate with the kernel via system calls. | Bash, Firefox, Python, nginx, your scripts, every application you interact with |

When you type a command in the terminal, it runs in user space. When that command needs to read a file, allocate memory, or access the network, it makes a **system call** to the kernel, which performs the privileged operation and returns the result. This separation provides security and stability — a misbehaving application cannot directly corrupt the kernel or other processes.

The system call interface is the boundary between user space and kernel space. Common system calls include:

\`\`\`
open()    — Open a file
read()    — Read from a file descriptor
write()   — Write to a file descriptor
fork()    — Create a new process
exec()    — Replace process image
close()   — Close a file descriptor
\`\`\`

### Section 3: Linux Distributions

A Linux distribution (distro) bundles the Linux kernel with system libraries, package managers, system tools, and often a desktop environment. There are hundreds of distributions, but they generally fall into a few families:

**Debian-based:** Debian, Ubuntu, Linux Mint, Kali Linux
- Uses \`apt\` package manager and \`.deb\` packages
- Ubuntu is the most popular desktop and server Linux distribution
- Known for stability and extensive software repositories

**Red Hat-based:** RHEL, CentOS, Fedora, Rocky Linux, AlmaLinux
- Uses \`dnf\` (or \`yum\`) package manager and \`.rpm\` packages
- RHEL is the leading enterprise Linux distribution
- CentOS/Rocky/Alma provide free RHEL-compatible alternatives

**Arch-based:** Arch Linux, Manjaro
- Uses \`pacman\` package manager
- Rolling release model (always up-to-date)
- Known for simplicity, DIY philosophy, and the Arch Wiki

**SUSE-based:** openSUSE, SUSE Linux Enterprise
- Uses \`zypper\` package manager
- Strong presence in European enterprise markets

**Specialized distributions:**
- Kali Linux — penetration testing and security auditing
- Alpine Linux — minimal, security-focused, popular in containers
- Gentoo — source-based, compile everything from source

### Section 4: The Linux Philosophy

Linux inherits the Unix philosophy, a set of design principles that have guided its development:

1. **Everything is a file.** Devices, processes, network sockets — all appear as files in the filesystem. This provides a uniform interface for working with different resources.

2. **Small, composable tools.** Each program does one thing well. Complex operations are built by combining simple tools through pipes.

3. **Text streams as universal interface.** Programs communicate through plain text streams, making it easy to chain tools together.

4. **Configuration as text files.** System configuration lives in human-readable text files (usually in \`/etc/\`), not binary registries.

5. **Portability.** Code should be written to be portable across POSIX-compliant systems.

This philosophy explains why the command line is so powerful in Linux: it provides a rich ecosystem of small tools that can be combined to solve complex problems. For example, you can count failed login attempts with a single pipeline:

\`\`\`bash
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -10
\`\`\`

### Hands-On Practice

1. Open a terminal and run \`uname -a\` to see your kernel version
2. Run \`cat /etc/os-release\` to identify your distribution
3. Try \`ls /proc\` to see the virtual filesystem the kernel exposes
4. Run \`whoami\` and \`id\` to see your user information
5. List running processes with \`ps aux | head -20\`

### Key Takeaways
- Linux is an open-source operating system kernel created by Linus Torvalds in 1991
- The kernel manages hardware; user space is where applications run
- Distributions bundle the kernel with tools, libraries, and package managers
- The Unix philosophy emphasizes small, composable tools and text-based interfaces
- Linux runs on everything from embedded devices to the world's fastest supercomputers

### References & Further Reading
**Textbooks:**
1. "The Linux Command Line" by William Shotts — Chapter 1: Life in the Shell, pages 1-30
2. "How Linux Works" by Brian Ward — Chapter 1: What a Linux System is, pages 1-40
3. "Linux Bible" by Christopher Negus — Chapter 1: Starting with Linux, pages 1-35

**Online Resources:**
1. [The Linux Documentation Project — Introduction to Linux](https://tldp.org/LDP/intro-linux/html/)
2. [Linux man page for uname](https://man7.org/linux/man-pages/man1/uname.1.html)
3. [Arch Wiki — About Arch Linux](https://wiki.archlinux.org/title/Arch_Linux)

**Practice:**
- Complete the associated lab: Ubuntu CLI Mastery
- Try: Install a Linux distribution in a virtual machine and explore the filesystem
- Try: Run \`man hier\` to read the Filesystem Hierarchy Standard documentation`,
            questions: [
              { text: 'Who created the Linux kernel?', answers: [{ text: 'Linus Torvalds', isCorrect: true }, { text: 'Richard Stallman', isCorrect: false }, { text: 'Bill Gates', isCorrect: false }, { text: 'Dennis Ritchie', isCorrect: false }] },
              { text: 'What percentage of the world\'s top 500 supercomputers run Linux?', answers: [{ text: 'Over 96%', isCorrect: true }, { text: 'About 50%', isCorrect: false }, { text: 'About 25%', isCorrect: false }, { text: 'Less than 10%', isCorrect: false }] },
              { text: 'In what year was Linux first released?', answers: [{ text: '1991', isCorrect: true }, { text: '1985', isCorrect: false }, { text: '1995', isCorrect: false }, { text: '2001', isCorrect: false }] },
              { text: 'What is the relationship between Linux and GNU?', answers: [{ text: 'GNU provides userspace tools and Linux provides the kernel', isCorrect: true }, { text: 'Linux provides userspace tools and GNU provides the kernel', isCorrect: false }, { text: 'They are the same project', isCorrect: false }, { text: 'They are unrelated', isCorrect: false }] },
              { text: 'Which of these is NOT a Linux distribution?', answers: [{ text: 'Windows Server', isCorrect: true }, { text: 'Ubuntu', isCorrect: false }, { text: 'Fedora', isCorrect: false }, { text: 'Debian', isCorrect: false }] },
            ],
          },
          {
            title: 'Your First Linux Commands', order: 2,
            content: `# Your First Linux Commands

### Learning Objectives
- Navigate the filesystem using \`cd\`, \`ls\`, and \`pwd\`
- Create, copy, move, and delete files and directories
- Understand absolute vs relative paths
- Use tab completion and command history

### Section 1: Navigating the Filesystem

The filesystem is organized as an inverted tree starting at \`/\` (the root directory). Every file and directory is reachable from root.

#### Essential Navigation Commands:
\`\`\`bash
pwd              # Print Working Directory — where am I?
ls               # List directory contents
ls -la           # List all files (including hidden) with details
cd /home         # Change directory to /home
cd ~             # Change to your home directory
cd ..            # Go up one directory
cd -             # Go back to previous directory
\`\`\`

### Section 2: Creating and Managing Files

\`\`\`bash
touch file.txt           # Create an empty file
mkdir mydir              # Create a directory
mkdir -p a/b/c           # Create nested directories
cp file.txt backup.txt   # Copy a file
mv file.txt newname.txt  # Rename a file
mv file.txt /tmp/        # Move a file
rm file.txt              # Delete a file
rm -rf directory/        # Delete a directory and its contents
\`\`\`

### Section 3: Viewing File Contents

\`\`\`bash
cat file.txt       # Print entire file to terminal
less file.txt      # View file page by page (q to quit)
head file.txt      # View first 10 lines
tail file.txt      # View last 10 lines
head -n 20 file    # View first 20 lines
\`\`\`

### Section 4: Getting Help

\`\`\`bash
man ls             # Read the manual for ls
ls --help          # Quick help for a command
which ls           # Find the location of a command
type cd            # Determine if a command is built-in or external
\`\`\`

**Practice:**
- Complete the associated lab: Ubuntu CLI Mastery
- Navigate to /var/log and list the system log files
- Create a directory tree: projects/web/frontend
- Practice using tab completion for long filenames`,
            questions: [
              { text: 'What does the "pwd" command do?', answers: [{ text: 'Prints the current working directory', isCorrect: true }, { text: 'Creates a new directory', isCorrect: false }, { text: 'Prints the working disk space', isCorrect: false }, { text: 'Lists password files', isCorrect: false }] },
              { text: 'Which command creates a nested directory structure a/b/c?', answers: [{ text: 'mkdir -p a/b/c', isCorrect: true }, { text: 'mkdir a/b/c', isCorrect: false }, { text: 'mkpath a/b/c', isCorrect: false }, { text: 'create -r a/b/c', isCorrect: false }] },
              { text: 'What does "cd -" do in bash?', answers: [{ text: 'Goes to the previous working directory', isCorrect: true }, { text: 'Goes to the home directory', isCorrect: false }, { text: 'Deletes the current directory', isCorrect: false }, { text: 'Changes to the root directory', isCorrect: false }] },
              { text: 'Which flag makes "ls" show hidden files?', answers: [{ text: '-a', isCorrect: true }, { text: '-h', isCorrect: false }, { text: '-l', isCorrect: false }, { text: '-r', isCorrect: false }] },
              { text: 'What is the difference between "mv" and "cp"?', answers: [{ text: 'mv moves/renames files, cp copies them', isCorrect: true }, { text: 'mv copies files, cp moves them', isCorrect: false }, { text: 'They are identical commands', isCorrect: false }, { text: 'mv is for directories, cp is for files', isCorrect: false }] },
            ],
          },
        ],
      },
      // ─── SECTION 2: Users, Groups, and Permissions ───
      {
        title: 'Users, Groups, and Permissions', order: 2,
        lessons: [
          {
            title: 'Understanding Linux Permissions', order: 1, labId: permLab?.id,
            content: `# Understanding Linux Permissions

### Learning Objectives
- Interpret Linux file permission strings
- Use chmod, chown, and chgrp effectively
- Understand special permissions (setuid, setgid, sticky bit)
- Work with Access Control Lists (ACLs)

### Section 1: The Permission Model

Every file in Linux has three sets of permissions:
\`\`\`
Owner | Group | Others
 rwx  |  r-x  |  r--
\`\`\`

- **r (read)**: View file contents or list directory
- **w (write)**: Modify file or create/delete files in directory
- **x (execute)**: Run file as program or enter directory

#### Numeric (Octal) Permissions:
\`\`\`
7 = rwx (4+2+1)    5 = r-x (4+0+1)    0 = --- (0+0+0)
6 = rw- (4+2+0)    4 = r-- (4+0+0)    700 = rwx------
\`\`\`

### Section 2: Changing Permissions

\`\`\`bash
chmod 755 script.sh     # rwxr-xr-x
chmod u+x script.sh     # Add execute for owner
chmod g-w file.txt      # Remove write for group
chmod o= file.txt       # Remove all permissions for others
chmod -R 755 directory  # Recursive change
\`\`\`

### Section 3: Ownership

\`\`\`bash
chown alice file.txt         # Change owner
chown alice:developers f.txt # Change owner and group
chgrp developers file.txt    # Change group only
chown -R alice:alice dir/    # Recursive ownership change
\`\`\`

### Section 4: Special Permissions

\`\`\`bash
chmod u+s /usr/bin/passwd   # setuid — run as file owner
chmod g+s shared/            # setgid — new files inherit group
chmod +t /tmp/               # sticky bit — only owner can delete
\`\`\`

**Practice:**
- Complete the associated lab: File Permissions & Users
- Create a file, experiment with chmod numeric and symbolic modes
- Investigate setuid on /usr/bin/passwd with \`ls -la\``,
            questions: [
              { text: 'What permission does "chmod 644" give?', answers: [{ text: 'rw-r--r--', isCorrect: true }, { text: 'rwxr-xr-x', isCorrect: false }, { text: 'rw-------', isCorrect: false }, { text: 'r--r--r--', isCorrect: false }] },
              { text: 'What does the sticky bit do on /tmp?', answers: [{ text: 'Only the file owner can delete files in the directory', isCorrect: true }, { text: 'Everyone can read the directory', isCorrect: false }, { text: 'Files are automatically compressed', isCorrect: false }, { text: 'The directory is mounted as read-only', isCorrect: false }] },
              { text: 'Which command changes both owner and group?', answers: [{ text: 'chown alice:developers file', isCorrect: true }, { text: 'chmod alice:developers file', isCorrect: false }, { text: 'chgrp alice file', isCorrect: false }, { text: 'usermod -g file', isCorrect: false }] },
              { text: 'What is the setuid permission used for?', answers: [{ text: 'Running a program with the privileges of the file owner', isCorrect: true }, { text: 'Setting the user ID of a new file', isCorrect: false }, { text: 'Deleting user accounts', isCorrect: false }, { text: 'Changing the system hostname', isCorrect: false }] },
            ],
          },
          {
            title: 'User and Group Management', order: 2,
            content: `# User and Group Management

### Learning Objectives
- Create, modify, and delete user accounts
- Manage groups and memberships
- Understand /etc/passwd, /etc/shadow, and /etc/group
- Configure password policies

### Section 1: User Account Commands

\`\`\`bash
useradd -m -s /bin/bash alice    # Create user with home dir
passwd alice                      # Set password
usermod -aG sudo alice           # Add to sudo group
userdel -r alice                 # Delete user and home dir
id alice                          # Show user UID, GID, groups
\`\`\`

### Section 2: Group Management

\`\`\`bash
groupadd developers              # Create a group
groupdel developers              # Delete a group
usermod -aG developers alice     # Add user to group
gpasswd -d alice developers      # Remove user from group
groups alice                      # Show user's groups
\`\`\`

### Section 3: Essential Configuration Files

| File | Purpose |
|------|---------|
| \`/etc/passwd\` | User account info (username, UID, GID, home, shell) |
| \`/etc/shadow\` | Encrypted passwords and aging info |
| \`/etc/group\` | Group memberships |
| \`/etc/sudoers\` | Sudo access configuration |

### Section 4: Password Policies

\`\`\`bash
chage -M 90 alice    # Force password change every 90 days
chage -l alice       # Show password aging info
chage -E 2026-12-31 alice  # Account expiration date
\`\`\`

**Practice:**
- Complete the associated lab: File Permissions & Users
- Create three users and two groups
- Configure password expiration for a test user`,
            questions: [
              { text: 'Which file stores encrypted user passwords?', answers: [{ text: '/etc/shadow', isCorrect: true }, { text: '/etc/passwd', isCorrect: false }, { text: '/etc/group', isCorrect: false }, { text: '/etc/sudoers', isCorrect: false }] },
              { text: 'What does the -m flag do in useradd?', answers: [{ text: 'Creates a home directory', isCorrect: true }, { text: 'Sets the default shell', isCorrect: false }, { text: 'Moves existing files', isCorrect: false }, { text: 'Creates a mail spool', isCorrect: false }] },
              { text: 'How do you add a user to a group without removing existing groups?', answers: [{ text: 'usermod -aG groupname username', isCorrect: true }, { text: 'usermod -G groupname username', isCorrect: false }, { text: 'groupadd username groupname', isCorrect: false }, { text: 'adduser groupname username', isCorrect: false }] },
              { text: 'What UID is typically assigned to the root user?', answers: [{ text: '0', isCorrect: true }, { text: '1', isCorrect: false }, { text: '1000', isCorrect: false }, { text: '65534', isCorrect: false }] },
            ],
          },
        ],
      },
      // ─── SECTION 3: Shell Scripting and Text Processing ───
      {
        title: 'Shell Scripting and Text Processing', order: 3,
        lessons: [
          {
            title: 'Introduction to Bash Scripting', order: 1,
            content: `# Introduction to Bash Scripting

### Learning Objectives
- Write and execute your first bash script
- Understand variables, conditionals, and loops
- Use command-line arguments in scripts
- Implement basic error handling

### Section 1: Script Basics

\`\`\`bash
#!/bin/bash
# This is a comment

# Variables
NAME="AEROACADEMY"
echo "Welcome to $NAME"

# Command substitution
DATE=$(date +%Y-%m-%d)
echo "Today is $DATE"
\`\`\`

### Section 2: Conditionals

\`\`\`bash
if [ -f "/etc/passwd" ]; then
    echo "File exists"
elif [ -d "/tmp" ]; then
    echo "It's a directory"
else
    echo "Not found"
fi

# Common test operators:
# -f file  : is a regular file
# -d dir   : is a directory
# -r file  : is readable
# -w file  : is writable
# -z str   : string is empty
# -n str   : string is not empty
# val1 -eq val2 : equal
# val1 -ne val2 : not equal
# val1 -gt val2 : greater than
\`\`\`

### Section 3: Loops

\`\`\`bash
# For loop
for i in 1 2 3 4 5; do
    echo "Number: $i"
done

# While loop
COUNT=0
while [ $COUNT -lt 5 ]; do
    echo "Count: $COUNT"
    COUNT=$((COUNT + 1))
done
\`\`\`

### Section 4: Functions

\`\`\`bash
check_service() {
    local SERVICE=$1
    if systemctl is-active --quiet "$SERVICE"; then
        echo "$SERVICE is running"
        return 0
    else
        echo "$SERVICE is not running"
        return 1
    fi
}

check_service nginx
\`\`\`

**Practice:**
- Write a script that backs up a directory with a timestamp
- Create a system health check script (disk, memory, services)
- Use loops to process a list of servers`,
            questions: [
              { text: 'What is the shebang line in a bash script?', answers: [{ text: '#!/bin/bash — specifies the interpreter', isCorrect: true }, { text: '// This is bash', isCorrect: false }, { text: '-- bash --', isCorrect: false }, { text: '$ bash script.sh', isCorrect: false }] },
              { text: 'How do you capture command output into a variable?', answers: [{ text: 'VAR=$(command)', isCorrect: true }, { text: 'VAR = command', isCorrect: false }, { text: 'command > VAR', isCorrect: false }, { text: 'echo command | VAR', isCorrect: false }] },
              { text: 'What does "$#" represent in a bash script?', answers: [{ text: 'The number of command-line arguments', isCorrect: true }, { text: 'The script name', isCorrect: false }, { text: 'The process ID', isCorrect: false }, { text: 'The current user', isCorrect: false }] },
              { text: 'How do you make a script executable?', answers: [{ text: 'chmod +x script.sh', isCorrect: true }, { text: 'bash script.sh', isCorrect: false }, { text: 'source script.sh', isCorrect: false }, { text: 'exec script.sh', isCorrect: false }] },
            ],
          },
          {
            title: 'Text Processing: grep, sed, awk', order: 2,
            content: `# Text Processing: grep, sed, awk

### Learning Objectives
- Search text patterns with grep
- Transform text with sed
- Extract and format data with awk
- Combine tools for powerful text pipelines

### Section 1: grep — Pattern Searching

\`\`\`bash
grep "error" /var/log/syslog           # Search for "error"
grep -i "error" logfile                # Case-insensitive
grep -r "TODO" ./src/                  # Recursive search
grep -n "function" script.js           # Show line numbers
grep -c "error" logfile                # Count matches
grep -v "debug" logfile                # Exclude lines
grep -E "error|warning" logfile        # Extended regex (OR)
\`\`\`

### Section 2: sed — Stream Editor

\`\`\`bash
sed 's/old/new/' file.txt              # Replace first occurrence per line
sed 's/old/new/g' file.txt             # Replace all occurrences
sed -i 's/old/new/g' file.txt          # In-place edit
sed -n '5,10p' file.txt               # Print lines 5-10
sed '/^#/d' config.txt                 # Delete comment lines
sed '3d' file.txt                      # Delete line 3
\`\`\`

### Section 3: awk — Text Processing

\`\`\`bash
awk '{print $1}' file.txt              # Print first column
awk -F: '{print $1, $3}' /etc/passwd   # Custom delimiter
awk '/error/ {print NR, $0}' log.txt   # Match pattern with line numbers
awk '{sum += $1} END {print sum}' nums # Sum a column
\`\`\`

### Section 4: Pipes and Redirection

\`\`\`bash
ls -la | grep ".txt"                   # Pipe output to grep
command > output.txt                   # Redirect stdout to file
command >> output.txt                  # Append to file
command 2> error.log                   # Redirect stderr
command 2>&1                           # Merge stderr into stdout
\`\`\`

**Practice:**
- Search all log files for failed login attempts
- Use sed to replace a placeholder in a config template
- Use awk to generate a report from /etc/passwd`,
            questions: [
              { text: 'What does "grep -i" do?', answers: [{ text: 'Performs case-insensitive matching', isCorrect: true }, { text: 'Shows line numbers', isCorrect: false }, { text: 'Searches recursively', isCorrect: false }, { text: 'Inverts the match', isCorrect: false }] },
              { text: 'How do you do an in-place edit with sed?', answers: [{ text: 'sed -i \'s/old/new/g\' file', isCorrect: true }, { text: 'sed \'s/old/new/g\' > file', isCorrect: false }, { text: 'sed --edit file', isCorrect: false }, { text: 'sed -e file', isCorrect: false }] },
              { text: 'In awk, what does $0 represent?', answers: [{ text: 'The entire current line', isCorrect: true }, { text: 'The first field', isCorrect: false }, { text: 'The last field', isCorrect: false }, { text: 'The line number', isCorrect: false }] },
              { text: 'What does "2>&1" do in shell redirection?', answers: [{ text: 'Redirects stderr to the same place as stdout', isCorrect: true }, { text: 'Redirects line 2 to line 1', isCorrect: false }, { text: 'Sends 2 bytes to stdout', isCorrect: false }, { text: 'Copies file descriptor 1 to 2', isCorrect: false }] },
            ],
          },
        ],
      },
    ],
  );

  console.log('Linux Fundamentals course seeded.');
}
