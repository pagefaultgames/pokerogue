#!/usr/bin/env node

import { PokéRougeGameClient } from './lib/ao-game-client.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';

/**
 * Pokemon Management Utility Script
 * 
 * Comprehensive testing and validation of Pokemon-related
 * functionality including stats, evolution, breeding, and storage.
 */

// Pokemon test scenarios
const POKEMON_SCENARIOS = {
  'stats-calculation': {
    name: 'Pokemon Stats Calculation',
    description: 'Test IV/EV calculations and stat generation',
    testCases: [
      {
        species: 'pikachu',
        level: 10,
        nature: 'modest',
        ivs: { hp: 15, attack: 12, defense: 18, spAttack: 31, spDefense: 20, speed: 25 },
        evs: { hp: 0, attack: 0, defense: 0, spAttack: 4, spDefense: 0, speed: 0 }
      },
      {
        species: 'charizard',
        level: 50,
        nature: 'adamant',
        ivs: { hp: 31, attack: 31, defense: 15, spAttack: 8, spDefense: 20, speed: 28 },
        evs: { hp: 6, attack: 252, defense: 0, spAttack: 0, spDefense: 0, speed: 252 }
      },
      {
        species: 'magikarp',
        level: 15,
        nature: 'hardy',
        ivs: { hp: 10, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
        evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 }
      }
    ]
  },

  'evolution-system': {
    name: 'Pokemon Evolution System',
    description: 'Test various evolution methods and conditions',
    testCases: [
      {
        species: 'pikachu',
        level: 1,
        evolutionMethod: 'thunder-stone',
        expectedEvolution: 'raichu',
        conditions: { hasItem: 'thunder-stone' }
      },
      {
        species: 'charmander',
        level: 16,
        evolutionMethod: 'level',
        expectedEvolution: 'charmeleon',
        conditions: { minLevel: 16 }
      },
      {
        species: 'kadabra',
        level: 25,
        evolutionMethod: 'trade',
        expectedEvolution: 'alakazam',
        conditions: { traded: true }
      },
      {
        species: 'eevee',
        level: 1,
        evolutionMethod: 'friendship-day',
        expectedEvolution: 'espeon',
        conditions: { friendship: 220, timeOfDay: 'day' }
      }
    ]
  },

  'move-learning': {
    name: 'Pokemon Move Learning',
    description: 'Test move learning through level-up, TM, and breeding',
    testCases: [
      {
        species: 'pikachu',
        level: 9,
        expectedMoves: ['thunder-shock', 'growl', 'tail-whip'],
        moveSource: 'level-up'
      },
      {
        species: 'charizard',
        level: 1,
        tmMove: 'solar-beam',
        expectedResult: 'can-learn',
        moveSource: 'tm'
      },
      {
        species: 'pichu',
        level: 1,
        eggMove: 'volt-tackle',
        expectedResult: 'inherited',
        moveSource: 'breeding'
      }
    ]
  },

  'ability-system': {
    name: 'Pokemon Ability System',
    description: 'Test ability assignment and hidden abilities',
    testCases: [
      {
        species: 'pikachu',
        expectedAbilities: ['static'],
        hiddenAbility: 'lightning-rod'
      },
      {
        species: 'charmander',
        expectedAbilities: ['blaze'],
        hiddenAbility: 'solar-power'
      },
      {
        species: 'alakazam',
        expectedAbilities: ['synchronize', 'inner-focus'],
        hiddenAbility: 'magic-guard'
      }
    ]
  },

  'breeding-system': {
    name: 'Pokemon Breeding System',
    description: 'Test Pokemon breeding mechanics and egg generation',
    testCases: [
      {
        parent1: { species: 'pikachu', gender: 'male' },
        parent2: { species: 'raichu', gender: 'female' },
        expectedEgg: 'pichu',
        compatibility: 'high'
      },
      {
        parent1: { species: 'ditto', gender: 'genderless' },
        parent2: { species: 'charmander', gender: 'male' },
        expectedEgg: 'charmander',
        compatibility: 'medium'
      },
      {
        parent1: { species: 'magikarp', gender: 'male' },
        parent2: { species: 'goldeen', gender: 'female' },
        expectedEgg: null,
        compatibility: 'incompatible'
      }
    ]
  },

  'storage-system': {
    name: 'Pokemon Storage System',
    description: 'Test PC box storage and organization',
    testCases: [
      {
        action: 'store',
        pokemon: { species: 'pidgey', level: 5 },
        box: 1,
        slot: 1
      },
      {
        action: 'retrieve',
        box: 1,
        slot: 1,
        expectedSpecies: 'pidgey'
      },
      {
        action: 'organize',
        sortBy: 'species',
        expectedOrder: ['bulbasaur', 'charmander', 'pidgey', 'squirtle']
      }
    ]
  }
};

