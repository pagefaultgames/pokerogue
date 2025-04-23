import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import type { EnemyPartyConfig } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  initBattleWithEnemyConfig,
  loadCustomMovesForEncounter,
  leaveEncounterWithoutBattle,
  setEncounterExp,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
  generateModifierType,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import type { AttackTypeBoosterModifierType } from "#app/modifier/modifier-type";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { globalScene } from "#app/global-scene";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import {
  AbilityRequirement,
  CombinationPokemonRequirement,
  TypeRequirement,
} from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { Species } from "#enums/species";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Gender } from "#app/data/gender";
import { PokemonType } from "#enums/pokemon-type";
import { BattlerIndex } from "#app/battle";
import type Pokemon from "#app/field/pokemon";
import { PokemonMove } from "#app/field/pokemon";
import { Moves } from "#enums/moves";
import { EncounterBattleAnim } from "#app/data/battle-anims";
import { WeatherType } from "#enums/weather-type";
import { isNullOrUndefined, randSeedInt } from "#app/utils/common";
import { StatusEffect } from "#enums/status-effect";
import { queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import {
  applyAbilityOverrideToPokemon,
  applyDamageToPokemon,
  applyModifierTypeToPlayerPokemon,
} from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { EncounterAnim } from "#enums/encounter-anims";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { Stat } from "#enums/stat";
import { Ability } from "#app/data/abilities/ability-class";
import { FIRE_RESISTANT_ABILITIES } from "#app/data/mystery-encounters/requirements/requirement-groups";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/fieryFallout";

/**
 * Damage percentage taken when suffering the heat.
 * Can be a number between `0` - `100`.
 * The higher the more damage taken (100% = instant KO).
 */
const DAMAGE_PERCENTAGE: number = 20;

/**
 * Fiery Fallout encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3814 | GitHub Issue #3814}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const FieryFalloutEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.FIERY_FALLOUT,
)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withSceneWaveRangeRequirement(40, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
  .withCatchAllowed(true)
  .withIntroSpriteConfigs([]) // Set in onInit()
  .withAnimations(EncounterAnim.MAGMA_BG, EncounterAnim.MAGMA_SPOUT)
  .withAutoHideIntroVisuals(false)
  .withFleeAllowed(false)
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
  ])
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    // Calculate boss mons
    const volcaronaSpecies = getPokemonSpecies(Species.VOLCARONA);
    const config: EnemyPartyConfig = {
      pokemonConfigs: [
        {
          species: volcaronaSpecies,
          isBoss: false,
          gender: Gender.MALE,
          tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
          mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
            globalScene.unshiftPhase(
              new StatStageChangePhase(pokemon.getBattlerIndex(), true, [Stat.SPDEF, Stat.SPD], 1),
            );
          },
        },
        {
          species: volcaronaSpecies,
          isBoss: false,
          gender: Gender.FEMALE,
          tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
          mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
            globalScene.unshiftPhase(
              new StatStageChangePhase(pokemon.getBattlerIndex(), true, [Stat.SPDEF, Stat.SPD], 1),
            );
          },
        },
      ],
      doubleBattle: true,
      disableSwitch: true,
    };
    encounter.enemyPartyConfigs = [config];

    // Load hidden Volcarona sprites
    encounter.spriteConfigs = [
      {
        spriteKey: "",
        fileRoot: "",
        species: Species.VOLCARONA,
        repeat: true,
        hidden: true,
        hasShadow: true,
        x: -20,
        startFrame: 20,
      },
      {
        spriteKey: "",
        fileRoot: "",
        species: Species.VOLCARONA,
        repeat: true,
        hidden: true,
        hasShadow: true,
        x: 20,
      },
    ];

    // Load animations/sfx for Volcarona moves
    loadCustomMovesForEncounter([Moves.FIRE_SPIN, Moves.QUIVER_DANCE]);

    const pokemon = globalScene.getEnemyPokemon();
    globalScene.arena.trySetWeather(WeatherType.SUNNY, pokemon);

    encounter.setDialogueToken("volcaronaName", getPokemonSpecies(Species.VOLCARONA).getName());

    return true;
  })
  .withOnVisualsStart(() => {
    // Play animations
    const background = new EncounterBattleAnim(
      EncounterAnim.MAGMA_BG,
      globalScene.getPlayerPokemon()!,
      globalScene.getPlayerPokemon(),
    );
    background.playWithoutTargets(200, 70, 2, 3);
    const animation = new EncounterBattleAnim(
      EncounterAnim.MAGMA_SPOUT,
      globalScene.getPlayerPokemon()!,
      globalScene.getPlayerPokemon(),
    );
    animation.playWithoutTargets(80, 100, 2);
    globalScene.time.delayedCall(600, () => {
      animation.playWithoutTargets(-20, 100, 2);
    });
    globalScene.time.delayedCall(1200, () => {
      animation.playWithoutTargets(140, 150, 2);
    });

    return true;
  })
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.1.label`,
      buttonTooltip: `${namespace}:option.1.tooltip`,
      selected: [
        {
          text: `${namespace}:option.1.selected`,
        },
      ],
    },
    async () => {
      // Pick battle
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      setEncounterRewards({ fillRemaining: true }, undefined, () => giveLeadPokemonAttackTypeBoostItem());

      encounter.startOfBattleEffects.push(
        {
          sourceBattlerIndex: BattlerIndex.ENEMY,
          targets: [BattlerIndex.PLAYER],
          move: new PokemonMove(Moves.FIRE_SPIN),
          ignorePp: true,
        },
        {
          sourceBattlerIndex: BattlerIndex.ENEMY_2,
          targets: [BattlerIndex.PLAYER_2],
          move: new PokemonMove(Moves.FIRE_SPIN),
          ignorePp: true,
        },
      );
      await initBattleWithEnemyConfig(globalScene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0]);
    },
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.2.label`,
      buttonTooltip: `${namespace}:option.2.tooltip`,
      selected: [
        {
          text: `${namespace}:option.2.selected`,
        },
      ],
    },
    async () => {
      // Damage non-fire types and burn 1 random non-fire type member + give it Heatproof
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      const nonFireTypes = globalScene
        .getPlayerParty()
        .filter(p => p.isAllowedInBattle() && !p.getTypes().includes(PokemonType.FIRE));

      for (const pkm of nonFireTypes) {
        const percentage = DAMAGE_PERCENTAGE / 100;
        const damage = Math.floor(pkm.getMaxHp() * percentage);
        applyDamageToPokemon(pkm, damage);
      }

      // Burn random member
      const burnable = nonFireTypes.filter(
        p => isNullOrUndefined(p.status) || isNullOrUndefined(p.status.effect) || p.status.effect === StatusEffect.NONE,
      );
      if (burnable?.length > 0) {
        const roll = randSeedInt(burnable.length);
        const chosenPokemon = burnable[roll];
        if (chosenPokemon.trySetStatus(StatusEffect.BURN)) {
          // Burn applied
          encounter.setDialogueToken("burnedPokemon", chosenPokemon.getNameToRender());
          encounter.setDialogueToken("abilityName", new Ability(Abilities.HEATPROOF, 3).name);
          queueEncounterMessage(`${namespace}:option.2.target_burned`);

          // Also permanently change the burned Pokemon's ability to Heatproof
          applyAbilityOverrideToPokemon(chosenPokemon, Abilities.HEATPROOF);
        }
      }

      // No rewards
      leaveEncounterWithoutBattle(true);
    },
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      .withPrimaryPokemonRequirement(
        CombinationPokemonRequirement.Some(
          new TypeRequirement(PokemonType.FIRE, true, 1),
          new AbilityRequirement(FIRE_RESISTANT_ABILITIES, true),
        ),
      ) // Will set option3PrimaryName dialogue token automatically
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        disabledButtonTooltip: `${namespace}:option.3.disabled_tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        // Do NOT await this, to prevent player from repeatedly pressing options
        transitionMysteryEncounterIntroVisuals(false, false, 2000);
      })
      .withOptionPhase(async () => {
        // Fire types help calm the Volcarona
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        await transitionMysteryEncounterIntroVisuals();
        setEncounterRewards({ fillRemaining: true }, undefined, () => {
          giveLeadPokemonAttackTypeBoostItem();
        });

        const primary = encounter.options[2].primaryPokemon!;

        setEncounterExp([primary.id], getPokemonSpecies(Species.VOLCARONA).baseExp * 2);
        leaveEncounterWithoutBattle();
      })
      .build(),
  )
  .build();

function giveLeadPokemonAttackTypeBoostItem() {
  // Give first party pokemon attack type boost item for free at end of battle
  const leadPokemon = globalScene.getPlayerParty()?.[0];
  if (leadPokemon) {
    // Generate type booster held item, default to Charcoal if item fails to generate
    let boosterModifierType = generateModifierType(modifierTypes.ATTACK_TYPE_BOOSTER) as AttackTypeBoosterModifierType;
    if (!boosterModifierType) {
      boosterModifierType = generateModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, [
        PokemonType.FIRE,
      ]) as AttackTypeBoosterModifierType;
    }
    applyModifierTypeToPlayerPokemon(leadPokemon, boosterModifierType);

    const encounter = globalScene.currentBattle.mysteryEncounter!;
    encounter.setDialogueToken("itemName", boosterModifierType.name);
    encounter.setDialogueToken("leadPokemon", leadPokemon.getNameToRender());
    queueEncounterMessage(`${namespace}:found_item`);
  }
}
