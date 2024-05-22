import { expect, describe, it, beforeAll, vi, afterAll, beforeEach } from "vitest";
import { TrainerConfig, TrainerSlot } from "./trainer-config";
import { TrainerType } from "./enums/trainer-type";
import { TrainerVariant } from "#app/field/trainer.js";
import i18next from "i18next";

describe("trainer-config", () => {
  describe("getTitle", () => {
    let trainerConfig: TrainerConfig;
    
    beforeAll(() => {
      // Prevent errors
      vi.mock('./biomes', () => ({}));
      vi.mock('../system/voucher', () => ({
        VoucherType: {},
        getVoucherTypeName: () => "",
        getVoucherTypeIcon: () => "",
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

    it("returns the trainer type name with _female appended", () => {
      trainerConfig.hasGenders = true;
      expect(trainerConfig.getTitle(TrainerSlot.NONE, TrainerVariant.FEMALE)).toBe("Artist_female");
    });

    it("returns the trainer type name when gender selected but trainer variant default", () => {
      trainerConfig.hasGenders = true;
      expect(trainerConfig.getTitle(TrainerSlot.NONE, TrainerVariant.DEFAULT)).toBe("Artist");
    });

    it("returns the trainer type name when want to add _female but female version does not exist in the localization", () => {
      trainerConfig.hasGenders = true;
      const i18nextExistsSpy = jest.spyOn(i18next, 'exists').mockReturnValue(false);

      const title = trainerConfig.getTitle(TrainerSlot.NONE, TrainerVariant.FEMALE);

      expect(i18nextExistsSpy).toBeCalled();
      expect(title).toBe("Artist");
    });
  });
});
