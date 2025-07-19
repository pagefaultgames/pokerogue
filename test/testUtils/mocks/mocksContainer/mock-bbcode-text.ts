import { MockText } from "#test/testUtils/mocks/mocksContainer/mockText";

export class MockBBCodeText extends MockText {
  setMaxLines(_lines: number) {}
  setWrapMode(_mode: 0 | 1 | 2 | 3 | "none" | "word" | "char" | "character" | "mix") {}
}
