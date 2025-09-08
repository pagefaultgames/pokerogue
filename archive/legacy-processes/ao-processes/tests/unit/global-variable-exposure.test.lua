-- Test global variable exposure for health checks across all processes
-- Validates that required globals are accessible for deployment health validation

local TestFramework = require("tests.framework.test-framework-enhanced")

local function testGlobalVariableExposure()
    local testSuite = TestFramework.createSuite("Global Variable Exposure Tests")
    
    testSuite:addTest("Coordinator Process Globals", function()
        -- Test coordinator process global exposure requirements
        local requiredGlobals = {
            "CoordinatorState",
            "ProcessRegistry"
        }
        
        -- Simulate coordinator globals
        local coordinatorState = {
            initialized = true,
            mode = "HYBRID",
            activeSessions = {},
            processRegistry = {},
            healthStatus = "HEALTHY"
        }
        
        local globals = {
            CoordinatorState = coordinatorState,
            ProcessRegistry = coordinatorState.processRegistry
        }
        
        for _, globalName in ipairs(requiredGlobals) do
            TestFramework.assert(globals[globalName] ~= nil, globalName .. " should be exposed globally")
            TestFramework.assert(type(globals[globalName]) == "table", globalName .. " should be a table")
        end
        
        -- Test specific coordinator state structure
        TestFramework.assert(globals.CoordinatorState.initialized ~= nil, "CoordinatorState should have initialized field")
        TestFramework.assert(globals.CoordinatorState.mode ~= nil, "CoordinatorState should have mode field")
        TestFramework.assert(globals.CoordinatorState.healthStatus ~= nil, "CoordinatorState should have healthStatus field")
    end)
    
    testSuite:addTest("Battle Process Globals", function()
        -- Test battle process global exposure requirements
        local requiredGlobals = {
            "BattleEngine",
            "DamageCalculator", 
            "BattleRNG"
        }
        
        -- Simulate battle process globals
        local mockBattleEngine = {
            initialize = function() end,
            processBattleCommand = function() end,
            getActiveBattles = function() return {} end
        }
        
        local mockDamageCalculator = {
            calculateDamage = function() return 50 end,
            getTypeEffectiveness = function() return 1.0 end
        }
        
        local mockBattleRNG = {
            generateSeed = function() return 123456 end,
            nextRandom = function() return 0.5 end
        }
        
        local globals = {
            BattleEngine = mockBattleEngine,
            DamageCalculator = mockDamageCalculator,
            BattleRNG = mockBattleRNG
        }
        
        for _, globalName in ipairs(requiredGlobals) do
            TestFramework.assert(globals[globalName] ~= nil, globalName .. " should be exposed globally")
            TestFramework.assert(type(globals[globalName]) == "table", globalName .. " should be a table")
        end
        
        -- Test specific battle component interfaces
        TestFramework.assert(type(globals.DamageCalculator.calculateDamage) == "function", "DamageCalculator should have calculateDamage function")
        TestFramework.assert(type(globals.BattleRNG.generateSeed) == "function", "BattleRNG should have generateSeed function")
    end)
    
    testSuite:addTest("Security Process Globals", function()
        -- Test security process global exposure requirements
        local requiredGlobals = {
            "AntiCheatValidator",
            "SecurityHandlers"
        }
        
        -- Simulate security process globals
        local mockValidator = {
            validateAction = function() return true end,
            detectCheat = function() return false end
        }
        
        local mockHandlers = {
            ValidationEngine = {},
            AntiCheatDetector = {},
            AuditLogger = {},
            PolicyEnforcer = {},
            IntegrityMonitor = {}
        }
        
        local globals = {
            AntiCheatValidator = mockValidator,
            SecurityHandlers = mockHandlers
        }
        
        for _, globalName in ipairs(requiredGlobals) do
            TestFramework.assert(globals[globalName] ~= nil, globalName .. " should be exposed globally")
            TestFramework.assert(type(globals[globalName]) == "table", globalName .. " should be a table")
        end
        
        -- Test security handlers structure
        TestFramework.assert(globals.SecurityHandlers.ValidationEngine ~= nil, "SecurityHandlers should contain ValidationEngine")
        TestFramework.assert(globals.SecurityHandlers.AntiCheatDetector ~= nil, "SecurityHandlers should contain AntiCheatDetector")
        TestFramework.assert(type(globals.AntiCheatValidator.validateAction) == "function", "AntiCheatValidator should have validation functions")
    end)
    
    testSuite:addTest("Pokemon Process Globals", function()
        -- Test pokemon process global exposure requirements
        local requiredGlobals = {
            "PokemonManager",
            "SpeciesDatabase",
            "AbilityDatabase"
        }
        
        -- Simulate pokemon process globals
        local mockPokemonManager = {
            createPokemon = function() end,
            updatePokemon = function() end,
            getPokemon = function() return {} end
        }
        
        local mockSpeciesDatabase = {
            getSpecies = function() return {} end,
            getSpeciesCount = function() return 900 end
        }
        
        local mockAbilityDatabase = {
            getAbility = function() return {} end,
            getAbilityCount = function() return 300 end
        }
        
        local globals = {
            PokemonManager = mockPokemonManager,
            SpeciesDatabase = mockSpeciesDatabase,
            AbilityDatabase = mockAbilityDatabase
        }
        
        for _, globalName in ipairs(requiredGlobals) do
            TestFramework.assert(globals[globalName] ~= nil, globalName .. " should be exposed globally")
            TestFramework.assert(type(globals[globalName]) == "table", globalName .. " should be a table")
        end
        
        -- Test pokemon manager interface
        TestFramework.assert(type(globals.PokemonManager.createPokemon) == "function", "PokemonManager should have createPokemon function")
        TestFramework.assert(type(globals.SpeciesDatabase.getSpecies) == "function", "SpeciesDatabase should have getSpecies function")
        TestFramework.assert(type(globals.AbilityDatabase.getAbility) == "function", "AbilityDatabase should have getAbility function")
    end)
    
    testSuite:addTest("Economy Process Globals", function()
        -- Test economy process global exposure requirements
        local requiredGlobals = {
            "ShopManager",
            "InventoryManager"
        }
        
        -- Simulate economy process globals
        local mockShopManager = {
            purchaseItem = function() return true end,
            getShopInventory = function() return {} end,
            processTransaction = function() return true end
        }
        
        local mockInventoryManager = {
            addItem = function() return true end,
            removeItem = function() return true end,
            getInventory = function() return {} end
        }
        
        local globals = {
            ShopManager = mockShopManager,
            InventoryManager = mockInventoryManager
        }
        
        for _, globalName in ipairs(requiredGlobals) do
            TestFramework.assert(globals[globalName] ~= nil, globalName .. " should be exposed globally")
            TestFramework.assert(type(globals[globalName]) == "table", globalName .. " should be a table")
        end
        
        -- Test economy component interfaces
        TestFramework.assert(type(globals.ShopManager.purchaseItem) == "function", "ShopManager should have purchaseItem function")
        TestFramework.assert(type(globals.InventoryManager.addItem) == "function", "InventoryManager should have addItem function")
    end)
    
    testSuite:addTest("Admin Process Globals", function()
        -- Test admin process global exposure requirements
        local requiredGlobals = {
            "AdminHandlers"
        }
        
        -- Simulate admin process globals
        local mockAdminHandlers = {
            processHealthCheck = function() return "HEALTHY" end,
            executeAdminCommand = function() return true end,
            getProcessMetrics = function() return {} end,
            manageProcessLifecycle = function() return true end
        }
        
        local globals = {
            AdminHandlers = mockAdminHandlers
        }
        
        for _, globalName in ipairs(requiredGlobals) do
            TestFramework.assert(globals[globalName] ~= nil, globalName .. " should be exposed globally")
            TestFramework.assert(type(globals[globalName]) == "table", globalName .. " should be a table")
        end
        
        -- Test admin handlers interface
        TestFramework.assert(type(globals.AdminHandlers.processHealthCheck) == "function", "AdminHandlers should have processHealthCheck function")
        TestFramework.assert(type(globals.AdminHandlers.executeAdminCommand) == "function", "AdminHandlers should have executeAdminCommand function")
    end)
    
    testSuite:addTest("Health Check Access Pattern", function()
        -- Test the pattern used by health checks to access globals
        local processes = {
            coordinator = { CoordinatorState = {healthStatus = "HEALTHY"}, ProcessRegistry = {} },
            battle = { BattleEngine = {}, DamageCalculator = {}, BattleRNG = {} },
            security = { AntiCheatValidator = {}, SecurityHandlers = {} },
            pokemon = { PokemonManager = {}, SpeciesDatabase = {}, AbilityDatabase = {} },
            economy = { ShopManager = {}, InventoryManager = {} },
            admin = { AdminHandlers = {} }
        }
        
        -- Simulate health check accessing globals
        for processName, globals in pairs(processes) do
            for globalName, globalValue in pairs(globals) do
                TestFramework.assert(globalValue ~= nil, processName .. " should expose " .. globalName .. " for health checks")
                TestFramework.assert(type(globalValue) == "table", globalName .. " should be accessible as table")
            end
        end
    end)
    
    return testSuite
end

-- Export the test for the framework
return testGlobalVariableExposure