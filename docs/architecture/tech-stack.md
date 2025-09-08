# Tech Stack

## Cloud Infrastructure
- **Provider:** Arweave Network (AO Protocol + HyperBEAM)
- **Key Services:** HyperBEAM process hosting, Arweave external data storage, AOConnect for Phase 2 integration
- **Deployment Regions:** Global (decentralized AO network)

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Process Runtime** | HyperBEAM | Latest | Device orchestration + HTTP interface | Advanced AO implementation with device routing |
| **Device Language** | Rust | 1.70+ | WASM device implementation | Type safety, performance, rich ecosystem |
| **Compilation Target** | WebAssembly (WASM) | Latest | Cross-platform device execution | Fast, secure, sandboxed execution |
| **ECS State Management** | HyperBEAM Process Memory | - | Entity-Component storage | Lightweight state with external data refs |
| **External Data Storage** | Arweave Transactions | - | Pokemon/move/item databases | Permanent, decentralized, unlimited capacity |
| **Data Access** | HyperBEAM Arweave Integration | Latest | External data fetching + caching | Built-in gateway client with performance optimization |
| **Message Protocol** | JSON over HTTP | - | Player/agent communication | RESTful interface, AOConnect compatible |
| **RNG System** | Rust + Battle Seeds | - | Deterministic randomness | Cryptographically secure, cross-device consistency |
| **Development Tools** | Cargo + wasm-pack | Latest | Rust WASM toolchain | Industry standard Rust development |
| **Testing Framework** | Rust + WASM testing | Latest | Device unit + integration tests | Type-safe testing with TypeScript parity validation |
| **Agent Discovery** | HyperBEAM Info Protocol | Latest | Process + device discovery | Native AO documentation compliance |

## Device Development Stack

### Rust WASM Toolchain

**Primary Language:** Rust
**Target:** WebAssembly (WASM) for cross-platform execution
**Key Dependencies:**
- `wasm-bindgen` - JavaScript/WASM interop
- `serde` - JSON serialization/deserialization  
- `serde_json` - JSON processing
- `console_error_panic_hook` - WASM debugging support

### Device Architecture

**Device Categories:**
- **Core Logic Devices:** Battle engine, stats calculation, evolution
- **Data Access Devices:** Arweave species/moves/items fetching
- **Query Devices:** Agent-friendly data formatting and queries
- **System Devices:** Administration, monitoring, process info

**Development Workflow:**
1. **Device Implementation:** Write Rust logic with WASM bindings
2. **Compilation:** `wasm-pack build` to generate WASM binaries
3. **Integration:** Deploy WASM devices to HyperBEAM process
4. **Testing:** Rust unit tests + WASM integration tests

### Local Development Environment

**HyperBEAM Development Server**
- Local HyperBEAM node for development
- Device hot-reloading for rapid iteration
- HTTP endpoint testing
- Arweave gateway simulation

**Rust Development Setup:**
```bash
# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install WASM tools
cargo install wasm-pack
npm install -g @wasm-tool/wasm-pack

# Development dependencies
cargo install cargo-watch  # File watching
cargo install cargo-expand # Macro debugging
```

**Device Testing Strategy:**
- **Unit Tests:** Individual device function testing in Rust
- **Integration Tests:** Cross-device communication testing  
- **WASM Tests:** Compiled WASM execution validation
- **Parity Tests:** Output comparison with TypeScript reference
- **Performance Tests:** Battle resolution timing benchmarks

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

## Bundle Size Optimization

### Size Comparison

| Architecture | Bundle Size | External Data | Total Footprint |
|--------------|-------------|---------------|------------------|
| **Legacy Monolithic** | 4.5MB+ | 0MB | 4.5MB+ (exceeds limits) |
| **HyperBEAM + WASM** | ~200KB | Unlimited | 200KB + on-demand |

### Optimization Techniques

**Process Level:**
- Single HyperBEAM process vs. multiple AO processes
- Lightweight ECS state management
- External data references instead of embedded data

**Device Level:**  
- Rust WASM compilation for optimal binary size
- `wee_alloc` for minimal memory allocator
- Dead code elimination via Rust compiler optimizations
- Shared trait libraries to reduce duplication

**Data Level:**
- Arweave external storage eliminates bundle bloat
- Compressed JSON data formats
- Reference-based entity relationships
- Lazy loading of non-essential data

This tech stack achieves **95% bundle size reduction** while maintaining **unlimited data capacity** and **type-safe device development**.