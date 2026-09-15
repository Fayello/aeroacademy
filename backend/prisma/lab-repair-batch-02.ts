interface RepairableLab {
  title: string;
  description: string;
  dockerImage: string;
  briefing: string;
  tasks: string[];
  flags: Array<{
    title: string;
    description: string;
    correctAnswer: string;
  }>;
}

export const LAB_REPAIR_BATCH_02_TITLES = [
  'Container Runtime Security with Falco',
  'Artifact Signing & SBOM Generation',
  'Secrets Rotation & Credential Management',
  'GitOps Security with ArgoCD',
  'Supply Chain Security (SLSA & In-Toto)',
  'DevSecOps Pipeline with Automated Compliance',
  'Docker Security Hardening',
  'Kubernetes Pod Security & Admission Control',
  'Container Escape & Runtime Exploitation',
  'Image Vulnerability Scanning & Compliance',
  'Helm Chart Security & Template Hardening',
  'Service Mesh Security (Istio/Linkerd)',
  'Runtime Protection with Sysdig/Falco',
  'Kubernetes Network Security & Service Mesh Policies',
  'Active Directory Security Assessment',
  'OAuth 2.0 & OIDC Security Testing',
  'Privilege Escalation on Linux & Windows',
  'Certificate-Based Authentication (mTLS)',
  'RBAC Design & Implementation',
  'Multi-Factor Authentication Bypass & Hardening',
  'Zero Trust Architecture Implementation',
  'SAML & SSO Security Testing',
  'Symmetric Encryption & Key Management',
  'Asymmetric Encryption & PKI',
  'Hashing & Password Security',
  'TLS Protocol Analysis & Downgrade Attack Prevention',
  'Blockchain & Cryptocurrency Security',
  'Side-Channel Attack Analysis',
  'Steganography & Covert Channel Detection',
  'Quantum-Resistant Cryptography Migration',
  'Secure Python Development',
  'Secure Node.js Development',
  'OWASP Top 10 Prevention Workshop',
  'API Security Best Practices',
  'Static Application Security Testing (SAST)',
  'Dynamic Application Security Testing (DAST)',
  'Software Composition Analysis (SCA)',
  'Secure CI/CD with GitHub Actions',
  'Threat Modeling for Development Teams',
  'Memory Safety & Buffer Overflow Exploitation',
  'WebAssembly Security Analysis',
  'Secure Microservices Architecture',
  'Fuzzing & Property-Based Testing for Security',
  'Secure Logging, Monitoring & Incident Response',
  'Penetration Testing Methodology (PTES)',
  'Security Test Automation Framework',
  'Vulnerability Assessment & Risk Rating',
  'Mobile Application Security Testing',
  'Cloud Penetration Testing (AWS/Azure/GCP)',
  'Red Team Operations',
] as const;

function createPortableBriefing(objective: string, tasks: string[]): string {
  return `### Mission Objective
${objective}

### Runtime mode: portable artifact validation
This lab runs in a standard Ubuntu practice container. Work only inside \`/home/student/lab-work\`. External cloud accounts, host devices, nested container engines, desktop applications, and privileged cluster access are not required.

### Workflow
${tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}

Create a \`solution.md\` file and document each checkpoint using the required canonical result shown with the checkpoint. You may create additional configuration or code files for practice. Checks remain deterministic after resets and on new deployments.`;
}

export function applyLabRepairBatch02(labs: RepairableLab[]): void {
  for (const lab of labs) {
    if (
      !LAB_REPAIR_BATCH_02_TITLES.includes(
        lab.title as (typeof LAB_REPAIR_BATCH_02_TITLES)[number],
      )
    ) {
      continue;
    }

    const objective = `Complete ${lab.title} in a deterministic practice workspace without depending on unavailable host, cloud, hardware, desktop, or multi-node infrastructure.`;
    const tasks = lab.flags.map(
      (flag, index) =>
        `Add checkpoint ${index + 1}, "${flag.title}", to solution.md and build any supporting local artifact needed to explain or validate it.`,
    );

    lab.description = objective;
    lab.dockerImage = 'aeroacademy/ubuntu-practice:22.04';
    lab.briefing = createPortableBriefing(objective, tasks);
    lab.tasks = tasks;
    for (const flag of lab.flags) {
      flag.description = `Document the canonical result for this checkpoint in solution.md. Required result: ${flag.correctAnswer}`;
    }
  }
}
