# Module 8: Monitoring and Logging

You cannot fix what you cannot see. When a server's disk fills up at 3 AM, when network throughput drops, when a service starts returning 500 errors, you need to know about it before your users do. This module covers the complete monitoring and logging stack: system logs, centralized log aggregation, metrics collection with Prometheus, visualization with Grafana, and alerting. You will build a monitoring system from scratch that watches your servers and tells you when something goes wrong.

## System Logs

### journald

systemd journal captures all service output, kernel messages, and syslog-compatible entries. Use `journalctl -b` for current boot logs, `-b -1` for previous boot, `-p err` for errors and above, `-u` with service name for specific services, `--since` and `--until` for time-based filtering, `-f` for real-time follow, `--disk-usage` to check space consumed, and `--vacuum-size` or `--vacuum-time` to clean up old logs.

Configure persistent storage in `/etc/systemd/journald.conf` by setting `Storage=persistent`, `SystemMaxUse` for maximum disk usage, `MaxRetentionSec` for how long to keep logs, and `Compress=yes` for compression. Always enable persistent storage on servers so logs survive reboots. Create `/var/log/journal` and run `systemd-tmpfiles --create --prefix /var/log/journal` to set up the directory structure.

### rsyslog

Traditional syslog forwards logs to a central server and filters by facility and severity. Configure `/etc/rsyslog.conf` to forward all logs with `*.* @@syslog-server:514` to a remote server using `@@` for TCP (reliable) or `@` for UDP (faster). You can filter specific facilities like `auth,authpriv.*`, send mail logs to separate files, and filter by program name with `:programname, isequal`.

### logrotate

Rotates log files to prevent disk exhaustion. Configure in `/etc/logrotate.d/` with frequency (daily, weekly, monthly), rotation count, compression with optional `delaycompress`, `missingok` to skip missing files, `notifempty` to skip empty files, `create` to set permissions on new files, `sharedscripts` for post-rotation commands, and `postrotate` to signal services to reopen log files.

Test with `logrotate -d` for dry run and `-f` for forced rotation. Important: many services need to be signaled after log rotation to reopen their log file handles. For nginx, send USR1 to the master process. For syslog, restart the service.

## Prometheus: Metrics Collection

Prometheus scrapes metrics from endpoints at regular intervals and stores them in a time-series database. It is the industry standard for infrastructure monitoring. The pull model means Prometheus connects to targets rather than targets pushing to Prometheus, which simplifies firewall rules and makes monitoring more reliable.

### node_exporter

The standard exporter for system metrics including CPU, memory, disk, and network. Download the binary from GitHub releases, copy to `/usr/local/bin`, create a systemd service to run it on port 9100 with collectors for systemd and processes, and enable the service. Install on every server you want to monitor.

The node_exporter exposes hundreds of metrics. Key ones include `node_cpu_seconds_total` for CPU time, `node_memory_MemAvailable_bytes` for available memory, `node_filesystem_avail_bytes` for free disk space, `node_network_receive_bytes_total` for network traffic, and `node_disk_io_time_seconds_total` for disk I/O.

### Prometheus Configuration

The main config file `prometheus.yml` defines global settings like `scrape_interval` (how often to collect metrics) and `evaluation_interval` (how often to evaluate alert rules), `rule_files` for alert rules, `alerting` configuration pointing to Alertmanager, and `scrape_configs` listing each target. Use `file_sd_configs` for dynamic target discovery that updates without restarting Prometheus.

### PromQL Essentials

PromQL is the query language for Prometheus. Key queries include CPU usage percentage by subtracting idle time from total, memory usage by comparing available to total, disk usage similarly, network throughput with `irate` for per-second rates, and HTTP error rates by filtering on status codes.

Common query patterns:
```promql
# CPU usage
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Disk usage
(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100

# Network throughput (bytes/sec)
irate(node_network_receive_bytes_total{device="eth0"}[5m])
```

### Alert Rules

