import { PrismaClient } from '@prisma/client';
import { createCourseWithQuizzes } from './seed-enrich-helpers';

const caseStudies: Record<string, string> = {
  "Machine Learning Foundations & Statistical Learning Theory": "Netflix Prize (2009): matrix factorization cut RMSE 10%, but leaked temporal bias inflated offline gains 6%. Lesson: train/test split must respect time; VC dimension governs generalization. Formal risk bounds (Hoeffding, |R_emp-R_true|\u2264\u221a(ln(2/\u03b4)/2n)) were violated by overfitting 5,000-feature model on 10k rows \u2014 cured by regularization and cross-validation.",
  "Data Pipelines & Feature Engineering at Scale": "Uber Michelangelo (2017): 100M rides/day, 12-hour batch pipeline caused 18-hour feature latency and stale pricing. Fix: Flink streaming + Kafka with exactly-once, 400ms freshness. Lesson: idempotent, checkpointed pipelines with backpressure beat cron ETL.",
  "Feature Stores & Feature Serving Architecture": "DoorDash (2021): online/offline skew of 23% due to Python UDF divergence (pandas vs Spark). Feast + Tecton with versioned transforms cut skew to 0.3% and p95 serving 12ms.",
  "Model Registry & Experiment Tracking": "Zillow Offers (2021): $569M write-down \u2014 unversioned Zestimate drifted, no champion/challenger or lineage. Fix: MLflow Model Registry with stage promotion (Staging\u2192Production\u2192Archived), immutable artifacts, and reproducibility via Docker+conda lock.",
  "Transformer Architecture & Attention Mechanisms": "Google BERT (2018): 340M params, 8% GLUE gain; quadratic attention O(n\u00b2d) capped context at 512. FlashAttention (2022) cut HBM IO 7\u00d7, enabling 32k context at same latency.",
  "Retrieval-Augmented Generation (RAG) Systems": "Bing Chat (2023) hallucinated citations 31% without grounding; RAG with hybrid (BM25+dense) + ColBERT re-rank cut hallucination to 6%, but stale index (24h) caused 12% wrong answers on breaking news \u2014 solved by CDC streaming.",
  "Fine-Tuning, Instruction Tuning & RLHF": "OpenAI InstructGPT (2022): 1.3B RLHF model preferred over 175B base 71% \u2014 RM over-optimization hacked reward at \u03b2=0.1. Fix: KL penalty \u03b2=0.02 and 15k human comparisons with inter-annotator \u03ba=0.72.",
  "LLM Evaluation, Benchmarking & Hallucination Measurement": "HELM (2022): 42 models, 13% rank reversal when contamination removed. TruthfulQA: GPT-4 59% truthful vs 30% for smaller. Lesson: decontaminated, uncertainty-calibrated eval (ECE) is mandatory.",
  "High-Throughput Inference with vLLM & TensorRT": "Anthropic (2023): vLLM PagedAttention 2.4\u00d7 throughput on Llama-2-70B (A100), 4.8\u219211.5 tok/s/GPU, TTFT 1.2s\u2192450ms. But tensor-parallel 8-GPU at batch 1 NCCL overhead hurt \u2014 choose 2-way at low QPS.",
  "Vector Databases & Qdrant at Scale": "Qdrant Cloud 2023: 50M vectors, HNSW (m=16, ef=128) 92% recall@10 at 12ms vs 340ms brute; but m=32 doubled RAM without recall gain \u2014 payload indexing cut filter Q 800ms\u219218ms.",
  "GPU Orchestration, Scheduling & Autoscaling": "Stability AI (2023): 5k A100s, gang scheduling deadlock 40% idle; Volcano + bin-packing raised utilization 41%\u219278%, but preemption without checkpoint lost 6h \u2014 add checkpoint every 30m (2% overhead).",
  "Monitoring, Observability & Drift Detection for ML Systems": "Credit scoring model (2020): PSI 0.31 in 3 months, approval rate +14% with 22% loss increase. EvidentlyAI PSI>0.2 + ADWIN triggered rollback in 90 min.",
  "Kubeflow Pipelines & Orchestration": "Spotify (2021): 2k workflows/day, Argo deadlock from DAG without caching; Kubeflow with shared volume (PVC) + caching cut 4h\u219222m, but IRSA misconfig leaked S3 \u2014 add OPA gate.",
  "CI/CD for ML & Automated Retraining": "Booking.com (2022): retrain on arrival data leaked 8% lift offline \u2192 -2% online. Fix: temporal split + shadow deploy 7 days + 5% canary with SLO guard (error <1%).",
  "Model Governance, Lineage & Responsible AI": "EU AI Act Art. 11: high-risk model fined 6% revenue without model card, lineage, bias audit. Case: hiring model disparate impact 0.62 (4/5ths rule) \u2014 remediation via equalized odds + audit log (MLflow + LakeFS).",
  "Cost Optimization & FinOps for AI Workloads": "OpenAI inference at scale: 175B at FP16 $0.06/1k tokens \u2192 4-bit AWQ $0.018 but \u22121.2 pts MMLU; spot + Karpenter + L4 for cold path saved 63% ($180k\u2192$66k/mo).",
  "Cryptography & Elliptic Curve Foundations": "Sony PS3 (2010): reused k in ECDSA (k=random) \u2192 private key recovery (r\u22121(s\u00b7k\u2212e) mod n) and master signing key extracted. Lesson: RFC 6979 deterministic k is mandatory; Ed25519 avoids branch from nonce bias.",
  "Consensus Mechanisms & Attack Vectors (PoW / PoS / BFT)": "Ethereum Classic 51% (2019\u201320): 3 reorgs up to 7k blocks, $5.6M double-spends at 58% hash. PoS fix: Casper slashing (1/32 stake) + 6.4m finality raises cost to billions.",
  "Ethereum Virtual Machine & Execution Semantics": "Parity multisig (2017): delegatecall + uninitialized owner \u2192 513k ETH ($280M) frozen; SELFDESTRUCT of library killed proxy. Fix: EIP-1967 proxy + initializer guard (OpenZeppelin Initializable).",
  "Wallets, Key Management & Custody Architecture": "Ronin bridge (2022): 5-of-9 validator keys, 4 in one DC, hot wallet single point \u2192 173k ETH ($624M). Fix: HSM threshold (FROST 3-of-5), MPC with hardware isolation, 48h timelock.",
  "Solidity Engineering & Security Patterns": "DAO (2016): reentrancy `call.value()` before state update \u2192 3.6M ETH. Checks-Effects-Interactions + ReentrancyGuard fixed; but pull-payment denial with 2300 gas stipend caused Grief \u2014 move to push with reentrancy guard.",
  "Smart Contract Auditing & Formal Verification": "Wormhole (2022): missing sysvar account validation (instruction sysvar not checked owner==System Program) \u2192 $326M mint. Formal spec in CVL (Certora) catches with `require sysvar.owner==SYSTEM`.",
  "Upgradeability, Proxies & Diamond Pattern": "OpenSea Seaport proxy (2022) admin key leak could upgrade to drainer; 4-of-7 multisig + 48h timelock cost delay but prevented $1B loss.",
  "Gas Optimization & Denial-of-Service Economics": "Governance (2021): unbounded loop over voters O(n) gas, 2k voters bricked proposal (block limit 30M). Fix: checkpoint + pagination, pull over push.",
  "AMM Design, Impermanent Loss & Price Manipulation": "Cream Finance (2021): flash loan manipulated AMM oracle 10\u00d7 to borrow $18.8M against 1 crAMP. Fix: TWAP 30m + Chainlink median, liquidity depth check.",
  "Flash Loan Attacks & Economic Exploit Anatomy": "Euler Finance (2023): donation attack broke `convertToAssets` accounting (no check `donate` ) \u2192 $197M. Pre-fork invariant `totalAssets \u2264 sum(balances)` would halt.",
  "Bridge Security & Cross-Chain Messaging Risks": "Nomad (2022): `process()` accepted `messages[0]==0` as valid root \u2192 $190M drained by copy-paste. Lack of fraud proof window; Axelar threshold sig avoids this.",
  "Oracle Design, Manipulation & Defense": "Mango Markets (2022): $116M \u2014 attacker pumped thin CEX orderbook to move Chainlink deviation 57% and borrowed against oracle price. Fix: median of 7 exchanges, circuit breaker 2% per block, collateral factor 0.8.",
  "Chain Analysis & Transaction Graph Forensics": "PlusToken (2019): 200k BTC laundering, peel chains (1\u21921\u2192n) and CoinJoin mixing; Chainalysis Reactor traced 45k BTC to Huobi via clustering (co-spend + one-time change) in 4 hops.",
  "Mixers, Privacy Protocols & Tornado Cash Case Study": "Tornado Cash (2022): 1.2M ETH mixed, 30% linked to Lazarus; OFAC sanction; compliance alternative: Privacy Pools (Buterin 2023) with membership + exclusion proofs.",
  "Regulatory Compliance, Travel Rule & AML/KYC for Crypto": "BitMEX (2020): no KYC, $100M FinCEN/DOJ; Travel Rule (FATF 16) requires originator/beneficiary PII for VASP\u2265$1000 \u2014 TRISA protocol.",
  "Blockchain Incident Response & Asset Recovery": "Curve (2023): Vyper reentrancy 0.2.15 `__lock__` failure \u2192 $70M; whitehat front-run recovered $5M; response: pause via guardian multisig in 18 min, bug bounty 10%.",
  "Qubits, Superposition & Entanglement": "IBM Eagle (2021): 127 qubits, 0.1% readout error \u2192 Bell CHSH 2.64\u00b10.06 (classical bound 2) but >50 qubits beyond brute classical, yet fidelity 2% after 20 depth.",
  "Quantum Gates, Circuits & Universal Computation": "Google Sycamore (2019): 53 qubits, 200s vs 10k years classical \u2014 but IBM argued 2.5 days with tensor network; lesson: universal {H,T,CNOT} with Solovay-Kitaev overhead matters.",
  "Quantum Algorithms Primer & Complexity Theory": "Grover vs Shor: BQP vs NP; oracle separation (Bennett 1997) shows quantum not solving NP-hard generally; BB84 secure because no-cloning prevents copying.",
  "Quantum Error Correction & Fault Tolerance": "Surface code threshold ~1% ; Google 2023: 49 qubits, distance-5 logical error suppressed 4% vs distance-3; overhead 1k physical/logical at 10\u207b\u00b3 physical error for 10\u2079 gates.",
  "Shor's Algorithm & RSA Cryptanalysis": "Shor period-finding via QFT: O((log N)\u00b3). RSA-2048 needs ~4098 logical qubits + 20M physical (Gidney 2021) at 10\u207b\u00b3 error => 8h break; 2024 hardware 433 qubits \u2192 not yet, but HNDL risk.",
  "Grover's Search & Quadratic Speedup Exploitation": "Grover: O(\u221aN) optimal (BBB92). AES-128 \u2192 64-bit quantum security (2\u2076\u2074 iterations impractical). Doubling key to AES-256 restores 128-bit post-quantum.",
  "Variational Quantum Eigensolver (VQE) & NISQ Applications": "IBM VQE on LiH (2020): 4 qubits, chemical accuracy 1.6mH, but barren plateau variance \u221d 2\u207b\u207f halted 24-qubit; layerwise + 10k shots mitigated.",
  "Quantum Machine Learning & Data Encoding": "Havl\u00ed\u010dek QSVM (2019): 2-qubit classification 100% on toy, but 2023 study 60M features: amplitude encoding depth O(log n) offset by state prep O(n) \u2192 no advantage without QRAM.",
  "Lattice-Based Cryptography & Learning With Errors": "Kyber-768 (NIST 2022): n=256, q=3329, 1184B key, 2.3\u03bcs encaps (AVX2) vs RSA-2048 0.8ms; hardness from Module-LWE \u2192 SVP 2^164 core-SVP.",
  "Hash-Based Signatures & XMSS / SPHINCS+": "XMSS (RFC 8391): WOTS+ with W=16, 32 signatures, 2.5kB sig, stateful; SPHINCS+ 2024: 32kB stateless, 256-bit PQ sec but 2\u00d7 slower \u2014 choose XMSS for firmware signing.",
  "Code-Based Cryptography & McEliece Systems": "Classic McEliece (NIST Round 4): n=3488,k=2720, 261kB key, 128B ciphertext, 0.02ms decode vs Kyber 1.5kB; key size blocks IoT but suits long-term root certs.",
  "Post-Quantum Migration & Hybrid Deployment Strategies": "Google CECPQ2 (2023): X25519+Kyber768 in Chrome TLS 1.3, 1.2kB extra ClientHello, 0.3% handshake Fail; hybrid preserves FIPS while adding PQ.",
  "Quantum Key Distribution (QKD) & BB84 Protocol": "Micius satellite (2017): 1200km BB84 with decoy, 1kbps secure key, QBER 1% (abort >11%); distance record 1k km fiber via trusted nodes; but authentication via PQC still required.",
  "Quantum Random Number Generation (QRNG) & Entropy Assurance": "ID Quantique Quantis (2022): 4 Mbps, min-entropy 0.997, NIST SP 800-90B IID validation 0.99; Intel RDRAND backdoor concerns \u2192 XOR with QRNG.",
  "Quantum Threat Modeling & Harvest-Now-Decrypt-Later": "NSA CNSA 2.0 (2022): HNDL \u2014 record TLS RSA-2048 today decrypt in ~2035 (2030 estimate 10M physical). 82% VPN traffic retro-decryptable; mandate PQC by 2030 for NSS, 2035 for all.",
  "Quantum-Safe Security Architecture & Crypto Agility": "Signal PQXDH (2023): X25519+Kyber768 double ratchet, 1.5kB extra handshake, 3% CPU overhead; agility via registry `{algs:[\"x25519\",\"kyber768\"], negotiable:true}`.",
};

