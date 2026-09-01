# Module 3: Quantum Algorithms

## The Landscape of Quantum Algorithms

Quantum algorithms are not "classical algorithms run on quantum hardware." They are fundamentally different computational procedures that exploit superposition, entanglement, and interference to solve certain problems with fewer operations than any classical algorithm. The speedup is not universal: quantum computers are not faster at everything. For some problems, like integer factoring and unstructured search, quantum algorithms provide provable speedups. For others, like sorting, there is no quantum advantage.

Understanding quantum algorithms requires understanding two things: the mathematical structure of the problem, and how quantum interference can be used to extract the solution efficiently. This module covers the two most important quantum algorithms: Grover's search and Shor's factoring: and the concept of quantum advantage.

## Grover's Algorithm

### The Problem

Given an unsorted database of N items, find a specific marked item. Classically, this requires O(N) queries: you must check each item one by one. Grover's algorithm solves this with O(√N) queries, a quadratic speedup.

This speedup applies to any problem that can be reformulated as searching for a marked item in an unstructured space. Since many problems can be reduced to search (satisfiability, optimization, constraint satisfaction), Grover's algorithm has broad applicability.

### The Algorithm

**Step 1: Initialization**
Apply Hadamard gates to all n qubits, creating an equal superposition of all 2ⁿ = N possible states:

|ψ⟩ = H^⊗n |0⟩^⊗n = (1/√N) Σ|x⟩

where the sum runs over all x ∈ {0, 1}ⁿ.

**Step 2: Oracle**
Apply the oracle Uω, which flips the phase of the marked state |ω⟩:

Uω|x⟩ = -|x⟩ if x = ω
Uω|x⟩ = |x⟩ if x ≠ ω

In matrix form, Uω = I - 2|ω⟩⟨ω|. This is a reflection about the subspace orthogonal to |ω⟩.

**Step 3: Diffusion Operator**
Apply the diffusion operator Us, which is a reflection about the initial state |ψ⟩:

Us = 2|ψ⟩⟨ψ| - I

This operator can be implemented as Us = H^⊗n (2|0⟩⟨0| - I) H^⊗n, which flips the phase of all basis states except |0...0⟩.

**Step 4: Repeat**
Repeat steps 2 and 3 approximately π√N/4 times.

**Step 5: Measurement**
Measure all qubits. The result is |ω⟩ with high probability.

### Why It Works: Geometric Interpretation

The algorithm operates in a two-dimensional subspace spanned by |ω⟩ and |ψ⊥⟩ = (1/√(N-1)) Σ_{x≠ω} |x⟩. In this subspace, both the oracle and the diffusion operator are reflections. The composition of two reflections is a rotation. Each iteration rotates the state vector toward |ω⟩ by an angle of approximately 2/√N radians. After approximately π√N/4 iterations, the state is (approximately) |ω⟩, and measurement succeeds.

The initial state |ψ⟩ can be decomposed as:

|ψ⟩ = sin(θ)|ω⟩ + cos(θ)|ψ⊥⟩

where sin(θ) = 1/√N. Each Grover iteration rotates by 2θ, so after k iterations:

|ψ_k⟩ = sin((2k+1)θ)|ω⟩ + cos((2k+1)θ)|ψ⊥⟩

Setting (2k+1)θ ≈ π/2 gives k ≈ π/(4θ) ≈ π√N/4 iterations.

The geometric picture makes it clear why Grover's algorithm works: each iteration rotates the state toward the target state. After the correct number of iterations, the state is aligned with the target, and measurement succeeds with high probability. If you run too many iterations, the state rotates past the target, and the success probability decreases. This is why the number of iterations must be carefully chosen.

### Success Probability Analysis

For N = 2ⁿ items, the optimal number of iterations is k = floor(π/(4θ)) where θ = arcsin(1/√N). For large N, θ ≈ 1/√N, so k ≈ π√N/4.

The success probability after k iterations is:

P(success) = sin²((2k+1)θ)

