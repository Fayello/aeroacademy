import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
const SALT=10;
const ENC=process.env.LAB_ENCRYPTION_KEY||'aeroacademy-labs-default-key-change-in-production-32b!';
function enc(c:any[]){const k=crypto.scryptSync(ENC,ENC,32);const iv=crypto.randomBytes(16);const ci=crypto.createCipheriv('aes-256-cbc',k,iv);let e=ci.update(JSON.stringify(c),'utf8','hex');e+=ci.final('hex');return iv.toString('hex')+':'+e;}
async function h(a:string){return bcrypt.hash(a.trim().toLowerCase(),SALT);}
export async function seedScale82Labs(prisma: PrismaClient, key: string){
  console.log('  === Scaling 218→300 labs (+82) ===');
  const defs:[string,string,string,number,number][]=[
    // AI & MLOps 20
    ["AI Model Registry — MLflow at Scale","Centralized registry for 500 models with lineage and stage promotion.","python:3.12-alpine",1550,90],
    ["RAG Pipeline — LangChain + Qdrant","Production RAG with LangChain, Qdrant, and hybrid search.","python:3.12-alpine",1600,90],
    ["Fine-Tuning LLM with LoRA","Fine-tune 7B model with LoRA and evaluate on MMLU.","python:3.12-alpine",1650,120],
    ["Prompt Injection Defense Lab","Test prompt injection, jailbreak, and guardrail bypass.","python:3.12-alpine",1500,90],
    ["AI Observability — Phoenix & Arize","Trace LLM calls with Phoenix, monitor drift with Arize.","python:3.12-alpine",1550,90],
    ["Synthetic Data Generation with Gretel","Generate synthetic PII for training with Gretel and evaluate privacy.","python:3.12-alpine",1500,90],
    ["Federated Learning with Flower","Train across 5 silos with Flower, secure aggregation.","python:3.12-alpine",1600,90],
    ["AI Red Team — Model Extraction","Extract model via API query, test membership inference.","python:3.12-alpine",1650,90],
    ["NeMo Guardrails at Scale","Deploy NeMo guardrails for 10k rps with topical rails.","python:3.12-alpine",1550,90],
    ["ONNX Runtime — Edge Inference","Convert PyTorch to ONNX and serve at edge with quantization.","python:3.12-alpine",1500,90],
    ["Ray — Distributed Training","Scale training with Ray cluster and autoscaling.","python:3.12-alpine",1600,90],
    ["Weights & Biases — Experiment Tracking","Track 1k experiments with Sweeps and Weave.","python:3.12-alpine",1450,75],
    ["HuggingFace Hub — Private Registry","Host private Hub with Inference Endpoint.","python:3.12-alpine",1500,90],
    ["Label Studio — Human in the Loop","Annotate with Label Studio and active learning.","python:3.12-alpine",1450,75],
    ["Evidently — Data Drift Detection","Detect drift with Evidently and trigger retrain.","python:3.12-alpine",1500,90],
    ["BentoML — Model Serving","Serve with BentoML, adaptive batching, and A/B.","python:3.12-alpine",1550,90],
    ["DSPy — Prompt Optimization","Optimize prompts with DSPy and MIPRO.","python:3.12-alpine",1550,90],
    ["Reinforcement Learning — RLHF Lab","RLHF with TRL and PPO for alignment.","python:3.12-alpine",1650,120],
    ["AI Cost — GPU FinOps","FinOps for $500k/mo GPU with scheduling.","python:3.12-alpine",1500,90],
    ["AI Incident — Model Rollback","Rollback poisoned model via canary and shadow.","python:3.12-alpine",1550,90],
    // IT Expert 20
    ["ServiceNow — CMDB at Scale","CMDB for 50k CIs with discovery and health.","ubuntu:22.04",1550,90],
    ["PagerDuty — Incident Orchestration","Orchestrate 100 services with escalation and runbook automation.","ubuntu:22.04",1500,90],
    ["Statuspage — 10M Users Comms","Statuspage for 10M users with automation.","ubuntu:22.04",1450,75],
    ["Rundeck — Self-Service Ops","Rundeck for 200 runbooks with RBAC.","ubuntu:22.04",1500,90],
    ["Foreman — Bare Metal Lifecycle","Foreman for 1k bare metal with discovery.","ubuntu:22.04",1550,90],
    ["AWX — Tower at Scale","AWX for 500 jobs/day with workflow.","ubuntu:22.04",1500,90],
    ["NetBox — Source of Truth","NetBox for 10k devices with webhooks.","ubuntu:22.04",1500,90],
    ["LibreNMS — 5k Devices","LibreNMS for 5k devices with distributed pollers.","ubuntu:22.04",1500,90],
    ["Graylog — 1M EPS","Graylog for 1M events/sec with pipeline.","ubuntu:22.04",1600,90],
    ["Fleet — osquery at 10k","osquery Fleet for 10k hosts with live query.","ubuntu:22.04",1550,90],
    ["Vault — Transit Engine","Vault transit for 10k encryptions/sec.","ubuntu:22.04",1550,90],
    ["Consul — Service Discovery 500","Consul for 500 services with Connect.","ubuntu:22.04",1500,90],
    ["Nomad — 1k Jobs","Nomad for 1k jobs with constraints.","ubuntu:22.04",1550,90],
    ["Packer — Golden Image Pipeline","Packer for golden images with CIS hardening.","ubuntu:22.04",1450,75],
    ["Vagrant — Dev Env at Scale","Vagrant for 200 dev envs with provisioning.","ubuntu:22.04",1350,75],
    ["Chrony — Time at Scale","Chrony for 10k hosts with NTS.","ubuntu:22.04",1400,75],
    ["Auditd — Compliance at Scale","Auditd for 5k hosts with centralized SIEM.","ubuntu:22.04",1500,90],
    ["SELinux — Custom Policy","Custom SELinux policy for confined service.","quay.io/centos/centos:stream9",1600,90],
    ["AppArmor — Profile Hardening","AppArmor for 20 services with complain mode.","ubuntu:22.04",1500,90],
    ["Systemd — Hardened Units","Systemd with hardening (PrivateTmp, ProtectSystem).","ubuntu:22.04",1450,75],
    // DevOps Expert 15
    ["Tekton — 500 Pipelines","Tekton for 500 pipelines with workspaces.","ubuntu:22.04",1550,90],
    ["Spinnaker — Multi-Cloud Deploy","Spinnaker for multi-cloud with canary.","ubuntu:22.04",1600,90],
    ["Crossplane — Control Plane","Crossplane for 100 compositions with XR.","ubuntu:22.04",1600,90],
    ["Dagger — Programmable CI","Dagger for CI with CUE and caching.","ubuntu:22.04",1500,90],
    ["Earthly — Reproducible Builds","Earthly for reproducible builds with cache.","ubuntu:22.04",1450,75],
    ["BuildKit — Remote Cache","BuildKit with remote cache and SBOM.","ubuntu:22.04",1500,90],
    ["Kyverno — Policy at Scale","Kyverno for 200 policies with reports.","ubuntu:22.04",1550,90],
    ["OPA — Gatekeeper 100 Constraints","OPA Gatekeeper for 100 constraints with audit.","ubuntu:22.04",1550,90],
    ["Trivy — Image Scanning Gate","Trivy as admission gate with fail on HIGH.","ubuntu:22.04",1450,75],
    ["Sigstore — Keyless Signing","Sigstore keyless for 1k images with Fulcio/Rekor.","ubuntu:22.04",1550,90],
    ["In-Toto — Supply Chain Layout","In-Toto layout for 10 steps with threshold.","ubuntu:22.04",1550,90],
    ["SLSA — L3 Provenance","SLSA L3 provenance with hermetic builds.","ubuntu:22.04",1550,90],
    ["Harbor — Registry at Scale","Harbor with replication and retention.","ubuntu:22.04",1500,90],
    ["Nexus — Artifact 10TB","Nexus for 10TB artifacts with cleanup.","ubuntu:22.04",1450,75],
    ["Artifactory — Federated","JFrog federated with 3 sites.","ubuntu:22.04",1500,90],
    // Security Expert 15
    ["Threat Hunting — Sigma at Scale","Hunt with Sigma 500 rules and MDE.","kalilinux/kali-rolling",1550,90],
    ["EDR — CrowdStrike Falcon Lab","Tune Falcon with custom IOAs at 10k hosts.","kalilinux/kali-rolling",1600,90],
    ["SIEM — Sentinel 100GB/day","Sentinel for 100GB/day with KQL and watchlists.","kalilinux/kali-rolling",1550,90],
    ["SOAR — Cortex XSOAR 100 Playbooks","XSOAR with 100 playbooks and SLA.","kalilinux/kali-rolling",1600,90],
    ["CTI — MISP at Scale","MISP for 1M indicators with feed sync.","kalilinux/kali-rolling",1550,90],
    ["Deception — Canary Tokens 1k","1k canary tokens with OpenCanary.","kalilinux/kali-rolling",1500,90],
    ["ASM — Attack Surface 10k","ASM for 10k assets with Chaos/Subfinder.","kalilinux/kali-rolling",1550,90],
    ["Secrets — TruffleHog at Scale","TruffleHog for 10k repos with entropy.","kalilinux/kali-rolling",1500,90],
    ["AppSec — Semgrep 500 Rules","Semgrep for 500 rules with SARIF.","kalilinux/kali-rolling",1500,90],
    ["DAST — Nuclei 1k Templates","Nuclei for 1k templates with target.","kalilinux/kali-rolling",1550,90],
    ["Fuzzing — Jazzer for JVM","Jazzer for 10 services with corpus.","kalilinux/kali-rolling",1550,90],
    ["Supply Chain — Scorecard 500","OSSF Scorecard for 500 repos.","kalilinux/kali-rolling",1500,90],
    ["Identity — Okta 10k Users","Okta for 10k users with lifecycle.","kalilinux/kali-rolling",1500,90],
    ["Zero Trust — Zscaler Lab","Zscaler ZPA for 5k users with AppSegment.","kalilinux/kali-rolling",1550,90],
    ["Forensics — Velociraptor 5k","Velociraptor for 5k hosts with hunt.","remnux/remnux-cli",1600,90],
    // NetAdmin Expert 12
    ["MPLS — L3VPN at Scale","MPLS L3VPN for 100 VRFs with FRR.","ubuntu:22.04",1600,90],
    ["Segment Routing — SR-MPLS","SR-MPLS with FRR and TI-LFA.","ubuntu:22.04",1650,90],
    ["QoS — Hierarchical Shaping","HQoS for 10k subscribers with cake.","ubuntu:22.04",1500,90],
    ["NetFlow — 100G Analysis","NetFlow 100G with nfdump and SiLK.","ubuntu:22.04",1550,90],
    ["DHCP — Kea at 100k","Kea for 100k leases with HA.","ubuntu:22.04",1500,90],
    ["IPAM — phpIPAM 50k","phpIPAM for 50k IPs with API.","ubuntu:22.04",1450,75],
    ["802.1X — NAC with FreeRADIUS","NAC with FreeRADIUS and dynamic VLAN.","ubuntu:22.04",1550,90],
    ["WiFi — WPA3 Enterprise","WPA3 Enterprise with 500 APs.","ubuntu:22.04",1500,90],
    ["SD-WAN — 100 Sites","SD-WAN for 100 sites with Tailscale.","ubuntu:22.04",1550,90],
    ["Load Balancer — LVS at 10M","LVS for 10M conns with DR.","ubuntu:22.04",1600,90],
    ["DNSSEC — 1k Zones","DNSSEC for 1k zones with rotation.","ubuntu:22.04",1550,90],
    ["NTP — Chrony NTS Scale","Chrony NTS for 10k with monitoring.","ubuntu:22.04",1400,75],
  ];
  let created=0, skipped=0;
  for(const [title, desc, img, diff, mins] of defs){
    const ex=await prisma.lab.findFirst({where:{title}});
    if(ex){skipped++; continue;}
    const briefing=`### Mission Objective\n${desc} Expert IT at scale — verify HA and 1M+ ops.\n\n### Environment\n- Image: ${img}\n- Login: itadmin / ExpertIT2025!\n\n### Tasks\n1. Provision infra\n2. Deploy control plane\n3. Configure policy and verify\n4. Load/chaos test and capture flag\n5. Verify with stat\n6. Write runbook\n\n### Permissions & Access\n- Configs 644, keys 600\n- Verify: stat -c '%U:%G %a'\n`;
    const lab=await prisma.lab.create({data:{title, description: desc, dockerImage: img, briefing, tasks: ["Provision","Deploy","Configure","Test","Verify","Runbook"], credentials: enc([{service:'lab',username:'itadmin',password:'ExpertIT2025!'}]), imageUrl:'/images/labs/default.png', difficulty: diff, estimatedMinutes: mins}});
    for(const fl of [{title:'Flag',ans:'expert-flag',pts:300},{title:'Scale OK',ans:'scale-ok',pts:200},{title:'HA OK',ans:'ha-ok',pts:200}]){
      await prisma.labFlag.create({data:{labId: lab.id, title: fl.title, description: fl.title, correctAnswer: await h(fl.ans), points: fl.pts}});
    }
    created++;
  }
  console.log(`  Scale 82: ${created} created, ${skipped} skipped`);
}