Alert rules define conditions that trigger notifications. Each rule has an expression (PromQL query), a duration (how long the condition must be true before firing), labels for severity and instance identification, and annotations for human-readable summary and description.

Common alerts include high CPU (above 85% for 5 minutes), high memory (above 90% for 5 minutes), low disk space (above 85% warning, above 95% critical), service down (up == 0 for 1 minute), and high disk I/O (above 90% utilization for 15 minutes).

## Grafana: Visualization

Grafana connects to Prometheus and other data sources to build dashboards. Install via Docker or package manager, add Prometheus as a data source, and import community dashboards for instant visibility. Popular dashboard IDs include 1860 for Node Exporter Full, 7362 for PostgreSQL, 763 for Redis, and 12708 for Nginx.

### Building Custom Dashboards

Create panels for CPU usage as time series, memory usage as a gauge, disk usage as a bar chart, network traffic as time series, service status as stat panels, HTTP request rate, and error rate. Use variables for instance selection so one dashboard covers all servers. Organize panels into rows for logical grouping.

### Alerting in Grafana

Configure contact points for email, Slack, or webhook notifications. Create alert rules on dashboard panels with thresholds. Grafana alerting provides a visual interface separate from Prometheus alerting. Use notification channels that your team actually monitors: Slack or PagerDuty are more effective than email for urgent alerts.

## Centralized Logging

### ELK Stack: Elasticsearch, Logstash, Kibana

ELK is the most widely deployed centralized logging solution. Filebeat runs on each server and ships logs to Logstash for parsing and enrichment, which forwards to Elasticsearch for storage and indexing, and Kibana provides the search and visualization UI.

Configure Filebeat with inputs for different log files and fields for service identification. Output to Elasticsearch with daily indices for easy management and rotation. Enable Kibana dashboards for quick setup.

### Loki plus Promtail

A lighter alternative to ELK designed for Grafana integration. Promtail is the log shipper, Loki stores and indexes labels rather than full text for efficiency, and Grafana queries Loki natively using LogQL. LogQL supports label filtering with pipe operators, line filtering with patterns, and line formatting for extraction.

Loki is significantly cheaper to operate than Elasticsearch because it does not index full text. It indexes only labels (like job, instance, level) and compresses log lines. This makes it ideal for high-volume environments where full-text search is not required.

## Building a Monitoring Stack from Scratch

Real scenario: you have 10 production servers with no monitoring. Services occasionally fail silently. Disk space runs out. You need a complete monitoring stack.

### Step 1: Deploy Prometheus

Create directories, deploy via Docker or binary, configure persistent storage, and verify it starts correctly. Set up a dedicated data volume for metrics retention.

### Step 2: Deploy Alertmanager

Configure Alertmanager with a global resolve timeout, routing rules to group alerts by name and instance, and receivers like Slack webhooks. Deploy via Docker and verify it receives alerts from Prometheus. Test by manually firing a test alert.

### Step 3: Install node_exporter on All Servers

Use Ansible or SSH loops to install node_exporter on every server. Create the node_exporter user, copy the binary, create the systemd service, and enable it. Verify each server is reachable by curling port 9100.

### Step 4: Configure Prometheus Scrape Targets

Update `prometheus.yml` with all servers. For dynamic environments, use file-based service discovery with target files that can be updated without restarting Prometheus. Add labels for environment identification.

### Step 5: Deploy Grafana and Create Dashboards

Import dashboard 1860 for node_exporter. Add alert rules for disk space, CPU, memory, and service availability. Configure contact points for notifications. Create a server overview dashboard with key metrics at a glance.

### Step 6: Add Application-Specific Exporters

Install nginx-exporter, postgres-exporter, and redis-exporter for application-level metrics. Add them to the Prometheus scrape config with appropriate jobs. These exporters provide database-specific metrics like connection counts, query latency, and cache hit rates.

### Step 7: Verify and Tune

After one week of data collection, review which alerts fired and adjust thresholds. Tune scrape intervals based on metric cardinality. Add recording rules for expensive queries to improve dashboard performance. Document the monitoring architecture in a runbook.

