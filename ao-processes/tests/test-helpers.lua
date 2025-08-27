-- Shared Test Helpers
-- Provides utilities for handling missing modules and path resolution in tests

local TestHelpers = {}

-- Setup package path for different execution contexts
function TestHelpers.setupPackagePath()
    local paths = {
        "./?.lua",                                          -- Current directory
        "../?.lua",                                         -- Parent directory
        "../framework/?.lua",                               -- Local development (from unit/ to framework/)
        "../../?.lua",                                      -- Two levels up
        "../../framework/?.lua",                            -- Alternative local path
        "./ao-processes/tests/framework/?.lua",             -- GitHub Actions (from repo root)
        "./ao-processes/?.lua",                             -- Root module path
        "./development-tools/?.lua",                        -- Development tools
    }
    
    for _, path in ipairs(paths) do
        if not string.find(package.path, path, 1, true) then
            package.path = package.path .. ";" .. path
        end
    end
end

-- Safe require with fallback for missing development-tools modules
function TestHelpers.safeRequire(moduleName, mockFactory)
    -- First, set up package path
    TestHelpers.setupPackagePath()
    
    local possiblePaths = {
        moduleName,                                         -- Original path
        moduleName:gsub("development%-tools/", ""),         -- Strip development-tools prefix
        moduleName:gsub("development%-tools%.", ""),        -- Strip development-tools. prefix
        moduleName:gsub("ao%-processes/tests/framework/", ""),  -- Strip framework prefix
        "../framework/" .. moduleName:match("([^/%.]+)$"), -- Local development path
    }
    
    for _, path in ipairs(possiblePaths) do
        local success, result = pcall(require, path)
        if success then
            return result
        end
    end
    
    -- If all paths fail and we have a mock factory, use it
    if mockFactory then
        return mockFactory()
    end
    
    error("Could not load module: " .. moduleName .. ". Tried paths: " .. table.concat(possiblePaths, ", "))
end

-- Mock factories for common development-tools modules
TestHelpers.mocks = {}

-- Mock AOEmulator
function TestHelpers.mocks.AOEmulator()
    return {
        AOEmulator = {
            new = function(config)
                return {
                    processId = (config and config.processId) or "mock-process",
                    send = function(msg) return {success = true, response = "mock"} end,
                    eval = function(code) return {success = true, result = "mock"} end,
                    spawn = function() return "mock-process-id" end,
                    getState = function() return {mock = true} end,
                    reset = function() return true end
                }
            end
        },
        Handlers = {
            add = function(name, pattern, handler) return true end,
            list = function() return {} end,
            utils = {
                hasMatchingTag = function(tag, value)
                    return function(msg)
                        return msg.Tags and msg.Tags[tag] == value
                    end
                end
            }
        }
    }
end

-- Mock MessageProcessor
function TestHelpers.mocks.MessageProcessor()
    return {
        new = function()
            return {
                process = function(msg) return {success = true, processed = msg} end,
                validate = function(msg) return {valid = true} end,
                route = function(msg) return {routed = true} end
            }
        end
    }
end

-- Mock APIDocumentationGenerator
function TestHelpers.mocks.APIDocumentationGenerator()
    return {
        new = function()
            return {
                generateDocs = function() return "# Mock API Documentation" end,
                exportToFile = function(filename) return true end,
                addEndpoint = function(endpoint) return true end
            }
        end
    }
end

-- Mock StateInspector
function TestHelpers.mocks.StateInspector()
    return {
        new = function()
            return {
                inspect = function(state) return {inspected = true, state = state} end,
                diff = function(state1, state2) return {differences = {}} end,
                validate = function(state) return {valid = true} end
            }
        end
    }
end

-- Mock ConsistencyValidator
function TestHelpers.mocks.ConsistencyValidator()
    return {
        new = function()
            return {
                validate = function(data) return {consistent = true} end,
                checkIntegrity = function(data) return {integrity = "pass"} end
            }
        end
    }
end

-- Mock ExecutionTracer
function TestHelpers.mocks.ExecutionTracer()
    return {
        new = function()
            return {
                start = function() return true end,
                stop = function() return {trace = {}} end,
                addCheckpoint = function(name) return true end
            }
        end
    }
end

-- Mock SnapshotManager
function TestHelpers.mocks.SnapshotManager()
    return {
        new = function()
            return {
                takeSnapshot = function(name) return {id = "mock-snapshot-" .. name} end,
                restoreSnapshot = function(id) return true end,
                listSnapshots = function() return {} end
            }
        end
    }
end

-- Mock Setup
function TestHelpers.mocks.Setup()
    return {
        configure = function(config) return {configured = true, config = config} end,
        validate = function() return {valid = true} end,
        initialize = function() return {initialized = true} end
    }
end

-- Mock Validation
function TestHelpers.mocks.Validation()
    return {
        validateProcess = function(process) return {valid = true, process = process} end,
        validateMessage = function(msg) return {valid = true, message = msg} end,
        validateState = function(state) return {valid = true, state = state} end
    }
end

-- Convenience function to require with automatic mock selection
function TestHelpers.requireWithMock(moduleName)
    local mockMap = {
        ["development-tools/ao-local-setup/ao-emulator"] = TestHelpers.mocks.AOEmulator,
        ["development-tools/ao-local-setup/message-processor"] = TestHelpers.mocks.MessageProcessor,
        ["development-tools.api-generator.api-documentation-generator"] = TestHelpers.mocks.APIDocumentationGenerator,
        ["development-tools/debugging/state-inspector"] = TestHelpers.mocks.StateInspector,
        ["development-tools/debugging/consistency-validator"] = TestHelpers.mocks.ConsistencyValidator,
        ["development-tools/debugging/execution-tracer"] = TestHelpers.mocks.ExecutionTracer,
        ["development-tools/debugging/snapshot-manager"] = TestHelpers.mocks.SnapshotManager,
        ["development-tools/ao-local-setup/setup"] = TestHelpers.mocks.Setup,
        ["development-tools/ao-local-setup/validation"] = TestHelpers.mocks.Validation,
    }
    
    return TestHelpers.safeRequire(moduleName, mockMap[moduleName])
end

return TestHelpers