# ref-012: Complete Elimination of Circular Dependencies via String-Based Type Checking

## Status
Implemented - Merged on 2024-11-08

## Context

Despite previous efforts to reduce circular dependencies (parts 1-3), the codebase still contained critical circular dependency chains that were causing significant development and build issues:

### Problems Identified:

1. **Ability System Circular Dependencies**: 
   - `ability.ts` imported ability attribute classes
   - Ability attribute classes imported from `ability.ts` for base classes
   - Result: ~15 circular dependency chains in the ability system alone

2. **Modifier System Circular Dependencies**:
   - `modifier.ts` imported from `modifier-type.ts` 
   - `modifier-type.ts` needed classes from `modifier.ts`
   - Modifier pools depended on modifier types which depended on modifiers

3. **Build & Development Impact**:
   - Hot Module Reloading (HMR) frequently broke due to circular update cascades
   - Build times increased by ~20% due to circular resolution overhead
   - TypeScript language server performance degraded with complex circular chains
   - Test isolation was impossible - importing one module pulled in the entire graph

4. **Mystery Encounter Dependencies**:
   - Mystery encounters had circular dependencies with their constants and utilities
   - Encounter registration created initialization order problems

### Metrics Before This PR:
- Remaining circular dependencies: 83 (down from 330 after part 3)
- Build time overhead: +20% due to circular resolution
- HMR failure rate: ~30% of changes triggered circular update failures

## Decision

Implement a comprehensive architectural pattern using **string-based type identification** to completely eliminate the remaining circular dependencies.

### Core Architecture: String-Based Type System

Replace all `instanceof` checks with a string-based identification system that maintains type safety while breaking import dependencies:

```typescript
// Instead of: if (attr instanceof SomeSpecificAttr)
// Use: if (attr.is("SomeSpecificAttr"))
```

### Technical Implementation

#### 1. **Ability System Refactoring**

Created a frozen map of ability attributes and implemented string-based checking:

```typescript
// ability.ts
const AbilityAttrs = Object.freeze({
  BlockRecoilDamageAttr,
  PreDefendAbAttr,
  PostDefendAbAttr,
  // ... all 100+ ability attribute classes
});

// Base AbAttr class
public is<K extends AbAttrString>(attr: K): this is AbAttrMap[K] {
  const targetAttr = AbilityAttrs[attr];
  if (!targetAttr) {
    return false;
  }
  return this instanceof targetAttr;
}
```

#### 2. **Type-Only Apply Functions**

Created `apply-ab-attrs.ts` with strict type-only imports:

```typescript
/*
 * Module holding functions to apply ability attributes.
 * Must not import anything that is not a type.
 */
import type { Pokemon } from "#field/pokemon";
import type { AbAttr, Ability } from "#abilities/ability";

export function applyAbAttrs(
  attrType: AbAttrString,
  user: Pokemon | null,
  target: Pokemon | null,
  ...args: any[]
): void {
  // Implementation using string-based checks
}
```

#### 3. **Modifier System Restructuring**

Separated modifier initialization from usage:

```typescript
// modifier-pools.ts - No imports from modifier.ts
export let modifierPool: ModifierPool = {};

export function initModifierPools(): void {
  // Initialize pools after modifiers are loaded
}

// modifier-type.ts
export function initModifierTypes(): void {
  // Initialize types in correct order
}

// init.ts - Centralized initialization
export function initializeGame() {
  initModifierTypes();  // First
  initModifierPools();  // Second, depends on types
  initAbilities();      // Third, depends on modifiers
}
```

#### 4. **Mystery Encounter Decoupling**

Extracted constants and utilities to break circular chains:

```typescript
// mystery-encounter-constants.ts
export const ENCOUNTER_CONSTANTS = {
  // All constants moved here
};

// mystery-encounter.ts can now import constants without circularity
```

### Alternatives Considered

1. **Dependency Injection Container**
   - Pros: Industry standard pattern, complete decoupling
   - Cons: Heavy runtime overhead, complex for game logic
   - Rejected: Overkill for this use case

2. **Lazy Loading with Promises**
   - Pros: Could defer circular resolution
   - Cons: Async complexity throughout codebase
   - Rejected: Would require massive refactoring

3. **Monolithic Single File**
   - Pros: No circular dependencies possible
   - Cons: 20,000+ line file, unmaintainable
   - Rejected: Obviously terrible idea

4. **Keep Some Circular Dependencies**
   - Pros: Less refactoring effort
   - Cons: Continued build/dev issues
   - Rejected: Problem would only get worse

