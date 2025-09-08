#!/usr/bin/env node

import { connect, createDataItemSigner, message, result } from '@permaweb/aoconnect';
import { readFileSync } from 'fs';

const wallet = JSON.parse(readFileSync('wallet.json'));
const processId = 'TP9oGe2eoVezJwdsX2BM-G5rfsaIoeGMlmIopBd5ybM'; // coordinator (new)

async function testHealthCheck() {
  try {
    console.log('Testing info and health check for coordinator process...');
    console.log('Process ID:', processId);
    
    const messageId1 = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'Info' },
      ],
      data: '',
      signer: createDataItemSigner(wallet),
    });

    console.log('Info message sent:', messageId1);
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get the result
    const infoResult1 = await result({
      message: messageId1,
      process: processId,
    });
    
    console.log('Info result:', JSON.stringify(infoResult1, null, 2));
    
    // Check messages array for actual response
    if (infoResult1.Messages && infoResult1.Messages.length > 0) {
      console.log('Messages from Info:', infoResult1.Messages.map(m => ({
        target: m.Target,
        data: m.Data,
        tags: m.Tags
      })));
    }

    // Test if the deployment actually worked by checking if our code is loaded
    const messageId3 = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'Eval' },
      ],
      data: `
        -- Check if our code was actually deployed
        print("=== CODE DEPLOYMENT CHECK ===")
        print("ProcessRegistry exists:", ProcessRegistry ~= nil)
        print("CoordinatorState exists:", CoordinatorState ~= nil)
        print("Handlers exists:", Handlers ~= nil)
        print("coordinatorState exists:", coordinatorState ~= nil)
        print("initialize function exists:", initialize ~= nil)
        print("PROCESS_INFO exists:", PROCESS_INFO ~= nil)
        print("JSON module exists:", json ~= nil)
        
        -- Try to access coordinatorState if it exists  
        if coordinatorState then
          print("coordinatorState.initialized:", coordinatorState.initialized)
          print("coordinatorState.mode:", coordinatorState.mode)
        end
        
        -- Check how many handlers are registered
        local handlerCount = 0
        if Handlers and Handlers.list then
          for _ in pairs(Handlers.list) do
            handlerCount = handlerCount + 1
          end
        end
        print("Total handlers registered:", handlerCount)
        
        return "Code deployment check completed"
      `,
      signer: createDataItemSigner(wallet),
    });

    console.log('Deployment health check message sent:', messageId3);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const healthResult2 = await result({
      message: messageId3,
      process: processId,
    });

    console.log('Deployment health check result:', JSON.stringify(healthResult2, null, 2));
    
    // Also test if we can just check the variables exist
    const messageId4 = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'Eval' },
      ],
      data: `
        local result = {}
        result.ProcessRegistry = ProcessRegistry and "exists" or "missing"
        result.CoordinatorState = CoordinatorState and "exists" or "missing"
        result.Handlers = Handlers and "exists" or "missing"
        return json.encode(result)
      `,
      signer: createDataItemSigner(wallet),
    });

    console.log('Variable check message sent:', messageId4);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const varCheckResult = await result({
      message: messageId4,
      process: processId,
    });

    console.log('Variable check result:', JSON.stringify(varCheckResult, null, 2));

  } catch (error) {
    console.error('Error testing health check:', error);
  }
}

testHealthCheck();