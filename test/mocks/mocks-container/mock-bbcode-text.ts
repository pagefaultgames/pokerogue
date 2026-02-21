import { MockText } from "#test/mocks/mocks-container/mock-text";

export class MockBBCodeText extends MockText {
  setMaxLines(_lines: number) {}
  setWrapMode(_mode: 0 | 1 | 2 | 3 | "none" | "word" | "char" | "character" | "mix") {}
}
