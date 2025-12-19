import { globalScene } from "#app/global-scene";
import { SHINY_CATCH_RATE_MULTIPLIER } from "#balance/rates";
import { CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER } from "#balance/starters";
import type { PokemonSpeciesFilter } from "#data/pokemon-species";
import type { WeatherPoolEntry } from "#data/weather";
import { Challenges } from "#enums/challenges";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { TextStyle } from "#enums/text-style";
import { WeatherType } from "#enums/weather-type";
import type { ModifierTypeKeys } from "#modifiers/modifier-type";
import type { nil } from "#types/common";
import { addTextObject } from "#ui/text";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

export enum EventType {
  SHINY,
  NO_TIMER_DISPLAY,
  LUCK,
}

interface EventBanner {
  readonly bannerKey?: string;
  readonly xOffset?: number;
  readonly yOffset?: number;
  readonly scale?: number;
  readonly availableLangs?: readonly string[];
}

export interface EventEncounter {
  readonly species: SpeciesId;
  readonly blockEvolution?: boolean;
  readonly formIndex?: number;
}

interface EventMysteryEncounterTier {
  readonly mysteryEncounter: MysteryEncounterType;
  readonly tier?: MysteryEncounterTier;
  readonly disable?: boolean;
}

interface EventWaveReward {
  /**
   * The wave at which the reward should be given.
   * {@linkcode ClassicFixedBossWaves.RIVAL1} and {@linkcode ClassicFixedBossWaves.RIVAL2} are currently the only waves that give fixed rewards.
   */
  readonly wave: number;
  readonly type: ModifierTypeKeys;
}

type EventMusicReplacement = readonly [string, string];

interface EventChallenge {
  readonly challenge: Challenges;
  readonly value: number;
}

interface TimedEvent extends EventBanner {
  readonly name: string;
  readonly eventType: EventType;
  readonly shinyEncounterMultiplier?: number;
  readonly shinyCatchMultiplier?: number;
  readonly classicFriendshipMultiplier?: number;
  readonly luckBoost?: number;
  readonly upgradeUnlockedVouchers?: boolean;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly eventEncounters?: readonly EventEncounter[];
  readonly delibirdyBuff?: readonly string[];
  readonly weather?: readonly WeatherPoolEntry[];
  readonly mysteryEncounterTierChanges?: readonly EventMysteryEncounterTier[];
  readonly luckBoostedSpecies?: readonly SpeciesId[];
  readonly boostFusions?: boolean; //MODIFIER REWORK PLEASE
  readonly classicWaveRewards?: readonly EventWaveReward[]; // Rival battle rewards
  readonly trainerShinyChance?: number; // Odds over 65536 of trainer mon generating as shiny
  readonly music?: readonly EventMusicReplacement[];
  readonly dailyRunChallenges?: readonly EventChallenge[];
  readonly dailyRunStartingItems?: readonly ModifierTypeKeys[];
}