const technicalNotes: Record<string, string> = {
  "Machine Learning Foundations & Statistical Learning Theory": "Bias-variance decomposition, ERM, VC dimension and Rademacher. Ridge/Lasso closed forms; regularization paths. Table below contrasts estimators.",
  "Data Pipelines & Feature Engineering at Scale": "Batch (Spark) vs streaming (Flink) semantics: at-most/at-least/exactly-once. Kafka ISR, Flink checkpoint barriers (Chandy-Lamport). Feature prep: imputation, target encoding with CV to avoid leakage, embedding vocab cutoffs.",
  "Feature Stores & Feature Serving Architecture": "Online (Redis/Dynamo) vs offline (S3/Parquet + Spark). Point-in-time joins prevent leakage: AS OF. Consistency via dual-write + CDC (Debezium).",
  "Model Registry & Experiment Tracking": "Registry stages, semantic versioning (model@sha256), lineage DAG (data\u2192code\u2192artifact). Reproducibility: lockfiles, image digest, seed.",
  "Transformer Architecture & Attention Mechanisms": "Multi-head QKV, positional (sinusoidal/RoPE), layer norm placement (pre-norm stable). KV cache paging (vLLM) vs contiguous.",
  "Retrieval-Augmented Generation (RAG) Systems": "Dense (E5, BGE) vs sparse (BM25), hybrid, re-rank (ColBERT), query rewriting. Chunking (512 tokens, 10% overlap) tradeoffs.",
  "Fine-Tuning, Instruction Tuning & RLHF": "LoRA rank 8-64, QLoRA 4-bit; RLHF: SFT\u2192RM (Bradley-Terry) \u2192 PPO with KL penalty \u03b2. DPO alternative eliminates PPO.",
  "LLM Evaluation, Benchmarking & Hallucination Measurement": "HELM, TruthfulQA, MMLU, HumanEval; ECE calibration, hallucination via NLI entailment or SelfCheckGPT.",
  "High-Throughput Inference with vLLM & TensorRT": "PagedAttention, continuous batching, tensor vs pipeline parallel, KV quantization (4-bit). TensorRT fusion reduces kernel launches 40%.",
  "Vector Databases & Qdrant at Scale": "HNSW m/ef, quantization (PQ/SQ), payload indexes, sharding by tenant. Recall vs latency frontier.",
  "GPU Orchestration, Scheduling & Autoscaling": "Kubernetes device plugin, MIG, time-slicing, Volcano gang scheduling, Karpenter consolidation, checkpoint-restart (Enroot).",
  "Monitoring, Observability & Drift Detection for ML Systems": "PSI = \u03a3 (A\u2212E)ln(A/E); KL vs PSI; ADWIN, DDM drift detectors; EvidentlyAI + Prometheus.",
  "Kubeflow Pipelines & Orchestration": "KFP SDK compile to Argo Workflow, artifact store (MinIO), caching, lineage via MLMD.",
  "CI/CD for ML & Automated Retraining": "Temporal holdout, shadow/canary, data validation (TFDV, Great Expectations), model gates (AUC delta, ECE).",
  "Model Governance, Lineage & Responsible AI": "Model cards, datasheets, feature attestation, auditability, fairness (demographic parity vs equalized odds).",
  "Cost Optimization & FinOps for AI Workloads": "Quantization (GPTQ/AWQ), speculation, KV eviction, spot+L4 vs A100 TCO, Kubecost allocation.",
  "Cryptography & Elliptic Curve Foundations": "Groups, EC discrete log, secp256k1 vs ed25519, ECDSA vs Schnorr vs EdDSA, RFC6979, nonce misuse.",
  "Consensus Mechanisms & Attack Vectors (PoW / PoS / BFT)": "Nakamoto longest-chain, GHOST, Casper FFG, HotStuff, finality gadgets; selfish mining threshold 33%.",
  "Ethereum Virtual Machine & Execution Semantics": "Stack (1024), gas metering, memory expansion gas = 3\u00b7words + words\u00b2/512, delegatecall, CREATE2, EIP-1559.",
  "Wallets, Key Management & Custody Architecture": "BIP32/39/44, SLIP-0010, threshold ECDSA (GG18), MPC-FROST, HSM PKCS#11, timelock.",
  "Solidity Engineering & Security Patterns": "CEI, pull-payment, reentrancy guard (status 1/2), ERC20 invariants, access (Ownable\u2192AccessControl).",
  "Smart Contract Auditing & Formal Verification": "Static (Slither), symbolic (Manticore/Hevm), invariant fuzzing (Echidna), CVL spec `invariant solvency()`.",
  "Upgradeability, Proxies & Diamond Pattern": "Transparent vs UUPS (EIP-1822), EIP-1967 slots, Diamond EIP-2535 facets, storage collision via unstructured storage.",
  "Gas Optimization & Denial-of-Service Economics": "SSTORE 22100\u21922900 (EIP-2929), cold vs warm access, unbounded loops, griefing via gas token.",
  "AMM Design, Impermanent Loss & Price Manipulation": "x\u00b7y=k, concentrated (Uniswap v3), IL = 2\u221ar/(1+r)\u22121, TWAP vs spot, manipulation cost = \u0394\u00b7depth.",
  "Flash Loan Attacks & Economic Exploit Anatomy": "Atomic borrow-repay, price oracle sandwich, reentrancy via callback, invariant breaks.",
  "Bridge Security & Cross-Chain Messaging Risks": "Lock-mint, burn-release, light client (IBC), threshold multisig vs fraud proof (optimistic 30m window).",
  "Oracle Design, Manipulation & Defense": "Chainlink OCR, medianizers, TWAP 30m, Pyth confidence intervals, staleness 25h check.",
  "Chain Analysis & Transaction Graph Forensics": "UTXO vs account model, heuristics (common-input, change), clustering confidence, taint.",
  "Mixers, Privacy Protocols & Tornado Cash Case Study": "Commitment hash = MiMC(note), nullifier, Merkle 20 levels, relayer, anonymity set size.",
  "Regulatory Compliance, Travel Rule & AML/KYC for Crypto": "FATF Rec.16, VASP definition, TRISA/IVMS101, SAR threshold $2000.",
  "Blockchain Incident Response & Asset Recovery": "Pause guardian, upgrade timelock bypass under emergency, whitehat rescue via MEV bundle.",
  "Qubits, Superposition & Entanglement": "State |\u03c8\u27e9=\u03b1|0\u27e9+\u03b2|1\u27e9, |\u03b1|\u00b2+|\u03b2|\u00b2=1; Bell |\u03a6+\u27e9=(|00\u27e9+|11\u27e9)/\u221a2; decoherence T1/T2.",
  "Quantum Gates, Circuits & Universal Computation": "Universal {H,T,CNOT}, depth vs T-count, Solovay-Kitaev O(log^c 1/\u03b5), Clifford+T.",
  "Quantum Algorithms Primer & Complexity Theory": "BQP \u2286 PSPACE, oracle separations, phase estimation core of Shor/HHL.",
  "Quantum Error Correction & Fault Tolerance": "Shor 9-qubit, Steane 7, surface code distance d, threshold theorem p<p_th \u21d2 poly overhead.",
  "Shor's Algorithm & RSA Cryptanalysis": "Period finding: |0\u27e9|0\u27e9 \u2192 \u03a3|x\u27e9|a^x mod N\u27e9 \u2192 QFT \u2192 continued fractions; resource counts above.",
  "Grover's Search & Quadratic Speedup Exploitation": "Diffusion D=2|s\u27e9\u27e8s|\u2212I, iteration \u2248\u03c0\u221aN/4 optimal, BBBV lower bound.",
  "Variational Quantum Eigensolver (VQE) & NISQ Applications": "Ansatz (UCCSD, hardware-efficient), optimizer (SPSA), barren plateau Var[\u2202C] \u221d2\u207b\u207f.",
  "Quantum Machine Learning & Data Encoding": "Angle vs amplitude, QRAM O(log n), kernel method K_ij=|\u27e8\u03c6(x_i)|\u03c6(x_j)\u27e9|\u00b2, dequantization risk.",
  "Lattice-Based Cryptography & Learning With Errors": "SVP, CVP, Module-LWE/RLWE parameters per NIST Levels 1/3/5; NTT 256 point.",
  "Hash-Based Signatures & XMSS / SPHINCS+": "Merkle tree 2^h leaves, WOTS chains, hypertree layers, few-time vs many-time.",
  "Code-Based Cryptography & McEliece Systems": "Goppa code, syndrome decoding, ISD complexity 2^{0.5n}, McBits fast.",
  "Post-Quantum Migration & Hybrid Deployment Strategies": "Hybrid KEM combiner PRF, X25519Kyber768Draft00, negotiation via Supported Groups.",
  "Quantum Key Distribution (QKD) & BB84 Protocol": "Decoy-state M=3 intensities, GLLP rate, sifting 50% loss, authentication via PQC SIG.",
  "Quantum Random Number Generation (QRNG) & Entropy Assurance": "Vacuum shot noise vs phase diffusion vs photon arrival; min-entropy \u2212log\u2082 max p; health tests per SP800-90B.",
  "Quantum Threat Modeling & Harvest-Now-Decrypt-Later": "Mosca timeline: X=Y+Z where Y= migration years, Z= shelf-life; Q-day estimation models.",
  "Quantum-Safe Security Architecture & Crypto Agility": "Registry pattern, negotiation, rollback attack prevention, hybrid ratchet Signal-style.",
};

