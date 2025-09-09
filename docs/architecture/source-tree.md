# Source Tree

## AO Actor Network Repository Structure

```plaintext
pokerogue-ao-actor-network/
├── actors/                               # Independent AO Actor Implementations
│   ├── game-manager/                     # GameManager Actor
│   │   ├── src/
│   │   │   ├── main.lua                  # Main actor implementation
│   │   │   ├── handlers/                 # Message handlers
│   │   │   │   ├── session-manager.lua  # Player session coordination
│   │   │   │   ├── message-router.lua   # Actor message routing
│   │   │   │   └── actor-discovery.lua  # Network discovery protocols
│   │   │   ├── crypto/                   # Cryptographic utilities
│   │   │   │   ├── signature-verify.lua # Message signature verification
│   │   │   │   └── hash-path.lua        # HashPath message chain management
│   │   │   └── utils/                    # Utility functions
│   │   │       ├── json-schema.lua      # Message schema validation
│   │   │       └── error-handling.lua   # Error handling patterns
│   │   ├── tests/                        # Actor unit tests
│   │   │   ├── message-tests.lua        # Message handler testing
│   │   │   └── crypto-tests.lua         # Cryptographic verification tests
│   │   ├── deploy/                       # Deployment configuration
│   │   │   ├── actor-config.lua         # Actor configuration
│   │   │   └── deploy.sh                # Deployment script
│   │   └── README.md                     # Actor documentation
│   │
│   ├── battle-resolver/                  # BattleResolver Actor
│   │   ├── src/
│   │   │   ├── main.lua                  # Main battle actor
│   │   │   ├── handlers/                 # Battle message handlers
│   │   │   │   ├── battle-execution.lua # Battle turn execution
│   │   │   │   ├── damage-calculation.lua # Damage computation
│   │   │   │   └── outcome-verification.lua # Battle outcome verification
│   │   │   ├── devices/                  # HyperBeam device orchestration
│   │   │   │   ├── battle-engine.lua    # Battle engine device integration
│   │   │   │   └── crypto-verifier.lua  # Cryptographic verification
│   │   │   └── battle-logic/             # Game mechanics
│   │   │       ├── type-effectiveness.lua # Type chart calculations
│   │   │       ├── status-effects.lua   # Status condition handling
│   │   │       └── move-effects.lua     # Move effect implementations
│   │   ├── tests/
│   │   ├── deploy/
│   │   └── README.md
│   │
│   ├── state-keeper/                     # StateKeeper Actor
│   │   ├── src/
│   │   │   ├── main.lua                  # State management actor
│   │   │   ├── handlers/                 # State message handlers
│   │   │   │   ├── state-persistence.lua # Arweave state storage
│   │   │   │   ├── state-synchronization.lua # Cross-actor sync
│   │   │   │   └── integrity-verification.lua # State integrity checks
│   │   │   ├── devices/                  # Device orchestration
│   │   │   │   └── state-manager.lua    # State management device
│   │   │   └── storage/                  # Storage implementations
│   │   │       ├── arweave-client.lua   # Arweave integration
│   │   │       └── cache-manager.lua    # Local caching system
│   │   ├── tests/
│   │   ├── deploy/
│   │   └── README.md
│   │
│   ├── query-handler/                    # QueryHandler Actor
│   │   ├── src/
│   │   │   ├── main.lua                  # Query processing actor
│   │   │   ├── handlers/                 # Query message handlers
│   │   │   │   ├── trustless-queries.lua # Verified query processing
│   │   │   │   ├── agent-interface.lua  # Agent-friendly interfaces
│   │   │   │   └── data-aggregation.lua # Multi-actor data synthesis
│   │   │   ├── devices/                  # Device orchestration
│   │   │   │   └── query-processor.lua  # Query processing device
│   │   │   └── formatters/               # Data formatting
│   │   │       ├── agent-formatters.lua # Agent-optimized data structures
│   │   │       └── verification-formatters.lua # Cryptographic proof formatting
│   │   ├── tests/
│   │   ├── deploy/
│   │   └── README.md
│   │
│   ├── shared/                           # Shared Actor Libraries
│   │   ├── crypto/                       # Cryptographic utilities
│   │   │   ├── hash-path.lua            # HashPath chain management
│   │   │   ├── signature-utils.lua      # Digital signature utilities
│   │   │   └── verification-proofs.lua  # Cryptographic proof generation
│   │   ├── messaging/                    # Message protocols
│   │   │   ├── actor-messages.lua       # Standard actor message formats
│   │   │   ├── device-messages.lua      # HyperBeam device message protocols
│   │   │   └── error-messages.lua       # Error handling messages
│   │   ├── data-models/                  # Shared data structures
│   │   │   ├── pokemon-models.lua       # Pokemon data structures
│   │   │   ├── battle-models.lua        # Battle state structures
│   │   │   └── player-models.lua        # Player state structures
│   │   └── utils/                        # Common utilities
│   │       ├── json-utils.lua           # JSON serialization/deserialization
│   │       ├── validation-utils.lua     # Data validation functions
│   │       └── logging-utils.lua        # Structured logging
│   │
│   ├── network-config/                   # Network Configuration
│   │   ├── actor-registry.lua           # Actor discovery registry
│   │   ├── message-schemas.lua          # Network message schemas
│   │   └── verification-standards.lua   # Cryptographic standards
│   │
│   └── README.md                         # Actor development guide
│
├── hyperbeam-devices/                    # HyperBeam Rust Computation Devices
│   ├── battle-engine/                    # Battle Engine Rust Device
│   │   ├── src/
│   │   │   ├── lib.rs                    # Main Rust library with NIF exports
│   │   │   ├── battle/                   # Battle logic modules
│   │   │   │   ├── mod.rs               # Battle module exports
│   │   │   │   ├── damage_calculator.rs # High-performance damage calculation
│   │   │   │   ├── type_effectiveness.rs # Type chart implementation
│   │   │   │   └── move_processor.rs    # Move effect processing
│   │   │   ├── crypto/                   # Cryptographic utilities
│   │   │   │   ├── mod.rs               # Crypto module exports
│   │   │   │   └── verification.rs     # Battle outcome verification
│   │   │   └── arweave/                 # Arweave data integration
│   │   │       ├── mod.rs               # Arweave module exports
│   │   │       └── client.rs            # HTTP client for Pokemon data
│   │   ├── Cargo.toml                   # Rust dependencies (rustler, serde, etc.)
│   │   ├── build.rs                     # Build script for HyperBeam integration
│   │   ├── tests/                       # Rust unit and integration tests
│   │   │   ├── battle_tests.rs          # Battle logic testing
│   │   │   └── integration_tests.rs     # NIF integration testing
│   │   └── README.md
│   │
│   ├── state-manager/                    # State Management Rust Device
│   │   ├── src/
│   │   │   ├── lib.rs                    # Main Rust library with NIF exports
│   │   │   ├── persistence/              # State persistence modules
│   │   │   │   ├── mod.rs               # Persistence module exports
│   │   │   │   ├── arweave.rs           # High-performance Arweave client
│   │   │   │   └── cache.rs             # Local state caching
│   │   │   ├── integrity/                # State integrity verification
│   │   │   │   ├── mod.rs               # Integrity module exports
│   │   │   │   ├── hash_verification.rs # Cryptographic hash verification
│   │   │   │   └── state_validation.rs  # State structure validation
│   │   │   └── sync/                     # Multi-actor synchronization
│   │   │       ├── mod.rs               # Sync module exports
│   │   │       └── actor_coordination.rs # Cross-actor state coordination
│   │   ├── Cargo.toml                   # Rust dependencies (rustler, ureq, tokio)
│   │   ├── build.rs                     # Build script for HyperBeam integration
│   │   ├── tests/                       # Rust unit and integration tests
│   │   └── README.md
│   │
│   ├── crypto-verifier/                  # Cryptographic Verification Rust Device
│   │   ├── src/
│   │   │   ├── lib.rs                    # Main Rust library with NIF exports
│   │   │   ├── hash_path/                # HashPath verification modules
│   │   │   │   ├── mod.rs               # HashPath module exports
│   │   │   │   ├── chain_validator.rs   # Message chain validation
│   │   │   │   └── link_verifier.rs     # Individual link verification
│   │   │   ├── computation/              # Computation graph verification
│   │   │   │   ├── mod.rs               # Computation module exports
│   │   │   │   ├── graph_validator.rs   # Computation graph verification
│   │   │   │   └── proof_generator.rs   # Cryptographic proof generation
│   │   │   └── signatures/               # Digital signature verification
│   │   │       ├── mod.rs               # Signatures module exports
│   │   │       └── ed25519_verifier.rs  # Ed25519 signature verification
│   │   ├── Cargo.toml                   # Rust dependencies (rustler, ed25519, ring)
│   │   ├── build.rs                     # Build script for HyperBeam integration
│   │   ├── tests/                       # Rust cryptographic tests
│   │   └── README.md
│   │
│   ├── query-processor/                  # Query Processing Rust Device
│   │   ├── src/
│   │   │   ├── lib.rs                    # Main Rust library with NIF exports
│   │   │   ├── formatters/               # Data formatting modules
│   │   │   │   ├── mod.rs               # Formatters module exports
│   │   │   │   ├── agent_formatter.rs   # Agent-friendly data structures
│   │   │   │   └── json_optimizer.rs    # JSON response optimization
│   │   │   ├── aggregation/              # Data aggregation modules
│   │   │   │   ├── mod.rs               # Aggregation module exports
│   │   │   │   ├── multi_actor.rs       # Cross-actor data aggregation
│   │   │   │   └── parallel_processor.rs # Parallel data processing
│   │   │   └── verification/             # Query verification modules
│   │   │       ├── mod.rs               # Verification module exports
│   │   │       └── trustless_queries.rs # Trustless query processing
│   │   ├── Cargo.toml                   # Rust dependencies (rustler, rayon, serde)
│   │   ├── build.rs                     # Build script for HyperBeam integration
│   │   ├── tests/                       # Rust query processing tests
│   │   └── README.md
│   │
│   ├── shared-device-libs/               # Shared Rust Device Libraries
│   │   ├── src/
│   │   │   ├── lib.rs                    # Shared library exports
│   │   │   ├── crypto_utils.rs          # Common cryptographic operations
│   │   │   ├── arweave_client.rs        # Shared Arweave HTTP client
│   │   │   ├── json_schemas.rs          # Shared data structures
│   │   │   └── error_handling.rs        # Common error types and handling
│   │   ├── Cargo.toml                   # Shared Rust dependencies
│   │   └── README.md
│   │
│   └── Cargo.toml                        # Workspace configuration for all devices
│
├── arweave-data/                         # Permanent External Data
│   ├── pokemon-species/                  # Pokemon Species Data
│   │   ├── generation-1/                # Gen 1 Pokemon
│   │   │   ├── bulbasaur.json           # Individual species data
│   │   │   └── ...
│   │   └── ...
│   ├── moves-database/                   # Move Definitions
│   │   ├── physical-moves.json          # Physical moves
│   │   ├── special-moves.json           # Special moves
│   │   └── status-moves.json            # Status moves
│   ├── type-effectiveness/               # Type Chart Data
│   │   └── type-chart.json              # Complete type effectiveness matrix
│   ├── deployment/                       # Data deployment scripts
│   │   ├── upload-species.js            # Species data upload
│   │   └── verify-uploads.js            # Upload verification
│   └── README.md                         # Data structure documentation
│
├── typescript-reference/                 # Original Implementation Reference
│   └── src/                              # Unmodified original PokéRogue
│       └── ...                          # Complete reference implementation
│
├── testing/                              # Comprehensive Testing Suite
│   ├── actor-tests/                     # Actor-specific testing
│   │   ├── message-flow-tests/          # Cross-actor message testing
│   │   ├── cryptographic-tests/         # Cryptographic verification testing
│   │   └── integration-tests/           # Full actor network testing
│   ├── device-tests/                    # HyperBeam device testing
│   │   ├── computation-tests/           # Device computation verification
│   │   └── orchestration-tests/        # Actor-device integration testing
│   ├── parity-testing/                  # TypeScript compatibility validation
│   │   ├── battle-parity/              # Battle outcome comparison
│   │   ├── stat-calculation-parity/    # Stat calculation verification
│   │   └── parity-reports/             # Generated comparison reports
│   ├── network-tests/                   # Actor network testing
│   │   ├── discovery-tests/            # Actor discovery testing
│   │   ├── message-verification-tests/ # Cryptographic message testing
│   │   └── scalability-tests/          # Network scalability testing
│   └── README.md                        # Testing strategy guide
│
├── development-tools/                    # Development Infrastructure
│   ├── local-ao-network/                # Local AO development environment
│   │   ├── start-network.sh             # Local actor network startup
│   │   ├── aos-configs/                 # Local aos configurations
│   │   └── docker-compose.yml           # Containerized development
│   ├── actor-debugger/                  # Actor debugging tools
│   │   ├── message-tracer.lua          # Message flow tracing
│   │   ├── state-inspector.lua         # Actor state inspection
│   │   └── crypto-debugger.lua         # Cryptographic verification debugging
│   ├── data-migration/                  # Data conversion tools
│   │   ├── typescript-to-lua.js        # Code conversion utilities
│   │   ├── data-validator.js           # Data integrity validation
│   │   └── migration-scripts/          # Automated migration tools
│   └── README.md                        # Development workflow guide
│
├── documentation/                        # Comprehensive Documentation
│   ├── actor-guides/                    # Actor-specific guides
│   │   ├── actor-development.md        # Actor development guide
│   │   ├── message-protocols.md        # Message protocol specifications
│   │   └── cryptographic-patterns.md  # Cryptographic implementation patterns
│   ├── device-guides/                   # HyperBeam device guides
│   │   ├── device-development.md       # Device development guide
│   │   └── orchestration-patterns.md  # Device orchestration patterns
│   ├── network-guides/                  # Network operation guides
│   │   ├── actor-discovery.md          # Actor discovery protocols
│   │   ├── network-security.md         # Network security patterns
│   │   └── scalability-patterns.md    # Network scalability patterns
│   └── api-reference/                   # API Documentation
│       ├── actor-apis.md               # Actor message APIs
│       ├── device-apis.md              # Device interface APIs
│       └── agent-integration.md        # Agent integration guide
│
├── deployment/                           # Network Deployment
│   ├── actor-deployment/                # Actor deployment scripts
│   │   ├── deploy-actors.sh            # Multi-actor deployment
│   │   ├── verify-network.sh           # Network verification
│   │   └── rollback-actors.sh          # Rollback procedures
│   ├── device-deployment/               # Device deployment
│   │   └── deploy-devices.sh           # HyperBeam device deployment
│   ├── monitoring/                      # Network monitoring
│   │   ├── actor-health-check.lua     # Actor health monitoring
│   │   ├── message-flow-monitor.lua   # Message flow monitoring
│   │   └── crypto-audit.lua           # Cryptographic audit tools
│   └── README.md                        # Deployment guide
│
├── scripts/                              # Automation Scripts
│   ├── build/                           # Build automation
│   │   ├── build-all-actors.sh         # Actor build pipeline (Lua)
│   │   ├── build-rust-devices.sh       # Rust device compilation pipeline
│   │   ├── deploy-devices-to-hyperbeam.sh # Copy .so files to HyperBeam priv directory
│   │   └── validate-builds.sh          # Build validation (Lua + Rust)
│   ├── testing/                         # Test automation
│   │   ├── run-actor-tests.sh          # Actor test execution
│   │   ├── run-network-tests.sh        # Network integration tests
│   │   └── run-parity-tests.sh         # TypeScript parity validation
│   ├── deployment/                      # Deployment automation
│   │   ├── deploy-network.sh           # Complete network deployment
│   │   ├── update-actors.sh            # Actor update procedures
│   │   └── verify-deployment.sh        # Post-deployment verification
│   └── maintenance/                     # Network maintenance
│       ├── backup-actor-states.sh      # State backup procedures
│       ├── update-data.sh              # External data updates
│       └── network-health-check.sh     # Comprehensive network health check
│
├── .aos/                                 # AO Development Configuration
│   ├── local-config.json               # Local AO network configuration
│   └── actor-templates/                 # Actor template configurations
│
└── package.json                         # Node.js tooling configuration
├── README.md                            # Project overview and network setup
└── NETWORK-ARCHITECTURE.md             # Network architecture documentation
```

