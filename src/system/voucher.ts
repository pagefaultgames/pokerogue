import i18next from "i18next";
import { AchvTier, achvs, getAchievementDescription } from "./achv";
import type { PlayerGender } from "#enums/player-gender";
import { TrainerType } from "#enums/trainer-type";
import type { ConditionFn } from "#app/@types/common";
import { trainerConfigs } from "#app/data/trainers/trainer-config";

export enum VoucherType {
  REGULAR,
  PLUS,
  PREMIUM,
  GOLDEN,
}

const VoucherTypeNames: Record<VoucherType, string> = {
  [VoucherType.REGULAR]: "voucher:eggVoucher",
  [VoucherType.PLUS]: "voucher:eggVoucherPlus",
  [VoucherType.PREMIUM]: "voucher:eggVoucherPremium",
  [VoucherType.GOLDEN]: "voucher:eggVoucherGold",
};

const VoucherTypeIcons: Record<VoucherType, string> = {
  [VoucherType.REGULAR]: "coupon",
  [VoucherType.PLUS]: "pair_of_tickets",
  [VoucherType.PREMIUM]: "mystic_ticket",
  [VoucherType.GOLDEN]: "golden_mystic_ticket",
};

const VoucherTiers: Record<VoucherType, AchvTier> = {
  [VoucherType.REGULAR]: AchvTier.COMMON,
  [VoucherType.PLUS]: AchvTier.GREAT,
  [VoucherType.PREMIUM]: AchvTier.ULTRA,
  [VoucherType.GOLDEN]: AchvTier.ROGUE,
};

export class Voucher {
  public id = "";
  constructor(
    public voucherType: VoucherType,
    public description: string,
    private conditionFunc?: ConditionFn,
  ) {}

  validate(args?: any[]): boolean {
    return !this.conditionFunc || this.conditionFunc(args);
  }

  getName(_playerGender: PlayerGender): string {
    return getVoucherTypeName(this.voucherType);
  }

  getIconImage(): string {
    return getVoucherTypeIcon(this.voucherType);
  }

  getTier(): AchvTier {
    return VoucherTiers[this.voucherType];
  }
}

export function getVoucherTypeName(voucherType: VoucherType): string {
  return i18next.t(VoucherTypeNames[voucherType]);
}

export function getVoucherTypeIcon(voucherType: VoucherType): string {
  return VoucherTypeIcons[voucherType];
}

export interface Vouchers {
  [key: string]: Voucher;
}

export const vouchers: Vouchers = {};

export function initVouchers() {
  const getVoucherTypeByScore = (score: number): VoucherType => {
    if (score >= 150) return VoucherType.GOLDEN;
    if (score >= 100) return VoucherType.PREMIUM;
    if (score >= 75) return VoucherType.PLUS;
    return VoucherType.REGULAR;
  };

  vouchers[achvs.CLASSIC_VICTORY.id] = new Voucher(
    getVoucherTypeByScore(achvs.CLASSIC_VICTORY.score),
    getAchievementDescription(achvs.CLASSIC_VICTORY.localizationKey),
  );

  for (const [key, config] of Object.entries(trainerConfigs)) {
    if (
      config.isBoss &&
      config.getDerivedType() !== TrainerType.RIVAL &&
      config.hasVoucher
    ) {
      const voucherType = config.moneyMultiplier < 10 ? VoucherType.PLUS : VoucherType.PREMIUM;
      const title = config.title ? ` (${config.title})` : "";
      vouchers[TrainerType[key as keyof typeof TrainerType]] = new Voucher(
        voucherType,
        `${i18next.t("voucher:defeatTrainer", { trainerName: config.name })}${title}`,
      );
    }
  }

  for (const [key, voucher] of Object.entries(vouchers)) {
    voucher.id = key;
  }
}
