# Module 8 — Monitoring and Observability

**Course:** DevOps & Platform Engineering | **Path:** DevOps (8 of 10)

---

## What You'll Actually Do

You'll set up monitoring, alerting, and observability. Not just "is it up?" — understanding what's happening inside.

---

## The Three Pillars

**Metrics:** Numbers over time (CPU, memory, request rate)
**Logs:** Text records of events (error messages, access logs)
**Traces:** Request paths through distributed systems

---

## Prometheus + Grafana

```yaml
# docker-compose-monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana
    ports: ["3000:3000"]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  node-exporter:
    image: prom/node-exporter
    ports: ["9100:9100"]
    pid: host
```

---

## Alerting

```yaml
# prometheus.yml
rule_files:
  - alerts.yml

# alerts.yml
groups:
  - name: alerts
    rules:
      - alert: HighCPU
        expr: 100 - (avg by(instance)(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning

      - alert: DiskLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 20
        labels:
          severity: critical
```

---

## Log Aggregation

```bash
# ELK Stack
docker compose up -d elasticsearch kibana logstash

# Ship logs with Filebeat
filebeat modules enable system nginx
filebeat setup
```

---

## Assessment

**Lab task (25 min):**

1. Deploy Prometheus + Grafana
2. Create a dashboard
3. Configure alerts
4. Set up log aggregation
5. Create a monitoring checklist

**Grading:**
- Stack deployed: 20%
- Dashboard created: 25%
- Alerts configured: 25%
- Logs aggregated: 20%
- Checklist complete: 10%

---

## Evidence

- **OutcomeEvidence:** `DEV-LO8 — Monitoring & Observability`
