# Module 3 — Quantum Algorithms: Grover, Shor, and Quantum Advantage

## What You'll Actually Do

You'll implement Grover's search algorithm and a simplified version of Shor's factoring algorithm. You will measure actual speedups on small problem sizes and understand where the advantage comes from. No hype—just the math and the circuits.

## Content

### Grover's Search Algorithm

Classical search through N items takes O(N) steps. Grover's takes O(√N). For a database of 1,000,000 items, that is 1000 steps instead of 1,000,000.

```python
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import numpy as np

def grover_oracle(n_qubits, target):
    """Oracle that marks the target state with a phase flip."""
    qc = QuantumCircuit(n_qubits)
    # Convert target to binary and flip qubits where needed
    for i, bit in enumerate(reversed(format(target, f'0{n_qubits}b'))):
        if bit == '0':
            qc.x(i)
    qc.h(n_qubits - 1)
    qc.mcx(list(range(n_qubits - 1)), n_qubits - 1)
    qc.h(n_qubits - 1)
    for i, bit in enumerate(reversed(format(target, f'0{n_qubits}b'))):
        if bit == '0':
            qc.x(i)
    return qc

def grover_diffuser(n_qubits):
    """Amplifies the amplitude of the marked state."""
    qc = QuantumCircuit(n_qubits)
    qc.h(range(n_qubits))
    qc.x(range(n_qubits))
    qc.h(n_qubits - 1)
    qc.mcx(list(range(n_qubits - 1)), n_qubits - 1)
    qc.h(n_qubits - 1)
    qc.x(range(n_qubits))
    qc.h(range(n_qubits))
    return qc

# Search 4-qubit space (16 items) for target = 7
n = 4
qc = QuantumCircuit(n, n)
qc.h(range(n))

oracle = grover_oracle(n, 7)
diffuser = grover_diffuser(n)

# Optimal iterations: ~π/4 * √N ≈ 3 for N=16
for _ in range(3):
    qc.compose(oracle, inplace=True)
    qc.compose(diffuser, inplace=True)

qc.measure(range(n), range(n))

sim = AerSimulator()
result = sim.run(qc, shots=1024).result()
counts = result.get_counts()
# '0111' (decimal 7) dominates with ~90% probability
```

The key insight: the oracle marks the answer, and the diffuser amplifies it. Repeat √N times and the answer dominates the measurement.

### Shor's Algorithm: Factoring in Polynomial Time

Classical factoring of an N-bit number takes sub-exponential time. Shor's algorithm takes O(N³) quantum steps. This breaks RSA.

The core idea: factoring reduces to period-finding. The quantum Fourier transform finds the period.

```python
from fractions import Fraction
import math

def classical_period_finder(a, N):
    """Simulates the period-finding part of Shor's algorithm."""
    r = 1
    while pow(a, r, N) != 1:
        r += 1
    return r

N = 15
a = 7
r = classical_period_finder(a, N)
print(f"Period of {a}^x mod {N} = {r}")

# Once you have the period r, factors are gcd(a^(r/2) ± 1, N)
if r % 2 == 0:
    x = pow(a, r // 2, N)
    factor1 = math.gcd(x + 1, N)
    factor2 = math.gcd(x - 1, N)
    print(f"Factors of {N}: {factor1} × {factor2}")
```

The actual quantum circuit for period-finding uses controlled modular exponentiation and the quantum Fourier transform. On small numbers you can simulate it; on large numbers, you need a real quantum computer.

### Where Quantum Advantage Actually Comes From

Quantum speedup comes from:
1. **Superposition**: processing all inputs simultaneously
2. **Interference**: amplifying correct answers, canceling wrong ones
3. **Entanglement**: creating correlations impossible classically

It does NOT come from "trying all answers at once." Measurement collapses the state to one answer. The art is designing circuits where the right answer has high probability.

## Assessment

**Lab: Grover and Shor**

Implement Grover's algorithm for a 5-qubit space (32 items), searching for three different targets. Verify that measurement probability approaches 100% with optimal iterations. Then implement the classical period-finding subroutine and use it to factor three different numbers. Write a 200-word explanation of why Shor's algorithm is a threat to RSA.

- Time: 60 minutes
- Grading: Grover with correct amplification across targets (30%), period-finding and factoring (30%), optimal iteration count justification (20%), RSA threat analysis (20%)

## Evidence

Upload your notebook with Grover measurement histograms for all three targets, factoring results, and your written analysis.
