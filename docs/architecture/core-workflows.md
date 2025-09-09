# Core Workflows

## Workflow 1: Cryptographically Verified Battle Turn Resolution

```mermaid
sequenceDiagram
    participant Player as Player/Agent
    participant GM as GameManager Actor
    participant BR as BattleResolver Actor
    participant BE as Battle Engine NIF Device
    participant SK as StateKeeper Actor
    participant CV as Crypto Verifier NIF Device
    participant HP as HashPath Chain
    
    Player->>GM: SignedMessage{action: "ExecuteBattleTurn", battleId, move, signature}
    GM->>GM: Verify player signature and session
    
    GM->>BR: RouteMessage{battleCommand, verifiedPlayer, hashPath}
    BR->>SK: RequestBattleState{battleId, currentHash}
    SK-->>BR: VerifiedBattleState{state, integrityHash, arweaveRef}
    
    BR->>BE: Call Rust NIF: execute_battle_turn(battleState, commands, cryptoSeed)
    BE->>BE: High-performance Rust computation with deterministic RNG
    BE->>BE: Apply type effectiveness and battle mechanics in Rust
    BE-->>BR: JSON Result{outcome, computationProof, newStateHash}
    
    BR->>CV: VerifyComputation{battleResult, expectedHash, proofData}
    CV-->>BR: ComputationValid{verified: true, hashPathLink}
    
    BR->>SK: PersistBattleResult{battleId, newState, verificationProof}
    SK->>HP: LinkHashPath{previousHash, newStateHash, cryptoProof}
    HP-->>SK: HashPathConfirmed{chainId, linkVerified}
    SK-->>BR: StatePersisted{arweaveId, integrityHash}
    
    BR->>GM: BattleComplete{result, verificationProof, hashPathLink}
    GM-->>Player: VerifiableBattleResult{outcome, cryptoProof, stateHash}
```

## Workflow 2: Trustless Agent Battle Decision Process

```mermaid
sequenceDiagram
    participant Agent as AI Agent
    participant GM as GameManager Actor
    participant QH as QueryHandler Actor
    participant QP as Query Processor NIF Device
    participant BR as BattleResolver Actor
    participant CV as Crypto Verifier NIF Device
    participant HP as HashPath Chain
    
    Note over Agent: Agent discovers actor network
    Agent->>GM: DiscoverActors{agentId, capabilityRequest}
    GM-->>Agent: ActorDirectory{actors, capabilities, messageSchemas}
    
    Note over Agent: Agent requests trustless battle state
    Agent->>QH: TrustlessQuery{battleId, queryHash, agentSignature}
    QH->>QP: Call Rust NIF: process_trustless_query(battleId, agentCapabilities)
    QP->>QP: High-performance Rust data aggregation across actors
    QP->>CV: Call Rust NIF: verify_state_integrity(aggregatedState, hashChain)
    CV-->>QP: StateValid{verified: true, cryptoProof}
    QP-->>QH: JSON AgentBattleData{state, availableActions, verificationProof}
    QH-->>Agent: VerifiableBattleState{data, cryptoProof, trustlessHash}
    
    Note over Agent: Agent verifies data independently
    Agent->>Agent: VerifyStateProof(battleData, cryptoProof)
    Agent->>Agent: AnalyzeBattleOptions(verifiedState, availableActions)
    Agent->>Agent: SelectOptimalStrategy(battleAnalysis)
    
    Note over Agent: Agent executes verified battle command
    Agent->>GM: SignedBattleCommand{battleId, selectedMove, agentSignature, expectedHash}
    GM->>BR: VerifiedAgentCommand{agentId, battleCommand, hashPath}
    BR->>CV: ValidateAgentAction{command, battleState, hashChain}
    CV-->>BR: ActionValid{verified: true, computationReady}
    BR->>BR: Execute battle turn with cryptographic verification
    BR-->>GM: VerifiableBattleResult{outcome, cryptoProof, newHashPath}
    GM-->>Agent: TrustlessBattleResult{result, mathematicalProof, stateHash}
    
    Note over Agent: Agent independently verifies outcome
    Agent->>Agent: VerifyBattleOutcome(result, cryptoProof, hashPath)
    Agent->>HP: ValidateHashPath{resultHash, expectedChain}
    HP-->>Agent: HashPathValid{verified: true, computationGraph}
```

## Workflow 3: Cross-Actor State Synchronization

