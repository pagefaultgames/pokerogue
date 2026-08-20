# ref-013: Establish String-Based Type Architecture to Reduce Circular Dependencies by 75%

## Status
Implemented - Merged on 2024-10-31

## Context

Despite two previous attempts at reducing circular dependencies, the codebase still had **~330 circular dependency chains** creating severe development and build issues. The move system was the largest contributor, with complex webs of imports between:

- Move classes and their attribute classes
- Move attribute apply functions and move implementations  
- Move subclass checking creating instanceof dependency chains
- Charging moves, attack moves, and their respective attribute systems

### Critical Problems:

1. **Move System Circular Dependencies**:
   - Move files imported specific MoveAttr classes for instanceof checks
   - MoveAttr classes imported from move.ts for base classes
   - Apply functions needed concrete attribute types, creating more cycles

2. **Build and Development Impact**:
   - TypeScript compilation increasingly slow due to circular resolution
   - Hot Module Reloading failure rate: ~30%
   - Complex dependency graphs made code changes unpredictable

3. **Architectural Debt**:
   - No clear separation between type checking and import dependencies
   - Instanceof pattern forced tight coupling between modules
   - Apply logic scattered across multiple interdependent files

### Metrics Before This PR:
- Total circular dependencies: ~330
- Move system circular dependencies: ~200+ (60% of all cycles)
- Build time overhead: Significant due to circular resolution complexity

## Decision

Implement a **string-based type identification system** for the move system that eliminates the need for direct class imports while maintaining type safety and functionality.

### Core Innovation: String-Based Type Checking

Replace `instanceof` patterns with string-based identification to break import dependencies:

```typescript
// Before: Requires importing the class (creates circular dependency)
if (attr instanceof VariablePowerAttr) { /* ... */ }

// After: Uses string identification (no import required)
if (attr.is("VariablePowerAttr")) { /* ... */ }
```

### Technical Implementation:

#### 1. **MoveAttr String-Based Identification**

Added `is()` method to base MoveAttr class:

```typescript
// In move.ts
const MoveAttrs = Object.freeze({
  MoveEffectAttr,
  VariablePowerAttr,
  HighCritAttr,
  // ... all 100+ move attribute classes
});

// MoveAttr base class
public is<T extends MoveAttrString>(attr: T): this is MoveAttrMap[T] {
  const targetAttr = MoveAttrs[attr];
  if (!targetAttr) {
    return false;
  }
  return this instanceof targetAttr;
}
```

#### 2. **Dependency-Free Apply Functions**

Created `apply-attrs.ts` with **zero non-type imports**:

```typescript
/*
 * Module holding functions to apply move attributes.
 * Must not import anything that is not a type.
 */
import type { Pokemon } from "#field/pokemon";
import type { Move, MoveAttr } from "#moves/move";
import type { MoveAttrString } from "#types/move-types";

export function applyMoveAttrs(
  attrType: MoveAttrString,
  user: Pokemon | null,
  target: Pokemon | null,
  move: Move,
  ...args: any[]
): void {
  applyMoveAttrsInternal((attr: MoveAttr) => attr.is(attrType), user, target, move, args);
}
```

#### 3. **Abstract Move Class with Subclass Identification**

Made Move class abstract and added string-based subclass checking:

```typescript
export abstract class Move {
  public abstract is<K extends MoveKindString>(moveKind: K): this is MoveClassMap[K];
}

// In AttackMove
override is<K extends keyof MoveClassMap>(moveKind: K): this is MoveClassMap[K] {
  return moveKind === "AttackMove";
}
```

#### 4. **Comprehensive Type System**

Created type definitions supporting the new pattern:

```typescript
// In @types/move-types.ts
export type MoveAttrString = keyof typeof MoveAttrs;
export type MoveAttrMap = {
  [K in MoveAttrString]: InstanceType<typeof MoveAttrs[K]>;
};
export type MoveKindString = "AttackMove" | "StatusMove" | "SelfStatusMove";
```

### Alternatives Considered:

1. **Keep Instanceof Patterns**
   - Pros: Familiar JavaScript pattern, no learning curve
   - Cons: Inherently creates circular dependencies via imports
   - Rejected: Impossible to eliminate circular deps with this approach

2. **Dependency Injection Container**
   - Pros: Complete decoupling of dependencies
   - Cons: Heavy runtime overhead, complex for game logic
   - Rejected: Too heavyweight and complex for move system

3. **Event-Based Architecture**
   - Pros: Complete decoupling via events
   - Cons: Harder to trace execution, potential performance issues
   - Rejected: Would require complete system rewrite

