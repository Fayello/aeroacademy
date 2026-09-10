export type SkillCategory = 'tech' | 'science' | 'finance' | 'creative' | 'business';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  color: string;
  icon: string;
}

export interface Fusion {
  skillA: string;
  skillB: string;
  name: string;
  category: SkillCategory;
  description: string;
  whatTheyDo: string;
  whyItMatters: string;
}

export const CATEGORIES: Record<SkillCategory, { label: string; color: string; maxFusions: number }> = {
  tech: { label: 'Tech', color: '#3b82f6', maxFusions: 132 },
  science: { label: 'Science', color: '#8b5cf6', maxFusions: 90 },
  finance: { label: 'Finance', color: '#f59e0b', maxFusions: 74 },
  creative: { label: 'Creative', color: '#ec4899', maxFusions: 39 },
  business: { label: 'Business', color: '#10b981', maxFusions: 39 },
};

export const SKILLS: Skill[] = [
  { id: 'linux', name: 'Linux', category: 'tech', color: '#f97316', icon: '🐧' },
  { id: 'networking', name: 'Networking', category: 'tech', color: '#3b82f6', icon: '🌐' },
  { id: 'devops', name: 'DevOps', category: 'tech', color: '#22c55e', icon: '⚙️' },
  { id: 'security', name: 'Security', category: 'tech', color: '#ef4444', icon: '🛡️' },
  { id: 'cloud', name: 'Cloud', category: 'tech', color: '#8b5cf6', icon: '☁️' },
  { id: 'coding', name: 'Coding', category: 'tech', color: '#06b6d4', icon: '💻' },
  { id: 'ai_ml', name: 'AI/ML', category: 'tech', color: '#a855f7', icon: '🤖' },
  { id: 'quantum', name: 'Quantum', category: 'science', color: '#6366f1', icon: '⚛️' },
  { id: 'bioinformatics', name: 'Bioinformatics', category: 'science', color: '#14b8a6', icon: '🧬' },
  { id: 'statistics', name: 'Statistics', category: 'science', color: '#0ea5e9', icon: '📊' },
  { id: 'physics', name: 'Physics', category: 'science', color: '#f43f5e', icon: '🔭' },
  { id: 'materials', name: 'Material Science', category: 'science', color: '#78716c', icon: '🔬' },
  { id: 'trading', name: 'Trading', category: 'finance', color: '#f59e0b', icon: '📈' },
  { id: 'risk_mgmt', name: 'Risk Mgmt', category: 'finance', color: '#dc2626', icon: '⚠️' },
  { id: 'quantitative', name: 'Quantitative', category: 'finance', color: '#10b981', icon: '🔢' },
  { id: 'financial_modeling', name: 'Financial Modeling', category: 'finance', color: '#d97706', icon: '📋' },
  { id: 'design', name: 'Design', category: 'creative', color: '#ec4899', icon: '🎨' },
  { id: 'writing', name: 'Writing', category: 'creative', color: '#f472b6', icon: '✍️' },
  { id: 'music', name: 'Music', category: 'creative', color: '#e879f9', icon: '🎵' },
  { id: 'entrepreneurship', name: 'Entrepreneurship', category: 'business', color: '#22c55e', icon: '🚀' },
  { id: 'management', name: 'Management', category: 'business', color: '#059669', icon: '👥' },
];

