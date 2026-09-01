# Module 2 — Quantum Gates

## Gates as Unitary Matrices

In classical computing, gates are logical operations: AND, OR, NOT, XOR. They take definite inputs (0 or 1) and produce definite outputs. In quantum computing, gates are unitary matrices that transform qubit state vectors. A unitary matrix U satisfies U†U = UU† = I, where U† is the conjugate transpose and I is the identity matrix. Unitarity guarantees that quantum gates are reversible — you can always compute the input from the output — and that they preserve the normalization of quantum states.

This is a critical constraint. In classical logic, you can have a two-input AND gate that maps four possible inputs to two possible outputs (irreversible). In quantum computing, every gate must be reversible. This means quantum gates operate on state vectors, not on classical bits, and they must map distinct input states to distinct output states.

The set of all single-qubit unitary matrices forms the group SU(2), the special unitary group of degree 2. Every single-qubit gate is a rotation on the Bloch sphere. The set of all multi-qubit unitary matrices forms SU(2ⁿ) for n qubits. Quantum circuit design is the art of decomposing a desired unitary transformation into a sequence of gates from a universal gate set.

## Single-Qubit Gates

### The Pauli Gates

The Pauli matrices are the foundational single-qubit gates. They are named after Wolfgang Pauli, who introduced them in the context of spin-½ particles in quantum mechanics.

**X gate (Pauli-X, quantum NOT):**

X = [[0, 1], [1, 0]]

Applied to |0⟩: X|0⟩ = |1⟩
Applied to |1⟩: X|1⟩ = |0⟩
Applied to a general state α|0⟩ + β|1⟩: X(α|0⟩ + β|1⟩) = α|1⟩ + β|0⟩ = β|0⟩ + α|1⟩

The X gate swaps the amplitudes of |0⟩ and |1⟩. On the Bloch sphere, it is a rotation by π radians around the X-axis. It is the quantum analog of the classical NOT gate. The X gate is its own inverse: XX = I.

**Y gate (Pauli-Y):**

Y = [[0, -i], [i, 0]]

Applied to |0⟩: Y|0⟩ = i|1⟩
Applied to |1⟩: Y|1⟩ = -i|0⟩

The Y gate rotates by π around the Y-axis on the Bloch sphere. It introduces a phase factor of i (or −i) in addition to swapping the basis states. In practice, the Y gate is used less frequently than X and Z, but it appears in certain quantum error correction codes and in the decomposition of arbitrary rotations. The Y gate is also its own inverse: YY = I.

**Z gate (Pauli-Z, quantum phase flip):**

Z = [[1, 0], [0, -1]]

Applied to |0⟩: Z|0⟩ = |0⟩
Applied to |1⟩: Z|1⟩ = -|1⟩

The Z gate leaves |0⟩ unchanged and flips the phase of |1⟩. On the Bloch sphere, it is a rotation by π around the Z-axis. It does not change the probabilities of measurement outcomes (since |−1|² = |1|²), but it changes the relative phase, which matters for interference in multi-qubit circuits.

The three Pauli matrices, together with the identity matrix I, form the Pauli group. They satisfy the algebraic relations:
- X² = Y² = Z² = I
- XY = iZ, YZ = iX, ZX = iY
- YX = -iZ, ZY = -iX, XZ = -iY

These relations are essential for quantum error correction and for understanding the structure of quantum circuits.

### The Hadamard Gate

H = (1/√2)[[1, 1], [1, -1]]

Applied to |0⟩: H|0⟩ = (1/√2)(|0⟩ + |1⟩) = |+⟩
Applied to |1⟩: H|1⟩ = (1/√2)(|0⟩ − |1⟩) = |−⟩

The Hadamard gate maps computational basis states to superposition states. It is its own inverse: HH = I. On the Bloch sphere, it is a rotation by π around the axis (X+Z)/√2, which maps the Z-axis to the X-axis and vice versa.

The Hadamard gate is the single most important gate in quantum computing. It is used to create superpositions, to change measurement bases, and as a building block for more complex gates. Almost every quantum algorithm begins with a layer of Hadamard gates to put qubits into equal superposition.

Applying H twice returns the qubit to its original state: HH|ψ⟩ = |ψ⟩ for any |ψ⟩. This is because H is both unitary and Hermitian (H = H†), making it its own inverse. The Hadamard gate transforms the Z-basis to the X-basis and back: HZH = X and HXH = Z. This basis-change property is used extensively in quantum algorithms and error correction.

### The Phase Gates

**S gate (Pauli-S, π/2 phase gate):**

S = [[1, 0], [0, i]]

