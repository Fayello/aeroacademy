# Module 8 — Monitoring and Logging

## What You'll Actually Do

You'll deploy Prometheus for metrics collection, Fluentd for log aggregation, and Jaeger for distributed tracing. You'll build dashboards, set up alerts, and correlate signals across your cluster.

## Core Concepts

### The Three Pillars

Modern observability rests on three signals:
- **Metrics**: Numerical measurements over time (CPU usage, request latency, error rates)
- **Logs**: Discrete events with timestamps and context
- **Traces**: End-to-end request paths through distributed services

### Prometheus Architecture

Prometheus pulls metrics from targets at regular intervals. It stores time-series data locally and uses PromQL for queries.

Components:
- **Prometheus Server**: Scrapes and stores metrics
- **Alertmanager**: Routes alerts to Slack, PagerDuty, email
- **Pushgateway**: For short-lived jobs that can't be scraped
- **Node Exporter**: Exposes host-level metrics

### PromQL Basics

```promql
# CPU usage by node
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage percentage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# HTTP request rate by status code
rate(http_requests_total[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Container restart count
increase(kube_pod_container_status_restarts_total[1h])
```

### Fluentd Architecture

Fluentd collects, filters, and forwards logs. It runs as a DaemonSet (one per node) or as a sidecar.

```
App → stdout → Container Runtime → Fluentd → Elasticsearch/Loki/S3
                                            ↓
                                         Filter
                                            ↓
                                         Buffer
                                            ↓
                                         Output
```

### Jaeger for Distributed Tracing

Jaeger traces requests as they flow through microservices. Each service creates a span, and spans are linked into a trace.

```bash
# Deploy Jaeger with Helm
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm install jaeger jaegertracing/jaeger --namespace monitoring --create-namespace

# Deploy Jaeger Operator for production
kubectl apply -f https://github.com/jaegertracing/jaeger-operator/releases/latest/download/jaeger-operator.yaml
```

### Alerting Rules

```yaml
# prometheus-alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cluster-alerts
  namespace: monitoring
spec:
  groups:
  - name: cluster
    rules:
    - alert: HighMemoryUsage
      expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) > 0.85
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage on {{ $labels.instance }}"
        description: "Memory usage is above 85% for 5 minutes"

    - alert: PodCrashLooping
      expr: increase(kube_pod_container_status_restarts_total[1h]) > 5
      for: 10m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
        description: "Pod has restarted more than 5 times in the last hour"

    - alert: HighErrorRate
      expr: rate(http_requests_total{code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate on {{ $labels.instance }}"
        description: "More than 5% of requests are returning 5xx errors"
```

## Hands-On Lab

### Task 1: Deploy Prometheus Stack

```bash
# Install kube-prometheus-stack (includes Prometheus, Grafana, Alertmanager)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace

# Verify installation
kubectl get pods -n monitoring

# Access Prometheus UI
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090

# Access Grafana UI
kubectl port-forward -n monitoring svc/prometheus-grafana 3000
# Default credentials: admin / prom-operator
```

### Task 2: Configure Prometheus Targets

```yaml
# custom-scrape-config.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app-monitor
  namespace: monitoring
  labels:
    release: prometheus
spec:
  namespaceSelector:
    matchNames:
    - production
  selector:
    matchLabels:
      app: my-app
  endpoints:
  - port: http-metrics
    interval: 15s
    path: /metrics
```

```bash
kubectl apply -f custom-scrape-config.yaml

# Verify targets in Prometheus UI
# Go to Status → Targets
# Your app should appear
```

### Task 3: Set Up Grafana Dashboards

```bash
# Import a pre-built Kubernetes dashboard
# In Grafana UI:
# 1. Go to Dashboards → Import
# 2. Enter dashboard ID: 315 (Kubernetes Cluster Monitoring)
# 3. Select Prometheus data source
# 4. Click Import

# Create a custom panel
# Go to Dashboards → New Panel
# Query: rate(http_requests_total[5m])
# Visualization: Time series
```

### Task 4: Deploy Fluentd for Log Aggregation

```yaml
# fluentd-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: logging
data:
  fluent.conf: |
    <source>
      @type forward
      port 24224
      bind 0.0.0.0
    </source>

    <filter kube.**>
      @type kubernetes_metadata
      @id filter_kube_metadata
    </filter>

    <match kube.**>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      logstash_format true
      logstash_prefix kubernetes
      <buffer>
        @type file
        path /var/log/fluentd-buffers/kubernetes.system.buffer
        flush_mode interval
        flush_interval 5s
        retry_type exponential_backoff
        chunk_limit_size 2M
        queue_limit_length 8
        overflow_action block
      </buffer>
    </match>
```

```bash
# Deploy Fluentd as DaemonSet
kubectl apply -f fluentd-config.yaml

# Deploy Fluentd DaemonSet
kubectl apply -f https://raw.githubusercontent.com/fluent/fluentd-kubernetes-daemonset/master/fluentd-daemonset-elasticsearch-rbac.yaml

# Verify Fluentd is collecting logs
kubectl logs -n logging -l app=fluentd --tail=20
```

### Task 5: Set Up Jaeger for Tracing

```bash
# Deploy Jaeger operator
kubectl create namespace observability
kubectl apply -n observability -f https://github.com/jaegertracing/jaeger-operator/releases/latest/download/jaeger-operator.yaml

# Create a Jaeger instance
cat > jaeger-instance.yaml << 'EOF'
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: production
  namespace: observability
spec:
  strategy: production
  collector:
    maxReplicas: 5
    resources:
      limits:
        memory: 512Mi
  query:
    replicas: 2
  storage:
    type: elasticsearch
    options:
      es:
        server-urls: https://elasticsearch:9200
EOF

kubectl apply -f jaeger-instance.yaml

# Access Jaeger UI
kubectl port-forward -n observability svc/production-query 16686
```

### Task 6: Create Alert Rules

```bash
# Apply alert rules
kubectl apply -f prometheus-alerts.yaml

# Test an alert (simulate high memory)
kubectl run stress-test --image=polinux/stress --namespace=default -- \
  stress --vm 1 --vm-bytes 200M --vm-hang 0

# Check if alert fires in Prometheus UI
# Go to Alerts tab
```

## Assessment

**Lab Task**: Deploy a complete observability stack: Prometheus for metrics, Fluentd for logs, Jaeger for traces. Create a Grafana dashboard, configure 3 alert rules, and demonstrate alert firing.

**Time**: 60 minutes

**Grading** (100 points):
- Prometheus deployed and scraping metrics (20 pts)
- Grafana dashboard created with meaningful panels (20 pts)
- Fluentd collecting and forwarding logs (20 pts)
- Jaeger deployed and tracing requests (15 pts)
- At least 3 alert rules configured and tested (15 pts)
- Evidence of all components working (10 pts)

## Evidence

Save the following to your evidence folder:
1. `prometheus-targets.txt` — list of Prometheus scrape targets
2. `grafana-dashboard.json` — exported Grafana dashboard JSON
3. `fluentd-logs.txt` — sample Fluentd log output
4. `jaeger-trace.txt` — sample Jaeger trace output
5. `alert-rules.yaml` — your PrometheusRule resources
6. `alert-fired.txt` — evidence of an alert firing
