import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    extends: "./vite.config.js",
    test: {
      name: "pre",
      include: ["src/test/pre.test.ts"],
      environment: "jsdom",
    },
  },
  {
    extends: "./vite.config.js",
    test: {
      name: "main",
      include: ["src/test/**/*.test.ts"],
      exclude: ["src/test/pre.test.ts"],
      setupFiles: ['src/test/vitest.setup.ts'],
      environment: "jsdom",
      environmentOptions: {
				jsdom: {
					resources: 'usable',
				},
			},
      threads: false,
			trace: true,
			restoreMocks: true,
      deps: {
				optimizer: {
					web: {
						include: ['vitest-canvas-mock'],
					}
				}
			},
      coverage: {
				provider: 'istanbul',
				reportsDirectory: 'coverage',
				reporters: ['text-summary', 'html'],
			},
    },
  },
]);
