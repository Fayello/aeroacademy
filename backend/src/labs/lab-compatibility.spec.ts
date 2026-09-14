import { assessLabCompatibility, isLabLaunchable } from './lab-compatibility';

describe('lab compatibility', () => {
  it.each([
    ['systemd', 'Run systemctl is-active sshd', 'SYSTEMD_REQUIRED'],
    ['nested Docker', 'Run docker compose up -d', 'CONTAINER_RUNTIME_REQUIRED'],
    [
      'Kubernetes',
      'Initialize the cluster with kubeadm init',
      'KUBERNETES_REQUIRED',
    ],
    [
      'storage',
      'Create a volume with pvcreate /dev/sdb1',
      'PRIVILEGED_STORAGE_REQUIRED',
    ],
    [
      'network admin',
      'Apply an iptables firewall policy',
      'NETWORK_ADMIN_REQUIRED',
    ],
    [
      'kernel access',
      'Capture a profile with perf record',
      'KERNEL_ACCESS_REQUIRED',
    ],
    [
      'multiple nodes',
      'Join a worker node to the cluster',
      'MULTI_NODE_REQUIRED',
    ],
    [
      'cloud account',
      'Use AWS credentials to create an S3 bucket',
      'CLOUD_ACCOUNT_REQUIRED',
    ],
    [
      'missing assets',
      'Use the pre-created repository',
      'PREPROVISIONED_ASSETS_REQUIRED',
    ],
    ['hardware', 'Read values from a physical sensor', 'HARDWARE_REQUIRED'],
    [
      'desktop tooling',
      'Build the project in Android Studio',
      'DESKTOP_TOOLCHAIN_REQUIRED',
    ],
  ])('blocks %s requirements', (_name, task, expectedCode) => {
    const issues = assessLabCompatibility({ title: 'Test lab', tasks: [task] });

    expect(issues.map((issue) => issue.code)).toContain(expectedCode);
  });

  it('allows the repaired container-native process and service lab', () => {
    const lab = {
      title: 'Linux Fundamentals: Process & Service Management',
      description:
        'Control processes, container-native services, cron, and SSH configuration.',
      tasks: [
        'Find sshd processes with ps',
        'Restart SSH with the service command',
        'Validate configuration with sshd -t',
      ],
    };

    expect(isLabLaunchable(lab)).toBe(true);
  });

  it('does not block ordinary Dockerfile authoring without a nested runtime', () => {
    expect(
      isLabLaunchable({
        title: 'Dockerfile Fundamentals',
        tasks: ['Write and review a Dockerfile for a Node.js application'],
      }),
    ).toBe(true);
  });
});
