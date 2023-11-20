class LoadingScene extends Phaser.Scene {
  constructor() {
    super("LoadingScene");
  }

  preload() {
    this.loadLoadingScreen();
  }

  loadLoadingScreen() {
    const graphics = this.add.graphics();

    graphics.lineStyle(4, 0xff00ff, 1).setDepth(10);

    // let progressBar = this.add.graphics();
    // let progressBox = this.add.graphics();
    // progressBox.lineStyle(5, 0xff00ff, 1.0);
    // progressBox.fillStyle(0x222222, 0.8);

    // let width = this.cameras.main.width;
    // let height = this.cameras.main.height;

    // let loadingText = this.make.text({
    //   x: width / 2,
    //   y: height / 2 - 50,
    //   text: "Loading game...",
    //   style: {
    //     font: "23px emerald",
    //     color: "#ffffff",
    //   },
    // });
    // loadingText.setOrigin(0.5, 0.5);

    // let percentText = this.make.text({
    //   x: width / 2,
    //   y: height / 2,
    //   text: "0%",
    //   style: {
    //     font: "18px emerald",
    //     color: "#ffffff",
    //   },
    // });
    // percentText.setOrigin(0.5, 0.5);

    // let assetText = this.make.text({
    //   x: width / 2,
    //   y: height / 2 + 50,
    //   text: "",
    //   style: {
    //     font: "18px emerald",
    //     color: "#ffffff",
    //   },
    // });
    // assetText.setOrigin(0.5, 0.5);

    // this.load.on("progress", (value: string) => {
    //   const parsedValue = parseInt(value);
    //   percentText.setText(parsedValue * 100 + "%");
    //   progressBar.clear();
    //   progressBar.fillStyle(0xffffff, 0.8);
    //   progressBar.fillRect(width / 2 - 160, 280, 300 * parsedValue, 30);
    // });

    // this.load.on("fileprogress", (file) => {
    //   assetText.setText("Loading asset: " + file.key);
    // });

    // this.load.on("complete", () => {
    //   progressBar.destroy();
    //   progressBox.destroy();
    //   loadingText.destroy();
    //   percentText.destroy();
    //   assetText.destroy();
    // });
  }

  // isLocal() {
  //   return location.hostname === "localhost" ||
  //     location.hostname === "127.0.0.1"
  //     ? true
  //     : false;
  // }

  // get gameHeight() {
  //   return this.game.config.height as number;
  // }

  // get gameWidth() {
  //   return this.game.config.width as number;
  // }

  async create() {
    // const logoExposeSetting: number = this.isLocal() ? 500 : 2000;

    // this.cameras.main.fadeIn(1000, 255, 255, 255);


    setTimeout(() => {
      this.scene.start("battle");
    }, 500);
  }
}

export default LoadingScene;
