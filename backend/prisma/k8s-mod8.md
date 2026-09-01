# Module 8: Monitoring and Logging

A Kubernetes cluster without monitoring is flying blind. You don't know when nodes are running low on resources, when pods are crashing, or when the API server is slow. Monitoring and logging give you visibility into cluster health, application performance, and security events. This module covers Prometheus for metrics, Grafana for dashboards, Fluentd/Fluent Bit for logging, Jaeger for tracing, and the practical setup of a production observability stack.

## Prometheus

### How Prometheus Works

Prometheus is a time-series database that scrapes metrics from HTTP endpoints. It follows a pull model: Prometheus pulls metrics from targets, rather than targets pushing to Prometheus.

Key concepts:
- **Metrics**: Numerical measurements (CPU usage, request count, error rate).
- **Scrape**: The act of pulling metrics from a target.
- **Target**: An endpoint that exposes metrics (typically `/metrics`).
- **Label**: Key-value pairs that identify a metric (e.g., `namespace="production"`, `pod="api-server"`).
- **Query**: PromQL expressions that select and aggregate metrics.
- **Retention**: How long Prometheus stores data before deleting it.
- **Compaction**: The process of merging old data blocks to save space.

### Prometheus Operator

The Prometheus Operator simplifies Prometheus deployment on Kubernetes. It provides Custom Resource Definitions (CRDs) for Prometheus, ServiceMonitor, PodMonitor, PrometheusRule, and Alertmanager.

**Installation:**

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin123 \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi
```

**Verify installation:**

```bash
# Check pods
kubectl -n monitoring get pods

# Expected output:
# NAME                                                     READY   STATUS    RESTARTS   AGE
# alertmanager-prometheus-kube-prometheus-alertmanager-0   2/2     Running   0          5m
# kube-prometheus-grafana-abc123                           3/3     Running   0          5m
# kube-state-metrics-abc123                               1/1     Running   0          5m
# prometheus-kube-prometheus-operator-abc123              1/1     Running   0          5m
# prometheus-kube-prometheus-prometheus-0                 2/2     Running   0          5m
# prometheus-node-exporter-abc123                         1/1     Running   0          5m

# Access Grafana
kubectl -n monitoring port-forward svc/prometheus-grafana 3000:80
```

### ServiceMonitor

ServiceMonitor tells Prometheus which Services to scrape:

```yaml
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
    path: /metrics
    interval: 30s
```

### PodMonitor

PodMonitor is similar to ServiceMonitor but targets pods directly (useful when there's no Service):

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: my-app-pod-monitor
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
  podMetricsEndpoints:
  - port: http-metrics
    path: /metrics
    interval: 30s
```

### PrometheusRule

Define alerting rules:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: my-app-alerts
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
  - name: my-app.rules
    rules:
    - alert: HighErrorRate
      expr: |
        sum(rate(http_requests_total{job="my-app", code=~"5.."}[5m])) /
        sum(rate(http_requests_total{job="my-app"}[5m])) > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"
    
    - alert: HighLatency
      expr: |
        histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job="my-app"}[5m])) by (le)) > 2
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High latency detected"
        description: "P99 latency is {{ $value }}s (threshold: 2s)"
    
    - alert: PodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total{namespace="production"}[15m]) > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod is crash looping"
        description: "Pod {{ $labels.pod }} is restarting frequently"
    
    - alert: NodeHighCPU
      expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "Node CPU usage high"
        description: "Node {{ $labels.instance }} CPU usage is {{ $value }}%"
    
    - alert: NodeHighMemory
      expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 85
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "Node memory usage high"
        description: "Node {{ $labels.instance }} memory usage is {{ $value }}%"
```

### PromQL Queries

```promql
# CPU usage per pod
sum(rate(container_cpu_usage_seconds_total{namespace="production"}[5m])) by (pod)

# Memory usage per namespace
sum(container_memory_working_set_bytes{namespace="production"}) by (namespace)

# Request rate per service
sum(rate(http_requests_total{job="my-app"}[5m])) by (service)

# Error rate
sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# P99 latency
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Pods not ready
kube_pod_status_ready{namespace="production"} == 0

# PVC usage
kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes * 100

# Disk I/O
rate(node_disk_read_bytes_total[5m]) + rate(node_disk_written_bytes_total[5m])

