# PokéRogue AO: Deployment & Gameplay Guide

Complete guide for deploying PokéRogue AO processes and starting your first game session.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Building Processes](#building-processes) 
3. [Deployment Methods](#deployment-methods)
4. [Process Dependencies](#process-dependencies)
5. [Starting Your First Game](#starting-your-first-game)
6. [Gameplay Examples](#gameplay-examples)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Usage](#advanced-usage)

---

## Prerequisites

### Required Tools

**Install AOS CLI:**
```bash
npm install -g @permaweb/aos
```

**Install Permamind (recommended for gameplay):**
```bash
npm install -g @permaweb/permamind
```

**Verify installations:**
```bash
aos --version
npx permamind --version
```

### Wallet Setup

Ensure you have an Arweave wallet with AR tokens for process deployment and message sending.

---

## Building Processes

### 1. Build All Processes

```bash
npm run ao:build
```

This creates bundled Lua files in the `build/` directory:
- `coordinator-process.lua`
- `admin-process.lua` 
- `security-process.lua`
- `battle-process.lua`
- `pokemon-process.lua`
- `economy-process.lua`

### 2. Validate Build

```bash
npm run ao:validate:build
```

Verify all process bundles are valid and ready for deployment.

---

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

**Deploy all processes in correct order:**
```bash
npm run ao:deploy
```

This handles dependency order and process registration automatically.

**Check deployment status:**
```bash
cat build/deployment-manifest.json | jq '.processes[] | {name: .name, id: .processId, status: .status}'
```

### Method 2: Manual Deployment

**Deploy in dependency order:**

```bash
# 1. Deploy coordinator (foundation process)
aos coordinator-process --load build/coordinator-process.lua

# 2. Deploy admin (monitoring)
aos admin-process --load build/admin-process.lua

# 3. Deploy security (anti-cheat)  
aos security-process --load build/security-process.lua

# 4. Deploy dependent processes
aos battle-process --load build/battle-process.lua
aos pokemon-process --load build/pokemon-process.lua  
aos economy-process --load build/economy-process.lua
```

**Get process IDs:**
```bash
# Connect to each process to get its ID
aos coordinator-process
# In the AOS shell:
ao.id
# Exit and repeat for other processes
```

### Method 3: Single Process Deployment

**Deploy one process at a time:**
```bash
npm run ao:deploy:single coordinator
npm run ao:deploy:single admin
npm run ao:deploy:single battle
# etc.
```

---

## Process Dependencies

### Dependency Tree

```
coordinator (standalone) ← Required first
├── battle (depends on coordinator)
├── pokemon (depends on coordinator) 
├── economy (depends on coordinator)
└── security (depends on coordinator)
admin (standalone) ← Monitors all processes
```

### Inter-Process Registration

After deployment, processes automatically register with the coordinator:

```bash
# Verify process registration
aos coordinator-process
.editor
print(json.encode(coordinatorState.processRegistry))
```

---

## Starting Your First Game

### Option 1: Using Permamind (Easiest)

**1. Get your coordinator process ID:**
```bash
cat build/deployment-manifest.json | jq -r '.processes[] | select(.name == "coordinator") | .processId'
```

**2. Start a new game:**
```bash
# Replace COORDINATOR_ID with actual process ID
npx permamind executeAction --target COORDINATOR_ID --action StartGame --data '{"starter": "charmander"}'
```

**3. Check game state:**
```bash
npx permamind executeAction --target COORDINATOR_ID --action GetGameState
```

### Option 2: Using AOS CLI

**1. Connect to coordinator:**
```bash
aos coordinator-process
```

**2. In the AOS shell, start game:**
```lua
Send({
    Target = ao.id,
    Action = "StartGame", 
    Data = json.encode({
        starter = "bulbasaur"
    })
})
```

**3. Check for response:**
```lua
Inbox[#Inbox]
```

### Option 3: Pure AO Messages with Dry Runs

**1. Test with dry run first:**
```bash
ao dry-run COORDINATOR_ID --data '{"starter": "squirtle"}' --tags Action=StartGame
```

**2. If dry run succeeds, send actual message:**
```bash
ao send COORDINATOR_ID --data '{"starter": "squirtle"}' --tags Action=StartGame
```

**3. Get result:**
```bash
ao result MESSAGE_ID
```

---

## Gameplay Examples

### Basic Game Flow

**1. Start Game:**
```bash
npx permamind executeAction --target COORDINATOR_ID --action StartGame --data '{
    "starter": "charmander",
    "difficulty": "normal",
    "playerName": "Trainer"
}'
```

**2. Enter First Battle:**
```bash
npx permamind executeAction --target COORDINATOR_ID --action StartWildEncounter --data '{
    "biome": "town", 
    "wave": 1
}'
```

**3. Use Move in Battle:**
```bash
npx permamind executeAction --target BATTLE_ID --action UseMove --data '{
    "moveIndex": 0,
    "targetIndex": 0
}'
```

**4. Use Item:**
```bash
npx permamind executeAction --target COORDINATOR_ID --action UseItem --data '{
    "itemId": "potion",
    "targetPokemonIndex": 0
}'
```

**5. Catch Pokemon:**
```bash
npx permamind executeAction --target COORDINATOR_ID --action ThrowPokeball --data '{
    "ballType": "pokeball"
}'
```

### Battle Commands

```bash
# Attack with move
npx permamind executeAction --target BATTLE_ID --action UseMove --data '{"moveIndex": 0}'

# Switch Pokemon  
npx permamind executeAction --target BATTLE_ID --action SwitchPokemon --data '{"pokemonIndex": 1}'

# Use battle item
npx permamind executeAction --target BATTLE_ID --action UseBattleItem --data '{"itemId": "x-attack"}'

# Run from battle
npx permamind executeAction --target BATTLE_ID --action RunFromBattle
```

### Inventory Management

```bash
# Check inventory
npx permamind executeAction --target COORDINATOR_ID --action GetInventory

# Buy item from shop
npx permamind executeAction --target ECONOMY_ID --action PurchaseItem --data '{
    "itemId": "great-ball",
    "quantity": 5
}'

# Sell item
npx permamind executeAction --target ECONOMY_ID --action SellItem --data '{
    "itemId": "nugget", 
    "quantity": 1
}'
```

### Pokemon Management

```bash
# View party
npx permamind executeAction --target POKEMON_ID --action GetParty

# View PC boxes  
npx permamind executeAction --target POKEMON_ID --action GetPCBoxes

# Deposit pokemon
npx permamind executeAction --target POKEMON_ID --action DepositPokemon --data '{
    "partyIndex": 1,
    "boxIndex": 0
}'

# Withdraw pokemon
npx permamind executeAction --target POKEMON_ID --action WithdrawPokemon --data '{
    "boxIndex": 0,
    "boxSlot": 5,
    "partyIndex": 1
}'
```

---

## Troubleshooting

### Common Issues

**1. Process Not Responding**
```bash
# Check process status
aos PROCESS_ID
Info

# Check process messages
npx permamind queryAOProcessMessages --processId PROCESS_ID
```

**2. Inter-Process Communication Fails**
```bash
# Verify process registration
aos coordinator-process
.editor
print(json.encode(coordinatorState.processRegistry))

# Re-register process if needed
Send({Target = "COORDINATOR_ID", Action = "RegisterProcess"})
```

**3. Battle Not Starting**
```bash
# Check battle process status
npx permamind executeAction --target BATTLE_ID --action GetBattleStatus

# Check coordinator battle routing
npx permamind executeAction --target COORDINATOR_ID --action GetActiveBattles
```

**4. Game State Issues**
```bash
# Reset game state (WARNING: loses progress)
npx permamind executeAction --target COORDINATOR_ID --action ResetGameState

# Get debug info
npx permamind executeAction --target COORDINATOR_ID --action GetDebugInfo
```

### Deployment Issues

**Bundle file not found:**
```bash
# Rebuild processes
npm run ao:clean
npm run ao:build
```

**Deployment timeout:**
```bash
# Try single process deployment
npm run ao:deploy:single coordinator
# Then manually deploy others
```

**Process registration failures:**
```bash
# Check admin process status
npx permamind executeAction --target ADMIN_ID --action GetSystemHealth

# Manually register processes
aos coordinator-process
Send({Target = "ADMIN_ID", Action = "RegisterWithAdmin"})
```

---

## Advanced Usage

### Development Mode

**Deploy development versions:**
```bash
npm run ao:build:dev
npm run ao:deploy
```

### Testing Deployment

**Run comprehensive tests:**
```bash
npm run ao:test:comprehensive
npm run ao:validate
```

### Process Monitoring

**Check system health:**
```bash
npx permamind executeAction --target ADMIN_ID --action GetSystemHealth
```

**Monitor performance:**
```bash
npx permamind executeAction --target ADMIN_ID --action GetPerformanceMetrics
```

### Rollback Deployment

**If deployment fails:**
```bash
npm run ao:rollback
```

### Custom Configuration

**Configure process parameters:**
```bash
# Set battle process concurrent capacity
npx permamind executeAction --target BATTLE_ID --action ConfigureCapacity --data '{"maxConcurrentBattles": 50}'

# Configure economy prices
npx permamind executeAction --target ECONOMY_ID --action UpdatePricing --data '{"itemId": "pokeball", "price": 200}'
```

---

## Message Protocol Reference

### Standard Message Format

```json
{
  "action": "ActionName",
  "data": {
    "parameter1": "value1",
    "parameter2": "value2"
  },
  "sessionId": "optional-session-id",
  "timestamp": "optional-timestamp"
}
```

### Common Actions

| Action | Target | Data | Description |
|--------|---------|------|-------------|
| `StartGame` | Coordinator | `{starter, difficulty, playerName}` | Initialize new game |
| `UseMove` | Battle | `{moveIndex, targetIndex}` | Use move in battle |
| `GetGameState` | Coordinator | `{}` | Get current game state |
| `PurchaseItem` | Economy | `{itemId, quantity}` | Buy items from shop |
| `GetParty` | Pokemon | `{}` | View current party |

### Response Format

```json
{
  "success": true,
  "action": "ActionName", 
  "data": {
    "result": "action-specific-data"
  },
  "processId": "process-that-handled-request",
  "timestamp": "response-timestamp"
}
```

---

## Support

**For issues:**
- Check the deployment logs in `build/deployment.log`
- Run diagnostic commands in the troubleshooting section
- Review process messages using `npx permamind queryAOProcessMessages`

**For development:**
- Use `npm run ao:test` to run comprehensive tests
- Monitor system health with admin process
- Check the multi-process deployment documentation

**Community:**
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Discord: [Community Discord](https://discord.gg/your-discord)

---

*This guide covers PokéRogue AO deployment and gameplay. For advanced topics, see the full documentation in the `docs/` directory.*