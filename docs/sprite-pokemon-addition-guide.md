# PokéRogue Sprite & Pokémon Addition Guide

This guide provides comprehensive instructions for adding new sprites and Pokémon to the PokéRogue game. It covers the complete process from preparing sprite assets to configuring game data.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Sprite Psychology & Player Experience](#sprite-psychology--player-experience)
4. [Personality Matrix System](#personality-matrix-system)
5. [Sprite Asset Structure](#sprite-asset-structure)
6. [Artist Workflow Guide](#artist-workflow-guide)
7. [Step 1: Prepare Sprite Assets](#step-1-prepare-sprite-assets)
8. [Step 2: Add Pokémon Data Definition](#step-2-add-pokémon-data-definition)
9. [Step 3: Configure Sprite Loading](#step-3-configure-sprite-loading)
10. [Step 4: Add Evolution Data (if applicable)](#step-4-add-evolution-data-if-applicable)
11. [Step 5: Add Move Learning Data](#step-5-add-move-learning-data)
12. [Step 6: Configure Additional Features](#step-6-configure-additional-features)
13. [Testing and Validation](#testing-and-validation)
14. [Advanced Sprite Techniques](#advanced-sprite-techniques)
15. [Troubleshooting](#troubleshooting)

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
- **Game Design Awareness**: Understanding of player psychology and visual communication
- **Pokémon Personality Assessment**: Ability to analyze and categorize Pokémon behavioral traits

## Sprite Psychology & Player Experience

### The Psychology of Sprite Design

Sprites in PokéRogue serve as the **primary emotional connection** between players and their Pokémon. Every visual decision impacts player engagement, attachment, and gameplay experience. Understanding these psychological principles is essential for creating effective sprites.

#### **Core Psychological Principles**

##### **1. Recognition & Attachment Theory**
```yaml
Instant Recognition (0-0.5 seconds):
  Purpose: Players must immediately identify the Pokémon species
  Visual Cues: Distinctive silhouette, color scheme, key features
  Emotional Impact: Familiarity breeds attachment and trust
  
Personality Recognition (0.5-2 seconds):
  Purpose: Players understand the Pokémon's behavioral traits
  Visual Cues: Pose, facial expression, body language
  Emotional Impact: Creates expectation of how Pokémon will behave
  
Long-term Attachment (2+ minutes):
  Purpose: Sustained emotional connection during gameplay
  Visual Cues: Consistent personality expression, animation quality
  Emotional Impact: Investment in Pokémon's wellbeing and success
```

##### **2. Visual Communication Hierarchy**
```yaml
Primary Communication (Critical):
  - Species Identity: "What Pokémon is this?"
  - Health/Status: "Is my Pokémon okay?"
  - Battle Readiness: "Is it ready to fight?"
  
Secondary Communication (Important):
  - Personality Traits: "What is this Pokémon like?"
  - Emotional State: "How is it feeling?"
  - Type Advantages: "What are its strengths?"
  
Tertiary Communication (Enhancement):
  - Individual Charm: "What makes this one special?"
  - Environmental Response: "How does it react to context?"
  - Player Relationship: "Does it like/trust me?"
```

##### **3. Emotional Response Triggers**
```yaml
Positive Engagement:
  - Confident Posture: Upright stance, alert expression
  - Smooth Animation: Fluid, natural movement patterns
  - Expressive Features: Clear facial emotions, body language
  - Consistency: Reliable visual behavior matching expectations
  
Negative Reactions:
  - Awkward Proportions: Unnatural body ratios or positioning
  - Jerky Animation: Stuttering or uneven movement
  - Generic Expression: Lack of individual personality
  - Visual Confusion: Unclear species identity or status
```

#### **Player Experience Design Goals**

##### **Immediate Goals (First 10 seconds)**
- **Species Recognition**: Player immediately knows what Pokémon they're seeing
- **Status Clarity**: Health, condition, and battle readiness are obvious
- **Visual Appeal**: Sprite looks polished and professionally crafted
- **Personality Hint**: Initial impression of Pokémon's behavioral traits

##### **Short-term Goals (First 5 minutes)**
- **Emotional Connection**: Player begins to care about this specific Pokémon
- **Behavioral Expectations**: Player understands how this Pokémon "acts"
- **Visual Consistency**: Sprite behavior matches player's mental model
- **Engagement Maintenance**: Animation keeps player visually interested

##### **Long-term Goals (Extended gameplay)**
- **Deep Attachment**: Player forms strong emotional bond with Pokémon
- **Individual Recognition**: This specific sprite feels unique and special
- **Contextual Responsiveness**: Sprite reacts appropriately to game events
- **Sustained Interest**: Visual design maintains appeal over time

### Player Demographic Considerations

#### **Core Demographics & Visual Preferences**

##### **Pokémon Veterans (Ages 25-40)**
```yaml
Expectations:
  - High fidelity to original designs
  - Nostalgic color palettes and proportions
  - Subtle references to classic games
  - Professional polish matching modern standards
  
Visual Preferences:
  - Detailed sprite work with careful attention to original features
  - Animations that feel "authentic" to the Pokémon's established personality
  - Color variants that respect but enhance original schemes
```

##### **Newcomers (Ages 15-30)**
```yaml
Expectations:
  - Clear, readable designs that are immediately appealing
  - Modern visual standards (smooth animation, high contrast)
  - Intuitive visual communication of game mechanics
  - Engaging animations that maintain interest
  
Visual Preferences:
  - Bold, clear silhouettes that read well on various backgrounds
  - Expressive animations that convey personality quickly
  - Color schemes optimized for digital displays
```

##### **Competitive Players (All ages)**
```yaml
Expectations:
  - Immediate species/form recognition for strategic decisions
  - Clear status indicators (health, conditions, readiness)
  - Minimal visual distraction from gameplay information
  - Consistent performance across all game contexts
  
Visual Preferences:
  - High contrast, easily readable sprites
  - Standardized animation timing for predictable visual cues
  - Efficient file sizes for optimal performance
```

## Personality Matrix System

### Pokémon Personality Archetype Framework

The Personality Matrix is a systematic approach to ensuring every sprite accurately represents its Pokémon's behavioral and emotional characteristics. This system guides **all visual decisions** from pose design to animation timing to color choices.

#### **Primary Personality Archetypes**

##### **1. The Energetic (High Energy, Extroverted)**
*Examples: Pikachu, Torchic, Jolteon, Mankey*

```yaml
Visual Characteristics:
  Pose: Dynamic, active stance with slight forward lean
  Eyes: Wide, bright, alert with visible pupils
  Body Language: Perked ears, raised tail, ready-to-move position
  Facial Expression: Slight smile or determined look
  
Animation Style:
  Movement: Quick, bouncy, frequent motion
  Frame Rate: 10-12 FPS for snappy responsiveness
  Pattern: Short bursts of movement with brief pauses
  Secondary Animation: Ear twitching, tail swishing, sparking effects
  
Color Psychology:
  Saturation: High saturation for vibrant, energetic feel
  Contrast: Strong contrasts to match high-energy personality
  Highlights: Bright, sharp highlights on key features
  
Technical Specifications:
  Frame Count: 4-6 frames for varied, lively animation
  Loop Duration: 1.5-2.5 seconds for frequent visual interest
  Movement Range: 2-3 pixels vertical, 1 pixel horizontal
```

##### **2. The Calm (Low Energy, Stable)**
*Examples: Snorlax, Slowpoke, Musharna, Slakoth*

```yaml
Visual Characteristics:
  Pose: Relaxed, settled stance with weight distribution
  Eyes: Half-closed or peacefully alert, smaller pupils
  Body Language: Drooping ears, resting tail, comfortable position
  Facial Expression: Serene, content, or sleepy look
  
Animation Style:
  Movement: Slow, gentle, rhythmic breathing
  Frame Rate: 6-8 FPS for peaceful, unhurried feel
  Pattern: Long, smooth transitions between frames
  Secondary Animation: Slow belly rise/fall, occasional yawn
  
Color Psychology:
  Saturation: Medium to low saturation for soothing effect
  Contrast: Soft, gentle contrasts without harsh edges
  Highlights: Warm, diffused highlights for comfort
  
Technical Specifications:
  Frame Count: 2-3 frames for simple, meditative cycle
  Loop Duration: 3-5 seconds for unhurried rhythm
  Movement Range: 0.5-1 pixel vertical, minimal horizontal
```

##### **3. The Aggressive (High Intensity, Dominant)**
*Examples: Charizard, Gyarados, Houndoom, Garchomp*

```yaml
Visual Characteristics:
  Pose: Intimidating stance with chest out, head forward
  Eyes: Sharp, focused, with intense gaze direction
  Body Language: Tensed muscles, flared features, assertive positioning
  Facial Expression: Fierce determination or subtle snarl
  
Animation Style:
  Movement: Controlled, powerful, tension-building
  Frame Rate: 8-10 FPS for deliberate, strong presence
  Pattern: Building tension with sudden release moments
  Secondary Animation: Flame effects, muscle flexing, claw movement
  
Color Psychology:
  Saturation: High saturation with bold, striking colors
  Contrast: Sharp, dramatic contrasts for intimidation
  Highlights: Harsh, bright highlights on threatening features
  
Technical Specifications:
  Frame Count: 3-4 frames with dramatic pose variations
  Loop Duration: 2-3 seconds for sustained intimidation
  Movement Range: 1-2 pixels with sharp, decisive motion
```

##### **4. The Mysterious (Ethereal, Otherworldly)**
*Examples: Gengar, Alakazam, Cresselia, Lunala*

```yaml
Visual Characteristics:
  Pose: Floating or hovering with supernatural bearing
  Eyes: Deep, knowing, with otherworldly glow or depth
  Body Language: Graceful, ethereal positioning defying gravity
  Facial Expression: Enigmatic, wise, or hauntingly beautiful
  
Animation Style:
  Movement: Smooth, floating, sinusoidal swaying
  Frame Rate: 6-9 FPS for otherworldly, dream-like quality
  Pattern: Continuous, hypnotic motion with no hard stops
  Secondary Animation: Energy wisps, psychic aura, phase effects
  
Color Psychology:
  Saturation: Variable saturation with supernatural color shifts
  Contrast: Mysterious contrast patterns, shadow/light play
  Highlights: Supernatural glows, inner light effects
  
Technical Specifications:
  Frame Count: 4-6 frames with seamless transitions
  Loop Duration: 3-4 seconds for hypnotic, endless cycle
  Movement Range: 2-3 pixels in smooth, curved patterns
```

##### **5. The Playful (Curious, Mischievous)**
*Examples: Eevee, Growlithe, Pachirisu, Zorua*

```yaml
Visual Characteristics:
  Pose: Tilted head, one ear perked, inquisitive stance
  Eyes: Bright, curious, with expressive eyebrow positioning
  Body Language: Playful crouch, ready-to-pounce or explore
  Facial Expression: Mischievous smile or innocent curiosity
  
Animation Style:
  Movement: Irregular, curious, playful tilting
  Frame Rate: 8-10 FPS for lively, unpredictable timing
  Pattern: Varied timing with surprise elements
  Secondary Animation: Tail wagging, head tilting, playful gestures
  
Color Psychology:
  Saturation: Bright, cheerful saturation levels
  Contrast: Friendly contrasts that feel approachable
  Highlights: Warm, inviting highlights on facial features
  
Technical Specifications:
  Frame Count: 4-5 frames with varied pose expressions
  Loop Duration: 2-3 seconds with playful irregularity
  Movement Range: 1-2 pixels with tilting and shifting motion
```

##### **6. The Stoic (Disciplined, Reserved)**
*Examples: Lucario, Metagross, Steelix, Dialga*

```yaml
Visual Characteristics:
  Pose: Upright, dignified, perfectly balanced stance
  Eyes: Steady, focused, with controlled intensity
  Body Language: Disciplined posture, no wasted movement
  Facial Expression: Noble determination or serene focus
  
Animation Style:
  Movement: Minimal, purposeful, controlled breathing
  Frame Rate: 6-8 FPS for measured, deliberate presence
  Pattern: Steady, predictable rhythm with no excess
  Secondary Animation: Metallic gleams, energy focus, subtle power
  
Color Psychology:
  Saturation: Controlled saturation with metallic/noble tones
  Contrast: Clean, precise contrasts reflecting discipline
  Highlights: Sharp, precise highlights on key structural features
  
Technical Specifications:
  Frame Count: 2-3 frames with minimal but impactful change
  Loop Duration: 3-4 seconds for steady, unwavering presence
  Movement Range: 0.5-1 pixel with precise, controlled motion
```

#### **Personality Assessment Workflow**

##### **Step 1: Primary Archetype Identification**
```yaml
Process:
  1. Research official Pokémon descriptions and Pokédex entries
  2. Analyze canonical behavior in games, anime, and media
  3. Consider type associations and move sets for personality clues
  4. Identify the dominant personality archetype (70%+ match)
  
Documentation:
  - Primary Archetype: [Chosen archetype with confidence %]
  - Supporting Evidence: [Specific canonical examples]
  - Key Traits: [3-5 most important personality characteristics]
```

##### **Step 2: Secondary Trait Integration**
```yaml
Process:
  1. Identify 1-2 secondary personality elements
  2. Determine how secondary traits modify primary archetype
  3. Plan integration without contradicting core personality
  4. Create unique personality blend for this specific Pokémon
  
Example - Pikachu:
  - Primary: Energetic (80%)
  - Secondary: Playful (15%) + Loyal (5%)
  - Integration: High energy with playful curiosity and protective instincts
```

##### **Step 3: Visual Translation Framework**
```yaml
Pose Design:
  - Base pose reflects primary archetype principles
  - Subtle modifications incorporate secondary traits
  - Unique species features emphasized appropriately
  - Cultural/regional context considered for variants
  
Animation Planning:
  - Primary archetype determines base timing and movement style
  - Secondary traits add personality flourishes and variations
  - Species-specific features get appropriate animation attention
  - Technical constraints balanced with personality expression
  
Color Strategy:
  - Primary archetype guides saturation and contrast levels
  - Secondary traits influence highlight and shadow choices
  - Species authenticity maintained while enhancing personality
  - Variant colors respect both original design and personality
```

## Sprite Asset Structure

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

## Artist Workflow Guide

### Pre-Production Requirements

#### **Essential Mindset & Research**
- **Player Psychology Awareness**: Understand that sprites create emotional connections, not just visual representation
- **Personality Research Phase**: Complete Personality Matrix assessment before any visual work begins
- **Player Demographics Consideration**: Research target audience expectations and preferences
- **Canonical Behavior Study**: Analyze official Pokémon media for authentic personality cues

#### **Software & Tools**
- **Pixel Art Software**: Aseprite (recommended), Photoshop, GIMP, or similar with pixel-perfect editing
- **TexturePacker**: Required for atlas generation (free version sufficient)
- **Color Tools**: Hex color picker for precise color variant creation
- **Reference Materials**: Official Pokémon artwork, existing game sprites for style consistency
- **Psychology References**: Personality archetype documentation, player engagement studies

#### **Technical Setup Checklist**
- [ ] Set up 37×38 pixel canvas with transparent background
- [ ] Configure pixel-perfect drawing (no anti-aliasing)
- [ ] Set up color palette with limited colors (8-16 max)
- [ ] Prepare reference grid for animation frames
- [ ] Test export settings for PNG with transparency
- [ ] **Complete Personality Matrix assessment for target Pokémon**
- [ ] **Document primary and secondary personality archetypes**
- [ ] **Plan pose, animation, and color strategies based on personality**

### Player-Centric Quality Standards

#### **Player Experience Requirements (Priority 1)**
- **Instant Recognition**: Players must identify the Pokémon species within 0.5 seconds
- **Personality Clarity**: Pokémon's behavioral traits must be evident from static pose alone
- **Emotional Appeal**: Sprite must generate positive emotional response and attachment
- **Visual Communication**: All gameplay-relevant information communicated through visual design
- **Demographic Appropriateness**: Sprite appeals to target player age groups and experience levels

#### **Technical Quality Requirements (Priority 2)**
- **Pixel Precision**: All edges must be pixel-aligned, no sub-pixel positioning
- **Color Consistency**: Use exact hex values, maintain color families across variants
- **Animation Smoothness**: Frames must loop seamlessly without jarring transitions
- **Style Matching**: Must match existing PokéRogue sprite aesthetic and quality
- **Technical Compliance**: Atlas files must generate without errors

#### **Common Mistakes to Avoid**
- Anti-aliasing or blur effects on pixel art
- Inconsistent lighting direction between front/back sprites
- Missing or incorrect color mappings in variant files
- Animation frames with different canvas sizes
- Transparent pixels in areas that should be solid
- Colors not found in the variant mapping files
- Incorrect perspective or orientation
- Atlas dimensions not matching expected canvas sizes

## Step 1: Prepare Sprite Assets

### 1.1 Technical Sprite Requirements

#### **Format & File Specifications**
- **Format**: PNG with full RGBA transparency support
- **Color Depth**: 8-bit colormap (256 colors) - PNG files are automatically optimized to this format
- **Compression**: PNG compression with no interlacing
- **Naming Convention**: Follow the pattern `[species_id].png` where species_id matches the enum value exactly

#### **Pixel Art Dimensions & Canvas Size**
- **Front Sprites**: Packed into 181x181 pixel canvas (atlas texture)
- **Back Sprites**: Packed into 156x156 pixel canvas (atlas texture)  
- **Actual Sprite Size**: Variable within canvas, typically 32-38px width × 30-38px height for most Pokémon
- **Source Canvas**: Artists should work with 37×38 pixel base canvas for consistency
- **Large Pokémon**: Legendary and larger species may use up to 50×50 pixels within their atlas frame

#### **Animation Frame Structure**
- **Frame Count**: Each sprite contains multiple animation frames for idle breathing animation
- **Frame Timing**: Animation frames cycle automatically via TexturePacker atlas system
- **Frame Dimensions**: Each frame is individually cropped and packed with precise trimming
- **Frame Naming**: Follows TexturePacker naming convention (0001.png, 0002.png, etc.)

#### **Atlas Metadata Requirements**
- Each sprite requires a corresponding JSON atlas file generated by TexturePacker
- Atlas contains frame positioning, source dimensions, trim data, and UV coordinates
- **Critical Fields**: `sourceSize`, `spriteSourceSize`, `frame` coordinates must be precisely calculated
- **Texture Format**: RGBA8888 with scale factor of 1

### 1.2 Pixel Art Style & Perspective Guidelines

#### **Art Style Specifications**
- **Pixel Art Style**: Clean, sharp pixel art with no anti-aliasing or sub-pixel rendering
- **Color Palette**: Limited color palettes per sprite (typically 8-16 unique colors including shadows)
- **Shading Technique**: Cel-shading style with distinct light and shadow areas
- **Line Art**: 1-pixel thick outlines in dark colors, typically black or very dark versions of base colors

#### **Perspective & Orientation**
- **Front Sprites**: ¾ perspective facing toward bottom-right (player's view of opponent)
- **Back Sprites**: ¾ perspective facing toward top-left (player's view of their own Pokémon)
- **Consistent Lighting**: Light source from upper-left, shadows cast toward bottom-right
- **Ground Contact**: Pokémon should appear grounded with subtle shadow beneath them

#### **Color & Shadow Conventions**
- **Base Colors**: Use saturated, vibrant colors typical of Pokémon art style
- **Shadow Colors**: Shadows are darker, more saturated versions of base colors (not gray)
- **Highlight Colors**: Lighter, sometimes slightly desaturated versions of base colors
- **Outline Colors**: Black or very dark variants of the main body color
- **Color Depth**: 2-3 shades per color family (base, shadow, highlight)

#### **Required Sprite Variations**

For each Pokémon, you typically need:

1. **Front sprite** (`[id].png`) - Main battle sprite in opponent perspective
2. **Back sprite** (`back/[id].png`) - Player's Pokémon sprite in player perspective  
3. **Shiny variants** (`shiny/[id].png`, `shiny/back/[id].png`) - Color-shifted variants
4. **Icon sprites** - Small 32×32 pixel icons packed in icon atlases (pokemon_icons_[n].png)
5. **Gender variants** (`female/[id].png`) - If species shows sexual dimorphism

### 1.3 Advanced Sprite Features

#### **Animation Specifications**
- **Idle Animation**: Subtle breathing/floating animation with 2-4 frames
- **Frame Rate**: Approximately 8-12 frames per second for idle animations  
- **Movement Pattern**: Small vertical movement (1-3 pixels) or gentle scaling
- **Loop Type**: Seamless loop with smooth transitions between first and last frames
- **Timing**: Each frame displayed for ~125-250ms depending on desired pace

#### **Shadow Implementation** 
- **Dynamic Shadows**: Game engine renders shadows automatically below sprites
- **Shadow Source**: Derived from sprite alpha channel and positioning data
- **Shadow Offset**: Configurable Y-offset for floating or airborne Pokémon
- **Shadow Scaling**: Shadows scale with sprite size and field perspective

#### **Color Variant System**
- **Shiny Colors**: Defined in variant JSON files with hex color mapping
- **Color Replacement**: Original colors mapped to new colors via hex color pairs
- **Variant Types**: Multiple variant types supported (shiny, regional, etc.)
- **Color Precision**: Exact hex color matching required for proper replacement

#### **Optional Sprite Variations**
- **Female variants** (`female/[id].png`) - If the species has gender differences
- **Form variations** (`[id]-[form_name].png`) - For different forms (Mega, Gigantamax, Regional)
- **Experimental sprites** (`exp/[id].png`) - Alternative sprite versions for testing
- **Fusion sprites** - Special sprites for Pokémon fusion mechanics (if implemented)

### 1.4 Atlas Generation & Technical Implementation

#### **TexturePacker Configuration**
Sprites are packed using TexturePacker with specific settings:
- **Algorithm**: MaxRects packing for optimal space usage
- **Trim Mode**: Trim removes transparent pixels while preserving source dimensions
- **Power of 2**: Atlas dimensions should be power-of-2 for optimal GPU performance
- **Format**: JSON (Generic) format for Phaser.js compatibility

#### **Atlas File Structure**
Each sprite requires a corresponding JSON file with precise metadata:

```json
{
  "textures": [{
    "image": "[id].png",           // Atlas texture filename
    "format": "RGBA8888",          // Color format
    "size": {"w": 181, "h": 181}, // Total atlas dimensions  
    "scale": 1,                    // Scale factor (always 1)
    "frames": [                   // Array of animation frames
      {
        "filename": "0001.png",   // Frame identifier
        "rotated": false,         // Frame rotation (always false)
        "trimmed": true,          // Transparent area removal
        "sourceSize": {"w": 37, "h": 38},      // Original canvas size
        "spriteSourceSize": {"x": 0, "y": 4, "w": 36, "h": 34}, // Trim offset
        "frame": {"x": 0, "y": 109, "w": 36, "h": 34}  // Atlas position
      }
      // Additional frames for animation...
    ]
  }],
  "meta": {
    "app": "https://www.codeandweb.com/texturepacker",
    "version": "3.0",
    "smartupdate": "[hash_for_texture_packer_updates]"
  }
}
```

#### **Critical Atlas Parameters**
- **sourceSize**: Original sprite canvas dimensions (typically 37×38)
- **spriteSourceSize**: Position and size after trimming transparent areas
- **frame**: Exact pixel coordinates within the packed atlas texture
- **trimmed**: Always `true` to optimize atlas space usage

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

### 3.2 Icon Atlas Integration

Pokémon icons are packed into generation-based atlases:

#### **Icon Specifications**
- **Size**: 32×32 pixels maximum (smaller icons are fine)
- **Style**: Simplified, recognizable version of the Pokémon's front sprite
- **Perspective**: Front-facing, similar to front sprite perspective
- **Atlas Files**: `pokemon_icons_0.png` (Gen 1), `pokemon_icons_1.png` (Gen 2), etc.

#### **Icon Atlas Integration Process**
1. Create 32×32 pixel icon sprite
2. Add to appropriate generation icon atlas using TexturePacker
3. Update corresponding JSON metadata file
4. Ensure icon is positioned correctly within generation boundaries

### 3.3 Add to Experimental Sprites (Optional)

If you want to use experimental sprites, add the sprite key to `public/exp-sprites.json`:

```json
[
  "existing-entries",
  "[species_id]",
  "[species_id]-form-name"
]
```

### 3.4 Advanced Color Variant Configuration

Pokémon color variants use precise hex color mapping for shiny and alternate forms:

#### **Variant Color System**
Colors are replaced using exact hex color matching:

**Variant JSON Structure** (`[id].json`):
```json
{
  "1": {  // Shiny variant (always variant 1)
    "526329": "4a1117",  // Original hex → Replacement hex
    "a5d642": "ff745e",  // Each exact color mapped to new color
    "194a4a": "57003d",  // Must match sprite colors exactly
    "73ad31": "b34952",  // All variations of a color family
    "3a9494": "9c195c",  // Include shadows, highlights, outlines
    "84efc5": "f0628a",  // Comprehensive color mapping required
    "317373": "6e034e"
  },
  "2": {  // Additional variant (rare/special)
    "526329": "022e59",  // Different color scheme
    "a5d642": "80c3d9",  // Can have multiple variants per Pokémon
    "194a4a": "782c00"   // Each variant independently defined
  }
}
```

#### **Color Mapping Best Practices**
- **Exact Matching**: Colors must match sprite pixels exactly (no approximation)
- **Complete Coverage**: Map ALL colors in the sprite, including minor variations
- **Color Families**: Include base colors, shadows, highlights, and outlines
- **Hex Format**: Use 6-digit lowercase hex codes without # prefix
- **Consistency**: Maintain color relationships (if original was darker, replacement should be darker)

#### **Variant Masterlist Integration**
Add entry to `_masterlist.json` with variant availability:
```json
{
  "[species_id]": [0, 1, 1],  // [base_variant, shiny_variant_count, rare_variant_count]
  "[species_id]-form": [0, 2, 1]  // Different forms can have different variant counts
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

### Player Experience Validation (Priority 1)

#### **7.1 Recognition & Attachment Testing**
```yaml
Instant Recognition Test (< 0.5 seconds):
  1. Show sprite to 5+ players unfamiliar with this specific implementation
  2. Measure time to correct species identification
  3. Target: 90%+ correct identification within 0.5 seconds
  4. Common failure: Unclear silhouette, wrong proportions, poor contrast

Personality Recognition Test (0.5-2 seconds):
  1. Show static sprite and ask players to describe personality traits
  2. Compare responses to intended Personality Matrix archetype
  3. Target: 70%+ alignment with primary archetype traits
  4. Common failure: Generic pose, conflicting visual signals

Emotional Response Test:
  1. Measure player reactions: "Would you want this Pokémon on your team?"
  2. Track engagement: How long do players look at the sprite?
  3. Target: 80%+ positive emotional response, 3+ second viewing time
  4. Common failure: Unappealng expression, awkward proportions
```

#### **7.2 Player Demographic Validation**
```yaml
Veteran Player Testing:
  - Authenticity check: "Does this feel like the real [Pokémon]?"
  - Nostalgia validation: "Does this honor the original design?"
  - Target: 85%+ authenticity approval from veteran players

Newcomer Testing:
  - Clarity check: "What type of personality does this Pokémon have?"
  - Appeal measurement: "How interesting is this Pokémon to you?"
  - Target: 75%+ clear personality recognition, 70%+ appeal rating

Competitive Player Testing:
  - Recognition speed: "How quickly can you identify this in battle?"
  - Distraction assessment: "Does this interfere with strategic thinking?"
  - Target: <0.3 second recognition, <10% distraction rating
```

### Technical Validation (Priority 2)

#### **7.3 System Integration Testing**

1. **Game Environment Testing**
   - Start the development server: `npm run start`
   - Create a new game and verify:
     - Sprites load correctly with proper personality animation
     - Pokémon data displays properly with consistent visual identity
     - Evolution works (if applicable) with appropriate personality transition
     - Moves can be learned and reflect personality archetype
     - No console errors or performance degradation

2. **Cross-Context Validation**
   - Test sprite performance in all battle environments
   - Verify readability against various background colors
   - Confirm animation performance under different system loads
   - Validate memory usage stays within acceptable limits

#### **7.4 Sprite Variant Validation**

- **Personality Consistency**: Shiny variants maintain same personality expression
- **Form Accuracy**: Different forms reflect appropriate personality variations
- **Battle Context**: Back sprites maintain personality recognition from behind
- **UI Integration**: Icons retain personality hints at reduced size

#### **7.5 Technical Configuration Testing**

Run validation scripts with personality awareness:
- `./scripts/find_sprite_variant_mismatches.py` - Check variant consistency with personality matrix
- Test evolution chains maintain personality continuity
- Verify move learning reflects personality archetype appropriately
- Performance benchmarking: sprite loads within 100ms, animations at stable framerate

### Iterative Improvement Framework

#### **7.6 Player Feedback Integration**
```yaml
Feedback Collection:
  - "What personality traits do you see in this Pokémon?"
  - "How does this sprite make you feel about the Pokémon?"
  - "Would you choose this Pokémon for your team based on appearance?"
  - "How well does this match your expectations for [Species]?"

Iteration Priorities:
  1. Recognition failures (highest priority)
  2. Personality mismatches (high priority) 
  3. Emotional response issues (medium priority)
  4. Technical optimization (low priority unless critical)

Success Metrics:
  - Species Recognition: 90%+ accuracy within 0.5s
  - Personality Alignment: 70%+ archetype match
  - Emotional Appeal: 80%+ positive response
  - Technical Performance: <100ms load, 60fps animation
```

## Advanced Sprite Techniques

### Professional Sprite Creation Workflow

#### **1. Concept & Planning**
- Study official Pokémon artwork for accurate proportions and details
- Plan color palette with variants in mind (avoid colors that don't translate well)
- Sketch rough animation timing and key poses
- Consider form variations and gender differences from the start

#### **2. Base Sprite Creation**
- Start with front sprite as the master reference
- Use onion skinning for animation frame consistency
- Establish light source and shadow directions early
- Create modular color scheme for easy variant generation

#### **3. Animation Implementation**
- Design subtle idle animations (breathing, floating, etc.)
- Test timing with 125-250ms per frame
- Ensure smooth loops with matching first/last frames
- Consider different animation speeds for different Pokémon personalities

#### **4. Perspective Conversion**
- Create back sprite by mirroring and adjusting perspective
- Maintain consistent volume and proportions
- Adjust details that wouldn't be visible from behind
- Keep lighting direction consistent with front sprite

#### **5. Color Variant Generation**
- Use color replacement tools to generate shiny variants
- Maintain contrast relationships in new color schemes
- Test variants against different backgrounds
- Document exact hex codes for variant JSON files

### Technical Optimization

#### **Performance Considerations**
- **Atlas Efficiency**: Minimize empty space in texture atlases
- **Color Reduction**: Use optimal color palettes for file size
- **Frame Optimization**: Remove duplicate or nearly identical frames
- **Compression**: PNG optimization without quality loss

#### **Pixel Art Best Practices**
- **Selective Outlining**: Not every edge needs a black outline
- **Color Ramps**: Create smooth color transitions with limited steps
- **Detail Hierarchy**: Most important details should read clearly at normal size
- **Contrast Management**: Ensure sprites remain readable against various backgrounds

#### **Animation Polish**
- **Squash and Stretch**: Subtle shape changes add life to idle animations
- **Anticipation**: Small wind-up movements before main animation beats
- **Secondary Animation**: Additional elements like tails, wings, or accessories
- **Timing Variation**: Vary timing between frames for more organic movement

### Sprite Integration Testing

#### **Pre-Integration Checklist**
- [ ] All required sprite variations created (front, back, shiny)
- [ ] Atlas JSON files generated and validated
- [ ] Color variant mappings complete and tested
- [ ] Animation timing feels natural and loops properly
- [ ] File sizes optimized for web delivery
- [ ] Sprites tested against game backgrounds

#### **Integration Validation**
- [ ] Sprites load correctly in game engine
- [ ] Animations play at correct speed
- [ ] Color variants display properly
- [ ] No console errors or missing texture warnings
- [ ] Performance impact acceptable
- [ ] Cross-platform compatibility confirmed

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

### Performance & Optimization Guidelines

#### **File Size Optimization**
- **Sprite Compression**: Use PNG optimization tools to reduce file sizes without quality loss
- **Atlas Efficiency**: Aim for 85%+ texture utilization in atlas packing
- **Color Palette**: Limit colors to essential ones only (8-16 unique colors max)
- **Animation Frames**: Remove redundant frames, optimize frame timing

#### **Memory Management**
- **Atlas Dimensions**: Keep atlas textures under 2048×2048 for broad device support
- **Texture Format**: RGBA8888 provides best quality/performance balance
- **Batch Loading**: Group related sprites in same atlas for efficient GPU usage
- **Lazy Loading**: Sprites load on-demand, no need to preload everything

#### **Runtime Performance**
- **Variant Processing**: Minimize variant JSON file sizes for faster color replacement
- **Animation Optimization**: Avoid complex tweening, use simple frame-based animation
- **Sprite Pooling**: Reuse sprite objects when possible
- **GPU Compatibility**: Test on lower-end devices for performance validation

### Quality Assurance Standards

#### **Visual Quality Metrics**
- **Pixel Perfect**: All edges aligned to pixel boundaries
- **Color Accuracy**: Match official Pokémon color schemes
- **Animation Fluidity**: Smooth 8-12 FPS idle animations
- **Perspective Consistency**: Maintain ¾ view angle across all sprites

#### **Technical Quality Metrics**
- **File Integrity**: All PNG files load without errors
- **Atlas Validation**: JSON metadata matches actual sprite dimensions
- **Color Mapping**: 100% color coverage in variant files
- **Performance Target**: <100KB total per complete Pokémon sprite set

#### **Integration Testing Protocol**
1. **Local Testing**: Verify sprites in development environment
2. **Cross-Browser**: Test in Chrome, Firefox, Safari, Edge
3. **Device Testing**: Validate on mobile devices and various screen densities
4. **Performance Profiling**: Monitor memory usage and frame rates
5. **User Acceptance**: Community feedback on sprite quality and accuracy

---

## Summary

This comprehensive guide provides all technical specifications and artistic guidelines needed to create professional-quality Pokémon sprites for PokéRogue. The game's sophisticated sprite system supports:

- **High-Quality Pixel Art**: Precise technical specifications for authentic Pokémon aesthetics
- **Advanced Animation**: Frame-based idle animations with TexturePacker atlas optimization  
- **Dynamic Color Variants**: Hex-based color replacement system for shiny and alternate forms
- **Performance Optimization**: Efficient atlas packing and GPU-friendly rendering pipeline
- **Comprehensive Integration**: Complete workflow from concept to implementation

### Key Success Factors

1. **Technical Precision**: Follow exact specifications for dimensions, formats, and atlas generation
2. **Artistic Consistency**: Match existing sprite style, perspective, and quality standards
3. **Thorough Testing**: Validate all variants, animations, and integration points
4. **Performance Awareness**: Optimize for file size and runtime performance
5. **Quality Control**: Maintain high standards throughout the creation process

By following this guide, artists can create sprites that seamlessly integrate with PokéRogue's existing content while maintaining the high quality and technical standards expected by the community. Remember to test thoroughly, optimize for performance, and follow established patterns for best results.

### Additional Resources

- **TexturePacker Documentation**: https://www.codeandweb.com/texturepacker/documentation
- **Aseprite Pixel Art Tutorials**: https://www.aseprite.org/docs/
- **PNG Optimization Tools**: TinyPNG, ImageOptim, or similar compression utilities
- **Color Palette Tools**: Adobe Color, Coolors.co for hex color management