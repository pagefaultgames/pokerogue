# Components

## Overview

In the single-process ECS architecture with NIF systems, "components" refer to both Bevy ECS components (data structures) and NIF system functions that operate on the ECS World. The architecture uses Bevy ECS for data management while leveraging Rust NIFs for high-performance system processing.

## Bevy ECS Components

### Core Pokemon Components

#### PokemonStats Component
```rust
#[derive(Component, Serialize, Deserialize, Clone)]
pub struct PokemonStats {
    pub hp: u32,
    pub max_hp: u32,
    pub attack: u32,
    pub defense: u32,
    pub special_attack: u32,
    pub special_defense: u32,
    pub speed: u32,
}
```

#### StatusCondition Component
```rust
#[derive(Component, Serialize, Deserialize, Clone)]
pub struct StatusCondition {
    pub condition: Option<StatusType>,
    pub turns_remaining: u32,
    pub severity: u8,
}
```

#### PokemonMoves Component
```rust
#[derive(Component, Serialize, Deserialize, Clone)]
pub struct PokemonMoves {
    pub moves: Vec<LearnedMove>,
    pub pp: HashMap<MoveId, u32>,
}
```

### Game State Components

#### BattleState Component
```rust
#[derive(Component, Serialize, Deserialize, Clone)]
pub struct BattleState {
    pub battle_id: String,
    pub battle_type: BattleType,
    pub turn: u32,
    pub battle_seed: u64,
    pub active_pokemon: (Entity, Entity), // (player, enemy)
    pub field_conditions: Vec<FieldEffect>,
}
```

#### PlayerSession Component  
```rust
#[derive(Component, Serialize, Deserialize, Clone)]
pub struct PlayerSession {
    pub player_id: String,
    pub session_id: String,
    pub created_at: u64,
    pub progression: GameProgression,
}
```

#### PokemonParty Component
```rust
#[derive(Component, Serialize, Deserialize, Clone)]  
pub struct PokemonParty {
    pub pokemon: Vec<Entity>,
    pub active_index: usize,
}
```

## Bevy ECS Resources (Global Game Data)

### SpeciesDatabase Resource
```rust
#[derive(Resource, Serialize, Deserialize)]
pub struct SpeciesDatabase {
    pub species: HashMap<SpeciesId, PokemonSpecies>,
    pub evolution_chains: HashMap<SpeciesId, EvolutionData>,
}
```

### MovesDatabase Resource
```rust
#[derive(Resource, Serialize, Deserialize)]
pub struct MovesDatabase {
    pub moves: HashMap<MoveId, MoveData>,
    pub type_effectiveness: TypeEffectivenessChart,
}
```

### GameConfig Resource
```rust
#[derive(Resource, Serialize, Deserialize)]
pub struct GameConfig {
    pub max_pokemon_level: u32,
    pub experience_formula: ExperienceType,
    pub battle_mechanics: BattleMechanicsConfig,
}
```

## NIF System Functions

### Battle System NIF

**Responsibility:** Complete battle turn processing with Bevy ECS

**Key NIF Functions:**
```rust
#[rustler::nif]
fn battle_system_process_turn(world: World, battle_id: String, command: BattleCommand) -> World

#[rustler::nif] 
fn battle_system_calculate_damage(world: World, attacker: Entity, defender: Entity, move_id: MoveId) -> DamageResult

#[rustler::nif]
fn battle_system_apply_status_effect(world: World, pokemon: Entity, status: StatusType) -> World
```

**Bevy ECS Integration:**
- Queries Pokemon components (Stats, Status, Moves)
- Updates components based on battle outcomes
- Accesses Resources for move data and type effectiveness
- Returns modified World with all changes applied

### Evolution System NIF

**Responsibility:** Pokemon evolution processing and stat recalculation

**Key NIF Functions:**
```rust
#[rustler::nif]
fn evolution_system_check_evolution(world: World, pokemon: Entity) -> World

#[rustler::nif]
fn evolution_system_evolve_pokemon(world: World, pokemon: Entity, evolution_id: SpeciesId) -> World

#[rustler::nif] 
fn evolution_system_recalculate_stats(world: World, pokemon: Entity) -> World
```

**Bevy ECS Integration:**
- Queries PokemonStats, PokemonSpecies components  
- Accesses SpeciesDatabase resource for evolution chains
- Updates components with new species data and stats
- Handles level-up stat recalculation

### Query System NIF

**Responsibility:** Agent-friendly queries and state access for autonomous agents

**Key NIF Functions:**
```rust  
#[rustler::nif]
fn query_system_get_battle_state(world: World, battle_id: String) -> BattleStateResult

#[rustler::nif]
fn query_system_get_pokemon_data(world: World, pokemon: Entity) -> PokemonDataResult

#[rustler::nif] 
fn query_system_get_available_actions(world: World, player_id: String) -> AvailableActionsResult
```

**Bevy ECS Integration:**
- Performs complex queries across multiple component types
- Aggregates data from Resources and Components  
- Returns structured data optimized for agent decision-making
- No world modification, read-only access patterns

## NIF System Dependencies

### Core Dependencies
```toml
[dependencies]
bevy_ecs = "0.12"
rustler = "0.30"  
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
```

### ECS-Specific Dependencies
```toml
# For deterministic RNG
fastrand = "2.0"
# For Pokemon data types  
uuid = { version = "1.0", features = ["serde"] }
# For efficient collections
indexmap = { version = "2.0", features = ["serde"] }
```

**Technology Stack:** Rust with Bevy ECS, Rustler NIF, comprehensive serialization support

## NIF-Lua Integration Patterns

### Custom GameState Serialization Pattern

