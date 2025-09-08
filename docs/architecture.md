# PokéRogue ECS HyperBeam Architecture

## Overview

PokéRogue implements a greenfield Entity-Component-System (ECS) architecture optimized for high-performance game processing on the Arweave AO platform. The HyperBeam engine leverages data-oriented design patterns, SIMD vectorization, and cache-optimized memory layouts to achieve unprecedented performance in decentralized gaming.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-26 | 1.0.0 | Initial architecture document | Architect Agent |
| 2025-01-26 | 2.0.0 | **MAJOR ARCHITECTURE REVISION**: HyperBEAM + Rust WASM Devices | Architect Agent |
| 2025-09-08 | 3.0.0 | **GREENFIELD ECS HYPERBEAM ARCHITECTURE**: Complete project reset | Product Owner |

## High Level Architecture

### Technical Summary

The PokéRogue AO migration employs a **HyperBEAM-native ECS architecture** with Rust WASM devices, transforming the existing object-oriented TypeScript codebase into a distributed Entity-Component-System running on the AO network. The architecture prioritizes **100% behavioral parity** with the current implementation while achieving **95% bundle size reduction** through external data references and enabling autonomous agent participation through rich device-based interfaces. Core architectural patterns include HyperBEAM process state management, Rust WASM device-based game logic, deterministic battle resolution through seeded RNG systems, and external data storage via Arweave references, directly supporting the PRD's goal of creating the world's first fully UI-agnostic roguelike where AI agents battle as first-class citizens.

### High Level Overview

**Architectural Style:** **HyperBEAM Entity-Component-System with Rust WASM Devices**
- Single HyperBEAM process managing ECS world state with external data references
- Rust WASM devices implementing game logic as stateless, type-safe computational units
- Entity-Component-System architecture replacing object-oriented patterns
- External data storage on Arweave eliminating bundle size constraints

**Repository Structure:** **Monorepo** (from PRD Technical Assumptions)
- `/devices/` - Rust WASM device implementations (battle, stats, evolution, etc.)
- `/shared/` - Shared Rust types and traits across devices
- `/hyperbeam-process/` - HyperBEAM process configuration and state management
- `/arweave-data/` - Pokemon species, moves, and items data for external storage
- `/typescript-reference/` - Current implementation for parity testing

**Service Architecture:** **Single HyperBEAM Process + Distributed WASM Devices**
- HyperBEAM process maintains ECS world state (entities, components, player sessions)
- Rust WASM devices handle game logic (battle resolution, stat calculation, evolution)
- External Arweave storage provides Pokemon species, moves, and items data
- Device routing and message orchestration managed by HyperBEAM

**Primary Data Flow:** **Player → HTTP → HyperBEAM Process → Device Router → WASM Device + Arweave Data → Response**
1. Players/agents send HTTP requests to HyperBEAM process
2. Process routes messages to appropriate Rust WASM devices based on action
3. Devices fetch external data from Arweave and execute game logic
4. Process applies state updates and sends responses back via HTTP

**Key Architectural Decisions:**
- **ECS Over OOP:** Entity-Component-System architecture with external data references
- **WASM Devices:** Rust-compiled devices for type-safe, performant game logic
- **External Data:** Arweave storage eliminates bundle bloat (95% size reduction)
- **HyperBEAM Native:** Single process with device routing vs. multi-process complexity
- **Agent-First:** Rich query interfaces designed for autonomous agent participation

### High Level Project Diagram

