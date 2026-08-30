# Module 10 — Future: Quantum Networks and the Quantum Internet

## What You'll Actually Do

You will design quantum key distribution protocols, simulate quantum repeater networks, and understand the architecture of a quantum internet. You will map out the timeline for quantum networking technologies and write a deployment strategy for a quantum-secure infrastructure.

## Content

### Quantum Key Distribution (QKD)

QKD allows two parties to establish a shared secret key with information-theoretic security. Any eavesdropping attempt disturbs the quantum states and is detectable.

```python
import numpy as np

class BB84Protocol:
    """Simulate the BB84 QKD protocol."""

    def __init__(self, n_bits=256):
        self.n_bits = n_bits

    def generate_random_bits(self, n):
        return np.random.randint(0, 2, size=n)

    def generate_random_bases(self, n):
        # 0 = rectilinear (+), 1 = diagonal (×)
        return np.random.randint(0, 2, size=n)

    def encode(self, bits, bases):
        """Encode bits using the specified bases."""
        states = []
        for bit, base in zip(bits, bases):
            if base == 0:  # Rectilinear
                state = np.array([1, 0]) if bit == 0 else np.array([0, 1])
            else:  # Diagonal
                state = np.array([1, 1]) / np.sqrt(2) if bit == 0 else np.array([1, -1]) / np.sqrt(2)
            states.append(state)
        return states

    def measure(self, states, bases):
        """Measure states using the specified bases."""
        results = []
        for state, base in zip(states, bases):
            if base == 0:  # Rectilinear basis
                prob_0 = abs(state[0])**2
            else:  # Diagonal basis
                # Project onto diagonal basis
                proj_0 = np.array([1, 1]) / np.sqrt(2)
                prob_0 = abs(np.dot(proj_0, state))**2

            results.append(0 if np.random.random() < prob_0 else 1)
        return np.array(results)

    def run(self):
        # Step 1: Alice generates random bits and bases
        alice_bits = self.generate_random_bits(self.n_bits)
        alice_bases = self.generate_random_bases(self.n_bits)

        # Step 2: Alice encodes and sends
        states = self.encode(alice_bits, alice_bases)

        # Step 3: Eve intercepts (eavesdropping)
        eve_bases = self.generate_random_bases(self.n_bits)
        intercepted = self.measure(states, eve_bases)
        # Eve re-encodes (disturbs the states)
        states = self.encode(intercepted, eve_bases)

        # Step 4: Bob measures
        bob_bases = self.generate_random_bases(self.n_bits)
        bob_bits = self.measure(states, bob_bases)

        # Step 5: Basis reconciliation (public channel)
        matching = alice_bases == bob_bases
        alice_key = alice_bits[matching]
        bob_key = bob_bits[matching]

        # Step 6: Error checking
        error_rate = np.mean(alice_key != bob_key)

        return {
            "key_length": len(alice_key),
            "error_rate": error_rate,
            "secure": error_rate < 0.11,  # Threshold for BB84
            "alice_key": alice_key,
            "bob_key": bob_key
        }

# Run BB84 with eavesdropping
bb84 = BB84Protocol(n_bits=1024)
result = bb84.run()
print(f"Key length: {result['key_length']} bits")
print(f"Error rate: {result['error_rate']:.3f}")
print(f"Secure: {result['secure']}")
```

### Quantum Repeaters

Quantum signals cannot be amplified like classical signals. Quantum repeaters extend the range of quantum communication using entanglement swapping.

```python
import numpy as np

class QuantumRepeaterNode:
    """A single quantum repeater node."""

    def __init__(self, node_id):
        self.node_id = node_id
        self.shared_pairs = []

    def generate_entangled_pair(self):
        """Generate a Bell pair."""
        return {"state": "bell", "fidelity": 0.95}

    def entanglement_swap(self, pair1, pair2):
        """Swap entanglement between two pairs."""
        # In reality this involves Bell state measurement
        swapped_fidelity = pair1["fidelity"] * pair2["fidelity"]
        return {"state": "bell", "fidelity": swapped_fidelity}

class QuantumRepeaterNetwork:
    def __init__(self, n_nodes=5):
        self.nodes = [QuantumRepeaterNode(i) for i in range(n_nodes)]
        self.total_distance = n_nodes * 50  # km per segment

    def establish_end_to_end(self):
        """Establish entanglement between first and last node."""
        pairs = [node.generate_entangled_pair() for node in self.nodes]

        # Entanglement swapping at each intermediate node
        result = pairs[0]
        for pair in pairs[1:]:
            result = self.nodes[0].entanglement_swap(result, pair)

        return {
            "distance_km": self.total_distance,
            "final_fidelity": result["fidelity"],
            "usable": result["fidelity"] > 0.5
        }

network = QuantumRepeaterNetwork(n_nodes=5)
result = network.establish_end_to_end()
print(f"Distance: {result['distance_km']} km")
print(f"Fidelity: {result['final_fidelity']:.3f}")
print(f"Usable: {result['usable']}")
```

