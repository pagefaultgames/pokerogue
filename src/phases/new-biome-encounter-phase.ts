import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { EncounterPhase } from "#phases/encounter-phase";

export class NewBiomeEncounterPhase extends EncounterPhase {
  public readonly phaseName = "NewBiomeEncounterPhase";

  protected override doEncounter(): void {
    audioManager.playBgm(undefined, true);

    // Reset all battle and wave data, perform form changes, etc.
    // We do this because new biomes are considered "arena transitions" akin to MEs and trainer battles
    for (const pokemon of globalScene.getPlayerParty()) {
      if (pokemon) {
        pokemon.resetBattleAndWaveData();
        if (pokemon.isOnField()) {
          applyAbAttrs("PostBiomeChangeAbAttr", { pokemon });
        }
      }
    }

    const enemyField = globalScene.getEnemyField();
    const moveTargets: any[] = [globalScene.arenaEnemy, enemyField];
    const mysteryEncounter = globalScene.currentBattle?.mysteryEncounter?.introVisuals;
    if (mysteryEncounter) {
      moveTargets.push(mysteryEncounter);
    }

    globalScene.tweens.add({
      targets: moveTargets.flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        if (globalScene.currentBattle.isClassicFinalBoss) {
          this.displayFinalBossDialogue();
        } else {
          this.doEncounterCommon();
        }
      },
    });
  }
}
