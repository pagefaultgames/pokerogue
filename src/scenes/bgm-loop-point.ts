import { Biome } from "#app/enums/biome";

export const BGM_LOOP_POINT: Record<Biome & string, number> = {
  /* Battles */
  "battle_kanto_champion": 13.950, // B2W2 Kanto Champion Battle
  "battle_johto_champion": 23.498, // B2W2 Johto Champion Battle
  "battle_hoenn_champion": 11.328, // B2W2 Hoenn Champion Battle
  "battle_sinnoh_champion": 12.235, // B2W2 Sinnoh Champion Battle
  "battle_champion_alder": 27.653, // BW Unova Champion Battle
  "battle_champion_iris": 10.145, // B2W2 Unova Champion Battle
  "battle_kalos_champion": 10.380, // XY Kalos Champion Battle
  "battle_alola_champion": 13.025, // USUM Alola Champion Battle
  "battle_galar_champion": 61.635, // SWSH Galar Champion Battle
  "battle_champion_geeta": 37.447, // SV Champion Geeta Battle
  "battle_champion_nemona": 14.914, // SV Champion Nemona Battle
  "battle_champion_kieran": 7.206, // SV Champion Kieran Battle
  "battle_hoenn_elite": 11.350, // ORAS Elite Four Battle
  "battle_unova_elite": 17.730, // BW Elite Four Battle
  "battle_kalos_elite": 12.340, // XY Elite Four Battle
  "battle_alola_elite": 19.212, // SM Elite Four Battle
  "battle_galar_elite": 164.069, // SWSH League Tournament Battle
  "battle_paldea_elite": 12.770, // SV Elite Four Battle
  "battle_bb_elite": 19.434, // SV BB League Elite Four Battle
  "battle_final_encounter": 19.159, // PMD RTDX Rayquaza's Domain
  "battle_final": 16.453, // BW Ghetsis Battle
  "battle_kanto_gym": 13.857, // B2W2 Kanto Gym Battle
  "battle_johto_gym": 12.911, // B2W2 Johto Gym Battle
  "battle_hoenn_gym": 12.379, // B2W2 Hoenn Gym Battle
  "battle_sinnoh_gym": 13.122, // B2W2 Sinnoh Gym Battle
  "battle_unova_gym": 19.145, // BW Unova Gym Battle
  "battle_kalos_gym": 44.810, // XY Kalos Gym Battle
  "battle_galar_gym": 171.262, // SWSH Galar Gym Battle
  "battle_paldea_gym": 127.489, // SV Paldea Gym Battle
  "battle_legendary_kanto": 32.966, // XY Kanto Legendary Battle
  "battle_legendary_raikou": 12.632, // HGSS Raikou Battle
  "battle_legendary_entei": 2.905, // HGSS Entei Battle
  "battle_legendary_suicune": 12.636, // HGSS Suicune Battle
  "battle_legendary_lugia": 19.770, // HGSS Lugia Battle
  "battle_legendary_ho_oh": 17.668, // HGSS Ho-oh Battle
  "battle_legendary_regis_g5": 49.500, // B2W2 Legendary Titan Battle
  "battle_legendary_regis_g6": 21.130, // ORAS Legendary Titan Battle
  "battle_legendary_gro_kyo": 10.547, // ORAS Groudon & Kyogre Battle
  "battle_legendary_rayquaza": 10.495, // ORAS Rayquaza Battle
  "battle_legendary_deoxys": 13.333, // ORAS Deoxys Battle
  "battle_legendary_lake_trio": 16.887, // ORAS Lake Guardians Battle
  "battle_legendary_sinnoh": 22.770, // ORAS Sinnoh Legendary Battle
  "battle_legendary_dia_pal": 16.009, // ORAS Dialga & Palkia Battle
  "battle_legendary_giratina": 10.451, // ORAS Giratina Battle
  "battle_legendary_arceus": 9.595, // HGSS Arceus Battle
  "battle_legendary_unova": 13.855, // BW Unova Legendary Battle
  "battle_legendary_kyurem": 18.314, // BW Kyurem Battle
  "battle_legendary_res_zek": 18.329, // BW Reshiram & Zekrom Battle
  "battle_legendary_xern_yvel": 26.468, // XY Xerneas & Yveltal Battle
  "battle_legendary_tapu": 0.000, // SM Tapu Battle
  "battle_legendary_sol_lun": 6.525, // SM Solgaleo & Lunala Battle
  "battle_legendary_ub": 9.818, // SM Ultra Beast Battle
  "battle_legendary_dusk_dawn": 5.211, // USUM Dusk Mane & Dawn Wings Necrozma Battle
  "battle_legendary_ultra_nec": 10.344, // USUM Ultra Necrozma Battle
  "battle_legendary_zac_zam": 11.424, // SWSH Zacian & Zamazenta Battle
  "battle_legendary_glas_spec": 12.503, // SWSH Glastrier & Spectrier Battle
  "battle_legendary_calyrex": 50.641, // SWSH Calyrex Battle
  "battle_legendary_birds_galar": 0.175, // SWSH Galarian Legendary Birds Battle
  "battle_legendary_ruinous": 6.333, // SV Treasures of Ruin Battle
  "battle_legendary_kor_mir": 6.442, // SV Depths of Area Zero Battle
  "battle_legendary_loyal_three": 6.500, // SV Loyal Three Battle
  "battle_legendary_ogerpon": 14.335, // SV Ogerpon Battle
  "battle_legendary_terapagos": 24.377, // SV Terapagos Battle
  "battle_legendary_pecharunt": 6.508, // SV Pecharunt Battle
  "battle_rival": 13.689, // BW Rival Battle
  "battle_rival_2": 17.714, // BW N Battle
  "battle_rival_3": 17.586, // BW Final N Battle
  "battle_trainer": 13.686, // BW Trainer Battle
  "battle_wild": 12.703, // BW Wild Battle
  "battle_wild_strong": 13.940, // BW Strong Wild Battle
  "end_summit": 30.025, // PMD RTDX Sky Tower Summit
  "battle_rocket_grunt": 12.707, // HGSS Team Rocket Battle
  "battle_aqua_magma_grunt": 12.062, // ORAS Team Aqua & Magma Battle
  "battle_galactic_grunt": 13.043, // BDSP Team Galactic Battle
  "battle_plasma_grunt": 12.974, // BW Team Plasma Battle
  "battle_flare_grunt": 4.228, // XY Team Flare Battle
  "battle_rocket_boss": 9.115, // USUM Giovanni Battle
  "battle_aqua_magma_boss": 14.847, // ORAS Archie & Maxie Battle
  "battle_galactic_boss": 106.962, // BDSP Cyrus Battle
  "battle_plasma_boss": 25.624, // B2W2 Ghetsis Battle
  "battle_flare_boss": 8.085, // XY Lysandre Battle

  /* Biomes */
  [Biome.TOWN]: 7.288,
  [Biome.PLAINS]: 7.693,
  [Biome.GRASS]: 1.995,
  [Biome.TALL_GRASS]: 9.608,
  [Biome.METROPOLIS]: 141.470,
  [Biome.FOREST]: 4.294,
  [Biome.SEA]: 1.672,
  [Biome.SWAMP]: 4.461,
  [Biome.BEACH]: 3.462,
  [Biome.LAKE]: 5.350,
  [Biome.SEABED]: 2.600,
  [Biome.MOUNTAIN]: 4.018,
  [Biome.BADLANDS]: 17.790,
  [Biome.CAVE]: 14.240,
  [Biome.DESERT]: 1.143,
  [Biome.ICE_CAVE]: 15.010,
  [Biome.MEADOW]: 3.891,
  [Biome.POWER_PLANT]: 2.810,
  [Biome.VOLCANO]: 5.116,
  [Biome.GRAVEYARD]: 3.232,
  [Biome.DOJO]: 6.205,
  [Biome.FACTORY]: 4.985,
  [Biome.RUINS]: 2.270,
  [Biome.WASTELAND]: 6.336,
  [Biome.ABYSS]: 5.130,
  [Biome.SPACE]: 20.036,
  [Biome.CONSTRUCTION_SITE]: 1.222,
  [Biome.JUNGLE]: 0.000,
  [Biome.FAIRY_CAVE]: 4.542,
  [Biome.TEMPLE]: 2.547,
  [Biome.ISLAND]: 2.751,
  [Biome.LABORATORY]: 114.862,
  [Biome.SLUM]: 1.221,
  [Biome.SNOWY_FOREST]: 3.047,
};
