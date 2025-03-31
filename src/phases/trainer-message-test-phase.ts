import { globalScene } from "#app/global-scene";
import { trainerConfigs } from "#app/data/trainers/trainer-config";
import type { TrainerType } from "#app/enums/trainer-type";
import { BattlePhase } from "./battle-phase";
import { TestMessagePhase } from "./test-message-phase";

export class TrainerMessageTestPhase extends BattlePhase {
  private trainerTypes: TrainerType[];

  constructor(...trainerTypes: TrainerType[]) {
    super();

    this.trainerTypes = trainerTypes;
  }

  start() {
    super.start();

    const testMessages: string[] = [];

    for (const t of Object.keys(trainerConfigs)) {
      const type = Number.parseInt(t);
      if (this.trainerTypes.length && !this.trainerTypes.find(tt => tt === (type as TrainerType))) {
        continue;
      }
      const config = trainerConfigs[type];
      [
        config.encounterMessages,
        config.femaleEncounterMessages,
        config.victoryMessages,
        config.femaleVictoryMessages,
        config.defeatMessages,
        config.femaleDefeatMessages,
      ].map(messages => {
        if (messages?.length) {
          testMessages.push(...messages);
        }
      });
    }

    for (const message of testMessages) {
      globalScene.pushPhase(new TestMessagePhase(message));
    }

    this.end();
  }
}
