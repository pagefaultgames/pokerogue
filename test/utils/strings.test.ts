import { splitWords } from "#utils/strings";
import { describe, expect, it } from "vitest";

interface testCase {
  input: string;
  words: string[];
}

const testCases: testCase[] = [
  {
    input: "Lorem ipsum dolor sit amet",
    words: ["Lorem", "ipsum", "dolor", "sit", "amet"],
  },
  {
    input: "consectetur-adipiscing-elit",
    words: ["consectetur", "adipiscing", "elit"],
  },
  {
    input: "sed_do_eiusmod_tempor_incididunt_ut_labore",
    words: ["sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore"],
  },
  {
    input: "Et Dolore Magna Aliqua",
    words: ["Et", "Dolore", "Magna", "Aliqua"],
  },
  {
    input: "BIG_ANGRY_TRAINER",
    words: ["BIG", "ANGRY", "TRAINER"],
  },
  {
    input: "ApplesBananasOrangesAndAPear",
    words: ["Apples", "Bananas", "Oranges", "And", "A", "Pear"],
  },
  {
    input: "mysteryEncounters/anOfferYouCantRefuse",
    words: ["mystery", "Encounters/an", "Offer", "You", "Cant", "Refuse"],
  },
];

describe("Utils - Casing -", () => {
  describe("splitWords", () => {
    it.each(testCases)("should split a string into its constituent words - $input", ({ input, words }) => {
      const ret = splitWords(input);
      expect(ret).toEqual(words);
    });
  });
});
