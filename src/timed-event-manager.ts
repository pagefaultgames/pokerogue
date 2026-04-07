import { SHINY_CATCH_RATE_MULTIPLIER } from "#balance/rates";
import { CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER } from "#balance/starters";
import { allSpecies } from "#data/data-lists";
import type { PokemonSpeciesFilter } from "#data/pokemon-species";
import type { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { SpeciesId } from "#enums/species-id";
import type { TrainerType } from "#enums/trainer-type";
import type { ModifierTypeKeys } from "#modifiers/modifier-type";
import type { EventEncounter, EventMysteryEncounterTier, EventWeatherPools, TimedEvent } from "#types/events";
import { randSeedShuffle } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";
import { timedEvents } from "./data/balance/timed-events";
import { globalScene } from "./global-scene";

export class TimedEventManager {
  /**
   * Whether the timed event manager is disabled.
   * Used to disable events in testing.
   */
  private disabled: boolean;
  private cachedReplacementMap: Map<number, { speciesId: SpeciesId; formIndex: number }> | null = null;

  isActive(event: TimedEvent) {
    if (this.disabled) {
      return false;
    }
    const now = new Date();
    return event.startDate < now && now < event.endDate;
  }

  /**
   * For getting the active event
   * @returns The first active {@linkcode TimedEvent} or `undefined` if there are no active events
   */
  activeEvent(): TimedEvent | undefined {
    return timedEvents.find((te: TimedEvent) => this.isActive(te));
  }

  isEventActive(): boolean {
    return timedEvents.some((te: TimedEvent) => this.isActive(te));
  }

  /**
   * Check whether the current {@linkcode TimedEvent} is active and for April Fools.
   * @returns Whether the April Fools event is currently active.
   */
  isAprilFoolsActive(): boolean {
    return this.activeEvent()?.bannerKey?.startsWith("aprf") ?? false;
  }

  activeEventHasBanner(): boolean {
    return this.activeEvent()?.bannerKey != null;
  }

  /**
   * Get the multiplier for shiny encounters during a shiny {@linkcode TimedEvent}
   * @returns the shiny encounter multiplier
   */
  getShinyEncounterMultiplier(): number {
    return this.activeEvent()?.shinyEncounterMultiplier ?? 1;
  }

  /**
   * Get the multiplier for shiny catches during a shiny {@linkcode TimedEvent}
   * @returns the shiny catch multiplier
   */
  getShinyCatchMultiplier(): number {
    return this.activeEvent()?.shinyCatchMultiplier ?? SHINY_CATCH_RATE_MULTIPLIER;
  }

  getEventBannerFilename(): string {
    return this.activeEvent()?.bannerKey ?? "";
  }

  getEventBannerLangs(): string[] {
    return [...(this.activeEvent()?.availableLangs ?? [])];
  }

  getEventEncounters(): EventEncounter[] {
    return [...(this.activeEvent()?.eventEncounters ?? [])];
  }

  getAllValidEventEncounters(
    allowSubLegendary = true,
    allowLegendary = true,
    allowMythical = true,
    speciesFilter: PokemonSpeciesFilter,
  ): EventEncounter[] {
    return this.getEventEncounters().filter(enc => {
      const species = getPokemonSpecies(enc.species);
      return (
        (allowSubLegendary || !species.subLegendary)
        && (allowLegendary || !species.legendary)
        && (allowMythical || !species.mythical)
        && speciesFilter(species)
      );
    });
  }

  /**
   * For events that change the classic candy friendship multiplier
   * @returns The classic friendship multiplier of the active {@linkcode TimedEvent}, or the default {@linkcode CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER}
   */
  getClassicFriendshipMultiplier(): number {
    return this.activeEvent()?.classicFriendshipMultiplier ?? CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER;
  }

  /**
   * For events where defeated bosses (Gym Leaders, E4 etc) give out Voucher Plus even if they were defeated before
   * @returns Whether vouchers should be upgraded
   */
  getUpgradeUnlockedVouchers(): boolean {
    return this.activeEvent()?.upgradeUnlockedVouchers ?? false;
  }

  /**
   * For events where Delibirdy gives extra items
   * @returns list of ids of {@linkcode ModifierType}s that Delibirdy hands out as a bonus
   */
  getDelibirdyBuff(): string[] {
    return [...(this.activeEvent()?.delibirdyBuff ?? [])];
  }

  /**
   * For events where there's a set weather for town biome (other biomes are hard)
   * @returns Event weathers for town
   */
  getWeather(): EventWeatherPools | undefined {
    return this.activeEvent()?.weather;
  }

  getAllMysteryEncounterChanges(): EventMysteryEncounterTier[] {
    const ret: EventMysteryEncounterTier[] = [];
    for (const te of timedEvents) {
      if (this.isActive(te) && te.mysteryEncounterTierChanges != null) {
        ret.push(...te.mysteryEncounterTierChanges);
      }
    }
    return ret;
  }

  getEventMysteryEncountersDisabled(): MysteryEncounterType[] {
    const ret: MysteryEncounterType[] = [];
    const metChanges = this.activeEvent()?.mysteryEncounterTierChanges ?? [];
    for (const metc of metChanges) {
      if (metc.disable) {
        ret.push(metc.mysteryEncounter);
      }
    }
    return ret;
  }

  getMysteryEncounterTierForEvent(
    encounterType: MysteryEncounterType,
    normal: MysteryEncounterTier,
  ): MysteryEncounterTier {
    const metChanges = this.activeEvent()?.mysteryEncounterTierChanges ?? [];
    for (const metc of metChanges) {
      if (metc.mysteryEncounter === encounterType) {
        return metc.tier ?? normal;
      }
    }
    return normal;
  }

  getEventLuckBoost(): number {
    return this.activeEvent()?.luckBoost ?? 0;
  }

  getEventLuckBoostedSpecies(): SpeciesId[] {
    return [...(this.activeEvent()?.luckBoostedSpecies ?? [])];
  }

  areFusionsBoosted(): boolean {
    return this.activeEvent()?.boostFusions ?? false;
  }

  /**
   * Gets all the modifier types associated with a certain wave during an event
   * @see EventWaveReward
   * @param wave the wave to check for associated rewards
   * @returns array of strings of the event modifier reward types
   */
  getFixedBattleEventRewards(wave: number): ModifierTypeKeys[] {
    return (
      this.activeEvent()
        ?.classicWaveRewards?.filter(cwr => cwr.wave === wave)
        .map(cwr => cwr.type) ?? []
    );
  }

  /**
   * Get the extra shiny chance for trainers due to event
   */
  getClassicTrainerShinyChance(): number {
    return this.activeEvent()?.trainerShinyChance ?? 0;
  }

  getEventBgmReplacement(bgm: string): string {
    const eventMusicReplacements = this.activeEvent()?.music ?? [];
    for (const emr of eventMusicReplacements) {
      if (emr[0] === bgm) {
        console.log(`it is ${this.activeEvent()?.name} so instead of ${emr[0]} we play ${emr[1]}`);
        return emr[1];
      }
    }
    return bgm;
  }

  /**
   * Get the event sprite replacement for a given species and form, if it exists. If the active event has `fillRandom` enabled, \
   * will return a random replacement for any species/form pair that isn't explicitly listed in the `pokemonReplacements` array.
   * @param species - The species ID of the pokemon to check for a sprite replacement
   * @param formIndex - The form index of the pokemon to check for a sprite replacement. Defaults to 0
   * @returns An object containing the species ID and form index of the replacement sprite, or null if no replacement exists.
   */
  public getEventPokemonSpriteReplacement(
    species: SpeciesId,
    formIndex = 0,
  ): {
    speciesId: SpeciesId;
    formIndex: number;
  } | null {
    const event = this.activeEvent();
    if (!event) {
      return null;
    }
    const sprites = event?.sprites;
    if (!sprites) {
      return null;
    }
    const eventSpriteReplacements = sprites.pokemonReplacements;
    const fillRandom = sprites.fillRandom ?? false;

    for (const esr of eventSpriteReplacements) {
      const [sourceSpeciesIdStr, sourceFormIndexStr] = esr[0].split("/");
      if (sourceSpeciesIdStr === species.toString() && (sourceFormIndexStr ?? "0") === formIndex.toString()) {
        const [targetSpeciesIdStr, targetFormIndexStr] = esr[1].split("/");
        return { speciesId: Number(targetSpeciesIdStr) as SpeciesId, formIndex: Number(targetFormIndexStr ?? "0") };
      }
    }

    if (fillRandom) {
      // Multiply by 100000 to avoid collisions
      const key = species * 100_000 + formIndex;
      this.fillRandomPokemonSpriteReplacements();
      return this.cachedReplacementMap!.get(key) ?? null;
    }
    return null;
  }

  /**
   * Assign each species/form pair a random other species/form pair for sprite replacement.
   */
  private fillRandomPokemonSpriteReplacements(): void {
    if (this.cachedReplacementMap) {
      return;
    }
    this.cachedReplacementMap = new Map();
    const allPairs: { speciesId: SpeciesId; formIndex: number }[] = [];
    for (const species of allSpecies) {
      const formCount = species.forms.length || 1;
      for (let f = 0; f < formCount; f++) {
        allPairs.push({ speciesId: species.speciesId, formIndex: f });
      }
    }
    globalScene.executeWithSeedOffset(
      () => {
        const shuffled = randSeedShuffle([...allPairs]);
        for (let i = 0; i < allPairs.length; i++) {
          const sourceKey = allPairs[i].speciesId * 100_000 + allPairs[i].formIndex;
          this.cachedReplacementMap!.set(sourceKey, shuffled[i]);
        }
      },
      0,
      this.activeEvent()!.name,
    );
  }

  /**
   * Get the event trainer sprite replacement for a given trainer type, if it exists.
   * @param trainerType - The trainer type to check for a sprite replacement
   * @returns The trainer type of the replacement sprite, or null if no replacement exists.
   */
  public getEventTrainerSpriteReplacement(trainerType: TrainerType): string | null {
    const event = this.activeEvent();
    if (!event) {
      return null;
    }
    const trainerReplacements = event.sprites?.trainerReplacements ?? [];
    for (const tr of trainerReplacements) {
      if (tr[0] === trainerType) {
        return tr[1];
      }
    }
    return null;
  }

  /**
   * Return the key replacement for the given i18n key if it exists in the active event, otherwise return the original key.
   * @param key The i18n key to check for a replacement
   * @returns The replacement key if it exists, otherwise the original key
   */
  public getEventTextReplacement(key: string): string {
    const event = this.activeEvent();
    if (!event || !event.textReplacements) {
      return key;
    }
    for (const [source, target] of event.textReplacements) {
      if (key === source && i18next.exists(target)) {
        return target;
      }
    }
    return key;
  }

  /**
   * Check if the current active event has any text replacements. \
   * This is used to determine whether the i18next proxy should be loaded.
   * @returns Whether the active event has text replacements
   */
  public hasEventTextReplacement(): boolean {
    const event = this.activeEvent();
    if (!event) {
      return false;
    }
    return event.textReplacements != null && event.textReplacements.length > 0;
  }

  getEventDailyStartingItems(): readonly ModifierTypeKeys[] {
    return this.activeEvent()?.dailyRunStartingItems ?? [];
  }

  /**
   * Disable the timed event manager. Used for testing.
   */
  public disable(): void {
    this.disabled = true;
  }

  // todo: add option to enable to allow for testing timed events
}
