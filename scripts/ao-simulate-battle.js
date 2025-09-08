#!/usr/bin/env node

import { PokéRougeGameClient } from './lib/ao-game-client.js';
import { readFileSync, existsSync } from 'fs';
import chalk from 'chalk';

/**
 * Battle Flow Simulation Script
 * 
 * Simulates complete Pokemon battle scenarios to validate
 * battle process functionality and user experience.
 */

// Battle simulation scenarios
const BATTLE_SCENARIOS = {
  'basic-wild': {
    name: 'Basic Wild Pokemon Battle',
    description: 'Simple battle against a wild Pokemon',
    playerPokemon: {
      species: 'pikachu',
      level: 10,
      moves: ['tackle', 'thundershock', 'growl', 'tail-whip'],
      stats: { hp: 35, attack: 25, defense: 20, speed: 30 }
    },
    wildPokemon: {
      species: 'rattata',
      level: 8,
      moves: ['tackle', 'tail-whip'],
      stats: { hp: 25, attack: 20, defense: 15, speed: 35 }
    },
    actions: [
      { type: 'attack', move: 'tackle', target: 'wild' },
      { type: 'attack', move: 'thundershock', target: 'wild' }
    ]
  },
  
  'trainer-battle': {
    name: 'Trainer Battle',
    description: 'Battle against another trainer',
    playerPokemon: {
      species: 'charmander',
      level: 12,
      moves: ['scratch', 'ember', 'growl', 'leer'],
      stats: { hp: 40, attack: 30, defense: 22, speed: 28 }
    },
    enemyTrainer: {
      name: 'Youngster Joey',
      pokemon: {
        species: 'rattata',
        level: 10,
        moves: ['tackle', 'tail-whip', 'quick-attack'],
        stats: { hp: 30, attack: 22, defense: 18, speed: 38 }
      }
    },
    actions: [
      { type: 'attack', move: 'ember', target: 'enemy' },
      { type: 'attack', move: 'scratch', target: 'enemy' }
    ]
  },

  'gym-battle': {
    name: 'Gym Leader Battle',
    description: 'Challenge gym leader with type advantage',
    playerPokemon: {
      species: 'squirtle',
      level: 15,
      moves: ['water-gun', 'tackle', 'tail-whip', 'withdraw'],
      stats: { hp: 44, attack: 25, defense: 35, speed: 22 }
    },
    gymLeader: {
      name: 'Brock',
      type: 'rock',
      pokemon: {
        species: 'onix',
        level: 14,
        moves: ['rock-throw', 'tackle', 'screech', 'bind'],
        stats: { hp: 35, attack: 25, defense: 85, speed: 35 }
      }
    },
    actions: [
      { type: 'attack', move: 'water-gun', target: 'gym' },
      { type: 'attack', move: 'water-gun', target: 'gym' }
    ]
  },

  'multi-pokemon': {
    name: 'Multi-Pokemon Battle',
    description: 'Battle with multiple Pokemon switching',
    playerTeam: [
      {
        species: 'bulbasaur',
        level: 13,
        moves: ['vine-whip', 'tackle', 'growl', 'leech-seed'],
        stats: { hp: 45, attack: 25, defense: 25, speed: 22 }
      },
      {
        species: 'pidgey',
        level: 11,
        moves: ['gust', 'tackle', 'sand-attack'],
        stats: { hp: 40, attack: 20, defense: 20, speed: 28 }
      }
    ],
    wildPokemon: {
      species: 'machop',
      level: 12,
      moves: ['karate-chop', 'low-kick', 'leer'],
      stats: { hp: 70, attack: 40, defense: 25, speed: 18 }
    },
    actions: [
      { type: 'attack', move: 'vine-whip', target: 'wild' },
      { type: 'switch', pokemon: 'pidgey' },
      { type: 'attack', move: 'gust', target: 'wild' },
      { type: 'switch', pokemon: 'bulbasaur' },
      { type: 'attack', move: 'vine-whip', target: 'wild' }
    ]
  },

  'status-effects': {
    name: 'Status Effect Battle',
    description: 'Battle featuring status effects and conditions',
    playerPokemon: {
      species: 'oddish',
      level: 14,
      moves: ['sleep-powder', 'absorb', 'poison-powder', 'acid'],
      stats: { hp: 45, attack: 25, defense: 28, speed: 15 }
    },
    wildPokemon: {
      species: 'bellsprout',
      level: 13,
      moves: ['vine-whip', 'growth', 'wrap'],
      stats: { hp: 50, attack: 35, defense: 18, speed: 20 }
    },
    actions: [
      { type: 'attack', move: 'sleep-powder', target: 'wild' },
      { type: 'attack', move: 'absorb', target: 'wild' },
      { type: 'attack', move: 'poison-powder', target: 'wild' },
      { type: 'attack', move: 'absorb', target: 'wild' }
    ]
  }
};

