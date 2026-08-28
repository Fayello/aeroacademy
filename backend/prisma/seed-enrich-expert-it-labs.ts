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
async function hashAnswer(a: string) { return bcrypt.hash(a.trim().toLowerCase(), SALT_ROUNDS); }

export async function seedEnrichExpertITLabs(prisma: PrismaClient, encryptionKey: string) {
  console.log('  === Seeding 32 EXPERT IT labs (1550-1700) ===');
  const defs: [string,string,string,number,number,string][] = [
    ["Multi-Cluster GitOps at Scale — ArgoCD","Federate 3 K8s clusters with ArgoCD ApplicationSets, sync waves and automated promotion.","ubuntu:22.04",1650,120,
`### Mission Objective
Operate multi-cluster GitOps for 50+ services. Sync waves, health checks and promotion gates — expert platform level.

### Environment
- Image: ubuntu:22.04
- Tools: k3d, ArgoCD, Helm, Kustomize
- Login: itadmin / ExpertIT2025!

### Tasks
1. Bootstrap 3 k3d clusters and register to ArgoCD
2. Deploy ApplicationSet with generators and sync waves
3. Implement promotion gate via AnalysisTemplate
4. Test failover by killing cluster and verifying reschedule
5. Capture flag after successful promotion

### Permissions & Access
- Configs 644, keys 600, manifests 755
- Verify: stat -c '%U:%G %a' /etc/argocd/*
`],
    ["Progressive Delivery — Flagger & Istio","Canary 1%→100% with Flagger, Istio, Prometheus metrics and automated rollback.","ubuntu:22.04",1600,120,
`### Mission Objective
Ship canary with automated rollback on SLO breach.

### Environment
- Image: ubuntu:22.04
- Tools: Flagger, Istio, Prometheus
- Login: itadmin / ExpertIT2025!

### Tasks
1. Install Istio and Flagger
2. Deploy canary with 1% traffic
3. Inject error and verify rollback
4. Capture flag after successful promotion

### Permissions & Access
- Manifests 644, keys 600
- Verify: kubectl get canary
`],
    ["Platform Engineering — IDP with Backstage","Build Backstage IDP with TechDocs, scaffolder and catalog sync.","node:20-alpine",1550,120,
`### Mission Objective
Ship IDP for 100 engineers. Scaffolder, catalog, TechDocs — expert platform.

### Environment
- Image: node:20-alpine
- Tools: Backstage, Node, PostgreSQL
- Login: itadmin / ExpertIT2025!

### Tasks
1. Scaffold Backstage and configure catalog
2. Integrate GitHub and CI
3. Deploy TechDocs and verify
4. Capture flag

### Permissions & Access
- Configs 644, keys 600
- Verify: stat -c '%U:%G %a' app-config.yaml
`],
    ["eBPF — Cilium Network Policy at Scale","Enforce eBPF network policies via Cilium, Hubble observability at 10k pods.","ubuntu:22.04",1700,120,
`### Mission Objective
Replace iptables with eBPF. Cilium policy, Hubble, 10k pod scale.

### Environment
- Image: ubuntu:22.04
- Tools: Cilium, Hubble, bpftool
- Login: root / ExpertIT2025!

### Tasks
1. Install Cilium with eBPF
2. Write L7 policies and test
3. Verify Hubble flow logs
4. Capture flag

### Permissions & Access
- Privileged for eBPF, policies 644
- Verify: cilium status
`],
    ["Kernel Tuning — 100k Connections","Tune kernel for 100k concurrent connections: file-max, somaxconn, conntrack.","quay.io/centos/centos:stream9",1650,120,
`### Mission Objective
Tune kernel for C100k. Sysctl, limits, conntrack — expert sysadmin.

### Environment
- Image: quay.io/centos/centos:stream9
- Tools: sysctl, ulimit, ss, htop
- Login: root / ExpertIT2025!

### Tasks
1. Raise file-max, nr_open, somaxconn
2. Tune conntrack and test 100k
3. Capture flag after load test

### Permissions & Access
- Sysctl 644, limits 644
- Verify: sysctl -a | grep max
`],
    ["Ceph — 3-Node Distributed Storage","Deploy Ceph with CRUSH, pools, RBD and RGW at scale.","ubuntu:22.04",1700,120,
`### Mission Objective
Operate Ceph for 10TB. CRUSH, pools, RBD, RGW — expert storage.

### Environment
- Image: ubuntu:22.04
- Tools: Ceph, RBD, RGW
- Login: root / ExpertIT2025!

### Tasks
1. Bootstrap 3-node Ceph
2. Create pools with CRUSH rules
3. Provision RBD and test failover
4. Capture flag

### Permissions & Access
- Ceph configs 644, keys 600
- Verify: ceph status
`],
    ["BGP — Anycast at Scale","Deploy BGP anycast with BIRD, ECMP and graceful restart for 10 PoPs.","ubuntu:22.04",1650,120,
`### Mission Objective
Anycast 10 PoPs via BGP. BIRD, ECMP, graceful restart.

### Environment
- Image: ubuntu:22.04
- Tools: BIRD, ExaBGP
- Login: root / ExpertIT2025!

### Tasks
1. Configure BIRD with anycast prefix
2. Test ECMP and failover
3. Capture flag

### Permissions & Access
- BIRD configs 644
- Verify: birdc show route
`],
    ["EVPN-VXLAN — Data Center Fabric","Build EVPN-VXLAN fabric with FRR, VNI and Type-2/5 routes.","ubuntu:22.04",1650,120,
`### Mission Objective
EVPN fabric for multi-tenant DC. FRR, VXLAN, VNI.

### Environment
- Image: ubuntu:22.04
- Tools: FRR, iproute2
- Login: root / ExpertIT2025!

### Tasks
1. Configure EVPN with FRR
2. Provision VNI and verify Type-2
3. Capture flag

### Permissions & Access
- FRR configs 644
- Verify: vtysh -c 'show bgp evpn'
`],
    ["Large-Scale NAT — CGNAT with nftables","CGNAT for 100k subscribers with nftables sets and conntrack.","ubuntu:22.04",1600,120,
`### Mission Objective
CGNAT at scale. nftables sets, conntrack, logging.

### Environment
- Image: ubuntu:22.04
- Tools: nftables, conntrack
- Login: root / ExpertIT2025!

### Tasks
1. Configure CGNAT pool
2. Test with 10k flows
3. Capture flag

### Permissions & Access
- nft rules 644
- Verify: nft list ruleset
`],
    ["Vitess — Sharded MySQL at Scale","Shard MySQL with Vitess, VTGate and resharding online.","ubuntu:22.04",1650,120,
`### Mission Objective
Shard MySQL with Vitess. VTGate, reshard online.

### Environment
- Image: ubuntu:22.04
- Tools: Vitess, MySQL
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Vitess cluster
2. Reshard and verify
3. Capture flag

### Permissions & Access
- Vitess configs 644, keys 600
- Verify: vtctlclient ListAllTablets
`],
    ["Citus — Distributed PostgreSQL","Distribute Postgres with Citus, colocated joins and MX.","postgres:15-alpine",1600,120,
`### Mission Objective
Distribute PG with Citus. Shard 5 nodes, test joins.

### Environment
- Image: postgres:15-alpine
- Tools: Citus, psql
- Login: postgres / ExpertIT2025!

### Tasks
1. Install Citus extension
2. Shard tables and test
3. Capture flag

### Permissions & Access
- PG configs 644, keys 600
- Verify: SELECT * FROM citus_shards
`],
    ["ClickHouse — Petabyte Analytics","Tune ClickHouse for petabyte, MergeTree and distributed queries.","ubuntu:22.04",1600,120,
`### Mission Objective
Petabyte analytics with ClickHouse. MergeTree, distributed.

### Environment
- Image: ubuntu:22.04
- Tools: ClickHouse, Grafana
- Login: root / ExpertIT2025!

### Tasks
1. Deploy 3-node ClickHouse
2. Tune MergeTree and test
3. Capture flag

### Permissions & Access
- Configs 644
- Verify: clickhouse-client -q 'select 1'
`],
    ["Kubeflow — MLOps at Scale","Deploy Kubeflow pipelines, Katib and model registry for 100 models.","python:3.12-alpine",1650,120,
`### Mission Objective
MLOps at scale. Kubeflow, Katib, registry.

### Environment
- Image: python:3.12-alpine
- Tools: Kubeflow, Katib, MLflow
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Kubeflow
2. Run pipeline and tune via Katib
3. Capture flag

### Permissions & Access
- Kubeflow configs 644
- Verify: kubectl get pods -n kubeflow
`],
    ["LLM Serving — vLLM with PagedAttention","Serve LLM with vLLM, PagedAttention, 10k RPS and autoscaling.","python:3.12-alpine",1700,120,
`### Mission Objective
Serve LLM at 10k RPS. vLLM, PagedAttention, autoscale.

### Environment
- Image: python:3.12-alpine
- Tools: vLLM, FastAPI
- Login: root / ExpertIT2025!

### Tasks
1. Deploy vLLM with PagedAttention
2. Load test 10k RPS
3. Capture flag

### Permissions & Access
- Model 644, config 644
- Verify: curl /health
`],
    ["Vector DB — Qdrant at Scale","Operate Qdrant vector DB for 100M vectors, HNSW and sharding.","python:3.12-alpine",1600,120,
`### Mission Objective
Vector DB at 100M. Qdrant, HNSW, sharding.

### Environment
- Image: python:3.12-alpine
- Tools: Qdrant, Python
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Qdrant cluster
2. Ingest 1M vectors and query
3. Capture flag

### Permissions & Access
- Qdrant configs 644
- Verify: curl /collections
`],
    ["GPU Orchestration — NVIDIA K8s","Orchestrate GPUs with NVIDIA operator, time-slicing and MIG.","ubuntu:22.04",1650,120,
`### Mission Objective
GPU at scale. NVIDIA operator, MIG, time-slicing.

### Environment
- Image: ubuntu:22.04
- Tools: NVIDIA operator, K8s
- Login: root / ExpertIT2025!

### Tasks
1. Install GPU operator
2. Configure MIG and test
3. Capture flag

### Permissions & Access
- GPU configs 644
- Verify: nvidia-smi
`],
    ["Feature Store — Feast at Scale","Deploy Feast feature store with 10k features and online serving.","python:3.12-alpine",1550,120,
`### Mission Objective
Feature store for 10k features. Feast, online serving.

### Environment
- Image: python:3.12-alpine
- Tools: Feast, Redis
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Feast with Redis
2. Serve features and test
3. Capture flag

### Permissions & Access
- Feast configs 644
- Verify: feast apply
`],
    ["Chaos Engineering — Litmus at Scale","Chaos 100 microservices with Litmus, SLO guards and rollback.","ubuntu:22.04",1600,120,
`### Mission Objective
Chaos at scale. Litmus, SLO, rollback.

### Environment
- Image: ubuntu:22.04
- Tools: Litmus, Prometheus
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Litmus
2. Run chaos and verify SLO
3. Capture flag

### Permissions & Access
- Chaos configs 644
- Verify: kubectl get chaosengine
`],
    ["Performance — k6 at 1M RPS","Load test 1M RPS with k6, distributed and analyze bottlenecks.","ubuntu:22.04",1650,120,
`### Mission Objective
1M RPS with k6. Distributed, bottleneck analysis.

### Environment
- Image: ubuntu:22.04
- Tools: k6, Grafana
- Login: root / ExpertIT2025!

### Tasks
1. Run distributed k6
2. Analyze bottleneck
3. Capture flag

### Permissions & Access
- k6 scripts 755, configs 644
- Verify: k6 run --vus 1000
`],
    ["Contract Testing — Pact at Scale","Pact for 50 services with broker, can-i-deploy and versioning.","node:20-alpine",1550,120,
`### Mission Objective
Contract testing 50 services. Pact, broker, can-i-deploy.

### Environment
- Image: node:20-alpine
- Tools: Pact, Node
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Pact broker
2. Verify 50 contracts
3. Capture flag

### Permissions & Access
- Pact configs 644
- Verify: pact-broker can-i-deploy
`],
    ["Synthetic Monitoring — Playwright at Scale","Synthetic 100 journeys with Playwright, sharding and tracing.","node:20-alpine",1550,120,
`### Mission Objective
Synthetic monitoring 100 journeys. Playwright, sharding.

### Environment
- Image: node:20-alpine
- Tools: Playwright
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Playwright grid
2. Run 100 journeys
3. Capture flag

### Permissions & Access
- Playwright configs 644
- Verify: npx playwright test
`],
    ["Service Mesh — Istio Ambient at Scale","Istio ambient mesh for 200 services, waypoint and HBONE.","ubuntu:22.04",1650,120,
`### Mission Objective
Ambient mesh 200 services. Istio, waypoint, HBONE.

### Environment
- Image: ubuntu:22.04
- Tools: Istio, Kiali
- Login: root / ExpertIT2025!

### Tasks
1. Install ambient mesh
2. Configure waypoint
3. Capture flag

### Permissions & Access
- Istio configs 644
- Verify: istioctl x precheck
`],
    ["Observability — OpenTelemetry at Scale","OTel for 1M spans/sec with collectors, tail sampling and Tempo.","ubuntu:22.04",1600,120,
`### Mission Objective
OTel 1M spans/sec. Collectors, sampling, Tempo.

### Environment
- Image: ubuntu:22.04
- Tools: OTel, Tempo, Grafana
- Login: root / ExpertIT2025!

### Tasks
1. Deploy OTel collectors
2. Configure tail sampling
3. Capture flag

### Permissions & Access
- OTel configs 644
- Verify: curl /metrics
`],
    ["Incident Response — SRE at Scale","Run SRE incident for 10M users with error budgets and postmortem.","ubuntu:22.04",1600,120,
`### Mission Objective
SRE incident 10M users. Error budgets, postmortem.

### Environment
- Image: ubuntu:22.04
- Tools: PagerDuty (sim), Statuspage
- Login: root / ExpertIT2025!

### Tasks
1. Trigger incident and page
2. Mitigate and write postmortem
3. Capture flag

### Permissions & Access
- Incident configs 644
- Verify: cat postmortem.md
`],
    ["FinOps — Multi-Cloud Cost at Scale","FinOps for $2M/mo across AWS/GCP/Azure with Kubecost and policy.","ubuntu:22.04",1550,120,
`### Mission Objective
FinOps $2M/mo. Kubecost, policy, rightsizing.

### Environment
- Image: ubuntu:22.04
- Tools: Kubecost, OPA
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Kubecost
2. Enforce policy and rightsizing
3. Capture flag

### Permissions & Access
- FinOps configs 644
- Verify: kubectl -n kubecost get pods
`],
    ["Zero Trust — BeyondCorp at Scale","BeyondCorp for 5k users with IAP, context-aware and device trust.","ubuntu:22.04",1650,120,
`### Mission Objective
BeyondCorp 5k users. IAP, device trust.

### Environment
- Image: ubuntu:22.04
- Tools: Pomerium, Okta (sim)
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Pomerium
2. Enforce device trust
3. Capture flag

### Permissions & Access
- Pomerium configs 644, keys 600
- Verify: pomerium --help
`],
    ["Vault — HSM at Scale","Vault with HSM, 10k secrets/sec and DR replication.","ubuntu:22.04",1600,120,
`### Mission Objective
Vault HSM 10k/sec. DR replication.

### Environment
- Image: ubuntu:22.04
- Tools: Vault, HSM (sim)
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Vault with HSM
2. Test DR replication
3. Capture flag

### Permissions & Access
- Vault configs 644, keys 600
- Verify: vault status
`],
    ["Supply Chain — SLSA L4 at Scale","SLSA L4 for 200 artifacts with Sigstore, Rekor and in-toto.","ubuntu:22.04",1600,120,
`### Mission Objective
SLSA L4 200 artifacts. Sigstore, Rekor, in-toto.

### Environment
- Image: ubuntu:22.04
- Tools: Sigstore, Rekor
- Login: root / ExpertIT2025!

### Tasks
1. Sign 200 artifacts with Cosign
2. Verify Rekor transparency
3. Capture flag

### Permissions & Access
- Artifacts 644, keys 600
- Verify: cosign verify
`],
    ["Data Mesh — Trino at Scale","Data mesh with Trino for petabyte, federation and governance.","ubuntu:22.04",1600,120,
`### Mission Objective
Data mesh petabyte. Trino, federation.

### Environment
- Image: ubuntu:22.04
- Tools: Trino, Hive
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Trino cluster
2. Federate 3 catalogs
3. Capture flag

### Permissions & Access
- Trino configs 644
- Verify: trino --execute 'select 1'
`],
    ["Edge — K3s at 1000 Sites","K3s at 1000 edge sites with Fleet and GitOps.","ubuntu:22.04",1650,120,
`### Mission Objective
Edge 1000 sites. K3s, Fleet, GitOps.

### Environment
- Image: ubuntu:22.04
- Tools: K3s, Fleet
- Login: root / ExpertIT2025!

### Tasks
1. Deploy K3s fleet
2. Rollout via GitOps
3. Capture flag

### Permissions & Access
- Fleet configs 644
- Verify: fleet list
`],
    ["Bare Metal — Tinkerbell at Scale","Bare metal provisioning with Tinkerbell for 500 servers.","ubuntu:22.04",1650,120,
`### Mission Objective
Bare metal 500 servers. Tinkerbell, DHCP, iPXE.

### Environment
- Image: ubuntu:22.04
- Tools: Tinkerbell, DHCP
- Login: root / ExpertIT2025!

### Tasks
1. Deploy Tinkerbell stack
2. Provision 5 simulated servers
3. Capture flag

### Permissions & Access
- Tinkerbell configs 644
- Verify: kubectl get hardware
`],
  ];

  let created = 0, skipped = 0;
  for (const [title, desc, img, diff, mins, briefing] of defs) {
    const existing = await prisma.lab.findFirst({ where: { title } });
    if (existing) { console.log(`  Skipped (exists): ${title}`); skipped++; continue; }
    const tasks = ["Provision infra","Install control plane","Configure policy and verify","Load test and capture flag","Verify permissions","Write runbook"];
    const lab = await prisma.lab.create({
      data: {
        title, description: desc, dockerImage: img, briefing,
        tasks, credentials: encryptCredentials([{ service: 'lab', username: 'itadmin', password: 'ExpertIT2025!' }]),
        imageUrl: '/images/labs/default.png', difficulty: diff, estimatedMinutes: mins,
      },
    });
    const flags = [
      { title: 'Flag Captured', description: 'Primary flag', ans: 'expert-it-flag', pts: 400 },
      { title: 'HA Verified', description: 'HA test passes', ans: 'ha-verified', pts: 300 },
      { title: 'Scale Tested', description: 'Scale test passes', ans: 'scale-ok', pts: 300 },
    ];
    for (const f of flags) {
      await prisma.labFlag.create({ data: { labId: lab.id, title: f.title, description: f.description, correctAnswer: await hashAnswer(f.ans), points: f.pts } });
    }
    console.log(`  Created EXPERT IT: ${title} (${diff})`); created++;
  }
  console.log(`  Expert IT labs: ${created} created, ${skipped} skipped`);
}
