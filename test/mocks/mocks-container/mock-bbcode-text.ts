import { MockText } from "#test/mocks/mocks-container/mock-text";
import type BBCodeText from "phaser3-rex-plugins/plugins/gameobjects/tagtext/bbcodetext/BBCodeText";

export class MockBBCodeText extends MockText {
  setMaxLines(..._: Parameters<BBCodeText["setMaxLines"]>): this {
    return this;
  }

  setWrapMode(_mode: 0 | 1 | 2 | 3 | "none" | "word" | "char" | "character" | "mix"): this {
    return this;
  }

  setStrikethrough(..._args: Parameters<BBCodeText["setStrikethrough"]>): this {
    return this;
  }

  setStrikethroughColor(..._args: Parameters<BBCodeText["setStrikethroughColor"]>): this {
    return this;
  }

  setStrikethroughThinkness(..._args: Parameters<BBCodeText["setStrikethroughThinkness"]>): this {
    return this;
  }

  setStrikethroughOffset(..._args: Parameters<BBCodeText["setStrikethroughOffset"]>): this {
    return this;
  }
}
