import * as Utils from "./utils";
import { Biome } from "./data/biome";
import { getBiomeHasProps } from "./arena";
import { TrainerType, trainerConfigs } from "./data/trainer-type";

class LoadingScene extends Phaser.Scene {
  constructor() {
    super("LoadingScene");
  }

  loadAtlas(key: string, folder: string, filenameRoot?: string) {
    if (!filenameRoot) filenameRoot = key;
    if (folder) folder += "/";
    this.load.atlas(
      key,
      `images/${folder}${filenameRoot}.png`,
      `images/${folder}/${filenameRoot}.json`
    );
  }
  
  loadSe(key: string, folder?: string, filenames?: string | string[]) {
    if (!filenames) filenames = `${key}.wav`;
    if (!folder) folder = "";
    else folder += "/";
    if (!Array.isArray(filenames)) filenames = [filenames];
    for (let f of filenames as string[]) {
      this.load.audio(key, `audio/se/${folder}${f}`);
    }
  }

  loadImage(key: string, folder: string, filename?: string) {
    if (!filename) filename = `${key}.png`;
    this.load.image(key, `images/${folder}/${filename}`);
  }

  loadBgm(key: string, filename?: string) {
    if (!filename) filename = `${key}.mp3`;
    this.load.audio(key, `audio/bgm/${filename}`);
  }

  preload() {
    // Load menu images
    this.loadImage("bg", "ui");
    this.loadImage("bg_command", "ui");
    this.loadImage("bg_fight", "ui");
    this.loadAtlas("prompt", "ui");
    this.loadImage("cursor", "ui");
    this.loadImage("window", "ui");
    this.loadImage("namebox", "ui");
    this.loadImage("pbinfo_player", "ui");
    this.loadImage("pbinfo_player_mini", "ui");
    this.loadImage("pbinfo_enemy_mini", "ui");
    this.loadImage("overlay_lv", "ui");
    this.loadAtlas("numbers", "ui");
    this.loadAtlas("numbers_red", "ui");
    this.loadAtlas("overlay_hp", "ui");
    this.loadImage("overlay_exp", "ui");
    this.loadImage("icon_owned", "ui");
    this.loadImage("ability_bar", "ui");
    this.loadImage("party_exp_bar", "ui");
    this.loadImage("achv_bar", "ui");
    this.loadImage("achv_bar_2", "ui");
    this.loadImage("achv_bar_3", "ui");
    this.loadImage("achv_bar_4", "ui");
    this.loadImage("shiny_star", "ui", "shiny.png");
    this.loadImage("icon_spliced", "ui");

    this.loadImage("pb_tray_overlay_player", "ui");
    this.loadImage("pb_tray_overlay_enemy", "ui");
    this.loadAtlas("pb_tray_ball", "ui");

    this.loadImage("party_bg", "ui");
    this.loadImage("party_bg_double", "ui");
    this.loadAtlas("party_slot_main", "ui");
    this.loadAtlas("party_slot", "ui");
    this.loadImage("party_slot_overlay_lv", "ui");
    this.loadImage("party_slot_hp_bar", "ui");
    this.loadAtlas("party_slot_hp_overlay", "ui");
    this.loadAtlas("party_pb", "ui");
    this.loadImage("party_message", "ui");
    this.loadImage("party_message_large", "ui");
    this.loadImage("party_message_options", "ui");
    this.loadImage("party_message_options_wide", "ui");
    this.loadAtlas("party_cancel", "ui");

    this.loadImage("summary_bg", "ui");
    this.loadImage("summary_overlay_shiny", "ui");
    this.loadImage("summary_profile", "ui");
    this.loadImage("summary_status", "ui");
    this.loadImage("summary_stats", "ui");
    this.loadImage("summary_stats_overlay_exp", "ui");
    this.loadImage("summary_moves", "ui");
    this.loadImage("summary_moves_effect", "ui");
    this.loadImage("summary_moves_overlay_row", "ui");
    this.loadImage("summary_moves_overlay_pp", "ui");
    this.loadAtlas("summary_moves_cursor", "ui");

    for (let t = 1; t <= 3; t++) this.loadImage(`summary_tabs_${t}`, "ui");

    for (let o = 1; o <= 3; o++)
      this.loadImage(`option_select_window_${o}`, "ui");

    this.loadImage("starter_select_bg", "ui");
    this.loadImage("starter_select_message", "ui");
    this.loadImage("starter_select_cursor", "ui");
    this.loadImage("starter_select_cursor_highlight", "ui");
    this.loadImage("starter_select_cursor_pokerus", "ui");
    this.loadImage("starter_select_gen_cursor", "ui");
    this.loadImage("starter_select_gen_cursor_highlight", "ui");

    this.loadImage("default_bg", "arenas");

    // Load arena images
    Utils.getEnumValues(Biome).map((bt) => {
      const btKey = Biome[bt].toLowerCase();
      this.loadImage(`${btKey}_bg`, "arenas");
      this.loadImage(`${btKey}_a`, "arenas");
      this.loadImage(`${btKey}_b`, "arenas");
      if (getBiomeHasProps(bt)) {
        for (let p = 1; p <= 3; p++)
          this.loadImage(`${btKey}_b_${p}`, "arenas");
      }
    });

    // Load trainer images
    this.loadImage("trainer_m", "trainer");
    this.loadAtlas("trainer_m_pb", "trainer");

    Utils.getEnumValues(TrainerType).map((tt) => {
      const config = trainerConfigs[tt];
      this.loadAtlas(config.getKey(), "trainer");
      if (config.isDouble) this.loadAtlas(config.getKey(true), "trainer");
    });

    // Load pokemon-related images
    this.loadImage(`pkmn__back__sub`, "pokemon/back", "sub.png");
    this.loadImage(`pkmn__sub`, "pokemon", "sub.png");
    this.loadAtlas("battle_stats", "effects");
    this.loadAtlas("shiny", "effects");
    this.loadImage("evo_sparkle", "effects");
    this.load.video("evo_bg", "images/effects/evo_bg.mp4", true);

    this.loadAtlas("pb", "");
    this.loadAtlas("items", "");
    this.loadAtlas("types", "");
    this.loadAtlas("statuses", "");
    this.loadAtlas("categories", "");

    for (let i = 0; i < 7; i++) this.loadAtlas(`pokemon_icons_${i}`, "ui");

    this.loadSe("select");
    this.loadSe("menu_open");
    this.loadSe("hit");
    this.loadSe("hit_strong");
    this.loadSe("hit_weak");
    this.loadSe("stat_up");
    this.loadSe("stat_down");
    this.loadSe("faint");
    this.loadSe("flee");
    this.loadSe("low_hp");
    this.loadSe("exp");
    this.loadSe("level_up");
    this.loadSe("sparkle");
    this.loadSe("restore");
    this.loadSe("shine");
    this.loadSe("charge");
    this.loadSe("beam");
    this.loadSe("upgrade");
    this.loadSe("buy");
    this.loadSe("achv");
    this.loadSe("error");

    this.loadSe("pb_rel");
    this.loadSe("pb_throw");
    this.loadSe("pb_bounce_1");
    this.loadSe("pb_bounce_2");
    this.loadSe("pb_move");
    this.loadSe("pb_catch");
    this.loadSe("pb_lock");

    this.loadSe("pb_tray_enter");
    this.loadSe("pb_tray_ball");
    this.loadSe("pb_tray_empty");

    this.loadSe("PRSFX- Transform", "battle_anims");

    this.loadBgm("menu");

    this.loadBgm("level_up_fanfare", "bw/level_up_fanfare.mp3");
    this.loadBgm("item_fanfare", "bw/item_fanfare.mp3");
    this.loadBgm("heal", "bw/heal.mp3");
    this.loadBgm("victory_trainer", "bw/victory_trainer.mp3");
    this.loadBgm("victory_gym", "bw/victory_gym.mp3");
    this.loadBgm("victory_champion", "bw/victory_champion.mp3");
    this.loadBgm("evolution", "bw/evolution.mp3");
    this.loadBgm("evolution_fanfare", "bw/evolution_fanfare.mp3");

    this.loadLoadingScreen();
  }