const timedEvents: readonly TimedEvent[] = [
  {
    name: "Winter 25",
    eventType: EventType.SHINY,
    startDate: new Date(Date.UTC(2025, 11, 19)),
    endDate: new Date(Date.UTC(2026, 0, 5)),
    bannerKey: "winter2025",
    scale: 0.19,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "es-419", "pt-BR", "zh-Hans", "zh-Hant", "da", "ru"],
    shinyEncounterMultiplier: 2,
    shinyCatchMultiplier: 3,
    upgradeUnlockedVouchers: true,
    eventEncounters: [
      { species: SpeciesId.CYNDAQUIL },
      { species: SpeciesId.SENTRET },
      { species: SpeciesId.DELIBIRD },
      { species: SpeciesId.STANTLER },
      { species: SpeciesId.SMOOCHUM },
      { species: SpeciesId.BALTOY },
      { species: SpeciesId.MAKUHITA },
      { species: SpeciesId.PIPLUP },
      { species: SpeciesId.CHINGLING },
      { species: SpeciesId.LITWICK },
      { species: SpeciesId.CHESPIN },
      { species: SpeciesId.AMAURA },
      { species: SpeciesId.COMFEY },
      { species: SpeciesId.DHELMISE },
      { species: SpeciesId.ROLYCOLY },
      { species: SpeciesId.SMOLIV },
      { species: SpeciesId.GIMMIGHOUL, blockEvolution: true },
      { species: SpeciesId.IRON_BUNDLE },
      { species: SpeciesId.ALOLA_VULPIX },
      { species: SpeciesId.GALAR_DARUMAKA },
    ],
    classicWaveRewards: [
      { wave: 8, type: "SHINY_CHARM" },
      { wave: 8, type: "ABILITY_CHARM" },
      { wave: 8, type: "CATCHING_CHARM" },
      { wave: 25, type: "SHINY_CHARM" },
    ],
    delibirdyBuff: ["CATCHING_CHARM", "SHINY_CHARM", "ABILITY_CHARM", "EXP_CHARM", "SUPER_EXP_CHARM", "HEALING_CHARM"],
    mysteryEncounterTierChanges: [
      {
        mysteryEncounter: MysteryEncounterType.DELIBIRDY,
        tier: MysteryEncounterTier.COMMON,
      },
      { mysteryEncounter: MysteryEncounterType.PART_TIMER, disable: true },
      {
        mysteryEncounter: MysteryEncounterType.DEPARTMENT_STORE_SALE,
        disable: true,
      },
    ],
    dailyRunStartingItems: ["ABILITY_CHARM", "SHINY_CHARM"],
  },
  {
    name: "Winter Holiday Update",
    eventType: EventType.SHINY,
    shinyEncounterMultiplier: 2,
    upgradeUnlockedVouchers: true,
    startDate: new Date(Date.UTC(2024, 11, 21, 0)),
    endDate: new Date(Date.UTC(2025, 0, 4, 0)),
    bannerKey: "winter_holidays2024-event",
    scale: 0.21,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "pt-BR", "zh-Hans"],
    eventEncounters: [
      { species: SpeciesId.GIMMIGHOUL, blockEvolution: true },
      { species: SpeciesId.DELIBIRD },
      { species: SpeciesId.STANTLER },
      { species: SpeciesId.CYNDAQUIL },
      { species: SpeciesId.PIPLUP },
      { species: SpeciesId.CHESPIN },
      { species: SpeciesId.BALTOY },
      { species: SpeciesId.SNOVER },
      { species: SpeciesId.CHINGLING },
      { species: SpeciesId.LITWICK },
      { species: SpeciesId.CUBCHOO },
      { species: SpeciesId.SWIRLIX },
      { species: SpeciesId.AMAURA },
      { species: SpeciesId.MUDBRAY },
      { species: SpeciesId.ROLYCOLY },
      { species: SpeciesId.MILCERY },
      { species: SpeciesId.SMOLIV },
      { species: SpeciesId.ALOLA_VULPIX },
      { species: SpeciesId.GALAR_DARUMAKA },
      { species: SpeciesId.IRON_BUNDLE },
    ],
    delibirdyBuff: ["CATCHING_CHARM", "SHINY_CHARM", "ABILITY_CHARM", "EXP_CHARM", "SUPER_EXP_CHARM", "HEALING_CHARM"],
    weather: [{ weatherType: WeatherType.SNOW, weight: 1 }],
    mysteryEncounterTierChanges: [
      {
        mysteryEncounter: MysteryEncounterType.DELIBIRDY,
        tier: MysteryEncounterTier.COMMON,
      },
      { mysteryEncounter: MysteryEncounterType.PART_TIMER, disable: true },
      {
        mysteryEncounter: MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE,
        disable: true,
      },
      { mysteryEncounter: MysteryEncounterType.FIELD_TRIP, disable: true },
      {
        mysteryEncounter: MysteryEncounterType.DEPARTMENT_STORE_SALE,
        disable: true,
      },
    ],
    classicWaveRewards: [
      { wave: 8, type: "SHINY_CHARM" },
      { wave: 8, type: "ABILITY_CHARM" },
      { wave: 8, type: "CATCHING_CHARM" },
      { wave: 25, type: "SHINY_CHARM" },
    ],
  },
  {
    name: "Year of the Snake",
    eventType: EventType.LUCK,
    luckBoost: 1,
    startDate: new Date(Date.UTC(2025, 0, 29, 0)),
    endDate: new Date(Date.UTC(2025, 1, 3, 0)),
    bannerKey: "yearofthesnakeevent",
    scale: 0.21,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "pt-BR", "zh-Hans"],
    eventEncounters: [
      { species: SpeciesId.EKANS },
      { species: SpeciesId.ONIX },
      { species: SpeciesId.DRATINI },
      { species: SpeciesId.CLEFFA },
      { species: SpeciesId.UMBREON },
      { species: SpeciesId.DUNSPARCE },
      { species: SpeciesId.TEDDIURSA },
      { species: SpeciesId.SEVIPER },
      { species: SpeciesId.LUNATONE },
      { species: SpeciesId.CHINGLING },
      { species: SpeciesId.SNIVY },
      { species: SpeciesId.DARUMAKA },
      { species: SpeciesId.DRAMPA },
      { species: SpeciesId.SILICOBRA },
      { species: SpeciesId.BLOODMOON_URSALUNA },
    ],
    luckBoostedSpecies: [
      SpeciesId.EKANS,
      SpeciesId.ARBOK,
      SpeciesId.ONIX,
      SpeciesId.STEELIX,
      SpeciesId.DRATINI,
      SpeciesId.DRAGONAIR,
      SpeciesId.DRAGONITE,
      SpeciesId.CLEFFA,
      SpeciesId.CLEFAIRY,
      SpeciesId.CLEFABLE,
      SpeciesId.UMBREON,
      SpeciesId.DUNSPARCE,
      SpeciesId.DUDUNSPARCE,
      SpeciesId.TEDDIURSA,
      SpeciesId.URSARING,
      SpeciesId.URSALUNA,
      SpeciesId.SEVIPER,
      SpeciesId.LUNATONE,
      SpeciesId.RAYQUAZA,
      SpeciesId.CHINGLING,
      SpeciesId.CHIMECHO,
      SpeciesId.CRESSELIA,
      SpeciesId.DARKRAI,
      SpeciesId.SNIVY,
      SpeciesId.SERVINE,
      SpeciesId.SERPERIOR,
      SpeciesId.DARUMAKA,
      SpeciesId.DARMANITAN,
      SpeciesId.ZYGARDE,
      SpeciesId.DRAMPA,
      SpeciesId.LUNALA,
      SpeciesId.BLACEPHALON,
      SpeciesId.SILICOBRA,
      SpeciesId.SANDACONDA,
      SpeciesId.ROARING_MOON,
      SpeciesId.BLOODMOON_URSALUNA,
    ],
    classicWaveRewards: [
      { wave: 8, type: "SHINY_CHARM" },
      { wave: 8, type: "ABILITY_CHARM" },
      { wave: 8, type: "CATCHING_CHARM" },
      { wave: 25, type: "SHINY_CHARM" },
    ],
  },
  {
    name: "Valentine",
    eventType: EventType.SHINY,
    startDate: new Date(Date.UTC(2025, 1, 10)),
    endDate: new Date(Date.UTC(2025, 1, 21)),
    boostFusions: true,
    shinyEncounterMultiplier: 2,
    bannerKey: "valentines2025event",
    scale: 0.21,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "pt-BR", "zh-Hans"],
    eventEncounters: [
      { species: SpeciesId.NIDORAN_F },
      { species: SpeciesId.NIDORAN_M },
      { species: SpeciesId.IGGLYBUFF },
      { species: SpeciesId.SMOOCHUM },
      { species: SpeciesId.VOLBEAT },
      { species: SpeciesId.ILLUMISE },
      { species: SpeciesId.ROSELIA },
      { species: SpeciesId.LUVDISC },
      { species: SpeciesId.WOOBAT },
      { species: SpeciesId.FRILLISH },
      { species: SpeciesId.ALOMOMOLA },
      { species: SpeciesId.FURFROU, formIndex: 1 }, // Heart Trim
      { species: SpeciesId.ESPURR },
      { species: SpeciesId.SPRITZEE },
      { species: SpeciesId.SWIRLIX },
      { species: SpeciesId.APPLIN },
      { species: SpeciesId.MILCERY },
      { species: SpeciesId.INDEEDEE },
      { species: SpeciesId.TANDEMAUS },
      { species: SpeciesId.ENAMORUS },
    ],
    luckBoostedSpecies: [SpeciesId.LUVDISC],
    classicWaveRewards: [
      { wave: 8, type: "SHINY_CHARM" },
      { wave: 8, type: "ABILITY_CHARM" },
      { wave: 8, type: "CATCHING_CHARM" },
      { wave: 25, type: "SHINY_CHARM" },
    ],
  },
  {
    name: "PKMNDAY2025",
    eventType: EventType.LUCK,
    startDate: new Date(Date.UTC(2025, 1, 27)),
    endDate: new Date(Date.UTC(2025, 2, 4)),
    classicFriendshipMultiplier: 4,
    bannerKey: "pkmnday2025event",
    scale: 0.21,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "pt-BR", "zh-Hans"],
    eventEncounters: [
      { species: SpeciesId.PIKACHU, formIndex: 1, blockEvolution: true }, // Partner Form
      { species: SpeciesId.EEVEE, formIndex: 1, blockEvolution: true }, // Partner Form
      { species: SpeciesId.CHIKORITA },
      { species: SpeciesId.TOTODILE },
      { species: SpeciesId.TEPIG },
    ],
    luckBoostedSpecies: [
      SpeciesId.PICHU,
      SpeciesId.PIKACHU,
      SpeciesId.RAICHU,
      SpeciesId.ALOLA_RAICHU,
      SpeciesId.PSYDUCK,
      SpeciesId.GOLDUCK,
      SpeciesId.EEVEE,
      SpeciesId.FLAREON,
      SpeciesId.JOLTEON,
      SpeciesId.VAPOREON,
      SpeciesId.ESPEON,
      SpeciesId.UMBREON,
      SpeciesId.LEAFEON,
      SpeciesId.GLACEON,
      SpeciesId.SYLVEON,
      SpeciesId.CHIKORITA,
      SpeciesId.BAYLEEF,
      SpeciesId.MEGANIUM,
      SpeciesId.TOTODILE,
      SpeciesId.CROCONAW,
      SpeciesId.FERALIGATR,
      SpeciesId.TEPIG,
      SpeciesId.PIGNITE,
      SpeciesId.EMBOAR,
      SpeciesId.ZYGARDE,
      SpeciesId.ETERNAL_FLOETTE,
    ],
    classicWaveRewards: [
      { wave: 8, type: "SHINY_CHARM" },
      { wave: 8, type: "ABILITY_CHARM" },
      { wave: 8, type: "CATCHING_CHARM" },
      { wave: 25, type: "SHINY_CHARM" },
    ],
  },
  {
    name: "April Fools 2025",
    eventType: EventType.LUCK,
    startDate: new Date(Date.UTC(2025, 2, 31)),
    endDate: new Date(Date.UTC(2025, 3, 3)),
    bannerKey: "aprf25",
    scale: 0.21,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "es-419", "pt-BR", "zh-Hans"],
    trainerShinyChance: 13107, // 13107/65536 = 1/5
    music: [
      ["title", "title_afd"],
      ["battle_rival_3", "battle_rival_3_afd"],
    ],
    dailyRunChallenges: [
      {
        challenge: Challenges.INVERSE_BATTLE,
        value: 1,
      },
    ],
  },
  {
    name: "Shining Spring",
    eventType: EventType.SHINY,
    startDate: new Date(Date.UTC(2025, 4, 3)),
    endDate: new Date(Date.UTC(2025, 4, 13)),
    bannerKey: "spr25event",
    scale: 0.21,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "es-419", "pt-BR", "zh-Hans"],
    shinyEncounterMultiplier: 2,
    upgradeUnlockedVouchers: true,
    eventEncounters: [
      { species: SpeciesId.HOPPIP },
      { species: SpeciesId.CELEBI },
      { species: SpeciesId.VOLBEAT },
      { species: SpeciesId.ILLUMISE },
      { species: SpeciesId.SPOINK },
      { species: SpeciesId.LILEEP },
      { species: SpeciesId.SHINX },
      { species: SpeciesId.PACHIRISU },
      { species: SpeciesId.CHERUBI },
      { species: SpeciesId.MUNCHLAX },
      { species: SpeciesId.TEPIG },
      { species: SpeciesId.PANSAGE },
      { species: SpeciesId.PANSEAR },
      { species: SpeciesId.PANPOUR },
      { species: SpeciesId.DARUMAKA },
      { species: SpeciesId.ARCHEN },
      { species: SpeciesId.DEERLING, formIndex: 0 }, // Spring Deerling
      { species: SpeciesId.CLAUNCHER },
      { species: SpeciesId.WISHIWASHI },
      { species: SpeciesId.DRAMPA },
      { species: SpeciesId.JANGMO_O },
      { species: SpeciesId.APPLIN },
    ],
    classicWaveRewards: [
      { wave: 8, type: "SHINY_CHARM" },
      { wave: 8, type: "ABILITY_CHARM" },
      { wave: 8, type: "CATCHING_CHARM" },
      { wave: 25, type: "SHINY_CHARM" },
    ],
  },
  {
    name: "Pride 25",
    eventType: EventType.SHINY,
    startDate: new Date(Date.UTC(2025, 5, 18)),
    endDate: new Date(Date.UTC(2025, 5, 30)),
    bannerKey: "pride2025",
    scale: 0.105,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "es-419", "pt-BR", "zh-Hans", "zh-Hant"],
    shinyEncounterMultiplier: 2,
    eventEncounters: [
      { species: SpeciesId.CHARMANDER },
      { species: SpeciesId.SANDILE },
      { species: SpeciesId.FERROSEED },
      { species: SpeciesId.FOONGUS },
      { species: SpeciesId.CUTIEFLY },
      { species: SpeciesId.DEWPIDER },
      { species: SpeciesId.TYPE_NULL },
      { species: SpeciesId.MINIOR },
      { species: SpeciesId.SOBBLE },
      { species: SpeciesId.INDEEDEE },
      { species: SpeciesId.CAPSAKID },
      { species: SpeciesId.ALOLA_MEOWTH },
    ],
    classicWaveRewards: [
      { wave: 8, type: "SHINY_CHARM" },
      { wave: 8, type: "ABILITY_CHARM" },
      { wave: 8, type: "CATCHING_CHARM" },
      { wave: 25, type: "SHINY_CHARM" },
    ],
    dailyRunStartingItems: ["SHINY_CHARM", "ABILITY_CHARM"],
  },
  {
    name: "Halloween 25",
    eventType: EventType.SHINY,
    startDate: new Date(Date.UTC(2025, 9, 30)),
    endDate: new Date(Date.UTC(2025, 10, 12)),
    bannerKey: "halloween2025",
    scale: 0.19,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "es-419", "pt-BR", "zh-Hans", "zh-Hant", "da", "ru"],
    shinyEncounterMultiplier: 2,
    shinyCatchMultiplier: 3,
    eventEncounters: [
      { species: SpeciesId.CATERPIE },
      { species: SpeciesId.SPEAROW },
      { species: SpeciesId.PARAS },
      { species: SpeciesId.LICKITUNG },
      { species: SpeciesId.AERODACTYL },
      { species: SpeciesId.SMOOCHUM },
      { species: SpeciesId.RALTS },
      { species: SpeciesId.GULPIN },
      { species: SpeciesId.FEEBAS },
      { species: SpeciesId.WYNAUT },
      { species: SpeciesId.CLAMPERL },
      { species: SpeciesId.BUDEW },
      { species: SpeciesId.DEOXYS },
      { species: SpeciesId.CHINGLING },
      { species: SpeciesId.DWEBBLE },
      { species: SpeciesId.TIRTOUGA },
      { species: SpeciesId.LARVESTA },
      { species: SpeciesId.SPRITZEE },
      { species: SpeciesId.SWIRLIX },
      { species: SpeciesId.BINACLE },
      { species: SpeciesId.PUMPKABOO },
      { species: SpeciesId.SANDYGAST },
    ],
    classicWaveRewards: [
      { wave: 8, type: "SHINY_CHARM" },
      { wave: 8, type: "ABILITY_CHARM" },
      { wave: 8, type: "CATCHING_CHARM" },
      { wave: 25, type: "SHINY_CHARM" },
      { wave: 25, type: "CANDY_JAR" },
    ],
    dailyRunStartingItems: ["ABILITY_CHARM", "SHINY_CHARM", "CANDY_JAR"],
  },
];

