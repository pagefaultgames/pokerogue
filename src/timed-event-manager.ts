import { globalScene } from "#app/global-scene";
import { TextStyle, addTextObject } from "#app/ui/text";
import type { nil } from "#app/utils/common";
import { isNullOrUndefined } from "#app/utils/common";
import i18next from "i18next";
import { Species } from "#enums/species";
import type { WeatherPoolEntry } from "#app/data/weather";
import { WeatherType } from "#enums/weather-type";
import { CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER } from "./data/balance/starters";
import { MysteryEncounterType } from "./enums/mystery-encounter-type";
import { MysteryEncounterTier } from "./enums/mystery-encounter-tier";
import { Challenges } from "#enums/challenges";

export enum EventType {
  SHINY,
  NO_TIMER_DISPLAY,
  LUCK,
}

interface EventBanner {
  bannerKey?: string;
  xOffset?: number;
  yOffset?: number;
  scale?: number;
  availableLangs?: string[];
}

interface EventEncounter {
  species: Species;
  blockEvolution?: boolean;
  formIndex?: number;
}

interface EventMysteryEncounterTier {
  mysteryEncounter: MysteryEncounterType;
  tier?: MysteryEncounterTier;
  disable?: boolean;
}

interface EventWaveReward {
  wave: number;
  type: string;
}

type EventMusicReplacement = [string, string];

interface EventChallenge {
  challenge: Challenges;
  value: number;
}

interface TimedEvent extends EventBanner {
  name: string;
  eventType: EventType;
  shinyMultiplier?: number;
  classicFriendshipMultiplier?: number;
  luckBoost?: number;
  upgradeUnlockedVouchers?: boolean;
  startDate: Date;
  endDate: Date;
  eventEncounters?: EventEncounter[];
  delibirdyBuff?: string[];
  weather?: WeatherPoolEntry[];
  mysteryEncounterTierChanges?: EventMysteryEncounterTier[];
  luckBoostedSpecies?: Species[];
  boostFusions?: boolean; //MODIFIER REWORK PLEASE
  classicWaveRewards?: EventWaveReward[]; // Rival battle rewards
  trainerShinyChance?: number; // Odds over 65536 of trainer mon generating as shiny
  music?: EventMusicReplacement[];
  dailyRunChallenges?: EventChallenge[];
}

const timedEvents: TimedEvent[] = [
  {
    name: "Winter Holiday Update",
    eventType: EventType.SHINY,
    shinyMultiplier: 2,
    upgradeUnlockedVouchers: true,
    startDate: new Date(Date.UTC(2024, 11, 21, 0)),
    endDate: new Date(Date.UTC(2025, 0, 4, 0)),
    bannerKey: "winter_holidays2024-event",
    scale: 0.21,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "pt-BR", "zh-CN"],
    eventEncounters: [
      { species: Species.GIMMIGHOUL, blockEvolution: true },
      { species: Species.DELIBIRD },
      { species: Species.STANTLER },
      { species: Species.CYNDAQUIL },
      { species: Species.PIPLUP },
      { species: Species.CHESPIN },
      { species: Species.BALTOY },
      { species: Species.SNOVER },
      { species: Species.CHINGLING },
      { species: Species.LITWICK },
      { species: Species.CUBCHOO },
      { species: Species.SWIRLIX },
      { species: Species.AMAURA },
      { species: Species.MUDBRAY },
      { species: Species.ROLYCOLY },
      { species: Species.MILCERY },
      { species: Species.SMOLIV },
      { species: Species.ALOLA_VULPIX },
      { species: Species.GALAR_DARUMAKA },
      { species: Species.IRON_BUNDLE },
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
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "pt-BR", "zh-CN"],
    eventEncounters: [
      { species: Species.EKANS },
      { species: Species.ONIX },
      { species: Species.DRATINI },
      { species: Species.CLEFFA },
      { species: Species.UMBREON },
      { species: Species.DUNSPARCE },
      { species: Species.TEDDIURSA },
      { species: Species.SEVIPER },
      { species: Species.LUNATONE },
      { species: Species.CHINGLING },
      { species: Species.SNIVY },
      { species: Species.DARUMAKA },
      { species: Species.DRAMPA },
      { species: Species.SILICOBRA },
      { species: Species.BLOODMOON_URSALUNA },
    ],
    luckBoostedSpecies: [
      Species.EKANS,
      Species.ARBOK,
      Species.ONIX,
      Species.STEELIX,
      Species.DRATINI,
      Species.DRAGONAIR,
      Species.DRAGONITE,
      Species.CLEFFA,
      Species.CLEFAIRY,
      Species.CLEFABLE,
      Species.UMBREON,
      Species.DUNSPARCE,
      Species.DUDUNSPARCE,
      Species.TEDDIURSA,
      Species.URSARING,
      Species.URSALUNA,
      Species.SEVIPER,
      Species.LUNATONE,
      Species.RAYQUAZA,
      Species.CHINGLING,
      Species.CHIMECHO,
      Species.CRESSELIA,
      Species.DARKRAI,
      Species.SNIVY,
      Species.SERVINE,
      Species.SERPERIOR,
      Species.DARUMAKA,
      Species.DARMANITAN,
      Species.ZYGARDE,
      Species.DRAMPA,
      Species.LUNALA,
      Species.BLACEPHALON,
      Species.SILICOBRA,
      Species.SANDACONDA,
      Species.ROARING_MOON,
      Species.BLOODMOON_URSALUNA,
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
    shinyMultiplier: 2,
    bannerKey: "valentines2025event",
    scale: 0.21,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "pt-BR", "zh-CN"],
    eventEncounters: [
      { species: Species.NIDORAN_F },
      { species: Species.NIDORAN_M },
      { species: Species.IGGLYBUFF },
      { species: Species.SMOOCHUM },
      { species: Species.VOLBEAT },
      { species: Species.ILLUMISE },
      { species: Species.ROSELIA },
      { species: Species.LUVDISC },
      { species: Species.WOOBAT },
      { species: Species.FRILLISH },
      { species: Species.ALOMOMOLA },
      { species: Species.FURFROU, formIndex: 1 }, // Heart Trim
      { species: Species.ESPURR },
      { species: Species.SPRITZEE },
      { species: Species.SWIRLIX },
      { species: Species.APPLIN },
      { species: Species.MILCERY },
      { species: Species.INDEEDEE },
      { species: Species.TANDEMAUS },
      { species: Species.ENAMORUS },
    ],
    luckBoostedSpecies: [Species.LUVDISC],
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
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "pt-BR", "zh-CN"],
    eventEncounters: [
      { species: Species.PIKACHU, formIndex: 1, blockEvolution: true }, // Partner Form
      { species: Species.EEVEE, formIndex: 1, blockEvolution: true }, // Partner Form
      { species: Species.CHIKORITA },
      { species: Species.TOTODILE },
      { species: Species.TEPIG },
    ],
    luckBoostedSpecies: [
      Species.PICHU,
      Species.PIKACHU,
      Species.RAICHU,
      Species.ALOLA_RAICHU,
      Species.PSYDUCK,
      Species.GOLDUCK,
      Species.EEVEE,
      Species.FLAREON,
      Species.JOLTEON,
      Species.VAPOREON,
      Species.ESPEON,
      Species.UMBREON,
      Species.LEAFEON,
      Species.GLACEON,
      Species.SYLVEON,
      Species.CHIKORITA,
      Species.BAYLEEF,
      Species.MEGANIUM,
      Species.TOTODILE,
      Species.CROCONAW,
      Species.FERALIGATR,
      Species.TEPIG,
      Species.PIGNITE,
      Species.EMBOAR,
      Species.ZYGARDE,
      Species.ETERNAL_FLOETTE,
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
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es-ES", "es-MX", "pt-BR", "zh-CN"],
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
];

