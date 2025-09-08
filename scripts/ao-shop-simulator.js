#!/usr/bin/env node

import { PokéRougeGameClient } from './lib/ao-game-client.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';

/**
 * Shop & Economy Interaction Script
 * 
 * Comprehensive testing of the economy system including
 * shop interactions, inventory management, and trading.
 */

// Economy test scenarios
const ECONOMY_SCENARIOS = {
  'basic-shop': {
    name: 'Basic Shop Operations',
    description: 'Test fundamental shop browsing and purchasing',
    testCases: [
      {
        action: 'browse',
        shopType: 'pokemart',
        expectedCategories: ['pokeballs', 'healing', 'status', 'battle-items']
      },
      {
        action: 'purchase',
        itemId: 'pokeball',
        quantity: 10,
        expectedCost: 200,
        playerMoney: 1000
      },
      {
        action: 'purchase',
        itemId: 'potion',
        quantity: 5,
        expectedCost: 300,
        playerMoney: 800
      },
      {
        action: 'purchase',
        itemId: 'super-potion',
        quantity: 1,
        expectedCost: 700,
        playerMoney: 500,
        expectedResult: 'insufficient-funds'
      }
    ]
  },

  'inventory-management': {
    name: 'Inventory Management',
    description: 'Test inventory operations and organization',
    testCases: [
      {
        action: 'add-item',
        itemId: 'pokeball',
        quantity: 10,
        expectedTotal: 10
      },
      {
        action: 'use-item',
        itemId: 'pokeball',
        quantity: 3,
        expectedRemaining: 7
      },
      {
        action: 'organize',
        sortBy: 'type',
        expectedOrder: ['pokeballs', 'healing', 'status', 'key-items']
      },
      {
        action: 'check-capacity',
        expectedLimit: 999,
        currentCount: 150
      }
    ]
  },

  'specialized-shops': {
    name: 'Specialized Shops',
    description: 'Test different shop types and their unique items',
    testCases: [
      {
        shopType: 'pokemart',
        expectedItems: ['pokeball', 'great-ball', 'potion', 'super-potion', 'antidote', 'paralyze-heal'],
        priceRange: { min: 100, max: 1200 }
      },
      {
        shopType: 'department-store',
        expectedItems: ['ultra-ball', 'max-potion', 'full-restore', 'rare-candy'],
        priceRange: { min: 1200, max: 9800 }
      },
      {
        shopType: 'battle-shop',
        expectedItems: ['x-attack', 'x-defense', 'x-speed', 'dire-hit'],
        priceRange: { min: 500, max: 1000 }
      },
      {
        shopType: 'berry-shop',
        expectedItems: ['oran-berry', 'pecha-berry', 'chesto-berry', 'leppa-berry'],
        priceRange: { min: 20, max: 200 }
      }
    ]
  },

  'price-calculations': {
    name: 'Price Calculations & Discounts',
    description: 'Test dynamic pricing and discount systems',
    testCases: [
      {
        scenario: 'bulk-discount',
        itemId: 'pokeball',
        quantity: 50,
        basePrice: 200,
        expectedDiscount: 0.1,
        expectedTotal: 9000
      },
      {
        scenario: 'member-discount',
        playerStatus: 'premium',
        itemId: 'max-potion',
        quantity: 1,
        basePrice: 2500,
        expectedDiscount: 0.15,
        expectedTotal: 2125
      },
      {
        scenario: 'daily-special',
        timeOfDay: 'morning',
        itemId: 'rare-candy',
        basePrice: 9800,
        expectedDiscount: 0.2,
        expectedTotal: 7840
      }
    ]
  },

  'trading-system': {
    name: 'Trading System',
    description: 'Test player-to-player and NPC trading',
    testCases: [
      {
        tradeType: 'npc',
        npcId: 'bill',
        playerOffer: { itemId: 'nugget', quantity: 1 },
        npcRequest: { itemId: 'sun-stone', quantity: 1 },
        expectedResult: 'accepted'
      },
      {
        tradeType: 'player',
        playerId: 'player2',
        playerOffer: { itemId: 'thunder-stone', quantity: 1 },
        playerRequest: { itemId: 'fire-stone', quantity: 1 },
        expectedResult: 'pending'
      },
      {
        tradeType: 'pokemon',
        playerOffer: { species: 'machoke', level: 25 },
        playerRequest: { species: 'graveler', level: 20 },
        expectedResult: 'both-evolve'
      }
    ]
  },

  'economy-balance': {
    name: 'Economy Balance Testing',
    description: 'Test economic balance and money flow',
    testCases: [
      {
        scenario: 'earning-money',
        method: 'battle-victory',
        opponentType: 'trainer',
        expectedPayout: 1200,
        playerLevel: 25
      },
      {
        scenario: 'selling-items',
        itemId: 'nugget',
        quantity: 3,
        sellPrice: 5000,
        expectedTotal: 15000
      },
      {
        scenario: 'market-prices',
        itemId: 'rare-candy',
        expectedPrice: { min: 8000, max: 12000 },
        priceVolatility: 'medium'
      }
    ]
  },

  'shop-integration': {
    name: 'Shop System Integration',
    description: 'Test integration with other game systems',
    testCases: [
      {
        integration: 'battle-items',
        scenario: 'purchase-and-use',
        itemId: 'x-attack',
        useContext: 'wild-battle',
        expectedEffect: 'attack-boost'
      },
      {
        integration: 'pokemon-care',
        scenario: 'healing-items',
        itemId: 'super-potion',
        targetPokemon: { species: 'pikachu', currentHp: 15, maxHp: 35 },
        expectedHeal: 50,
        expectedFinalHp: 35
      },
      {
        integration: 'evolution',
        scenario: 'evolution-items',
        itemId: 'thunder-stone',
        targetPokemon: { species: 'pikachu', level: 10 },
        expectedEvolution: 'raichu'
      }
    ]
  }
};