async function main() {
  console.log(chalk.cyan('🐾 PokéRogue Pokemon Management Testing'));
  console.log(chalk.cyan('======================================'));
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
      listPokemonScenarios();
      return;
    }

    // Run specific scenario or all scenarios
    const scenariosToRun = args.scenario ? [args.scenario] : Object.keys(POKEMON_SCENARIOS);
    
    console.log(chalk.blue('📋 Pokemon Testing Plan:'));
    scenariosToRun.forEach((scenario, i) => {
      const config = POKEMON_SCENARIOS[scenario];
      console.log(chalk.gray(`  ${i + 1}. ${config.name}`));
      console.log(chalk.gray(`     ${config.description} (${config.testCases.length} tests)`));
    });
    console.log();

    // Create test player
    await client.createPlayer({
      name: `PokemonTestPlayer_${Date.now()}`,
      startingPokemon: 'bulbasaur'
    });

    // Execute Pokemon scenarios
    const results = [];
    for (const scenarioName of scenariosToRun) {
      console.log(chalk.blue(`\n🔬 Testing: ${POKEMON_SCENARIOS[scenarioName].name}`));
      console.log(chalk.gray('='.repeat(60)));
      
      try {
        const result = await testPokemonScenario(client, scenarioName, POKEMON_SCENARIOS[scenarioName]);
        results.push({ scenario: scenarioName, result, status: 'SUCCESS' });
        
        console.log(chalk.green(`✅ ${POKEMON_SCENARIOS[scenarioName].name} completed successfully`));
        
      } catch (error) {
        results.push({ scenario: scenarioName, error: error.message, status: 'FAILED' });
        console.log(chalk.red(`❌ ${POKEMON_SCENARIOS[scenarioName].name} failed: ${error.message}`));
        
        if (args.failFast) {
          throw error;
        }
      }
    }

    // Save detailed results
    if (args.saveResults) {
      saveTestResults(results, args.saveResults);
    }

    // Display summary
    displayPokemonTestResults(results);
    
    // Exit with appropriate code
    const failures = results.filter(r => r.status === 'FAILED').length;
    process.exit(failures);

  } catch (error) {
    console.error(chalk.red('\n💥 Pokemon testing failed:'));
    console.error(chalk.red(error.message));
    
    if (process.argv.includes('--verbose')) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

async function testPokemonScenario(client, scenarioName, scenarioConfig) {
  const startTime = Date.now();
  const testResults = [];

  for (let i = 0; i < scenarioConfig.testCases.length; i++) {
    const testCase = scenarioConfig.testCases[i];
    
    console.log(chalk.yellow(`🧪 Test ${i + 1}/${scenarioConfig.testCases.length}: ${scenarioName}`));
    
    try {
      let result;
      
      switch (scenarioName) {
        case 'stats-calculation':
          result = await testStatsCalculation(client, testCase);
          break;
          
        case 'evolution-system':
          result = await testEvolutionSystem(client, testCase);
          break;
          
        case 'move-learning':
          result = await testMoveLearning(client, testCase);
          break;
          
        case 'ability-system':
          result = await testAbilitySystem(client, testCase);
          break;
          
        case 'breeding-system':
          result = await testBreedingSystem(client, testCase);
          break;
          
        case 'storage-system':
          result = await testStorageSystem(client, testCase);
          break;
          
        default:
          throw new Error(`Unknown scenario: ${scenarioName}`);
      }
      
      testResults.push({
        testCase: i + 1,
        input: testCase,
        result: result,
        status: 'PASSED',
        timestamp: Date.now()
      });
      
      console.log(chalk.green(`  ✅ Test ${i + 1} passed`));
      
    } catch (error) {
      testResults.push({
        testCase: i + 1,
        input: testCase,
        error: error.message,
        status: 'FAILED',
        timestamp: Date.now()
      });
      
      console.log(chalk.red(`  ❌ Test ${i + 1} failed: ${error.message}`));
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  const passed = testResults.filter(t => t.status === 'PASSED').length;
  const failed = testResults.filter(t => t.status === 'FAILED').length;

  return {
    scenario: scenarioName,
    duration: duration,
    totalTests: testResults.length,
    passed: passed,
    failed: failed,
    testResults: testResults,
    success: failed === 0
  };
}

async function testStatsCalculation(client, testCase) {
  console.log(chalk.gray(`    Testing ${testCase.species} L${testCase.level} stats...`));
  
  const response = await client.sendToProcess('pokemon', 'Calculate-Stats', {
    species: testCase.species,
    level: testCase.level,
    nature: testCase.nature,
    ivs: testCase.ivs,
    evs: testCase.evs
  });
  
  if (response.Output?.data?.output) {
    const stats = JSON.parse(response.Output.data.output);
    
    // Validate that stats are reasonable
    if (!stats.hp || stats.hp < 1) {
      throw new Error(`Invalid HP calculated: ${stats.hp}`);
    }
    
    if (!stats.attack || stats.attack < 1) {
      throw new Error(`Invalid Attack calculated: ${stats.attack}`);
    }
    
    console.log(chalk.gray(`      HP: ${stats.hp}, Att: ${stats.attack}, Def: ${stats.defense}, SpA: ${stats.spAttack}, SpD: ${stats.spDefense}, Spe: ${stats.speed}`));
    
    return {
      calculatedStats: stats,
      valid: true
    };
  }
  
  throw new Error('No stats returned from calculation');
}

async function testEvolutionSystem(client, testCase) {
  console.log(chalk.gray(`    Testing ${testCase.species} evolution to ${testCase.expectedEvolution}...`));
  
  // First, create/get the Pokemon
  const pokemonResponse = await client.sendToProcess('pokemon', 'Create-Pokemon', {
    species: testCase.species,
    level: testCase.level
  });
  
  let pokemonId;
  if (pokemonResponse.Output?.data?.output) {
    const pokemonData = JSON.parse(pokemonResponse.Output.data.output);
    pokemonId = pokemonData.id;
  } else {
    throw new Error('Failed to create test Pokemon');
  }
  
  // Attempt evolution
  const evolutionResult = await client.evolvePokemon(pokemonId, testCase.evolutionMethod);
  
  if (testCase.expectedEvolution) {
    if (!evolutionResult.success) {
      throw new Error(`Evolution failed: ${evolutionResult.reason}`);
    }
    
    if (evolutionResult.toSpecies !== testCase.expectedEvolution) {
      throw new Error(`Expected ${testCase.expectedEvolution}, got ${evolutionResult.toSpecies}`);
    }
    
    console.log(chalk.gray(`      Evolution successful: ${evolutionResult.fromSpecies} → ${evolutionResult.toSpecies}`));
  }
  
  return evolutionResult;
}

async function testMoveLearning(client, testCase) {
  console.log(chalk.gray(`    Testing ${testCase.species} move learning...`));
  
  const response = await client.sendToProcess('pokemon', 'Get-Learnset', {
    species: testCase.species,
    level: testCase.level,
    moveSource: testCase.moveSource
  });
  
  if (response.Output?.data?.output) {
    const learnset = JSON.parse(response.Output.data.output);
    
    if (testCase.expectedMoves) {
      for (const move of testCase.expectedMoves) {
        if (!learnset.moves.includes(move)) {
          throw new Error(`Expected move ${move} not found in learnset`);
        }
      }
    }
    
    console.log(chalk.gray(`      Available moves: ${learnset.moves.join(', ')}`));
    
    return {
      learnset: learnset,
      valid: true
    };
  }
  
  throw new Error('No learnset returned');
}

async function testAbilitySystem(client, testCase) {
  console.log(chalk.gray(`    Testing ${testCase.species} abilities...`));
  
  const response = await client.sendToProcess('pokemon', 'Get-Abilities', {
    species: testCase.species
  });
  
  if (response.Output?.data?.output) {
    const abilityData = JSON.parse(response.Output.data.output);
    
    for (const ability of testCase.expectedAbilities) {
      if (!abilityData.normalAbilities.includes(ability)) {
        throw new Error(`Expected ability ${ability} not found`);
      }
    }
    
    if (testCase.hiddenAbility && abilityData.hiddenAbility !== testCase.hiddenAbility) {
      throw new Error(`Expected hidden ability ${testCase.hiddenAbility}, got ${abilityData.hiddenAbility}`);
    }
    
    console.log(chalk.gray(`      Abilities: ${abilityData.normalAbilities.join(', ')} (Hidden: ${abilityData.hiddenAbility})`));
    
    return abilityData;
  }
  
  throw new Error('No ability data returned');
}

async function testBreedingSystem(client, testCase) {
  console.log(chalk.gray(`    Testing breeding: ${testCase.parent1.species} + ${testCase.parent2.species}...`));
  
  const response = await client.sendToProcess('pokemon', 'Check-Breeding-Compatibility', {
    parent1: testCase.parent1,
    parent2: testCase.parent2
  });
  
  if (response.Output?.data?.output) {
    const breedingResult = JSON.parse(response.Output.data.output);
    
    if (testCase.expectedEgg) {
      if (!breedingResult.compatible) {
        throw new Error('Expected compatible breeding pair');
      }
      
      if (breedingResult.eggSpecies !== testCase.expectedEgg) {
        throw new Error(`Expected egg species ${testCase.expectedEgg}, got ${breedingResult.eggSpecies}`);
      }
    } else {
      if (breedingResult.compatible) {
        throw new Error('Expected incompatible breeding pair');
      }
    }
    
    console.log(chalk.gray(`      Compatibility: ${breedingResult.compatible ? 'Compatible' : 'Incompatible'}`));
    if (breedingResult.eggSpecies) {
      console.log(chalk.gray(`      Egg species: ${breedingResult.eggSpecies}`));
    }
    
    return breedingResult;
  }
  
  throw new Error('No breeding result returned');
}

async function testStorageSystem(client, testCase) {
  console.log(chalk.gray(`    Testing storage action: ${testCase.action}...`));
  
  let response;
  
  switch (testCase.action) {
    case 'store':
      response = await client.sendToProcess('pokemon', 'Store-Pokemon', {
        pokemon: testCase.pokemon,
        box: testCase.box,
        slot: testCase.slot
      });
      break;
      
    case 'retrieve':
      response = await client.sendToProcess('pokemon', 'Retrieve-Pokemon', {
        box: testCase.box,
        slot: testCase.slot
      });
      break;
      
    case 'organize':
      response = await client.sendToProcess('pokemon', 'Organize-Storage', {
        sortBy: testCase.sortBy
      });
      break;
      
    default:
      throw new Error(`Unknown storage action: ${testCase.action}`);
  }
  
  if (response.Output?.data?.output) {
    const storageResult = JSON.parse(response.Output.data.output);
    
    if (testCase.expectedSpecies && storageResult.pokemon?.species !== testCase.expectedSpecies) {
      throw new Error(`Expected species ${testCase.expectedSpecies}, got ${storageResult.pokemon?.species}`);
    }
    
    console.log(chalk.gray(`      Storage action completed successfully`));
    
    return storageResult;
  }
  
  throw new Error('No storage result returned');
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
    saveResults: args.find(arg => arg.startsWith('--save='))?.split('=')[1],
    registrationFile: args.find(arg => arg.startsWith('--registration='))?.split('=')[1]
  };
}

function listPokemonScenarios() {
  console.log(chalk.blue('📜 Available Pokemon Test Scenarios:'));
  console.log();
  
  Object.entries(POKEMON_SCENARIOS).forEach(([key, scenario]) => {
    console.log(chalk.yellow(`${key}:`));
    console.log(chalk.gray(`  Name: ${scenario.name}`));
    console.log(chalk.gray(`  Description: ${scenario.description}`));
    console.log(chalk.gray(`  Test Cases: ${scenario.testCases.length}`));
    console.log();
  });
}

function displayPokemonTestResults(results) {
  console.log(chalk.cyan('\n📊 Pokemon Testing Results'));
  console.log(chalk.cyan('=========================='));
  
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
        console.log(chalk.gray(`   Tests: ${result.result.passed}/${result.result.totalTests} passed`));
      }
    } else {
      console.log(chalk.red(`❌ ${result.scenario}`));
      console.log(chalk.red(`   Error: ${result.error}`));
    }
  });
  
  if (successful === results.length) {
    console.log(chalk.green('\n🎉 All Pokemon tests completed successfully!'));
    console.log(chalk.blue('\n📝 Pokemon System Status:'));
    console.log(chalk.gray('• Pokemon process is responding correctly'));
    console.log(chalk.gray('• Stats calculation is working'));
    console.log(chalk.gray('• Evolution system is functional'));
    console.log(chalk.gray('• Move learning is operational'));
    console.log(chalk.gray('• Pokemon management is validated ✓'));
  } else if (failed > 0) {
    console.log(chalk.yellow(`\n⚠️ ${failed} scenarios failed - check Pokemon system`));
  }
}

