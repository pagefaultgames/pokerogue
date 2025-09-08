#!/usr/bin/env node

import { connect, createDataItemSigner } from '@permaweb/aoconnect';
import { readFileSync } from 'fs';

const { result, message, spawn, monitor, unmonitor, dryrun } = connect({
  MU_URL: "https://mu.ao-testnet.xyz",
  CU_URL: "https://cu.ao-testnet.xyz", 
  GATEWAY_URL: "https://arweave.net",
});

const wallet = JSON.parse(readFileSync('wallet.json'));
const processId = 'd1_34u7qoxV-ttq_PFElgtmucwe9M_BXpJ2z32L1_AA'; // coordinator (latest with working module)

async function testHandlers() {
  try {
    console.log('Testing various handlers on deployed process...');
    console.log('Process ID:', processId);

    // Test 1: Try the Info handler we know should exist
    const messageId1 = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'Info' },
      ],
      data: '',
      signer: createDataItemSigner(wallet),
    });

    console.log('Info handler message sent:', messageId1);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const result1 = await result({
      message: messageId1,
      process: processId,
    });
    
    console.log('Info handler result:');
    console.log('- Output:', result1.Output);
    console.log('- Messages count:', result1.Messages?.length || 0);
    console.log('- Error:', result1.Error || 'none');
    
    if (result1.Messages && result1.Messages.length > 0) {
      console.log('- Message data:', result1.Messages[0].Data);
    }

    // Test 2: Try a completely custom action that shouldn't exist
    const messageId2 = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'NonExistentAction' },
      ],
      data: '',
      signer: createDataItemSigner(wallet),
    });

    console.log('\nNonExistent action message sent:', messageId2);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const result2 = await result({
      message: messageId2,
      process: processId,
    });
    
    console.log('NonExistent action result:');
    console.log('- Output:', result2.Output);
    console.log('- Messages count:', result2.Messages?.length || 0);
    console.log('- Error:', result2.Error || 'none');

    // Test 3: Try Health-Check handler that deployment script expects
    const messageId3 = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'Health-Check' },
      ],
      data: `
        if ProcessRegistry and CoordinatorState then
          return "HEALTHY: Coordinator ready"
        else
          return "UNHEALTHY: Missing coordinator components"
        end
      `,
      signer: createDataItemSigner(wallet),
    });

    console.log('\nHealth-Check handler message sent:', messageId3);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const result3 = await result({
      message: messageId3,
      process: processId,
    });
    
    console.log('Health-Check handler result:');
    console.log('- Output:', result3.Output);
    console.log('- Messages count:', result3.Messages?.length || 0);
    console.log('- Error:', result3.Error || 'none');

  } catch (error) {
    console.error('Error testing handlers:', error);
  }
}

testHandlers();