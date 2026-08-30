# Module 9 — Implementation: Qiskit and Quantum Circuits

## What You'll Actually Do

You will build and run quantum circuits on real simulators using Qiskit. You will transpile circuits for different backends, handle noise, optimize circuits, and execute algorithms end-to-end. This is the hands-on module that teaches you to think like a quantum engineer.

## Content

### Setting Up Qiskit

```python
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

# Create a simple circuit
qc = QuantumCircuit(3, 3)
qc.h(0)
qc.cx(0, 1)
qc.cx(1, 2)
qc.measure([0, 1, 2], [0, 1, 2])
print(qc.draw())
```

### Transpilation: Making Circuits Hardware-Ready

Real quantum hardware only supports a limited gate set. Transpilation converts your abstract circuit into hardware-compatible gates.

```python
from qiskit_aer import AerSimulator
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

# AerSimulator supports all gates — no transpilation needed for simulation
backend = AerSimulator()
pm = generate_preset_pass_manager(optimization_level=3, backend=backend)
transpiled = pm.run(qc)

print(f"Original depth: {qc.depth()}")
print(f"Transpiled depth: {transpiled.depth()}")
print(f"Original gates: {qc.size()}")
print(f"Transpiled gates: {transpiled.size()}")
```

### Building a Quantum Random Number Generator

```python
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

def quantum_random_bytes(n_bytes):
    """Generate truly random bytes using quantum measurement."""
    qc = QuantumCircuit(n_bytes * 8, n_bytes * 8)
    qc.h(range(n_bytes * 8))  # Put all qubits in superposition
    qc.measure(range(n_bytes * 8), range(n_bytes * 8))

    sim = AerSimulator()
    result = sim.run(qc, shots=1).result()
    bitstring = list(result.get_counts().keys())[0]

    # Convert bitstring to bytes
    byte_array = bytearray()
    for i in range(0, len(bitstring), 8):
        byte_array.append(int(bitstring[i:i+8], 2))

    return bytes(byte_array)

random_data = quantum_random_bytes(32)
print(f"Random bytes: {random_data.hex()}")
print(f"Length: {len(random_data)} bytes")
```

### Quantum Teleportation

```python
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import numpy as np

def create_teleportation_circuit(state_angle):
    qc = QuantumCircuit(3, 3)

    # Prepare state to teleport on qubit 0
    qc.ry(state_angle, 0)

    # Create Bell pair between qubits 1 and 2
    qc.h(1)
    qc.cx(1, 2)

    # Bell measurement on qubits 0 and 1
    qc.cx(0, 1)
    qc.h(0)

    # Classical corrections (simplified — measurement + conditional)
    qc.measure(0, 0)
    qc.measure(1, 1)

    # In a real implementation, gates on qubit 2 depend on measurement outcomes
    # For simulation, we use conditional operations
    qc.x(2).c_if(1, 1)
    qc.z(2).c_if(0, 1)

    qc.measure(2, 2)
    return qc

qc = create_teleportation_circuit(np.pi / 4)
sim = AerSimulator()
result = sim.run(qc, shots=1000).result()
print(result.get_counts())
```

### Quantum Error Mitigation

Noise is the enemy of quantum computation. Error mitigation techniques reduce noise impact without full error correction.

```python
from qiskit_aer import AerSimulator
from qiskit import QuantumCircuit
import numpy as np

# Simulate a noisy environment
noise_model = AerSimulator()

# Simple zero-noise extrapolation
def zero_noise_extrapolation(circuit, noise_factors=[1, 2, 3]):
    """Estimate the zero-noise result by running at different noise levels."""
    results = []
    for factor in noise_factors:
        # In real hardware, you'd scale the noise level
        sim = AerSimulator()
        result = sim.run(circuit, shots=1000).result()
        counts = result.get_counts()
        # Calculate expectation value
        exp_val = sum(int(k, 2) * v for k, v in counts.items()) / sum(counts.values())
        results.append(exp_val)

    # Richardson extrapolation (simplified)
    # In practice, use proper polynomial fitting
    mitigated = results[0] - (results[1] - results[0])
    return mitigated

qc = QuantumCircuit(1, 1)
qc.h(0)
qc.measure(0, 0)
```

### Running on Real Hardware

```python
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler

# Connect to IBM Quantum (requires API token)
# service = QiskitRuntimeService(channel="ibm_quantum")
# backend = service.least_busy(simulator=False, min_num_qubits=5)
#
# pm = generate_preset_pass_manager(optimization_level=3, backend=backend)
# transpiled = pm.run(qc)
#
# sampler = Sampler(backend)
# job = sampler.run([transpiled])
# result = job.result()
```

## Assessment

**Lab: Quantum Engineering Challenge**

Build a quantum random number generator that outputs 256 bits of truly random data. Then implement a 3-qubit quantum teleportation circuit and verify the teleported state matches the original. Finally, transpile both circuits for a real IBM backend and compare the gate counts and circuit depth before and after transpilation.

- Time: 55 minutes
- Grading: Working QRNG with correct randomness properties (30%), teleportation circuit with state verification (30%), transpilation comparison with analysis (25%), error handling and documentation (15%)

## Evidence

Upload your QRNG code with randomness analysis, teleportation circuit with verification results, and transpilation comparison report.
