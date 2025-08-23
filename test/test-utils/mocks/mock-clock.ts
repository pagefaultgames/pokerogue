import Phaser from "phaser";

const Clock = Phaser.Time.Clock;

export class MockClock extends Clock {
  public overrideDelay: number | null = 1;
  constructor(scene) {
    super(scene);
    setInterval(() => {
      /*
        To simulate frame update
        eventEmitter.on(SceneEvents.PRE_UPDATE, this.preUpdate, this);
        eventEmitter.on(SceneEvents.UPDATE, this.update, this);
       */
      this.preUpdate(this.systems.game.loop.time, 1);
      this.update(this.systems.game.loop.time, 1);
    }, 1);
  }

  addEvent(config: Phaser.Time.TimerEvent | Phaser.Types.Time.TimerEventConfig): Phaser.Time.TimerEvent {
    const cfg = { ...config, delay: this.overrideDelay ?? config.delay };
    return super.addEvent(cfg);
  }
}
