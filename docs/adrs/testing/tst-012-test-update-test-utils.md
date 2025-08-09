# tst-012: [Test] Update test utils

## Status
Implemented - Merged on 2025-05-30

## Context
Improve test framework.

## Decision
### Technical Implementation
- Add `FieldHelper` which has methods to mock a pokemon's ability or force a pokemon to be Terastallized
- Add `MoveHelper#use` which can be used to remove the need for setting pokemon move overrides by modifying the moveset of the pokemon
- Add `MoveHelper#selectEnemyMove` to make an enemy pokemon select a specific move
- Add `MoveHelper#forceEnemyMove` which modifies the pokemon's moveset and then uses `selectEnemyMove`
- Fix `GameManager#toNextTurn` to work correctly in double battles
- Add `GameManager#toEndOfTurn` which advances to the end of the turn

<br>

- Disable broken Good As Gold test and add `.edgeCase` to Good As Gold
- Fix Powder test
- Update some tests to demonstrate new methods

**Category**: Testing Infrastructure

## Consequences

### Positive
- **User Impact**: N/A
- Increased test coverage and reliability
- Reduced regression risk

### Negative
- None significant

## Implementation Details

**Labels**: Tests

**Reviewed by**: SirzBenjie

## References
- Pull Request: [#5848](https://github.com/pagefaultgames/pokerogue/pull/5848)
- Author: DayKev
- Merged: 2025-05-30

## Related Decisions
- No directly related ADRs identified

## Notes
This architectural decision was extracted from the project's pull request history and represents a significant change to the system's architecture or design.
