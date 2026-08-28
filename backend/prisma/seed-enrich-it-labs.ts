import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const SALT_ROUNDS = 10;
const ENC_KEY = process.env.LAB_ENCRYPTION_KEY || 'aeroacademy-labs-default-key-change-in-production-32b!';
function encryptCredentials(c: any[]) {
  const key = crypto.scryptSync(ENC_KEY, ENC_KEY, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let e = cipher.update(JSON.stringify(c), 'utf8', 'hex');
  e += cipher.final('hex');
  return iv.toString('hex') + ':' + e;
}
async function hashAnswer(a: string) {
  return bcrypt.hash(a.trim().toLowerCase(), SALT_ROUNDS);
}

export async function seedEnrichITLabs(prisma: PrismaClient, encryptionKey: string) {
  console.log('  === Seeding 32 IT labs ===');
  const defs = [
    ["Samba4 AD Domain Controller — IT Lab","Deploy Samba4 as AD DC with DNS and user provisioning.","quay.io/centos/centos:stream9",1200,90],
    ["BIND9 Master-Slave DNS Replication","Configure BIND9 master-slave with zone transfers and TSIG.","ubuntu:22.04",1100,75],
    ["DHCP Failover & Dynamic DNS Updates","Set up ISC DHCP failover pair with DDNS to BIND9.","ubuntu:22.04",1150,75],
    ["NFSv4 High Availability with DRBD","Build HA NFSv4 using DRBD replication and Pacemaker.","debian:12",1250,90],
    ["iSCSI SAN — Target & Initiator","Provision iSCSI target with LVM backing and multipath.","debian:12",1300,90],
    ["LVM Thin Provisioning, Snapshots & Rollback","Master LVM thin pools, snapshots and merges.","ubuntu:22.04",1100,75],
    ["Centralized Logging with Rsyslog & Logrotate","Centralize logs via Rsyslog TLS and Logrotate retention.","ubuntu:22.04",1000,60],
    ["Postfix + Dovecot Mail Stack","Deploy Postfix MTA + Dovecot IMAP with virtual mailboxes.","debian:12",1300,90],
    ["Nginx Load Balancer — Health Checks","Configure Nginx upstream with active health checks.","nginx:1.27-alpine",1100,60],
    ["HAProxy TCP/HTTP Failover","Deploy HAProxy with ACLs and stick tables.","ubuntu:22.04",1200,75],
    ["Keepalived VRRP — Floating IP HA","Implement VRRP floating IP with health scripts.","ubuntu:22.04",1250,75],
    ["PostgreSQL Streaming Replication & Failover","Set up Postgres streaming replication and manual failover.","postgres:15-alpine",1300,90],
    ["MariaDB Galera Multi-Master Cluster","Build 3-node Galera with IST/SST handling.","ubuntu:22.04",1350,120],
    ["Redis Sentinel — Automatic Failover","Deploy Redis primary-replica with Sentinel quorum.","redis:7-alpine",1100,60],
    ["MongoDB Replica Set & Read Preferences","Configure MongoDB replica set and read routing.","mongo:4.4",1150,75],
    ["Elasticsearch Shard Allocation","Tune ES shards, replicas and allocation awareness.","ubuntu:22.04",1200,75],
    ["Grafana Enterprise Dashboards","Design Grafana dashboards with alerts and Loki.","grafana/grafana:11.0.0",1000,60],
    ["Prometheus + Alertmanager Routing","Wire alerts to Alertmanager with routing and inhibition.","prom/prometheus:v2.52.0",1100,60],
    ["ELK Pipeline — Filebeat to Kibana","Ship logs Filebeat → Elasticsearch → Kibana.","ubuntu:22.04",1300,90],
    ["Ansible Fleet Automation","Automate fleet with Ansible roles and inventory.","ubuntu:22.04",1050,75],
    ["Terraform Multi-Region VPC","Provision multi-region VPC with remote state.","ubuntu:22.04",1200,90],
    ["Docker Swarm — Overlay Networking","Deploy Swarm with overlay, secrets and rolling updates.","ubuntu:22.04",1100,75],
    ["Kubernetes Ingress with Cert-Manager","Expose services via Ingress-Nginx + Cert-Manager.","ubuntu:22.04",1250,90],
    ["Jenkins CI/CD for IT Teams","Set up Jenkins with agents and blue-green deploy.","ubuntu:22.04",1000,75],
    ["GitLab Self-Hosted Runner Fleet","Host GitLab CE with runner autoscaling.","ubuntu:22.04",1150,90],
    ["Nextcloud Hub — File Sync","Deploy Nextcloud with LDAP and S3 storage.","ubuntu:22.04",1100,75],
    ["Zabbix Distributed Monitoring","Deploy Zabbix server, proxies and autoregistration.","ubuntu:22.04",1200,90],
    ["Wazuh IT Compliance Dashboard","Ship compliance logs to Wazuh and build CIS dashboards.","ubuntu:22.04",1150,75],
    ["WireGuard Site-to-Site Migration","Migrate OpenVPN site-to-site to WireGuard.","ubuntu:22.04",1100,75],
    ["iptables/nftables Firewall","Harden host with nftables sets and rate limiting.","ubuntu:22.04",1050,60],
    ["Cockpit & SSSD — AD Integration","Join Linux to AD via SSSD/realmd and Cockpit.","quay.io/centos/centos:stream9",1000,75],
    ["Snipe-IT Asset Inventory","Deploy Snipe-IT with LDAP sync and lifecycle.","ubuntu:22.04",900,60],
  ] as const;

  let created = 0, skipped = 0;
  for (const [title, desc, img, diff, mins] of defs) {
    const existing = await prisma.lab.findFirst({ where: { title } });
    if (existing) { console.log(`  Skipped (exists): ${title}`); skipped++; continue; }
    const briefing = `### Mission Objective\nDeploy ${title.split(' —')[0]} for production IT use — verify HA, backup and monitoring.\n\n### Environment\n- Image: ${img}\n- Tools: systemd, bash, dig, ss, curl, journalctl\n- Login: itadmin / ItLab2025!\n\n### Tasks\n1. Provision base OS and update packages\n2. Install and configure primary service\n3. Create service users/groups and set permissions (chmod 644 configs, 755 scripts, 600 private keys)\n4. Verify with systemctl status and ss -tlnp\n5. Configure HA/replication and test failover\n6. Set up log shipping and verify with journalctl\n7. Create backup job and test restore\n8. Expose metrics and verify dashboard\n9. Document runbook and rollback steps\n10. Verify permissions with stat -c '%U:%G %a' on key paths\n\n### Permissions & Access\n- Container runs as root — use least privilege for service accounts\n- Configs 644 root:root, private keys 600, scripts 755\n- Verify: stat -c '%U:%G %a' /etc/service.conf\n`;
    const tasks = ["Provision OS","Install primary service","Create users and set permissions (644/755/600)","Verify systemctl and ss","Configure HA and test failover","Setup logging","Backup and restore test","Metrics dashboard"];
    const lab = await prisma.lab.create({
      data: {
        title, description: desc, dockerImage: img, briefing,
        tasks, credentials: encryptCredentials([{ service: 'lab', username: 'itadmin', password: 'ItLab2025!' }]),
        imageUrl: '/images/labs/default.png', difficulty: diff, estimatedMinutes: mins,
      },
    });
    const flags = [
      { title: 'Service Running', description: 'Primary service active', ans: 'service-active', pts: 100 },
      { title: 'HA Verified', description: 'Failover test passes', ans: 'ha-verified', pts: 200 },
      { title: 'Backup OK', description: 'Backup and restore validated', ans: 'backup-ok', pts: 150 },
    ];
    for (const f of flags) {
      await prisma.labFlag.create({ data: { labId: lab.id, title: f.title, description: f.description, correctAnswer: await hashAnswer(f.ans), points: f.pts } });
    }
    console.log(`  Created: ${title}`); created++;
  }
  console.log(`  IT labs: ${created} created, ${skipped} skipped`);
}
