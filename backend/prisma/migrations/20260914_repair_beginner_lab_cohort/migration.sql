-- Make the first learner lab cohort deterministic in the single-container
-- practice runtime. Existing IDs are preserved so progress remains intact.

UPDATE "Lab"
SET
  "description" = 'Learn essential Ubuntu navigation, files, permissions, processes, and links in a fresh practice container.',
  "briefing" = $briefing$
### Ubuntu Command-Line Essentials
Work in a fresh Ubuntu 22.04 container as `student` (password: lab123). Create every exercise artifact yourself so each result is reproducible.

Use `sudo` only when a task needs system-level access. The checks use stable file content and command output rather than host-specific values.
$briefing$,
  "tasks" = '["Change to /etc and confirm the current directory with pwd","Create /home/student/myproject and a hello.txt file containing Hello XpertClass","Copy hello.txt to /tmp/hello_backup.txt and compare both files","Find configuration files under /etc without depending on their exact count","Inspect /etc/shadow ownership without changing the file","Find the sshd process by command name rather than PID","Create /tmp/hello_link pointing to /home/student/hello.txt and inspect its target"]'::jsonb
WHERE "title" = 'Linux Fundamentals: Ubuntu CLI Mastery';

UPDATE "LabFlag" AS flag
SET
  "title" = patch."newTitle",
  "description" = patch."description",
  "correctAnswer" = patch."answerHash"
FROM (VALUES
  ('Filesystem Navigator', 'Directory Navigator', 'Run: cd /etc && pwd. Submit the output.', '$2b$10$t7jR.jW3BMCU/f7FP5EVJ.n4R55LV026hee2XL3GwFVKMxySZ8X/q'),
  ('Directory Navigator', 'Directory Navigator', 'Run: cd /etc && pwd. Submit the output.', '$2b$10$t7jR.jW3BMCU/f7FP5EVJ.n4R55LV026hee2XL3GwFVKMxySZ8X/q'),
  ('File Creator', 'File Creator', 'Create /home/student/proof.txt containing AERO{UBUNTU_FILE_CREATE}. Submit the file content.', '$2b$10$rkT6B42FYKVRfbt6cABp0u6lGtipwnJywjCAA7gUNZY8bDznluh82'),
  ('Tree Builder', 'File Creator', 'Create /home/student/proof.txt containing AERO{UBUNTU_FILE_CREATE}. Submit the file content.', '$2b$10$rkT6B42FYKVRfbt6cABp0u6lGtipwnJywjCAA7gUNZY8bDznluh82'),
  ('Permission Reader', 'Permission Reader', 'Run: stat -c "%U" /etc/shadow. Submit the owner.', '$2b$10$xdDXiRpoLw9aAsPXRrEyhOuLNfsDfTXfRvEMqLhg5Ca28xHHwViU.'),
  ('File Finder', 'Permission Reader', 'Run: stat -c "%U" /etc/shadow. Submit the owner.', '$2b$10$xdDXiRpoLw9aAsPXRrEyhOuLNfsDfTXfRvEMqLhg5Ca28xHHwViU.'),
  ('Process Inspector', 'Process Inspector', 'Run: ps -C sshd -o comm= | head -1. Submit the command name.', '$2b$10$x7Yjyd1WE1hhqT6LEt3R.e.XDRg08O0TP5ZM5R2tj5443uhHK.uai'),
  ('Log Detective', 'Process Inspector', 'Run: ps -C sshd -o comm= | head -1. Submit the command name.', '$2b$10$x7Yjyd1WE1hhqT6LEt3R.e.XDRg08O0TP5ZM5R2tj5443uhHK.uai'),
  ('Disk Space Expert', 'Link Inspector', 'Create /tmp/hello_link pointing to /home/student/hello.txt, then run readlink /tmp/hello_link. Submit the output.', '$2b$10$Ka8F7nFqqfGkNYIkAMKcMuO9lIor9eTk18usDta9HgDwYgICJPGRq'),
  ('Link Creator', 'Link Inspector', 'Create /tmp/hello_link pointing to /home/student/hello.txt, then run readlink /tmp/hello_link. Submit the output.', '$2b$10$Ka8F7nFqqfGkNYIkAMKcMuO9lIor9eTk18usDta9HgDwYgICJPGRq')
) AS patch("oldTitle", "newTitle", "description", "answerHash")
WHERE flag."labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Linux Fundamentals: Ubuntu CLI Mastery'
)
AND flag."title" = patch."oldTitle";

