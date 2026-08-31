import { globalScene } from "#app/global-scene";
import type { RewardId } from "#enums/reward-id";
import type { VoucherType } from "#enums/voucher-type";
import { Reward } from "#items/reward";
import { getVoucherTypeIcon, getVoucherTypeName } from "#system/voucher";
import i18next from "i18next";

export class AddVoucherReward extends Reward {
  private voucherType: VoucherType;
  private count: number;

  constructor(voucherType: VoucherType, count: number, id: RewardId) {
    super("", getVoucherTypeIcon(voucherType), "voucher");
    this.count = count;
    this.voucherType = voucherType;
    this.id = id;
  }

  get name(): string {
    return i18next.t("reward:addVoucher.name", {
      modifierCount: this.count,
      voucherTypeName: getVoucherTypeName(this.voucherType),
    });
  }

  get description(): string {
    return i18next.t("reward:addVoucher.description", {
      modifierCount: this.count,
      voucherTypeName: getVoucherTypeName(this.voucherType),
    });
  }

  /**
   * Applies {@linkcode AddVoucherReward}
   * @param battleScene {@linkcode BattleScene}
   * @returns always `true`
   */
  apply(): boolean {
    const voucherCounts = globalScene.gameData.voucherCounts;
    voucherCounts[this.voucherType] += this.count;

    return true;
  }
}