```mermaid
sequenceDiagram
    participant BR as BattleResolver Actor
    participant SK as StateKeeper Actor
    participant SM as State Manager NIF Device
    participant CV as Crypto Verifier NIF Device
    participant AR as Arweave Network
    participant HP as HashPath Chain
    
    Note over BR: Battle resolution creates state changes
    BR->>BR: Complete battle turn calculation
    BR->>CV: GenerateStateProof{stateChange, computationSteps}
    CV-->>BR: StateChangeProof{cryptoProof, verificationHash}
    
    Note over BR: Broadcast state update to network
    BR->>SK: StateUpdate{playerId, newState, cryptoProof, hashPath}
    BR->>GM: NotifyStateChange{stateUpdateHash, affectedActors}
    BR->>QH: InvalidateQueries{playerId, stateChangeHash}
    
    Note over SK: StateKeeper validates and persists
    SK->>CV: VerifyStateProof{stateUpdate, expectedHash}
    CV-->>SK: ProofValid{verified: true, integrityConfirmed}
    
    SK->>SM: Call Rust NIF: persist_state(playerData, verificationProof, hashChain)
    SM->>AR: Rust HTTP client: StoreTransaction{stateData, cryptoHash, hashPath}
    AR-->>SM: TransactionConfirmed{arweaveId, blockHeight}
    SM-->>SK: JSON StatePersisted{arweaveRef, integrityHash}
    
    SK->>HP: LinkStateChange{previousHash, newStateHash, arweaveRef}
    HP-->>SK: HashPathLinked{chainId, verificationComplete}
    
    Note over SK: Confirm synchronization across network
    SK->>BR: StateConfirmed{persistenceProof, hashPathLink}
    SK->>GM: StateSyncComplete{playerId, newStateHash}
    SK->>QH: StateAvailable{playerId, queryHash, verificationProof}
```

## Workflow 4: Permissionless Actor Discovery and Integration

```mermaid
sequenceDiagram
    participant NewActor as New Actor
    participant GM as GameManager Actor
    participant CV as Crypto Verifier NIF Device
    participant AR as Arweave Network
    participant Network as AO Actor Network
    participant HP as HashPath Chain
    
    Note over NewActor: New actor joins network
    NewActor->>GM: RegisterActor{actorId, capabilities, cryptoSignature}
    GM->>CV: VerifyActorIdentity{actorId, signature, publicKey}
    CV-->>GM: IdentityValid{verified: true, actorAuthentic}
    
    Note over GM: Actor capability discovery
    GM->>NewActor: RequestCapabilities{discoveryHash, networkStandards}
    NewActor-->>GM: ActorCapabilities{messageHandlers, nifDeviceList, interfaces}
    
    GM->>CV: ValidateCapabilities{actorCapabilities, networkStandards}
    CV-->>GM: CapabilitiesValid{verified: true, compatibilityConfirmed}
    
    Note over GM: Network registration and announcement
    GM->>AR: RegisterActorMetadata{actorId, capabilities, verificationProof}
    AR-->>GM: RegistrationConfirmed{arweaveId, networkAddress}
    
    GM->>Network: AnnounceNewActor{actorId, capabilities, networkProof}
    Network-->>GM: ActorNetworkConfirmed{networkId, peerList}
    
    GM->>HP: LinkActorRegistration{actorId, networkHash, arweaveRef}
    HP-->>GM: ActorLinked{chainId, discoveryComplete}
    
    Note over NewActor: Actor begins participating in network
    GM-->>NewActor: NetworkIntegration{peerActors, messageSchemas, hashChain}
    NewActor->>NewActor: Initialize message handlers and NIF device orchestration
    
    Note over NewActor: Trustless capability verification by other actors
    BR->>NewActor: VerifyActorCapabilities{capabilityQuery, verificationChallenge}
    NewActor-->>BR: CapabilityProof{demonstratedCapability, cryptoProof}
    BR->>CV: ValidateActorProof{capabilityProof, expectedResult}
    CV-->>BR: ActorVerified{verified: true, trustEstablished}
```

## Workflow Integration Patterns

### Message-Driven Coordination
All workflows leverage AO's Actor Model where independent actors communicate exclusively through cryptographically linked messages, enabling distributed, resilient game state management.

### Cryptographic Verification
Every state change, battle outcome, and actor interaction is cryptographically verified using HashPath message chains, ensuring mathematical verifiability without requiring trust in any single actor.

### Permanent State Persistence
Game state changes are permanently stored on Arweave with cryptographic integrity verification, enabling trustless state recovery and agent verification of historical game data.

### Permissionless Extensibility
New actors can join the network permissionlessly by demonstrating compatibility with message protocols and passing cryptographic verification, enabling unlimited game ecosystem expansion.

These workflows achieve **trustless game mechanics** where all participants can independently verify game outcomes, **unlimited scalability** through distributed actor architecture, and **permissionless innovation** through standardized actor integration protocols.