import { BattleType } from "../battle";
import BattleScene from "../battle-scene";
import { SyncEncounterNatureAbAttr, applyAbAttrs } from "../data/ability";
import { Species } from "../data/enums/species";
import { TrainerType } from "../data/enums/trainer-type";
import { TrainerSlot, trainerConfigs } from "../data/trainer-config";
import { BattleSpec } from "../enums/battle-spec";
import { FieldPosition } from "../field/pokemon";
import Trainer, { TrainerVariant } from "../field/trainer";
import { ExtraModifierModifier } from "../modifier/modifier";
import { ModifierTier } from "../modifier/modifier-tier";
import { ModifierPoolType, ModifierTypeFunc, regenerateModifierPoolThresholds } from "../modifier/modifier-type";
import { ModifierRewardPhase, NewBattlePhase, SelectModifierPhase, SummonPhase } from "../phases";
import * as Utils from "../utils";

/**
 * Util file for functions used in mystery encounters
 * **MIGHT** be useful outside of mystery encounters but no guarantees of functionality
 */


/**
 * Async function that is called every time a mystery encounter option is selected
 * If there are intro visuals as part of an encounter, they will fade back and then be removed
 * Async logic can be used to await or promise chain once visuals are finished being removed
 * Note: If Trainer objects are part of a mystery encounter battle, those will be shown after intro visuals
 * @param scene - Battle scene object
 * @returns - Promise
 */
export function removeMysteryEncounterIntroVisuals(scene: BattleScene): Promise<boolean> {
  return new Promise(resolve => {
    const introVisuals = scene.currentBattle.mysteryEncounter.introVisuals;
    if (introVisuals) {
      // Hide
      scene.tweens.add({
        targets: introVisuals,
        x: "+=16",
        y: "-=16",
        alpha: 0,
        ease: "Sine.easeInOut",
        duration: 750,
        onComplete: () => {
          scene.field.remove(introVisuals);
          introVisuals.setVisible(false);
          introVisuals.destroy();
          resolve(true);
        }
      });
    } else {
      resolve(true);
    }
  });

}


/**
 * Generates an enemy party for a mystery encounter battle
 * This will override and replace any standard encounter generation logic
 * Useful for tailoring specific battles to mystery encounters
 * @param scene - Battle Scene
 * @param doubleBattle - is double battle?
 * @param levelMultiplier - multiplier to adjust enemy levels up and down for harder or easier battles
 * @param trainerType - optional, if set will generate a team based on passed trainer type and configure a trainer battle instead of wild
 */
