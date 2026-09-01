# Module 10: Future

## The Quantum Internet

The quantum internet is a network that distributes quantum information (qubits) between nodes, enabling applications that are impossible with classical networks. Unlike the classical internet, which transmits bits, the quantum internet transmits qubits: preserving superposition and enabling entanglement distribution.

This module covers the architecture, protocols, and applications of quantum networks, with a focus on quantum key distribution (QKD) and its practical implementation.

## Quantum Network Architecture

### Quantum Repeaters

Classical signals degrade over distance due to attenuation. In fiber optic cables, light loses approximately 0.2 dB/km. Classical networks overcome this with amplifiers that boost the signal. Quantum networks cannot use amplifiers: the no-cloning theorem forbids copying unknown quantum states.

Quantum repeaters solve this problem using entanglement swapping. Instead of transmitting a qubit directly from Alice to Bob, the network creates entangled pairs between adjacent nodes and performs entanglement swapping to extend the entanglement over multiple hops.

**Entanglement swapping:**
1. Alice and Bob are connected through an intermediate node Charlie
2. Alice-Charlie share an entangled pair |Φ+⟩
3. Charlie-Bob share an entangled pair |Φ+⟩
4. Charlie performs a Bell state measurement on his two qubits
5. Alice and Bob's qubits become entangled

This process extends entanglement over arbitrary distances without ever transmitting a qubit directly. The quantum repeater architecture enables long-distance quantum communication.

### Quantum Memory

Quantum repeaters require quantum memory: devices that can store qubits for the time needed to perform entanglement swapping. Current quantum memory technologies:

**Atomic ensembles:** Store qubits in collective excitations of an atomic gas. Coherence times: milliseconds to seconds. Efficiency: 50-80%.

**Single atoms in traps:** Store qubits in electronic states of trapped atoms. Coherence times: seconds to minutes. Efficiency: 90%+.

**Nitrogen-vacancy centers in diamond:** Store qubits in spin states of defects in diamond. Coherence times: milliseconds at room temperature. Efficiency: 50-70%.

**Rare-earth ion-doped crystals:** Store qubits in electronic states of rare-earth ions. Coherence times: hours at cryogenic temperatures. Efficiency: 10-30%.

Quantum memory is one of the key enabling technologies for quantum networks. Without sufficiently long-lived and efficient quantum memory, practical quantum repeaters cannot be built.

### Quantum Network Protocols

**Quantum key distribution (QKD):** Distribute shared secret keys using quantum mechanics. The most mature quantum network application.

**Entanglement distribution:** Distribute entangled pairs between nodes for use in quantum computing, quantum sensing, and quantum communication.

**Quantum teleportation:** Transmit an arbitrary quantum state using entanglement and classical communication. The state is destroyed at the source and recreated at the destination.

**Blind quantum computation:** Perform computation on a remote quantum server without revealing the input, output, or algorithm.

## Quantum Key Distribution

### BB84 Protocol

The BB84 protocol, proposed by Bennett and Brassard in 1984, is the first and most well-known QKD protocol.

**Setup:**
- Alice and Bob are connected by a quantum channel (fiber optic or free space)
- They also have a classical channel (authenticated but not necessarily secret)
- An eavesdropper (Eve) may intercept the quantum channel

**Protocol:**
1. **Bit and basis selection:** Alice generates random bits and randomly chooses a basis (rectilinear {|0⟩, |1⟩} or diagonal {|+⟩, |−⟩}) for each bit.

2. **Quantum transmission:** Alice encodes each bit as a qubit using her chosen basis and sends it to Bob.

3. **Measurement:** Bob randomly chooses a basis for each qubit and measures.

4. **Basis reconciliation:** Alice and Bob publicly announce their basis choices (but not the bit values). They discard bits where they used different bases.

5. **Error estimation:** Alice and Bob publicly compare a subset of their remaining bits to estimate the error rate.

6. **Error correction:** If the error rate is below a threshold, they perform error correction to reconcile their keys.

7. **Privacy amplification:** They apply a hash function to distill a shorter but fully secret key.

**Security:** Eve's measurement disturbs the qubits, introducing errors. If the error rate is below approximately 11% (for the BB84 protocol), Alice and Bob can extract a secure key. If the error rate is above this threshold, they abort the protocol.

### E91 Protocol

The E91 protocol, proposed by Ekert in 1991, uses entanglement-based QKD.

