import { timedEventManager } from "#app/global-event-manager";
import { initializeGame } from "#app/init/init";
import { SceneBase } from "#app/scene-base";
import { isMobile } from "#app/touch-controls";
import { BiomeId } from "#enums/biome-id";
import { GachaType } from "#enums/gacha-types";
import { getBiomeHasProps } from "#field/arena";
import { CacheBustedLoaderPlugin } from "#plugins/cache-busted-loader-plugin";
import { getWindowVariantSuffix, WindowVariant } from "#ui/ui-theme";
import { hasAllLocalizedSprites, localPing } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import i18next from "i18next";
import type { GameObjects } from "phaser";

export class LoadingScene extends SceneBase {
  public static readonly KEY = "loading";

  readonly LOAD_EVENTS = Phaser.Loader.Events;

  constructor() {
    super(LoadingScene.KEY);

    Phaser.Plugins.PluginCache.register("Loader", CacheBustedLoaderPlugin, "load");
  }

  preload() {
    localPing();

    // TODO: Categorize these into sub-methods that make sense
    // I'm 99.9% sure the order doesn't matter here,
    // so we should organize these based on type more strongly
    // Load menu images
    this.loadImage("loading_bg", "arenas")
      .loadImage("logo", "")
      .loadImage("logo_fake", "")
      .loadImage("snow", "")
      .loadAtlas("bg", "ui")
      .loadAtlas("prompt", "ui")
      .loadImage("candy", "ui")
      .loadImage("candy_overlay", "ui")
      .loadImage("friendship", "ui")
      .loadImage("friendship_overlay", "ui")
      .loadImage("cursor", "ui")
      .loadImage("cursor_reverse", "ui")
      .loadWindowVariants()
      .loadAtlas("namebox", "ui")
      .loadImage("pbinfo_player", "ui")
      .loadImage("pbinfo_player_stats", "ui")
      .loadImage("pbinfo_player_mini", "ui")
      .loadImage("pbinfo_player_mini_stats", "ui")
      .loadAtlas("pbinfo_player_type", "ui")
      .loadAtlas("pbinfo_player_type1", "ui")
      .loadAtlas("pbinfo_player_type2", "ui")
      .loadImage("pbinfo_enemy_mini", "ui")
      .loadImage("pbinfo_enemy_mini_stats", "ui")
      .loadImage("pbinfo_enemy_boss", "ui")
      .loadImage("pbinfo_enemy_boss_stats", "ui")
      .loadAtlas("pbinfo_enemy_type", "ui")
      .loadAtlas("pbinfo_enemy_type1", "ui")
      .loadAtlas("pbinfo_enemy_type2", "ui")
      .loadAtlas("pbinfo_stat_numbers", "ui")
      .loadAtlas("numbers", "ui")
      .loadAtlas("numbers_red", "ui")
      .loadAtlas("overlay_hp", "ui")
      .loadAtlas("overlay_hp_boss", "ui")
      .loadImage("overlay_exp", "ui")
      .loadImage("icon_owned", "ui")
      .loadImage("icon_egg_move", "ui")
      .loadImage("ability_bar_left", "ui")
      .loadImage("ability_bar_right", "ui")
      .loadImage("bgm_bar", "ui")
      .loadImage("party_exp_bar", "ui")
      .loadImage("achv_bar", "ui")
      .loadImage("achv_bar_2", "ui")
      .loadImage("achv_bar_3", "ui")
      .loadImage("achv_bar_4", "ui")
      .loadImage("achv_bar_5", "ui")
      .loadImage("shiny_star", "ui", "shiny.png")
      .loadImage("shiny_star_1", "ui", "shiny_1.png")
      .loadImage("shiny_star_2", "ui", "shiny_2.png")
      .loadImage("shiny_star_small", "ui", "shiny_small.png")
      .loadImage("shiny_star_small_1", "ui", "shiny_small_1.png")
      .loadImage("shiny_star_small_2", "ui", "shiny_small_2.png")
      .loadImage("favorite", "ui", "favorite.png")
      .loadImage("passive_bg", "ui", "passive_bg.png")
      .loadAtlas("shiny_icons", "ui")
      .loadImage("ha_capsule", "ui", "ha_capsule.png")
      .loadImage("champion_ribbon", "ui", "champion_ribbon.png")
      .loadImage("champion_ribbon_emerald", "ui", "champion_ribbon_emerald.png")
      .loadImage("icon_spliced", "ui")
      .loadImage("icon_lock", "ui", "icon_lock.png")
      .loadImage("icon_stop", "ui", "icon_stop.png")
      .loadImage("icon_tera", "ui")
      .loadImage("cursor_tera", "ui")
      .loadImage("type_tera", "ui")
      .loadAtlas("type_bgs", "ui")
      .loadAtlas("button_tera", "ui")
      .loadImage("common_egg", "ui")
      .loadImage("normal_memory", "ui")
      .loadImage("dawn_icon_fg", "ui")
      .loadImage("dawn_icon_mg", "ui")
      .loadImage("dawn_icon_bg", "ui")
      .loadImage("day_icon_fg", "ui")
      .loadImage("day_icon_mg", "ui")
      .loadImage("day_icon_bg", "ui")
      .loadImage("dusk_icon_fg", "ui")
      .loadImage("dusk_icon_mg", "ui")
      .loadImage("dusk_icon_bg", "ui")
      .loadImage("night_icon_fg", "ui")
      .loadImage("night_icon_mg", "ui")
      .loadImage("night_icon_bg", "ui")
      .loadImage("pb_tray_overlay_player", "ui")
      .loadImage("pb_tray_overlay_enemy", "ui")
      .loadAtlas("pb_tray_ball", "ui")
      .loadImage("party_bg", "ui")
      .loadImage("party_bg_double", "ui")
      .loadImage("party_bg_double_manage", "ui")
      .loadAtlas("party_slot_main", "ui")
      .loadAtlas("party_slot_main_short", "ui")
      .loadAtlas("party_slot", "ui")
      .loadImage("party_slot_hp_bar", "ui")
      .loadAtlas("party_slot_hp_overlay", "ui")
      .loadAtlas("party_pb", "ui")
      .loadAtlas("party_cancel", "ui")
      .loadAtlas("party_discard", "ui")
      .loadAtlas("party_transfer", "ui")
      .loadImage("summary_bg", "ui")
      .loadImage("summary_profile", "ui")
      .loadImage("summary_profile_prompt_z", "ui") // The pixel Z button prompt
      .loadImage("summary_profile_prompt_a", "ui") // The pixel A button prompt
      .loadImage("summary_status", "ui")
      .loadImage("summary_stats", "ui")
      .loadImage("summary_stats_overlay_exp", "ui")
      .loadImage("summary_moves", "ui")
      .loadImage("summary_moves_effect", "ui")
      .loadImage("summary_moves_overlay_row", "ui")
      .loadAtlas("summary_moves_cursor", "ui")
      .loadImage("scroll_bar", "ui")
      .loadImage("scroll_bar_handle", "ui")
      .loadImage("starter_container_bg", "ui")
      .loadImage("starter_select_bg", "ui")
      .loadImage("pokedex_summary_bg", "ui")
      .loadImage("select_cursor", "ui")
      .loadImage("select_cursor_highlight", "ui")
      .loadImage("select_cursor_highlight_thick", "ui")
      .loadImage("select_cursor_pokerus", "ui")
      .loadImage("select_gen_cursor", "ui")
      .loadImage("select_gen_cursor_highlight", "ui")

      .loadImage("language_icon", "ui")
      .loadImage("saving_icon", "ui")
      .loadImage("discord", "ui")
      .loadImage("google", "ui")
      .loadImage("settings_icon", "ui")
      .loadImage("link_icon", "ui")
      .loadImage("unlink_icon", "ui")
      .loadImage("default_bg", "arenas")
      .loadBiomeImages()

      // Load trainer images
      .loadAtlas("trainer_m_back", "trainer")
      .loadAtlas("trainer_m_back_pb", "trainer")
      .loadAtlas("trainer_f_back", "trainer")
      .loadAtlas("trainer_f_back_pb", "trainer")
      // Load character sprites
      .loadAtlas("c_rival_m", "character", "rival_m")
      .loadAtlas("c_rival_f", "character", "rival_f")

      // Load pokemon-related images
      .loadImage("pkmn__back__sub", "pokemon/back", "sub.png")
      .loadImage("pkmn__sub", "pokemon", "sub.png")
      .loadAtlas("battle_stats", "effects")
      .loadAtlas("shiny", "effects")
      .loadAtlas("shiny_2", "effects")
      .loadAtlas("shiny_3", "effects")
      .loadImage("tera", "effects")
      .loadAtlas("pb_particles", "effects")
      .loadImage("evo_sparkle", "effects")
      .loadAtlas("tera_sparkle", "effects")
      .loadAtlas("pb", "")
      .loadAtlas("items", "");

    this.load
      .bitmapFont("item-count", "fonts/item-count.png", "fonts/item-count.xml")
      .video("evo_bg", "images/effects/evo_bg.mp4", true);

    // Get current lang and load the types atlas for it. English will only load types while all other languages will load types and types_<lang>
    const lang = i18next.resolvedLanguage ?? "en";
    const keySuffix = lang !== "en" && hasAllLocalizedSprites(lang) ? `_${lang}` : "";

    this.loadAtlas(`statuses${keySuffix}`, "").loadAtlas(`types${keySuffix}`, "");
    for (let t = 1; t <= 3; t++) {
      this.loadImage(
        `summary_tabs_${t}${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_tabs_${t}${keySuffix}.png`,
      );
    }
    this.loadImage(
      `summary_dexnb_label${keySuffix}`,
      "ui",
      `text_images/${lang}/summary/summary_dexnb_label${keySuffix}.png`,
    )
      .loadImage(
        `summary_dexnb_label_overlay_shiny${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_dexnb_label_overlay_shiny${keySuffix}.png`,
      )
      .loadImage(
        `summary_profile_profile_title${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_profile_profile_title${keySuffix}.png`,
      )
      .loadImage(
        `summary_profile_ability${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_profile_ability${keySuffix}.png`,
      )
      .loadImage(
        `summary_profile_passive${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_profile_passive${keySuffix}.png`,
      )
      .loadImage(
        `summary_profile_memo_title${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_profile_memo_title${keySuffix}.png`,
      )
      .loadImage(
        `summary_stats_item_title${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_stats_item_title${keySuffix}.png`,
      )
      .loadImage(
        `summary_stats_stats_title${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_stats_stats_title${keySuffix}.png`,
      )
      .loadImage(
        `summary_stats_exp_title${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_stats_exp_title${keySuffix}.png`,
      )
      .loadImage(
        `summary_stats_expbar_title${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_stats_expbar_title${keySuffix}.png`,
      )
      .loadImage(
        `summary_moves_moves_title${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_moves_moves_title${keySuffix}.png`,
      )
      .loadImage(
        `summary_moves_descriptions_title${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_moves_descriptions_title${keySuffix}.png`,
      )
      .loadImage(
        `summary_moves_overlay_pp${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_moves_overlay_pp${keySuffix}.png`,
      )
      .loadImage(
        `summary_moves_effect_title${keySuffix}`,
        "ui",
        `text_images/${lang}/summary/summary_moves_effect_title${keySuffix}.png`,
      )

      // in-battle pixel texts
      .loadAtlas(`pbinfo_stat${keySuffix}`, "ui", `text_images/${lang}/battle_ui/pbinfo_stat${keySuffix}`) // Pixel text for in-battle stats info tab
      .loadImage(`overlay_lv${keySuffix}`, "ui", `text_images/${lang}/battle_ui/overlay_lv${keySuffix}.png`) // Pixel text in-battle 'Lv.'
      .loadImage(`overlay_hp_label${keySuffix}`, "ui", `text_images/${lang}/battle_ui/overlay_hp_label${keySuffix}.png`)
      .loadImage(
        `overlay_hp_label_boss${keySuffix}`,
        "ui",
        `text_images/${lang}/battle_ui/overlay_hp_label_boss${keySuffix}.png`,
      )
      .loadImage(
        `overlay_exp_label${keySuffix}`,
        "ui",
        `text_images/${lang}/battle_ui/overlay_exp_label${keySuffix}.png`,
      )
      .loadImage(
        `party_slot_overlay_lv${keySuffix}`,
        "ui",
        `text_images/${lang}/party_ui/party_slot_overlay_lv${keySuffix}.png`,
      )
      .loadImage(
        `party_slot_overlay_hp${keySuffix}`,
        "ui",
        `text_images/${lang}/party_ui/party_slot_overlay_hp${keySuffix}.png`,
      )

      // egg gacha stuff
      .loadEventBannerImages(lang)
      .loadAtlas("categories", "")
      .loadAtlas("egg", "egg")
      .loadAtlas("egg_crack", "egg")
      .loadAtlas("egg_icons", "egg")
      .loadAtlas("egg_shard", "egg")
      .loadAtlas("egg_lightrays", "egg")
      .loadEggGachaImages()
      .loadImage("gacha_glass", "egg")
      .loadImage("gacha_eggs", "egg")
      .loadAtlas("gacha_hatch", "egg")
      .loadImage("gacha_knob", "egg")
      .loadImage("egg_list_bg", "ui")
      .loadImage("egg_summary_bg", "ui")

      .loadImage("end_m", "cg")
      .loadImage("end_f", "cg")
      .loadPokemonIcons()

      .loadImage("encounter_radar", "mystery-encounters") // Mystery Encounter dex progress icon
      // settings atlases
      .loadAtlas("dualshock", "inputs")
      .loadAtlas("xbox", "inputs")
      .loadAtlas("keyboard", "inputs")
      // sound effects
      .loadSe("select", "ui")
      .loadSe("menu_open", "ui")
      .loadSe("error", "ui")
      .loadSe("hit")
      .loadSe("hit_strong")
      .loadSe("hit_weak")
      .loadSe("stat_up")
      .loadSe("stat_down")
      .loadSe("faint")
      .loadSe("flee")
      .loadSe("low_hp")
      .loadSe("exp")
      .loadSe("level_up")
      .loadSe("sparkle")
      .loadSe("restore")
      .loadSe("shine")
      .loadSe("shing")
      .loadSe("charge")
      .loadSe("beam")
      .loadSe("upgrade")
      .loadSe("buy")
      .loadSe("achv")

      .loadSe("pb_rel")
      .loadSe("pb_throw")
      .loadSe("pb_bounce_1")
      .loadSe("pb_bounce_2")
      .loadSe("pb_move")
      .loadSe("pb_catch")
      .loadSe("pb_lock")
      .loadSe("crit_throw")

      .loadSe("pb_tray_enter")
      .loadSe("pb_tray_ball")
      .loadSe("pb_tray_empty")
      .loadSe("egg_crack")
      .loadSe("egg_hatch")
      .loadSe("gacha_dial")
      .loadSe("gacha_running")
      .loadSe("gacha_dispense")

      .loadSe("PRSFX- Transform", "battle_anims")
      .loadBgm("menu")
      .loadBgm("level_up_fanfare", "bw/level_up_fanfare.mp3")
      .loadBgm("item_fanfare", "bw/item_fanfare.mp3")
      .loadBgm("minor_fanfare", "bw/minor_fanfare.mp3")
      .loadBgm("heal", "bw/heal.mp3")
      .loadBgm("victory_trainer", "bw/victory_trainer.mp3")
      .loadBgm("victory_team_plasma", "bw/victory_team_plasma.mp3")
      .loadBgm("victory_gym", "bw/victory_gym.mp3")
      .loadBgm("victory_champion", "bw/victory_champion.mp3")
      .loadBgm("evolution", "bw/evolution.mp3")
      .loadBgm("evolution_fanfare", "bw/evolution_fanfare.mp3");

    // TODO: Shouldn't this be inside the middle of the code?
    this.load.plugin(
      "rextexteditplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rextexteditplugin.min.js",
      true,
    );

    this.loadLoadingScreen();

    initializeGame();
  }

