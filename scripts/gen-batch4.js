const bcrypt = require('bcrypt');
const crypto = require('crypto');
function h(a) { return bcrypt.hashSync(a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(), 10); }

const labs = {
  'db139ece-545f-4e2c-8b1d-df7107282748': [
    { t: 'Prometheus Config', d: 'Create /home/student/prometheus.yml with scrape_configs for localhost:9090. Run: cat /home/student/prometheus.yml | grep "job_name". What job name is defined?', a: 'node', p: 75 },
    { t: 'Grafana Installer', d: 'Run: apt-get install -y grafana 2>&1 | tail -1 || echo "grafana_available". What is the output?', a: 'grafana_available', p: 50 },
    { t: 'Alert Rule Writer', d: 'Create /home/student/alert.yml with: alert: HighMemory, expr: node_memory_MemFree_bytes < 100000000. Run: cat /home/student/alert.yml | grep "alert:". What is the alert name?', a: 'HighMemory', p: 100 },
    { t: 'Exporter Starter', d: 'Run: node_exporter --web.listen-address=":9100" & 2>/dev/null; sleep 2; curl -s localhost:9100/metrics | head -1 | awk "{print $1}". What is the first metric name?', a: '# HELP', p: 100 },
    { t: 'Dashboard JSON', d: 'Create /home/student/dashboard.json with Grafana JSON model containing title Test and type graph. Run: cat /home/student/dashboard.json | grep "title". What title is set?', a: 'Test', p: 100 },
    { t: 'Metric Query', d: 'Run: curl -s "localhost:9090/api/v1/query?query=up" 2>/dev/null | head -1 || echo "{}". Does Prometheus respond? (yes/no)', a: 'no', p: 75 },
    { t: 'Log Collector', d: 'Create /home/student/promtail.yml with positions config and scrape_configs for /var/log/*.log. Run: cat /home/student/promtail.yml | grep "positions". What path is in positions?', a: '/tmp/positions.yaml', p: 100 },
    { t: 'Silence Creator', d: 'Create /home/student/silence.json with matcher: alertname=HighMemory, duration=2h. Run: cat /home/student/silence.json | grep "duration". What duration is set?', a: '2h', p: 100 },
    { t: 'Recording Rule', d: 'Create /home/student/rules.yml with: record: job:http_requests:rate5m, expr: rate(http_requests_total[5m]). Run: cat /home/student/rules.yml | grep "record:". What recording rule name?', a: 'job:http_requests:rate5m', p: 100 },
    { t: 'Target Inspector', d: 'Create /home/student/targets.yml with static_configs for 2 targets (localhost:9100, localhost:9101). Run: cat /home/student/targets.yml | grep "targets" | wc -l. How many target entries?', a: '1', p: 100 },
    { t: 'Alertmanager Config', d: 'Create /home/student/alertmanager.yml with route: receiver: webhook, webhook_configs with URL http://localhost:9095. Run: cat /home/student/alertmanager.yml | grep "url". What URL?', a: 'http://localhost:9095', p: 100 },
    { t: 'Service Monitor', d: 'Create /home/student/servicemonitor.yml with spec.selector.matchLabels.app: myapp. Run: cat /home/student/servicemonitor.yml | grep "matchLabels" -A1 | tail -1. What label key?', a: 'app: myapp', p: 100 },
    { t: 'Exporter Metrics', d: 'Run: curl -s localhost:9100/metrics 2>/dev/null | grep "node_cpu_seconds_total" | head -1 | wc -c. How many chars in the metric line?', a: '1', p: 100 },
    { t: 'Grafana Folder', d: 'Create /home/student/grafana folders structure: provisioning/datasources/prometheus.yml with type: prometheus. Run: cat /home/student/grafana/provisioning/datasources/prometheus.yml | grep "type". What type?', a: 'prometheus', p: 100 },
    { t: 'Cleanup', d: 'Run: pkill node_exporter 2>/dev/null; echo "monitoring_done". What is the output?', a: 'monitoring_done', p: 75 },
  ],
  '81f17397-99f6-4313-b3f8-85897ba428c5': [
    { t: 'Rsyslog Config', d: 'Create /etc/rsyslog.d/50-custom.conf with: local0.* /var/log/custom.log. Run: cat /etc/rsyslog.d/50-custom.conf | head -1. What facility is configured?', a: 'local0.* /var/log/custom.log', p: 75 },
    { t: 'Log Writer', d: 'Run: logger -p local0.info "Test message" && cat /var/log/custom.log 2>/dev/null | tail -1 | awk "{print $NF}". What is the last word?', a: 'message', p: 75 },
    { t: 'Logrotate Creator', d: 'Create /etc/logrotate.d/custom with: /var/log/custom.log { daily rotate 7 }. Run: cat /etc/logrotate.d/custom | grep "rotate". What number of rotations?', a: 'rotate 7', p: 100 },
    { t: 'Logrotate Tester', d: 'Run: logrotate -d /etc/logrotate.d/custom 2>&1 | grep "rotation" | head -1. What status is shown?', a: 'rotating /var/log/custom.log', p: 100 },
    { t: 'Remote Logger', d: 'Add to rsyslog.conf: *.* @@localhost:514. Run: grep "@@" /etc/rsyslog.conf. What forwarding rule is shown?', a: '*.* @@localhost:514', p: 100 },
    { t: 'Log Analyzer', d: 'Create 10 log lines in /var/log/test.log. Run: awk "{print $1}" /var/log/test.log | sort | uniq -c | sort -rn | head -1. What is the most frequent first field?', a: '1', p: 100 },
    { t: 'Log Rotation Trigger', d: 'Run: logrotate -f /etc/logrotate.d/custom 2>&1 | grep "removing" | wc -l. How many files removed?', a: '0', p: 100 },
    { t: 'Log Direction', d: 'Add to rsyslog: local1.* /var/log/local1.log. Run: logger -p local1.warning "Warning test" && cat /var/log/local1.log 2>/dev/null | wc -l. How many log entries?', a: '1', p: 100 },
    { t: 'Log Format', d: 'Create /etc/rsyslog.d/10-syslog-template.conf with: $template customFormat,"%timegenerated% %msg%\n". Run: grep "template" /etc/rsyslog.d/10-syslog-template.conf | head -1. What template name?', a: 'customFormat', p: 100 },
    { t: 'Log Cleanup', d: 'Run: find /var/log -name "*.gz" -mtime +30 -delete 2>/dev/null; echo "log_cleanup_done". What is the output?', a: 'log_cleanup_done', p: 75 },
  ],
  '4e473789-f3ec-4fe2-9980-b0a400d9a8d4': [
    { t: 'Cluster Init', d: 'Run: kubeadm init --pod-network-cidr=10.244.0.0/16 2>&1 | tail -3 || echo "k8s_init_attempted". What is the output?', a: 'k8s_init_attempted', p: 50 },
    { t: 'Node List', d: 'Run: kubectl get nodes 2>&1 | tail -1 || echo "not_ready". What node status is shown?', a: 'not_ready', p: 50 },
    { t: 'Namespace Creator', d: 'Run: kubectl create namespace dev 2>&1 || echo "namespace_exists". What is the output?', a: 'namespace/dev created', p: 75 },
    { t: 'Pod Launcher', d: 'Run: kubectl run nginx --image=nginx --port=80 -n dev 2>&1 || echo "pod_started". What is the output?', a: 'pod/nginx created', p: 75 },
    { t: 'Deployment Crafter', d: 'Create /home/student/deployment.yml with deployment for nginx:3 replicas. Run: kubectl apply -f /home/student/deployment.yml 2>&1. What is created?', a: 'deployment.apps/web created', p: 100 },
    { t: 'Service Creator', d: 'Run: kubectl expose deployment web --port=80 --type=NodePort -n dev 2>&1 || echo "svc_created". What is the output?', a: 'service/web exposed', p: 100 },
    { t: 'ConfigMap Maker', d: 'Run: kubectl create configmap myconfig --from-literal=key1=value1 -n dev 2>&1. What is created?', a: 'configmap/myconfig created', p: 100 },
    { t: 'Secret Creator', d: 'Run: kubectl create secret generic mysecret --from-literal=password=secret123 -n dev 2>&1. What is created?', a: 'secret/mysecret created', p: 100 },
    { t: 'Rollback Master', d: 'Run: kubectl rollout undo deployment/web -n dev 2>&1 || echo "rollback_done". What is the output?', a: 'deployment.apps/web rolled back', p: 100 },
    { t: 'Resource Quota', d: 'Create /home/student/quota.yml with: hard pods=10, cpu=2, memory=4Gi. Apply it. Run: kubectl get quota -n dev. What quota name is shown?', a: 'myquota', p: 100 },
    { t: 'Label Applier', d: 'Run: kubectl label nodes localhost env=dev 2>&1 || echo "labeled". What is the output?', a: 'node/localhost labeled', p: 100 },
    { t: 'Pod Inspector', d: 'Run: kubectl get pods -n dev -o wide 2>&1 | head -2. What status is shown for nginx pod?', a: 'Running', p: 75 },
    { t: 'Log Fetcher', d: 'Run: kubectl logs nginx -n dev 2>&1 | head -1 || echo "no_logs". What is the output?', a: 'no_logs', p: 100 },
    { t: 'Exec Operator', d: 'Run: kubectl exec nginx -n dev -- echo "connected" 2>&1 || echo "exec_attempted". What is the output?', a: 'connected', p: 100 },
    { t: 'Cluster Cleanup', d: 'Run: kubectl delete namespace dev 2>&1 && echo "k8s_cleanup_done". What is the output?', a: 'namespace "dev" deleted', p: 75 },
  ],
};

const lines = [];
for (const [labId, flags] of Object.entries(labs)) {
  for (const f of flags) {
    const id = crypto.randomUUID();
    lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${labId}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
  }
}
console.log(lines.join('\n'));
