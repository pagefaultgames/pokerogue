# ref-014: [Refactor] Ensure that new phases are created through the phase manager

## Status
Implemented - Merged on 2025-06-08

## Context
Trying to remove more circular imports.

## Decision
### Technical Implementation
Created new methods in the phase-manager for creating phases from the phase constructor.
Modified the types in `@types/phase-types.ts` to be synchronized with the types in the phase constructor (so that when adding new phases, they don't have to be added to 3 different places).

Replaced all instances where new phases were being constructed to go through the phase manager.

**NOTE TO REVIEWERS**:

This PR changes _a lot_ of files. Ignore them.

There are ONLY 2 files that are relevant here:
`src/phase-manager.ts`
and
`src/@types/phase-types.ts`

**Category**: Code Refactoring

## Consequences

### Positive
- **User Impact**: None
- Improved code maintainability and structure
- Better separation of concerns

### Negative
- None significant

## Implementation Details
### Testing Approach
Play waves. Everything will work as it always has.

**Labels**: Refactor, Blocker

**Reviewed by**: DayKev

## References
- Pull Request: [#5955](https://github.com/pagefaultgames/pokerogue/pull/5955)
- Author: SirzBenjie
- Merged: 2025-06-08

## Related Decisions
- No directly related ADRs identified

## Notes
This architectural decision was extracted from the project's pull request history and represents a significant change to the system's architecture or design.