export class TimedEventManager {
  isActive(event: TimedEvent) {
    const now = new Date();
    return event.startDate < now && now < event.endDate;
  }

  /**
   * For getting the active event
   * @returns The first active {@linkcode TimedEvent} or `undefined` if there are no active events
   */
  activeEvent(): TimedEvent | undefined {
    return timedEvents.find((te: TimedEvent) => this.isActive(te));
  }

  isEventActive(): boolean {
    return timedEvents.some((te: TimedEvent) => this.isActive(te));
  }

  /**
   * Check whether the current {@linkcode TimedEvent} is active and for April Fools.
   * @returns Whether the April Fools event is currently active.
   */
  isAprilFoolsActive(): boolean {
    return this.activeEvent()?.bannerKey?.startsWith("aprf") ?? false;
  }

  activeEventHasBanner(): boolean {
    return this.activeEvent()?.bannerKey != null;
  }

  /**
   * Get the multiplier for shiny encounters during a shiny {@linkcode TimedEvent}
   * @returns the shiny encounter multiplier
   */
  getShinyEncounterMultiplier(): number {
    return this.activeEvent()?.shinyEncounterMultiplier ?? 1;
  }

  /**
   * Get the multiplier for shiny catches during a shiny {@linkcode TimedEvent}
   * @returns the shiny catch multiplier
   */
  getShinyCatchMultiplier(): number {
    return this.activeEvent()?.shinyCatchMultiplier ?? SHINY_CATCH_RATE_MULTIPLIER;
  }

