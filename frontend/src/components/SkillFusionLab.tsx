"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Zap, Atom, Plus, BookOpen, Trophy, Sparkles, X, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface SkillNode {
  id: string;
  label: string;
  color: string;
  glow: string;
  x: number; y: number; vx: number; vy: number;
  radius: number; pulse: number; pulseDir: number;
  dragging: boolean; tier: number; rarity: string;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
}

interface Explosion {
  x: number; y: number; life: number;
  particles: Particle[]; label: string; rarity: string;
}

interface Discovery {
  id: string; a: string; b: string; result: string;
  tier: number; rarity: string; timestamp: number; score: number;
  description?: string;
}

/* ═══════════════════════════════════════════════════════════
   SKILL DATABASE: Real domains only
   ═══════════════════════════════════════════════════════════ */
const BASE_SKILLS: { id: string; label: string; color: string; category: string }[] = [
  { id: "security", label: "Security", color: "#10b981", category: "Tech" },
  { id: "linux", label: "Linux", color: "#f59e0b", category: "Tech" },
  { id: "devops", label: "DevOps", color: "#3b82f6", category: "Tech" },
  { id: "cloud", label: "Cloud", color: "#8b5cf6", category: "Tech" },
  { id: "coding", label: "Coding", color: "#ef4444", category: "Tech" },
  { id: "ai", label: "AI/ML", color: "#06b6d4", category: "Tech" },
  { id: "data", label: "Data", color: "#14b8a6", category: "Tech" },
  { id: "blockchain", label: "Blockchain", color: "#f97316", category: "Tech" },
  { id: "quantum", label: "Quantum", color: "#a855f7", category: "Science" },
  { id: "trading", label: "Trading", color: "#22c55e", category: "Finance" },
  { id: "risk", label: "Risk Mgmt", color: "#ef4444", category: "Finance" },
  { id: "quant", label: "Quantitative", color: "#3b82f6", category: "Finance" },
  { id: "defi", label: "DeFi", color: "#f59e0b", category: "Finance" },
  { id: "math", label: "Mathematics", color: "#8b5cf6", category: "Science" },
  { id: "stats", label: "Statistics", color: "#ec4899", category: "Science" },
  { id: "physics", label: "Physics", color: "#06b6d4", category: "Science" },
  { id: "biology", label: "Biology", color: "#22c55e", category: "Science" },
  { id: "design", label: "Design", color: "#f472b6", category: "Creative" },
  { id: "writing", label: "Writing", color: "#a78bfa", category: "Creative" },
  { id: "strategy", label: "Strategy", color: "#fbbf24", category: "Business" },
  { id: "marketing", label: "Marketing", color: "#fb923c", category: "Business" },
];

const CATEGORIES = [...new Set(BASE_SKILLS.map(s => s.category))];
const TOTAL_PAIRS = BASE_SKILLS.length * (BASE_SKILLS.length - 1) / 2;

/* ═══════════════════════════════════════════════════════════
   REAL FUSIONS: Every single combination maps to a real
   existing field or discipline. No fake names.
   ═══════════════════════════════════════════════════════════ */
