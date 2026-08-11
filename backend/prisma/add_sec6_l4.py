#!/usr/bin/env python3
"""Add Network Monitoring lesson."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"
FP = os.path.join(BASE, "lessons_data.json")

with open(FP, 'r', encoding='utf-8') as f:
    data = json.load(f)

content = """# Network Monitoring

### Learning Objectives
- Capture and analyze network traffic with tcpdump
- Use nmap for network discovery and port scanning
- Set up network monitoring with Prometheus and Grafana
- Detect anomalies in network traffic patterns

### Section 1: tcpdump Packet Capture

```bash
# Capture all traffic on interface
sudo tcpdump -i eth0

# Capture specific port
sudo tcpdump -i eth0 port 443

# Capture traffic from specific host
sudo tcpdump -i eth0 src host 192.168.1.100

# Write to file for analysis
sudo tcpdump -i eth0 -w /tmp/capture.pcap

# Read from file
tcpdump -r /tmp/capture.pcap

# Display in human-readable form
sudo tcpdump -i eth0 -A port 80
```

### Section 2: nmap Network Scanning

```bash
# Scan a target
nmap 192.168.1.1

# Scan entire subnet
nmap 192.168.1.0/24

# Service version detection
nmap -sV 192.168.1.1

# OS detection
nmap -O 192.168.1.1

# Stealth scan
nmap -sS 192.168.1.1

# Script scanning
nmap --script vuln 192.168.1.1
```

### Section 3: Prometheus Network Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
```

```bash
# Install node_exporter for system metrics
sudo apt install prometheus-node-exporter

# Install nginx-exporter
sudo apt install prometheus/nginx-exporter
```

### Section 4: Grafana Dashboard

```bash
# Install Grafana
sudo apt install grafana

# Start service
sudo systemctl start grafana-server

# Access at http://localhost:3000
# Default credentials: admin/admin

# Import dashboard ID 1860 (Node Exporter Full)
# Import dashboard ID 12708 (Nginx)
```

### Section 5: Anomaly Detection

```bash
# Simple anomaly detection script
#!/bin/bash
# Monitor connection count
while true; do
    CONNS=$(ss -s | awk '/^TCP:/ {print $4}' | tr -d ',')
    if [ "$CONNS" -gt 1000 ]; then
        echo "$(date): High connection count: $CONNS" >> /var/log/anomaly.log
    fi
    sleep 60
done
```

### Key Takeaways
- tcpdump captures packets for offline analysis
- nmap discovers hosts, ports, and services on networks
- Prometheus and Grafana provide real-time network monitoring
- Node exporter exposes system metrics for Prometheus
- Baseline your normal traffic to detect anomalies

### References
1. [tcpdump man page](https://man7.org/linux/man-pages/man1/tcpdump.1.html)
2. [nmap Documentation](https://nmap.org/book/)
3. [Prometheus Documentation](https://prometheus.io/docs/)
4. [Grafana Documentation](https://grafana.com/docs/)"""

questions = [
    {"text": "What tcpdump flag writes captured packets to a file?", "answers": [
        {"text": "-f", "isCorrect": False},
        {"text": "-w", "isCorrect": True},
        {"text": "-o", "isCorrect": False},
        {"text": "-d", "isCorrect": False}
    ]},
    {"text": "What nmap flag performs service version detection?", "answers": [
        {"text": "-sS", "isCorrect": False},
        {"text": "-O", "isCorrect": False},
        {"text": "-sV", "isCorrect": True},
        {"text": "-A", "isCorrect": False}
    ]},
    {"text": "What does Prometheus node_exporter do?", "answers": [
        {"text": "Exports Prometheus config", "isCorrect": False},
        {"text": "Exposes system metrics for scraping", "isCorrect": True},
        {"text": "Monitors network nodes", "isCorrect": False},
        {"text": "Exports Grafana dashboards", "isCorrect": False}
    ]},
    {"text": "What is the default Grafana port?", "answers": [
        {"text": "80", "isCorrect": False},
        {"text": "9090", "isCorrect": False},
        {"text": "3000", "isCorrect": True},
        {"text": "8080", "isCorrect": False}
    ]},
    {"text": "What nmap flag performs a stealth SYN scan?", "answers": [
        {"text": "-sT", "isCorrect": False},
        {"text": "-sV", "isCorrect": False},
        {"text": "-sS", "isCorrect": True},
        {"text": "-sU", "isCorrect": False}
    ]},
    {"text": "What does the -A flag in tcpdump do?", "answers": [
        {"text": "Captures all traffic", "isCorrect": False},
        {"text": "Prints packets in ASCII", "isCorrect": True},
        {"text": "Enables ARP resolution", "isCorrect": False},
        {"text": "Appends to existing file", "isCorrect": False}
    ]}
]

lesson = {
    "title": "Network Monitoring", "order": 4, "lab": "netSecLab?.id",
    "content": content, "questions": questions
}
data["courses"][1]["sections"][2]["lessons"].append(lesson)

with open(FP, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Added Network Monitoring lesson")
