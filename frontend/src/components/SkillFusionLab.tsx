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
   SKILL DATABASE — Real domains only
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
   REAL FUSIONS — Every single combination maps to a real
   existing field or discipline. No fake names.
   ═══════════════════════════════════════════════════════════ */
const REAL_FUSIONS: Record<string, { name: string; description: string; tier: number; rarity: string; score: number }> = {
  // ─── TECH + TECH ─────────────────────────────────────
  "linux+security":    { name: "Penetration Testing", description: "Offensive security: finding vulnerabilities through systematic exploitation of Linux/Unix systems.", tier: 1, rarity: "Uncommon", score: 150 },
  "devops+linux":      { name: "Site Reliability Engineering", description: "Applying software engineering to infrastructure — uptime, monitoring, incident response at scale.", tier: 1, rarity: "Uncommon", score: 150 },
  "cloud+devops":      { name: "Cloud Architecture", description: "Designing distributed systems across AWS/GCP/Azure — compute, networking, storage, IaC.", tier: 1, rarity: "Rare", score: 250 },
  "cloud+security":    { name: "Cloud Security Engineering", description: "Securing cloud infrastructure — IAM, encryption, compliance, zero-trust in cloud environments.", tier: 1, rarity: "Rare", score: 250 },
  "coding+security":   { name: "Secure Software Development", description: "Writing secure code — OWASP, threat modeling, SAST/DAST, secure SDLC practices.", tier: 1, rarity: "Uncommon", score: 150 },
  "coding+linux":      { name: "Systems Programming", description: "Building OS kernels, drivers, embedded systems — C, Rust, memory management, concurrency.", tier: 1, rarity: "Uncommon", score: 150 },
  "coding+devops":     { name: "Platform Engineering", description: "Building internal developer platforms — CI/CD, Kubernetes, developer experience tooling.", tier: 1, rarity: "Rare", score: 200 },
  "coding+cloud":      { name: "Cloud-Native Development", description: "Microservices, serverless, containers — building apps designed for cloud from day one.", tier: 1, rarity: "Rare", score: 200 },
  "devops+security":   { name: "DevSecOps", description: "Integrating security into every stage of the DevOps pipeline — shift-left, automated scanning.", tier: 1, rarity: "Epic", score: 300 },
  "cloud+linux":       { name: "Infrastructure as Code", description: "Terraform, Ansible, Pulumi — managing cloud infrastructure through version-controlled code.", tier: 1, rarity: "Uncommon", score: 150 },
  "cloud+coding":      { name: "Cloud-Native Development", description: "Building microservices and serverless applications designed for cloud from the ground up.", tier: 1, rarity: "Rare", score: 200 },
  "linux+coding":      { name: "Systems Programming", description: "Building low-level software — kernels, drivers, embedded firmware in C/Rust.", tier: 1, rarity: "Uncommon", score: 150 },
  "linux+data":        { name: "Linux Systems Administration", description: "Managing Linux servers, storage, networking — the backbone of all data infrastructure.", tier: 1, rarity: "Common", score: 100 },
  "linux+ai":          { name: "Edge AI / On-Device ML", description: "Deploying ML models on edge devices — ARM, Raspberry Pi, TPU, model optimization.", tier: 1, rarity: "Rare", score: 200 },
  "linux+blockchain":  { name: "Blockchain Node Operations", description: "Running and maintaining blockchain validator nodes, mining infrastructure, node sync.", tier: 1, rarity: "Rare", score: 200 },
  "linux+quantum":     { name: "Quantum Computing Infrastructure", description: "Setting up and managing quantum computing environments — Qiskit, Cirq, cryogenic systems.", tier: 2, rarity: "Epic", score: 350 },
  "security+coding":   { name: "Application Security", description: "Securing applications end-to-end — code review, pen testing, vulnerability management.", tier: 1, rarity: "Uncommon", score: 150 },
  "security+ai":       { name: "AI Security Research", description: "Adversarial ML, model poisoning, deepfake detection, AI red teaming.", tier: 1, rarity: "Epic", score: 350 },
  "security+data":     { name: "Data Security & Privacy", description: "GDPR compliance, data encryption, DLP, privacy engineering, anonymization.", tier: 1, rarity: "Uncommon", score: 150 },
  "security+blockchain": { name: "Smart Contract Auditing", description: "Reviewing Solidity/Vyper code for vulnerabilities — reentrancy, overflow, economic exploits.", tier: 1, rarity: "Epic", score: 350 },
  "security+quantum":  { name: "Post-Quantum Cryptography", description: "Designing cryptographic systems resistant to quantum attacks — lattice-based, hash-based crypto.", tier: 2, rarity: "Legendary", score: 500 },
  "security+defi":     { name: "DeFi Security Auditing", description: "Auditing decentralized finance protocols — flash loan attacks, economic exploit analysis.", tier: 1, rarity: "Epic", score: 350 },
  "security+trading":  { name: "Financial Systems Security", description: "Securing trading platforms, payment systems, banking infrastructure from cyber threats.", tier: 1, rarity: "Rare", score: 250 },
  "security+risk":     { name: "Cybersecurity Risk Management", description: "Assessing and mitigating organizational cyber risk — frameworks like NIST, ISO 27001.", tier: 1, rarity: "Rare", score: 200 },
  "coding+ai":         { name: "Machine Learning Engineering", description: "Building and deploying ML systems at scale — MLOps, feature stores, model serving.", tier: 1, rarity: "Rare", score: 200 },
  "coding+data":       { name: "Data Engineering", description: "Building data pipelines, ETL/ELT systems, data warehouses and lakehouses.", tier: 1, rarity: "Uncommon", score: 150 },
  "coding+blockchain": { name: "Smart Contract Development", description: "Writing Solidity, Rust (Solana), Move — decentralized application backends.", tier: 1, rarity: "Rare", score: 200 },
  "coding+quantum":    { name: "Quantum Algorithm Development", description: "Writing quantum circuits — Qiskit, Cirq, PennyLane, variational algorithms.", tier: 2, rarity: "Epic", score: 400 },
  "coding+math":       { name: "Computational Mathematics", description: "Numerical methods, algorithms for mathematical modeling, simulation, optimization.", tier: 1, rarity: "Rare", score: 200 },
  "coding+physics":    { name: "Scientific Computing", description: "Simulating physical systems — FEA, CFD, N-body simulations, Monte Carlo methods.", tier: 1, rarity: "Rare", score: 200 },
  "coding+design":     { name: "Creative Coding / Generative Art", description: "Using code as artistic medium — p5.js, Three.js, procedural generation, creative tech.", tier: 1, rarity: "Uncommon", score: 150 },
  "coding+strategy":   { name: "Software Product Strategy", description: "Technical product decisions — build vs buy, tech stack selection, platform roadmaps.", tier: 1, rarity: "Uncommon", score: 150 },
  "devops+data":       { name: "Data Platform Engineering", description: "Building and operating data infrastructure — Kafka, Spark, Airflow at scale.", tier: 1, rarity: "Rare", score: 200 },
  "devops+ai":         { name: "MLOps", description: "Machine learning operations — model versioning, training pipelines, monitoring in production.", tier: 1, rarity: "Rare", score: 250 },
  "devops+blockchain": { name: "Blockchain Infrastructure", description: "Running validator networks, node orchestration, chain monitoring, deployment automation.", tier: 1, rarity: "Rare", score: 250 },
  "cloud+ai":          { name: "Cloud ML Infrastructure", description: "GPU clusters, SageMaker, Vertex AI — training and deploying models in the cloud.", tier: 1, rarity: "Rare", score: 250 },
  "cloud+data":        { name: "Data Lake Architecture", description: "Designing scalable data storage — S3/GCS lakes, Delta Lake, Snowflake, data catalogs.", tier: 1, rarity: "Rare", score: 250 },
  "cloud+blockchain":  { name: "Decentralized Cloud Infrastructure", description: "Filecoin, Arweave, Akash — decentralized compute and storage networks.", tier: 1, rarity: "Rare", score: 250 },
  "cloud+quantum":     { name: "Quantum Cloud Computing", description: "IBM Quantum, Amazon Braket, Azure Quantum — accessing quantum hardware via cloud.", tier: 2, rarity: "Legendary", score: 500 },
  "ai+data":           { name: "Deep Learning", description: "Neural networks — CNNs, RNNs, Transformers, diffusion models, foundation models.", tier: 1, rarity: "Rare", score: 200 },
  "ai+math":           { name: "Mathematical AI", description: "Theoretical foundations of AI — optimization, linear algebra, calculus for ML.", tier: 1, rarity: "Rare", score: 250 },
  "ai+blockchain":     { name: "Decentralized AI", description: "Federated learning, on-chain ML inference, decentralized model marketplaces.", tier: 2, rarity: "Epic", score: 350 },
  "ai+quantum":        { name: "Quantum Machine Learning", description: "Quantum neural networks, quantum kernels, variational quantum eigensolvers.", tier: 2, rarity: "Legendary", score: 550 },
  "ai+physics":        { name: "Computational Physics", description: "Using ML to solve physics problems — particle detection, materials discovery, simulations.", tier: 1, rarity: "Rare", score: 250 },
  "ai+biology":        { name: "Bioinformatics / Computational Biology", description: "Genomic analysis, protein folding (AlphaFold), drug discovery, phylogenetics.", tier: 1, rarity: "Rare", score: 250 },
  "ai+design":         { name: "Generative Design", description: "AI-powered design — Midjourney, Stable Diffusion, DALL-E, neural style transfer.", tier: 1, rarity: "Rare", score: 200 },
  "ai+trading":        { name: "Algorithmic Trading", description: "Automated trading strategies using ML — signal generation, execution, backtesting.", tier: 1, rarity: "Epic", score: 400 },
  "ai+marketing":      { name: "AI-Powered Marketing", description: "Predictive analytics for marketing — customer segmentation, recommendation engines, A/B testing at scale.", tier: 1, rarity: "Rare", score: 200 },
  "ai+writing":        { name: "Natural Language Processing", description: "Text analysis, translation, chatbots, summarization, LLM fine-tuning.", tier: 1, rarity: "Rare", score: 200 },
  "ai+risk":           { name: "AI Risk & Governance", description: "Responsible AI — bias detection, fairness, explainability, AI regulation, model risk.", tier: 1, rarity: "Rare", score: 250 },
  "data+stats":        { name: "Data Science", description: "Extracting insights from data — exploratory analysis, modeling, visualization, storytelling.", tier: 1, rarity: "Rare", score: 200 },
  "data+math":         { name: "Applied Mathematics", description: "Using math to solve real problems — optimization, cryptography, signal processing.", tier: 1, rarity: "Uncommon", score: 150 },
  "data+blockchain":   { name: "On-Chain Analytics", description: "Blockchain forensics, wallet tracking, DeFi analytics, chain surveillance.", tier: 1, rarity: "Rare", score: 200 },
  "data+biology":      { name: "Genomics Data Science", description: "DNA sequencing analysis, variant calling, gene expression, precision medicine.", tier: 1, rarity: "Rare", score: 250 },
  "data+physics":      { name: "Experimental Data Analysis", description: "Particle physics data, telescope data, gravitational wave detection, signal processing.", tier: 1, rarity: "Rare", score: 200 },
  "blockchain+quantum": { name: "Quantum-Resistant Blockchain", description: "Building blockchains that survive quantum attacks — lattice cryptography, hash signatures.", tier: 2, rarity: "Legendary", score: 500 },
  "blockchain+defi":   { name: "DeFi Protocol Engineering", description: "Building decentralized exchanges, lending protocols, yield aggregators, stablecoins.", tier: 1, rarity: "Rare", score: 250 },
  "blockchain+trading": { name: "Crypto Market Making", description: "Providing liquidity on DEXs, MEV strategies, arbitrage across chains.", tier: 1, rarity: "Rare", score: 250 },
  "quantum+math":      { name: "Quantum Computing Theory", description: "Qubits, quantum gates, error correction, Shor's algorithm, quantum complexity.", tier: 2, rarity: "Epic", score: 400 },
  "quantum+physics":   { name: "Quantum Mechanics", description: "Wave functions, entanglement, superposition, quantum field theory.", tier: 2, rarity: "Epic", score: 350 },
  "quantum+stats":     { name: "Quantum Statistics", description: "Statistical mechanics, quantum probability, many-body physics.", tier: 2, rarity: "Epic", score: 350 },
  "quantum+risk":      { name: "Quantum Risk Modeling", description: "Using quantum computing for risk simulation, Monte Carlo on quantum hardware.", tier: 3, rarity: "Legendary", score: 500 },
  "quantum+trading":   { name: "Quantum Financial Modeling", description: "Quantum algorithms for portfolio optimization, option pricing, derivative valuation.", tier: 3, rarity: "Legendary", score: 500 },
  "quantum+security":  { name: "Quantum Cryptography", description: "Quantum key distribution, quantum-safe protocols, quantum random number generation.", tier: 2, rarity: "Legendary", score: 500 },
  "quantum+blockchain": { name: "Quantum Blockchain", description: "Quantum-resistant distributed ledgers, quantum-secured consensus, quantum networking.", tier: 3, rarity: "Mythic", score: 800 },
  "quantum+ai":        { name: "Quantum Neural Networks", description: "Quantum-enhanced deep learning, quantum kernels, quantum advantage in ML.", tier: 3, rarity: "Mythic", score: 800 },
  "quantum+coding":    { name: "Quantum Software Engineering", description: "Building quantum algorithms, error mitigation, quantum circuit optimization.", tier: 2, rarity: "Epic", score: 400 },
  "quantum+data":      { name: "Quantum Data Processing", description: "Quantum-enhanced data analysis, quantum clustering, quantum PCA.", tier: 2, rarity: "Epic", score: 350 },
  "quantum+biology":   { name: "Quantum Biology", description: "Quantum effects in biological systems — photosynthesis, enzyme catalysis, bird navigation.", tier: 2, rarity: "Epic", score: 400 },
  "quantum+design":    { name: "Quantum Visualization", description: "Visualizing quantum states, quantum circuit design tools, quantum UX.", tier: 2, rarity: "Rare", score: 250 },
  "quantum+strategy":  { name: "Quantum Strategy Consulting", description: "Advising organizations on quantum readiness, quantum use cases, quantum roadmap.", tier: 2, rarity: "Rare", score: 250 },
  "quantum+marketing": { name: "Quantum Technology Marketing", description: "Marketing quantum computing products, quantum startup go-to-market, quantum evangelism.", tier: 2, rarity: "Rare", score: 200 },

  // ─── FINANCE + FINANCE ────────────────────────────────
  "quant+trading":     { name: "Quantitative Trading", description: "Mathematical trading strategies — stat arb, mean reversion, factor models, alpha generation.", tier: 1, rarity: "Rare", score: 300 },
  "quant+risk":        { name: "Quantitative Risk Management", description: "VaR models, stress testing, credit risk modeling, regulatory capital calculation.", tier: 1, rarity: "Rare", score: 250 },
  "quant+math":        { name: "Mathematical Finance", description: "Stochastic calculus, Black-Scholes, Ito calculus, derivative pricing theory.", tier: 1, rarity: "Epic", score: 350 },
  "quant+stats":       { name: "Financial Econometrics", description: "Time series analysis, GARCH models, cointegration, regime detection in markets.", tier: 1, rarity: "Epic", score: 400 },
  "quant+defi":        { name: "DeFi Quantitative Research", description: "Quantitative analysis of DeFi protocols — impermanent loss, MEV, arbitrage modeling.", tier: 2, rarity: "Epic", score: 400 },
  "quant+data":        { name: "Financial Data Science", description: "Analyzing market data — alternative data, sentiment analysis, feature engineering for trading.", tier: 1, rarity: "Rare", score: 250 },
  "quant+ai":          { name: "AI-Powered Quant Research", description: "Deep reinforcement learning for trading, transformer models for market prediction.", tier: 2, rarity: "Legendary", score: 500 },
  "quant+cloud":       { name: "Cloud-Based Trading Systems", description: "Building trading infrastructure on cloud — low-latency execution, real-time risk.", tier: 1, rarity: "Rare", score: 250 },
  "trading+risk":      { name: "Portfolio Management", description: "Asset allocation, risk parity, factor investing, modern portfolio theory.", tier: 1, rarity: "Rare", score: 250 },
  "trading+stats":     { name: "Statistical Trading", description: "Data-driven trading strategies — backtesting, performance attribution, market microstructure.", tier: 1, rarity: "Uncommon", score: 200 },
  "trading+defi":      { name: "DeFi Yield Strategy", description: "Optimizing DeFi yields — liquidity provision, farming strategies, risk-adjusted returns.", tier: 1, rarity: "Rare", score: 250 },
  "trading+data":      { name: "Market Data Analytics", description: "Real-time market data processing, tick analysis, order book dynamics, market feeds.", tier: 1, rarity: "Uncommon", score: 150 },
  "trading+cloud":     { name: "Cloud Trading Infrastructure", description: "Building scalable trading systems on cloud — real-time data, execution engines.", tier: 1, rarity: "Rare", score: 250 },
  "trading+linux":     { name: "Low-Latency Trading Systems", description: "Ultra-fast trading — kernel bypass, FPGA, co-location, microsecond optimization.", tier: 1, rarity: "Epic", score: 350 },
  "trading+coding":    { name: "Algorithmic Trading Development", description: "Building trading bots, execution algorithms, smart order routing in code.", tier: 1, rarity: "Rare", score: 250 },
  "trading+strategy":  { name: "Investment Strategy Design", description: "Long/short, global macro, event-driven, multi-asset strategies for institutional capital.", tier: 1, rarity: "Rare", score: 250 },
  "trading+math":      { name: "Financial Mathematics", description: "Derivatives pricing, stochastic processes, risk-neutral valuation, exotic options.", tier: 1, rarity: "Rare", score: 250 },
  "trading+blockchain": { name: "Crypto Trading & Market Making", description: "Providing liquidity on crypto exchanges, cross-chain arbitrage, DEX strategies.", tier: 1, rarity: "Rare", score: 250 },
  "trading+marketing": { name: "Financial Marketing", description: "Marketing financial products — robo-advisory, fintech growth, financial content.", tier: 1, rarity: "Common", score: 100 },
  "trading+writing":   { name: "Financial Journalism", description: "Writing about markets, economy, business — financial news, analysis, commentary.", tier: 1, rarity: "Common", score: 100 },
  "trading+quantum":   { name: "Quantum Finance", description: "Quantum algorithms for option pricing, portfolio optimization, risk analytics.", tier: 3, rarity: "Legendary", score: 500 },
  "trading+biology":   { name: "Biotech Investing", description: "Evaluating biotech companies — clinical trials, FDA pipeline analysis, life sciences VC.", tier: 1, rarity: "Uncommon", score: 150 },
  "trading+physics":   { name: "Financial Physics", description: "Applying physics models to markets — statistical mechanics, entropy, fractal analysis.", tier: 1, rarity: "Rare", score: 200 },
  "risk+stats":        { name: "Actuarial Science", description: "Modeling financial risk — insurance pricing, pension mathematics, mortality tables.", tier: 1, rarity: "Rare", score: 250 },
  "risk+data":         { name: "Risk Analytics", description: "Data-driven risk assessment — credit scoring, fraud detection, operational risk models.", tier: 1, rarity: "Rare", score: 200 },
  "risk+defi":         { name: "DeFi Risk Engineering", description: "Designing risk parameters for lending protocols — liquidation thresholds, oracle risk.", tier: 1, rarity: "Epic", score: 300 },
  "risk+math":         { name: "Risk Mathematics", description: "Theoretical risk modeling — extreme value theory, copulas, tail risk analysis.", tier: 1, rarity: "Rare", score: 250 },
  "risk+cloud":        { name: "Cloud Risk Infrastructure", description: "Building real-time risk systems on cloud — streaming risk calculations, dashboards.", tier: 1, rarity: "Rare", score: 200 },
  "risk+blockchain":   { name: "Blockchain Risk Management", description: "Assessing smart contract risk, protocol risk, regulatory risk in crypto.", tier: 1, rarity: "Rare", score: 200 },
  "risk+coding":       { name: "Risk Systems Development", description: "Building risk management software — VaR engines, stress testing platforms, P&L systems.", tier: 1, rarity: "Rare", score: 200 },
  "risk+ai":           { name: "AI-Driven Risk Assessment", description: "ML models for credit risk, fraud detection, real-time anomaly detection in transactions.", tier: 1, rarity: "Epic", score: 350 },
  "risk+strategy":     { name: "Enterprise Risk Management", description: "Organizational risk frameworks — COSO, ERM, business continuity, crisis management.", tier: 1, rarity: "Uncommon", score: 150 },
  "risk+writing":      { name: "Regulatory Writing", description: "Writing compliance documents, regulatory filings, risk reports, audit documentation.", tier: 1, rarity: "Common", score: 100 },
  "risk+marketing":    { name: "Compliance Marketing", description: "Marketing financial products within regulatory constraints — KYC/AML messaging.", tier: 1, rarity: "Common", score: 100 },
  "risk+quantum":      { name: "Quantum Risk Analysis", description: "Using quantum computing for Monte Carlo risk simulation, portfolio stress testing.", tier: 3, rarity: "Legendary", score: 500 },
  "risk+design":       { name: "Risk Dashboard Design", description: "Designing risk visualization — real-time risk monitors, executive dashboards, alerts.", tier: 1, rarity: "Uncommon", score: 150 },
  "risk+biology":      { name: "Pandemic Risk Modeling", description: "Modeling epidemic/pandemic risk — SIR models, insurance pandemic preparedness.", tier: 1, rarity: "Rare", score: 250 },
  "risk+physics":      { name: "Catastrophe Modeling", description: "Physical risk modeling — earthquake, hurricane, flood risk for insurance reinsurance.", tier: 1, rarity: "Rare", score: 250 },
  "defi+blockchain":   { name: "DeFi Protocol Development", description: "Building decentralized exchanges, lending platforms, stablecoins on EVM/Solana.", tier: 1, rarity: "Rare", score: 250 },
  "defi+coding":       { name: "Smart Contract Engineering", description: "Solidity, Rust, Move — writing, testing, deploying decentralized application logic.", tier: 1, rarity: "Rare", score: 250 },
  "defi+math":         { name: "Token Engineering", description: "Designing token economics — bonding curves, inflation schedules, governance mechanisms.", tier: 1, rarity: "Rare", score: 250 },
  "defi+stats":        { name: "DeFi Analytics", description: "Analyzing on-chain data — TVL tracking, protocol metrics, user behavior analytics.", tier: 1, rarity: "Rare", score: 200 },
  "defi+data":         { name: "On-Chain Data Analytics", description: "Blockchain data pipelines, wallet clustering, transaction graph analysis.", tier: 1, rarity: "Rare", score: 200 },
  "defi+ai":           { name: "AI-Powered DeFi Agents", description: "Autonomous AI agents managing DeFi portfolios, optimizing yields, executing strategies.", tier: 2, rarity: "Legendary", score: 550 },
  "defi+cloud":        { name: "Decentralized Cloud Services", description: "Building on Filecoin, Arweave, Akash — decentralized compute, storage, bandwidth.", tier: 1, rarity: "Rare", score: 250 },
  "defi+security":     { name: "DeFi Security Engineering", description: "Securing DeFi protocols — economic audits, oracle manipulation defense, exploit prevention.", tier: 1, rarity: "Epic", score: 350 },
  "defi+strategy":     { name: "Crypto Strategy", description: "Institutional crypto strategy — custody, treasury management, corporate Bitcoin adoption.", tier: 1, rarity: "Rare", score: 200 },
  "defi+marketing":    { name: "Web3 Marketing", description: "Marketing crypto projects — community building, token launches, DAO governance.", tier: 1, rarity: "Uncommon", score: 150 },
  "defi+writing":      { name: "Crypto Research Writing", description: "Writing crypto research — protocol analysis, market reports, whitepaper analysis.", tier: 1, rarity: "Common", score: 100 },
  "defi+design":       { name: "Web3 UX Design", description: "Designing blockchain interfaces — wallet UX, transaction flows, dApp design.", tier: 1, rarity: "Rare", score: 200 },
  "defi+quantum":      { name: "Quantum-Safe DeFi", description: "Building DeFi protocols resistant to quantum attacks — post-quantum smart contracts.", tier: 3, rarity: "Mythic", score: 700 },
  "defi+biology":      { name: "BioToken Economics", description: "Tokenizing biological data — genomic marketplaces, health data tokens, bioethics.", tier: 1, rarity: "Rare", score: 250 },
  "defi+physics":      { name: "Energy Token Trading", description: "Tokenizing energy — renewable energy credits, carbon markets, grid optimization.", tier: 1, rarity: "Rare", score: 200 },

  // ─── FINANCE + TECH ───────────────────────────────────
  "quant+linux":       { name: "Low-Latency Quant Systems", description: "Building ultra-fast quant infrastructure on Linux — kernel bypass, FPGA, nanosecond execution.", tier: 2, rarity: "Epic", score: 400 },
  "quant+devops":      { name: "Quant DevOps", description: "CI/CD for quantitative research — model deployment, backtesting infrastructure, reproducibility.", tier: 1, rarity: "Rare", score: 250 },
  "quant+blockchain":  { name: "Quantitative Tokenomics", description: "Applying quant methods to token design — optimal fee structures, MEV analysis.", tier: 2, rarity: "Epic", score: 350 },
  "quant+quantum":     { name: "Quantum Quantitative Finance", description: "Quantum algorithms for portfolio optimization, derivative pricing, alpha generation.", tier: 3, rarity: "Mythic", score: 800 },
  "trading+security":  { name: "Financial Systems Security", description: "Securing trading platforms — exchange security, payment gateways, fraud prevention.", tier: 1, rarity: "Rare", score: 250 },

  // ─── SCIENCE + SCIENCE ────────────────────────────────
  "math+stats":        { name: "Probability & Statistics", description: "Theoretical and applied statistics — Bayesian inference, hypothesis testing, stochastic processes.", tier: 1, rarity: "Uncommon", score: 150 },
  "math+physics":      { name: "Theoretical Physics", description: "String theory, general relativity, quantum field theory, cosmology.", tier: 1, rarity: "Rare", score: 250 },
  "math+coding":       { name: "Computational Mathematics", description: "Numerical methods, symbolic computation, mathematical software, algorithms.", tier: 1, rarity: "Rare", score: 200 },
  "math+biology":      { name: "Mathematical Biology", description: "Modeling biological systems — population dynamics, epidemiology, neural coding.", tier: 1, rarity: "Rare", score: 200 },
  "math+data":         { name: "Applied Mathematics", description: "Optimization, control theory, signal processing applied to real-world data.", tier: 1, rarity: "Uncommon", score: 150 },
  "math+design":       { name: "Mathematical Design", description: "Geometric design, parametric modeling, fractal geometry, tiling theory in architecture.", tier: 1, rarity: "Rare", score: 200 },
  "math+quantum":      { name: "Quantum Mathematics", description: "Quantum algebra, topological quantum field theory, quantum group theory.", tier: 2, rarity: "Epic", score: 400 },
  "math+blockchain":   { name: "Cryptographic Mathematics", description: "Number theory, elliptic curves, lattice cryptography — math behind blockchain security.", tier: 1, rarity: "Rare", score: 250 },
  "math+trading":      { name: "Financial Mathematics", description: "Stochastic calculus for finance, derivative pricing, risk-neutral valuation.", tier: 1, rarity: "Rare", score: 250 },
  "math+risk":         { name: "Risk Mathematics", description: "Extreme value theory, copulas, tail dependence, multivariate risk modeling.", tier: 1, rarity: "Rare", score: 250 },
  "math+ai":           { name: "Mathematical AI", description: "Optimization theory, linear algebra for ML, convex optimization, information geometry.", tier: 1, rarity: "Rare", score: 250 },
  "math+cloud":        { name: "Distributed Computing Mathematics", description: "Consensus algorithms, distributed systems theory, CAP theorem applications.", tier: 1, rarity: "Rare", score: 200 },
  "math+writing":      { name: "Mathematical Writing", description: "Communicating mathematics — textbooks, research papers, popular math writing.", tier: 1, rarity: "Common", score: 100 },
  "math+marketing":    { name: "Quantitative Marketing", description: "Statistical models for marketing — conjoint analysis, price optimization, market mix models.", tier: 1, rarity: "Rare", score: 200 },
  "math+strategy":     { name: "Operations Research", description: "Optimization for decision-making — linear programming, game theory, logistics optimization.", tier: 1, rarity: "Rare", score: 200 },
  "stats+data":        { name: "Data Science", description: "Statistical learning, exploratory analysis, predictive modeling, data visualization.", tier: 1, rarity: "Rare", score: 200 },
  "stats+biology":     { name: "Biostatistics", description: "Statistical methods in biology — clinical trial design, survival analysis, genomics statistics.", tier: 1, rarity: "Rare", score: 250 },
  "stats+physics":     { name: "Statistical Mechanics", description: "Connecting micro and macro — thermodynamics, phase transitions, entropy.", tier: 1, rarity: "Rare", score: 200 },
  "stats+cloud":       { name: "Cloud-Scale Statistics", description: "Running statistical analyses at scale — distributed computing for large datasets.", tier: 1, rarity: "Rare", score: 200 },
  "stats+ai":          { name: "Statistical Learning Theory", description: "Mathematical foundations of ML — bias-variance, VC dimension, PAC learning.", tier: 1, rarity: "Rare", score: 250 },
  "stats+trading":     { name: "Statistical Arbitrage", description: "Market-neutral strategies using statistical models — pairs trading, factor models.", tier: 1, rarity: "Epic", score: 350 },
  "stats+risk":        { name: "Stochastic Risk Modeling", description: "Monte Carlo simulation, Brownian motion models, jump-diffusion for risk.", tier: 1, rarity: "Rare", score: 250 },
  "stats+blockchain":  { name: "Blockchain Statistical Analysis", description: "Statistical analysis of on-chain data — network metrics, adoption curves, market structure.", tier: 1, rarity: "Rare", score: 200 },
  "stats+defi":        { name: "DeFi Statistical Research", description: "Statistical analysis of DeFi — impermanent loss modeling, yield curve analysis.", tier: 1, rarity: "Rare", score: 200 },
  "stats+design":      { name: "Statistical Visualization", description: "Communicating data through design — statistical graphics, information design, Tufte principles.", tier: 1, rarity: "Uncommon", score: 150 },
  "stats+quantum":     { name: "Quantum Statistics", description: "Bose-Einstein, Fermi-Dirac distributions, quantum probability, many-body statistics.", tier: 2, rarity: "Epic", score: 350 },
  "stats+strategy":    { name: "Evidence-Based Strategy", description: "Data-driven strategic decisions — A/B testing frameworks, metrics-driven management.", tier: 1, rarity: "Uncommon", score: 150 },
  "stats+writing":     { name: "Data Journalism", description: "Telling stories with data — investigative reporting, data visualization, fact-checking.", tier: 1, rarity: "Uncommon", score: 150 },
  "stats+marketing":   { name: "Marketing Analytics", description: "Measuring marketing effectiveness — attribution models, customer lifetime value, cohort analysis.", tier: 1, rarity: "Uncommon", score: 150 },
  "physics+data":      { name: "Experimental Data Science", description: "Analyzing physics experiments — CERN data, telescope data, signal extraction.", tier: 1, rarity: "Rare", score: 200 },
  "physics+biology":   { name: "Biophysics", description: "Physical principles in biology — protein folding, membrane dynamics, molecular motors.", tier: 1, rarity: "Rare", score: 250 },
  "physics+cloud":     { name: "HPC Cloud Computing", description: "High-performance computing on cloud — parallel processing, GPU clusters for physics.", tier: 1, rarity: "Rare", score: 200 },
  "physics+blockchain": { name: "Energy-Blockchain Integration", description: "Using blockchain for energy trading, carbon credits, decentralized power grids.", tier: 1, rarity: "Rare", score: 200 },
  "physics+ai":        { name: "AI for Physics", description: "Using ML to discover physics — particle detection, materials science, cosmology.", tier: 1, rarity: "Rare", score: 250 },
  "physics+design":    { name: "Scientific Visualization", description: "Visualizing complex physical phenomena — 3D rendering, simulation visualization.", tier: 1, rarity: "Rare", score: 200 },
  "physics+strategy":  { name: "Technology Strategy", description: "Evaluating emerging tech — quantum, fusion, materials — for investment and R&D decisions.", tier: 1, rarity: "Uncommon", score: 150 },
  "physics+marketing": { name: "Deep Tech Marketing", description: "Marketing complex technology products — scientific instrumentation, quantum computing products.", tier: 1, rarity: "Uncommon", score: 150 },
  "physics+writing":   { name: "Science Communication", description: "Writing about physics for general audiences — science journalism, popular science books.", tier: 1, rarity: "Common", score: 100 },
  "physics+quantum":   { name: "Quantum Physics Research", description: "Experimental and theoretical quantum physics — entanglement, decoherence, quantum optics.", tier: 2, rarity: "Epic", score: 350 },
  "physics+coding":    { name: "Physics Simulation", description: "Simulating physical systems — molecular dynamics, finite element, computational fluid dynamics.", tier: 1, rarity: "Rare", score: 200 },
  "physics+trading":   { name: "Financial Physics", description: "Applying physics models to finance — percolation, agent-based models, econophysics.", tier: 1, rarity: "Rare", score: 200 },
  "physics+risk":      { name: "Catastrophe Modeling", description: "Physical catastrophe risk — earthquake, hurricane, flood modeling for insurance.", tier: 1, rarity: "Rare", score: 250 },
  "physics+math":      { name: "Mathematical Physics", description: "Rigorous mathematical treatment of physical theories — topology, geometry in physics.", tier: 1, rarity: "Rare", score: 250 },
  "physics+defi":      { name: "Energy Token Markets", description: "Decentralized energy trading — renewable energy credits, peer-to-peer power markets.", tier: 1, rarity: "Rare", score: 200 },
  "biology+data":      { name: "Bioinformatics", description: "Computational genomics — sequence alignment, variant calling, gene expression analysis.", tier: 1, rarity: "Rare", score: 250 },
  "biology+coding":    { name: "Computational Biology", description: "Building software for biology — protein structure prediction, molecular modeling tools.", tier: 1, rarity: "Rare", score: 250 },
  "biology+ai":        { name: "AI Drug Discovery", description: "Using ML for pharmaceutical R&D — molecular generation, clinical trial optimization.", tier: 1, rarity: "Rare", score: 250 },
  "biology+cloud":     { name: "Genomics Cloud Platform", description: "Cloud infrastructure for genomic data — GATK on AWS, Terra, DNAnexus.", tier: 1, rarity: "Rare", score: 200 },
  "biology+blockchain": { name: "Health Data Blockchain", description: "Decentralized health records — patient-controlled data, medical research data sharing.", tier: 1, rarity: "Rare", score: 200 },
  "biology+quantum":   { name: "Quantum Biology", description: "Quantum effects in living systems — photosynthesis, enzyme tunneling, olfaction.", tier: 2, rarity: "Epic", score: 400 },
  "biology+math":      { name: "Mathematical Biology", description: "Modeling biological systems — ODE models, systems biology, neural network models.", tier: 1, rarity: "Rare", score: 200 },
  "biology+stats":     { name: "Epidemiology", description: "Statistical modeling of disease spread — SIR models, contact tracing, public health data.", tier: 1, rarity: "Rare", score: 250 },
  "biology+risk":      { name: "Pandemic Preparedness", description: "Modeling biological risks — outbreak prediction, vaccine logistics, health system resilience.", tier: 1, rarity: "Rare", score: 250 },
  "biology+trading":   { name: "Biotech Investment Analysis", description: "Evaluating biotech companies — drug pipeline valuation, clinical trial analysis.", tier: 1, rarity: "Uncommon", score: 150 },
  "biology+strategy":  { name: "Biotech Strategy", description: "Life sciences corporate strategy — licensing, partnerships, portfolio prioritization.", tier: 1, rarity: "Rare", score: 200 },
  "biology+writing":   { name: "Science Writing", description: "Communicating biology — journal papers, grant writing, science journalism.", tier: 1, rarity: "Common", score: 100 },
  "biology+marketing": { name: "Biotech Marketing", description: "Marketing life sciences products — pharmaceutical marketing, medical device marketing.", tier: 1, rarity: "Uncommon", score: 150 },
  "biology+design":    { name: "Scientific Illustration", description: "Visualizing biological structures — medical illustration, molecular visualization, anatomical art.", tier: 1, rarity: "Uncommon", score: 150 },
  "biology+defi":      { name: "BioData Marketplaces", description: "Decentralized markets for biological data — genomic data trading, research data tokens.", tier: 1, rarity: "Rare", score: 200 },
  "biology+linux":     { name: "Bioinformatics on Linux", description: "Running bioinformatics pipelines on Linux — BLAST, GATK, Nextflow, HPC clusters.", tier: 1, rarity: "Rare", score: 200 },
  "biology+devops":    { name: "BioDevOps", description: "Reproducible bioinformatics — workflow automation, containerized analysis, data management.", tier: 1, rarity: "Rare", score: 200 },
  "biology+security":  { name: "Biosafety & Biosecurity", description: "Securing biological research — dual-use research oversight, pathogen data security.", tier: 1, rarity: "Rare", score: 200 },
  "biology+physics":   { name: "Biophysics", description: "Physical mechanisms in biology — molecular dynamics, structural biology, biomechanics.", tier: 1, rarity: "Rare", score: 250 },

  // ─── CREATIVE ─────────────────────────────────────────
  "design+writing":    { name: "Content Design", description: "UX writing, content strategy, information architecture — designing the words users see.", tier: 1, rarity: "Uncommon", score: 100 },
  "design+ai":         { name: "AI Design Tools", description: "Using AI for design — Midjourney, Figma AI, generative UI, automated design systems.", tier: 1, rarity: "Rare", score: 200 },
  "design+coding":     { name: "Frontend Engineering", description: "Building interfaces — React, CSS architecture, animation, responsive design systems.", tier: 1, rarity: "Uncommon", score: 150 },
  "design+strategy":   { name: "UX Strategy", description: "User experience strategy — research, personas, journey mapping, design thinking.", tier: 1, rarity: "Uncommon", score: 150 },
  "design+data":       { name: "Data Visualization", description: "Visualizing complex data — D3.js, Tableau dashboards, interactive infographics.", tier: 1, rarity: "Rare", score: 200 },
  "design+blockchain": { name: "Web3 Design", description: "Designing blockchain interfaces — wallet UX, dApp design, NFT marketplace design.", tier: 1, rarity: "Rare", score: 200 },
  "design+cloud":      { name: "Design Systems Engineering", description: "Building scalable design systems — component libraries, tokens, design-to-code pipelines.", tier: 1, rarity: "Rare", score: 200 },
  "design+marketing":  { name: "Brand Design", description: "Visual brand identity — logos, brand guidelines, marketing collateral, brand systems.", tier: 1, rarity: "Uncommon", score: 150 },
  "design+security":   { name: "Security UX Design", description: "Designing security interfaces — authentication flows, privacy dashboards, consent UX.", tier: 1, rarity: "Rare", score: 200 },
  "design+quantum":    { name: "Quantum Computing UX", description: "Designing interfaces for quantum computing — circuit builders, result visualization.", tier: 2, rarity: "Epic", score: 350 },
  "design+physics":    { name: "Scientific Visualization", description: "Visualizing physical phenomena — 3D rendering, simulation visualization, VR physics.", tier: 1, rarity: "Rare", score: 200 },
  "design+biology":    { name: "Medical Illustration", description: "Visualizing biological and medical structures — anatomical art, surgical planning tools.", tier: 1, rarity: "Rare", score: 200 },
  "design+trading":    { name: "Financial Dashboard Design", description: "Designing trading interfaces — real-time charts, portfolio dashboards, risk monitors.", tier: 1, rarity: "Rare", score: 200 },
  "design+risk":       { name: "Risk Visualization", description: "Visualizing risk — heat maps, stress test results, scenario analysis dashboards.", tier: 1, rarity: "Uncommon", score: 150 },
  "design+math":       { name: "Generative Art", description: "Algorithmic art — Processing, TouchDesigner, mathematical art, fractal visualization.", tier: 1, rarity: "Rare", score: 200 },
  "design+defi":       { name: "DeFi Interface Design", description: "Designing DeFi experiences — swap interfaces, yield dashboards, protocol UI.", tier: 1, rarity: "Rare", score: 200 },
  "design+linux":      { name: "Linux Desktop Design", description: "Designing Linux desktop environments — GTK, Qt themes, terminal UIs, tiling WM aesthetics.", tier: 1, rarity: "Uncommon", score: 150 },
  "design+devops":     { name: "Developer Experience Design", description: "Designing tools for developers — CLI UX, API design, documentation, onboarding flows.", tier: 1, rarity: "Rare", score: 200 },
  "design+stats":      { name: "Information Design", description: "Presenting information clearly — Edward Tufte principles, chart design, data journalism graphics.", tier: 1, rarity: "Rare", score: 200 },
  "writing+marketing": { name: "Content Marketing", description: "Creating valuable content to attract audiences — blogs, whitepapers, case studies, newsletters.", tier: 1, rarity: "Uncommon", score: 100 },
  "writing+strategy":  { name: "Communication Strategy", description: "Strategic messaging — executive communications, crisis comms, internal communications.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+ai":        { name: "AI Writing Tools", description: "LLM-powered writing — prompt engineering, AI content, automated copywriting, AI editing.", tier: 1, rarity: "Rare", score: 200 },
  "writing+data":      { name: "Data Storytelling", description: "Narrative data analysis — business reporting, research papers, analytics dashboards.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+blockchain": { name: "Crypto Research Writing", description: "Writing protocol analysis, token research, market commentary for crypto.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+cloud":     { name: "Technical Writing", description: "Documentation engineering — API docs, tutorials, technical content, knowledge bases.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+security":  { name: "Security Documentation", description: "Writing security policies, incident reports, compliance documentation, playbooks.", tier: 1, rarity: "Common", score: 100 },
  "writing+trading":   { name: "Financial Writing", description: "Market commentary, investment memos, earnings analysis, financial newsletters.", tier: 1, rarity: "Common", score: 100 },
  "writing+risk":      { name: "Risk Communication", description: "Communicating risk to stakeholders — board reports, regulatory filings, risk summaries.", tier: 1, rarity: "Common", score: 100 },
  "writing+quant":     { name: "Quantitative Research Writing", description: "Writing quant research — alpha signals, factor reports, strategy whitepapers.", tier: 1, rarity: "Rare", score: 200 },
  "writing+physics":   { name: "Science Communication", description: "Making physics accessible — popular science, science journalism, TED-style explanations.", tier: 1, rarity: "Common", score: 100 },
  "writing+biology":   { name: "Medical Writing", description: "Regulatory submissions, clinical study reports, medical communications.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+math":      { name: "Mathematical Communication", description: "Writing about mathematics — textbooks, research papers, popular math exposition.", tier: 1, rarity: "Common", score: 100 },
  "writing+stats":     { name: "Statistical Reporting", description: "Reporting statistical findings — clinical trial results, survey analysis, research summaries.", tier: 1, rarity: "Common", score: 100 },
  "writing+defi":      { name: "DeFi Content Strategy", description: "Creating educational content for DeFi — tutorials, governance proposals, protocol docs.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+design":    { name: "Editorial Design", description: "Combining words and visuals — magazine layout, book design, newsletter design.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+quantum":   { name: "Quantum Science Writing", description: "Explaining quantum computing to audiences — popular science, technical communication.", tier: 1, rarity: "Rare", score: 200 },
  "writing+devops":    { name: "Developer Relations", description: "Technical community building — blog posts, conference talks, developer advocacy.", tier: 1, rarity: "Uncommon", score: 150 },
  "writing+linux":     { name: "Open Source Documentation", description: "Writing docs for open source — READMEs, wikis, contribution guides, man pages.", tier: 1, rarity: "Common", score: 100 },

  // ─── BUSINESS ─────────────────────────────────────────
  "strategy+marketing": { name: "Growth Strategy", description: "Product-led growth, market positioning, competitive analysis, go-to-market strategy.", tier: 1, rarity: "Uncommon", score: 150 },
  "strategy+data":     { name: "Business Intelligence", description: "Turning data into business decisions — KPIs, dashboards, executive reporting.", tier: 1, rarity: "Uncommon", score: 150 },
  "strategy+ai":       { name: "AI Strategy", description: "Enterprise AI adoption — use case identification, build vs buy, AI governance, ROI measurement.", tier: 1, rarity: "Rare", score: 250 },
  "strategy+cloud":    { name: "Cloud Strategy", description: "Enterprise cloud adoption — migration planning, cost optimization, multi-cloud governance.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+coding":   { name: "Technical Architecture", description: "System design decisions — microservices vs monolith, API design, scalability trade-offs.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+security": { name: "Security Strategy", description: "Enterprise security posture — security architecture, compliance strategy, zero-trust adoption.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+devops":   { name: "Engineering Management", description: "Leading engineering teams — process design, delivery strategy, team scaling, tech debt.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+linux":    { name: "Open Source Strategy", description: "Corporate open source — OSS licensing, community strategy, open source business models.", tier: 1, rarity: "Uncommon", score: 150 },
  "strategy+blockchain": { name: "Blockchain Business Strategy", description: "Enterprise blockchain adoption — use case evaluation, token strategy, consortium governance.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+quantum":  { name: "Quantum Strategy", description: "Quantum readiness planning — identifying quantum use cases, vendor evaluation, roadmap.", tier: 2, rarity: "Epic", score: 350 },
  "strategy+physics":  { name: "Deep Tech Strategy", description: "Evaluating and commercializing deep tech — R&D prioritization, tech transfer, IP strategy.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+biology":  { name: "Biotech Strategy", description: "Life sciences business strategy — drug pipeline decisions, licensing deals, market access.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+trading":  { name: "Trading Business Strategy", description: "Building a trading business — fund setup, compliance, investor relations, operational strategy.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+risk":     { name: "Enterprise Risk Strategy", description: "Board-level risk management — risk appetite, governance frameworks, crisis response.", tier: 1, rarity: "Uncommon", score: 150 },
  "strategy+quant":    { name: "Quant Strategy Design", description: "Designing and managing quantitative hedge funds — alpha research, risk budgeting, allocation.", tier: 2, rarity: "Epic", score: 350 },
  "strategy+defi":     { name: "DeFi Business Strategy", description: "Building sustainable DeFi — protocol economics, governance, sustainable yield strategies.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+math":     { name: "Operations Research", description: "Mathematical optimization for business — supply chain, logistics, scheduling, allocation.", tier: 1, rarity: "Rare", score: 200 },
  "strategy+stats":    { name: "Evidence-Based Management", description: "Data-driven business decisions — metrics frameworks, A/B testing culture, OKRs.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+data":    { name: "Marketing Analytics", description: "Measuring marketing ROI — attribution, CAC/LTV, cohort analysis, funnel optimization.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+ai":      { name: "AI-Powered Marketing", description: "AI in marketing — personalized campaigns, predictive lead scoring, automated content.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+cloud":   { name: "MarTech Engineering", description: "Marketing technology stack — CDP, automation platforms, analytics infrastructure.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+blockchain": { name: "Web3 Marketing", description: "Marketing in crypto — community building, token launches, DAO governance marketing.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+security": { name: "Brand Security", description: "Protecting brand online — takedown fraud, domain security, brand reputation management.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+coding":  { name: "Growth Engineering", description: "Technical growth — A/B testing infrastructure, referral systems, analytics tracking.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+devops":  { name: "Marketing Operations", description: "Automating marketing — campaign automation, lead routing, marketing pipelines.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+linux":   { name: "Developer Marketing", description: "Marketing to developers — technical content, open source community, developer conferences.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+trading": { name: "Financial Product Marketing", description: "Marketing trading platforms, investment products, fintech apps.", tier: 1, rarity: "Common", score: 100 },
  "marketing+risk":    { name: "Compliance Marketing", description: "Marketing within regulatory constraints — financial services marketing, regulated industries.", tier: 1, rarity: "Common", score: 100 },
  "marketing+quant":   { name: "Quantitative Marketing Science", description: "Statistical models for marketing — demand estimation, price optimization, market simulation.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+quantum": { name: "Quantum Technology Marketing", description: "Marketing quantum products — positioning, GTM for emerging technology.", tier: 2, rarity: "Rare", score: 250 },
  "marketing+physics": { name: "Deep Tech Marketing", description: "Marketing scientific instruments, lab equipment, research tools, emerging tech products.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+biology": { name: "Life Sciences Marketing", description: "Marketing pharmaceutical, biotech, medical devices — HCP marketing, patient marketing.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+math":    { name: "Pricing Strategy", description: "Mathematical pricing optimization — dynamic pricing, price elasticity, competitive pricing models.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+stats":   { name: "Marketing Science", description: "Scientific approach to marketing — MMM, incrementality testing, media mix modeling.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+design":  { name: "Brand Design", description: "Visual identity systems — logos, guidelines, campaigns, brand touchpoints.", tier: 1, rarity: "Uncommon", score: 150 },
  "marketing+writing": { name: "Copywriting", description: "Persuasive writing for business — ad copy, landing pages, email campaigns, taglines.", tier: 1, rarity: "Common", score: 100 },
  "marketing+defi":    { name: "DeFi Growth Marketing", description: "Growing DeFi protocols — TVL acquisition, community incentives, launch strategy.", tier: 1, rarity: "Rare", score: 200 },
  "marketing+strategy": { name: "Corporate Strategy", description: "Long-range planning — M&A, market entry, competitive positioning, growth planning.", tier: 1, rarity: "Uncommon", score: 150 },
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
  const [hoveredDiscovery, setHoveredDiscovery] = useState<string | null>(null);
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
            Drag two skills together to discover a real, existing field. Every combination maps to a genuine career path.
            How many can you find?
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
          <div className="text-center mb-3">
            <div className="inline-flex flex-col items-center gap-1 px-6 py-3 rounded-2xl border text-sm animate-pulse"
              style={{ backgroundColor: rgba(RARITY_COLORS[fusionMsg.rarity] || "#10b981", 0.12), borderColor: rgba(RARITY_COLORS[fusionMsg.rarity] || "#10b981", 0.35) }}>
              <div className="flex items-center gap-2 font-bold" style={{ color: RARITY_COLORS[fusionMsg.rarity] || "#10b981" }}>
                <Zap size={16} />
                {fusionMsg.rarity}: {fusionMsg.name}
                <span className="ml-1 opacity-70">+{fusionMsg.score}</span>
              </div>
              {fusionMsg.description && (
                <p className="text-xs text-slate-400 max-w-md text-center">{fusionMsg.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Discovery Journal */}
        {showJournal && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-800/90 border border-slate-700/50 backdrop-blur-sm max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Discovery Journal ({totalDiscovered} / {totalPossible})</h3>
              <button onClick={() => setShowJournal(false)} className="text-slate-500 hover:text-white cursor-pointer"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {discovered.length === 0 && (
                <p className="text-slate-500 text-xs col-span-full text-center py-4">No discoveries yet. Click skills from the palette, then drag them together!</p>
              )}
              {[...discovered].reverse().map((d) => (
                <div key={d.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30 text-xs cursor-pointer hover:border-slate-600/50 transition-all"
                  onMouseEnter={() => setHoveredDiscovery(d.id)} onMouseLeave={() => setHoveredDiscovery(null)}>
                  <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: RARITY_COLORS[d.rarity] }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-slate-400 capitalize">{d.a}</span>
                      <span className="text-slate-600">+</span>
                      <span className="text-slate-400 capitalize">{d.b}</span>
                    </div>
                    <div className="font-bold mt-0.5" style={{ color: RARITY_COLORS[d.rarity] }}>{d.result}</div>
                    {hoveredDiscovery === d.id && d.description && (
                      <p className="text-slate-500 text-[10px] mt-1 leading-relaxed">{d.description}</p>
                    )}
                  </div>
                  <span className="text-amber-400/70 font-mono shrink-0">+{d.score}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-700/30">
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