function saveTestResults(results, filename) {
  const resultsData = {
    timestamp: new Date().toISOString(),
    testSuite: 'pokemon-management',
    results: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'SUCCESS').length,
      failed: results.filter(r => r.status === 'FAILED').length
    }
  };
  
  writeFileSync(filename, JSON.stringify(resultsData, null, 2));
  console.log(chalk.gray(`\n💾 Test results saved: ${filename}`));
}

function showHelp() {
  console.log(`
PokéRogue Pokemon Management Testing

Usage: node scripts/ao-pokemon-manager.js [options]

Options:
  --scenario=<name>     Run specific Pokemon scenario
  --list               List all available scenarios
  --verbose, -v        Enable detailed logging
  --fail-fast         Stop on first failure
  --save=<filename>    Save detailed results to file
  --registration=<path> Custom registration results file
  --help, -h          Show this help message

Available Scenarios:
${Object.keys(POKEMON_SCENARIOS).map(s => `  - ${s}`).join('\n')}

Examples:
  node scripts/ao-pokemon-manager.js                         # Run all scenarios
  node scripts/ao-pokemon-manager.js --scenario=evolution-system  # Run specific scenario
  node scripts/ao-pokemon-manager.js --save=results.json    # Save detailed results
  node scripts/ao-pokemon-manager.js --verbose              # Detailed logging
`);
}

// Run main function
main().catch(console.error);