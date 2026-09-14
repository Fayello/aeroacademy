export type LabCompatibilityIssueCode =
  | 'SYSTEMD_REQUIRED'
  | 'CONTAINER_RUNTIME_REQUIRED'
  | 'KUBERNETES_REQUIRED'
  | 'PRIVILEGED_STORAGE_REQUIRED'
  | 'NETWORK_ADMIN_REQUIRED'
  | 'KERNEL_ACCESS_REQUIRED'
  | 'MULTI_NODE_REQUIRED'
  | 'CLOUD_ACCOUNT_REQUIRED'
  | 'PREPROVISIONED_ASSETS_REQUIRED'
  | 'HARDWARE_REQUIRED'
  | 'DESKTOP_TOOLCHAIN_REQUIRED'
  | 'NONDETERMINISTIC_RUNTIME_OUTPUT';

export interface LabCompatibilityInput {
  title?: string | null;
  description?: string | null;
  briefing?: string | null;
  tasks?: unknown;
  flags?: unknown;
}

export interface LabCompatibilityIssue {
  code: LabCompatibilityIssueCode;
  reason: string;
}

const RULES: Array<{
  code: LabCompatibilityIssueCode;
  pattern: RegExp;
  reason: string;
}> = [
  {
    code: 'SYSTEMD_REQUIRED',
    pattern:
      /\b(systemctl|journalctl|systemd\s+(?:service|unit|target)|with\s+systemd)\b/i,
    reason:
      'requires systemd, but practice containers do not run systemd as PID 1',
  },
  {
    code: 'CONTAINER_RUNTIME_REQUIRED',
    pattern:
      /\b(docker\s+(?:compose|build|run|network|volume|swarm|info|ps)|dockerd|docker daemon|containerd runtime)\b/i,
    reason:
      'requires a nested container runtime that is not exposed to practice labs',
  },
  {
    code: 'KUBERNETES_REQUIRED',
    pattern: /\b(kubectl|kubeadm|kubelet|kind cluster|minikube|calico cni)\b/i,
    reason:
      'requires a Kubernetes cluster that is not provisioned for this lab',
  },
  {
    code: 'PRIVILEGED_STORAGE_REQUIRED',
    pattern:
      /\b(fdisk|parted|pvcreate|vgcreate|lvcreate|mdadm|mkfs(?:\.[a-z0-9]+)?|mount\s+\/dev|swapon|swapoff|create\s+a\s+raid|multiple virtual disks)\b/i,
    reason:
      'requires block devices or mount privileges unavailable in the sandbox',
  },
  {
    code: 'NETWORK_ADMIN_REQUIRED',
    pattern:
      /\b(iptables|nftables|firewall-cmd|ip\s+netns|tc\s+qdisc|vrrp|virtual ip address|keepalived)\b/i,
    reason:
      'requires host network-administration capabilities unavailable in the sandbox',
  },
  {
    code: 'KERNEL_ACCESS_REQUIRED',
    pattern:
      /\b(modprobe|insmod|rmmod|bpftrace|systemtap|perf\s+(?:record|stat|top)|kernel module|flame graph using perf)\b/i,
    reason:
      'requires kernel-level access blocked by the container security profile',
  },
  {
    code: 'MULTI_NODE_REQUIRED',
    pattern:
      /\b(multiple (?:nodes|servers|machines|containers)|join (?:a )?worker node|cluster of machines|multi-node)\b/i,
    reason:
      'requires multiple hosts or containers, but only one container is provisioned',
  },
  {
    code: 'CLOUD_ACCOUNT_REQUIRED',
    pattern:
      /\b(AWS credentials|Azure credentials|GCP credentials|cloud credentials|aws\s+(?:s3|ec2|cloudfront|iam|eks|rds|lambda)|az\s+(?:login|group|vm|aks)|gcloud\s+)\b/i,
    reason:
      'requires external cloud credentials or billable resources that are not provisioned',
  },
  {
    code: 'PREPROVISIONED_ASSETS_REQUIRED',
    pattern:
      /\b(pre[- ](?:installed|configured|created|generated)|credentials\s+(?:are\s+)?(?:configured|provided)|starter (?:project|repository|files)|sample data is in|working directory:\s*\/opt\/|available disks:)\b/i,
    reason:
      'depends on tools, credentials, files, or devices that the runtime does not create',
  },
  {
    code: 'HARDWARE_REQUIRED',
    pattern:
      /\b(Arduino|Raspberry Pi|GPIO|physical sensor|serial device|USB device|IoT gateway hardware|embedded board)\b/i,
    reason:
      'requires physical or emulated hardware that is not attached to the lab',
  },
  {
    code: 'DESKTOP_TOOLCHAIN_REQUIRED',
    pattern:
      /\b(Android Studio|Android SDK|Xcode|iOS simulator|mobile emulator|Unity Editor|Unreal Engine|Wireshark GUI)\b/i,
    reason:
      'requires a desktop IDE, GUI, or emulator unavailable in the browser terminal',
  },
  {
    code: 'NONDETERMINISTIC_RUNTIME_OUTPUT',
    pattern:
      /\b(what is the pid|submit (?:the )?(?:pid|kernel version|cpu model|total ram)|total size of the root partition|task-clock value|clusterip assigned|how many (?:pods|nodes|targets|rules|shards|cves).*(?:running|ready|up|active|found))\b/i,
    reason:
      'expects a fixed answer from runtime values that vary between containers or deployments',
  },
];

function flattenText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(flattenText).join('\n');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(flattenText)
      .join('\n');
  }
  return '';
}

export function assessLabCompatibility(
  lab: LabCompatibilityInput,
): LabCompatibilityIssue[] {
  const content = [
    lab.title || '',
    lab.description || '',
    lab.briefing || '',
    flattenText(lab.tasks),
    flattenText(lab.flags),
  ].join('\n');

  return RULES.filter((rule) => rule.pattern.test(content)).map(
    ({ code, reason }) => ({ code, reason }),
  );
}

export function isLabLaunchable(lab: LabCompatibilityInput): boolean {
  return assessLabCompatibility(lab).length === 0;
}
