import type { Brander } from "#types/type-helpers";
export type RibbonFlag = number & Brander<"RibbonFlag">;

/**
 * Class for ribbon data management. Usually constructed via the {@linkcode fromJSON} method.
 *
 * @remarks
 * Stores information about the ribbons earned by a species using a bitfield.
 */
export class RibbonData {
  /** Internal bitfield storing the unlock state for each ribbon */
  private payload: number;

  //#region Ribbons
  //#region Monotype challenge ribbons
  /** Flag for winning the normal monotype challenge */
  public static readonly MONO_NORMAL = 0x1 as RibbonFlag;
  /** Flag for winning the fighting monotype challenge */
  public static readonly MONO_FIGHTING = 0x2 as RibbonFlag;
  /** Flag for winning the flying monotype challenge */
  public static readonly MONO_FLYING = 0x4 as RibbonFlag;
  /** Flag for winning the poision monotype challenge */
  public static readonly MONO_POISON = 0x8 as RibbonFlag;
  /** Flag for winning the ground monotype challenge */
  public static readonly MONO_GROUND = 0x10 as RibbonFlag;
  /** Flag for winning the rock monotype challenge */
  public static readonly MONO_ROCK = 0x20 as RibbonFlag;
  /** Flag for winning the bug monotype challenge */
  public static readonly MONO_BUG = 0x40 as RibbonFlag;
  /** Flag for winning the ghost monotype challenge */
  public static readonly MONO_GHOST = 0x80 as RibbonFlag;
  /** Flag for winning the steel monotype challenge */
  public static readonly MONO_STEEL = 0x100 as RibbonFlag;
  /** Flag for winning the fire monotype challenge */
  public static readonly MONO_FIRE = 0x200 as RibbonFlag;
  /** Flag for winning the water monotype challenge */
  public static readonly MONO_WATER = 0x400 as RibbonFlag;
  /** Flag for winning the grass monotype challenge */
  public static readonly MONO_GRASS = 0x800 as RibbonFlag;
  /** Flag for winning the electric monotype challenge */
  public static readonly MONO_ELECTRIC = 0x1000 as RibbonFlag;
  /** Flag for winning the psychic monotype challenge */
  public static readonly MONO_PSYCHIC = 0x2000 as RibbonFlag;
  /** Flag for winning the ice monotype challenge */
  public static readonly MONO_ICE = 0x4000 as RibbonFlag;
  /** Flag for winning the dragon monotype challenge */
  public static readonly MONO_DRAGON = 0x8000 as RibbonFlag;
  /** Flag for winning the dark monotype challenge */
  public static readonly MONO_DARK = 0x10000 as RibbonFlag;
  /** Flag for winning the fairy monotype challenge */
  public static readonly MONO_FAIRY = 0x20000 as RibbonFlag;
  //#endregion Monotype ribbons

  /** Flag for winning a mono generation challenge */
  public static readonly MONO_GEN = 0x40000 as RibbonFlag;

  /** Flag for winning classic */
  public static readonly CLASSIC = 0x80000 as RibbonFlag;
  /** Flag for winning the nuzzlocke challenge */
  public static readonly NUZLOCKE = 0x80000 as RibbonFlag;
  /** Flag for reaching max friendship */
  public static readonly FRIENDSHIP = 0x100000 as RibbonFlag;
  //#endregion Ribbons

  constructor(value: number) {
    this.payload = value;
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

  //#region getters
  /** Ribbon for completing the game in classic mode */
  public get classic(): boolean {
    return !!(this.payload & RibbonData.CLASSIC);
  }

  /** Ribbon for completing a Nuzlocke challenge */
  public get nuzlocke(): boolean {
    return !!(this.payload & RibbonData.NUZLOCKE);
  }

  /** Ribbon for reaching max friendship with a Pokémon */
  public get maxFriendship(): boolean {
    return !!(this.payload & RibbonData.FRIENDSHIP);
  }

  /** Ribbon for completing the normal monotype challenge */
  public get monoNormal(): boolean {
    return !!(this.payload & RibbonData.MONO_NORMAL);
  }

  /** Ribbon for completing the flying monotype challenge */
  public get monoFlying(): boolean {
    return !!(this.payload & RibbonData.MONO_FLYING);
  }

  /** Ribbon for completing the poison monotype challenge */
  public get monoPoison(): boolean {
    return !!(this.payload & RibbonData.MONO_POISON);
  }

  /** Ribbon for completing the ground monotype challenge */
  public get monoGround(): boolean {
    return !!(this.payload & RibbonData.MONO_GROUND);
  }

  /** Ribbon for completing the rock monotype challenge */
  public get monoRock(): boolean {
    return !!(this.payload & RibbonData.MONO_ROCK);
  }

  /** Ribbon for completing the bug monotype challenge */
  public get monoBug(): boolean {
    return !!(this.payload & RibbonData.MONO_BUG);
  }

  /** Ribbon for completing the ghost monotype challenge */
  public get monoGhost(): boolean {
    return !!(this.payload & RibbonData.MONO_GHOST);
  }

  /** Ribbon for completing the steel monotype challenge */
  public get monoSteel(): boolean {
    return !!(this.payload & RibbonData.MONO_STEEL);
  }

  /** Ribbon for completing the fire monotype challenge */
  public get monoFire(): boolean {
    return !!(this.payload & RibbonData.MONO_FIRE);
  }

  /** Ribbon for completing the water monotype challenge */
  public get monoWater(): boolean {
    return !!(this.payload & RibbonData.MONO_WATER);
  }

  /** Ribbon for completing the grass monotype challenge */
  public get monoGrass(): boolean {
    return !!(this.payload & RibbonData.MONO_GRASS);
  }

  /** Ribbon for completing the electric monotype challenge */
  public get monoElectric(): boolean {
    return !!(this.payload & RibbonData.MONO_ELECTRIC);
  }

  /** Ribbon for completing the psychic monotype challenge */
  public get monoPsychic(): boolean {
    return !!(this.payload & RibbonData.MONO_PSYCHIC);
  }

  /** Ribbon for completing the ice monotype challenge */
  public get monoIce(): boolean {
    return !!(this.payload & RibbonData.MONO_ICE);
  }

  /** Ribbon for completing the dragon monotype challenge */
  public get monoDragon(): boolean {
    return !!(this.payload & RibbonData.MONO_DRAGON);
  }

  /** Ribbon for completing the dark monotype challenge */
  public get monoDark(): boolean {
    return !!(this.payload & RibbonData.MONO_DARK);
  }

  /** Ribbon for completing the fairy monotype challenge */
  public get monoFairy(): boolean {
    return !!(this.payload & RibbonData.MONO_FAIRY);
  }

  /** Ribbon for completing fighting the monotype challenge */
  public get monoFighting(): boolean {
    return !!(this.payload & RibbonData.MONO_FIGHTING);
  }

  /** Ribbon for completing any monogen challenge */
  public get monoGen(): boolean {
    return !!(this.payload & RibbonData.MONO_GEN);
  }
  //#endregion getters
}
