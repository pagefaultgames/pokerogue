import BattleScene from "../battle-scene";
import { TrainerType } from "../data/enums/trainer-type";
import i18next from "../plugins/i18n";
import { Achv, AchvTier, achvs, getAchievementDescription } from "./achv";

export enum VoucherType {
  REGULAR,
  PLUS,
  PREMIUM,
  GOLDEN
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

  getTier(): AchvTier {
    switch (this.voucherType) {
    case VoucherType.REGULAR:
      return AchvTier.COMMON;
    case VoucherType.PLUS:
      return AchvTier.GREAT;
    case VoucherType.PREMIUM:
      return AchvTier.ULTRA;
    case VoucherType.GOLDEN:
      return AchvTier.ROGUE;
    }
  }
}

export function getVoucherTypeName(voucherType: VoucherType): string {
  switch (voucherType) {
  case VoucherType.REGULAR:
    return i18next.t("voucher:eggVoucher");
  case VoucherType.PLUS:
    return i18next.t("voucher:eggVoucherPlus");
  case VoucherType.PREMIUM:
    return i18next.t("voucher:eggVoucherPremium");
  case VoucherType.GOLDEN:
    return i18next.t("voucher:eggVoucherGold");
  }
}

export function getVoucherTypeIcon(voucherType: VoucherType): string {
  switch (voucherType) {
  case VoucherType.REGULAR:
    return "coupon";
  case VoucherType.PLUS:
    return "pair_of_tickets";
  case VoucherType.PREMIUM:
    return "mystic_ticket";
  case VoucherType.GOLDEN:
    return "golden_mystic_ticket";
  }
}

export interface Vouchers {
  [key: string]: Voucher;
}

export const vouchers: Vouchers = {};

const voucherAchvs: Achv[] = [ achvs.CLASSIC_VICTORY ];

{
  (function() {
    import("../data/trainer-config").then(tc => {
      const trainerConfigs = tc.trainerConfigs;

      for (const achv of voucherAchvs) {
        const voucherType = achv.score >= 150
          ? VoucherType.GOLDEN
          : achv.score >= 100
            ? VoucherType.PREMIUM
            : achv.score >= 75
              ? VoucherType.PLUS
              : VoucherType.REGULAR;
        vouchers[achv.id] = new Voucher(voucherType, getAchievementDescription(achv.localizationKey));
      }

      const bossTrainerTypes = Object.keys(trainerConfigs)
        .filter(tt => trainerConfigs[tt].isBoss && trainerConfigs[tt].getDerivedType() !== TrainerType.RIVAL);

      for (const trainerType of bossTrainerTypes) {
        const voucherType = trainerConfigs[trainerType].moneyMultiplier < 10
          ? VoucherType.PLUS
          : VoucherType.PREMIUM;
        const key = TrainerType[trainerType];
        const trainerName = trainerConfigs[trainerType].name;
        vouchers[key] = new Voucher(
          voucherType,
          i18next.t("voucher:defeatTrainer", { trainerName })
        );
      }

      const voucherKeys = Object.keys(vouchers);
      for (const k of voucherKeys) {
        vouchers[k].id = k;
      }
    });
  })();
}
