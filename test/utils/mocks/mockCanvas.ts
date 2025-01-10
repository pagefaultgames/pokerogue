import { mockContext } from "#test/utils/mocks/mockContext";

/**
 * A minimal stub object to mock HTMLCanvasElement
 */
export const mockCanvas: any = {
  width: 0,
  getContext() {
    return mockContext;
  },
};
