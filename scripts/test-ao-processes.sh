#!/bin/bash
# Test runner for AO processes
# Integrates Lua tests with main project testing pipeline

cd "$(dirname "$0")/../ao-processes"
echo "Running AO Process Tests..."
lua run-tests.lua
exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "✅ AO Process tests passed"
else
    echo "❌ AO Process tests failed"
fi

exit $exit_code