Applied to |0⟩: S|0⟩ = |0⟩
Applied to |1⟩: S|1⟩ = i|1⟩

The S gate adds a phase of i (π/2 radians) to the |1⟩ component. It is the square root of the Z gate: S² = Z. On the Bloch sphere, it is a rotation by π/2 around the Z-axis. The S gate is Hermitian: S† = S⁻¹ = [[1, 0], [0, -i]].

**T gate (π/8 gate):**

T = [[1, 0], [0, e^(iπ/4)]]

Applied to |0⟩: T|0⟩ = |0⟩
Applied to |1⟩: T|1⟩ = e^(iπ/4)|1⟩

The T gate adds a phase of e^(iπ/4) to the |1⟩ component. It is the square root of the S gate: T² = S. On the Bloch sphere, it is a rotation by π/4 around the Z-axis.

The T gate is crucial because it, along with the Hadamard gate, forms a universal gate set. Any single-qubit unitary can be approximated to arbitrary precision using only H and T gates. This universality is important for fault-tolerant quantum computing, where the T gate is typically the most expensive gate to implement (requiring a technique called magic state distillation). In most fault-tolerant architectures, the T gate requires 10-100× more physical resources than Clifford gates (H, S, CNOT).

### Rotation Gates

The general single-qubit rotation about an axis n̂ by angle θ is:

R_n̂(θ) = cos(θ/2)I - i sin(θ/2)(n̂ · σ⃗)

where σ⃗ = (X, Y, Z) is the vector of Pauli matrices. The three principal rotations are:

Rx(θ) = [[cos(θ/2), -i sin(θ/2)], [-i sin(θ/2), cos(θ/2)]]
Ry(θ) = [[cos(θ/2), -sin(θ/2)], [sin(θ/2), cos(θ/2)]]
Rz(θ) = [[e^(-iθ/2), 0], [0, e^(iθ/2)]]

The Euler decomposition theorem states that any single-qubit unitary can be written as:

U = e^(iα) Rz(β) Ry(γ) Rz(δ)

where α, β, γ, δ are real angles. This decomposition is used by quantum compilers to express arbitrary single-qubit gates in terms of the native gate set of a quantum processor.

For a specific example, consider the gate U = [[a, b], [c, d]]. The Euler angles can be computed as:
- β = atan2(|c|, |a|)
- γ = arg(c) - arg(a)
- δ = arg(d) - arg(c)
- α = arg(a) + (β + δ)/2

## Multi-Qubit Gates

Single-qubit gates alone cannot create entanglement. Multi-qubit gates are required. The key multi-qubit gates are controlled gates, which apply a gate to a target qubit conditionally on the state of a control qubit.

### The CNOT Gate

The Controlled-NOT (CNOT or CX) gate is the most important two-qubit gate. It has two inputs: a control qubit and a target qubit. If the control qubit is |1⟩, the X gate is applied to the target qubit. If the control is |0⟩, the target is unchanged.

In matrix form (acting on the basis {|00⟩, |01⟩, |10⟩, |11⟩}):

CNOT = [[1,0,0,0], [0,1,0,0], [0,0,0,1], [0,0,1,0]]

CNOT|00⟩ = |00⟩
CNOT|01⟩ = |01⟩
CNOT|10⟩ = |11⟩
CNOT|11⟩ = |10⟩

The CNOT gate creates entanglement. Starting from |00⟩:
1. Apply H to qubit 0: (1/√2)(|0⟩ + |1⟩) ⊗ |0⟩ = (1/√2)(|00⟩ + |10⟩)
2. Apply CNOT (q0 control, q1 target): (1/√2)(|00⟩ + |11⟩) = |Φ+⟩

This is the standard Bell state preparation circuit. The CNOT gate, combined with single-qubit gates, forms a universal gate set for quantum computing. Any multi-qubit unitary can be decomposed into a sequence of single-qubit gates and CNOT gates.

The CNOT gate is symmetric in the sense that you can also use qubit 1 as the control and qubit 0 as the target. These are different gates (different matrices), and they produce different entangled states from different inputs. The CNOT gate is also self-inverse: applying CNOT twice returns to the original state.

### The SWAP Gate

The SWAP gate exchanges the states of two qubits:

SWAP|ab⟩ = |ba⟩

SWAP = [[1,0,0,0], [0,0,1,0], [0,1,0,0], [0,0,0,1]]

The SWAP gate can be decomposed into three CNOT gates:
SWAP = CNOT(a,b) · CNOT(b,a) · CNOT(a,b)

SWAP is essential in architectures where qubit connectivity is limited. If you need to apply a two-qubit gate between two qubits that are not physically connected, you SWAP one qubit's state to a neighboring qubit, perform the gate, and SWAP back. The SWAP gate is its own inverse: SWAP·SWAP = I.