```mermaid
graph TB
    subgraph "Player Interfaces"
        P1[Human Players<br/>Phase 2: AOConnect UI]
        P2[AI Agents<br/>Phase 3: HTTP API]
    end
    
    subgraph "HyperBEAM Process: Pokemon ECS World (~200KB)"
        HTTP[HTTP Server<br/>~relay@1.0 device]
        PROC[Process State<br/>ECS World + Sessions]
        ROUTER[Message Router<br/>Device orchestration]
    end
    
    subgraph "Rust WASM Devices (Stateless Logic)"
        D1[~pokemon-stats@1.0<br/>Stats calculation]
        D2[~battle-engine@1.0<br/>Damage + effects]
        D3[~evolution-system@1.0<br/>Evolution logic]
        D4[~query-handler@1.0<br/>Agent queries]
        D5[~arweave-species@1.0<br/>Species data fetching]
    end
    
    subgraph "External Data Storage (Arweave)"
        AR1[Species Database<br/>900+ Pokemon (~2MB)]
        AR2[Moves Database<br/>800+ moves (~1.5MB)]
        AR3[Items Database<br/>All items (~800KB)]
        AR4[Type Chart<br/>Effectiveness data]
    end
    
    P1 --> HTTP
    P2 --> HTTP
    HTTP --> ROUTER
    ROUTER --> PROC
    
    ROUTER --> D1
    ROUTER --> D2 
    ROUTER --> D3
    ROUTER --> D4
    ROUTER --> D5
    
    D1 --> AR1
    D2 --> AR1
    D2 --> AR2
    D3 --> AR1
    D4 --> AR1
    D5 --> AR1
    D5 --> AR2
    D5 --> AR3
    D5 --> AR4
```

### Architectural and Design Patterns

- **Entity-Component-System (ECS) Pattern:** Entities as lightweight IDs, Components as data tables, Systems as Rust WASM devices - _Rationale:_ Perfect separation of state and logic, enabling external data references and modular device development

- **HyperBEAM Device Routing:** HTTP requests routed to appropriate Rust WASM devices based on action type - _Rationale:_ Single process coordination with specialized device logic, eliminating multi-process complexity

- **External Data References:** Pokemon species, moves, and items stored on Arweave with transaction ID references - _Rationale:_ 95% bundle size reduction while maintaining unlimited data capability

- **Rust WASM Device Pattern:** Stateless, type-safe computational units compiled to WebAssembly - _Rationale:_ Performance, safety, and maintainability for complex Pokemon battle calculations

- **Deterministic Battle Resolution:** Seeded RNG system preserved across device calls for reproducible outcomes - _Rationale:_ Ensures exact parity with TypeScript implementation and enables battle replay/verification

- **Cached External Data Access:** Frequently accessed Arweave data cached within devices for performance - _Rationale:_ Balances external data benefits with real-time battle requirements

- **Agent-First Query Interfaces:** Rich, granular query capabilities designed for autonomous agents - _Rationale:_ Enables AI agents to make informed decisions with full game state visibility

## Tech Stack

### Cloud Infrastructure
- **Provider:** Arweave Network (AO Protocol + HyperBEAM)
- **Key Services:** HyperBEAM process hosting, Arweave external data storage, AOConnect for Phase 2 integration
- **Deployment Regions:** Global (decentralized AO network)

### Technology Stack Table

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

## Data Models

### Pokemon Model

**Purpose:** Represents individual Pokemon with complete battle stats, progression, and state information

**Key Attributes:**
- `id`: number - Unique Pokemon instance identifier
- `speciesId`: string - Species identifier from SpeciesId enum
- `level`: number - Current Pokemon level (1-100)
- `exp`: number - Total experience points
- `hp`: number - Current hit points
- `maxHp`: number - Maximum hit points at current level
- `stats`: table - Current battle stats [HP, ATK, DEF, SPATK, SPDEF, SPEED]
- `ivs`: table - Individual values for stat calculation
- `nature`: string - Nature affecting stat growth
- `moveset`: table - Array of PokemonMove objects
- `statusEffect`: string|nil - Current status condition
- `abilities`: table - Available abilities and current selection
- `heldItem`: string|nil - Currently held item identifier
- `battleData`: table - Temporary battle-specific data

**Relationships:**
- Belongs to Player (via party roster)
- References Species data (via speciesId)
- Contains Move data (via moveset array)
- Links to Battle data (when actively battling)

### Battle Model

**Purpose:** Manages active battle state including turn order, commands, and battle-specific conditions

**Key Attributes:**
- `battleId`: string - Unique battle session identifier
- `playerId`: string - Player wallet address
- `battleType`: string - Type of battle (WILD, TRAINER, GYM, etc.)
- `turn`: number - Current battle turn
- `battleSeed`: string - Deterministic RNG seed
- `playerParty`: table - Player's active Pokemon
- `enemyParty`: table - Enemy Pokemon data
- `turnCommands`: table - Queued player commands
- `battleState`: string - Current battle phase
- `conditions`: table - Active field conditions and effects

