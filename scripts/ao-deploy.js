#!/usr/bin/env node

import { AODeploymentManager } from './lib/ao-deploy.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

/**
 * AO Process Deployment Script
 * 
 * Deploy PokéRogue AO processes using @permaweb/aoconnect
 * Replaces the shell-based deployment with programmatic control
 */

// Process deployment configuration
const PROCESS_DEPLOYMENT_PLAN = [
  {
    name: 'coordinator',
    options: {
      bundlePath: 'build/coordinator-process.lua',
      tags: [
        { name: 'Process-Role', value: 'coordinator' },
        { name: 'Priority', value: 'high' }
      ],
      healthCheck: `
        if ProcessRegistry and CoordinatorState then
          return "HEALTHY: Coordinator ready"
        else
          return "UNHEALTHY: Missing coordinator components"
        end
      `
    },
    metadata: {
      role: 'coordinator',
      capabilities: ['process-registry', 'coordination', 'load-balancing']
    }
  },
  {
    name: 'admin',
    options: {
      bundlePath: 'build/admin-process.lua',
      tags: [
        { name: 'Process-Role', value: 'admin' },
        { name: 'Priority', value: 'high' }
      ],
      healthCheck: `
        if AdminHandlers and Handlers then
          return "HEALTHY: Admin system ready"
        else
          return "UNHEALTHY: Missing admin components"
        end
      `
    },
    metadata: {
      role: 'admin',
      capabilities: ['user-management', 'system-monitoring', 'configuration']
    }
  },
  {
    name: 'security',
    options: {
      bundlePath: 'build/security-process.lua',
      tags: [
        { name: 'Process-Role', value: 'security' },
        { name: 'Priority', value: 'high' }
      ],
      healthCheck: `
        if AntiCheatValidator and SecurityHandlers then
          return "HEALTHY: Security system ready"
        else
          return "UNHEALTHY: Missing security components"
        end
      `
    },
    metadata: {
      role: 'security',
      capabilities: ['anti-cheat', 'validation', 'fraud-detection']
    }
  },
  {
    name: 'battle',
    options: {
      bundlePath: 'build/battle-process.lua',
      tags: [
        { name: 'Process-Role', value: 'battle' },
        { name: 'Priority', value: 'medium' }
      ],
      healthCheck: `
        if BattleEngine and DamageCalculator and BattleRNG then
          return "HEALTHY: Battle engine ready"
        else
          return "UNHEALTHY: Missing battle components"
        end
      `
    },
    metadata: {
      role: 'battle',
      capabilities: ['battle-resolution', 'damage-calculation', 'rng-generation']
    }
  },
  {
    name: 'pokemon',
    options: {
      bundlePath: 'build/pokemon-process.lua',
      tags: [
        { name: 'Process-Role', value: 'pokemon' },
        { name: 'Priority', value: 'medium' }
      ],
      healthCheck: `
        if PokemonManager and SpeciesDatabase and AbilityDatabase then
          return "HEALTHY: Pokemon system ready"
        else
          return "UNHEALTHY: Missing pokemon components"
        end
      `
    },
    metadata: {
      role: 'pokemon',
      capabilities: ['pokemon-management', 'stats-calculation', 'evolution']
    }
  },
  {
    name: 'economy',
    options: {
      bundlePath: 'build/economy-process.lua',
      tags: [
        { name: 'Process-Role', value: 'economy' },
        { name: 'Priority', value: 'low' }
      ],
      healthCheck: `
        if ShopManager and InventoryManager then
          return "HEALTHY: Economy system ready"
        else
          return "UNHEALTHY: Missing economy components"
        end
      `
    },
    metadata: {
      role: 'economy',
      capabilities: ['shop-management', 'inventory', 'trading']
    }
  }
];

// Configuration options
const DEPLOYMENT_CONFIG = {
  verbose: true,
  retryAttempts: 3,
  retryDelay: 5000,
  deploymentDelay: 3000,
  failFast: true,
  healthCheckTimeout: 30000,
  mockMode: false
};

