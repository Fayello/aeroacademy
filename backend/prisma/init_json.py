#!/usr/bin/env python3
"""Initialize the lessons_data.json skeleton."""
import json, os

BASE = r"C:\Users\fayell.kuobi\Desktop\AEROACADEMY\backend\prisma"

data = {"courses": [
    {
        "title": "Web Server Administration",
        "description": "Master web server technologies from Nginx to Apache, learn reverse proxying, load balancing, SSL configuration, and modern application deployment patterns including containerized solutions.",
        "sections": [
            {"title": "Nginx Mastery", "order": 1, "lessons": []},
            {"title": "Apache & Alternatives", "order": 2, "lessons": []},
            {"title": "Application Deployment", "order": 3, "lessons": []}
        ]
    },
    {
        "title": "Networking & Security",
        "description": "Learn Linux networking fundamentals, firewall configuration with iptables and nftables, VPN setup, intrusion detection with Snort and Suricata, and network troubleshooting tools.",
        "sections": [
            {"title": "Network Fundamentals", "order": 1, "lessons": []},
            {"title": "Firewalls & VPNs", "order": 2, "lessons": []},
            {"title": "Intrusion Detection & Monitoring", "order": 3, "lessons": []},
            {"title": "Network Troubleshooting", "order": 4, "lessons": []}
        ]
    }
]}

out = os.path.join(BASE, "lessons_data.json")
with open(out, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(f"Initialized {out}")