**Relationships:**
- Contains Pokemon instances (player and enemy parties)
- References Player progression data
- Links to Move usage history
- Connects to Item usage tracking

### Player Model

**Purpose:** Stores comprehensive player progression, save data, and game state across sessions

**Key Attributes:**
- `playerId`: string - Player wallet address (AO identity)
- `gameVersion`: string - Save data version for migration compatibility
- `progression`: table - Game progression state
- `party`: table - Current Pokemon party (up to 6)
- `pcStorage`: table - PC Pokemon storage system
- `inventory`: table - Items, money, and resources
- `pokedex`: table - Species seen/caught tracking
- `gameStats`: table - Battle wins, losses, playtime
- `settings`: table - Game preferences and options

**Relationships:**
- Owns Pokemon collection (party + PC)
- Tracks Battle participation history
- Maintains Item inventory
- Records Species discovery progress

## Components

### Battle Resolution Handler

**Responsibility:** Complete battle turn processing including damage calculation, status effects, stat modifications, and deterministic outcome resolution

**Key Interfaces:**
- `processBattleTurn(battleCommand)` - Main battle logic entry point
- `calculateDamage(attacker, defender, move)` - Damage calculation with type effectiveness
- `applyStatusEffects(pokemon, effects)` - Status condition application and resolution
- `validateBattleState(battleId, expectedHash)` - Battle state consistency verification

**Dependencies:** 
- Pokemon stat calculation system (from enhanced data models)
- Move database for power, accuracy, and effect definitions
- Type effectiveness matrix for damage multipliers
- RNG system using AO crypto module for deterministic randomness

**Technology Stack:** Lua handlers with JSON message processing, AO crypto RNG for battle seeds

### Pokemon State Manager

**Responsibility:** Pokemon creation, stat calculation, evolution, and state persistence with mathematical precision matching TypeScript implementation

**Key Interfaces:**
- `createPokemon(speciesId, level, ivs, nature)` - Pokemon instantiation with stat calculation
- `recalculateStats(pokemonId)` - Stat recalculation with modifier application
- `applyStatModifiers(pokemon, modifiers)` - Precise modifier application in correct order
- `evolvePokemon(pokemonId, evolutionId)` - Evolution processing with stat recalculation

**Dependencies:**
- Species database for base stats and evolution trees
- Nature system for stat multipliers (exact 0.9/1.1 values)
- Modifier system for vitamins, items, and ability effects
- Experience calculation for level progression

**Technology Stack:** In-process Lua tables with embedded species data, custom stat calculation matching TypeScript formulas

### Game State Coordinator

**Responsibility:** Player progression, save/load operations, cross-session state consistency, and game flow management

**Key Interfaces:**
- `saveGameState(playerId, gameData)` - Complete game state serialization
- `loadGameState(playerId)` - Game state restoration with validation
- `updateProgression(playerId, progressData)` - Wave advancement and unlock tracking  
- `validateStateIntegrity(playerId)` - Save data corruption prevention

**Dependencies:**
- Player data models for progression tracking
- Pokemon state for party and PC management
- Item inventory for resource tracking
- Battle history for statistics

**Technology Stack:** AO process memory with JSON serialization, state validation checksums

### Query Response Handler

**Responsibility:** State queries for agents and UI systems, battle information retrieval, and process discovery for autonomous agents

**Key Interfaces:**
- `queryBattleState(battleId, queryType)` - Current battle information for decision making
- `queryPlayerState(playerId, stateType)` - Player progression and Pokemon data
- `queryProcessInfo()` - AO documentation protocol compliance for agent discovery
- `queryAvailableActions(battleId, playerId)` - Valid command options for current battle state

**Dependencies:**
- Battle state data for current turn information
- Player state for party and progression queries
- Move database for available action validation
- Process metadata for agent discovery

**Technology Stack:** Native AO handlers with JSON responses, AO documentation protocol compliance

