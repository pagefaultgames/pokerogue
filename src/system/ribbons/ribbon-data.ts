import type { Brander } from "#types/type-helpers";

export type RibbonFlag = (bigint & Brander<"RibbonFlag">) | 0n;

/**
 * Class for ribbon data management. Usually constructed via the {@linkcode fromJSON} method.
 *
 * @remarks
 * Stores information about the ribbons earned by a species using a bitfield.
 */
export class RibbonData {
  /** Internal bitfield storing the unlock state for each ribbon */
  private payload: bigint;

  //#region Ribbons
  //#region Monotype challenge ribbons
  /** Ribbon for winning the normal monotype challenge */
  public static readonly MONO_NORMAL = 0x1n as RibbonFlag;
  /** Ribbon for winning the fighting monotype challenge */
  public static readonly MONO_FIGHTING = 0x2n as RibbonFlag;
  /** Ribbon for winning the flying monotype challenge */
  public static readonly MONO_FLYING = 0x4n as RibbonFlag;
  /** Ribbon for winning the poision monotype challenge */
  public static readonly MONO_POISON = 0x8n as RibbonFlag;
  /** Ribbon for winning the ground monotype challenge */
  public static readonly MONO_GROUND = 0x10n as RibbonFlag;
  /** Ribbon for winning the rock monotype challenge */
  public static readonly MONO_ROCK = 0x20n as RibbonFlag;
  /** Ribbon for winning the bug monotype challenge */
  public static readonly MONO_BUG = 0x40n as RibbonFlag;
  /** Ribbon for winning the ghost monotype challenge */
  public static readonly MONO_GHOST = 0x80n as RibbonFlag;
  /** Ribbon for winning the steel monotype challenge */
  public static readonly MONO_STEEL = 0x100n as RibbonFlag;
  /** Ribbon for winning the fire monotype challenge */
  public static readonly MONO_FIRE = 0x200n as RibbonFlag;
  /** Ribbon for winning the water monotype challenge */
  public static readonly MONO_WATER = 0x400n as RibbonFlag;
  /** Ribbon for winning the grass monotype challenge */
  public static readonly MONO_GRASS = 0x800n as RibbonFlag;
  /** Ribbon for winning the electric monotype challenge */
  public static readonly MONO_ELECTRIC = 0x1000n as RibbonFlag;
  /** Ribbon for winning the psychic monotype challenge */
  public static readonly MONO_PSYCHIC = 0x2000n as RibbonFlag;
  /** Ribbon for winning the ice monotype challenge */
  public static readonly MONO_ICE = 0x4000n as RibbonFlag;
  /** Ribbon for winning the dragon monotype challenge */
  public static readonly MONO_DRAGON = 0x8000n as RibbonFlag;
  /** Ribbon for winning the dark monotype challenge */
  public static readonly MONO_DARK = 0x10000n as RibbonFlag;
  /** Ribbon for winning the fairy monotype challenge */
  public static readonly MONO_FAIRY = 0x20000n as RibbonFlag;
  //#endregion Monotype ribbons

  //#region Monogen ribbons
  /** Ribbon for winning the the mono gen 1 challenge */
  public static readonly MONO_GEN_1 = 0x40000n as RibbonFlag;
  /** Ribbon for winning the the mono gen 2 challenge */
  public static readonly MONO_GEN_2 = 0x80000n as RibbonFlag;
  /** Ribbon for winning the mono gen 3 challenge */
  public static readonly MONO_GEN_3 = 0x100000n as RibbonFlag;
  /** Ribbon for winning the mono gen 4 challenge */
  public static readonly MONO_GEN_4 = 0x200000n as RibbonFlag;
  /** Ribbon for winning the mono gen 5 challenge */
  public static readonly MONO_GEN_5 = 0x400000n as RibbonFlag;
  /** Ribbon for winning the mono gen 6 challenge */
  public static readonly MONO_GEN_6 = 0x800000n as RibbonFlag;
  /** Ribbon for winning the mono gen 7 challenge */
  public static readonly MONO_GEN_7 = 0x1000000n as RibbonFlag;
  /** Ribbon for winning the mono gen 8 challenge */
  public static readonly MONO_GEN_8 = 0x2000000n as RibbonFlag;
  /** Ribbon for winning the mono gen 9 challenge */
  public static readonly MONO_GEN_9 = 0x4000000n as RibbonFlag;
  //#endregion Monogen ribbons

  /** Ribbon for winning classic */
  public static readonly CLASSIC = 0x8000000n as RibbonFlag;
  /** Ribbon for winning the nuzzlocke challenge */
  public static readonly NUZLOCKE = 0x10000000n as RibbonFlag;
  /** Ribbon for reaching max friendship */
  public static readonly FRIENDSHIP = 0x20000000n as RibbonFlag;
  /** Ribbon for winning the flip stats challenge */
  public static readonly FLIP_STATS = 0x40000000n as RibbonFlag;
  /** Ribbon for winning the inverse challenge */
  public static readonly INVERSE = 0x80000000n as RibbonFlag;
  /** Ribbon for winning the fresh start challenge */
  public static readonly FRESH_START = 0x100000000n as RibbonFlag;
  /** Ribbon for winning the hardcore challenge */
  public static readonly HARDCORE = 0x200000000n as RibbonFlag;
  /** Ribbon for winning the limited catch challenge */
  public static readonly LIMITED_CATCH = 0x400000000n as RibbonFlag;
  /** Ribbon for winning the limited support challenge set to no heal */
  public static readonly NO_HEAL = 0x800000000n as RibbonFlag;
  /** Ribbon for winning the limited uspport challenge set to no shop */
  public static readonly NO_SHOP = 0x1000000000n as RibbonFlag;
  /** Ribbon for winning the limited support challenge set to both*/
  public static readonly NO_SUPPORT = 0x2000000000n as RibbonFlag;

  // NOTE: max possible ribbon flag is 0x20000000000000 (53 total ribbons)
  // Once this is exceeded, bitfield needs to be changed to a bigint or even a uint array
  // Note that this has no impact on serialization as it is stored in hex.

  //#endregion Ribbons

  /** Create a new instance of RibbonData. Generally, {@linkcode fromJSON} is used instead. */
  constructor(value: number) {
    this.payload = BigInt(value);
  }

  /** Serialize the bitfield payload as a hex encoded string */
  public toJSON(): string {
    return this.payload.toString(16);
  }

  /**
   * Decode a hexadecimal string representation of the bitfield into a `RibbonData` instance
   *
   * @param value - Hexadecimal string representation of the bitfield (without the leading 0x)
   * @returns A new instance of `RibbonData` initialized with the provided bitfield.
   */
  public static fromJSON(value: string): RibbonData {
    try {
      return new RibbonData(Number.parseInt(value, 16));
    } catch {
      return new RibbonData(0);
    }
  }

  /**
   * Award one or more ribbons to the ribbon data by setting the corresponding flags in the bitfield.
   *
   * @param flags - The flags to set. Can be a single flag or multiple flags.
   */
  public award(...flags: [RibbonFlag, ...RibbonFlag[]]): void {
    for (const f of flags) {
      this.payload |= f;
    }
  }

  /**
   * Check if a specific ribbon has been awarded
   * @param flag - The ribbon to check
   * @returns Whether the specified flag has been awarded
   */
  public has(flag: RibbonFlag): boolean {
    return !!(this.payload & flag);
  }
}