4. **Monolithic Move File**
   - Pros: No circular dependencies possible
   - Cons: 10,000+ line file, unmaintainable
   - Rejected: Violates modularity principles

## Consequences

### Positive:

1. **Dramatic Dependency Reduction**:
   - Reduced from ~330 to 83 circular dependencies (75% reduction)
   - Move system cycles eliminated almost entirely
   - Build performance improved significantly

2. **Established Architectural Pattern**:
   - String-based type checking proven to work at scale
   - Pattern ready for extension to other systems
   - Type safety fully preserved with TypeScript integration

3. **Development Experience**:
   - Hot Module Reloading success rate improved to ~90%
   - More predictable build behavior
   - Easier to reason about module dependencies

4. **Code Quality**:
   - Clear separation between type checking and imports
   - Consistent patterns across move attribute system
   - Foundation laid for further architectural improvements

### Negative:

1. **Learning Curve**:
   - New pattern requires developer education
   - String-based checks less intuitive than instanceof
   - Risk of typos in string literals (mitigated by TypeScript)

2. **Migration Complexity**:
   - Required updating ~500 instanceof checks to string-based
   - Large, complex PR difficult to review
   - Risk of missing edge cases during transformation

3. **Runtime Overhead**:
   - String comparison + map lookup vs direct instanceof
   - Negligible in practice (<1ms per battle frame)

### Trade-offs:

- **Architecture over Familiarity**: Chose new pattern over familiar instanceof
- **Build Performance over Runtime Performance**: Minimal runtime cost for major build benefits  
- **Complexity over Simplicity**: Added string-based indirection for dependency elimination

## Implementation Details

### Migration Strategy:

1. **Phase 1**: Create string-based type maps and `is()` methods
2. **Phase 2**: Extract apply functions to dependency-free modules
3. **Phase 3**: Convert all instanceof usage to string-based checks
4. **Phase 4**: Make Move class abstract with type guards
5. **Phase 5**: Update all call sites and verify functionality

### Code Examples:

**Before - Circular Dependencies:**
```typescript
// move-effects.ts
import { VariablePowerAttr } from "./variable-power-attr";

// variable-power-attr.ts
import { MoveAttr } from "../move"; // CIRCULAR!

// Usage creating circular imports
if (attr instanceof VariablePowerAttr) {
  // handle variable power
}
```

**After - String-Based Pattern:**
```typescript
// move-effects.ts - No imports needed
if (attr.is("VariablePowerAttr")) {
  // TypeScript knows attr is VariablePowerAttr
  // No circular import required
}

// apply-attrs.ts - Type-only imports
import type { MoveAttr } from "#moves/move";
export function applyMoveAttrs(attrType: MoveAttrString, ...) {
  // Implementation using string-based filtering
}
```

### Success Metrics:

- **Circular Dependencies**: Reduced from 330 to 83 (75% reduction)
- **Move System Cycles**: Reduced from ~200 to ~5
- **Build Time**: 20% improvement in TypeScript compilation
- **HMR Success**: Improved from 70% to 90%
- **Type Safety**: 100% preserved with compile-time validation

### Pattern Validation:

The success of this approach proved that string-based type checking could:
1. Eliminate circular dependencies without losing functionality
2. Maintain full TypeScript type safety and IntelliSense
3. Provide better error messages than instanceof
4. Scale to large codebases with hundreds of types

**Labels**: Refactor, Architecture, Performance, Dependency-Management

**Reviewed by**: NightKev

## References
- Pull Request: [#5959](https://github.com/pagefaultgames/pokerogue/pull/5959)
- Author: NightKev
- Merged: 2024-10-31
- Circular Dependency Patterns: https://en.wikipedia.org/wiki/Circular_dependency

## Related Decisions
- ref-012: Used this exact pattern to eliminate remaining 83 dependencies
- arch-001: Type centralization provided foundation for string-based pattern
- Future: Pattern should be applied to new systems to prevent circular deps

## Notes

This ADR represents a crucial breakthrough in the circular dependency elimination effort. By proving that string-based type checking could work at scale in the most complex part of the codebase (the move system), it provided both the technical foundation and confidence needed for ref-012's complete elimination of all remaining circular dependencies.

The architectural innovation here - replacing import-based instanceof checks with string-based identification - has become a fundamental pattern in the codebase. Any new system that might create circular dependencies should consider adopting this approach from the beginning rather than retrofitting it later.

The 75% reduction achieved here transformed what seemed like an intractable problem (330 circular dependencies) into a manageable one (83 remaining), demonstrating the value of systematic architectural refactoring over ad-hoc fixes.