  private loadLoadingScreen() {
    const mobile = isMobile();

    const bg = this.add //
      .image(0, 0, "")
      .setOrigin(0)
      .setScale(6)
      .setVisible(false);

    const graphics = this.add //
      .graphics()
      .lineStyle(4, 0xff00ff, 1)
      .setDepth(10);

    const progressBar = this.add.graphics();

    const progressBox = this.add //
      .graphics()
      .lineStyle(5, 0xff00ff, 1.0)
      .fillStyle(0x222222, 0.8);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const midWidth = width / 2;
    const midHeight = height / 2;

    const logo = this.add //
      .image(midWidth, 240, "")
      .setVisible(false)
      .setOrigin(0.5, 0.5)
      .setScale(4);

    const percentText = this.make
      .text({
        x: midWidth,
        y: midHeight - 24,
        text: "0%",
        style: {
          font: "72px emerald",
          color: "#ffffff",
        },
      })
      .setOrigin(0.5, 0.5);

    const assetText = this.make
      .text({
        x: midWidth,
        y: midHeight + 48,
        text: "",
        style: {
          font: "48px emerald",
          color: "#ffffff",
        },
      })
      .setOrigin(0.5, 0.5);

    const disclaimerText = this.make
      .text({
        x: midWidth,
        y: assetText.y + 152,
        text: i18next.t("menu:disclaimer"),
        style: {
          font: "72px emerald",
          color: "#DA3838",
        },
      })
      .setOrigin(0.5, 0.5);

    const disclaimerDescriptionText = this.make
      .text({
        x: midWidth,
        y: disclaimerText.y + 120,
        text: i18next.t("menu:disclaimerDescription"),
        style: {
          font: "48px emerald",
          color: "#ffffff",
          align: "center",
        },
      })
      .setOrigin(0.5, 0.5);

    const loadingGraphics: (GameObjects.Image | GameObjects.Graphics | GameObjects.Text)[] = [];
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
      loadingGraphics.forEach(g => {
        g.setVisible(false);
      });
    }

