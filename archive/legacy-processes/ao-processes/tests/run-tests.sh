#!/bin/bash

# Test runner script that ensures Lua 5.3 compatibility
# Usage: ./run-tests.sh [test-group]

set -e

echo "🧪 AO Process Test Runner"
echo "========================="

# Setup Lua 5.3 environment
source ./setup-lua53.sh || {
    echo "❌ Failed to setup Lua 5.3 environment"
    exit 1
}

# Test ability system components first
echo "🔬 Testing Ability System Components..."
echo "======================================"

# Set correct Lua path for ability system tests
export LUA_PATH="../?.lua;../?/init.lua;../data/?.lua;../data/?/init.lua;./?.lua;./?/init.lua;;"

# Test AbilityDatabase
echo "🧪 Testing AbilityDatabase..."
$LUA_CMD -e "
local AbilityDatabase = require('data.abilities.ability-database')
AbilityDatabase.init()
assert(AbilityDatabase.getAbilityCount() >= 46, 'Should have at least 46 abilities')
assert(AbilityDatabase.getAbility(1), 'Should load first ability')
print('✅ AbilityDatabase: ' .. AbilityDatabase.getAbilityCount() .. ' abilities loaded')
" || { echo "❌ AbilityDatabase test failed"; exit 1; }

# Test AbilityIndexes
echo "🧪 Testing AbilityIndexes..."
$LUA_CMD -e "
local AbilityIndexes = require('data.abilities.ability-indexes')
local AbilityDatabase = require('data.abilities.ability-database')
AbilityDatabase.init()
AbilityIndexes.init()
assert(AbilityIndexes.getAbilityById(1), 'Should get ability by ID')
print('✅ AbilityIndexes: Fast lookup system working')
" || { echo "❌ AbilityIndexes test failed"; exit 1; }

# Test PassiveAbilities
echo "🧪 Testing PassiveAbilities..."
$LUA_CMD -e "
local PassiveAbilities = require('data.abilities.passive-abilities')
PassiveAbilities.init()
local categories = PassiveAbilities.getCategories()
assert(type(categories) == 'table' and #categories > 0, 'Should have passive categories')
print('✅ PassiveAbilities: ' .. #categories .. ' categories loaded')
" || { echo "❌ PassiveAbilities test failed"; exit 1; }

echo "======================================"

# Change to unit test directory
cd unit

# Test group from argument or run all
TEST_GROUP=${1:-all}

# Function to run a test file
run_test() {
    local test_file=$1
    if [ -f "$test_file" ]; then
        echo "🧪 Running $test_file..."
        if $LUA_CMD "$test_file"; then
            echo "✅ $test_file passed"
            return 0
        else
            echo "❌ $test_file failed"
            return 1
        fi
    else
        echo "⚠️ $test_file not found"
        return 0
    fi
}

# Define test groups matching GitHub Actions workflow
case $TEST_GROUP in
    1)
        TESTS="main.test.lua handler-framework.test.lua"
        ;;
    2)
        TESTS="admin-handler.test.lua error-handling.test.lua"
        ;;
    3)
        TESTS="auth-handler.test.lua validation-handler.test.lua"
        ;;
    4)
        TESTS="anti-cheat-handler.test.lua enhanced-test-framework.test.lua"
        ;;
    all)
        TESTS=$(ls *.test.lua 2>/dev/null)
        ;;
    *)
        # Single test file
        TESTS="$TEST_GROUP"
        ;;
esac

# Run tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

for TEST_FILE in $TESTS; do
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test "$TEST_FILE"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
done

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo "Total:  $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS ✅"
echo "Failed: $FAILED_TESTS ❌"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed!"
    exit 0
else
    echo ""
    echo "⚠️ Some tests failed. Please review the output above."
    exit 1
fi