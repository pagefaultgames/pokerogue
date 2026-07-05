import { globalScene } from "#app/global-scene";
import { EventType } from "#enums/event-type";
import { TextStyle } from "#enums/text-style";
import type { nil } from "#types/common";
import type { TimedEvent } from "#types/events";
import { addTextObject } from "#ui/text";
import { padInt } from "#utils/common";
import i18next from "i18next";

export class TimedEventDisplay extends Phaser.GameObjects.Container {
  private readonly event: TimedEvent | nil;
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
   * Set the width that can be used to display the event timer and banner.
   *
   * By default these elements get centered horizontally in that space,
   * in the bottom left of the screen
   */
  public setWidth(width: number): void {
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

  public setup(): void {
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
          TextStyle.MESSAGE,
        );
        this.eventTimerText.setName("text-event-timer");
        this.eventTimerText.setScale(0.15);
        this.eventTimerText.setOrigin(0.5, 0);

        this.add(this.eventTimerText);
      }
      this.add(this.banner);
    }
  }

  public show(): void {
    this.setVisible(true);
    this.updateCountdown();

    this.eventTimer = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  public clear(): void {
    this.setVisible(false);
    this.eventTimer && clearInterval(this.eventTimer);
    this.eventTimer = null;
  }

  private timeToGo(date: Date): string {
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
      days: padInt(days, 2),
      hours: padInt(hours, 2),
      mins: padInt(mins, 2),
      secs: padInt(secs, 2),
    });
  }

  private updateCountdown(): void {
    if (this.event && this.event.eventType !== EventType.NO_TIMER_DISPLAY && this.eventTimerText.visible) {
      this.eventTimerText.setText(this.timeToGo(this.event.endDate));
    }
  }
}
