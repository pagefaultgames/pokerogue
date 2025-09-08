#!/bin/bash
# Epic 34 Complete Environment Setup
# Sets up aos-local + aolite + bundle optimization tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🏗️  Epic 34: Complete Test Automation Environment Setup${NC}"
echo "=============================================================="
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js >=18${NC}"
        return 1
    fi
    
    local node_version=$(node --version | sed 's/v//' | cut -d. -f1)
    if [[ $node_version -lt 18 ]]; then
        echo -e "${RED}❌ Node.js version $node_version < 18. Please upgrade${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
    
    # Check Lua version
    if ! command -v lua &> /dev/null; then
        echo -e "${RED}❌ Lua not found. Please install Lua 5.3${NC}"
        return 1
    fi
    
    local lua_version=$(lua -v 2>&1 | grep "Lua 5.3")
    if [[ -z "$lua_version" ]]; then
        echo -e "${YELLOW}⚠️  Lua version may not be 5.3. aolite requires Lua 5.3${NC}"
        echo "Current: $(lua -v 2>&1 | head -1)"
    else
        echo -e "${GREEN}✅ Lua 5.3 detected${NC}"
    fi
    
    # Check luarocks
    if ! command -v luarocks &> /dev/null; then
        echo -e "${RED}❌ luarocks not found. Please install luarocks${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ luarocks $(luarocks --version | head -1)${NC}"
    
    return 0
}

# Install aos-local (JavaScript API)
install_aos_local() {
    echo ""
    echo -e "${BLUE}📦 Installing aos-local (@permaweb/loco)...${NC}"
    
    if npm list @permaweb/loco &> /dev/null; then
        echo -e "${GREEN}✅ @permaweb/loco already installed${NC}"
    else
        echo "Installing @permaweb/loco..."
        if npm install @permaweb/loco; then
            echo -e "${GREEN}✅ @permaweb/loco installed successfully${NC}"
        else
            echo -e "${RED}❌ Failed to install @permaweb/loco${NC}"
            return 1
        fi
    fi
}

# Install aolite (Lua concurrent testing)
install_aolite() {
    echo ""
    echo -e "${BLUE}📦 Installing aolite...${NC}"
    
    if luarocks list | grep -q aolite; then
        echo -e "${GREEN}✅ aolite already installed${NC}"
    else
        echo "Installing aolite via luarocks..."
        if luarocks install aolite; then
            echo -e "${GREEN}✅ aolite installed successfully${NC}"
        else
            echo -e "${RED}❌ Failed to install aolite${NC}"
            echo "Trying alternative installation methods..."
            
            # Try local installation
            if luarocks install --local aolite; then
                echo -e "${GREEN}✅ aolite installed locally${NC}"
            else
                echo -e "${RED}❌ Failed to install aolite locally${NC}"
                echo "Please install manually: luarocks install aolite"
                return 1
            fi
        fi
    fi
}