UPDATE "Lab"
SET
  "description" = 'Practice Linux ownership, groups, numeric modes, sticky directories, and ACLs using artifacts you create yourself.',
  "briefing" = $briefing$
### Linux Permissions and Users
This fresh Ubuntu 22.04 container includes user-management and ACL tools. You are `student` (password: lab123) and may use `sudo`.

Create the users, groups, files, and directories named in each task. Checks use names and permission strings, never environment-dependent numeric IDs.
$briefing$,
  "tasks" = '["Create secret.txt and restrict it to mode 700","Create admin_group and add student to it","Create user bob with a home directory and verify the username","Create /tmp/shared with mode 1777","Create alice and grant her read access to hello.txt using setfacl","Use find to identify world-writable files under /home"]'::jsonb
WHERE "title" = 'Linux Fundamentals: File Permissions & Users';

UPDATE "LabFlag" AS flag
SET "title" = patch."newTitle", "description" = patch."description", "correctAnswer" = patch."answerHash"
FROM (VALUES
  ('chmod Master', 'chmod Master', 'Create /home/student/secret.txt, set mode 700, then run stat -c "%a" on it. Submit the output.', '$2b$10$Qk/V.e4WaGETPY0Z6KMSDOYHbpc4I5MdSxMMzGPf5tUj.f4VlW2wm'),
  ('User Architect', 'chmod Master', 'Create /home/student/secret.txt, set mode 700, then run stat -c "%a" on it. Submit the output.', '$2b$10$Qk/V.e4WaGETPY0Z6KMSDOYHbpc4I5MdSxMMzGPf5tUj.f4VlW2wm'),
  ('Group Manager', 'Group Manager', 'Create admin_group, add student, then run getent group admin_group | cut -d: -f4. Submit the member name.', '$2b$10$PJsark/scyeiVLAjmXJ9iuhrU55QoQLNoA2r4zLKHKi8B4eIuKuGu'),
  ('Group Master', 'Group Manager', 'Create admin_group, add student, then run getent group admin_group | cut -d: -f4. Submit the member name.', '$2b$10$PJsark/scyeiVLAjmXJ9iuhrU55QoQLNoA2r4zLKHKi8B4eIuKuGu'),
  ('User Creator', 'User Creator', 'Create bob with a home directory, then run id -un bob. Submit the output.', '$2b$10$bUxCMWReI4Y/yrS6Y4mE5OK6u/6BhbiorEOPAbNZgV9pkQk3zDkGC'),
  ('SUID Setter', 'User Creator', 'Create bob with a home directory, then run id -un bob. Submit the output.', '$2b$10$bUxCMWReI4Y/yrS6Y4mE5OK6u/6BhbiorEOPAbNZgV9pkQk3zDkGC'),
  ('Sticky Bit Expert', 'Sticky Bit Expert', 'Create /tmp/shared with mode 1777, then run stat -c "%a" /tmp/shared. Submit the output.', '$2b$10$STLnUge//74vzV7vM6PHOOi7Bupr1LJl.fzRydh3Fcq4cWaNCe.za'),
  ('ACL Pro', 'Sticky Bit Expert', 'Create /tmp/shared with mode 1777, then run stat -c "%a" /tmp/shared. Submit the output.', '$2b$10$STLnUge//74vzV7vM6PHOOi7Bupr1LJl.fzRydh3Fcq4cWaNCe.za'),
  ('ACL Master', 'ACL Master', 'Grant alice read access, then run getfacl /home/student/hello.txt | awk -F: ''/user:alice/{print $3}''. Submit the output.', '$2b$10$kw2hZQ6qyi2MSa7WGV9npu9BvF.rhMcgYiLRjRl9Jha8Mbr2CVPvi'),
  ('Umask Expert', 'ACL Master', 'Grant alice read access, then run getfacl /home/student/hello.txt | awk -F: ''/user:alice/{print $3}''. Submit the output.', '$2b$10$kw2hZQ6qyi2MSa7WGV9npu9BvF.rhMcgYiLRjRl9Jha8Mbr2CVPvi')
) AS patch("oldTitle", "newTitle", "description", "answerHash")
WHERE flag."labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Linux Fundamentals: File Permissions & Users'
)
AND flag."title" = patch."oldTitle";

