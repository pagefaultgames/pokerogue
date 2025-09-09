# Epic 1: AO Process Foundation & NIF Systems Integration

Establish foundational single-process AO architecture with Bevy ECS, Rust NIF systems, and HyperBeam HTTP state access for high-performance game logic processing and agent integration.

## Story 1.1: Single AO Process with Custom GameState Architecture Setup
As a **systems architect**,  
I want **single AO process with custom GameState serialization and Lua message routing**,  
so that **game state can be managed efficiently with optimal Lua-Rust communication boundaries**.

### Acceptance Criteria
1. AO process initializes with custom GameState structure for serializable state management
2. Lua message handlers route game actions to appropriate NIF systems
3. Custom GameState contains all necessary game data (entities, components, global data)
4. GameState-to-JSON serialization works efficiently across Lua-Rust boundaries
5. Process deployment succeeds within AO platform constraints
6. Message handling supports both AO messages and HTTP GameState access
7. GameState consistency maintained across all NIF operations
8. Helper functions convert GameState ↔ internal Bevy World seamlessly

## Story 1.2: Rust NIF Systems with Internal Bevy ECS Integration
As a **NIF systems developer**,  
I want **Rust NIF systems that convert GameState to internal Bevy ECS for processing**,  
so that **complete game systems run at native speed with efficient serialization boundaries**.

### Acceptance Criteria
1. Rust NIF systems compile to native shared libraries with internal Bevy ECS conversion
2. NIF functions receive custom GameState JSON, convert to internal Bevy World
3. NIF systems available as `battle_system.process_turn(game_state_json, params)` calls
4. Helper functions `populate_world_from_game_state()` and `extract_world_to_game_state()`
5. GameState serialization performance optimized for frequent NIF calls
6. NIF system hot-reloading supports development iteration without process restart
7. Type-safe GameState struct ensures compile-time validation of serialization
8. Integration testing validates GameState consistency and internal ECS performance

## Story 1.3: HyperBeam HTTP GameState Access & Agent Integration
As a **agent integration developer**,  
I want **HyperBeam HTTP GET endpoints for reading GameState fields via URL paths**,  
so that **agents can efficiently poll game state without message overhead**.

### Acceptance Criteria
1. HyperBeam pathing exposes GameState fields via URL navigation
2. HTTP GET endpoints provide read-only access to GameState components
3. State paths organized for efficient agent queries (`/battle_states/123/available-actions`)
4. JSON responses return GameState field data optimized for agents
5. State consistency between HTTP reads and AO message GameState updates
6. Caching strategies minimize GameState serialization overhead  
7. Agent integration examples demonstrate HTTP polling + AO message sending
8. Performance benchmarks validate HTTP GameState access efficiency

## Story 1.4: TypeScript Reference Preservation & GameState Parity Framework
As a **quality assurance engineer**,  
I want **automated parity testing framework comparing TypeScript reference with GameState NIF implementation**,  
so that **100% functional equivalence is maintained while enabling autonomous agent participation**.

### Acceptance Criteria
1. TypeScript reference implementation preserved in `/typescript-reference/` directory
2. Automated test framework executes identical scenarios on both implementations
3. Parity validation covers all game mechanics across GameState NIF systems
4. Regression detection identifies behavioral differences in GameState transformations
5. Performance benchmarking validates GameState NIF performance vs TypeScript
6. Agent integration testing ensures autonomous agents achieve identical outcomes
7. GameState consistency testing validates serialization accuracy and completeness
8. Continuous integration enforces zero parity violations with agent HTTP GameState access
