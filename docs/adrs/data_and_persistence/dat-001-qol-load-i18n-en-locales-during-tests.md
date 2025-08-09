# dat-001: [Qol] Load i18n en locales during tests

## Status
Implemented - Merged on 2024-10-09

## Context
Right now it's kinda hard to read the obfuscated logs during tests as it's just i18n keys.

## Decision
### Technical Implementation
- Added a MSW that handles loading the locales files during tests
- Fix all tests that were written in a way that they were affected by this. They shouldn't anymore in the future now.

**Category**: Data Persistence

## Consequences

### Positive
- Increased test coverage and reliability
- Reduced regression risk

### Negative
- None significant

## Implementation Details
### Testing Approach
Run the tests. YOu should see human readable english output yet fully functional tests.

**Labels**: Tests, Refactor

## References
- Pull Request: [#4553](https://github.com/pagefaultgames/pokerogue/pull/4553)
- Author: flx-sta
- Merged: 2024-10-09

## Related Decisions
- No directly related ADRs identified

## Notes
This architectural decision was extracted from the project's pull request history and represents a significant change to the system's architecture or design.
