# GitHub Actions Workflows

## AO Process Test Suite

### Known Issues & Solutions

#### Lua Command Detection
The workflow uses the `leafo/gh-actions-lua@v10` action which provides a generic `lua` command, not `lua5.3` specifically. The workflow has been updated to prioritize `lua` over `lua5.3` for better compatibility.

#### Cache Service Errors
Occasional GitHub Actions cache service failures (400/503 errors) are infrastructure issues outside our control. The workflow handles these gracefully by falling back to clean builds.

#### Test Compatibility
Tests are compatible with Lua 5.3 and 5.4. Local development can use either version:
- macOS: `brew install lua` (installs latest, currently 5.4)
- Ubuntu: `apt-get install lua5.3` or `lua5.4`

#### Running Tests Locally
```bash
cd ao-processes/tests/unit
lua main.test.lua
lua handler-framework.test.lua
# Run other test files as needed
```

### Workflow Triggers
- Push to main/beta/develop branches (when AO process files change)
- Pull requests to main/beta
- Daily schedule (2 AM UTC)
- Manual workflow dispatch with customizable parameters