For N = 4 (2 qubits), θ = arcsin(1/2) = π/6, k = 1, P = sin²(3π/6) = 1.0 (perfect).
For N = 8 (3 qubits), θ = arcsin(1/√8), k = 1, P = sin²(3θ) ≈ 0.945.
For N = 16 (4 qubits), θ = arcsin(1/4), k = 2, P = sin²(5θ) ≈ 0.961.
For N = 1024 (10 qubits), θ ≈ 0.0314, k = 25, P ≈ 0.999.

The success probability approaches 1 as N increases, which is a remarkable property: the algorithm becomes more reliable for larger search spaces.

### Implementation

```python
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

def grover_oracle(n, marked_state):
    """Oracle that marks a specific state by flipping its phase."""
    qc = QuantumCircuit(n)
    binary = format(marked_state, f'0{n}b')
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

def diffusion_operator(n):
    """Diffusion operator: 2|s><s| - I where |s> is equal superposition."""
    qc = QuantumCircuit(n)
    qc.h(range(n))
    qc.x(range(n))
    qc.h(n-1)
    qc.mcx(list(range(n-1)), n-1)
    qc.h(n-1)
    qc.x(range(n))
    qc.h(range(n))
    return qc

def grover_search(n, marked_state, num_iterations):
    """Full Grover search circuit."""
    qc = QuantumCircuit(n, n)
    qc.h(range(n))
    for _ in range(num_iterations):
        qc.compose(grover_oracle(n, marked_state), inplace=True)
        qc.compose(diffusion_operator(n), inplace=True)
    qc.measure(range(n), range(n))
    return qc

# Search in a database of 16 items (4 qubits) for item 7
n = 4
marked = 7
iterations = int(np.pi/4 * np.sqrt(2**n))
qc = grover_search(n, marked, iterations)

simulator = AerSimulator()
compiled = transpile(qc, simulator)
result = simulator.run(compiled, shots=1024).result()
counts = result.get_counts()
print(f"Searching for state {marked} (binary: {format(marked, f'0{n}b')})")
print(f"Number of iterations: {iterations}")
print(f"Results: {counts}")
```

For N = 16, we need approximately π√16/4 ≈ 3 iterations. The success probability after 3 iterations is approximately 96%. For N = 1,000,000, we need approximately 785 iterations instead of 1,000,000 classical queries.

### Generalized Grover's Algorithm

The basic Grover's algorithm can be extended in several ways:

**Multiple marked items:** If there are M marked items, the rotation angle becomes θ = arcsin(√(M/N)), and the optimal number of iterations is approximately π√(N/M)/4.

**Amplitude amplification:** The Grover iteration can be generalized to amplify the amplitude of any desired component of a quantum state, not just a marked computational basis state. This is the Amplitude Amplification algorithm, which provides a quadratic speedup for any algorithm whose success probability is at least 1/poly(n).

**Grover's with unknown number of solutions:** If M is unknown, you can use a quantum counting algorithm (based on the Quantum Phase Estimation of the Grover operator) to estimate M, then run Grover's with the correct number of iterations.

**Fixed-point Grover's:** A variant that converges to the target state regardless of the number of solutions, useful when the number of solutions is unknown.

### Grover's Algorithm: Practical Considerations

**Oracle construction:** The oracle is the most critical part of Grover's algorithm. It must flip the phase of the marked state without affecting other states. For simple oracles (e.g., searching for a specific bit string), the oracle can be implemented efficiently. For complex oracles (e.g., solving a SAT problem), the oracle may require many gates.

**Quantum counting:** Before running Grover's, you can estimate the number of solutions using quantum counting. This uses the Grover iterate as a unitary operator and applies quantum phase estimation to determine the rotation angle, which is proportional to the number of solutions.

**Amplitude amplification:** A generalization of Grover's that works for any algorithm with a non-zero success probability. If an algorithm succeeds with probability p, amplitude amplification can boost this to near 1 using O(1/√p) iterations.

