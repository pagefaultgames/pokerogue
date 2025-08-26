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
- 🔄 Testing framework for functional parity validation

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