export function generateNewEnemyParty(scene: BattleScene, doubleBattle: boolean = false, levelMultiplier: number = 1, trainerType?: TrainerType): void {
  const loaded = false;
  const loadEnemyAssets = [];

  const battle = scene.currentBattle;

  // Create trainer
  if (trainerType) {
    if (scene.currentBattle.trainer) {
      scene.currentBattle.trainer.setVisible(false);
      scene.currentBattle.trainer.destroy();
    }
    const doubleTrainer = trainerConfigs[trainerType].doubleOnly || (trainerConfigs[trainerType].hasDouble && doubleBattle);
    const newTrainer = new Trainer(scene, trainerType, doubleTrainer ? TrainerVariant.DOUBLE : Utils.randSeedInt(2) ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT);
    newTrainer.x += 300;
    scene.field.add(newTrainer);
    scene.currentBattle.trainer = newTrainer;
    loadEnemyAssets.push(newTrainer.loadAssets());
  }

  scene.getEnemyParty().forEach(enemyPokemon => enemyPokemon.destroy());
  battle.enemyParty = [];

  // Calculate levels for battle (with modifier)
  battle.enemyLevels = scene.currentBattle.trainer.getPartyLevels(scene.currentBattle.waveIndex)
    .map(level => Math.max(Math.round(level * levelMultiplier), 1) as integer);

  battle.enemyLevels.forEach((level, e) => {
    if (!loaded) {
      if (trainerType) {
        battle.enemyParty[e] = battle.trainer.genPartyMember(e);
      } else {
        const enemySpecies = scene.randomSpecies(battle.waveIndex, level, true);
        battle.enemyParty[e] = scene.addEnemyPokemon(enemySpecies, level, TrainerSlot.NONE, !!scene.getEncounterBossSegments(battle.waveIndex, level, enemySpecies));
        if (scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
          battle.enemyParty[e].ivs = new Array(6).fill(31);
        }
        scene.getParty().slice(0, !battle.double ? 1 : 2).reverse().forEach(playerPokemon => {
          applyAbAttrs(SyncEncounterNatureAbAttr, playerPokemon, null, battle.enemyParty[e]);
        });
      }
    }
    const enemyPokemon = scene.getEnemyParty()[e];
    if (e < (battle.double ? 2 : 1)) {
      enemyPokemon.setX(-66 + enemyPokemon.getFieldPositionOffset()[0]);
      enemyPokemon.resetSummonData();
    }

    if (!loaded) {
      scene.gameData.setPokemonSeen(enemyPokemon, true, trainerType ? true : false);
    }

    if (enemyPokemon.species.speciesId === Species.ETERNATUS) {
      if (scene.gameMode.isClassic && (battle.battleSpec === BattleSpec.FINAL_BOSS || scene.gameMode.isWaveFinal(battle.waveIndex))) {
        if (battle.battleSpec !== BattleSpec.FINAL_BOSS) {
          enemyPokemon.formIndex = 1;
          enemyPokemon.updateScale();
        }
        enemyPokemon.setBoss();
      } else if (!(battle.waveIndex % 1000)) {
        enemyPokemon.formIndex = 1;
        enemyPokemon.updateScale();
      }
    }

    loadEnemyAssets.push(enemyPokemon.loadAssets());

    console.log(enemyPokemon.name, enemyPokemon.species.speciesId, enemyPokemon.stats);
  });

  Promise.all(loadEnemyAssets).then(() => {
    battle.enemyParty.forEach((enemyPokemon, e) => {
      if (e < (battle.double ? 2 : 1)) {
        enemyPokemon.setVisible(false);
        if (battle.double) {
          enemyPokemon.setFieldPosition(e ? FieldPosition.RIGHT : FieldPosition.LEFT);
        }
        // Spawns at current visible field instead of on "next encounter" field (off screen to the left)
        enemyPokemon.x += 300;
      }
    });

    if (!loaded) {
      regenerateModifierPoolThresholds(scene.getEnemyField(), battle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD);
      scene.generateEnemyModifiers();
    }
  });
}

/**
 * For trainer battles during mystery encounters
 * Will animate the trainer onto the field and show intro dialogue selected at random from the trainer's pool of dialogue
 * Async logic can be used to await or promise chain from the player's continuation of the dialogue
 * @param scene - Battle Scene
 * @returns - Promise
 */
export function showTrainerDialogue(scene: BattleScene): Promise<boolean> {
  scene.pbTray.showPbTray(scene.getParty());
  scene.pbTrayEnemy.showPbTray(scene.getEnemyParty());

  // Show enemy trainer
  const trainer = scene.currentBattle.trainer;
  trainer.alpha = 0;
  trainer.x += 16;
  trainer.y -= 16;
  scene.tweens.add({
    targets: scene.currentBattle.trainer,
    x: "-=16",
    y: "+=16",
    alpha: 1,
    ease: "Sine.easeInOut",
    duration: 750,
    onComplete: () => {
      trainer.playAnim();
    }
  });

  return new Promise(resolve => {
    if (trainer) {
      const encounterMessages = scene.currentBattle.trainer.getEncounterMessages();
      let message: string;
      scene.executeWithSeedOffset(() => message = Utils.randSeedItem(encounterMessages), scene.currentBattle.waveIndex);
      scene.ui.showDialogue(message, trainer.getName(TrainerSlot.NONE, true), null, () => resolve(true));
    } else {
      resolve(true);
    }
  });
}

