# Epic 33: AO Timestamp Compatibility Refactor

## Epic Goal

Replace all `os.time()` calls with AO-compatible timestamp handling using `msg.Timestamp` to ensure processes run correctly in the AO sandbox environment where `os.time()` is not available.

## Epic Description

### Problem Statement

The current AO process implementation contains 153+ instances of `os.time()` calls throughout the codebase. These calls fail in the AO sandbox environment because `os.time()` is not available, causing runtime errors and preventing proper process execution. All time-dependent functionality needs to be refactored to use AO-compatible timestamp handling.

### Solution Overview

Implement systematic parameter threading where message handlers extract `msg.Timestamp` and pass it to internal methods as function parameters, replacing all direct `os.time()` calls while preserving existing timing calculations and business logic.

### Technical Context

**Existing System Context:**
- Current functionality: Multi-process AO-based PokéRogue game with extensive timestamp usage
- Technology stack: Lua processes running in AO sandbox environment  
- Integration points: Message handlers receive `msg.Timestamp`, state persistence systems, inter-process communication

**Enhancement Details:**
- What's being changed: Replace all `os.time()` calls with proper timestamp parameter passing from message handlers
- How it integrates: Handlers extract `msg.Timestamp` and thread it through method calls as parameters
- Success criteria: All processes run without sandbox violations, all timestamp-dependent features remain functional

## Stories

### Story 33.1: Core Handler Modules Timestamp Migration

**Story Goal:** Refactor primary message handlers to extract and utilize `msg.Timestamp` instead of `os.time()` calls.

**Description:** Update the core handler modules (battle-handler, admin-handler, shop-handler, berry-handler, query-handler, state-handler, auth-handler, validation-handler, anti-cheat-handler, inter-process-handler, error-handler) to:
- Extract timestamp from incoming messages using `msg.Timestamp`
- Thread timestamp parameter through internal method calls
- Replace all `os.time()` calls within handler contexts
- Ensure all response messages include proper timestamps

**Acceptance Criteria:**
- [ ] All 11 core handler modules updated to use `msg.Timestamp`
- [ ] Zero `os.time()` calls remain in handler modules
- [ ] All handler response messages include proper timestamp fields
- [ ] Existing message interface contracts preserved
- [ ] Handler registration timestamps use provided parameters
- [ ] All timing-dependent handler logic remains functionally identical

### Story 33.2: Game Logic Components Timestamp Parameter Threading

**Story Goal:** Update game logic components to accept timestamp parameters and eliminate `os.time()` dependencies.

**Description:** Refactor game logic components including economic-system, participation-tracker, battle managers, process coordination systems, ability processors, and battle statistics to:
- Modify method signatures to accept timestamp parameters
- Thread timestamps through nested method calls
- Replace `os.time()` calls with parameter usage
- Preserve all existing timing calculations and business logic
- Maintain backward compatibility for method interfaces

**Acceptance Criteria:**
- [ ] All game logic components accept timestamp parameters
- [ ] Method signatures updated systematically across component hierarchy
- [ ] Zero `os.time()` calls remain in game logic modules  
- [ ] All timing calculations produce identical results
- [ ] Battle timing, economic calculations, and participation tracking preserved
- [ ] Component integration points maintain compatibility
- [ ] Performance impact minimized (parameter passing vs function calls)

### Story 33.3: Security & Admin Systems Timestamp Integration

**Story Goal:** Complete timestamp migration for security handlers, admin components, and monitoring systems.

**Description:** Update remaining systems including security handlers (validation, enforcement, audit, response), admin components (health monitor, log aggregator, alert manager, maintenance coordinator), and specialized components (crypto-RNG, concurrent battle manager) to:
- Replace all remaining `os.time()` calls with timestamp parameters
- Ensure security audit trails maintain proper timestamps
- Update monitoring and logging systems for AO compatibility
- Verify backward compatibility for existing timestamp data
- Complete comprehensive testing of all timestamp-dependent functionality

