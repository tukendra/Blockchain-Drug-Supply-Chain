# Blockchain-Driven Trustworthy Drug Supply Chain Management

A research prototype for secure, transparent, traceable, and auditable drug supply-chain transactions using Ethereum-compatible smart contracts, Ganache, IPFS/Kubo, React.js, and a Node.js Fog/Edge processing layer.

**Manuscript:** *Blockchain-Driven Trustworthy Framework for End-to-End Secure, Transparent, and Traceable Drug Supply Chain Management*

> This repository is intended for academic research, experimentation, and reproducibility. It is not a production pharmaceutical distribution system.

## Key Features

- Blockchain-based drug-lot transaction recording
- Smart-contract-based role/access control
- Manufacturer, Supplier, Distributor, Pharmacy, and Customer entities
- LotBatch, Shipment, and AuditLog support
- Required-field, expiry, and duplicate-lot validation
- IPFS-based off-chain storage and CID generation
- Fog/Edge-side validation, processing, and optional caching
- Blockchain event-based auditability and traceability
- Latency, controlled throughput, IPFS storage time, confirmation time, and success-rate measurement
- Controlled Fog/Edge versus No-Fog benchmarking

## Architecture

```text
React.js + MetaMask
        |
        v
Ethereum-Compatible Blockchain (Ganache)
        |
        | Smart-contract transactions/events
        v
Fog / Edge Processing Layer
Node.js / Express.js
  | validation
  | duplicate detection
  | cache processing
  | performance logging
        |
        v
IPFS / Kubo
        |
        v
Content Identifier (CID)
```

### Data Flow

1. A stakeholder submits drug-supply-chain information through the React frontend.
2. MetaMask supplies the blockchain account used for the transaction.
3. The Fog/Edge backend validates the submitted data.
4. Duplicate and data-quality checks are performed.
5. Detailed off-chain data is stored in IPFS.
6. IPFS returns a Content Identifier (CID).
7. The corresponding blockchain transaction and event information provide the on-chain reference.
8. Performance metrics are recorded for experimental analysis.

## Supply-Chain Entities

| Entity | Purpose |
|---|---|
| Manufacturer | Manufacturing information |
| Supplier | Supplier transactions |
| Distributor | Distribution transactions |
| Pharmacy | Pharmacy-level transactions |
| Customer | Customer/end-recipient information |
| LotBatch | Drug lot/batch information |
| Shipment | Shipment information |
| AuditLog | Audit and traceability information |

## Technology Stack

| Component | Version / Technology |
|---|---|
| Smart Contract | Solidity 0.8.9 |
| Blockchain | Ethereum-compatible local network |
| Ganache | Desktop 2.7.1 |
| Frontend | React.js 19.1.1 |
| Backend | Node.js 22.19.0 + Express.js |
| Blockchain Library | ethers.js 6.15.0 |
| IPFS | Kubo 0.37.0 |
| IPFS Desktop | 0.45.0 |
| Web3 Library | Web3 4.16.0 |
| Wallet | MetaMask |
| IDE | Visual Studio Code 1.87.1 |

## Repository Structure

A typical structure is:

```text
drug-supply-chain/
├── contracts/
│   └── DrugSupplyChain.sol
├── migrations/
├── build/
│   └── contracts/
│       └── DrugSupplyChain.json
├── src/
│   └── App.js
├── server.js
├── server_without_fog.js
├── performance_metrics.json
├── performance_metrics_without_fog.json
├── records.txt
├── records_without_fog.txt
├── package.json
├── truffle-config.js
└── README.md
```

File names can vary slightly with the repository version.

# Installation and Setup

## 1. Prerequisites

Install:

- Node.js and npm
- Ganache Desktop
- MetaMask
- IPFS Desktop / Kubo
- Git
- Visual Studio Code or another code editor

Check Node.js:

```bash
node --version
npm --version
```

