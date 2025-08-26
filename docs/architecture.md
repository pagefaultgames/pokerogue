# PokéRogue AO Migration - Complete Architecture Document

## Introduction

This document outlines the overall project architecture for **PokéRogue AO Migration**, including backend systems, shared services, and non-UI specific concerns. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development, ensuring consistency and adherence to chosen patterns and technologies.

**Relationship to Frontend Architecture:**
Phase 2 of this project will include a significant user interface through AOConnect integration with the existing Phaser.js frontend. A separate Frontend Architecture Document will detail the frontend-specific design and MUST be used in conjunction with this document. Core technology stack choices documented herein (see "Tech Stack") are definitive for the entire project, including any frontend components.

### Starter Template or Existing Project

**Finding: Existing Codebase Migration Project**

This project is **not** using a starter template but rather migrating an **existing sophisticated codebase**:

- **Source:** Current PokéRogue v1.10.4 with ~200+ TypeScript files implementing complex roguelike mechanics
- **Architecture:** Phaser.js game engine with extensive battle systems, creature management, and progression mechanics  
- **Constraints:** Must achieve **100% functional parity** with existing TypeScript implementation
- **Migration Approach:** TypeScript-to-Lua conversion for all game logic while preserving exact behavior

**Existing Project Analysis:**
- **Technology Stack:** TypeScript, Phaser.js, Vite build system, Vitest testing
- **Game Complexity:** Battle system, status effects, type effectiveness, move mechanics, progression systems
- **Data Models:** Pokemon species/forms, moves, abilities, trainers, biomes, items, save systems
- **Architecture Patterns:** Phase-based game loop, event-driven systems, state management
- **Limitation:** No manual setup required - existing codebase provides complete reference implementation

This significantly impacts our architectural decisions as we must ensure exact behavioral parity rather than greenfield design flexibility.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-26 | 1.0.0 | Initial architecture document | Architect Agent |

## High Level Architecture

### Technical Summary

The PokéRogue AO migration employs a **monolithic single-process architecture** running entirely on AO handlers, transforming the existing object-oriented TypeScript codebase into a functional message-driven Lua system. The architecture prioritizes **100% behavioral parity** with the current implementation while enabling autonomous agent participation through AO's message-passing protocol. Core architectural patterns include handler-based game state management, deterministic battle resolution through seeded RNG systems, and comprehensive state persistence via AO process memory, directly supporting the PRD's goal of creating the world's first fully UI-agnostic roguelike where AI agents battle as first-class citizens.

### High Level Overview

**Architectural Style:** **AO-Native Monolithic Handler System**
- Single comprehensive AO process containing all game logic as specialized Lua handlers
- Message-driven architecture replacing object-oriented event systems
- Functional programming patterns replacing class inheritance hierarchies

**Repository Structure:** **Monorepo** (from PRD Technical Assumptions)
- `/ao-processes/` - Lua handlers and AO process logic  
- `/typescript-reference/` - Current implementation for parity testing
- `/shared-schemas/` - JSON message formats and type definitions

**Service Architecture:** **Single Process with Handler Specialization**
- All game mechanics consolidated in one AO process for reference integrity
- Specialized handlers for: battles, state queries, progression, inventory management
- Future multi-process expansion supported through message protocol design

**Primary Data Flow:** **Player → AO Messages → Handler → State Update → Response**
1. Players/agents send battle commands via AO messages
2. Specialized handlers process game logic (battle resolution, state changes)
3. Process state updates atomically
4. Responses sent back with battle results and updated state

**Key Architectural Decisions:**
- **Functional Over OOP:** Lua tables with behavior functions replace TypeScript classes
- **Message-Driven:** AO messages replace Phaser.js event system
- **Atomic State:** AO process memory ensures consistent game state
- **Deterministic Logic:** Battle seed system preserved for exact behavior matching

### High Level Project Diagram

```mermaid
graph TB
    subgraph "Player Interfaces"
        P1[Human Players<br/>Phase 2: AOConnect UI]
        P2[AI Agents<br/>Phase 3: Direct AO Messages]
    end
    
    subgraph "AO Process: PokéRogue Game Engine"
        H1[Battle Handler<br/>Turn resolution, damage calc]
        H2[State Handler<br/>Save/load, progression]
        H3[Query Handler<br/>Game state requests]
        H4[Admin Handler<br/>Process info, discovery]
        
        STATE[(Game State<br/>Players, Pokemon, Progress)]
    end
    
    subgraph "External Systems"
        AR[Arweave<br/>Permanent Storage]
        TEST[Test Suite<br/>Parity Validation]
    end
    
    P1 --> H1
    P1 --> H2
    P1 --> H3
    P2 --> H1
    P2 --> H2
    P2 --> H3
    
    H1 --> STATE
    H2 --> STATE
    H3 --> STATE
    H4 --> STATE
    
    STATE --> AR
    TEST --> H1
    TEST --> H2
```

### Architectural and Design Patterns

- **AO Message-Handler Pattern:** All game interactions through `Handlers.add()` with specialized message types - _Rationale:_ Replaces OOP method calls with functional message processing, enabling agent participation

- **Functional State Management:** Game state as Lua tables with pure transformation functions - _Rationale:_ Eliminates class inheritance complexity while maintaining state consistency  

- **Deterministic Battle Resolution:** Seeded RNG system using battle-specific seeds for reproducible outcomes - _Rationale:_ Ensures exact parity with TypeScript implementation and enables battle replay/verification

- **Handler Specialization Pattern:** Single process with domain-specific handlers (Battle, State, Query) - _Rationale:_ Maintains reference integrity while organizing complex game logic

- **Atomic State Transactions:** All game state changes processed as complete units - _Rationale:_ Prevents partial state corruption and ensures consistent game progression

- **Message Protocol Abstraction:** JSON message schemas defining player/agent communication - _Rationale:_ Enables both human (Phase 2) and agent (Phase 3) interaction without architecture changes

## Tech Stack

### Cloud Infrastructure
- **Provider:** Arweave Network (AO Protocol)
- **Key Services:** AO Process hosting, Arweave permanent storage, AOConnect for Phase 2 integration
- **Deployment Regions:** Global (decentralized AO network)

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Backend Language** | Lua | 5.3 | AO process runtime | Required by AO protocol, mature ecosystem |
| **AO Framework** | Native AO Handlers | Latest | Message processing | Direct AO integration, optimal performance |
| **RNG System** | AO Crypto Module | Latest | Deterministic randomness | Cryptographically secure, seedable for parity |
| **Message Protocol** | JSON | - | Player/agent communication | AOConnect compatible, human readable |
| **Message Validation** | Custom Lua schemas | - | Protocol validation | Type safety and error handling |
| **State Management** | In-process Lua tables | - | Game state storage | Fast access, clear migration path |
| **Data Storage** | Embedded Lua structures | - | Pokemon/move/item data | Self-contained, no external dependencies |
| **Development Tools** | AO local emulation + parity tests | - | Development environment | Comprehensive validation approach |
| **Testing Framework** | Custom Lua test harness | - | Automated validation | TypeScript comparison capability |
| **Process Documentation** | AO Info handler | - | Agent discovery | Compliance with AO documentation protocol |

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
│   ├── ao-local-setup/                  # Local AO development environment
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
# Setup local AO emulation
ao-emulator init --config .ao/local-config.json
ao-emulator start --port 8080 &
ao deploy --source ao-processes/main.lua --local
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

**Framework:** Complete game scenario testing with full AO message simulation
**Scope:** Multi-turn battles, Pokemon evolution, save/load cycles, agent interaction
**Environment:** Local AO emulation with full process simulation

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