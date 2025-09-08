# Technical Assumptions

## Repository Structure: Monorepo
Single repository approach for coordinated HyperBeam migration:
- `/devices/` - Rust WASM device implementations (battle, stats, evolution, etc.)
- `/shared/` - Shared Rust types and traits across devices  
- `/hyperbeam-process/` - HyperBeam process configuration and state management
- `/arweave-data/` - Pokemon species, moves, and items data for external storage
- `/typescript-reference/` - Current implementation for parity testing

## Service Architecture
**Single HyperBeam Process + Distributed WASM Devices**
- HyperBeam process maintains ECS world state (entities, components, player sessions)
- Rust WASM devices handle game logic (battle resolution, stat calculation, evolution)  
- External Arweave storage provides Pokemon species, moves, and items data
- Device routing and message orchestration managed by HyperBeam
- 95% bundle size reduction through external data references

**Rationale:** HyperBeam-native architecture eliminates multi-process complexity while enabling modular Rust device development for type-safe game logic.

## Testing Requirements: Migration Parity Validation
**Critical Requirement:** 100% functional parity with existing TypeScript implementation
- **Parity Testing:** Automated comparison of TypeScript vs Rust device outcomes for identical inputs
- **Device Testing:** Unit testing of individual Rust WASM devices with TypeScript reference validation
- **Integration Testing:** HyperBeam process coordination with device routing and external data fetching
- **End-to-End Testing:** Complete game scenarios comparing TypeScript vs HyperBeam implementations

## Additional Technical Assumptions and Requests

**Core Architecture:**
- **HyperBeam Process:** Single ECS world state manager with HTTP server and device routing
- **Rust WASM Devices:** Stateless, type-safe computational units for game logic (~pokemon-stats@1.0, ~battle-engine@1.0, etc.)
- **External Data Storage:** Arweave transactions for Pokemon species, moves, and items databases (2MB+ data moved external)
- **Device Communication:** HyperBeam message routing to appropriate devices based on action type

**Migration Approach:**
- **TypeScript Reference:** Preserve existing implementation for parity validation
- **Rust Device Logic:** Migrate battle calculations, stat computations, evolution logic to type-safe Rust
- **External Data Migration:** Move static game data to Arweave for bundle size optimization
- **State Synchronization:** ECS entity state managed by HyperBeam with device-computed updates

**Performance Requirements:**
- **Bundle Size:** <500KB HyperBeam process through external data references  
- **Parity Validation:** Zero functional differences between TypeScript and Rust implementations
- **Response Time:** Battle turns complete within existing game performance expectations