  getEventBannerFilename(): string {
    return this.activeEvent()?.bannerKey ?? "";
  }

  getEventBannerLangs(): string[] {
    return [...(this.activeEvent()?.availableLangs ?? [])];
  }

  getEventEncounters(): EventEncounter[] {
    return [...(this.activeEvent()?.eventEncounters ?? [])];
  }

  getAllValidEventEncounters(
    allowSubLegendary = true,
    allowLegendary = true,
    allowMythical = true,
    speciesFilter: PokemonSpeciesFilter,
  ): EventEncounter[] {
    return this.getEventEncounters().filter(enc => {
      const species = getPokemonSpecies(enc.species);
      return (
        (allowSubLegendary || !species.subLegendary)
        && (allowLegendary || !species.legendary)
        && (allowMythical || !species.mythical)
        && speciesFilter(species)
      );
    });
  }

  /**
   * For events that change the classic candy friendship multiplier
   * @returns The classic friendship multiplier of the active {@linkcode TimedEvent}, or the default {@linkcode CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER}
   */
  getClassicFriendshipMultiplier(): number {
    return this.activeEvent()?.classicFriendshipMultiplier ?? CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER;
  }

  /**
   * For events where defeated bosses (Gym Leaders, E4 etc) give out Voucher Plus even if they were defeated before
   * @returns Whether vouchers should be upgraded
   */
  getUpgradeUnlockedVouchers(): boolean {
    return this.activeEvent()?.upgradeUnlockedVouchers ?? false;
  }

