import { EnemyPartyConfig, hideMysteryEncounterIntroVisuals, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, setEncounterRewards } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes, } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier, } from "../mystery-encounter";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Species } from "#enums/species";
import { Nature } from "#app/data/nature";
import { PlayerPokemon } from "#app/field/pokemon";
import { showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:theStrongStuff";

export const TheStrongStuffEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(
    MysteryEncounterType.THE_STRONG_STUFF
  )
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
    .withHideWildIntroMessage(true)
    .withHideIntroVisuals(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "berry_juice",
        fileRoot: "mystery-encounters",
        hasShadow: true,
        scale: 1.5,
        x: -15,
        y: 3,
        yShadow: 0
      },
      {
        spriteKey: Species.SHUCKLE.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        scale: 1.5,
        x: 20,
        y: 10,
        yShadow: 7
      },
    ]) // Set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Calculate boss mon
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 1,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.SHUCKLE),
            isBoss: true,
            bossSegments: 5,
            spriteScale: 2,
            nature: Nature.BOLD,
            // moves: [Moves.INFESTATION, Moves.SALT_CURE, Moves.STEALTH_ROCK, Moves.RECOVER]
          }
        ],
      };
      encounter.enemyPartyConfigs = [config];

      return true;
    })
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option:1:label`,
        buttonTooltip: `${namespace}:option:1:tooltip`,
        selected: [
          {
            text: `${namespace}:option:1:selected`
          }
        ]
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter;
        // Do blackout and hide intro visuals during blackout
        scene.time.delayedCall(700, () => {
          hideMysteryEncounterIntroVisuals(scene);
        });

        // -20 to all base stats of highest BST, +10 to all base stats of rest of party
        // Get highest BST mon
        const party = scene.getParty();
        let highestBst: PlayerPokemon = null;
        let statTotal = 0;
        for (const pokemon of party) {
          if (!highestBst) {
            highestBst = pokemon;
            statTotal = pokemon.getSpeciesForm().getBaseStatTotal();
            continue;
          }

          const total = pokemon.getSpeciesForm().getBaseStatTotal();
          if (total > statTotal) {
            highestBst = pokemon;
            statTotal = total;
          }
        }

        if (!highestBst) {
          highestBst = party[0];
        }

        console.log("BST pre change: " + highestBst.getSpeciesForm().baseStats);
        highestBst.getSpeciesForm().baseStats = [...highestBst.getSpeciesForm().baseStats].map(v => v - 20);
        console.log("Species BST: " + getPokemonSpecies(highestBst.getSpeciesForm().speciesId).baseStats);
        console.log("Pokemon BST: " + highestBst.getSpeciesForm().baseStats);
        highestBst.calculateStats();
        highestBst.updateInfo();
        for (const pokemon of party) {
          if (highestBst.id === pokemon.id) {
            continue;
          }

          pokemon.getSpeciesForm().baseStats = [...pokemon.getSpeciesForm().baseStats].map(v => v + 10);
          // pokemon.summonData.getSpeciesForm()Form.baseStats = pokemon.getSpeciesForm().baseStats;
          pokemon.calculateStats();
          pokemon.updateInfo();
        }

        encounter.setDialogueToken("highBstPokemon", highestBst.name);
        await showEncounterText(scene, `${namespace}:option:1:selected_2`, null, true);

        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option:2:label`,
        buttonTooltip: `${namespace}:option:2:tooltip`,
        selected: [
          {
            text: `${namespace}:option:2:selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Pick battle
        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.SOUL_DEW], fillRemaining: true });
        await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]);
      }
    )
    .build();
