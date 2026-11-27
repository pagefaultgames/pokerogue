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

    for (const part of parts) {
      if (part === " " || part === "\u200b" || part === "\u3000") {
        separator += part;
        continue;
      }

      const nextLine = currentLine ? `${currentLine}${separator}${part}` : part;
      if (currentLine && measureLine(nextLine) > maxWidth) {
        wrappedLines.push(outputLine);
        outputLine = part;
        currentLine = part;
      } else {
        outputLine += `${separator}${part}`;
        currentLine = nextLine;
      }
      separator = "";
    }

    wrappedLines.push(`${outputLine}${separator}`);
    return wrappedLines;
  };

  return text.split("\n").flatMap(wrapLine).join("\n");
}
