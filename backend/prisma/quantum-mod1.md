# Module 1: Quantum Fundamentals

## The Classical Limitation

Every computation you have ever run: every web request, every encryption operation, every database query: operates on bits. A bit is either 0 or 1. There is no in-between. This constraint is not a limitation of our engineering; it is a fundamental property of classical physics. When you flip a coin, it lands on heads or tails. When you write a byte to disk, each cell holds a definite voltage state representing 0 or 1.

Quantum computing shatters this constraint. A quantum bit: a qubit: can exist in a state that is simultaneously 0 and 1. This is not a metaphor. It is not a probabilistic mixture where we simply do not know which state it is in. The qubit genuinely occupies both states at once, and this property is the engine that drives quantum computational advantage.

To understand what this means in practice, we need to build a precise mental model of what a qubit actually is, how superposition works, what measurement does, and why the Bloch sphere is the right way to visualize single-qubit states.

## Qubit Formalism

A classical bit has two states: 0 and 1. A qubit has a state space that is a two-dimensional complex Hilbert space. The computational basis states are denoted |0⟩ and |1⟩, using Dirac notation. Any valid qubit state is a linear combination:

|ψ⟩ = α|0⟩ + β|1⟩

where α and β are complex numbers called probability amplitudes. The normalization constraint is:

|α|² + |β|² = 1

This means if you measure the qubit in the computational basis, you will observe |0⟩ with probability |α|² and |1⟩ with probability |β|². Before measurement, the qubit exists in the superposition described by both amplitudes simultaneously.

The key distinction from classical probability: α and β are complex numbers, not real probabilities. This means they can interfere with each other constructively or destructively. Quantum algorithms are designed to exploit this interference, amplifying the amplitudes of correct answers and suppressing the amplitudes of wrong ones.

Consider a concrete example. Take the state:

|ψ⟩ = (1/√2)|0⟩ + (1/√2)|1⟩

This is called the |+⟩ state. If you measure it, you get 0 or 1 with equal probability. But before measurement, the qubit is not "50% in |0⟩ and 50% in |1⟩": it is in a definite state that happens to produce 50/50 measurement outcomes. The superposition is a real physical state, not a statement about our ignorance.

Now consider:

|ψ⟩ = (1/√2)|0⟩ - (1/√2)|1⟩

This is the |−⟩ state. It also produces 50/50 measurement outcomes. But it is a physically distinct state from |+⟩. The relative phase between the two components matters enormously for how the qubit evolves under quantum gates and how it interacts with other qubits in a multi-qubit system. The difference between |+⟩ and |−⟩ is invisible if you only look at measurement statistics in the computational basis, but it becomes critically important when you apply additional gates before measuring.

Let us examine the normalization constraint more carefully. The amplitudes α and β must satisfy |α|² + |β|² = 1. For α = cos(θ/2) and β = e^(iφ) sin(θ/2), we get cos²(θ/2) + sin²(θ/2) = 1, which is always satisfied. This parameterization maps every qubit state to two angles θ and φ, which is exactly the Bloch sphere representation we will discuss later.

The state vector formalism extends naturally to multi-qubit systems. For two qubits, the state is:

|ψ⟩ = α₀₀|00⟩ + α₀₁|01⟩ + α₁₀|10⟩ + α₁₁|11⟩

with |α₀₀|² + |α₀₁|² + |α₁₀|² + |α₁₁|² = 1. For n qubits, the state requires 2ⁿ complex amplitudes, which is why quantum state vectors grow exponentially with the number of qubits. This exponential growth is both the source of quantum computational power and the reason why classical simulation of quantum systems is hard.

## Density Matrices and Mixed States

A pure state is described by a ket vector |ψ⟩. But real quantum systems are rarely perfectly isolated. A qubit that has interacted with its environment may be in a mixed state: a classical probability distribution over pure states. This is described by a density matrix:

ρ = Σ pᵢ |ψᵢ⟩⟨ψᵢ|

For a pure state |ψ⟩ = α|0⟩ + β|1⟩, the density matrix is:

ρ = |ψ⟩⟨ψ| = [[|α|², αβ*], [α*β, |β|²]]

