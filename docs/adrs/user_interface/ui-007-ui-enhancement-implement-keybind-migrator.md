# ui-007: [UI][Enhancement] Implement keybind migrator

## Status
Implemented - Merged on 2025-02-27

## Context
The keybind was changed since cycle variant was no longer in use and we wanted to reuse the key.

## Decision
### Technical Implementation
We want a better way to handle this in the future, but it intercepts setting custom keybinds and replaces given binds.

**Category**: User Interface

## Consequences

### Positive
- **User Impact**: Whatever key was bound to cycle variant is now bound to cycle tera
- New capabilities added to the system
- Extended functionality

### Negative
- None significant

## Implementation Details
### Testing Approach
The only way to test this if you've got a bad keybind is to manually edit your localStorage in the dev tools in order to have a bad keybind by copying it over from main.

**Labels**: Enhancement, UI/UX

## References
- Pull Request: [#5431](https://github.com/pagefaultgames/pokerogue/pull/5431)
- Author: Xavion3
- Merged: 2025-02-27

## Related Decisions
- No directly related ADRs identified

## Notes
This architectural decision was extracted from the project's pull request history and represents a significant change to the system's architecture or design.