### Quantum Internet Architecture

The quantum internet evolves through stages:

```python
quantum_internet_stages = {
    "Stage 1: Trusted Nodes": {
        "description": "Point-to-point QKD with trusted intermediate nodes",
        "technology": "QKD (BB84, E91)",
        "timeline": "Available now",
        "security": "Computational (node compromise is a risk)",
    },
    "Stage 2: Entanglement Distribution": {
        "description": "End-to-end entanglement via quantum repeaters",
        "technology": "Quantum repeaters, entanglement swapping",
        "timeline": "5-10 years",
        "security": "Information-theoretic (device-independent possible)",
    },
    "Stage 3: Quantum Memory Network": {
        "description": "Store and forward quantum information",
        "technology": "Quantum memories, error correction",
        "timeline": "10-15 years",
        "security": "Full quantum network protocols",
    },
    "Stage 4: Full Quantum Internet": {
        "description": "Distributed quantum computing and sensing",
        "technology": "Fault-tolerant quantum computers + networks",
        "timeline": "15-25 years",
        "security": "Quantum advantage in networking",
    },
}

for stage, info in quantum_internet_stages.items():
    print(f"\n{stage}")
    print(f"  {info['description']}")
    print(f"  Technology: {info['technology']}")
    print(f"  Timeline: {info['timeline']}")
    print(f"  Security: {info['security']}")
```

### Current Quantum Network Deployments

```python
deployments = {
    "China": "2,000 km Beijing-Shanghai QKD backbone via trusted nodes",
    "Europe": "EuroQCI initiative — 27 member states building quantum communication infrastructure",
    "USA": "DOE quantum network testbeds in Chicago and Brooklyn",
    "South Korea": "500 km QKD network connecting major cities",
    "Japan": "Tokyo QKD network connecting financial institutions",
    "UK": "UKQN connecting Cambridge, Bristol, and London",
}

for country, deployment in deployments.items():
    print(f"{country}: {deployment}")
```

### Post-Quantum Deployment Roadmap

```python
roadmap = {
    "Year 1-2": [
        "Inventory all cryptographic assets",
        "Deploy hybrid TLS (classical + post-quantum)",
        "Migrate code signing to Dilithium",
        "Enable post-quantum VPN where available",
    ],
    "Year 3-5": [
        "Full migration to NIST-approved post-quantum algorithms",
        "Deploy CRYSTALS-Kyber for key exchange",
        "Implement crypto-agile infrastructure",
        "Begin QKD trials for highest-security links",
    ],
    "Year 5-10": [
        "Quantum repeater deployment for long-haul QKD",
        "Integration with quantum computing services",
        "Continuous monitoring and algorithm updates",
        "Full quantum-secure infrastructure",
    ],
}

for period, actions in roadmap.items():
    print(f"\n{period}:")
    for action in actions:
        print(f"  - {action}")
```

## Assessment

**Lab: Quantum Network Design**

Simulate the BB84 QKD protocol with and without eavesdropping. For each case, run 10 simulations and compare error rates. Then design a quantum repeater network connecting 4 cities (50 km apart) and calculate the end-to-end entanglement fidelity. Finally, write a 500-word deployment strategy for making a financial institution quantum-secure within 3 years.

- Time: 70 minutes
- Grading: BB84 simulation with eavesdropping detection (25%), repeater network with fidelity calculations (25%), deployment strategy with timeline (30%), integration with previous modules (20%)

## Evidence

Upload your BB84 simulation results, repeater network design, deployment strategy document, and a summary connecting all 10 modules into a complete quantum security curriculum.
