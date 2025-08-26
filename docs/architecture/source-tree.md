# Source Tree

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