# Create testing infrastructure
create_testing_infrastructure() {
    echo ""
    echo -e "${BLUE}🏗️  Creating testing infrastructure...${NC}"
    
    # Create test directories
    mkdir -p ao-processes/tests/{unit,integration,performance,fixtures}
    mkdir -p ao-processes/tests/framework
    
    echo -e "${GREEN}✅ Test directories created${NC}"
    
    # Create aolite test runner
    cat > ao-processes/tests/framework/aolite-test-runner.lua << 'EOF'
-- aolite Test Runner Framework
-- Provides unified testing interface for AO processes

local aolite = require("aolite")
local json = require("json")

local TestRunner = {}

-- Test suite registry
TestRunner.suites = {}
TestRunner.results = {
    total = 0,
    passed = 0,
    failed = 0,
    errors = {}
}

-- Register a test suite
function TestRunner.registerSuite(name, suite)
    TestRunner.suites[name] = suite
    print("📋 Registered test suite: " .. name)
end

-- Run a single test
function TestRunner.runTest(testName, testFunction, processPath)
    print("🧪 Running test: " .. testName)
    
    TestRunner.results.total = TestRunner.results.total + 1
    
    local success, result = pcall(function()
        -- Spawn process for isolated testing
        local processId = "test-" .. testName .. "-" .. os.time()
        aolite.spawnProcess(processId, processPath or "ao-processes/main.lua")
        
        -- Run the test function
        local testResult = testFunction(processId, aolite)
        
        -- Cleanup
        -- aolite process cleanup handled automatically
        
        return testResult
    end)
    
    if success and result then
        print("  ✅ " .. testName .. " PASSED")
        TestRunner.results.passed = TestRunner.results.passed + 1
        return true
    else
        print("  ❌ " .. testName .. " FAILED")
        if not success then
            print("     Error: " .. tostring(result))
            table.insert(TestRunner.results.errors, {
                test = testName,
                error = tostring(result)
            })
        end
        TestRunner.results.failed = TestRunner.results.failed + 1
        return false
    end
end

-- Run all registered test suites
function TestRunner.runAll()
    print("🚀 Starting aolite test execution...")
    print("")
    
    for suiteName, suite in pairs(TestRunner.suites) do
        print("📂 Running test suite: " .. suiteName)
        
        if suite.setup then
            suite.setup()
        end
        
        for testName, testFunction in pairs(suite.tests or {}) do
            TestRunner.runTest(testName, testFunction, suite.processPath)
        end
        
        if suite.teardown then
            suite.teardown()
        end
        
        print("")
    end
    
    -- Print final results
    print("🎉 Test execution complete!")
    print("📊 Results:")
    print("  Total: " .. TestRunner.results.total)
    print("  Passed: " .. TestRunner.results.passed)
    print("  Failed: " .. TestRunner.results.failed)
    
    if TestRunner.results.failed > 0 then
        print("")
        print("❌ Failed tests:")
        for _, error in ipairs(TestRunner.results.errors) do
            print("  - " .. error.test .. ": " .. error.error)
        end
        return false
    end
    
    return true
end

-- Assertion helpers
TestRunner.assert = {
    equals = function(actual, expected, message)
        if actual ~= expected then
            error(message or ("Expected " .. tostring(expected) .. ", got " .. tostring(actual)))
        end
    end,
    
    isTrue = function(value, message)
        if not value then
            error(message or "Expected true, got " .. tostring(value))
        end
    end,
    
    isFalse = function(value, message)
        if value then
            error(message or "Expected false, got " .. tostring(value))
        end
    end,
    
    isNil = function(value, message)
        if value ~= nil then
            error(message or "Expected nil, got " .. tostring(value))
        end
    end,
    
    isNotNil = function(value, message)
        if value == nil then
            error(message or "Expected non-nil value")
        end
    end
}

return TestRunner
EOF

    echo -e "${GREEN}✅ aolite test runner created${NC}"
    
    # Create aos-local development helper
    cat > scripts/aos-local-dev.js << 'EOF'
#!/usr/bin/env node
// aos-local Development Helper
// Provides convenient aos-local development interface

const { aoslocal } = require('@permaweb/loco');

class AOSLocalDev {
    constructor() {
        this.aos = null;
        this.isInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing aos-local development environment...');
        this.aos = await aoslocal();
        this.isInitialized = true;
        console.log('✅ aos-local ready for development');
    }
    
    async loadHandler(handlerPath) {
        await this.initialize();
        console.log(`📄 Loading handler: ${handlerPath}`);
        await this.aos.src(handlerPath);
        console.log('✅ Handler loaded successfully');
    }
    
    async testMessage(message) {
        await this.initialize();
        console.log('📨 Sending test message:', JSON.stringify(message, null, 2));
        const result = await this.aos.send(message);
        console.log('📥 Response:', JSON.stringify(result, null, 2));
        return result;
    }
    
    async evalCode(code) {
        await this.initialize();
        console.log('⚡ Evaluating:', code);
        const result = await this.aos.eval(code);
        console.log('📤 Result:', result);
        return result;
    }
    
    async inspectState(variable = 'GameState') {
        await this.initialize();
        console.log(`🔍 Inspecting ${variable}...`);
        const result = await this.aos.eval(`return json.encode(${variable} or {})`);
        try {
            const state = JSON.parse(result.Output);
            console.log('📋 State:', JSON.stringify(state, null, 2));
            return state;
        } catch (e) {
            console.log('📋 Raw state:', result.Output);
            return result.Output;
        }
    }
}

// CLI interface
if (require.main === module) {
    const dev = new AOSLocalDev();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'load':
            if (!args[1]) {
                console.error('Usage: node scripts/aos-local-dev.js load <handler-path>');
                process.exit(1);
            }
            dev.loadHandler(args[1]).catch(console.error);
            break;
            
        case 'test':
            if (!args[1]) {
                console.error('Usage: node scripts/aos-local-dev.js test <json-message>');
                process.exit(1);
            }
            try {
                const message = JSON.parse(args[1]);
                dev.testMessage(message).catch(console.error);
            } catch (e) {
                console.error('Invalid JSON message:', e.message);
                process.exit(1);
            }
            break;
            
        case 'eval':
            if (!args[1]) {
                console.error('Usage: node scripts/aos-local-dev.js eval <lua-code>');
                process.exit(1);
            }
            dev.evalCode(args[1]).catch(console.error);
            break;
            
        case 'state':
            dev.inspectState(args[1]).catch(console.error);
            break;
            
        default:
            console.log('aos-local Development Helper');
            console.log('');
            console.log('Commands:');
            console.log('  load <path>     Load AO handler from file');
            console.log('  test <json>     Send test message to handler');  
            console.log('  eval <code>     Evaluate Lua code');
            console.log('  state [var]     Inspect process state');
            console.log('');
            console.log('Examples:');
            console.log('  node scripts/aos-local-dev.js load ao-processes/handlers/battle-handler.lua');
            console.log('  node scripts/aos-local-dev.js test \'{"Action":"Ping"}\'');
            console.log('  node scripts/aos-local-dev.js eval "Count = (Count or 0) + 1"');
            console.log('  node scripts/aos-local-dev.js state GameState');
    }
}

