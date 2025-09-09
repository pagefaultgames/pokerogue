# High Level Architecture

## Technical Summary

The PokéRogue AO migration employs an **AO Actor Model architecture** with HyperBeam NIF device orchestration, transforming the existing object-oriented TypeScript codebase into a distributed actor-based system. The architecture leverages AO's cryptographically linked message patterns and pluggable NIF device system to achieve **100% behavioral parity** while enabling autonomous agent participation as first-class actors. Core architectural patterns include Actor Model message passing, HyperBeam NIF-based computation, cryptographically verifiable game states through HashPaths, and trustless battle resolution, directly supporting the PRD's goal of creating the world's first fully UI-agnostic roguelike where AI agents battle as independent actors in a verifiable computation graph.

## High Level Overview

**Architectural Style:** **AO Actor Model with HyperBeam NIF Device Orchestration**
- Independent actor processes communicating exclusively through cryptographically linked messages
- HyperBeam NIF device system providing pluggable, high-performance computation engines
- Message paths creating trustless, mathematically verifiable game state progression

**Repository Structure:** **Distributed Actor System** (from AO Core patterns)
- `/actors/` - Independent actor processes (Game Manager, Battle Resolver, State Keeper)
- `/nif-devices/` - HyperBeam pluggable native computation devices
- `/message-schemas/` - Cryptographically linked message definitions
- `/typescript-reference/` - Current implementation for parity testing

**Service Architecture:** **Multi-Actor System with Device Orchestration**
- GameManager actor: Coordinates game flow and player sessions
- BattleResolver actor: Handles combat resolution and state transitions  
- StateKeeper actor: Manages permanent game state and progression
- QueryHandler actor: Provides trustless state queries for agents
- HyperBeam NIF devices: Native pluggable computation engines for game logic execution

**Primary Data Flow:** **Actor Message Passing with Cryptographic Verification**
1. Players/agents send cryptographically signed messages to GameManager actor
2. GameManager routes messages to appropriate actors (BattleResolver, StateKeeper)
3. Actors execute game logic through HyperBeam NIF devices, creating verifiable computation paths
4. State changes propagated through HashPath message chains for trustless verification
5. Results returned through cryptographically linked response messages

**Key Architectural Decisions:**
- **Actor Model Over Monoliths:** Independent actors with message-only communication
- **NIF-Based Computation:** HyperBeam pluggable native devices for extensible game logic
- **Cryptographic Verification:** HashPath message chains enable trustless state verification
- **Trustless Battle Resolution:** Mathematical verifiability of all game outcomes
- **Resilient Distribution:** Network-wide redundancy through AO's distributed architecture

## High Level Project Diagram

```mermaid
graph TB
    subgraph "Actor Network: Independent Processes"
        GM[GameManager Actor<br/>Session coordination]
        BR[BattleResolver Actor<br/>Combat resolution]
        SK[StateKeeper Actor<br/>Permanent state]
        QH[QueryHandler Actor<br/>Trustless queries]
    end
    
    subgraph "HyperBeam NIF Device Layer"
        D1[~battle-engine<br/>Combat calculations (NIF)]
        D2[~state-manager<br/>Data persistence (NIF)]
        D3[~crypto-verifier<br/>HashPath validation (NIF)]
        D4[~query-processor<br/>Agent interfaces (NIF)]
    end
    
    subgraph "Player/Agent Interfaces"
        P1[Human Players<br/>Phase 2: AOConnect UI]
        P2[AI Agents<br/>Phase 3: Actor Messages]
    end
    
    subgraph "Cryptographic Infrastructure"
        HP[HashPaths<br/>Message verification]
        CV[Computation Graph<br/>Trustless validation]
    end
    
    P1 -.->|Signed Messages| GM
    P2 -.->|Actor Messages| GM
    
    GM <-->|Message Routes| BR
    GM <-->|State Queries| SK
    GM <-->|Agent Requests| QH
    
    BR -->|NIF Calls| D1
    SK -->|NIF Calls| D2
    QH -->|NIF Calls| D4
    
    D1 -->|HashPath Links| HP
    D2 -->|HashPath Links| HP
    D3 -->|Verification| CV
    HP -->|Computation Graph| CV
```

## Architectural and Design Patterns

- **Actor Model Message Passing:** Independent actors communicate exclusively through cryptographically linked messages - _Rationale:_ Enables distributed, resilient computation with mathematical verifiability of all game state transitions

- **HyperBeam NIF Device Orchestration:** Pluggable native computation devices handle specialized game logic execution - _Rationale:_ Modular, extensible architecture supporting high-performance computational environments and third-party game mechanics

- **HashPath Verification:** Message chains create cryptographically verifiable computation graphs - _Rationale:_ Enables trustless battle resolution where outcomes can be mathematically verified without trust in any single actor

- **Distributed State Management:** Game state distributed across specialized actors with message-based synchronization - _Rationale:_ Eliminates single points of failure while maintaining state consistency through AO's resilient network

- **Trustless Agent Integration:** AI agents participate as first-class actors with full access to verifiable game state - _Rationale:_ Creates truly autonomous agent gameplay where agents can verify all game outcomes independently

- **Permissionless Extensibility:** NIF device system enables third-party game mechanics without core system modifications - _Rationale:_ Supports infinite game evolution through community-developed native devices and custom computational logic
