#!/usr/bin/env node

import { spawn, message, result, monitor, connect, createDataItemSigner } from '@permaweb/aoconnect';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { generateKeyPair } from 'crypto';
import { promisify } from 'util';
import chalk from 'chalk';

/**
 * AO Connect Deployment Library
 * 
 * Provides programmatic deployment capabilities for AO processes
 * using the @permaweb/aoconnect library instead of AOS CLI.
 */

// Default AO configuration - try mainnet URLs
const DEFAULT_AO_CONFIG = {
  MU_URL: "https://mu.ao-testnet.xyz",
  CU_URL: "https://cu.ao-testnet.xyz", 
  GATEWAY_URL: "https://arweave.net"
};

export class AODeploymentManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_AO_CONFIG, ...config };
    this.deploymentResults = new Map();
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 5000;
    this.mockMode = config.mockMode || false;
    
    // Initialize AO connection (signer will be initialized async)
    if (!this.mockMode) {
      this.ao = connect(this.config);
    }
    
    // Deployment logging
    this.verbose = config.verbose || false;
  }

  async initialize(config = {}) {
    if (!this.mockMode) {
      // Test network connectivity
      await this.testNetworkConnectivity();
      
      // Create signer from wallet (use default or provided wallet)
      this.wallet = config.wallet || await this.generateDefaultWallet();
      if (this.wallet) {
        this.signer = createDataItemSigner(this.wallet);
        this.log('Wallet and signer initialized', 'info');
      } else {
        // For testnet, try without signer
        this.signer = null;
        this.log('Running without signer - testnet mode', 'warn');
      }
    }
  }

  async testNetworkConnectivity() {
    this.log('Testing AO network connectivity...', 'info');
    
    try {
      // Test MU endpoint
      const muResponse = await fetch(this.config.MU_URL);
      this.log(`MU endpoint (${this.config.MU_URL}): ${muResponse.status}`, 'info');
      
      // Test CU endpoint  
      const cuResponse = await fetch(this.config.CU_URL);
      this.log(`CU endpoint (${this.config.CU_URL}): ${cuResponse.status}`, 'info');
      
    } catch (error) {
      this.log(`Network connectivity test failed: ${error.message}`, 'warn');
    }
  }

  /**
   * Deploy a single AO process from bundled Lua code
   */
  async deployProcess(processName, options = {}) {
    const startTime = Date.now();
    
    this.log(`🚀 Deploying ${processName} process...`, 'info');
    
    try {
      // 1. Load the bundled Lua code
      const bundlePath = options.bundlePath || join('build', `${processName}-process.lua`);
      const luaCode = this.loadBundleCode(bundlePath);
      
      // 2. Spawn the AO process
      const processId = await this.spawnProcess(processName, options);
      
      // 3. Deploy the code to the process
      await this.deployCode(processId, luaCode, options);
      
      // 4. Run initialization if provided
      if (options.initCode) {
        await this.initializeProcess(processId, options.initCode);
      }
      
      // 5. Health check
      const isHealthy = await this.healthCheck(processId, options);
      
      const deploymentTime = Date.now() - startTime;
      const result = {
        processName,
        processId,
        status: isHealthy ? 'DEPLOYED' : 'UNHEALTHY',
        deploymentTime,
        timestamp: new Date().toISOString()
      };
      
      this.deploymentResults.set(processName, result);
      
      this.log(`✅ ${processName} deployed successfully (${deploymentTime}ms)`, 'success');
      this.log(`   Process ID: ${processId}`, 'info');
      
      return result;
      
    } catch (error) {
      const deploymentTime = Date.now() - startTime;
      const result = {
        processName,
        processId: null,
        status: 'FAILED',
        error: error.message,
        deploymentTime,
        timestamp: new Date().toISOString()
      };
      
      this.deploymentResults.set(processName, result);
      
      this.log(`❌ ${processName} deployment failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Spawn a new AO process
   */
  async spawnProcess(processName, options = {}) {
    // Mock mode for testing
    if (this.mockMode) {
      this.log(`[MOCK] Spawning ${processName} process...`, 'info');
      await this.delay(500); // Simulate network delay
      const mockProcessId = `mock_${processName}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      this.log(`[MOCK] Process spawned: ${mockProcessId}`, 'success');
      return mockProcessId;
    }
    
    const spawnOptions = {
      // Try new module that might have better Eval support
      module: options.module || "mzFmF0rEoA5JyOX6G7Fwc97L6dQfwMUFuQmZNQFg6yc", // New module to test
      scheduler: options.scheduler || "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA", // Default scheduler
      tags: [
        { name: 'App-Name', value: 'PokéRogue' },
        { name: 'App-Version', value: '1.10.4' },
        { name: 'Process-Type', value: processName },
        { name: 'Content-Type', value: 'text/plain' },
        { name: 'Authority', value: 'fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY' },
        ...(options.tags || [])
      ]
    };

    // Add signer if available
    if (this.signer) {
      spawnOptions.signer = this.signer;
    }

    this.log(`Spawning ${processName} process...`, 'info');
    
    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        this.log(`Signer available: ${!!this.signer}`, 'info');
        this.log(`Signer type: ${typeof this.signer}`, 'info');
        const logOptions = { ...spawnOptions, signer: this.signer ? '[Function]' : undefined };
        this.log(`Spawning with options: ${JSON.stringify(logOptions, null, 2)}`, 'info');
        const result = await spawn(spawnOptions);
        
        this.log(`Raw spawn result: ${JSON.stringify(result)}`, 'info');
        
        // Handle different response formats
        const processId = typeof result === 'string' ? result : result?.id || result?.processId;
        
        if (!processId) {
          throw new Error(`Spawn returned invalid result: ${JSON.stringify(result)}`);
        }
        
        this.log(`Process spawned: ${processId}`, 'success');
        return processId;
        
      } catch (error) {
        lastError = error;
        this.log(`Spawn attempt ${attempt}/${this.retryAttempts} failed: ${error.message}`, 'warn');
        
        // Log additional error details for debugging
        if (error.response) {
          this.log(`HTTP Status: ${error.response.status}`, 'warn');
          this.log(`Response Data: ${JSON.stringify(error.response.data)}`, 'warn');
        }
        if (error.code) {
          this.log(`Error Code: ${error.code}`, 'warn');
        }
        if (error.stack && this.verbose) {
          this.log(`Stack Trace: ${error.stack}`, 'warn');
        }
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay);
        }
      }
    }
    
    throw new Error(`Failed to spawn ${processName} after ${this.retryAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Deploy Lua code to an AO process
   */
  async deployCode(processId, luaCode, options = {}) {
    // Mock mode for testing
    if (this.mockMode) {
      this.log(`[MOCK] Deploying code to process ${processId}...`, 'info');
      const chunks = this.chunkCode(luaCode, options.chunkSize || 50000);
      
      for (let i = 0; i < chunks.length; i++) {
        this.log(`[MOCK] Deploying chunk ${i + 1}/${chunks.length}...`, 'info');
        await this.delay(200); // Simulate deployment time
      }
      
      this.log(`[MOCK] Code deployment completed`, 'success');
      return;
    }
    
    this.log(`Deploying code to process ${processId}...`, 'info');
    
    // Split large code into chunks if needed
    const chunks = this.chunkCode(luaCode, options.chunkSize || 50000);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLastChunk = i === chunks.length - 1;
      
      this.log(`Deploying chunk ${i + 1}/${chunks.length}...`, 'info');
      
      let lastError;
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          const messageId = await message({
            process: processId,
            signer: this.signer,
            tags: [
              { name: 'Action', value: 'Eval' },
              { name: 'Chunk', value: `${i + 1}` },
              { name: 'Total-Chunks', value: `${chunks.length}` },
              { name: 'Is-Last', value: isLastChunk.toString() }
            ],
            data: chunk
          });
          
          // Wait for result if this is the last chunk
          if (isLastChunk) {
            const res = await result({
              message: messageId,
              process: processId
            });
            
            if (res.Error) {
              throw new Error(`Code deployment error: ${res.Error}`);
            }
            
            this.log(`Code deployment completed`, 'success');
          }
          
          break; // Success, exit retry loop
          
        } catch (error) {
          lastError = error;
          this.log(`Code deployment attempt ${attempt}/${this.retryAttempts} failed: ${error.message}`, 'warn');
          
          if (attempt < this.retryAttempts) {
            await this.delay(this.retryDelay);
          }
        }
      }
      
      if (lastError && i === chunks.length - 1) {
        throw new Error(`Failed to deploy code after ${this.retryAttempts} attempts: ${lastError.message}`);
      }
    }
  }

  /**
   * Initialize a process with setup code
   */
  async initializeProcess(processId, initCode) {
    this.log(`Initializing process ${processId}...`, 'info');
    
    // Mock mode for testing
    if (this.mockMode) {
      await this.delay(400); // Simulate initialization time
      this.log(`[MOCK] Process initialization completed`, 'success');
      return { success: true, processId, type: 'initialization' };
    }
    
    const messageId = await message({
      process: processId,
      signer: this.signer,
      tags: [
        { name: 'Action', value: 'Eval' },
        { name: 'Type', value: 'Initialization' }
      ],
      data: initCode
    });
    
    const res = await result({
      message: messageId,
      process: processId
    });
    
    if (res.Error) {
      throw new Error(`Process initialization error: ${res.Error}`);
    }
    
    this.log(`Process initialization completed`, 'success');
    return res;
  }

  /**
   * Perform health check on deployed process
   */
  async healthCheck(processId, options = {}) {
    this.log(`Performing health check on ${processId}...`, 'info');
    
    // Mock mode for testing
    if (this.mockMode) {
      await this.delay(300); // Simulate health check time
      this.log(`[MOCK] Health check passed`, 'success');
      return true;
    }
    
    try {
      const healthCheckCode = options.healthCheck || `
        if Handlers and ao then
          ao.send({
            Target = ao.id,
            Tags = { Action = "Health-Check" },
            Data = "ping"
          })
          return "HEALTHY"
        else
          return "UNHEALTHY: Missing core components"
        end
      `;
      
      const messageId = await message({
        process: processId,
        signer: this.signer,
        tags: [
          { name: 'Action', value: 'Health-Check' }
        ],
        data: healthCheckCode
      });
      
      const res = await result({
        message: messageId,
        process: processId
      });
      
      const isHealthy = !res.Error && res.Output?.data?.output?.includes('HEALTHY');
      
      if (isHealthy) {
        this.log(`Health check passed`, 'success');
      } else {
        this.log(`Health check failed: ${res.Error || 'Unknown error'}`, 'warn');
      }
      
      return isHealthy;
      
    } catch (error) {
      this.log(`Health check error: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Register process with coordinator
   */
  async registerProcess(processId, coordinatorId, processType, metadata = {}) {
    this.log(`Registering ${processType} process with coordinator...`, 'info');
    
    // Mock mode for testing
    if (this.mockMode) {
      await this.delay(200); // Simulate registration time
      this.log(`[MOCK] Process registered successfully`, 'success');
      return { success: true, processType, processId };
    }
    
    const registrationData = {
      processId,
      processType,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    const messageId = await message({
      process: coordinatorId,
      signer: this.signer,
      tags: [
        { name: 'Action', value: 'Register-Process' },
        { name: 'Process-Type', value: processType },
        { name: 'Process-ID', value: processId }
      ],
      data: JSON.stringify(registrationData)
    });
    
    const res = await result({
      message: messageId,
      process: coordinatorId
    });
    
    if (res.Error) {
      throw new Error(`Process registration failed: ${res.Error}`);
    }
    
    this.log(`Process registered successfully`, 'success');
    return res;
  }

  /**
   * Deploy multiple processes in order with coordination
   */
  async deployMultiProcess(deploymentPlan, options = {}) {
    const startTime = Date.now();
    this.log(`🚀 Starting multi-process deployment...`, 'info');
    
    const results = [];
    let coordinatorId = null;
    
    for (const processConfig of deploymentPlan) {
      try {
        const result = await this.deployProcess(processConfig.name, processConfig.options);
        results.push(result);
        
        // Store coordinator ID for process registration
        if (processConfig.name === 'coordinator') {
          coordinatorId = result.processId;
        }
        
        // Register non-coordinator processes with coordinator
        if (coordinatorId && processConfig.name !== 'coordinator') {
          await this.registerProcess(
            result.processId, 
            coordinatorId, 
            processConfig.name,
            processConfig.metadata || {}
          );
        }
        
        // Delay between deployments
        if (processConfig !== deploymentPlan[deploymentPlan.length - 1]) {
          await this.delay(options.deploymentDelay || 2000);
        }
        
      } catch (error) {
        this.log(`Deployment failed for ${processConfig.name}: ${error.message}`, 'error');
        
        if (options.failFast !== false) {
          throw error;
        }
        
        results.push({
          processName: processConfig.name,
          status: 'FAILED',
          error: error.message
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const summary = this.generateDeploymentSummary(results, totalTime);
    
    return summary;
  }

  /**
   * Generate a default wallet for testing
   */
  async generateDefaultWallet() {
    // Try loading wallet from file first
    const walletPath = 'wallet.json';
    if (existsSync(walletPath)) {
      try {
        const walletData = readFileSync(walletPath, 'utf8');
        const wallet = JSON.parse(walletData);
        this.log('Loaded wallet from wallet.json', 'info');
        return wallet;
      } catch (error) {
        this.log(`Failed to load wallet from ${walletPath}: ${error.message}`, 'warn');
      }
    }
    
    // Generate a test wallet for development
    this.log('Generating test wallet for development...', 'warn');
    
    const generateKeyPairPromise = promisify(generateKeyPair);
    const { privateKey } = await generateKeyPairPromise('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'spki', format: 'jwk' },
      privateKeyEncoding: { type: 'pkcs8', format: 'jwk' }
    });
    
    // Convert to Arweave wallet format
    const wallet = privateKey;
    
    // Save for future use
    writeFileSync(walletPath, JSON.stringify(wallet, null, 2));
    this.log(`Generated and saved test wallet to ${walletPath}`, 'info');
    
    return wallet;
  }

  /**
   * Utility functions
   */
  loadBundleCode(bundlePath) {
    if (!existsSync(bundlePath)) {
      throw new Error(`Bundle file not found: ${bundlePath}`);
    }
    
    const code = readFileSync(bundlePath, 'utf8');
    if (!code.trim()) {
      throw new Error(`Bundle file is empty: ${bundlePath}`);
    }
    
    this.log(`Loaded bundle: ${bundlePath} (${code.length} chars)`, 'info');
    return code;
  }

  chunkCode(code, chunkSize) {
    if (code.length <= chunkSize) {
      return [code];
    }
    
    const chunks = [];
    for (let i = 0; i < code.length; i += chunkSize) {
      chunks.push(code.slice(i, i + chunkSize));
    }
    
    this.log(`Split code into ${chunks.length} chunks`, 'info');
    return chunks;
  }

  generateDeploymentSummary(results, totalTime) {
    const successful = results.filter(r => r.status === 'DEPLOYED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalDeploymentTime: totalTime,
      processCount: results.length,
      successful,
      failed,
      processes: Object.fromEntries(
        results.map(r => [r.processName, r])
      )
    };
    
    // Save to file
    const summaryPath = join('build', 'ao-deployment-results.json');
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    this.log(`Deployment summary saved: ${summaryPath}`, 'info');
    return summary;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, level = 'info') {
    if (!this.verbose && level === 'info') return;
    
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red
    };
    
    const color = colors[level] || chalk.white;
    const timestamp = new Date().toISOString().substring(11, 23);
    
    console.log(`${chalk.gray(timestamp)} ${color(`[${level.toUpperCase()}]`)} ${message}`);
  }

  /**
   * Rollback deployment by terminating processes
   */
  async rollbackDeployment(processIds) {
    this.log(`🔄 Rolling back deployment for ${processIds.length} processes...`, 'warn');
    
    const results = [];
    for (const processId of processIds) {
      try {
        // Send termination message
        const messageId = await message({
          process: processId,
          signer: this.signer,
          tags: [
            { name: 'Action', value: 'Terminate' }
          ],
          data: 'Rollback deployment'
        });
        
        results.push({ processId, status: 'TERMINATED' });
        this.log(`Process ${processId} terminated`, 'success');
        
      } catch (error) {
        results.push({ processId, status: 'FAILED_TO_TERMINATE', error: error.message });
        this.log(`Failed to terminate ${processId}: ${error.message}`, 'error');
      }
    }
    
    return results;
  }
}

export default AODeploymentManager;