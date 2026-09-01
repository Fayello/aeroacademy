# Module 9 — Implementation

## Quantum Computing Implementation

This module covers the practical aspects of implementing quantum algorithms using Qiskit, running circuits on simulators and real quantum hardware, and understanding the IBM Quantum ecosystem.

## Qiskit Installation and Setup

### Installing Qiskit

Qiskit is the most widely used open-source framework for quantum computing. It provides tools for circuit construction, simulation, and execution on real quantum hardware.

```bash
# Install Qiskit and its components
pip install qiskit
pip install qiskit-aer
pip install qiskit-ibm-runtime
pip install qiskit-experiments
pip install qiskit-nature
pip install qiskit-machine-learning
```

### Verifying the Installation

```python
import qiskit
print(f"Qiskit version: {qiskit.__version__}")

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

# Create a simple circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

# Run on simulator
simulator = AerSimulator()
result = simulator.run(qc, shots=100).result()
counts = result.get_counts()
print(f"Test circuit results: {counts}")
```

### IBM Quantum Account

To run circuits on real quantum hardware, you need an IBM Quantum account:

1. Sign up at https://quantum.ibm.com/
2. Get your API token from the dashboard
3. Save your token locally:

```python
from qiskit_ibm_runtime import QiskitRuntimeService

# Save your account (one-time setup)
QiskitRuntimeService.save_account(
    channel="ibm_quantum",
    token="your-api-token-here",
    overwrite=True
)

# Load your account
service = QiskitRuntimeService()
print(f"Available backends: {service.backends()}")
```

## Quantum Circuit Construction

### Building Circuits from Scratch

Qiskit circuits are built by adding gates to quantum registers and classical registers:

```python
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister

# Create registers
qr = QuantumRegister(3, 'q')
cr = ClassicalRegister(3, 'c')

# Create circuit
qc = QuantumCircuit(qr, cr)

# Add gates
qc.h(0)
qc.cx(0, 1)
qc.rz(0.5, 2)
qc.measure([0, 1, 2], [0, 1, 2])

print(qc.draw())
```

### Circuit Composition

Complex circuits are built by composing smaller sub-circuits:

```python
def bell_state():
    """Create a Bell state circuit."""
    qc = QuantumCircuit(2, 2)
    qc.h(0)
    qc.cx(0, 1)
    qc.measure([0, 1], [0, 1])
    return qc

def ghz_state(n):
    """Create an n-qubit GHZ state."""
    qc = QuantumCircuit(n, n)
    qc.h(0)
    for i in range(n - 1):
        qc.cx(i, i + 1)
    qc.measure(range(n), range(n))
    return qc

# Compose circuits
qc = QuantumCircuit(4, 4)
qc.compose(bell_state(), qubits=[0, 1], clbits=[0, 1], inplace=True)
qc.compose(bell_state(), qubits=[2, 3], clbits=[2, 3], inplace=True)
print(qc.draw())
```

### Parameterized Circuits

Variational quantum algorithms use parameterized circuits with tunable parameters:

```python
from qiskit.circuit import Parameter

# Create parameterized circuit
theta = Parameter('θ')
phi = Parameter('φ')

qc = QuantumCircuit(2)
qc.ry(theta, 0)
qc.rz(phi, 0)
qc.cx(0, 1)

# Bind parameters
bound_qc = qc.bind_parameters({theta: 0.5, phi: 0.3})
print(bound_qc.draw())
```

## Running on Simulators

### AerSimulator

The AerSimulator is the primary Qiskit simulator, supporting noise models and various backends:

```python
from qiskit_aer import AerSimulator
from qiskit import transpile

# Create circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

# Run ideal simulation
simulator = AerSimulator()
compiled = transpile(qc, simulator)
result = simulator.run(compiled, shots=1000).result()
counts = result.get_counts()
print(f"Ideal simulation: {counts}")

# Run with noise model
from qiskit_aer.noise import NoiseModel, depolarizing_error

noise_model = NoiseModel()
error = depolarizing_error(0.01, 1)
noise_model.add_all_qubit_quantum_error(error, ['u1', 'u2', 'u3'])

error_2q = depolarizing_error(0.02, 2)
noise_model.add_all_qubit_quantum_error(error_2q, ['cx'])

noisy_simulator = AerSimulator(noise_model=noise_model)
compiled_noisy = transpile(qc, noisy_simulator)
result_noisy = noisy_simulator.run(compiled_noisy, shots=1000).result()
counts_noisy = result_noisy.get_counts()
print(f"Noisy simulation: {counts_noisy}")
```

### Statevector Simulator

The statevector simulator provides the full quantum state:

```python
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)

simulator = AerSimulator(method='statevector')
compiled = transpile(qc, simulator)
result = simulator.run(compiled).result()
statevector = result.get_statevector()
print(f"Statevector: {statevector}")
print(f"Probabilities: {statevector.probabilities_dict()}")
```

### Matrix Product State Simulator

For circuits with limited entanglement, the MPS simulator is more efficient:

```python
simulator = AerSimulator(method='matrix_product_state')
```

## Running on Real Quantum Hardware

### Available Backends

IBM Quantum provides access to various quantum processors:

```python
from qiskit_ibm_runtime import QiskitRuntimeService

service = QiskitRuntimeService()

# List available backends
backends = service.backends()
for backend in backends:
    status = backend.status()
    print(f"{backend.name}: {status.operational}, {status.pending_jobs} pending jobs")
```

### Transpilation

Real quantum hardware has specific gate sets and qubit connectivity. Transpilation converts your circuit to the hardware's native gate set and maps logical qubits to physical qubits:

```python
from qiskit import transpile
from qiskit_ibm_runtime import QiskitRuntimeService

service = QiskitRuntimeService()
backend = service.backend("ibm_brisbane")

# Create circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

# Transpile with different optimization levels
compiled_0 = transpile(qc, backend, optimization_level=0)
compiled_1 = transpile(qc, backend, optimization_level=1)
compiled_2 = transpile(qc, backend, optimization_level=2)
compiled_3 = transpile(qc, backend, optimization_level=3)

print(f"Optimization level 0: {compiled_0.depth()} depth, {compiled_0.count_ops()}")
print(f"Optimization level 1: {compiled_1.depth()} depth, {compiled_1.count_ops()}")
print(f"Optimization level 2: {compiled_2.depth()} depth, {compiled_2.count_ops()}")
print(f"Optimization level 3: {compiled_3.depth()} depth, {compiled_3.count_ops()}")
```

### Submitting Jobs

```python
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler

service = QiskitRuntimeService()
backend = service.backend("ibm_brisbane")

# Create and transpile circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

compiled = transpile(qc, backend)

# Submit job using the new primitives interface
sampler = Sampler(backend)
job = sampler.run(compiled)
result = job.result()
print(f"Result: {result}")
```

### Reading Results

```python
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler

service = QiskitRuntimeService()
backend = service.backend("ibm_brisbane")

# Create and run circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

compiled = transpile(qc, backend)
sampler = Sampler(backend)
job = sampler.run(compiled)
result = job.result()

# Extract counts
counts = result.get_counts()
print(f"Measurement counts: {counts}")

# Calculate probabilities
total_shots = sum(counts.values())
for state, count in counts.items():
    probability = count / total_shots
    print(f"|{state}>: {count} shots ({probability:.3f})")
```

## Error Mitigation

### Measurement Error Mitigation

Measurement errors can be calibrated and corrected:

```python
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler, Options

service = QiskitRuntimeService()
backend = service.backend("ibm_brisbane")

# Create circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

compiled = transpile(qc, backend)

# Run with measurement error mitigation
options = Options()
options.resilience_level = 1
sampler = Sampler(backend, options=options)
job = sampler.run(compiled)
result = job.result()
print(f"Mitigated result: {result}")
```