**Protocol:**
1. A source distributes entangled pairs to Alice and Bob
2. Alice and Bob measure their qubits in randomly chosen bases
3. They publicly announce their basis choices
4. For bits where they used the same basis, they use the results as a key
5. For bits where they used different bases, they test Bell's inequality

**Security:** If Bell's inequality is violated, the entangled pairs are genuine, and Eve cannot have information about the key without disturbing the entanglement.

### Continuous-Variable QKD

Continuous-variable QKD (CV-QKD) encodes information in the continuous properties of light (amplitude and phase quadratures) rather than discrete qubit states. CV-QKD can use standard telecom components (homodyne or heterodyne detectors) instead of single-photon detectors, making it more practical for existing fiber networks.

## Real-World QKD Implementations

### Fiber-Optic QKD Systems

**ID Quantique (Geneva, Switzerland):**
- Cerberis system: 100 km range, 1 kbps key rate
- Uses BB84 protocol with decoy states
- Deployed in financial networks (Geneva elections, Swisscom)

**Toshiba (Cambridge, UK):**
- 600+ km range demonstrated
- High key rate (100+ kbps at 100 km)
- Uses differential phase shift QKD

**QuantumCTek (Hefei, China):**
- Beijing-Shanghai quantum backbone: 2,000+ km
- 32 trusted relay nodes
- Used for secure government communications

### Free-Space QKD

**Satellite QKD:**
- Micius satellite (China, 2016): Demonstrated QKD over 1,200 km
- Ground-to-satellite QKD: 1,000+ km range
- Intercontinental QKD demonstrated (China-Austria, 2017)

**Ground-based free-space:**
- Building-to-building QKD: 1-10 km range
- Atmospheric turbulence limits performance
- Daytime operation possible with narrow-band filtering

### QKD Standards

**ITU-T Y.3800-3803:** Framework for QKD networks
**ETSI QKD ISG:** Industry specifications for QKD components and interfaces
**ISO/IEC 23837:** Security requirements for QKD

## Practical QKD Implementation

### Simulated QKD with Qiskit

```python
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import random
import numpy as np

def bb84_alice(n_bits):
    """Alice's side of BB84 protocol."""
    bits = [random.randint(0, 1) for _ in range(n_bits)]
    bases = [random.randint(0, 1) for _ in range(n_bits)]
    
    qc = QuantumCircuit(n_bits, n_bits)
    for i in range(n_bits):
        if bits[i] == 1:
            qc.x(i)
        if bases[i] == 1:
            qc.h(i)
    
    return qc, bits, bases

def bb84_bob(qc, n_bits):
    """Bob's side of BB84 protocol."""
    bases = [random.randint(0, 1) for _ in range(n_bits)]
    
    for i in range(n_bits):
        if bases[i] == 1:
            qc.h(i)
    qc.measure(range(n_bits), range(n_bits))
    
    return qc, bases

def bb84_key_estimation(alice_bits, alice_bases, bob_bases, bob_results):
    """Estimate shared key from measurement results."""
    bob_bits = []
    for i in range(len(bob_bases)):
        bit_str = format(bob_results, f'0{len(bob_bases)}b')
        bob_bits.append(int(bit_str[i]))
    
    key_alice = []
    key_bob = []
    for i in range(len(alice_bases)):
        if alice_bases[i] == bob_bases[i]:
            key_alice.append(alice_bits[i])
            key_bob.append(bob_bits[i])
    
    return key_alice, key_bob

# Run BB84 protocol
n_bits = 16
simulator = AerSimulator()

qc, alice_bits, alice_bases = bb84_alice(n_bits)
qc, bob_bases = bb84_bob(qc, n_bits)

compiled = transpile(qc, simulator)
result = simulator.run(compiled, shots=1).result()
counts = result.get_counts()
measurement = list(counts.keys())[0]
bob_results = int(measurement, 2)

key_alice, key_bob = bb84_key_estimation(
    alice_bits, alice_bases, bob_bases, bob_results
)

print(f"Shared key length: {len(key_alice)}")
print(f"Alice's key: {key_alice}")
print(f"Bob's key: {key_bob}")
print(f"Keys match: {key_alice == key_bob}")
```

### Eavesdropping Detection