## Log Analysis Patterns

### Finding Errors in Logs

Count errors by service, find connection refused errors, extract failed login attempts by IP address, and find the slowest requests in web server logs. Use `journalctl` with `grep` and `awk` for analysis.

### Centralized Log Queries

In ELK Kibana, use Kibana Query Language for service filtering, status code ranges, and message pattern matching. In Loki Grafana, use LogQL for label filtering, line filtering, and log pipeline operations.

## Practical Assessment

**Lab Task:** Build a monitoring stack (60 minutes)

1. Deploy Prometheus using Docker or binary installation
2. Install and configure node_exporter on the monitoring host
3. Create a Prometheus configuration that scrapes node_exporter
4. Write alert rules for CPU above 80%, memory above 90%, and disk above 85%
5. Deploy Alertmanager with a webhook receiver
6. Deploy Grafana and add Prometheus as a data source
7. Import dashboard 1860 and create one custom panel
8. Set up logrotate for a sample application log
9. Configure rsyslog to forward auth logs to a remote file
10. Write PromQL queries for CPU, memory, disk, network, and HTTP error rate

**Grading criteria:** Prometheus running and scraping node_exporter (15 points), alert rules syntactically correct and functional (15 points), Alertmanager configured and receiving alerts (10 points), Grafana running with Prometheus data source (10 points), dashboard imported and custom panel working (15 points), logrotate configured correctly (10 points), rsyslog forwarding configured (5 points), all 5 PromQL queries return valid results (15 points), documentation of the complete stack (5 points).

## Monitoring Best Practices

### Alert Fatigue Prevention

Too many alerts desensitize operators. Implement tiered alerting: **critical** (page immediately, service down), **warning** (investigate within hours, high resource usage), **info** (review next business day, configuration changes). Use `for` duration in alert rules to avoid alerting on transient spikes. Group related alerts to reduce notification noise.

### Dashboard Design Principles

Organize dashboards with the most important metrics at the top. Use consistent color coding (green=good, yellow=warning, red=critical). Include time range selectors and instance variables for filtering. Create overview dashboards for at-a-glance status and detailed dashboards for troubleshooting.

### SLI/SLO/SLA Framework

Define Service Level Indicators (SLIs) as measurable metrics like uptime percentage, response time, and error rate. Set Service Level Objectives (SLOs) as targets like 99.9% uptime and p99 response time under 200ms. Service Level Agreements (SLAs) are business commitments backed by penalties. Monitor SLIs against SLOs to predict budget burn.

### Capacity Planning

Use monitoring data for capacity planning. Track growth trends in CPU, memory, disk, and network usage. Set alerts at 70% capacity to trigger planning before hitting limits. Review monthly trends to predict when upgrades are needed.

## Advanced PromQL

### Recording Rules

Pre-compute expensive queries and save them as new metrics. This improves dashboard performance and reduces Prometheus load.

```yaml
groups:
  - name: recording_rules
    rules:
      - record: instance:cpu:utilization:rate5m
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
      
      - record: instance:memory:utilization:ratio
        expr: 1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes
```

### Multi-Server Aggregations

```promql
# Average CPU across all servers
avg(100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100))

# Total disk space across all servers
sum(node_filesystem_size_bytes{mountpoint="/"})

# Servers with low disk space
count(node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} < 0.15)
```

### Predictive Queries

Use `predict_linear` to forecast when resources will be exhausted:

```promql
# Predict disk space 4 hours from now
predict_linear(node_filesystem_avail_bytes{mountpoint="/"}[1h], 4*3600) < 0
```

## ELK Stack Operational Considerations

### Index Lifecycle Management

Configure ILM (Index Lifecycle Management) in Elasticsearch to automatically manage indices. Define policies with hot (recent, fast storage), warm (older, slower storage), and cold (archived, cheapest storage) phases. Auto-delete indices older than retention period.

### Cluster Health Monitoring

