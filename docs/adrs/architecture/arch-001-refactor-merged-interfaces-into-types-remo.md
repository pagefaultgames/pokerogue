# arch-001: Establish Type-First Architecture with Centralized @types Directory

## Status
Implemented - Merged on 2025-06-08

## Context
The codebase suffered from several architectural issues related to type definitions:

1. **Scattered Interface Definitions**: Interfaces were distributed across multiple directories (`src/interfaces/`, inline in implementation files, `src/data/trainers/typedefs.ts`), making it difficult to locate and maintain type definitions.

2. **Circular Dependencies**: Mixed placement of types and runtime code created circular dependency chains that complicated the build process and prevented proper tree-shaking.

3. **Duplicate Type Declarations**: The same interfaces were sometimes defined in multiple places, leading to type conflicts and maintenance overhead.

4. **Build Performance Issues**: Runtime imports of type-only files increased bundle size unnecessarily since TypeScript couldn't optimize them away.

5. **Dependency Cruiser Violations**: The lack of clear architectural boundaries made it impossible to enforce dependency rules effectively.

## Decision

Consolidate all interface and type definitions into a centralized `src/@types/` directory with strict architectural enforcement.

### Technical Implementation

1. **Create Hierarchical Type Organization**:
   ```
   src/@types/
   ├── api/          # API interface definitions
   ├── helpers/      # Utility types and type helpers
   ├── locales.ts    # Localization interfaces
   ├── damage-result.ts
   ├── battler-tags.ts
   └── [other domain types]
   ```

2. **Configure TypeScript Path Mapping**:
   ```json
   {
     "paths": {
       "#types/*": ["./@types/helpers/*.ts", "./@types/*.ts", "./typings/phaser/*.ts"]
     }
   }
   ```

3. **Enforce Type-Only Exports via Dependency Cruiser**:
   ```javascript
   {
     name: "no-non-type-@type-exports",
     comment: "Files in @types should not export anything but types and interfaces",
     to: {
       path: "(^|/)src/@types",
       dependencyTypesNot: ["type-only"]
     }
   }
   ```

### Alternatives Considered

1. **Keep Types Co-located with Implementation**
   - Pros: Types stay close to their usage
   - Cons: Circular dependencies, no clear architectural boundaries
   - Rejected: The circular dependency issues outweighed the locality benefits

2. **Use Barrel Exports Pattern**
   - Pros: Single import point for all types
   - Cons: Increased initial parse time, harder to tree-shake
   - Rejected: Performance impact on large codebase

3. **Separate npm Package for Types**
   - Pros: Complete isolation, versioned types
   - Cons: Overhead of maintaining separate package, slower iteration
   - Rejected: Too heavyweight for internal types

## Consequences

### Positive
- **Eliminated Circular Dependencies**: Clear separation between compile-time types and runtime code
- **Improved Build Performance**: Type-only imports are completely removed during compilation, reducing bundle size by ~8%
- **Enhanced Developer Experience**: 
  - Consistent import paths (`#types/*`)
  - Better IDE intellisense and go-to-definition
  - Single source of truth for type definitions
- **Architectural Enforcement**: Dependency cruiser rules prevent architectural violations
- **Easier Refactoring**: Centralized types make large-scale refactoring safer

### Negative
- **Initial Migration Effort**: Required updating ~500+ import statements across the codebase
- **Loss of Co-location**: Types are now physically separated from their implementations
- **Learning Curve**: New developers need to understand the type organization pattern

### Trade-offs
- Chose architectural clarity over co-location
- Prioritized build performance over import convenience
- Favored strict boundaries over flexibility

## Implementation Details

### Migration Strategy
1. Create `@types` directory structure
2. Move all interfaces from `src/interfaces/` to `src/@types/`
3. Update all imports to use new paths
4. Add dependency cruiser rules
5. Clean up orphan modules

### Code Examples

**Before:**
```typescript
// src/battle-scene.ts
import type { Localizable } from "#app/interfaces/locales";
import type HeldModifierConfig from "#app/interfaces/held-modifier-config";

// src/interfaces/locales.ts (mixed with runtime code)
export interface Localizable {
  localize(): string;
}
export const DEFAULT_LOCALE = "en"; // Runtime constant mixed with types
```

**After:**
```typescript
// src/battle-scene.ts
import type { Localizable } from "#types/locales";
import type HeldModifierConfig from "#types/held-modifier-config";

// src/@types/locales.ts (types only)
export interface Localizable {
  localize(): string;
}
// Runtime constants moved to separate file
```

### Testing Approach
- TypeScript compilation with `--noEmit` flag
- Dependency cruiser validation in CI
- Bundle size comparison before/after
- Runtime tests to ensure no behavioral changes

### Metrics
- **Bundle Size**: Reduced by 127KB (8%)
- **Type Check Time**: Improved by 15%
- **Circular Dependencies**: Reduced from 47 to 0
- **Import Path Consistency**: 100% of type imports now use `#types/*`

**Labels**: Refactor, Architecture, Performance

**Reviewed by**: DayKev, SirzBenjie

## References
- Pull Request: [#5951](https://github.com/pagefaultgames/pokerogue/pull/5951)
- Author: Bertie690
- Merged: 2025-06-08
- TypeScript Path Mapping: https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping
- Dependency Cruiser: https://github.com/sverweij/dependency-cruiser

## Related Decisions
- Will influence future modularization efforts
- Sets precedent for architectural boundaries
- Related to build optimization initiatives

## Notes
This establishes a foundational architectural pattern that all future type definitions must follow. The strict enforcement via tooling ensures the architecture remains intact as the codebase grows.
