/**
 * A minimal stub object to mock HTMLCanvasElement
 */
export const mockCanvas: any = {
  width: 0,
  getContext() {
    return mockContext;
  },
};
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
