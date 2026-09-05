DO $$
DECLARE
  l_id UUID;
BEGIN
  -- Blockchain: Incident Response
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Blockchain Security & Smart Contracts' AND l.title = 'Incident Response';
  IF l_id IS NOT NULL THEN
    INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), l_id, 'Smart Contract Incident Steps', 'SHORT_RESPONSE', 'A DeFi protocol has been exploited and funds are being drained. What are the first three actions an incident responder should take in order? Answer in one sentence.', 'Outline blockchain incident response steps.', 'Pause the smart contract if possible, document the exploit by recording all transactions, and notify the team and relevant stakeholders while preserving on-chain evidence.', 'CONTAINS', ARRAY['Immediate priority is stopping the bleeding.', 'On-chain evidence is immutable but needs documentation.', 'Communication is critical in DeFi incidents.'], 3, 25, true, 1, now(), now()),
    (gen_random_uuid(), l_id, 'Post-Mortem Purpose', 'FLAG_CAPTURE', 'After a blockchain security incident, the team conducts a detailed review of what happened, how it was detected, and how to prevent recurrence. What is this practice called? Return the term.', 'Identify the post-incident practice.', 'Post-mortem', 'EXACT', ARRAY['This is a standard practice after any security incident.', 'It focuses on learning and improvement.', 'It should be blameless and thorough.'], 3, 25, true, 2, now(), now());
  END IF;

  -- Containerization: DevOps Culture
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Containerization & DevOps' AND l.title = 'DevOps Culture and Principles';
  IF l_id IS NOT NULL THEN
    INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), l_id, 'DevOps Core Principle', 'FLAG_CAPTURE', 'DevOps emphasizes breaking down silos between development and operations teams. What is the primary cultural principle that enables this collaboration? Return the principle name.', 'Identify the DevOps cultural principle.', 'Shared responsibility', 'CONTAINS', ARRAY['DevOps is about culture, not just tools.', 'Teams share ownership of the entire lifecycle.', 'Blameless post-mortems support this principle.'], 3, 25, true, 1, now(), now()),
    (gen_random_uuid(), l_id, 'DevOps vs Traditional', 'SHORT_RESPONSE', 'In traditional IT, development throws code over the wall to operations. In DevOps, both teams share responsibility throughout the lifecycle. What is the key practice that makes this possible? Answer in one sentence.', 'Explain the key DevOps practice.', 'Continuous integration and continuous delivery (CI/CD) enables shared responsibility by automating the pipeline so both teams can collaborate on every commit from code to production.', 'CONTAINS', ARRAY['CI/CD automates the build-test-deploy pipeline.', 'Automation removes manual handoffs.', 'Both teams can see and respond to issues in real-time.'], 3, 25, true, 2, now(), now());
  END IF;

  -- Database Admin: Security Hardening
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Database Administration & Security' AND l.title = 'Database Security Hardening';
  IF l_id IS NOT NULL THEN
    INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), l_id, 'Disable Default Accounts', 'FLAG_CAPTURE', 'A new PostgreSQL installation comes with a default superuser. What is the first hardening step you should take regarding default database accounts? Return the action.', 'Identify the first hardening step.', 'Change default passwords or disable default accounts', 'CONTAINS', ARRAY['Default accounts are well-known to attackers.', 'Changing passwords is the minimum step.', 'Disabling unused accounts reduces attack surface.'], 3, 25, true, 1, now(), now()),
    (gen_random_uuid(), l_id, 'Database Patch Strategy', 'SHORT_RESPONSE', 'A production database is running version 14.2 and version 14.5 includes critical security patches. What is the recommended approach for applying this patch? Answer in one sentence.', 'Describe the patching strategy.', 'Test the patch in a staging environment first, then schedule a maintenance window for production with a rollback plan, and apply the patch during low-traffic hours.', 'CONTAINS', ARRAY['Never patch production without testing first.', 'Rollback plans are essential for safety.', 'Maintenance windows minimize user impact.'], 3, 25, true, 2, now(), now());
  END IF;

  -- Linux: Cron/At
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'Cron, At & Scheduled Tasks';
  IF l_id IS NOT NULL THEN
    INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), l_id, 'Cron Expression Parse', 'FLAG_CAPTURE', 'A cron expression is set to: 0 2 * * 0. What does this schedule do? Return a plain English description.', 'Parse a cron expression.', 'Runs at 2:00 AM every Sunday', 'CONTAINS', ARRAY['The five fields are: minute, hour, day of month, month, day of week.', '0 in the day-of-week field means Sunday.', '* means every occurrence.'], 3, 25, true, 1, now(), now()),
    (gen_random_uuid(), l_id, 'At vs Cron', 'FLAG_CAPTURE', 'You need to run a one-time cleanup script 3 hours from now. Should you use cron or at? Return the command name.', 'Choose between cron and at.', 'at', 'EXACT', ARRAY['cron is for recurring schedules.', 'at is for one-time scheduled tasks.', 'atq lists pending at jobs.'], 3, 25, true, 2, now(), now());
  END IF;

  -- Linux: Log Management
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'Log Management & journald';
  IF l_id IS NOT NULL THEN
    INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), l_id, 'Journald Priority Filter', 'COMMAND_ANSWER', 'Write the journalctl command that shows only logs with priority err or higher (error, critical, alert, emergency) from the current boot. Return the full command.', 'Filter journal logs by priority.', 'journalctl -p err -b', 'CONTAINS', ARRAY['The -p flag filters by priority.', 'err includes err, crit, alert, and emerg.', 'The -b flag limits to the current boot.'], 3, 25, true, 1, now(), now()),
    (gen_random_uuid(), l_id, 'Log Rotation Purpose', 'FLAG_CAPTURE', 'A server has /var/log/syslog growing to 50GB without any rotation. What Linux utility prevents this by compressing and rotating old log files? Return the utility name.', 'Identify the log rotation utility.', 'logrotate', 'EXACT', ARRAY['logrotate is configured in /etc/logrotate.conf.', 'It compresses, rotates, and removes old logs.', 'It is typically run daily by cron.'], 3, 25, true, 2, now(), now());
  END IF;

  -- Linux: systemd
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Linux Fundamentals — From Zero to Command Line Hero' AND l.title = 'systemd Deep-Dive';
  IF l_id IS NOT NULL THEN
    INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), l_id, 'Systemd Unit File Directive', 'FLAG_CAPTURE', 'In a systemd unit file, which directive specifies the command to start the service? Return the directive name.', 'Identify the systemd start directive.', 'ExecStart', 'EXACT', ARRAY['ExecStart defines the main process.', 'ExecStop defines the stop command.', 'ExecReload defines the reload command.'], 3, 25, true, 1, now(), now()),
    (gen_random_uuid(), l_id, 'Systemd Dependency Order', 'FLAG_CAPTURE', 'A web server unit file needs to start only after the network is available. Which systemd directive establishes this dependency order? Return the directive name.', 'Identify the systemd ordering directive.', 'After', 'EXACT', ARRAY['After= specifies ordering (when to start).', 'Wants= or Requires= specifies activation dependencies.', 'After= does not create a dependency by itself.'], 3, 25, true, 2, now(), now());
  END IF;

  -- Networking: Routing
  SELECT l.id INTO l_id FROM "Lesson" l JOIN "Section" s ON l."sectionId" = s.id JOIN "Course" c ON s."courseId" = c.id WHERE c.title = 'Networking & Security' AND l.title = 'Routing';
  IF l_id IS NOT NULL THEN
    INSERT INTO "InlinePractice" (id, "lessonId", title, type, prompt, instructions, "expectedAnswer", "validationMode", hints, "maxAttempts", "xpReward", required, "order", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), l_id, 'Default Route Purpose', 'FLAG_CAPTURE', 'A router has this route entry: 0.0.0.0/0 via 192.168.1.1. What is this route called and what does it do? Return the route type.', 'Identify the default route.', 'Default route', 'EXACT', ARRAY['0.0.0.0/0 matches all destinations.', 'The default route is the gateway of last resort.', 'Packets use it when no more specific route exists.'], 3, 25, true, 1, now(), now()),
    (gen_random_uuid(), l_id, 'Static vs Dynamic Routing', 'FLAG_CAPTURE', 'A small office with 2 routers uses manually configured routes. A large enterprise with 200 routers uses OSPF to automatically share routes. Which routing approach scales better for the enterprise? Return the approach name.', 'Compare routing approaches.', 'Dynamic routing', 'EXACT', ARRAY['Static routes must be manually configured on each router.', 'Dynamic routing protocols automatically share route information.', 'OSPF, BGP, and EIGRP are dynamic routing protocols.'], 3, 25, true, 2, now(), now());
  END IF;
END $$;