  /**
   * For events where Delibirdy gives extra items
   * @returns list of ids of {@linkcode ModifierType}s that Delibirdy hands out as a bonus
   */
  getDelibirdyBuff(): string[] {
    return [...(this.activeEvent()?.delibirdyBuff ?? [])];
  }

  /**
   * For events where there's a set weather for town biome (other biomes are hard)
   * @returns Event weathers for town
   */
  getWeather(): WeatherPoolEntry[] {
    return [...(this.activeEvent()?.weather ?? [])];
  }

  getAllMysteryEncounterChanges(): EventMysteryEncounterTier[] {
    const ret: EventMysteryEncounterTier[] = [];
    for (const te of timedEvents) {
      if (this.isActive(te) && te.mysteryEncounterTierChanges != null) {
        ret.push(...te.mysteryEncounterTierChanges);
      }
    }
    return ret;
  }

  getEventMysteryEncountersDisabled(): MysteryEncounterType[] {
    const ret: MysteryEncounterType[] = [];
    const metChanges = this.activeEvent()?.mysteryEncounterTierChanges ?? [];
    for (const metc of metChanges) {
      if (metc.disable) {
        ret.push(metc.mysteryEncounter);
      }
    }
    return ret;
  }

  getMysteryEncounterTierForEvent(
    encounterType: MysteryEncounterType,
    normal: MysteryEncounterTier,
  ): MysteryEncounterTier {
    const metChanges = this.activeEvent()?.mysteryEncounterTierChanges ?? [];
    for (const metc of metChanges) {
      if (metc.mysteryEncounter === encounterType) {
        return metc.tier ?? normal;
      }
    }
    return normal;
  }

