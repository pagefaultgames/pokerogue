import { mockCanvas } from "#test/utils/mocks/mockCanvas";

/**
 * A minimal stub object to mock CanvasRenderingContext2D
 */
export const mockContext: any = {
  font: "",
  measureText: () => {
    return {};
  },
  save: () => {},
  scale: () => {},
  clearRect: () => {},
  fillRect: () => {},
  fillText: () => {},
  getImageData: () => {},
  canvas: mockCanvas,
  restore: () => {},
};
