import BattleScene from "#app/battle-scene.js";
import { trainerConfigs } from "#app/data/trainer-config.js";
import { TrainerType } from "#app/enums/trainer-type.js";
import { BattlePhase } from "./battle-phase";
import { TestMessagePhase } from "./test-message-phase";

export class TrainerMessageTestPhase extends BattlePhase {
  private trainerTypes: TrainerType[];

  constructor(scene: BattleScene, ...trainerTypes: TrainerType[]) {
    super(scene);

    this.trainerTypes = trainerTypes;
  }

  start() {
    super.start();

    const testMessages: string[] = [];

    for (const t of Object.keys(trainerConfigs)) {
      const type = parseInt(t);
      if (this.trainerTypes.length && !this.trainerTypes.find(tt => tt === type as TrainerType)) {
        continue;
      }
      const config = trainerConfigs[type];
      [config.encounterMessages, config.femaleEncounterMessages, config.victoryMessages, config.femaleVictoryMessages, config.defeatMessages, config.femaleDefeatMessages]
        .map(messages => {
          if (messages?.length) {
            testMessages.push(...messages);
          }
        });
    }

    for (const message of testMessages) {
      this.scene.pushPhase(new TestMessagePhase(this.scene, message));
    }

    this.end();
  }
}
