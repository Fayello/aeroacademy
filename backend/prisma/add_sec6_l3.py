#!/usr/bin/env python3
"""Add Log Analysis and SIEM lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Log Analysis and SIEM

### Learning Objectives
- Centralize system and security logs with rsyslog
- Use grep, awk, and journalctl for log analysis
- Understand SIEM concepts and ELK stack basics
- Create log-based alerting rules

### Section 1: Linux Log Locations

| Log File | Content |
|----------|---------|
| /var/log/syslog | General system messages |
| /var/log/auth.log | Authentication events |
| /var/log/kern.log | Kernel messages |
| /var/log/nginx/ | Nginx access/error logs |
| /var/log/fail2ban.log | fail2ban ban actions |
| journalctl | Systemd journal |

### Section 2: Log Analysis with Command Line

```bash
# Find failed SSH logins
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head

# Count requests by IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head

# Find 500 errors
awk '$9 >= 500 {print $0}' /var/log/nginx/access.log

# Monitor real-time logs
tail -f /var/log/nginx/access.log | grep "POST"

# Journalctl filtering
journalctl -u nginx --since "1 hour ago"
journalctl -p err --since today
journalctl -f -u sshd
```

### Section 3: Centralized Logging with rsyslog

```bash
# /etc/rsyslog.d/50-forwarding.conf
# Forward logs to central server
*.* @@192.168.1.200:514

# Or TCP
*.* @@192.168.1.200:514
```

```bash
# On central server - enable receiving
# /etc/rsyslog.d/10-receiving.conf
module(load="imudp")
input(type="imudp" port="514")
module(load="imtcp")
input(type="imtcp" port="514")

# Store by hostname
template RemoteLogs,"/var/log/remote/%HOSTNAME%/%PROGRAMNAME%.log"
*.* ?RemoteLogs
```

### Section 4: ELK Stack Overview

```
Elasticsearch - Storage and search engine
Logstash      - Log processing pipeline
Kibana        - Visualization dashboard
```

```yaml
# Filebeat agent configuration
# /etc/filebeat/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/nginx/access.log
  fields:
    type: nginx-access

- type: log
  enabled: true
  paths:
    - /var/log/auth.log
  fields:
    type: auth

output.elasticsearch:
  hosts: ["localhost:9200"]
```

### Section 5: Log-Based Alerting

```bash
# Simple cron-based alert
# /etc/cron.d/security-alert
*/5 * * * * root /usr/local/bin/check-auth.sh

# /usr/local/bin/check-auth.sh
#!/bin/bash
FAILED=$(grep "Failed password" /var/log/auth.log | wc -l)
if [ "$FAILED" -gt 50 ]; then
    echo "ALERT: $FAILED failed SSH attempts in 5 minutes" | \\
    mail -s "Security Alert" admin@example.com
fi
```

### Key Takeaways
- Centralized logging enables correlation across multiple servers
- grep, awk, and journalctl are essential log analysis tools
- ELK stack provides powerful search, visualization, and alerting
- Regular log review is critical for security monitoring
- Forward logs to an external server to prevent tampering

### References
1. [rsyslog Documentation](https://www.rsyslog.com/doc/)
2. [Elastic Stack Documentation](https://www.elastic.co/guide/)
3. [Linux Log Files Guide](https://www.digitalocean.com/community/tutorials/linux-logs)"""

questions = [
    {"text": "Which file contains SSH authentication events on Debian/Ubuntu?", "answers": [
        {"text": "/var/log/syslog", "isCorrect": False},
        {"text": "/var/log/auth.log", "isCorrect": True},
        {"text": "/var/log/secure", "isCorrect": False},
        {"text": "/var/log/messages", "isCorrect": False}
    ]},
    {"text": "What does the ELK stack consist of?", "answers": [
        {"text": "Elasticsearch, Logstash, Kibana", "isCorrect": True},
        {"text": "Elasticsearch, Linux, Kubernetes", "isCorrect": False},
        {"text": "Elastic, Log, Kibana", "isCorrect": False},
        {"text": "Event, Log, Knowledge", "isCorrect": False}
    ]},
    {"text": "What command shows journal entries from the last hour?", "answers": [
        {"text": "journalctl -f", "isCorrect": False},
        {"text": "journalctl --since '1 hour ago'", "isCorrect": True},
        {"text": "journalctl -r 1h", "isCorrect": False},
        {"text": "journalctl --last-hour", "isCorrect": False}
    ]},
    {"text": "Why should logs be forwarded to a remote server?", "answers": [
        {"text": "To save disk space", "isCorrect": False},
        {"text": "To prevent attackers from deleting evidence", "isCorrect": True},
        {"text": "To improve performance", "isCorrect": False},
        {"text": "To enable compression", "isCorrect": False}
    ]},
    {"text": "What is the purpose of Filebeat in the ELK stack?", "answers": [
        {"text": "Search and query logs", "isCorrect": False},
        {"text": "Visualize data", "isCorrect": False},
        {"text": "Ship logs to Elasticsearch", "isCorrect": True},
        {"text": "Parse log formats", "isCorrect": False}
    ]},
    {"text": "What awk command filters Nginx 500+ errors?", "answers": [
        {"text": "awk '$9 >= 500'", "isCorrect": True},
        {"text": "awk '/500/'", "isCorrect": False},
        {"text": "awk 'error >= 500'", "isCorrect": False},
        {"text": "awk 'status == 500'", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Log Analysis and SIEM", "order": 3, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][2]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Log Analysis and SIEM lesson")