UPDATE "Lab"
SET
  "description" = 'Build reproducible text-processing pipelines with grep, sed, awk, cut, sort, and shell scripts.',
  "briefing" = $briefing$
### Text Processing and Shell Scripting
Use the fresh Ubuntu 22.04 container as `student` (password: lab123). Each exercise tells you how to create its own small input dataset before processing it.

Because the data is learner-created, results remain identical across container restarts and server upgrades.
$briefing$,
  "tasks" = '["Create a three-line event log and count ERROR records with grep","Transform Hello World into Hello XpertClass with sed","Create a small CSV and extract the requested field with awk","Write a script that counts three supplied user records","Create a username list, sort it, remove duplicates, and join it with commas"]'::jsonb
WHERE "title" = 'Linux Fundamentals: Text Processing & Shell Scripting';

UPDATE "LabFlag" AS flag
SET "title" = patch."newTitle", "description" = patch."description", "correctAnswer" = patch."answerHash"
FROM (VALUES
  ('grep Guru', 'grep Guru', 'Run: printf "INFO\\nERROR\\nERROR\\n" > /tmp/events.log; grep -c ERROR /tmp/events.log. Submit the output.', '$2b$10$MrSdqcjPfJmXCMK.7mUwzePZBW8QX0EBypxaibSyNSSUH6ujT/3QC'),
  ('Awk Wizard', 'grep Guru', 'Run: printf "INFO\\nERROR\\nERROR\\n" > /tmp/events.log; grep -c ERROR /tmp/events.log. Submit the output.', '$2b$10$MrSdqcjPfJmXCMK.7mUwzePZBW8QX0EBypxaibSyNSSUH6ujT/3QC'),
  ('sed Specialist', 'sed Specialist', 'Run: echo "Hello World" | sed "s/World/XpertClass/". Submit the output.', '$2b$10$oZr1I9gFs/laCM0wCPXZU.vhW1hrH3NLqgGaQzlrGGi8Cz6NJPKZC'),
  ('Sed Substitutor', 'sed Specialist', 'Run: echo "Hello World" | sed "s/World/XpertClass/". Submit the output.', '$2b$10$oZr1I9gFs/laCM0wCPXZU.vhW1hrH3NLqgGaQzlrGGi8Cz6NJPKZC'),
  ('awk Architect', 'awk Architect', 'Run: printf "team,role\\nblue,security\\n" > /tmp/team.csv; awk -F, ''NR==2 {print $2}'' /tmp/team.csv. Submit the output.', '$2b$10$caJ6nVKZau6CNX2XFfSKPeFM74Yg/y/nDoD7DalAg4slclQutK1/2'),
  ('Log Counter', 'awk Architect', 'Run: printf "team,role\\nblue,security\\n" > /tmp/team.csv; awk -F, ''NR==2 {print $2}'' /tmp/team.csv. Submit the output.', '$2b$10$caJ6nVKZau6CNX2XFfSKPeFM74Yg/y/nDoD7DalAg4slclQutK1/2'),
  ('Script Writer', 'Script Writer', 'Create a script that runs printf "alice\\nbob\\ncharlie\\n" | wc -l. Execute it and submit the output.', '$2b$10$WYdrNCyzgCu9g.LOiatzS.1I6HZCpNxyWeiC4IoVhm0JGITWy8VGm'),
  ('Script Author', 'Script Writer', 'Create a script that runs printf "alice\\nbob\\ncharlie\\n" | wc -l. Execute it and submit the output.', '$2b$10$WYdrNCyzgCu9g.LOiatzS.1I6HZCpNxyWeiC4IoVhm0JGITWy8VGm'),
  ('Pipeline Master', 'Pipeline Master', 'Run: printf "charlie\\nalice\\nbob\\nalice\\n" | sort -u | paste -sd, -. Submit the output.', '$2b$10$uFaGq6mSUj68xx3LUm6SgOXmdmEcLwZusP0FLpnz3CqDmPbzMhGm2'),
  ('Pipeline Pro', 'Pipeline Master', 'Run: printf "charlie\\nalice\\nbob\\nalice\\n" | sort -u | paste -sd, -. Submit the output.', '$2b$10$uFaGq6mSUj68xx3LUm6SgOXmdmEcLwZusP0FLpnz3CqDmPbzMhGm2')
) AS patch("oldTitle", "newTitle", "description", "answerHash")
WHERE flag."labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Linux Fundamentals: Text Processing & Shell Scripting'
)
AND flag."title" = patch."oldTitle";

