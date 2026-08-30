# Module 2 — Quantum Gates: Single-Qubit, Multi-Qubit, and Circuits

## What You'll Actually Do

You'll build quantum circuits using real gates, understand their matrix representations, chain them into circuits, and verify results against the math. Every gate you use will have a concrete linear algebra backing—you will not be guessing.

## Content

### Single-Qubit Gates

Every single-qubit gate is a 2×2 unitary matrix. Unitary means it preserves norms and is reversible.

```python
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
import numpy as np

# Hadamard gate
qc = QuantumCircuit(1)
qc.h(0)

sv = Statevector.from_instruction(qc)
print(sv)
# Statevector([0.707+0.j, 0.707+0.j], dims=(2,))
```

The Pauli gates are the building blocks:

```python
# X gate (quantum NOT)
qc_x = QuantumCircuit(1)
qc_x.x(0)            # Flips |0⟩ to |1⟩

# Y gate (rotation around Y axis + phase)
qc_y = QuantumCircuit(1)
qc_y.y(0)

# Z gate (phase flip: |1⟩ gets a -1 phase)
qc_z = QuantumCircuit(1)
qc_z.z(0)
```

The rotation gates give you continuous control:

```python
qc = QuantumCircuit(1)
qc.ry(np.pi / 4, 0)  # Rotate 45° around Y axis
```

### Multi-Qubit Gates

The CNOT gate is the workhorse of multi-qubit circuits. It flips the target qubit if and only if the control qubit is |1⟩.

```python
qc = QuantumCircuit(2)
qc.cx(0, 1)           # CNOT: control=0, target=1

# Toffoli gate (controlled-controlled-NOT)
qc3 = QuantumCircuit(3)
qc3.ccx(0, 1, 2)      # Flips qubit 2 only if both 0 and 1 are |1⟩
```

The SWAP gate exchanges two qubit states:

```python
qc = QuantumCircuit(2)
qc.x(0)               # qubit 0 = |1⟩, qubit 1 = |0⟩
qc.swap(0, 1)         # Now qubit 0 = |0⟩, qubit 1 = |1⟩
```

### Building Circuits from Gates

Every quantum algorithm is a sequence of gates. The order matters—gates do not commute.

```python
qc = QuantumCircuit(3, 3)
qc.h([0, 1, 2])       # Put all three qubits in superposition
qc.cx(0, 1)
qc.cx(1, 2)
qc.measure([0, 1, 2], [0, 1, 2])

# This circuit creates a 3-qubit GHZ state
# Measurement always gives 000 or 111
```

### Gate Decomposition

Any multi-qubit gate can be decomposed into single-qubit gates plus CNOTs. This matters because real hardware only supports a limited gate set.

```python
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

qc = QuantumCircuit(2)
qc.h(0)
qc.cp(np.pi/4, 0, 1)  # Controlled phase gate

# Decompose into basis gates (u3, cx)
pm = generate_preset_pass_manager(optimization_level=2, backend=AerSimulator())
decomposed = pm.run(qc)
print(decomposed.draw())
```

## Assessment

**Lab: Gate Zoo**

Build circuits that: (1) implement a quantum NOT using only Hadamard and Z gates; (2) create a GHZ state of 4 qubits and verify measurement correlation; (3) decompose a Toffoli gate into CNOTs and single-qubit gates; (4) verify gate equivalences by comparing statevectors before and after.

- Time: 50 minutes
- Grading: Correct gate equivalences (25%), GHZ state with proper correlation (25%), Toffoli decomposition (25%), statevector verification (25%)

## Evidence

Upload your notebook with circuit diagrams, statevector comparisons, and a truth table for the Toffoli decomposition.
