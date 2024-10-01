import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { EnemyPartyConfig, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, setEncounterExp, setEncounterRewards } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { CHARMING_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import Pokemon, { EnemyPokemon, PokemonMove } from "#app/field/pokemon";
import { getPartyLuckValue } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MoveRequirement, PersistentModifierRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { TrainerSlot } from "#app/data/trainer-config";
import { catchPokemon, getHighestLevelPlayerPokemon, getSpriteKeysFromPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import PokemonData from "#app/system/pokemon-data";
import { isNullOrUndefined, randSeedInt } from "#app/utils";
import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { SelfStatusMove } from "#app/data/move";
import { PokeballType } from "#enums/pokeball";
import { BattlerTagType } from "#enums/battler-tag-type";
import { queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { BerryModifier } from "#app/modifier/modifier";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { Stat } from "#enums/stat";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:uncommonBreed";

/**
 * Uncommon Breed encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3811 | GitHub Issue #3811}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const UncommonBreedEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.UNCOMMON_BREED)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withCatchAllowed(true)
    .withHideWildIntroMessage(true)
    .withFleeAllowed(false)
    .withIntroSpriteConfigs([]) // Set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;

      // Calculate boss mon
      // Level equal to 2 below highest party member
      const level = getHighestLevelPlayerPokemon(scene, false, true).level - 2;
      const species = scene.arena.randomSpecies(scene.currentBattle.waveIndex, level, 0, getPartyLuckValue(scene.getParty()), true);
      const pokemon = new EnemyPokemon(scene, species, level, TrainerSlot.NONE, true);

      // Pokemon will always have one of its egg moves in its moveset
      const eggMoves = pokemon.getEggMoves();
      if (eggMoves) {
        const eggMoveIndex = randSeedInt(4);
        const randomEggMove: Moves = eggMoves[eggMoveIndex];
        encounter.misc = {
          eggMove: randomEggMove,
          pokemon: pokemon
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
      const statChangesForBattle: (Stat.ATK | Stat.DEF | Stat.SPATK | Stat.SPDEF | Stat.SPD | Stat.ACC | Stat.EVA)[] = scene.currentBattle.waveIndex < 50 ?
        [Stat.DEF, Stat.SPDEF, Stat.SPD] :
        [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD];

      const config: EnemyPartyConfig = {
        pokemonConfigs: [{
          level: level,
          species: species,
          dataSource: new PokemonData(pokemon),
          isBoss: false,
          tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
          mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
            queueEncounterMessage(pokemon.scene, `${namespace}.option.1.stat_boost`);
            pokemon.scene.unshiftPhase(new StatStageChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, statChangesForBattle, 1));
          }
        }],
      };
      encounter.enemyPartyConfigs = [config];

      const { spriteKey, fileRoot } = getSpriteKeysFromPokemon(pokemon);
      encounter.spriteConfigs = [
        {
          spriteKey: spriteKey,
          fileRoot: fileRoot,
          hasShadow: true,
          x: -5,
          repeat: true,
          isPokemon: true
        },
      ];

      encounter.setDialogueToken("enemyPokemon", pokemon.getNameToRender());
      scene.loadSe("PRSFX- Spotlight2", "battle_anims", "PRSFX- Spotlight2.wav");
      return true;
    })
    .withOnVisualsStart((scene: BattleScene) => {
      // Animate the pokemon
      const encounter = scene.currentBattle.mysteryEncounter!;
      const pokemonSprite = encounter.introVisuals!.getSprites();

      scene.tweens.add({ // Bounce at the end
        targets: pokemonSprite,
        duration: 300,
        ease: "Cubic.easeOut",
        yoyo: true,
        y: "-=20",
        loop: 1,
      });

      scene.time.delayedCall(500, () => scene.playSound("battle_anims/PRSFX- Spotlight2"));
      return true;
    })
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            text: `${namespace}.option.1.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Pick battle
        const encounter = scene.currentBattle.mysteryEncounter!;

        const eggMove = encounter.misc.eggMove;
        if (!isNullOrUndefined(eggMove)) {
          // Check what type of move the egg move is to determine target
          const pokemonMove = new PokemonMove(eggMove);
          const move = pokemonMove.getMove();
          const target = move instanceof SelfStatusMove ? BattlerIndex.ENEMY : BattlerIndex.PLAYER;

          encounter.startOfBattleEffects.push(
            {
              sourceBattlerIndex: BattlerIndex.ENEMY,
              targets: [target],
              move: pokemonMove,
              ignorePp: true
            });
        }

        setEncounterRewards(scene, { fillRemaining: true });
        await initBattleWithEnemyConfig(scene, encounter.enemyPartyConfigs[0]);
      }
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
        .withSceneRequirement(new PersistentModifierRequirement("BerryModifier", 4)) // Will set option2PrimaryName and option2PrimaryMove dialogue tokens automatically
        .withDialogue({
          buttonLabel: `${namespace}.option.2.label`,
          buttonTooltip: `${namespace}.option.2.tooltip`,
          disabledButtonTooltip: `${namespace}.option.2.disabled_tooltip`,
          selected: [
            {
              text: `${namespace}.option.2.selected`
            }
          ]
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Give it some food

          // Remove 4 random berries from player's party
          // Get all player berry items, remove from party, and store reference
          const berryItems: BerryModifier[]= scene.findModifiers(m => m instanceof BerryModifier) as BerryModifier[];
          for (let i = 0; i < 4; i++) {
            const index = randSeedInt(berryItems.length);
            const randBerry = berryItems[index];
            randBerry.stackCount--;
            if (randBerry.stackCount === 0) {
              scene.removeModifier(randBerry);
              berryItems.splice(index, 1);
            }
          }
          await scene.updateModifiers(true, true);

          // Pokemon joins the team, with 2 egg moves
          const encounter = scene.currentBattle.mysteryEncounter!;
          const pokemon = encounter.misc.pokemon;

          // Give 1 additional egg move
          givePokemonExtraEggMove(pokemon, encounter.misc.eggMove);

          await catchPokemon(scene, pokemon, null, PokeballType.POKEBALL, false);
          setEncounterRewards(scene, { fillRemaining: true });
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new MoveRequirement(CHARMING_MOVES)) // Will set option2PrimaryName and option2PrimaryMove dialogue tokens automatically
        .withDialogue({
          buttonLabel: `${namespace}.option.3.label`,
          buttonTooltip: `${namespace}.option.3.tooltip`,
          disabledButtonTooltip: `${namespace}.option.3.disabled_tooltip`,
          selected: [
            {
              text: `${namespace}.option.3.selected`
            }
          ]
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Attract the pokemon with a move
          // Pokemon joins the team, with 2 egg moves and IVs rolled an additional time
          const encounter = scene.currentBattle.mysteryEncounter!;
          const pokemon = encounter.misc.pokemon;

          // Give 1 additional egg move
          givePokemonExtraEggMove(pokemon, encounter.misc.eggMove);

          // Roll IVs a second time
          pokemon.ivs = pokemon.ivs.map(iv => {
            const newValue = randSeedInt(31);
            return newValue > iv ? newValue : iv;
          });

          await catchPokemon(scene, pokemon, null, PokeballType.POKEBALL, false);
          if (encounter.selectedOption?.primaryPokemon?.id) {
            setEncounterExp(scene, encounter.selectedOption.primaryPokemon.id, pokemon.getExpValue(), false);
          }
          setEncounterRewards(scene, { fillRemaining: true });
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    .build();

function givePokemonExtraEggMove(pokemon: EnemyPokemon, previousEggMove: Moves) {
  const eggMoves = pokemon.getEggMoves();
  if (eggMoves) {
    let randomEggMove: Moves = eggMoves[randSeedInt(4)];
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