### Zero-Noise Extrapolation

Run circuits at different noise levels and extrapolate to zero noise:

```python
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler, Options

options = Options()
options.resilience_level = 2

sampler = Sampler(backend, options=options)
```

### Dynamical Decoupling

Insert identity-equivalent gate sequences to suppress decoherence:

```python
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
from qiskit.transpiler import PassManager
from qiskit.transpiler.passes import DynamicalDecoupling
from qiskit.circuit.library import XGate

pm = generate_preset_pass_manager(
    optimization_level=3,
    backend=backend,
    dynamical_decoupling=True,
    dd_sequence=[XGate(), XGate()]
)
```

## Complete Example: Grover's Algorithm on Real Hardware

```python
from qiskit import QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler, Options
import numpy as np

def grover_oracle(n, marked):
    """Oracle that marks a specific state."""
    qc = QuantumCircuit(n)
    binary = format(marked, f'0{n}b')
    for i, bit in enumerate(reversed(binary)):
        if bit == '0':
            qc.x(i)
    qc.h(n-1)
    qc.mcx(list(range(n-1)), n-1)
    qc.h(n-1)
    for i, bit in enumerate(reversed(binary)):
        if bit == '0':
            qc.x(i)
    return qc

def diffusion(n):
    """Diffusion operator."""
    qc = QuantumCircuit(n)
    qc.h(range(n))
    qc.x(range(n))
    qc.h(n-1)
    qc.mcx(list(range(n-1)), n-1)
    qc.h(n-1)
    qc.x(range(n))
    qc.h(range(n))
    return qc

def grover_circuit(n, marked, iterations):
    """Complete Grover circuit."""
    qc = QuantumCircuit(n, n)
    qc.h(range(n))
    for _ in range(iterations):
        qc.compose(grover_oracle(n, marked), inplace=True)
        qc.compose(diffusion(n), inplace=True)
    qc.measure(range(n), range(n))
    return qc

n = 3
marked = 5
iterations = 1

qc = grover_circuit(n, marked, iterations)

service = QiskitRuntimeService()
backend = service.backend("ibm_brisbane")

compiled = transpile(qc, backend, optimization_level=3)
print(f"Circuit depth: {compiled.depth()}")
print(f"Gate counts: {compiled.count_ops()}")

options = Options()
options.resilience_level = 1
sampler = Sampler(backend, options=options)

job = sampler.run(compiled)
result = job.result()
counts = result.get_counts()

print(f"\nResults for searching for |{format(marked, f'0{n}b')}>:")
for state, count in sorted(counts.items()):
    print(f"  |{state}>: {count}")

target_binary = format(marked, f'0{n}b')
target_count = counts.get(target_binary, 0)
total = sum(counts.values())
print(f"\nTarget state |{target_binary}>: {target_count}/{total} ({target_count/total*100:.1f}%)")
```

## Quantum Computing Best Practices

### Circuit Design Principles

**Minimize circuit depth:** Every additional gate layer increases the chance of decoherence. Design circuits with the minimum number of sequential operations.

**Minimize two-qubit gates:** Two-qubit gates (CNOT, CZ) are the primary source of errors. Use the minimum number of two-qubit gates necessary.

**Use native gate sets:** Design circuits using the native gate set of your target hardware. This avoids expensive decomposition during transpilation.

**Leverage circuit symmetry:** Symmetric circuits can often be optimized more effectively by the transpiler.

**Test incrementally:** Build and test circuits incrementally, verifying each stage before adding complexity.

### Debugging Quantum Circuits

**Statevector inspection:** Use the statevector simulator to inspect the quantum state at each stage. This helps identify where errors occur.

**Unitary verification:** Use the Operator class to verify that your circuit implements the intended unitary transformation.

**Noiseless simulation:** Always run circuits on a noiseless simulator first to verify correctness before testing on noisy hardware.

