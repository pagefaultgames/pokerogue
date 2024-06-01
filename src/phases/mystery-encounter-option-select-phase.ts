import { BattleType } from "../battle";
import BattleScene from "../battle-scene";
import { SyncEncounterNatureAbAttr, applyAbAttrs } from "../data/ability";
import { Species } from "../data/enums/species";
import MysteryEncounter, { MysteryEncounterOption } from "../data/mystery-encounter";
import { TrainerSlot } from "../data/trainer-config";
import { BattleSpec } from "../enums/battle-spec";
import { FieldPosition } from "../field/pokemon";
import { ModifierPoolType, regenerateModifierPoolThresholds } from "../modifier/modifier-type";
import { Phase } from "../phase";
import { SummonPhase } from "../phases";
import { Mode } from "../ui/ui";

export class MysteryEncounterOptionSelectPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
  }

  handleOptionSelect(option: MysteryEncounterOption): boolean {
    const success = option.onSelect(this.scene);

    if (success) {
      this.end();
    }

    return success;
  }

  cancel() {
    // Handle escaping of this option select phase?
    // Unsure if this is necessary

    this.end();
  }

  getMysteryEncounter(): MysteryEncounter {
    return this.scene.currentBattle.mysteryEncounter;
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}

export function generateNewEnemyParty(scene: BattleScene): void {
  const loaded = false;
  const loadEnemyAssets = [];

  const battle = scene.currentBattle;

  scene.getEnemyParty().forEach(enemyPokemon => enemyPokemon.destroy());
  battle.enemyParty = [];

  battle.enemyLevels.forEach((level, e) => {
    if (!loaded) {
      if (battle.battleType === BattleType.TRAINER) {
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
      scene.gameData.setPokemonSeen(enemyPokemon, true, battle.battleType === BattleType.TRAINER);
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

    totalBst += enemyPokemon.getSpeciesForm().baseTotal;

    loadEnemyAssets.push(enemyPokemon.loadAssets());

    console.log(enemyPokemon.name, enemyPokemon.species.speciesId, enemyPokemon.stats);
  });

  Promise.all(loadEnemyAssets).then(() => {
    battle.enemyParty.forEach((enemyPokemon, e) => {
      if (e < (battle.double ? 2 : 1)) {
        enemyPokemon.setVisible(false);
        if (battle.double) {
          enemyPokemon.setFieldPosition(e ? FieldPosition.RIGHT : FieldPosition.LEFT);
          // Spawns at current visible field instead of on "next encounter" field (off screen)
          enemyPokemon.x = enemyPokemon.x + 300;
        }
      }
    });

    if (!loaded) {
      regenerateModifierPoolThresholds(scene.getEnemyField(), battle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD);
      scene.generateEnemyModifiers();
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
