const WRAP_SPACES = /([ \u200b\u3000])/u;
const SPECIAL_WRAP_SPACES = /[\u200b\u3000]/u;

export function hasSpecialWrapSpace(text: string): boolean {
  return SPECIAL_WRAP_SPACES.test(text);
}

export function wrapTextAtSpaces(text: string, maxWidth: number, measureLine: (line: string) => number): string {
  const wrapLine = (line: string) => {
    const parts = line.split(WRAP_SPACES);
    const wrappedLines: string[] = [];
    let outputLine = "";
    let currentLine = "";
    let separator = "";

    const appendPart = (part: string) => {
      if (measureLine(part) <= maxWidth) {
        outputLine += `${separator}${part}`;
        currentLine = currentLine ? `${currentLine}${separator}${part}` : part;
        return;
      }

      outputLine += separator;
      for (const character of part) {
        const nextLine = currentLine ? `${currentLine}${character}` : character;
        if (currentLine && measureLine(nextLine) > maxWidth) {
          wrappedLines.push(outputLine);
          outputLine = character;
          currentLine = character;
        } else {
          outputLine += character;
          currentLine = nextLine;
        }
      }
    };

    for (const part of parts) {
      if (part === " " || part === "\u200b" || part === "\u3000") {
        separator += part;
        continue;
      }

      const nextLine = currentLine ? `${currentLine}${separator}${part}` : part;
      if (currentLine && measureLine(nextLine) > maxWidth) {
        wrappedLines.push(outputLine);
        outputLine = "";
        currentLine = "";
        separator = "";
        appendPart(part);
      } else {
        appendPart(part);
      }
      separator = "";
    }

    wrappedLines.push(`${outputLine}${separator}`);
    return wrappedLines;
  };

  return text.split("\n").flatMap(wrapLine).join("\n");
}
