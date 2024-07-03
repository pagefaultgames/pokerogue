import BattleScene from "#app/battle-scene.js";
import { TextStyle, addTextObject } from "#app/ui/text.js";

export enum EventType {
    SHINY
}

interface TimedEvent {
    name: string;
    eventType: EventType;
    shinyMultiplier?: number;
    startDate: Date;
    endDate: Date;
    bannerFilename?: string
}

const timedEvents: TimedEvent[] = [
  {
    name: "Pride Update",
    eventType: EventType.SHINY,
    shinyMultiplier: 2,
    startDate: new Date(Date.UTC(2024, 5, 14, 0)),
    endDate: new Date(Date.UTC(2024, 5, 23, 0)),
    bannerFilename: "pride-update"
  },
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
      multiplier *= se.shinyMultiplier;
    });

    return multiplier;
  }

  getEventBannerFilename(): string {
    return timedEvents.find((te: TimedEvent) => this.isActive(te)).bannerFilename ?? null;
  }
}

export class TimedEventDisplay extends Phaser.GameObjects.Container {
  private event: TimedEvent;
  private eventTimerText: Phaser.GameObjects.Text;
  private banner: Phaser.GameObjects.Image;
  private bannerShadow: Phaser.GameObjects.Rectangle;
  private eventTimer: NodeJS.Timeout;

  constructor(scene: BattleScene, x: number, y: number, event: TimedEvent) {
    super(scene, x, y);
    this.event = event;
    this.setVisible(false);
  }

  setup() {
    this.banner = new Phaser.GameObjects.Image(this.scene, 29, 64, this.event.bannerFilename);
    this.banner.setName("img-event-banner");
    this.banner.setOrigin(0, 0);
    this.banner.setScale(0.07);
    this.bannerShadow = new Phaser.GameObjects.Rectangle(
      this.scene,
      this.banner.x - 2,
      this.banner.y + 2,
      this.banner.width,
      this.banner.height,
      0x484848
    );
    this.bannerShadow.setName("rect-event-banner-shadow");
    this.bannerShadow.setScale(0.07);
    this.bannerShadow.setAlpha(0.5);
    this.bannerShadow.setOrigin(0,0);
    this.eventTimerText = addTextObject(
      this.scene,
      this.banner.x + 8,
      this.banner.y + 100,
      this.timeToGo(this.event.endDate),
      TextStyle.WINDOW
    );
    this.eventTimerText.setName("text-event-timer");
    this.eventTimerText.setScale(0.15);
    this.eventTimerText.setOrigin(0,0);

    this.add([this.eventTimerText, this.bannerShadow, this.banner]);
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
    clearInterval(this.eventTimer);
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
    this.eventTimerText.setText(this.timeToGo(this.event.endDate));
  }
}