  getEventLuckBoost(): number {
    return this.activeEvent()?.luckBoost ?? 0;
  }

  getEventLuckBoostedSpecies(): SpeciesId[] {
    return [...(this.activeEvent()?.luckBoostedSpecies ?? [])];
  }

  areFusionsBoosted(): boolean {
    return this.activeEvent()?.boostFusions ?? false;
  }

  /**
   * Gets all the modifier types associated with a certain wave during an event
   * @see EventWaveReward
   * @param wave the wave to check for associated rewards
   * @returns array of strings of the event modifier reward types
   */
  getFixedBattleEventRewards(wave: number): ModifierTypeKeys[] {
    return (
      this.activeEvent()
        ?.classicWaveRewards?.filter(cwr => cwr.wave === wave)
        .map(cwr => cwr.type) ?? []
    );
  }

  /**
   * Get the extra shiny chance for trainers due to event
   */
  getClassicTrainerShinyChance(): number {
    return this.activeEvent()?.trainerShinyChance ?? 0;
  }

  getEventBgmReplacement(bgm: string): string {
    const eventMusicReplacements = this.activeEvent()?.music ?? [];
    for (const emr of eventMusicReplacements) {
      if (emr[0] === bgm) {
        console.log(`it is ${this.activeEvent()?.name} so instead of ${emr[0]} we play ${emr[1]}`);
        return emr[1];
      }
    }
    return bgm;
  }

