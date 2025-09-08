#!/usr/bin/env node

import { connect, createDataItemSigner } from '@permaweb/aoconnect';
import { readFileSync } from 'fs';

const { result, message, spawn, monitor, unmonitor, dryrun } = connect({
  MU_URL: "https://mu.ao-testnet.xyz",
  CU_URL: "https://cu.ao-testnet.xyz", 
  GATEWAY_URL: "https://arweave.net",
});

const wallet = JSON.parse(readFileSync('wallet.json'));
const signer = createDataItemSigner(wallet);

async function testSimpleDeploy() {
  try {
    console.log('Testing simple Lua code deployment...');
    
    // Spawn a new process with the new module
    const processId = await spawn({
      module: "mzFmF0rEoA5JyOX6G7Fwc97L6dQfwMUFuQmZNQFg6yc",
      scheduler: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA",
      signer: signer,
      tags: [
        { name: 'App-Name', value: 'TestSimple' },
      ]
    });
    
    console.log('Process spawned:', processId);
    
    // Load simple Lua code
    const luaCode = readFileSync('test-simple.lua', 'utf8');
    
    const messageId = await message({
      process: processId,
      signer: signer,
      tags: [
        { name: 'Action', value: 'Eval' },
      ],
      data: luaCode
    });
    
    console.log('Code deployment message sent:', messageId);
    
    // Wait for deployment
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const deployResult = await result({
      message: messageId,
      process: processId
    });
    
    console.log('Deployment result:', JSON.stringify(deployResult, null, 2));
    
    // Test if it worked by sending a test message
    const testMessageId = await message({
      process: processId,
      signer: signer,
      tags: [
        { name: 'Action', value: 'Test' },
      ],
      data: ''
    });
    
    console.log('Test message sent:', testMessageId);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const testResult = await result({
      message: testMessageId,
      process: processId
    });
    
    console.log('Test result:', JSON.stringify(testResult, null, 2));
    
    // Test Eval to check global
    const evalMessageId = await message({
      process: processId,
      signer: signer,
      tags: [
        { name: 'Action', value: 'Eval' },
      ],
      data: 'return TestGlobal or "TestGlobal not found"'
    });
    
    console.log('Eval test message sent:', evalMessageId);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const evalResult = await result({
      message: evalMessageId,
      process: processId
    });
    
    console.log('Eval result:', JSON.stringify(evalResult, null, 2));

  } catch (error) {
    console.error('Error testing simple deploy:', error);
  }
}

testSimpleDeploy();