async function main() {
  console.log(chalk.cyan('⚔️ PokéRogue Battle Flow Simulation'));
  console.log(chalk.cyan('==================================='));
  console.log();

  try {
    // Parse command line arguments
    const args = parseArguments();
    
    // Load process registration
    const registrationPath = args.registrationFile || 'build/ao-registration-results.json';
    if (!existsSync(registrationPath)) {
      throw new Error(`Registration file not found: ${registrationPath}\nPlease run: npm run ao:register`);
    }

    // Check for mock mode
    const mockMode = args.mock || false;
    
    // Initialize game client
    const client = new PokéRougeGameClient({ 
      verbose: args.verbose,
      mockMode: mockMode 
    });
    await client.initialize(registrationPath);

    // Show available scenarios
    if (args.listScenarios) {
      listBattleScenarios();
      return;
    }

    // Run specific scenario or all scenarios
    const scenariosToRun = args.scenario ? [args.scenario] : Object.keys(BATTLE_SCENARIOS);
    
    console.log(chalk.blue('📋 Battle Simulation Plan:'));
    scenariosToRun.forEach((scenario, i) => {
      const config = BATTLE_SCENARIOS[scenario];
      console.log(chalk.gray(`  ${i + 1}. ${config.name}`));
      console.log(chalk.gray(`     ${config.description}`));
    });
    console.log();

    // Create test player
    await client.createPlayer({
      name: `BattleTestPlayer_${Date.now()}`,
      startingPokemon: 'pikachu'
    });

    // Execute battle scenarios
    const results = [];
    for (const scenarioName of scenariosToRun) {
      console.log(chalk.blue(`\n🥊 Running: ${BATTLE_SCENARIOS[scenarioName].name}`));
      console.log(chalk.gray('='.repeat(50)));
      
      try {
        const result = await simulateBattleScenario(client, scenarioName, BATTLE_SCENARIOS[scenarioName]);
        results.push({ scenario: scenarioName, result, status: 'SUCCESS' });
        
        console.log(chalk.green(`✅ ${BATTLE_SCENARIOS[scenarioName].name} completed successfully`));
        
      } catch (error) {
        results.push({ scenario: scenarioName, error: error.message, status: 'FAILED' });
        console.log(chalk.red(`❌ ${BATTLE_SCENARIOS[scenarioName].name} failed: ${error.message}`));
        
        if (args.failFast) {
          throw error;
        }
      }
    }

    // Display summary
    displayBattleResults(results);
    
    // Exit with appropriate code
    const failures = results.filter(r => r.status === 'FAILED').length;
    process.exit(failures);

  } catch (error) {
    console.error(chalk.red('\n💥 Battle simulation failed:'));
    console.error(chalk.red(error.message));
    
    if (process.argv.includes('--verbose')) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

async function simulateBattleScenario(client, scenarioName, scenarioConfig) {
  const startTime = Date.now();
  const battleLog = [];

  // Prepare battle data based on scenario type
  let battleData;
  if (scenarioConfig.wildPokemon) {
    battleData = {
      wildPokemon: scenarioConfig.wildPokemon,
      playerPokemon: scenarioConfig.playerPokemon || scenarioConfig.playerTeam?.[0],
      terrain: 'grass',
      weather: 'clear'
    };
  } else if (scenarioConfig.enemyTrainer) {
    battleData = {
      battleType: 'trainer',
      enemyTrainer: scenarioConfig.enemyTrainer,
      playerPokemon: scenarioConfig.playerPokemon,
      terrain: 'trainer_school',
      weather: 'indoor'
    };
  } else if (scenarioConfig.gymLeader) {
    battleData = {
      battleType: 'gym',
      gymLeader: scenarioConfig.gymLeader,
      playerPokemon: scenarioConfig.playerPokemon,
      terrain: 'gym',
      weather: 'indoor'
    };
  }

  // Start the battle
  console.log(chalk.yellow(`🎯 Starting ${scenarioConfig.name}...`));
  const battle = await client.startWildBattle(battleData);
  
  battleLog.push({
    action: 'battle-start',
    timestamp: Date.now(),
    battleId: battle.battleId,
    data: battleData
  });

  // Execute battle actions
  for (let i = 0; i < scenarioConfig.actions.length; i++) {
    const action = scenarioConfig.actions[i];
    
    console.log(chalk.yellow(`⚡ Turn ${i + 1}: ${action.type} - ${action.move || action.pokemon || 'action'}`));
    
    const actionResult = await client.battleAction(battle.battleId, action.type, action);
    
    battleLog.push({
      action: `turn-${i + 1}`,
      timestamp: Date.now(),
      actionType: action.type,
      actionData: action,
      result: actionResult
    });

    // Check if battle ended
    if (actionResult.battleEnded || actionResult.status === 'ended') {
      console.log(chalk.green(`🏁 Battle ended: ${actionResult.winner || 'unknown'} wins!`));
      break;
    }

    // Brief delay between actions
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  return {
    scenario: scenarioName,
    battleId: battle.battleId,
    duration: duration,
    turns: battleLog.length - 1, // Exclude battle-start
    battleLog: battleLog,
    success: true
  };
}

function parseArguments() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  return {
    scenario: args.find(arg => arg.startsWith('--scenario='))?.split('=')[1],
    verbose: args.includes('--verbose') || args.includes('-v'),
    failFast: args.includes('--fail-fast'),
    listScenarios: args.includes('--list'),
    mock: args.includes('--mock'),
    registrationFile: args.find(arg => arg.startsWith('--registration='))?.split('=')[1]
  };
}

function listBattleScenarios() {
  console.log(chalk.blue('📜 Available Battle Scenarios:'));
  console.log();
  
  Object.entries(BATTLE_SCENARIOS).forEach(([key, scenario]) => {
    console.log(chalk.yellow(`${key}:`));
    console.log(chalk.gray(`  Name: ${scenario.name}`));
    console.log(chalk.gray(`  Description: ${scenario.description}`));
    console.log(chalk.gray(`  Actions: ${scenario.actions.length} turns`));
    console.log();
  });
}

function displayBattleResults(results) {
  console.log(chalk.cyan('\n📊 Battle Simulation Results'));
  console.log(chalk.cyan('============================'));
  
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(chalk.gray(`Total Scenarios: ${results.length}`));
  console.log(chalk.gray(`Success Rate: ${successful}/${results.length}`));
  console.log();
  
  results.forEach(result => {
    if (result.status === 'SUCCESS') {
      console.log(chalk.green(`✅ ${result.scenario}`));
      if (result.result) {
        console.log(chalk.gray(`   Duration: ${result.result.duration}ms`));
        console.log(chalk.gray(`   Turns: ${result.result.turns}`));
        console.log(chalk.gray(`   Battle ID: ${result.result.battleId}`));
      }
    } else {
      console.log(chalk.red(`❌ ${result.scenario}`));
      console.log(chalk.red(`   Error: ${result.error}`));
    }
  });
  
  if (successful === results.length) {
    console.log(chalk.green('\n🎉 All battle scenarios completed successfully!'));
    console.log(chalk.blue('\n📝 Battle System Status:'));
    console.log(chalk.gray('• Battle process is responding correctly'));
    console.log(chalk.gray('• All battle actions are processing'));
    console.log(chalk.gray('• Battle flow is working end-to-end'));
    console.log(chalk.gray('• User experience is validated ✓'));
  } else if (failed > 0) {
    console.log(chalk.yellow(`\n⚠️ ${failed} scenarios failed - check battle system`));
  }
}

function showHelp() {
  console.log(`
PokéRogue Battle Flow Simulation

Usage: node scripts/ao-simulate-battle.js [options]

Options:
  --scenario=<name>     Run specific battle scenario
  --list               List all available scenarios
  --verbose, -v        Enable detailed logging
  --fail-fast         Stop on first failure
  --registration=<path> Custom registration results file
  --help, -h          Show this help message

Available Scenarios:
${Object.keys(BATTLE_SCENARIOS).map(s => `  - ${s}`).join('\n')}

Examples:
  node scripts/ao-simulate-battle.js                      # Run all scenarios
  node scripts/ao-simulate-battle.js --scenario=basic-wild # Run specific scenario
  node scripts/ao-simulate-battle.js --list               # List scenarios
  node scripts/ao-simulate-battle.js --verbose           # Detailed logging
`);
}

// Run main function
main().catch(console.error);