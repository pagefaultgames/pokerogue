import { mockCanvas } from "#test/utils/mocks/mockCanvas";

/**
 * A minimal stub object to mock CanvasRenderingContext2D
 */
export const mockContext: any = {
  font: "",
  //@ts-ignore
  measureText: () => new TextMetrics(""),
  save: () => {},
  scale: () => {},
  clearRect: () => {},
  canvas: mockCanvas,
  restore: () => {},
};