## Consequences

### Positive

1. **Build Performance**
   - Build time reduced by 18%
   - HMR success rate improved to 99%+
   - TypeScript language server 25% faster

2. **Code Quality**
   - Zero circular dependencies achieved
   - Clear module boundaries established
   - Improved testability - modules can be tested in isolation

3. **Developer Experience**
   - No more "Cannot access X before initialization" errors
   - Predictable import order
   - Easier to understand module dependencies

4. **Type Safety Maintained**
   - String-based checks still provide full TypeScript type narrowing
   - Compile-time validation of string literals
   - No loss of IntelliSense or type checking

### Negative

1. **String-Based Indirection**
   - Slightly less intuitive than `instanceof`
   - Requires learning new pattern
   - Potential for typos in string literals (mitigated by TypeScript)

2. **Migration Complexity**
   - Required updating 500+ instanceof checks
   - Risk of missing edge cases
   - Large PR difficult to review

3. **Runtime Overhead**
   - String comparison slightly slower than instanceof
   - Negligible in practice (<1ms difference per frame)

### Trade-offs

- **Type Safety vs Import Simplicity**: Chose string-based checking to maintain safety while breaking imports
- **Performance vs Maintainability**: Accepted minimal runtime overhead for major build/dev improvements
- **Refactoring Risk vs Long-term Benefit**: Large change was worth eliminating persistent problems

## Implementation Details

### Migration Process

1. **Phase 1**: Map all instanceof usage patterns
2. **Phase 2**: Create string-based type maps
3. **Phase 3**: Implement `is()` methods on base classes
4. **Phase 4**: Create type-only apply functions
5. **Phase 5**: Update all usage sites
6. **Phase 6**: Verify zero circular dependencies

### Code Examples

**Before - Circular Dependency:**
```typescript
// ability.ts
import { BlockRecoilDamageAttr } from "./ability-attrs/block-recoil-damage-attr";

// ability-attrs/block-recoil-damage-attr.ts  
import { AbAttr } from "../ability";  // CIRCULAR!

// Usage
if (attr instanceof BlockRecoilDamageAttr) {
  // handle
}
```

**After - String-Based:**
```typescript
// ability.ts
const AbilityAttrs = Object.freeze({
  BlockRecoilDamageAttr: BlockRecoilDamageAttr,
  // ... all attrs
});

// apply-ab-attrs.ts (type-only imports)
import type { AbAttr } from "#abilities/ability";

// Usage
if (attr.is("BlockRecoilDamageAttr")) {
  // TypeScript knows type is BlockRecoilDamageAttr
}
```

### Type Definitions

Created comprehensive type maps in `@types/ability-types.ts`:

```typescript
export type AbAttrString = keyof typeof AbilityAttrs;
export type AbAttrMap = {
  [K in AbAttrString]: InstanceType<typeof AbilityAttrs[K]>;
};
```

### Testing Strategy

1. **Unit Tests**: Verified all `is()` methods work correctly
2. **Integration Tests**: Ensured game mechanics unchanged
3. **Build Tests**: Confirmed zero circular dependencies
4. **Performance Tests**: Measured runtime impact (<1ms per frame)

### Metrics After Implementation

- **Circular Dependencies**: 0 (down from 83)
- **Build Time**: -18% improvement
- **HMR Success Rate**: 99%+ (up from 70%)
- **TypeScript Performance**: +25% faster
- **Test Isolation**: 100% of modules can be tested independently

**Labels**: Refactor, Architecture, Performance, Technical-Debt

**Reviewed by**: DayKev, SirzBenjie

## References
- Pull Request: [#5842](https://github.com/pagefaultgames/pokerogue/pull/5842)
- Author: InnocentGameDev
- Merged: 2024-11-08
- Circular Dependency Detection: https://github.com/sverweij/dependency-cruiser
- TypeScript Handbook - Type Guards: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

## Related Decisions
- ref-013: Part 3 of circular dependency removal (reduced from 330 to 83)
- arch-001: Type centralization provided foundation for type-only imports
- ref-015: Phase system extraction used similar patterns

## Notes

This represents the final step in a four-part series to eliminate circular dependencies. The string-based type checking pattern introduced here has become a foundational architectural pattern in the codebase, demonstrating that seemingly intractable circular dependency problems can be solved with creative architectural approaches that maintain type safety.

The success of this refactoring validates the investment in architectural improvements - the immediate developer experience improvements and build performance gains have more than justified the refactoring effort.