The trace of ρ is always 1 (normalization), and for a pure state, Tr(ρ²) = 1. For a mixed state, Tr(ρ²) < 1. This distinction matters when you are building real quantum circuits on noisy hardware: your qubits are never in perfect pure states.

The Bloch sphere representation only applies to single-qubit states. For multi-qubit systems, you need the full density matrix or state vector representation. A single qubit's density matrix can always be written as:

ρ = (I + r⃗ · σ⃗) / 2

where r⃗ is the Bloch vector (a 3D real vector with |r⃗| ≤ 1) and σ⃗ = (X, Y, Z) are the Pauli matrices. Pure states correspond to |r⃗| = 1 (points on the Bloch sphere surface), while mixed states correspond to |r⃗| < 1 (points inside the Bloch sphere). The maximally mixed state ρ = I/2 corresponds to the origin r⃗ = 0.

## The Bloch Sphere

Every valid single-qubit state can be written as:

|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩

where θ is the polar angle (0 ≤ θ ≤ π) and φ is the azimuthal angle (0 ≤ φ < 2π). This parameterization maps every qubit state to a point on the unit sphere in three-dimensional real space: the Bloch sphere.

The north pole (θ = 0) corresponds to |0⟩. The south pole (θ = π) corresponds to |1⟩. The equator contains superposition states like |+⟩ (φ = 0), |−⟩ (φ = π), |+i⟩ (φ = π/2), and |−i⟩ (φ = 3π/2).

The Bloch sphere is valuable because it gives you geometric intuition about quantum gates. A rotation around the X-axis by angle θ on the Bloch sphere corresponds to applying the gate:

Rx(θ) = cos(θ/2)I - i sin(θ/2)X

Similarly for Ry and Rz rotations. Single-qubit gates are rotations on the Bloch sphere. This geometric picture makes it much easier to reason about circuit design than working with matrix multiplication directly.

Let us trace through a specific example. Start with |0⟩ at the north pole. Apply an H gate: this rotates the state to the equator at the |+⟩ position. Apply an S gate: this rotates by 90° around the Z-axis, moving to |+i⟩. Apply another H gate: this moves to a different point on the sphere. Each gate corresponds to a well-defined rotation, and the sequence of rotations traces a path on the Bloch sphere.

One subtlety: the Bloch sphere representation obscures the global phase. The states |ψ⟩ and e^(iφ)|ψ⟩ are physically indistinguishable: they produce the same measurement statistics for any measurement. The Bloch sphere correctly identifies these as the same point, which is physically correct but means you lose phase information that matters when considering multi-qubit entanglement. When two qubits are entangled, the relative phase between different components of the joint state cannot be captured by individual Bloch spheres for each qubit.

The Bloch sphere also helps visualize mixed states. A pure state is a point on the surface of the sphere. A mixed state is a point inside the sphere. The closer to the center, the more mixed the state. The maximally mixed state (complete uncertainty) is at the center. This visualization helps you understand decoherence: as a qubit interacts with its environment, its Bloch vector shrinks toward the center, losing its quantum coherence.

## Superposition: What It Actually Means

Superposition is the most misunderstood concept in quantum computing. Here is what it is not:

1. Superposition is not "the qubit is in both states at once" in the sense that it is rapidly switching between them.
2. Superposition is not a statement about our knowledge: it is not that we do not know which state it is in.
3. Superposition is not classical probability: a 50/50 classical random bit is fundamentally different from a qubit in the |+⟩ state.

What superposition actually means: the qubit exists in a state that is described by two complex amplitudes, and these amplitudes can interfere. When you apply a quantum gate to a qubit in superposition, both amplitudes are transformed simultaneously. When you measure, the superposition collapses to a definite outcome.

The power of superposition is not that a single qubit in superposition can do anything a classical bit cannot: a single qubit measurement is always just 0 or 1. The power emerges when you have multiple qubits in entangled superpositions. An n-qubit system can be in a superposition of all 2ⁿ possible bit strings simultaneously, and quantum gates can manipulate these 2ⁿ amplitudes in parallel. This is the source of quantum speedup.

