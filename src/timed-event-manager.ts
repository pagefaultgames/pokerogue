import BattleScene from "#app/battle-scene.js";
import { TextStyle, addTextObject } from "#app/ui/text.js";

export enum EventType {
  SHINY,
  GENERIC
}

interface TimedEvent {
  name: string;
  eventType: EventType;
  shinyMultiplier?: number;
  startDate: Date;
  endDate: Date;
  bannerFilename?: string;
  xPosition?: number;
  yPosition?: number;
  scale?: number;
}

const timedEvents: TimedEvent[] = [
  {
    name: "September Update",
    eventType: EventType.GENERIC,
    startDate: new Date(Date.UTC(2024, 7, 28, 0)),
    endDate: new Date(Date.UTC(2024, 8, 15, 0)),
    bannerFilename: "september-update",
    xPosition: 19,
    yPosition: 115,
    scale: 0.30
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
    return timedEvents.find((te: TimedEvent) => this.isActive(te))?.bannerFilename!; // TODO: is this bang correct?
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
    if (this.event) {
      console.log(this.event.bannerFilename);
      this.banner = new Phaser.GameObjects.Image(this.scene, this.event.xPosition ?? 29, this.event.yPosition ?? 64, this.event.bannerFilename!);
      this.banner.setName("img-event-banner");
      this.banner.setOrigin(0.08, -0.35);
      this.banner.setScale(this.event.scale ?? 0.18);
      // this.bannerShadow = new Phaser.GameObjects.Rectangle(
      //   this.scene,
      //   this.banner.x - 2,
      //   this.banner.y + 2,
      //   this.banner.width,
      //   this.banner.height,
      //   0x484848
      // );
      // this.bannerShadow.setName("rect-event-banner-shadow");
      // this.bannerShadow.setScale(0.07);
      // this.bannerShadow.setAlpha(0.5);
      // this.bannerShadow.setOrigin(0,0);
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
    if (this.event!.eventType !== EventType.GENERIC) {
      this.eventTimerText.setText(this.timeToGo(this.event!.endDate));
    }
  }
}
