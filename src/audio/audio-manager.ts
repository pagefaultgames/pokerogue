import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { BackgroundMusic } from "#audio/background-music";
import { VolumeSetting } from "#enums/volume-setting";
import { fixedInt } from "#utils/common";

export type AnySound = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound;

interface GameVolume {
  main: number;
  bgm: number;
  field: number;
  se: number;
  ui: number;
}

/**
 * Global manager for audio operations
 */
export class AudioManager {
  public readonly volume: GameVolume;
  private currentBgm: BackgroundMusic | null = null;

  constructor() {
    this.volume = {
      main: 0.5,
      bgm: 1,
      field: 1,
      se: 1,
      ui: 1,
    };
  }

  /**
   * Get the effective volume for a given setting
   * (the product of that volume and the main volume).
   * @param setting - The {@linkcode VolumeSetting} to get the volume for
   * @returns The effective volume for the given setting (between 0 and 1)
   */
  public getVolume(setting: VolumeSetting): number {
    let mul = 1;
    switch (setting) {
      case VolumeSetting.BGM:
        mul = this.volume.bgm;
        break;
      case VolumeSetting.FIELD:
        mul = this.volume.field;
        break;
      case VolumeSetting.SE:
        mul = this.volume.se;
        break;
      case VolumeSetting.UI:
        mul = this.volume.ui;
    }

    return this.volume.main * mul;
  }

  /**
   * Plays a new bgm.
   * @param bgmName - (Optional) The bgm to play. \
   * If not specified, will first fall back to choosing the bgm based on the current battle config,
   * then further based on the current Biome. \
   * Can be overridden by a currently running event.
   * @param fadeOutPrevious - (Default `false`) Whether to fade out the previously playing bgm
   * @param loop - (Default `true`) Whether to loop the new bgm
   * @returns The {@linkcode BackgroundMusic} instance for the new bgm,
   * or `null` if no valid bgm could be played or the input bgm was the same as the currently playing bgm
   */
  public playBgm(bgmName?: string, fadeOutPrevious = false, loop = true): BackgroundMusic | null {
    const resolvedName = timedEventManager.getEventBgmReplacement(
      bgmName ?? globalScene.currentBattle?.getBgmOverride() ?? globalScene.arena?.bgm,
    );

    if (!resolvedName) {
      return null;
    }

    if (this.currentBgm && this.currentBgm.key === resolvedName) {
      this.currentBgm.play(this.getVolume(VolumeSetting.BGM)); // no-op if already playing
      return null;
    }

    const loopPoint =
      resolvedName === globalScene.arena?.bgm ? globalScene.arena.bgmLoopPoint : this.getBgmLoopPoint(resolvedName);

    const previous = this.currentBgm;
    const newBgm = new BackgroundMusic(resolvedName, loop, loopPoint);
    this.currentBgm = newBgm;

    globalScene.ui.bgmBar.setBgmToBgmBar(resolvedName);

    const volume = this.getVolume(VolumeSetting.BGM);

    if (fadeOutPrevious && previous?.isPlaying) {
      const fadeDuration = 500;
      previous.fadeOut(fadeDuration, true);
      newBgm.playAfterDelay(fixedInt(fadeDuration + 250), volume);
    } else {
      previous?.destroy();
      newBgm.play(volume);
    }

    return newBgm;
  }

  /** Updates the set volume for the audio/bgm with the user's saved config values. */
  public updateSoundVolume(): void {
    this.currentBgm?.setVolume(this.getVolume(VolumeSetting.BGM));

    if (!globalScene.sound) {
      return;
    }

    for (const sound of globalScene.sound.getAllPlaying() as AnySound[]) {
      const [category, name] = sound.key.split("/");
      switch (category) {
        case "battle_anims":
        case "cry":
          if (name?.startsWith("PRSFX- ")) {
            sound.setVolume(this.getVolume(VolumeSetting.FIELD) * 0.5);
          } else {
            sound.setVolume(this.getVolume(VolumeSetting.FIELD));
          }
          break;
        case "se":
        case "ui":
          sound.setVolume(this.getVolume(VolumeSetting.SE));
          break;
      }
    }
  }

  /**
   * Fades out the current bgm over `duration` ms.
   * @param duration - (Default `500`) The amount of time the fade out should take place over, in ms
   * @param fixed - (Default `false`) Whether the duration should ignore game speed
   */
  public fadeOutBgm(duration = 500, fixed = false): void {
    this.currentBgm?.fadeOut(duration, fixed);
    this.currentBgm = null;
  }