```lua
-- Lua: Load GameState and call NIF system
function Handlers.battle_turn(msg)
    -- Serialize custom GameState from Lua table
    local game_state_json = json.encode(GameState)
    
    -- Call NIF system with serialized GameState
    local updated_state_json = battle_system.process_turn(
        game_state_json, 
        msg.battle_id, 
        msg.command
    )
    
    -- Update Lua GameState
    GameState = json.decode(updated_state_json)
    
    return { success = true, battle_result = GameState.battles[msg.battle_id].result }
end
```

### Custom GameState Structure

```rust
// Custom serializable game state
#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub entities: HashMap<String, EntityData>,
    pub pokemon_stats: HashMap<String, PokemonStats>,
    pub battle_states: HashMap<String, BattleState>,
    pub player_sessions: HashMap<String, PlayerSession>,
    pub pokemon_parties: HashMap<String, PokemonParty>,
    // Global game data
    pub species_database: SpeciesDatabase,
    pub moves_database: MovesDatabase,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct EntityData {
    pub entity_id: String,
    pub entity_type: EntityType,
    pub components: Vec<ComponentType>,
}
```

### NIF Implementation with Internal Bevy ECS

```rust
use bevy_ecs::prelude::*;
use rustler::{NifResult, Encoder, Decoder};

#[rustler::nif]
fn battle_system_process_turn(
    game_state_json: String, 
    battle_id: String, 
    command: BattleCommand
) -> NifResult<String> {
    // Deserialize custom GameState
    let game_state: GameState = serde_json::from_str(&game_state_json)?;
    
    // Create temporary Bevy World from GameState
    let mut world = World::new();
    populate_world_from_game_state(&mut world, &game_state);
    
    // Add Resources to World
    world.insert_resource(game_state.species_database.clone());
    world.insert_resource(game_state.moves_database.clone());
    
    // Perform ECS queries and updates using full Bevy ECS
    let mut pokemon_query = world.query::<(&mut PokemonStats, &StatusCondition)>();
    let mut battle_query = world.query::<&mut BattleState>();
    
    for mut battle_state in battle_query.iter_mut(&mut world) {
        if battle_state.battle_id == battle_id {
            // Process battle using full ECS capabilities
            process_battle_turn(&mut world, &mut battle_state, &command);
        }
    }
    
    // Extract results back to custom GameState
    let updated_game_state = extract_world_to_game_state(&world, game_state);
    
    // Serialize and return updated GameState
    let result = serde_json::to_string(&updated_game_state)?;
    Ok(result)
}

// Helper functions for GameState <-> Bevy World conversion
fn populate_world_from_game_state(world: &mut World, game_state: &GameState) {
    // Convert GameState entities/components to Bevy entities
    for (entity_id, entity_data) in &game_state.entities {
        let entity = world.spawn_empty().id();
        
        // Add components based on entity_data
        if let Some(stats) = game_state.pokemon_stats.get(entity_id) {
            world.entity_mut(entity).insert(stats.clone());
        }
        // ... add other components
    }
}

fn extract_world_to_game_state(world: &World, mut game_state: GameState) -> GameState {
    // Extract Bevy World changes back to GameState
    let mut pokemon_query = world.query::<&PokemonStats>();
    
    for stats in pokemon_query.iter(world) {
        // Update GameState with modified components
        // ... extract logic
    }
    
    game_state
}
```

### Component Bundle Patterns

```rust
// Define reusable component bundles for Pokemon entities
#[derive(Bundle)]
pub struct PokemonBundle {
    pub stats: PokemonStats,
    pub status: StatusCondition,
    pub moves: PokemonMoves,
    pub species: PokemonSpecies,
}

#[derive(Bundle)]  
pub struct BattleParticipantBundle {
    pub pokemon: PokemonBundle,
    pub battle_state: BattleState,
    pub party: PokemonParty,
}
```

### ECS Query Patterns in NIFs

```rust
// Complex queries across multiple components
fn process_battle_turn(world: &mut World, battle_id: &str) {
    let mut battle_query = world.query::<(&mut BattleState, &PokemonParty)>();
    let mut pokemon_query = world.query::<(&mut PokemonStats, &PokemonMoves, &StatusCondition)>();
    
    for (mut battle, party) in battle_query.iter_mut(world) {
        if battle.battle_id == battle_id {
            let active_pokemon = party.pokemon[party.active_index];
            
            if let Ok((mut stats, moves, status)) = pokemon_query.get_mut(world, active_pokemon) {
                // Process battle logic with full ECS access
                apply_battle_effects(&mut stats, &moves, &status);
            }
        }
    }
}
```

## Development Guidelines

### Bevy ECS Best Practices
- Use Component Bundles for common entity patterns
- Leverage Resources for global game data (species, moves, items)
- Implement proper serialization for all Components and Resources
- Use Bevy's change detection for efficient state updates

### NIF System Design
- Keep NIFs focused on specific system functionality
- Always return modified World state from system NIFs
- Use proper error handling with rustler::NifResult
- Serialize complex data structures through serde_json

### World State Management
- Maintain consistent World serialization format
- Use deterministic entity IDs for cross-NIF entity references
- Implement proper versioning for save/load compatibility
- Validate World state integrity on NIF boundaries

### Testing Strategy
- Unit tests for individual NIF systems using test worlds
- Integration tests for Lua-NIF boundary serialization
- Parity tests comparing outputs with TypeScript reference
- Performance benchmarks for World serialization overhead

This Bevy ECS + NIF architecture achieves **native performance** through complete Rust systems, **clean data organization** through ECS patterns, **seamless serialization** through built-in serde support, and **agent-friendly interfaces** through rich query capabilities.