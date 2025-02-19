class FontFaceMock {
  family: string;
  source: string;
  descriptors: any;

  constructor(family: string, source: string, descriptors?: any) {
    this.family = family;
    this.source = source;
    this.descriptors = descriptors;
  }

  load(): Promise<FontFaceMock> {
    return Promise.resolve(this);
  }
}

globalThis.FontFace = FontFaceMock as any;
