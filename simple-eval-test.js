#!/usr/bin/env node

import { connect, createDataItemSigner } from '@permaweb/aoconnect';
import { readFileSync } from 'fs';

const { result, message, spawn, monitor, unmonitor, dryrun } = connect({
  MU_URL: "https://mu.ao-testnet.xyz",
  CU_URL: "https://cu.ao-testnet.xyz", 
  GATEWAY_URL: "https://arweave.net",
});

const wallet = JSON.parse(readFileSync('wallet.json'));
const processId = 'TP9oGe2eoVezJwdsX2BM-G5rfsaIoeGMlmIopBd5ybM'; // coordinator (new)

async function testSimpleEval() {
  try {
    console.log('Testing basic Eval functionality...');
    
    // Test 1: Simple return
    const messageId1 = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'Eval' },
      ],
      data: `return "Hello from Eval"`,
      signer: createDataItemSigner(wallet),
    });

    console.log('Simple eval message sent:', messageId1);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result1 = await result({
      message: messageId1,
      process: processId,
    });
    
    console.log('Simple eval result:', JSON.stringify(result1, null, 2));

    // Test 2: Basic print
    const messageId2 = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'Eval' },
      ],
      data: `print("This is a test print from Eval")`,
      signer: createDataItemSigner(wallet),
    });

    console.log('Print test message sent:', messageId2);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result2 = await result({
      message: messageId2,
      process: processId,
    });
    
    console.log('Print test result:', JSON.stringify(result2, null, 2));

    // Test 3: Check if ao exists
    const messageId3 = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'Eval' },
      ],
      data: `
        if ao then
          print("AO exists, id:", ao.id)
          return "AO is available"
        else
          return "AO not available"
        end
      `,
      signer: createDataItemSigner(wallet),
    });

    console.log('AO check message sent:', messageId3);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result3 = await result({
      message: messageId3,
      process: processId,
    });
    
    console.log('AO check result:', JSON.stringify(result3, null, 2));

  } catch (error) {
    console.error('Error testing simple eval:', error);
  }
}

testSimpleEval();