```python
def simulate_eavesdropping(qc, n_bits, eavesdrop_probability=0.1):
    """Simulate Eve intercepting and measuring qubits."""
    eve_bases = [random.randint(0, 1) for _ in range(n_bits)]
    
    for i in range(n_bits):
        if random.random() < eavesdrop_probability:
            if eve_bases[i] == 1:
                qc.h(i)
            qc.measure(i, i)
    
    return qc

n_bits = 1000
n_trials = 100

print("Without eavesdropping:")
error_rates_no_eve = []
for _ in range(n_trials):
    qc, alice_bits, alice_bases = bb84_alice(n_bits)
    qc, bob_bases = bb84_bob(qc, n_bits)
    
    compiled = transpile(qc, simulator)
    result = simulator.run(compiled, shots=1).result()
    measurement = list(result.get_counts().keys())[0]
    bob_results = int(measurement, 2)
    
    key_alice, key_bob = bb84_key_estimation(
        alice_bits, alice_bases, bob_bases, bob_results
    )
    
    if len(key_alice) > 0:
        errors = sum(1 for a, b in zip(key_alice, key_bob) if a != b)
        error_rate = errors / len(key_alice)
        error_rates_no_eve.append(error_rate)

print(f"Average error rate: {np.mean(error_rates_no_eve):.3f}")

print("\nWith 10% eavesdropping:")
error_rates_eve = []
for _ in range(n_trials):
    qc, alice_bits, alice_bases = bb84_alice(n_bits)
    qc = simulate_eavesdropping(qc, n_bits, eavesdrop_probability=0.1)
    qc, bob_bases = bb84_bob(qc, n_bits)
    
    compiled = transpile(qc, simulator)
    result = simulator.run(compiled, shots=1).result()
    measurement = list(result.get_counts().keys())[0]
    bob_results = int(measurement, 2)
    
    key_alice, key_bob = bb84_key_estimation(
        alice_bits, alice_bases, bob_bases, bob_results
    )
    
    if len(key_alice) > 0:
        errors = sum(1 for a, b in zip(key_alice, key_bob) if a != b)
        error_rate = errors / len(key_alice)
        error_rates_eve.append(error_rate)

print(f"Average error rate: {np.mean(error_rates_eve):.3f}")
```

## Quantum Sensing and Metrology

### Quantum Sensors

Quantum sensors use quantum states to measure physical quantities with precision beyond classical limits.

**Atomic clocks:** Use transitions in atoms to define the second. Current optical atomic clocks achieve fractional frequency uncertainties of 10⁻¹⁸. Future quantum networks could synchronize distributed atomic clocks for global timekeeping.

**Quantum magnetometers:** Use entangled states to measure magnetic fields with sensitivity below the standard quantum limit. Applications: medical imaging (MEG), geological surveying, submarine detection.

**Quantum gravimeters:** Use atom interferometry to measure gravitational acceleration with precision of 10⁻⁹ g. Applications: underground mapping, oil exploration, gravitational wave detection.

### Quantum Metrology Beyond the Standard Quantum Limit

Classical measurements are limited by the standard quantum limit (SQL): precision scales as 1/√N where N is the number of particles. Quantum entanglement can improve this to the Heisenberg limit: precision scales as 1/N.

For an N-particle entangled state (GHZ state):
|GHZ⟩ = (1/√2)(|0⟩^⊗N + |1⟩^⊗N)

A phase shift φ on each qubit produces:
|GHZ⟩ → (1/√2)(e^(iNφ)|0⟩^⊗N + e^(-iNφ)|1⟩^⊗N)

The phase is amplified by a factor of N, providing Heisenberg-limited precision.

## Quantum Computing: Near-Term Outlook

### NISQ Algorithms

The current era of quantum computing is dominated by noisy intermediate-scale quantum (NISQ) devices with 50-1000+ qubits. NISQ algorithms are designed to work within the constraints of noisy hardware:

**Variational Quantum Eigensolver (VQE):** Finds the ground state energy of a molecule by optimizing a parameterized quantum circuit. Applications: computational chemistry, materials science.

**Quantum Approximate Optimization Algorithm (QAOA):** Solves combinatorial optimization problems using a parameterized circuit. Applications: portfolio optimization, scheduling, routing.

**Quantum Machine Learning:** Uses quantum circuits for classification, clustering, and generative modeling. Applications: pattern recognition, anomaly detection, drug discovery.

### Fault-Tolerant Quantum Computing

Fault-tolerant quantum computing uses quantum error correction to protect computations from noise. The surface code is the leading error correction scheme, requiring approximately 1000 physical qubits per logical qubit.

Milestones needed for fault-tolerant quantum computing:
1. Physical error rates below 10⁻³ (achieved by some platforms)
2. Logical qubit error rates below 10⁻¹⁰ (not yet achieved)
3. Sufficient qubit count for useful algorithms (thousands of logical qubits)

