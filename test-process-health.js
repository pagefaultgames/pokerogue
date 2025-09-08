#!/usr/bin/env node

import { connect, createDataItemSigner } from '@permaweb/aoconnect';

// Initialize AO connection
const ao = connect();

// Create a mock signer for testing (we're just sending read-only Info/Eval messages)
const signer = async ({ data, tags }) => ({
  id: 'mock-id',
  raw: new Uint8Array(0),
});

// Process IDs from deployment results
const processes = {
  coordinator: 'TP9oGe2eoVezJwdsX2BM-G5rfsaIoeGMlmIopBd5ybM',
  admin: 'O7AOPI__kXGhgxV-pKbJrDYF5WCmXRPcsj3b0FV6AdE',
  security: '74I9f0JlCSFRe65y34WSYtPTOXIdDUsdCuDcgpkOsXY',
  battle: '9_WB2yREOQOYlRHWAN19pSGAovSBYl_1nel0Jae4l2w',
  pokemon: 'hshqeGII_sVxPDY_n9T6aXRDfc--7diychjOV7SzhgM',
  economy: 'VUCGiON7MbeSHs3cFz1rUeC_BRLn6bWhTOij_bkzoqM'
};

async function testProcessHealth(processName, processId) {
  console.log(`\n🔍 Testing ${processName} process (ID: ${processId.substring(0, 8)}...)`);
  
  try {
    // Test 1: Use dryrun to test Info message without needing a wallet
    console.log('  📋 Testing with dryrun Info message...');
    const dryrunResult = await ao.dryrun({
      process: processId,
      tags: [
        { name: 'Action', value: 'Info' }
      ],
      data: ''
    });
    
    console.log(`  ✅ Dryrun completed`);
    
    const results = dryrunResult;
    
    if (results && results.Messages && results.Messages.length > 0) {
      const response = results.Messages[0];
      console.log(`  📨 Received response with ${response.Tags?.length || 0} tags`);
      
      // Check if response contains process info
      const hasProcessInfo = response.Tags?.some(tag => 
        tag.name === 'Process-Info' || tag.name === 'Handler-List' || tag.name === 'Status'
      );
      
      if (hasProcessInfo) {
        console.log('  ✅ Process responded with metadata');
      } else {
        console.log('  ⚠️  Process responded but no metadata detected');
      }
      
      // Look for health status indicators
      const statusTags = response.Tags?.filter(tag => 
        tag.name.toLowerCase().includes('status') || 
        tag.name.toLowerCase().includes('health')
      );
      
      if (statusTags && statusTags.length > 0) {
        statusTags.forEach(tag => {
          console.log(`  📊 ${tag.name}: ${tag.value}`);
        });
      }
      
      return { status: 'HEALTHY', hasMetadata: hasProcessInfo };
    } else {
      console.log('  ❌ No response received');
      return { status: 'UNHEALTHY', hasMetadata: false };
    }
    
  } catch (error) {
    console.log(`  ❌ Error testing ${processName}: ${error.message}`);
    return { status: 'ERROR', hasMetadata: false, error: error.message };
  }
}

async function testGlobalVariableAccess(processName, processId) {
  console.log(`  🔬 Testing global variable access via Eval...`);
  
  try {
    // Use dryrun for Eval message to test global variable access
    const dryrunResult = await ao.dryrun({
      process: processId,
      tags: [
        { name: 'Action', value: 'Eval' }
      ],
      data: 'return { processName = PROCESS_NAME or "Unknown", version = PROCESS_VERSION or "Unknown", handlers = #Handlers.list or 0 }'
    });
    
    const results = dryrunResult;
    
    if (results && results.Messages && results.Messages.length > 0) {
      const response = results.Messages[0];
      if (response.Data && response.Data !== 'sent pong reply') {
        console.log('  ✅ Eval executed actual code (not pong reply)');
        console.log(`  📝 Response: ${response.Data.substring(0, 100)}...`);
        return true;
      } else {
        console.log('  ❌ Eval returned pong reply instead of executing code');
        return false;
      }
    } else {
      console.log('  ⚠️  No Eval response received');
      return false;
    }
    
  } catch (error) {
    console.log(`  ❌ Error testing global variables: ${error.message}`);
    return false;
  }
}

async function runHealthChecks() {
  console.log('🚀 PokéRogue AO Process Health Check');
  console.log('=====================================');
  
  const results = {};
  let healthyCount = 0;
  let totalCount = 0;
  
  for (const [processName, processId] of Object.entries(processes)) {
    const healthResult = await testProcessHealth(processName, processId);
    const globalAccessResult = await testGlobalVariableAccess(processName, processId);
    
    results[processName] = {
      ...healthResult,
      globalAccess: globalAccessResult
    };
    
    totalCount++;
    if (healthResult.status === 'HEALTHY' && globalAccessResult) {
      healthyCount++;
    }
  }
  
  // Summary
  console.log('\n📊 HEALTH CHECK SUMMARY');
  console.log('=======================');
  
  for (const [processName, result] of Object.entries(results)) {
    const statusIcon = result.status === 'HEALTHY' && result.globalAccess ? '✅' : '❌';
    console.log(`${statusIcon} ${processName.toUpperCase()}: ${result.status} ${result.globalAccess ? '(Eval OK)' : '(Eval Failed)'}`);
  }
  
  console.log(`\nOverall: ${healthyCount}/${totalCount} processes fully healthy`);
  
  if (healthyCount === totalCount) {
    console.log('🎉 All processes deployed successfully and passing health checks!');
    return 0;
  } else {
    console.log('⚠️  Some processes have health issues');
    return 1;
  }
}

// Run the health checks
runHealthChecks().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});