## Key Architectural Benefits

### **Distributed Actor Architecture**
- Independent actors with specialized responsibilities enable horizontal scaling
- Cryptographic message-based communication ensures trustless operation
- Fault isolation prevents single actor failures from affecting the entire network
- Permissionless actor deployment enables ecosystem expansion

### **Cryptographic Verification Integration**
- HashPath message chains provide mathematical verifiability of all game outcomes
- Digital signature verification ensures message authenticity and integrity
- Computation graph verification enables trustless agent validation
- Permanent Arweave storage with cryptographic proof ensures data integrity

### **HyperBeam Device Orchestration**
- Pluggable computation devices enable modular game logic implementation
- Device specialization allows for optimized computation engines
- Reusable device libraries prevent duplication across actors
- Custom execution environments support complex game mechanics

### **Agent-First Design**
- Native support for autonomous agent participation as first-class network participants
- Trustless query interfaces enable agents to verify all game state independently
- Standardized message protocols support diverse agent implementations
- Permissionless agent integration enables unlimited AI ecosystem growth

### **Network Scalability**
- Distributed state management across specialized actors
- Message-based communication enables unlimited network expansion
- Actor discovery protocols support dynamic network topology
- Load distribution through specialized actor roles

This structure achieves **unlimited scalability** through distributed actors, **mathematical verifiability** through cryptographic integration, and **permissionless extensibility** through standardized network protocols.