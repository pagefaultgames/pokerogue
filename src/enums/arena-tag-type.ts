/**
 * Enum representing all different types of {@linkcode ArenaTag}s.
 * @privateRemarks
 * ⚠️ When modifying the fields in this enum, ensure that:
 * - The entry is added to / removed from {@linkcode ArenaTagTypeMap}
 * - The tag is added to / removed from {@linkcode NonSerializableArenaTagType} or {@linkcode SerializableArenaTagType}
 */
export enum ArenaTagType {
  NONE = "NONE",
  MUD_SPORT = "MUD_SPORT",
  WATER_SPORT = "WATER_SPORT",
  SPIKES = "SPIKES",
  TOXIC_SPIKES = "TOXIC_SPIKES",
  MIST = "MIST",
  STEALTH_ROCK = "STEALTH_ROCK",
  STICKY_WEB = "STICKY_WEB",
  TRICK_ROOM = "TRICK_ROOM",
  GRAVITY = "GRAVITY",
  REFLECT = "REFLECT",
  LIGHT_SCREEN = "LIGHT_SCREEN",
  AURORA_VEIL = "AURORA_VEIL",
  QUICK_GUARD = "QUICK_GUARD",
  WIDE_GUARD = "WIDE_GUARD",
  MAT_BLOCK = "MAT_BLOCK",
  CRAFTY_SHIELD = "CRAFTY_SHIELD",
  TAILWIND = "TAILWIND",
  HAPPY_HOUR = "HAPPY_HOUR",
  SAFEGUARD = "SAFEGUARD",
  NO_CRIT = "NO_CRIT",
  IMPRISON = "IMPRISON",
  ION_DELUGE = "ION_DELUGE",
  FIRE_GRASS_PLEDGE = "FIRE_GRASS_PLEDGE",
  WATER_FIRE_PLEDGE = "WATER_FIRE_PLEDGE",
  GRASS_WATER_PLEDGE = "GRASS_WATER_PLEDGE",
  FAIRY_LOCK = "FAIRY_LOCK",
  NEUTRALIZING_GAS = "NEUTRALIZING_GAS",
}
