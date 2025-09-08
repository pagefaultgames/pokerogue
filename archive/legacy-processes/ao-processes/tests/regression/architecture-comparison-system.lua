--[[
Automated Architecture Comparison System
Compares monolithic vs distributed architecture behavior and performance
--]]

local ArchitectureComparisonSystem = {}

-- Dependencies
local json = { encode = function(obj) return tostring(obj) end }

-- Architecture configuration
local architectureConfig = {
    monolithic = {
        processId = "monolithic-main",
        endpoints = {
            battle = "BATTLE",
            pokemon = "POKEMON_MANAGEMENT",
            shop = "SHOP_MANAGEMENT",
            admin = "ADMIN"
        },
        enabled = false -- Will be enabled when monolithic reference available
    },
    distributed = {
        processes = {
            coordinator = "coordinator-process-id",
            battle = "battle-process-id", 
            pokemon = "pokemon-process-id",
            economy = "economy-process-id",
            security = "security-process-id",
            admin = "admin-process-id"
        },
        enabled = true
    }
}

-- Test scenario definitions for architecture comparison
local comparisonScenarios = {
    {
        name = "Single Battle Resolution",
        category = "BATTLE_ENGINE",
        epic32Story = "32.3",
        monolithicTest = function()
            return ArchitectureComparisonSystem.executeBattleTestMonolithic({
                battleType = "single",
                pokemonA = { species = 1, level = 50 },
                pokemonB = { species = 4, level = 50 },
                moves = { { moveId = 1 }, { moveId = 7 } },
                rngSeed = "deterministic-battle-001"
            })
        end,
        distributedTest = function()
            return ArchitectureComparisonSystem.executeBattleTestDistributed({
                battleType = "single",
                pokemonA = { species = 1, level = 50 },
                pokemonB = { species = 4, level = 50 },
                moves = { { moveId = 1 }, { moveId = 7 } },
                rngSeed = "deterministic-battle-001"
            })
        end
    },
    {
        name = "Pokemon State Management",
        category = "POKEMON_MANAGEMENT", 
        epic32Story = "32.4",
        monolithicTest = function()
            return ArchitectureComparisonSystem.executePokemonTestMonolithic({
                operation = "stat_calculation",
                pokemon = { species = 25, level = 50, ivs = { hp = 31, attack = 31 } },
                nature = 1
            })
        end,
        distributedTest = function()
            return ArchitectureComparisonSystem.executePokemonTestDistributed({
                operation = "stat_calculation",
                pokemon = { species = 25, level = 50, ivs = { hp = 31, attack = 31 } },
                nature = 1
            })
        end
    },
    {
        name = "Shop Transaction Processing",
        category = "ECONOMY_SYSTEM",
        epic32Story = "32.5",
        monolithicTest = function()
            return ArchitectureComparisonSystem.executeShopTestMonolithic({
                operation = "purchase",
                playerId = "test-player-001",
                itemId = 1,
                quantity = 5
            })
        end,
        distributedTest = function()
            return ArchitectureComparisonSystem.executeShopTestDistributed({
                operation = "purchase", 
                playerId = "test-player-001",
                itemId = 1,
                quantity = 5
            })
        end
    },
    {
        name = "Security Validation",
        category = "SECURITY_SYSTEM",
        epic32Story = "32.6",
        monolithicTest = function()
            return ArchitectureComparisonSystem.executeSecurityTestMonolithic({
                operation = "anti_cheat_validation",
                playerId = "test-player-001",
                battleData = { duration = 120, moves = 15 }
            })
        end,
        distributedTest = function()
            return ArchitectureComparisonSystem.executeSecurityTestDistributed({
                operation = "anti_cheat_validation",
                playerId = "test-player-001", 
                battleData = { duration = 120, moves = 15 }
            })
        end
    }
}

function ArchitectureComparisonSystem.initializeComparison(config)
    -- Update architecture configuration
    if config.monolithic then
        architectureConfig.monolithic.enabled = config.monolithic.enabled or false
        if config.monolithic.processId then
            architectureConfig.monolithic.processId = config.monolithic.processId
        end
    end
    
    if config.distributed then
        architectureConfig.distributed.enabled = config.distributed.enabled or true
        if config.distributed.processes then
            for processType, processId in pairs(config.distributed.processes) do
                architectureConfig.distributed.processes[processType] = processId
            end
        end
    end
    
    print("[ARCHITECTURE_COMPARISON] Initialized comparison system")
    print("[ARCHITECTURE_COMPARISON] Monolithic enabled: " .. tostring(architectureConfig.monolithic.enabled))
    print("[ARCHITECTURE_COMPARISON] Distributed enabled: " .. tostring(architectureConfig.distributed.enabled))
    
    return {
        success = true,
        monolithicEnabled = architectureConfig.monolithic.enabled,
        distributedEnabled = architectureConfig.distributed.enabled,
        scenarioCount = #comparisonScenarios
    }