**Comparison with theory:** Compare simulation results with theoretical predictions. Discrepancies indicate bugs in the circuit or noise in the hardware.

### Performance Optimization

**Circuit compression:** Use Qiskit's transpiler to compress circuits, removing redundant gates and combining adjacent operations.

**Dynamic decoupling:** Insert identity-equivalent gate sequences to suppress decoherence during idle periods.

**Measurement optimization:** Measure all qubits simultaneously rather than sequentially to reduce measurement time.

**Batch processing:** Submit multiple circuits as a single job to reduce overhead from job scheduling and data transfer.

### Hardware-Specific Considerations

**IBM Quantum:** Heavy-hex topology, native gates: √X, RZ, CX. Best for circuits with limited connectivity requirements.

**Google Sycamore:** Sycamore topology, native gates: √X, RZ, CZ. Optimized for random circuit sampling.

**IonQ:** All-to-all connectivity, native gates: √X, RZ, XX. Best for circuits requiring arbitrary two-qubit gates.

**QuEra:** Neutral atom topology, native gates: √X, RZ, CZ. Supports mid-circuit measurement and reset.

## Quantum Computing Best Practices

### Circuit Design Principles

**Minimize circuit depth:** Every additional gate layer increases the chance of decoherence. Design circuits with the minimum number of sequential operations.

**Minimize two-qubit gates:** Two-qubit gates (CNOT, CZ) are the primary source of errors. Use the minimum number of two-qubit gates necessary.

**Use native gate sets:** Design circuits using the native gate set of your target hardware. This avoids expensive decomposition during transpilation.

**Leverage circuit symmetry:** Symmetric circuits can often be optimized more effectively by the transpiler.

**Test incrementally:** Build and test circuits incrementally, verifying each stage before adding complexity.

### Debugging Quantum Circuits

**Statevector inspection:** Use the statevector simulator to inspect the quantum state at each stage. This helps identify where errors occur.

**Unitary verification:** Use the Operator class to verify that your circuit implements the intended unitary transformation.

**Noiseless simulation:** Always run circuits on a noiseless simulator first to verify correctness before testing on noisy hardware.

**Comparison with theory:** Compare simulation results with theoretical predictions. Discrepancies indicate bugs in the circuit or noise in the hardware.

### Performance Optimization

**Circuit compression:** Use Qiskit's transpiler to compress circuits, removing redundant gates and combining adjacent operations.

**Dynamic decoupling:** Insert identity-equivalent gate sequences to suppress decoherence during idle periods.

**Measurement optimization:** Measure all qubits simultaneously rather than sequentially to reduce measurement time.

**Batch processing:** Submit multiple circuits as a single job to reduce overhead from job scheduling and data transfer.

### Hardware-Specific Considerations

**IBM Quantum:** Heavy-hex topology, native gates: √X, RZ, CX. Best for circuits with limited connectivity requirements.

**Google Sycamore:** Sycamore topology, native gates: √X, RZ, CZ. Optimized for random circuit sampling.

**IonQ:** All-to-all connectivity, native gates: √X, RZ, XX. Best for circuits requiring arbitrary two-qubit gates.

**QuEra:** Neutral atom topology, native gates: √X, RZ, CZ. Supports mid-circuit measurement and reset.

### Hardware Selection Guide

Choosing the right quantum hardware depends on your specific application:

**For circuit depth-limited applications:** Use trapped ions (IonQ, Quantinuum) with long coherence times.

**For gate count-limited applications:** Use superconducting qubits (IBM, Google) with fast gate times.

**For connectivity-limited applications:** Use trapped ions with all-to-all connectivity.

**For NISQ algorithms:** Use superconducting qubits with mature software ecosystem.

**For error correction research:** Use neutral atoms (QuEra) with mid-circuit measurement.