### The Toffoli Gate (CCX)

The Toffoli gate is a three-qubit gate: two control qubits and one target qubit. The target is flipped (X gate applied) only if both control qubits are |1⟩.

Toffoli|abc⟩ = |a ⊕ (b·c), b, c⟩

where ⊕ is XOR and · is AND. The Toffoli gate is universal for classical computation — any classical Boolean function can be implemented using only Toffoli gates. When combined with the Hadamard gate, the Toffoli gate is universal for quantum computation.

The Toffoli gate is expensive to implement on quantum hardware. It requires decomposition into single-qubit and two-qubit gates. A typical decomposition uses 6 CNOT gates and several single-qubit gates. In fault-tolerant quantum computing, the Toffoli gate is often implemented using magic state distillation, making it one of the most resource-intensive operations.

### The CZ Gate

The Controlled-Z (CZ or CPHASE) gate applies a phase of −1 to the |11⟩ component:

CZ = [[1,0,0,0], [0,1,0,0], [0,0,1,0], [0,0,0,-1]]

CZ is symmetric: CZ(a,b) = CZ(b,a). It is equivalent to CNOT up to single-qubit Hadamard gates: CZ = H·CNOT·H (applied to the target qubit). The CZ gate is the native two-qubit gate in many quantum computing architectures, particularly superconducting qubits.

### The CRGate

The controlled-RZ gate applies an RZ rotation to the target qubit when the control qubit is |1⟩:

CRZ(θ) = [[1,0,0,0], [0,1,0,0], [0,0,1,0], [0,0,0,e^(iθ)]]

For θ = π, CRZ(π) = CZ. For θ = π/2, CRZ(π/2) is used in the quantum Fourier transform.

## Circuit Construction

Quantum circuits are sequences of gates applied to qubits, read from left to right. Each qubit is represented by a horizontal line, and gates are placed on the lines at the point in the circuit where they are applied.

The standard circuit model:

1. Initialize all qubits to |0⟩.
2. Apply gates in sequence from left to right.
3. Measure selected qubits.

Qubits are ordered with qubit 0 at the top and qubit n−1 at the bottom. The state of the system is the tensor product of individual qubit states before any gates are applied.

**Circuit depth** is the longest path through the circuit from input to output, counting only gates that act on the same qubit or overlapping sets of qubits. Circuit depth determines the execution time and is limited by decoherence. Reducing circuit depth is a primary goal of quantum circuit optimization.

**Circuit width** is the number of qubits. NISQ devices have 50-1000+ qubits. The width determines the size of problems that can be addressed.

**Gate count** is the total number of gates. More gates means more opportunities for errors. Optimizing gate count is critical for NISQ algorithms.

## Building a Bell State: A Complete Example

Let us construct the Bell state |Φ+⟩ step by step, analyzing each stage in detail.

**Circuit:**
```
q0: |0⟩ ─ H ─●─ M
              │
q1: |0⟩ ───── ⊕ ─ M
```

**Step 0: Initial state**
|ψ₀⟩ = |0⟩ ⊗ |0⟩ = |00⟩

State vector: [1, 0, 0, 0]ᵀ

**Step 1: Apply H to qubit 0**
|ψ₁⟩ = H|0⟩ ⊗ |0⟩ = (1/√2)(|0⟩ + |1⟩) ⊗ |0⟩ = (1/√2)(|00⟩ + |10⟩)

State vector: [1/√2, 0, 1/√2, 0]ᵀ

**Step 2: Apply CNOT with q0 as control, q1 as target**
|ψ₂⟩ = CNOT · |ψ₁⟩ = (1/√2)(CNOT|00⟩ + CNOT|10⟩) = (1/√2)(|00⟩ + |11⟩)

State vector: [1/√2, 0, 0, 1/√2]ᵀ

This is the Bell state |Φ+⟩ = (1/√2)(|00⟩ + |11⟩).

**Step 3: Measurement**
Measuring both qubits:
- P(00) = |1/√2|² = 1/2
- P(01) = 0
- P(10) = 0
- P(11) = |1/√2|² = 1/2

You will observe 00 or 11 with equal probability. The outcomes 01 and 10 never occur.

**Qiskit implementation:**
```python
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

simulator = AerSimulator()
compiled = transpile(qc, simulator)
result = simulator.run(compiled, shots=1024).result()
counts = result.get_counts()
print(counts)
# Expected: {'00': ~512, '11': ~512}
```

