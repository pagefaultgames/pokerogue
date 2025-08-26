# Test Strategy and Standards

## Testing Philosophy

**Approach:** **Parity-First Test-Driven Development** - Every game mechanic must be validated against TypeScript reference before implementation acceptance
**Coverage Goals:** 100% behavioral parity validation, 95%+ code coverage for critical game logic
**Test Pyramid:** Heavy integration testing for game mechanics, focused unit tests for mathematical calculations

## Test Types and Organization

### Unit Tests

**Framework:** Custom Lua test framework with TypeScript comparison utilities
**File Convention:** `*.test.lua` files co-located with implementation modules
**Location:** `ao-processes/tests/unit/`
**Coverage Requirement:** 100% for stat calculations, 95% for core game logic

**AI Agent Requirements:**
- Generate tests for all public functions automatically
- Cover edge cases and error conditions systematically  
- Follow AAA pattern (Arrange, Act, Assert) consistently
- Mock all external dependencies including RNG and database access

### Integration Tests

**Scope:** Complete handler workflows including message processing, state updates, and response generation
**Location:** `ao-processes/tests/integration/`
**Test Infrastructure:**
  - **Battle State Management:** In-memory test battle creation and cleanup
  - **Message Simulation:** Mock AO message objects for handler testing  
  - **State Validation:** Automated state consistency checking

### End-to-End Tests

**Framework:** Complete game scenario testing with full AO message simulation
**Scope:** Multi-turn battles, Pokemon evolution, save/load cycles, agent interaction
**Environment:** Local AO emulation with full process simulation

## Continuous Testing

**CI Integration:** GitHub Actions workflow executing all test suites on every commit
**Performance Tests:** Automated benchmarking comparing Lua vs TypeScript execution times
