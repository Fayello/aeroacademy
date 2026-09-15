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
    [
      'unstable runtime output',
      'Run uname -r and submit the kernel version',
      'NONDETERMINISTIC_RUNTIME_OUTPUT',
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

  it('allows privileged vocabulary in an explicit portable artifact lab', () => {
    expect(
      assessLabCompatibility({
        title: 'Systemd and firewall design',
        briefing: 'Runtime mode: portable artifact validation',
        tasks: [
          'Write a systemd unit file without running systemctl',
          'Record an iptables policy without applying it',
        ],
      }),
    ).toEqual([]);
  });

  it('does not hide nondeterministic output in portable artifact mode', () => {
    expect(
      assessLabCompatibility({
        briefing: 'Runtime mode: portable artifact validation',
        tasks: ['Submit the kernel version'],
      }).map((issue) => issue.code),
    ).toContain('NONDETERMINISTIC_RUNTIME_OUTPUT');
  });

  it('allows the repaired deterministic beginner cohort', () => {
    const labs = [
      {
        title: 'Linux Fundamentals: Ubuntu CLI Mastery',
        tasks: ['Change to /etc and confirm the current directory with pwd'],
      },
      {
        title: 'Linux Fundamentals: File Permissions & Users',
        tasks: ['Create /tmp/shared with mode 1777'],
      },
      {
        title: 'Linux Fundamentals: Text Processing & Shell Scripting',
        tasks: ['Create a three-line event log and count ERROR records'],
      },
      {
        title: 'Docker & Container Fundamentals',
        description:
          'Author and inspect secure Dockerfiles and Compose manifests',
        tasks: ['Write a Dockerfile based on node:20-alpine'],
      },
    ];

    expect(labs.every(isLabLaunchable)).toBe(true);
  });
});