**Quantum walks for search:** For structured search problems (e.g., searching on a graph), quantum walks can provide better performance than standard Grover's. For example, searching on a 2D grid of N elements requires O(√N log N) queries classically but only O(√N) queries quantumly using quantum walks.

**Limitations of Grover's:**
- The oracle must be implemented as a quantum circuit
- The number of iterations must be known (or estimated)
- The speedup is only quadratic (not exponential)
- For small databases, the overhead of quantum circuits may outweigh the benefit

**Practical applications of Grover's:**
- Cryptographic key search: Reduces AES-128 security from 128 to 64 bits
- SAT solving: Quadratic speedup for satisfiability problems
- Optimization: Quadratic speedup for brute-force optimization
- Collision finding: BHT algorithm provides O(N^(1/3)) speedup

## Shor's Algorithm

### The Problem

Given a composite integer N = p·q (product of two unknown primes), find p and q. This is the integer factoring problem. The best known classical algorithm (general number field sieve) runs in sub-exponential time:

L_N[1/3, (64/9)^(1/3)] = exp(O(n^(1/3) (log n)^(2/3)))

where n = log₂ N. Shor's algorithm runs in polynomial time:

O(n² log n log log n)

This exponential speedup has profound implications for cryptography, since RSA encryption relies on the difficulty of factoring.

### Reduction to Period Finding

Shor's key insight is that factoring can be reduced to finding the period of a modular exponential function. Choose a random integer a < N with gcd(a, N) = 1. Define the function f(x) = aˣ mod N. This function is periodic with some period r (the order of a modulo N). That is, f(x + r) = f(x) for all x.

Once you find r, you can factor N with high probability. If r is even, compute gcd(a^(r/2) ± 1, N). At least one of these gives a non-trivial factor of N.

Why does this work? If aʳ ≡ 1 (mod N), then (a^(r/2))² ≡ 1 (mod N), so (a^(r/2) - 1)(a^(r/2) + 1) ≡ 0 (mod N). Since a^(r/2) ≢ ±1 (mod N) (for most choices of a), the factors of N must divide (a^(r/2) - 1) and (a^(r/2) + 1), giving us gcd(a^(r/2) - 1, N) and gcd(a^(r/2) + 1, N).

### Quantum Period Finding

The quantum part of Shor's algorithm uses the Quantum Fourier Transform (QFT) to find the period r efficiently.

**Step 1: State Preparation**
Use two registers. The first register has n = 2log₂(N) qubits initialized to |0⟩. The second register has log₂(N) qubits. Apply Hadamard gates to the first register to create equal superposition:

|ψ₁⟩ = (1/√(2ⁿ)) Σ_{x=0}^{2ⁿ-1} |x⟩ ⊗ |0⟩

**Step 2: Modular Exponentiation**
Compute f(x) = aˣ mod N and store the result in the second register:

|ψ₂⟩ = (1/√(2ⁿ)) Σ_{x=0}^{2ⁿ-1} |x⟩ ⊗ |aˣ mod N⟩

This step requires a quantum circuit that computes modular exponentiation. The circuit uses O(n³) gates, making it the most expensive part of the algorithm.

**Step 3: Quantum Fourier Transform**
Apply the QFT to the first register. The QFT maps |x⟩ to (1/√(2ⁿ)) Σ_{k=0}^{2ⁿ-1} e^(2πixk/2ⁿ) |k⟩.

After the QFT, the amplitude of state |k⟩ in the first register is:

α_k = (1/2ⁿ) Σ_{x=0}^{2ⁿ-1} e^(2πix(k/2ⁿ - j/r))

where j is the (unknown) offset. This sum is large when k/2ⁿ ≈ j/r (i.e., k ≈ j·2ⁿ/r) and small otherwise.

**Step 4: Measurement**
Measure the first register. The result k is close to a multiple of 2ⁿ/r. Using the continued fractions algorithm, you can extract r from k.

**Step 5: Classical Post-Processing**
Compute gcd(a^(r/2) ± 1, N) to find factors. If this fails (r is odd, or a^(r/2) ≡ -1 mod N), choose a different random a and repeat.

