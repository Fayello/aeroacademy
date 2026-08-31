# Module 8 — Monitoring and Observability

## Three Pillars of Observability

Monitoring tells you when something is wrong. Observability tells you why. The distinction matters because modern distributed systems have so many components that knowing "the API is slow" is not enough — you need to know which service, which request, which database query, which network hop is causing the slowness.

The three pillars of observability are metrics, logs, and traces.

**Metrics** are numerical measurements over time. Request rate, error rate, CPU usage, memory consumption, response latency. Metrics are lightweight, efficient, and perfect for dashboards and alerting. They answer "how much" and "how fast."

**Logs** are timestamped text records of events. Each log entry describes a single event: a request was received, a database query was executed, an error occurred. Logs provide context and detail. They answer "what happened."

**Traces** follow a request through the entire system. A trace shows which services a request touched, how long each service took, and where errors occurred. Traces are essential for debugging latency in distributed systems. They answer "where did the time go."

The three pillars are complementary, not alternatives. You need all three to understand complex systems. Metrics tell you something is slow. Traces tell you which service is slow. Logs tell you why it is slow.

## Prometheus and Grafana Setup

Prometheus is a time-series database and monitoring system. It collects metrics by scraping HTTP endpoints on your services. Grafana is a visualization tool that creates dashboards from Prometheus data.

### Docker Compose Setup

```yaml
services:
  prometheus:
    image: prom/prometheus:v2.52.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:11.0.0
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:v0.27.0
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  prometheus-data:
  grafana-data:
```

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'my-app'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['app:3000']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
```

Prometheus scrapes the `/metrics` endpoint on each target every 15 seconds. The metrics are stored in a time-series database with labels for dimensional querying.

### Exposing Metrics in Your Application

For a Node.js application using Prometheus client:

```javascript
const promClient = require('prom-client');

// Collect default metrics (CPU, memory, event loop)
promClient.collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