UPDATE "Lab"
SET
  "description" = 'Author and inspect secure Dockerfiles, Compose manifests, health checks, and build contexts without requiring a nested container engine.',
  "briefing" = $briefing$
### Container Manifest Fundamentals
This lab focuses on the portable files that define container builds and multi-service applications. The sandbox intentionally does not expose the host container engine.

Create and inspect Dockerfiles, Compose YAML, and `.dockerignore` files with ordinary shell tools. Every check is deterministic and safe inside the practice container.
$briefing$,
  "tasks" = '["Write a multi-stage Dockerfile based on node:20-alpine","Create a non-root app user and select it with USER","Add a HEALTHCHECK instruction to the Dockerfile","Write a Compose manifest with frontend, api, and database services","Create a .dockerignore file that excludes node_modules and secrets","Inspect each manifest with grep, awk, and sed"]'::jsonb
WHERE "title" = 'Docker & Container Fundamentals';

UPDATE "LabFlag" AS flag
SET "title" = patch."newTitle", "description" = patch."description", "correctAnswer" = patch."answerHash"
FROM (VALUES
  ('Container Runner', 'Base Image', 'Create a Dockerfile beginning with FROM node:20-alpine. Run head -1 Dockerfile and submit the output.', '$2b$10$WHBZ6cnjpjuvWdKPI.5HeelMWa.fNmJUnC/S4bJzSAY9i54fYtiuS'),
  ('Dockerfile Author', 'Non-Root User', 'Add USER app to the Dockerfile. Run awk ''$1 == "USER" {print $2}'' Dockerfile and submit the output.', '$2b$10$MOvLL0764hU6VKINQKDTCesAS8brF.NIw/273IM9W25ccssH0awvu'),
  ('Volume Master', 'Compose Services', 'Create compose.yml with frontend, api, and database service entries. Run grep -Ec ''^  (frontend|api|database):$'' compose.yml and submit the count.', '$2b$10$r4p4jZ66x5Vd34rfEsk9NuHqUtn7VqA7sL5kMmupD.A3dk8fk5Rqu'),
  ('Network Engineer', 'Health Check', 'Add a HEALTHCHECK instruction, then run grep -o ''^HEALTHCHECK'' Dockerfile. Submit the output.', '$2b$10$jAa3V5R2526qsdZLuVX6negUwSJywj2DKTM8HfLTl.tc2VF7X5oRq'),
  ('Compose Architect', 'Build Context', 'Add node_modules to .dockerignore, then run grep -Fx node_modules .dockerignore. Submit the output.', '$2b$10$R8NE5fzuwxeThYSpCX60geWMdbbl.QROrUdT37r0ETU8ip5U4S69W')
) AS patch("oldTitle", "newTitle", "description", "answerHash")
WHERE flag."labId" IN (
  SELECT "id" FROM "Lab" WHERE "title" = 'Docker & Container Fundamentals'
)
AND flag."title" = patch."oldTitle";
