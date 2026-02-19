# arch-006: Introduce Options Parameter Pattern for Move Effect Attributes

## Status
Implemented - Merged on 2024-11-02

## Context

The `MoveEffectAttr` constructor had accumulated 5+ optional parameters passed as individual arguments, creating several maintainability issues:

```typescript
// Problematic constructor with many optional params
constructor(
  selfTarget?: boolean,
  trigger?: MoveEffectTrigger,
  firstHitOnly?: boolean,
  lastHitOnly?: boolean,
  firstTargetOnly?: boolean
) { /* ... */ }

// Usage became unreadable
new SomeEffectAttr(false, MoveEffectTrigger.PRE_APPLY, true, false, false);
```

### Problems:
1. **Poor Readability**: Boolean parameters provide no context
2. **Parameter Ordering**: Easy to mix up parameter positions
3. **Extensibility**: Adding new options required changing all callsites
4. **Maintainability**: No clear relationship between related options

## Decision

Replace the multiple optional parameters with a single options object parameter using a defined interface.

### Technical Implementation:

```typescript
// New interface-based approach
interface MoveEffectAttrOptions {
  selfTarget?: boolean;
  trigger?: MoveEffectTrigger;
  firstHitOnly?: boolean;
  lastHitOnly?: boolean;
  firstTargetOnly?: boolean;
}

// Clean constructor
constructor(options: MoveEffectAttrOptions = {}) {
  this.selfTarget = options.selfTarget ?? false;
  this.trigger = options.trigger ?? MoveEffectTrigger.POST_APPLY;
  // ... etc
}

// Readable usage
new SomeEffectAttr({
  firstHitOnly: true,
  trigger: MoveEffectTrigger.PRE_APPLY
});
```

### Benefits:
1. **Named Parameters**: Clear what each option does
2. **Partial Application**: Only specify needed options
3. **Extensible**: New options don't break existing calls
4. **Type Safety**: Interface provides compile-time validation

### Alternatives Considered:

1. **Builder Pattern**
   - Pros: Very fluent, chainable
   - Cons: More complex, overkill for simple options
   - Rejected: Options object is simpler for this use case

2. **Keep Current Approach**
   - Pros: No refactoring needed
   - Cons: Continues to get worse as more options added
   - Rejected: Technical debt was already significant

## Consequences

### Positive:
- **Improved Readability**: Clear what each option does at call sites
- **Better Extensibility**: Can add options without breaking changes
- **Type Safety**: Compiler catches misspelled option names
- **Easier Maintenance**: Related options grouped logically

### Negative:
- **Migration Effort**: Required updating all existing usage
- **Slightly More Verbose**: Object literal vs direct parameters

### Trade-offs:
- **Explicitness over Brevity**: Chose readable code over concise calls
- **Structure over Flexibility**: Imposed interface constraint for consistency

## Implementation Details

### Migration Example:
```typescript
// Before
new EffectAttr(true, MoveEffectTrigger.POST_APPLY, false, true);

// After  
new EffectAttr({
  selfTarget: true,
  trigger: MoveEffectTrigger.POST_APPLY,
  lastHitOnly: true
});
```

**Labels**: Refactor, API-Design, Move-System

**Reviewed by**: NightKev

## References
- Pull Request: [#4795](https://github.com/pagefaultgames/pokerogue/pull/4795)
- Author: NightKev
- Merged: 2024-11-02

## Related Decisions
- Future: This pattern should be applied to other classes with many optional parameters

## Notes
This establishes a pattern for handling multiple optional parameters that should be applied consistently across the codebase. The options object pattern is a common JavaScript/TypeScript idiom that improves API design significantly.