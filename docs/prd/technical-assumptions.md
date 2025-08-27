# Technical Assumptions

## Repository Structure: Monorepo
Single repository approach with organized directories maintaining clean separation:
- `/typescript/` - Existing PokéRogue TypeScript/Phaser codebase
- `/lua/` - AO process Lua handler implementations
- `/bridge/` - AOConnect integration layer for Phase 2
- `/tests/` - Parity testing between TypeScript and Lua implementations
- No shared code folders - each implementation remains completely independent
- Unified repository enables coordinated development while maintaining codebase isolation

## Service Architecture
**Phase 1: Single Comprehensive AO Process**
- All game logic consolidated into one AO process for MVP simplicity
- Handler specialization within single process (battle, state, queries)
- Internal message routing for different game operations
- Architecture designed for potential multi-process expansion in later phases

**Rationale:** Single process reduces deployment complexity and ensures atomic game state management while proving AO feasibility for complex games.

## Testing Requirements: Full Testing Pyramid
**Critical Requirement:** Comprehensive testing to ensure zero functionality loss during migration
- **Parity Testing:** Automated comparison of TypeScript vs Lua battle outcomes
- **Integration Testing:** AOConnect bridge functionality and message handling
- **Load Testing:** AO process performance under concurrent game load
- **End-to-End Testing:** Complete game runs from start to champion victory
- **Agent Integration Testing:** Autonomous agent message protocol validation

## Additional Technical Assumptions and Requests

**Core Language and Framework:**
- **Backend:** Lua 5.3 for AO process handler implementation using AO's native `Handlers.add()` pattern
- **Frontend Bridge:** Continue using existing Phaser.js with TypeScript, integrated via `@permaweb/aoconnect`
- **Message Protocol:** AO's native message-passing system for all game interactions

**Development Environment:**
- **Local AO Emulation:** Required for development and testing workflow
- **Handler Debugging:** AO process logging and message trace analysis capabilities
- **Cross-Platform Development:** Support for contributors on different operating systems

**Data Management:**
- **State Persistence:** Automatic through AO process storage on Arweave (no additional database required)
- **Message Serialization:** JSON format for complex game objects and state transfers
- **Deterministic RNG:** Reproducible random number generation for consistent gameplay across process instances

**Performance Requirements:**
- **Handler Optimization:** Lua code optimized for AO runtime constraints
- **Message Efficiency:** Minimize message size and frequency for optimal network performance
- **State Query Optimization:** Efficient game state retrieval for UI synchronization

**AO Protocol Compliance:**
- **Documentation Protocol:** Mandatory `Info` handler and discoverable handler specifications
- **Handler Discoverability:** All game operations must be queryable through AO documentation protocol
- **Process Metadata:** Version tracking and capability information for agent integration
