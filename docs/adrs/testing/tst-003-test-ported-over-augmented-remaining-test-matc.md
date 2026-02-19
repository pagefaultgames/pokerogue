# tst-003: [Test] Ported over + augmented remaining test matchers from pkty

## Status
Implemented - Merged on 2025-08-02

## Context
`pkty` has a lot of good test matchers, so I saw it fit to port em over.

I also added another matcher, `toHaveUsedPP`, which searches for a move in a Pokemon's moveset having consumed the given amount of PP.

> [!IMPORTANT]
> **This is not a pure port**. I took the liberty of adding tweaks and improvements to the matchers where needed (such as supporting checking individual properties of a `TurnMove` or `Status`), resulting in the matchers not being _exactly_ identical to their poketernity cousins.
> I also (if I do say so myself) vastly improved the test logging behavior, showing abbreviated inline diffs of non-matching objects in the failure message.
<img width="1694" height="50" alt="image" src="https://github.com/user-attachments/assets/56595280-1687-46f1-8eb9-9f3a9d778e14" />
<img width="1061" height="33" alt="image" src="https://github.com/user-attachments/assets/e5fb6606-852a-4d2d-8ffa-975117886fe8" />

I removed the basic prototype name from inline diffs ("Object", "Array") and limited the display to a maximum of 30 characters to (hopefully) keep it within a 120 character terminal screen without overflow.
I'm welcome to tweaking the stringification options if the need arises, though most matchers checking numerical properties can get by with a simple reverse mapping or `getEnumStr` instead.

## Decision
### Technical Implementation
Added the matchers to the matchers directory.

Added utility functions to remove repetitive code for reverse mapping/case changing and prettify things a bit

> [!NOTE]
> `toHaveStat` was actively unused in their repo (given it is effectively _only_ used when testing Transform and niche effects that override `summonData.stats`), so I omitted it.
> If we need it later, i can copy over the file and work from there.

**Category**: Testing Infrastructure

## Consequences

### Positive
- **User Impact**: Normal folks: none
Devs: Much much easier test checking
- Increased test coverage and reliability
- Reduced regression risk

### Negative
- None significant

## Implementation Details
### Testing Approach
I picked `spite.test.ts` because it was a move we had no tests for and could show off the new matchers. :)

**Labels**: Tests

**Reviewed by**: DayKev, SirzBenjie, Wlowscha

## References
- Pull Request: [#6159](https://github.com/pagefaultgames/pokerogue/pull/6159)
- Author: Bertie690
- Merged: 2025-08-02

## Related Decisions
- No directly related ADRs identified

## Notes
This architectural decision was extracted from the project's pull request history and represents a significant change to the system's architecture or design.