export const FUSIONS: Fusion[] = [
  // ═══════════════════════════════════════════════
  // TECH × TECH (21 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'linux', skillB: 'networking', name: 'Sysadmin', category: 'tech',
    description: 'Systems and network administration across Linux environments.',
    whatTheyDo: 'Manage server infrastructure, configure network interfaces, troubleshoot connectivity, maintain uptime SLAs, and automate routine ops tasks.',
    whyItMatters: 'Every digital service runs on servers behind networks. Sysadmins keep the backbone of the internet alive.',
  },
  {
    skillA: 'linux', skillB: 'devops', name: 'Platform Engineering', category: 'tech',
    description: 'Building internal developer platforms on Linux foundations.',
    whatTheyDo: 'Design golden images, build CI/CD pipelines, create developer self-service portals, manage container runtimes, and optimize build systems.',
    whyItMatters: 'Platform teams multiply engineering velocity by removing friction from the development lifecycle.',
  },
  {
    skillA: 'linux', skillB: 'security', name: 'Hardened Systems', category: 'tech',
    description: 'OS-level security hardening, auditing, and compliance.',
    whatTheyDo: 'Apply CIS benchmarks, configure SELinux/AppArmor, manage kernel parameters, audit file permissions, and implement mandatory access controls.',
    whyItMatters: 'A hardened OS is the last line of defense when application security fails.',
  },
  {
    skillA: 'linux', skillB: 'cloud', name: 'Cloud Infrastructure', category: 'tech',
    description: 'Linux-powered cloud infrastructure design and management.',
    whatTheyDo: 'Provision EC2/GCP instances, manage AMIs, configure cloud-init, optimize instance types, and handle cloud networking at the OS level.',
    whyItMatters: '90%+ of cloud workloads run Linux. Cloud infrastructure engineers bridge the gap between hardware and service.',
  },
  {
    skillA: 'linux', skillB: 'coding', name: 'Systems Programming', category: 'tech',
    description: 'Low-level programming for Linux kernel and system tools.',
    whatTheyDo: 'Write kernel modules, build CLI tools in C/Rust, develop device drivers, create system utilities, and optimize memory management.',
    whyItMatters: 'Systems programmers build the foundational tools that every other developer depends on.',
  },
  {
    skillA: 'linux', skillB: 'ai_ml', name: 'MLOps Infrastructure', category: 'tech',
    description: 'Linux infrastructure for machine learning pipelines.',
    whatTheyDo: 'Set up GPU clusters, configure CUDA drivers, manage ML training environments, optimize data pipelines, and deploy model serving infrastructure.',
    whyItMatters: 'ML models are only as good as the infrastructure that trains and serves them.',
  },
  {
    skillA: 'networking', skillB: 'devops', name: 'Network Automation', category: 'tech',
    description: 'Automating network configuration and management with code.',
    whatTheyDo: 'Write Ansible playbooks for network devices, build Terraform providers for infrastructure, implement GitOps for network config, and develop custom NAPALM drivers.',
    whyItMatters: 'Manual network configuration is error-prone and slow. Automation enables rapid, reliable network changes.',
  },
  {
    skillA: 'networking', skillB: 'security', name: 'Network Security', category: 'tech',
    description: 'Firewalls, IDS/IPS, packet analysis, and network defense.',
    whatTheyDo: 'Deploy and manage firewalls, configure IDS/IPS signatures, perform packet capture analysis, implement network segmentation, and respond to network-based attacks.',
    whyItMatters: 'Network security is the perimeter defense that protects entire organizations from external threats.',
  },
  {
    skillA: 'networking', skillB: 'cloud', name: 'Cloud Networking', category: 'tech',
    description: 'VPCs, load balancers, service mesh, and cloud connectivity.',
    whatTheyDo: 'Design VPC architectures, configure load balancers, implement service mesh (Istio/Linkerd), manage DNS, and set up hybrid cloud connectivity.',
    whyItMatters: 'Cloud networking determines how services communicate, failover, and scale across regions.',
  },
  {
    skillA: 'networking', skillB: 'coding', name: 'Network Programming', category: 'tech',
    description: 'Building network protocols, packet processors, and traffic tools.',
    whatTheyDo: 'Develop custom protocols, write packet sniffers, build network testing tools, implement proxy servers, and create traffic analysis systems.',
    whyItMatters: 'Custom network tools solve problems that off-the-shelf software cannot address.',
  },
  {
    skillA: 'networking', skillB: 'ai_ml', name: 'Network Intelligence', category: 'tech',
    description: 'AI-powered network monitoring, anomaly detection, and optimization.',
    whatTheyDo: 'Build ML models for traffic classification, implement anomaly detection on netflow data, develop predictive capacity models, and create automated remediation systems.',
    whyItMatters: 'AI detects network issues that human operators miss, enabling proactive rather than reactive management.',
  },
  {
    skillA: 'devops', skillB: 'security', name: 'DevSecOps', category: 'tech',
    description: 'Security-first delivery pipelines and shift-left security.',
    whatTheyDo: 'Integrate SAST/DAST in CI/CD, manage secrets with Vault, implement policy-as-code with OPA, conduct container image scanning, and automate compliance checks.',
    whyItMatters: 'Baking security into the pipeline prevents vulnerabilities from reaching production.',
  },
  {
    skillA: 'devops', skillB: 'cloud', name: 'SRE', category: 'tech',
    description: 'Site reliability engineering at cloud scale.',
    whatTheyDo: 'Define SLOs/SLIs, build error budgets, implement observability stacks, design incident response processes, and conduct blameless post-mortems.',
    whyItMatters: 'SREs balance reliability with velocity, ensuring services stay up while teams ship fast.',
  },
  {
    skillA: 'devops', skillB: 'coding', name: 'DevTools Engineering', category: 'tech',
    description: 'Building the tools that other developers use daily.',
    whatTheyDo: 'Create CLI tools, build IDE extensions, develop build systems, implement code generators, and design developer experience platforms.',
    whyItMatters: 'Great DevTools multiply the productivity of every developer who uses them.',
  },
  {
    skillA: 'devops', skillB: 'ai_ml', name: 'MLOps', category: 'tech',
    description: 'Operationalizing machine learning models in production.',
    whatTheyDo: 'Build ML pipelines, implement model versioning, set up A/B testing for models, manage feature stores, and monitor model drift.',
    whyItMatters: 'Most ML models never reach production. MLOps bridges the gap between research and real-world impact.',
  },
  {
    skillA: 'security', skillB: 'cloud', name: 'Cloud Security', category: 'tech',
    description: 'Cloud-native threat detection, posture management, and compliance.',
    whatTheyDo: 'Implement CSPM tools, configure cloud IAM policies, manage WAF rules, conduct cloud penetration testing, and automate compliance reporting.',
    whyItMatters: 'Cloud environments have unique attack surfaces that traditional security tools cannot cover.',
  },
  {
    skillA: 'security', skillB: 'coding', name: 'Application Security', category: 'tech',
    description: 'Secure coding practices, code review, and vulnerability management.',
    whatTheyDo: 'Review code for vulnerabilities, implement authentication/authorization, design secure APIs, manage dependency vulnerabilities, and build security testing tools.',
    whyItMatters: 'Application security prevents the most common attack vector — exploitable code.',
  },
  {
    skillA: 'security', skillB: 'ai_ml', name: 'AI Security', category: 'tech',
    description: 'Securing AI systems and using AI for security operations.',
    whatTheyDo: 'Adversarial ML testing, model poisoning defense, AI-powered threat hunting, deepfake detection, and LLM security auditing.',
    whyItMatters: 'AI introduces new attack surfaces while also being the most powerful tool for detecting threats.',
  },
  {
    skillA: 'cloud', skillB: 'coding', name: 'Cloud-Native Development', category: 'tech',
    description: 'Building applications designed for cloud environments from day one.',
    whatTheyDo: 'Build serverless functions, design microservices, implement event-driven architectures, use managed services, and optimize for cloud cost.',
    whyItMatters: 'Cloud-native apps scale automatically, reduce operational overhead, and leverage managed services.',
  },
  {
    skillA: 'cloud', skillB: 'ai_ml', name: 'AI Platform Engineering', category: 'tech',
    description: 'Cloud infrastructure purpose-built for AI workloads.',
    whatTheyDo: 'Design GPU clusters, implement spot instance strategies for training, build model serving infrastructure, optimize data pipelines, and manage cloud AI services.',
    whyItMatters: 'AI workloads have unique infrastructure needs — GPU scheduling, massive data throughput, and cost optimization.',
  },
  {
    skillA: 'coding', skillB: 'ai_ml', name: 'ML Engineering', category: 'tech',
    description: 'Software engineering applied to machine learning systems.',
    whatTheyDo: 'Implement ML algorithms from scratch, build training frameworks, optimize inference pipelines, write data processing code, and create ML tooling.',
    whyItMatters: 'ML engineering turns research papers into production systems that serve millions of users.',
  },

  // ═══════════════════════════════════════════════
  // SCIENCE × SCIENCE (10 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'quantum', skillB: 'bioinformatics', name: 'Quantum Biology', category: 'science',
    description: 'Quantum effects in biological systems and drug design.',
    whatTheyDo: 'Simulate molecular quantum states, design quantum algorithms for protein folding, study quantum coherence in photosynthesis, and develop quantum-enhanced drug discovery.',
    whyItMatters: 'Quantum biology could revolutionize drug design by simulating molecular interactions at unprecedented accuracy.',
  },
  {
    skillA: 'quantum', skillB: 'statistics', name: 'Quantum Statistics', category: 'science',
    description: 'Statistical methods for quantum systems and quantum data.',
    whatTheyDo: 'Develop quantum error correction codes, analyze quantum measurement statistics, build Bayesian models for quantum states, and design quantum random number generators.',
    whyItMatters: 'Quantum systems produce fundamentally different statistical distributions that require new analytical frameworks.',
  },
  {
    skillA: 'quantum', skillB: 'physics', name: 'Quantum Computing', category: 'science',
    description: 'Building and programming quantum computers.',
    whatTheyDo: 'Design quantum circuits, implement quantum algorithms (Shor, Grover), build quantum simulators, and develop quantum error correction methods.',
    whyItMatters: 'Quantum computing promises exponential speedups for problems classical computers cannot solve.',
  },
  {
    skillA: 'quantum', skillB: 'materials', name: 'Quantum Materials', category: 'science',
    description: 'Designing materials with quantum properties for next-gen computing.',
    whatTheyDo: 'Synthesize superconducting materials, study topological insulators, develop qubit substrates, and characterize quantum coherence in materials.',
    whyItMatters: 'Better quantum materials mean longer coherence times and more stable qubits.',
  },
  {
    skillA: 'bioinformatics', skillB: 'statistics', name: 'Biostatistics', category: 'science',
    description: 'Statistical analysis of biological and genomic data.',
    whatTheyDo: 'Analyze clinical trial data, perform genome-wide association studies, build survival models, design adaptive trials, and develop biostatistical software.',
    whyItMatters: 'Biostatistics turns raw biological data into medical insights that save lives.',
  },
  {
    skillA: 'bioinformatics', skillB: 'physics', name: 'Biophysics', category: 'science',
    description: 'Physical principles underlying biological systems.',
    whatTheyDo: 'Model protein dynamics, study molecular motors, analyze membrane mechanics, simulate neural electrophysiology, and develop medical imaging physics.',
    whyItMatters: 'Biophysics explains how biological machines work at the molecular level.',
  },
  {
    skillA: 'bioinformatics', skillB: 'materials', name: 'Biomaterials', category: 'science',
    description: 'Materials designed to interact with biological systems.',
    whatTheyDo: 'Design biocompatible implants, develop drug delivery nanoparticles, create tissue engineering scaffolds, and engineer biosensors.',
    whyItMatters: 'Biomaterials enable medical treatments that were previously impossible — from artificial organs to targeted drug delivery.',
  },
  {
    skillA: 'statistics', skillB: 'physics', name: 'Computational Physics', category: 'science',
    description: 'Numerical simulation and statistical analysis of physical systems.',
    whatTheyDo: 'Run Monte Carlo simulations, model climate systems, simulate particle collisions, analyze experimental physics data, and build physics-informed ML models.',
    whyItMatters: 'Computational physics enables experiments too expensive or impossible to perform in the real world.',
  },
  {
    skillA: 'statistics', skillB: 'materials', name: 'Materials Informatics', category: 'science',
    description: 'Data-driven discovery and optimization of new materials.',
    whatTheyDo: 'Build materials property databases, develop predictive models for material behavior, optimize alloy compositions, and screen materials for specific applications.',
    whyItMatters: 'Materials informatics accelerates the discovery of new materials from decades to months.',
  },
  {
    skillA: 'physics', skillB: 'materials', name: 'Materials Physics', category: 'science',
    description: 'Physical properties and characterization of advanced materials.',
    whatTheyDo: 'Characterize material microstructures, study phase transitions, develop thin film technologies, analyze crystal structures, and model material failure.',
    whyItMatters: 'Understanding material physics enables everything from stronger bridges to faster chips.',
  },

  // ═══════════════════════════════════════════════
  // FINANCE × FINANCE (6 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'trading', skillB: 'risk_mgmt', name: 'Risk-Managed Trading', category: 'finance',
    description: 'Trading strategies with systematic risk controls and position sizing.',
    whatTheyDo: 'Implement stop-loss systems, calculate VaR, manage portfolio drawdowns, design hedging overlays, and enforce risk limits per strategy.',
    whyItMatters: 'Risk-managed trading survives market crashes that blow up unhedged portfolios.',
  },
  {
    skillA: 'trading', skillB: 'quantitative', name: 'Quantitative Trading', category: 'finance',
    description: 'Mathematical models and algorithms for automated trading.',
    whatTheyDo: 'Build factor models, develop alpha signals, implement execution algorithms, backtest strategies on historical data, and optimize portfolio construction.',
    whyItMatters: 'Quantitative trading removes emotional bias and finds patterns humans cannot see.',
  },
  {
    skillA: 'trading', skillB: 'financial_modeling', name: 'Algorithmic Trading', category: 'finance',
    description: 'Automated trading systems powered by financial models.',
    whatTheyDo: 'Design trading bots, implement market-making algorithms, build order management systems, optimize execution, and develop real-time pricing models.',
    whyItMatters: 'Algorithmic trading executes in microseconds, capturing opportunities humans miss.',
  },
  {
    skillA: 'risk_mgmt', skillB: 'quantitative', name: 'Quantitative Risk', category: 'finance',
    description: 'Mathematical risk modeling and stress testing.',
    whatTheyDo: 'Build VaR models, perform Monte Carlo stress tests, develop credit scoring models, calculate Expected Shortfall, and implement model risk governance.',
    whyItMatters: 'Quantitative risk management is the mathematical backbone of financial stability.',
  },
  {
    skillA: 'risk_mgmt', skillB: 'financial_modeling', name: 'Enterprise Risk', category: 'finance',
    description: 'Holistic risk management across financial institutions.',
    whatTheyDo: 'Design ERM frameworks, conduct scenario analysis, manage regulatory capital, implement risk appetite statements, and build risk dashboards.',
    whyItMatters: 'Enterprise risk management prevents cascading failures that can topple entire institutions.',
  },
  {
    skillA: 'quantitative', skillB: 'financial_modeling', name: 'Financial Engineering', category: 'finance',
    description: 'Designing complex financial instruments and pricing models.',
    whatTheyDo: 'Price derivatives using Black-Scholes/Monte Carlo, design structured products, build yield curve models, and develop real options frameworks.',
    whyItMatters: 'Financial engineering creates the instruments that enable modern capital markets.',
  },

  // ═══════════════════════════════════════════════
  // CREATIVE × CREATIVE (3 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'design', skillB: 'writing', name: 'Content Design', category: 'creative',
    description: 'Crafting user experiences through words and visual design together.',
    whatTheyDo: 'Write UX copy, design content hierarchies, create style guides, prototype information architecture, and conduct content audits.',
    whyItMatters: 'Content design ensures that what users read and what they see work in harmony.',
  },
  {
    skillA: 'design', skillB: 'music', name: 'Sound Design', category: 'creative',
    description: 'Creating audio landscapes that complement visual experiences.',
    whatTheyDo: 'Design UI sound effects, create ambient audio for installations, build interactive audiovisual systems, and develop sonic branding.',
    whyItMatters: 'Sound design is the invisible layer that makes experiences feel complete and immersive.',
  },
  {
    skillA: 'writing', skillB: 'music', name: 'Songwriting', category: 'creative',
    description: 'Crafting lyrics and musical compositions that tell stories.',
    whatTheyDo: 'Write lyrics, compose melodies, arrange harmonies, produce demos, and collaborate with artists on song structure.',
    whyItMatters: 'Songwriting is the most direct form of storytelling — words and music fused into one.',
  },

  // ═══════════════════════════════════════════════
  // BUSINESS × BUSINESS (1 fusion)
  // ═══════════════════════════════════════════════
  {
    skillA: 'entrepreneurship', skillB: 'management', name: 'Venture Building', category: 'business',
    description: 'Building and scaling companies from idea to execution.',
    whatTheyDo: 'Validate business models, build founding teams, raise funding, design organizational structures, and scale operations across markets.',
    whyItMatters: 'Venture building turns ideas into companies that create jobs and solve real problems.',
  },

  // ═══════════════════════════════════════════════
  // TECH × SCIENCE (35 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'linux', skillB: 'quantum', name: 'Quantum OS Engineer', category: 'tech',
    description: 'Operating systems and toolchains for quantum computers.',
    whatTheyDo: 'Build quantum task schedulers, develop qubit control software, design hybrid classical-quantum OS kernels, and optimize cryogenic computing environments.',
    whyItMatters: 'Quantum computers need specialized operating systems that manage qubits like classical OS manages threads.',
  },
  {
    skillA: 'linux', skillB: 'bioinformatics', name: 'HPC Bioinformatics', category: 'tech',
    description: 'High-performance computing for genomic and biological data.',
    whatTheyDo: 'Build HPC clusters for genome sequencing, optimize bioinformatics pipelines on Linux, manage parallel computing workloads, and develop bioinformatics containers.',
    whyItMatters: 'Genome analysis requires massive compute power that only properly configured HPC systems can provide.',
  },
  {
    skillA: 'linux', skillB: 'statistics', name: 'Linux Data Science', category: 'tech',
    description: 'Statistical computing environments on Linux infrastructure.',
    whatTheyDo: 'Deploy R/Python data science stacks on Linux, manage JupyterHub clusters, optimize statistical computing workloads, and build reproducible research environments.',
    whyItMatters: 'Linux provides the stable, reproducible environment that statistical research demands.',
  },
  {
    skillA: 'linux', skillB: 'physics', name: 'Research Computing', category: 'tech',
    description: 'Linux infrastructure for physics research and simulations.',
    whatTheyDo: 'Manage compute clusters for physics simulations, optimize job schedulers (SLURM), handle large datasets from experiments, and develop scientific computing tools.',
    whyItMatters: 'Physics research depends on massive computing infrastructure that must be precisely configured.',
  },
  {
    skillA: 'linux', skillB: 'materials', name: 'Lab Computing', category: 'tech',
    description: 'Computing infrastructure for materials science laboratories.',
    whatTheyDo: 'Set up lab instrument interfaces, manage materials databases, build analysis pipelines for microscopy data, and develop lab automation systems.',
    whyItMatters: 'Modern materials science generates terabytes of data that need robust computing infrastructure.',
  },
  {
    skillA: 'networking', skillB: 'quantum', name: 'Quantum Networking', category: 'tech',
    description: 'Quantum key distribution and entanglement-based networks.',
    whatTheyDo: 'Implement QKD protocols, design quantum repeaters, build entanglement distribution networks, and develop quantum-secure communication channels.',
    whyItMatters: 'Quantum networks will provide theoretically unbreakable encryption for critical infrastructure.',
  },
  {
    skillA: 'networking', skillB: 'bioinformatics', name: 'Bio-Network Analysis', category: 'tech',
    description: 'Network analysis of biological systems and protein interactions.',
    whatTheyDo: 'Build protein interaction network visualizers, design bioinformatics data pipelines, implement distributed compute for sequence alignment, and develop biological data APIs.',
    whyItMatters: 'Biological systems are fundamentally networks — understanding them requires network engineering thinking.',
  },
  {
    skillA: 'networking', skillB: 'statistics', name: 'Network Analytics', category: 'tech',
    description: 'Statistical analysis of network traffic and behavior patterns.',
    whatTheyDo: 'Build traffic classification models, develop network performance analytics, implement statistical anomaly detection on netflow, and create capacity planning tools.',
    whyItMatters: 'Network analytics turns raw traffic data into actionable insights about performance and security.',
  },
  {
    skillA: 'networking', skillB: 'physics', name: 'Telecom Physics', category: 'tech',
    description: 'Physical layer networking — fiber optics, RF, and signal processing.',
    whatTheyDo: 'Design fiber optic networks, optimize RF propagation models, develop signal processing algorithms, and build software-defined radio systems.',
    whyItMatters: 'The physical layer determines the fundamental limits of all network performance.',
  },
  {
    skillA: 'networking', skillB: 'materials', name: 'Network Hardware', category: 'tech',
    description: 'Designing and engineering networking hardware components.',
    whatTheyDo: 'Develop high-speed transceivers, design PCB layouts for switches/routers, test cable infrastructure, and engineer optical networking components.',
    whyItMatters: 'Network hardware innovation drives the bandwidth increases that enable new applications.',
  },
  {
    skillA: 'devops', skillB: 'quantum', name: 'Quantum DevOps', category: 'tech',
    description: 'CI/CD and deployment pipelines for quantum computing workloads.',
    whatTheyDo: 'Build quantum circuit testing pipelines, implement quantum code versioning, design quantum cloud deployment workflows, and develop quantum debugging tools.',
    whyItMatters: 'Quantum software needs the same rigor in testing and deployment as classical software.',
  },
  {
    skillA: 'devops', skillB: 'bioinformatics', name: 'BioPipeline Engineering', category: 'tech',
    description: 'Automating bioinformatics analysis pipelines.',
    whatTheyDo: 'Build Nextflow/Snakemake pipelines, implement containerized bioinformatics workflows, design cloud-based genomics pipelines, and develop pipeline monitoring systems.',
    whyItMatters: 'Bioinformatics pipelines must be reproducible, scalable, and auditable for clinical use.',
  },
  {
    skillA: 'devops', skillB: 'statistics', name: 'DataOps', category: 'tech',
    description: 'Automating data pipelines for statistical analysis.',
    whatTheyDo: 'Build ETL pipelines for analytics, implement data versioning, design automated reporting systems, and develop data quality monitoring.',
    whyItMatters: 'DataOps ensures that statistical analysis runs on clean, timely, reproducible data.',
  },
  {
    skillA: 'devops', skillB: 'physics', name: 'Physics Pipeline Engineering', category: 'tech',
    description: 'Automating data processing pipelines for physics experiments.',
    whatTheyDo: 'Build data acquisition pipelines, implement real-time event processing, design distributed computing workflows for particle physics, and develop experiment monitoring systems.',
    whyItMatters: 'Physics experiments generate petabytes of data that need automated processing pipelines.',
  },
  {
    skillA: 'devops', skillB: 'materials', name: 'Materials Lab Automation', category: 'tech',
    description: 'Automating materials science experimentation and analysis.',
    whatTheyDo: 'Build automated实验 workflows, implement robotic lab integration, design materials data pipelines, and develop automated characterization systems.',
    whyItMatters: 'Lab automation accelerates materials discovery by running experiments 24/7 without human intervention.',
  },
  {
    skillA: 'security', skillB: 'quantum', name: 'Post-Quantum Cryptography', category: 'tech',
    description: 'Cryptography resistant to quantum computer attacks.',
    whatTheyDo: 'Implement lattice-based cryptography, develop quantum-resistant key exchange, migrate systems to PQC standards, and audit cryptographic implementations.',
    whyItMatters: 'Quantum computers will break current encryption. Post-quantum cryptography is the race to stay ahead.',
  },
  {
    skillA: 'security', skillB: 'bioinformatics', name: 'Genomic Security', category: 'tech',
    description: 'Securing genomic data and bioinformatics infrastructure.',
    whatTheyDo: 'Encrypt genomic databases, implement access controls for biological data, secure bioinformatics pipelines, and develop privacy-preserving genetic analysis.',
    whyItMatters: 'Genomic data is uniquely identifying and permanent — a breach cannot be undone like a password change.',
  },
  {
    skillA: 'security', skillB: 'statistics', name: 'Security Analytics', category: 'tech',
    description: 'Statistical methods applied to cybersecurity threat detection.',
    whatTheyDo: 'Build statistical models for threat detection, develop risk scoring algorithms, implement behavioral analytics, and create security metrics dashboards.',
    whyItMatters: 'Security analytics transforms raw security events into prioritized, actionable intelligence.',
  },
  {
    skillA: 'security', skillB: 'physics', name: 'Physical Security Tech', category: 'tech',
    description: 'Technology-driven physical security and surveillance systems.',
    whatTheyDo: 'Design laser intrusion detection, build RF-based perimeter security, develop thermal imaging analytics, and implement tamper-detection hardware.',
    whyItMatters: 'Physical security meets cybersecurity when devices can be hacked to disable alarms.',
  },
  {
    skillA: 'security', skillB: 'materials', name: 'Hardware Security', category: 'tech',
    description: 'Security at the hardware and silicon level.',
    whatTheyDo: 'Design secure enclaves (TPM/SE), implement anti-tamper mechanisms, develop side-channel attack defenses, and audit hardware supply chains.',
    whyItMatters: 'Hardware security is the root of trust — if hardware is compromised, nothing above it is safe.',
  },
  {
    skillA: 'cloud', skillB: 'quantum', name: 'Quantum Cloud', category: 'tech',
    description: 'Cloud platforms for quantum computing access and hybrid workloads.',
    whatTheyDo: 'Build quantum cloud services (IBM Quantum/AWS Braket), implement hybrid classical-quantum job scheduling, design quantum resource management, and develop quantum-as-a-service APIs.',
    whyItMatters: 'Quantum cloud democratizes access to quantum computers that cost millions to build.',
  },
  {
    skillA: 'cloud', skillB: 'bioinformatics', name: 'Cloud Genomics', category: 'tech',
    description: 'Cloud-scale genomic data processing and storage.',
    whatTheyDo: 'Build genomics data lakes on cloud, implement serverless variant calling, design cloud-based genome browsers, and optimize cloud costs for genomic workloads.',
    whyItMatters: 'A single genome produces 200GB of data — only cloud can scale to handle population-level genomics.',
  },
  {
    skillA: 'cloud', skillB: 'statistics', name: 'Cloud Analytics', category: 'tech',
    description: 'Cloud-native statistical analysis and business intelligence.',
    whatTheyDo: 'Build cloud data warehouses, implement serverless analytics, design real-time BI dashboards, and optimize query performance on cloud infrastructure.',
    whyItMatters: 'Cloud analytics enables organizations to analyze petabytes of data without managing infrastructure.',
  },
  {
    skillA: 'cloud', skillB: 'physics', name: 'Cloud Research Computing', category: 'tech',
    description: 'Cloud infrastructure for physics research and simulations.',
    whatTheyDo: 'Build HPC clusters on cloud, implement spot instance strategies for simulations, design cloud-based data sharing for collaborations, and optimize cloud costs for research.',
    whyItMatters: 'Physics research is moving to cloud, but physics workloads have unique requirements most cloud configs ignore.',
  },
  {
    skillA: 'cloud', skillB: 'materials', name: 'Materials Cloud', category: 'tech',
    description: 'Cloud platforms for materials science data and simulation.',
    whatTheyDo: 'Build materials databases on cloud, implement cloud-based DFT simulations, design materials discovery platforms, and optimize cloud for compute-heavy materials science.',
    whyItMatters: 'Materials science generates massive simulation data that benefits from cloud elasticity.',
  },
  {
    skillA: 'coding', skillB: 'quantum', name: 'Quantum Software', category: 'tech',
    description: 'Building software for quantum computers and quantum algorithms.',
    whatTheyDo: 'Write quantum circuits in Qiskit/Cirq, implement quantum algorithms, develop quantum simulators, and build quantum programming frameworks.',
    whyItMatters: 'Quantum software turns theoretical quantum advantage into practical applications.',
  },
  {
    skillA: 'coding', skillB: 'bioinformatics', name: 'Bioinformatics Software', category: 'tech',
    description: 'Building tools and platforms for biological data analysis.',
    whatTheyDo: 'Develop sequence alignment tools, build genomic visualization software, create protein structure prediction systems, and design bioinformatics web platforms.',
    whyItMatters: 'Bioinformatics tools enable biologists to analyze data without being programmers.',
  },
  {
    skillA: 'coding', skillB: 'statistics', name: 'Statistical Software', category: 'tech',
    description: 'Building software for statistical analysis and data science.',
    whatTheyDo: 'Develop R packages, build statistical visualization libraries, create automated analysis tools, and design statistical computing frameworks.',
    whyItMatters: 'Statistical software makes advanced analysis accessible to non-statisticians.',
  },
  {
    skillA: 'coding', skillB: 'physics', name: 'Scientific Computing', category: 'tech',
    description: 'Software for physics simulation and numerical methods.',
    whatTheyDo: 'Build finite element solvers, develop computational fluid dynamics codes, create molecular dynamics simulators, and implement numerical method libraries.',
    whyItMatters: 'Scientific computing software enables physics experiments that cannot be done in a lab.',
  },
  {
    skillA: 'coding', skillB: 'materials', name: 'Materials Software', category: 'tech',
    description: 'Software for materials characterization and simulation.',
    whatTheyDo: 'Build materials property calculators, develop crystal structure visualization tools, create materials databases, and design automated characterization software.',
    whyItMatters: 'Materials science software accelerates the discovery-to-deployment pipeline for new materials.',
  },
  {
    skillA: 'ai_ml', skillB: 'quantum', name: 'Quantum ML', category: 'tech',
    description: 'Machine learning enhanced by quantum computing.',
    whatTheyDo: 'Implement quantum neural networks, develop quantum kernel methods, build quantum generative models, and optimize quantum circuits for ML.',
    whyItMatters: 'Quantum ML could solve problems that are intractable for classical ML — like molecular simulation.',
  },
  {
    skillA: 'ai_ml', skillB: 'bioinformatics', name: 'Computational Biology', category: 'tech',
    description: 'AI applied to biological data — genomics, proteomics, drug discovery.',
    whatTheyDo: 'Build protein structure predictors (AlphaFold-style), develop drug-target interaction models, create genomic variant classifiers, and design biological pathway analyzers.',
    whyItMatters: 'AI is transforming biology from a descriptive to a predictive science.',
  },
  {
    skillA: 'ai_ml', skillB: 'statistics', name: 'Statistical Learning', category: 'tech',
    description: 'The intersection of classical statistics and modern machine learning.',
    whatTheyDo: 'Develop Bayesian deep learning, build interpretable ML models, implement causal inference with ML, and create statistical testing frameworks for ML.',
    whyItMatters: 'Statistical learning brings rigor to ML — ensuring models are not just accurate but trustworthy.',
  },
  {
    skillA: 'ai_ml', skillB: 'physics', name: 'Physics-Informed ML', category: 'tech',
    description: 'Machine learning constrained by physical laws and principles.',
    whatTheyDo: 'Build physics-informed neural networks, develop conservation-law-constrained models, create simulation-free surrogate models, and implement physics-based regularization.',
    whyItMatters: 'Physics-informed ML produces models that respect reality — no perpetual motion machines allowed.',
  },
  {
    skillA: 'ai_ml', skillB: 'materials', name: 'AI Materials Discovery', category: 'tech',
    description: 'Using AI to discover and optimize new materials.',
    whatTheyDo: 'Build generative models for molecular design, develop property prediction models, create inverse design tools, and implement autonomous materials labs.',
    whyItMatters: 'AI can screen millions of candidate materials in silico, accelerating discovery by 100x.',
  },

  // ═══════════════════════════════════════════════
  // TECH × FINANCE (28 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'linux', skillB: 'trading', name: 'Trading Infrastructure', category: 'tech',
    description: 'Linux systems powering high-frequency and low-latency trading.',
    whatTheyDo: 'Optimize kernel bypass networking (DPDK), configure tick-to-trade systems, manage co-location servers, and implement real-time data feeds.',
    whyItMatters: 'In trading, microseconds equal money. Trading infrastructure is where Linux performance tuning matters most.',
  },
  {
    skillA: 'linux', skillB: 'risk_mgmt', name: 'Risk Systems Admin', category: 'tech',
    description: 'Linux infrastructure for risk management systems.',
    whatTheyDo: 'Manage risk calculation clusters, optimize Monte Carlo simulation environments, maintain real-time risk dashboards, and ensure 24/7 availability of risk systems.',
    whyItMatters: 'Risk systems cannot go down — a few minutes of blindness can mean billions in losses.',
  },
  {
    skillA: 'linux', skillB: 'quantitative', name: 'Quant Infrastructure', category: 'tech',
    description: 'Linux systems optimized for quantitative finance workloads.',
    whatTheyDo: 'Build low-latency Linux environments, optimize memory management for quant models, configure high-performance networking, and manage GPU clusters for pricing.',
    whyItMatters: 'Quantitative finance runs on Linux — the OS choice directly impacts P&L.',
  },
  {
    skillA: 'linux', skillB: 'financial_modeling', name: 'Financial Computing', category: 'tech',
    description: 'Linux-based computing for financial model development.',
    whatTheyDo: 'Deploy financial modeling environments on Linux, manage computational grids for pricing, optimize batch processing for end-of-day calculations, and build reproducible model environments.',
    whyItMatters: 'Financial models need reproducible, auditable computing environments — Linux provides that foundation.',
  },
  {
    skillA: 'networking', skillB: 'trading', name: 'Low-Latency Trading', category: 'tech',
    description: 'Ultra-low-latency network engineering for financial markets.',
    whatTheyDo: 'Build kernel bypass networks, implement FPGA-based trading links, optimize tick-to-trade latency, and design market data distribution systems.',
    whyItMatters: 'Low-latency networking is the competitive edge in modern electronic trading.',
  },
  {
    skillA: 'networking', skillB: 'risk_mgmt', name: 'Risk Network Architecture', category: 'tech',
    description: 'Network design for real-time risk monitoring and reporting.',
    whatTheyDo: 'Design resilient network topologies for risk systems, implement real-time data replication, build failover networks for risk dashboards, and manage cross-DC risk connectivity.',
    whyItMatters: 'Risk networks must be both fast and resilient — a network failure during a crash is catastrophic.',
  },
  {
    skillA: 'networking', skillB: 'quantitative', name: 'Quant Network Engineering', category: 'tech',
    description: 'Network engineering for quantitative trading and research.',
    whatTheyDo: 'Design low-latency interconnects for trading engines, build data distribution networks for market data, implement multicast feeds, and optimize network for quant workloads.',
    whyItMatters: 'Quant strategies are only as fast as the network delivering data to them.',
  },
  {
    skillA: 'networking', skillB: 'financial_modeling', name: 'Financial Data Networks', category: 'tech',
    description: 'Networks for distributing and processing financial data.',
    whatTheyDo: 'Build market data distribution networks, implement real-time financial data feeds, design data center networks for exchanges, and develop financial data APIs.',
    whyItMatters: 'Financial data networks are the nervous system of modern markets.',
  },
  {
    skillA: 'devops', skillB: 'trading', name: 'Trading Platform DevOps', category: 'tech',
    description: 'CI/CD and operations for trading platforms.',
    whatTheyDo: 'Build deployment pipelines for trading systems, implement blue-green deployments for live trading, develop automated rollback systems, and manage trading platform infrastructure.',
    whyItMatters: 'Trading platform updates must be deployed with zero downtime — one failed deploy can mean millions.',
  },
  {
    skillA: 'devops', skillB: 'risk_mgmt', name: 'Risk Platform Engineering', category: 'tech',
    description: 'Building and operating risk management platforms.',
    whatTheyDo: 'Design risk calculation platforms, build real-time risk dashboards, implement automated risk reporting pipelines, and develop risk model deployment systems.',
    whyItMatters: 'Risk platforms must process millions of calculations in seconds during market stress.',
  },
  {
    skillA: 'devops', skillB: 'quantitative', name: 'Quant Platform Engineering', category: 'tech',
    description: 'Platforms for quantitative research and strategy development.',
    whatTheyDo: 'Build research environments with JupyterHub, implement backtesting infrastructure, design strategy deployment pipelines, and manage quant data platforms.',
    whyItMatters: 'Quant researchers need platforms that let them iterate fast without breaking production.',
  },
  {
    skillA: 'devops', skillB: 'financial_modeling', name: 'Financial Model Ops', category: 'tech',
    description: 'Operationalizing financial models in production.',
    whatTheyDo: 'Build model deployment pipelines, implement model versioning, design A/B testing for financial models, and develop model monitoring systems.',
    whyItMatters: 'Financial models that stay in notebooks generate zero revenue — ModelOps bridges the gap.',
  },
  {
    skillA: 'security', skillB: 'trading', name: 'Trading Security', category: 'tech',
    description: 'Securing trading systems from market abuse and cyber threats.',
    whatTheyDo: 'Implement anti-manipulation controls, secure trading APIs, develop market surveillance systems, and conduct trading system penetration testing.',
    whyItMatters: 'Trading system breaches can manipulate markets and cost billions — security is non-negotiable.',
  },
  {
    skillA: 'security', skillB: 'risk_mgmt', name: 'Cyber Risk Management', category: 'tech',
    description: 'Managing cybersecurity risk in financial institutions.',
    whatTheyDo: 'Quantify cyber risk in financial terms, implement cyber risk frameworks, develop threat intelligence for financial sector, and build cyber risk dashboards.',
    whyItMatters: 'Cyber risk is now a board-level concern for every financial institution.',
  },
  {
    skillA: 'security', skillB: 'quantitative', name: 'Quant Security', category: 'tech',
    description: 'Security for quantitative trading strategies and intellectual property.',
    whatTheyDo: 'Protect alpha signals from exfiltration, secure research environments, implement strategy obfuscation, and develop insider threat detection for quant teams.',
    whyItMatters: 'A leaked quant strategy loses its edge — quant security protects the most valuable IP in finance.',
  },
  {
    skillA: 'security', skillB: 'financial_modeling', name: 'Financial Model Security', category: 'tech',
    description: 'Securing financial models and the infrastructure they run on.',
    whatTheyDo: 'Audit model integrity, implement model access controls, secure model inputs/outputs, and develop tamper detection for financial calculations.',
    whyItMatters: 'Compromised financial models can be used to manipulate markets or hide losses.',
  },
  {
    skillA: 'cloud', skillB: 'trading', name: 'Cloud Trading', category: 'tech',
    description: 'Cloud infrastructure for trading and market access.',
    whatTheyDo: 'Build cloud-based trading platforms, implement hybrid cloud for market data, design cloud-native exchange connectivity, and optimize cloud for low-latency trading.',
    whyItMatters: 'Cloud trading democratizes market access — smaller firms can compete with Wall Street infrastructure.',
  },
  {
    skillA: 'cloud', skillB: 'risk_mgmt', name: 'Cloud Risk Platforms', category: 'tech',
    description: 'Cloud-native risk management platforms.',
    whatTheyDo: 'Build cloud-based risk calculation engines, implement real-time risk dashboards on cloud, design cloud-native regulatory reporting, and optimize cloud costs for risk workloads.',
    whyItMatters: 'Cloud risk platforms scale elastically — handling market stress without infrastructure procurement.',
  },
  {
    skillA: 'cloud', skillB: 'quantitative', name: 'Cloud Quant', category: 'tech',
    description: 'Cloud platforms for quantitative research and trading.',
    whatTheyDo: 'Build cloud-based backtesting platforms, implement GPU clusters on cloud for pricing, design cloud-native quant research environments, and optimize cloud for quant workloads.',
    whyItMatters: 'Cloud quant platforms let researchers spin up thousands of cores for backtesting in minutes.',
  },
  {
    skillA: 'cloud', skillB: 'financial_modeling', name: 'Cloud Financial Computing', category: 'tech',
    description: 'Cloud infrastructure for financial model computation.',
    whatTheyDo: 'Build cloud-based pricing engines, implement serverless financial calculations, design cloud-native regulatory reporting, and optimize cloud for financial workloads.',
    whyItMatters: 'Financial model computation is bursty — cloud elasticity matches the workload pattern perfectly.',
  },
  {
    skillA: 'coding', skillB: 'trading', name: 'Trading System Development', category: 'tech',
    description: 'Building trading systems, order management, and execution engines.',
    whatTheyDo: 'Build order management systems, develop execution algorithms, create market data handlers, implement trade reporting systems, and design trading APIs.',
    whyItMatters: 'Trading systems are where code meets markets — every millisecond and every line of code matters.',
  },
  {
    skillA: 'coding', skillB: 'risk_mgmt', name: 'Risk Software Development', category: 'tech',
    description: 'Building software for risk management and regulatory compliance.',
    whatTheyDo: 'Develop risk calculation engines, build regulatory reporting systems, create risk dashboards, implement audit trail systems, and design compliance automation tools.',
    whyItMatters: 'Risk software must be correct, fast, and auditable — there is no room for bugs in risk calculations.',
  },
  {
    skillA: 'coding', skillB: 'quantitative', name: 'Quantitative Software', category: 'tech',
    description: 'Software engineering for quantitative finance.',
    whatTheyDo: 'Build pricing libraries, develop backtesting frameworks, create factor model implementations, design optimization solvers, and implement numerical methods for finance.',
    whyItMatters: 'Quantitative software is the bridge between mathematical models and trading profits.',
  },
  {
    skillA: 'coding', skillB: 'financial_modeling', name: 'FinTech Development', category: 'tech',
    description: 'Building financial technology products and platforms.',
    whatTheyDo: 'Develop robo-advisors, build payment systems, create lending platforms, implement wealth management software, and design financial data APIs.',
    whyItMatters: 'FinTech is disrupting traditional finance — the best financial products are built by engineers.',
  },
  {
    skillA: 'ai_ml', skillB: 'trading', name: 'AI Trading', category: 'tech',
    description: 'Machine learning applied to trading strategies and market analysis.',
    whatTheyDo: 'Build reinforcement learning trading agents, develop sentiment analysis for markets, create pattern recognition systems, and implement AI-powered portfolio optimization.',
    whyItMatters: 'AI trading finds patterns in market data that no human analyst can see.',
  },
  {
    skillA: 'ai_ml', skillB: 'risk_mgmt', name: 'AI Risk Management', category: 'tech',
    description: 'Using AI for risk assessment, fraud detection, and compliance.',
    whatTheyDo: 'Build AI-powered fraud detection, develop credit risk models with ML, create NLP systems for regulatory compliance, and implement anomaly detection for financial crime.',
    whyItMatters: 'AI processes millions of transactions to find the one that signals fraud — humans cannot match this scale.',
  },
  {
    skillA: 'ai_ml', skillB: 'quantitative', name: 'AI Quantitative Finance', category: 'tech',
    description: 'Advanced ML methods for quantitative finance.',
    whatTheyDo: 'Build deep learning factor models, develop NLP for alternative data, create generative models for scenario analysis, and implement reinforcement learning for execution.',
    whyItMatters: 'AI quantitative finance is creating entirely new alpha sources that traditional quant methods cannot access.',
  },
  {
    skillA: 'ai_ml', skillB: 'financial_modeling', name: 'AI Financial Modeling', category: 'tech',
    description: 'Machine learning enhanced financial models.',
    whatTheyDo: 'Build neural network pricing models, develop ML-enhanced forecasting, create AI-powered stress testing, and implement deep learning for credit scoring.',
    whyItMatters: 'AI financial models capture non-linear relationships that traditional models miss.',
  },

  // ═══════════════════════════════════════════════
  // TECH × CREATIVE (21 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'linux', skillB: 'design', name: 'Creative Systems', category: 'tech',
    description: 'Linux infrastructure for creative studios and design teams.',
    whatTheyDo: 'Set up Linux render farms, manage creative tool infrastructure, build color management systems, and optimize storage for large media files.',
    whyItMatters: 'Creative studios need specialized infrastructure — Linux render farms are the backbone of Hollywood.',
  },
  {
    skillA: 'linux', skillB: 'writing', name: 'Technical Writing Systems', category: 'tech',
    description: 'Linux-based documentation and publishing infrastructure.',
    whatTheyDo: 'Build automated documentation pipelines, manage static site generators, implement version-controlled documentation, and develop publishing workflows on Linux.',
    whyItMatters: 'Technical documentation needs robust infrastructure — version control, automation, and reliable publishing.',
  },
  {
    skillA: 'linux', skillB: 'music', name: 'Audio Engineering Systems', category: 'tech',
    description: 'Linux systems for professional audio production.',
    whatTheyDo: 'Configure JACK audio servers, optimize low-latency audio on Linux, manage studio infrastructure, and build automated mixing/recording systems.',
    whyItMatters: 'Linux audio production is growing — Ardour, Bitwig, and JACK make it viable for professionals.',
  },
  {
    skillA: 'networking', skillB: 'design', name: 'Collaborative Design Networks', category: 'tech',
    description: 'Network infrastructure for distributed design teams.',
    whatTheyDo: 'Build VPNs for creative teams, implement version control for large design files, design real-time collaboration networks, and optimize bandwidth for media transfer.',
    whyItMatters: 'Design teams are distributed — network infrastructure determines whether collaboration is seamless or painful.',
  },
  {
    skillA: 'networking', skillB: 'writing', name: 'Content Delivery', category: 'tech',
    description: 'Networks for content distribution and publishing platforms.',
    whatTheyDo: 'Build CDN configurations, implement content caching strategies, design API networks for publishing platforms, and optimize content delivery performance.',
    whyItMatters: 'Content delivery networks determine how fast and reliably readers access published content.',
  },
  {
    skillA: 'networking', skillB: 'music', name: 'Streaming Infrastructure', category: 'tech',
    description: 'Networks for music streaming and audio distribution.',
    whatTheyDo: 'Build audio streaming pipelines, implement real-time audio distribution, design low-latency streaming networks, and develop live audio collaboration tools.',
    whyItMatters: 'Music streaming requires specialized networking — low latency, high throughput, and perfect sync.',
  },
  {
    skillA: 'devops', skillB: 'design', name: 'DesignOps', category: 'tech',
    description: 'Automating design workflows and toolchain management.',
    whatTheyDo: 'Build design system pipelines, automate asset generation, implement design token deployment, and create automated design QA systems.',
    whyItMatters: 'DesignOps multiplies design team output by removing manual, repetitive work.',
  },
  {
    skillA: 'devops', skillB: 'writing', name: 'Content Operations', category: 'tech',
    description: 'Automating content publishing and editorial workflows.',
    whatTheyDo: 'Build content publishing pipelines, implement automated SEO checks, design editorial workflow automation, and create content versioning systems.',
    whyItMatters: 'ContentOps enables publishers to ship content faster without sacrificing quality.',
  },
  {
    skillA: 'devops', skillB: 'music', name: 'Music DevOps', category: 'tech',
    description: 'Automating music production and distribution workflows.',
    whatTheyDo: 'Build automated mastering pipelines, implement music distribution systems, design collaborative production platforms, and develop music analytics infrastructure.',
    whyItMatters: 'Music production is becoming software-driven — DevOps principles apply directly.',
  },
  {
    skillA: 'security', skillB: 'design', name: 'Design Security', category: 'tech',
    description: 'Protecting intellectual property in design assets and systems.',
    whatTheyDo: 'Implement DRM for design files, secure design collaboration platforms, develop watermarking systems, and protect design system access.',
    whyItMatters: 'Design IP is worth billions — protecting it requires specialized security approaches.',
  },
  {
    skillA: 'security', skillB: 'writing', name: 'Content Security', category: 'tech',
    description: 'Protecting written content from plagiarism, theft, and manipulation.',
    whatTheyDo: 'Implement content authentication, develop plagiarism detection systems, secure publishing platforms, and build content integrity verification.',
    whyItMatters: 'Content theft and deepfake text are growing threats — content security protects authorship.',
  },
  {
    skillA: 'security', skillB: 'music', name: 'Music IP Security', category: 'tech',
    description: 'Protecting music intellectual property and rights management.',
    whatTheyDo: 'Implement audio fingerprinting, develop rights management systems, secure music distribution platforms, and build anti-piracy tools.',
    whyItMatters: 'Music piracy costs the industry billions — security protects artists and rights holders.',
  },
  {
    skillA: 'cloud', skillB: 'design', name: 'Cloud Design Platforms', category: 'tech',
    description: 'Cloud infrastructure for design tools and collaboration.',
    whatTheyDo: 'Build cloud-based design tools (like Figma), implement cloud rendering, design cloud storage for design assets, and develop real-time collaboration on cloud.',
    whyItMatters: 'Cloud design platforms enable global teams to collaborate on the same files in real time.',
  },
  {
    skillA: 'cloud', skillB: 'writing', name: 'Cloud Publishing', category: 'tech',
    description: 'Cloud platforms for content management and publishing.',
    whatTheyDo: 'Build cloud CMS platforms, implement serverless content delivery, design cloud-native publishing workflows, and develop cloud-based editorial tools.',
    whyItMatters: 'Cloud publishing enables any author to reach a global audience without infrastructure knowledge.',
  },
  {
    skillA: 'cloud', skillB: 'music', name: 'Cloud Music', category: 'tech',
    description: 'Cloud platforms for music production and distribution.',
    whatTheyDo: 'Build cloud DAWs, implement cloud-based mastering services, design music streaming infrastructure, and develop cloud collaboration for musicians.',
    whyItMatters: 'Cloud music platforms let musicians collaborate across continents as if they were in the same room.',
  },
  {
    skillA: 'coding', skillB: 'design', name: 'Creative Coding', category: 'tech',
    description: 'Writing code that creates art, visualizations, and interactive experiences.',
    whatTheyDo: 'Build generative art systems, develop interactive installations, create data visualizations, implement creative coding frameworks (Processing/p5.js), and design algorithmic art.',
    whyItMatters: 'Creative coding is where technology becomes art — the most exciting frontier in both fields.',
  },
  {
    skillA: 'coding', skillB: 'writing', name: 'Interactive Fiction', category: 'tech',
    description: 'Building interactive narratives, games, and text-based experiences.',
    whatTheyDo: 'Develop interactive fiction engines, build narrative game systems, create chatbot story generators, implement branching narrative tools, and design text adventure platforms.',
    whyItMatters: 'Interactive fiction is the future of storytelling — readers become participants.',
  },
  {
    skillA: 'coding', skillB: 'music', name: 'Music Technology', category: 'tech',
    description: 'Building software instruments, audio tools, and music technology.',
    whatTheyDo: 'Develop VST plugins, build DAW software, create audio processing libraries, implement MIDI controllers, and design music recommendation systems.',
    whyItMatters: 'Music technology creates the tools that every modern musician uses — from synths to Spotify.',
  },
  {
    skillA: 'ai_ml', skillB: 'design', name: 'Generative Design', category: 'tech',
    description: 'AI-powered design generation and optimization.',
    whatTheyDo: 'Build AI image generators, develop style transfer systems, create layout optimization tools, implement AI-assisted design tools, and develop generative UI systems.',
    whyItMatters: 'Generative design multiplies a designer\'s output 10x while opening entirely new creative possibilities.',
  },
  {
    skillA: 'ai_ml', skillB: 'writing', name: 'AI Writing', category: 'tech',
    description: 'AI-assisted writing, editing, and content generation.',
    whatTheyDo: 'Build writing assistants, develop grammar/style checkers, create content generation tools, implement AI editing systems, and design personalized content platforms.',
    whyItMatters: 'AI writing tools are becoming essential — they handle the mechanical parts so writers focus on creativity.',
  },
  {
    skillA: 'ai_ml', skillB: 'music', name: 'AI Music', category: 'tech',
    description: 'AI-powered music composition, generation, and analysis.',
    whatTheyDo: 'Build music generation models, develop AI mastering tools, create music recommendation systems, implement audio analysis AI, and design AI composition assistants.',
    whyItMatters: 'AI music tools are democratizing music creation — anyone can compose with AI assistance.',
  },

  // ═══════════════════════════════════════════════
  // TECH × BUSINESS (14 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'linux', skillB: 'entrepreneurship', name: 'Infrastructure Startup', category: 'tech',
    description: 'Building technology infrastructure companies.',
    whatTheyDo: 'Design cloud infrastructure products, build managed Linux services, develop infrastructure-as-code platforms, and create developer tools startups.',
    whyItMatters: 'Infrastructure startups power the next generation of technology companies.',
  },
  {
    skillA: 'linux', skillB: 'management', name: 'IT Operations Management', category: 'tech',
    description: 'Managing IT operations teams and Linux infrastructure at scale.',
    whatTheyDo: 'Lead IT operations teams, manage Linux server fleets, implement ITIL processes, design incident management workflows, and build IT service catalogs.',
    whyItMatters: 'IT operations management is where technical expertise meets organizational leadership.',
  },
  {
    skillA: 'networking', skillB: 'entrepreneurship', name: 'Network Startup', category: 'tech',
    description: 'Building networking technology companies.',
    whatTheyDo: 'Create networking startups, develop SDN products, build network monitoring tools, design edge networking solutions, and launch telecom ventures.',
    whyItMatters: 'Networking startups drive the infrastructure innovation that enables new internet applications.',
  },
  {
    skillA: 'networking', skillB: 'management', name: 'Network Operations Management', category: 'tech',
    description: 'Managing network operations centers and infrastructure teams.',
    whatTheyDo: 'Lead NOC teams, manage network infrastructure at scale, implement network monitoring strategies, design escalation procedures, and build network capacity planning.',
    whyItMatters: 'Network operations management ensures the internet stays up for millions of users.',
  },
  {
    skillA: 'devops', skillB: 'entrepreneurship', name: 'DevTools Startup', category: 'tech',
    description: 'Building developer tools and infrastructure companies.',
    whatTheyDo: 'Create CI/CD platforms, build developer experience tools, design infrastructure-as-code products, and launch DevOps SaaS companies.',
    whyItMatters: 'DevTools startups are among the most valuable in tech — every developer is a potential customer.',
  },
  {
    skillA: 'devops', skillB: 'management', name: 'Engineering Management', category: 'tech',
    description: 'Managing engineering teams and DevOps transformations.',
    whatTheyDo: 'Lead platform engineering teams, manage DevOps transformations, implement engineering metrics, design team structures, and build engineering culture.',
    whyItMatters: 'Engineering management is the multiplier — a great manager makes every engineer more effective.',
  },
  {
    skillA: 'security', skillB: 'entrepreneurship', name: 'Cybersecurity Startup', category: 'tech',
    description: 'Building cybersecurity companies and products.',
    whatTheyDo: 'Create security products, build threat intelligence platforms, design compliance automation tools, develop security SaaS, and launch cyber ventures.',
    whyItMatters: 'Cybersecurity is a $200B+ market growing 15% annually — the opportunity is massive.',
  },
  {
    skillA: 'security', skillB: 'management', name: 'Security Leadership', category: 'tech',
    description: 'Leading security organizations and building security programs.',
    whatTheyDo: 'Build security programs, lead CISO functions, manage security teams, implement security governance, and develop security strategy for enterprises.',
    whyItMatters: 'Security leadership is one of the fastest-growing executive roles — every company needs a CISO.',
  },
  {
    skillA: 'cloud', skillB: 'entrepreneurship', name: 'Cloud Startup', category: 'tech',
    description: 'Building cloud-native startups and SaaS companies.',
    whatTheyDo: 'Create cloud-native products, build SaaS platforms, design multi-tenant architectures, develop cloud marketplace products, and launch cloud ventures.',
    whyItMatters: 'Cloud startups can scale to millions of users without upfront infrastructure investment.',
  },
  {
    skillA: 'cloud', skillB: 'management', name: 'Cloud Operations Management', category: 'tech',
    description: 'Managing cloud infrastructure and FinOps.',
    whatTheyDo: 'Lead cloud operations teams, manage cloud budgets (FinOps), implement cloud governance, design cloud migration strategies, and build cloud center of excellence.',
    whyItMatters: 'Cloud costs spiral without management — FinOps is the discipline that keeps cloud spending in check.',
  },
  {
    skillA: 'coding', skillB: 'entrepreneurship', name: 'Software Startup', category: 'tech',
    description: 'Building software companies from code to product.',
    whatTheyDo: 'Build MVPs, develop core product code, implement technical co-founder responsibilities, design scalable architectures, and create developer-led growth products.',
    whyItMatters: 'Software startups built by engineers have the fastest path from idea to product-market fit.',
  },
  {
    skillA: 'coding', skillB: 'management', name: 'Technical Leadership', category: 'tech',
    description: 'Leading engineering teams and making technical architecture decisions.',
    whatTheyDo: 'Lead engineering teams, make architecture decisions, implement code review processes, design technical standards, and build engineering culture.',
    whyItMatters: 'Technical leadership determines whether engineering teams build the right things the right way.',
  },
  {
    skillA: 'ai_ml', skillB: 'entrepreneurship', name: 'AI Startup', category: 'tech',
    description: 'Building AI-first companies and products.',
    whatTheyDo: 'Create AI products, build ML platforms, design AI-as-a-service offerings, develop domain-specific AI solutions, and launch AI ventures.',
    whyItMatters: 'AI startups are the most funded category in venture capital — the opportunity window is open.',
  },
  {
    skillA: 'ai_ml', skillB: 'management', name: 'AI Leadership', category: 'tech',
    description: 'Leading AI teams and managing AI transformations.',
    whatTheyDo: 'Lead AI teams, manage AI ethics, implement AI governance, design AI strategy for enterprises, and build responsible AI programs.',
    whyItMatters: 'AI leadership is the newest and most critical executive role — every company is becoming an AI company.',
  },

  // ═══════════════════════════════════════════════
  // SCIENCE × FINANCE (20 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'quantum', skillB: 'trading', name: 'Quantum Trading', category: 'science',
    description: 'Quantum algorithms for financial trading and optimization.',
    whatTheyDo: 'Develop quantum portfolio optimization, build quantum Monte Carlo for pricing, implement quantum annealing for trading, and create quantum-enhanced market simulation.',
    whyItMatters: 'Quantum trading could solve optimization problems that classical computers cannot handle at scale.',
  },
  {
    skillA: 'quantum', skillB: 'risk_mgmt', name: 'Quantum Risk', category: 'science',
    description: 'Quantum computing applied to financial risk analysis.',
    whatTheyDo: 'Build quantum VaR models, develop quantum stress testing, implement quantum credit risk analysis, and create quantum fraud detection systems.',
    whyItMatters: 'Quantum risk models could process the full complexity of systemic risk in real time.',
  },
  {
    skillA: 'quantum', skillB: 'quantitative', name: 'Quantum Quant', category: 'science',
    description: 'Quantum-enhanced quantitative finance.',
    whatTheyDo: 'Develop quantum factor models, build quantum optimization for portfolios, implement quantum machine learning for alpha generation, and create quantum derivatives pricing.',
    whyItMatters: 'Quantum quant is the next frontier — combining quantum computing with mathematical finance.',
  },
  {
    skillA: 'quantum', skillB: 'financial_modeling', name: 'Quantum Financial Modeling', category: 'science',
    description: 'Quantum-enhanced financial models and simulations.',
    whatTheyDo: 'Build quantum pricing models, develop quantum Monte Carlo simulations, implement quantum optimization for asset allocation, and create quantum scenario analysis.',
    whyItMatters: 'Quantum financial modeling could price complex derivatives in seconds instead of hours.',
  },
  {
    skillA: 'bioinformatics', skillB: 'trading', name: 'Biotech Trading', category: 'science',
    description: 'Trading strategies based on biological and genomic data.',
    whatTheyDo: 'Develop bioinformatics-driven trading signals, analyze clinical trial data for trading, build genomic data pipelines for market intelligence, and create biotech patent analysis systems.',
    whyItMatters: 'Biotech stocks move on clinical trial results — bioinformatics gives traders an analytical edge.',
  },
  {
    skillA: 'bioinformatics', skillB: 'risk_mgmt', name: 'Pandemic Risk Modeling', category: 'science',
    description: 'Biological risk modeling for financial impact assessment.',
    whatTheyDo: 'Build pandemic financial impact models, develop biotech risk frameworks, create clinical trial risk analysis, and implement health data-driven risk assessment.',
    whyItMatters: 'COVID proved that biological risks are financial risks — modeling them is essential.',
  },
  {
    skillA: 'bioinformatics', skillB: 'quantitative', name: 'Bio-Quantitative', category: 'science',
    description: 'Quantitative analysis of biological data for financial applications.',
    whatTheyDo: 'Develop quantitative models for biotech valuations, build genomic data analytics for trading, create bioinformatics-driven factor models, and implement health data quantitative analysis.',
    whyItMatters: 'Biological data is the next frontier for quantitative finance — genomic data creates new alpha sources.',
  },
  {
    skillA: 'bioinformatics', skillB: 'financial_modeling', name: 'Biotech Financial Modeling', category: 'science',
    description: 'Financial modeling for biotech and pharmaceutical companies.',
    whatTheyDo: 'Build biotech valuation models, develop clinical trial financial projections, create pharmaceutical revenue models, and implement biosimilar competitive analysis.',
    whyItMatters: 'Biotech financial modeling requires understanding both biology and finance — few people can do both.',
  },
  {
    skillA: 'statistics', skillB: 'trading', name: 'Statistical Trading', category: 'science',
    description: 'Statistical methods applied to trading strategy development.',
    whatTheyDo: 'Build statistical arbitrage models, develop mean-reversion strategies, create pairs trading algorithms, and implement statistical market microstructure analysis.',
    whyItMatters: 'Statistical trading is the foundation of quantitative finance — every quant strategy starts with statistics.',
  },
  {
    skillA: 'statistics', skillB: 'risk_mgmt', name: 'Statistical Risk Modeling', category: 'science',
    description: 'Advanced statistical methods for financial risk management.',
    whatTheyDo: 'Build extreme value theory models, develop copula-based risk models, implement Bayesian risk frameworks, and create statistical stress testing systems.',
    whyItMatters: 'Statistical risk modeling is the mathematical backbone of modern risk management.',
  },
  {
    skillA: 'statistics', skillB: 'quantitative', name: 'Statistical Quantitative Finance', category: 'science',
    description: 'Advanced statistics for quantitative finance research.',
    whatTheyDo: 'Develop high-frequency data analysis methods, build statistical learning for finance, create time series econometrics models, and implement non-parametric financial models.',
    whyItMatters: 'Statistical methods are the toolkit of quantitative finance — better statistics mean better models.',
  },
  {
    skillA: 'statistics', skillB: 'financial_modeling', name: 'Statistical Financial Modeling', category: 'science',
    description: 'Statistics-driven financial model development.',
    whatTheyDo: 'Build econometric models, develop time series forecasting, create statistical validation frameworks for models, and implement model risk assessment using statistical methods.',
    whyItMatters: 'Statistical validation separates good financial models from dangerous ones.',
  },
  {
    skillA: 'physics', skillB: 'trading', name: 'Physics Trading', category: 'science',
    description: 'Physics-inspired models for financial markets.',
    whatTheyDo: 'Apply statistical mechanics to market modeling, develop Ising model approaches for market dynamics, build entropy-based trading signals, and create physics-informed market microstructure models.',
    whyItMatters: 'Physics models capture market dynamics that traditional finance models miss.',
  },
  {
    skillA: 'physics', skillB: 'risk_mgmt', name: 'Physics Risk Models', category: 'science',
    description: 'Physics-inspired approaches to financial risk.',
    whatTheyDo: 'Build network models for systemic risk, develop phase transition models for market crashes, create percolation theory for contagion analysis, and implement physics-based stress testing.',
    whyItMatters: 'Physics thinking reveals how financial systems cascade and crash — like nuclear chain reactions.',
  },
  {
    skillA: 'physics', skillB: 'quantitative', name: 'Physics Quantitative Finance', category: 'science',
    description: 'Physics methods applied to quantitative finance.',
    whatTheyDo: 'Apply black-Scholes derivation from heat equations, develop lattice models for pricing, build Monte Carlo methods from statistical physics, and create random walk models.',
    whyItMatters: 'Modern quantitative finance was literally invented by physicists — the tradition continues.',
  },
  {
    skillA: 'physics', skillB: 'financial_modeling', name: 'Physics Financial Modeling', category: 'science',
    description: 'Physics-based financial modeling and simulation.',
    whatTheyDo: 'Build agent-based market models, develop fluid dynamics approaches to order flow, create thermodynamic models for market equilibrium, and implement chaos theory for financial modeling.',
    whyItMatters: 'Physics financial models capture non-linear market dynamics that equation-based models miss.',
  },
  {
    skillA: 'materials', skillB: 'trading', name: 'Materials Trading', category: 'science',
    description: 'Trading strategies based on materials science insights.',
    whatTheyDo: 'Analyze commodity markets using materials science knowledge, develop trading signals from materials research, build supply chain analysis for materials, and create material price forecasting models.',
    whyItMatters: 'Understanding materials science gives traders an edge in commodity and industrial markets.',
  },
  {
    skillA: 'materials', skillB: 'risk_mgmt', name: 'Materials Risk', category: 'science',
    description: 'Risk assessment for materials supply chains and commodities.',
    whatTheyDo: 'Build commodity risk models, develop materials supply chain risk analysis, create rare earth dependency risk assessment, and implement materials price risk management.',
    whyItMatters: 'Materials supply chain disruptions can cascade through entire industries — risk management is critical.',
  },
  {
    skillA: 'materials', skillB: 'quantitative', name: 'Materials Quantitative', category: 'science',
    description: 'Quantitative analysis of materials markets and properties.',
    whatTheyDo: 'Develop materials price prediction models, build quantitative materials selection tools, create materials property databases with analytics, and implement materials market microstructure analysis.',
    whyItMatters: 'Materials markets are opaque and complex — quantitative analysis brings transparency.',
  },
  {
    skillA: 'materials', skillB: 'financial_modeling', name: 'Materials Financial Modeling', category: 'science',
    description: 'Financial modeling for materials industries and commodities.',
    whatTheyDo: 'Build commodity pricing models, develop materials industry financial projections, create mining project finance models, and implement materials market forecasting.',
    whyItMatters: 'Materials industries need specialized financial models that account for physical properties and supply chains.',
  },

  // ═══════════════════════════════════════════════
  // SCIENCE × CREATIVE (15 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'quantum', skillB: 'design', name: 'Quantum Interface Design', category: 'science',
    description: 'Designing interfaces for quantum computing and quantum data.',
    whatTheyDo: 'Design quantum circuit visualizers, create quantum state visualization tools, build quantum algorithm interfaces, and develop quantum computing education platforms.',
    whyItMatters: 'Quantum computing needs intuitive interfaces — the best quantum algorithm is useless if no one can program it.',
  },
  {
    skillA: 'quantum', skillB: 'writing', name: 'Quantum Science Writing', category: 'science',
    description: 'Writing about quantum computing and quantum science.',
    whatTheyDo: 'Write quantum computing explainers, create quantum science journalism, develop quantum textbook content, and build quantum education materials.',
    whyItMatters: 'Quantum science is widely misunderstood — clear writing bridges the gap between researchers and the public.',
  },
  {
    skillA: 'quantum', skillB: 'music', name: 'Quantum Sound', category: 'science',
    description: 'Sonification of quantum data and quantum-inspired music.',
    whatTheyDo: 'Create quantum data sonification, develop quantum-inspired musical instruments, build interactive quantum music systems, and design quantum computing soundscapes.',
    whyItMatters: 'Sonification makes abstract quantum concepts tangible — you can hear quantum states.',
  },
  {
    skillA: 'bioinformatics', skillB: 'design', name: 'Bio Visualization', category: 'science',
    description: 'Visualizing biological data — genomes, proteins, pathways.',
    whatTheyDo: 'Build genome browsers, create protein structure visualizers, develop pathway diagrams, design interactive biology education tools, and build scientific illustration systems.',
    whyItMatters: 'Biology is visual — good visualization turns complex data into understanding.',
  },
  {
    skillA: 'bioinformatics', skillB: 'writing', name: 'Science Communication', category: 'science',
    description: 'Communicating biological and genomic science to the public.',
    whatTheyDo: 'Write genomics explainers, create science journalism, develop educational biology content, build patient-facing genetic reports, and create scientific publications.',
    whyItMatters: 'Genomics is advancing faster than public understanding — science communicators bridge that gap.',
  },
  {
    skillA: 'bioinformatics', skillB: 'music', name: 'Bio-Music', category: 'science',
    description: 'Creating music from biological data and patterns.',
    whatTheyDo: 'Sonify DNA sequences, create protein folding soundscapes, develop biological rhythm compositions, and build interactive bio-music installations.',
    whyItMatters: 'Bio-music reveals hidden patterns in biological data through sound — new research tool, new art form.',
  },
  {
    skillA: 'statistics', skillB: 'design', name: 'Data Visualization', category: 'science',
    description: 'Visualizing statistical data and making numbers beautiful.',
    whatTheyDo: 'Build interactive dashboards, create statistical graphics, develop data journalism visualizations, design infographic tools, and build explorable explanations.',
    whyItMatters: 'Data visualization is where statistics meets design — the best insights come from beautiful charts.',
  },
  {
    skillA: 'statistics', skillB: 'writing', name: 'Data Journalism', category: 'science',
    description: 'Writing stories backed by statistical analysis and data.',
    whatTheyDo: 'Write data-driven investigative stories, create statistical explainers, develop data journalism platforms, build fact-checking tools, and create statistical education content.',
    whyItMatters: 'Data journalism holds power accountable with numbers — the most impactful form of journalism.',
  },
  {
    skillA: 'statistics', skillB: 'music', name: 'Statistical Music', category: 'science',
    description: 'Music generated from statistical patterns and data.',
    whatTheyDo: 'Create algorithmic music from data, develop generative composition systems, build data-driven sound installations, and design interactive statistical music tools.',
    whyItMatters: 'Statistical music reveals the hidden rhythms in data — art meets mathematics.',
  },
  {
    skillA: 'physics', skillB: 'design', name: 'Physics Visualization', category: 'science',
    description: 'Visualizing physical phenomena and scientific data.',
    whatTheyDo: 'Build physics simulations with visual output, create scientific visualization tools, develop interactive physics demos, design planetarium software, and build science museum exhibits.',
    whyItMatters: 'Physics visualization makes the invisible visible — from atoms to galaxies.',
  },
  {
    skillA: 'physics', skillB: 'writing', name: 'Physics Communication', category: 'science',
    description: 'Communicating physics to the public and students.',
    whatTheyDo: 'Write physics explainers, create science journalism, develop physics education content, build interactive physics tutorials, and create popular science books.',
    whyItMatters: 'Physics is the most fundamental science — clear communication inspires the next generation of physicists.',
  },
  {
    skillA: 'physics', skillB: 'music', name: 'Sonic Physics', category: 'science',
    description: 'The physics of sound, acoustics, and music technology.',
    whatTheyDo: 'Design concert hall acoustics, build synthesizer physics models, create sound propagation simulators, develop acoustic analysis tools, and build audio physics education.',
    whyItMatters: 'Understanding the physics of sound is essential for audio engineering, music production, and acoustics.',
  },
  {
    skillA: 'materials', skillB: 'design', name: 'Material Design', category: 'science',
    description: 'Designing with advanced materials — smart materials, metamaterials.',
    whatTheyDo: 'Design smart material interfaces, create metamaterial visualizations, build material property comparison tools, develop interactive material catalogs, and design sustainable material selection guides.',
    whyItMatters: 'Material design is the future — choosing the right material makes or breaks a product.',
  },
  {
    skillA: 'materials', skillB: 'writing', name: 'Materials Science Writing', category: 'science',
    description: 'Writing about materials science and engineering.',
    whatTheyDo: 'Write materials science articles, create engineering education content, develop materials industry journalism, build material property databases with documentation, and create materials textbooks.',
    whyItMatters: 'Materials science is behind every product we use — clear writing makes it accessible.',
  },
  {
    skillA: 'materials', skillB: 'music', name: 'Material Sound', category: 'science',
    description: 'The relationship between materials and sound — instrument design, acoustics.',
    whatTheyDo: 'Design instrument materials, develop acoustic material testing, create material resonance visualizations, build interactive instrument material explorers, and design sound-absorbing material tools.',
    whyItMatters: 'Every great instrument starts with the right material — Stradivarius knew this.',
  },

  // ═══════════════════════════════════════════════
  // SCIENCE × BUSINESS (10 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'quantum', skillB: 'entrepreneurship', name: 'Quantum Startup', category: 'science',
    description: 'Building quantum computing companies and products.',
    whatTheyDo: 'Launch quantum computing startups, develop quantum-as-a-service products, create quantum software companies, and build quantum hardware ventures.',
    whyItMatters: 'The quantum computing market is projected to reach $65B by 2030 — the startup window is open.',
  },
  {
    skillA: 'quantum', skillB: 'management', name: 'Quantum Program Management', category: 'science',
    description: 'Managing quantum computing research and development programs.',
    whatTheyDo: 'Lead quantum R&D programs, manage quantum team collaboration, implement quantum project roadmaps, and build quantum research partnerships.',
    whyItMatters: 'Quantum programs need leaders who understand both the science and the business.',
  },
  {
    skillA: 'bioinformatics', skillB: 'entrepreneurship', name: 'Biotech Startup', category: 'science',
    description: 'Building bioinformatics and biotech companies.',
    whatTheyDo: 'Launch genomics startups, develop diagnostic platforms, create drug discovery companies, build precision medicine ventures, and launch bioinformatics SaaS.',
    whyItMatters: 'Biotech is the most exciting startup frontier — biology is the new technology.',
  },
  {
    skillA: 'bioinformatics', skillB: 'management', name: 'Bioinformatics Management', category: 'science',
    description: 'Managing bioinformatics teams and genomics programs.',
    whatTheyDo: 'Lead bioinformatics teams, manage genomic data programs, implement bioinformatics workflows at scale, and build research team leadership.',
    whyItMatters: 'Bioinformatics management bridges the gap between scientists and business leaders.',
  },
  {
    skillA: 'statistics', skillB: 'entrepreneurship', name: 'Analytics Startup', category: 'science',
    description: 'Building data analytics and statistics companies.',
    whatTheyDo: 'Launch analytics platforms, develop statistical consulting firms, create data science products, build A/B testing SaaS, and launch statistical software companies.',
    whyItMatters: 'Analytics startups help every industry make better decisions with data.',
  },
  {
    skillA: 'statistics', skillB: 'management', name: 'Analytics Leadership', category: 'science',
    description: 'Leading analytics organizations and data-driven transformations.',
    whatTheyDo: 'Lead analytics teams, implement data-driven culture, manage analytics platforms, design analytics strategy, and build data literacy programs.',
    whyItMatters: 'Analytics leadership transforms organizations from gut-feeling to data-driven decision making.',
  },
  {
    skillA: 'physics', skillB: 'entrepreneurship', name: 'Deep Tech Startup', category: 'science',
    description: 'Building deep technology companies based on physics research.',
    whatTheyDo: 'Launch deep tech ventures, develop photonics companies, create sensor startups, build energy technology companies, and launch space tech ventures.',
    whyItMatters: 'Deep tech startups solve the hardest problems — they create entirely new industries.',
  },
  {
    skillA: 'physics', skillB: 'management', name: 'Research Program Management', category: 'science',
    description: 'Managing physics research programs and scientific teams.',
    whatTheyDo: 'Lead research programs, manage scientific teams, implement research project management, design collaboration frameworks, and build research partnerships.',
    whyItMatters: 'Research programs need leaders who can translate scientific potential into business value.',
  },
  {
    skillA: 'materials', skillB: 'entrepreneurship', name: 'Materials Startup', category: 'science',
    description: 'Building materials science companies and products.',
    whatTheyDo: 'Launch materials startups, develop advanced material products, create sustainable materials companies, build material testing services, and launch material innovation ventures.',
    whyItMatters: 'Materials science startups create the physical building blocks of the future.',
  },
  {
    skillA: 'materials', skillB: 'management', name: 'Materials Program Management', category: 'science',
    description: 'Managing materials science programs and R&D teams.',
    whatTheyDo: 'Lead materials R&D programs, manage laboratory operations, implement materials testing programs, design material qualification processes, and build materials industry partnerships.',
    whyItMatters: 'Materials program management bridges lab research and commercial production.',
  },

  // ═══════════════════════════════════════════════
  // FINANCE × CREATIVE (12 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'trading', skillB: 'design', name: 'Trading UX Design', category: 'finance',
    description: 'Designing trading interfaces and financial dashboards.',
    whatTheyDo: 'Design trading terminal interfaces, create financial dashboards, build order entry UX, develop risk visualization tools, and design mobile trading apps.',
    whyItMatters: 'Trading UX directly impacts P&L — a poorly designed interface costs traders money.',
  },
  {
    skillA: 'trading', skillB: 'writing', name: 'Financial Journalism', category: 'finance',
    description: 'Writing about markets, trading, and financial analysis.',
    whatTheyDo: 'Write market analysis, create trading education content, develop financial newsletters, build trading community content, and create financial news coverage.',
    whyItMatters: 'Financial journalism educates millions of investors and holds markets accountable.',
  },
  {
    skillA: 'trading', skillB: 'music', name: 'Market Rhythms', category: 'finance',
    description: 'Exploring the musical patterns in market data.',
    whatTheyDo: 'Sonify market data, create algorithmic music from trading patterns, develop market data music installations, and build financial data audio visualization.',
    whyItMatters: 'Market sonification reveals patterns that charts miss — sound as an analytical tool.',
  },
  {
    skillA: 'risk_mgmt', skillB: 'design', name: 'Risk Visualization', category: 'finance',
    description: 'Designing risk dashboards and risk communication tools.',
    whatTheyDo: 'Design risk dashboards, create risk heatmaps, build stress test visualizations, develop risk reporting interfaces, and create board-level risk presentations.',
    whyItMatters: 'Risk visualization is how executives understand exposure — bad design leads to bad decisions.',
  },
  {
    skillA: 'risk_mgmt', skillB: 'writing', name: 'Risk Communication', category: 'finance',
    description: 'Communicating risk to stakeholders, regulators, and the public.',
    whatTheyDo: 'Write risk reports, create regulatory filings, develop risk education content, build investor risk communications, and create crisis communication plans.',
    whyItMatters: 'Clear risk communication prevents panic and enables informed decision making.',
  },
  {
    skillA: 'risk_mgmt', skillB: 'music', name: 'Risk Sonification', category: 'finance',
    description: 'Using sound to communicate financial risk levels.',
    whatTheyDo: 'Create risk level audio indicators, develop portfolio health soundscapes, build trading floor audio alerts, and design risk escalation sound systems.',
    whyItMatters: 'Audio risk indicators provide instant awareness without looking at a screen.',
  },
  {
    skillA: 'quantitative', skillB: 'design', name: 'Quant Visualization', category: 'finance',
    description: 'Visualizing complex quantitative financial models.',
    whatTheyDo: 'Design factor model visualizations, create backtesting result displays, build correlation network graphs, develop Monte Carlo simulation visualizers, and design quant research dashboards.',
    whyItMatters: 'Quant models are complex — visualization makes them understandable and debuggable.',
  },
  {
    skillA: 'quantitative', skillB: 'writing', name: 'Quant Research Writing', category: 'finance',
    description: 'Writing quantitative research papers and strategy documentation.',
    whatTheyDo: 'Write quant research papers, document trading strategies, create factor investing explanations, develop quant education content, and build strategy documentation.',
    whyItMatters: 'Clear documentation separates quant strategies that scale from those that break.',
  },
  {
    skillA: 'quantitative', skillB: 'music', name: 'Quant Sonification', category: 'finance',
    description: 'Sonifying quantitative financial data and models.',
    whatTheyDo: 'Create portfolio sonification, develop model output soundscapes, build correlation audio representations, and design quant research audio tools.',
    whyItMatters: 'Quant sonification lets quants hear their models — a new dimension for model validation.',
  },
  {
    skillA: 'financial_modeling', skillB: 'design', name: 'Financial Model Design', category: 'finance',
    description: 'Designing clear, user-friendly financial models and tools.',
    whatTheyDo: 'Design financial model interfaces, create valuation tool UX, build financial planning dashboards, develop investor presentation tools, and design financial education platforms.',
    whyItMatters: 'Financial models are only useful if people can understand and use them.',
  },
  {
    skillA: 'financial_modeling', skillB: 'writing', name: 'Financial Writing', category: 'finance',
    description: 'Writing financial analysis, reports, and educational content.',
    whatTheyDo: 'Write equity research, create financial education content, develop investment memos, build financial literacy programs, and create financial planning guides.',
    whyItMatters: 'Financial writing translates complex analysis into actionable insights for decision makers.',
  },
  {
    skillA: 'financial_modeling', skillB: 'music', name: 'Financial Sonification', category: 'finance',
    description: 'Creating audio representations of financial data.',
    whatTheyDo: 'Sonify financial statements, create portfolio health audio, develop financial trend soundscapes, and build audio financial dashboards.',
    whyItMatters: 'Financial sonification provides a new way to understand money flows — hear the balance sheet.',
  },

  // ═══════════════════════════════════════════════
  // FINANCE × BUSINESS (8 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'trading', skillB: 'entrepreneurship', name: 'Trading Startup', category: 'finance',
    description: 'Building trading firms and market-making companies.',
    whatTheyDo: 'Launch proprietary trading firms, build market-making companies, create trading platforms, develop brokerage startups, and launch trading education ventures.',
    whyItMatters: 'Trading startups democratize market access — anyone can build a trading firm.',
  },
  {
    skillA: 'trading', skillB: 'management', name: 'Trading Desk Management', category: 'finance',
    description: 'Managing trading desks and portfolio teams.',
    whatTheyDo: 'Lead trading teams, manage risk budgets, implement trading compliance, design trader development programs, and build trading culture.',
    whyItMatters: 'Trading desk management is where alpha generation meets team leadership.',
  },
  {
    skillA: 'risk_mgmt', skillB: 'entrepreneurship', name: 'Risk Tech Startup', category: 'finance',
    description: 'Building risk management technology companies.',
    whatTheyDo: 'Launch risk SaaS platforms, create compliance automation startups, build RegTech companies, develop risk analytics products, and launch governance tools.',
    whyItMatters: 'RegTech is a $40B+ market — every company needs risk management tools.',
  },
  {
    skillA: 'risk_mgmt', skillB: 'management', name: 'Chief Risk Officer', category: 'finance',
    description: 'Leading enterprise risk management functions.',
    whatTheyDo: 'Build enterprise risk frameworks, lead risk committees, implement risk governance, design risk appetite frameworks, and manage regulatory relationships.',
    whyItMatters: 'The CRO is the second most important person in a financial institution after the CEO.',
  },
  {
    skillA: 'quantitative', skillB: 'entrepreneurship', name: 'Quant Fund Startup', category: 'finance',
    description: 'Launching quantitative hedge funds and asset management firms.',
    whatTheyDo: 'Launch quant hedge funds, build systematic trading firms, create factor-based ETF companies, develop quant asset management platforms, and launch quant research firms.',
    whyItMatters: 'Quant funds manage trillions — starting one requires both quant skills and business acumen.',
  },
  {
    skillA: 'quantitative', skillB: 'management', name: 'Quant Team Leadership', category: 'finance',
    description: 'Leading quantitative research and trading teams.',
    whatTheyDo: 'Lead quant research teams, manage strategy development, implement quant team collaboration, design research production pipelines, and build quant talent development programs.',
    whyItMatters: 'Quant teams need leaders who understand both the math and the business of quantitative finance.',
  },
  {
    skillA: 'financial_modeling', skillB: 'entrepreneurship', name: 'FinTech Startup', category: 'finance',
    description: 'Building financial technology companies.',
    whatTheyDo: 'Launch FinTech ventures, build robo-advisor platforms, create lending marketplaces, develop payment systems, and launch financial planning tools.',
    whyItMatters: 'FinTech is disrupting the $25T financial services industry — the opportunity is enormous.',
  },
  {
    skillA: 'financial_modeling', skillB: 'management', name: 'CFO / Finance Leadership', category: 'finance',
    description: 'Leading finance functions and financial strategy.',
    whatTheyDo: 'Lead finance teams, manage capital allocation, implement financial planning processes, design investor relations, and build financial strategy for enterprises.',
    whyItMatters: 'Finance leadership determines how companies allocate capital — the ultimate strategic decision.',
  },

  // ═══════════════════════════════════════════════
  // CREATIVE × BUSINESS (3 fusions)
  // ═══════════════════════════════════════════════
  {
    skillA: 'design', skillB: 'entrepreneurship', name: 'Design Startup', category: 'creative',
    description: 'Building design-led companies and products.',
    whatTheyDo: 'Launch design agencies, create design tool startups, build brand identity companies, develop UX consulting firms, and launch design education platforms.',
    whyItMatters: 'Design-led companies outperform peers by 2:1 — design is a competitive advantage.',
  },
  {
    skillA: 'writing', skillB: 'entrepreneurship', name: 'Content Startup', category: 'creative',
    description: 'Building content-driven companies and media ventures.',
    whatTheyDo: 'Launch media companies, build content platforms, create publishing startups, develop content marketing agencies, and launch newsletter businesses.',
    whyItMatters: 'Content is the internet economy — content startups can scale with zero marginal cost.',
  },
  {
    skillA: 'music', skillB: 'entrepreneurship', name: 'Music Startup', category: 'creative',
    description: 'Building music technology and entertainment companies.',
    whatTheyDo: 'Launch music streaming services, build music production tool companies, create artist management platforms, develop music licensing startups, and launch concert tech ventures.',
    whyItMatters: 'Music industry is worth $26B+ and growing — music startups are reshaping how we create and consume music.',
  },
];

export const RARITY_TIERS = {
  common: { label: 'Common', color: '#9ca3af', xpReward: 50 },
  uncommon: { label: 'Uncommon', color: '#22c55e', xpReward: 100 },
  rare: { label: 'Rare', color: '#3b82f6', xpReward: 200 },
  epic: { label: 'Epic', color: '#a855f7', xpReward: 400 },
  legendary: { label: 'Legendary', color: '#f59e0b', xpReward: 800 },
} as const;

export type RarityTier = keyof typeof RARITY_TIERS;

export function getFusionRarity(fusion: Fusion): RarityTier {
  const catA = SKILLS.find(s => s.id === fusion.skillA)?.category;
  const catB = SKILLS.find(s => s.id === fusion.skillB)?.category;
  if (catA === catB) return 'common';
  const sameCat = catA === catB;
  if (!sameCat) {
    const cats = new Set([catA, catB]);
    if (cats.has('tech') && (cats.has('science') || cats.has('finance'))) return 'rare';
    if (cats.has('creative') && cats.has('science')) return 'epic';
    if (cats.has('creative') && cats.has('finance')) return 'epic';
    if (cats.has('business') && cats.has('science')) return 'legendary';
  }
  return 'uncommon';
}
