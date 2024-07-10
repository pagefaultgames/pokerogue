import BattleScene from "../../../battle-scene";
import {
  generateModifierType,
  leaveEncounterWithoutBattle,
  queueEncounterMessage,
  selectPokemonForOption,
  setEncounterRewards,
  updatePlayerMoney,
} from "#app/data/mystery-encounters/mystery-encounter-utils";
import MysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier } from "../mystery-encounter";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import {
  HealthRatioRequirement,
  MoneyRequirement,
  StatusEffectRequirement,
  WaveCountRequirement
} from "../mystery-encounter-requirements";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { modifierTypes } from "#app/modifier/modifier-type";
import { Species } from "#enums/species";
import { randSeedInt } from "#app/utils";
import Pokemon, { PlayerPokemon } from "#app/field/pokemon";
import { StatusEffect } from "#app/data/status-effect";

export const ShadyVitaminDealerEncounter: MysteryEncounter = MysteryEncounterBuilder
  .withEncounterType(MysteryEncounterType.SHADY_VITAMIN_DEALER)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withIntroSpriteConfigs([
    {
      spriteKey: Species.KROOKODILE.toString(),
      fileRoot: "pokemon",
      hasShadow: true,
      repeat: true,
      x: 10,
      y: -1
    },
    {
      spriteKey: "b2w2_veteran_m",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      x: -10,
      y: 2
    }
  ])
  .withSceneRequirement(new WaveCountRequirement([10, 180]))
  .withPrimaryPokemonRequirement(new StatusEffectRequirement([StatusEffect.NONE])) // Pokemon must not have status
  .withPrimaryPokemonRequirement(new HealthRatioRequirement([0.34, 1])) // Pokemon must have above 1/3rd HP
  .withOption(new MysteryEncounterOptionBuilder()
    .withSceneRequirement(new MoneyRequirement(0, 2)) // Wave scaling multiplier of 2 for cost
    .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
      const encounter = scene.currentBattle.mysteryEncounter;
      const onPokemonSelected = (pokemon: PlayerPokemon) => {
        // Update money
        updatePlayerMoney(scene, -(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney);
        // Calculate modifiers and dialogue tokens
        const modifiers = [
          generateModifierType(scene, modifierTypes.BASE_STAT_BOOSTER),
          generateModifierType(scene, modifierTypes.BASE_STAT_BOOSTER)
        ];
        encounter.setDialogueToken("boost1", modifiers[0].name);
        encounter.setDialogueToken("boost2", modifiers[1].name);
        encounter.misc = {
          chosenPokemon: pokemon,
          modifiers: modifiers
        };
      };

      // Only Pokemon that can gain benefits are unfainted with no status
      const selectableFilter = (pokemon: Pokemon) => {
        // If pokemon meets primary pokemon reqs, it can be selected
        const meetsReqs = encounter.pokemonMeetsPrimaryRequirements(scene, pokemon);
        if (!meetsReqs) {
          return "Pokémon must be healthy enough.";
        }

        return null;
      };

      return selectPokemonForOption(scene, onPokemonSelected, null, selectableFilter);
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Choose Cheap Option
      const encounter = scene.currentBattle.mysteryEncounter;
      const chosenPokemon = encounter.misc.chosenPokemon;
      const modifiers = encounter.misc.modifiers;

      for (const modType of modifiers) {
        const modifier = modType.newModifier(chosenPokemon);
        await scene.addModifier(modifier, true, false, false, true);
      }
      scene.updateModifiers(true);

      leaveEncounterWithoutBattle(scene);
    })
    .withPostOptionPhase(async (scene: BattleScene) => {
      // Damage and status applied after dealer leaves (to make thematic sense)
      const encounter = scene.currentBattle.mysteryEncounter;
      const chosenPokemon = encounter.misc.chosenPokemon;

      // Pokemon takes 1/3 max HP damage
      const damage = Math.round(chosenPokemon.getMaxHp() / 3);
      chosenPokemon.hp = Math.max(chosenPokemon.hp - damage, 0);

      // Roll for poison (80%)
      if (randSeedInt(10) < 10) {
        if (chosenPokemon.trySetStatus(StatusEffect.TOXIC)) {
          // Toxic applied
          queueEncounterMessage(scene, "mysteryEncounter:shady_vitamin_dealer_bad_poison");
        } else {
          // Pokemon immune or something else prevents status
          queueEncounterMessage(scene, "mysteryEncounter:shady_vitamin_dealer_damage_only");
        }
      } else {
        queueEncounterMessage(scene, "mysteryEncounter:shady_vitamin_dealer_damage_only");
      }

      chosenPokemon.updateInfo();
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withSceneRequirement(new MoneyRequirement(0, 5)) // Wave scaling multiplier of 2 for cost
    .withOptionPhase(async (scene: BattleScene) => {
      // Choose Expensive Option
      const modifiers = [];
      let i = 0;
      while (i < 3) {
        // 2/1 weight on base stat booster vs PP Up
        const roll = randSeedInt(3);
        if (roll === 0) {
          modifiers.push(modifierTypes.PP_UP);
        } else {

        }
        i++;
      }

      setEncounterRewards(scene, { guaranteedModifierTypeFuncs: modifiers, fillRemaining: false });
      leaveEncounterWithoutBattle(scene);
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(scene, true);
      return true;
    })
    .build())
  .build();