Estimated timeline: 2030-2040 for the first fault-tolerant quantum computers capable of running Shor's algorithm on cryptographically relevant key sizes.

## The Quantum Future: Scenarios

### Near-Term (2025-2030)

- NISQ devices with 1000-10,000 physical qubits
- Quantum advantage demonstrated for specific chemistry and optimization problems
- QKD networks deployed in major cities
- Post-quantum cryptography standardized and widely deployed
- Hybrid classical-quantum computing for specific workloads

### Medium-Term (2030-2040)

- Early fault-tolerant quantum computers with 100+ logical qubits
- Quantum simulation of complex molecules for drug discovery
- Quantum-enhanced optimization for logistics and finance
- Quantum networks with quantum repeaters for inter-city communication
- Shor's algorithm demonstrated on small key sizes

### Long-Term (2040+)

- Large-scale fault-tolerant quantum computers
- Quantum internet connecting quantum computers globally
- Quantum-enhanced artificial intelligence
- Quantum sensing networks for global monitoring
- Quantum-secured communication infrastructure

## Quantum Computing Roadmap

### Hardware Development Timeline

**Near-term (2025-2027):**
- 1,000-10,000 physical qubits
- Error rates: 10⁻³-10⁻² for two-qubit gates
- NISQ algorithms for chemistry and optimization
- Proof-of-concept quantum advantage demonstrations

**Medium-term (2027-2032):**
- 10,000-100,000 physical qubits
- Error rates: 10⁻⁴-10⁻³ for two-qubit gates
- Early fault-tolerant quantum computing with 10-100 logical qubits
- Practical quantum simulation for drug discovery and materials science

**Long-term (2032-2040):**
- 100,000-10,000,000 physical qubits
- Error rates: <10⁻⁴ for two-qubit gates
- Large-scale fault-tolerant quantum computing with 100+ logical qubits
- Shor's algorithm for cryptographically relevant key sizes

**Far-term (2040+):**
- 10,000,000+ physical qubits
- Universal fault-tolerant quantum computing
- Quantum internet connecting quantum computers globally
- Quantum-enhanced AI and sensing networks

### Software Development Timeline

**Near-term (2025-2027):**
- Improved NISQ algorithms with better noise resilience
- Quantum machine learning frameworks
- Hybrid classical-quantum programming models
- Quantum cloud computing platforms

**Medium-term (2027-2032):**
- Quantum error correction libraries
- Quantum compiler optimizations
- Quantum programming languages with error correction support
- Quantum operating systems

**Long-term (2032-2040):**
- Quantum software development kits for fault-tolerant computing
- Quantum algorithm libraries for common problems
- Quantum cloud computing with guaranteed SLAs
- Quantum-native programming paradigms

### Industry Impact Assessment

**Pharmaceutical industry:** Quantum simulation of molecular interactions could reduce drug discovery time from 10-15 years to 3-5 years. Estimated impact: $50-100 billion annually.

**Financial industry:** Quantum optimization for portfolio management and risk analysis could improve returns by 5-15%. Estimated impact: $100-200 billion annually.

**Materials science:** Quantum simulation of material properties could accelerate development of new materials. Estimated impact: $20-50 billion annually.

**Logistics:** Quantum optimization for routing and scheduling could reduce costs by 10-20%. Estimated impact: $50-100 billion annually.

**Cybersecurity:** Post-quantum cryptography migration will require $10-50 billion in infrastructure upgrades globally.

## Quantum Computing Roadmap

### Hardware Development Timeline

**Near-term (2025-2027):**
- 1,000-10,000 physical qubits
- Error rates: 10⁻³-10⁻² for two-qubit gates
- NISQ algorithms for chemistry and optimization
- Proof-of-concept quantum advantage demonstrations

**Medium-term (2027-2032):**
- 10,000-100,000 physical qubits
- Error rates: 10⁻⁴-10⁻³ for two-qubit gates
- Early fault-tolerant quantum computing with 10-100 logical qubits
- Practical quantum simulation for drug discovery and materials science

**Long-term (2032-2040):**
- 100,000-10,000,000 physical qubits
- Error rates: <10⁻⁴ for two-qubit gates
- Large-scale fault-tolerant quantum computing with 100+ logical qubits
- Shor's algorithm for cryptographically relevant key sizes

**Far-term (2040+):**
- 10,000,000+ physical qubits
- Universal fault-tolerant quantum computing
- Quantum internet connecting quantum computers globally
- Quantum-enhanced AI and sensing networks