### The Quantum Fourier Transform

The QFT is the quantum analog of the discrete Fourier Transform. It maps:

|j⟩ → (1/√N) Σ_{k=0}^{N-1} e^(2πijk/N) |k⟩

The QFT on n qubits can be implemented with O(n²) gates using the circuit:

QFT|j₁j₂...jₙ⟩ = (1/√2ⁿ)[|0⟩ + e^(2πi·0.jₙ)|1⟩] ⊗ [|0⟩ + e^(2πi·0.jₙ₋₁jₙ)|1⟩] ⊗ ... ⊗ [|0⟩ + e^(2πi·0.j₁j₂...jₙ)|1⟩]

where 0.j₁j₂...jₙ represents the binary fraction j₁/2 + j₂/4 + ... + jₙ/2ⁿ.

The QFT circuit uses Hadamard gates and controlled rotation gates R_k (which apply a phase of e^(2πi/2ᵏ)). The circuit depth is O(n²), which is much smaller than the classical FFT depth of O(n log n) for n = 2ⁿ elements.

### Resource Requirements

Shor's algorithm for factoring an n-bit RSA key requires:
- 2n + O(log n) qubits for the two registers
- O(n³) quantum gates for the modular exponentiation
- O(n²) gates for the QFT
- O(n³) classical operations for post-processing

For RSA-2048 (n = 2048), this would require approximately 4096 qubits and billions of quantum gates. Current quantum computers have at most 1000+ physical qubits, and each logical qubit requires thousands of physical qubits for error correction. Shor's algorithm for RSA-2048 is estimated to require millions of physical qubits, which is far beyond current capabilities.

However, the threat is real: a sufficiently powerful quantum computer running Shor's algorithm would break RSA, which protects most internet communications. This motivates the development of post-quantum cryptography.

## Quantum Advantage

### What Quantum Advantage Means

Quantum advantage (or quantum supremacy) is the demonstration that a quantum computer can solve a specific problem faster than any classical computer. This does not mean quantum computers are better at everything: it means there exists at least one problem where quantum is provably faster.

The first claimed quantum advantage was Google's 2019 experiment with the Sycamore processor, which performed a specific sampling task (random circuit sampling) in 200 seconds that was estimated to take 10,000 years classically. IBM contested this estimate, arguing that classical simulation was feasible with enough memory.

In 2020, the USTC group demonstrated quantum advantage with Gaussian boson sampling on 76 photons. In 2023, the Atom Computing group demonstrated a 48-logical-qubit error-corrected computation.

### Provable vs. Conditional Advantage

Some quantum speedups are provable (based on known lower bounds for classical computation):
- Simon's problem: exponential quantum speedup
- Period finding (Shor): exponential quantum speedup
- Grover's search: provable quadratic speedup (based on the query complexity lower bound)

Other speedups are conditional (we believe quantum is faster, but have not proven classical lower bounds):
- Quantum simulation: we believe classical simulation of quantum systems is exponential, but this is not proven
- Quantum machine learning: speedups are problem-dependent and often conditional
- Quantum optimization: speedups are heuristic and problem-dependent

### The HHL Algorithm and Linear Systems

The HHL algorithm (Harrow, Hassidim, Lloyd, 2009) solves certain sparse linear systems Ax = b exponentially faster than classical algorithms. The quantum speedup requires that:
1. The matrix A is sparse (poly(n) nonzero entries per row)
2. The matrix A is well-conditioned
3. The output is a quantum state encoding the solution x (not the classical vector x)

The quantum speedup is exponential in the dimension of the system: O(log N) quantum operations versus O(N) classical operations for an N×N system.

However, the caveats are significant:
- Loading the input b into a quantum state may require O(N) operations, eliminating the speedup
- Extracting the full classical solution x requires O(N) measurements
- The speedup applies only to a specific variant of the linear systems problem

HHL is important theoretically but has limited practical applicability in its original form. Variants and extensions are an active area of research.

## Grover's Algorithm in Detail: A Complete Implementation