**Verification using the statevector simulator:**
```python
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)

simulator = AerSimulator(method='statevector')
compiled = transpile(qc, simulator)
result = simulator.run(compiled).result()
statevector = result.get_statevector()
print(statevector)
# Expected: [0.707+0j, 0+0j, 0+0j, 0.707+0j]
```

## Decomposition of Common Gates

Understanding how complex gates decompose into simpler ones is essential for circuit optimization.

**Toffoli decomposition into CNOT and single-qubit gates:**

The Toffoli gate can be decomposed as:

CCX = (I ⊗ H ⊗ I) · CNOT(c2, c1) · T† ⊗ I ⊗ I · CNOT(c0, c1) · T ⊗ I ⊗ I · CNOT(c2, c1) · T† ⊗ I ⊗ I · CNOT(c0, c1) · T ⊗ T† ⊗ I · CNOT(c2, c1) · I ⊗ T ⊗ I · CNOT(c0, c1) · T† ⊗ T† ⊗ T · CNOT(c2, c1) · I ⊗ T ⊗ I · (I ⊗ H ⊗ I)

This decomposition uses 6 CNOT gates and 10 single-qubit gates (T, T†, H, I). The depth of this decomposition is significant, which is why the Toffoli gate is expensive on NISQ hardware.

**Arbitrary single-qubit unitary decomposition:**

Using the ZYZ decomposition, any single-qubit gate U can be written as:

U = Rz(α) · Ry(β) · Rz(γ)

where α, β, γ are angles determined by the matrix elements of U. This requires at most 3 single-qubit rotation gates, which is the minimum for a general unitary.

**CNOT from CZ:**

CNOT(c, t) = (I ⊗ H) · CZ · (I ⊗ H)

This is useful because CZ is often the native two-qubit gate in hardware.

## Universality of Gate Sets

A set of gates is universal if any unitary transformation on n qubits can be approximated to arbitrary precision using only gates from the set. The Solovay-Kitaev theorem guarantees that this approximation can be done efficiently.

Known universal gate sets:
- {H, T, CNOT} — the standard universal set for fault-tolerant quantum computing
- {H, Toffoli} — universal for both classical and quantum computation
- {Rx(θ), Ry(θ), CNOT} for any fixed irrational θ/π — universal for single-qubit rotations
- {CZ, H} — universal (CZ is the native gate in many architectures)

The T gate is the critical ingredient for universality. Without the T gate (or an equivalent non-Clifford gate), a quantum circuit can be efficiently simulated classically. The set of gates generated by {H, S, CNOT} is called the Clifford group, and circuits using only Clifford gates can be simulated in polynomial time by the Gottesman-Knill theorem.

The T gate adds the necessary "non-classicality" that makes quantum computation powerful. In fault-tolerant quantum computing, the T gate is implemented through magic state distillation, which is the dominant resource cost.

## Practical Circuit Design Considerations

**Qubit connectivity:** Real quantum hardware has limited connectivity. Not every qubit can directly interact with every other qubit. Superconducting processors typically have a heavy-hex or grid topology where each qubit connects to 2-4 neighbors. If you need a CNOT between non-adjacent qubits, you must insert SWAP gates, increasing circuit depth and error.

