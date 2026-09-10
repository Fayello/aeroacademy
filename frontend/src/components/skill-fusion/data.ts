export interface SkillNode {
  id: string;
  name: string;
  domain: string;
  mastery: number; // 0-100
  color: string;
  position: [number, number, number];
}

export interface FusionRule {
  a: string;
  b: string;
  result: string;
  resultColor: string;
  description: string;
}

export const SKILLS: SkillNode[] = [
  {
    id: 'linux',
    name: 'Linux',
    domain: 'Systems',
    mastery: 82,
    color: '#f97316',
    position: [-2.5, 1.2, 0],
  },
  {
    id: 'networking',
    name: 'Networking',
    domain: 'Infrastructure',
    mastery: 61,
    color: '#3b82f6',
    position: [2.5, 1.2, 0],
  },
  {
    id: 'devops',
    name: 'DevOps',
    domain: 'Engineering',
    mastery: 68,
    color: '#22c55e',
    position: [0, 2.8, 0],
  },
  {
    id: 'security',
    name: 'Security',
    domain: 'Protection',
    mastery: 74,
    color: '#ef4444',
    position: [-1.5, -1.8, 0],
  },
  {
    id: 'cloud',
    name: 'Cloud',
    domain: 'Platforms',
    mastery: 55,
    color: '#8b5cf6',
    position: [1.5, -1.8, 0],
  },
  {
    id: 'databases',
    name: 'Databases',
    domain: 'Data',
    mastery: 45,
    color: '#06b6d4',
    position: [0, -2.8, 0],
  },
];

export const FUSIONS: FusionRule[] = [
  {
    a: 'security',
    b: 'devops',
    result: 'DevSecOps',
    resultColor: '#f59e0b',
    description: 'Security-first delivery pipelines',
  },
  {
    a: 'networking',
    b: 'cloud',
    result: 'Cloud Networking',
    resultColor: '#6366f1',
    description: 'VPCs, load balancers, service mesh',
  },
  {
    a: 'linux',
    b: 'devops',
    result: 'Platform Engineering',
    resultColor: '#10b981',
    description: 'Internal developer platforms',
  },
  {
    a: 'security',
    b: 'cloud',
    result: 'Cloud Security',
    resultColor: '#dc2626',
    description: 'Cloud-native threat detection',
  },
  {
    a: 'linux',
    b: 'security',
    result: 'Hardened Systems',
    resultColor: '#b91c1c',
    description: 'OS-level hardening and auditing',
  },
  {
    a: 'databases',
    b: 'cloud',
    result: 'Cloud Architecture',
    resultColor: '#7c3aed',
    description: 'Distributed data systems',
  },
  {
    a: 'networking',
    b: 'security',
    result: 'Network Security',
    resultColor: '#ef4444',
    description: 'Firewalls, IDS/IPS, packet analysis',
  },
  {
    a: 'devops',
    b: 'cloud',
    result: 'SRE',
    resultColor: '#059669',
    description: 'Reliability engineering at scale',
  },
  {
    a: 'linux',
    b: 'databases',
    result: 'DBA',
    resultColor: '#0891b2',
    description: 'Database administration and tuning',
  },
  {
    a: 'networking',
    b: 'linux',
    result: 'Sysadmin',
    resultColor: '#ea580c',
    description: 'Systems and network administration',
  },
];