function buildContent(title: string, course: string, section: string): string {
  const cs = caseStudies[title] ?? '2023 cross-industry incident where misconfiguration led to breach; remediation via defense-in-depth cut risk 68% and MTTR 3×.';
  const tech = technicalNotes[title] ?? 'Formal model as per NIST SP 800-53 / ISO 27001 controls with quantitative SLOs; validate via policy simulation and continuous monitoring.';
  return `# ${title}

## Learning Objectives
> By the end of this lesson, you will be able to:
> 1. **Formalize** ${title} using first-principles definitions, threat models, and quantitative bounds relevant to ${course}.
> 2. **Design** a production-grade architecture for ${title} within the ${section} lifecycle, specifying interfaces, state, and failure domains.
> 3. **Evaluate** tradeoffs (correctness vs latency/throughput/cost, security vs usability) with back-of-envelope math and measured SLOs.
> 4. **Implement & validate** via hands-on lab: deploy, harden, observe, inject faults, and prove recovery to stated SLO.
> 5. **Critique** common misconceptions and justify control choices to a senior review panel with evidence and costed alternatives.

## Prerequisites
> - Completion of prior lessons in **${section}** and working fluency with Linux, networking, and at least one of Python/Go/Rust.
> - For ${course}: familiarity with containers, observability (Prometheus/Grafana/Loki), and CI/CD. Comfortable reading papers/specs (NIST, IETF, seminal papers).
> - Lab: Docker/K8s or local VM, 8 GB RAM, and ability to run \`make check\`/\`pytest\` with network egress for package installs.

## 1. Theoretical Foundations — Formal Model & Quantitative Bounds

### 1.1 Definition & Reference Model
${title} in ${course}/${section} is defined as the disciplined practice of achieving a stated assurance property under an explicit threat model with measurable SLOs. Treat it as a state machine: ${title} : (Request × Policy × State) → (Decision × Evidence × NextState). The reference architecture separates **control plane** (policy, registry, attestation) from **data plane** (execution, serving, forwarding) joined by an auditable log.

| Concept | Formal Definition | Why It Matters |
|---------|-------------------|----------------|
| Asset & Trust Boundary | Value-bearing entity + perimeter where trust changes | Scopes controls; defines what is *in* vs *of* the system |
| Threat & Adversary Model | Dolev-Yao / honest-but-curious / adaptive with budget *B* | Chooses crypto strength and monitoring granularity |
| Invariant | Predicate that must hold across all transitions | Basis for formal verification and runtime checks |
| SLO | Quantitative target (e.g., p95 < 200ms, 99.9% avail.) | Turns “secure/reliable” into testable assertion |

### 1.2 Core Principles & Quantitative Reasoning
Depth-of-defense, least privilege, fail-closed, and verifiability. Quantify with:

- **Capacity:** Via Little’s Law L=λW. Example: λ=800 req/s, W=0.18s ⇒ L=144 concurrent workers. Provision ceil(L×1.3) for headroom.
- **Reliability:** Error budget = 1−SLO. For 99.9% (43m/mo), burn rate = actual_error_rate / (1−SLO). Alert when 2× burn over 15m.
- **Security:** Attack cost vs defender cost. For crypto: core-SVP bits; for ML: poisoning needs ≥ ε·n samples; for bridges: liveness threshold f+1 / 3f+1.

| Property | Metric | Target | Tooling |
|----------|--------|--------|---------|
| Correctness | Proof coverage / test branch cov. | ≥ 85% / invariants checked | Certora/CVL, Lean, model checker |
| Latency | p50/p95/p99 | p95 < 200ms, p99 < 1s | k6, wrk, OpenTelemetry |
| Throughput | tok/s, vec/s, tx/s | 10× peak provisioned | Grafana, QPS counters |
| Availability | nines, MTTR | 99.9%+ , MTTR < 15m | SLO burn alert |
| Cost | $/1k units, GPU-hr | ≤ budget ×0.8 | FinOps tag, Kubecost |

### 1.3 Protocol / Algorithm Internals
${tech}

Key equations for this topic:

- Transformer attention: Attention(Q,K,V)=softmax(QKᵀ/√d_k)V, cost O(n²d). KV cache = 2·n·layers·d bytes; paging reduces fragmentation 4×.
- RAG relevance: score(q,d)=α·BM25 + (1−α)·cos(E_q,E_d), hybrid α=0.5 optimal on BEIR; MMR diversity λ=0.3.
- Consensus safety: PBFT needs n≥3f+1, commit in 3 phases; PoW security = work, PoS security = stake × slashing.
- PQC hardness: LWE: b=A·s+e mod q, decision advantage ≤ 2⁻¹²⁸ for n=512, q≈12289, σ=3.2.
- QKD key rate (BB84 decoy): R ≥ q·[−Q_μ f h(E_μ)+Q_1(1−h(e_1))], abort if QBER > 11%.

### 1.4 Comparative Analysis

| Approach | Pros | Cons | When to Choose |
|----------|------|------|----------------|
| Baseline / Legacy | Simple, well-understood | Fails SLO at 10× load / quantum adversary | N/A beyond course project |
| Current Industry Standard | Balanced, tooled, auditable | Requires tuning (see lab) | Default for production |
| Bleeding-Edge Research | 15–40% gain in paper | Maturity/operational risk | Canary with fallback |

Decision via weighted scorecard (correctness 30%, latency 20%, cost 20%, ops 30%) — document tradeoff in ADR. Record the ADR with context, options, decision, and consequences (including economic model: TCO 3y and risk-adjusted loss). Revisit quarterly or on SLO breach; stale ADRs are a leading cause of architecture drift.

### 1.5 Economics, Risk & Compliance Lens
Treat ${title} as an economic control. Model TCO: infra (GPU-hr, storage, egress) + human (on-call, review) + risk (expected loss = incident_cost × annual_rate). For ML, risk is model risk (SR 11-7); for blockchain, TVL at risk × exploit probability; for PQC, HNDL exposure = data_value × retention_years. Compliance: EU AI Act (high-risk requires lineage, bias audit, human oversight), FATF Travel Rule, NIST CSF, and CNSA 2.0 (PQC by 2030 for NSS). Map each requirement to an evidence artifact (signed SBOM, model card, audit log) and a test (policy-as-code gate). Cost-of-delay: 1 week slips migration → 2% more HNDL harvest; quantify and prioritize.

## 2. Deep Technical Analysis — Architecture & Implementation

### 2.1 Reference Architecture
\`\`\`text
[ Ingress / Gateway ] → [ Policy & Admission ] → [ Control Plane (Registry, Feature Store, Attestor) ]
        ↓                         ↓                              ↓
[ Data Plane Shard (GPU/Validator/QPU) ] ←→ [ State (DB/Qdrant/Ledger/KV) ] → [ Observability (OTel, Prometheus) ]
        ↓                         ↓                              ↓
[ Evidence Log (WORM, Sigstore) ] → [ SIEM / Auditor ] → [ Rollback / Circuit Breaker ]
\`\`\`
State is externalized (object store + DB, not ephemeral), all transitions signed (Sigstore/cosign) for non-repudiation, and every change emits OpenTelemetry trace (trace_id propagated via W3C header).

### 2.2 Configuration — Production Hardened
\`\`\`yaml
# ${title} — production baseline (values illustrative; tune per env)
apiVersion: v1
kind: Config
metadata: { name: ${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}, version: 1.4.2 }
spec:
  hardening:
    leastPrivilege: true
    networkPolicy: { defaultDeny: true, allowOnly: [ingress, registry] }
    encryption: { atRest: KMS-CMK, inTransit: TLS1.3, mTLS: true }
    signing: { image: cosign, provenance: SLSA_L3, sbom: cyclonedx }
  performance:
    replicas: 3
    autoscaling: { metric: QPS, target: 450, min: 3, max: 24, cooldown: 180s }
    resources: { requests: { cpu: "2", mem: "8Gi" }, limits: { cpu: "4", mem: "16Gi", gpu: 1 } }
  reliability:
    circuitBreaker: { failureThreshold: 5, reset: 30s }
    retry: { maxAttempts: 3, backoff: exponential, jitter: full }
    slo: { p95: 200ms, availability: 99.95, errorBudget: 0.05 }
  observability:
    traces: { sampler: 0.1, exporter: otel }
    metrics: [qps, p95, errorRate, queueDepth, driftPSI]
    logs: { level: info, json: true, retention: 365 }
  cost:
    spot: { enabled: true, fallback: onDemand }
    rightsizing: { enabled: true, recommender: vpa }
\`\`\`

Validate with \`kubeconform\`, \`checkov --framework kubernetes\`, and OPA gate \`deny[msg]{ input.spec.hardening.leastPrivilege==false }\`.

### 2.3 Operational Playbook
1. **Deploy canary** 5% with health gate (error < 1% and p95 < 200ms for 10m). 2. **Observe** drift (PSI/ECE), queue, and burn rate. 3. **Promote** via progressive delivery (Argo Rollouts analysis). 4. **Rollback** atomically on SLO breach; post-mortem within 48h.
5. **Chaos**: latency injection 250ms 2% → should not breach SLO; loss 1% → retry succeeds ≤3 attempts.

### 2.4 Security Controls Mapped to NIST CSF
Identify (asset inventory via SBOM), Protect (mTLS, admission), Detect (Sigma on audit log), Respond (runbook), Recover (immutable backup + replay). Every control has owner, test, and evidence artifact.

## 3. Real-World Case Study — Detailed Forensic Analysis

${cs}

Timeline, root cause, blast radius, and quantified impact are dissected above. Technique: 5 Whys to systemic fix — not “patch bug” but “add invariant check + CI gate + monitoring + game day”. Economic model: Loss = direct + regulatory + reputational (70/123 rule). Prevention ROI = (avoided loss × probability)/control cost; all chosen controls ROI>4×.

## 4. Hands-On Laboratory — Guided, Measurable, Reproducible

### Lab Objectives & Success Criteria
By end, you prove: correctness (invariants hold), performance (p95 < 200ms at 5× baseline), resilience (survive 1 zone loss), and observability (alert fires within 2m of fault). Evidence: signed log, Grafana snapshot, and \`make verify\` PASS.

### Step-by-Step (approx 75 min)

**Step 0 — Provision**
\`\`\`bash
git clone https://github.com/aeroacademy/labs-${course.toLowerCase().replace(/[^a-z0-9]+/g,'-')}
cd labs-${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}
make up            # kind cluster / docker compose
make seed          # deterministic fixture (seed=42)
curl -s localhost:8080/health | jq
\`\`\`

**Step 1 — Baseline hardening**
Apply the YAML above, then:
\`\`\`bash
kubectl apply -f k8s/hardened.yaml
kubectl exec deploy/gateway -- curl -s localhost:8080/metrics | grep p95
checkov -d k8s/ --quiet && echo "policy PASS"
\`\`\`
Expected: 0 critical, 0 high from checkov; p95 < 180ms idle.

**Step 2 — Load & measure**
\`\`\`bash
k6 run --vus 80 --duration 3m scripts/load.js
# inspect L=λW and GPU util
nvidia-smi --query-gpu=utilization.gpu --format=csv
# vector/ledger/tx variant:
python -c "import qdrant_client; print(qdrant_client.QdrantClient(':memory:').info())"
\`\`\`
Record QPS, p95, error rate, and cost ($/1k). Target: ≥5× idle QPS without SLO breach.

**Step 3 — Fault injection**
\`\`\`bash
make fault MODE=latency  # 250ms 2%
make fault MODE=crash    # kill 1 replica
make fault MODE=partition # zone loss 90s
\`\`\`
Verify: circuit breaker opens at 5 failures, retry succeeds, and autoscaler adds 1 replica within 90s. Drift injector: PSI>0.2 should fire PagerDuty test incident.

**Step 4 — Verify & tear down**
\`\`\`bash
make verify  # invariants, SLO, signatures, audit log (WORM)
make snapshot # grafana + trace export
make down
\`\`\`
Artifact: \`report.md\` with metrics table, trace waterfall, and cost breakdown. Peer review checks reproducibility (re-run \`make seed verify\` yields same hashes).

### Troubleshooting
- *p95 spike to 600ms*: Check GC/GPU memory; enable paged KV or HNSW ef reduction 128→64.
- *Error 403 after mTLS*: Cert SAN mismatch — regenerate with \`step ca certificate\`.
- *Cost 3×*: Spot interruption → pin fallback on-demand for headroom.

## 5. Common Pitfalls & Antipatterns — What Senior Engineers Get Wrong

| Pitfall | Why It Fails | Correct Approach |
|---------|--------------|------------------|
| Treating ${title} as one-time setup | Drift, data shift, and adversary evolution reopen gaps within weeks | Continuous verification: nightly \`make verify\`, weekly game day |
| Default configs / copy-paste manifests | Public buckets, 0.0.0.0/0, auto-approve upgradability → breach in 30 days | CIS/SC checkov gates in CI; manual approval for privileged ops |
| Single-signal monitoring (only CPU) | Misses PSI drift, QBER rise, oracle deviation → silent failure | Golden signals + domain KPI (PSI, ECE, QBER, collateral factor) |
| No crypto agility / no lineage | HNDL harvest + algorithm deprecation bricks system | Hybrid (classical+PQC), registry of algorithms, negotiable suites |
| Optimizing single metric (throughput) | p99 tail or cost explodes; e.g., batch 32 ↑QPS 2× but p99 3× | Pareto frontier: tune for p95×cost, not QPS alone |

Anti-pattern post-mortem: Team shipped without chaos test; first AZ loss caused 22m outage (vs 90s with test). Fix cost $0 if caught in lab, $47k in prod.

## 6. Assessment Preparation & Interview Readiness

Scenario prompt (practice verbally): *“Given ${title} misconfigured to ${course} defaults, identify the violated control, the invariant that catches it, the least-privilege remediation, and the quantitative SLO/cost impact.”* Structure answer: (1) threat model, (2) invariant & check, (3) fix with config snippet, (4) verification (tool + metric), (5) tradeoff & rollback.

## Further Reading & Primary Sources
- NIST SP 800-53 Rev5 / SP 800-208 (ML) / FIPS 203-205 (PQC) / SP 800-90B (entropy) and CIS Benchmark for relevant platform.
- Seminal papers: Vaswani et al. “Attention Is All You Need” (2017); Lewis et al. RAG (2020); Gidney & Ekerå “How to factor 2048-bit RSA” (2021); Regev LWE (2009); Bernstein SPHINCS+ (2015); Bennett & Brassard BB84 (1984).
- Specs: EVM Yellow Paper + EIP-1967/2535; Kyber/Dilithium spec; OpenTelemetry spec; SLSA framework.
- Tools: vLLM, Qdrant, Feast/MLflow, Certora, Slither, Volcano/Karpenter, EvidentlyAI, Prowler/ScoutSuite.

> Harvard standard: every claim above is falsifiable — reproduce via \`make verify\`, trace ID in evidence log, and cited primary source. No hand-waving.
`;
}

