import { globalScene } from "#app/global-scene";
import { SHINY_CATCH_RATE_MULTIPLIER } from "#balance/rates";
import { CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER } from "#balance/starters";
import type { PokemonSpeciesFilter } from "#data/pokemon-species";
import type { WeatherPoolEntry } from "#data/weather";
import type { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { SpeciesId } from "#enums/species-id";
import type { ModifierTypeKeys } from "#modifiers/modifier-type";
import type { EventEncounter, EventMysteryEncounterTier, TimedEvent } from "#types/events";
import type { IncludeSpecialSpeciesParams } from "#types/pokemon-common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { timedEvents } from "./data/balance/timed-events";

export class TimedEventManager {
  /**
   * Whether the timed event manager is disabled.
   * Used to disable events in testing.
   */
  private disabled: boolean;

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
    includeSpeciesGroups: IncludeSpecialSpeciesParams = {},
    speciesFilter: PokemonSpeciesFilter = () => true,
  ): EventEncounter[] {
    return this.getEventEncounters().filter(enc => {
      const species = getPokemonSpecies(enc.species);
      return species.isIncludedSpeciesGroup(includeSpeciesGroups) && speciesFilter(species);
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
  getWeather(): WeatherPoolEntry[] {
    return [...(this.activeEvent()?.weather ?? [])];
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
   * Activate any challenges on {@linkcode globalScene.gameMode} for the currently active event
   */
  startEventChallenges(): void {
    for (const eventChal of this.activeEvent()?.dailyRunChallenges ?? []) {
      globalScene.gameMode.setChallengeValue(eventChal.challenge, eventChal.value);
    }
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

  // todo: add option to enable to aloow for testing timed events
}
