import BattleScene from "../battle-scene";
import { SyncEncounterNatureAbAttr, applyAbAttrs } from "../data/ability";
import { TrainerType } from "../data/enums/trainer-type";
import MysteryEncounter from "../data/mystery-encounter";
import { TrainerSlot, trainerConfigs } from "../data/trainer-config";
import Trainer, { TrainerVariant } from "../field/trainer";
import { ModifierPoolType, regenerateModifierPoolThresholds } from "../modifier/modifier-type";
import { Phase } from "../phase";
import * as Utils from ".././utils";
import { SummonPhase } from "../phases";
import { FieldPosition } from "../field/pokemon";
import { BattleType } from "../battle";
import { Species } from "../data/enums/species";
import { BattleSpec } from "../enums/battle-spec";

export class MysteryEncounterPostOptionSelectPhase extends Phase {
  onPostOptionSelect: (scene: BattleScene) => Promise<boolean | void>;

  constructor(scene: BattleScene, onPostOptionSelect: (scene: BattleScene) => Promise<boolean | void>) {
    super(scene);
    this.onPostOptionSelect = onPostOptionSelect;
  }

  start() {
    super.start();
    removeMysteryEncounterIntroVisuals(this.scene).then(() => {
      this.onPostOptionSelect(this.scene).then(() => {
        this.end();
      });
    });
  }

  getMysteryEncounter(): MysteryEncounter {
    return this.scene.currentBattle.mysteryEncounter;
  }
}

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
 *
 * @param scene
 * @param doubleBattle
 * @param levelMultiplier - multiplier to adjust enemy levels up and down for harder or easier battles
 * @param trainerType
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
      scene.gameData.setPokemonSeen(enemyPokemon, true, battle.battleType === BattleType.TRAINER || battle.battleType === BattleType.MYSTERY_ENCOUNTER);
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
        // Spawns at current visible field instead of on "next encounter" field (off screen)
        enemyPokemon.x += 300;
      }
    });

    if (!loaded) {
      regenerateModifierPoolThresholds(scene.getEnemyField(), battle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD);
      scene.generateEnemyModifiers();
    }
  });
}

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