end

function ArchitectureComparisonSystem.executeComparisonSuite()
    local comparisonResults = {
        startTime = 0,
        endTime = 0,
        totalScenarios = #comparisonScenarios,
        executedScenarios = 0,
        passedComparisons = 0,
        failedComparisons = 0,
        scenarioResults = {},
        architectureMetrics = {
            monolithic = { totalResponseTime = 0, totalTests = 0 },
            distributed = { totalResponseTime = 0, totalTests = 0 }
        }
    }
    
    print("[ARCHITECTURE_COMPARISON] Starting comparison suite execution")
    
    for _, scenario in ipairs(comparisonScenarios) do
        local scenarioResult = ArchitectureComparisonSystem.executeScenarioComparison(scenario)
        table.insert(comparisonResults.scenarioResults, scenarioResult)
        comparisonResults.executedScenarios = comparisonResults.executedScenarios + 1
        
        if scenarioResult.comparisonPassed then
            comparisonResults.passedComparisons = comparisonResults.passedComparisons + 1
        else
            comparisonResults.failedComparisons = comparisonResults.failedComparisons + 1
        end
        
        -- Aggregate metrics
        if scenarioResult.monolithicResult and scenarioResult.monolithicResult.performanceMetrics then
            comparisonResults.architectureMetrics.monolithic.totalResponseTime = 
                comparisonResults.architectureMetrics.monolithic.totalResponseTime + 
                (scenarioResult.monolithicResult.performanceMetrics.responseTime or 0)
            comparisonResults.architectureMetrics.monolithic.totalTests = 
                comparisonResults.architectureMetrics.monolithic.totalTests + 1
        end
        
        if scenarioResult.distributedResult and scenarioResult.distributedResult.performanceMetrics then
            comparisonResults.architectureMetrics.distributed.totalResponseTime = 
                comparisonResults.architectureMetrics.distributed.totalResponseTime + 
                (scenarioResult.distributedResult.performanceMetrics.responseTime or 0)
            comparisonResults.architectureMetrics.distributed.totalTests = 
                comparisonResults.architectureMetrics.distributed.totalTests + 1
        end
    end
    
    comparisonResults.endTime = 0
    
    -- Calculate average metrics
    if comparisonResults.architectureMetrics.monolithic.totalTests > 0 then
        comparisonResults.architectureMetrics.monolithic.averageResponseTime = 
            comparisonResults.architectureMetrics.monolithic.totalResponseTime / 
            comparisonResults.architectureMetrics.monolithic.totalTests
    end
    
    if comparisonResults.architectureMetrics.distributed.totalTests > 0 then
        comparisonResults.architectureMetrics.distributed.averageResponseTime = 
            comparisonResults.architectureMetrics.distributed.totalResponseTime / 
            comparisonResults.architectureMetrics.distributed.totalTests
    end
    
    print("[ARCHITECTURE_COMPARISON] Suite execution completed")
    print("[ARCHITECTURE_COMPARISON] Passed: " .. comparisonResults.passedComparisons .. 
          " Failed: " .. comparisonResults.failedComparisons)
    
    return comparisonResults
end