To illustrate the difference between classical and quantum superposition, consider a 3-bit system. A classical 3-bit register can be in one of 8 states: 000, 001, ..., 111. A quantum 3-qubit register can be in a superposition of all 8 states simultaneously:

|ψ⟩ = α₀₀₀|000⟩ + α₀₀₁|001⟩ + ... + α₁₁₁|111⟩

A single quantum gate operation on this register transforms all 8 amplitudes simultaneously. But: and this is the crucial constraint: when you measure, you only get one of the 8 possible outcomes. You cannot read out all 8 amplitudes. The art of quantum algorithm design is arranging the computation so that the amplitude of the correct answer is close to 1 when you measure.

## Quantum Measurement

Measurement in quantum computing is fundamentally different from classical observation. When you measure a qubit in the computational basis, you get a definite classical outcome (0 or 1), and the qubit state collapses to the corresponding basis state. This process is irreversible: the superposition information is destroyed.

The measurement postulate: for a state |ψ⟩ = α|0⟩ + β|1⟩, measurement in the computational basis produces outcome 0 with probability |α|² and outcome 1 with probability |β|². After measurement, the qubit is in the state |0⟩ or |1⟩ respectively.

This has a profound practical implication: you cannot "read out" the amplitudes of a quantum state directly. You can only extract classical bits, one measurement at a time. To determine what a quantum algorithm computed, you typically need to run the circuit many times (shots) and build up statistics.

Measurement in other bases is also possible. Measuring in the X-basis means measuring whether the qubit is in |+⟩ or |−⟩. This is equivalent to applying an H gate before computational-basis measurement. The choice of measurement basis is a design decision in quantum algorithms.

A critical point: measurement is not the only way quantum states interact with the environment. Decoherence: the unwanted entanglement of a qubit with its environment: also destroys superposition. This is why quantum computers require extreme isolation: near-vacuum, temperatures below 15 millikelvin, and electromagnetic shielding. A stray photon or thermal fluctuation can decohere a qubit just as effectively as a measurement.

The measurement problem in quantum mechanics is one of the deepest foundational questions. In the standard interpretation (Copenhagen), measurement causes an instantaneous, non-unitary collapse of the wave function. In the many-worlds interpretation, measurement causes the universe to branch, with each outcome occurring in a separate branch. In decoherence theory, measurement is the process by which quantum coherence is lost to the environment. For practical quantum computing, the interpretation does not matter: what matters is that measurement produces a definite outcome with specific probabilities, and that the act of measurement destroys the superposition.

Let us consider a concrete measurement scenario. You have a qubit in the state:

|ψ⟩ = (3/5)|0⟩ + (4/5)|1⟩

The probability of measuring 0 is |3/5|² = 9/25 = 36%.
The probability of measuring 1 is |4/5|² = 16/25 = 64%.

If you measure and get 0, the qubit is now in state |0⟩. If you measure again, you will get 0 with certainty. The original superposition is destroyed. This is why you cannot clone a quantum state: the act of measurement (which is necessary to learn the state) destroys the information you are trying to copy.

## Entanglement

Entanglement is a quantum correlation that has no classical analog. Two qubits are entangled when the state of the system cannot be described as a product of individual qubit states.

Consider the Bell state:

|Φ+⟩ = (1/√2)(|00⟩ + |11⟩)

This state cannot be written as |ψ⟩₁ ⊗ |φ⟩₂ for any single-qubit states |ψ⟩ and |φ⟩. If you measure the first qubit and get 0, the second qubit is instantly in state |0⟩, regardless of the distance between them. If you measure the first qubit and get 1, the second is in state |1⟩.

This is not communication: you cannot use entanglement to send information faster than light. The measurement outcomes are individually random (50/50 for each qubit). It is only when you compare the results that you see perfect correlation. Einstein called this "spooky action at a distance," but it is better understood as a type of correlation that simply does not exist in classical physics.

There are four Bell states, each with different correlation patterns:

