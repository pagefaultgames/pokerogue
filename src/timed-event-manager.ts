import BattleScene from "#app/battle-scene";
import { TextStyle, addTextObject } from "#app/ui/text";
import i18next from "i18next";

export enum EventType {
  SHINY,
  GENERIC
}

interface EventBanner {
  bannerKey?: string;
  xPosition?: number;
  yPosition?: number;
  scale?: number;
  availableLangs?: string[];
}

interface TimedEvent extends EventBanner {
  name: string;
  eventType: EventType;
  shinyMultiplier?: number;
  startDate: Date;
  endDate: Date;
}

const timedEvents: TimedEvent[] = [
  {
    name: "Egg Skip Update",
    eventType: EventType.GENERIC,
    startDate: new Date(Date.UTC(2024, 8, 8, 0)),
    endDate: new Date(Date.UTC(2024, 8, 12, 0)),
    bannerKey: "egg-update",
    xPosition: 19,
    yPosition: 120,
    scale: 0.21,
    availableLangs: ["en", "de", "it", "fr", "ja", "ko", "es", "pt-BR", "zh-CN"]
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

  getShinyMultiplier(): number {
    let multiplier = 1;
    const shinyEvents = timedEvents.filter((te) => te.eventType === EventType.SHINY && this.isActive(te));
    shinyEvents.forEach((se) => {
      multiplier *= se.shinyMultiplier!; // TODO: is this bang correct?
    });

    return multiplier;
  }

  getEventBannerFilename(): string {
    return timedEvents.find((te: TimedEvent) => this.isActive(te))?.bannerKey!; // TODO: is this bang correct?
  }
}

export class TimedEventDisplay extends Phaser.GameObjects.Container {
  private event: TimedEvent | null;
  private eventTimerText: Phaser.GameObjects.Text;
  private banner: Phaser.GameObjects.Image;
  private bannerShadow: Phaser.GameObjects.Rectangle;
  private eventTimer: NodeJS.Timeout | null;

  constructor(scene: BattleScene, x: number, y: number, event?: TimedEvent) {
    super(scene, x, y);
    this.event = event!; // TODO: is this bang correct?
    this.setVisible(false);
  }

  setup() {
    const lang = i18next.resolvedLanguage;
    if (this.event && this.event.bannerKey) {
      let key = this.event.bannerKey;
      if (lang && this.event.availableLangs && this.event.availableLangs.length > 0) {
        if (this.event.availableLangs.includes(lang)) {
          key += "_"+lang;
        } else {
          key += "_en";
        }
      }
      console.log(this.event.bannerKey);
      this.banner = new Phaser.GameObjects.Image(this.scene, this.event.xPosition ?? 29, this.event.yPosition ?? 64, key);
      this.banner.setName("img-event-banner");
      this.banner.setOrigin(0.08, -0.35);
      this.banner.setScale(this.event.scale ?? 0.18);
      if (this.event.eventType !== EventType.GENERIC) {
        this.eventTimerText = addTextObject(
          this.scene,
          this.banner.x + 8,
          this.banner.y + 100,
          this.timeToGo(this.event.endDate),
          TextStyle.WINDOW
        );
        this.eventTimerText.setName("text-event-timer");
        this.eventTimerText.setScale(0.15);
        this.eventTimerText.setOrigin(0, 0);

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
      return (n < 10? "0" : "") + n;
    }
    const now = new Date();
    let diff = Math.abs(date.getTime() - now.getTime());

    // Allow for previous times
    diff = Math.abs(diff);

    // Get time components
    const days = diff/8.64e7 | 0;
    const hours = diff%8.64e7 / 3.6e6 | 0;
    const mins  = diff%3.6e6 / 6e4 | 0;
    const secs  = Math.round(diff%6e4 / 1e3);

    // Return formatted string
    return "Event Ends in : " + z(days) + "d " + z(hours) + "h " + z(mins) + "m " + z(secs)+ "s";
  }

  updateCountdown() {
    if (this.event && this.event.eventType !== EventType.GENERIC) {
      this.eventTimerText.setText(this.timeToGo(this.event.endDate));
    }
  }
}
