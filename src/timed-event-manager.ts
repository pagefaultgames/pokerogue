import { globalScene } from "#app/global-scene";
import { TextStyle, addTextObject } from "#app/ui/text";
import type { nil } from "#app/utils";
import i18next from "i18next";
import { Species } from "#enums/species";
import type { WeatherPoolEntry } from "#app/data/weather";
import { WeatherType } from "#enums/weather-type";

export enum EventType {
  SHINY,
  NO_TIMER_DISPLAY
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
  allowEvolution?: boolean;
}

interface TimedEvent extends EventBanner {
  name: string;
  eventType: EventType;
  shinyMultiplier?: number;
  friendshipMultiplier?: number;
  startDate: Date;
  endDate: Date;
  uncommonBreedEncounters?: EventEncounter[];
  delibirdyBuff?: string[];
  weather?: WeatherPoolEntry[];
}

const timedEvents: TimedEvent[] = [
  {
    name: "Winter Holiday Update",
    eventType: EventType.SHINY,
    shinyMultiplier: 2,
    friendshipMultiplier: 1,
    startDate: new Date(Date.UTC(2024, 11, 21, 0)),
    endDate: new Date(Date.UTC(2025, 0, 4, 0)),
    bannerKey: "winter_holidays2024-event-",
    scale: 0.21,
    availableLangs: [ "en", "de", "it", "fr", "ja", "ko", "es-ES", "pt-BR", "zh-CN" ],
    uncommonBreedEncounters: [
      { species: Species.GIMMIGHOUL },
      { species: Species.DELIBIRD },
      { species: Species.STANTLER, allowEvolution: true },
      { species: Species.CYNDAQUIL, allowEvolution: true },
      { species: Species.PIPLUP, allowEvolution: true },
      { species: Species.CHESPIN, allowEvolution: true },
      { species: Species.BALTOY, allowEvolution: true },
      { species: Species.SNOVER, allowEvolution: true },
      { species: Species.CHINGLING, allowEvolution: true },
      { species: Species.LITWICK, allowEvolution: true },
      { species: Species.CUBCHOO, allowEvolution: true },
      { species: Species.SWIRLIX, allowEvolution: true },
      { species: Species.AMAURA, allowEvolution: true },
      { species: Species.MUDBRAY, allowEvolution: true },
      { species: Species.ROLYCOLY, allowEvolution: true },
      { species: Species.MILCERY, allowEvolution: true },
      { species: Species.SMOLIV, allowEvolution: true },
      { species: Species.ALOLA_VULPIX, allowEvolution: true },
      { species: Species.GALAR_DARUMAKA, allowEvolution: true },
      { species: Species.IRON_BUNDLE }
    ],
    delibirdyBuff: [ "CATCHING_CHARM", "SHINY_CHARM", "ABILITY_CHARM", "EXP_CHARM", "SUPER_EXP_CHARM", "HEALING_CHARM" ],
    weather: [{ weatherType: WeatherType.SNOW, weight: 1 }]
  }
];

export class TimedEventManager {
  constructor() {}

  isActive(event: TimedEvent) {
    return (
      event.startDate < new Date() &&
        new Date() < event.endDate
    );
  }

  activeEvent(): TimedEvent | undefined {
    return timedEvents.find((te: TimedEvent) => this.isActive(te));
  }

  isEventActive(): boolean {
    return timedEvents.some((te: TimedEvent) => this.isActive(te));
  }

  activeEventHasBanner(): boolean {
    const activeEvents = timedEvents.filter((te) => this.isActive(te) && te.hasOwnProperty("bannerFilename"));
    return activeEvents.length > 0;
  }

  getFriendshipMultiplier(): number {
    let multiplier = 1;
    const friendshipEvents = timedEvents.filter((te) => this.isActive(te));
    friendshipEvents.forEach((fe) => {
      multiplier *= fe.friendshipMultiplier ?? 1;
    });

    return multiplier;
  }

  getShinyMultiplier(): number {
    let multiplier = 1;
    const shinyEvents = timedEvents.filter((te) => te.eventType === EventType.SHINY && this.isActive(te));
    shinyEvents.forEach((se) => {
      multiplier *= se.shinyMultiplier ?? 1;
    });

    return multiplier;
  }

  getEventBannerFilename(): string {
    return timedEvents.find((te: TimedEvent) => this.isActive(te))?.bannerKey ?? "";
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
    if (this.event && this.event.bannerKey) {
      let key = this.event.bannerKey;
      if (lang && this.event.availableLangs && this.event.availableLangs.length > 0) {
        if (this.event.availableLangs.includes(lang)) {
          key += lang;
        } else {
          key += "en";
        }
      }
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
          TextStyle.WINDOW
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
    const days = diff / 8.64e7 | 0;
    const hours = diff % 8.64e7 / 3.6e6 | 0;
    const mins  = diff % 3.6e6 / 6e4 | 0;
    const secs  = Math.round(diff % 6e4 / 1e3);

    // Return formatted string
    return i18next.t("menu:eventTimer", { days: z(days), hours: z(hours), mins: z(mins), secs: z(secs) });
  }

  updateCountdown() {
    if (this.event && this.event.eventType !== EventType.NO_TIMER_DISPLAY) {
      this.eventTimerText.setText(this.timeToGo(this.event.endDate));
    }
  }
}
