#!/usr/bin/env node

import { connect, createDataItemSigner } from '@permaweb/aoconnect';
import { readFileSync } from 'fs';

const { result, message, spawn } = connect({
  MU_URL: "https://mu.ao-testnet.xyz",
  CU_URL: "https://cu.ao-testnet.xyz", 
  GATEWAY_URL: "https://arweave.net",
});

const wallet = JSON.parse(readFileSync('wallet.json'));
const signer = createDataItemSigner(wallet);
const processId = '6CVpw6GNK9diEsZw2RjwMANPqvINCScZ0bRFkQbmwSg'; // Our working test process

async function testJsonAvailability() {
  try {
    console.log('Testing JSON availability in AO environment...');
    
    const messageId = await message({
      process: processId,
      signer: signer,
      tags: [
        { name: 'Action', value: 'Eval' },
      ],
      data: `
        local result = {}
        
        -- Test if json is available as global
        result.json_global = json and "available" or "not available"
        
        -- Test if require json works
        local success, jsonModule = pcall(require, 'json')
        result.json_require = success and "available" or "not available"
        
        -- Test if Json is available (capital J)
        result.Json_global = Json and "available" or "not available"
        
        -- Test what's available in _G
        result.available_globals = {}
        for k, v in pairs(_G) do
          if type(k) == "string" and (string.lower(k):find("json") or k == "JSON") then
            table.insert(result.available_globals, k .. " (" .. type(v) .. ")")
          end
        end
        
        return "JSON_TEST: " .. (json and json.encode(result) or "json.encode not available")
      `
    });
    
    console.log('JSON test message sent:', messageId);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const testResult = await result({
      message: messageId,
      process: processId
    });
    
    console.log('JSON test result:', JSON.stringify(testResult.Output, null, 2));

  } catch (error) {
    console.error('Error testing JSON:', error);
  }
}

testJsonAvailability();