# Error Handling Strategy

## General Approach

**Error Model:** Exception-based error handling using Lua's `error()` and `pcall()` patterns
**Exception Hierarchy:** Structured error types with specific error codes for different failure categories
**Error Propagation:** Errors bubble up to handler level where they're converted to informative AO message responses

## Logging Standards

**Library:** Custom Lua logging system (no external dependencies)
**Format:** Structured JSON logging with correlation IDs
**Levels:** ERROR, WARN, INFO, DEBUG with configurable verbosity

**Required Context Fields:**
- **Correlation ID:** Unique identifier linking related operations across handlers
- **Service Context:** Handler name, operation type, processing stage
- **User Context:** Player ID (wallet address) for player-specific operations

## Error Handling Patterns

### Business Logic Errors

**Custom Exceptions:** Domain-specific error types for game rule violations
**User-Facing Errors:** Clear error messages for invalid player actions
**Error Codes:** Structured error code system for consistent error handling

```lua
-- Business Logic Error Handling
local GameErrors = {
    INVALID_POKEMON = "INVALID_POKEMON",
    INVALID_MOVE = "INVALID_MOVE", 
    INSUFFICIENT_PP = "INSUFFICIENT_PP",
    POKEMON_FAINTED = "POKEMON_FAINTED",
    BATTLE_NOT_FOUND = "BATTLE_NOT_FOUND"
}

-- User-friendly error responses
function formatUserError(error)
    local userMessages = {
        [GameErrors.INVALID_POKEMON] = "The selected Pokemon is not available.",
        [GameErrors.INVALID_MOVE] = "That move cannot be used right now.", 
        [GameErrors.INSUFFICIENT_PP] = "The move is out of PP."
    }
    
    return {
        success = false,
        error = {
            code = error.context.errorCode,
            message = userMessages[error.context.errorCode] or error.message
        }
    }
end
```
