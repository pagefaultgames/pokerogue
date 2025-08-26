# Security

## Input Validation

**Validation Library:** Custom Lua validation system (no external dependencies)
**Validation Location:** All validation performed at handler entry points before processing
**Required Rules:**
- All external inputs MUST be validated against expected schemas
- Validation at AO message boundary before any game logic processing  
- Whitelist approach preferred over blacklist for allowed values

## Authentication & Authorization

**Auth Method:** AO message sender validation using wallet addresses
**Session Management:** Stateless - each message independently authenticated
**Required Patterns:**
- Only message sender can modify their own game data
- Battle participation validated through active battle roster

## Game State Integrity

**State Consistency:** Atomic message processing prevents partial state corruption
**Anti-Cheating:** Input validation prevents impossible game states
