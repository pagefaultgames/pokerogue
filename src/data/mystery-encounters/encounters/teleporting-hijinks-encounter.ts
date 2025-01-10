import type { EnemyPartyConfig } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { generateModifierTypeOption, initBattleWithEnemyConfig, setEncounterExp, setEncounterRewards, transitionMysteryEncounterIntroVisuals, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { randSeedInt } from "#app/utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { globalScene } from "#app/global-scene";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MoneyRequirement, WaveModulusRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import type Pokemon from "#app/field/pokemon";
import { EnemyPokemon } from "#app/field/pokemon";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import PokemonData from "#app/system/pokemon-data";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { Biome } from "#enums/biome";
import { getBiomeKey } from "#app/field/arena";
import { Type } from "#enums/type";
import { getPartyLuckValue, modifierTypes } from "#app/modifier/modifier-type";
import { TrainerSlot } from "#app/data/trainer-config";
import { BattlerTagType } from "#enums/battler-tag-type";
import { getPokemonNameWithAffix } from "#app/messages";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { Stat } from "#enums/stat";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";
import { getEncounterPokemonLevelForWave, STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/teleportingHijinks";

const MONEY_COST_MULTIPLIER = 1.75;
const BIOME_CANDIDATES = [ Biome.SPACE, Biome.FAIRY_CAVE, Biome.LABORATORY, Biome.ISLAND, Biome.WASTELAND, Biome.DOJO ];
const MACHINE_INTERFACING_TYPES = [ Type.ELECTRIC, Type.STEEL ];

/**
 * Teleporting Hijinks encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3817 | GitHub Issue #3817}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const TeleportingHijinksEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.TELEPORTING_HIJINKS)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withSceneRequirement(new WaveModulusRequirement([ 1, 2, 3 ], 10)) // Must be in first 3 waves after boss wave
    .withSceneRequirement(new MoneyRequirement(0, MONEY_COST_MULTIPLIER)) // Must be able to pay teleport cost
    .withAutoHideIntroVisuals(false)
    .withCatchAllowed(true)
    .withFleeAllowed(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "teleporting_hijinks_teleporter",
        fileRoot: "mystery-encounters",
        hasShadow: true,
        x: 4,
        y: 4,
        yShadow: 1
      }
    ])
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      }
    ])
    .setLocalizationKey(`${namespace}`)
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOnInit(() => {
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      const price = globalScene.getWaveMoneyAmount(MONEY_COST_MULTIPLIER);
      encounter.setDialogueToken("price", price.toString());
      encounter.misc = {
        price
      };

      return true;
    })
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withSceneMoneyRequirement(0, MONEY_COST_MULTIPLIER) // Must be able to pay teleport cost
        .withDialogue({
          buttonLabel: `${namespace}:option.1.label`,
          buttonTooltip: `${namespace}:option.1.tooltip`,
          selected: [
            {
              text: `${namespace}:option.1.selected`,
            }
          ],
        })
        .withPreOptionPhase(async () => {
          // Update money
          updatePlayerMoney(-globalScene.currentBattle.mysteryEncounter!.misc.price, true, false);
        })
        .withOptionPhase(async () => {
          const config: EnemyPartyConfig = await doBiomeTransitionDialogueAndBattleInit();
          setEncounterRewards({ fillRemaining: true });
          await initBattleWithEnemyConfig(config);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPokemonTypeRequirement(MACHINE_INTERFACING_TYPES, true, 1) // Must have Steel or Electric type
        .withDialogue({
          buttonLabel: `${namespace}:option.2.label`,
          buttonTooltip: `${namespace}:option.2.tooltip`,
          disabledButtonTooltip: `${namespace}:option.2.disabled_tooltip`,
          selected: [
            {
              text: `${namespace}:option.2.selected`,
            }
          ],
        })
        .withOptionPhase(async () => {
          const config: EnemyPartyConfig = await doBiomeTransitionDialogueAndBattleInit();
          setEncounterRewards({ fillRemaining: true });
          setEncounterExp(globalScene.currentBattle.mysteryEncounter!.selectedOption!.primaryPokemon!.id, 100);
          await initBattleWithEnemyConfig(config);
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      },
      async () => {
        // Inspect the Machine
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        // Init enemy
        const level = getEncounterPokemonLevelForWave(STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER);
        const bossSpecies = globalScene.arena.randomSpecies(globalScene.currentBattle.waveIndex, level, 0, getPartyLuckValue(globalScene.getPlayerParty()), true);
        const bossPokemon = new EnemyPokemon(bossSpecies, level, TrainerSlot.NONE, true);
        encounter.setDialogueToken("enemyPokemon", getPokemonNameWithAffix(bossPokemon));
        const config: EnemyPartyConfig = {
          pokemonConfigs: [{
            level: level,
            species: bossSpecies,
            dataSource: new PokemonData(bossPokemon),
            isBoss: true,
          }],
        };

        const magnet = generateModifierTypeOption(modifierTypes.ATTACK_TYPE_BOOSTER, [ Type.STEEL ])!;
        const metalCoat = generateModifierTypeOption(modifierTypes.ATTACK_TYPE_BOOSTER, [ Type.ELECTRIC ])!;
        setEncounterRewards({ guaranteedModifierTypeOptions: [ magnet, metalCoat ], fillRemaining: true });
        await transitionMysteryEncounterIntroVisuals(true, true);
        await initBattleWithEnemyConfig(config);
      }
    )
    .build();

async function doBiomeTransitionDialogueAndBattleInit() {
  const encounter = globalScene.currentBattle.mysteryEncounter!;

  // Calculate new biome (cannot be current biome)
  const filteredBiomes = BIOME_CANDIDATES.filter(b => globalScene.arena.biomeType !== b);
  const newBiome = filteredBiomes[randSeedInt(filteredBiomes.length)];

  // Show dialogue and transition biome
  await showEncounterText(`${namespace}:transport`);
  await Promise.all([ animateBiomeChange(newBiome), transitionMysteryEncounterIntroVisuals() ]);
  globalScene.playBgm();
  await showEncounterText(`${namespace}:attacked`);

  // Init enemy
  const level = getEncounterPokemonLevelForWave(STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER);
  const bossSpecies = globalScene.arena.randomSpecies(globalScene.currentBattle.waveIndex, level, 0, getPartyLuckValue(globalScene.getPlayerParty()), true);
  const bossPokemon = new EnemyPokemon(bossSpecies, level, TrainerSlot.NONE, true);
  encounter.setDialogueToken("enemyPokemon", getPokemonNameWithAffix(bossPokemon));

  // Defense/Spd buffs below wave 50, +1 to all stats otherwise
  const statChangesForBattle: (Stat.ATK | Stat.DEF | Stat.SPATK | Stat.SPDEF | Stat.SPD | Stat.ACC | Stat.EVA)[] = globalScene.currentBattle.waveIndex < 50 ?
    [ Stat.DEF, Stat.SPDEF, Stat.SPD ] :
    [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ];

  const config: EnemyPartyConfig = {
    pokemonConfigs: [{
      level: level,
      species: bossSpecies,
      dataSource: new PokemonData(bossPokemon),
      isBoss: true,
      tags: [ BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON ],
      mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
        queueEncounterMessage(`${namespace}:boss_enraged`);
        globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, statChangesForBattle, 1));
      }
    }],
  };

  return config;
}

async function animateBiomeChange(nextBiome: Biome) {
  return new Promise<void>(resolve => {
    globalScene.tweens.add({
      targets: [ globalScene.arenaEnemy, globalScene.lastEnemyTrainer ],
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        globalScene.newArena(nextBiome);

        const biomeKey = getBiomeKey(nextBiome);
        const bgTexture = `${biomeKey}_bg`;
        globalScene.arenaBgTransition.setTexture(bgTexture);
        globalScene.arenaBgTransition.setAlpha(0);
        globalScene.arenaBgTransition.setVisible(true);
        globalScene.arenaPlayerTransition.setBiome(nextBiome);
        globalScene.arenaPlayerTransition.setAlpha(0);
        globalScene.arenaPlayerTransition.setVisible(true);

        globalScene.tweens.add({
          targets: [ globalScene.arenaPlayer, globalScene.arenaBgTransition, globalScene.arenaPlayerTransition ],
          duration: 1000,
          ease: "Sine.easeInOut",
          alpha: (target: any) => target === globalScene.arenaPlayer ? 0 : 1,
          onComplete: () => {
            globalScene.arenaBg.setTexture(bgTexture);
            globalScene.arenaPlayer.setBiome(nextBiome);
            globalScene.arenaPlayer.setAlpha(1);
            globalScene.arenaEnemy.setBiome(nextBiome);
            globalScene.arenaEnemy.setAlpha(1);
            globalScene.arenaNextEnemy.setBiome(nextBiome);
            globalScene.arenaBgTransition.setVisible(false);
            globalScene.arenaPlayerTransition.setVisible(false);
            if (globalScene.lastEnemyTrainer) {
              globalScene.lastEnemyTrainer.destroy();
            }

            resolve();

            globalScene.tweens.add({
              targets: globalScene.arenaEnemy,
              x: "-=300",
            });
          }
        });
      }
    });
  });
}