Monitor Elasticsearch cluster health with `_cluster/health` API. Track node status, shard allocation, and disk watermarks. Set up alerts for yellow (replica shards unassigned) and red (primary shards unassigned) status.

### Log Volume Management

Control log volume at the source with filtering. In Filebeat, use processors to drop low-value fields, filter by log level, or sample high-volume logs. This reduces storage costs and improves query performance.

## Practical Assessment

**Lab Task:** Build a monitoring stack (60 minutes)

1. Deploy Prometheus using Docker or binary installation
2. Install and configure node_exporter on the monitoring host
3. Create a Prometheus configuration that scrapes node_exporter
4. Write alert rules for CPU above 80%, memory above 90%, and disk above 85%
5. Deploy Alertmanager with a webhook receiver
6. Deploy Grafana and add Prometheus as a data source
7. Import dashboard 1860 and create one custom panel
8. Set up logrotate for a sample application log
9. Configure rsyslog to forward auth logs to a remote file
10. Write PromQL queries for CPU, memory, disk, network, and HTTP error rate

**Grading criteria:** Prometheus running and scraping node_exporter (15 points), alert rules syntactically correct and functional (15 points), Alertmanager configured and receiving alerts (10 points), Grafana running with Prometheus data source (10 points), dashboard imported and custom panel working (15 points), logrotate configured correctly (10 points), rsyslog forwarding configured (5 points), all 5 PromQL queries return valid results (15 points), documentation of the complete stack (5 points).

## Prometheus High Availability

### Replication

Run multiple Prometheus instances scraping the same targets. Use Thanos or Cortex for long-term storage and global view across instances. For simple HA, run two identical Prometheus instances and use a load balancer in front of Alertmanager.

### Long-Term Storage

Prometheus is designed for short-term storage (weeks to months). For longer retention, use remote write to send metrics to Thanos, Cortex, or VictoriaMetrics. These systems provide long-term storage, global querying, and horizontal scaling.

## Grafana Advanced Features

### Dashboard Variables

Create dropdown selectors for instances, environments, and services. Use `$instance` variable with query `label_values(node_uname_info, nodename)` to dynamically list all monitored servers. This makes dashboards reusable across environments.

### Annotations

Add annotations to mark deployments, incidents, and maintenance windows. Annotations appear as vertical lines on graphs, providing context for metric changes. Use the Grafana API to add annotations programmatically from deployment scripts.

### Dashboard as Code

Use Grafonnet or grafana-grafana-element to define dashboards in JSON or code. Store in version control. Apply with provisioning or the API. This ensures consistent dashboards across environments and enables peer review of dashboard changes.

## Practical Assessment

**Lab Task:** Build a monitoring stack (60 minutes)

1. Deploy Prometheus using Docker or binary installation
2. Install and configure node_exporter on the monitoring host
3. Create a Prometheus configuration that scrapes node_exporter
4. Write alert rules for CPU above 80%, memory above 90%, and disk above 85%
5. Deploy Alertmanager with a webhook receiver
6. Deploy Grafana and add Prometheus as a data source
7. Import dashboard 1860 and create one custom panel
8. Set up logrotate for a sample application log
9. Configure rsyslog to forward auth logs to a remote file
10. Write PromQL queries for CPU, memory, disk, network, and HTTP error rate

**Grading criteria:** Prometheus running and scraping node_exporter (15 points), alert rules syntactically correct and functional (15 points), Alertmanager configured and receiving alerts (10 points), Grafana running with Prometheus data source (10 points), dashboard imported and custom panel working (15 points), logrotate configured correctly (10 points), rsyslog forwarding configured (5 points), all 5 PromQL queries return valid results (15 points), documentation of the complete stack (5 points).

## Evidence

Collect the following for your portfolio: Prometheus configuration file and scrape targets, alert rules file contents, screenshot of Grafana dashboard showing live metrics, screenshot of an alert firing in Alertmanager, PromQL queries with their output, logrotate configuration file, rsyslog configuration for remote forwarding, and architecture diagram of the monitoring stack.