## 2. Clone the Repository

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd <YOUR-REPOSITORY-FOLDER>
```

Replace the placeholders with your actual repository URL and folder.

## 3. Install Dependencies

From the project directory:

```bash
npm install
```

If the backend is maintained in a separate directory with its own `package.json`:

```bash
cd edge-server
npm install
cd ..
```

# Blockchain Setup

## 4. Start Ganache

Open Ganache Desktop and start the local Ethereum-compatible workspace used by the project. Use the RPC endpoint configured in `truffle-config.js` and the application.

Example:

```text
http://127.0.0.1:7545
```

The actual port may differ according to the local Ganache configuration.

## 5. Compile and Deploy

```bash
truffle compile
truffle migrate --reset
```

The deployment generates the contract artifact, normally under:

```text
build/contracts/DrugSupplyChain.json
```

# MetaMask Setup

1. Install MetaMask.
2. Add the local Ganache network.
3. Import a Ganache test account.
4. Connect MetaMask to the same network on which the contract was deployed.
5. Open the React application and connect the wallet.

**Never commit real private keys, seed phrases, or wallet credentials to GitHub.** Use local development accounts only.

# IPFS / Kubo Setup

Start IPFS Desktop/Kubo.

The prototype uses the local IPFS API:

```text
http://127.0.0.1:5001
```

The local gateway can be used as:

```text
http://127.0.0.1:8080/ipfs/<CID>
```

A CID is an **IPFS Content Identifier**, not an Ethereum address.

# Start the Fog / Edge Server

The main backend performs validation, IPFS storage, processing, and performance logging.

```bash
node server.js
```

The application uses the storage endpoint:

```text
http://localhost:4000/store
```

The server can perform:

- Input validation
- Drug-lot validation
- Duplicate detection
- IPFS storage
- CID generation
- Latency measurement
- Controlled throughput calculation
- Performance logging
- Record persistence

# Start the React Application

From the frontend directory:

```bash
npm start
```

The development server is commonly available at:

```text
http://localhost:3000
```

# Controlled Experimental Baseline

The repository supports comparison between:

### Fog/Edge-enabled configuration

```text
Blockchain + Fog/Edge Processing + IPFS
```

Implemented through:

```text
server.js
```

### No-Fog baseline

```text
Blockchain + IPFS
```

Implemented through:

```text
server_without_fog.js
```

The baseline is intended to isolate the effect of the additional Fog/Edge processing layer under otherwise controlled conditions.

# Benchmark Configuration

The documented benchmark uses:

- Workloads: **10, 50, and 100 transactions**
- Independent runs: **5 per workload/configuration**
- Configurations: **Fog/Edge and No-Fog**
- Concurrency: **1**
- Inter-transaction delay: **1000 ms**
- Same transaction sequence for paired configurations

Total benchmark transaction executions:

```text
5 × (10 + 50 + 100) × 2 = 1,600
```

## Metrics

| Metric | Description |
|---|---|
| Mean Latency | Average transaction-processing latency |
| Median Latency | Middle latency value |
| Standard Deviation | Latency variability |
| P95 Latency | 95th-percentile latency |
| IPFS Storage Time | Time required for IPFS storage |
| Blockchain Confirmation Time | Time associated with blockchain confirmation |
| Controlled TPS | Throughput under the controlled workload |
| Success Rate | Percentage of successfully completed transactions |

The benchmark is intended to characterize **workload-dependent behavior**, not to claim a universal performance advantage for Fog/Edge processing.

# Performance Files

Typical output files include:

```text
performance_metrics.json
performance_metrics_without_fog.json
records.txt
records_without_fog.txt
```

These files support experimental analysis and reproducibility. Remove or exclude any file containing credentials, private data, or sensitive deployment information before publishing the repository.

# Security and Validation

The prototype includes application-level controls such as:

- Smart-contract role/access restrictions
- Owner-only protected operations where implemented
- Required-field validation
- Drug-lot validation
- Duplicate Lot ID detection
- Expiry validation
- Blockchain event traceability
- Runtime authorization testing
- Static smart-contract analysis

Security evaluation of this research prototype does **not** constitute a formal proof of security. The local experiment does not empirically evaluate multi-node fault tolerance, geographically distributed deployment, physical IoT compromise, or production-scale adversarial workloads.

# Traceability

```text
Stakeholder Transaction
        |
        +-- Blockchain Transaction Hash
        |
        +-- Blockchain Event
        |
        +-- IPFS Content Identifier (CID)
                    |
                    v
              IPFS Drug Record
```

The blockchain transaction and event information provide the on-chain transaction reference, while the CID enables retrieval of the associated off-chain IPFS content.

# Reproducibility

To reproduce the experiments:

1. Start Ganache.
2. Deploy `DrugSupplyChain.sol`.
3. Start IPFS Desktop/Kubo.
4. Confirm the local IPFS API configuration.
5. Start `server.js`.
6. Start the React frontend.
7. Connect MetaMask to Ganache.
8. Execute the defined workloads.
9. Record transaction hashes, CIDs, and performance metrics.
10. Repeat according to the benchmark configuration.
11. Run the No-Fog configuration with `server_without_fog.js`.
12. Compare the resulting metrics under the same workload conditions.

For paired comparisons, keep the blockchain environment, IPFS environment, transaction sequence, workload size, inter-transaction delay, concurrency, and measurement procedure consistent.

# Scope and Limitations

This repository contains a **research prototype** running in a local development environment. Results should therefore be interpreted within the tested experimental conditions.

The current scope does not provide:

- Production deployment
- Regulatory-compliance certification
- Complete multi-node fault-tolerance evaluation
- Physical IoT sensor deployment
- Geographically distributed Fog infrastructure
- Formal mathematical security proof
- Direct one-to-one implementation of every existing blockchain supply-chain platform

# Future Work

Future research can investigate:

- Multi-node and geographically distributed Fog/Edge deployment
- Physical IoT, RFID, GPS, and sensor integration
- Higher concurrency and sustained workloads
- Network delay, packet loss, and node-failure conditions
- Formal smart-contract verification
- Adversarial and compromised-participant testing
- Interoperability with standardized blockchain platforms
- Privacy-preserving mechanisms
- Regulatory and governance integration
- Real-world pharmaceutical supply-chain pilot studies
- Resource and operational-cost evaluation

# Citation

If you use this repository or implementation in academic work, cite the associated research paper. Update the following BibTeX entry with the final journal/conference metadata, DOI, and complete author list after publication.

```bibtex
@article{tukendra_drug_supply_chain,
  title   = {Blockchain-Driven Trustworthy Framework for End-to-End Secure, Transparent, and Traceable Drug Supply Chain Management},
  author  = {Tukendra Kumar Dahariya, Suraj Sharma, Soubhagya Ranjan Mallick, Pramod Kumar Pandey, Bharat Tidke},
  year    = {2026},
  note    = {Research prototype and experimental implementation}
}
```

# Disclaimer

This repository is provided for **academic research and experimental purposes**. It is not intended to replace validated pharmaceutical supply-chain systems, regulatory processes, clinical systems, or production security infrastructure.

# Author

**Tukendra Kumar Dahariya**  
PhD Research Scholar  
Department of Computer Science & Engineering  
Guru Ghasidas Vishwavidyalaya, Bilaspur, Chhattisgarh, India

# License

Add an appropriate open-source license before public release, such as MIT or Apache-2.0, subject to your institutional requirements and compatibility with project dependencies.