  /**
   * Activate any challenges on {@linkcode globalScene.gameMode} for the currently active event
   */
  startEventChallenges(): void {
    for (const eventChal of this.activeEvent()?.dailyRunChallenges ?? []) {
      globalScene.gameMode.setChallengeValue(eventChal.challenge, eventChal.value);
    }
  }

  getEventDailyStartingItems(): readonly ModifierTypeKeys[] {
    return this.activeEvent()?.dailyRunStartingItems ?? [];
  }
}

export class TimedEventDisplay extends Phaser.GameObjects.Container {
  private event: TimedEvent | nil;
  private eventTimerText: Phaser.GameObjects.Text;
  private banner: Phaser.GameObjects.Image;
  private availableWidth: number;
  private eventTimer: NodeJS.Timeout | null;

  constructor(x: number, y: number, event?: TimedEvent) {
    super(globalScene, x, y);
    this.availableWidth = globalScene.scaledCanvas.width;
    this.event = event;
    this.setVisible(false);
  }

  /**
   * Set the width that can be used to display the event timer and banner. By default
   * these elements get centered horizontally in that space, in the bottom left of the screen
   */
  setWidth(width: number) {
    if (width !== this.availableWidth) {
      this.availableWidth = width;
      const xPosition = this.availableWidth / 2 + (this.event?.xOffset ?? 0);
      if (this.banner) {
        this.banner.x = xPosition;
      }
      if (this.eventTimerText) {
        this.eventTimerText.x = xPosition;
      }
    }
  }

