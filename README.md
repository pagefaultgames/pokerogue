<picture><img src="./public/images/logo.png" width="300" alt="PokéRogue"></picture>

# PokéRogue AO: The First Autonomous Agent Roguelike

PokéRogue is undergoing a revolutionary migration to the **AO Protocol** (Arweave ecosystem), transforming from a browser-based Pokémon fangame into the world's first **autonomous agent-enabled roguelike**. This migration will enable AI agents to participate as first-class players alongside humans in a fully decentralized, persistent gaming environment.

## 🚀 Migration Vision

**From Centralized Browser Game → To Decentralized Agent Ecosystem**

- **Phase 1**: Complete game logic migration to AO processes with permanent save system
- **Phase 2**: AOConnect UI integration for seamless player experience  
- **Phase 3**: AI agents battle alongside humans in persistent PVPVE environment

## 🎯 Key Benefits

- **🔒 Permanent Saves**: Never lose progress again - all data stored permanently on Arweave
- **🌐 Cross-Device Play**: Access your game from any device with AO connectivity
- **🤖 AI Agent Integration**: First roguelike where autonomous agents can play as intended
- **⚡ Zero Downtime**: Decentralized infrastructure eliminates server outages
- **🔧 Open Development**: Reproducible framework for other AO game migrations

## 🏗️ Current Status: Phase 1 Development

We're currently migrating all game mechanics from TypeScript/Phaser to AO Lua handlers. This includes:

- ✅ Battle system with damage calculation and status effects  
- ✅ Player progression and experience systems
- ✅ Creature capture and collection mechanics
- ✅ Item management and shop systems
- ✅ World progression and biome systems
- ✅ Testing framework for functional parity validation

## 📋 Migration Parity Checklist

### Core Game Systems

#### Battle System
- ✅ Turn-based battle mechanics
- ✅ Damage calculation algorithms
- ✅ Type effectiveness matrix
- ✅ Critical hit calculation
- ✅ Accuracy/evasion mechanics
- ✅ Status effect application and duration
- ✅ Multi-target move handling
- ✅ Battle state persistence

#### Pokémon/Creature System
- ✅ Species data and base stats
- ✅ Individual value (IV) generation
- ✅ Effort value (EV) system
- ✅ Nature system and stat modifiers
- ✅ Ability system implementation
- ✅ Move learning and movesets
- ✅ Evolution mechanics
- ✅ Shiny Pokémon generation
- ✅ Gender determination
- ✅ Level and experience calculation

#### Player Progression
- ✅ Trainer level system
- ✅ Experience gain distribution
- ✅ Money/currency management
- ✅ Achievement system
- ✅ Unlock progression tracking
- ✅ Statistics tracking
- ✅ Hall of Fame records

#### Inventory & Items
- ✅ Item database and effects
- ✅ Bag organization system
- ✅ Item usage mechanics
- ✅ Shop system and pricing
- ✅ Consumable item effects
- ✅ Held item mechanics
- ✅ TM/TR system
- ✅ Berry system

#### World & Exploration
- ✅ Biome generation system
- ✅ Wave progression mechanics
- ✅ Boss encounter system
- ✅ Wild encounter rates
- ✅ Trainer battle system
- ✅ Environmental effects
- ✅ Weather system impact
- ✅ Arena/location effects

#### Save System
- ✅ Complete game state serialization
- ✅ Save file integrity validation
- ✅ Cross-session data persistence
- ✅ Settings and preferences
- ✅ Progress checkpoint system

### UI/UX Systems

#### Battle Interface
- [ ] Move selection interface
- [ ] Pokémon switching interface
- [ ] Item usage during battle
- [ ] Battle animations and effects
- [ ] Health bar animations
- [ ] Status condition indicators
- [ ] Turn order display

#### Menu Systems
- [ ] Main game menu
- [ ] Pokémon party management
- [ ] Bag/inventory interface
- [ ] Pokédex functionality
- [ ] Settings menu
- [ ] Save/load interface
- [ ] Achievement gallery