### Software Development Timeline

**Near-term (2025-2027):**
- Improved NISQ algorithms with better noise resilience
- Quantum machine learning frameworks
- Hybrid classical-quantum programming models
- Quantum cloud computing platforms

**Medium-term (2027-2032):**
- Quantum error correction libraries
- Quantum compiler optimizations
- Quantum programming languages with error correction support
- Quantum operating systems

**Long-term (2032-2040):**
- Quantum software development kits for fault-tolerant computing
- Quantum algorithm libraries for common problems
- Quantum cloud computing with guaranteed SLAs
- Quantum-native programming paradigms

### Industry Impact Assessment

**Pharmaceutical industry:** Quantum simulation of molecular interactions could reduce drug discovery time from 10-15 years to 3-5 years. Estimated impact: $50-100 billion annually.

**Financial industry:** Quantum optimization for portfolio management and risk analysis could improve returns by 5-15%. Estimated impact: $100-200 billion annually.

**Materials science:** Quantum simulation of material properties could accelerate development of new materials. Estimated impact: $20-50 billion annually.

**Logistics:** Quantum optimization for routing and scheduling could reduce costs by 10-20%. Estimated impact: $50-100 billion annually.

**Cybersecurity:** Post-quantum cryptography migration will require $10-50 billion in infrastructure upgrades globally.

## Quantum Key Distribution: Technical Deep Dive

### Decoy State Protocol

The decoy state protocol is essential for practical QKD. It addresses the photon-number splitting (PNS) attack, where Eve blocks single-photon pulses and splits multi-photon pulses.

**Protocol:**
1. Alice randomly prepares weak coherent pulses with different intensities (signal and decoy states)
2. Bob measures all pulses
3. Alice and Bob compare statistics for each intensity level
4. If the statistics deviate from expected values, Eve is detected

**Security:** The decoy state protocol provides security against PNS attacks even when using weak coherent pulses instead of true single-photon sources.

**Decoy state implementations:**
- One-decoy protocol: Uses one decoy intensity level. Provides moderate security.
- Two-decoy protocol: Uses two decoy intensity levels. Provides strong security.
- Infinite-decoy protocol: Theoretical limit. Provides maximum security.

**Key rate analysis:**
- Without decoy states: Key rate limited by PNS attacks
- With decoy states: Key rate approaches theoretical limit
- Decoy states increase key rate by 2-5× for typical fiber channels

### Continuous-Variable QKD

CV-QKD encodes information in the continuous quadratures of light (amplitude and phase). It uses standard telecom components instead of single-photon detectors.

**Advantages:**
- Compatible with existing fiber infrastructure
- Higher key rates at short distances (< 50 km)
- No need for single-photon detectors

**Disadvantages:**
- Lower key rates at long distances (> 100 km)
- More susceptible to excess noise
- Limited distance range

**CV-QKD vs. DV-QKD comparison:**

| Metric | CV-QKD | DV-QKD |
|--------|--------|--------|
| Detector | Homodyne/heterodyne | Single-photon |
| Key rate (10 km) | 100 Mbps | 10 Mbps |
| Key rate (100 km) | 1 kbps | 10 kbps |
| Distance limit | 100-150 km | 200-300 km |
| Cost | Lower (standard components) | Higher (specialized detectors) |

**CV-QKD implementations:**
- Toshiba: 100 km range, 10 Mbps key rate
- ID Quantique: 50 km range, 1 Mbps key rate
- Research labs: 200+ km range demonstrated

### Measurement-Device-Independent QKD

MDI-QKD removes all detector side-channel attacks by having both Alice and Bob send states to an untrusted third party (Charlie) who performs Bell state measurements.

**Protocol:**
1. Alice and Bob each prepare and send quantum states to Charlie
2. Charlie performs Bell state measurements and announces results
3. Alice and Bob post-process to extract a shared key

**Security:** MDI-QKD is secure against all detector attacks, including blinding attacks and time-shift attacks.

**Implementation challenges:**
- Requires phase-stable interferometers
- Charlie must be trusted (but not the quantum states)
- Key rates are lower than standard QKD
- Distance is limited by photon loss

**MDI-QKD vs. standard QKD:**
- Standard QKD: Higher key rates, but vulnerable to detector attacks
- MDI-QKD: Lower key rates, but immune to detector attacks
- For high-security applications: MDI-QKD is preferred
- For most applications: Standard QKD with decoy states is sufficient

### Twin-Field QKD