  setup() {
    const lang = i18next.resolvedLanguage;
    if (this.event?.bannerKey) {
      let key = this.event.bannerKey;
      if (lang && this.event.availableLangs && this.event.availableLangs.length > 0) {
        if (this.event.availableLangs.includes(lang)) {
          key += "-" + lang;
        } else {
          key += "-en";
        }
      }
      console.log(key);
      console.log(this.event.bannerKey);
      const padding = 5;
      const showTimer = this.event.eventType !== EventType.NO_TIMER_DISPLAY;
      const yPosition = globalScene.scaledCanvas.height - padding - (showTimer ? 10 : 0) - (this.event.yOffset ?? 0);
      this.banner = new Phaser.GameObjects.Image(globalScene, this.availableWidth / 2, yPosition - padding, key);
      this.banner.setName("img-event-banner");
      this.banner.setOrigin(0.5, 1);
      this.banner.setScale(this.event.scale ?? 0.18);
      if (showTimer) {
        this.eventTimerText = addTextObject(
          this.banner.x,
          this.banner.y + 2,
          this.timeToGo(this.event.endDate),
          TextStyle.WINDOW,
        );
        this.eventTimerText.setName("text-event-timer");
        this.eventTimerText.setScale(0.15);
        this.eventTimerText.setOrigin(0.5, 0);

        this.add(this.eventTimerText);
      }
      this.add(this.banner);
    }
  }

  show() {
    this.setVisible(true);
    this.updateCountdown();

    this.eventTimer = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  clear() {
    this.setVisible(false);
    this.eventTimer && clearInterval(this.eventTimer);
    this.eventTimer = null;
  }

  private timeToGo(date: Date) {
    // Utility to add leading zero
    function z(n) {
      return (n < 10 ? "0" : "") + n;
    }
    const now = new Date();
    let diff = Math.abs(date.getTime() - now.getTime());

    // Allow for previous times
    diff = Math.abs(diff);

    // Get time components
    const days = (diff / 8.64e7) | 0;
    const hours = ((diff % 8.64e7) / 3.6e6) | 0;
    const mins = ((diff % 3.6e6) / 6e4) | 0;
    const secs = Math.round((diff % 6e4) / 1e3);

    // Return formatted string
    return i18next.t("menu:eventTimer", {
      days: z(days),
      hours: z(hours),
      mins: z(mins),
      secs: z(secs),
    });
  }

  updateCountdown() {
    if (this.event && this.event.eventType !== EventType.NO_TIMER_DISPLAY) {
      this.eventTimerText.setText(this.timeToGo(this.event.endDate));
    }
  }
}
