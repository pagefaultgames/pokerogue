import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokeballType } from "#enums/pokeball";
import { Stat } from "#enums/stat";
import type { EnemyPokemon, Pokemon } from "#field/pokemon";
import { BerryModifier } from "#modifiers/modifier";
import { PokemonMove } from "#moves/pokemon-move";
import { queueEncounterMessage } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  getRandomEncounterSpecies,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  setEncounterExp,
  setEncounterRewards,
} from "#mystery-encounters/encounter-phase-utils";
import {
  catchPokemon,
  getHighestLevelPlayerPokemon,
  getSpriteKeysFromPokemon,
} from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { MoveRequirement, PersistentModifierRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import { CHARMING_MOVES } from "#mystery-encounters/requirement-groups";
import { PokemonData } from "#system/pokemon-data";
import { isNullOrUndefined, randSeedInt } from "#utils/common";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/uncommonBreed";

/**
 * Uncommon Breed encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3811 | GitHub Issue #3811}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const UncommonBreedEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.UNCOMMON_BREED,
)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withCatchAllowed(true)
  .withHideWildIntroMessage(true)
  .withFleeAllowed(false)
  .withIntroSpriteConfigs([]) // Set in onInit()
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
  ])
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    // Calculate boss mon
    // Level equal to 2 below highest party member
    const level = getHighestLevelPlayerPokemon(false, true).level - 2;
    const pokemon = getRandomEncounterSpecies(level, true, true);

    // Pokemon will always have one of its egg moves in its moveset
    const eggMoves = pokemon.getEggMoves();
    if (eggMoves) {
      const eggMoveIndex = randSeedInt(4);
      const randomEggMove: MoveId = eggMoves[eggMoveIndex];
      encounter.misc = {
        eggMove: randomEggMove,
        pokemon,
      };
      if (pokemon.moveset.length < 4) {
        pokemon.moveset.push(new PokemonMove(randomEggMove));
      } else {
        pokemon.moveset[0] = new PokemonMove(randomEggMove);
      }
    } else {
      encounter.misc.pokemon = pokemon;
    }

    // Defense/Spd buffs below wave 50, +1 to all stats otherwise
    const statChangesForBattle: (Stat.ATK | Stat.DEF | Stat.SPATK | Stat.SPDEF | Stat.SPD | Stat.ACC | Stat.EVA)[] =
      globalScene.currentBattle.waveIndex < 50
        ? [Stat.DEF, Stat.SPDEF, Stat.SPD]
        : [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD];

    const config: EnemyPartyConfig = {
      pokemonConfigs: [
        {
          level,
          species: pokemon.species,
          dataSource: new PokemonData(pokemon),
          isBoss: false,
          tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
          mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
            queueEncounterMessage(`${namespace}:option.1.statBoost`);
            globalScene.phaseManager.unshiftNew(
              "StatStageChangePhase",
              pokemon.getBattlerIndex(),
              true,
              statChangesForBattle,
              1,
            );
          },
        },
      ],
    };
    encounter.enemyPartyConfigs = [config];

    const { spriteKey, fileRoot } = getSpriteKeysFromPokemon(pokemon);
    encounter.spriteConfigs = [
      {
        spriteKey,
        fileRoot,
        hasShadow: true,
        x: -5,
        repeat: true,
        isPokemon: true,
        isShiny: pokemon.shiny,
        variant: pokemon.variant,
      },
    ];

    encounter.setDialogueToken("enemyPokemon", pokemon.getNameToRender());
    globalScene.loadSe("PRSFX- Spotlight2", "battle_anims", "PRSFX- Spotlight2.wav");
    return true;
  })
  .withOnVisualsStart(() => {
    // Animate the pokemon
    const encounter = globalScene.currentBattle.mysteryEncounter!;
    const pokemonSprite = encounter.introVisuals!.getSprites();

    // Bounce at the end, then shiny sparkle if the Pokemon is shiny
    globalScene.tweens.add({
      targets: pokemonSprite,
      duration: 300,
      ease: "Cubic.easeOut",
      yoyo: true,
      y: "-=20",
      loop: 1,
      onComplete: () => encounter.introVisuals?.playShinySparkles(),
    });

    globalScene.time.delayedCall(500, () => globalScene.playSound("battle_anims/PRSFX- Spotlight2"));
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

      const eggMove = encounter.misc.eggMove;
      if (!isNullOrUndefined(eggMove)) {
        // Check what type of move the egg move is to determine target
        const pokemonMove = new PokemonMove(eggMove);
        const move = pokemonMove.getMove();
        const target = move.is("SelfStatusMove") ? BattlerIndex.ENEMY : BattlerIndex.PLAYER;

        encounter.startOfBattleEffects.push({
          sourceBattlerIndex: BattlerIndex.ENEMY,
          targets: [target],
          move: pokemonMove,
          useMode: MoveUseMode.IGNORE_PP,
        });
      }

      setEncounterRewards({ fillRemaining: true });
      await initBattleWithEnemyConfig(encounter.enemyPartyConfigs[0]);
    },
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      .withSceneRequirement(new PersistentModifierRequirement("BerryModifier", 4)) // Will set option2PrimaryName and option2PrimaryMove dialogue tokens automatically
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        disabledButtonTooltip: `${namespace}:option.2.disabledTooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      })
      .withOptionPhase(async () => {
        // Give it some food

        // Remove 4 random berries from player's party
        // Get all player berry items, remove from party, and store reference
        const berryItems: BerryModifier[] = globalScene.findModifiers(
          m => m instanceof BerryModifier,
        ) as BerryModifier[];
        for (let i = 0; i < 4; i++) {
          const index = randSeedInt(berryItems.length);
          const randBerry = berryItems[index];
          randBerry.stackCount--;
          if (randBerry.stackCount === 0) {
            globalScene.removeModifier(randBerry);
            berryItems.splice(index, 1);
          }
        }
        await globalScene.updateModifiers(true, true);

        // Pokemon joins the team, with 2 egg moves
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const pokemon = encounter.misc.pokemon;

        // Give 1 additional egg move
        givePokemonExtraEggMove(pokemon, encounter.misc.eggMove);

        await catchPokemon(pokemon, null, PokeballType.POKEBALL, false);
        setEncounterRewards({ fillRemaining: true });
        leaveEncounterWithoutBattle();
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      .withPrimaryPokemonRequirement(new MoveRequirement(CHARMING_MOVES, true)) // Will set option2PrimaryName and option2PrimaryMove dialogue tokens automatically
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        disabledButtonTooltip: `${namespace}:option.3.disabledTooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      })
      .withOptionPhase(async () => {
        // Attract the pokemon with a move
        // Pokemon joins the team, with 2 egg moves and IVs rolled an additional time
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const pokemon = encounter.misc.pokemon;

        // Give 1 additional egg move
        givePokemonExtraEggMove(pokemon, encounter.misc.eggMove);

        // Roll IVs a second time
        pokemon.ivs = pokemon.ivs.map(iv => {
          const newValue = randSeedInt(31);
          return newValue > iv ? newValue : iv;
        });

        await catchPokemon(pokemon, null, PokeballType.POKEBALL, false);
        if (encounter.selectedOption?.primaryPokemon?.id) {
          setEncounterExp(encounter.selectedOption.primaryPokemon.id, pokemon.getExpValue(), false);
        }
        setEncounterRewards({ fillRemaining: true });
        leaveEncounterWithoutBattle();
      })
      .build(),
  )
  .build();

function givePokemonExtraEggMove(pokemon: EnemyPokemon, previousEggMove: MoveId) {
  const eggMoves = pokemon.getEggMoves();
  if (eggMoves) {
    let randomEggMove: MoveId = eggMoves[randSeedInt(4)];
    while (randomEggMove === previousEggMove) {
      randomEggMove = eggMoves[randSeedInt(4)];
    }
    if (pokemon.moveset.length < 4) {
      pokemon.moveset.push(new PokemonMove(randomEggMove));
    } else {
      pokemon.moveset[1] = new PokemonMove(randomEggMove);
    }
  }
}