**Cost comparison:**
- IBM Quantum: Free tier available, paid plans from $1.60/second
- Google Quantum AI: Limited access through research partnerships
- IonQ: Available through cloud providers (AWS, Azure)
- QuEra: Available through cloud providers
- Rigetti: Available through cloud providers (AWS)

**Choosing between cloud and on-premises:**
- Cloud: Lower upfront cost, access to latest hardware, no maintenance
- On-premises: Lower long-term cost, full control, no network latency
- Hybrid: Use cloud for development, on-premises for production

**Job scheduling optimization:** Quantum hardware is a shared resource. Optimize job submission by:
- Batching multiple circuits into a single job
- Submitting jobs during off-peak hours for faster execution
- Using dynamic circuits to reduce the number of separate jobs
- Monitoring queue times and adjusting submission strategy

## Quantum Algorithm Implementation Patterns

### Variational Quantum Eigensolver (VQE) Pattern

VQE is used to find the ground state energy of a Hamiltonian. The pattern involves:

1. **Ansatz:** A parameterized quantum circuit that prepares a trial state
2. **Measurement:** Measure the expectation value of the Hamiltonian
3. **Optimization:** Use a classical optimizer to minimize the energy

```python
from qiskit.circuit import Parameter
from qiskit_aer import AerSimulator
from qiskit import transpile
import numpy as np

# Create parameterized ansatz
theta = Parameter('θ')
phi = Parameter('φ')

ansatz = QuantumCircuit(2)
ansatz.ry(theta, 0)
ansatz.ry(phi, 1)
ansatz.cx(0, 1)

# Define Hamiltonian (simplified)
def hamiltonian_expectation(params, ansatz, simulator):
    bound = ansatz.bind_parameters(params)
    bound.measure_all()
    compiled = transpile(bound, simulator)
    result = simulator.run(compiled, shots=1000).result()
    counts = result.get_counts()
    energy = compute_energy(counts)
    return energy

# Classical optimization loop
from scipy.optimize import minimize

initial_params = [0.0, 0.0]
result = minimize(
    lambda p: hamiltonian_expectation(p, ansatz, AerSimulator()),
    initial_params,
    method='COBYLA'
)
print(f"Ground state energy: {result.fun}")
```

### Quantum Approximate Optimization Algorithm (QAOA) Pattern

QAOA is used for combinatorial optimization problems. The pattern involves:

1. **Problem Hamiltonian:** Encode the optimization problem as a Hamiltonian
2. **Mixing Hamiltonian:** A simple Hamiltonian that explores the solution space
3. **Alternating layers:** Apply problem and mixing Hamiltonians alternately

```python
def qaoa_circuit(gamma, beta, problem_edges):
    """Create QAOA circuit for a MaxCut problem."""
    n = len(set([e[0] for e in problem_edges] + [e[1] for e in problem_edges]))
    qc = QuantumCircuit(n, n)
    
    # Initial superposition
    qc.h(range(n))
    
    # Problem unitary
    for i, j in problem_edges:
        qc.cx(i, j)
        qc.rz(2 * gamma, j)
        qc.cx(i, j)
    
    # Mixing unitary
    for i in range(n):
        qc.rx(2 * beta, i)
    
    qc.measure(range(n), range(n))
    return qc
```

### Quantum Machine Learning Pattern

Quantum machine learning uses quantum circuits for classification and pattern recognition. The pattern involves:

1. **Feature map:** Encode classical data into quantum states
2. **Variational circuit:** A parameterized quantum circuit for classification
3. **Measurement:** Measure to get prediction

```python
def quantum_classifier(x, params):
    """Simple quantum classifier."""
    qc = QuantumCircuit(2, 1)
    
    # Encode input features
    qc.ry(x[0], 0)
    qc.ry(x[1], 1)
    
    # Variational circuit
    qc.ry(params[0], 0)
    qc.ry(params[1], 1)
    qc.cx(0, 1)
    qc.ry(params[2], 0)
    
    # Measure
    qc.measure(0, 0)
    return qc
```

## Quantum Error Correction Basics

