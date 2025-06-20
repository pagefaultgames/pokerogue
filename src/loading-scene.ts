import { GachaType } from "#enums/gacha-types";
import { getBiomeHasProps } from "#app/field/arena";
import CacheBustedLoaderPlugin from "#app/plugins/cache-busted-loader-plugin";
import { SceneBase } from "#app/scene-base";
import { WindowVariant, getWindowVariantSuffix } from "#app/ui/ui-theme";
import { isMobile } from "#app/touch-controls";
import { localPing, getEnumValues, hasAllLocalizedSprites, getEnumKeys } from "#app/utils/common";
import { initPokemonPrevolutions, initPokemonStarters } from "#app/data/balance/pokemon-evolutions";
import { initBiomes } from "#app/data/balance/biomes";
import { initEggMoves } from "#app/data/balance/egg-moves";
import { initPokemonForms } from "#app/data/pokemon-forms";
import { initSpecies } from "#app/data/pokemon-species";
import { initMoves } from "#app/data/moves/move";
import { initAbilities } from "#app/data/abilities/ability";
import { initAchievements } from "#app/system/achv";
import { initTrainerTypeDialogue } from "#app/data/dialogue";
import { initChallenges } from "#app/data/challenge";
import i18next from "i18next";
import { initStatsKeys } from "#app/ui/game-stats-ui-handler";
import { initVouchers } from "#app/system/voucher";
import { BiomeId } from "#enums/biome-id";
import { initMysteryEncounters } from "#app/data/mystery-encounters/mystery-encounters";
import { timedEventManager } from "./global-event-manager";
import { initModifierPools } from "./modifier/init-modifier-pools";
import { initModifierTypes } from "./modifier/modifier-type";

export class LoadingScene extends SceneBase {
  public static readonly KEY = "loading";

  readonly LOAD_EVENTS = Phaser.Loader.Events;

  constructor() {
    super(LoadingScene.KEY);

    Phaser.Plugins.PluginCache.register("Loader", CacheBustedLoaderPlugin, "load");
  }