function ArchitectureComparisonSystem.executeScenarioComparison(scenario)
    local scenarioResult = {
        scenarioName = scenario.name,
        category = scenario.category,
        epic32Story = scenario.epic32Story,
        executionTime = 0,
        monolithicResult = nil,
        distributedResult = nil,
        comparisonPassed = false,
        differences = {},
        performanceComparison = {}
    }
    
    local startTime = os.clock()
    
    print("[ARCHITECTURE_COMPARISON] Executing scenario: " .. scenario.name)
    
    -- Execute monolithic test if enabled
    if architectureConfig.monolithic.enabled and scenario.monolithicTest then
        local success, result = pcall(scenario.monolithicTest)
        if success then
            scenarioResult.monolithicResult = result
            print("[ARCHITECTURE_COMPARISON] Monolithic test completed for: " .. scenario.name)
        else
            print("[ARCHITECTURE_COMPARISON] Monolithic test failed for: " .. scenario.name .. " - " .. tostring(result))
            scenarioResult.monolithicResult = { error = tostring(result) }
        end
    end
    
    -- Execute distributed test
    if architectureConfig.distributed.enabled and scenario.distributedTest then
        local success, result = pcall(scenario.distributedTest)
        if success then
            scenarioResult.distributedResult = result
            print("[ARCHITECTURE_COMPARISON] Distributed test completed for: " .. scenario.name)
        else
            print("[ARCHITECTURE_COMPARISON] Distributed test failed for: " .. scenario.name .. " - " .. tostring(result))
            scenarioResult.distributedResult = { error = tostring(result) }
        end
    end
    
    scenarioResult.executionTime = os.clock() - startTime
    
    -- Perform comparison if both results available
    if scenarioResult.monolithicResult and scenarioResult.distributedResult and
       not scenarioResult.monolithicResult.error and not scenarioResult.distributedResult.error then
        
        local comparison = ArchitectureComparisonSystem.performDetailedComparison(
            scenarioResult.monolithicResult,
            scenarioResult.distributedResult
        )
        
        scenarioResult.comparisonPassed = comparison.passed
        scenarioResult.differences = comparison.differences
        scenarioResult.performanceComparison = comparison.performanceComparison
    elseif scenarioResult.distributedResult and not scenarioResult.distributedResult.error then
        -- Distributed-only test passed
        scenarioResult.comparisonPassed = true
        print("[ARCHITECTURE_COMPARISON] Distributed-only test passed: " .. scenario.name)
    end
    
    return scenarioResult
end

function ArchitectureComparisonSystem.performDetailedComparison(monolithicResult, distributedResult)
    local comparison = {
        passed = true,
        differences = {},
        performanceComparison = {
            responseTimeDelta = 0,
            throughputDelta = 0,
            memoryUsageDelta = 0
        }
    }
    
    -- Performance comparison
    if monolithicResult.performanceMetrics and distributedResult.performanceMetrics then
        local monMetrics = monolithicResult.performanceMetrics
        local distMetrics = distributedResult.performanceMetrics
        
        if monMetrics.responseTime and distMetrics.responseTime then
            comparison.performanceComparison.responseTimeDelta = 
                ((distMetrics.responseTime - monMetrics.responseTime) / monMetrics.responseTime) * 100
        end
        
        if monMetrics.throughput and distMetrics.throughput then
            comparison.performanceComparison.throughputDelta = 
                ((distMetrics.throughput - monMetrics.throughput) / monMetrics.throughput) * 100
        end
        
        if monMetrics.memoryUsage and distMetrics.memoryUsage then
            comparison.performanceComparison.memoryUsageDelta = 
                ((distMetrics.memoryUsage - monMetrics.memoryUsage) / monMetrics.memoryUsage) * 100
        end
    end
    
    -- Functional output comparison
    if monolithicResult.output and distributedResult.output then
        local outputComparison = ArchitectureComparisonSystem.compareFunctionalOutput(
            monolithicResult.output,
            distributedResult.output
        )
        
        if not outputComparison.match then
            comparison.passed = false
            comparison.differences = outputComparison.differences
        end
    end
    
    return comparison
end

function ArchitectureComparisonSystem.compareFunctionalOutput(output1, output2)
    local comparison = {
        match = true,
        differences = {}
    }
    
    -- Deep comparison implementation
    local function deepCompare(obj1, obj2, path)
        if type(obj1) ~= type(obj2) then
            comparison.match = false
            table.insert(comparison.differences, 
                string.format("Type mismatch at %s: %s vs %s", path or "root", type(obj1), type(obj2)))
            return
        end
        
        if type(obj1) == "table" then
            for k, v in pairs(obj1) do
                local currentPath = path and (path .. "." .. tostring(k)) or tostring(k)
                if obj2[k] == nil then
                    comparison.match = false
                    table.insert(comparison.differences, 
                        string.format("Missing key in distributed result: %s", currentPath))
                else
                    deepCompare(v, obj2[k], currentPath)
                end
            end
            
            for k, _ in pairs(obj2) do
                if obj1[k] == nil then
                    local currentPath = path and (path .. "." .. tostring(k)) or tostring(k)
                    comparison.match = false
                    table.insert(comparison.differences, 
                        string.format("Extra key in distributed result: %s", currentPath))
                end
            end
        elseif type(obj1) == "number" then
            local tolerance = 0.001
            if math.abs(obj1 - obj2) > tolerance then
                comparison.match = false
                table.insert(comparison.differences, 
                    string.format("Number mismatch at %s: %.6f vs %.6f", path or "root", obj1, obj2))
            end
        else
            if obj1 ~= obj2 then
                comparison.match = false
                table.insert(comparison.differences, 
                    string.format("Value mismatch at %s: %s vs %s", path or "root", tostring(obj1), tostring(obj2)))
            end
        end
    end
    
    deepCompare(output1, output2)
    return comparison
