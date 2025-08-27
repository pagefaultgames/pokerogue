# PokéRogue AO Process Architecture

## Overview

PokéRogue uses Arweave AO (Autonomous Objects) processes to handle game logic validation, anti-cheating measures, and secure state management. This architecture ensures game integrity while maintaining decentralization and transparency.

## Architecture Components

### 1. AO Process Layer
- **Game Logic Processes**: Core game mechanics validation (battle calculations, move effects, type effectiveness)
- **Anti-Cheat Processes**: Real-time validation of player actions and game state consistency
- **Resource Management**: Pokemon stats, item effects, and progression validation
- **RNG Validation**: Cryptographically secure random number generation and verification

### 2. Testing Infrastructure

#### Aolite Integration
We use **aolite** for local AO process testing and development. Aolite provides:

- **Local AO Environment**: Complete simulation of the Arweave AO protocol without network deployment
- **Concurrent Process Emulation**: Uses Lua coroutines for realistic process management
- **Message Passing System**: Full AO-compatible message queue and handler system  
- **Process State Inspection**: Direct access to process state during development and testing
- **Scheduler Control**: Manual and automatic message scheduling for deterministic testing

#### Why Aolite Over Custom Testing
- **Protocol Accuracy**: Uses actual AO globals (`ao`, `Handlers`) and message formats
- **Development Speed**: No need to maintain custom AO simulation infrastructure
- **Debugging Capabilities**: Built-in process state inspection and message tracing
- **Compatibility**: Ensures processes work identically in local testing and production

### 3. Parity Testing Framework
Validates consistency between:
- **TypeScript Implementation** (client-side game logic)
- **Lua Implementation** (AO process validation logic)
- **Battle Calculations**: Damage, type effectiveness, status effects
- **Pokemon Stats**: Base stats, IVs, EVs, nature effects
- **Item Effects**: All held items and consumables

### 4. CI/CD Pipeline
- **Unit Tests**: Individual AO process handler testing
- **Integration Tests**: Cross-process communication and state management
- **Parity Tests**: TypeScript ↔ Lua consistency validation
- **Performance Tests**: Process execution time and resource usage
- **Regression Tests**: Automated detection of behavioral changes

## Directory Structure

```
ao-processes/
├── game-logic/           # Core game mechanic processes
│   ├── pokemon/         # Pokemon-related validation
│   └── rng/            # Random number generation
├── handlers/           # AO message handlers
├── tests/             # Test suites (uses aolite)
└── main.lua          # Main process entry point

parity-testing/
├── test-harness/     # Parity validation framework
├── reports/         # Test reporting and analysis
└── test-cases/     # Shared test scenarios

development-tools/
├── aolite-config/  # Aolite setup and configuration
├── process-tools/ # Development utilities
└── deployment/   # Process deployment scripts

architecture/      # Detailed architecture documentation
├── testing-strategy.md
├── aolite-setup.md
├── parity-framework.md
└── deployment-guide.md
```

## Key Benefits

### Security
- **Decentralized Validation**: Game logic runs on Arweave AO, not controllable by any single party
- **Tamper Resistance**: Process code and state are immutable once deployed
- **Transparent Operations**: All validations are publicly verifiable

### Scalability  
- **Parallel Processing**: Multiple AO processes can run concurrently
- **Load Distribution**: Game validation distributed across the AO network
- **Efficient Testing**: Aolite enables rapid local development and testing

### Reliability
- **Comprehensive Testing**: Multi-layered testing strategy ensures correctness
- **Parity Validation**: Guarantees consistency between implementations
- **Regression Detection**: Automated monitoring for behavioral changes

## Development Workflow

1. **Local Development**: Use aolite for rapid iteration and testing
2. **Parity Validation**: Ensure TypeScript and Lua implementations match
3. **Integration Testing**: Test cross-process communication
4. **Performance Validation**: Benchmark process execution
5. **Deployment**: Deploy to AO testnet, then mainnet

## Next Steps

See the `architecture/` folder for detailed documentation on:
- Setting up aolite for development
- Running parity tests
- Deploying AO processes
- Monitoring and maintenance

## References

- [Aolite Documentation](https://github.com/perplex-labs/aolite)
- [Arweave AO Protocol](https://ao.arweave.dev/)
- [PokéRogue Game Logic](./docs/game-logic.md)