# Network traffic
rate(node_network_receive_bytes_total[5m]) + rate(node_network_transmit_bytes_total[5m])

# CPU throttling
sum(rate(container_cpu_cfs_throttled_periods_total[5m])) by (pod) / sum(rate(container_cpu_cfs_periods_total[5m])) by (pod) * 100
```

## Grafana

Grafana visualizes Prometheus metrics in dashboards. The kube-prometheus-stack includes a pre-configured Grafana instance with dashboards.

### Built-in Dashboards

The stack includes these dashboards:
- **Kubernetes Cluster Monitoring**: Overview of cluster health
- **Node Exporter**: Node-level metrics (CPU, memory, disk, network)
- **Kube State Metrics**: Kubernetes object state (pods, deployments, nodes)
- **Prometheus**: Prometheus self-monitoring

### Custom Dashboard

Create a custom dashboard for your application:

```yaml
# custom-dashboard-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: custom-grafana-dashboards
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  my-app-dashboard.json: |
    {
      "dashboard": {
        "title": "My Application",
        "uid": "my-app",
        "panels": [
          {
            "title": "Request Rate",
            "type": "graph",
            "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
            "targets": [
              {
                "expr": "sum(rate(http_requests_total{job=\"my-app\"}[5m])) by (service)",
                "legendFormat": "{{service}}"
              }
            ]
          },
          {
            "title": "Error Rate",
            "type": "graph",
            "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
            "targets": [
              {
                "expr": "sum(rate(http_requests_total{job=\"my-app\", code=~\"5..\"}[5m])) / sum(rate(http_requests_total{job=\"my-app\"}[5m]))",
                "legendFormat": "Error Rate"
              }
            ]
          }
        ]
      }
    }
```

### Grafana provisioning

```yaml
# grafana-dashboard-provider.yaml
apiVersion: 1
providers:
- name: 'default'
  orgId: 1
  folder: 'Kubernetes'
  type: file
  disableDeletion: false
  updateIntervalSeconds: 10
  options:
    path: /var/lib/grafana/dashboards/default
```

## Fluentd and Fluent Bit

### Fluentd

Fluentd is a data collector that aggregates, filters, and forwards logs. In Kubernetes, it typically runs as a DaemonSet (one pod per node) and collects container logs.

**Installation:**

```bash
# Install Fluentd with Helm
helm repo add fluent https://fluent.github.io/helm-charts
helm install fluentd fluent/fluentd \
  --namespace logging \
  --create-namespace \
  --set output.host=elasticsearch.logging.svc.cluster.local \
  --set output.port=9200
```

**Fluentd configuration:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: logging
data:
  fluent.conf: |
    # Collect container logs
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      exclude_path ["/var/log/containers/fluentd*"]
      <parse>
        @type multi_format
        <pattern>
          format json
          time_key time
          time_format %Y-%m-%dT%H:%M:%S.%NZ
          keep_time_key true
        </pattern>
        <pattern>
          format regexp
          expression /^(?<time>.+) (?=stream=(?<stream>\S+) )?(?<log>.*)$/
          time_format %Y-%m-%dT%H:%M:%S.%NZ
        </pattern>
      </parse>
    </source>
    
    # Enrich with Kubernetes metadata
    <filter kubernetes.**>
      @type kubernetes_metadata
      @id filter_kube_metadata
      kubernetes_url "https://#{ENV['KUBERNETES_SERVICE_HOST']}:#{ENV['KUBERNETES_SERVICE_PORT']}"
      verify_ssl true
      ca_file /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      bearer_token_file /var/run/secrets/kubernetes.io/serviceaccount/token
      skip_labels false
      skip_container_metadata false
      skip_master_url true
      skip_namespace_metadata false
    </filter>
    
    # Filter sensitive data
    <filter kubernetes.**>
      @type record_transformer
      enable_ruby true
      <record>
        log ${record["log"].gsub(/password[=:]\s*\S+/i, "password=***REDACTED***")}
      </record>
    </filter>
    
    # Output to Elasticsearch
    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      logstash_format true
      logstash_prefix kubernetes
      logstash_dateformat %Y.%m.%d
      include_tag_key true
      type_name _doc
      <buffer>
        @type file
        path /var/log/fluentd-buffers/kubernetes.buffer
        flush_mode interval
        flush_thread_count 2
        flush_interval 5s
        retry_type exponential_backoff
        retry_forever true
        retry_max_interval 300
        chunk_limit_size 2M
        queue_limit_length 8
        overflow_action block
      </buffer>
    </match>
```