export function initBattleFromEncounter(scene: BattleScene) {
  scene.currentBattle.started = true;
  scene.playBgm(undefined);
  scene.pbTray.showPbTray(scene.getParty());
  scene.pbTrayEnemy.showPbTray(scene.getEnemyParty());

  // Hide enemy trainer
  scene.tweens.add({
    targets: scene.currentBattle.trainer,
    x: "+=16",
    y: "-=16",
    alpha: 0,
    ease: "Sine.easeInOut",
    duration: 750
  });

  const availablePartyMembers = scene.getEnemyParty().filter(p => !p.isFainted()).length;
  scene.unshiftPhase(new SummonPhase(scene, 0, false));
  if (scene.currentBattle.double && availablePartyMembers > 1) {
    scene.unshiftPhase(new SummonPhase(scene, 1, false));
  }
}

/**
 * Will initialize reward phases to follow the mystery encounter
 * Can have shop displayed or skipped
 * @param scene - Battle Scene
 * @param showShop - if true, adds a shop phase
 * @param shopRewardTierOverrides - if set, will replace the auto-generated reward tiers with custom tiers. These tiers can still be upgraded by player luck
 * @param fillShopRemaining - if shopRewardTierOverrides is set with fewer items than what a shop would provide and this is true, will fill any remaining missing tiers with randomly generated ones.
 * @param nonShopRewards - will add a non-shop reward phase for each specified item/modifier (can happen in addition to a shop)
 */
export function setEncounterRewards(scene: BattleScene, showShop?: boolean, shopRewardTierOverrides?: ModifierTier[], fillShopRemaining?: boolean, nonShopRewards?: ModifierTypeFunc[]) {
  const rewardsFunction = (scene: BattleScene) => {
    if (showShop) {
      // Gets number of items for shop
      const modifierCount = new Utils.IntegerHolder(3);
      scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
      const numItems = modifierCount.value;

      let rewards: ModifierTier[] = [];
      if (shopRewardTierOverrides) {
        rewards = shopRewardTierOverrides;

        if (fillShopRemaining && rewards.length < numItems) {
          for (let i = 0; i < numItems - rewards.length; i++) {
            const tierValue = Utils.randSeedInt(1024);
            const initialFillTier = tierValue > 255 ? ModifierTier.COMMON : tierValue > 60 ? ModifierTier.GREAT : tierValue > 12 ? ModifierTier.ULTRA : tierValue ? ModifierTier.ROGUE : ModifierTier.MASTER;
            rewards.push(initialFillTier);
          }
        }
      } else {
        for (let i = 0; i < numItems; i++) {
          const tierValue = Utils.randSeedInt(1024);
          const initialFillTier = tierValue > 255 ? ModifierTier.COMMON : tierValue > 60 ? ModifierTier.GREAT : tierValue > 12 ? ModifierTier.ULTRA : tierValue ? ModifierTier.ROGUE : ModifierTier.MASTER;
          rewards.push(initialFillTier);
        }
      }

      this.scene.pushPhase(new SelectModifierPhase(this.scene, 0, rewards));
    }

    if (nonShopRewards?.length > 0) {
      nonShopRewards.forEach((reward) => {
        scene.pushPhase(new ModifierRewardPhase(scene, reward));
      });

    }

    return true;
  };

  scene.currentBattle.mysteryEncounter.rewards(rewardsFunction);
}

/**
 * Can be used to exit an encounter without any battles or followup
 * Will skip any shops and rewards, and queue the next encounter phase as normal
 * @param scene
 */
export function leaveEncounter(scene: BattleScene) {
  scene.currentBattle.mysteryEncounter.didBattle = false;
  scene.clearPhaseQueue();
  scene.clearPhaseQueueSplice();
  scene.pushPhase(new NewBattlePhase(scene));
}
