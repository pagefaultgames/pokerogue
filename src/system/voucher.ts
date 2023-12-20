import BattleScene from "../battle-scene";
import { TrainerType, trainerConfigs } from "../data/trainer-type";
import { ModifierTier } from "../modifier/modifier-type";
import { Achv, achvs } from "./achv";

export enum VoucherType {
  REGULAR,
  PLUS,
  PREMIUM
}

export class Voucher {
  public id: string;
  public voucherType: VoucherType;
  public description: string;

  private conditionFunc: (scene: BattleScene, args: any[]) => boolean;

  constructor(voucherType: VoucherType, description: string, conditionFunc?: (scene: BattleScene, args: any[]) => boolean) {
    this.description = description;
    this.voucherType = voucherType;
    this.conditionFunc = conditionFunc;
  }

  validate(scene: BattleScene, args: any[]): boolean {
    return !this.conditionFunc || this.conditionFunc(scene, args);
  }

  getName(): string {
    return getVoucherTypeName(this.voucherType);
  }

  getIconImage(): string {
    return getVoucherTypeIcon(this.voucherType);
  }

  getTier(): ModifierTier {
    switch (this.voucherType) {
      case VoucherType.REGULAR:
        return ModifierTier.GREAT;
      case VoucherType.PLUS:
        return ModifierTier.ULTRA;
      case VoucherType.PREMIUM:
        return ModifierTier.MASTER;
    }
  }
}

export function getVoucherTypeName(voucherType: VoucherType): string {
  switch (voucherType) {
    case VoucherType.REGULAR:
      return 'Egg Voucher';
    case VoucherType.PLUS:
      return 'Egg Voucher Plus';
    case VoucherType.PREMIUM:
      return 'Egg Voucher Premium';
  }
}

export function getVoucherTypeIcon(voucherType: VoucherType): string {
  switch (voucherType) {
    case VoucherType.REGULAR:
      return 'coupon';
    case VoucherType.PLUS:
      return 'pair_of_tickets';
    case VoucherType.PREMIUM:
      return 'mystic_ticket';
  }
}


export interface Vouchers {
  [key: string]: Voucher
}

export const vouchers: Vouchers = {};

const voucherAchvs: Achv[] = [ achvs.CLASSIC_VICTORY ];

{
  (function() {
    const bossTrainerTypes = Object.keys(trainerConfigs)
      .filter(tt => trainerConfigs[tt].isBoss && trainerConfigs[tt].getDerivedType() !== TrainerType.RIVAL);

    for (let trainerType of bossTrainerTypes) {
      const voucherType = trainerConfigs[trainerType].moneyMultiplier < 10
        ? VoucherType.REGULAR
        : VoucherType.PLUS;
      const key = TrainerType[trainerType];
      vouchers[key] = new Voucher(voucherType, `Defeat ${trainerConfigs[trainerType].name}`);
    }

    for (let achv of voucherAchvs) {
      const voucherType = achv.score >= 150
        ? VoucherType.PREMIUM
        : achv.score >= 100
          ? VoucherType.PLUS
          : VoucherType.REGULAR;
      vouchers[achv.id] = new Voucher(voucherType, achv.description);
    }

    const voucherKeys = Object.keys(vouchers);
    for (let k of voucherKeys)
      vouchers[k].id = k;
  })();
}