    const intro = this.add
      .video(0, 0)
      .setOrigin(0)
      .setScale(3)
      .once(Phaser.GameObjects.Events.VIDEO_COMPLETE, (video: Phaser.GameObjects.Video) => {
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

    this.load
      .once(this.LOAD_EVENTS.START, () => {
        // videos do not need to be preloaded
        intro.loadURL("images/intro_dark.mp4", true);
        if (mobile) {
          intro.video?.setAttribute("webkit-playsinline", "webkit-playsinline");
          intro.video?.setAttribute("playsinline", "playsinline");
        }
        intro.play();
      })
      .on(this.LOAD_EVENTS.PROGRESS, (progress: number) => {
        percentText.setText(`${Math.floor(progress * 100)}%`);
        // need to reset fill style due to `clear` restting it
        progressBar
          .clear()
          .fillStyle(0xffffff, 0.8)
          .fillRect(midWidth - 320, 360, 640 * progress, 64);
      })
      .on(this.LOAD_EVENTS.FILE_COMPLETE, (key: string) => {
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
      })
      .on(this.LOAD_EVENTS.COMPLETE, () => {
        for (const g of loadingGraphics) {
          g.destroy();
        }
        intro.destroy();
      });
  }

  async create() {
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.handleDestroy());
    this.scene.start("battle");
  }

