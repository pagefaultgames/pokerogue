import { EnemyPartyConfig, generateModifierTypeOption, initBattleWithEnemyConfig, setEncounterExp, setEncounterRewards, transitionMysteryEncounterIntroVisuals, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { randSeedInt } from "#app/utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MoneyRequirement, WaveModulusRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import Pokemon, { EnemyPokemon } from "#app/field/pokemon";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import PokemonData from "#app/system/pokemon-data";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { Biome } from "#enums/biome";
import { getBiomeKey } from "#app/field/arena";
import { Type } from "#app/data/type";
import { getPartyLuckValue, modifierTypes } from "#app/modifier/modifier-type";
import { TrainerSlot } from "#app/data/trainer-config";
import { BattlerTagType } from "#enums/battler-tag-type";
import { getPokemonNameWithAffix } from "#app/messages";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { Stat } from "#enums/stat";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";
import { getEncounterPokemonLevelForWave, STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounter:teleportingHijinks";

const MONEY_COST_MULTIPLIER = 1.75;
const BIOME_CANDIDATES = [Biome.SPACE, Biome.FAIRY_CAVE, Biome.LABORATORY, Biome.ISLAND, Biome.WASTELAND, Biome.DOJO];
const MACHINE_INTERFACING_TYPES = [Type.ELECTRIC, Type.STEEL];

/**
 * Teleporting Hijinks encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3817 | GitHub Issue #3817}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const TeleportingHijinksEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.TELEPORTING_HIJINKS)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withSceneRequirement(new WaveModulusRequirement([1, 2, 3], 10)) // Must be in first 3 waves after boss wave
    .withSceneRequirement(new MoneyRequirement(undefined, MONEY_COST_MULTIPLIER)) // Must be able to pay teleport cost
    .withAutoHideIntroVisuals(false)
    .withCatchAllowed(true)
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
        text: `${namespace}.intro`,
      }
    ])
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;
      const price = scene.getWaveMoneyAmount(MONEY_COST_MULTIPLIER);
      encounter.setDialogueToken("price", price.toString());
      encounter.misc = {
        price
      };

      return true;
    })
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withSceneMoneyRequirement(undefined, MONEY_COST_MULTIPLIER) // Must be able to pay teleport cost
        .withDialogue({
          buttonLabel: `${namespace}.option.1.label`,
          buttonTooltip: `${namespace}.option.1.tooltip`,
          selected: [
            {
              text: `${namespace}.option.1.selected`,
            }
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene) => {
          // Update money
          updatePlayerMoney(scene, -scene.currentBattle.mysteryEncounter!.misc.price, true, false);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const config: EnemyPartyConfig = await doBiomeTransitionDialogueAndBattleInit(scene);
          setEncounterRewards(scene, { fillRemaining: true });
          await initBattleWithEnemyConfig(scene, config);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPokemonTypeRequirement(MACHINE_INTERFACING_TYPES, true, 1) // Must have Steel or Electric type
        .withDialogue({
          buttonLabel: `${namespace}.option.2.label`,
          buttonTooltip: `${namespace}.option.2.tooltip`,
          disabledButtonTooltip: `${namespace}.option.2.disabled_tooltip`,
          selected: [
            {
              text: `${namespace}.option.2.selected`,
            }
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const config: EnemyPartyConfig = await doBiomeTransitionDialogueAndBattleInit(scene);
          setEncounterRewards(scene, { fillRemaining: true });
          setEncounterExp(scene, scene.currentBattle.mysteryEncounter!.selectedOption!.primaryPokemon!.id, 100);
          await initBattleWithEnemyConfig(scene, config);
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        selected: [
          {
            text: `${namespace}.option.3.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Inspect the Machine
        const encounter = scene.currentBattle.mysteryEncounter!;

        // Init enemy
        const level = getEncounterPokemonLevelForWave(scene, STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER);
        const bossSpecies = scene.arena.randomSpecies(scene.currentBattle.waveIndex, level, 0, getPartyLuckValue(scene.getParty()), true);
        const bossPokemon = new EnemyPokemon(scene, bossSpecies, level, TrainerSlot.NONE, true);
        encounter.setDialogueToken("enemyPokemon", getPokemonNameWithAffix(bossPokemon));
        const config: EnemyPartyConfig = {
          pokemonConfigs: [{
            level: level,
            species: bossSpecies,
            dataSource: new PokemonData(bossPokemon),
            isBoss: true,
          }],
        };

        const magnet = generateModifierTypeOption(scene, modifierTypes.ATTACK_TYPE_BOOSTER, [Type.STEEL])!;
        const metalCoat = generateModifierTypeOption(scene, modifierTypes.ATTACK_TYPE_BOOSTER, [Type.ELECTRIC])!;
        setEncounterRewards(scene, { guaranteedModifierTypeOptions: [magnet, metalCoat], fillRemaining: true });
        transitionMysteryEncounterIntroVisuals(scene, true, true);
        await initBattleWithEnemyConfig(scene, config);
      }
    )
    .build();

async function doBiomeTransitionDialogueAndBattleInit(scene: BattleScene) {
  const encounter = scene.currentBattle.mysteryEncounter!;

  // Calculate new biome (cannot be current biome)
  const filteredBiomes = BIOME_CANDIDATES.filter(b => scene.arena.biomeType !== b);
  const newBiome = filteredBiomes[randSeedInt(filteredBiomes.length)];

  // Show dialogue and transition biome
  await showEncounterText(scene, `${namespace}.transport`);
  await Promise.all([animateBiomeChange(scene, newBiome), transitionMysteryEncounterIntroVisuals(scene)]);
  scene.playBgm();
  await showEncounterText(scene, `${namespace}.attacked`);

  // Init enemy
  const level = getEncounterPokemonLevelForWave(scene, STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER);
  const bossSpecies = scene.arena.randomSpecies(scene.currentBattle.waveIndex, level, 0, getPartyLuckValue(scene.getParty()), true);
  const bossPokemon = new EnemyPokemon(scene, bossSpecies, level, TrainerSlot.NONE, true);
  encounter.setDialogueToken("enemyPokemon", getPokemonNameWithAffix(bossPokemon));
  const config: EnemyPartyConfig = {
    pokemonConfigs: [{
      level: level,
      species: bossSpecies,
      dataSource: new PokemonData(bossPokemon),
      isBoss: true,
      tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
      mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
        queueEncounterMessage(pokemon.scene, `${namespace}.boss_enraged`);
        pokemon.scene.unshiftPhase(new StatStageChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD], 1));
      }
    }],
  };

  return config;
}

async function animateBiomeChange(scene: BattleScene, nextBiome: Biome) {
  return new Promise<void>(resolve => {
    scene.tweens.add({
      targets: [scene.arenaEnemy, scene.lastEnemyTrainer],
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        scene.newArena(nextBiome);

        const biomeKey = getBiomeKey(nextBiome);
        const bgTexture = `${biomeKey}_bg`;
        scene.arenaBgTransition.setTexture(bgTexture);
        scene.arenaBgTransition.setAlpha(0);
        scene.arenaBgTransition.setVisible(true);
        scene.arenaPlayerTransition.setBiome(nextBiome);
        scene.arenaPlayerTransition.setAlpha(0);
        scene.arenaPlayerTransition.setVisible(true);

        scene.tweens.add({
          targets: [scene.arenaPlayer, scene.arenaBgTransition, scene.arenaPlayerTransition],
          duration: 1000,
          ease: "Sine.easeInOut",
          alpha: (target: any) => target === scene.arenaPlayer ? 0 : 1,
          onComplete: () => {
            scene.arenaBg.setTexture(bgTexture);
            scene.arenaPlayer.setBiome(nextBiome);
            scene.arenaPlayer.setAlpha(1);
            scene.arenaEnemy.setBiome(nextBiome);
            scene.arenaEnemy.setAlpha(1);
            scene.arenaNextEnemy.setBiome(nextBiome);
            scene.arenaBgTransition.setVisible(false);
            scene.arenaPlayerTransition.setVisible(false);
            if (scene.lastEnemyTrainer) {
              scene.lastEnemyTrainer.destroy();
            }

            resolve();

            scene.tweens.add({
              targets: scene.arenaEnemy,
              x: "-=300",
            });
          }
        });
      }
    });
  });
}