|Φ+⟩ = (1/√2)(|00⟩ + |11⟩): correlated in computational basis
|Φ−⟩ = (1/√2)(|00⟩ − |11⟩): anti-correlated in computational basis
|Ψ+⟩ = (1/√2)(|01⟩ + |10⟩): correlated in X-basis
|Ψ−⟩ = (1/√2)(|01⟩ − |10⟩): anti-correlated in X-basis

The Bell states form a complete basis for two-qubit states. Any two-qubit state can be written as a superposition of Bell states.

Entanglement is a computational resource. Many quantum algorithms: including Shor's algorithm for factoring, Grover's algorithm for search, and quantum error correction codes: rely critically on entanglement. Without entanglement, a quantum computer can be efficiently simulated classically. With entanglement, it can solve certain problems exponentially faster than any classical computer.

To see why entanglement is necessary for quantum speedup, consider a quantum computer with n qubits but no entanglement. Each qubit can be described independently, and the total state is a product state. The number of parameters needed to describe the state is O(n), not O(2ⁿ). Such a system can be efficiently simulated by a classical computer. Entanglement creates correlations that cannot be described by independent qubit states, requiring the full 2ⁿ-parameter description.

## Quantum Interference

Interference is the mechanism by which quantum algorithms amplify correct answers and suppress wrong ones. It works because probability amplitudes are complex numbers that can add constructively or destructively.

Consider a quantum algorithm that produces two paths to an incorrect answer, with amplitudes that are 180 degrees out of phase. These paths interfere destructively, canceling each other out. The probability of measuring that incorrect answer becomes zero.

Conversely, if two paths to the correct answer have amplitudes in phase, they interfere constructively, doubling the amplitude (and quadrupling the probability, since probability is the square of the amplitude).

Quantum algorithms are essentially choreographed interference patterns. The art of quantum algorithm design is arranging gates so that the amplitudes of correct answers accumulate through constructive interference while wrong answers cancel through destructive interference.

A concrete example of interference in a simple circuit. Start with two qubits in state |00⟩. Apply H to both: you get (1/2)(|00⟩ + |01⟩ + |10⟩ + |11⟩). Apply a phase oracle that flips the phase of |11⟩: you get (1/2)(|00⟩ + |01⟩ + |10⟩ − |11⟩). Apply H to both again: the result is |11⟩ with certainty. The interference pattern has concentrated all probability on a single state.

This is the essence of quantum computing: use gates to create interference patterns that concentrate probability on the answers you want.

## Running a Quantum Circuit: A Real Scenario

Let us trace through what happens when you run a quantum circuit on real hardware. Suppose you want to create a Bell state and measure it.

First, you initialize two qubits, both in state |0⟩. The initial state is |00⟩.

Step 1: Apply a Hadamard gate to qubit 0. The state becomes:

(1/√2)(|0⟩ + |1⟩) ⊗ |0⟩ = (1/√2)(|00⟩ + |10⟩)

Step 2: Apply a CNOT gate with qubit 0 as control and qubit 1 as target. The CNOT flips the target qubit when the control qubit is |1⟩. The state becomes:

(1/√2)(|00⟩ + |11⟩) = |Φ+⟩

This is a Bell state. The two qubits are now entangled.

Step 3: Measure both qubits in the computational basis. You will get either 00 or 11, each with probability 50%. You will never get 01 or 10.

