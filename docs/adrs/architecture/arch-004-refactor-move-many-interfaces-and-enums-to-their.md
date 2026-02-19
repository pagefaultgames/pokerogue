# arch-004: Extract Enums and Interfaces to Reduce Monolithic File Dependencies

## Status
Implemented - Merged on 2025-04-14

## Context

Several core files had become monolithic modules containing dozens of enums, interfaces, and data structures alongside their main classes. This created several issues:

1. **Forced Over-Importing**: Importing a single enum required loading entire large files
2. **Merge Conflicts**: Multiple developers modifying the same mega-files
3. **Circular Dependency Risk**: Large files with mixed concerns created import cycles
4. **Poor Code Organization**: Related enums and interfaces scattered across files

### Specific Problems:

- `move.ts`: Contained move enums, interfaces, and the entire moves array alongside move classes
- Various files mixed implementation with supporting types
- `allMoves` array forced importing entire monolithic `move.ts` just to access move data
- No clear separation between data definitions and business logic

## Decision

Systematically extract enums, interfaces, and data structures into dedicated modules following established patterns.

### Technical Implementation:

#### 1. **Enum and Interface Extraction**
- Moved standalone enums to their own files
- Extracted interfaces to appropriate modules
- Separated data arrays from implementation files

#### 2. **Key Changes Made**:
- **`allMoves` Array**: Moved to dedicated `all-moves.ts` file
- **`LearnMoveSituation`**: Renamed to `LearnMoveContext` for clarity and moved
- **Unused Code Cleanup**: Removed `selfStatLowerMoves` (unused)
- **Various Enums**: Extracted to individual files or appropriate groupings

#### 3. **Import Optimization**:
```typescript
// Before: Heavy import for simple enum
import { SomeEnum } from "./massive-file-with-everything";

// After: Targeted import
import { SomeEnum } from "./some-enum";
```

### Architectural Benefits:

1. **Granular Imports**: Import only what you need
2. **Reduced Bundle Size**: Tree-shaking can eliminate unused code
3. **Clearer Dependencies**: Explicit about what each file actually uses
4. **Faster Compilation**: TypeScript can cache smaller, focused modules

### Challenges Encountered:

- **`MoveResult` Enum**: Attempted extraction from `pokemon.ts` caused widespread breakage due to deep integration with Pokemon class
- **Dependency Web**: Some extractions revealed unexpected dependency relationships
- **Import Chain Updates**: Required updating dozens of import statements

### Alternatives Considered:

1. **Keep Everything Together**
   - Pros: Simple mental model, everything in one place
   - Cons: Files continue growing, merge conflicts, over-importing
   - Rejected: Technical debt was accumulating too quickly

2. **Barrel Exports**
   - Pros: Single import point, easier to use
   - Cons: Defeats tree-shaking, still imports everything
   - Rejected: Doesn't solve the core over-importing problem

## Consequences

### Positive:
- **Import Granularity**: Can import specific enums without loading large files
- **Better Organization**: Related types grouped logically
- **Reduced File Sizes**: Several files reduced by 100-300 lines
- **Improved Tree-Shaking**: Bundler can eliminate unused code more effectively
- **Clearer Dependencies**: Explicit about what each module actually needs

### Negative:
- **More Files**: Need to know where each enum/interface lives
- **Import Maintenance**: More import statements to manage
- **Incomplete**: Some extractions (like `MoveResult`) weren't feasible

### Trade-offs:
- **Granularity over Convenience**: Chose explicit imports over single large imports
- **Organization over Familiarity**: Changed established file locations for better structure

## Implementation Details

### Examples of Extractions:

**allMoves Array:**
```typescript
// Before: In massive move.ts file
export const allMoves = [/* hundreds of moves */];

// After: Dedicated file
// all-moves.ts
export const allMoves = [/* hundreds of moves */];
```

**Enum Extraction:**
```typescript
// Before: Mixed with implementation
// some-large-file.ts
export enum ImportantEnum { /* values */ }
export class LargeClass { /* implementation */ }

// After: Separated
// important-enum.ts  
export enum ImportantEnum { /* values */ }

// large-class.ts
export class LargeClass { /* implementation */ }
```

### Lessons Learned:

1. **Deep Integration Constraints**: Some types (`MoveResult`) are too deeply integrated to extract easily
2. **Gradual Approach**: Better to extract incrementally than attempt massive reorganization
3. **Test Coverage Importance**: Good tests catch breaking changes during refactoring

**Labels**: Refactor, Architecture, Code-Organization

**Reviewed by**: NightKev

## References
- Pull Request: [#5502](https://github.com/pagefaultgames/pokerogue/pull/5502)
- Author: NightKev
- Merged: 2025-04-14

## Related Decisions
- arch-001: Established @types directory pattern for type organization
- arch-003: Similar file decomposition effort
- Future: Continue extracting interfaces and enums as opportunities arise

## Notes

This refactoring represents ongoing effort to organize the codebase better. While not as dramatic as other architectural changes, these incremental improvements in file organization and import granularity compound over time to make the codebase more maintainable.

The failed attempt to extract `MoveResult` demonstrates that some types are too deeply integrated into existing architecture to easily move. This suggests that future architectural decisions should consider extractability from the beginning.