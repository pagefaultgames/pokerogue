#!/usr/bin/env node

import { message, result, connect } from '@permaweb/aoconnect';
import chalk from 'chalk';

/**
 * AO Game Client Library
 * 
 * Provides a high-level client interface for interacting with
 * PokéRogue AO processes, simulating real player actions.
 */

// Default AO configuration
const DEFAULT_AO_CONFIG = {
  MU_URL: "https://mu.ao-testnet.xyz",
  CU_URL: "https://cu.ao-testnet.xyz",
  GATEWAY_URL: "https://arweave.net"
};

export class PokéRougeGameClient {
  constructor(config = {}) {
    this.config = { ...DEFAULT_AO_CONFIG, ...config };
    this.mockMode = config.mockMode || false;
    
    // Initialize AO connection (skip in mock mode)
    if (!this.mockMode) {
      this.ao = connect(this.config);
    }
    
    this.processes = {};
    this.player = {
      id: null,
      wallet: null,
      pokemon: [],
      inventory: {},
      stats: {
        battlesWon: 0,
        battlesLost: 0,
        pokemonCaught: 0
      }
    };
    this.verbose = config.verbose || false;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Initialize client by loading process registry
   */
  async initialize(registrationResults) {
    this.log('🎮 Initializing PokéRogue Game Client...', 'info');
    
    if (typeof registrationResults === 'string') {
      // Load from file path
      const fs = await import('fs');
      registrationResults = JSON.parse(fs.readFileSync(registrationResults, 'utf8'));
    }
    
    this.processes = registrationResults.processes || {};
    
    this.log(`Connected to ${Object.keys(this.processes).length} processes:`, 'info');
    Object.entries(this.processes).forEach(([name, id]) => {
      this.log(`  ${name}: ${id}`, 'debug');
    });
    
    // Set player ID (can be overridden)
    this.player.id = this.config.playerId || `player_${Date.now()}`;
    
    this.log(`Player ID: ${this.player.id}`, 'info');
    return this;
  }

  /**
   * Send message to a specific process
   */
  async sendToProcess(processName, action, data = {}, additionalTags = []) {
    const processId = this.processes[processName];
    if (!processId) {
      throw new Error(`Process not found: ${processName}`);
    }

    this.log(`📤 Sending ${action} to ${processName}...`, 'debug');

    // Mock mode for testing
    if (this.mockMode) {
      await this.delay(200); // Simulate network delay
      
      // Generate mock responses based on action
      const mockResponse = this.generateMockResponse(processName, action, data);
      
      this.log(`📥 [MOCK] Response from ${processName}: ${mockResponse.status}`, 'debug');
      return {
        Output: {
          data: {
            output: JSON.stringify(mockResponse)
          }
        }
      };
    }

    const tags = [
      { name: 'Action', value: action },
      { name: 'Player-ID', value: this.player.id },
      { name: 'Timestamp', value: Date.now().toString() },
      ...additionalTags
    ];

    const messageId = await message({
      process: processId,
      tags: tags,
      data: JSON.stringify(data)
    });

    // Wait for result
    const res = await result({
      message: messageId,
      process: processId
    });

    if (res.Error) {
      throw new Error(`${processName} error: ${res.Error}`);
    }

    this.log(`📥 Response from ${processName}: ${res.Output?.data?.output || 'OK'}`, 'debug');
    return res;
  }

  /**
   * Create a new player account
   */
  async createPlayer(playerData = {}) {
    this.log('👤 Creating new player account...', 'info');
    
    const newPlayer = {
      id: this.player.id,
      name: playerData.name || `Player_${Math.random().toString(36).substr(2, 8)}`,
      startingPokemon: playerData.startingPokemon || 'pikachu',
      difficulty: playerData.difficulty || 'normal',
      createdAt: new Date().toISOString(),
      ...playerData
    };

    try {
      const response = await this.sendToProcess('admin', 'Create-Player', newPlayer);
      
      this.player = { ...this.player, ...newPlayer };
      this.log(`✅ Player created: ${this.player.name}`, 'success');
      
      return response;
    } catch (error) {
      this.log(`❌ Failed to create player: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Get player's Pokemon party
   */
  async getPokemonParty() {
    this.log('🐾 Retrieving Pokemon party...', 'info');
    
    try {
      const response = await this.sendToProcess('pokemon', 'Get-Pokemon', {
        playerId: this.player.id,
        type: 'party'
      });
      
      if (response.Output?.data?.output) {
        const partyData = JSON.parse(response.Output.data.output);
        this.player.pokemon = partyData.pokemon || [];
        
        this.log(`Retrieved ${this.player.pokemon.length} Pokemon`, 'success');
        return this.player.pokemon;
      }
      
      return [];
    } catch (error) {
      this.log(`❌ Failed to get Pokemon: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Start a wild Pokemon battle
   */
  async startWildBattle(options = {}) {
    this.log('⚔️ Starting wild Pokemon battle...', 'info');
    
    const battleData = {
      playerId: this.player.id,
      battleType: 'wild',
      wildPokemon: options.wildPokemon || {
        species: 'rattata',
        level: options.level || Math.floor(Math.random() * 10) + 1
      },
      playerPokemon: options.playerPokemon || this.player.pokemon[0],
      terrain: options.terrain || 'grass',
      weather: options.weather || 'clear'
    };

    try {
      const response = await this.sendToProcess('battle', 'Start-Battle', battleData);
      
      if (response.Output?.data?.output) {
        const battleResult = JSON.parse(response.Output.data.output);
        
        this.log(`🎯 Battle started: ${battleResult.battleId}`, 'success');
        this.log(`Wild ${battleData.wildPokemon.species} (Level ${battleData.wildPokemon.level}) appeared!`, 'info');
        
        return battleResult;
      }
      
      throw new Error('No battle data returned');
    } catch (error) {
      this.log(`❌ Failed to start battle: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Execute a battle action (attack, switch, item, run)
   */
  async battleAction(battleId, action, actionData = {}) {
    this.log(`⚡ Executing battle action: ${action}...`, 'info');
    
    const battleActionData = {
      battleId: battleId,
      playerId: this.player.id,
      action: action,
      actionData: actionData,
      timestamp: Date.now()
    };

    try {
      const response = await this.sendToProcess('battle', 'Battle-Action', battleActionData);
      
      if (response.Output?.data?.output) {
        const result = JSON.parse(response.Output.data.output);
        
        this.log(`💥 Action result: ${result.result || 'processed'}`, 'success');
        return result;
      }
      
      return { status: 'processed' };
    } catch (error) {
      this.log(`❌ Battle action failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Visit the Pokemon shop
   */
  async visitShop(shopType = 'pokemart') {
    this.log('🏪 Visiting Pokemon shop...', 'info');
    
    try {
      const response = await this.sendToProcess('economy', 'Get-Shop-Items', {
        shopType: shopType,
        playerId: this.player.id
      });
      
      if (response.Output?.data?.output) {
        const shopData = JSON.parse(response.Output.data.output);
        
        this.log(`🛍️ Shop loaded with ${shopData.items?.length || 0} items`, 'success');
        return shopData;
      }
      
      return { items: [], lastUpdated: new Date().toISOString() };
    } catch (error) {
      this.log(`❌ Failed to visit shop: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Purchase an item from shop
   */
  async purchaseItem(itemId, quantity = 1) {
    this.log(`💰 Purchasing ${quantity}x ${itemId}...`, 'info');
    
    const purchaseData = {
      playerId: this.player.id,
      itemId: itemId,
      quantity: quantity,
      timestamp: Date.now()
    };

    try {
      const response = await this.sendToProcess('economy', 'Purchase-Item', purchaseData, [
        { name: 'Item-ID', value: itemId },
        { name: 'Quantity', value: quantity.toString() }
      ]);
      
      if (response.Output?.data?.output) {
        const transaction = JSON.parse(response.Output.data.output);
        
        this.log(`✅ Purchase complete: ${transaction.itemId} x${transaction.quantity}`, 'success');
        return transaction;
      }
      
      return purchaseData;
    } catch (error) {
      this.log(`❌ Purchase failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Get player inventory
   */
  async getInventory() {
    this.log('🎒 Checking inventory...', 'info');
    
    try {
      const response = await this.sendToProcess('economy', 'Get-Inventory', {
        playerId: this.player.id
      });
      
      if (response.Output?.data?.output) {
        const inventory = JSON.parse(response.Output.data.output);
        this.player.inventory = inventory;
        
        const itemCount = Object.keys(inventory).length;
        this.log(`📦 Inventory loaded: ${itemCount} item types`, 'success');
        
        return inventory;
      }
      
      return {};
    } catch (error) {
      this.log(`❌ Failed to get inventory: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Evolve a Pokemon
   */
  async evolvePokemon(pokemonId, evolutionMethod = 'level') {
    this.log(`🌟 Attempting to evolve Pokemon ${pokemonId}...`, 'info');
    
    const evolutionData = {
      playerId: this.player.id,
      pokemonId: pokemonId,
      method: evolutionMethod,
      timestamp: Date.now()
    };

    try {
      const response = await this.sendToProcess('pokemon', 'Evolve-Pokemon', evolutionData);
      
      if (response.Output?.data?.output) {
        const evolutionResult = JSON.parse(response.Output.data.output);
        
        if (evolutionResult.success) {
          this.log(`🎉 Evolution successful: ${evolutionResult.fromSpecies} → ${evolutionResult.toSpecies}`, 'success');
        } else {
          this.log(`⚠️ Evolution failed: ${evolutionResult.reason}`, 'warn');
        }
        
        return evolutionResult;
      }
      
      return { success: false, reason: 'No response' };
    } catch (error) {
      this.log(`❌ Evolution failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Get system status from admin
   */
  async getSystemStatus() {
    this.log('📊 Checking system status...', 'info');
    
    try {
      const response = await this.sendToProcess('admin', 'System-Status', {
        requestedBy: this.player.id
      });
      
      if (response.Output?.data?.output) {
        const status = JSON.parse(response.Output.data.output);
        
        this.log(`🟢 System Status: ${status.systemHealth}`, 'success');
        return status;
      }
      
      return { systemHealth: 'UNKNOWN' };
    } catch (error) {
      this.log(`❌ Failed to get system status: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Simulate a complete game session
   */
  async simulateGameSession(sessionConfig = {}) {
    this.log('🎮 Starting complete game session simulation...', 'info');
    
    const session = {
      startTime: Date.now(),
      actions: [],
      results: {},
      errors: []
    };

    try {
      // 1. Create player
      this.log('1️⃣ Creating player...', 'info');
      const playerResult = await this.createPlayer(sessionConfig.player);
      session.actions.push({ action: 'create-player', result: 'success' });

      // 2. Get initial Pokemon
      this.log('2️⃣ Getting starting Pokemon...', 'info');
      const pokemon = await this.getPokemonParty();
      session.actions.push({ action: 'get-pokemon', result: 'success', count: pokemon.length });

      // 3. Visit shop
      this.log('3️⃣ Visiting shop...', 'info');
      const shopData = await this.visitShop();
      session.actions.push({ action: 'visit-shop', result: 'success', items: shopData.items?.length || 0 });

      // 4. Start a battle
      this.log('4️⃣ Starting wild battle...', 'info');
      const battle = await this.startWildBattle(sessionConfig.battle);
      session.actions.push({ action: 'start-battle', result: 'success', battleId: battle.battleId });

      // 5. Execute battle actions
      this.log('5️⃣ Fighting wild Pokemon...', 'info');
      const attackResult = await this.battleAction(battle.battleId, 'attack', {
        moveId: 'tackle',
        targetId: 'wild'
      });
      session.actions.push({ action: 'battle-attack', result: 'success' });

      // 6. Check system status
      this.log('6️⃣ Checking system health...', 'info');
      const systemStatus = await this.getSystemStatus();
      session.actions.push({ action: 'system-status', result: 'success', health: systemStatus.systemHealth });

      session.endTime = Date.now();
      session.duration = session.endTime - session.startTime;
      session.results.success = true;

      this.log(`✅ Game session completed successfully in ${session.duration}ms`, 'success');
      return session;

    } catch (error) {
      session.errors.push({
        timestamp: Date.now(),
        error: error.message,
        action: session.actions[session.actions.length - 1]?.action || 'unknown'
      });
      
      session.endTime = Date.now();
      session.duration = session.endTime - session.startTime;
      session.results.success = false;

      this.log(`❌ Game session failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Utility functions
   */
  log(message, level = 'info') {
    if (!this.verbose && level === 'debug') return;

    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red,
      debug: chalk.gray
    };

    const color = colors[level] || chalk.white;
    const timestamp = new Date().toISOString().substring(11, 23);
    
    console.log(`${chalk.gray(timestamp)} ${color(`[${level.toUpperCase()}]`)} ${message}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateMockResponse(processName, action, data) {
    // Generate realistic mock responses based on process and action
    switch (processName) {
      case 'admin':
        if (action === 'Create-Player') {
          return { status: 'created', playerId: data.id, name: data.name };
        }
        if (action === 'System-Status') {
          return { systemHealth: 'HEALTHY', processCount: 6, maintenance: false };
        }
        break;

      case 'pokemon':
        if (action === 'Get-Pokemon') {
          return { pokemon: [{ species: 'pikachu', level: 10, hp: 35, moves: ['thundershock', 'growl'] }] };
        }
        if (action === 'Evolve-Pokemon') {
          return { success: true, fromSpecies: 'pikachu', toSpecies: 'raichu' };
        }
        break;

      case 'battle':
        if (action === 'Start-Battle') {
          return { battleId: `mock_battle_${Date.now()}`, status: 'started', terrain: data.terrain };
        }
        if (action === 'Battle-Action') {
          return { battleId: data.battleId, result: 'hit', damage: 15, status: 'ongoing' };
        }
        break;

      case 'economy':
        if (action === 'Get-Shop-Items') {
          return { items: [{ id: 'pokeball', price: 200 }, { id: 'potion', price: 300 }] };
        }
        if (action === 'Purchase-Item') {
          return { success: true, itemId: data.itemId, quantity: data.quantity, totalCost: 200 };
        }
        break;

      case 'security':
        if (action === 'Validate-Action') {
          return { valid: true, violations: [], actionId: data.actionId };
        }
        break;

      default:
        return { status: 'processed', action: action, timestamp: Date.now() };
    }

    return { status: 'processed', action: action, timestamp: Date.now() };
  }

  /**
   * Get current player state
   */
  getPlayerState() {
    return {
      ...this.player,
      connectedProcesses: Object.keys(this.processes).length,
      lastAction: Date.now()
    };
  }

  /**
   * Reset player state for new session
   */
  resetPlayer(playerId = null) {
    this.player = {
      id: playerId || `player_${Date.now()}`,
      wallet: null,
      pokemon: [],
      inventory: {},
      stats: {
        battlesWon: 0,
        battlesLost: 0,
        pokemonCaught: 0
      }
    };
  }
}

export default PokéRougeGameClient;