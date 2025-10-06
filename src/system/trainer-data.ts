import type { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import { Trainer } from "#field/trainer";

export class TrainerData {
  public trainerType: TrainerType;
  public variant: TrainerVariant;
  public partyTemplateIndex: number;
  public nameKey: string;
  public partnerNameKey: string | undefined;

  constructor(source: Trainer | any) {
    const sourceTrainer = source instanceof Trainer ? (source as Trainer) : null;
    this.trainerType = sourceTrainer ? sourceTrainer.config.trainerType : source.trainerType;
    this.variant = source.hasOwnProperty("variant")
      ? source.variant
      : source.female
        ? TrainerVariant.FEMALE
        : TrainerVariant.DEFAULT;
    this.partyTemplateIndex = source.partyMemberTemplateIndex;
    this.nameKey = source.nameKey;
    this.partnerNameKey = source.partnerNameKey;
  }

  toTrainer(): Trainer {
    return new Trainer(this.trainerType, this.variant, this.partyTemplateIndex, this.nameKey, this.partnerNameKey);
  }
}
