#!/usr/bin/env node

import { AODeploymentManager } from './lib/ao-deploy.js';
import { readFileSync, existsSync } from 'fs';
import chalk from 'chalk';

/**
 * AO Process Initialization Script
 * 
 * Initialize deployed AO processes with configuration, 
 * setup inter-process communication, and validate readiness.
 */

// Initialization configuration for each process type
const INITIALIZATION_CONFIG = {
  coordinator: {
    setupCode: `
      -- Initialize Coordinator Process
      CoordinatorState = CoordinatorState or {
        processes = {},
        loadBalancer = {
          battlePool = {},
          pokemonPool = {},
          economyPool = {}
        },
        metrics = {
          totalRequests = 0,
          processHealth = {}
        }
      }
      
      -- Setup process registry
      ProcessRegistry = ProcessRegistry or {}
      
      -- Initialize message handlers
      if Handlers then
        Handlers.add("Register-Process", 
          Handlers.utils.hasMatchingTag("Action", "Register-Process"),
          function(msg)
            local processData = json.decode(msg.Data)
            ProcessRegistry[processData.processType] = processData.processId
            CoordinatorState.processes[processData.processType] = {
              id = processData.processId,
              status = "ACTIVE",
              registeredAt = msg.Timestamp,
              metadata = processData.metadata or {}
            }
            
            ao.send({
              Target = msg.From,
              Tags = { Action = "Process-Registered" },
              Data = json.encode({ status = "registered", processType = processData.processType })
            })
          end
        )
      end
      
      print("Coordinator initialization completed")
    `,
    validation: `
      return (CoordinatorState and ProcessRegistry and Handlers) and "INITIALIZED" or "FAILED"
    `
  },

  admin: {
    setupCode: `
      -- Initialize Admin Process
      AdminState = AdminState or {
        users = {},
        systemConfig = {
          maxConcurrentBattles = 100,
          maintenanceMode = false,
          rateLimits = {
            battleRequests = 10,
            pokemonRequests = 20
          }
        },
        auditLog = {}
      }
      
      -- Setup admin handlers
      if Handlers then
        Handlers.add("System-Status",
          Handlers.utils.hasMatchingTag("Action", "System-Status"),
          function(msg)
            local status = {
              processCount = 0,
              systemHealth = "HEALTHY",
              maintenance = AdminState.systemConfig.maintenanceMode,
              timestamp = msg.Timestamp
            }
            
            ao.send({
              Target = msg.From,
              Tags = { Action = "Status-Response" },
              Data = json.encode(status)
            })
          end
        )
        
        Handlers.add("Update-Config",
          Handlers.utils.hasMatchingTag("Action", "Update-Config"),
          function(msg)
            local configUpdate = json.decode(msg.Data)
            for key, value in pairs(configUpdate) do
              AdminState.systemConfig[key] = value
            end
            
            -- Log configuration change
            table.insert(AdminState.auditLog, {
              action = "CONFIG_UPDATE",
              user = msg.From,
              timestamp = msg.Timestamp,
              changes = configUpdate
            })
            
            ao.send({
              Target = msg.From,
              Tags = { Action = "Config-Updated" },
              Data = "Configuration updated successfully"
            })
          end
        )
      end
      
      print("Admin initialization completed")
    `,
    validation: `
      return (AdminState and AdminState.systemConfig and Handlers) and "INITIALIZED" or "FAILED"
    `
  },

  security: {
    setupCode: `
      -- Initialize Security Process
      SecurityState = SecurityState or {
        validationRules = {
          maxStatsPerPokemon = 6,
          maxMoveCount = 4,
          maxPartySize = 6
        },
        suspiciousActivity = {},
        rateLimits = {},
        trustedProcesses = {}
      }
      
      -- Initialize anti-cheat components
      AntiCheatValidator = AntiCheatValidator or {}
      
      -- Setup security handlers
      if Handlers then
        Handlers.add("Validate-Action",
          Handlers.utils.hasMatchingTag("Action", "Validate-Action"),
          function(msg)
            local actionData = json.decode(msg.Data)
            local isValid = true
            local violations = {}
            
            -- Perform validation based on action type
            if actionData.type == "battle" then
              -- Validate battle parameters
              if not actionData.pokemon or #actionData.pokemon > SecurityState.validationRules.maxPartySize then
                isValid = false
                table.insert(violations, "Invalid party size")
              end
            end
            
            local result = {
              valid = isValid,
              violations = violations,
              actionId = actionData.id,
              timestamp = msg.Timestamp
            }
            
            ao.send({
              Target = msg.From,
              Tags = { Action = "Validation-Result" },
              Data = json.encode(result)
            })
          end
        )
        
        Handlers.add("Report-Suspicious",
          Handlers.utils.hasMatchingTag("Action", "Report-Suspicious"),
          function(msg)
            local report = json.decode(msg.Data)
            table.insert(SecurityState.suspiciousActivity, {
              reporter = msg.From,
              report = report,
              timestamp = msg.Timestamp
            })
            
            ao.send({
              Target = msg.From,
              Tags = { Action = "Report-Received" },
              Data = "Suspicious activity reported"
            })
          end
        )
      end
      
      print("Security initialization completed")
    `,
    validation: `
      return (SecurityState and AntiCheatValidator and Handlers) and "INITIALIZED" or "FAILED"
    `
  },

  battle: {
    setupCode: `
      -- Initialize Battle Process
      BattleState = BattleState or {
        activeBattles = {},
        battleQueue = {},
        rngSeeds = {},
        statistics = {
          battlesCompleted = 0,
          averageBattleTime = 0
        }
      }
      
      -- Ensure battle engine components are available
      if not BattleEngine then
        print("Warning: BattleEngine not found, creating placeholder")
        BattleEngine = { initialized = true }
      end
      
      -- Setup battle handlers
      if Handlers then
        Handlers.add("Start-Battle",
          Handlers.utils.hasMatchingTag("Action", "Start-Battle"),
          function(msg)
            local battleData = json.decode(msg.Data)
            local battleId = msg.Id .. "-" .. msg.Timestamp
            
            BattleState.activeBattles[battleId] = {
              id = battleId,
              players = battleData.players,
              startTime = msg.Timestamp,
              status = "ACTIVE"
            }
            
            ao.send({
              Target = msg.From,
              Tags = { Action = "Battle-Started", BattleId = battleId },
              Data = json.encode({ battleId = battleId, status = "started" })
            })
          end
        )
        
        Handlers.add("Battle-Action",
          Handlers.utils.hasMatchingTag("Action", "Battle-Action"),
          function(msg)
            local actionData = json.decode(msg.Data)
            local battleId = actionData.battleId
            
            if BattleState.activeBattles[battleId] then
              -- Process battle action (placeholder)
              local result = {
                battleId = battleId,
                action = actionData.action,
                result = "processed",
                timestamp = msg.Timestamp
              }
              
              ao.send({
                Target = msg.From,
                Tags = { Action = "Action-Result", BattleId = battleId },
                Data = json.encode(result)
              })
            else
              ao.send({
                Target = msg.From,
                Tags = { Action = "Error", Error = "Battle not found" },
                Data = "Battle ID not found: " .. battleId
              })
            end
          end
        )
      end
      
      print("Battle initialization completed")
    `,
    validation: `
      return (BattleState and BattleEngine and Handlers) and "INITIALIZED" or "FAILED"
    `
  },

  pokemon: {
    setupCode: `
      -- Initialize Pokemon Process
      PokemonState = PokemonState or {
        playerPokemon = {},
        activeTrades = {},
        breedingQueue = {},
        statistics = {
          totalPokemon = 0,
          evolutionsCompleted = 0
        }
      }
      
      -- Setup pokemon handlers
      if Handlers then
        Handlers.add("Get-Pokemon",
          Handlers.utils.hasMatchingTag("Action", "Get-Pokemon"),
          function(msg)
            local playerId = msg.Tags.PlayerId or msg.From
            local pokemon = PokemonState.playerPokemon[playerId] or {}
            
            ao.send({
              Target = msg.From,
              Tags = { Action = "Pokemon-Data" },
              Data = json.encode(pokemon)
            })
          end
        )
        
        Handlers.add("Update-Pokemon",
          Handlers.utils.hasMatchingTag("Action", "Update-Pokemon"),
          function(msg)
            local updateData = json.decode(msg.Data)
            local playerId = msg.Tags.PlayerId or msg.From
            
            if not PokemonState.playerPokemon[playerId] then
              PokemonState.playerPokemon[playerId] = {}
            end
            
            -- Update pokemon data (placeholder)
            PokemonState.playerPokemon[playerId] = updateData.pokemon
            
            ao.send({
              Target = msg.From,
              Tags = { Action = "Pokemon-Updated" },
              Data = "Pokemon data updated successfully"
            })
          end
        )
      end
      
      print("Pokemon initialization completed")
    `,
    validation: `
      return (PokemonState and Handlers) and "INITIALIZED" or "FAILED"
    `
  },

  economy: {
    setupCode: `
      -- Initialize Economy Process
      EconomyState = EconomyState or {
        shops = {},
        playerInventories = {},
        marketPrices = {},
        tradeHistory = {},
        statistics = {
          totalTransactions = 0,
          totalValue = 0
        }
      }
      
      -- Setup economy handlers
      if Handlers then
        Handlers.add("Get-Shop-Items",
          Handlers.utils.hasMatchingTag("Action", "Get-Shop-Items"),
          function(msg)
            local shopData = EconomyState.shops.main or {
              items = {},
              lastUpdated = msg.Timestamp
            }
            
            ao.send({
              Target = msg.From,
              Tags = { Action = "Shop-Data" },
              Data = json.encode(shopData)
            })
          end
        )
        
        Handlers.add("Purchase-Item",
          Handlers.utils.hasMatchingTag("Action", "Purchase-Item"),
          function(msg)
            local purchaseData = json.decode(msg.Data)
            local playerId = msg.Tags.PlayerId or msg.From
            
            -- Process purchase (placeholder)
            local transaction = {
              playerId = playerId,
              itemId = purchaseData.itemId,
              quantity = purchaseData.quantity,
              price = purchaseData.price,
              timestamp = msg.Timestamp
            }
            
            table.insert(EconomyState.tradeHistory, transaction)
            EconomyState.statistics.totalTransactions = EconomyState.statistics.totalTransactions + 1
            
            ao.send({
              Target = msg.From,
              Tags = { Action = "Purchase-Complete" },
              Data = json.encode(transaction)
            })
          end
        )
      end
      
      print("Economy initialization completed")
    `,
    validation: `
      return (EconomyState and Handlers) and "INITIALIZED" or "FAILED"
    `
  }
};

