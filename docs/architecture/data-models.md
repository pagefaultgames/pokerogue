# Data Models

## Distributed Actor State Models

In the AO Actor Model architecture, data is distributed across specialized actors with cryptographically verified state management. Each actor maintains specific aspects of game state with HashPath-linked integrity verification.

## Pokemon Entity Model (StateKeeper Actor)

**Purpose:** Represents individual Pokemon with cryptographically verifiable stats and progression

**Key Attributes:**
- `entityId`: string - Cryptographic entity identifier (AO message hash-derived)
- `speciesArweaveId`: string - Arweave transaction ID for species data reference
- `level`: number - Current Pokemon level (1-100)
- `exp`: number - Total experience points
- `hp`: number - Current hit points
- `maxHp`: number - Maximum hit points at current level
- `stats`: table - Current battle stats with cryptographic verification
- `ivs`: table - Individual values for deterministic stat calculation
- `nature`: string - Nature affecting stat growth
- `movesetRefs`: table - Array of Arweave move data references
- `statusEffect`: string|nil - Current status condition
- `abilitiesRef`: string - Arweave reference for abilities data
- `heldItemRef`: string|nil - Arweave reference for held item data
- `stateHash`: string - Cryptographic hash of current Pokemon state

**Cryptographic Integrity:**
- `integrityHash`: string - SHA256 hash of all Pokemon data
- `hashPathLink`: string - Link to previous state in HashPath chain
- `stateProof`: table - Cryptographic proof of state transitions
- `arweaveBackup`: string - Arweave transaction ID for permanent backup

**Relationships:**
- Owned by Player via cryptographic signature verification
- References external Arweave species/move/item data
- Linked to Battle entities via message-based associations
- Connected to progression tracking through StateKeeper actor

## Battle Session Model (BattleResolver Actor)

**Purpose:** Manages cryptographically verifiable battle state with trustless outcome verification

**Key Attributes:**
- `battleId`: string - Unique battle session identifier (derived from initial message hash)
- `playerActorIds`: table - Array of participating player actor identities
- `battleType`: string - Battle classification (WILD, TRAINER, PVP, AGENT)
- `turn`: number - Current battle turn counter
- `battleSeed`: string - Cryptographic seed for deterministic randomness
- `participantStates`: table - Cryptographically verified participant Pokemon states
- `turnQueue`: table - Ordered turn execution queue with message verification
- `battlePhase`: string - Current battle phase (SELECTION, EXECUTION, RESOLUTION)
- `fieldConditions`: table - Active field effects with duration tracking
- `computationGraph`: table - HashPath computation verification chain

**Cryptographic Verification:**
- `battleHash`: string - Cryptographic hash of complete battle state
- `turnProofs`: table - Array of cryptographic proofs for each turn
- `outcomeVerification`: table - Mathematical proof of battle outcomes
- `hashPathChain`: table - Complete message chain for battle verification

**Message-Based State Management:**
- State updates propagated through verified actor messages
- All battle actions cryptographically signed and verified
- Outcome verification available for trustless agent validation
- Permanent battle records stored on Arweave with integrity proofs

## Player State Model (StateKeeper Actor)

**Purpose:** Comprehensive player progression with permanent cryptographic state management

**Key Attributes:**
- `playerId`: string - Player AO actor identity (public key derived)
- `gameVersion`: string - Save data schema version
- `progression`: table - Game progression with milestone verification
- `partyRefs`: table - References to Pokemon entities in party
- `pcStorageRefs`: table - References to PC-stored Pokemon entities
- `inventoryState`: table - Items and resources with integrity verification
- `pokedexState`: table - Species discovery tracking
- `gameStats`: table - Battle statistics and achievements
- `preferences`: table - Game settings and configuration

**Permanent State Management:**
- `stateHash`: string - Cryptographic hash of complete player state
- `arweaveBackups`: table - Array of Arweave backup transaction IDs
- `hashPathHistory`: table - Complete state transition history
- `integrityProofs`: table - Cryptographic proofs for state validity
- `lastVerifiedState`: string - Hash of last confirmed valid state

**Cross-Actor Synchronization:**
- State changes broadcast to relevant actors via verified messages
- Battle participation coordinated through BattleResolver actor
- Pokemon modifications synchronized with entity state management
- Query responses verified against cryptographic state proofs

