import { expect, describe, it, beforeAll, vi, afterAll, beforeEach } from "vitest";
import { TrainerConfig, TrainerSlot } from "./trainer-config";
import { TrainerType } from "./enums/trainer-type";
import { TrainerVariant } from "#app/field/trainer.js";

describe("trainer-config", () => {
  describe("getTitle", () => {
    let trainerConfig: TrainerConfig;
    
    beforeAll(() => {
      // Error when importing biomes / voucher (imported by different files)
      vi.mock('./biomes', () => ({
        biomeLinks: {},
        BiomePoolTier: {},
        PokemonPools: {},
        getBiomeName: () => "",
        BiomeTierTrainerPools: {},
        biomePokemonPools: {},
        biomeTrainerPools: {},
      }));
      vi.mock('../system/voucher', () => ({
        vouchers: {},
        VoucherType: {},
        getVoucherTypeIcon: () => "",
        Voucher: {},
        getVoucherTypeName: () => "",
      }));
    });

    afterAll(() => {
      vi.clearAllMocks();
    });

    beforeEach(() => {
      trainerConfig = new TrainerConfig(TrainerType.ARTIST, false);
    });

    it("returns the name double when trainer variant double", () => {
      trainerConfig.nameDouble = "Lae & Ticia";
      expect(trainerConfig.getTitle(TrainerSlot.NONE, TrainerVariant.DOUBLE)).toBe("Lae & Ticia");
    });

    it("returns the trainer type name when no gender selected", () => {
      expect(trainerConfig.getTitle(TrainerSlot.NONE, TrainerVariant.DEFAULT)).toBe("Artist");
    });

    it("returns the female name when gender is female", () => {
      trainerConfig.nameFemale = "Laeticia";
      trainerConfig.hasGenders = true;
      expect(trainerConfig.getTitle(TrainerSlot.NONE, TrainerVariant.FEMALE)).toBe("Laeticia");
    });

    it("returns the female name when trainer variant double and trainer partner", () => {
      trainerConfig.nameFemale = "Laeticia";
      trainerConfig.hasGenders = true;
      expect(trainerConfig.getTitle(TrainerSlot.TRAINER_PARTNER, TrainerVariant.DOUBLE)).toBe("Laeticia");
    });

    it("returns the trainer type name with the female gender", () => {
      trainerConfig.hasGenders = true;
      expect(trainerConfig.getTitle(TrainerSlot.NONE, TrainerVariant.FEMALE)).toBe("Artist♀");
    });

    it("returns the trainer type name with the male gender", () => {
      trainerConfig.hasGenders = true;
      expect(trainerConfig.getTitle(TrainerSlot.NONE, TrainerVariant.DEFAULT)).toBe("Artist♂");
    });
  });
});
