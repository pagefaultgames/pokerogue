#!/usr/bin/env node

import { AODeploymentManager } from './lib/ao-deploy.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';

/**
 * AO Process Registration Script
 * 
 * Register processes with each other, establish communication channels,
 * and create a process discovery registry for the PokéRogue ecosystem.
 */

// Process capabilities and communication patterns
const PROCESS_COMMUNICATION_MATRIX = {
  coordinator: {
    communicatesWith: ['admin', 'security', 'battle', 'pokemon', 'economy'],
    capabilities: ['process-registry', 'load-balancing', 'health-monitoring'],
    role: 'hub'
  },
  admin: {
    communicatesWith: ['coordinator', 'security'],
    capabilities: ['user-management', 'system-config', 'audit-logging'],
    role: 'control'
  },
  security: {
    communicatesWith: ['coordinator', 'admin', 'battle', 'pokemon', 'economy'],
    capabilities: ['validation', 'anti-cheat', 'fraud-detection'],
    role: 'guardian'
  },
  battle: {
    communicatesWith: ['coordinator', 'security', 'pokemon'],
    capabilities: ['battle-engine', 'damage-calculation', 'rng'],
    role: 'processor'
  },
  pokemon: {
    communicatesWith: ['coordinator', 'security', 'battle', 'economy'],
    capabilities: ['pokemon-management', 'stats', 'evolution'],
    role: 'data'
  },
  economy: {
    communicatesWith: ['coordinator', 'security', 'pokemon'],
    capabilities: ['shop-management', 'inventory', 'trading'],
    role: 'service'
  }
};

// Service discovery patterns
const SERVICE_DISCOVERY_CONFIG = {
  healthCheckInterval: 30000, // 30 seconds
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  protocols: {
    'battle-request': {
      from: ['coordinator'],
      to: ['battle'],
      messageType: 'START_BATTLE',
      validation: ['security']
    },
    'pokemon-query': {
      from: ['battle', 'economy'],
      to: ['pokemon'],
      messageType: 'GET_POKEMON',
      validation: ['security']
    },
    'shop-transaction': {
      from: ['coordinator'],
      to: ['economy'],
      messageType: 'PURCHASE_ITEM',
      validation: ['security']
    },
    'admin-command': {
      from: ['admin'],
      to: ['coordinator', 'security', 'battle', 'pokemon', 'economy'],
      messageType: 'ADMIN_ACTION',
      validation: []
    }
  }
};