  /**
   * Fade out the current BGM track over `delay` ms, then start `newBgmKey` once it finishes.
   * @param newBgmKey - (Optional) The key for the next track to start
   * @param delay - (Default `2000`) The delay to use before starting the next track
   */
  public fadeAndSwitchBgm(newBgmKey?: string, delay = 2000): void {
    this.fadeOutBgm(delay, true);
    globalScene.time.delayedCall(fixedInt(delay), () => {
      this.playBgm(newBgmKey);
    });
  }

  /**
   * Replace the current BGM track with `bgmName`, then resume it after `bgmName` finishes.
   * @param bgmName - The key for the replacement track
   * @returns The newly-created {@linkcode BackgroundMusic} object
   */
  public replaceBgmUntilEnd(bgmName: string): BackgroundMusic {
    const tempBgm = new BackgroundMusic(bgmName, false);
    tempBgm.onEnd(() => {
      this.currentBgm?.resume();
      tempBgm.destroy();
    });
    this.currentBgm?.pause();
    tempBgm.play(this.getVolume(VolumeSetting.BGM));

    return tempBgm;
  }

  /**
   * Plays a sound effect (such as a Pokemon cry, UI cursor sfx, etc)
   * @param sound - The sound effect to play
   * @param config - (Optional) A `Phaser` {@linkcode Phaser.Types.Sound.SoundConfig | SoundConfig}
   * or {@linkcode Phaser.Types.Sound.SoundMarker | SoundMarker} object
   * @returns The sound object
   */
  public playSound(
    sound: string | AnySound,
    config: Phaser.Types.Sound.SoundConfig | Phaser.Types.Sound.SoundMarker = {},
  ): AnySound | null {
    const key = typeof sound === "string" ? sound : sound.key;
    try {
      const keyDetails = key.split("/");
      config["volume"] = config["volume"] ?? 1;
      switch (keyDetails[0]) {
        case "battle_anims":
        case "cry":
          config["volume"] *= this.getVolume(VolumeSetting.FIELD);
          //PRSFX sound files are unusually loud
          if (keyDetails[1].startsWith("PRSFX- ")) {
            config["volume"] *= 0.5;
          }
          break;
        case "ui":
          // Currently, this applies to the "select", "menu_open", "error" sound effects
          config["volume"] *= this.getVolume(VolumeSetting.UI);
          break;
        case "se":
          config["volume"] *= this.getVolume(VolumeSetting.SE);
          break;
      }
      globalScene.sound.play(key, config);
      return globalScene.sound.get(key) as AnySound;
    } catch {
      console.warn(`${key} not found`);
      return null;
    }
  }