// Middleware to record metrics
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  activeConnections.inc();

  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
    httpRequestTotal.inc({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
    activeConnections.dec();
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

For PostgreSQL, use `postgres_exporter` to expose database metrics. For Redis, use `redis_exporter`. For system metrics, use `node_exporter`.

### Grafana Dashboard Configuration

Gdashboards can be provisioned automatically using JSON files or the Grafana API. Here is a dashboard configuration for a web application:

```json
{
  "dashboard": {
    "title": "Application Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "timeseries",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))",
            "legendFormat": "requests/sec"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "legendFormat": "error %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                { "value": 0, "color": "green" },
                { "value": 1, "color": "yellow" },
                { "value": 5, "color": "red" }
              ]
            }
          }
        }
      },
      {
        "title": "p99 Latency",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))",
            "legendFormat": "p99"
          }
        ]
      }
    ]
  }
}
```

Dashboard provisioning is configured in the Docker Compose setup:

```yaml
grafana:
  volumes:
    - ./grafana/provisioning/dashboards:/etc/grafana/provisioning/dashboards
    - ./grafana/provisioning/datasources:/etc/grafana/provisioning/datasources
```

The datasource provisioning file configures Prometheus as the data source:

```yaml
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

With provisioning, dashboards and data sources are automatically configured when Grafana starts. No manual setup required.

### Metrics vs Logs vs Traces

Understanding when to use each pillar:

**Use metrics when:**
- You need to detect anomalies (error rate spike, latency increase)
- You need to track trends over time (requests per day, storage growth)
- You need to set up alerts (error rate > 5% for 5 minutes)
- You need to build dashboards for operational visibility

**Use logs when:**
- You need to understand what happened during a specific event
- You need to debug a specific request or user session
- You need to audit who did what and when
- You need to search for specific error messages or patterns

**Use traces when:**
- You need to understand latency in a distributed system
- You need to see which service is slow
- You need to follow a request across multiple services
- You need to identify bottlenecks in a call chain

The pillars are complementary. A typical debugging workflow:
1. Alert fires based on a metric (error rate increased)
2. Dashboard shows which metric changed and when
3. Logs show the error messages and stack traces
4. Traces show which service caused the error and how long each step took

## PromQL Queries

PromQL is Prometheus's query language. It selects and aggregates time-series data.

### Basic Queries

```promql
# Current value of a metric
http_requests_total

# Rate of requests per second (over 5 minutes)
rate(http_requests_total[5m])

# Request rate by status code
sum by (status_code) (rate(http_requests_total[5m]))

# Error rate (5xx responses)
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Request rate by route
topk(10, sum by (route) (rate(http_requests_total[5m])))
```

### Latency Queries

```promql
# 50th percentile latency (median)
histogram_quantile(0.5, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# 95th percentile latency
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# 99th percentile latency
histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# Average latency
sum(rate(http_request_duration_seconds_sum[5m])) / sum(rate(http_request_duration_seconds_count[5m]))
```

### Resource Queries

```promql
# CPU usage percentage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage percentage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Disk usage percentage
(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100

# Network receive rate (bytes per second)
irate(node_network_receive_bytes_total{device="eth0"}[5m])
```

### Application-Specific Queries

```promql
# Active database connections
pg_stat_activity_count

# Cache hit ratio
pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read)

# Redis memory usage
redis_memory_used_bytes / redis_memory_max_bytes

# Queue depth
rabbitmq_queue_messages_ready
```

## Alert Rules

Alert rules define conditions that trigger notifications. They are the bridge between metrics and action.

```yaml
# rules/alerts.yml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"

      - alert: HighLatency
        expr: histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m]))) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "p95 latency is {{ $value }}s for the last 5 minutes"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "Service {{ $labels.job }} has been down for more than 1 minute"

  - name: infrastructure
    rules:
      - alert: HighCPU
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}% on {{ $labels.instance }}"

      - alert: HighMemory
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}% on {{ $labels.instance }}"

      - alert: DiskSpaceLow
        expr: (1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 > 85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space low"
          description: "Disk usage is {{ $value }}% on {{ $labels.instance }}"
```

The `for` field specifies how long the condition must be true before the alert fires. This prevents false positives from momentary spikes. A 5-minute threshold means the error rate must be above 5% for 5 consecutive minutes.

## Alertmanager Configuration

Alertmanager receives alerts from Prometheus and routes them to notification channels.

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/T00/B00/xxx'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}\n{{ end }}'

  - name: 'slack-warnings'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/T00/B00/xxx'
        channel: '#alerts-warnings'
        title: '{{ .GroupLabels.alertname }}'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'your-pagerduty-key'
        description: '{{ .GroupLabels.alertname }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

Alertmanager groups related alerts, deduplicates notifications, and routes them based on severity. Critical alerts go to PagerDuty. Warnings go to Slack. The `inhibit_rules` section suppresses warnings when a critical alert is already firing for the same alert and instance.

### Alert Fatigue

Alert fatigue occurs when engineers receive so many alerts that they start ignoring them. It is the most common monitoring anti-pattern. The symptoms are clear: alerts go unacknowledged, incidents take longer to resolve, and the team starts treating all alerts as noise.

The fix is systematic alert pruning:
1. Review all active alerts in the last 30 days
2. For each alert, ask: "Did someone take action on this?"
3. If no one acted, either make it actionable or delete it
4. If people acted but the response was wrong, update the runbook
5. Set a recurring calendar to review alerts monthly

The target is 5-10 meaningful alerts per week. If you have more than that, your monitoring needs tuning.

## ELK/EFK Stack for Log Aggregation

The ELK stack (Elasticsearch, Logstash, Kibana) or EFK stack (Elasticsearch, Fluentd, Kibana) collects, indexes, and visualizes logs from all services.

```yaml
services:
  elasticsearch:
    image: elasticsearch:7.17.17
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=changeme
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    deploy:
      resources:
        limits:
          memory: 2G

  kibana:
    image: kibana:7.17.17
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=kibana
      - ELASTICSEARCH_PASSWORD=changeme
    depends_on:
      - elasticsearch

  fluentd:
    build: ./fluentd
    ports:
      - "24224:24224"
      - "24224:24224/udp"
    volumes:
      - ./fluentd/conf:/fluentd/etc
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

Fluentd configuration:

```xml
<!-- fluentd/conf/fluent.conf -->
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<filter **>
  @type parser
  key_name log
  reserve_data true
  <parse>
    @type json
  </parse>
</filter>

<match **>
  @type elasticsearch
  host elasticsearch
  port 9200
  user elastic
  password changeme
  index_name fluentd-${tag}
  <buffer>
    flush_interval 5s
    chunk_limit_size 2M
    retry_max_interval 30s
  </buffer>
</match>
```

Applications send logs to Fluentd using the Fluentd logging driver:

```yaml
services:
  app:
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        fluentd-async: "true"
        tag: "app.{{.Name}}"
```

Fluentd parses, transforms, and forwards logs to Elasticsearch. Kibana provides a web interface for searching and visualizing logs.

## Distributed Tracing with Jaeger

Tracing follows requests through distributed systems. Jaeger is an open-source tracing system that collects and visualizes traces.

```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:1.56
    ports:
      - "16686:16686"  # UI
      - "6831:6831/udp"  # Thrift compact
      - "14268:14268"  # HTTP collector
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  # Add to your application service
  app:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
      - OTEL_SERVICE_NAME=my-app
      - OTEL_TRACES_SAMPLER=parentbased_traceidratio
      - OTEL_TRACES_SAMPLER_ARG=0.1
```

In your application, instrument requests:

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

OpenTelemetry automatically instruments HTTP requests, database queries, and other operations. Each request gets a trace ID, and each operation within the request gets a span ID. Jaeger collects these spans and visualizes the trace as a timeline.

The Jaeger UI shows:
- Which services a request touched
- How long each service took
- Where errors occurred
- The parent-child relationship between spans

This is invaluable for debugging "the API is slow" because you can see exactly where the time was spent.

## SLOs and Error Budgets

Service Level Objectives (SLOs) define the reliability targets for your service. They are the bridge between technical metrics and business requirements.

An SLO is a target percentage for a metric. For example:
- **Availability SLO:** 99.9% of requests succeed (return 2xx)
- **Latency SLO:** 99% of requests complete in under 500ms
- **Error rate SLO:** Less than 0.1% of requests result in 5xx errors

The error budget is the inverse of the SLO. If your SLO is 99.9%, your error budget is 0.1%. This means you can have 0.1% of requests fail before you violate the SLO.

```promql
# SLO: 99.9% of requests succeed
# Error budget: 0.1% of requests can fail

# Actual success rate over 30 days
sum(rate(http_requests_total{status_code!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))

# Remaining error budget
(0.001 - (1 - sum(rate(http_requests_total{status_code!~"5.."}[30d])) / sum(rate(http_requests_total[30d])))) / 0.001

# Error budget burn rate (how fast you are consuming the budget)
(1 - sum(rate(http_requests_total{status_code!~"5.."}[1h])) / sum(rate(http_requests_total[1h]))) / 0.001
```

Error budgets inform decision-making. If you have plenty of budget remaining, you can ship risky changes. If your budget is nearly exhausted, you should focus on reliability. If you exhaust your budget, you stop feature development and fix reliability issues.

This is not a punishment — it is a feedback mechanism. SLOs tell you whether you are meeting user expectations. Error budgets tell you how much risk you can afford to take.

## Real Story: Finding a Memory Leak with Prometheus

A team noticed that their Node.js application was restarting every few hours. The Kubernetes pod would run out of memory, get OOM-killed, and restart. The application was a REST API serving about 1,000 requests per second.

The first clue came from the Grafana dashboard. The memory usage chart showed a sawtooth pattern: memory usage climbed steadily over several hours, then dropped sharply when the pod restarted. This is the classic signature of a memory leak.

The team zoomed in on the memory metrics:

```promql
# Process memory usage
nodejs_process_memory_heap_used_bytes

# Memory growth rate
deriv(nodejs_process_memory_heap_used_bytes[1h])
```

The `deriv` function calculated the rate of memory growth. It showed that memory was growing at about 5 MB per hour. At that rate, the 512 MB limit would be reached in about 4 days.

To find the leak, they needed to identify what was consuming memory. They added more detailed metrics:

```javascript
const v8 = require('v8');

// Heap size by space
const heapStats = v8.getHeapStatistics();
const heapUsed = new Gauge({
  name: 'nodejs_v8_heap_used_bytes',
  help: 'V8 heap used bytes',
  labelNames: ['space'],
});

// Record heap stats every 30 seconds
setInterval(() => {
  const stats = v8.getHeapSpaceStatistics();
  stats.forEach(space => {
    heapUsed.set({ space: space.space_name }, space.space_used_size);
  });
}, 30000);
```

The Grafana dashboard showed that the "old_space" was growing while "new_space" was stable. This indicated that objects were being promoted to the old generation heap and never collected.

The team enabled heap snapshots:

```javascript
const v8 = require('v8');
const fs = require('fs');

// Take heap snapshot when memory exceeds 400 MB
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 400 * 1024 * 1024) {
    const snapshot = v8.writeHeapSnapshot();
    console.log(`Heap snapshot written to ${snapshot}`);
  }
}, 60000);
```

They analyzed the heap snapshot in Chrome DevTools. The "Retainers" view showed that a `Map` object was accumulating entries that were never deleted. The application was caching API responses in memory, but the cache had no eviction policy. Over time, the cache grew until it consumed all available memory.

The fix was simple: replace the unbounded `Map` with an LRU cache that evicts old entries:

```javascript
const LRU = require('lru-cache');

const cache = new LRU({
  max: 1000,           // Maximum 1000 entries
  ttl: 1000 * 60 * 5,  // 5-minute TTL
});
```

After deploying the fix, the memory usage stabilized at about 150 MB. The sawtooth pattern disappeared. The pod stopped restarting.

The lesson: Prometheus metrics detected the symptom (memory growth), but finding the root cause required deeper investigation with heap snapshots. The combination of metrics for detection and profiling for root cause analysis is the standard approach for debugging performance issues in production.

## Observability Best Practices

### Structured Logging

Structured logs are machine-parseable. Instead of free-text log lines, use structured formats like JSON:

```javascript
// Bad: unstructured log
logger.info('User logged in: ' + userId);

// Good: structured log
logger.info('User logged in', {
  userId: userId,
  duration: loginDuration,
  method: loginMethod,
  ip: req.ip,
});
```

Structured logs can be queried by field. You can search for all log entries where `userId = "abc123"` or `loginDuration > 5000`. Unstructured logs require text parsing, which is slow and error-prone.

### Metric Naming Conventions

Consistent metric naming makes dashboards and alerts easier to maintain:

```
# Format: <namespace>_<subsystem>_<name>_<unit>
http_requests_total
http_request_duration_seconds
node_cpu_usage_percentage
postgres_connections_active

# Use _total for counters
http_requests_total

# Use _seconds for durations
http_request_duration_seconds

# Use _bytes for sizes
node_memory_usage_bytes
```

Follow the Prometheus naming conventions. They are documented in the Prometheus best practices guide and are widely adopted across the ecosystem.

### Dashboard Design

Good dashboards answer questions. Bad dashboards show data. The difference is context:

**Bad dashboard:** A graph of CPU usage over time. So what? Is 80% CPU a problem? It depends on the application, the time of day, and the historical baseline.

**Good dashboard:** A graph of CPU usage with a threshold line at 90%, annotations showing deployments, and a related panel showing error rate. Now you can see if the CPU spike correlates with a deployment and whether it caused errors.

Dashboard best practices:
1. Start with the RED metrics (Rate, Errors, Duration) for each service
2. Add USE metrics (Utilization, Saturation, Errors) for infrastructure
3. Include deployment annotations to correlate changes with metrics
4. Group related panels together (application, database, infrastructure)
5. Use consistent time ranges across panels (usually 1 hour for operational dashboards)

## Assessment

**Lab Task 1: Prometheus and Grafana Setup (90 minutes)**

Set up a monitoring stack with:
1. Prometheus scraping metrics from a sample application
2. Grafana with dashboards for:
   - Request rate and error rate
   - Response latency (p50, p95, p99)
   - CPU and memory usage
3. Alert rules for high error rate and high latency
4. Alertmanager routing alerts to a test webhook

Document the setup and explain each component.

Grading criteria: Prometheus scraping correctly (20%), Grafana dashboards display useful data (30%), alert rules trigger correctly (25%), Alertmanager routing works (15%), documentation (10%).

**Lab Task 2: PromQL Query Challenge (45 minutes)**

Given a Prometheus instance with sample data, write PromQL queries for:
1. Request rate by HTTP method
2. Error rate (4xx and 5xx separately)
3. p99 latency by endpoint
4. Top 5 endpoints by request volume
5. Memory usage as percentage of limit
6. Time since last deployment

Grading criteria: All 6 queries are correct (60%), queries are efficient (20%), results are accurate (20%).

**Lab Task 3: SLO and Error Budget Calculation (45 minutes)**

Given 30 days of request data:
1. Calculate the actual availability percentage
2. Determine if the SLO (99.9%) is being met
3. Calculate the remaining error budget
4. Calculate the error budget burn rate
5. Create a Grafana dashboard showing SLO compliance

Grading criteria: Calculations correct (40%), SLO compliance determined accurately (25%), error budget correctly calculated (20%), dashboard displays SLO information (15%).

**Lab Task 4: Log Aggregation Setup (60 minutes)**

Set up an EFK stack:
1. Elasticsearch for log storage
2. Fluentd for log collection
3. Kibana for log visualization
4. Configure a sample application to send logs to Fluentd
5. Create a Kibana dashboard showing log volume by service and log level

Document the setup and explain how logs flow from application to Kibana.

Grading criteria: All components running (30%), logs flow correctly (25%), Kibana dashboard works (25%), documentation explains log pipeline (20%).

## Evidence

The three pillars of observability (metrics, logs, traces) are defined in the OpenTelemetry documentation and the broader observability literature. The distinction between monitoring (detecting problems) and observability (understanding problems) is discussed in Charity Majors' work and the O'Reilly book "Observability Engineering."

Prometheus is a CNCF project documented at prometheus.io. The PromQL examples use standard functions (rate, histogram_quantile, deriv, sum) documented in the PromQL reference. The scrape configuration follows Prometheus best practices.

Grafana is documented at grafana.com. The provisioning configuration uses the standard Grafana provisioning format. The dashboard examples use common panel types (time series, stat, gauge).

The ELK/EFK stack is documented by Elastic (Elasticsearch, Kibana) and the Fluentd project. The Fluentd configuration uses the standard forward input and elasticsearch output.

Jaeger is a CNCF project documented at jaegertracing.io. The OpenTelemetry instrumentation follows the OpenTelemetry JavaScript SDK documentation. The trace visualization in Jaeger follows the W3C Trace Context specification.

SLOs and error budgets are documented in the Google SRE book "Site Reliability Engineering: How Google Runs Production Systems" and the follow-up "The Site Reliability Workbook." The error budget burn rate calculation is a standard SRE practice.

The memory leak debugging story follows standard Node.js memory profiling techniques. The heap snapshot analysis uses Chrome DevTools, which is documented in the Node.js debugging guide. The LRU cache solution is a common pattern for bounded caches in Node.js applications.