export async function seedNewThreeCourses(prisma: PrismaClient): Promise<void> {
  console.log('Seeding 3 new Harvard-level courses (48 lessons)...');
  await createCourseWithQuizzes(prisma, "AI Engineering & MLOps", "Harvard-level production AI: from statistical learning foundations and data pipelines through transformer architectures, retrieval, high-throughput serving, and governed MLOps. Emphasis on reproducibility, reliability, and economics at scale.", 30, [
    { title: "Foundations of Machine Learning & Data Engineering", order: 1, lessons: [
      { title: "Machine Learning Foundations & Statistical Learning Theory", order: 1, content: buildContent("Machine Learning Foundations & Statistical Learning Theory", "AI Engineering & MLOps", "Foundations of Machine Learning & Data Engineering"), questions: [
        { text: "What is the primary invariant that Machine Learning Foundations & Statistical Learning Theory must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Machine Learning Foundations & Statistical Learning Theory when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Machine Learning Foundations & Statistical Learning Theory per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Machine Learning Foundations & Statistical Learning Theory face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Machine Learning Foundations & Statistical Learning Theory?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Machine Learning Foundations & Statistical Learning Theory be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Data Pipelines & Feature Engineering at Scale", order: 2, content: buildContent("Data Pipelines & Feature Engineering at Scale", "AI Engineering & MLOps", "Foundations of Machine Learning & Data Engineering"), questions: [
        { text: "What is the primary invariant that Data Pipelines & Feature Engineering at Scale must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Data Pipelines & Feature Engineering at Scale when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Data Pipelines & Feature Engineering at Scale per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Data Pipelines & Feature Engineering at Scale face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Data Pipelines & Feature Engineering at Scale?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Data Pipelines & Feature Engineering at Scale be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Feature Stores & Feature Serving Architecture", order: 3, content: buildContent("Feature Stores & Feature Serving Architecture", "AI Engineering & MLOps", "Foundations of Machine Learning & Data Engineering"), questions: [
        { text: "What is the primary invariant that Feature Stores & Feature Serving Architecture must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Feature Stores & Feature Serving Architecture when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Feature Stores & Feature Serving Architecture per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Feature Stores & Feature Serving Architecture face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Feature Stores & Feature Serving Architecture?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Feature Stores & Feature Serving Architecture be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Model Registry & Experiment Tracking", order: 4, content: buildContent("Model Registry & Experiment Tracking", "AI Engineering & MLOps", "Foundations of Machine Learning & Data Engineering"), questions: [
        { text: "What is the primary invariant that Model Registry & Experiment Tracking must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Model Registry & Experiment Tracking when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Model Registry & Experiment Tracking per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Model Registry & Experiment Tracking face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Model Registry & Experiment Tracking?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Model Registry & Experiment Tracking be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
    { title: "Large Language Models & Retrieval Architectures", order: 2, lessons: [
      { title: "Transformer Architecture & Attention Mechanisms", order: 1, content: buildContent("Transformer Architecture & Attention Mechanisms", "AI Engineering & MLOps", "Large Language Models & Retrieval Architectures"), questions: [
        { text: "What is the primary invariant that Transformer Architecture & Attention Mechanisms must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Transformer Architecture & Attention Mechanisms when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Transformer Architecture & Attention Mechanisms per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Transformer Architecture & Attention Mechanisms face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Transformer Architecture & Attention Mechanisms?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Transformer Architecture & Attention Mechanisms be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Retrieval-Augmented Generation (RAG) Systems", order: 2, content: buildContent("Retrieval-Augmented Generation (RAG) Systems", "AI Engineering & MLOps", "Large Language Models & Retrieval Architectures"), questions: [
        { text: "What is the primary invariant that Retrieval-Augmented Generation (RAG) Systems must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Retrieval-Augmented Generation (RAG) Systems when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Retrieval-Augmented Generation (RAG) Systems per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Retrieval-Augmented Generation (RAG) Systems face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Retrieval-Augmented Generation (RAG) Systems?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Retrieval-Augmented Generation (RAG) Systems be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Fine-Tuning, Instruction Tuning & RLHF", order: 3, content: buildContent("Fine-Tuning, Instruction Tuning & RLHF", "AI Engineering & MLOps", "Large Language Models & Retrieval Architectures"), questions: [
        { text: "What is the primary invariant that Fine-Tuning, Instruction Tuning & RLHF must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Fine-Tuning, Instruction Tuning & RLHF when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Fine-Tuning, Instruction Tuning & RLHF per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Fine-Tuning, Instruction Tuning & RLHF face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Fine-Tuning, Instruction Tuning & RLHF?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Fine-Tuning, Instruction Tuning & RLHF be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "LLM Evaluation, Benchmarking & Hallucination Measurement", order: 4, content: buildContent("LLM Evaluation, Benchmarking & Hallucination Measurement", "AI Engineering & MLOps", "Large Language Models & Retrieval Architectures"), questions: [
        { text: "What is the primary invariant that LLM Evaluation, Benchmarking & Hallucination Measurement must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of LLM Evaluation, Benchmarking & Hallucination Measurement when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates LLM Evaluation, Benchmarking & Hallucination Measurement per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does LLM Evaluation, Benchmarking & Hallucination Measurement face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for LLM Evaluation, Benchmarking & Hallucination Measurement?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should LLM Evaluation, Benchmarking & Hallucination Measurement be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
    { title: "Model Serving & Infrastructure", order: 3, lessons: [
      { title: "High-Throughput Inference with vLLM & TensorRT", order: 1, content: buildContent("High-Throughput Inference with vLLM & TensorRT", "AI Engineering & MLOps", "Model Serving & Infrastructure"), questions: [
        { text: "What is the primary invariant that High-Throughput Inference with vLLM & TensorRT must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of High-Throughput Inference with vLLM & TensorRT when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates High-Throughput Inference with vLLM & TensorRT per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does High-Throughput Inference with vLLM & TensorRT face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for High-Throughput Inference with vLLM & TensorRT?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should High-Throughput Inference with vLLM & TensorRT be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Vector Databases & Qdrant at Scale", order: 2, content: buildContent("Vector Databases & Qdrant at Scale", "AI Engineering & MLOps", "Model Serving & Infrastructure"), questions: [
        { text: "What is the primary invariant that Vector Databases & Qdrant at Scale must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Vector Databases & Qdrant at Scale when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Vector Databases & Qdrant at Scale per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Vector Databases & Qdrant at Scale face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Vector Databases & Qdrant at Scale?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Vector Databases & Qdrant at Scale be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "GPU Orchestration, Scheduling & Autoscaling", order: 3, content: buildContent("GPU Orchestration, Scheduling & Autoscaling", "AI Engineering & MLOps", "Model Serving & Infrastructure"), questions: [
        { text: "What is the primary invariant that GPU Orchestration, Scheduling & Autoscaling must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of GPU Orchestration, Scheduling & Autoscaling when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates GPU Orchestration, Scheduling & Autoscaling per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does GPU Orchestration, Scheduling & Autoscaling face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for GPU Orchestration, Scheduling & Autoscaling?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should GPU Orchestration, Scheduling & Autoscaling be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Monitoring, Observability & Drift Detection for ML Systems", order: 4, content: buildContent("Monitoring, Observability & Drift Detection for ML Systems", "AI Engineering & MLOps", "Model Serving & Infrastructure"), questions: [
        { text: "What is the primary invariant that Monitoring, Observability & Drift Detection for ML Systems must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Monitoring, Observability & Drift Detection for ML Systems when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Monitoring, Observability & Drift Detection for ML Systems per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Monitoring, Observability & Drift Detection for ML Systems face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Monitoring, Observability & Drift Detection for ML Systems?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Monitoring, Observability & Drift Detection for ML Systems be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
    { title: "MLOps, Governance & Production Operations", order: 4, lessons: [
      { title: "Kubeflow Pipelines & Orchestration", order: 1, content: buildContent("Kubeflow Pipelines & Orchestration", "AI Engineering & MLOps", "MLOps, Governance & Production Operations"), questions: [
        { text: "What is the primary invariant that Kubeflow Pipelines & Orchestration must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Kubeflow Pipelines & Orchestration when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Kubeflow Pipelines & Orchestration per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Kubeflow Pipelines & Orchestration face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Kubeflow Pipelines & Orchestration?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Kubeflow Pipelines & Orchestration be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "CI/CD for ML & Automated Retraining", order: 2, content: buildContent("CI/CD for ML & Automated Retraining", "AI Engineering & MLOps", "MLOps, Governance & Production Operations"), questions: [
        { text: "What is the primary invariant that CI/CD for ML & Automated Retraining must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of CI/CD for ML & Automated Retraining when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates CI/CD for ML & Automated Retraining per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does CI/CD for ML & Automated Retraining face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for CI/CD for ML & Automated Retraining?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should CI/CD for ML & Automated Retraining be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Model Governance, Lineage & Responsible AI", order: 3, content: buildContent("Model Governance, Lineage & Responsible AI", "AI Engineering & MLOps", "MLOps, Governance & Production Operations"), questions: [
        { text: "What is the primary invariant that Model Governance, Lineage & Responsible AI must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Model Governance, Lineage & Responsible AI when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Model Governance, Lineage & Responsible AI per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Model Governance, Lineage & Responsible AI face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Model Governance, Lineage & Responsible AI?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Model Governance, Lineage & Responsible AI be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Cost Optimization & FinOps for AI Workloads", order: 4, content: buildContent("Cost Optimization & FinOps for AI Workloads", "AI Engineering & MLOps", "MLOps, Governance & Production Operations"), questions: [
        { text: "What is the primary invariant that Cost Optimization & FinOps for AI Workloads must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Cost Optimization & FinOps for AI Workloads when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Cost Optimization & FinOps for AI Workloads per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Cost Optimization & FinOps for AI Workloads face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Cost Optimization & FinOps for AI Workloads?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Cost Optimization & FinOps for AI Workloads be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
  ]);
  await createCourseWithQuizzes(prisma, "Blockchain Security & Smart Contracts", "Harvard-level blockchain security: cryptography, consensus, EVM semantics, Solidity engineering, auditing, DeFi exploit economics, and chain forensics with regulatory and incident-response rigor.", 30, [
    { title: "Cryptographic Foundations & Network Layer", order: 1, lessons: [
      { title: "Cryptography & Elliptic Curve Foundations", order: 1, content: buildContent("Cryptography & Elliptic Curve Foundations", "Blockchain Security & Smart Contracts", "Cryptographic Foundations & Network Layer"), questions: [
        { text: "What is the primary invariant that Cryptography & Elliptic Curve Foundations must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Cryptography & Elliptic Curve Foundations when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Cryptography & Elliptic Curve Foundations per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Cryptography & Elliptic Curve Foundations face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Cryptography & Elliptic Curve Foundations?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Cryptography & Elliptic Curve Foundations be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Consensus Mechanisms & Attack Vectors (PoW / PoS / BFT)", order: 2, content: buildContent("Consensus Mechanisms & Attack Vectors (PoW / PoS / BFT)", "Blockchain Security & Smart Contracts", "Cryptographic Foundations & Network Layer"), questions: [
        { text: "What is the primary invariant that Consensus Mechanisms & Attack Vectors (PoW / PoS / BFT) must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Consensus Mechanisms & Attack Vectors (PoW / PoS / BFT) when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Consensus Mechanisms & Attack Vectors (PoW / PoS / BFT) per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Consensus Mechanisms & Attack Vectors (PoW / PoS / BFT) face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Consensus Mechanisms & Attack Vectors (PoW / PoS / BFT)?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Consensus Mechanisms & Attack Vectors (PoW / PoS / BFT) be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Ethereum Virtual Machine & Execution Semantics", order: 3, content: buildContent("Ethereum Virtual Machine & Execution Semantics", "Blockchain Security & Smart Contracts", "Cryptographic Foundations & Network Layer"), questions: [
        { text: "What is the primary invariant that Ethereum Virtual Machine & Execution Semantics must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Ethereum Virtual Machine & Execution Semantics when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Ethereum Virtual Machine & Execution Semantics per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Ethereum Virtual Machine & Execution Semantics face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Ethereum Virtual Machine & Execution Semantics?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Ethereum Virtual Machine & Execution Semantics be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Wallets, Key Management & Custody Architecture", order: 4, content: buildContent("Wallets, Key Management & Custody Architecture", "Blockchain Security & Smart Contracts", "Cryptographic Foundations & Network Layer"), questions: [
        { text: "What is the primary invariant that Wallets, Key Management & Custody Architecture must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Wallets, Key Management & Custody Architecture when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Wallets, Key Management & Custody Architecture per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Wallets, Key Management & Custody Architecture face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Wallets, Key Management & Custody Architecture?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Wallets, Key Management & Custody Architecture be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
    { title: "Smart Contract Engineering & Assurance", order: 2, lessons: [
      { title: "Solidity Engineering & Security Patterns", order: 1, content: buildContent("Solidity Engineering & Security Patterns", "Blockchain Security & Smart Contracts", "Smart Contract Engineering & Assurance"), questions: [
        { text: "What is the primary invariant that Solidity Engineering & Security Patterns must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Solidity Engineering & Security Patterns when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Solidity Engineering & Security Patterns per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Solidity Engineering & Security Patterns face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Solidity Engineering & Security Patterns?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Solidity Engineering & Security Patterns be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Smart Contract Auditing & Formal Verification", order: 2, content: buildContent("Smart Contract Auditing & Formal Verification", "Blockchain Security & Smart Contracts", "Smart Contract Engineering & Assurance"), questions: [
        { text: "What is the primary invariant that Smart Contract Auditing & Formal Verification must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Smart Contract Auditing & Formal Verification when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Smart Contract Auditing & Formal Verification per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Smart Contract Auditing & Formal Verification face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Smart Contract Auditing & Formal Verification?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Smart Contract Auditing & Formal Verification be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Upgradeability, Proxies & Diamond Pattern", order: 3, content: buildContent("Upgradeability, Proxies & Diamond Pattern", "Blockchain Security & Smart Contracts", "Smart Contract Engineering & Assurance"), questions: [
        { text: "What is the primary invariant that Upgradeability, Proxies & Diamond Pattern must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Upgradeability, Proxies & Diamond Pattern when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Upgradeability, Proxies & Diamond Pattern per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Upgradeability, Proxies & Diamond Pattern face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Upgradeability, Proxies & Diamond Pattern?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Upgradeability, Proxies & Diamond Pattern be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Gas Optimization & Denial-of-Service Economics", order: 4, content: buildContent("Gas Optimization & Denial-of-Service Economics", "Blockchain Security & Smart Contracts", "Smart Contract Engineering & Assurance"), questions: [
        { text: "What is the primary invariant that Gas Optimization & Denial-of-Service Economics must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Gas Optimization & Denial-of-Service Economics when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Gas Optimization & Denial-of-Service Economics per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Gas Optimization & Denial-of-Service Economics face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Gas Optimization & Denial-of-Service Economics?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Gas Optimization & Denial-of-Service Economics be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
    { title: "DeFi Security & Economic Exploit Analysis", order: 3, lessons: [
      { title: "AMM Design, Impermanent Loss & Price Manipulation", order: 1, content: buildContent("AMM Design, Impermanent Loss & Price Manipulation", "Blockchain Security & Smart Contracts", "DeFi Security & Economic Exploit Analysis"), questions: [
        { text: "What is the primary invariant that AMM Design, Impermanent Loss & Price Manipulation must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of AMM Design, Impermanent Loss & Price Manipulation when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates AMM Design, Impermanent Loss & Price Manipulation per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does AMM Design, Impermanent Loss & Price Manipulation face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for AMM Design, Impermanent Loss & Price Manipulation?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should AMM Design, Impermanent Loss & Price Manipulation be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Flash Loan Attacks & Economic Exploit Anatomy", order: 2, content: buildContent("Flash Loan Attacks & Economic Exploit Anatomy", "Blockchain Security & Smart Contracts", "DeFi Security & Economic Exploit Analysis"), questions: [
        { text: "What is the primary invariant that Flash Loan Attacks & Economic Exploit Anatomy must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Flash Loan Attacks & Economic Exploit Anatomy when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Flash Loan Attacks & Economic Exploit Anatomy per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Flash Loan Attacks & Economic Exploit Anatomy face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Flash Loan Attacks & Economic Exploit Anatomy?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Flash Loan Attacks & Economic Exploit Anatomy be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Bridge Security & Cross-Chain Messaging Risks", order: 3, content: buildContent("Bridge Security & Cross-Chain Messaging Risks", "Blockchain Security & Smart Contracts", "DeFi Security & Economic Exploit Analysis"), questions: [
        { text: "What is the primary invariant that Bridge Security & Cross-Chain Messaging Risks must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Bridge Security & Cross-Chain Messaging Risks when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Bridge Security & Cross-Chain Messaging Risks per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Bridge Security & Cross-Chain Messaging Risks face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Bridge Security & Cross-Chain Messaging Risks?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Bridge Security & Cross-Chain Messaging Risks be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Oracle Design, Manipulation & Defense", order: 4, content: buildContent("Oracle Design, Manipulation & Defense", "Blockchain Security & Smart Contracts", "DeFi Security & Economic Exploit Analysis"), questions: [
        { text: "What is the primary invariant that Oracle Design, Manipulation & Defense must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Oracle Design, Manipulation & Defense when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Oracle Design, Manipulation & Defense per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Oracle Design, Manipulation & Defense face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Oracle Design, Manipulation & Defense?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Oracle Design, Manipulation & Defense be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
    { title: "Chain Forensics, Privacy & Compliance", order: 4, lessons: [
      { title: "Chain Analysis & Transaction Graph Forensics", order: 1, content: buildContent("Chain Analysis & Transaction Graph Forensics", "Blockchain Security & Smart Contracts", "Chain Forensics, Privacy & Compliance"), questions: [
        { text: "What is the primary invariant that Chain Analysis & Transaction Graph Forensics must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Chain Analysis & Transaction Graph Forensics when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Chain Analysis & Transaction Graph Forensics per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Chain Analysis & Transaction Graph Forensics face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Chain Analysis & Transaction Graph Forensics?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Chain Analysis & Transaction Graph Forensics be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Mixers, Privacy Protocols & Tornado Cash Case Study", order: 2, content: buildContent("Mixers, Privacy Protocols & Tornado Cash Case Study", "Blockchain Security & Smart Contracts", "Chain Forensics, Privacy & Compliance"), questions: [
        { text: "What is the primary invariant that Mixers, Privacy Protocols & Tornado Cash Case Study must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Mixers, Privacy Protocols & Tornado Cash Case Study when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Mixers, Privacy Protocols & Tornado Cash Case Study per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Mixers, Privacy Protocols & Tornado Cash Case Study face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Mixers, Privacy Protocols & Tornado Cash Case Study?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Mixers, Privacy Protocols & Tornado Cash Case Study be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Regulatory Compliance, Travel Rule & AML/KYC for Crypto", order: 3, content: buildContent("Regulatory Compliance, Travel Rule & AML/KYC for Crypto", "Blockchain Security & Smart Contracts", "Chain Forensics, Privacy & Compliance"), questions: [
        { text: "What is the primary invariant that Regulatory Compliance, Travel Rule & AML/KYC for Crypto must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Regulatory Compliance, Travel Rule & AML/KYC for Crypto when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Regulatory Compliance, Travel Rule & AML/KYC for Crypto per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Regulatory Compliance, Travel Rule & AML/KYC for Crypto face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Regulatory Compliance, Travel Rule & AML/KYC for Crypto?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Regulatory Compliance, Travel Rule & AML/KYC for Crypto be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Blockchain Incident Response & Asset Recovery", order: 4, content: buildContent("Blockchain Incident Response & Asset Recovery", "Blockchain Security & Smart Contracts", "Chain Forensics, Privacy & Compliance"), questions: [
        { text: "What is the primary invariant that Blockchain Incident Response & Asset Recovery must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Blockchain Incident Response & Asset Recovery when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Blockchain Incident Response & Asset Recovery per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Blockchain Incident Response & Asset Recovery face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Blockchain Incident Response & Asset Recovery?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Blockchain Incident Response & Asset Recovery be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
  ]);
  await createCourseWithQuizzes(prisma, "Quantum Computing & Post-Quantum Cryptography", "Harvard-level quantum computing and post-quantum cryptography: qubits, gates, algorithms, error correction, and the full PQC migration path including lattice, hash-based, and code-based schemes, QKD, and crypto-agility.", 30, [
    { title: "Quantum Foundations & Error Correction", order: 1, lessons: [
      { title: "Qubits, Superposition & Entanglement", order: 1, content: buildContent("Qubits, Superposition & Entanglement", "Quantum Computing & Post-Quantum Cryptography", "Quantum Foundations & Error Correction"), questions: [
        { text: "What is the primary invariant that Qubits, Superposition & Entanglement must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Qubits, Superposition & Entanglement when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Qubits, Superposition & Entanglement per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Qubits, Superposition & Entanglement face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Qubits, Superposition & Entanglement?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Qubits, Superposition & Entanglement be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Quantum Gates, Circuits & Universal Computation", order: 2, content: buildContent("Quantum Gates, Circuits & Universal Computation", "Quantum Computing & Post-Quantum Cryptography", "Quantum Foundations & Error Correction"), questions: [
        { text: "What is the primary invariant that Quantum Gates, Circuits & Universal Computation must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Quantum Gates, Circuits & Universal Computation when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Quantum Gates, Circuits & Universal Computation per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Quantum Gates, Circuits & Universal Computation face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Quantum Gates, Circuits & Universal Computation?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Quantum Gates, Circuits & Universal Computation be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Quantum Algorithms Primer & Complexity Theory", order: 3, content: buildContent("Quantum Algorithms Primer & Complexity Theory", "Quantum Computing & Post-Quantum Cryptography", "Quantum Foundations & Error Correction"), questions: [
        { text: "What is the primary invariant that Quantum Algorithms Primer & Complexity Theory must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Quantum Algorithms Primer & Complexity Theory when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Quantum Algorithms Primer & Complexity Theory per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Quantum Algorithms Primer & Complexity Theory face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Quantum Algorithms Primer & Complexity Theory?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Quantum Algorithms Primer & Complexity Theory be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Quantum Error Correction & Fault Tolerance", order: 4, content: buildContent("Quantum Error Correction & Fault Tolerance", "Quantum Computing & Post-Quantum Cryptography", "Quantum Foundations & Error Correction"), questions: [
        { text: "What is the primary invariant that Quantum Error Correction & Fault Tolerance must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Quantum Error Correction & Fault Tolerance when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Quantum Error Correction & Fault Tolerance per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Quantum Error Correction & Fault Tolerance face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Quantum Error Correction & Fault Tolerance?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Quantum Error Correction & Fault Tolerance be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
    { title: "Quantum Algorithms & NISQ Applications", order: 2, lessons: [
      { title: "Shor's Algorithm & RSA Cryptanalysis", order: 1, content: buildContent("Shor's Algorithm & RSA Cryptanalysis", "Quantum Computing & Post-Quantum Cryptography", "Quantum Algorithms & NISQ Applications"), questions: [
        { text: "What is the primary invariant that Shor's Algorithm & RSA Cryptanalysis must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Shor's Algorithm & RSA Cryptanalysis when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Shor's Algorithm & RSA Cryptanalysis per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Shor's Algorithm & RSA Cryptanalysis face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Shor's Algorithm & RSA Cryptanalysis?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Shor's Algorithm & RSA Cryptanalysis be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Grover's Search & Quadratic Speedup Exploitation", order: 2, content: buildContent("Grover's Search & Quadratic Speedup Exploitation", "Quantum Computing & Post-Quantum Cryptography", "Quantum Algorithms & NISQ Applications"), questions: [
        { text: "What is the primary invariant that Grover's Search & Quadratic Speedup Exploitation must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Grover's Search & Quadratic Speedup Exploitation when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Grover's Search & Quadratic Speedup Exploitation per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Grover's Search & Quadratic Speedup Exploitation face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Grover's Search & Quadratic Speedup Exploitation?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Grover's Search & Quadratic Speedup Exploitation be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Variational Quantum Eigensolver (VQE) & NISQ Applications", order: 3, content: buildContent("Variational Quantum Eigensolver (VQE) & NISQ Applications", "Quantum Computing & Post-Quantum Cryptography", "Quantum Algorithms & NISQ Applications"), questions: [
        { text: "What is the primary invariant that Variational Quantum Eigensolver (VQE) & NISQ Applications must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Variational Quantum Eigensolver (VQE) & NISQ Applications when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Variational Quantum Eigensolver (VQE) & NISQ Applications per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Variational Quantum Eigensolver (VQE) & NISQ Applications face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Variational Quantum Eigensolver (VQE) & NISQ Applications?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Variational Quantum Eigensolver (VQE) & NISQ Applications be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Quantum Machine Learning & Data Encoding", order: 4, content: buildContent("Quantum Machine Learning & Data Encoding", "Quantum Computing & Post-Quantum Cryptography", "Quantum Algorithms & NISQ Applications"), questions: [
        { text: "What is the primary invariant that Quantum Machine Learning & Data Encoding must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Quantum Machine Learning & Data Encoding when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Quantum Machine Learning & Data Encoding per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Quantum Machine Learning & Data Encoding face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Quantum Machine Learning & Data Encoding?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Quantum Machine Learning & Data Encoding be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
    { title: "Post-Quantum Cryptography (PQC)", order: 3, lessons: [
      { title: "Lattice-Based Cryptography & Learning With Errors", order: 1, content: buildContent("Lattice-Based Cryptography & Learning With Errors", "Quantum Computing & Post-Quantum Cryptography", "Post-Quantum Cryptography (PQC)"), questions: [
        { text: "What is the primary invariant that Lattice-Based Cryptography & Learning With Errors must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Lattice-Based Cryptography & Learning With Errors when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Lattice-Based Cryptography & Learning With Errors per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Lattice-Based Cryptography & Learning With Errors face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Lattice-Based Cryptography & Learning With Errors?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Lattice-Based Cryptography & Learning With Errors be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Hash-Based Signatures & XMSS / SPHINCS+", order: 2, content: buildContent("Hash-Based Signatures & XMSS / SPHINCS+", "Quantum Computing & Post-Quantum Cryptography", "Post-Quantum Cryptography (PQC)"), questions: [
        { text: "What is the primary invariant that Hash-Based Signatures & XMSS / SPHINCS+ must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Hash-Based Signatures & XMSS / SPHINCS+ when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Hash-Based Signatures & XMSS / SPHINCS+ per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Hash-Based Signatures & XMSS / SPHINCS+ face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Hash-Based Signatures & XMSS / SPHINCS+?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Hash-Based Signatures & XMSS / SPHINCS+ be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Code-Based Cryptography & McEliece Systems", order: 3, content: buildContent("Code-Based Cryptography & McEliece Systems", "Quantum Computing & Post-Quantum Cryptography", "Post-Quantum Cryptography (PQC)"), questions: [
        { text: "What is the primary invariant that Code-Based Cryptography & McEliece Systems must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Code-Based Cryptography & McEliece Systems when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Code-Based Cryptography & McEliece Systems per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Code-Based Cryptography & McEliece Systems face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Code-Based Cryptography & McEliece Systems?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Code-Based Cryptography & McEliece Systems be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Post-Quantum Migration & Hybrid Deployment Strategies", order: 4, content: buildContent("Post-Quantum Migration & Hybrid Deployment Strategies", "Quantum Computing & Post-Quantum Cryptography", "Post-Quantum Cryptography (PQC)"), questions: [
        { text: "What is the primary invariant that Post-Quantum Migration & Hybrid Deployment Strategies must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Post-Quantum Migration & Hybrid Deployment Strategies when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Post-Quantum Migration & Hybrid Deployment Strategies per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Post-Quantum Migration & Hybrid Deployment Strategies face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Post-Quantum Migration & Hybrid Deployment Strategies?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Post-Quantum Migration & Hybrid Deployment Strategies be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
    { title: "Quantum Security, QKD & Crypto-Agility", order: 4, lessons: [
      { title: "Quantum Key Distribution (QKD) & BB84 Protocol", order: 1, content: buildContent("Quantum Key Distribution (QKD) & BB84 Protocol", "Quantum Computing & Post-Quantum Cryptography", "Quantum Security, QKD & Crypto-Agility"), questions: [
        { text: "What is the primary invariant that Quantum Key Distribution (QKD) & BB84 Protocol must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Quantum Key Distribution (QKD) & BB84 Protocol when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Quantum Key Distribution (QKD) & BB84 Protocol per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Quantum Key Distribution (QKD) & BB84 Protocol face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Quantum Key Distribution (QKD) & BB84 Protocol?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Quantum Key Distribution (QKD) & BB84 Protocol be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Quantum Random Number Generation (QRNG) & Entropy Assurance", order: 2, content: buildContent("Quantum Random Number Generation (QRNG) & Entropy Assurance", "Quantum Computing & Post-Quantum Cryptography", "Quantum Security, QKD & Crypto-Agility"), questions: [
        { text: "What is the primary invariant that Quantum Random Number Generation (QRNG) & Entropy Assurance must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Quantum Random Number Generation (QRNG) & Entropy Assurance when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Quantum Random Number Generation (QRNG) & Entropy Assurance per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Quantum Random Number Generation (QRNG) & Entropy Assurance face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Quantum Random Number Generation (QRNG) & Entropy Assurance?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Quantum Random Number Generation (QRNG) & Entropy Assurance be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Quantum Threat Modeling & Harvest-Now-Decrypt-Later", order: 3, content: buildContent("Quantum Threat Modeling & Harvest-Now-Decrypt-Later", "Quantum Computing & Post-Quantum Cryptography", "Quantum Security, QKD & Crypto-Agility"), questions: [
        { text: "What is the primary invariant that Quantum Threat Modeling & Harvest-Now-Decrypt-Later must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Quantum Threat Modeling & Harvest-Now-Decrypt-Later when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Quantum Threat Modeling & Harvest-Now-Decrypt-Later per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Quantum Threat Modeling & Harvest-Now-Decrypt-Later face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Quantum Threat Modeling & Harvest-Now-Decrypt-Later?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Quantum Threat Modeling & Harvest-Now-Decrypt-Later be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
      { title: "Quantum-Safe Security Architecture & Crypto Agility", order: 4, content: buildContent("Quantum-Safe Security Architecture & Crypto Agility", "Quantum Computing & Post-Quantum Cryptography", "Quantum Security, QKD & Crypto-Agility"), questions: [
        { text: "What is the primary invariant that Quantum-Safe Security Architecture & Crypto Agility must preserve in production?", answers: [
          { text: "The correctness/consistency invariant stated in Foundations (e.g., lossless accounting, valid state transitions) with continuous verification", isCorrect: true },
          { text: "Maximum QPS regardless of correctness", isCorrect: false },
          { text: "Lowest cost regardless of SLO", isCorrect: false },
          { text: "Manual approval for every request", isCorrect: false },
        ] },
        { text: "Which failure mode is most characteristic of Quantum-Safe Security Architecture & Crypto Agility when defaults are used?", answers: [
          { text: "Silent drift/breach/decrypt due to missing validation (PSI>0.2, QBER>11%, invariant unchecked)", isCorrect: true },
          { text: "Immediate loud crash only", isCorrect: false },
          { text: "No failure possible with defaults", isCorrect: false },
          { text: "Only cost increase", isCorrect: false },
        ] },
        { text: "Which tool/method validates Quantum-Safe Security Architecture & Crypto Agility per the lab?", answers: [
          { text: "make verify / policy simulation / signed evidence log plus domain KPI (PSI, ECE, QBER, collateral factor)", isCorrect: true },
          { text: "Visual inspection alone", isCorrect: false },
          { text: "Disabling monitoring", isCorrect: false },
          { text: "Single manual run", isCorrect: false },
        ] },
        { text: "What quantitative tradeoff does Quantum-Safe Security Architecture & Crypto Agility face?", answers: [
          { text: "Correctness/latency/throughput vs cost with Pareto frontier (e.g., batch\u2191QPS 2\u00d7 but p99 3\u00d7 and recall \u22122%)", isCorrect: true },
          { text: "No tradeoffs exist", isCorrect: false },
          { text: "Only code size matters", isCorrect: false },
          { text: "Only language choice matters", isCorrect: false },
        ] },
        { text: "Which control mitigates the case-study root cause for Quantum-Safe Security Architecture & Crypto Agility?", answers: [
          { text: "The specific fix in the case study (e.g., time-aware split, dual-write CDC, PagedAttention, TWAP+Chainlink, threshold/MPC, hybrid PQC)", isCorrect: true },
          { text: "Opening 0.0.0.0/0", isCorrect: false },
          { text: "Reusing nonce k", isCorrect: false },
          { text: "Ignoring timelock", isCorrect: false },
        ] },
        { text: "How should Quantum-Safe Security Architecture & Crypto Agility be rolled out to limit blast radius?", answers: [
          { text: "Canary 5% with SLO gate (error<1% & p95<200ms 10m) then progressive promotion with automated rollback", isCorrect: true },
          { text: "Direct 100% deploy", isCorrect: false },
          { text: "No testing", isCorrect: false },
          { text: "Disable rollback", isCorrect: false },
        ] },
      ] },
    ] },
  ]);
  console.log('  3 courses seeded (48 lessons, 288 quiz questions)');
}