### Process Administration Handler

**Responsibility:** AO documentation protocol compliance, process information, handler discovery, and agent integration support

**Key Interfaces:**
- `getProcessInfo()` - Process metadata and capabilities
- `discoverHandlers()` - Available message handlers for agents
- `getMessageSchemas()` - JSON schemas for agent development
- `validateMessageFormat(messageType, data)` - Input validation for all handlers

**Dependencies:**
- Process configuration and version information
- Handler registry for discovery
- Message schema definitions
- Validation logic for all message types

**Technology Stack:** AO Info handler compliance, JSON schema validation, process documentation

## Core Workflows

### Workflow 1: Battle Turn Resolution

```mermaid
sequenceDiagram
    participant Player as Player/Agent
    participant BH as Battle Handler
    participant PSM as Pokemon State Manager
    participant RNG as AO Crypto RNG
    participant GS as Game State
    
    Player->>BH: BattleCommand{battleId, command: "FIGHT", move, targets}
    
    BH->>GS: getBattleById(battleId)
    GS-->>BH: battle state
    
    BH->>RNG: initializeBattleRNG(battleId, battleSeed)
    RNG-->>BH: seeded RNG ready
    
    BH->>PSM: calculateDamage(attacker, defender, move)
    PSM->>PSM: getStats(attacker) // Uses precise stat calculation
    PSM->>RNG: getBattleRandom(battleId, 1, 100) // Accuracy check
    RNG-->>PSM: random value
    PSM->>PSM: applyTypeEffectiveness(moveType, defenderTypes)
    PSM->>RNG: getBattleRandom(battleId, 85, 100) // Damage roll
    RNG-->>PSM: damage multiplier
    PSM-->>BH: damage result
    
    BH->>PSM: applyDamage(defenderId, damage)
    PSM->>PSM: updateHP(defenderId, newHP)
    PSM->>GS: savePokemonState(defenderId, updatedPokemon)
    
    BH->>GS: updateBattleState(battleId, turnResult)
    BH-->>Player: BattleResult{outcome, damage, newState, nextTurn}
```

### Workflow 2: Agent Battle Decision Process (Phase 3)

```mermaid
sequenceDiagram
    participant Agent as Autonomous Agent
    participant PAH as Process Admin Handler
    participant QRH as Query Response Handler
    participant BH as Battle Handler
    participant GS as Game State
    
    Note over Agent: Agent discovers process and capabilities
    Agent->>PAH: Info request
    PAH-->>Agent: Process info + available handlers + schemas
    
    Note over Agent: Agent queries current battle state
    Agent->>QRH: QueryState{battleId, queryType: "BATTLE"}
    QRH->>GS: getCurrentBattleState(battleId)
    GS-->>QRH: complete battle state
    QRH-->>Agent: battle data + available actions
    
    Note over Agent: Agent analyzes and makes decision
    Agent->>Agent: analyzeBattleState(battleData)
    Agent->>Agent: selectOptimalMove(availableActions)
    
    Note over Agent: Agent executes battle command  
    Agent->>BH: BattleCommand{playerId, battleId, command: "FIGHT", move}
    BH->>BH: processBattleTurn(agentCommand)
    BH-->>Agent: battle result + updated state
```

## Database Schema (Embedded Lua Data Structures)

### Species Database Schema

```lua
-- Species Database Structure
local SpeciesDatabase = {
  [SPECIES.CHARIZARD] = {
    speciesId = SPECIES.CHARIZARD,
    name = "Charizard",
    baseStats = {78, 84, 78, 109, 85, 100}, -- HP, ATK, DEF, SPATK, SPDEF, SPD
    types = {POKEMON_TYPE.FIRE, POKEMON_TYPE.FLYING},
    abilities = {ABILITY.BLAZE, ABILITY.SOLAR_POWER}, -- normal, hidden
    height = 17, -- decimeters
    weight = 905, -- hectograms
    
    -- Evolution data
    evolutionChain = {
      from = SPECIES.CHARMELEON,
      level = 36,
      conditions = {} -- additional evolution requirements
    },
    
    -- Learn sets
    levelMoves = {
      [1] = {MOVE.SCRATCH, MOVE.GROWL, MOVE.EMBER},
      [7] = {MOVE.SMOKESCREEN},
      [13] = {MOVE.DRAGON_RAGE},
      [36] = {MOVE.FLAMETHROWER}, -- Evolution move
    }
  }
}
```