Let us implement Grover's algorithm for a 3-qubit search space (N = 8) looking for the state |101⟩ = 5.

```python
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np

def oracle_3qubit(marked):
    """Oracle for 3-qubit Grover search."""
    qc = QuantumCircuit(3)
    binary = format(marked, '03b')
    for i, bit in enumerate(reversed(binary)):
        if bit == '0':
            qc.x(i)
    qc.h(2)
    qc.ccx(0, 1, 2)
    qc.h(2)
    for i, bit in enumerate(reversed(binary)):
        if bit == '0':
            qc.x(i)
    return qc

def diffusion_3qubit():
    """3-qubit diffusion operator."""
    qc = QuantumCircuit(3)
    qc.h(range(3))
    qc.x(range(3))
    qc.h(2)
    qc.ccx(0, 1, 2)
    qc.h(2)
    qc.x(range(3))
    qc.h(range(3))
    return qc

def grover_3qubit(marked, iterations):
    """Complete 3-qubit Grover circuit."""
    qc = QuantumCircuit(3, 3)
    qc.h(range(3))
    for _ in range(iterations):
        qc.compose(oracle_3qubit(marked), inplace=True)
        qc.compose(diffusion_3qubit(), inplace=True)
    qc.measure(range(3), range(3))
    return qc

n = 8
marked = 5
optimal_iter = int(np.round(np.pi/4 * np.sqrt(n)))
print(f"Optimal iterations for N={n}: {optimal_iter}")

qc = grover_3qubit(marked, optimal_iter)
simulator = AerSimulator()
compiled = transpile(qc, simulator)
result = simulator.run(compiled, shots=4096).result()
counts = result.get_counts()

print(f"\nSearching for state |{format(marked, '03b')}> ({marked})")
print(f"Results after {optimal_iter} iterations:")
for state, count in sorted(counts.items()):
    print(f"  |{state}>: {count} ({count/4096*100:.1f}%)")
```

For N = 8, the optimal number of iterations is 2. The success probability after 2 iterations is sin²(5θ) where θ = arcsin(1/√8) ≈ 0.3614 rad, giving sin²(5 × 0.3614) ≈ 0.945, or about 94.5%.

## Quantum Algorithm Complexity Theory

### Query Complexity

The standard model for analyzing quantum algorithms is the query complexity model. In this model, the algorithm accesses a black-box function (oracle) that provides information about the input. The query complexity counts the number of times the algorithm calls this oracle.

For classical algorithms, the query complexity of unstructured search is N (you must check each item). For quantum algorithms, Grover's reduces this to √N. This quadratic speedup is optimal: no quantum algorithm can search an unstructured database faster than O(√N).

The proof of this optimality uses the adversary method: for any quantum algorithm that searches an unstructured database, the probability of finding the marked item after k queries is at most k²/N. To achieve probability ≥ 1/2, you need k ≥ √N/2 queries.

### Quantum Speedup Classification

Quantum speedups can be classified by their magnitude:

