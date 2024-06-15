import BattleScene from "../battle-scene";
import { TrainerType } from "../data/enums/trainer-type";
import i18next from "../plugins/i18n";
import { Achv, AchvTier, achvs, getAchievementDescription } from "./achv";
import { PlayerGender } from "#app/data/enums/player-gender";

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
  public icon: string;

  private conditionFunc: (scene: BattleScene, args: any[]) => boolean;

  constructor(voucherType: VoucherType, description: string, icon: string, conditionFunc?: (scene: BattleScene, args: any[]) => boolean) {
    this.description = description;
    this.voucherType = voucherType;
    this.conditionFunc = conditionFunc;
    this.icon = icon;
  }

  validate(scene: BattleScene, args: any[]): boolean {
    return !this.conditionFunc || this.conditionFunc(scene, args);
  }

  /**
   * Get the name of the voucher
   * @param playerGender - this is ignored here. It's only there to match the signature of the function in the Achv class
   * @returns the name of the voucher
   */
  getName(playerGender: PlayerGender): string {
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

const gymBadges = {
  "Brock":"boulder_badge", //Kanto
  "Misty":"cascade_badge",
  "Lt Surge":"thunder_badge",
  "Erika":"rainbow_badge",
  "Janine":"soul_badge",
  "Sabrina":"marsh_badge",
  "Blaine":"volcano_badge",
  "Giovanni":"earth_badge",
  "Blue":"earth_badge",
  "Falkner":"zephyr_badge", //Johto
  "Bugsy":"hive_badge",
  "Whitney":"plain_badge",
  "Morty":"fog_badge",
  "Chuck":"storm_badge",
  "Jasmine":"mineral_badge",
  "Pryce":"glacier_badge",
  "Clair":"rising_badge",
  "Roxanne":"stone_badge", //Hoenn
  "Brawly":"knuckle_badge",
  "Wattson":"dynamo_badge",
  "Flannery":"heat_badge",
  "Norman":"balance_badge",
  "Winona":"feather_badge",
  "Tate":"mind_badge_p1",
  "Liza":"mind_badge_p2",
  "Tate and Liza":"mind_badge",
  "Juan":"rain_badge",
  "Roark":"coal_badge", //Sinnoh
  "Gardenia":"forest_badge",
  "Maylene":"cobble_badge",
  "Crasher Wake":"fen_badge",
  "Fantina":"relic_badge",
  "Byron":"mine_badge",
  "Candice":"icicle_badge",
  "Volkner":"beacon_badge",
};

/*
  
  "Cilan":"trio_badge_cilan", //Unova
  "Chili":"trio_badge_chili",
  "Cress":"trio_badge_cress",
  "Lenora":"basic_badge",
  "Burgh":"insect_badge",
  "Elesa":"volt_badge",
  "Clay":"quake_badge",
  "Skyla":"jet_badge",
  "Brycen":"freeze_badge",
  "Drayden":"legend_badge",
  "Iris":"legend_badge",
  "Cheren":"basic_badge",
  "Roxie":"toxic_badge",
  "Marlon":"wave_badge",
  "Viola":"bug_badge_kalos", //Kalos
  "Grant":"cliff_badge",
  "Korrina":"rumble_badge",
  "Ramos":"plant_badge",
  "Clemont":"voltage_badge",
  "Valerie":"fairy_badge_kalos",
  "Olympia":"psychic_badge_kalos",
  "Wulfric":"iceberg_badge",
  "Ilima":"normalium_z", //Alola
  "Hala":"fightinium_z",
  "Lana":"waterium_z",
  "Kiawe":"firium_z",
  "Mallow":"grassium_z",
  "Olivia":"rockium_z",
  "Sophocles":"electrium_z",
  "Acerola":"ghostium_z",
  "Nanu":"darkinium_z",
  "Mina":"fairium_z",
  "Hapu":"groundium_z",
  "Milo":"grass_badge_galar", //Galar
  "Nessa":"water_badge_galar",
  "Kabu":"fire_badge_galar",
  "Bea":"fighting_badge_galar",
  "Allister":"ghost_badge_galar",
  "Opal":"fairy_badge_galar",
  "Bede":"fairy_badge_galar",
  "Gordie":"rock_badge_galar",
  "Melony":"ice_badge_galar",
  "Piers":"dark_badge_galar",
  "Marnie":"dark_badge_galar",
  "Raihan":"dragon_badge_galar",
  "Katy":"bug_badge_paldea", //Paldea
  "Brassius":"grass_badge_paldea",
  "Iono":"electric_badge_paldea",
  "Kofu":"water_badge_paldea",
  "Larry":"normal_badge_paldea",
  "Ryme":"ghost_badge_paldea",
  "Tulip":"psychic_badge_paldea",
  "Grusha":"ice_badge_paldea"
};
*/
const teamBosses = {
  "Giovanni":"",
  "Archie":"",
  "Maxie":"",
  "Cyrus":"",
  "Ghetsis":"",
  "Lysandre":"",
  "Lusamine":""
};

export function initVouchers() {
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
      const trainer = trainerConfigs[trainerType];
      const title = trainer.title ? ` (${trainer.title})` : "";
      let icon = "";
      switch (trainer.title) {
      case "Gym Leader":
      case "Trial Captain":
      case "Kahuna":
        icon = gymBadges[trainerName];
        break;
      case "Elite Four":
      case "Champion":
        break;
      default:
        if (title.includes("Boss")) {
          icon = teamBosses[trainerName];
        }
        break;
      }
      vouchers[key] = new Voucher(
        voucherType,
        `${i18next.t("voucher:defeatTrainer", { trainerName })} ${title}`, icon
      );
    }
    const voucherKeys = Object.keys(vouchers);
    for (const k of voucherKeys) {
      vouchers[k].id = k;
    }
  });
}