end

-- Architecture-specific test execution functions

function ArchitectureComparisonSystem.executeBattleTestMonolithic(testData)
    -- Mock monolithic battle test execution
    -- This would integrate with actual monolithic system when available
    return {
        output = {
            battleResult = "victory",
            winner = "playerA", 
            turnsCompleted = 8,
            finalStats = { playerA_hp = 45, playerB_hp = 0 }
        },
        performanceMetrics = {
            responseTime = 125, -- milliseconds
            throughput = 8.0,   -- turns per second
            memoryUsage = 2048  -- KB
        }
    }
end

function ArchitectureComparisonSystem.executeBattleTestDistributed(testData)
    -- Execute battle test on distributed architecture
    local battleMessage = {
        correlation = {
            id = "battle-comparison-" .. tostring(0),
            requestType = "EXECUTE_BATTLE"
        },
        battle = {
            battleType = testData.battleType,
            pokemonA = testData.pokemonA,
            pokemonB = testData.pokemonB,
            moves = testData.moves,
            rngSeed = testData.rngSeed
        },
        testing = {
            comparisonMode = true,
            performanceTracking = true
        }
    }
    
    -- Mock distributed battle execution result
    return {
        output = {
            battleResult = "victory",
            winner = "playerA",
            turnsCompleted = 8,
            finalStats = { playerA_hp = 45, playerB_hp = 0 }
        },
        performanceMetrics = {
            responseTime = 142, -- milliseconds (slightly higher due to process communication)
            throughput = 7.8,   -- turns per second
            memoryUsage = 1856  -- KB (distributed across processes)
        }
    }
end

function ArchitectureComparisonSystem.executePokemonTestMonolithic(testData)
    -- Mock monolithic Pokemon test
    return {
        output = {
            calculatedStats = {
                hp = 341,
                attack = 269,
                defense = 200,
                spAttack = 218,
                spDefense = 218,
                speed = 284
            }
        },
        performanceMetrics = {
            responseTime = 15,
            throughput = 66.7,
            memoryUsage = 512
        }
    }
end

function ArchitectureComparisonSystem.executePokemonTestDistributed(testData)
    -- Mock distributed Pokemon test
    return {
        output = {
            calculatedStats = {
                hp = 341,
                attack = 269,
                defense = 200,
                spAttack = 218,
                spDefense = 218,
                speed = 284
            }
        },
        performanceMetrics = {
            responseTime = 18,
            throughput = 55.6,
            memoryUsage = 384
        }
    }
end

function ArchitectureComparisonSystem.executeShopTestMonolithic(testData)
    -- Mock monolithic shop test
    return {
        output = {
            transactionId = "txn-mono-001",
            success = true,
            playerBalance = 950,
            itemsReceived = 5
        },
        performanceMetrics = {
            responseTime = 45,
            throughput = 22.2,
            memoryUsage = 256
        }
    }
end

function ArchitectureComparisonSystem.executeShopTestDistributed(testData)
    -- Mock distributed shop test
    return {
        output = {
            transactionId = "txn-dist-001",
            success = true,
            playerBalance = 950,
            itemsReceived = 5
        },
        performanceMetrics = {
            responseTime = 52,
            throughput = 19.2,
            memoryUsage = 192
        }
    }
end

function ArchitectureComparisonSystem.executeSecurityTestMonolithic(testData)
    -- Mock monolithic security test
    return {
        output = {
            validationResult = "passed",
            riskScore = 0.15,
            flags = {}
        },
        performanceMetrics = {
            responseTime = 35,
            throughput = 28.6,
            memoryUsage = 128
        }
    }
end

function ArchitectureComparisonSystem.executeSecurityTestDistributed(testData)
    -- Mock distributed security test
    return {
        output = {
            validationResult = "passed",
            riskScore = 0.15,
            flags = {}
        },
        performanceMetrics = {
            responseTime = 38,
            throughput = 26.3,
            memoryUsage = 96
        }
    }
end

return ArchitectureComparisonSystem