### The Need for Error Correction

Quantum error correction (QEC) is essential for fault-tolerant quantum computing. Without QEC, errors accumulate exponentially with circuit depth, making deep circuits impossible.

**Types of quantum errors:**
- **Bit-flip errors:** |0⟩ → |1⟩ or |1⟩ → |0⟩ (like classical bit flips)
- **Phase-flip errors:** |+⟩ → |−⟩ or |−⟩ → |+⟩ (no classical analog)
- **Depolarizing errors:** Random application of X, Y, or Z gates
- **Measurement errors:** Incorrect measurement outcomes

**Error rates on current hardware:**
- Single-qubit gate error: 0.01-0.1%
- Two-qubit gate error: 0.1-2%
- Measurement error: 0.5-5%
- Idle error (decoherence): 0.01-0.1% per microsecond

**Impact on circuit depth:**
- If each gate has error rate ε, the probability of no errors in a circuit with N gates is (1-ε)^N
- For ε = 0.01% and N = 100: success probability ≈ 99%
- For ε = 0.01% and N = 1000: success probability ≈ 90%
- For ε = 0.01% and N = 10000: success probability ≈ 37%

This exponential decay of fidelity with circuit depth is why error correction is essential for deep circuits.

### The Surface Code

The surface code is the leading quantum error correction code. It encodes one logical qubit in O(d²) physical qubits, where d is the code distance.

**Properties:**
- Threshold error rate: approximately 1% (for depolarizing noise)
- Logical error rate: approximately 0.1^(d/2) for code distance d
- Overhead: approximately 1000 physical qubits per logical qubit for 99.9% fidelity

**Stabilizer measurements:** The surface code measures stabilizer operators (products of Pauli operators) to detect errors without collapsing the logical state.

### Error Correction in Practice

Current quantum computers do not have sufficient qubit counts or error rates for full surface code error correction. However, partial error correction techniques can improve results:

**Zero-noise extrapolation:** Run circuits at different noise levels and extrapolate to zero noise.

**Probabilistic error cancellation:** Apply random Pauli operators to simulate an effective error channel.

**Dynamical decoupling:** Insert identity-equivalent gate sequences to suppress decoherence.

**Error mitigation vs. error correction:**
- Error mitigation: Reduces the effect of errors without adding qubits. Limited to shallow circuits.
- Error correction: Eliminates errors by encoding logical qubits in many physical qubits. Required for deep circuits.

**Current status:** We are in the era of error mitigation, not error correction. The transition to error correction will happen as qubit counts increase and error rates decrease.

**Quantum error correction codes:**
- **Surface code:** The leading code. High threshold (1%), but requires many physical qubits per logical qubit.
- **Color code:** Similar to surface code but supports transversal T gates. Lower threshold.
- **Steane code:** A small code that encodes 1 logical qubit in 7 physical qubits. Good for demonstrations.
- **Shor code:** The first quantum error correction code. Encodes 1 logical qubit in 9 physical qubits. Historical significance.

**Error correction overhead:**
- Code distance 3: 17 physical qubits per logical qubit, corrects 1 error
- Code distance 5: 49 physical qubits per logical qubit, corrects 2 errors
- Code distance 7: 97 physical qubits per logical qubit, corrects 3 errors
- Code distance 13: 337 physical qubits per logical qubit, corrects 6 errors

For RSA-2048, you need approximately 4096 logical qubits. With code distance 7, this requires approximately 400,000 physical qubits. This is within reach of future quantum computers but far beyond current capabilities.

**Quantum advantage timeline:** The timeline for achieving quantum advantage in error correction:
- 2024-2026: Demonstrate logical qubit with break-even (logical error rate < physical error rate)
- 2026-2028: Demonstrate fault-tolerant operations on multiple logical qubits
- 2028-2032: Demonstrate useful fault-tolerant computation (100+ logical qubits)
- 2032-2040: Large-scale fault-tolerant quantum computing (1000+ logical qubits)

