-- Seed walkthrough tasks for existing labs
-- Each lab gets a structured walkthrough that guides learners through the exercise

UPDATE "Lab" SET tasks = '["Explore the target environment and identify running services","Enumerate open ports and identify service versions","Research known vulnerabilities for identified services","Exploit the vulnerability to gain initial access","Escalate privileges to reach the root/admin level","Capture the flag and document your findings"]'::jsonb
WHERE title ILIKE '%DVWA%' OR title ILIKE '%Damn Vulnerable%';

UPDATE "Lab" SET tasks = '["Access the web application and map all functionality","Test for OWASP Top 10 vulnerabilities (XSS, SQLi, CSRF)","Identify injection points using manual testing","Craft exploits for each identified vulnerability","Document all findings with proof-of-concept","Submit captured flags for each challenge"]'::jsonb
WHERE title ILIKE '%Juice Shop%' OR title ILIKE '%juice-shop%';

UPDATE "Lab" SET tasks = '["Complete the introductory lessons in WebGoat","Follow the guided exercises for each category","Test SQL injection attacks on the lesson endpoints","Perform XSS attacks on vulnerable forms","Complete the authentication bypass challenges","Document your approach for each completed lesson"]'::jsonb
WHERE title ILIKE '%WebGoat%' OR title ILIKE '%webgoat%';

UPDATE "Lab" SET tasks = '["Connect to the target system via SSH or terminal","Enumerate system information and user accounts","Identify misconfigured file permissions","Exploit SUID binaries or cron jobs for privilege escalation","Read the flag from the protected location","Document your escalation path"]'::jsonb
WHERE title ILIKE '%Linux%' AND (title ILIKE '%privilege%' OR title ILIKE '%escalat%' OR title ILIKE '%hardening%');

UPDATE "Lab" SET tasks = '["Identify the network topology and live hosts","Capture and analyze network traffic","Identify protocols and services in use","Detect potential security issues in traffic","Reconstruct sessions or extract credentials","Document your network analysis findings"]'::jsonb
WHERE title ILIKE '%network%' OR title ILIKE '%packet%' OR title ILIKE '%traffic%';

UPDATE "Lab" SET tasks = '["Set up the development environment","Configure the application server","Deploy the application code","Test all endpoints for functionality","Identify and fix security vulnerabilities","Verify the deployment is production-ready"]'::jsonb
WHERE title ILIKE '%deploy%' OR title ILIKE '%setup%' OR title ILIKE '%configure%';

UPDATE "Lab" SET tasks = '["Analyze the provided binary or malware sample","Identify strings, imports, and network indicators","Determine the malware behavior and C2 communication","Document IOCs (Indicators of Compromise)","Write detection rules or signatures","Summarize your analysis findings"]'::jsonb
WHERE title ILIKE '%malware%' OR title ILIKE '%reverse%' OR title ILIKE '%forensic%';

UPDATE "Lab" SET tasks = '["Access the database server using provided credentials","Enumerate databases and tables","Identify sensitive data and access controls","Test for SQL injection vulnerabilities","Extract or modify data as the exercise requires","Document your database security findings"]'::jsonb
WHERE title ILIKE '%database%' OR title ILIKE '%SQL%' OR title ILIKE '%postgres%' OR title ILIKE '%mysql%';

UPDATE "Lab" SET tasks = '["Review the application source code for vulnerabilities","Identify insecure coding patterns","Test for authentication and authorization flaws","Exploit identified vulnerabilities","Remediate the security issues","Verify your fixes resolve the vulnerabilities"]'::jsonb
WHERE title ILIKE '%web%' AND (title ILIKE '%vulnerabilit%' OR title ILIKE '%security%' OR title ILIKE '%code review%');

UPDATE "Lab" SET tasks = '["Configure the container environment","Build and deploy the application containers","Set up networking between services","Test container isolation and security","Identify misconfigurations in Docker/Kubernetes","Harden the container deployment"]'::jsonb
WHERE title ILIKE '%docker%' OR title ILIKE '%container%' OR title ILIKE '%kubernetes%' OR title ILIKE '%k8s%';

-- Generic fallback for labs without specific tasks
UPDATE "Lab" SET tasks = '["Read the lab briefing and understand the objectives","Explore the target environment","Identify the attack surface or configuration issues","Apply the techniques learned in the course","Complete all challenges and capture flags","Document your findings and approach"]'::jsonb
WHERE tasks IS NULL OR tasks = 'null'::jsonb OR tasks = '[]'::jsonb;