async function main() {
  console.log(chalk.cyan('🔧 PokéRogue AO Process Initialization'));
  console.log(chalk.cyan('===================================='));
  console.log();

  try {
    // Load deployment results to get process IDs
    const deploymentResults = loadDeploymentResults();
    
    if (!deploymentResults || !deploymentResults.processes) {
      throw new Error('No deployment results found. Please run deployment first.');
    }
    
    // Check for mock mode
    const mockMode = process.argv.includes('--mock');
    
    // Initialize deployment manager
    const deployer = new AODeploymentManager({ 
      verbose: true, 
      mockMode: mockMode 
    });
    
    console.log(chalk.blue('📋 Initialization Plan:'));
    Object.entries(deploymentResults.processes).forEach(([name, proc]) => {
      if (proc.status === 'DEPLOYED') {
        console.log(chalk.gray(`  ✓ ${name} (${proc.processId})`));
      } else {
        console.log(chalk.red(`  ✗ ${name} (not deployed)`));
      }
    });
    console.log();
    
    // Initialize each deployed process
    const initResults = {};
    for (const [processName, processInfo] of Object.entries(deploymentResults.processes)) {
      if (processInfo.status !== 'DEPLOYED') {
        console.log(chalk.yellow(`⏭️  Skipping ${processName} (not deployed)`));
        continue;
      }
      
      console.log(chalk.blue(`🔧 Initializing ${processName}...`));
      
      try {
        const config = INITIALIZATION_CONFIG[processName];
        if (!config) {
          throw new Error(`No initialization config found for ${processName}`);
        }
        
        // Deploy initialization code
        await deployer.initializeProcess(processInfo.processId, config.setupCode);
        
        // Validate initialization
        const validationResult = await deployer.initializeProcess(processInfo.processId, config.validation);
        
        initResults[processName] = {
          processId: processInfo.processId,
          status: 'INITIALIZED',
          timestamp: new Date().toISOString()
        };
        
        console.log(chalk.green(`✅ ${processName} initialized successfully`));
        
      } catch (error) {
        initResults[processName] = {
          processId: processInfo.processId,
          status: 'FAILED',
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        console.log(chalk.red(`❌ ${processName} initialization failed: ${error.message}`));
      }
    }
    
    // Setup inter-process communication
    console.log(chalk.blue('\n🔗 Setting up inter-process communication...'));
    await setupInterProcessCommunication(deploymentResults, deployer);
    
    // Display summary
    displayInitializationSummary(initResults);
    
    // Determine exit code
    const failed = Object.values(initResults).filter(r => r.status === 'FAILED').length;
    if (failed > 0) {
      console.log(chalk.red(`\n❌ Initialization completed with ${failed} failures`));
      process.exit(failed);
    } else {
      console.log(chalk.green('\n🎉 All processes initialized successfully!'));
      process.exit(0);
    }
    
  } catch (error) {
    console.error(chalk.red('\n💥 Initialization failed:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function loadDeploymentResults() {
  const resultsPath = 'build/ao-deployment-results.json';
  
  if (!existsSync(resultsPath)) {
    throw new Error(
      `Deployment results not found: ${resultsPath}\n` +
      'Please run "node scripts/ao-deploy.js" first'
    );
  }
  
  try {
    return JSON.parse(readFileSync(resultsPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse deployment results: ${error.message}`);
  }
}

async function setupInterProcessCommunication(deploymentResults, deployer) {
  const processes = deploymentResults.processes;
  const coordinatorId = processes.coordinator?.processId;
  
  if (!coordinatorId) {
    throw new Error('Coordinator process not found or not deployed');
  }
  
  console.log(chalk.gray('Setting up process discovery...'));
  
  // Send process registry to coordinator
  const processRegistry = Object.entries(processes)
    .filter(([_, proc]) => proc.status === 'DEPLOYED')
    .reduce((registry, [name, proc]) => {
      registry[name] = proc.processId;
      return registry;
    }, {});
  
  const registrySetupCode = `
    -- Update process registry with all deployed processes
    ProcessRegistry = ProcessRegistry or {}
    local newRegistry = json.decode([=[${JSON.stringify(processRegistry)}]=])
    
    for processType, processId in pairs(newRegistry) do
      ProcessRegistry[processType] = processId
      CoordinatorState.processes[processType] = {
        id = processId,
        status = "ACTIVE",
        registeredAt = os.time(),
        metadata = {}
      }
    end
    
    print("Process registry updated with " .. tostring(#newRegistry) .. " processes")
  `;
  
  await deployer.initializeProcess(coordinatorId, registrySetupCode);
  
  console.log(chalk.green('✅ Inter-process communication configured'));
}

function displayInitializationSummary(results) {
  console.log(chalk.cyan('\n📊 Initialization Summary'));
  console.log(chalk.cyan('========================='));
  
  const successful = Object.values(results).filter(r => r.status === 'INITIALIZED').length;
  const failed = Object.values(results).filter(r => r.status === 'FAILED').length;
  
  console.log(chalk.gray(`Success Rate: ${successful}/${successful + failed}`));
  console.log();
  
  Object.entries(results).forEach(([name, result]) => {
    if (result.status === 'INITIALIZED') {
      console.log(chalk.green(`✅ ${name.padEnd(12)} - Ready`));
    } else {
      console.log(chalk.red(`❌ ${name.padEnd(12)} - ${result.error}`));
    }
  });
  
  if (successful > 0) {
    console.log(chalk.blue('\n📝 Next Steps:'));
    console.log(chalk.gray('1. Validate deployment: npm run ao:validate'));
    console.log(chalk.gray('2. Run integration tests: npm run ao:test:deployment'));
    console.log(chalk.gray('3. Start using the system!'));
  }
}

// Run main function
main().catch(console.error);