On real hardware (say, IBM's 127-qubit Eagle processor), this circuit runs in approximately 100 nanoseconds. But the qubits are not perfect. The Hadamard gate has an error rate of roughly 0.1%. The CNOT gate has an error rate of roughly 1-2%. The measurement has an error rate of roughly 1-3%. Over many shots (typically 1024 or 4096), you will see mostly 00 and 11 outcomes, but also a small percentage of 01 and 10 due to gate errors and decoherence.

The practical workflow for running a quantum circuit:

1. Write the circuit using a framework like Qiskit, Cirq, or PennyLane.
2. Submit the circuit to a quantum backend (simulator or real hardware).
3. The backend schedules the circuit, maps logical qubits to physical qubits, and executes the gates.
4. Measurement results are returned as counts: {「00」: 507, 「11」: 501, 「01」: 8, 「10」: 8} for a typical 1024-shot run.
5. You analyze the counts to determine the probability distribution.

On a simulator with no noise, you get perfect results: {「00」: 512, 「11」: 512} for 1024 shots. On real hardware, the noise introduces errors. Understanding and mitigating these errors is a major area of active research.

The circuit depth (the number of sequential gate layers) determines the execution time. For our Bell state circuit, the depth is 2 (one H gate, one CNOT gate). For deeper circuits, decoherence becomes more significant. A circuit with depth 100 on a superconducting processor with T2 = 100 μs and gate time = 100 ns will have significant decoherence by the end of the circuit.

## Quantum vs Classical: A Precise Comparison

The difference between quantum and classical computing is not that quantum is "faster" in the sense of a faster clock speed. The difference is that quantum computers can solve certain problems with fewer operations by exploiting superposition, entanglement, and interference.

Classical computers process one input at a time (or, with parallelism, a fixed number at a time). A quantum computer processes a superposition of exponentially many inputs simultaneously: but you cannot read out all the results at once due to the measurement constraint.

The actual speedup comes from interference: arranging the computation so that the correct answer's amplitude is amplified while wrong answers cancel out. This requires clever algorithm design, not just "trying all answers in parallel."

Problems where quantum computers offer provable speedup:
- Integer factoring: Shor's algorithm runs in O(n³) time, versus the best known classical algorithm (general number field sieve) which runs in sub-exponential time.
- Unstructured search: Grover's algorithm provides a quadratic speedup, O(√N) versus O(N).
- Quantum simulation: Simulating quantum systems is exponentially hard classically but natural for quantum computers.
- Linear systems: The HHL algorithm offers exponential speedup for certain sparse linear systems.

Problems where quantum computers offer no speedup:
- Sorting: O(n log n) is optimal both classically and quantumly.
- Most everyday computing tasks (web servers, databases, word processing).
- Problems that are already efficient classically.

The practical reality in 2025: we have noisy intermediate-scale quantum (NISQ) devices with 50-1000+ qubits. These devices are not yet fault-tolerant. Running deep circuits introduces too many errors. The near-term applications are in quantum simulation (chemistry, materials science), variational algorithms (quantum machine learning, optimization), and proof-of-concept demonstrations.

## Qubit Technologies

Several physical implementations of qubits are being developed:

**Superconducting qubits** (IBM, Google, Rigetti): Circuits cooled to 15 millikelvin where quantized energy levels of a nonlinear oscillator serve as |0⟩ and |1⟩. Gate times: ~10-100 nanoseconds. Coherence times: ~100 microseconds. This is the dominant technology for gate-model quantum computing.

**Trapped ions** (IonQ, Quantinuum): Individual ions held in electromagnetic traps, with qubit states encoded in electronic energy levels. Gate times: ~1-100 microseconds. Coherence times: seconds to minutes. Higher fidelity than superconducting, but slower.

**Photonic qubits** (Xanadu, PsiQuantum): Qubits encoded in properties of photons (polarization, path, time-bin). Room temperature operation. Challenges with photon loss and two-qubit gates.

**Neutral atoms** (QuEra, Pasqal): Atoms trapped in optical tweezers, with qubit states in hyperfine levels. Scalable to thousands of qubits. Recent demonstrations of hundreds of logical qubits.

**Topological qubits** (Microsoft): Exotic quasiparticles (anyons) that are inherently resistant to local errors. Still in early experimental stages.

Each technology has different tradeoffs in gate fidelity, coherence time, connectivity, and scalability. The choice of hardware platform affects what algorithms can be practically implemented.

## The Decoherence Problem

A qubit that interacts with its environment loses its quantum properties through a process called decoherence. The two main types are:

**T1 relaxation (amplitude damping):** The qubit spontaneously transitions from |1⟩ to |0⟩, losing energy to the environment. This is like a classical bit flipping from 1 to 0 due to noise. T1 is typically 50-200 microseconds for superconducting qubits.

**T2 dephasing (phase damping):** The relative phase between |0⟩ and |1⟩ components randomizes. The qubit stays in superposition but loses the precise phase relationship that quantum algorithms depend on. T2 is typically 50-200 microseconds for superconducting qubits, and is always ≤ 2·T1.

For superconducting qubits, T1 and T2 are typically 50-200 microseconds. This means you have a very limited time to execute gates before the qubit decoheres. A typical gate takes 10-100 nanoseconds, so you can execute roughly 1000-10,000 gates before decoherence destroys the computation.

This is the fundamental challenge of quantum computing: you need many qubits with long coherence times and high-fidelity gates to run useful algorithms. Current hardware is approaching this threshold for certain problems, but fault-tolerant quantum computing (which requires quantum error correction with many physical qubits per logical qubit) is still years away for large-scale problems.

The relationship between gate fidelity and error rate is: F = 1 - ε, where ε is the error rate. For a two-qubit gate with fidelity 99%, the error rate is 1%. After N gates, the probability of no errors is (0.99)^N. For N = 100 gates, this is approximately 37%. For N = 1000 gates, this is approximately 0.004%. This exponential decay of fidelity with circuit depth is why NISQ circuits must be shallow.

## Summary of Key Concepts

A qubit is a two-level quantum system described by two complex probability amplitudes constrained to lie on the Bloch sphere. Superposition allows a qubit to exist in states that are combinations of |0⟩ and |1⟩. Measurement collapses the superposition to a definite outcome. Entanglement creates correlations between qubits that have no classical analog. Interference is the mechanism by which quantum algorithms amplify correct answers. Quantum computing provides speedup for specific problem classes, not universal speedup. The practical challenges are decoherence, gate fidelity, and scaling to many qubits.

## Assessment

**Task 1: State Vector Computation (30 minutes)**
Given the circuit: H → Ry(π/4) → CNOT → Measure. Compute the final state vector analytically. Show all intermediate states. Verify your answer using Qiskit's statevector_simulator. Submit your hand calculations and the Qiskit code with output.

**Task 2: Bloch Sphere Visualization (45 minutes)**
Write a Qiskit program that applies the following sequence of gates to a qubit initialized in |0⟩: H, S, H, Ry(π/3), Rz(π/4). Use the BlochSphere widget to visualize the qubit state after each gate. Explain each rotation geometrically. Submit the code, screenshots of each Bloch sphere state, and a written explanation of each gate's effect.

**Task 3: Measurement Statistics (45 minutes)**
Run the Bell state circuit (H on q0, CNOT q0→q1) on the qasm_simulator with 100, 1000, and 10000 shots. Record the measurement counts. Compute the experimental probability of each outcome. Compare with the theoretical probabilities. Repeat with a noise model (depolarizing noise with p=0.01) and analyze how the noise affects the results. Submit a table comparing theoretical vs. noisy vs. ideal results and a discussion of the noise effects.

**Task 4: Entanglement Verification (60 minutes)**
Implement a circuit that generates the three other Bell states: |Φ−⟩ = (1/√2)(|00⟩ − |11⟩), |Ψ+⟩ = (1/√2)(|01⟩ + |10⟩), |Ψ−⟩ = (1/√2)(|01⟩ − |10⟩). For each state, run 1000 measurements and verify the expected correlation pattern. Then implement the CHSH game: run the circuit with specific measurement choices and compute the CHSH parameter S. Verify that |S| > 2, demonstrating quantum nonlocality. Submit all circuits, measurement results, and your computed S value.

**Grading Criteria:**
- State vector calculations are mathematically correct (25%)
- Qiskit code runs without errors and produces correct output (25%)
- Bloch sphere visualizations match theoretical predictions (25%)
- Measurement statistics analysis demonstrates understanding of shot noise and decoherence (25%)

## Evidence

- Nielsen, M.A. & Chuang, I.L. *Quantum Computation and Quantum Information*. Cambridge University Press, 2010. Chapters 1-2.
- IBM Quantum documentation: https://learning.quantum.ibm.com/
- Preskill, J. "Quantum Computing in the NISQ era and beyond." *Quantum* 2, 79 (2018).
- Bloch, F. "Nuclear Induction." *Physical Review* 70, 460 (1946).
- Bell, J.S. "On the Einstein Podolsky Rosen paradox." *Physics Physique Физика* 1, 195 (1964).