  loadLoadingScreen() {
    const graphics = this.add.graphics();

    graphics.lineStyle(4, 0xff00ff, 1).setDepth(10);

    let progressBar = this.add.graphics();
    let progressBox = this.add.graphics();
    progressBox.lineStyle(5, 0xff00ff, 1.0);
    progressBox.fillStyle(0x222222, 0.8);

    let width = this.cameras.main.width;
    let height = this.cameras.main.height;

    let loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading game...",
      style: {
        font: "33px emerald",
        color: "#ffffff",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    let percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: "0%",
      style: {
        font: "28px emerald",
        color: "#ffffff",
      },
    });
    percentText.setOrigin(0.5, 0.5);

    let assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: "",
      style: {
        font: "28px emerald",
        color: "#ffffff",
      },
    });
    assetText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: string) => {
      const parsedValue = parseInt(value);
      percentText.setText(parsedValue * 100 + "%");
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 0.8);
      progressBar.fillRect(width / 2 - 160, 280, 300 * parsedValue, 30);
    });

    this.load.on("fileprogress", (file) => {
      assetText.setText("Loading asset: " + file.key);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });
  }

  isLocal() {
    return location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
      ? true
      : false;
  }

  get gameHeight() {
    return this.game.config.height as number;
  }

  get gameWidth() {
    return this.game.config.width as number;
  }

  async create() {
    // const logoExposeSetting: number = this.isLocal() ? 500 : 2000;

    // this.cameras.main.fadeIn(1000, 255, 255, 255);

    setTimeout(() => {
      this.scene.start("battle");
    }, 500);
  }
}

export default LoadingScene;
