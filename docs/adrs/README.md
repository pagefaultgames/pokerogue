# Architecture Decision Records (ADRs)

## Overview

This directory contains Architecture Decision Records (ADRs) documenting significant architectural and design decisions made throughout the PokeRogue project's development. These records capture the context, rationale, and consequences of decisions to help current and future developers understand the evolution of the codebase.

## What is an ADR?

An Architecture Decision Record captures a significant architectural decision made along with its context and consequences. ADRs help:
- Document the "why" behind technical decisions
- Provide historical context for future changes
- Onboard new team members more effectively
- Prevent repeating past mistakes

## Statistics

- **Last Update**: 2025-08-09
- **Total ADRs**: 69
- **Categories**: 8

### Distribution by Category

| Category | Count | Avg Quality | Description |
|----------|-------|-------------|-------------|
| API Design | 2 | 3.0/5 | API endpoints and communication patterns |
| Architecture | 10 | 3.5/5 | Core architectural decisions and patterns |
| Battle System | 15 | 3.5/5 | Battle mechanics and move implementations |
| Data & Persistence | 2 | 3.5/5 | Data storage and save/load mechanisms |
| Performance | 2 | 3.5/5 | Performance optimizations and improvements |
| Refactoring | 15 | 4.1/5 | Code structure and organization improvements |
| Testing | 14 | 3.6/5 | Testing infrastructure and patterns |
| User Interface | 8 | 3.5/5 | UI/UX improvements and features |

## Table of Contents

