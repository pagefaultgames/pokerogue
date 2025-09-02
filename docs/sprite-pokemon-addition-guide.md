# PokéRogue Sprite & Pokémon Addition Guide

This guide provides comprehensive instructions for adding new sprites and Pokémon to the PokéRogue game. It covers the complete process from preparing sprite assets to configuring game data.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Sprite Asset Structure](#sprite-asset-structure)
4. [Step 1: Prepare Sprite Assets](#step-1-prepare-sprite-assets)
5. [Step 2: Add Pokémon Data Definition](#step-2-add-pokémon-data-definition)
6. [Step 3: Configure Sprite Loading](#step-3-configure-sprite-loading)
7. [Step 4: Add Evolution Data (if applicable)](#step-4-add-evolution-data-if-applicable)
8. [Step 5: Add Move Learning Data](#step-5-add-move-learning-data)
9. [Step 6: Configure Additional Features](#step-6-configure-additional-features)
10. [Testing and Validation](#testing-and-validation)
11. [Advanced Topics](#advanced-topics)
12. [Troubleshooting](#troubleshooting)

## Overview

PokéRogue uses a sophisticated sprite and data management system that includes:

- **Sprite Atlases**: Pokémon sprites are packed into atlases with corresponding JSON metadata
- **Species Data**: Core Pokémon statistics, types, and abilities
- **Form Management**: Support for different forms, variants, and regional variations
- **Evolution System**: Evolution chains and conditions
- **Move Learning**: Level-up moves and TM/TR compatibility
- **Variant System**: Shiny and special color variants

## Prerequisites

- Basic understanding of TypeScript/JavaScript
- Image editing software for sprite preparation
- JSON editing capabilities
- Understanding of the Pokémon data structure

## Sprite Asset Structure

The game organizes sprites in the following structure:

```
public/images/pokemon/
├── [species_id].png          # Front sprite
├── [species_id].json         # Atlas metadata
├── back/
│   ├── [species_id].png      # Back sprite
│   └── [species_id].json     # Back atlas metadata
├── female/
│   ├── [species_id].png      # Female variant (if different)
│   └── [species_id].json     # Female atlas metadata
├── shiny/
│   ├── [species_id].png      # Shiny front sprite
│   └── [species_id].json     # Shiny atlas metadata
├── variant/
│   ├── [species_id].json     # Variant color data
│   └── [species_id]_[n].json # Additional variant colors
└── exp/                      # Experimental sprites (optional)
```

### Icon Sprites

Pokémon icons are stored in packed atlases:
```
public/images/
├── pokemon_icons_0.png       # Icon atlas 0 (Gen 1)
├── pokemon_icons_0.json      # Atlas 0 metadata
├── pokemon_icons_1.png       # Icon atlas 1 (Gen 2)
├── pokemon_icons_1.json      # Atlas 1 metadata
└── ...                       # More icon atlases
```

## Step 1: Prepare Sprite Assets

### 1.1 Sprite Requirements

- **Format**: PNG with transparency
- **Size**: No strict requirements, but should be consistent with existing sprites
- **Quality**: High-resolution sprites preferred
- **Naming**: Follow the pattern `[species_id].png` where species_id matches the enum value

### 1.2 Required Sprite Variations

For each Pokémon, you typically need:

1. **Front sprite** (`[id].png`) - Main battle sprite facing right
2. **Back sprite** (`back/[id].png`) - Player's Pokémon sprite facing left  
3. **Shiny variants** (`shiny/[id].png`, `shiny/back/[id].png`)
4. **Icon** - Small icon for menus and party display

### 1.3 Optional Sprite Variations

- **Female variants** (`female/[id].png`) - If the species has gender differences
- **Form variations** (`[id]-[form_name].png`) - For different forms
- **Experimental sprites** (`exp/[id].png`) - Alternative sprite versions

### 1.4 Create Atlas Files

Each sprite needs a corresponding JSON file with atlas metadata. Example structure:

```json
{
  "textures": [{
    "image": "[id].png",
    "format": "RGBA8888",
    "size": {"w": 181, "h": 181},
    "scale": 1,
    "frames": [{
      "filename": "0001.png",
      "rotated": false,
      "trimmed": true,
      "sourceSize": {"w": 37, "h": 38},
      "spriteSourceSize": {"x": 0, "y": 4, "w": 36, "h": 34},
      "frame": {"x": 0, "y": 109, "w": 36, "h": 34}
    }]
  }],
  "meta": {
    "app": "https://www.codeandweb.com/texturepacker",
    "version": "3.0"
  }
}
```

## Step 2: Add Pokémon Data Definition

### 2.1 Add Species ID

First, add the new Pokémon to the `SpeciesId` enum in `src/enums/species-id.ts`:

```typescript
export enum SpeciesId {
  // ... existing entries
  NEW_POKEMON = [next_available_id],
  // ...
}
```

### 2.2 Define Species Data

Add the Pokémon definition in `src/data/pokemon-species.ts`:

```typescript
export const pokemonSpecies: PokemonSpecies[] = [
  // ... existing entries
  new PokemonSpecies(
    Species.NEW_POKEMON,
    "New Pokemon",
    [generation_number],
    false, // legendary
    false, // mythical  
    false, // can change form
    PokemonType.NORMAL, // type1
    null, // type2 (or second type)
    [height_in_decimeters],
    [weight_in_hectograms], 
    Ability.ABILITY_NAME, // ability1
    Ability.ABILITY_NAME, // ability2
    Ability.ABILITY_NAME, // hidden ability
    [base_hp, base_atk, base_def, base_spatk, base_spdef, base_speed], // base stats
    [catch_rate], // catch rate (higher = easier to catch)
    [base_friendship], // base friendship
    [base_exp_yield], // experience yield
    GrowthRate.MEDIUM_FAST, // growth rate
    [egg_group_1, egg_group_2], // egg groups
    [male_percent], // gender ratio (50 for 50/50, -1 for genderless)
    [hatch_cycles], // egg cycles to hatch
    false, // can have gender differences
    false // is starter selectable
  ),
];
```

### 2.3 Configure Balance Data

Add entries to the balance files in `src/data/balance/`:

**pokemon-species.ts**: Override base species data if needed
```typescript
export const pokemonSpeciesChanges: PokemonSpeciesChanges = {
  [Species.NEW_POKEMON]: {
    baseStats: [hp, atk, def, spatk, spdef, speed],
    // ... other overrides
  }
};
```

## Step 3: Configure Sprite Loading

### 3.1 Update Species Form Data

If your Pokémon has multiple forms, add form data in `src/data/pokemon-forms.ts`:

```typescript
export const pokemonFormChanges: PokemonFormChanges = {
  [Species.NEW_POKEMON]: [
    new SpeciesFormChange(
      Species.NEW_POKEMON, 
      "", // base form key
      "form-name", // target form key
      new SpeciesFormChangeItemTrigger(FormChangeItem.ITEM_NAME)
    )
  ]
};
```

### 3.2 Add to Experimental Sprites (Optional)

If you want to use experimental sprites, add the sprite key to `public/exp-sprites.json`:

```json
[
  "existing-entries",
  "[species_id]",
  "[species_id]-form-name"
]
```

### 3.3 Configure Variant Data

For shiny and special variants, create variant JSON files in `public/images/pokemon/variant/`:

**Basic variant** (`[id].json`):
```json
{
  "1": [[255, 0, 0], [0, 255, 0]], // variant 1 color replacements
  "2": [[0, 0, 255], [255, 255, 0]], // variant 2 color replacements  
  "3": [[255, 0, 255], [0, 255, 255]] // variant 3 color replacements
}
```

## Step 4: Add Evolution Data (if applicable)

### 4.1 Configure Evolution Chain

Add evolution data in `src/data/balance/pokemon-evolutions.ts`:

```typescript
export const pokemonEvolutions: PokemonEvolutions = {
  [Species.BASE_POKEMON]: [
    new EvolutionLevel(Species.EVOLVED_POKEMON, 16) // evolves at level 16
  ],
  [Species.EVOLVED_POKEMON]: [
    new EvolutionItem(Species.FINAL_POKEMON, EvolutionItem.ITEM_NAME)
  ]
};
```

### 4.2 Evolution Types Available

- `EvolutionLevel`: Level-based evolution
- `EvolutionItem`: Item-based evolution  
- `EvolutionHeld`: Trade while holding item
- `EvolutionTrade`: Trade evolution
- `EvolutionFriendship`: Friendship-based
- `EvolutionTimeOfDay`: Time-based evolution
- `EvolutionMove`: Learning specific move
- `EvolutionOther`: Custom conditions

## Step 5: Add Move Learning Data

### 5.1 Level-up Moves

Add to `src/data/balance/pokemon-level-moves.ts`:

```typescript
export const pokemonSpeciesLevelMoves: PokemonSpeciesLevelMoves = {
  [Species.NEW_POKEMON]: [
    [1, Moves.TACKLE],
    [5, Moves.GROWL], 
    [10, Moves.QUICK_ATTACK],
    [15, Moves.BITE],
    // ... more moves
  ]
};
```

### 5.2 TM/TR Compatibility 

Configure TM moves in `src/data/balance/tms.ts`:

```typescript
export const tmSpecies: TmSpecies = {
  [Moves.HIDDEN_POWER]: [
    // ... existing species
    Species.NEW_POKEMON
  ],
  // ... other TMs
};
```

### 5.3 Egg Moves

Add egg moves in `src/data/balance/egg-moves.ts`:

```typescript
export const speciesEggMoves: SpeciesEggMoves = {
  [Species.NEW_POKEMON]: [
    Moves.EGG_MOVE_1,
    Moves.EGG_MOVE_2,
    // ... more egg moves
  ]
};
```

## Step 6: Configure Additional Features

### 6.1 Starter Configuration

If the Pokémon should be selectable as a starter, add to `src/data/balance/starters.ts`:

```typescript
export const speciesStarterCosts: SpeciesStarterCosts = {
  [Species.NEW_POKEMON]: [cost_in_points]
};
```

### 6.2 Biome Encounters

Configure where the Pokémon appears in `src/data/balance/biomes.ts`:

```typescript
export const biomePokemonPools: BiomePokemonPools = {
  [Biome.BIOME_NAME]: {
    [TimeOfDay.DAY]: {
      [PoolTier.COMMON]: [Species.NEW_POKEMON],
      // ... other tiers
    }
  }
};
```

### 6.3 Passive Abilities (Optional)

For special passive abilities, configure in `src/data/balance/passives.ts`:

```typescript
export const starterPassiveAbilities: StarterPassiveAbilities = {
  [Species.NEW_POKEMON]: Ability.PASSIVE_ABILITY
};
```

## Testing and Validation

### 7.1 Run the Game

1. Start the development server: `npm run start`
2. Create a new game and verify:
   - Sprites load correctly
   - Pokémon data displays properly
   - Evolution works (if applicable)
   - Moves can be learned
   - No console errors

### 7.2 Test Sprite Variants

- Check shiny variants appear correctly
- Verify form changes work
- Test back sprites in battle
- Confirm icons display in party/PC

### 7.3 Validate Configuration

Run validation scripts if available:
- `./scripts/find_sprite_variant_mismatches.py` - Check variant consistency
- Test evolution chains work correctly
- Verify move learning at correct levels

## Advanced Topics

### 8.1 Form Changes

Complex form changes with multiple triggers:

```typescript
new SpeciesFormChange(
  Species.POKEMON,
  "base-form", 
  "alternate-form",
  new SpeciesFormChangeCompoundTrigger(
    new SpeciesFormChangeItemTrigger(FormChangeItem.ITEM),
    new SpeciesFormChangeTimeOfDayTrigger(TimeOfDay.NIGHT)
  )
)
```

### 8.2 Regional Variants

For regional forms, use the form system with specific naming:

```typescript
// Alolan form
new PokemonForm(
  "Alolan", // form name
  "alolan", // form key
  Type.ICE, // type1 override
  Type.FAIRY, // type2 override 
  // ... other form-specific data
)
```

### 8.3 Gigantamax/Mega Evolution

Special form changes for temporary transformations:

```typescript
new SpeciesFormChange(
  Species.POKEMON,
  "",
  "gigantamax", 
  new SpeciesFormChangeManualTrigger(),
  true // quiet (no animation/message)
)
```

### 8.4 Custom Sprite Loading

For special sprite handling, modify loading in `src/sprites/pokemon-sprite.ts`:

```typescript
export function getSpriteId(pokemon: Pokemon, ignoreOverride?: boolean): string {
  // Custom logic for special sprite handling
  if (pokemon.species.speciesId === Species.SPECIAL_POKEMON) {
    return `special_sprite_key`;
  }
  
  // Default behavior
  return pokemon.getSpeciesForm(ignoreOverride).getSpriteId(/*...*/);
}
```

## Troubleshooting

### Common Issues

**Sprites not loading:**
- Verify file paths match the species ID exactly
- Check JSON atlas files have correct structure
- Ensure PNG files are valid and not corrupted

**Data not displaying:**
- Confirm species ID is unique and added to enum
- Verify all required fields in species definition
- Check for TypeScript compilation errors

**Evolution not working:**
- Ensure evolution target species exists
- Verify evolution conditions are met
- Check evolution data syntax

**Variant colors not applying:**
- Confirm variant JSON files exist and have correct format
- Verify color mapping arrays are valid
- Check variant data is properly loaded

### Debugging Tips

1. **Console Errors**: Check browser developer tools for JavaScript errors
2. **Network Tab**: Verify sprite files are being loaded successfully  
3. **Species Data**: Use game debug tools to inspect Pokémon data
4. **File Paths**: Double-check all file paths and naming conventions

### Performance Considerations

- **Sprite Size**: Large sprites can impact performance, optimize when possible
- **Atlas Packing**: Consider packing multiple small sprites into atlases
- **Lazy Loading**: Sprites load on-demand, no need to preload everything
- **Variant Data**: Minimize variant JSON file sizes for faster loading

---

This guide covers the essential steps for adding sprites and Pokémon to PokéRogue. The modular system allows for flexible additions while maintaining consistency with existing content. Remember to test thoroughly and follow the established patterns for best results.