# dat-002: [Dev] [QoL] Add test save with all egg moves unlocked

## Status
Implemented - Merged on 2024-11-05

## Context
- Current everything.prsv doesn't have egg moves
- You may want to have egg moves for testing

## Decision
### Technical Implementation
- Modifies src/tests/utils/saves/everything.ts, sets all egg move values to 15 (0b1111)

**Category**: Data Persistence

## Consequences

### Positive
- **User Impact**:
- Unlocks all egg moves in everything.prsv test save
- Increased test coverage and reliability
- Reduced regression risk

### Negative
- None significant

## Implementation Details
### Testing Approach
Manage Data>Import Data>src/tests/utils/saves/everything.ts

**Labels**: Miscellaneous

## References
- Pull Request: [#4137](https://github.com/pagefaultgames/pokerogue/pull/4137)
- Author: Fontbane
- Merged: 2024-11-05

## Related Decisions
- No directly related ADRs identified

## Notes
This architectural decision was extracted from the project's pull request history and represents a significant change to the system's architecture or design.