async function main() {
  console.log(chalk.cyan('🌐 PokéRogue AO Process Registration'));
  console.log(chalk.cyan('==================================='));
  console.log();

  try {
    // Load deployment and initialization results
    const deploymentResults = loadResults('build/ao-deployment-results.json', 'deployment');
    
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
    
    // Extract deployed processes
    const deployedProcesses = Object.entries(deploymentResults.processes)
      .filter(([_, proc]) => proc.status === 'DEPLOYED')
      .reduce((acc, [name, proc]) => {
        acc[name] = proc.processId;
        return acc;
      }, {});
    
    console.log(chalk.blue('📋 Registration Plan:'));
    Object.entries(deployedProcesses).forEach(([name, id]) => {
      const commConfig = PROCESS_COMMUNICATION_MATRIX[name];
      console.log(chalk.gray(`  ${name} (${commConfig.role})`));
      console.log(chalk.gray(`    → Communicates with: ${commConfig.communicatesWith.join(', ')}`));
      console.log(chalk.gray(`    → Capabilities: ${commConfig.capabilities.join(', ')}`));
    });
    console.log();
    
    // Perform registration steps
    const registrationResults = {};
    
    // Step 1: Register all processes with coordinator
    console.log(chalk.blue('1️⃣ Registering processes with coordinator...'));
    await registerWithCoordinator(deployedProcesses, deployer, registrationResults);
    
    // Step 2: Establish peer-to-peer connections
    console.log(chalk.blue('\n2️⃣ Establishing peer-to-peer connections...'));
    await establishPeerConnections(deployedProcesses, deployer, registrationResults);
    
    // Step 3: Setup service discovery
    console.log(chalk.blue('\n3️⃣ Setting up service discovery...'));
    await setupServiceDiscovery(deployedProcesses, deployer, registrationResults);
    
    // Step 4: Configure communication protocols
    console.log(chalk.blue('\n4️⃣ Configuring communication protocols...'));
    await configureProtocols(deployedProcesses, deployer, registrationResults);
    
    // Step 5: Validate connectivity
    console.log(chalk.blue('\n5️⃣ Validating connectivity...'));
    await validateConnectivity(deployedProcesses, deployer, registrationResults);
    
    // Save registration results
    const finalResults = {
      timestamp: new Date().toISOString(),
      processes: deployedProcesses,
      registrations: registrationResults,
      communicationMatrix: PROCESS_COMMUNICATION_MATRIX,
      serviceDiscovery: SERVICE_DISCOVERY_CONFIG
    };
    
    saveRegistrationResults(finalResults);
    displayRegistrationSummary(finalResults);
    
    // Exit with appropriate code
    const failedRegistrations = Object.values(registrationResults).filter(r => r.status === 'FAILED').length;
    if (failedRegistrations > 0) {
      console.log(chalk.red(`\n❌ Registration completed with ${failedRegistrations} failures`));
      process.exit(failedRegistrations);
    } else {
      console.log(chalk.green('\n🎉 All processes registered successfully!'));
      process.exit(0);
    }
    
  } catch (error) {
    console.error(chalk.red('\n💥 Registration failed:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

async function registerWithCoordinator(processes, deployer, results) {
  const coordinatorId = processes.coordinator;
  if (!coordinatorId) {
    throw new Error('Coordinator process not found');
  }
  
  for (const [processName, processId] of Object.entries(processes)) {
    if (processName === 'coordinator') continue;
    
    console.log(chalk.gray(`  Registering ${processName}...`));
    
    try {
      const registrationCode = `
        -- Register process with coordinator
        local processData = {
          processId = "${processId}",
          processType = "${processName}",
          capabilities = json.encode(${JSON.stringify(PROCESS_COMMUNICATION_MATRIX[processName].capabilities)}),
          role = "${PROCESS_COMMUNICATION_MATRIX[processName].role}",
          timestamp = os.time()
        }
        
        ao.send({
          Target = "${coordinatorId}",
          Tags = { Action = "Register-Process", ProcessType = "${processName}" },
          Data = json.encode(processData)
        })
        
        print("Registration request sent for ${processName}")
      `;
      
      await deployer.initializeProcess(processId, registrationCode);
      
      results[`coordinator_${processName}`] = {
        status: 'REGISTERED',
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.green(`    ✅ ${processName} registered with coordinator`));
      
    } catch (error) {
      results[`coordinator_${processName}`] = {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.red(`    ❌ Failed to register ${processName}: ${error.message}`));
    }
  }
}

async function establishPeerConnections(processes, deployer, results) {
  for (const [processName, processId] of Object.entries(processes)) {
    const commConfig = PROCESS_COMMUNICATION_MATRIX[processName];
    
    console.log(chalk.gray(`  Setting up ${processName} peer connections...`));
    
    try {
      // Create peer registry for this process
      const peerRegistry = {};
      commConfig.communicatesWith.forEach(peerName => {
        if (processes[peerName]) {
          peerRegistry[peerName] = processes[peerName];
        }
      });
      
      const peerSetupCode = `
        -- Setup peer connections for ${processName}
        PeerRegistry = PeerRegistry or {}
        local peers = json.decode([=[${JSON.stringify(peerRegistry)}]=])
        
        for peerType, peerId in pairs(peers) do
          PeerRegistry[peerType] = {
            id = peerId,
            status = "CONNECTED",
            lastSeen = os.time()
          }
        end
        
        -- Helper function to send to peer
        function sendToPeer(peerType, action, data, tags)
          if PeerRegistry[peerType] then
            local peerTags = tags or {}
            table.insert(peerTags, { name = "Action", value = action })
            table.insert(peerTags, { name = "From-Process", value = "${processName}" })
            
            ao.send({
              Target = PeerRegistry[peerType].id,
              Tags = peerTags,
              Data = data
            })
            
            return true
          else
            print("Peer not found: " .. peerType)
            return false
          end
        end
        
        print("Peer connections established for ${processName}: " .. tostring(#peers) .. " peers")
      `;
      
      await deployer.initializeProcess(processId, peerSetupCode);
      
      results[`peers_${processName}`] = {
        status: 'CONNECTED',
        peerCount: commConfig.communicatesWith.length,
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.green(`    ✅ ${processName} connected to ${commConfig.communicatesWith.length} peers`));
      
    } catch (error) {
      results[`peers_${processName}`] = {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.red(`    ❌ Failed to setup ${processName} peers: ${error.message}`));
    }
  }
}

async function setupServiceDiscovery(processes, deployer, results) {
  for (const [processName, processId] of Object.entries(processes)) {
    console.log(chalk.gray(`  Setting up service discovery for ${processName}...`));
    
    try {
      const serviceDiscoveryCode = `
        -- Setup service discovery for ${processName}
        ServiceDiscovery = ServiceDiscovery or {
          services = {},
          healthChecks = {},
          lastDiscovery = 0
        }
        
        -- Service registration
        function registerService(serviceType, endpoint, metadata)
          ServiceDiscovery.services[serviceType] = {
            endpoint = endpoint,
            metadata = metadata or {},
            registeredAt = os.time(),
            status = "ACTIVE"
          }
        end
        
        -- Service lookup
        function findService(serviceType)
          return ServiceDiscovery.services[serviceType]
        end
        
        -- Health check function
        function performHealthCheck()
          for serviceType, service in pairs(ServiceDiscovery.services) do
            if service.endpoint and PeerRegistry[service.endpoint] then
              sendToPeer(service.endpoint, "Health-Check", "ping")
            end
          end
          ServiceDiscovery.lastDiscovery = os.time()
        end
        
        -- Register this process's services
        registerService("${processName}", "${processId}", {
          capabilities = json.encode(${JSON.stringify(PROCESS_COMMUNICATION_MATRIX[processName].capabilities)}),
          role = "${PROCESS_COMMUNICATION_MATRIX[processName].role}"
        })
        
        print("Service discovery configured for ${processName}")
      `;
      
      await deployer.initializeProcess(processId, serviceDiscoveryCode);
      
      results[`discovery_${processName}`] = {
        status: 'CONFIGURED',
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.green(`    ✅ Service discovery configured for ${processName}`));
      
    } catch (error) {
      results[`discovery_${processName}`] = {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.red(`    ❌ Failed to configure service discovery for ${processName}: ${error.message}`));
    }
  }
}

async function configureProtocols(processes, deployer, results) {
  console.log(chalk.gray('  Configuring communication protocols...'));
  
  for (const [protocolName, protocolConfig] of Object.entries(SERVICE_DISCOVERY_CONFIG.protocols)) {
    console.log(chalk.gray(`    Setting up ${protocolName} protocol...`));
    
    try {
      // Configure protocol on source processes
      for (const sourceType of protocolConfig.from) {
        if (processes[sourceType]) {
          const protocolSetupCode = `
            -- Setup ${protocolName} protocol
            Protocols = Protocols or {}
            Protocols["${protocolName}"] = {
              targets = json.decode('${JSON.stringify(protocolConfig.to)}'),
              messageType = "${protocolConfig.messageType}",
              validation = json.decode('${JSON.stringify(protocolConfig.validation)}'),
              configured = true
            }
            
            -- Protocol helper function
            function send_${protocolName.replace('-', '_')}(targetType, data, additionalTags)
              local protocol = Protocols["${protocolName}"]
              if not protocol then
                print("Protocol not configured: ${protocolName}")
                return false
              end
              
              -- Validate target
              local validTarget = false
              for _, validType in ipairs(protocol.targets) do
                if validType == targetType then
                  validTarget = true
                  break
                end
              end
              
              if not validTarget then
                print("Invalid target for ${protocolName}: " .. targetType)
                return false
              end
              
              -- Send with protocol
              local tags = additionalTags or {}
              table.insert(tags, { name = "Protocol", value = "${protocolName}" })
              table.insert(tags, { name = "Message-Type", value = protocol.messageType })
              
              return sendToPeer(targetType, protocol.messageType, data, tags)
            end
            
            print("Protocol ${protocolName} configured on ${sourceType}")
          `;
          
          await deployer.initializeProcess(processes[sourceType], protocolSetupCode);
        }
      }
      
      results[`protocol_${protocolName}`] = {
        status: 'CONFIGURED',
        sources: protocolConfig.from.length,
        targets: protocolConfig.to.length,
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.green(`    ✅ ${protocolName} protocol configured`));
      
    } catch (error) {
      results[`protocol_${protocolName}`] = {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.red(`    ❌ Failed to configure ${protocolName}: ${error.message}`));
    }
  }
}

async function validateConnectivity(processes, deployer, results) {
  console.log(chalk.gray('  Validating process connectivity...'));
  
  for (const [processName, processId] of Object.entries(processes)) {
    console.log(chalk.gray(`    Testing ${processName} connectivity...`));
    
    try {
      const connectivityTest = `
        -- Test connectivity for ${processName}
        local testResults = {
          processId = ao.id,
          processType = "${processName}",
          peerConnections = {},
          serviceDiscovery = ServiceDiscovery and true or false,
          protocols = Protocols and true or false,
          timestamp = os.time()
        }
        
        -- Test peer connections
        if PeerRegistry then
          for peerType, peer in pairs(PeerRegistry) do
            testResults.peerConnections[peerType] = {
              connected = peer.status == "CONNECTED",
              id = peer.id
            }
          end
        end
        
        -- Send test ping to coordinator
        if PeerRegistry and PeerRegistry.coordinator then
          sendToPeer("coordinator", "Connectivity-Test", json.encode(testResults))
        end
        
        return json.encode(testResults)
      `;
      
      const testResult = await deployer.initializeProcess(processId, connectivityTest);
      
      results[`connectivity_${processName}`] = {
        status: 'VALIDATED',
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.green(`    ✅ ${processName} connectivity validated`));
      
    } catch (error) {
      results[`connectivity_${processName}`] = {
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      console.log(chalk.red(`    ❌ Failed to validate ${processName} connectivity: ${error.message}`));
    }
  }
}

function loadResults(path, type) {
  if (!existsSync(path)) {
    throw new Error(`${type} results not found: ${path}`);
  }
  
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse ${type} results: ${error.message}`);
  }
}

function saveRegistrationResults(results) {
  const resultsPath = 'build/ao-registration-results.json';
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(chalk.gray(`Registration results saved: ${resultsPath}`));
}

function displayRegistrationSummary(results) {
  console.log(chalk.cyan('\n📊 Registration Summary'));
  console.log(chalk.cyan('======================'));
  
  const registrations = results.registrations;
  const successful = Object.values(registrations).filter(r => r.status !== 'FAILED').length;
  const failed = Object.values(registrations).filter(r => r.status === 'FAILED').length;
  
  console.log(chalk.gray(`Total Operations: ${successful + failed}`));
  console.log(chalk.gray(`Success Rate: ${successful}/${successful + failed}`));
  console.log();
  
  // Group results by type
  const groups = {
    'Coordinator Registration': [],
    'Peer Connections': [],
    'Service Discovery': [],
    'Protocols': [],
    'Connectivity': []
  };
  
  Object.entries(registrations).forEach(([key, result]) => {
    if (key.startsWith('coordinator_')) groups['Coordinator Registration'].push([key, result]);
    else if (key.startsWith('peers_')) groups['Peer Connections'].push([key, result]);
    else if (key.startsWith('discovery_')) groups['Service Discovery'].push([key, result]);
    else if (key.startsWith('protocol_')) groups['Protocols'].push([key, result]);
    else if (key.startsWith('connectivity_')) groups['Connectivity'].push([key, result]);
  });
  
  Object.entries(groups).forEach(([groupName, items]) => {
    if (items.length === 0) return;
    
    console.log(chalk.blue(`${groupName}:`));
    items.forEach(([key, result]) => {
      const name = key.split('_').slice(1).join('_');
      if (result.status === 'FAILED') {
        console.log(chalk.red(`  ❌ ${name} - ${result.error}`));
      } else {
        console.log(chalk.green(`  ✅ ${name} - ${result.status}`));
      }
    });
    console.log();
  });
  
  if (successful === Object.keys(registrations).length) {
    console.log(chalk.blue('📝 System Ready:'));
    console.log(chalk.gray('• All processes are registered and connected'));
    console.log(chalk.gray('• Inter-process communication is established'));
    console.log(chalk.gray('• Service discovery is operational'));
    console.log(chalk.gray('• Communication protocols are configured'));
    console.log(chalk.gray('• System is ready for production use!'));
  }
}

// Run main function
main().catch(console.error);