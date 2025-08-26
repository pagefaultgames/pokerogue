# Components

## Battle Resolution Handler

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

## Pokemon State Manager

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

## Game State Coordinator

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

## Query Response Handler

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

## Process Administration Handler

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