**Gate synthesis:** Quantum compilers (like Qiskit's transpiler) decompose abstract circuits into the native gate set of the target hardware. The transpiler optimizes for circuit depth, gate count, and SWAP overhead. Different optimization levels produce different circuits for the same algorithm.

**Circuit optimization:** Common optimization techniques include gate cancellation (adjacent inverse gates cancel), gate commutation (moving gates past each other when they commute), and template matching (replacing sub-circuits with equivalent shorter circuits).

**Noise mitigation:** On NISQ hardware, you can use techniques like measurement error mitigation, dynamical decoupling (inserting identity-equivalent gate sequences to suppress decoherence), and zero-noise extrapolation (running circuits at different noise levels and extrapolating to zero noise).

**Circuit depth analysis:** The depth of a circuit directly correlates with the execution time on hardware. For a superconducting processor with 100 ns gate time and 100 μs coherence time, the maximum circuit depth before decoherence dominates is approximately 1000 gates. This means any circuit deeper than 1000 sequential gate layers will suffer significant fidelity loss. When designing circuits, always consider the depth-to-coherence ratio.

**Gate fidelity hierarchy:** Not all gates are created equal. Single-qubit gates (H, S, T, Rz) typically have fidelities above 99.9%. Two-qubit gates (CNOT, CZ) have fidelities of 99-99.9%. Three-qubit gates (Toffoli) must be decomposed into multiple two-qubit gates, compounding errors. The T gate is particularly expensive in fault-tolerant architectures because it requires magic state distillation, consuming additional physical qubits and time.

**Transpilation levels:** Qiskit's transpiler offers four optimization levels:
- Level 0: No optimization, just maps logical qubits to physical qubits
- Level 1: Light optimization, basic gate cancellation
- Level 2: Medium optimization, commutation analysis, template matching
- Level 3: Heavy optimization, 2-qubit单位state simplification, pre-defined lookup tables

For production workloads, level 2 or 3 is recommended. For debugging, level 0 preserves the original circuit structure.

**Circuit depth vs. width tradeoff:** In some cases, you can trade circuit depth for width (additional qubits). This is useful when the coherence time is limited but qubit count is not. For example, you can parallelize a sequential circuit by using additional qubits as temporary storage, reducing the depth at the cost of more qubits.

**Gate synthesis for specific hardware:** Different quantum processors have different native gate sets. The transpiler must decompose your circuit into the native gates of your target hardware. For example:
- IBM Quantum: √X, RZ, CX
- Google Sycamore: √X, RZ, CZ
- IonQ: √X, RZ, XX
- Quantinuum: √X, RZ, ZZ

The choice of native gates affects the circuit depth and fidelity. CZ gates are often preferred over CX gates because they are more natural for superconducting qubits.

**Dynamic circuit techniques:** Modern quantum processors support mid-circuit measurement and conditional gate application. This enables classical feedback loops within quantum circuits, essential for quantum error correction and certain algorithms. In Qiskit, this is implemented using the if_test context manager:

```python
from qiskit.circuit import QuantumCircuit, ClassicalRegister, QuantumRegister

qr = QuantumRegister(2)
cr = ClassicalRegister(1)
qc = QuantumCircuit(qr, cr)

qc.h(0)
qc.measure(0, 0)

with qc.if_test((cr, 1)):
    qc.x(1)

qc.measure(1, 1)
```

This circuit measures qubit 0, and if the result is 1, applies an X gate to qubit 1 before measuring it. Classical feedback is essential for real-time error correction in fault-tolerant quantum computing.

## Assessment

**Task 1: Gate Equivalences (30 minutes)**
Prove that HZH = X and HXH = Z using matrix multiplication. Then prove that (I ⊗ H)·CNOT·(I ⊗ H) = CZ. Verify each identity using Qiskit by constructing both circuits and comparing their unitary matrices with the Operator class.

**Task 2: Bell State Variations (45 minutes)**
Construct circuits for all four Bell states: |Φ+⟩, |Φ−⟩, |Ψ+⟩, |Ψ−⟩. For each, write the circuit, compute the theoretical state vector, run on the statevector simulator, and verify the output. Then run on the qasm_simulator with 1000 shots and verify the measurement statistics. Submit all circuits, state vectors, and measurement counts.

**Task 3: Toffoli Gate Decomposition (60 minutes)**
Implement the Toffoli gate using only CNOT and single-qubit gates (T, T†, S, H). Verify that your decomposition produces the correct unitary by comparing the unitary matrix of your circuit with the reference Toffoli matrix. Then implement the Toffoli gate using only H and T gates (no CNOT) and count the total number of T gates required. Discuss the resource cost of the Toffoli gate for fault-tolerant quantum computing.

**Task 4: Circuit Optimization (60 minutes)**
Take the following circuit and optimize it by hand: H(0) → CNOT(0,1) → CNOT(1,2) → T(0) → T(1) → T(2) → CNOT(0,1) → CNOT(1,2) → H(0) → H(1) → H(2). Identify redundant gates and simplify. Verify that your optimized circuit produces the same unitary as the original using Qiskit's Operator class. Then use Qiskit's transpiler at optimization levels 0, 1, 2, and 3 and compare the results with your manual optimization.

**Grading Criteria:**
- Mathematical proofs are correct and complete (25%)
- Qiskit implementations match theoretical predictions (25%)
- Circuit optimization demonstrates understanding of gate cancellations and commutations (25%)
- Analysis of resource costs for fault-tolerant implementations (25%)

## Evidence

- Nielsen, M.A. & Chuang, I.L. *Quantum Computation and Quantum Information*. Cambridge University Press, 2010. Chapter 4.
- Barenco, A. et al. "Elementary gates for quantum computation." *Physical Review A* 52, 3457 (1995).
- Qiskit Textbook: https://learning.quantum.ibm.com/
- Gottesman, D. "The Heisenberg Representation of Quantum Computers." *Proceedings of the 20th International Colloquium on Group Theoretical Methods in Physics*, 1994.
- Shi, Y. "Both Toffoli and controlled-NOT need not help to compute parity." *Quantum Information & Computation* 4, 156 (2004).