### Player Save Data Schema

```lua
-- Player Save Data Structure
local PlayerSaveSchema = {
  -- Player identification
  playerId = "string", -- Player wallet address
  gameVersion = "string", -- Save compatibility version
  createdDate = "number", -- Unix timestamp
  lastSaved = "number", -- Unix timestamp
  
  -- Game progression
  progression = {
    waveIndex = "number", -- Current wave (1-based)
    biomeIndex = "number", -- Current biome
    gameMode = "string", -- CLASSIC, DAILY, CHALLENGE
  },
  
  -- Pokemon collection
  party = "table", -- array of up to 6 Pokemon
  pcStorage = {
    boxes = "table", -- 30+ boxes of Pokemon storage
    totalStored = "number" -- count of stored Pokemon
  },
  
  -- Save integrity
  dataIntegrity = {
    checksum = "string", -- SHA256 hash of all save data
    version = "number", -- Schema version for migration
  }
}
```

## Source Tree

```plaintext
pokerogue-ao-migration/
├── ao-processes/                           # AO Process Implementation
│   ├── main.lua                           # Primary AO process entry point
│   ├── handlers/                          # AO Message Handlers
│   │   ├── battle-handler.lua            # Battle resolution logic
│   │   ├── state-handler.lua             # Pokemon state management
│   │   ├── query-handler.lua             # State query responses
│   │   ├── game-management-handler.lua   # Save/load operations
│   │   └── admin-handler.lua             # Process info and discovery
│   │
│   ├── game-logic/                        # Core Game Systems
│   │   ├── pokemon/                       # Pokemon mechanics
│   │   │   ├── stat-calculator.lua       # Exact TypeScript stat formulas
│   │   │   ├── evolution-system.lua      # Evolution processing
│   │   │   └── status-effects.lua        # Status condition logic
│   │   │
│   │   ├── battle/                        # Battle mechanics
│   │   │   ├── damage-calculator.lua     # Damage formulas and type effectiveness
│   │   │   ├── turn-processor.lua        # Turn resolution and command execution
│   │   │   └── battle-conditions.lua     # Weather, terrain, field effects
│   │   │
│   │   ├── rng/                          # Random Number Generation
│   │   │   ├── crypto-rng.lua           # AO crypto module wrapper
│   │   │   └── battle-rng.lua           # Deterministic battle randomness
│   │   │
│   │   └── progression/                   # Game progression
│   │       └── experience-system.lua     # EXP calculation and leveling
│   │
│   ├── data/                              # Embedded Game Data
│   │   ├── species/                       # Pokemon species data
│   │   │   ├── species-database.lua     # All Pokemon species (900+)
│   │   │   ├── evolution-chains.lua     # Evolution relationships
│   │   │   └── species-indexes.lua      # Fast lookup indexes
│   │   │
│   │   ├── moves/                         # Move data and mechanics
│   │   │   ├── move-database.lua        # All moves (800+) with effects
│   │   │   └── move-indexes.lua         # Move lookup indexes
│   │   │
│   │   ├── items/                         # Items and berries
│   │   │   ├── item-database.lua        # All items with effects
│   │   │   └── berry-database.lua       # Berry-specific data
│   │   │
│   │   └── constants/                     # Game constants and enums
│   │       ├── enums.lua               # All game enums (Species, Moves, etc.)
│   │       ├── type-chart.lua          # Type effectiveness matrix
│   │       └── nature-modifiers.lua    # Nature stat multipliers
│   │
│   └── tests/                             # AO Process Tests
│       ├── unit/                         # Unit tests for individual components
│       ├── integration/                  # Handler integration tests
│       └── fixtures/                     # Test data and scenarios
│
├── typescript-reference/                  # Original TypeScript Implementation
│   └── src/                              # Copy of current PokéRogue source
│
├── parity-testing/                        # Cross-Implementation Validation
│   ├── test-harness/                     # Automated parity validation
│   ├── test-cases/                       # Comprehensive test scenarios
│   └── reports/                          # Generated parity reports
│
├── development-tools/                     # Development Infrastructure
│   ├── aos-local-setup/                 # Local AO development environment using aos-local
│   ├── data-migration/                   # TypeScript to Lua data conversion
│   └── debugging/                        # Development debugging tools
│
├── documentation/                         # Project Documentation
│   ├── architecture/                     # Architecture documentation
│   ├── migration-guide/                  # Migration process documentation
│   └── api-reference/                    # API documentation
│
└── scripts/                               # Build and Automation Scripts
    ├── build/                           # Build automation
    ├── testing/                         # Testing automation
    └── deployment/                      # Deployment automation
```