export class TimedEventManager {
  isActive(event: TimedEvent) {
    return event.startDate < new Date() && new Date() < event.endDate;
  }

  activeEvent(): TimedEvent | undefined {
    return timedEvents.find((te: TimedEvent) => this.isActive(te));
  }

  isEventActive(): boolean {
    return timedEvents.some((te: TimedEvent) => this.isActive(te));
  }

  activeEventHasBanner(): boolean {
    const activeEvents = timedEvents.filter(te => this.isActive(te) && te.hasOwnProperty("bannerKey"));
    return activeEvents.length > 0;
  }

  getShinyMultiplier(): number {
    let multiplier = 1;
    const shinyEvents = timedEvents.filter(te => te.eventType === EventType.SHINY && this.isActive(te));
    for (const se of shinyEvents) {
      multiplier *= se.shinyMultiplier ?? 1;
    }

    return multiplier;
  }

  getEventBannerFilename(): string {
    return timedEvents.find((te: TimedEvent) => this.isActive(te))?.bannerKey ?? "";
  }

  getEventBannerLangs(): string[] {
    const ret: string[] = [];
    ret.push(...timedEvents.find(te => this.isActive(te) && !isNullOrUndefined(te.availableLangs))?.availableLangs!);
    return ret;
  }

  getEventEncounters(): EventEncounter[] {
    const ret: EventEncounter[] = [];
    timedEvents
      .filter(te => this.isActive(te))
      .map(te => {
        if (!isNullOrUndefined(te.eventEncounters)) {
          ret.push(...te.eventEncounters);
        }
      });
    return ret;
  }

  /**
   * For events that change the classic candy friendship multiplier
   * @returns The highest classic friendship multiplier among the active events, or the default CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER
   */
  getClassicFriendshipMultiplier(): number {
    let multiplier = CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER;
    const classicFriendshipEvents = timedEvents.filter(te => this.isActive(te));
    for (const fe of classicFriendshipEvents) {
      if (!isNullOrUndefined(fe.classicFriendshipMultiplier) && fe.classicFriendshipMultiplier > multiplier) {
        multiplier = fe.classicFriendshipMultiplier;
      }
    }
    return multiplier;
  }

  /**
   * For events where defeated bosses (Gym Leaders, E4 etc) give out Voucher Plus even if they were defeated before
   * @returns Whether vouchers should be upgraded
   */
  getUpgradeUnlockedVouchers(): boolean {
    return timedEvents.some(te => this.isActive(te) && (te.upgradeUnlockedVouchers ?? false));
  }