module.exports = AOSLocalDev;
EOF

    chmod +x scripts/aos-local-dev.js
    echo -e "${GREEN}✅ aos-local development helper created${NC}"
}

# Create unified workflow scripts
create_workflow_scripts() {
    echo ""
    echo -e "${BLUE}⚙️  Creating unified workflow scripts...${NC}"
    
    # Development workflow script
    cat > scripts/epic34-dev-workflow.sh << 'EOF'
#!/bin/bash
# Epic 34 Unified Development Workflow

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_help() {
    echo "Epic 34 Unified Development Workflow"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  develop <handler>    Start aos-local development session"
    echo "  test-unit <test>     Run aolite unit tests"
    echo "  test-integration     Run aolite integration tests"
    echo "  test-all            Run complete test suite"
    echo "  bundle <process>     Create optimized bundle"
    echo "  validate            Validate bundle sizes"
    echo "  deploy              Deploy to AO network"
    echo ""
    echo "Examples:"
    echo "  $0 develop ao-processes/handlers/battle-handler.lua"
    echo "  $0 test-unit battle-handler"
    echo "  $0 bundle battle"
    echo "  $0 validate"
}

case "${1:-help}" in
    develop)
        if [[ -z "$2" ]]; then
            echo "Usage: $0 develop <handler-path>"
            exit 1
        fi
        echo -e "${BLUE}🔨 Starting aos-local development session...${NC}"
        node scripts/aos-local-dev.js load "$2"
        echo -e "${GREEN}Ready for development! Use aos-local-dev.js commands for testing${NC}"
        ;;
        
    test-unit)
        echo -e "${BLUE}🧪 Running aolite unit tests...${NC}"
        if [[ -n "$2" ]]; then
            lua ao-processes/tests/unit/$2.test.lua
        else
            find ao-processes/tests/unit -name "*.test.lua" -exec lua {} \;
        fi
        ;;
        
    test-integration)
        echo -e "${BLUE}🔄 Running aolite integration tests...${NC}"
        find ao-processes/tests/integration -name "*.test.lua" -exec lua {} \;
        ;;
        
    test-all)
        echo -e "${BLUE}🚀 Running complete test suite...${NC}"
        $0 test-unit
        $0 test-integration
        ;;
        
    bundle)
        if [[ -z "$2" ]]; then
            echo "Usage: $0 bundle <process-name>"
            exit 1
        fi
        echo -e "${BLUE}📦 Creating optimized bundle for $2...${NC}"
        ./scripts/optimize-bundle-duplicates.sh
        ;;
        
    validate)
        echo -e "${BLUE}🛡️  Validating bundle sizes...${NC}"
        ./scripts/validate-bundle-sizes.sh build-optimized
        ;;
        
    deploy)
        echo -e "${BLUE}🚀 Deploying to AO network...${NC}"
        # Add deployment logic here
        echo "Deployment logic to be implemented"
        ;;
        
    help|*)
        show_help
        ;;
esac
EOF

    chmod +x scripts/epic34-dev-workflow.sh
    echo -e "${GREEN}✅ Unified workflow script created${NC}"
}

# Main setup execution
main() {
    if ! check_prerequisites; then
        echo ""
        echo -e "${RED}❌ Prerequisites check failed. Please resolve issues and try again.${NC}"
        exit 1
    fi
    
    if ! install_aos_local; then
        echo ""
        echo -e "${RED}❌ aos-local installation failed.${NC}"
        exit 1
    fi
    
    if ! install_aolite; then
        echo ""
        echo -e "${RED}❌ aolite installation failed.${NC}"
        exit 1
    fi
    
    create_testing_infrastructure
    create_workflow_scripts
    
    echo ""
    echo -e "${GREEN}🎉 Epic 34 Environment Setup Complete!${NC}"
    echo "============================================="
    echo ""
    echo -e "${BLUE}✅ Installed Tools:${NC}"
    echo "  - aos-local: JavaScript API for handler development"
    echo "  - aolite: Lua concurrent testing framework"
    echo "  - Bundle optimization tools: Deduplication and validation"
    echo ""
    echo -e "${BLUE}🎯 Next Steps:${NC}"
    echo "1. Start development: ./scripts/epic34-dev-workflow.sh develop <handler-path>"
    echo "2. Run tests: ./scripts/epic34-dev-workflow.sh test-all"
    echo "3. Create bundles: ./scripts/epic34-dev-workflow.sh bundle <process>"
    echo "4. Validate sizes: ./scripts/epic34-dev-workflow.sh validate"
    echo ""
    echo -e "${YELLOW}📚 Key Files Created:${NC}"
    echo "  - ao-processes/tests/framework/aolite-test-runner.lua"
    echo "  - scripts/aos-local-dev.js"
    echo "  - scripts/epic34-dev-workflow.sh"
    echo ""
    echo -e "${GREEN}🏗️  Epic 34 environment is ready for development!${NC}"
}

# Run main setup
main "$@"