## Infrastructure and Deployment

### Deployment Strategy

**Strategy:** Direct Local-to-Mainnet Deployment
**CI/CD Platform:** GitHub Actions
**Pipeline Configuration:** `.github/workflows/`

### Environment Configuration

#### Local Development Environment

```bash
# Setup local AO development using aos-local
aos-local init --config .ao/local-config.json
aos-local start --port 8080 &
aos deploy --source ao-processes/main.lua --local
```

#### Production Environment (AO Mainnet)

```bash
# Deploy to AO network
ao deploy \
    --source dist/pokerogue-ao-process.lua \
    --config .ao/process-config.json \
    --wallet $AO_WALLET_KEY \
    --network mainnet
```

### Environment Promotion Flow

```
Local Development (AO Emulation) → Automated Testing (GitHub Actions) → Production Deploy (AO Mainnet)
```

### Rollback Strategy

**Primary Method:** AO Process Versioning with Immediate Revert
**Recovery Time Objective:** <5 minutes

```bash
# Rollback to previous version
ao deploy \
    --source "backups/${PREVIOUS_VERSION}/process.lua" \
    --wallet $AO_WALLET_KEY \
    --network mainnet
```

## Error Handling Strategy

### General Approach

**Error Model:** Exception-based error handling using Lua's `error()` and `pcall()` patterns
**Exception Hierarchy:** Structured error types with specific error codes for different failure categories
**Error Propagation:** Errors bubble up to handler level where they're converted to informative AO message responses

### Logging Standards

**Library:** Custom Lua logging system (no external dependencies)
**Format:** Structured JSON logging with correlation IDs
**Levels:** ERROR, WARN, INFO, DEBUG with configurable verbosity

**Required Context Fields:**
- **Correlation ID:** Unique identifier linking related operations across handlers
- **Service Context:** Handler name, operation type, processing stage
- **User Context:** Player ID (wallet address) for player-specific operations

### Error Handling Patterns

#### Business Logic Errors

**Custom Exceptions:** Domain-specific error types for game rule violations
**User-Facing Errors:** Clear error messages for invalid player actions
**Error Codes:** Structured error code system for consistent error handling

```lua
-- Business Logic Error Handling
local GameErrors = {
    INVALID_POKEMON = "INVALID_POKEMON",
    INVALID_MOVE = "INVALID_MOVE", 
    INSUFFICIENT_PP = "INSUFFICIENT_PP",
    POKEMON_FAINTED = "POKEMON_FAINTED",
    BATTLE_NOT_FOUND = "BATTLE_NOT_FOUND"
}

-- User-friendly error responses
function formatUserError(error)
    local userMessages = {
        [GameErrors.INVALID_POKEMON] = "The selected Pokemon is not available.",
        [GameErrors.INVALID_MOVE] = "That move cannot be used right now.", 
        [GameErrors.INSUFFICIENT_PP] = "The move is out of PP."
    }
    
    return {
        success = false,
        error = {
            code = error.context.errorCode,
            message = userMessages[error.context.errorCode] or error.message
        }
    }
end
```

## Coding Standards

**MANDATORY BEHAVIORAL PARITY RULES:**

