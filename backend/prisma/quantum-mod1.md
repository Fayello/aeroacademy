# Module 1 — Quantum Fundamentals: Qubits, Superposition, and Measurement

## What You'll Actually Do

You'll simulate qubits, create superposition states, run measurements, and observe how quantum information behaves differently from classical bits. Hands-on with Qiskit and a real quantum simulator—no hand-waving.

## Content

### Qubits vs Classical Bits

A classical bit is 0 or 1. A qubit exists in a weighted combination of both states simultaneously, described by probability amplitudes:

```python
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(1, 1)
qc.h(0)              # Put qubit into superposition
qc.measure(0, 0)

sim = AerSimulator()
result = sim.run(qc, shots=1000).result()
print(result.get_counts())
# {'0': ~500, '1': ~500} — 50/50 split every time
```

The math: `|ψ⟩ = α|0⟩ + β|1⟩` where `|α|² + |β|² = 1`. The Hadamard gate creates equal amplitudes, so measurement gives 0 or 1 with equal probability.

### The Bloch Sphere

Every single-qubit state maps to a point on a sphere. North pole is `|0⟩`, south pole is `|1⟩`, and the equator holds all the equal superpositions. This is just a visualization tool—it doesn't mean the qubit is literally rotating.

### Measurement Collapses the State

Before measurement, the qubit is in superposition. After measurement, it snaps to a definite value. You cannot "undo" this.

```python
qc = QuantumCircuit(1, 1)
qc.h(0)
qc.h(0)              # Second Hadamard cancels the first
qc.measure(0, 0)

# Always outputs '0' — the two H gates cancel
```

This is interference. Quantum algorithms exploit it to amplify correct answers and cancel wrong ones.

### Entanglement

When two qubits are entangled, measuring one instantly determines the other, regardless of distance.

```python
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)          # CNOT gate: entangles qubit 0 and 1
qc.measure([0, 1], [0, 1])

result = sim.run(qc, shots=1000).result()
print(result.get_counts())
# Only '00' or '11' — never '01' or '10'
```

This Bell state is the foundation of quantum cryptography and teleportation.

### The No-Cloning Theorem

You cannot copy an arbitrary quantum state. This is not a technical limitation—it is provably impossible. This property is what makes quantum key distribution secure: an eavesdropper cannot clone quantum states without detection.

## Assessment

**Lab: Quantum State Playground**

Build a notebook that: (1) creates a qubit with Ry rotation at angle π/4, measures 1000 times, and plots the histogram; (2) creates a Bell state and verifies correlation; (3) demonstrates interference with a Hadamard sandwich; (4) explains why cloning fails with a circuit attempt.

- Time: 45 minutes
- Grading: Correct superposition and measurement stats (30%), Bell state correlation (30%), interference demo (20%), written explanation of no-cloning (20%)

## Evidence

Upload your notebook with all circuits, output histograms, and a written comparison of classical bits vs qubits.