## Agent Interface Models (QueryHandler Actor)

**Purpose:** Agent-optimized data structures for trustless autonomous gameplay

### Agent Battle View Model

**Key Attributes:**
- `battleId`: string - Battle session identifier
- `agentPerspective`: table - Battle state from agent's viewpoint
- `availableActions`: table - Cryptographically verified available moves/switches
- `stateVerification`: table - Cryptographic proofs for trustless verification
- `decisionTimeRemaining`: number - Time limit for agent decision
- `computationGraph`: table - HashPath verification data for outcome prediction

### Agent Pokemon Data Model

**Key Attributes:**
- `entityId`: string - Pokemon entity identifier
- `publicStats`: table - Visible stats and information
- `moveOptions`: table - Available moves with power/accuracy/effects
- `statusInfo`: table - Current status effects and durations
- `verificationProof`: table - Cryptographic proof of data authenticity
- `predictiveData`: table - Calculated damage ranges and effectiveness

### Agent Network Discovery Model

**Key Attributes:**
- `networkActors`: table - Available actors and their capabilities
- `messageSchemas`: table - Required message formats for actor communication
- `verificationStandards`: table - Cryptographic requirements for network participation
- `capabilityProofs`: table - Demonstrated actor capabilities with verification

## External Data Reference Models

### Arweave Species Data Model

**Purpose:** Permanent, immutable Pokemon species data with cryptographic integrity

**Key Attributes:**
- `arweaveId`: string - Arweave transaction ID
- `speciesId`: string - Pokemon species identifier
- `baseStats`: table - Base stat array [HP, ATK, DEF, SPATK, SPDEF, SPEED]
- `types`: table - Pokemon type array
- `abilities`: table - Available abilities for species
- `learnset`: table - Moves learnable by level/TM/breeding
- `evolutionData`: table - Evolution requirements and targets
- `dataHash`: string - Cryptographic hash for integrity verification

### Arweave Move Data Model

**Purpose:** Permanent move definition data with effect verification

**Key Attributes:**
- `arweaveId`: string - Arweave transaction ID
- `moveId`: string - Move identifier
- `power`: number - Base power value
- `accuracy`: number - Move accuracy percentage
- `pp`: number - Power points available
- `type`: string - Move type
- `category`: string - Physical, Special, or Status
- `effects`: table - Move effects and calculations
- `dataHash`: string - Cryptographic integrity hash

## Data Model Integration Patterns

### Cryptographic State Verification

All data models include cryptographic integrity verification:

```lua
-- Example Pokemon state verification
local pokemon_state = {
    entityId = "pokemon_123",
    level = 50,
    stats = {78, 84, 78, 109, 85, 100},
    stateHash = ao.hash(pokemon_data),
    integrityProof = ao.sign(state_hash),
    hashPathLink = previous_state_hash
}

-- Verification process
local is_valid = ao.verify({
    data = pokemon_state,
    hash = pokemon_state.stateHash,
    proof = pokemon_state.integrityProof,
    chain = pokemon_state.hashPathLink
})
```

### Cross-Actor State Synchronization

Data consistency maintained through message-based synchronization:

```lua
-- State update propagation
local state_update = {
    entity_type = "pokemon",
    entity_id = "pokemon_123",
    changes = updated_stats,
    actor_signature = ao.sign(update_data),
    hash_path_link = previous_message_hash
}

-- Broadcast to relevant actors
ao.send({Target = "StateKeeper", Data = state_update})
ao.send({Target = "BattleResolver", Data = state_update})
ao.send({Target = "QueryHandler", Data = state_update})
```

### Permanent Data Backup

Critical state changes backed up to Arweave:

```lua
-- Arweave backup process
local backup_data = {
    player_id = player.id,
    state_snapshot = complete_player_state,
    backup_timestamp = ao.timestamp(),
    verification_proof = ao.sign(state_data)
}

local arweave_id = ao.send({
    Target = "arweave",
    Action = "Store-Data",
    Data = json.encode(backup_data)
})
```

These data models achieve **cryptographic verifiability** through HashPath message chains, **unlimited scalability** through distributed actor state management, and **permanent data integrity** through Arweave backup integration.