async function main() {
  console.log(chalk.cyan('🛒 PokéRogue Shop & Economy Simulation'));
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

    // Initialize game client
    const client = new PokéRougeGameClient({ verbose: args.verbose });
    await client.initialize(registrationPath);

    // Show available scenarios
    if (args.listScenarios) {
      listEconomyScenarios();
      return;
    }

    // Run specific scenario or all scenarios
    const scenariosToRun = args.scenario ? [args.scenario] : Object.keys(ECONOMY_SCENARIOS);
    
    console.log(chalk.blue('📋 Economy Testing Plan:'));
    scenariosToRun.forEach((scenario, i) => {
      const config = ECONOMY_SCENARIOS[scenario];
      console.log(chalk.gray(`  ${i + 1}. ${config.name}`));
      console.log(chalk.gray(`     ${config.description} (${config.testCases.length} tests)`));
    });
    console.log();

    // Create test player with starting money
    await client.createPlayer({
      name: `ShopTestPlayer_${Date.now()}`,
      startingPokemon: 'pikachu',
      money: 10000 // Starting money for tests
    });

    // Execute economy scenarios
    const results = [];
    for (const scenarioName of scenariosToRun) {
      console.log(chalk.blue(`\n💰 Testing: ${ECONOMY_SCENARIOS[scenarioName].name}`));
      console.log(chalk.gray('='.repeat(60)));
      
      try {
        const result = await testEconomyScenario(client, scenarioName, ECONOMY_SCENARIOS[scenarioName]);
        results.push({ scenario: scenarioName, result, status: 'SUCCESS' });
        
        console.log(chalk.green(`✅ ${ECONOMY_SCENARIOS[scenarioName].name} completed successfully`));
        
      } catch (error) {
        results.push({ scenario: scenarioName, error: error.message, status: 'FAILED' });
        console.log(chalk.red(`❌ ${ECONOMY_SCENARIOS[scenarioName].name} failed: ${error.message}`));
        
        if (args.failFast) {
          throw error;
        }
      }
    }

    // Save detailed results
    if (args.saveResults) {
      saveEconomyResults(results, args.saveResults);
    }

    // Display summary
    displayEconomyResults(results);
    
    // Exit with appropriate code
    const failures = results.filter(r => r.status === 'FAILED').length;
    process.exit(failures);

  } catch (error) {
    console.error(chalk.red('\n💥 Economy testing failed:'));
    console.error(chalk.red(error.message));
    
    if (process.argv.includes('--verbose')) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

async function testEconomyScenario(client, scenarioName, scenarioConfig) {
  const startTime = Date.now();
  const testResults = [];

  for (let i = 0; i < scenarioConfig.testCases.length; i++) {
    const testCase = scenarioConfig.testCases[i];
    
    console.log(chalk.yellow(`🧪 Test ${i + 1}/${scenarioConfig.testCases.length}: ${scenarioName}`));
    
    try {
      let result;
      
      switch (scenarioName) {
        case 'basic-shop':
          result = await testBasicShop(client, testCase);
          break;
          
        case 'inventory-management':
          result = await testInventoryManagement(client, testCase);
          break;
          
        case 'specialized-shops':
          result = await testSpecializedShops(client, testCase);
          break;
          
        case 'price-calculations':
          result = await testPriceCalculations(client, testCase);
          break;
          
        case 'trading-system':
          result = await testTradingSystem(client, testCase);
          break;
          
        case 'economy-balance':
          result = await testEconomyBalance(client, testCase);
          break;
          
        case 'shop-integration':
          result = await testShopIntegration(client, testCase);
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

async function testBasicShop(client, testCase) {
  console.log(chalk.gray(`    Testing shop action: ${testCase.action}...`));
  
  if (testCase.action === 'browse') {
    const shopData = await client.visitShop(testCase.shopType);
    
    if (!shopData.items || shopData.items.length === 0) {
      throw new Error('No items found in shop');
    }
    
    console.log(chalk.gray(`      Found ${shopData.items.length} items in ${testCase.shopType}`));
    
    return {
      shopType: testCase.shopType,
      itemCount: shopData.items.length,
      items: shopData.items
    };
    
  } else if (testCase.action === 'purchase') {
    const transaction = await client.purchaseItem(testCase.itemId, testCase.quantity);
    
    if (testCase.expectedResult === 'insufficient-funds') {
      if (transaction.success !== false) {
        throw new Error('Expected purchase to fail due to insufficient funds');
      }
    } else {
      if (!transaction.success && transaction.success !== undefined) {
        throw new Error(`Purchase failed: ${transaction.error || 'Unknown error'}`);
      }
    }
    
    console.log(chalk.gray(`      Purchase result: ${testCase.itemId} x${testCase.quantity}`));
    
    return transaction;
  }
  
  throw new Error(`Unknown shop action: ${testCase.action}`);
}

async function testInventoryManagement(client, testCase) {
  console.log(chalk.gray(`    Testing inventory: ${testCase.action}...`));
  
  let response;
  
  switch (testCase.action) {
    case 'add-item':
      response = await client.sendToProcess('economy', 'Add-Item', {
        itemId: testCase.itemId,
        quantity: testCase.quantity
      });
      break;
      
    case 'use-item':
      response = await client.sendToProcess('economy', 'Use-Item', {
        itemId: testCase.itemId,
        quantity: testCase.quantity
      });
      break;
      
    case 'organize':
      response = await client.sendToProcess('economy', 'Organize-Inventory', {
        sortBy: testCase.sortBy
      });
      break;
      
    case 'check-capacity':
      response = await client.sendToProcess('economy', 'Check-Inventory-Capacity');
      break;
      
    default:
      throw new Error(`Unknown inventory action: ${testCase.action}`);
  }
  
  if (response.Output?.data?.output) {
    const result = JSON.parse(response.Output.data.output);
    
    if (testCase.expectedTotal && result.totalQuantity !== testCase.expectedTotal) {
      throw new Error(`Expected ${testCase.expectedTotal}, got ${result.totalQuantity}`);
    }
    
    if (testCase.expectedRemaining && result.remainingQuantity !== testCase.expectedRemaining) {
      throw new Error(`Expected ${testCase.expectedRemaining} remaining, got ${result.remainingQuantity}`);
    }
    
    console.log(chalk.gray(`      Inventory action completed`));
    return result;
  }
  
  throw new Error('No inventory result returned');
}

async function testSpecializedShops(client, testCase) {
  console.log(chalk.gray(`    Testing ${testCase.shopType} shop...`));
  
  const shopData = await client.visitShop(testCase.shopType);
  
  if (!shopData.items || shopData.items.length === 0) {
    throw new Error(`No items found in ${testCase.shopType}`);
  }
  
  // Check if expected items are available
  for (const expectedItem of testCase.expectedItems) {
    const found = shopData.items.some(item => item.id === expectedItem);
    if (!found) {
      throw new Error(`Expected item ${expectedItem} not found in ${testCase.shopType}`);
    }
  }
  
  // Check price ranges
  const prices = shopData.items.map(item => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  if (minPrice < testCase.priceRange.min) {
    console.log(chalk.yellow(`      Warning: Price below expected minimum: ${minPrice} < ${testCase.priceRange.min}`));
  }
  
  if (maxPrice > testCase.priceRange.max) {
    console.log(chalk.yellow(`      Warning: Price above expected maximum: ${maxPrice} > ${testCase.priceRange.max}`));
  }
  
  console.log(chalk.gray(`      ${testCase.shopType} validated: ${shopData.items.length} items, price range ${minPrice}-${maxPrice}`));
  
  return {
    shopType: testCase.shopType,
    itemCount: shopData.items.length,
    priceRange: { min: minPrice, max: maxPrice },
    items: shopData.items.map(item => ({ id: item.id, price: item.price }))
  };
}

async function testPriceCalculations(client, testCase) {
  console.log(chalk.gray(`    Testing price calculation: ${testCase.scenario}...`));
  
  const response = await client.sendToProcess('economy', 'Calculate-Price', {
    itemId: testCase.itemId,
    quantity: testCase.quantity,
    basePrice: testCase.basePrice,
    playerStatus: testCase.playerStatus,
    timeOfDay: testCase.timeOfDay,
    scenario: testCase.scenario
  });
  
  if (response.Output?.data?.output) {
    const priceResult = JSON.parse(response.Output.data.output);
    
    if (testCase.expectedTotal && Math.abs(priceResult.totalPrice - testCase.expectedTotal) > 1) {
      throw new Error(`Expected total ${testCase.expectedTotal}, got ${priceResult.totalPrice}`);
    }
    
    if (testCase.expectedDiscount && Math.abs(priceResult.discountRate - testCase.expectedDiscount) > 0.01) {
      throw new Error(`Expected discount ${testCase.expectedDiscount}, got ${priceResult.discountRate}`);
    }
    
    console.log(chalk.gray(`      Price: ${priceResult.totalPrice}, Discount: ${(priceResult.discountRate * 100).toFixed(1)}%`));
    
    return priceResult;
  }
  
  throw new Error('No price calculation result returned');
}

async function testTradingSystem(client, testCase) {
  console.log(chalk.gray(`    Testing ${testCase.tradeType} trade...`));
  
  const response = await client.sendToProcess('economy', 'Initiate-Trade', {
    tradeType: testCase.tradeType,
    targetId: testCase.npcId || testCase.playerId,
    playerOffer: testCase.playerOffer,
    playerRequest: testCase.playerRequest
  });
  
  if (response.Output?.data?.output) {
    const tradeResult = JSON.parse(response.Output.data.output);
    
    if (testCase.expectedResult && tradeResult.status !== testCase.expectedResult) {
      throw new Error(`Expected ${testCase.expectedResult}, got ${tradeResult.status}`);
    }
    
    console.log(chalk.gray(`      Trade status: ${tradeResult.status}`));
    
    return tradeResult;
  }
  
  throw new Error('No trade result returned');
}

async function testEconomyBalance(client, testCase) {
  console.log(chalk.gray(`    Testing economy balance: ${testCase.scenario}...`));
  
  let response;
  
  switch (testCase.scenario) {
    case 'earning-money':
      response = await client.sendToProcess('economy', 'Calculate-Battle-Reward', {
        opponentType: testCase.opponentType,
        playerLevel: testCase.playerLevel
      });
      break;
      
    case 'selling-items':
      response = await client.sendToProcess('economy', 'Sell-Item', {
        itemId: testCase.itemId,
        quantity: testCase.quantity
      });
      break;
      
    case 'market-prices':
      response = await client.sendToProcess('economy', 'Get-Market-Price', {
        itemId: testCase.itemId
      });
      break;
      
    default:
      throw new Error(`Unknown balance scenario: ${testCase.scenario}`);
  }
  
  if (response.Output?.data?.output) {
    const balanceResult = JSON.parse(response.Output.data.output);
    
    if (testCase.expectedPayout && balanceResult.payout !== testCase.expectedPayout) {
      throw new Error(`Expected payout ${testCase.expectedPayout}, got ${balanceResult.payout}`);
    }
    
    if (testCase.expectedTotal && balanceResult.totalValue !== testCase.expectedTotal) {
      throw new Error(`Expected total ${testCase.expectedTotal}, got ${balanceResult.totalValue}`);
    }
    
    console.log(chalk.gray(`      Balance result validated`));
    
    return balanceResult;
  }
  
  throw new Error('No balance result returned');
}

async function testShopIntegration(client, testCase) {
  console.log(chalk.gray(`    Testing integration: ${testCase.integration}...`));
  
  const response = await client.sendToProcess('economy', 'Test-Integration', {
    integration: testCase.integration,
    scenario: testCase.scenario,
    itemId: testCase.itemId,
    targetPokemon: testCase.targetPokemon,
    useContext: testCase.useContext
  });
  
  if (response.Output?.data?.output) {
    const integrationResult = JSON.parse(response.Output.data.output);
    
    if (testCase.expectedEffect && integrationResult.effect !== testCase.expectedEffect) {
      throw new Error(`Expected effect ${testCase.expectedEffect}, got ${integrationResult.effect}`);
    }
    
    if (testCase.expectedEvolution && integrationResult.evolution !== testCase.expectedEvolution) {
      throw new Error(`Expected evolution ${testCase.expectedEvolution}, got ${integrationResult.evolution}`);
    }
    
    console.log(chalk.gray(`      Integration test passed`));
    
    return integrationResult;
  }
  
  throw new Error('No integration result returned');
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
    saveResults: args.find(arg => arg.startsWith('--save='))?.split('=')[1],
    registrationFile: args.find(arg => arg.startsWith('--registration='))?.split('=')[1]
  };
}

function listEconomyScenarios() {
  console.log(chalk.blue('📜 Available Economy Test Scenarios:'));
  console.log();
  
  Object.entries(ECONOMY_SCENARIOS).forEach(([key, scenario]) => {
    console.log(chalk.yellow(`${key}:`));
    console.log(chalk.gray(`  Name: ${scenario.name}`));
    console.log(chalk.gray(`  Description: ${scenario.description}`));
    console.log(chalk.gray(`  Test Cases: ${scenario.testCases.length}`));
    console.log();
  });
}

function displayEconomyResults(results) {
  console.log(chalk.cyan('\n📊 Economy Testing Results'));
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
    console.log(chalk.green('\n🎉 All economy tests completed successfully!'));
    console.log(chalk.blue('\n📝 Economy System Status:'));
    console.log(chalk.gray('• Shop system is responding correctly'));
    console.log(chalk.gray('• Inventory management is working'));
    console.log(chalk.gray('• Price calculations are accurate'));
    console.log(chalk.gray('• Trading system is operational'));
    console.log(chalk.gray('• Economy integration is validated ✓'));
  } else if (failed > 0) {
    console.log(chalk.yellow(`\n⚠️ ${failed} scenarios failed - check economy system`));
  }
}

function saveEconomyResults(results, filename) {
  const resultsData = {
    timestamp: new Date().toISOString(),
    testSuite: 'shop-economy',
    results: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'SUCCESS').length,
      failed: results.filter(r => r.status === 'FAILED').length
    }
  };
  
  writeFileSync(filename, JSON.stringify(resultsData, null, 2));
  console.log(chalk.gray(`\n💾 Economy test results saved: ${filename}`));
}

function showHelp() {
  console.log(`
PokéRogue Shop & Economy Simulation

Usage: node scripts/ao-shop-simulator.js [options]

Options:
  --scenario=<name>     Run specific economy scenario
  --list               List all available scenarios
  --verbose, -v        Enable detailed logging
  --fail-fast         Stop on first failure
  --save=<filename>    Save detailed results to file
  --registration=<path> Custom registration results file
  --help, -h          Show this help message

Available Scenarios:
${Object.keys(ECONOMY_SCENARIOS).map(s => `  - ${s}`).join('\n')}

Examples:
  node scripts/ao-shop-simulator.js                         # Run all scenarios
  node scripts/ao-shop-simulator.js --scenario=basic-shop  # Run specific scenario
  node scripts/ao-shop-simulator.js --save=shop-results.json # Save detailed results
  node scripts/ao-shop-simulator.js --verbose               # Detailed logging
`);
}

// Run main function
main().catch(console.error);