  preload() {
    localPing();
    this.load["manifest"] = this.game["manifest"];

    this.loadImage("loading_bg", "arenas");
    this.loadImage("logo", "");

    // Load menu images
    this.loadAtlas("bg", "ui");
    this.loadAtlas("prompt", "ui");
    this.loadImage("candy", "ui");
    this.loadImage("candy_overlay", "ui");
    this.loadImage("friendship", "ui");
    this.loadImage("friendship_overlay", "ui");
    this.loadImage("cursor", "ui");
    this.loadImage("cursor_reverse", "ui");
    for (const wv of getEnumValues(WindowVariant)) {
      for (let w = 1; w <= 5; w++) {
        this.loadImage(`window_${w}${getWindowVariantSuffix(wv)}`, "ui/windows");
      }
    }
    this.loadAtlas("namebox", "ui");
    this.loadImage("pbinfo_player", "ui");
    this.loadImage("pbinfo_player_stats", "ui");
    this.loadImage("pbinfo_player_mini", "ui");
    this.loadImage("pbinfo_player_mini_stats", "ui");
    this.loadAtlas("pbinfo_player_type", "ui");
    this.loadAtlas("pbinfo_player_type1", "ui");
    this.loadAtlas("pbinfo_player_type2", "ui");
    this.loadImage("pbinfo_enemy_mini", "ui");
    this.loadImage("pbinfo_enemy_mini_stats", "ui");
    this.loadImage("pbinfo_enemy_boss", "ui");
    this.loadImage("pbinfo_enemy_boss_stats", "ui");
    this.loadAtlas("pbinfo_enemy_type", "ui");
    this.loadAtlas("pbinfo_enemy_type1", "ui");
    this.loadAtlas("pbinfo_enemy_type2", "ui");
    this.loadAtlas("pbinfo_stat", "ui");
    this.loadAtlas("pbinfo_stat_numbers", "ui");
    this.loadImage("overlay_lv", "ui");
    this.loadAtlas("numbers", "ui");
    this.loadAtlas("numbers_red", "ui");
    this.loadAtlas("overlay_hp", "ui");
    this.loadAtlas("overlay_hp_boss", "ui");
    this.loadImage("overlay_exp", "ui");
    this.loadImage("icon_owned", "ui");
    this.loadImage("icon_egg_move", "ui");
    this.loadImage("ability_bar_left", "ui");
    this.loadImage("ability_bar_right", "ui");
    this.loadImage("bgm_bar", "ui");
    this.loadImage("party_exp_bar", "ui");
    this.loadImage("achv_bar", "ui");
    this.loadImage("achv_bar_2", "ui");
    this.loadImage("achv_bar_3", "ui");
    this.loadImage("achv_bar_4", "ui");
    this.loadImage("achv_bar_5", "ui");
    this.loadImage("shiny_star", "ui", "shiny.png");
    this.loadImage("shiny_star_1", "ui", "shiny_1.png");
    this.loadImage("shiny_star_2", "ui", "shiny_2.png");
    this.loadImage("shiny_star_small", "ui", "shiny_small.png");
    this.loadImage("shiny_star_small_1", "ui", "shiny_small_1.png");
    this.loadImage("shiny_star_small_2", "ui", "shiny_small_2.png");
    this.loadImage("favorite", "ui", "favorite.png");
    this.loadImage("passive_bg", "ui", "passive_bg.png");
    this.loadAtlas("shiny_icons", "ui");
    this.loadImage("ha_capsule", "ui", "ha_capsule.png");
    this.loadImage("champion_ribbon", "ui", "champion_ribbon.png");
    this.loadImage("icon_spliced", "ui");
    this.loadImage("icon_lock", "ui", "icon_lock.png");
    this.loadImage("icon_stop", "ui", "icon_stop.png");
    this.loadImage("icon_tera", "ui");
    this.loadImage("cursor_tera", "ui");
    this.loadImage("type_tera", "ui");
    this.loadAtlas("type_bgs", "ui");
    this.loadAtlas("button_tera", "ui");
    this.loadImage("mystery_egg", "ui");
    this.loadImage("normal_memory", "ui");

    this.loadImage("dawn_icon_fg", "ui");
    this.loadImage("dawn_icon_mg", "ui");
    this.loadImage("dawn_icon_bg", "ui");
    this.loadImage("day_icon_fg", "ui");
    this.loadImage("day_icon_mg", "ui");
    this.loadImage("day_icon_bg", "ui");
    this.loadImage("dusk_icon_fg", "ui");
    this.loadImage("dusk_icon_mg", "ui");
    this.loadImage("dusk_icon_bg", "ui");
    this.loadImage("night_icon_fg", "ui");
    this.loadImage("night_icon_mg", "ui");
    this.loadImage("night_icon_bg", "ui");

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
    this.loadAtlas("party_cancel", "ui");

    this.loadImage("summary_bg", "ui");
    this.loadImage("summary_overlay_shiny", "ui");
    this.loadImage("summary_profile", "ui");
    this.loadImage("summary_profile_prompt_z", "ui"); // The pixel Z button prompt
    this.loadImage("summary_profile_prompt_a", "ui"); // The pixel A button prompt
    this.loadImage("summary_profile_ability", "ui"); // Pixel text 'ABILITY'
    this.loadImage("summary_profile_passive", "ui"); // Pixel text 'PASSIVE'
    this.loadImage("summary_status", "ui");
    this.loadImage("summary_stats", "ui");
    this.loadImage("summary_stats_overlay_exp", "ui");
    this.loadImage("summary_moves", "ui");
    this.loadImage("summary_moves_effect", "ui");
    this.loadImage("summary_moves_overlay_row", "ui");
    this.loadImage("summary_moves_overlay_pp", "ui");
    this.loadAtlas("summary_moves_cursor", "ui");
    for (let t = 1; t <= 3; t++) {
      this.loadImage(`summary_tabs_${t}`, "ui");
    }

    this.loadImage("scroll_bar", "ui");
    this.loadImage("scroll_bar_handle", "ui");
    this.loadImage("starter_container_bg", "ui");
    this.loadImage("starter_select_bg", "ui");
    this.loadImage("pokedex_summary_bg", "ui");
    this.loadImage("select_cursor", "ui");
    this.loadImage("select_cursor_highlight", "ui");
    this.loadImage("select_cursor_highlight_thick", "ui");
    this.loadImage("select_cursor_pokerus", "ui");
    this.loadImage("select_gen_cursor", "ui");
    this.loadImage("select_gen_cursor_highlight", "ui");

    this.loadImage("saving_icon", "ui");
    this.loadImage("discord", "ui");
    this.loadImage("google", "ui");
    this.loadImage("settings_icon", "ui");
    this.loadImage("link_icon", "ui");
    this.loadImage("unlink_icon", "ui");

    this.loadImage("default_bg", "arenas");
    // Load arena images
    getEnumValues(BiomeId).map(bt => {
      const btKey = BiomeId[bt].toLowerCase();
      const isBaseAnimated = btKey === "end";
      const baseAKey = `${btKey}_a`;
      const baseBKey = `${btKey}_b`;
      this.loadImage(`${btKey}_bg`, "arenas");
      if (!isBaseAnimated) {
        this.loadImage(baseAKey, "arenas");
      } else {
        this.loadAtlas(baseAKey, "arenas");
      }
      if (!isBaseAnimated) {
        this.loadImage(baseBKey, "arenas");
      } else {
        this.loadAtlas(baseBKey, "arenas");
      }
      if (getBiomeHasProps(bt)) {
        for (let p = 1; p <= 3; p++) {
          const isPropAnimated = p === 3 && ["power_plant", "end"].find(b => b === btKey);
          const propKey = `${btKey}_b_${p}`;
          if (!isPropAnimated) {
            this.loadImage(propKey, "arenas");
          } else {
            this.loadAtlas(propKey, "arenas");
          }
        }
      }
    });

    // Load bitmap fonts
    this.load.bitmapFont("item-count", "fonts/item-count.png", "fonts/item-count.xml");

    // Load trainer images
    this.loadAtlas("trainer_m_back", "trainer");
    this.loadAtlas("trainer_m_back_pb", "trainer");
    this.loadAtlas("trainer_f_back", "trainer");
    this.loadAtlas("trainer_f_back_pb", "trainer");

    // Load character sprites
    this.loadAtlas("c_rival_m", "character", "rival_m");
    this.loadAtlas("c_rival_f", "character", "rival_f");

    // Load pokemon-related images
    this.loadImage("pkmn__back__sub", "pokemon/back", "sub.png");
    this.loadImage("pkmn__sub", "pokemon", "sub.png");
    this.loadAtlas("battle_stats", "effects");
    this.loadAtlas("shiny", "effects");
    this.loadAtlas("shiny_2", "effects");
    this.loadAtlas("shiny_3", "effects");
    this.loadImage("tera", "effects");
    this.loadAtlas("pb_particles", "effects");
    this.loadImage("evo_sparkle", "effects");
    this.loadAtlas("tera_sparkle", "effects");
    this.load.video("evo_bg", "images/effects/evo_bg.mp4", true);

    this.loadAtlas("pb", "");
    this.loadAtlas("items", "");
    this.loadAtlas("types", "");

    // Get current lang and load the types atlas for it. English will only load types while all other languages will load types and types_<lang>
    const lang = i18next.resolvedLanguage;
    if (lang !== "en") {
      if (hasAllLocalizedSprites(lang)) {
        this.loadAtlas(`statuses_${lang}`, "");
        this.loadAtlas(`types_${lang}`, "");
      } else {
        // Fallback to English
        this.loadAtlas("statuses", "");
        this.loadAtlas("types", "");
      }
    } else {
      this.loadAtlas("statuses", "");
      this.loadAtlas("types", "");
    }
    if (timedEventManager.activeEventHasBanner()) {
      const availableLangs = timedEventManager.getEventBannerLangs();
      if (lang && availableLangs.includes(lang)) {
        this.loadImage(`${timedEventManager.getEventBannerFilename()}-${lang}`, "events");
      } else {
        this.loadImage(`${timedEventManager.getEventBannerFilename()}-en`, "events");
      }
    }

    this.loadAtlas("statuses", "");
    this.loadAtlas("categories", "");

    this.loadAtlas("egg", "egg");
    this.loadAtlas("egg_crack", "egg");
    this.loadAtlas("egg_icons", "egg");
    this.loadAtlas("egg_shard", "egg");
    this.loadAtlas("egg_lightrays", "egg");
    for (const gt of getEnumKeys(GachaType)) {
      const key = gt.toLowerCase();
      this.loadImage(`gacha_${key}`, "egg");
      this.loadAtlas(`gacha_underlay_${key}`, "egg");
    }
    this.loadImage("gacha_glass", "egg");
    this.loadImage("gacha_eggs", "egg");
    this.loadAtlas("gacha_hatch", "egg");
    this.loadImage("gacha_knob", "egg");

    this.loadImage("egg_list_bg", "ui");
    this.loadImage("egg_summary_bg", "ui");

    this.loadImage("end_m", "cg");
    this.loadImage("end_f", "cg");

    for (let i = 0; i < 10; i++) {
      this.loadAtlas(`pokemon_icons_${i}`, "");
      if (i) {
        this.loadAtlas(`pokemon_icons_${i}v`, "");
      }
    }

    // Load Mystery Encounter dex progress icon
    this.loadImage("encounter_radar", "mystery-encounters");

    this.loadAtlas("dualshock", "inputs");
    this.loadAtlas("xbox", "inputs");
    this.loadAtlas("keyboard", "inputs");

    this.loadSe("select", "ui");
    this.loadSe("menu_open", "ui");
    this.loadSe("error", "ui");
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
    this.loadSe("shing");
    this.loadSe("charge");
    this.loadSe("beam");
    this.loadSe("upgrade");
    this.loadSe("buy");
    this.loadSe("achv");

    this.loadSe("pb_rel");
    this.loadSe("pb_throw");
    this.loadSe("pb_bounce_1");
    this.loadSe("pb_bounce_2");
    this.loadSe("pb_move");
    this.loadSe("pb_catch");
    this.loadSe("pb_lock");
    this.loadSe("crit_throw");

    this.loadSe("pb_tray_enter");
    this.loadSe("pb_tray_ball");
    this.loadSe("pb_tray_empty");

    this.loadSe("egg_crack");
    this.loadSe("egg_hatch");
    this.loadSe("gacha_dial");
    this.loadSe("gacha_running");
    this.loadSe("gacha_dispense");

    this.loadSe("PRSFX- Transform", "battle_anims");

    this.loadBgm("menu");

    this.loadBgm("level_up_fanfare", "bw/level_up_fanfare.mp3");
    this.loadBgm("item_fanfare", "bw/item_fanfare.mp3");
    this.loadBgm("minor_fanfare", "bw/minor_fanfare.mp3");
    this.loadBgm("heal", "bw/heal.mp3");
    this.loadBgm("victory_trainer", "bw/victory_trainer.mp3");
    this.loadBgm("victory_team_plasma", "bw/victory_team_plasma.mp3");
    this.loadBgm("victory_gym", "bw/victory_gym.mp3");
    this.loadBgm("victory_champion", "bw/victory_champion.mp3");
    this.loadBgm("evolution", "bw/evolution.mp3");
    this.loadBgm("evolution_fanfare", "bw/evolution_fanfare.mp3");

    this.load.plugin(
      "rextexteditplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rextexteditplugin.min.js",
      true,
    );

    this.loadLoadingScreen();

    initModifierTypes();
    initModifierPools();

    initAchievements();
    initVouchers();
    initStatsKeys();
    initPokemonPrevolutions();
    initPokemonStarters();
    initBiomes();
    initEggMoves();
    initPokemonForms();
    initTrainerTypeDialogue();
    initSpecies();
    initMoves();
    initAbilities();
    initChallenges();
    initMysteryEncounters();
  }