### API Design
- [API-001](api_design/API-001-bug-fix-rapid-strike-urshifu-not-appearing-in-wi.md): Fix Rapid Strike Urshifu not appearing in wild and on trainers (PR #5216)
- [API-002](api_design/API-002-dev-remove-logging-for-api-requests.md): Remove logging for API requests (PR #4804)

### Architecture
- [arch-001](architecture/arch-001-refactor-merged-interfaces-into-types-remo.md): Establish Type-First Architecture with Centralized @types Directory (PR #5951) ⭐
- [ARCH-002](architecture/ARCH-002-mystery-implements-5487-sky-battle-mystery-en.md): Implements Sky Battle Mystery Encounter (PR #5940)
- [arch-003](architecture/arch-003-refactor-moved-various-classes-interfaces-to-own.md): Moved various classes/interfaces to own files (PR #5870)
- [arch-004](architecture/arch-004-refactor-move-many-interfaces-and-enums-to-their.md): Move many interfaces and enums to their own file (PR #5646)
- [arch-005](architecture/arch-005-refactor-remove-promises-from-moves-and-abilitie.md): Remove Promises from moves and abilities (PR #5283)
- [ARCH-006](architecture/ARCH-006-refactor-move-add-options-param-interface-for.md): Add options param interface for MoveEffectAttr (PR #4710)
- [ARCH-007](architecture/ARCH-007-qol-tests-add-mystery-encounter-type-for-cre.md): Add Mystery Encounter type for create-test script (PR #4350)
- [ARCH-008](architecture/ARCH-008-feature-adds-special-item-rewards-to-fixed-class.md): Adds special item rewards to fixed classic/challenge battles (PR #4332)
- [ARCH-009](architecture/ARCH-009-enhancement-implement-tera-based-form-changes.md): Implement Tera-based form changes (PR #4147)
- [ARCH-010](architecture/ARCH-010-qol-test-dialogue-menu-option.md): Test dialogue menu option (PR #3725)

### Battle System
- [BTL-001](battle_system/BTL-001-ability-implement-teraform-zero-ability.md): Implement Teraform Zero ability (PR #5359)
- [BTL-002](battle_system/BTL-002-ability-flower-veil-implementation.md): Flower Veil implementation (PR #5327)
- [BTL-003](battle_system/BTL-003-ability-move-implement-magic-bounce-and-magic.md): Implement Magic Bounce and Magic Coat (PR #5225)
- [BTL-004](battle_system/BTL-004-ability-fully-implement-flower-gift-and-victory.md): Fully implement Flower Gift and Victory Star (PR #5222)
- [BTL-005](battle_system/BTL-005-ability-fully-implement-shields-down.md): Fully implement Shields Down (PR #5205)
- [BTL-006](battle_system/BTL-006-move-improve-implementation-of-rage-fist-damage.md): Improve implementation of Rage Fist damage increase (PR #5129)
- [BTL-007](battle_system/BTL-007-move-implement-quash.md): Implement Quash (PR #5049)
- [BTL-008](battle_system/BTL-008-move-implement-lunar-dance.md): Implement Lunar Dance (PR #4926)
- [BTL-009](battle_system/BTL-009-move-spectral-thief-full-implementation.md): Spectral Thief Full Implementation (PR #4891)
- [BTL-010](battle_system/BTL-010-ability-fully-implement-sheer-force.md): Fully implement Sheer Force (PR #4890)
- [BTL-011](battle_system/BTL-011-move-implement-true-force-switch-roar-whirlwin.md): Implement True Force Switch moves (PR #4881)
- [BTL-012](battle_system/BTL-012-move-remove-edgecase-from-fully-implemented.md): Remove .edgeCase() from fully implemented moves (PR #4876)
- [BTL-013](battle_system/BTL-013-move-beta-freeze-dry-re-implementation.md): Freeze-dry Re-implementation (PR #4874)
- [BTL-014](battle_system/BTL-014-move-partially-implement-instruct.md): Partially Implement Instruct (PR #4857)
- [BTL-015](battle_system/BTL-015-move-fully-implement-freeze-dry.md): Fully implement Freeze Dry (PR #4840)

### Data & Persistence
- [DAT-001](data_and_persistence/DAT-001-qol-load-i18n-en-locales-during-tests.md): Load i18n en locales during tests (PR #4553)
- [DAT-002](data_and_persistence/DAT-002-dev-qol-add-test-save-with-all-egg-moves-unloc.md): Add test save with all egg moves unlocked (PR #4137)

### Performance
- [PER-001](performance/PER-001-bug-performance-plug-memory-leak-related-to-ene.md): Plug memory leak related to enemy pokemon lingering (PR #6083) ⭐
- [PER-002](performance/PER-002-bug-use-silent-mode-during-tests-unless-debuggi.md): Use silent mode during tests + workflow optimization (PR #4154)

### Refactoring
- [REF-001](refactoring/REF-001-refactor-mark-nickname-in-pokemon-as-optional.md): Mark nickname in pokemon as optional (PR #6168)
- [REF-002](refactoring/REF-002-refactor-prevent-serialization-of-entire-species.md): Prevent serialization of entire species form (PR #6145)
- [REF-003](refactoring/REF-003-refactor-bug-illusion-no-longer-overwrites-data.md): Illusion no longer overwrites data of original Pokemon (PR #6140)
- [REF-004](refactoring/REF-004-refactor-minor-refactor-of-battler-tags.md): Minor refactor of battler tags (PR #6129)
- [REF-005](refactoring/REF-005-refactor-minor-cleanup-of-initexpkeys.md): Minor cleanup of initExpKeys (PR #6127)
- [REF-006](refactoring/REF-006-refactor-added-phasemanager-totitlescreen.md): Added PhaseManager.toTitleScreen (PR #6114)
- [REF-007](refactoring/REF-007-bug-refactor-fix-loading-arena-tags.md): Fix loading arena tags (PR #6110)
- [REF-008](refactoring/REF-008-bug-ui-ux-refactor-fix-empty-movesets-related.md): Fix empty movesets related to starter forms (PR #6080)
- [REF-009](refactoring/REF-009-refactor-replace-fill-map-loops-with-real.md): Replace .fill().map loops with real for loops (PR #6071)
- [REF-010](refactoring/REF-010-refactor-minor-run-phase-rework.md): Minor run phase rework (PR #6017)
- [REF-011](refactoring/REF-011-refactor-ability-ab-attr-apply-type-safety.md): Ability attribute apply type safety (PR #6002)
- [ref-012](refactoring/ref-012-refactor-remove-circular-dependencies-part-4.md): Remove circular dependencies part 4 (PR #5964)
- [ref-013](refactoring/ref-013-refactor-remove-circular-deps-3.md): Remove circular dependencies part 3 (PR #5959)
- [REF-014](refactoring/REF-014-refactor-ensure-that-new-phases-are-created-thro.md): Ensure new phases are created through phase manager (PR #5955)
- [ref-015](refactoring/ref-015-refactor-decouple-phase-system-from-battle-scene.md): Decouple phase system from battle-scene (PR #5953)

### Testing
- [TST-001](testing/TST-001-test-improved-tests-for-arena-trap.md): Improved tests for arena trap (PR #6209)
- [TST-002](testing/TST-002-test-game-move-use-overrides-summon-data-moves.md): game.move.use overrides summon data moveset (PR #6174)
- [TST-003](testing/TST-003-test-ported-over-augmented-remaining-test-matc.md): Ported over augmented test matchers from pkty (PR #6159) ⭐
- [TST-004](testing/TST-004-test-add-support-for-custom-boilerplates-to-cre.md): Add support for custom boilerplates to create-test (PR #6158)
- [TST-005](testing/TST-005-test-added-custom-equality-matchers.md): Added custom equality matchers (PR #6157)
- [TST-006](testing/TST-006-test-removed-unnecessary-calls-to-phaseintercep.md): Removed unnecessary calls to PhaseInterceptor (PR #6108)
- [TST-007](testing/TST-007-test-address-flaky-tests-in-copycat-first-at.md): Address flaky tests in copycat and first-attack (PR #6093)
- [TST-008](testing/TST-008-test-movehelper-changemoveset-disables-moveset.md): MoveHelper.changeMoveset disables moveset overrides (PR #5915)
- [TST-009](testing/TST-009-test-remove-deprecated-test-funcs.md): Remove deprecated test functions (PR #5906)
- [TST-010](testing/TST-010-test-fix-mock-text-to-make-it-compatible-with-me.md): Fix mock text for method chaining compatibility (PR #5884)
- [TST-011](testing/TST-011-test-added-tests-for-intimidate-fishious-rend-b.md): Added tests for Intimidate and various moves (PR #5858)
- [TST-012](testing/TST-012-test-update-test-utils.md): Update test utils (PR #5848)
- [TST-013](testing/TST-013-test-fix-sprite-test-due-to-unused-files.md): Fix sprite test due to unused files (PR #5783)
- [TST-014](testing/TST-014-test-reworked-crit-override-to-allow-for-forced.md): Reworked crit override for forced crits (PR #5738)

### User Interface
- [UI-001](user_interface/UI-001-ui-ux-optimized-pok-mon-pngs.md): Optimized Pokémon PNGs (PR #6130)
- [UI-002](user_interface/UI-002-ui-ux-optimized-images.md): Optimized images (PR #6125)
- [UI-003](user_interface/UI-003-ui-ux-localization-optimized-type-status-icons.md): Optimized type/status icons + new translations (PR #6120)
- [UI-004](user_interface/UI-004-ui-ux-implement-discard-button.md): Implement Discard Button (PR #5985)
- [UI-005](user_interface/UI-005-tests-ui-ux-add-automated-tests-for-the-pokedex.md): Add automated tests for the pokedex (PR #5637)
- [UI-006](user_interface/UI-006-bug-ui-ux-starter-select-screen-now-looks-for-a.md): Starter select screen form-specific abilities (PR #5454)
- [UI-007](user_interface/UI-007-ui-enhancement-implement-keybind-migrator.md): Implement keybind migrator (PR #5431)
- [UI-008](user_interface/UI-008-ui-qol-enhancement-exclude-redundant-species.md): Exclude redundant species from filters (PR #3910)

## Key Architectural Patterns

Based on the ADRs, several important patterns and principles emerge:

### 1. Type-First Architecture
- Centralized type definitions in `@types/` directory
- Strict separation between compile-time types and runtime code
- Enforced through tooling (dependency cruiser)

### 2. Testing Infrastructure
- Comprehensive unit testing with Vitest
- Custom test matchers for domain-specific assertions
- Test-driven development for critical features
- Automated test generation tools

### 3. Performance Focus
- Memory leak prevention and cleanup
- Bundle size optimization
- Image and asset optimization
- Efficient data structures (avoiding .fill().map patterns)

### 4. Code Organization
- Modular component structure
- Clear separation between battle mechanics, UI, and data layers
- Systematic refactoring to eliminate circular dependencies
- Phase system decoupling from battle scene

### 5. Battle System Architecture
- Ability and move implementations follow consistent patterns
- Comprehensive testing for battle mechanics
- Gradual migration from partial to full implementations

## How to Use These ADRs

### For New Contributors
1. Review ADRs in your area of interest to understand past decisions
2. Pay special attention to starred (⭐) ADRs which represent foundational decisions
3. Check the "Related Decisions" section to understand dependencies

### For Making Architectural Changes
1. Check existing ADRs to avoid contradicting established patterns
2. Create a new ADR following the template below
3. Link to related ADRs in the "Related Decisions" section
4. Update this README after your ADR is merged

### For Code Reviews
1. Reference relevant ADRs when reviewing architectural changes
2. Ensure new code follows patterns established in ADRs
3. Suggest creating new ADRs for significant decisions

## ADR Template

```markdown
# [PREFIX-NNN]: [Title]

## Status
[Proposed | Accepted | Implemented | Deprecated | Superseded by ADR-XXX]

## Context
[Describe the issue that motivated this decision, including technical and business context]

## Decision
[Describe the decision and rationale]

### Technical Implementation
[Detailed technical approach]

### Alternatives Considered
[Other options that were evaluated]

## Consequences

### Positive
- [Positive outcomes]

### Negative  
- [Negative outcomes or trade-offs]

## Implementation Details

### Testing Approach
[How to test this decision]

### Metrics
[How to measure success]

## References
- Pull Request: [#XXXX](link)
- Related Issues: [#XXXX](link)
- Documentation: [links]

## Related Decisions
- [Links to related ADRs]
```

## Quality Standards

ADRs should meet these minimum quality criteria:
- Context section: At least 100 characters explaining the "why"
- Technical Implementation: At least 200 characters of technical detail
- Testing Approach: Clear instructions for verification
- No placeholder text or generic content
- Accurate references to PRs and issues

## Maintenance

This ADR collection is maintained through:
1. Regular quality reviews (removing low-quality entries)
2. Cross-reference updates when new ADRs are added
3. Periodic reorganization as patterns emerge
4. Archival of superseded decisions

## Contributing

When creating a new ADR:
1. Use the next sequential number in your category
2. Follow the template structure
3. Link to related ADRs and PRs
4. Update this README's table of contents
5. Ensure your ADR meets quality standards

For questions or suggestions about the ADR process, please open an issue in the main repository.