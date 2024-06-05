import Clock = Phaser.Time.Clock;


export class MockClock extends Clock {
  constructor(scene) {
    super(scene);
    setInterval(() => {
      /*
        To simulate frame update
        eventEmitter.on(SceneEvents.PRE_UPDATE, this.preUpdate, this);
        eventEmitter.on(SceneEvents.UPDATE, this.update, this);
       */
      this.preUpdate(this.systems.game.loop.time, 100);
      this.update(this.systems.game.loop.time, 100);
    }, 100);
  }
}
