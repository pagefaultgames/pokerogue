# per-002: [Bug] Use silent mode during tests (unless debugging!) + test workflow optimization

## Status
Implemented - Merged on 2024-09-10

## Context
While changing tests to run parallel I removed the silent mode by accident

## Decision
### Technical Implementation
The tests will all run in silent mode now. Unless the github-runner was started in debug mode (which can help in the future).

Test are using the `shard` option to run in parallel. This cuts down tests max time to ca. 2min
https://vitest.dev/guide/cli.html#shard

**Category**: Performance Optimization

## Consequences

### Positive
- Increased test coverage and reliability
- Reduced regression risk

### Negative
- None significant

## Implementation Details
### Testing Approach
Look at the actions in this PR

**Labels**: Miscellaneous, Tests, Lead Dev Review

## References
- Pull Request: [#4154](https://github.com/pagefaultgames/pokerogue/pull/4154)
- Author: flx-sta
- Merged: 2024-09-10

## Related Decisions
- No directly related ADRs identified

## Notes
This architectural decision was extracted from the project's pull request history and represents a significant change to the system's architecture or design.
