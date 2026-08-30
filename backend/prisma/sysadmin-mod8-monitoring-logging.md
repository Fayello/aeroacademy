# Module 8 — Monitoring and Logging


## What You'll Actually Do

Something is wrong but nobody has complained yet. You need to know before users do. You'll set up monitoring with Prometheus/Grafana, configure alerts, centralize logs with the ELK stack, and build dashboards that actually tell you something.

## System Monitoring — The Basics

```bash
# CPU
top
htop
mpstat 1 5         # CPU per core,5 seconds

# Memory
free -h
vmstat 1 5         # virtual memory stats

# Disk
iostat -x 1 5      # disk I/O
iotop              # I/O by process

# Network
iftop              # bandwidth by connection
nethogs            # bandwidth by process
```

## Prometheus + Grafana

**Prometheus** collects metrics. **Grafana** visualizes them.

**Install:**
```bash
# Docker Compose
cat > docker-compose-monitoring.yml << 'EOF'
version: '3'
services:
  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  grafana:
    image: grafana/grafana
    ports: ["3000:3000"]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
EOF

docker compose -f docker-compose-monitoring.yml up -d
```

**Prometheus config:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

**Node Exporter** (exposes system metrics):
```bash
apt install prometheus-node-exporter
systemctl enable --now prometheus-node-exporter
```

## Alerting

**Prometheus alert rules:**
```yaml
groups:
  - name: alerts
    rules:
      - alert: HighCPU
        expr: 100 - (avg by(instance)(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU on {{ $labels.instance }}"
      
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 20
        for: 5m
        labels:
          severity: critical
```

## Centralized Logging — ELK

**Elasticsearch** stores logs. **Logstash** processes them. **Kibana** visualizes them.

```bash
# docker-compose-elk.yml
version: '3'
services:
  elasticsearch:
    image: elasticsearch:7.17.17
    environment:
      - discovery.type=single-node
    ports: ["9200:9200"]
  kibana:
    image: kibana:7.17.17
    ports: ["5601:5601"]
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
  logstash:
    image: logstash:7.17.17
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
```

**Ship logs to ELK:**
```bash
# Filebeat
apt install filebeat
filebeat modules enable system nginx
filebeat setup
systemctl enable --now filebeat
```

## Log Analysis

```bash
# Find errors
journalctl -p err --since "1 hour ago"

# nginx slow requests
awk '$NF > 2.0' /var/log/nginx/access.log

# Top endpoints
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# Security events
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -5
```

## Real Task: Set Up Complete Monitoring

```bash
# 1. Install node exporter
apt install -y prometheus-node-exporter

# 2. Prometheus config
cat > /etc/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
EOF

# 3. Grafana dashboard
# Import Node Exporter Full dashboard (ID 1860)

# 4. Alerts
# Add alert rules in Prometheus

# 5. Log aggregation
# Deploy ELK stack with Docker
# Configure Filebeat to ship logs

# 6. Verify
curl http://localhost:9090/metrics | head -5
# Check Grafana dashboard
```

## Assessment

**Lab task (25 min):**

1. Install and configure Prometheus with node exporter
2. Set up Grafana with a system dashboard
3. Create alert rules for CPU and disk
4. Deploy ELK stack with Docker
5. Configure Filebeat to ship logs
6. Create a log analysis pipeline

**Grading:**
- Prometheus + node exporter working: 20%
- Grafana dashboard configured: 20%
- Alerts configured: 20%
- ELK stack running: 20%
- Filebeat shipping logs: 10%
- Log analysis working: 10%

## Evidence

- **OutcomeEvidence:** `SYS-LO8 — Monitoring & Logging`
- **Mastery:** `UserSkill: linux-monitoring`

## Unlock

Module9 — Virtualization. You can monitor systems. Now you learn how to virtualize them.

## Sources

- `man prometheus`, `man grafana`
- Prometheus documentation
- Elasticsearch documentation

