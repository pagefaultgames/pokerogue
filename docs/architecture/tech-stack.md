# Tech Stack

## Cloud Infrastructure
- **Provider:** AO Network (Actor Model + HyperBeam Device Orchestration)
- **Key Services:** Distributed actor network, HyperBeam device hosting, cryptographic message verification, permanent data storage
- **Deployment Regions:** Global (resilient distributed AO actor network)
- **Architecture Pattern:** Multi-actor system with pluggable device computation

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Actor Runtime** | AO Network | Latest | Distributed actor execution | Resilient, permissionless, trustless computation |
| **Device Orchestration** | HyperBeam | Latest | Pluggable computation engines | Modular, extensible, custom execution environments |
| **Message Protocol** | AO Cryptographic Messages | Latest | Actor-to-actor communication | Mathematically verifiable message chains |
| **State Verification** | HashPaths | Latest | Computation graph validation | Trustless state verification without central authority |
| **Device Language** | Rust | 1.70+ | High-performance device implementation | Type safety, performance, native Erlang integration |
| **Computation Verification** | AO Crypto Module | Latest | Deterministic randomness + signatures | Cryptographically secure, reproducible game outcomes |
| **Data Persistence** | Arweave Transactions | Latest | Permanent game state storage | Immutable, decentralized, infinite retention |
| **Actor Discovery** | AO Info Protocol | Latest | Actor + device capability discovery | Permissionless agent integration |
| **Development Tools** | aos + HyperBeam CLI | Latest | Local actor development | Standard AO development workflow |
| **Testing Framework** | AO Message Testing | Latest | Actor integration testing | Message-driven test scenarios |
| **Message Schemas** | JSON + Cryptographic Signatures | Latest | Typed actor communication | Type safety with cryptographic integrity |

## Actor Development Stack

### AO-Native Lua Development

**Primary Language:** Lua
**Target:** AO Actor execution environment
**Key Libraries:**
- `json` - Message serialization/deserialization
- `ao` - AO protocol integration
- `crypto` - Cryptographic operations
- `utils` - AO utility functions

## HyperBeam Device Development Stack

### Rust Device Development

**Primary Language:** Rust
**Target:** HyperBeam Rust NIF devices
**Key Dependencies:**
- `rustler` - Erlang NIF framework for Rust
- `anyhow` - Error handling
- `ureq` - HTTP client for external data access
- `serde` and `serde_json` - JSON serialization
- `tokio` - Async runtime (when needed)

### Actor Architecture

**Actor Categories:**
- **GameManager Actor:** Session coordination and message routing
- **BattleResolver Actor:** Combat resolution with cryptographic verification
- **StateKeeper Actor:** Permanent state management and persistence
- **QueryHandler Actor:** Trustless state queries for agents

**HyperBeam Rust NIF Device Categories:**
- **Core Logic NIFs:** Battle engine, stats calculation, evolution (Native performance)
- **Verification NIFs:** HashPath validation, computation graph verification (Cryptographic)
- **Query NIFs:** Agent-friendly data formatting and queries (High-speed JSON)
- **Persistence NIFs:** Arweave integration, state management (Direct I/O)

**Development Workflow:**
1. **Actor Implementation:** Write Lua actor logic with message handlers
2. **Rust NIF Development:** Create Rust libraries with `#[rustler::nif]` functions
3. **NIF Compilation:** Build Rust NIFs as native shared libraries (.so)
4. **HyperBeam Integration:** Deploy NIFs to HyperBeam's priv directory with dynamic loading
5. **Testing:** Rust unit tests + Erlang NIF integration tests + actor message testing

### Local Development Environment

**AO Local Development**
- aos command-line interface for actor development
- HyperBeam device orchestration testing
- Message simulation and validation
- Cryptographic verification testing

**AO + HyperBeam Development Setup:**
```bash
# Install AO development tools
npm install -g @permaweb/aoconnect
npm install -g aos

# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Erlang/OTP and rebar3 (required for HyperBeam)
# On macOS: brew install erlang rebar3
# On Ubuntu: sudo apt-get install erlang rebar3

# Clone HyperBeam (edge branch for beta)
git clone -b edge https://github.com/hyperbeam/hyperbeam.git
cd hyperbeam

# Start local AO + HyperBeam development
aos my-actor --local
# HyperBeam will be integrated with the actor

# Rust device development tools
cargo install cargo-watch  # File watching for development
```

**Actor Testing Strategy:**
- **Unit Tests:** Individual actor message handler testing
- **Integration Tests:** Cross-actor message flow validation
- **NIF Tests:** HyperBeam native device computation verification
- **Cryptographic Tests:** HashPath and signature validation
- **Parity Tests:** Output comparison with TypeScript reference
- **Performance Tests:** Native performance throughput and latency benchmarks

## External Data Architecture

### Arweave Integration

**Data Storage Strategy:**
- **Pokemon Species:** Individual transactions per species (~2KB each)
- **Move Database:** Batched moves by type/generation (~50KB per transaction)
- **Item Database:** Complete item catalog (~200KB single transaction)
- **Type Effectiveness:** Static type chart (~5KB single transaction)

**Access Patterns:**
- **Caching:** Frequently accessed data cached in device memory
- **Lazy Loading:** Species data fetched only when needed
- **Batch Requests:** Multiple data items fetched in single gateway call
- **Fallback Gateways:** Multiple Arweave gateway support for reliability

**Transaction Structure:**
```json
{
  "tags": [
    {"name": "App-Name", "value": "PokemonECS"},
    {"name": "Data-Type", "value": "Species"},
    {"name": "Species-ID", "value": "CHARIZARD"},
    {"name": "Generation", "value": "1"}
  ],
  "data": "base64_encoded_pokemon_data"
}
```

## Actor Network Efficiency

### Architecture Comparison

| Architecture | Actor Footprint | Device Complexity | Scalability | Verifiability |
|--------------|-----------------|-------------------|-------------|---------------|
| **Legacy Monolithic** | 4.5MB+ single process | N/A | Limited | None |
| **AO Actor Model** | ~50KB per actor | Distributed devices | Unlimited | Cryptographic |

### Optimization Techniques

**Actor Level:**
- Lightweight Lua actors with minimal state
- Message-driven communication eliminates coupling
- Distributed state across specialized actors
- Cryptographic message verification without central authority

**NIF Device Level:**  
- HyperBeam pluggable native computation engines
- Specialized NIF devices for specific game mechanics
- Reusable NIF libraries across multiple actors
- Native execution environments for maximum performance

**Network Level:**
- AO's resilient distributed architecture
- Automatic redundancy and fault tolerance
- Permissionless actor deployment and discovery
- Cryptographically verifiable computation paths

**Data Level:**
- Arweave permanent storage with infinite retention
- HashPath-linked data relationships
- Trustless data verification without central database
- On-demand loading through device orchestration

This architecture achieves **unlimited scalability** while maintaining **mathematical verifiability** and **permissionless extensibility**.