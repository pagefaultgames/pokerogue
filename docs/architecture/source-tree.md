# Source Tree

## Repository Structure

```plaintext
pokerogue-ao-hyperbeam-migration/
├── devices/                              # Rust WASM Device Implementations
│   ├── shared/                           # Shared Rust Types & Traits
│   │   ├── src/
│   │   │   ├── lib.rs                   # Core ECS types, device traits
│   │   │   ├── pokemon/                 # Pokemon-specific types
│   │   │   │   ├── species.rs           # Species data structures
│   │   │   │   ├── stats.rs             # Stat calculation types
│   │   │   │   ├── moves.rs             # Move data structures
│   │   │   │   └── battle.rs            # Battle state types
│   │   │   ├── ecs/                     # ECS framework types
│   │   │   │   ├── entity.rs            # Entity management
│   │   │   │   ├── component.rs         # Component definitions
│   │   │   │   └── message.rs           # Device message protocols
│   │   │   └── arweave/                 # Arweave integration
│   │   │       ├── client.rs            # Arweave gateway client
│   │   │       └── cache.rs             # Data caching system
│   │   ├── Cargo.toml                   # Shared library dependencies
│   │   └── README.md                    # Shared library documentation
│   │
│   ├── pokemon-stats/                    # Stats Calculation Device
│   │   ├── src/
│   │   │   ├── lib.rs                   # WASM device implementation
│   │   │   ├── calculator.rs            # Pokemon stat formulas
│   │   │   └── nature.rs                # Nature modifier logic
│   │   ├── Cargo.toml                   # Device dependencies
│   │   ├── tests/                       # Device unit tests
│   │   └── README.md                    # Device documentation
│   │
│   ├── battle-engine/                    # Battle Resolution Device
│   │   ├── src/
│   │   │   ├── lib.rs                   # WASM battle device
│   │   │   ├── damage.rs                # Damage calculation engine
│   │   │   ├── type_chart.rs            # Type effectiveness system
│   │   │   ├── moves/                   # Move effect implementations
│   │   │   │   ├── physical.rs          # Physical move effects
│   │   │   │   ├── special.rs           # Special move effects
│   │   │   │   └── status.rs            # Status move effects
│   │   │   └── conditions.rs            # Status conditions logic
│   │   ├── Cargo.toml
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── evolution-system/                 # Evolution Logic Device
│   │   ├── src/
│   │   │   ├── lib.rs                   # Evolution device implementation
│   │   │   ├── triggers.rs              # Evolution trigger detection
│   │   │   ├── transformations.rs       # Species transformation logic
│   │   │   └── conditions.rs            # Special evolution conditions
│   │   ├── Cargo.toml
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── arweave-data/                     # External Data Access Device
│   │   ├── src/
│   │   │   ├── lib.rs                   # Data fetching device
│   │   │   ├── species.rs               # Species data access
│   │   │   ├── moves.rs                 # Moves data access
│   │   │   ├── items.rs                 # Items data access
│   │   │   └── cache.rs                 # Performance caching
│   │   ├── Cargo.toml
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── query-handler/                    # Agent Query Device
│   │   ├── src/
│   │   │   ├── lib.rs                   # Agent query interface
│   │   │   ├── formatters.rs            # Data formatting utilities
│   │   │   ├── aggregators.rs           # Data aggregation logic
│   │   │   └── validators.rs            # Query validation
│   │   ├── Cargo.toml
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── Cargo.toml                        # Workspace configuration
│   ├── build-all-devices.sh             # Device build automation
│   └── README.md                         # Device development guide
│
├── hyperbeam-process/                    # HyperBEAM Process Configuration
│   ├── config/
│   │   ├── process.toml                 # Process configuration
│   │   ├── devices.json                 # Device registry
│   │   └── routing.json                 # Message routing rules
│   ├── lua/
│   │   ├── init.lua                     # Process initialization
│   │   ├── message_router.lua           # Device message routing
│   │   ├── state_manager.lua            # ECS state management
│   │   └── http_handlers.lua            # HTTP interface handlers
│   ├── deploy/
│   │   ├── deploy.sh                    # Deployment automation
│   │   └── health_check.lua             # Process health monitoring
│   └── README.md                         # Process setup guide
│
├── arweave-data/                         # External Data Storage
│   ├── species/                          # Pokemon Species Data
│   │   ├── generation-1/                # Gen 1 Pokemon (151 species)
│   │   │   ├── 001-bulbasaur.json      # Individual species files
│   │   │   ├── 002-ivysaur.json
│   │   │   └── ...
│   │   ├── generation-2/                # Gen 2 Pokemon
│   │   └── ...
│   ├── moves/                            # Move Definitions
│   │   ├── physical-moves.json          # Physical move database
│   │   ├── special-moves.json           # Special move database
│   │   ├── status-moves.json            # Status move database
│   │   └── type-effectiveness.json      # Type chart data
│   ├── items/                            # Item Database
│   │   ├── healing-items.json           # Potions, berries, etc.
│   │   ├── battle-items.json            # X Attack, X Defense, etc.
│   │   └── held-items.json              # Held item effects
│   ├── upload/
│   │   ├── upload-species.js            # Species data upload scripts
│   │   ├── upload-moves.js              # Moves data upload scripts
│   │   └── batch-upload.sh              # Batch upload automation
│   └── README.md                         # Data structure documentation
│
├── typescript-reference/                 # Original TypeScript Implementation
│   └── src/                              # Current PokéRogue source (unchanged)
│       ├── battle/                      # Reference battle system
│       ├── pokemon/                     # Reference Pokemon mechanics
│       ├── moves/                       # Reference move implementations
│       └── ...                          # Complete original codebase
│
├── testing/                              # Testing Infrastructure
│   ├── device-tests/                    # Device-specific tests
│   │   ├── unit/                        # Rust unit tests
│   │   ├── integration/                 # Cross-device integration tests
│   │   └── wasm/                        # WASM execution tests
│   ├── parity-testing/                  # Cross-Implementation Validation
│   │   ├── test-harness/                # Automated parity validation
│   │   ├── test-cases/                  # Battle scenario test cases
│   │   └── reports/                     # Generated parity reports
│   ├── performance/                     # Performance Testing
│   │   ├── battle-benchmarks.rs        # Battle resolution timing
│   │   ├── device-benchmarks.rs        # Individual device performance
│   │   └── memory-usage.rs              # Memory footprint analysis
│   └── README.md                        # Testing strategy guide
│
├── development-tools/                    # Development Infrastructure
│   ├── hyperbeam-local/                 # Local HyperBEAM development setup
│   │   ├── start-local.sh               # Local development server
│   │   ├── config/                      # Local configuration files
│   │   └── docker-compose.yml           # Containerized development
│   ├── data-migration/                  # TypeScript to Rust conversion tools
│   │   ├── species-converter.js         # Species data conversion
│   │   ├── moves-converter.js           # Moves data conversion
│   │   └── validation.js                # Data validation utilities
│   ├── debugging/                       # Development debugging tools
│   │   ├── device-inspector.js          # WASM device debugging
│   │   ├── message-tracer.js            # Message flow tracing
│   │   └── state-dumper.js              # ECS state inspection
│   └── README.md                        # Development workflow guide
│
├── documentation/                        # Project Documentation
│   ├── architecture/                    # Architecture documentation (this file)
│   ├── devices/                         # Device-specific documentation
│   │   ├── device-development-guide.md # How to create new devices
│   │   ├── rust-wasm-patterns.md       # Common WASM patterns
│   │   └── performance-guidelines.md   # Device optimization guide
│   ├── deployment/                      # Deployment documentation
│   │   ├── hyperbeam-setup.md          # HyperBEAM process deployment
│   │   ├── arweave-data-upload.md      # External data deployment
│   │   └── monitoring.md                # Production monitoring setup
│   └── api/                             # API documentation
│       ├── device-interfaces.md         # Device message protocols
│       ├── agent-api.md                 # Agent interaction guide
│       └── http-endpoints.md            # HTTP API reference
│
├── scripts/                              # Build and Automation Scripts
│   ├── build/                           # Build automation
│   │   ├── build-all-devices.sh        # Complete device build pipeline
│   │   ├── optimize-wasm.sh            # WASM size optimization
│   │   └── validate-builds.sh          # Build validation
│   ├── testing/                         # Testing automation
│   │   ├── run-device-tests.sh         # Device test execution
│   │   ├── run-parity-tests.sh         # Parity validation
│   │   └── performance-suite.sh        # Performance benchmarking
│   ├── deployment/                      # Deployment automation
│   │   ├── deploy-hyperbeam.sh         # HyperBEAM process deployment
│   │   ├── upload-arweave-data.sh      # External data deployment
│   │   └── health-check.sh             # Post-deployment validation
│   └── maintenance/                     # Maintenance scripts
│       ├── update-external-data.sh     # Data update automation
│       ├── device-hot-reload.sh        # Development device updates
│       └── backup-process-state.sh     # State backup utilities
│
├── dist/                                 # Built Artifacts (Generated)
│   ├── devices/                         # Compiled WASM devices
│   │   ├── pokemon-stats.wasm           # Stats device binary
│   │   ├── battle-engine.wasm           # Battle engine binary
│   │   ├── evolution-system.wasm        # Evolution device binary
│   │   ├── arweave-data.wasm           # Data access device binary
│   │   └── query-handler.wasm           # Query device binary
│   ├── hyperbeam/                       # HyperBEAM deployment package
│   │   ├── process.lua                  # Main process file
│   │   ├── devices.json                 # Device registry
│   │   └── config.toml                  # Process configuration
│   └── arweave/                         # Processed external data
│       ├── species-transactions.json   # Species upload results
│       ├── moves-transactions.json     # Moves upload results
│       └── data-references.json        # Transaction ID references
│
├── .github/                              # GitHub Integration
│   └── workflows/                       # CI/CD Pipelines
│       ├── build-devices.yml           # Device build and test
│       ├── parity-validation.yml       # TypeScript compatibility check
│       ├── performance-benchmarks.yml  # Performance regression testing
│       └── deploy.yml                   # Automated deployment
│
├── Cargo.toml                           # Root workspace configuration
├── package.json                         # Node.js tools and scripts
├── README.md                            # Project overview and setup
└── CHANGELOG.md                         # Version history and changes
```

## Key Structural Benefits

### **Modular Device Architecture**
- Each device is an independent Rust crate with its own tests and documentation
- Shared types and utilities prevent duplication across devices
- Clear separation between game logic (devices) and state management (process)

### **External Data Organization**
- Pokemon data organized by generation for efficient partial loading
- Move and item databases structured for optimal query performance
- Upload scripts enable automated data deployment to Arweave

### **Development Workflow**
- Local HyperBEAM development environment for rapid iteration
- Automated build pipeline for all devices
- Comprehensive testing strategy with parity validation

### **Bundle Size Optimization**
- WASM devices compile to optimal binary sizes
- External data eliminates embedded data bloat
- Single HyperBEAM process reduces deployment complexity

This structure supports the **95% bundle size reduction** goal while maintaining **modular development** and **type-safe implementation** of all Pokemon game mechanics.