### Fluent Bit

Fluent Bit is a lightweight log processor and forwarder. It's faster and uses less memory than Fluentd. For Kubernetes, Fluent Bit is often the preferred choice:

```bash
# Install Fluent Bit
helm repo add fluent-bit https://fluent.github.io/helm-charts
helm install fluent-bit fluent/fluent-bit \
  --namespace logging \
  --create-namespace \
  --set config.outputs="[OUTPUT]\n    Name es\n    Host elasticsearch.logging.svc.cluster.local\n    Port 9200\n    Index kubernetes\n    Type _doc"
```

**Fluent Bit configuration:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         5
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf
        HTTP_Server   On
        HTTP_Listen   0.0.0.0
        HTTP_Port     2020
        storage.path  /var/fluent-bit/state/

    [INPUT]
        Name              tail
        Tag               kube.*
        Path              /var/log/containers/*.log
        Parser            docker
        DB                /var/fluent-bit/state/flb_kube.db
        Mem_Buf_Limit     5MB
        Skip_Long_Lines   On
        Refresh_Interval  10

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Kube_Tag_Prefix     kube.var.log.containers.
        Merge_Log           On
        Keep_Log            Off

    [OUTPUT]
        Name            es
        Match           kube.*
        Host            elasticsearch.logging.svc.cluster.local
        Port            9200
        Index           kubernetes
        Type            _doc
        Logstash_Format On
        Logstash_Prefix kubernetes
        Logstash_DateFormat %Y.%m.%d

  parsers.conf: |
    [PARSER]
        Name        docker
        Format      json
        Time_Key    time
        Time_Format %Y-%m-%dT%H:%M:%S.%L
        Time_Keep   On
```

## Jaeger for Distributed Tracing

Jaeger traces requests as they flow through multiple services. This is essential for debugging latency in microservices architectures.

### Installation

```bash
# Install Jaeger with Helm
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm install jaeger jaegertracing/jaeger \
  --namespace tracing \
  --create-namespace \
  --set storage.type=elasticsearch \
  --set storage.elasticsearch.host=elasticsearch.logging.svc.cluster.local \
  --set storage.elasticsearch.port=9200
```

### Instrumenting Applications

Add OpenTelemetry SDK to your application:

```python
# Python example
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

# Configure Jaeger exporter
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger-collector.tracing.svc.cluster.local",
    agent_port=6831,
)

# Configure tracer
provider = TracerProvider()
processor = BatchSpanProcessor(jaeger_exporter)
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# Create spans
tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("my-operation") as span:
    span.set_attribute("http.method", "GET")
    span.set_attribute("http.url", "/api/v1/users")
    # Your application logic here
```

### Auto-Instrumentation

For Kubernetes, use OpenTelemetry Collector with auto-instrumentation:

```yaml
# otel-collector.yaml
apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: otel-collector
  namespace: tracing
spec:
  mode: deployment
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
      jaeger:
        protocols:
          thrift_http:
            endpoint: 0.0.0.0:14268
    
    processors:
      batch:
        timeout: 5s
        send_batch_size: 1000
    
    exporters:
      jaeger:
        endpoint: jaeger-collector.tracing.svc.local:14250
        tls:
          insecure: true
      logging:
        loglevel: debug
    
    service:
      pipelines:
        traces:
          receivers: [otlp, jaeger]
          processors: [batch]
          exporters: [jaeger, logging]
```

## Real Scenario: Setting Up Observability Stack

Let's set up a complete observability stack for a production cluster.

### Step 1: Install Monitoring Stack

```bash
# Create namespace
kubectl create namespace monitoring

# Install Prometheus stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=$(openssl rand -base64 12) \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi \
  --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.resources.requests.storage=10Gi

# Install logging stack
kubectl create namespace logging

helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --set replicas=3 \
  --set persistence.enabled=true \
  --set persistence.size=50Gi

helm install kibana elastic/kibana \
  --namespace logging

helm install fluent-bit fluent/fluent-bit \
  --namespace logging

# Install tracing stack
kubectl create namespace tracing

helm install jaeger jaegertracing/jaeger \
  --namespace tracing \
  --set storage.type=elasticsearch \
  --set storage.elasticsearch.host=elasticsearch.logging.svc.cluster.local
```

### Step 2: Configure Alerting

```yaml
# critical-alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: critical-alerts
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
  - name: critical.rules
    rules:
    - alert: ClusterUnhealthy
      expr: kube_node_status_condition{condition="Ready",status="true"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Node {{ $labels.node }} is not ready"
    
    - alert: PodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
    
    - alert: HighErrorRate
      expr: sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Error rate is above 10%"
    
    - alert: ETCDHighLatency
      expr: histogram_quantile(0.99, rate(etcd_disk_wal_fsync_duration_seconds_bucket[5m])) > 0.5
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "etcd WAL fsync latency is high"
    
    - alert: APIserverHighLatency
      expr: histogram_quantile(0.99, rate(apiserver_request_duration_seconds_bucket{verb!="WATCH"}[5m])) > 1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "API server latency is high"
```

### Step 3: Configure Dashboards

```yaml
# grafana-dashboards.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: custom-dashboards
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  cluster-overview.json: |
    {
      "dashboard": {
        "title": "Cluster Overview",
        "uid": "cluster-overview",
        "panels": [
          {
            "title": "Node CPU Usage",
            "type": "stat",
            "targets": [{
              "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)"
            }]
          },
          {
            "title": "Node Memory Usage",
            "type": "stat",
            "targets": [{
              "expr": "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100"
            }]
          },
          {
            "title": "Pod Count by Namespace",
            "type": "stat",
            "targets": [{
              "expr": "count(kube_pod_info) by (namespace)"
            }]
          }
        ]
      }
    }
```

### Step 4: Configure Log Retention

```yaml
# elasticsearch-ilm.yaml
PUT _ilm/policy/kubernetes-logs
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "10gb",
            "max_age": "1d"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

### Step 5: Verify Everything Works

```bash
# Check Prometheus targets
kubectl -n monitoring port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090
# Open http://localhost:9090/targets

# Check Grafana dashboards
kubectl -n monitoring port-forward svc/prometheus-grafana 3000:80
# Open http://localhost:3000

# Check Elasticsearch
kubectl -n logging port-forward svc/elasticsearch-master 9200:9200
curl http://localhost:9200/_cluster/health

# Check Jaeger
kubectl -n tracing port-forward svc/jaeger-query 16686:16686
# Open http://localhost:16686
```

## Assessment

### Lab 1: Prometheus Setup (30 minutes)

1. Install Prometheus Operator and verify all components are running.
2. Create a ServiceMonitor for a test application.
3. Write 5 PromQL queries for common metrics.
4. Create a PrometheusRule with 3 alerting rules.
5. Verify alerts fire correctly by simulating a failure.

**Grading**: 10 points. 2 points per task. Full credit for correct installation, working ServiceMonitor, and accurate alerts.

### Lab 2: Grafana Dashboards (45 minutes)

1. Access the Grafana instance and explore built-in dashboards.
2. Create a custom dashboard with 5 panels for your application.
3. Add variables for namespace and pod selection.
4. Configure alerting rules in Grafana.
5. Export and import dashboards between Grafana instances.

**Grading**: 15 points. 3 points per task. Full credit for comprehensive dashboards, working variables, and accurate alerting.

### Lab 3: Full Observability Stack (45 minutes)

1. Install and configure Elasticsearch, Fluent Bit, and Kibana.
2. Verify logs are being collected from all pods.
3. Install and configure Jaeger for distributed tracing.
4. Instrument a test application with OpenTelemetry.
5. Create a runbook for monitoring and alerting procedures.

**Grading**: 15 points. 3 points per task. Full credit for working logging, tracing, and comprehensive runbook.

## Evidence

Submit the following as proof of completion:

1. Prometheus configuration and ServiceMonitor/PrometheusRule YAML files
2. Grafana dashboard screenshots
3. PromQL query results
4. Elasticsearch index and log search results
5. Jaeger trace screenshots
6. Monitoring runbook
