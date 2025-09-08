#!/usr/bin/env node

import { connect, createDataItemSigner } from '@permaweb/aoconnect';
import { readFileSync } from 'fs';

const { result, message } = connect({
  MU_URL: "https://mu.ao-testnet.xyz",
  CU_URL: "https://cu.ao-testnet.xyz", 
  GATEWAY_URL: "https://arweave.net",
});

const wallet = JSON.parse(readFileSync('wallet.json'));
const processId = 'd1_34u7qoxV-ttq_PFElgtmucwe9M_BXpJ2z32L1_AA'; // coordinator (working)

async function testCoordinatorHealth() {
  try {
    console.log('Testing coordinator health check...');
    
    // Test the exact health check from deployment script
    const messageId = await message({
      process: processId,
      signer: createDataItemSigner(wallet),
      tags: [
        { name: 'Action', value: 'Eval' },
      ],
      data: `
        if ProcessRegistry and CoordinatorState then
          return "HEALTHY: Coordinator ready"
        else
          return "UNHEALTHY: Missing coordinator components - ProcessRegistry: " .. tostring(ProcessRegistry) .. ", CoordinatorState: " .. tostring(CoordinatorState)
        end
      `
    });

    console.log('Health check message sent:', messageId);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const healthResult = await result({
      message: messageId,
      process: processId,
    });
    
    console.log('Health check result:', JSON.stringify(healthResult.Output, null, 2));
    
    // Also test what globals are actually available
    const messageId2 = await message({
      process: processId,
      signer: createDataItemSigner(wallet),
      tags: [
        { name: 'Action', value: 'Eval' },
      ],
      data: `
        local globals = {}
        for k, v in pairs(_G) do
          if type(k) == "string" and (k:find("oordinator") or k:find("egistry") or k:find("json") or k:find("JSON")) then
            globals[k] = type(v)
          end
        end
        return "Available globals: " .. json.encode(globals)
      `
    });

    console.log('Globals check message sent:', messageId2);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const globalsResult = await result({
      message: messageId2,
      process: processId,
    });
    
    console.log('Globals result:', JSON.stringify(globalsResult.Output, null, 2));

  } catch (error) {
    console.error('Error testing coordinator health:', error);
  }
}

testCoordinatorHealth();