**Exponential speedup:** The quantum algorithm runs in O(poly(n)) time while the best classical algorithm requires O(2^poly(n)) time. Examples: factoring (Shor's), simulating quantum systems.

**Polynomial speedup:** The quantum algorithm runs in O(n^a) time while the best classical algorithm requires O(n^b) time where b > a. Examples: Grover's search (quadratic speedup), HHL for linear systems.

**No speedup:** The quantum algorithm provides no asymptotic advantage. Examples: sorting, searching sorted arrays.

The classification depends on the problem structure. Problems with algebraic structure (like factoring) often admit exponential speedups. Problems without structure (like unstructured search) admit only polynomial speedups.

### Quantum Algorithm Design Principles

**Amplitude amplification:** Start with a state that has some overlap with the solution, then use Grover-like iterations to amplify the solution amplitude. This is the most general technique for achieving quadratic speedups.

**Quantum phase estimation:** If a unitary operator U has an eigenvalue e^(2πiθ), quantum phase estimation extracts θ efficiently. This is the core of Shor's algorithm and many quantum simulation algorithms.

**Variational methods:** Use a parameterized quantum circuit to prepare a trial state, then measure the expectation value of an observable. Optimize the parameters classically. This is the basis of VQE and QAOA.

**Quantum walks:** The quantum analog of random walks. Quantum walks can provide quadratic speedups for graph problems and exponential speedups for certain spatial search problems.

### Quantum Algorithm Lower Bounds

Proving quantum speedups requires proving classical lower bounds. This is challenging because we do not have tight lower bounds for many computational problems.

**Query complexity lower bounds:**
- Unstructured search: Ω(√N) quantum queries (proven by BBBV97)
- Oracular phase estimation: Ω(1/ε) quantum queries for precision ε
- Oracular Grover search: Ω(√N) quantum queries (optimal)

**Computational complexity lower bounds:**
- Factoring: No classical lower bound known (we believe it is hard, but have not proven it)
- Discrete logarithm: No classical lower bound known
- Simulation of quantum systems: No classical lower bound known (we believe it is exponential, but have not proven it)

The lack of classical lower bounds means that many quantum speedups are conditional: we believe quantum is faster, but have not proven it. This is a fundamental limitation of our current understanding of computational complexity.

## Assessment

**Task 1: Grover's Algorithm Analysis (45 minutes)**
Implement Grover's algorithm for N = 4 (2 qubits), N = 8 (3 qubits), N = 16 (4 qubits), and N = 32 (5 qubits). For each, determine the optimal number of iterations and the expected success probability. Run each circuit 1000 times and verify the experimental success probability matches the theoretical prediction. Create a table comparing N, optimal iterations, theoretical success probability, and experimental success probability. Discuss how the success probability scales with N.

**Task 2: Shor's Algorithm Components (60 minutes)**
Implement the Quantum Fourier Transform for 3, 4, and 5 qubits using Qiskit. Verify that your QFT produces the correct output by applying it to known input states and comparing with the classical DFT. Then implement the modular exponentiation circuit for a = 2, N = 15 (finding the period of 2ˣ mod 15). Use the period finding circuit to determine the period, and verify that you can factor 15 using the classical post-processing step.

**Task 3: Amplitude Amplification (60 minutes)**
Implement the Amplitude Amplification algorithm to find a state that satisfies a specific predicate (e.g., states with an even number of 1s in a 3-qubit system). Start with an initial state that has a 3/8 probability of satisfying the predicate (3 out of 8 states satisfy it). Apply the appropriate number of amplitude amplification iterations and verify that the success probability is amplified. Compare the number of iterations needed with the classical probability.

**Task 4: Quantum Speedup Analysis (45 minutes)**
For each of the following problems, determine whether a quantum speedup exists, what the speedup is (polynomial, exponential, or none), and what the key quantum resource enabling the speedup is: (a) integer factoring, (b) unstructured search, (c) sorting, (d) simulation of quantum systems, (e) satisfiability. Support your analysis with references to the relevant algorithms.

**Grading Criteria:**
- Grover's algorithm implementations are correct and produce expected results (25%)
- QFT implementation is mathematically correct and verified (25%)
- Analysis of quantum speedups demonstrates deep understanding of when and why quantum provides advantage (25%)
- Code quality, documentation, and presentation of results (25%)

## Evidence

- Grover, L.K. "A fast quantum mechanical algorithm for database search." *Proceedings of the 28th Annual ACM Symposium on Theory of Computing*, 212-219 (1996).
- Shor, P.W. "Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer." *SIAM Journal on Computing* 26, 1484 (1999).
- Harrow, A.W., Hassidim, A., & Lloyd, S. "Quantum algorithm for linear systems of equations." *Physical Review Letters* 103, 150502 (2009).
- Nielsen, M.A. & Chuang, I.L. *Quantum Computation and Quantum Information*. Cambridge University Press, 2010. Chapter 6.
- Boyer, M., Brassard, G., Høyer, P., & Tapp, A. "Tight bounds on quantum searching." *Fortschritte der Physik* 46, 493 (1998).