  /**
   * For events where Delibirdy gives extra items
   * @returns list of ids of {@linkcode ModifierType}s that Delibirdy hands out as a bonus
   */
  getDelibirdyBuff(): string[] {
    const ret: string[] = [];
    timedEvents
      .filter(te => this.isActive(te))
      .map(te => {
        if (!isNullOrUndefined(te.delibirdyBuff)) {
          ret.push(...te.delibirdyBuff);
        }
      });
    return ret;
  }

  /**
   * For events where there's a set weather for town biome (other biomes are hard)
   * @returns Event weathers for town
   */
  getWeather(): WeatherPoolEntry[] {
    const ret: WeatherPoolEntry[] = [];
    timedEvents
      .filter(te => this.isActive(te))
      .map(te => {
        if (!isNullOrUndefined(te.weather)) {
          ret.push(...te.weather);
        }
      });
    return ret;
  }

  getAllMysteryEncounterChanges(): EventMysteryEncounterTier[] {
    const ret: EventMysteryEncounterTier[] = [];
    timedEvents
      .filter(te => this.isActive(te))
      .map(te => {
        if (!isNullOrUndefined(te.mysteryEncounterTierChanges)) {
          ret.push(...te.mysteryEncounterTierChanges);
        }
      });
    return ret;
  }

  getEventMysteryEncountersDisabled(): MysteryEncounterType[] {
    const ret: MysteryEncounterType[] = [];
    timedEvents
      .filter(te => this.isActive(te) && !isNullOrUndefined(te.mysteryEncounterTierChanges))
      .map(te => {
        te.mysteryEncounterTierChanges?.map(metc => {
          if (metc.disable) {
            ret.push(metc.mysteryEncounter);
          }
        });
      });
    return ret;
  }

  getMysteryEncounterTierForEvent(
    encounterType: MysteryEncounterType,
    normal: MysteryEncounterTier,
  ): MysteryEncounterTier {
    let ret = normal;
    timedEvents
      .filter(te => this.isActive(te) && !isNullOrUndefined(te.mysteryEncounterTierChanges))
      .map(te => {
        te.mysteryEncounterTierChanges?.map(metc => {
          if (metc.mysteryEncounter === encounterType) {
            ret = metc.tier ?? normal;
          }
        });
      });
    return ret;
  }

  getEventLuckBoost(): number {
    let ret = 0;
    const luckEvents = timedEvents.filter(te => this.isActive(te) && !isNullOrUndefined(te.luckBoost));
    for (const le of luckEvents) {
      ret += le.luckBoost!;
    }
    return ret;
  }

  getEventLuckBoostedSpecies(): Species[] {
    const ret: Species[] = [];
    timedEvents
      .filter(te => this.isActive(te))
      .map(te => {
        if (!isNullOrUndefined(te.luckBoostedSpecies)) {
          ret.push(...te.luckBoostedSpecies.filter(s => !ret.includes(s)));
        }
      });
    return ret;
  }

  areFusionsBoosted(): boolean {
    return timedEvents.some(te => this.isActive(te) && te.boostFusions);
  }

  /**
   * Gets all the modifier types associated with a certain wave during an event
   * @see EventWaveReward
   * @param wave the wave to check for associated rewards
   * @returns array of strings of the event modifier reward types
   */
  getFixedBattleEventRewards(wave: number): string[] {
    const ret: string[] = [];
    timedEvents
      .filter(te => this.isActive(te) && !isNullOrUndefined(te.classicWaveRewards))
      .map(te => {
        ret.push(...te.classicWaveRewards!.filter(cwr => cwr.wave === wave).map(cwr => cwr.type));
      });
    return ret;
  }

  // Gets the extra shiny chance for trainers due to event (odds/65536)
  getClassicTrainerShinyChance(): number {
    let ret = 0;
    const tsEvents = timedEvents.filter(te => this.isActive(te) && !isNullOrUndefined(te.trainerShinyChance));
    tsEvents.map(t => (ret += t.trainerShinyChance!));
    return ret;
  }

  getEventBgmReplacement(bgm: string): string {
    let ret = bgm;
    timedEvents.map(te => {
      if (this.isActive(te) && !isNullOrUndefined(te.music)) {
        te.music.map(mr => {
          if (mr[0] === bgm) {
            console.log(`it is ${te.name} so instead of ${mr[0]} we play ${mr[1]}`);
            ret = mr[1];
          }
        });
      }
    });
    return ret;
  }

  /**
   * Activates any challenges on {@linkcode globalScene.gameMode} for the currently active event
   */
  startEventChallenges(): void {
    const challenges = this.activeEvent()?.dailyRunChallenges;
    challenges?.forEach((eventChal: EventChallenge) =>
      globalScene.gameMode.setChallengeValue(eventChal.challenge, eventChal.value),
    );
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
      const yPosition = globalScene.game.canvas.height / 6 - padding - (showTimer ? 10 : 0) - (this.event.yOffset ?? 0);
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
