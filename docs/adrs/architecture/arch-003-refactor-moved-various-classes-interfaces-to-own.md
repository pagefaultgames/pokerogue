# arch-003: Decompose Monolithic Pokemon Module into Focused Modules

## Status
Implemented - Merged on 2025-06-28

## Context

The `pokemon.ts` file had grown to over 4000 lines, becoming a monolithic module that violated the Single Responsibility Principle. This file contained:
- Core Pokemon class implementation
- Multiple data structures (TurnMove, AttackMoveResult, IllusionData)
- Pokemon summoning logic and data
- Custom Pokemon configurations
- Various helper interfaces

This created several problems:
- **Poor Code Navigation**: Finding specific functionality required scrolling through thousands of lines
- **Merge Conflicts**: Every Pokemon-related change touched the same massive file
- **Circular Dependency Risk**: Everything importing Pokemon got all associated types
- **Testing Complexity**: Couldn't test data structures in isolation

## Decision

Decompose `pokemon.ts` by extracting distinct concerns into separate, focused modules following the established `@types` pattern.

### Technical Implementation:

1. **Move Pure Types to @types Directory**:
   - `AttackMoveResult` → `@types/attack-move-result.ts`
   - `IllusionData` → `@types/illusion-data.ts`
   - `TurnMove` → `@types/turn-move.ts`

2. **Extract Pokemon Summoning System**:
   - `PokemonSummonData` → `pokemon-summon-data.ts`
   - `CustomPokemonData` → `pokemon-summon-data.ts`
   - Related summoning logic consolidated

### Alternatives Considered:

1. **Keep Everything in pokemon.ts**
   - Pros: No refactoring needed
   - Cons: File continues to grow unboundedly
   - Rejected: Technical debt was already too high

2. **Create Subdirectories**
   - Pros: Even more organization
   - Cons: Over-engineering for current needs
   - Rejected: Single-level extraction sufficient for now

## Consequences

### Positive:
- **Reduced File Size**: `pokemon.ts` reduced by ~400 lines (10%)
- **Improved Modularity**: Each file now has a single, clear responsibility
- **Better Import Granularity**: Can import only needed types
- **Easier Testing**: Data structures can be tested in isolation
- **Reduced Merge Conflicts**: Changes distributed across multiple files

### Negative:
- **More Files to Navigate**: Need to know where each type lives
- **Import Updates**: Required updating ~100+ import statements

### Trade-offs:
- **Organization over Consolidation**: Chose multiple focused files over single location
- **Consistency over Convenience**: Following @types pattern even for small interfaces

## Implementation Details

### File Structure After:
```
src/
├── @types/
│   ├── attack-move-result.ts
│   ├── illusion-data.ts
│   └── turn-move.ts
├── field/
│   ├── pokemon.ts (reduced)
│   └── pokemon-summon-data.ts (new)
```

### Migration Pattern:
```typescript
// Before: Everything in pokemon.ts
import { Pokemon, TurnMove, AttackMoveResult } from "#app/field/pokemon";

// After: Specific imports
import { Pokemon } from "#app/field/pokemon";
import { TurnMove } from "#types/turn-move";
import { AttackMoveResult } from "#types/attack-move-result";
```

**Labels**: Refactor, Architecture, Code-Organization

**Reviewed by**: DayKev

## References
- Pull Request: [#6036](https://github.com/pagefaultgames/pokerogue/pull/6036)
- Author: SirzBenjie
- Merged: 2025-06-28

## Related Decisions
- arch-001: Established @types directory pattern
- arch-004: Continues file decomposition effort
- ref-015: Similar decomposition of BattleScene

## Notes
This is part of an ongoing effort to break down monolithic modules in the codebase. While the changes are relatively small, they establish important patterns for future refactoring and make the codebase more maintainable.