  /** The loop point of any given battle, mystery encounter, or title track, read as seconds and milliseconds. */
  private getBgmLoopPoint(bgmName: string): number {
    switch (bgmName) {
      case "title": //Firel PokéRogue Title
        return 46.5;
      case "winter_title": //Andr06 Winter Title
        return 20.57;
      case "battle_kanto_champion": //B2W2 Kanto Champion Battle
        return 13.95;
      case "battle_johto_champion": //B2W2 Johto Champion Battle
        return 23.498;
      case "battle_hoenn_champion_g5": //B2W2 Hoenn Champion Battle
        return 11.328;
      case "battle_hoenn_champion_g6": //ORAS Hoenn Champion Battle
        return 11.762;
      case "battle_sinnoh_champion": //B2W2 Sinnoh Champion Battle
        return 12.235;
      case "battle_champion_alder": //BW Unova Champion Battle
        return 27.653;
      case "battle_champion_iris": //B2W2 Unova Champion Battle
        return 10.145;
      case "battle_kalos_champion": //XY Kalos Champion Battle
        return 10.38;
      case "battle_champion_kukui": //SM Kukui Battle
        return 15.784;
      case "battle_alola_champion": //USUM Alola Champion Battle
        return 13.025;
      case "battle_galar_champion": //SWSH Galar Champion Battle
        return 61.635;
      case "battle_mustard": //SWSH Mustard Battle
        return 22.442;
      case "battle_champion_geeta": //SV Champion Geeta Battle
        return 37.447;
      case "battle_champion_nemona": //SV Champion Nemona Battle
        return 14.914;
      case "battle_champion_kieran": //SV Champion Kieran Battle
        return 7.206;
      case "battle_hoenn_elite": //ORAS Elite Four Battle
        return 11.35;
      case "battle_unova_elite": //BW Elite Four Battle
        return 17.73;
      case "battle_kalos_elite": //XY Elite Four Battle
        return 12.34;
      case "battle_alola_elite": //SM Elite Four Battle
        return 19.212;
      case "battle_galar_elite": //SWSH League Tournament Battle
        return 164.069;
      case "battle_paldea_elite": //SV Elite Four Battle
        return 12.77;
      case "battle_bb_elite": //SV BB League Elite Four Battle
        return 19.434;
      case "battle_final_encounter": //PMD RTDX Rayquaza's Domain
        return 19.159;
      case "battle_final": //BW Ghetsis Battle
        return 16.453;
      case "battle_kanto_gym": //B2W2 Kanto Gym Battle
        return 13.857;
      case "battle_johto_gym": //B2W2 Johto Gym Battle
        return 12.911;
      case "battle_hoenn_gym": //B2W2 Hoenn Gym Battle
        return 12.379;
      case "battle_sinnoh_gym": //B2W2 Sinnoh Gym Battle
        return 13.122;
      case "battle_unova_gym": //BW Unova Gym Battle
        return 19.145;
      case "battle_kalos_gym": //XY Kalos Gym Battle
        return 44.81;
      case "battle_galar_gym": //SWSH Galar Gym Battle
        return 171.262;
      case "battle_paldea_gym": //SV Paldea Gym Battle
        return 127.489;
      case "battle_legendary_kanto": //XY Kanto Legendary Battle
        return 32.966;
      case "battle_legendary_mew": //Emerald Mew Battle
        return 13.284;
      case "battle_legendary_raikou": //HGSS Raikou Battle
        return 12.632;
      case "battle_legendary_entei": //HGSS Entei Battle
        return 2.905;
      case "battle_legendary_suicune": //HGSS Suicune Battle
        return 12.636;
      case "battle_legendary_lugia": //HGSS Lugia Battle
        return 19.77;
      case "battle_legendary_ho_oh": //HGSS Ho-oh Battle
        return 17.668;
      case "battle_legendary_regis_g5": //B2W2 Legendary Titan Battle
        return 49.5;
      case "battle_legendary_regis_g6": //ORAS Legendary Titan Battle
        return 21.13;
      case "battle_legendary_gro_kyo": //ORAS Groudon & Kyogre Battle
        return 10.547;
      case "battle_legendary_rayquaza": //ORAS Rayquaza Battle
        return 10.495;
      case "battle_legendary_deoxys": //ORAS Deoxys Battle
        return 13.333;
      case "battle_legendary_lake_trio": //ORAS Lake Guardians Battle
        return 16.887;
      case "battle_legendary_sinnoh": //ORAS Sinnoh Legendary Battle
        return 22.77;
      case "battle_legendary_dia_pal": //ORAS Dialga & Palkia Battle
        return 16.009;
      case "battle_legendary_origin_forme": //LA Origin Dialga & Palkia Battle
        return 18.961;
      case "battle_legendary_giratina": //ORAS Giratina Battle
        return 10.451;
      case "battle_legendary_arceus": //HGSS Arceus Battle
        return 9.595;
      case "battle_legendary_unova": //BW Unova Legendary Battle
        return 13.855;
      case "battle_legendary_kyurem": //BW Kyurem Battle
        return 18.314;
      case "battle_legendary_res_zek": //BW Reshiram & Zekrom Battle
        return 18.329;
      case "battle_legendary_xern_yvel": //XY Xerneas & Yveltal Battle
        return 26.468;
      case "battle_legendary_tapu": //SM Tapu Battle
        return 0.0;
      case "battle_legendary_sol_lun": //SM Solgaleo & Lunala Battle
        return 6.525;
      case "battle_legendary_ub": //SM Ultra Beast Battle
        return 9.818;
      case "battle_legendary_dusk_dawn": //USUM Dusk Mane & Dawn Wings Necrozma Battle
        return 5.211;
      case "battle_legendary_ultra_nec": //USUM Ultra Necrozma Battle
        return 10.344;
      case "battle_legendary_zac_zam": //SWSH Zacian & Zamazenta Battle
        return 11.424;
      case "battle_legendary_eternatus_p1": //SWSH Eternatus Battle
        return 11.102;
      case "battle_legendary_eternatus_p2": //SWSH Eternamax Eternatus Battle
        return 0.0;
      case "battle_legendary_glas_spec": //SWSH Glastrier & Spectrier Battle
        return 12.503;
      case "battle_legendary_calyrex": //SWSH Calyrex Battle
        return 50.641;
      case "battle_legendary_riders": //SWSH Ice & Shadow Rider Calyrex Battle
        return 18.155;
      case "battle_legendary_birds_galar": //SWSH Galarian Legendary Birds Battle
        return 0.175;
      case "battle_legendary_ruinous": //SV Treasures of Ruin Battle
        return 6.333;
      case "battle_legendary_kor_mir": //SV Depths of Area Zero Battle
        return 6.442;
      case "battle_legendary_loyal_three": //SV Loyal Three Battle
        return 6.5;
      case "battle_legendary_ogerpon": //SV Ogerpon Battle
        return 14.335;
      case "battle_legendary_terapagos": //SV Terapagos Battle
        return 24.377;
      case "battle_legendary_pecharunt": //SV Pecharunt Battle
        return 6.508;
      case "battle_rival": //BW Rival Battle
        return 14.11;
      case "battle_rival_2": //BW N Battle
        return 17.714;
      case "battle_rival_3": //BW Final N Battle
        return 17.586;
      case "battle_trainer": //BW Trainer Battle
        return 13.686;
      case "battle_jacinthe": // Jacinthe Battle
        return 30.188;
      case "battle_wild": //BW Wild Battle
        return 12.703;
      case "battle_wild_strong": //BW Strong Wild Battle
        return 13.94;
      case "battle_rogue_mega": //PLZA Rogue Mega Battle
        return 22.135;
      case "end_summit": //PMD RTDX Sky Tower Summit
        return 30.025;
      case "battle_rocket_grunt": //HGSS Team Rocket Battle
        return 12.707;
      case "battle_aqua_magma_grunt": //ORAS Team Aqua & Magma Battle
        return 12.062;
      case "battle_galactic_grunt": //BDSP Team Galactic Battle
        return 13.043;
      case "battle_plasma_grunt": //B2W2 Team Plasma Battle
        return 14.758;
      case "battle_flare_grunt": //XY Team Flare Battle
        return 4.228;
      case "battle_aether_grunt": // SM Aether Foundation Battle
        return 16.0;
      case "battle_skull_grunt": // SM Team Skull Battle
        return 20.87;
      case "battle_macro_grunt": // SWSH Trainer Battle
        return 11.56;
      case "battle_star_grunt": //SV Team Star Battle
        return 133.362;
      case "battle_galactic_admin": //BDSP Team Galactic Admin Battle
        return 11.997;
      case "battle_colress": //B2W2 Colress Battle
        return 12.234;
      case "battle_skull_admin": //SM Team Skull Admin Battle
        return 15.463;
      case "battle_oleana": //SWSH Oleana Battle
        return 14.11;
      case "battle_star_admin": //SV Team Star Boss Battle
        return 9.493;
      case "battle_rocket_boss": //USUM Giovanni Battle
        return 9.115;
      case "battle_aqua_magma_boss": //ORAS Archie & Maxie Battle
        return 14.847;
      case "battle_galactic_boss": //BDSP Cyrus Battle
        return 106.962;
      case "battle_plasma_boss": //B2W2 Ghetsis Battle
        return 25.624;
      case "battle_flare_boss": //XY Lysandre Battle
        return 8.085;
      case "battle_aether_boss": //SM Lusamine Battle
        return 11.33;
      case "battle_skull_boss": //SM Guzma Battle
        return 13.13;
      case "battle_macro_boss": //SWSH Rose Battle
        return 11.42;
      case "battle_star_boss": //SV Cassiopeia Battle
        return 25.764;
      case "mystery_encounter_gen_5_gts": //BW GTS
        return 8.52;
      case "mystery_encounter_gen_6_gts": //XY GTS
        return 9.24;
      case "mystery_encounter_fun_and_games": //EoS Guildmaster Wigglytuff
        return 4.78;
      case "mystery_encounter_weird_dream": //EoS Temporal Spire
        return 41.42;
      case "mystery_encounter_delibirdy": //Firel Delibirdy
        return 82.28;
      case "title_afd": //Andr06 - PokéRogue Title Remix (AFD)
        return 47.66;
      case "title_afd_2": //Andr06 - PokéRogue Title Remix 2 (AFD)
        return 61.819;
      case "battle_rival_3_afd": //Andr06 - Final N Battle Remix (AFD)
        return 49.147;
      case "battle_trainer_afd": //Andr06 - PokéRogue Trainer Remix (AFD)
        return 13.686;
    }

    return 0;
  }
}