#### Visual Systems
- [ ] Pokémon sprites and animations
- [ ] Move effect animations
- [ ] UI responsive design
- [ ] Color scheme consistency
- [ ] Accessibility features
- [ ] Mobile interface adaptation

### Advanced Features

#### Game Modes
- [ ] Classic mode functionality
- [ ] Endless mode mechanics
- [ ] Challenge mode variations
- [ ] Daily run system
- [ ] Seed-based generation
- [ ] Custom difficulty settings

#### Multiplayer/Social
- [ ] Player comparison systems
- [ ] Leaderboard functionality
- [ ] Share functionality
- [ ] Tournament brackets
- [ ] Spectator mode foundation

#### Performance & Technical
- [ ] Memory optimization
- [ ] Load time optimization
- [ ] Error handling and recovery
- [ ] Cross-platform compatibility
- [ ] Offline functionality
- [ ] Data compression

### AO-Specific Features

#### Process Architecture
- [ ] Game state process design
- [ ] Battle resolution handlers
- [ ] Player action processors
- [ ] State synchronization
- [ ] Message queue management
- [ ] Process communication protocols

#### Agent Integration
- [ ] Agent action interfaces
- [ ] Autonomous decision-making hooks
- [ ] Agent vs human battle handling
- [ ] Spectator mode for agents
- [ ] Agent learning data collection
- [ ] Tournament automation

#### Permanence & Decentralization
- [ ] Permanent save implementation
- [ ] Cross-device access validation
- [ ] Backup and recovery systems
- [ ] Version migration handling
- [ ] Data integrity verification
- [ ] Decentralized hosting readiness

---

**Legend:**
- ✅ **Complete**: Fully implemented and tested
- 🔄 **In Progress**: Currently being developed
- [ ] **Pending**: Not yet started
- ❌ **Blocked**: Waiting on dependencies

## 🎮 Final Vision: Autonomous Agent Gaming

When fully deployed, PokéRogue AO will be the first roguelike where:

- **AI Agents Replace NPCs**: Autonomous agents battle as gym leaders, rivals, and wild encounters
- **Mixed Player Ecosystem**: Human players and AI agents compete in the same persistent world  
- **Agent Spectating**: Watch AI agents battle each other in real-time tournaments
- **Cross-Agent Learning**: Agents develop strategies by playing against other agents
- **Zero UI Dependency**: Agents interact purely through AO message protocols

## 🔧 Technical Architecture

**AO Process Migration**: All game logic runs as Lua handlers on AO processes
- Battle resolution, damage calculation, status effects
- Player state management and progression tracking  
- Item systems, shops, and inventory management
- World progression and encounter generation

**Message-Based Gameplay**: Every game action becomes an AO message
```lua
-- Example: Battle turn resolution
ao.send({
  Target = GameProcess,
  Action = "BattleTurn", 
  Data = { move: "tackle", target: "enemy" }
})
```

**Permanent Storage**: Game state persists permanently on Arweave
- Cross-device accessibility
- Zero save corruption
- Historical battle records
- Progression tracking across sessions

## 📚 Documentation

- **[Project Brief](./docs/brief.md)**: Complete migration strategy and vision
- **[PRD Documentation](./docs/prd/)**: Detailed technical specifications and epic breakdown
- **[Architecture Overview](./docs/architect-validation-report.md)**: Technical architecture and validation

## 🤝 Contributing to the AO Migration

We welcome contributions to this groundbreaking migration! Areas where help is needed:

- **TypeScript → Lua Migration**: Converting game mechanics to AO handlers
- **Testing Framework**: Ensuring functional parity between implementations  
- **Agent Development**: Creating autonomous agents for Phase 3
- **Documentation**: Helping document the migration process for other projects

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and development guidelines.

# 📝 Credits
>
> If this project contains assets you have produced and you do not see your name, **please** reach out, either [here on GitHub](https://github.com/pagefaultgames/pokerogue/issues/new) or via [Discord](https://discord.gg/pokerogue).

Thank you to all the wonderful people that have contributed to the PokéRogue project! You can find the credits [here](./CREDITS.md).