- **Never use Lua's math.random() - ALWAYS use AO crypto module:** Battle outcomes must be deterministic and reproducible using battle seeds
- **All stat calculations must match TypeScript Math.floor/Math.ceil exactly:** Use precise mathematical functions to ensure identical Pokemon stats
- **Nature multipliers must be exactly 0.9, 1.0, or 1.1 - never approximate:** Preserve exact stat calculation precision
- **All AO message responses must include success boolean:** Enable proper error handling for agents and UI
- **Never hardcode Pokemon/Move/Item data - always reference database tables:** Maintain single source of truth for game data
- **Battle RNG counter must increment for every random call:** Ensure deterministic battle replay capability

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| **Functions** | camelCase | `calculatePokemonStat()` |
| **Variables** | camelCase | `battleResult`, `pokemonData` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_POKEMON_LEVEL` |
| **Tables/Objects** | PascalCase | `GameState`, `BattleHandler` |
| **Files** | kebab-case | `battle-handler.lua` |

## Test Strategy and Standards

### Testing Philosophy

**Approach:** **Parity-First Test-Driven Development** - Every game mechanic must be validated against TypeScript reference before implementation acceptance
**Coverage Goals:** 100% behavioral parity validation, 95%+ code coverage for critical game logic
**Test Pyramid:** Heavy integration testing for game mechanics, focused unit tests for mathematical calculations

### Test Types and Organization

#### Unit Tests

**Framework:** Custom Lua test framework with TypeScript comparison utilities
**File Convention:** `*.test.lua` files co-located with implementation modules
**Location:** `ao-processes/tests/unit/`
**Coverage Requirement:** 100% for stat calculations, 95% for core game logic

**AI Agent Requirements:**
- Generate tests for all public functions automatically
- Cover edge cases and error conditions systematically  
- Follow AAA pattern (Arrange, Act, Assert) consistently
- Mock all external dependencies including RNG and database access

#### Integration Tests

**Scope:** Complete handler workflows including message processing, state updates, and response generation
**Location:** `ao-processes/tests/integration/`
**Test Infrastructure:**
  - **Battle State Management:** In-memory test battle creation and cleanup
  - **Message Simulation:** Mock AO message objects for handler testing  
  - **State Validation:** Automated state consistency checking

#### End-to-End Tests

**Framework:** Complete game scenario testing with full AO message simulation using aos-local
**Scope:** Multi-turn battles, Pokemon evolution, save/load cycles, agent interaction
**Environment:** Local AO development environment with aos-local process simulation

### Continuous Testing

**CI Integration:** GitHub Actions workflow executing all test suites on every commit
**Performance Tests:** Automated benchmarking comparing Lua vs TypeScript execution times

## Security

### Input Validation

**Validation Library:** Custom Lua validation system (no external dependencies)
**Validation Location:** All validation performed at handler entry points before processing
**Required Rules:**
- All external inputs MUST be validated against expected schemas
- Validation at AO message boundary before any game logic processing  
- Whitelist approach preferred over blacklist for allowed values

### Authentication & Authorization

**Auth Method:** AO message sender validation using wallet addresses
**Session Management:** Stateless - each message independently authenticated
**Required Patterns:**
- Only message sender can modify their own game data
- Battle participation validated through active battle roster

### Game State Integrity

**State Consistency:** Atomic message processing prevents partial state corruption
**Anti-Cheating:** Input validation prevents impossible game states

## Next Steps

### Phase 1: AO-Native Backend (Current Focus)
- Complete migration of all game mechanics to AO processes
- Achieve 100% functional parity with TypeScript implementation
- Comprehensive testing and validation infrastructure

### Phase 2: AOConnect UI Integration (Months 7-12)
- Integrate existing Phaser UI with AO-native backend
- Enable current players to access AO benefits through familiar interface
- Maintain 95% player retention through transition

### Phase 3: Autonomous Agent Integration (Months 13-18)  
- Deploy autonomous agents as first-class players
- Create PvPvE innovation with human-agent mixed battles
- Establish framework for agent ecosystem expansion

---

**This comprehensive architecture document provides the complete technical blueprint for transforming PokéRogue into the world's first fully UI-agnostic roguelike where AI agents battle as first-class citizens, while maintaining exact behavioral parity with the existing TypeScript implementation.**