  loadLoadingScreen() {
    const mobile = isMobile();

    const loadingGraphics: any[] = [];

    const bg = this.add.image(0, 0, "");
    bg.setOrigin(0, 0);
    bg.setScale(6);
    bg.setVisible(false);

    const graphics = this.add.graphics();

    graphics.lineStyle(4, 0xff00ff, 1).setDepth(10);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.lineStyle(5, 0xff00ff, 1.0);
    progressBox.fillStyle(0x222222, 0.8);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const midWidth = width / 2;
    const midHeight = height / 2;

    const logo = this.add.image(midWidth, 240, "");
    logo.setVisible(false);
    logo.setOrigin(0.5, 0.5);
    logo.setScale(4);

    const percentText = this.make.text({
      x: midWidth,
      y: midHeight - 24,
      text: "0%",
      style: {
        font: "72px emerald",
        color: "#ffffff",
      },
    });
    percentText.setOrigin(0.5, 0.5);

    const assetText = this.make.text({
      x: midWidth,
      y: midHeight + 48,
      text: "",
      style: {
        font: "48px emerald",
        color: "#ffffff",
      },
    });
    assetText.setOrigin(0.5, 0.5);

    const disclaimerText = this.make.text({
      x: midWidth,
      y: assetText.y + 152,
      text: i18next.t("menu:disclaimer"),
      style: {
        font: "72px emerald",
        color: "#DA3838",
      },
    });
    disclaimerText.setOrigin(0.5, 0.5);

    const disclaimerDescriptionText = this.make.text({
      x: midWidth,
      y: disclaimerText.y + 120,
      text: i18next.t("menu:disclaimerDescription"),
      style: {
        font: "48px emerald",
        color: "#ffffff",
        align: "center",
      },
    });
    disclaimerDescriptionText.setOrigin(0.5, 0.5);

    loadingGraphics.push(
      bg,
      graphics,
      progressBar,
      progressBox,
      logo,
      percentText,
      assetText,
      disclaimerText,
      disclaimerDescriptionText,
    );

    if (!mobile) {
      loadingGraphics.map(g => g.setVisible(false));
    }

    const intro = this.add.video(0, 0);
    intro.once(Phaser.GameObjects.Events.VIDEO_COMPLETE, (video: Phaser.GameObjects.Video) => {
      this.tweens.add({
        targets: intro,
        duration: 500,
        alpha: 0,
        ease: "Sine.easeIn",
        onComplete: () => video.destroy(),
      });
      for (const g of loadingGraphics) {
        g.setVisible(true);
      }
    });
    intro.setOrigin(0, 0);
    intro.setScale(3);

    this.load.once(this.LOAD_EVENTS.START, () => {
      // videos do not need to be preloaded
      intro.loadURL("images/intro_dark.mp4", true);
      if (mobile) {
        intro.video?.setAttribute("webkit-playsinline", "webkit-playsinline");
        intro.video?.setAttribute("playsinline", "playsinline");
      }
      intro.play();
    });

    this.load.on(this.LOAD_EVENTS.PROGRESS, (progress: number) => {
      percentText.setText(`${Math.floor(progress * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 0.8);
      progressBar.fillRect(midWidth - 320, 360, 640 * progress, 64);
    });

    this.load.on(this.LOAD_EVENTS.FILE_COMPLETE, (key: string) => {
      assetText.setText(i18next.t("menu:loadingAsset", { assetName: key }));
      switch (key) {
        case "loading_bg":
          bg.setTexture("loading_bg");
          if (mobile) {
            bg.setVisible(true);
          }
          break;
        case "logo":
          logo.setTexture("logo");
          if (mobile) {
            logo.setVisible(true);
          }
          break;
      }
    });

    this.load.on(this.LOAD_EVENTS.COMPLETE, () => {
      for (const go of loadingGraphics) {
        go.destroy();
      }
      intro.destroy();
    });
  }

  get gameHeight() {
    return this.game.config.height as number;
  }

  get gameWidth() {
    return this.game.config.width as number;
  }

  async create() {
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.handleDestroy());
    this.scene.start("battle");
  }

  handleDestroy() {
    console.debug(`Destroying ${LoadingScene.KEY} scene`);
    this.load.off(this.LOAD_EVENTS.PROGRESS);
    this.load.off(this.LOAD_EVENTS.FILE_COMPLETE);
    this.load.off(this.LOAD_EVENTS.COMPLETE);
    // this.textures.remove("loading_bg"); is removed in BattleScene.launchBattle()
    this.children.removeAll(true);
    console.debug(`Destroyed ${LoadingScene.KEY} scene`);
  }
}