  handleDestroy() {
    console.debug(`Destroying ${LoadingScene.KEY} scene`);
    this.load //
      .off(this.LOAD_EVENTS.PROGRESS)
      .off(this.LOAD_EVENTS.FILE_COMPLETE)
      .off(this.LOAD_EVENTS.COMPLETE);
    // this.textures.remove("loading_bg"); is removed in BattleScene.launchBattle()
    this.children.removeAll(true);
    console.debug(`Destroyed ${LoadingScene.KEY} scene`);
  }

  private loadBiomeImages(): this {
    getEnumValues(BiomeId).forEach(bt => {
      const btKey = BiomeId[bt].toLowerCase();
      const isBaseAnimated = btKey === "end";
      const baseAKey = `${btKey}_a`;
      const baseBKey = `${btKey}_b`;
      this.loadImage(`${btKey}_bg`, "arenas");
      if (isBaseAnimated) {
        this.loadAtlas(baseAKey, "arenas").loadAtlas(baseBKey, "arenas");
      } else {
        this.loadImage(baseAKey, "arenas").loadImage(baseBKey, "arenas");
      }

      if (!getBiomeHasProps(bt)) {
        return;
      }
      for (let p = 1; p <= 3; p++) {
        const isPropAnimated = p === 3 && ["power_plant", "end"].includes(btKey);
        const propKey = `${btKey}_b_${p}`;
        if (isPropAnimated) {
          this.loadAtlas(propKey, "arenas");
        } else {
          this.loadImage(propKey, "arenas");
        }
      }
    });
    return this;
  }

  private loadWindowVariants(): this {
    for (const wv of getEnumValues(WindowVariant)) {
      for (let w = 1; w <= 5; w++) {
        this.loadImage(`window_${w}${getWindowVariantSuffix(wv)}`, "ui/windows");
      }
    }
    return this;
  }

  private loadEventBannerImages(lang: string): this {
    if (timedEventManager.activeEventHasBanner()) {
      const availableLangs = timedEventManager.getEventBannerLangs();
      // fallback to EN banner if translation not found
      if (!availableLangs.includes(lang)) {
        lang = "en";
      }
      this.loadImage(`${timedEventManager.getEventBannerFilename()}-${lang}`, "events");
    }
    return this;
  }

  private loadEggGachaImages(): this {
    for (const gt of Object.keys(GachaType)) {
      const key = gt.toLowerCase();
      this.loadImage(`gacha_${key}`, "egg").loadAtlas(`gacha_underlay_${key}`, "egg");
    }
    return this;
  }

  private loadPokemonIcons(): this {
    for (let i = 0; i < 10; i++) {
      this.loadAtlas(`pokemon_icons_${i}`, "");
      if (i) {
        this.loadAtlas(`pokemon_icons_${i}v`, "");
      }
    }

    return this;
  }
}