async function main() {
  console.log(chalk.cyan('🎮 PokéRogue AO Process Deployment'));
  console.log(chalk.cyan('====================================='));
  console.log(chalk.gray(`Using @permaweb/aoconnect v${getAOConnectVersion()}`));
  console.log();

  try {
    // Validate build directory
    validateBuildDirectory();
    
    // Initialize deployment manager
    const deployer = new AODeploymentManager(DEPLOYMENT_CONFIG);
    await deployer.initialize();
    
    // Show deployment plan
    console.log(chalk.blue('📋 Deployment Plan:'));
    PROCESS_DEPLOYMENT_PLAN.forEach((proc, i) => {
      console.log(chalk.gray(`  ${i + 1}. ${proc.name} (${proc.metadata.role})`));
    });
    console.log();
    
    // Start deployment
    const startTime = Date.now();
    console.log(chalk.green('🚀 Starting deployment...'));
    console.log();
    
    const results = await deployer.deployMultiProcess(PROCESS_DEPLOYMENT_PLAN, {
      deploymentDelay: DEPLOYMENT_CONFIG.deploymentDelay,
      failFast: DEPLOYMENT_CONFIG.failFast
    });
    
    // Display results
    displayDeploymentResults(results, Date.now() - startTime);
    
    // Exit with appropriate code
    const failed = results.failed;
    if (failed > 0) {
      console.log(chalk.red(`\n❌ Deployment completed with ${failed} failures`));
      process.exit(failed);
    } else {
      console.log(chalk.green('\n🎉 All processes deployed successfully!'));
      process.exit(0);
    }
    
  } catch (error) {
    console.error(chalk.red('\n💥 Deployment failed:'));
    console.error(chalk.red(error.message));
    
    if (DEPLOYMENT_CONFIG.verbose) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

function validateBuildDirectory() {
  const buildDir = 'build';
  
  if (!existsSync(buildDir)) {
    throw new Error(
      `Build directory not found: ${buildDir}\n` +
      'Please run "npm run ao:build" first to build processes'
    );
  }
  
  // Check each required bundle
  const missingBundles = [];
  PROCESS_DEPLOYMENT_PLAN.forEach(proc => {
    if (!existsSync(proc.options.bundlePath)) {
      missingBundles.push(proc.options.bundlePath);
    }
  });
  
  if (missingBundles.length > 0) {
    throw new Error(
      `Missing process bundles:\n${missingBundles.map(b => `  - ${b}`).join('\n')}\n` +
      'Please run "npm run ao:build" to build all processes'
    );
  }
  
  console.log(chalk.green('✅ Build validation passed'));
}

function displayDeploymentResults(results, totalTime) {
  console.log(chalk.cyan('\n📊 Deployment Summary'));
  console.log(chalk.cyan('====================='));
  
  console.log(chalk.gray(`Total Time: ${Math.round(totalTime / 1000)}s`));
  console.log(chalk.gray(`Processes: ${results.processCount}`));
  console.log(chalk.gray(`Success Rate: ${results.successful}/${results.processCount}`));
  console.log();
  
  // Process details
  Object.entries(results.processes).forEach(([name, proc]) => {
    if (proc.status === 'DEPLOYED') {
      console.log(chalk.green(`✅ ${name.padEnd(12)} - ${proc.processId}`));
      console.log(chalk.gray(`   Deployed in ${proc.deploymentTime}ms`));
    } else {
      console.log(chalk.red(`❌ ${name.padEnd(12)} - FAILED`));
      if (proc.error) {
        console.log(chalk.red(`   Error: ${proc.error}`));
      }
    }
  });
  
  // Configuration summary
  if (results.successful > 0) {
    console.log(chalk.blue('\n🔗 Process Registry:'));
    Object.entries(results.processes)
      .filter(([_, proc]) => proc.status === 'DEPLOYED')
      .forEach(([name, proc]) => {
        console.log(chalk.gray(`${name}: ${proc.processId}`));
      });
    
    console.log(chalk.blue('\n📝 Next Steps:'));
    console.log(chalk.gray('1. Run process initialization: npm run ao:init'));
    console.log(chalk.gray('2. Validate deployment: npm run ao:validate'));
    console.log(chalk.gray('3. Start testing: npm run ao:test:deployment'));
  }
}

function getAOConnectVersion() {
  try {
    const packagePath = join('node_modules', '@permaweb', 'aoconnect', 'package.json');
    if (existsSync(packagePath)) {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
      return pkg.version;
    }
  } catch (error) {
    // Fallback - check main package.json
    try {
      const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
      return pkg.dependencies['@permaweb/aoconnect']?.replace('^', '') || 'unknown';
    } catch {
      return 'unknown';
    }
  }
  return 'unknown';
}

// Handle command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
PokéRogue AO Process Deployment

Usage: node scripts/ao-deploy.js [options]

Options:
  --help, -h         Show this help message
  --verbose, -v      Enable verbose logging  
  --no-fail-fast     Continue deployment even if a process fails
  --dry-run         Validate configuration without deploying
  --mock            Use mock mode for testing without AO network

Process Order:
${PROCESS_DEPLOYMENT_PLAN.map((p, i) => `  ${i + 1}. ${p.name}`).join('\n')}

Examples:
  node scripts/ao-deploy.js                    # Deploy all processes
  node scripts/ao-deploy.js --verbose         # Deploy with detailed logging
  node scripts/ao-deploy.js --no-fail-fast    # Continue on failures
  node scripts/ao-deploy.js --mock            # Test deployment with mock mode
`);
    process.exit(0);
  }
  
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    failFast: !args.includes('--no-fail-fast'),
    dryRun: args.includes('--dry-run'),
    mockMode: args.includes('--mock')
  };
}

// Update config with command line args
Object.assign(DEPLOYMENT_CONFIG, parseArguments());

// Run main function
main().catch(console.error);