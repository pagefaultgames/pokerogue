import BattleScene from "../battle-scene";
import { TrainerType } from "../data/trainer-type";
import Trainer from "../trainer";

export default class TrainerData {
  public trainerType: TrainerType;
  public female: boolean;
  public partyTemplateIndex: integer;

  constructor(source: Trainer | any) {
    const sourceTrainer = source instanceof Trainer ? source as Trainer : null;
    this.trainerType = sourceTrainer ? sourceTrainer.config.trainerType : source.trainerType;
    this.female = source.female;
    this.partyTemplateIndex = source.partyMemberTemplateIndex;
  }

  toTrainer(scene: BattleScene): Trainer {
    return new Trainer(scene, this.trainerType, this.female, this.partyTemplateIndex);
  }
}