const REAL_FUSIONS: Record<string, { name: string; description: string; tier: number; rarity: string; score: number }> = {
  // ─── TECH + TECH ─────────────────────────────────────
  "linux+security":    { name: "Penetration Testing", description: "Offensive security where you systematically find and exploit vulnerabilities in Linux/Unix systems. Examples include network reconnaissance, privilege escalation, and buffer overflow exploitation. Career paths include penetration tester, red team operator, or bug bounty hunter at cybersecurity firms, government agencies, or Fortune 500 companies.", tier: 1, rarity: "Uncommon", score: 150 },
  "devops+linux":      { name: "Site Reliability Engineering", description: "Applying software engineering principles to infrastructure management to ensure uptime, reliability, and performance at scale. You monitor SLIs and SLOs, automate incident response, and build self-healing systems. Job roles include SRE, infrastructure engineer, or platform reliability engineer at cloud-native companies, tech giants, or SaaS providers.", tier: 1, rarity: "Uncommon", score: 150 },
  "cloud+devops":      { name: "Cloud Architecture", description: "Designing and operating distributed systems across AWS, GCP, or Azure including compute, networking, storage, and infrastructure as code. You architect multi-region deployments, design for fault tolerance, and optimize cloud spend. Career paths include cloud architect, solutions architect, or infrastructure lead at enterprises, cloud providers, or consulting firms.", tier: 1, rarity: "Rare", score: 250 },
  "cloud+security":    { name: "Cloud Security Engineering", description: "Securing cloud infrastructure through identity and access management, encryption, compliance controls, and zero-trust architecture. You implement least-privilege policies, audit cloud configurations, and respond to cloud-native threats. Roles include cloud security engineer, DevSecOps architect, or CISO advisor at financial institutions, healthcare organizations, or cloud service providers.", tier: 1, rarity: "Rare", score: 250 },
  "coding+security":   { name: "Secure Software Development", description: "Writing code with security as a first-class concern by applying OWASP guidelines, threat modeling, and automated SAST/DAST scanning throughout the SDLC. You perform code reviews for vulnerabilities, design secure authentication flows, and manage vulnerability remediation. Career paths include application security engineer, secure code reviewer, or security champion at software companies, fintechs, or defense contractors.", tier: 1, rarity: "Uncommon", score: 150 },
  "coding+linux":      { name: "Systems Programming", description: "Building low-level software that interacts directly with hardware and operating systems, including kernels, device drivers, and embedded firmware. You work with C, Rust, or Assembly to manage memory, handle concurrency, and optimize performance-critical code. Roles include systems programmer, embedded software engineer, or kernel developer at chipmakers, robotics firms, or operating system companies.", tier: 1, rarity: "Uncommon", score: 150 },
  "coding+devops":     { name: "Platform Engineering", description: "Building and maintaining internal developer platforms that streamline CI/CD pipelines, Kubernetes orchestration, and developer experience tooling. You create golden paths, self-service infrastructure, and deployment automation that boost engineering velocity. Career paths include platform engineer, developer productivity engineer, or infrastructure developer at mid-to-large technology companies.", tier: 1, rarity: "Rare", score: 200 },
  "coding+cloud":      { name: "Cloud-Native Development", description: "Building microservices, serverless functions, and containerized applications designed for cloud environments from the ground up. You leverage Kubernetes, service meshes, and event-driven architectures to create scalable, resilient systems. Roles include cloud-native developer, backend engineer, or distributed systems engineer at SaaS startups, cloud providers, or enterprise tech teams.", tier: 1, rarity: "Rare", score: 200 },
  "devops+security":   { name: "DevSecOps", description: "Integrating security practices into every stage of the DevOps pipeline through shift-left methodologies and automated security scanning. You embed SAST, DAST, dependency scanning, and secrets detection into CI/CD workflows. Career paths include DevSecOps engineer, security automation engineer, or security pipeline architect at enterprises with mature DevOps practices.", tier: 1, rarity: "Epic", score: 300 },
  "cloud+linux":       { name: "Infrastructure as Code", description: "Managing and provisioning cloud infrastructure through version-controlled, repeatable code using Terraform, Ansible, or Pulumi. You write declarative configs, build reusable modules, and enforce infrastructure drift detection. Roles include IaC engineer, cloud automation engineer, or infrastructure developer at companies scaling their cloud environments.", tier: 1, rarity: "Uncommon", score: 150 },
  "cloud+coding":      { name: "Cloud-Native Development", description: "Building microservices and serverless applications designed for cloud from the ground up using containers, APIs, and event-driven patterns. You architect for horizontal scalability, deploy across regions, and integrate managed cloud services. Career paths include cloud application developer, distributed systems engineer, or full-stack cloud engineer at cloud-native startups and enterprises.", tier: 1, rarity: "Rare", score: 200 },
  "linux+coding":      { name: "Systems Programming", description: "Building low-level software such as operating system kernels, device drivers, and embedded firmware using C, Rust, or Assembly. You manage memory allocation, handle interrupts, and optimize for hardware constraints. Roles include systems software engineer, embedded developer, or OS engineer at chip manufacturers, IoT companies, or aerospace firms.", tier: 1, rarity: "Uncommon", score: 150 },
  "linux+data":        { name: "Linux Systems Administration", description: "Managing Linux servers, storage arrays, and networking infrastructure that form the backbone of all data-driven systems. You configure services, manage user access, monitor performance, and automate routine maintenance with shell scripts and Ansible. Career paths include systems administrator, Linux infrastructure engineer, or data center operations engineer at hosting providers, enterprises, or research institutions.", tier: 1, rarity: "Common", score: 100 },
  "linux+ai":          { name: "Edge AI / On-Device ML", description: "Deploying machine learning models on resource-constrained edge devices such as ARM processors, Raspberry Pi, and TPUs. You optimize models for inference speed and memory footprint using quantization, pruning, and knowledge distillation. Roles include edge AI engineer, embedded ML developer, or on-device machine learning engineer at IoT companies, autonomous vehicle firms, or consumer electronics manufacturers.", tier: 1, rarity: "Rare", score: 200 },
  "linux+blockchain":  { name: "Blockchain Node Operations", description: "Running and maintaining blockchain validator nodes, mining infrastructure, and node synchronization across distributed networks. You monitor node health, manage key rotation, handle chain upgrades, and ensure high availability. Career paths include blockchain infrastructure engineer, node operations lead, or validator operator at crypto exchanges, staking providers, or protocol foundations.", tier: 1, rarity: "Rare", score: 200 },
  "linux+quantum":     { name: "Quantum Computing Infrastructure", description: "Setting up and managing the Linux-based infrastructure required for quantum computing research and development. You configure cryogenic control systems, manage Qiskit and Cirq environments, and maintain quantum-classical hybrid computing pipelines. Roles include quantum infrastructure engineer, quantum systems administrator, or quantum lab operations engineer at quantum computing startups, national labs, or research universities.", tier: 2, rarity: "Epic", score: 350 },
  "security+coding":   { name: "Application Security", description: "Securing applications throughout their entire lifecycle from design through deployment and maintenance. You conduct code reviews for vulnerabilities, perform penetration testing on web and mobile apps, and manage vulnerability remediation programs. Career paths include application security engineer, AppSec lead, or product security engineer at software companies, banks, or government agencies.", tier: 1, rarity: "Uncommon", score: 150 },
  "security+ai":       { name: "AI Security Research", description: "Investigating adversarial attacks on machine learning models, including model poisoning, evasion attacks, and deepfake detection. You develop AI red teaming frameworks, design robust model defenses, and audit AI systems for safety. Roles include AI security researcher, adversarial ML specialist, or AI red team engineer at AI labs, cybersecurity firms, or government research agencies.", tier: 1, rarity: "Epic", score: 350 },
  "security+data":     { name: "Data Security & Privacy", description: "Protecting sensitive data through encryption, data loss prevention, anonymization, and privacy engineering while ensuring regulatory compliance with GDPR, CCPA, and HIPAA. You design data classification schemes, implement access controls, and build privacy-preserving pipelines. Career paths include data protection officer, privacy engineer, or data security architect at healthcare organizations, financial institutions, or tech companies handling personal data.", tier: 1, rarity: "Uncommon", score: 150 },
  "security+blockchain": { name: "Smart Contract Auditing", description: "Reviewing Solidity, Vyper, and Rust smart contract code for security vulnerabilities such as reentrancy, integer overflow, and economic exploits. You use static analysis tools, formal verification, and manual code review to identify flaws before deployment. Roles include smart contract auditor, blockchain security researcher, or DeFi security consultant at audit firms, crypto projects, or bug bounty platforms.", tier: 1, rarity: "Epic", score: 350 },
  "security+quantum":  { name: "Post-Quantum Cryptography", description: "Designing and implementing cryptographic systems that resist attacks from quantum computers using lattice-based, hash-based, and code-based algorithms. You evaluate NIST PQC standards, migrate legacy crypto systems, and build quantum-safe key exchange protocols. Career paths include cryptography engineer, PQC migration specialist, or security architect at government agencies, defense contractors, or financial institutions preparing for quantum threats.", tier: 2, rarity: "Legendary", score: 500 },
  "security+defi":     { name: "DeFi Security Auditing", description: "Auditing decentralized finance protocols for vulnerabilities including flash loan attacks, oracle manipulation, and economic exploit vectors. You analyze token economics, simulate attack scenarios, and recommend mitigation strategies. Roles include DeFi security auditor, protocol risk analyst, or blockchain exploit researcher at audit firms, crypto security companies, or DeFi protocol teams.", tier: 1, rarity: "Epic", score: 350 },
  "security+trading":  { name: "Financial Systems Security", description: "Securing trading platforms, payment gateways, and banking infrastructure from cyber threats including fraud, DDoS attacks, and data breaches. You implement real-time fraud detection, secure API endpoints, and design incident response plans for financial operations. Career paths include financial systems security engineer, trading platform security architect, or fintech CISO at banks, brokerages, or payment processors.", tier: 1, rarity: "Rare", score: 250 },
  "security+risk":     { name: "Cybersecurity Risk Management", description: "Assessing and mitigating organizational cyber risk through structured frameworks such as NIST CSF, ISO 27001, and COBIT. You conduct risk assessments, develop security policies, and quantify cyber risk in business terms for executive leadership. Roles include cybersecurity risk manager, GRC analyst, or information security risk officer at enterprises, consulting firms, or regulatory bodies.", tier: 1, rarity: "Rare", score: 200 },
  "coding+ai":         { name: "Machine Learning Engineering", description: "Building and deploying machine learning systems at scale including feature stores, model serving infrastructure, and training pipelines. You design MLOps workflows, optimize model inference latency, and monitor model drift in production. Career paths include ML engineer, AI platform engineer, or machine learning infrastructure engineer at AI companies, tech giants, or data-driven enterprises.", tier: 1, rarity: "Rare", score: 200 },
  "coding+data":       { name: "Data Engineering", description: "Building and maintaining the data pipelines, ETL/ELT systems, and data warehouses that power analytics and machine learning. You design streaming architectures with Kafka, orchestrate workflows with Airflow, and optimize query performance. Roles include data engineer, analytics engineer, or data platform developer at companies with large-scale data operations.", tier: 1, rarity: "Uncommon", score: 150 },
  "coding+blockchain": { name: "Smart Contract Development", description: "Writing, testing, and deploying decentralized application logic using Solidity, Rust for Solana, or Move for Aptos. You implement token standards, design upgradeable contract patterns, and integrate with DeFi protocols. Career paths include smart contract developer, blockchain backend engineer, or Web3 full-stack developer at crypto startups, DAOs, or protocol foundations.", tier: 1, rarity: "Rare", score: 200 },
  "coding+quantum":    { name: "Quantum Algorithm Development", description: "Writing quantum circuits and algorithms using frameworks such as Qiskit, Cirq, and PennyLane to solve problems intractable for classical computers. You implement variational quantum eigensolvers, quantum approximate optimization, and quantum machine learning circuits. Roles include quantum software engineer, quantum algorithm researcher, or quantum computing developer at quantum startups, IBM, Google, or national research laboratories.", tier: 2, rarity: "Epic", score: 400 },
  "coding+math":       { name: "Computational Mathematics", description: "Developing numerical methods, algorithms, and software for mathematical modeling, simulation, and optimization. You implement finite element solvers, optimization algorithms, and symbolic computation systems. Career paths include computational mathematician, numerical software developer, or research scientist at simulation companies, national labs, or quantitative finance firms.", tier: 1, rarity: "Rare", score: 200 },
  "coding+physics":    { name: "Scientific Computing", description: "Simulating physical systems using computational methods such as finite element analysis, computational fluid dynamics, and N-body particle simulations. You write high-performance code that models real-world phenomena from structural engineering to astrophysics. Roles include scientific computing engineer, simulation software developer, or HPC engineer at research institutions, aerospace companies, or engineering firms.", tier: 1, rarity: "Rare", score: 200 },
  "coding+design":     { name: "Creative Coding / Generative Art", description: "Using code as an artistic medium to create interactive visuals, generative art, and creative technology installations. You work with p5.js, Three.js, Processing, or TouchDesigner to build procedural animations and data-driven art. Career paths include creative technologist, generative artist, or creative coder at art studios, advertising agencies, or new media companies.", tier: 1, rarity: "Uncommon", score: 150 },
  "coding+strategy":   { name: "Software Product Strategy", description: "Making technical product decisions that align engineering capabilities with business goals, including build-vs-buy analysis, tech stack selection, and platform roadmaps. You evaluate technical trade-offs, prioritize engineering investments, and communicate technical constraints to stakeholders. Roles include technical product manager, engineering strategist, or CTO advisor at startups, scale-ups, and enterprise technology divisions.", tier: 1, rarity: "Uncommon", score: 150 },
  "devops+data":       { name: "Data Platform Engineering", description: "Building and operating the large-scale data infrastructure that powers analytics and machine learning, including Kafka streaming clusters, Spark processing engines, and Airflow orchestration. You ensure data reliability, optimize pipeline costs, and build self-service data tools. Career paths include data platform engineer, data infrastructure lead, or data ops engineer at companies with complex data ecosystems.", tier: 1, rarity: "Rare", score: 200 },
  "devops+ai":         { name: "MLOps", description: "Machine learning operations covering the full lifecycle of ML models from training through production monitoring and retraining. You build CI/CD pipelines for ML, manage model versioning and registry, and set up drift detection and alerting. Roles include MLOps engineer, AI platform engineer, or ML infrastructure engineer at companies deploying machine learning at scale.", tier: 1, rarity: "Rare", score: 250 },
  "devops+blockchain": { name: "Blockchain Infrastructure", description: "Running validator networks, orchestrating node deployments, monitoring chain health, and automating blockchain infrastructure operations. You manage key management systems, handle network upgrades, and design high-availability node architectures. Career paths include blockchain DevOps engineer, distributed systems engineer for Web3, or infrastructure lead at crypto exchanges and staking providers.", tier: 1, rarity: "Rare", score: 250 },
  "cloud+ai":          { name: "Cloud ML Infrastructure", description: "Designing and managing GPU clusters, managed ML services like SageMaker and Vertex AI, and distributed training infrastructure in the cloud. You optimize GPU utilization, manage multi-tenant ML platforms, and build auto-scaling training pipelines. Roles include cloud ML engineer, AI infrastructure architect, or ML platform engineer at cloud providers, AI startups, or large enterprises running AI workloads.", tier: 1, rarity: "Rare", score: 250 },
  "cloud+data":        { name: "Data Lake Architecture", description: "Designing scalable cloud-based data storage systems using S3 or GCS data lakes, Delta Lake, Snowflake, and centralized data catalogs. You implement lakehouse architectures, design data partitioning strategies, and optimize storage costs across petabyte-scale datasets. Career paths include data architect, data lake engineer, or cloud data platform lead at enterprises with complex data management needs.", tier: 1, rarity: "Rare", score: 250 },
  "cloud+blockchain":  { name: "Decentralized Cloud Infrastructure", description: "Building applications and services on decentralized cloud platforms such as Filecoin for storage, Arweave for permanence, and Akash for compute. You deploy workloads across distributed networks, manage content addressing, and design fault-tolerant decentralized architectures. Roles include decentralized infrastructure engineer, Web3 cloud architect, or distributed systems developer at decentralized protocol companies.", tier: 1, rarity: "Rare", score: 250 },
  "cloud+quantum":     { name: "Quantum Cloud Computing", description: "Accessing quantum computing hardware through cloud services such as IBM Quantum, Amazon Braket, and Azure Quantum to run quantum algorithms remotely. You manage quantum job queues, optimize circuit transpilation, and build hybrid quantum-classical workflows. Career paths include quantum cloud engineer, quantum access platform developer, or quantum-as-a-service architect at cloud providers and quantum computing companies.", tier: 2, rarity: "Legendary", score: 500 },
  "ai+data":           { name: "Deep Learning", description: "Building and training neural network architectures including CNNs for vision, RNNs and Transformers for sequence data, and diffusion models for generation. You design model architectures, tune hyperparameters, and scale training across GPU clusters. Roles include deep learning engineer, research scientist, or computer vision engineer at AI labs, tech companies, or autonomous driving firms.", tier: 1, rarity: "Rare", score: 200 },
  "ai+math":           { name: "Mathematical AI", description: "Developing the theoretical foundations of artificial intelligence through optimization theory, linear algebra, and calculus applied to machine learning. You prove convergence guarantees, design new loss functions, and advance the mathematical understanding of why models work. Career paths include AI research scientist, mathematical ML researcher, or theoretical AI engineer at universities, AI research labs, or think tanks.", tier: 1, rarity: "Rare", score: 250 },
  "ai+blockchain":     { name: "Decentralized AI", description: "Combining artificial intelligence with blockchain technology through federated learning, on-chain ML inference, and decentralized model marketplaces. You design privacy-preserving training protocols, build token-incentivized data networks, and create verifiable AI systems. Roles include decentralized AI engineer, federated learning researcher, or blockchain AI architect at Web3 AI startups and research organizations.", tier: 2, rarity: "Epic", score: 350 },
  "ai+quantum":        { name: "Quantum Machine Learning", description: "Exploring the intersection of quantum computing and machine learning through quantum neural networks, quantum kernel methods, and variational quantum eigensolvers. You design hybrid quantum-classical models, analyze quantum advantage bounds, and implement quantum-enhanced feature spaces. Career paths include quantum ML researcher, quantum AI engineer, or quantum algorithm scientist at quantum computing companies, AI labs, or national research facilities.", tier: 2, rarity: "Legendary", score: 550 },
  "ai+physics":        { name: "Computational Physics", description: "Using machine learning to solve physics problems such as particle detection at CERN, materials discovery for new alloys, and cosmological simulations. You train neural networks on experimental data, build surrogate models for expensive simulations, and discover new physical laws from data. Roles include computational physicist, AI-for-science researcher, or ML physicist at national labs, physics departments, or materials science companies.", tier: 1, rarity: "Rare", score: 250 },
  "ai+biology":        { name: "Bioinformatics / Computational Biology", description: "Applying machine learning to biological problems including genomic sequence analysis, protein structure prediction with AlphaFold, and drug target identification. You build pipelines for variant calling, model gene expression patterns, and accelerate pharmaceutical research. Career paths include bioinformatics scientist, computational biologist, or AI drug discovery researcher at biotech companies, pharmaceutical firms, or genomics institutes.", tier: 1, rarity: "Rare", score: 250 },
  "ai+design":         { name: "Generative Design", description: "Using AI tools to create and enhance visual design including Midjourney, Stable Diffusion, DALL-E, and neural style transfer for image generation. You craft prompts, fine-tune models on custom datasets, and integrate generative AI into design workflows. Roles include AI design specialist, generative content creator, or creative AI engineer at design studios, marketing agencies, or entertainment companies.", tier: 1, rarity: "Rare", score: 200 },
  "ai+trading":        { name: "Algorithmic Trading", description: "Building automated trading strategies powered by machine learning for signal generation, order execution, and backtesting across equities, futures, and crypto markets. You engineer features from market data, train predictive models, and optimize execution algorithms for minimal slippage. Career paths include quantitative researcher, algo trading developer, or systematic trading strategist at hedge funds, prop trading firms, or crypto market makers.", tier: 1, rarity: "Epic", score: 400 },
  "ai+marketing":      { name: "AI-Powered Marketing", description: "Leveraging predictive analytics and machine learning for customer segmentation, recommendation engines, and large-scale A/B testing optimization. You build propensity models, design personalized campaign engines, and measure marketing attribution with data-driven methods. Roles include marketing data scientist, AI marketing engineer, or growth ML engineer at e-commerce companies, adtech firms, or consumer brands.", tier: 1, rarity: "Rare", score: 200 },
  "ai+writing":        { name: "Natural Language Processing", description: "Building systems that understand, generate, and transform human language including text analysis, machine translation, chatbots, summarization, and large language model fine-tuning. You work with transformer architectures, design evaluation metrics, and deploy NLP models at scale. Career paths include NLP engineer, conversational AI developer, or applied research scientist at AI companies, search engines, or enterprise software firms.", tier: 1, rarity: "Rare", score: 200 },
  "ai+risk":           { name: "AI Risk & Governance", description: "Ensuring artificial intelligence systems are developed and deployed responsibly through bias detection, fairness auditing, explainability methods, and alignment with emerging AI regulations. You build model monitoring dashboards, design red-teaming frameworks, and develop AI governance policies. Roles include AI ethics researcher, responsible AI engineer, or AI governance lead at tech companies, regulatory bodies, or AI safety organizations.", tier: 1, rarity: "Rare", score: 250 },
  "data+stats":        { name: "Data Science", description: "Extracting actionable insights from data through exploratory analysis, statistical modeling, visualization, and narrative storytelling. You clean and transform datasets, build predictive models, and communicate findings to business stakeholders. Career paths include data scientist, analytics manager, or decision science lead at tech companies, consulting firms, or data-driven enterprises across every industry.", tier: 1, rarity: "Rare", score: 200 },
  "data+math":         { name: "Applied Mathematics", description: "Using mathematical techniques to solve real-world problems in optimization, cryptography, signal processing, and operations research. You formulate mathematical models, develop algorithms, and analyze their theoretical properties. Roles include applied mathematician, quantitative analyst, or research scientist at defense contractors, financial firms, or technology research labs.", tier: 1, rarity: "Uncommon", score: 150 },
  "data+blockchain":   { name: "On-Chain Analytics", description: "Analyzing blockchain data to track wallet movements, detect fraudulent transactions, and monitor DeFi protocol health through chain surveillance and forensic techniques. You build data pipelines that ingest raw block data, cluster wallet addresses, and generate actionable intelligence. Career paths include blockchain analyst, on-chain data researcher, or crypto forensic investigator at analytics firms, exchanges, or law enforcement agencies.", tier: 1, rarity: "Rare", score: 200 },
  "data+biology":      { name: "Genomics Data Science", description: "Analyzing DNA sequencing data through variant calling, gene expression quantification, and genome-wide association studies to advance precision medicine. You build bioinformatics pipelines, analyze single-cell RNA-seq data, and identify genetic markers for disease. Roles include genomics data scientist, computational genomics analyst, or precision medicine data engineer at biotech companies, hospitals, or genomics research centers.", tier: 1, rarity: "Rare", score: 250 },
  "data+physics":      { name: "Experimental Data Analysis", description: "Processing and analyzing data from physics experiments including particle collider data from CERN, telescope observations, and gravitational wave detection from LIGO. You develop signal extraction algorithms, handle massive datasets, and apply statistical methods to discover new phenomena. Career paths include experimental data analyst, research data engineer, or physicist at national laboratories, universities, or space agencies.", tier: 1, rarity: "Rare", score: 200 },
  "blockchain+quantum": { name: "Quantum-Resistant Blockchain", description: "Building blockchain protocols and cryptographic systems that remain secure against attacks from quantum computers using lattice-based cryptography, hash-based signatures, and code-based schemes. You evaluate quantum threat models, migrate existing chains to post-quantum algorithms, and design hybrid cryptographic layers. Roles include quantum-resistant protocol engineer, blockchain cryptography researcher, or PQC blockchain architect at protocol foundations and government-backed projects.", tier: 2, rarity: "Legendary", score: 500 },
  "blockchain+defi":   { name: "DeFi Protocol Engineering", description: "Building decentralized financial protocols including automated market makers, lending platforms, yield aggregators, and stablecoins on EVM-compatible chains or Solana. You implement token economics, design liquidation mechanisms, and integrate oracle price feeds. Career paths include DeFi protocol developer, smart contract engineer, or decentralized finance architect at crypto startups and DAOs.", tier: 1, rarity: "Rare", score: 250 },
  "blockchain+trading": { name: "Crypto Market Making", description: "Providing liquidity on decentralized exchanges, executing MEV extraction strategies, and performing cross-chain arbitrage to profit from price inefficiencies. You build automated market-making bots, optimize gas costs, and manage inventory risk across multiple trading venues. Roles include crypto market maker, DeFi quant trader, or MEV researcher at trading firms, DAOs, or proprietary crypto trading shops.", tier: 1, rarity: "Rare", score: 250 },
  "quantum+math":      { name: "Quantum Computing Theory", description: "Studying the theoretical foundations of quantum computing including qubit representations, quantum gate operations, error correction codes, and computational complexity classes. You prove quantum speedups, design new quantum algorithms, and analyze fault-tolerant architectures. Career paths include quantum computing theorist, quantum information researcher, or quantum complexity scientist at universities, IBM Research, or Google Quantum AI.", tier: 2, rarity: "Epic", score: 400 },
  "quantum+physics":   { name: "Quantum Mechanics", description: "Studying the fundamental physics of quantum systems including wave function dynamics, entanglement, superposition, and quantum field theory. You conduct experiments with photons, trapped ions, or superconducting circuits and develop theoretical models to explain quantum phenomena. Roles include quantum physicist, experimental quantum researcher, or quantum optics scientist at national laboratories, universities, or quantum hardware companies.", tier: 2, rarity: "Epic", score: 350 },
  "quantum+stats":     { name: "Quantum Statistics", description: "Applying statistical methods to quantum systems including Bose-Einstein and Fermi-Dirac distributions, quantum probability theory, and many-body statistical mechanics. You analyze quantum state tomography data, model decoherence, and study thermalization in quantum systems. Career paths include quantum statistical physicist, quantum information theorist, or research scientist at quantum computing labs and theoretical physics departments.", tier: 2, rarity: "Epic", score: 350 },
  "quantum+risk":      { name: "Quantum Risk Modeling", description: "Using quantum computing hardware to accelerate risk simulation through quantum Monte Carlo methods and portfolio stress testing on quantum processors. You design quantum circuits for sampling, compare quantum advantage to classical methods, and build hybrid risk engines. Roles include quantum risk analyst, quantum finance researcher, or quantum computational risk engineer at financial institutions exploring quantum applications.", tier: 3, rarity: "Legendary", score: 500 },
  "quantum+trading":   { name: "Quantum Financial Modeling", description: "Applying quantum algorithms to financial problems including portfolio optimization, option pricing via quantum amplitude estimation, and derivative valuation at scale. You implement quantum algorithms for combinatorial optimization and build quantum-enhanced risk models. Career paths include quantum finance researcher, quantum trading algorithm developer, or quantum computational finance scientist at investment banks, hedge funds, or quantum computing firms with finance partnerships.", tier: 3, rarity: "Legendary", score: 500 },
  "quantum+security":  { name: "Quantum Cryptography", description: "Developing cryptographic protocols that leverage quantum mechanical properties such as quantum key distribution, quantum-safe authentication, and quantum random number generation. You implement BB84 and E91 protocols, build quantum-secured communication channels, and design quantum-resistant encryption schemes. Roles include quantum cryptography engineer, quantum key distribution specialist, or quantum security researcher at government agencies, defense contractors, or quantum technology companies.", tier: 2, rarity: "Legendary", score: 500 },
  "quantum+blockchain": { name: "Quantum Blockchain", description: "Designing distributed ledger systems that are fundamentally resistant to quantum attacks through quantum-resistant consensus mechanisms, quantum-secured communication, and quantum networking protocols. You build quantum key distribution into blockchain layers and develop quantum-enhanced smart contracts. Career paths include quantum blockchain researcher, post-quantum distributed systems architect, or quantum protocol engineer at cutting-edge research institutions and next-generation blockchain projects.", tier: 3, rarity: "Mythic", score: 800 },
  "quantum+ai":        { name: "Quantum Neural Networks", description: "Exploring quantum-enhanced deep learning through parameterized quantum circuits used as neural network layers, quantum kernels for classification, and quantum generative adversarial networks. You analyze quantum advantage bounds for ML tasks and implement hybrid quantum-classical training loops. Roles include quantum ML researcher, quantum AI scientist, or quantum neural network engineer at quantum computing companies, AI research labs, or national quantum initiative programs.", tier: 3, rarity: "Mythic", score: 800 },
  "quantum+coding":    { name: "Quantum Software Engineering", description: "Building, testing, and optimizing quantum algorithms and software using error mitigation techniques, circuit optimization, and quantum-classical hybrid programming. You implement variational algorithms, design quantum compilers, and benchmark quantum hardware performance. Career paths include quantum software engineer, quantum compiler developer, or quantum SDK engineer at IBM, Google, Microsoft Quantum, or quantum computing startups.", tier: 2, rarity: "Epic", score: 400 },
  "quantum+data":      { name: "Quantum Data Processing", description: "Applying quantum algorithms to data analysis tasks including quantum clustering, quantum principal component analysis, and quantum-enhanced database search. You design quantum circuits for data encoding, implement quantum feature maps, and analyze speedups for data-intensive workloads. Roles include quantum data scientist, quantum algorithm developer for data applications, or quantum computing researcher at research institutions and quantum software companies.", tier: 2, rarity: "Epic", score: 350 },
  "quantum+biology":   { name: "Quantum Biology", description: "Studying quantum mechanical effects in biological systems such as quantum coherence in photosynthesis, enzyme tunneling reactions, and quantum entanglement in bird navigation. You design experiments to detect quantum effects in warm, wet biological environments and build theoretical models for biological quantum processes. Career paths include quantum biologist, biophysics researcher, or quantum life science researcher at universities, biotech research labs, or interdisciplinary quantum institutes.", tier: 2, rarity: "Epic", score: 400 },
  "quantum+design":    { name: "Quantum Visualization", description: "Creating visual representations of quantum states, quantum circuit design tools, and intuitive user interfaces for quantum computing workflows. You build interactive circuit composers, visualize qubit state vectors on Bloch spheres, and design quantum error displays. Roles include quantum UX designer, quantum computing visualization engineer, or quantum interface developer at quantum computing companies and educational platforms.", tier: 2, rarity: "Rare", score: 250 },
  "quantum+strategy":  { name: "Quantum Strategy Consulting", description: "Advising organizations on quantum readiness by identifying high-value quantum use cases, evaluating quantum hardware vendors, and developing multi-year quantum technology roadmaps. You assess organizational quantum maturity, benchmark against competitors, and build business cases for quantum investment. Career paths include quantum strategy consultant, quantum readiness advisor, or emerging technology strategist at consulting firms, Big Four companies, or quantum industry associations.", tier: 2, rarity: "Rare", score: 250 },
  "quantum+marketing": { name: "Quantum Technology Marketing", description: "Marketing quantum computing products and services through positioning strategies, go-to-market planning, and evangelism for emerging quantum technologies. You translate complex quantum concepts into compelling narratives, build developer communities, and create thought leadership content. Roles include quantum marketing manager, quantum product marketer, or quantum evangelist at quantum computing startups, cloud providers with quantum services, or quantum software companies.", tier: 2, rarity: "Rare", score: 200 },

  // ─── FINANCE + FINANCE ────────────────────────────────
  "quant+trading":     { name: "Quantitative Trading", description: "Developing mathematical trading strategies including statistical arbitrage, mean reversion, factor models, and alpha signal generation for systematic portfolios. You backtest strategies against historical data, measure risk-adjusted returns, and optimize execution. Career paths include quantitative trader, portfolio manager, or alpha researcher at hedge funds, prop trading firms, or asset managers.", tier: 1, rarity: "Rare", score: 300 },
  "quant+risk":        { name: "Quantitative Risk Management", description: "Building statistical risk models including Value at Risk, stress testing frameworks, credit risk scoring, and regulatory capital calculations under Basel III/IV. You run Monte Carlo simulations, calibrate risk factors, and produce risk reports for regulators and board members. Roles include quantitative risk analyst, risk model developer, or market risk manager at banks, insurance companies, or regulatory agencies.", tier: 1, rarity: "Rare", score: 250 },
  "quant+math":        { name: "Mathematical Finance", description: "Applying rigorous mathematical tools including stochastic calculus, Ito calculus, and Black-Scholes theory to price derivatives and model financial markets. You derive closed-form solutions for options, build interest rate models, and develop risk-neutral pricing frameworks. Career paths include quantitative researcher, mathematical finance analyst, or derivatives pricing specialist at investment banks, hedge funds, or academic finance departments.", tier: 1, rarity: "Epic", score: 350 },
  "quant+stats":       { name: "Financial Econometrics", description: "Applying advanced time series analysis, GARCH volatility models, cointegration tests, and regime detection to financial markets. You build forecasting models, analyze market microstructure, and detect structural breaks in asset returns. Roles include financial econometrician, quantitative researcher, or empirical finance analyst at central banks, asset management firms, or quantitative hedge funds.", tier: 1, rarity: "Epic", score: 400 },
  "quant+defi":        { name: "DeFi Quantitative Research", description: "Applying quantitative methods to analyze decentralized finance protocols including impermanent loss modeling, MEV extraction analysis, and arbitrage opportunity detection. You model protocol risk, simulate token economics, and develop automated trading strategies for on-chain markets. Career paths include DeFi quantitative researcher, on-chain strategy developer, or protocol analytics scientist at crypto hedge funds and DeFi protocol teams.", tier: 2, rarity: "Epic", score: 400 },
  "quant+data":        { name: "Financial Data Science", description: "Analyzing financial market data through alternative data sourcing, sentiment analysis from news and social media, and feature engineering for trading signals. You build predictive models, design data pipelines for real-time market feeds, and evaluate signal decay. Roles include financial data scientist, quant data analyst, or alpha research data engineer at hedge funds, fintech companies, or investment banks.", tier: 1, rarity: "Rare", score: 250 },
  "quant+ai":          { name: "AI-Powered Quant Research", description: "Applying deep reinforcement learning, transformer models, and generative AI to quantitative trading and portfolio management. You train models on market data to predict price movements, optimize execution, and generate novel alpha signals. Career paths include AI quant researcher, machine learning strategist, or deep learning trader at technology-driven hedge funds, AI-native asset managers, or quant divisions of major banks.", tier: 2, rarity: "Legendary", score: 500 },
  "quant+cloud":       { name: "Cloud-Based Trading Systems", description: "Building scalable, low-latency trading infrastructure on cloud platforms including real-time data ingestion, execution engines, and risk calculation services. You design microservices for order management, optimize network latency, and manage multi-region failover. Roles include cloud trading engineer, low-latency systems architect, or trading infrastructure developer at cloud-native trading firms and fintech companies.", tier: 1, rarity: "Rare", score: 250 },
  "trading+risk":      { name: "Portfolio Management", description: "Designing and managing investment portfolios through asset allocation, risk parity strategies, factor investing, and modern portfolio theory. You balance risk and return across asset classes, rebalance portfolios based on market conditions, and communicate strategy to investors. Career paths include portfolio manager, asset allocation specialist, or investment strategist at asset management firms, pension funds, or family offices.", tier: 1, rarity: "Rare", score: 250 },
  "trading+stats":     { name: "Statistical Trading", description: "Building data-driven trading strategies using statistical backtesting, performance attribution analysis, and market microstructure modeling. You evaluate strategy Sharpe ratios, measure drawdown risk, and analyze execution quality. Roles include statistical trader, quantitative strategy analyst, or systematic trading researcher at prop trading firms, hedge funds, or quantitative asset managers.", tier: 1, rarity: "Uncommon", score: 200 },
  "trading+defi":      { name: "DeFi Yield Strategy", description: "Optimizing yield farming strategies in decentralized finance through liquidity provision, token incentive harvesting, and risk-adjusted return optimization. You analyze impermanent loss, evaluate protocol sustainability, and build automated yield aggregation tools. Career paths include DeFi yield strategist, yield farming researcher, or decentralized asset manager at crypto investment firms and DeFi platforms.", tier: 1, rarity: "Rare", score: 250 },
  "trading+data":      { name: "Market Data Analytics", description: "Processing and analyzing real-time market data including tick-by-tick trade data, order book dynamics, market depth feeds, and execution quality metrics. You build streaming data pipelines, detect market anomalies, and generate actionable trading intelligence. Roles include market data analyst, trading data engineer, or market microstructure researcher at exchanges, brokerages, or trading technology companies.", tier: 1, rarity: "Uncommon", score: 150 },
  "trading+cloud":     { name: "Cloud Trading Infrastructure", description: "Designing and operating scalable trading systems on cloud platforms including real-time market data feeds, order execution engines, and portfolio management dashboards. You architect for horizontal scaling, manage latency budgets, and integrate with exchange APIs. Career paths include cloud trading infrastructure engineer, trading platform developer, or fintech cloud architect at trading startups and established financial institutions.", tier: 1, rarity: "Rare", score: 250 },
  "trading+linux":     { name: "Low-Latency Trading Systems", description: "Building ultra-fast trading systems using kernel bypass networking, FPGA co-processors, and microsecond-level optimization on Linux. You tune CPU affinity, eliminate context switches, and design lock-free data structures for HFT. Roles include low-latency engineer, HFT systems developer, or trading infrastructure architect at high-frequency trading firms, proprietary trading shops, or market-making companies.", tier: 1, rarity: "Epic", score: 350 },
  "trading+coding":    { name: "Algorithmic Trading Development", description: "Building automated trading bots, execution algorithms like TWAP and VWAP, and smart order routing systems in Python, C++, or Rust. You design event-driven architectures, backtest against historical data, and optimize for slippage and transaction costs. Career paths include algo trading developer, systematic trading engineer, or execution algorithm researcher at hedge funds, brokerages, or crypto trading firms.", tier: 1, rarity: "Rare", score: 250 },
  "trading+strategy":  { name: "Investment Strategy Design", description: "Designing institutional investment strategies including long/short equity, global macro, event-driven, and multi-asset approaches for pension funds and endowments. You conduct macroeconomic analysis, identify market dislocations, and build strategy portfolios with defined risk budgets. Roles include investment strategist, portfolio strategist, or multi-asset class researcher at asset management firms, sovereign wealth funds, or investment banks.", tier: 1, rarity: "Rare", score: 250 },
  "trading+math":      { name: "Financial Mathematics", description: "Applying stochastic calculus, partial differential equations, and risk-neutral valuation to price exotic derivatives and structured products. You derive pricing formulas for options, build interest rate models, and analyze counterparty credit risk. Career paths include financial mathematician, derivatives quantitative analyst, or structured products modeler at investment banks, insurance companies, or academic finance departments.", tier: 1, rarity: "Rare", score: 250 },
  "trading+blockchain": { name: "Crypto Trading & Market Making", description: "Providing liquidity on centralized and decentralized crypto exchanges, executing cross-chain arbitrage, and developing DEX market-making strategies. You manage bid-ask spreads, hedge inventory risk, and optimize gas costs for on-chain trades. Roles include crypto market maker, digital asset trader, or blockchain trading strategist at crypto hedge funds, exchanges, or market-making firms.", tier: 1, rarity: "Rare", score: 250 },
  "trading+marketing": { name: "Financial Marketing", description: "Marketing financial products and services including robo-advisory platforms, fintech applications, and investment products to retail and institutional audiences. You create educational content, build brand trust through regulatory compliance, and design customer acquisition funnels. Career paths include financial marketing manager, fintech growth marketer, or investment product marketing specialist at brokerages, fintech startups, or asset management companies.", tier: 1, rarity: "Common", score: 100 },
  "trading+writing":   { name: "Financial Journalism", description: "Writing about financial markets, economic trends, and business developments for news outlets, trade publications, and financial media. You analyze earnings reports, interview executives, and explain complex financial instruments to general audiences. Roles include financial reporter, markets columnist, or business journalist at financial news organizations, newspapers, or online media companies.", tier: 1, rarity: "Common", score: 100 },
  "trading+quantum":   { name: "Quantum Finance", description: "Applying quantum computing algorithms to financial problems including option pricing through amplitude estimation, portfolio optimization via quantum annealing, and risk analytics acceleration. You benchmark quantum speedups against classical methods and build hybrid quantum-classical financial models. Career paths include quantum finance researcher, quantum algorithm developer for finance, or quantum computing specialist at financial institutions exploring quantum advantage.", tier: 3, rarity: "Legendary", score: 500 },
  "trading+biology":   { name: "Biotech Investing", description: "Evaluating biotech and life sciences companies through clinical trial analysis, FDA pipeline assessment, and due diligence on drug development programs. You model risk-adjusted NPV of drug pipelines, analyze patent portfolios, and assess management team capabilities. Roles include biotech equity research analyst, life sciences venture capitalist, or healthcare sector portfolio manager at biotech-focused hedge funds and VC firms.", tier: 1, rarity: "Uncommon", score: 150 },
  "trading+physics":   { name: "Financial Physics", description: "Applying physics-derived models to financial markets including statistical mechanics for market dynamics, entropy measures for risk, and fractal analysis for price patterns. You build agent-based models, study market phase transitions, and apply percolation theory to contagion risk. Career paths include financial physicist, econophysics researcher, or quantitative strategist using physics methods at quantitative hedge funds and academic research groups.", tier: 1, rarity: "Rare", score: 200 },
  "risk+stats":        { name: "Actuarial Science", description: "Modeling financial risk and uncertainty for insurance and pension industries using probability theory, mortality tables, and survival analysis. You price insurance policies, calculate reserves for future claims, and assess long-term pension liabilities. Career paths include actuary, pension consultant, or insurance pricing analyst at insurance companies, reinsurance firms, or actuarial consulting practices.", tier: 1, rarity: "Rare", score: 250 },
  "risk+data":         { name: "Risk Analytics", description: "Building data-driven risk assessment systems including credit scoring models, fraud detection algorithms, and operational risk frameworks. You analyze large transaction datasets, design early warning indicators, and quantify loss distributions. Roles include risk data analyst, credit risk modeler, or fraud analytics engineer at banks, credit bureaus, or fintech lending platforms.", tier: 1, rarity: "Rare", score: 200 },
  "risk+defi":         { name: "DeFi Risk Engineering", description: "Designing and implementing risk parameters for decentralized lending protocols including collateralization ratios, liquidation thresholds, oracle manipulation defenses, and protocol circuit breakers. You model systemic risk across interconnected DeFi protocols and build automated risk monitoring. Career paths include DeFi risk engineer, protocol risk analyst, or decentralized finance risk manager at DeFi protocol teams and crypto risk firms.", tier: 1, rarity: "Epic", score: 300 },
  "risk+math":         { name: "Risk Mathematics", description: "Developing theoretical risk models using extreme value theory for tail risk, copula functions for dependency modeling, and multivariate risk frameworks. You derive analytical solutions for portfolio risk, build stress testing models, and quantify model uncertainty. Roles include risk mathematician, quantitative risk modeler, or financial risk researcher at banks, insurance companies, or regulatory agencies.", tier: 1, rarity: "Rare", score: 250 },
  "risk+cloud":        { name: "Cloud Risk Infrastructure", description: "Building real-time risk calculation systems on cloud platforms including streaming risk engines, interactive risk dashboards, and scalable Monte Carlo simulation clusters. You design for low-latency risk reporting, manage cloud costs for compute-intensive models, and ensure regulatory auditability. Career paths include cloud risk infrastructure engineer, real-time risk platform developer, or risk technology architect at banks and financial technology companies.", tier: 1, rarity: "Rare", score: 200 },
  "risk+blockchain":   { name: "Blockchain Risk Management", description: "Assessing and mitigating risks specific to blockchain and cryptocurrency including smart contract vulnerabilities, protocol governance risks, and regulatory compliance across jurisdictions. You evaluate oracle reliability, analyze validator concentration risk, and design insurance mechanisms for DeFi. Roles include blockchain risk analyst, crypto risk manager, or digital asset risk officer at crypto exchanges, custody providers, or blockchain investment firms.", tier: 1, rarity: "Rare", score: 200 },
  "risk+coding":       { name: "Risk Systems Development", description: "Building the software systems that power enterprise risk management including VaR calculation engines, stress testing platforms, and real-time P&L tracking systems. You design for accuracy, auditability, and performance under regulatory deadlines. Career paths include risk systems developer, quantitative risk software engineer, or risk technology lead at banks, insurance companies, and financial technology firms.", tier: 1, rarity: "Rare", score: 200 },
  "risk+ai":           { name: "AI-Driven Risk Assessment", description: "Using machine learning models for credit risk scoring, real-time fraud detection, and anomaly identification in financial transactions. You train models on alternative data sources, design explainable AI for regulatory compliance, and build continuous monitoring systems. Roles include AI risk modeler, machine learning risk analyst, or intelligent risk systems engineer at banks, fintech lenders, and payment processors.", tier: 1, rarity: "Epic", score: 350 },
  "risk+strategy":     { name: "Enterprise Risk Management", description: "Designing and implementing organizational risk frameworks using COSO, ERM, and ISO 31000 standards to manage business continuity, crisis response, and strategic risk. You conduct enterprise-wide risk assessments, develop risk appetite statements, and build board-level risk reporting. Career paths include enterprise risk manager, chief risk officer, or GRC director at corporations, government agencies, or consulting firms.", tier: 1, rarity: "Uncommon", score: 150 },
  "risk+writing":      { name: "Regulatory Writing", description: "Creating compliance documents, regulatory filings, risk reports, and audit documentation for financial institutions subject to SEC, OCC, and international regulatory requirements. You write clear risk disclosures, prepare examination responses, and maintain regulatory filing calendars. Roles include regulatory writer, compliance documentation specialist, or risk reporting analyst at banks, insurance companies, or regulatory consulting firms.", tier: 1, rarity: "Common", score: 100 },
  "risk+marketing":    { name: "Compliance Marketing", description: "Marketing financial products while adhering to strict regulatory constraints including KYC/AML messaging requirements, suitability disclosures, and fair advertising standards. You balance compelling marketing copy with regulatory review processes and ensure claims are substantiated. Career paths include compliance marketing manager, regulated industries marketing specialist, or financial services brand marketer at brokerages, insurance companies, or fintech firms.", tier: 1, rarity: "Common", score: 100 },
  "risk+quantum":      { name: "Quantum Risk Analysis", description: "Applying quantum computing to accelerate Monte Carlo risk simulation, portfolio stress testing, and scenario analysis on quantum processors. You design quantum circuits for sampling risk distributions, benchmark against classical methods, and build hybrid quantum-classical risk engines. Roles include quantum risk analyst, quantum computational finance specialist, or quantum risk modeler at financial institutions exploring quantum computing applications.", tier: 3, rarity: "Legendary", score: 500 },
  "risk+design":       { name: "Risk Dashboard Design", description: "Designing risk visualization interfaces including real-time risk monitors, executive risk dashboards, and automated alert systems for financial risk management. You create intuitive heat maps, scenario comparison tools, and risk limit breach notifications. Career paths include risk UI/UX designer, financial data visualization specialist, or risk dashboard architect at banks, trading firms, and financial technology companies.", tier: 1, rarity: "Uncommon", score: 150 },
  "risk+biology":      { name: "Pandemic Risk Modeling", description: "Modeling epidemic and pandemic risk through SIR compartmental models, insurance pandemic preparedness analysis, and public health system resilience assessment. You design scenario models for outbreak severity, estimate economic impact of pandemics, and build early warning systems. Roles include pandemic risk modeler, health risk analyst, or epidemiological risk consultant at insurance companies, public health agencies, or global risk advisory firms.", tier: 1, rarity: "Rare", score: 250 },
  "risk+physics":      { name: "Catastrophe Modeling", description: "Building physical risk models for natural catastrophes including earthquake ground motion models, hurricane wind and flood simulations, and wildfire spread analysis for the insurance and reinsurance industry. You calibrate models against historical loss data and design parametric insurance triggers. Career paths include catastrophe modeler, natural hazard risk analyst, or reinsurance risk specialist at insurance companies, reinsurance brokers, or catastrophe modeling firms.", tier: 1, rarity: "Rare", score: 250 },
  "defi+blockchain":   { name: "DeFi Protocol Development", description: "Building decentralized financial protocols including automated market makers, lending platforms, stablecoins, and yield aggregators on EVM-compatible chains or Solana. You implement upgradeable smart contracts, design governance mechanisms, and integrate with price oracles. Career paths include DeFi protocol developer, decentralized finance engineer, or Web3 smart contract architect at crypto startups, DAOs, or blockchain infrastructure companies.", tier: 1, rarity: "Rare", score: 250 },
  "defi+coding":       { name: "Smart Contract Engineering", description: "Writing, testing, and deploying decentralized application logic using Solidity, Rust for Solana, or Move for Aptos with a focus on gas optimization and security. You implement ERC standards, design proxy patterns for upgradeability, and integrate with DeFi composability layers. Roles include smart contract engineer, blockchain backend developer, or decentralized application developer at crypto companies and protocol teams.", tier: 1, rarity: "Rare", score: 250 },
  "defi+math":         { name: "Token Engineering", description: "Designing token economic systems including bonding curves, inflation and emission schedules, governance incentive mechanisms, and protocol fee structures. You model token supply dynamics, simulate governance attacks, and optimize for long-term protocol sustainability. Career paths include token economist, crypto protocol designer, or Web3 incentive architect at blockchain foundations, DAOs, and token launch platforms.", tier: 1, rarity: "Rare", score: 250 },
  "defi+stats":        { name: "DeFi Analytics", description: "Analyzing on-chain data from decentralized finance protocols including TVL tracking, protocol revenue metrics, user behavior analytics, and comparative protocol benchmarking. You build dashboards that monitor DeFi health, detect anomalous activity, and generate investment insights. Roles include DeFi analyst, on-chain data researcher, or protocol analytics lead at crypto analytics firms, venture capital, or DeFi protocol teams.", tier: 1, rarity: "Rare", score: 200 },
  "defi+data":         { name: "On-Chain Data Analytics", description: "Building blockchain data pipelines that ingest raw block data, cluster wallet addresses, and perform transaction graph analysis for DeFi intelligence. You design entity resolution algorithms, track fund flows, and generate actionable on-chain signals. Career paths include blockchain data analyst, on-chain intelligence engineer, or crypto data scientist at analytics firms, compliance companies, or blockchain research organizations.", tier: 1, rarity: "Rare", score: 200 },
  "defi+ai":           { name: "AI-Powered DeFi Agents", description: "Building autonomous AI agents that manage DeFi portfolios, optimize yield farming strategies, and execute trades across decentralized protocols without human intervention. You design agent decision-making frameworks, implement risk management guardrails, and build multi-protocol orchestration. Roles include AI DeFi agent developer, autonomous trading systems engineer, or decentralized AI researcher at AI-crypto startups and research labs.", tier: 2, rarity: "Legendary", score: 550 },
  "defi+cloud":        { name: "Decentralized Cloud Services", description: "Building applications on decentralized cloud platforms including Filecoin for storage, Arweave for permanent data, and Akash for compute resources distributed across a global network. You deploy containerized workloads, manage content addressing, and design fault-tolerant decentralized architectures. Career paths include decentralized cloud engineer, Web3 infrastructure developer, or distributed systems architect at decentralized protocol companies.", tier: 1, rarity: "Rare", score: 250 },
  "defi+security":     { name: "DeFi Security Engineering", description: "Securing DeFi protocols through economic audits, oracle manipulation defense, flash loan attack prevention, and continuous exploit monitoring. You design circuit breakers, implement access controls, and build automated monitoring for suspicious on-chain activity. Roles include DeFi security engineer, protocol security architect, or blockchain security specialist at audit firms, DeFi protocols, or crypto security companies.", tier: 1, rarity: "Epic", score: 350 },
  "defi+strategy":     { name: "Crypto Strategy", description: "Developing institutional cryptocurrency strategy including custody solutions, treasury management for corporate Bitcoin holdings, and regulatory compliance for digital asset adoption. You evaluate exchange counterparty risk, design multi-signature governance, and advise on allocation sizing. Career paths include crypto strategy consultant, digital asset treasury manager, or blockchain strategy advisor at corporations, family offices, or crypto-native investment firms.", tier: 1, rarity: "Rare", score: 200 },
  "defi+marketing":    { name: "Web3 Marketing", description: "Marketing crypto and DeFi projects through community building on Discord and Twitter, token launch campaigns, DAO governance engagement, and ambassador program development. You create token economics explainers, manage influencer partnerships, and build grassroots crypto communities. Roles include Web3 marketing manager, crypto community lead, or decentralized marketing strategist at blockchain startups and DAOs.", tier: 1, rarity: "Uncommon", score: 150 },
  "defi+writing":      { name: "Crypto Research Writing", description: "Writing in-depth crypto research including protocol deep dives, market analysis reports, and whitepaper evaluations for investment decisions and public education. You analyze tokenomics, compare competing protocols, and explain technical concepts to non-technical audiences. Career paths include crypto research analyst, blockchain journalist, or DeFi research writer at crypto media outlets, investment firms, or research organizations.", tier: 1, rarity: "Common", score: 100 },
  "defi+design":       { name: "Web3 UX Design", description: "Designing user interfaces for blockchain applications including wallet connection flows, transaction confirmation screens, and decentralized application dashboards. You simplify complex Web3 interactions, design for transaction error states, and build intuitive token management interfaces. Roles include Web3 UX designer, blockchain interface designer, or decentralized product designer at crypto wallets, DeFi platforms, or NFT marketplaces.", tier: 1, rarity: "Rare", score: 200 },
  "defi+quantum":      { name: "Quantum-Safe DeFi", description: "Building DeFi protocols that are fundamentally resistant to quantum computer attacks through post-quantum signature schemes, quantum-resistant encryption for private keys, and hybrid cryptographic layers. You migrate existing smart contracts to PQC algorithms and design quantum-safe governance mechanisms. Career paths include quantum-safe protocol engineer, post-quantum DeFi researcher, or quantum blockchain security specialist at next-generation blockchain projects.", tier: 3, rarity: "Mythic", score: 700 },
  "defi+biology":      { name: "BioToken Economics", description: "Designing token economies around biological data including genomic data marketplaces, health data tokens, and decentralized research funding for biotech. You create incentive structures for data sharing, address bioethics concerns, and build consent management systems. Roles include bio-token economist, health data marketplace architect, or decentralized genomics strategist at biotech DAOs and health data platforms.", tier: 1, rarity: "Rare", score: 250 },
  "defi+physics":      { name: "Energy Token Trading", description: "Tokenizing renewable energy credits, carbon offset markets, and peer-to-peer energy trading on blockchain platforms. You design token standards for energy commodities, build smart contracts for grid settlement, and optimize energy trading algorithms. Career paths include energy tokenization engineer, carbon market platform developer, or decentralized energy trading architect at clean energy startups and blockchain infrastructure companies.", tier: 1, rarity: "Rare", score: 200 },

  // ─── FINANCE + TECH ───────────────────────────────────
  "quant+linux":       { name: "Low-Latency Quant Systems", description: "Building ultra-fast quantitative infrastructure on Linux using kernel bypass networking, FPGA co-processors, and nanosecond-level optimization for high-frequency trading. You tune CPU cache behavior, eliminate system jitter, and design lock-free order books. Career paths include low-latency quant systems engineer, HFT infrastructure developer, or trading systems architect at high-frequency trading firms and proprietary market-making companies.", tier: 2, rarity: "Epic", score: 400 },
  "quant+devops":      { name: "Quant DevOps", description: "Building CI/CD pipelines for quantitative research including model deployment automation, backtesting infrastructure management, and reproducible experiment tracking. You containerize research environments, automate strategy promotion to production, and monitor model performance. Roles include quant DevOps engineer, ML infrastructure specialist, or quantitative platform engineer at quant hedge funds and systematic trading firms.", tier: 1, rarity: "Rare", score: 250 },
  "quant+blockchain":  { name: "Quantitative Tokenomics", description: "Applying quantitative methods to token design including optimal fee structures, MEV analysis, and economic security modeling for blockchain protocols. You simulate token supply dynamics, model validator incentives, and design mechanisms resistant to manipulation. Career paths include tokenomics researcher, protocol quantitative analyst, or blockchain mechanism designer at crypto research firms and protocol foundations.", tier: 2, rarity: "Epic", score: 350 },
  "quant+quantum":     { name: "Quantum Quantitative Finance", description: "Developing quantum algorithms for portfolio optimization using QAOA, derivative pricing through quantum amplitude estimation, and alpha generation via quantum kernel methods. You benchmark quantum advantage for financial problems and design hybrid quantum-classical trading systems. Roles include quantum quant researcher, quantum finance algorithm developer, or quantum computational finance scientist at financial institutions partnering with quantum computing companies.", tier: 3, rarity: "Mythic", score: 800 },
  "trading+security":  { name: "Financial Systems Security", description: "Securing trading platforms and financial infrastructure from cyber threats including exchange security hardening, payment gateway protection, and real-time fraud prevention. You design DDoS resilience for trading systems, secure API authentication for market access, and implement transaction monitoring. Career paths include financial systems security engineer, trading platform security architect, or fintech security specialist at banks, exchanges, and payment processors.", tier: 1, rarity: "Rare", score: 250 },

  // ─── SCIENCE + SCIENCE ────────────────────────────────
  "math+stats":        { name: "Probability & Statistics", description: "Developing the theoretical and applied foundations of statistical inference including Bayesian reasoning, hypothesis testing frameworks, and stochastic process modeling. You prove mathematical theorems about estimators, design new statistical tests, and analyze the properties of random systems. Career paths include statistician, mathematical statistician, or probability researcher at universities, pharmaceutical companies, or government statistical agencies.", tier: 1, rarity: "Uncommon", score: 150 },
  "math+physics":      { name: "Theoretical Physics", description: "Exploring the mathematical structure of physical theories including string theory, general relativity, quantum field theory, and cosmological models. You develop new mathematical frameworks to describe the universe, solve differential equations for physical systems, and test theories against experimental data. Roles include theoretical physicist, research scientist, or professor at universities, national laboratories, or theoretical physics institutes.", tier: 1, rarity: "Rare", score: 250 },
  "math+coding":       { name: "Computational Mathematics", description: "Developing numerical methods, symbolic computation algorithms, and mathematical software for solving complex mathematical problems computationally. You implement optimization solvers, build computer algebra systems, and design algorithms for mathematical modeling. Career paths include computational mathematician, mathematical software developer, or research engineer at simulation companies, quantitative finance firms, or national research laboratories.", tier: 1, rarity: "Rare", score: 200 },
  "math+biology":      { name: "Mathematical Biology", description: "Building mathematical models of biological systems including population dynamics, epidemiological spread, neural coding, and biochemical reaction networks. You develop differential equation models, analyze stability of biological systems, and fit models to experimental data. Roles include mathematical biologist, systems biology modeler, or quantitative ecology researcher at universities, biotech companies, or public health organizations.", tier: 1, rarity: "Rare", score: 200 },
  "math+data":         { name: "Applied Mathematics", description: "Applying mathematical techniques including optimization, control theory, and signal processing to solve real-world problems in engineering, science, and industry. You formulate mathematical programs, design control systems, and develop algorithms for signal extraction. Career paths include applied mathematician, operations research analyst, or quantitative modeler at defense contractors, manufacturing companies, or technology firms.", tier: 1, rarity: "Uncommon", score: 150 },
  "math+design":       { name: "Mathematical Design", description: "Using mathematical principles for geometric design including parametric modeling, fractal geometry, tiling theory, and computational topology in architecture and product design. You create algorithmic forms, optimize structural geometry, and generate tessellation patterns. Roles include computational designer, mathematical artist, or parametric design specialist at architecture firms, design studios, or manufacturing companies.", tier: 1, rarity: "Rare", score: 200 },
  "math+quantum":      { name: "Quantum Mathematics", description: "Developing the mathematical foundations of quantum theory including quantum algebra, topological quantum field theory, quantum group theory, and category theory for quantum systems. You prove mathematical structures underlying quantum mechanics and develop new mathematical frameworks for quantum information. Career paths include quantum mathematician, mathematical physicist, or quantum information theorist at universities, research institutes, or quantum computing companies.", tier: 2, rarity: "Epic", score: 400 },
  "math+blockchain":   { name: "Cryptographic Mathematics", description: "Applying number theory, elliptic curve mathematics, and lattice-based cryptography to design and analyze the cryptographic systems that secure blockchains. You evaluate hardness assumptions, design new cryptographic primitives, and analyze protocol security proofs. Roles include cryptographic mathematician, blockchain cryptography researcher, or applied cryptographer at cryptocurrency companies, government agencies, or academic cryptography labs.", tier: 1, rarity: "Rare", score: 250 },
  "math+trading":      { name: "Financial Mathematics", description: "Developing the stochastic calculus and risk-neutral valuation frameworks used to price derivatives, model interest rates, and value structured financial products. You derive closed-form pricing formulas, build calibration algorithms, and analyze model risk. Career paths include financial mathematician, derivatives pricing quantitative, or structured products modeler at investment banks, hedge funds, or insurance companies.", tier: 1, rarity: "Rare", score: 250 },
  "math+risk":         { name: "Risk Mathematics", description: "Applying advanced mathematical techniques including extreme value theory, copula functions, and multivariate risk models to quantify financial and operational risk. You model tail dependencies, derive analytical risk bounds, and develop new mathematical frameworks for risk aggregation. Roles include risk mathematician, quantitative risk modeler, or mathematical risk consultant at banks, insurance companies, or regulatory agencies.", tier: 1, rarity: "Rare", score: 250 },
  "math+ai":           { name: "Mathematical AI", description: "Developing the mathematical foundations of machine learning through optimization theory, linear algebra, convex analysis, and information geometry. You prove convergence of training algorithms, design new loss functions, and advance theoretical understanding of generalization. Career paths include AI research scientist, mathematical ML researcher, or theoretical AI engineer at AI research labs, universities, or technology companies.", tier: 1, rarity: "Rare", score: 250 },
  "math+cloud":        { name: "Distributed Computing Mathematics", description: "Applying mathematical theory to distributed systems including consensus algorithm analysis, CAP theorem applications, and Byzantine fault tolerance proofs. You design mathematically optimal replication protocols, analyze network partition behavior, and prove safety and liveness properties. Roles include distributed systems theorist, consensus algorithm researcher, or protocol verification engineer at cloud providers and blockchain companies.", tier: 1, rarity: "Rare", score: 200 },
  "math+writing":      { name: "Mathematical Writing", description: "Communicating mathematical ideas through textbooks, research papers, and popular mathematics writing that makes abstract concepts accessible. You write clear proofs, create illustrative examples, and explain complex topics for students and general audiences. Career paths include mathematics author, math textbook writer, or mathematics communicator at publishers, educational institutions, or science media outlets.", tier: 1, rarity: "Common", score: 100 },
  "math+marketing":    { name: "Quantitative Marketing", description: "Building statistical models for marketing decisions including conjoint analysis for product design, price elasticity modeling, and marketing mix optimization. You design A/B testing frameworks, estimate customer lifetime value, and optimize channel allocation. Career paths include quantitative marketing scientist, marketing analytics researcher, or marketing optimization specialist at consumer goods companies, tech firms, or marketing consultancies.", tier: 1, rarity: "Rare", score: 200 },
  "math+strategy":     { name: "Operations Research", description: "Applying mathematical optimization to business decision-making including linear programming, integer programming, game theory, and logistics optimization. You formulate supply chain problems, design scheduling algorithms, and solve resource allocation puzzles. Roles include operations research analyst, optimization specialist, or management scientist at logistics companies, airlines, or manufacturing firms.", tier: 1, rarity: "Rare", score: 200 },
  "stats+data":        { name: "Data Science", description: "Applying statistical learning methods to extract insights from data through exploratory analysis, predictive modeling, and data visualization. You build regression and classification models, design experiments, and communicate findings through compelling visualizations. Career paths include data scientist, statistical analyst, or analytics lead at tech companies, healthcare organizations, or government agencies.", tier: 1, rarity: "Rare", score: 200 },
  "stats+biology":     { name: "Biostatistics", description: "Applying statistical methods to biological and medical research including clinical trial design, survival analysis, genomics statistics, and epidemiological modeling. You design randomized controlled trials, analyze censored data, and control for confounding variables in observational studies. Roles include biostatistician, clinical trials statistician, or epidemiological analyst at pharmaceutical companies, public health agencies, or medical research institutions.", tier: 1, rarity: "Rare", score: 250 },
  "stats+physics":     { name: "Statistical Mechanics", description: "Connecting microscopic physical laws to macroscopic thermodynamic behavior through statistical mechanics, studying phase transitions, entropy, and emergent phenomena in many-body systems. You analyze critical exponents, compute partition functions, and model non-equilibrium systems. Career paths include statistical physicist, condensed matter theorist, or computational statistical mechanics researcher at universities, national laboratories, or materials science companies.", tier: 1, rarity: "Rare", score: 200 },
  "stats+cloud":       { name: "Cloud-Scale Statistics", description: "Running statistical analyses at massive scale using distributed computing frameworks such as Spark and Dask to process terabyte-scale datasets. You implement parallel algorithms for statistical inference, optimize distributed computations, and manage cluster resources for statistical workloads. Roles include cloud statistics engineer, large-scale analytics developer, or distributed data scientist at cloud providers, big data companies, or enterprises with massive data operations.", tier: 1, rarity: "Rare", score: 200 },
  "stats+ai":          { name: "Statistical Learning Theory", description: "Developing the mathematical foundations of machine learning including bias-variance tradeoffs, VC dimension theory, PAC learning bounds, and generalization analysis. You prove learning guarantees, design new regularization methods, and advance theoretical understanding of when and why models work. Career paths include ML theory researcher, statistical learning scientist, or theoretical ML engineer at AI research labs and universities.", tier: 1, rarity: "Rare", score: 250 },
  "stats+trading":     { name: "Statistical Arbitrage", description: "Building market-neutral trading strategies using statistical models including pairs trading, cointegration-based strategies, and factor model-driven alpha generation. You test for stationarity in price spreads, build mean-reversion portfolios, and manage factor exposures. Roles include statistical arbitrage researcher, quant strategy developer, or systematic trading analyst at hedge funds, prop trading firms, or quantitative asset managers.", tier: 1, rarity: "Epic", score: 350 },
  "stats+risk":        { name: "Stochastic Risk Modeling", description: "Building stochastic models for financial risk using Monte Carlo simulation, Brownian motion frameworks, and jump-diffusion processes to model asset returns and portfolio behavior. You simulate thousands of market scenarios, calibrate models to market data, and compute risk metrics. Career paths include stochastic risk modeler, quantitative risk analyst, or simulation engineer at banks, insurance companies, or risk consulting firms.", tier: 1, rarity: "Rare", score: 250 },
  "stats+blockchain":  { name: "Blockchain Statistical Analysis", description: "Applying statistical methods to analyze on-chain data including network growth metrics, user adoption curves, token velocity models, and market microstructure of decentralized exchanges. You build statistical models for chain health, detect anomalous patterns, and measure protocol performance. Roles include blockchain statistician, on-chain data analyst, or crypto metrics researcher at analytics firms and protocol teams.", tier: 1, rarity: "Rare", score: 200 },
  "stats+defi":        { name: "DeFi Statistical Research", description: "Applying statistical analysis to decentralized finance protocols including impermanent loss modeling, yield curve analysis across DeFi lending markets, and protocol performance benchmarking. You build statistical arbitrage models for DeFi, analyze liquidation cascades, and measure protocol risk. Career paths include DeFi statistical researcher, decentralized finance analyst, or crypto quantitative researcher at DeFi research firms and crypto hedge funds.", tier: 1, rarity: "Rare", score: 200 },
  "stats+design":      { name: "Statistical Visualization", description: "Communicating statistical data through effective visual design following Edward Tufte principles including information density, chart junk elimination, and data-ink ratio optimization. You create statistical graphics, design interactive dashboards, and build data journalism visualizations. Roles include data visualization designer, statistical graphics specialist, or information designer at media organizations, research institutions, or data-driven companies.", tier: 1, rarity: "Uncommon", score: 150 },
  "stats+quantum":     { name: "Quantum Statistics", description: "Studying statistical behavior of quantum systems including Bose-Einstein and Fermi-Dirac distributions, quantum probability theory, and many-body statistical mechanics for quantum materials. You analyze thermalization of quantum systems, model quantum phase transitions, and study quantum entanglement statistics. Career paths include quantum statistical physicist, quantum many-body theorist, or quantum statistical mechanics researcher at universities and quantum materials research labs.", tier: 2, rarity: "Epic", score: 350 },
  "stats+strategy":    { name: "Evidence-Based Strategy", description: "Using data-driven frameworks for strategic business decisions including A/B testing culture implementation, metrics-driven management, and experimental design for organizational decisions. You build measurement systems, design controlled experiments, and translate statistical findings into strategic recommendations. Roles include strategy analyst, evidence-based management consultant, or decision science lead at consulting firms and data-driven enterprises.", tier: 1, rarity: "Uncommon", score: 150 },
  "stats+writing":     { name: "Data Journalism", description: "Telling stories with data through investigative reporting, statistical analysis of public datasets, and data visualization for newsrooms. You uncover trends in government data, fact-check claims with statistical methods, and create interactive graphics. Career paths include data journalist, investigative reporter, or computational journalist at news organizations, media companies, or independent journalism outlets.", tier: 1, rarity: "Uncommon", score: 150 },
  "stats+marketing":   { name: "Marketing Analytics", description: "Measuring marketing effectiveness through attribution modeling, customer lifetime value analysis, cohort analysis, and media mix modeling. You design experiment frameworks for marketing channels, quantify ROI of campaigns, and build predictive models for customer behavior. Roles include marketing analyst, growth analytics specialist, or marketing data scientist at consumer brands, adtech companies, or digital marketing agencies.", tier: 1, rarity: "Uncommon", score: 150 },
  "physics+data":      { name: "Experimental Data Science", description: "Analyzing data from physics experiments including CERN particle collider data, astronomical telescope observations, and gravitational wave detection signals. You develop signal extraction algorithms, handle petabyte-scale datasets, and apply machine learning to physics discovery. Career paths include experimental data scientist, physics data analyst, or research data engineer at national laboratories, universities, or space agencies.", tier: 1, rarity: "Rare", score: 200 },
  "physics+biology":   { name: "Biophysics", description: "Applying physical principles to understand biological systems including protein folding dynamics, cell membrane mechanics, molecular motor function, and structural biology. You use techniques like X-ray crystallography, cryo-EM, and atomic force microscopy to study biological structures. Roles include biophysicist, structural biology researcher, or molecular biophysics scientist at universities, pharmaceutical companies, or biomedical research institutes.", tier: 1, rarity: "Rare", score: 250 },
  "physics+cloud":     { name: "HPC Cloud Computing", description: "Running high-performance computing workloads on cloud platforms including parallel processing, GPU cluster management, and distributed physics simulations. You optimize HPC job scheduling, manage large-scale data transfers, and design cost-effective compute strategies for scientific workloads. Career paths include HPC cloud engineer, scientific computing infrastructure specialist, or cloud HPC architect at cloud providers, national labs, or research universities.", tier: 1, rarity: "Rare", score: 200 },
  "physics+blockchain": { name: "Energy-Blockchain Integration", description: "Using blockchain technology for renewable energy trading, carbon credit tracking, and decentralized power grid management. You design peer-to-peer energy markets, build smart contracts for carbon offset verification, and create token incentives for grid balancing. Roles include energy blockchain engineer, decentralized energy market developer, or clean energy platform architect at energy tech startups and blockchain companies.", tier: 1, rarity: "Rare", score: 200 },
  "physics+ai":        { name: "AI for Physics", description: "Using machine learning to accelerate physics research including particle detection at colliders, materials discovery for new superconductors, and cosmological simulation acceleration. You train neural networks on experimental data, build surrogate models for expensive simulations, and discover patterns in physical data. Career paths include AI-for-physics researcher, computational physics scientist, or ML physicist at national laboratories, universities, or physics technology companies.", tier: 1, rarity: "Rare", score: 250 },
  "physics+design":    { name: "Scientific Visualization", description: "Creating visual representations of complex physical phenomena including 3D rendering of molecular dynamics, simulation visualization, and interactive physics demonstrations. You build real-time visualization tools, design scientific animations, and create virtual reality experiences for physics education. Roles include scientific visualization developer, physics graphics engineer, or computational visualization specialist at research institutions, educational technology companies, or media production studios.", tier: 1, rarity: "Rare", score: 200 },
  "physics+strategy":  { name: "Technology Strategy", description: "Evaluating and commercializing emerging technologies including quantum computing, fusion energy, and advanced materials for investment decisions and R&D prioritization. You conduct technology readiness assessments, analyze competitive landscapes, and build roadmaps for deep tech commercialization. Career paths include technology strategist, emerging technology consultant, or deep tech venture analyst at venture capital firms, corporate R&D divisions, or government technology agencies.", tier: 1, rarity: "Uncommon", score: 150 },
  "physics+marketing": { name: "Deep Tech Marketing", description: "Marketing complex scientific and technology products including quantum computing systems, scientific instrumentation, and advanced materials to technical buyers. You translate physics concepts into compelling value propositions, create technical marketing content, and manage product launches for deep tech. Roles include deep tech marketing manager, scientific product marketer, or technology evangelist at quantum computing companies, instrumentation manufacturers, or materials science firms.", tier: 1, rarity: "Uncommon", score: 150 },
  "physics+writing":   { name: "Science Communication", description: "Writing about physics for general audiences through science journalism, popular science books, and educational content that makes complex topics accessible. You explain quantum mechanics in plain language, cover physics discoveries for newspapers, and create engaging science content. Career paths include science writer, physics journalist, or science communicator at media outlets, museums, or educational organizations.", tier: 1, rarity: "Common", score: 100 },
  "physics+quantum":   { name: "Quantum Physics Research", description: "Conducting experimental and theoretical quantum physics research including entanglement experiments, decoherence studies, and quantum optics with photons and atoms. You design experiments to test quantum foundations, build quantum state measurement systems, and develop new quantum technologies. Roles include quantum physicist, quantum optics researcher, or experimental quantum scientist at universities, national laboratories, or quantum technology companies.", tier: 2, rarity: "Epic", score: 350 },
  "physics+coding":    { name: "Physics Simulation", description: "Building computational simulations of physical systems including molecular dynamics, finite element analysis, computational fluid dynamics, and N-body gravitational simulations. You implement parallel algorithms, optimize numerical solvers, and validate simulations against experimental data. Career paths include physics simulation engineer, computational scientist, or HPC software developer at research institutions, engineering firms, or aerospace companies.", tier: 1, rarity: "Rare", score: 200 },
  "physics+trading":   { name: "Financial Physics", description: "Applying physics models and methodologies to financial markets including percolation theory for market contagion, agent-based models for market dynamics, and econophysics for understanding market behavior. You study market phase transitions, model herding behavior, and apply statistical mechanics to asset pricing. Roles include financial physicist, econophysics researcher, or quantitative strategist using physics methods at quantitative hedge funds and research institutions.", tier: 1, rarity: "Rare", score: 200 },
  "physics+risk":      { name: "Catastrophe Modeling", description: "Building physical risk models for natural catastrophes including earthquake ground motion simulation, hurricane wind and storm surge modeling, and flood risk assessment for insurance and reinsurance markets. You calibrate models against historical events, estimate exceedance probability curves, and design parametric insurance triggers. Career paths include catastrophe modeler, natural hazard risk analyst, or reinsurance risk specialist at insurance companies and catastrophe modeling firms.", tier: 1, rarity: "Rare", score: 250 },
  "physics+math":      { name: "Mathematical Physics", description: "Developing rigorous mathematical treatments of physical theories including differential geometry for general relativity, topology in condensed matter physics, and algebraic structures in quantum field theory. You prove mathematical theorems about physical systems, develop new mathematical tools for physics, and bridge pure mathematics with physical intuition. Roles include mathematical physicist, theoretical physics researcher, or professor at universities and theoretical physics institutes.", tier: 1, rarity: "Rare", score: 250 },
  "physics+defi":      { name: "Energy Token Markets", description: "Building decentralized energy trading platforms for renewable energy credits, peer-to-peer power markets, and carbon offset tokenization on blockchain networks. You design market mechanisms for energy commodities, build smart contracts for grid settlement, and optimize energy trading algorithms. Career paths include energy DeFi developer, decentralized energy market engineer, or clean energy blockchain architect at energy tech startups and sustainability platforms.", tier: 1, rarity: "Rare", score: 200 },
  "biology+data":      { name: "Bioinformatics", description: "Using computational methods to analyze biological data including sequence alignment, variant calling, gene expression quantification, and phylogenetic analysis. You build bioinformatics pipelines, analyze next-generation sequencing data, and identify genetic variants associated with disease. Career paths include bioinformatics scientist, computational genomics analyst, or genomics data engineer at biotech companies, pharmaceutical firms, or genomics research centers.", tier: 1, rarity: "Rare", score: 250 },
  "biology+coding":    { name: "Computational Biology", description: "Building software tools and algorithms for biological research including protein structure prediction, molecular dynamics simulation, and drug-target interaction modeling. You develop computational pipelines, implement bioinformatics algorithms, and create tools for biological data analysis. Roles include computational biologist, bioinformatics software developer, or biological algorithm engineer at biotech companies, research universities, or government biology labs.", tier: 1, rarity: "Rare", score: 250 },
  "biology+ai":        { name: "AI Drug Discovery", description: "Applying machine learning to pharmaceutical R&D including molecular generation, protein-ligand binding prediction, clinical trial optimization, and drug repurposing. You train models on chemical libraries, predict ADMET properties, and accelerate hit-to-lead optimization. Career paths include AI drug discovery scientist, computational chemistry ML researcher, or pharmaceutical AI engineer at biotech companies, pharma R&D labs, or AI-native drug discovery startups.", tier: 1, rarity: "Rare", score: 250 },
  "biology+cloud":     { name: "Genomics Cloud Platform", description: "Building and managing cloud infrastructure for genomic data analysis including GATK pipelines on AWS, Terra platform integration, and DNAnexus deployment. You design scalable compute for whole-genome sequencing, manage petabyte-scale genomic storage, and ensure HIPAA compliance. Roles include genomics cloud engineer, bioinformatics platform developer, or cloud architect for life sciences at cloud providers, genomics companies, or research hospitals.", tier: 1, rarity: "Rare", score: 200 },
  "biology+blockchain": { name: "Health Data Blockchain", description: "Building decentralized health record systems where patients control their own medical data, enabling secure research data sharing and interoperable medical records. You design consent management smart contracts, build health data tokenization, and ensure regulatory compliance with HIPAA and GDPR. Career paths include health data blockchain developer, decentralized health records architect, or medical data sovereignty engineer at health tech startups and blockchain companies.", tier: 1, rarity: "Rare", score: 200 },
  "biology+quantum":   { name: "Quantum Biology", description: "Studying quantum mechanical effects in living systems including quantum coherence in photosynthetic energy transfer, enzyme catalytic tunneling, and quantum entanglement in avian magnetoreception. You design experiments to detect quantum effects in warm biological environments and build theoretical models. Roles include quantum biology researcher, biophysicist studying quantum effects, or quantum life science researcher at interdisciplinary research institutions and biology departments.", tier: 2, rarity: "Epic", score: 400 },
  "biology+math":      { name: "Mathematical Biology", description: "Building mathematical models of biological systems including ordinary differential equation models for gene regulatory networks, population dynamics models, and neural coding frameworks. You analyze model stability, fit parameters to experimental data, and predict system behavior. Career paths include mathematical biologist, systems biology modeler, or quantitative biology researcher at universities, biotech companies, or pharmaceutical research divisions.", tier: 1, rarity: "Rare", score: 200 },
  "biology+stats":     { name: "Epidemiology", description: "Applying statistical methods to study disease spread including SIR compartmental models, contact tracing analysis, and public health surveillance data. You design epidemiological studies, estimate disease parameters, and forecast outbreak trajectories for public health decision-making. Roles include epidemiologist, biostatistician for public health, or disease surveillance analyst at WHO, CDC, or public health research organizations.", tier: 1, rarity: "Rare", score: 250 },
  "biology+risk":      { name: "Pandemic Preparedness", description: "Modeling biological risks including outbreak prediction, vaccine distribution logistics, and health system resilience planning for pandemic response. You design scenario models, estimate economic impact of biological threats, and build early warning systems. Career paths include pandemic preparedness analyst, health security researcher, or biosecurity risk consultant at government agencies, international health organizations, or risk consulting firms.", tier: 1, rarity: "Rare", score: 250 },
  "biology+trading":   { name: "Biotech Investment Analysis", description: "Evaluating biotech and pharmaceutical companies through drug pipeline valuation, clinical trial risk assessment, and FDA approval probability modeling. You analyze patent landscapes, assess management teams, and build risk-adjusted NPV models for drug development programs. Roles include biotech equity analyst, life sciences investment researcher, or healthcare venture capital analyst at biotech-focused investment firms and VC funds.", tier: 1, rarity: "Uncommon", score: 150 },
  "biology+strategy":  { name: "Biotech Strategy", description: "Developing life sciences corporate strategy including drug pipeline prioritization, licensing deal structuring, and market access planning. You evaluate partnership opportunities, conduct competitive intelligence, and build multi-year R&D roadmaps. Career paths include biotech corporate strategist, life sciences business development lead, or pharmaceutical portfolio strategist at biotech companies, pharma firms, or life sciences consulting practices.", tier: 1, rarity: "Rare", score: 200 },
  "biology+writing":   { name: "Science Writing", description: "Communicating biology through journal papers, grant proposals, and science journalism that translates complex research for broader audiences. You write peer-reviewed publications, craft compelling grant narratives, and create educational biology content. Roles include science writer, medical communications specialist, or biology journalist at research institutions, pharmaceutical companies, or science media outlets.", tier: 1, rarity: "Common", score: 100 },
  "biology+marketing": { name: "Biotech Marketing", description: "Marketing life sciences products including pharmaceutical drugs, medical devices, and diagnostic tools to healthcare professionals, patients, and payers. You develop medical education programs, create disease awareness campaigns, and navigate FDA promotional regulations. Career paths include biotech product manager, pharmaceutical marketing specialist, or life sciences brand manager at pharma companies, medical device manufacturers, or biotech startups.", tier: 1, rarity: "Uncommon", score: 150 },
  "biology+design":    { name: "Scientific Illustration", description: "Creating visual representations of biological and medical structures including anatomical art, molecular visualization, and surgical planning illustrations. You use 3D modeling, illustration software, and deep biological knowledge to create accurate scientific visuals. Roles include medical illustrator, scientific visualization artist, or biological graphic designer at publishers, medical schools, or pharmaceutical companies.", tier: 1, rarity: "Uncommon", score: 150 },
  "biology+defi":      { name: "BioData Marketplaces", description: "Building decentralized marketplaces for biological data including genomic data trading platforms, research data tokens, and consent management systems. You design incentive mechanisms for data sharing, ensure privacy compliance, and create token-based access controls. Career paths include bio-data marketplace architect, genomics data platform developer, or decentralized health data engineer at biotech DAOs and health data companies.", tier: 1, rarity: "Rare", score: 200 },
  "biology+linux":     { name: "Bioinformatics on Linux", description: "Running bioinformatics analysis pipelines on Linux systems using tools like BLAST, GATK, BWA, and Nextflow on HPC clusters. You optimize pipeline performance, manage compute resources, and ensure reproducible analysis environments. Roles include bioinformatics systems engineer, computational genomics infrastructure specialist, or Linux bioinformatics administrator at sequencing centers, research hospitals, or genomics companies.", tier: 1, rarity: "Rare", score: 200 },
  "biology+devops":    { name: "BioDevOps", description: "Building reproducible bioinformatics workflows through containerized analysis, automated pipeline deployment, and version-controlled data management using Docker, Nextflow, and Git. You ensure analysis reproducibility, automate data quality checks, and manage collaborative research infrastructure. Career paths include bioinformatics DevOps engineer, computational biology platform developer, or research data engineer at genomics research centers and biotech companies.", tier: 1, rarity: "Rare", score: 200 },
  "biology+security":  { name: "Biosafety & Biosecurity", description: "Securing biological research through dual-use research oversight, pathogen data security, and biosecurity risk assessment. You develop biosafety protocols, implement access controls for dangerous pathogen data, and advise on responsible publication of sensitive research. Roles include biosafety officer, biosecurity analyst, or dual-use research consultant at government agencies, research universities, or international health organizations.", tier: 1, rarity: "Rare", score: 200 },
  "biology+physics":   { name: "Biophysics", description: "Studying physical mechanisms in biological systems including molecular dynamics simulations, structural biology using cryo-EM and X-ray crystallography, and biomechanical modeling of cells and tissues. You apply physical principles to understand protein folding, membrane dynamics, and molecular motor function. Career paths include biophysicist, structural biology researcher, or molecular dynamics scientist at universities, pharmaceutical companies, or biomedical research institutes.", tier: 1, rarity: "Rare", score: 250 },

  // ─── CREATIVE ─────────────────────────────────────────
  "design+writing":    { name: "Content Design", description: "Combining UX writing, content strategy, and information architecture to design the words and content structures that users encounter in digital products. You write microcopy, design content hierarchies, and create style guides that ensure consistency across platforms. Roles include content designer, UX writer, or content strategist at tech companies, design agencies, or digital product teams.", tier: 1, rarity: "Uncommon", score: 100 },
  "design+ai":         { name: "AI Design Tools", description: "Using artificial intelligence to augment the design process including Midjourney for concept generation, Figma AI for layout automation, and generative UI systems. You integrate AI into design workflows, train custom models on brand assets, and create AI-powered design systems. Career paths include AI design specialist, creative AI engineer, or generative design developer at design studios, tech companies, or advertising agencies.", tier: 1, rarity: "Rare", score: 200 },
  "design+coding":     { name: "Frontend Engineering", description: "Building interactive user interfaces using React, Vue, or Angular with expertise in CSS architecture, animation, responsive design, and accessibility standards. You implement design systems in code, optimize frontend performance, and create smooth user interactions. Roles include frontend engineer, UI developer, or interface engineer at tech companies, design agencies, or digital product studios.", tier: 1, rarity: "Uncommon", score: 150 },
  "design+strategy":   { name: "UX Strategy", description: "Developing user experience strategy through user research, persona development, journey mapping, and design thinking workshops. You align UX goals with business objectives, prioritize research initiatives, and build evidence-based design roadmaps. Career paths include UX strategist, design research lead, or head of user experience at product companies, consulting firms, or design agencies.", tier: 1, rarity: "Uncommon", score: 150 },
  "design+data":       { name: "Data Visualization", description: "Creating visual representations of complex data using D3.js, Tableau, or custom charting libraries to build interactive dashboards, infographics, and data-driven stories. You design charts that reveal patterns, build interactive exploration tools, and apply visual encoding principles. Roles include data visualization engineer, information graphics designer, or visual analytics developer at media organizations, tech companies, or research institutions.", tier: 1, rarity: "Rare", score: 200 },
  "design+blockchain": { name: "Web3 Design", description: "Designing user interfaces for blockchain applications including wallet connection flows, NFT marketplace layouts, and decentralized governance dashboards. You simplify complex Web3 interactions, design for transaction states, and create intuitive token management interfaces. Career paths include Web3 UX designer, blockchain interface designer, or decentralized application designer at crypto wallets, DeFi platforms, or NFT marketplaces.", tier: 1, rarity: "Rare", score: 200 },
  "design+cloud":      { name: "Design Systems Engineering", description: "Building scalable design systems including component libraries, design tokens, and design-to-code pipelines that ensure visual consistency across large product organizations. You create reusable React components, maintain Figma-to-code synchronization, and document design patterns. Roles include design systems engineer, UI infrastructure developer, or front-end design systems architect at large tech companies and enterprise software firms.", tier: 1, rarity: "Rare", score: 200 },
  "design+marketing":  { name: "Brand Design", description: "Creating visual brand identity systems including logos, brand guidelines, marketing collateral, and cohesive brand touchpoints across digital and physical media. You develop visual languages, design brand architecture, and ensure consistency across all customer-facing materials. Career paths include brand designer, visual identity specialist, or brand systems designer at branding agencies, in-house creative teams, or marketing departments.", tier: 1, rarity: "Uncommon", score: 150 },
  "design+security":   { name: "Security UX Design", description: "Designing user interfaces for security-critical applications including authentication flows, privacy dashboards, consent management screens, and security alert systems. You balance security requirements with usability, design clear permission models, and build trust through transparent privacy interfaces. Roles include security UX designer, privacy interface specialist, or trust and safety designer at tech companies, fintech firms, or cybersecurity product companies.", tier: 1, rarity: "Rare", score: 200 },
  "design+quantum":    { name: "Quantum Computing UX", description: "Designing user interfaces for quantum computing tools including visual quantum circuit builders, quantum state visualization displays, and result interpretation dashboards. You make quantum concepts accessible through intuitive visual metaphors and interactive tools. Career paths include quantum UX designer, quantum computing interface developer, or quantum software designer at quantum computing companies, research institutions, or quantum education platforms.", tier: 2, rarity: "Epic", score: 350 },
  "design+physics":    { name: "Scientific Visualization", description: "Creating visual representations of physical phenomena including 3D rendering of molecular structures, real-time simulation visualization, and virtual reality physics demonstrations. You build interactive tools that make abstract physics concepts tangible and explorable. Roles include scientific visualization developer, physics graphics engineer, or computational visualization specialist at research institutions, educational technology companies, or science museums.", tier: 1, rarity: "Rare", score: 200 },
  "design+biology":    { name: "Medical Illustration", description: "Creating accurate visual representations of biological and medical structures including anatomical illustrations, surgical planning graphics, and molecular diagrams for education and research. You combine artistic skill with deep biological knowledge using 3D modeling and illustration software. Career paths include medical illustrator, biological visualization artist, or scientific graphic designer at medical schools, publishers, or pharmaceutical companies.", tier: 1, rarity: "Rare", score: 200 },
  "design+trading":    { name: "Financial Dashboard Design", description: "Designing trading interfaces including real-time candlestick chart layouts, portfolio overview dashboards, and risk monitoring displays for financial professionals. You optimize for information density, reduce cognitive load, and design for split-second decision-making. Roles include fintech UX designer, trading interface specialist, or financial product designer at brokerages, trading platforms, or fintech startups.", tier: 1, rarity: "Rare", score: 200 },
  "design+risk":       { name: "Risk Visualization", description: "Designing visual representations of risk data including heat maps, stress test result displays, scenario analysis dashboards, and early warning indicator systems. You make complex risk data accessible to executives and board members through clear, actionable visual designs. Career paths include risk dashboard designer, financial data visualization specialist, or risk reporting UI designer at banks, insurance companies, or risk consulting firms.", tier: 1, rarity: "Uncommon", score: 150 },
  "design+math":       { name: "Generative Art", description: "Creating algorithmic art using mathematical processes including Processing, TouchDesigner, fractal generation, and parametric design systems. You write code that produces visual outputs, explore mathematical beauty through computation, and create interactive installations. Roles include generative artist, creative coder, or computational designer at art studios, galleries, or new media organizations.", tier: 1, rarity: "Rare", score: 200 },
  "design+defi":       { name: "DeFi Interface Design", description: "Designing user interfaces for decentralized finance applications including token swap interfaces, yield farming dashboards, and protocol governance voting screens. You simplify complex DeFi concepts into intuitive interactions and design for transaction confirmation flows. Career paths include DeFi UX designer, Web3 product designer, or decentralized finance interface specialist at crypto startups and DeFi protocol teams.", tier: 1, rarity: "Rare", score: 200 },
  "design+linux":      { name: "Linux Desktop Design", description: "Designing Linux desktop environments including GTK and Qt theme development, terminal UI aesthetics, and tiling window manager visual configurations. You create cohesive visual languages for open-source desktops, design icon sets, and build system settings interfaces. Roles include Linux desktop designer, open-source UI designer, or GNOME/KDE theme developer at Linux distribution companies or open-source projects.", tier: 1, rarity: "Uncommon", score: 150 },
  "design+devops":     { name: "Developer Experience Design", description: "Designing tools and interfaces for software developers including CLI user experience, API documentation interfaces, and developer onboarding flows. You create intuitive command-line tools, design developer portals, and build documentation that reduces time-to-first-deployment. Career paths include developer experience designer, DX researcher, or developer tools UX specialist at cloud providers, API companies, or developer tool startups.", tier: 1, rarity: "Rare", score: 200 },
  "design+stats":      { name: "Information Design", description: "Applying Edward Tufte principles to present information clearly through statistical graphics, chart design best practices, and information-dense visual layouts. You eliminate chart junk, optimize data-ink ratios, and create graphics that reveal patterns. Roles include information designer, data graphics specialist, or statistical visualization consultant at media organizations, research institutions, or data-driven companies.", tier: 1, rarity: "Rare", score: 200 },
  "writing+marketing": { name: "Content Marketing", description: "Creating valuable written content to attract and engage target audiences through blogs, whitepapers, case studies, and newsletters that drive business results. You develop content strategies, write SEO-optimized articles, and measure content performance against marketing goals. Career paths include content marketing specialist, content strategist, or editorial marketing manager at B2B companies, SaaS firms, or marketing agencies.", tier: 1, rarity: "Uncommon", score: 100 },
  "writing+strategy":  { name: "Communication Strategy", description: "Developing strategic messaging frameworks including executive communications, crisis communication plans, and internal communications programs for organizations. You craft board presentations, design all-hands meeting content, and build messaging consistency across channels. Roles include communication strategist, corporate communications director, or executive communications coach at large enterprises, PR firms, or consulting companies.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+ai":        { name: "AI Writing Tools", description: "Building and using LLM-powered writing systems including prompt engineering, AI content generation, automated copywriting, and AI-assisted editing workflows. You design prompt templates, fine-tune language models, and build content generation pipelines. Career paths include AI writing tools developer, prompt engineer, or generative AI content specialist at AI companies, content platforms, or marketing technology firms.", tier: 1, rarity: "Rare", score: 200 },
  "writing+data":      { name: "Data Storytelling", description: "Combining narrative writing with data analysis to create compelling business reports, research publications, and analytics dashboards that drive decisions. You translate complex data findings into clear narratives, design data-rich presentations, and build reporting frameworks. Roles include data storyteller, business intelligence writer, or analytics content specialist at consulting firms, data companies, or corporate analytics teams.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+blockchain": { name: "Crypto Research Writing", description: "Writing in-depth protocol analysis, token research reports, and market commentary for the cryptocurrency and blockchain industry. You evaluate tokenomics, analyze governance proposals, and explain technical protocol mechanisms to investors. Career paths include crypto research writer, blockchain analyst, or DeFi research contributor at crypto media outlets, investment firms, or research organizations.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+cloud":     { name: "Technical Writing", description: "Creating documentation engineering artifacts including API reference docs, tutorial walkthroughs, technical guides, and knowledge base articles that help developers use software effectively. You write clear documentation, build docs-as-code pipelines, and maintain versioned documentation sites. Roles include technical writer, documentation engineer, or developer documentation lead at tech companies, cloud providers, or open-source projects.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+security":  { name: "Security Documentation", description: "Writing security policies, incident response reports, compliance documentation, and security playbooks for organizations. You create clear security guidelines, document vulnerability remediation procedures, and prepare audit-ready security documentation. Career paths include security writer, compliance documentation specialist, or security communications analyst at cybersecurity firms, financial institutions, or government agencies.", tier: 1, rarity: "Common", score: 100 },
  "writing+trading":   { name: "Financial Writing", description: "Writing market commentary, investment memos, earnings analysis, and financial newsletters that explain market movements and investment thesis to audiences. You analyze financial statements, interpret macroeconomic data, and present investment ideas clearly. Roles include financial writer, investment newsletter author, or markets analyst writer at financial media outlets, investment firms, or publishing companies.", tier: 1, rarity: "Common", score: 100 },
  "writing+risk":      { name: "Risk Communication", description: "Communicating risk information to stakeholders through board reports, regulatory filings, and risk summaries that translate technical risk data into actionable business intelligence. You write risk disclosures, prepare examination responses, and present risk findings to non-technical leadership. Career paths include risk communicator, regulatory writing specialist, or corporate risk reporting analyst at banks, insurance companies, or consulting firms.", tier: 1, rarity: "Common", score: 100 },
  "writing+quant":     { name: "Quantitative Research Writing", description: "Writing quantitative research reports including alpha signal documentation, factor model reports, and strategy whitepapers that explain systematic trading approaches. You document research findings, explain backtesting methodology, and present performance attribution analysis. Roles include quant research writer, systematic strategy documenter, or quantitative analyst writer at hedge funds, asset management firms, or quant research organizations.", tier: 1, rarity: "Rare", score: 200 },
  "writing+physics":   { name: "Science Communication", description: "Making physics accessible to general audiences through popular science writing, science journalism, and TED-style explanatory content. You explain quantum mechanics and relativity in plain language, cover physics discoveries for newspapers, and create engaging educational content. Career paths include science writer, physics journalist, or science communicator at media outlets, museums, or educational organizations.", tier: 1, rarity: "Common", score: 100 },
  "writing+biology":   { name: "Medical Writing", description: "Creating regulatory submissions, clinical study reports, and medical communications for pharmaceutical companies and healthcare organizations. You write FDA submission documents, author peer-reviewed clinical papers, and develop medical education materials. Roles include medical writer, regulatory writing specialist, or clinical communications developer at pharma companies, CROs, or medical communications agencies.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+math":      { name: "Mathematical Communication", description: "Writing about mathematics for various audiences including textbooks for students, research papers for academics, and popular math exposition for general readers. You explain abstract concepts with clarity, create illustrative examples, and make mathematics engaging. Career paths include mathematics author, math textbook writer, or mathematical communicator at publishers, educational institutions, or science media outlets.", tier: 1, rarity: "Common", score: 100 },
  "writing+stats":     { name: "Statistical Reporting", description: "Reporting statistical findings through clinical trial result summaries, survey analysis reports, and research methodology documentation. You present p-values and confidence intervals clearly, explain study limitations, and communicate statistical significance to non-statisticians. Roles include statistical reporter, clinical trial writer, or research methodology documenter at pharmaceutical companies, research institutions, or government agencies.", tier: 1, rarity: "Common", score: 100 },
  "writing+defi":      { name: "DeFi Content Strategy", description: "Creating educational and promotional content for decentralized finance protocols including user tutorials, governance proposal explanations, and protocol documentation. You write clear DeFi guides, create token economics explainers, and build knowledge bases for complex protocols. Career paths include DeFi content strategist, crypto education writer, or protocol documentation specialist at DeFi projects, crypto media companies, or Web3 marketing agencies.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+design":    { name: "Editorial Design", description: "Combining written content with visual design to create magazines, books, newsletters, and digital publications with strong typographic and layout principles. You design page layouts, select typefaces, and create visual hierarchies that enhance readability. Roles include editorial designer, publication layout specialist, or print design director at publishing companies, media organizations, or design studios.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+quantum":   { name: "Quantum Science Writing", description: "Explaining quantum computing and quantum physics to both technical and general audiences through popular science articles, technical documentation, and educational content. You translate complex quantum concepts into engaging narratives, cover quantum breakthroughs for media, and create educational materials. Career paths include quantum science writer, quantum technology communicator, or quantum education content creator at quantum computing companies, science media, or educational platforms.", tier: 1, rarity: "Rare", score: 200 },
  "writing+devops":    { name: "Developer Relations", description: "Building technical communities through blog posts, conference talks, open-source documentation, and developer advocacy programs. You create technical tutorials, present at developer conferences, and build relationships with developer communities. Roles include developer advocate, DevRel engineer, or technical community manager at cloud providers, developer tool companies, or open-source foundations.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+linux":     { name: "Open Source Documentation", description: "Writing documentation for open-source software projects including READMEs, wikis, contribution guides, API references, and man pages. You create clear onboarding paths for new contributors, document API changes, and maintain community knowledge bases. Career paths include open-source documentation writer, developer documentation maintainer, or technical writer for open-source projects at foundations, tech companies, or community organizations.", tier: 1, rarity: "Common", score: 100 },

  // ─── BUSINESS ─────────────────────────────────────────
  "strategy+marketing": { name: "Growth Strategy", description: "Designing product-led growth strategies, market positioning frameworks, competitive analysis, and go-to-market plans that scale user acquisition and retention. You analyze market segments, design growth loops, and build pricing strategies for competitive advantage. Career paths include growth strategist, product marketing lead, or head of growth at startups, SaaS companies, or consumer technology firms.", tier: 1, rarity: "Uncommon", score: 150 },
  "strategy+data":     { name: "Business Intelligence", description: "Turning raw data into business decisions through KPI framework design, dashboard development, and executive reporting that drives organizational strategy. You define metrics hierarchies, build reporting pipelines, and present data-driven recommendations to leadership. Roles include business intelligence analyst, BI architect, or analytics manager at enterprises, consulting firms, or data-driven technology companies.", tier: 1, rarity: "Uncommon", score: 150 },
  "strategy+ai":       { name: "AI Strategy", description: "Developing enterprise AI adoption strategies including use case identification, build-vs-buy analysis, AI governance frameworks, and ROI measurement for artificial intelligence initiatives. You evaluate AI readiness, manage AI vendor relationships, and build organizational AI capabilities. Career paths include AI strategy consultant, chief AI officer, or enterprise AI program lead at corporations, consulting firms, or technology advisory companies.", tier: 1, rarity: "Rare", score: 250 },
  "strategy+cloud":    { name: "Cloud Strategy", description: "Planning enterprise cloud adoption including migration strategy, cost optimization, multi-cloud governance, and cloud-native transformation roadmaps. You assess application portfolios for cloud readiness, negotiate cloud contracts, and build cloud Center of Excellence programs. Roles include cloud strategy consultant, cloud transformation lead, or enterprise cloud architect at consulting firms, cloud providers, or large enterprises.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+coding":   { name: "Technical Architecture", description: "Making system design decisions including microservices vs monolith trade-offs, API design standards, scalability patterns, and technology stack selection. You evaluate architectural options, design system diagrams, and advise engineering teams on technical direction. Career paths include technical architect, principal engineer, or systems architecture lead at technology companies, consulting firms, or enterprise IT organizations.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+security": { name: "Security Strategy", description: "Developing enterprise security posture through security architecture design, compliance strategy, zero-trust adoption planning, and security program management. You conduct security maturity assessments, build security roadmaps, and align security investments with business risk. Roles include security strategist, CISO, or enterprise security architect at corporations, government agencies, or cybersecurity consulting firms.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+devops":   { name: "Engineering Management", description: "Leading engineering teams through process design, delivery strategy, team scaling, and technical debt management. You build engineering culture, implement agile methodologies, and balance feature delivery with platform investments. Career paths include engineering manager, VP of engineering, or director of technology at software companies, tech startups, or enterprise technology divisions.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+linux":    { name: "Open Source Strategy", description: "Developing corporate open source strategies including OSS licensing decisions, community engagement programs, and open source business model design. You evaluate contribution policies, build developer communities, and create monetization strategies for open-source products. Roles include open source program director, OSS strategy consultant, or community strategy lead at tech companies, foundations, or open-source-focused startups.", tier: 1, rarity: "Uncommon", score: 150 },
  "strategy+blockchain": { name: "Blockchain Business Strategy", description: "Developing enterprise blockchain adoption strategies including use case evaluation, token strategy design, and consortium governance models. You assess blockchain suitability, build business cases for distributed ledger projects, and design governance frameworks for multi-stakeholder networks. Career paths include blockchain strategy consultant, distributed ledger business analyst, or Web3 strategy director at enterprises, consulting firms, or blockchain companies.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+quantum":  { name: "Quantum Strategy", description: "Planning organizational quantum readiness by identifying quantum use cases, evaluating quantum hardware vendors, and building multi-year quantum technology adoption roadmaps. You assess quantum maturity, benchmark against competitors, and create investment proposals for quantum computing initiatives. Roles include quantum strategy consultant, quantum readiness advisor, or emerging technology strategist at consulting firms and large enterprises.", tier: 2, rarity: "Epic", score: 350 },
  "strategy+physics":  { name: "Deep Tech Strategy", description: "Evaluating and commercializing deep technologies including quantum computing, fusion energy, and advanced materials through R&D prioritization, technology transfer, and IP strategy development. You assess technology readiness levels, build commercialization roadmaps, and identify partnership opportunities. Career paths include deep tech strategy consultant, technology transfer director, or R&D strategy analyst at venture capital firms, corporate R&D labs, or government technology agencies.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+biology":  { name: "Biotech Strategy", description: "Developing life sciences business strategy including drug pipeline decisions, licensing deal structuring, and market access planning for pharmaceutical and biotech companies. You conduct competitive intelligence, evaluate partnership opportunities, and build long-term portfolio strategies. Roles include biotech corporate strategist, pharmaceutical business development lead, or life sciences strategy consultant at biotech companies, pharma firms, or consulting practices.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+trading":  { name: "Trading Business Strategy", description: "Building and scaling trading businesses including fund setup, regulatory compliance planning, investor relations, and operational strategy for hedge funds and prop trading firms. You design organizational structures, build vendor relationships, and develop growth strategies for trading operations. Career paths include trading business strategist, fund operations director, or alternative investments business consultant at trading firms and financial services companies.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+risk":     { name: "Enterprise Risk Strategy", description: "Developing board-level risk management frameworks including risk appetite definition, governance structure design, and crisis response planning for organizations. You align risk strategy with business objectives, build risk reporting for boards, and design enterprise risk culture programs. Roles include enterprise risk strategist, chief risk officer, or GRC program director at corporations, financial institutions, or government agencies.", tier: 1, rarity: "Uncommon", score: 150 },
  "strategy+quant":    { name: "Quant Strategy Design", description: "Designing and managing quantitative hedge funds including alpha research strategy, risk budgeting frameworks, and portfolio allocation across systematic strategies. You build strategy evaluation frameworks, design capital allocation models, and manage quant fund operations. Career paths include quant fund strategist, systematic strategy CIO, or quantitative portfolio construction specialist at hedge funds, asset management firms, or family offices.", tier: 2, rarity: "Epic", score: 350 },
  "strategy+defi":     { name: "DeFi Business Strategy", description: "Building sustainable DeFi businesses through protocol economics design, governance strategy, and sustainable yield generation models. You evaluate token launch strategies, design protocol revenue models, and build community incentive programs. Roles include DeFi business strategist, protocol economics lead, or decentralized finance business development director at DeFi projects, crypto venture capital, or blockchain foundations.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+math":     { name: "Operations Research", description: "Applying mathematical optimization to business problems including supply chain design, logistics network optimization, workforce scheduling, and resource allocation. You formulate mathematical programs, solve scheduling puzzles, and build decision support systems. Career paths include operations research analyst, optimization consultant, or management scientist at logistics companies, airlines, manufacturing firms, or consulting practices.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+stats":    { name: "Evidence-Based Management", description: "Building data-driven business cultures through metrics framework design, A/B testing program implementation, and OKR systems that align teams around measurable outcomes. You design experiment frameworks, build decision-making processes, and coach leaders on data-driven management. Roles include strategy analyst, evidence-based management consultant, or decision science director at consulting firms and data-driven enterprises.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+data":    { name: "Marketing Analytics", description: "Measuring marketing ROI through attribution modeling, customer acquisition cost analysis, lifetime value calculation, and cohort-based funnel optimization. You build measurement frameworks, design experiment systems, and quantify channel performance for marketing investment decisions. Career paths include marketing analyst, growth analytics specialist, or marketing data scientist at consumer brands, adtech companies, or digital marketing agencies.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+ai":      { name: "AI-Powered Marketing", description: "Using artificial intelligence for personalized marketing campaigns, predictive lead scoring, automated content generation, and customer segmentation at scale. You build recommendation engines, design AI-driven personalization systems, and optimize marketing spend with machine learning. Roles include AI marketing specialist, marketing automation engineer, or predictive marketing data scientist at e-commerce companies, SaaS firms, or marketing technology platforms.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+cloud":   { name: "MarTech Engineering", description: "Building and managing marketing technology stacks including customer data platforms, marketing automation systems, and analytics infrastructure on cloud platforms. You integrate marketing tools, build data pipelines for attribution, and design real-time personalization engines. Career paths include MarTech engineer, marketing platform developer, or growth infrastructure engineer at marketing technology companies and enterprise marketing teams.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+blockchain": { name: "Web3 Marketing", description: "Marketing cryptocurrency and blockchain projects through community building on Discord and Twitter, token launch campaigns, DAO governance engagement, and ambassador program development. You create token economics explainers, manage influencer partnerships, and build grassroots crypto communities. Roles include Web3 marketing manager, crypto community lead, or decentralized marketing strategist at blockchain startups and DAOs.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+security": { name: "Brand Security", description: "Protecting brand reputation online through takedown services for fraudulent content, domain security management, and brand reputation monitoring across digital channels. You detect phishing campaigns impersonating your brand, enforce trademark protections, and manage crisis communications for security incidents. Career paths include brand security analyst, online brand protection specialist, or digital risk manager at corporations and brand protection firms.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+coding":  { name: "Growth Engineering", description: "Building technical growth infrastructure including A/B testing platforms, referral system engines, analytics tracking pipelines, and conversion optimization tools. You implement server-side experiments, build attribution systems, and create data pipelines for growth metrics. Roles include growth engineer, technical product manager for growth, or marketing platform developer at growth-stage startups and tech companies.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+devops":  { name: "Marketing Operations", description: "Automating marketing workflows through campaign automation systems, lead routing engines, and marketing data pipelines that connect CRM, analytics, and advertising platforms. You build marketing infrastructure, design lead scoring systems, and optimize campaign delivery. Career paths include marketing operations manager, marketing automation specialist, or marketing technology director at B2B companies and marketing agencies.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+linux":   { name: "Developer Marketing", description: "Marketing to developer audiences through technical content creation, open-source community engagement, developer conference sponsorships, and developer relations programs. You build developer-focused landing pages, create technical tutorials, and manage developer community programs. Roles include developer marketing manager, technical evangelist, or developer community lead at developer tool companies, cloud providers, and open-source businesses.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+trading": { name: "Financial Product Marketing", description: "Marketing trading platforms, investment products, and fintech applications to retail and institutional investors through targeted campaigns and educational content. You design product positioning, create demo videos, and build investor education programs. Career paths include financial product marketer, fintech marketing manager, or investment platform marketing director at brokerages, fintech startups, or asset management companies.", tier: 1, rarity: "Common", score: 100 },
  "marketing+risk":    { name: "Compliance Marketing", description: "Marketing financial products within strict regulatory constraints including KYC/AML messaging requirements, suitability disclosures, and fair advertising standards. You balance persuasive marketing with regulatory review processes, ensure claims are substantiated, and manage approval workflows. Roles include compliance marketing manager, regulated industries marketing specialist, or financial services brand marketer at banks, insurance companies, or fintech firms.", tier: 1, rarity: "Common", score: 100 },
  "marketing+quant":   { name: "Quantitative Marketing Science", description: "Applying statistical models to marketing problems including demand estimation, price elasticity analysis, market simulation, and marketing mix optimization. You design conjoint studies, build customer choice models, and optimize pricing strategies. Career paths include marketing scientist, quantitative marketing researcher, or pricing analytics specialist at consumer goods companies, tech firms, or marketing consultancies.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+quantum": { name: "Quantum Technology Marketing", description: "Marketing quantum computing products and services through positioning strategy, go-to-market planning, and evangelism for emerging quantum technologies. You translate complex quantum concepts into compelling narratives, build developer communities, and create thought leadership content. Roles include quantum marketing manager, quantum product marketer, or quantum evangelist at quantum computing startups and cloud providers with quantum services.", tier: 2, rarity: "Rare", score: 250 },
  "marketing+physics": { name: "Deep Tech Marketing", description: "Marketing complex scientific technology products including quantum computing systems, scientific instrumentation, and advanced materials to technical and enterprise buyers. You create technical marketing content, manage product launches for deep tech, and build credibility with engineering audiences. Career paths include deep tech marketing manager, scientific product marketer, or technology evangelist at quantum companies, instrumentation manufacturers, or materials science firms.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+biology": { name: "Life Sciences Marketing", description: "Marketing pharmaceutical products, biotech therapies, and medical devices to healthcare professionals, patients, and payers. You develop medical education programs, create disease awareness campaigns, and navigate FDA promotional regulations for compliant marketing. Roles include life sciences marketing manager, pharmaceutical brand director, or medical device marketing specialist at pharma companies, biotech firms, or medical device manufacturers.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+math":    { name: "Pricing Strategy", description: "Designing mathematical pricing optimization strategies including dynamic pricing algorithms, price elasticity measurement, and competitive pricing models for products and services. You build pricing simulators, conduct A/B pricing tests, and optimize revenue per customer. Career paths include pricing strategist, revenue optimization analyst, or pricing data scientist at e-commerce companies, SaaS firms, or consumer goods manufacturers.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+stats":   { name: "Marketing Science", description: "Applying scientific methodology to marketing through marketing mix modeling, incrementality testing, media mix optimization, and experimental design for campaign evaluation. You build attribution models, measure true marketing lift, and optimize budget allocation across channels. Roles include marketing scientist, media analytics director, or marketing measurement specialist at large advertisers, agencies, or marketing analytics firms.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+design":  { name: "Brand Design", description: "Creating visual identity systems including logos, brand guidelines, campaign visuals, and brand touchpoints that communicate a consistent brand story across all customer interactions. You develop visual languages, design brand architecture, and manage creative assets. Career paths include brand designer, visual identity specialist, or creative director at branding agencies, in-house creative teams, or marketing departments.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+writing": { name: "Copywriting", description: "Crafting persuasive written content for business purposes including advertising copy, landing page content, email marketing campaigns, and brand taglines that drive conversions. You write headlines that capture attention, create calls to action that convert, and develop messaging frameworks. Roles include copywriter, marketing copywriter, or creative copywriter at advertising agencies, marketing departments, or freelancing for multiple clients.", tier: 1, rarity: "Common", score: 100 },
  "marketing+defi":    { name: "DeFi Growth Marketing", description: "Growing decentralized finance protocols through TVL acquisition strategies, community incentive design, liquidity mining campaign management, and token launch marketing. You build KPI dashboards for protocol growth, design airdrop strategies, and manage crypto-native marketing channels. Career paths include DeFi growth marketer, protocol marketing lead, or decentralized finance community growth specialist at DeFi projects and crypto marketing agencies.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+strategy": { name: "Corporate Strategy", description: "Developing long-range corporate plans including merger and acquisition evaluation, market entry analysis, competitive positioning, and growth planning for organizations. You conduct market sizing, evaluate acquisition targets, and build multi-year strategic roadmaps. Roles include corporate strategy analyst, strategy consultant, or VP of corporate strategy at large enterprises, consulting firms, or investment banks.", tier: 1, rarity: "Uncommon", score: 150 },
};

const RARITY_COLORS: Record<string, string> = {
  Common: "#94a3b8",
  Uncommon: "#10b981",
  Rare: "#3b82f6",
  Epic: "#a855f7",
  Legendary: "#f59e0b",
  Mythic: "#ef4444",
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#22c55e"];

function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function loadDiscoveries(): Discovery[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("aero_fusions") || "[]"); } catch { return []; }
}

function saveDiscoveries(d: Discovery[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("aero_fusions", JSON.stringify(d));
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function SkillFusionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<SkillNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const discoveredRef = useRef<Set<string>>(new Set());
  const dragNodeRef = useRef<SkillNode | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef<number>(0);
  const fusionCbRef = useRef<((d: Discovery) => void) | null>(null);

  const [discovered, setDiscovered] = useState<Discovery[]>([]);
  const [score, setScore] = useState(0);
  const [fusionMsg, setFusionMsg] = useState<{ name: string; rarity: string; score: number; description: string } | null>(null);
  const [showJournal, setShowJournal] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [customName, setCustomName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAllSkills, setShowAllSkills] = useState(false);
  const fusionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalDiscovered = discovered.length;
  const totalPossible = TOTAL_PAIRS;

  const filteredSkills = useMemo(() =>
    selectedCategory === "All" ? BASE_SKILLS : BASE_SKILLS.filter(s => s.category === selectedCategory),
    [selectedCategory]
  );

  const visibleSkills = useMemo(() =>
    showAllSkills ? filteredSkills : filteredSkills.slice(0, 12),
    [filteredSkills, showAllSkills]
  );

  const stats = useMemo(() => {
    const rarityCount: Record<string, number> = {};
    discovered.forEach(d => { rarityCount[d.rarity] = (rarityCount[d.rarity] || 0) + 1; });
    return rarityCount;
  }, [discovered]);

  useEffect(() => {
    const saved = loadDiscoveries();
    setDiscovered(saved);
    setScore(saved.reduce((s, d) => s + d.score, 0));
    saved.forEach(d => { discoveredRef.current.add(d.id); });
  }, []);

  const onDiscovery = useCallback((d: Discovery) => {
    setDiscovered(prev => {
      const exists = prev.some(x => x.id === d.id);
      const next = exists ? prev : [...prev, d];
      saveDiscoveries(next);
      return next;
    });
    setScore(prev => prev + d.score);
    setFusionMsg({ name: d.result, rarity: d.rarity, score: d.score, description: d.description || "" });
    if (fusionTimeoutRef.current) clearTimeout(fusionTimeoutRef.current);
    fusionTimeoutRef.current = setTimeout(() => setFusionMsg(null), 4500);
  }, []);

  useEffect(() => { fusionCbRef.current = onDiscovery; }, [onDiscovery]);

  const addCustomNode = useCallback(() => {
    if (!customName.trim()) return;
    const w = containerRef.current?.offsetWidth || 800;
    const h = containerRef.current?.offsetHeight || 500;
    nodesRef.current.push({
      id: "custom_" + Date.now(),
      label: customName.trim(),
      color: "#fbbf24",
      glow: rgba("#fbbf24", 0.4),
      x: w / 2 + (Math.random() - 0.5) * 200,
      y: h / 2 + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: 30, pulse: 0, pulseDir: 1, dragging: false, tier: 0, rarity: "Custom",
    });
    setCustomName("");
    setShowCreator(false);
  }, [customName]);

  const spawnNode = useCallback((skill: { id: string; label: string; color: string }) => {
    const w = containerRef.current?.offsetWidth || 800;
    const h = containerRef.current?.offsetHeight || 500;
    nodesRef.current.push({
      id: skill.id + "_" + Date.now(),
      label: skill.label,
      color: skill.color,
      glow: rgba(skill.color, 0.4),
      x: w / 2 + (Math.random() - 0.5) * 300,
      y: h / 2 + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: 32, pulse: 0, pulseDir: 1, dragging: false, tier: 0, rarity: "Base",
    });
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 0.5;
      particlesRef.current.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, maxLife: 1, color, size: Math.random() * 3 + 1,
      });
    }
  }, []);

  const spawnExplosion = useCallback((x: number, y: number, label: string, rarity: string) => {
    const count = rarity === "Mythic" ? 80 : rarity === "Legendary" ? 60 : rarity === "Epic" ? 50 : 35;
    const p: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
      p.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, maxLife: 1,
        color: Math.random() > 0.4 ? (RARITY_COLORS[rarity] || "#10b981") : COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 4 + 2,
      });
    }
    explosionsRef.current.push({ x, y, life: 1, particles: p, label, rarity });
  }, []);

  const resetGame = useCallback(() => {
    nodesRef.current = [];
    particlesRef.current = [];
    explosionsRef.current = [];
    discoveredRef.current.clear();
    setDiscovered([]);
    setScore(0);
    saveDiscoveries([]);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      w = rect.width; h = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const getBaseId = (label: string) => {
      const base = BASE_SKILLS.find(s => s.label === label);
      return base ? base.id : null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      for (const node of nodesRef.current) {
        if ((mx - node.x) ** 2 + (my - node.y) ** 2 < (node.radius + 10) ** 2) {
          node.dragging = true;
          dragNodeRef.current = node;
          break;
        }
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (dragNodeRef.current) {
        dragNodeRef.current.x = mouseRef.current.x;
        dragNodeRef.current.y = mouseRef.current.y;
        dragNodeRef.current.vx = 0;
        dragNodeRef.current.vy = 0;
      }
    };
    const handleMouseUp = () => { if (dragNodeRef.current) { dragNodeRef.current.dragging = false; dragNodeRef.current = null; } };
    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.touches[0].clientX - rect.left, my = e.touches[0].clientY - rect.top;
      for (const node of nodesRef.current) {
        if ((mx - node.x) ** 2 + (my - node.y) ** 2 < (node.radius + 15) ** 2) {
          node.dragging = true;
          dragNodeRef.current = node;
          e.preventDefault();
          break;
        }
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!dragNodeRef.current || !e.touches.length) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      dragNodeRef.current.x = e.touches[0].clientX - rect.left;
      dragNodeRef.current.y = e.touches[0].clientY - rect.top;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
    };
    const handleTouchEnd = () => { if (dragNodeRef.current) { dragNodeRef.current.dragging = false; dragNodeRef.current = null; } };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;
      const time = Date.now();

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.12;
            const baseA = getBaseId(a.label), baseB = getBaseId(b.label);
            const key = baseA && baseB ? [baseA, baseB].sort().join("+") : null;
            const isFused = key ? discoveredRef.current.has(key) : false;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            if (isFused) {
              ctx.strokeStyle = rgba("#10b981", 0.4 + Math.sin(time / 300) * 0.3);
              ctx.lineWidth = 2;
              ctx.shadowColor = "rgba(16,185,129,0.4)";
              ctx.shadowBlur = 8;
            } else {
              ctx.strokeStyle = rgba("#94a3b8", alpha);
              ctx.lineWidth = 0.8;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Ambient
      if (Math.random() < 0.1) {
        particlesRef.current.push({
          x: Math.random() * w, y: h + 5,
          vx: (Math.random() - 0.5) * 0.4, vy: -(Math.random() * 0.8 + 0.2),
          life: 1, maxLife: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 1.5 + 0.5,
        });
      }
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.004;
        if (p.life <= 0) return false;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = rgba(p.color, p.life * 0.4);
        ctx.fill();
        return true;
      });

      // Nodes
      for (const node of nodes) {
        if (!node.dragging) {
          node.x += node.vx; node.y += node.vy;
          if (node.x < node.radius || node.x > w - node.radius) node.vx *= -1;
          if (node.y < node.radius || node.y > h - node.radius) node.vy *= -1;
          node.x = Math.max(node.radius, Math.min(w - node.radius, node.x));
          node.y = Math.max(node.radius, Math.min(h - node.radius, node.y));
          node.vx += (Math.random() - 0.5) * 0.015;
          node.vy += (Math.random() - 0.5) * 0.015;
          node.vx *= 0.999; node.vy *= 0.999;
        }
        node.pulse += 0.03 * node.pulseDir;
        if (node.pulse > 1) node.pulseDir = -1;
        if (node.pulse < 0) node.pulseDir = 1;

        const rarityColor = RARITY_COLORS[node.rarity] || node.color;
        const isBase = node.rarity === "Base";
        const isCustom = node.rarity === "Custom";
        const pulseScale = 1 + node.pulse * 0.06;
        const r = node.radius * pulseScale;

        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.5);
        grad.addColorStop(0, rgba(isCustom ? "#fbbf24" : isBase ? node.color : rarityColor, 0.3));
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(node.x - r * 2.5, node.y - r * 2.5, r * 5, r * 5);

        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(isBase ? node.color : rarityColor, 0.35);
        ctx.lineWidth = node.tier > 0 ? 2.5 : 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
        bg.addColorStop(0, rgba(isCustom ? "#fbbf24" : isBase ? node.color : rarityColor, 0.2));
        bg.addColorStop(1, rgba(isCustom ? "#fbbf24" : isBase ? node.color : rarityColor, 0.05));
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = isBase ? rgba(node.color, 0.5) : rarityColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.font = "bold 18px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isCustom ? "#fbbf24" : isBase ? node.color : rarityColor;
        ctx.fillText(node.label.charAt(0).toUpperCase(), node.x, node.y);
        ctx.restore();

        ctx.font = "bold 10px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#cbd5e1";
        const labelMaxW = r * 2.5;
        const labelText = node.label.length > 16 ? node.label.slice(0, 14) + "..." : node.label;
        ctx.fillText(labelText, node.x, node.y + r + 16);

        if (node.tier > 0) {
          ctx.font = "8px Inter, system-ui, sans-serif";
          ctx.fillStyle = rarityColor;
          ctx.fillText(`${node.rarity}`, node.x, node.y + r + 27);
        } else if (isCustom) {
          ctx.font = "8px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#fbbf24";
          ctx.fillText("CUSTOM", node.x, node.y + r + 27);
        }
      }

      // Explosions
      explosionsRef.current = explosionsRef.current.filter((exp) => {
        exp.life -= 0.012;
        if (exp.life <= 0) return false;
        for (const p of exp.particles) {
          p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97; p.life -= 0.018;
          if (p.life > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = rgba(p.color, p.life * 0.7);
            ctx.fill();
          }
        }
        if (exp.life > 0.4) {
          ctx.save();
          ctx.globalAlpha = (exp.life - 0.4) / 0.6;
          ctx.font = "bold 14px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          const rarityColor = RARITY_COLORS[exp.rarity] || "#10b981";
          ctx.fillStyle = rarityColor;
          ctx.shadowColor = rgba(rarityColor, 0.8);
          ctx.shadowBlur = 15;
          ctx.fillText(exp.label, exp.x, exp.y - 25 - (1 - exp.life) * 40);
          ctx.shadowBlur = 0;
          ctx.restore();
        }
        return true;
      });

      // Fusion check
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (!nodes[i].dragging && !nodes[j].dragging) continue;
          if (Math.sqrt((nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2) >= 60) continue;

          const baseA = getBaseId(nodes[i].label);
          const baseB = getBaseId(nodes[j].label);
          if (!baseA || !baseB || baseA === baseB) continue;

          const key = [baseA, baseB].sort().join("+");
          if (discoveredRef.current.has(key)) continue;

          const fusion = REAL_FUSIONS[key];
          if (!fusion) continue;

          discoveredRef.current.add(key);
          const discovery: Discovery = {
            id: key, a: baseA, b: baseB, result: fusion.name,
            tier: fusion.tier, rarity: fusion.rarity,
            timestamp: Date.now(), score: fusion.score,
            description: fusion.description,
          };

          const rarityColor = RARITY_COLORS[fusion.rarity] || "#10b981";
          spawnExplosion((nodes[i].x + nodes[j].x) / 2, (nodes[i].y + nodes[j].y) / 2, fusion.name, fusion.rarity);
          spawnParticles(nodes[i].x, nodes[i].y, nodes[i].color, 15);
          spawnParticles(nodes[j].x, nodes[j].y, nodes[j].color, 15);

          nodes[i].label = fusion.name;
          nodes[i].tier = fusion.tier;
          nodes[i].rarity = fusion.rarity;
          nodes[i].color = rarityColor;
          nodes[i].glow = rgba(rarityColor, 0.4);
          nodes[i].radius = 32 + fusion.tier * 4;
          nodes[i].vx = (Math.random() - 0.5) * 0.4;
          nodes[i].vy = (Math.random() - 0.5) * 0.4;
          nodes.splice(j, 1);
          fusionCbRef.current?.(discovery);
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [spawnParticles, spawnExplosion]);

  return (
    <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Atom size={14} /> Skill Fusion Lab
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Discover <span className="text-emerald-400">{totalPossible}</span> real specializations
          </h2>
          <p className="text-base sm:text-lg text-slate-400 mt-3 max-w-2xl mx-auto">
            Combine two skills to discover a real, existing career field. Each fusion explains what the field is,
            what professionals do, and why it matters. Build your own learning map.
          </p>
        </div>

        {/* Score bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-sm">
            <Trophy size={14} className="text-amber-400" />
            <span className="text-amber-400 font-bold">{score.toLocaleString()}</span>
            <span className="text-slate-500">pts</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-sm">
            <Sparkles size={14} className="text-emerald-400" />
            <span className="text-emerald-400 font-bold">{totalDiscovered}</span>
            <span className="text-slate-500">/ {totalPossible}</span>
          </div>
          {/* Progress bar */}
          <div className="w-32 h-2 rounded-full bg-slate-700/50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (totalDiscovered / totalPossible) * 100)}%` }} />
          </div>
          <button onClick={() => setShowJournal(!showJournal)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 text-sm text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer">
            <BookOpen size={14} /> Journal {showJournal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button onClick={() => setShowCreator(!showCreator)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-sm text-emerald-400 hover:bg-emerald-600/30 transition-all cursor-pointer">
            <Plus size={14} /> Custom Skill
          </button>
          {discovered.length > 0 && (
            <button onClick={resetGame}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/30 text-sm text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer">
              <RotateCcw size={12} />
            </button>
          )}
        </div>

        {/* Fusion notification */}
        {fusionMsg && (
          <div className="mb-4">
            <div className="mx-auto max-w-xl rounded-2xl border p-5 text-center transition-all"
              style={{ backgroundColor: rgba(RARITY_COLORS[fusionMsg.rarity] || "#10b981", 0.08), borderColor: rgba(RARITY_COLORS[fusionMsg.rarity] || "#10b981", 0.3) }}>
              <div className="mb-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: RARITY_COLORS[fusionMsg.rarity] }}>
                  {fusionMsg.rarity} Discovery
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{fusionMsg.name}</h3>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-3">
                <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/40 capitalize">{fusionMsg.name.split(" ").length > 3 ? "Advanced Field" : "Specialization"}</span>
                <span className="text-amber-400 font-bold">+{fusionMsg.score} pts</span>
              </div>
              {fusionMsg.description && (
                <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">{fusionMsg.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Discovery Journal */}
        {showJournal && (
          <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-slate-700/50 backdrop-blur-sm max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Discovery Journal</h3>
                <p className="text-xs text-slate-500 mt-0.5">{totalDiscovered} of {totalPossible} real specializations discovered</p>
              </div>
              <button onClick={() => setShowJournal(false)} className="text-slate-500 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              {discovered.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-6">No discoveries yet. Click skills from the palette, then drag them together!</p>
              )}
              {[...discovered].reverse().map((d) => (
                <div key={d.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/30 transition-all hover:border-slate-600/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: RARITY_COLORS[d.rarity] }} />
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: RARITY_COLORS[d.rarity] }}>{d.rarity}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">{d.result}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/30 capitalize">{d.a}</span>
                        <Zap size={10} className="text-slate-600" />
                        <span className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/30 capitalize">{d.b}</span>
                      </div>
                      {d.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">{d.description}</p>
                      )}
                    </div>
                    <span className="text-amber-400/70 font-mono text-xs shrink-0">+{d.score}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-700/30">
              {Object.entries(RARITY_COLORS).map(([rarity, color]) => (
                <div key={rarity} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-500">{rarity}</span>
                  <span className="font-bold" style={{ color }}>{stats[rarity] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Creator */}
        {showCreator && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-800/90 border border-amber-500/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Create a Custom Skill</h3>
              <button onClick={() => setShowCreator(false)} className="text-slate-500 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>
            <div className="flex gap-2">
              <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomNode()}
                placeholder="Type any skill... (e.g., Quantum Finance, Neuroeconomics, Astrobiology)"
                className="flex-1 bg-slate-900/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50" />
              <button onClick={addCustomNode} disabled={!customName.trim()}
                className="px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Custom skills appear as golden nodes. They won&apos;t match known fusions, but you can still use them creatively in the arena.</p>
          </div>
        )}

        {/* Skill Palette */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
            <button onClick={() => setSelectedCategory("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${selectedCategory === "All" ? "bg-emerald-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/40"}`}>
              All ({BASE_SKILLS.length})
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat ? "bg-emerald-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/40"}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleSkills.map(skill => (
              <button key={skill.id} onClick={() => spawnNode(skill)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-105 cursor-pointer"
                style={{ borderColor: rgba(skill.color, 0.3), backgroundColor: rgba(skill.color, 0.08), color: skill.color }}>
                <Plus size={10} /> {skill.label}
              </button>
            ))}
            {filteredSkills.length > 12 && (
              <button onClick={() => setShowAllSkills(!showAllSkills)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/40 text-slate-500 hover:text-slate-300 border border-slate-700/30 cursor-pointer">
                {showAllSkills ? "Show less" : `+${filteredSkills.length - 12} more`}
              </button>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="relative w-full h-[450px] sm:h-[500px] rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
          {nodesRef.current.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-5xl mb-4 opacity-20">+</div>
                <p className="text-slate-500 text-sm">Click any skill above to add it to the arena</p>
                <p className="text-slate-600 text-xs mt-1">Then drag two together to discover a real specialization</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-800/80 backdrop-blur border border-slate-700/50 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /></span> Click to add</span>
              <span className="hidden sm:flex items-center gap-1">Drag to fuse</span>
              <span className="hidden sm:flex items-center gap-1"><Zap size={10} className="text-blue-400" /> Real specializations</span>
              <span className="hidden md:flex items-center gap-1">Hover journal for details</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