**Acceptance Criteria:**
- [ ] All security handler modules use parameter-based timestamps
- [ ] Admin and monitoring components fully migrated
- [ ] Security audit trails maintain timestamp accuracy
- [ ] Log aggregation and health monitoring systems compatible
- [ ] Zero `os.time()` calls remain across entire codebase
- [ ] All specialized components (RNG, battle managers) updated
- [ ] Comprehensive testing validates all timestamp functionality
- [ ] No regression in security, admin, or monitoring operations

## Technical Requirements

### Compatibility Requirements
- [ ] Existing APIs remain unchanged (handlers accept same message formats)
- [ ] Database schema changes are backward compatible (timestamps remain same format)
- [ ] UI changes follow existing patterns (no UI changes required)
- [ ] Performance impact is minimal (parameter passing vs function call)

### Integration Requirements
- [ ] All handler modules extract `msg.Timestamp` consistently
- [ ] Parameter threading maintains method signature compatibility where possible
- [ ] State persistence systems handle timestamps correctly
- [ ] Inter-process communication preserves timestamp flow
- [ ] Error handling preserves timestamp context

## Risk Mitigation

### Primary Risks
1. **Breaking existing timing calculations or introducing timestamp inconsistencies**
   - **Mitigation:** Systematic refactoring with parameter threading, maintaining calculation logic unchanged
   - **Testing:** Comprehensive validation of all timing-dependent features

2. **Performance degradation from extensive parameter passing**
   - **Mitigation:** Minimal performance impact expected (parameter passing vs function call)
   - **Validation:** Performance testing during implementation

3. **Introduction of bugs in complex timestamp-dependent logic**
   - **Mitigation:** Incremental migration with extensive testing at each phase
   - **Rollback:** Git revert capability maintained throughout

### Rollback Plan
- Git revert of all changes, `os.time()` calls restored for local testing environments
- Clear commit structure enables selective rollback of specific components
- Automated test suite validates rollback functionality

## Definition of Done

### Epic Completion Criteria
- [ ] All 153+ `os.time()` instances replaced with AO-compatible alternatives
- [ ] All handler modules extract and utilize `msg.Timestamp`
- [ ] Game logic components accept timestamp parameters throughout call hierarchy
- [ ] Security, admin, and monitoring systems fully migrated
- [ ] Integration points working correctly with `msg.Timestamp` flow
- [ ] Zero sandbox violations when running in AO environment

### Quality Validation
- [ ] All existing timestamp-dependent functionality verified through testing
- [ ] No regression in battle resolution, economic calculations, or admin operations
- [ ] Performance impact assessed and deemed acceptable
- [ ] Security audit trails maintain accuracy and completeness
- [ ] Monitoring and logging systems function correctly with new timestamp handling

### Technical Validation
- [ ] All message handler patterns follow AO conventions consistently
- [ ] Parameter threading implemented systematically across codebase
- [ ] Error handling preserves timestamp context appropriately
- [ ] State persistence maintains timestamp data integrity
- [ ] Inter-process communication handles timestamps correctly

## Dependencies

### Technical Dependencies
- AO message structure provides `msg.Timestamp` reliably
- Message handlers have access to timestamp data in all execution contexts
- State persistence systems can handle modified timestamp flows

### Process Dependencies
- This epic can be executed in parallel with other non-timestamp-dependent epics
- Should be completed before any major AO sandbox deployment
- Testing framework must validate timestamp functionality comprehensively

## Success Metrics

### Functional Metrics
- Zero AO sandbox violations related to `os.time()` usage
- All timestamp-dependent features maintain identical behavior
- Response time impact < 5% for timestamp parameter threading

### Quality Metrics  
- Zero regressions in existing test suite
- All timing calculations produce mathematically identical results
- Security audit trails maintain complete timestamp accuracy

### Operational Metrics
- Successful deployment to AO sandbox environment
- All processes start and execute without timestamp-related errors
- Monitoring and logging systems provide complete operational visibility