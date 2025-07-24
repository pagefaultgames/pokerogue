import { MockText } from "#test/test-utils/mocks/mocks-container/mock-text";

export class MockInputText extends MockText {
  public inputType: string;
  public selectionStart: number;
  public selectionEnd: number;
  public selectedText: string;

  constructor(textureManager, x, y, _w, _h, content, styleOptions) {
    super(textureManager, x, y, content, styleOptions);
  }

  selectText(_selectionStart?: number, _selectionEnd?: number) {}

  selectAll() {}

  setCursorPosition(_value: number) {}

  scrollToBottom() {}

  resize(_width: number, _height: number) {}

  setElement(_element, _style, _innerText) {}
}
