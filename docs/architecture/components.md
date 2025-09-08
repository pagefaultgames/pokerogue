# Components

## Overview

In the HyperBEAM + Rust WASM architecture, "components" refer to the individual Rust WASM devices that implement specific Pokemon game mechanics. Each device is a stateless, type-safe computational unit that processes messages and returns results.

## Core WASM Devices

### Pokemon Stats Device (~pokemon-stats@1.0)

**Responsibility:** Pokemon stat calculation with exact formula parity to TypeScript implementation

**Key Interfaces:**
- `calculate_stats(pokemon_data, species_tx_id)` - Complete stat calculation from base stats through final stats
- `apply_nature_modifiers(base_stats, nature)` - Nature-based stat modifications (1.1x/0.9x)
- `calculate_iv_ev_contribution(level, ivs, evs)` - Individual/Effort Value contributions
- `validate_stat_ranges(calculated_stats)` - Stat boundary validation

**Dependencies:**
- External Arweave species data (base stats, growth rates)
- Nature modifier lookup tables
- Stat calculation formulas (exact TypeScript parity)
- Level-based calculation curves

**Technology Stack:** Rust + WASM, serde for JSON, HyperBEAM Arweave integration

### Battle Engine Device (~battle-engine@1.0)

**Responsibility:** Complete battle turn processing including damage calculation, type effectiveness, and move effects

**Key Interfaces:**
- `execute_move(attacker, defender, move_data, battle_conditions)` - Main battle logic entry point
- `calculate_damage(attacker_stats, defender_stats, move)` - Precise Pokemon damage formula
- `apply_type_effectiveness(move_type, defender_types)` - Type multiplier calculation
- `process_status_effects(pokemon, active_effects)` - Status condition resolution
- `determine_move_priority(move_data, pokemon_speed)` - Turn order calculation

**Dependencies:**
- Pokemon stat data from Stats Device
- External Arweave move definitions (power, accuracy, effects)
- Type effectiveness chart from external storage
- Battle RNG system for critical hits and accuracy
- Status effect duration tracking

**Technology Stack:** Rust + WASM, battle formula implementations, deterministic RNG

### Evolution System Device (~evolution-system@1.0)

**Responsibility:** Pokemon evolution trigger detection and species transformation logic

**Key Interfaces:**
- `check_evolution_triggers(pokemon, battle_context)` - Evolution condition evaluation
- `apply_evolution(pokemon_id, target_species)` - Species transformation processing
- `calculate_evolved_stats(old_stats, new_base_stats, level)` - Stat recalculation post-evolution
- `validate_evolution_conditions(pokemon, evolution_data)` - Evolution requirement checking

**Dependencies:**
- Pokemon instance data (level, friendship, held items)
- External Arweave evolution chain data
- Battle context for trade/battle-triggered evolutions
- Time-of-day data for time-dependent evolutions

**Technology Stack:** Rust + WASM, conditional logic trees, external data integration

### Arweave Data Access Device (~arweave-data@1.0)

**Responsibility:** External data fetching, caching, and formatting from Arweave storage

**Key Interfaces:**
- `get_species_data(species_tx_id)` - Pokemon species data retrieval with caching
- `get_move_data(move_tx_id)` - Move definition fetching with performance optimization
- `get_item_data(item_tx_id)` - Item effect data access
- `batch_fetch_data(transaction_ids)` - Multi-item data retrieval optimization
- `invalidate_cache(data_type)` - Cache management for data updates

**Dependencies:**
- HyperBEAM Arweave gateway integration
- Local caching system for performance
- Transaction ID resolution
- Data validation and parsing

**Technology Stack:** Rust + WASM, HTTP client integration, memory-based caching

### Query Handler Device (~query-handler@1.0)

**Responsibility:** Agent-friendly data formatting and aggregation for autonomous players

**Key Interfaces:**
- `format_pokemon_data(pokemon_ids, detail_level)` - Pokemon data formatting for agents
- `get_battle_state(battle_id, perspective)` - Battle state from specific player perspective
- `list_available_actions(pokemon_id, battle_context)` - Valid action enumeration
- `aggregate_game_statistics(player_id, stat_types)` - Player progression summaries
- `format_decision_data(battle_state)` - Agent decision-making data structures

**Dependencies:**
- ECS world state from HyperBEAM process
- External reference data for enrichment
- Battle context for action validation
- Agent-optimized data structures

**Technology Stack:** Rust + WASM, JSON formatting, data aggregation algorithms

## Device Integration Patterns

### Message Protocol

All devices follow a standard message protocol:

```rust
#[derive(Serialize, Deserialize)]
pub struct DeviceMessage {
    pub action: String,           // "calculate_stats", "execute_move", etc.
    pub entity_id: String,        // Pokemon/Battle/Player ID
    pub data: serde_json::Value,  // Action-specific data
    pub context: MessageContext,  // Battle state, external refs
}

#[derive(Serialize, Deserialize)]
pub struct DeviceResponse {
    pub success: bool,
    pub entity_id: String,
    pub data: serde_json::Value,
    pub state_updates: Vec<StateUpdate>,
    pub error: Option<String>,
}
```

### External Data Integration

Devices access external Arweave data through standardized patterns:

```rust
// Species data access pattern
let species_data = arweave_client
    .get_transaction_data(&pokemon.species_tx_id)
    .await?;
let species: PokemonSpecies = serde_json::from_str(&species_data)?;

// Move data access with caching
let move_data = device_cache
    .get_or_fetch("moves", &move_tx_id, || {
        arweave_client.get_transaction_data(&move_tx_id)
    })
    .await?;
```

### State Update Propagation

Devices return state updates that are applied by the HyperBEAM process:

```rust
// Device calculates new stats
let new_stats = calculate_final_stats(&species, &pokemon);

// Return state update for process to apply
DeviceResponse {
    success: true,
    entity_id: pokemon.id,
    state_updates: vec![
        StateUpdate {
            entity_id: pokemon.id,
            component_type: "Stats".to_string(),
            new_value: serde_json::to_value(new_stats)?,
        }
    ],
    data: serde_json::to_value(calculation_result)?,
    error: None,
}
```

## Device Development Guidelines

### Performance Optimization
- Implement aggressive caching for frequently accessed external data
- Use batch operations for multiple data fetches
- Optimize WASM binary size through dead code elimination
- Profile device execution time to maintain real-time battle performance

### Type Safety
- Leverage Rust's type system to prevent calculation errors
- Use strong typing for Pokemon stats, move effects, and game states
- Implement comprehensive error handling with specific error types
- Validate all external data inputs before processing

### Testing Strategy
- Unit tests for all device functions in Rust
- Integration tests for cross-device communication
- WASM execution tests for compiled binary validation
- Parity tests comparing outputs with TypeScript reference implementation

### Deterministic Behavior
- Use seeded RNG systems for reproducible battle outcomes
- Ensure identical calculation results across device calls
- Maintain consistency with original TypeScript implementation
- Document all random number generation points for testing

This component architecture achieves **type-safe Pokemon mechanics** while maintaining **95% bundle size reduction** through external data references and **modular device development** for easy testing and maintenance.