**Practical error correction examples:**
- Google's 2023 demonstration: 48 logical qubits using the surface code
- Quantinuum's 2023 demonstration: 12 logical qubits with real-time error correction
- IBM's 2023 demonstration: 127-qubit processor with error mitigation

**Future applications of error-corrected quantum computing:**
- Shor's algorithm for factoring large integers
- Quantum simulation of complex molecules
- Quantum optimization for logistics and finance
- Quantum machine learning for pattern recognition

**Key metrics for evaluating quantum hardware:**
- Quantum volume: A holistic measure of quantum computer capability
- CLOPS: Circuit Layer Operations Per Second (throughput metric)
- QV (Quantum Volume): Measures the largest square circuit that can be run with > 50% success rate
- Algorithmic qubits: Number of qubits available for useful computation after error correction
- Two-qubit gate fidelity: The most critical metric for circuit quality
- Coherence time: How long qubits maintain their quantum state (T1 and T2)
- Connectivity: Which qubit pairs can directly interact

**Staying current:** The quantum computing field evolves rapidly. Key resources for staying current:
- IBM Quantum documentation and research papers
- Google AI Quantum research publications
- Academic conferences (QIP, APS March Meeting, IEEE Quantum Week)
- Preprint servers (arXiv quant-ph section)
- Qiskit community and tutorials
- Nature, Science, and Physical Review Letters journals

## Assessment

**Task 1: Circuit Construction (45 minutes)**
Implement the following quantum circuits in Qiskit: (a) 3-qubit GHZ state, (b) 4-qubit W state (equal superposition of |1000>, |0100>, |0010>, |0001>), (c) quantum Fourier transform on 3 qubits. For each circuit, verify the output using the statevector simulator and compare with theoretical predictions. Submit all circuits and state vectors.

**Task 2: Noise Analysis (60 minutes)**
Run a Bell state circuit on the AerSimulator with different noise levels (1%, 2%, 5%, 10% depolarizing noise). For each noise level, run 10000 shots and record the measurement counts. Analyze how noise affects: (a) the probability of correct outcomes, (b) the appearance of incorrect outcomes, (c) the fidelity of the output state. Create a plot of fidelity vs. noise level and discuss the implications for real quantum hardware.

**Task 3: Real Hardware Execution (60 minutes)**
Run a Grover's algorithm circuit for N=8 (3 qubits, searching for state |101>) on an IBM Quantum backend. Use at least 1000 shots. Compare the results with ideal simulation and noisy simulation. Analyze the effect of: (a) circuit depth, (b) number of CNOT gates, (c) measurement error. Discuss whether the quantum speedup is observable given the noise.

**Task 4: Error Mitigation Comparison (60 minutes)**
Run the same circuit with three different error mitigation strategies: (a) no mitigation, (b) measurement error mitigation (resilience_level=1), (c) zero-noise extrapolation (resilience_level=2). Compare the results in terms of: (a) accuracy, (b) computation time, (c) resource overhead. Discuss the tradeoffs between different mitigation strategies and recommend a strategy for a specific application.

**Grading Criteria:**
- Circuits are correctly implemented and produce expected theoretical results (25%)
- Noise analysis demonstrates understanding of decoherence effects (25%)
- Real hardware execution is successful and results are properly analyzed (25%)
- Error mitigation comparison provides meaningful insights into practical quantum computing (25%)

## Evidence

- Qiskit Textbook: https://learning.quantum.ibm.com/
- IBM Quantum documentation: https://quantum.ibm.com/
- cross, A.W. et al. "Exploiting symmetry in error mitigation." *Physical Review Letters* 124, 160501 (2020).
- Temme, K. et al. "Error mitigation for short-depth quantum circuits." *Physical Review Letters* 119, 180509 (2017).
- Kandala, A. et al. "Hardware-efficient variational quantum eigensolver for small molecules and quantum magnets." *Nature* 549, 242 (2017).