MDI-QKD removes all detector side-channel attacks by having both Alice and Bob send states to an untrusted third party (Charlie) who performs Bell state measurements.

**Protocol:**
1. Alice and Bob each prepare and send quantum states to Charlie
2. Charlie performs Bell state measurements and announces results
3. Alice and Bob post-process to extract a shared key

**Security:** MDI-QKD is secure against all detector attacks, including blinding attacks and time-shift attacks.

## Quantum Sensing: Technical Deep Dive

### Entanglement-Enhanced Sensing

Entanglement can improve measurement precision beyond the standard quantum limit (SQL). For N entangled particles, the precision improves from 1/√N (SQL) to 1/N (Heisenberg limit).

**Example: Entangled atomic clock**
1. Prepare N atoms in a GHZ state: |GHZ⟩ = (|0⟩^⊗N + |1⟩^⊗N) / √2
2. Each atom accumulates phase φ during interrogation time T
3. The GHZ state accumulates phase Nφ
4. Measurement precision: Δφ = 1/N (Heisenberg limit)

**Practical challenges:**
- Decoherence reduces entanglement during interrogation
- State preparation and measurement introduce errors
- Current demonstrations achieve approximately 1/√N scaling with modest entanglement

### Quantum Radar and LIDAR

Quantum radar uses entangled photons to detect objects with low signal-to-noise ratio.

**Protocol:**
1. Generate entangled photon pairs (signal and idler)
2. Send signal photon toward target, keep idler photon
3. Detect reflected signal photon and idler photon in coincidence
4. Coincidence detection filters out noise

**Advantages:**
- Detection in high-noise environments
- Low probability of intercept (signal photon is low-power)
- Potential for sub-diffraction-limit imaging

## Assessment

**Task 1: QKD Protocol Implementation (60 minutes)**
Implement the BB84 QKD protocol using Qiskit with at least 1000 qubits. Simulate the protocol with and without eavesdropping. Measure the key generation rate and error rate for different eavesdropping probabilities (0%, 5%, 10%, 15%, 20%). Determine the maximum tolerable eavesdropping probability for secure key generation. Discuss the practical limitations of QKD and compare with classical key exchange.

**Task 2: Quantum Network Analysis (45 minutes)**
Analyze a quantum network with 5 nodes connected in a line topology. Each adjacent pair shares an entangled pair with fidelity 0.95. Calculate the end-to-end entanglement fidelity after entanglement swapping through the intermediate nodes. Discuss how quantum repeaters and entanglement purification could improve the fidelity. Estimate the resources (quantum memory, Bell state measurements) required for a 1000-km quantum network.

**Task 3: Quantum Sensing Protocol (60 minutes)**
Implement a quantum sensing protocol using a GHZ state to estimate a phase shift. Compare the sensitivity of the GHZ state with N = 4, 8, 16 qubits against the standard quantum limit. Calculate the Heisenberg limit for each case. Discuss practical limitations (decoherence, state preparation errors) that prevent achieving the Heisenberg limit in real systems.

**Task 4: Future Technology Assessment (45 minutes)**
For each of the following technologies, assess the current state of development, the key challenges remaining, and the estimated timeline for practical deployment: (a) quantum repeaters, (b) quantum memory, (c) fault-tolerant quantum computing, (d) quantum internet. Support your analysis with references to recent publications and industry roadmaps.

**Grading Criteria:**
- QKD implementation correctly demonstrates protocol mechanics and eavesdropping detection (25%)
- Quantum network analysis correctly computes entanglement fidelity and resource requirements (25%)
- Quantum sensing protocol correctly demonstrates Heisenberg-limited metrology (25%)
- Future technology assessment demonstrates deep understanding of current capabilities and challenges (25%)

## Evidence

- Kimble, H.J. "The quantum internet." *Nature* 453, 1023 (2008).
- Bennett, C.H. & Brassard, G. "Quantum cryptography: Public key distribution and coin tossing." *Theoretical Computer Science* 560, 7 (2014).
- Ekert, A.K. "Quantum cryptography based on Bell's theorem." *Physical Review Letters* 67, 661 (1991).
- Liao, S.K. et al. "Satellite-to-ground quantum key distribution." *Nature* 549, 43 (2017).
- Preskill, J. "Quantum Computing in the NISQ era and beyond." *Quantum* 2, 79 (2018).
- Nielsen, M.A. & Chuang, I.L. *Quantum Computation and Quantum Information*. Cambridge University Press, 2010. Chapter 12.
