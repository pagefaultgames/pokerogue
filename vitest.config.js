import { defineConfig } from 'vite';
// import fs from 'vite-plugin-fs';

export default defineConfig(({ mode }) => {
	return {
		test: {
			setupFiles: ['./src/test/vitest.setup.ts'],
			environment: 'jsdom',
			deps: {
				optimizer: {
					web: {
						include: ['vitest-canvas-mock'],
					}
				}
			},
			threads: false,
			trace: true,
			restoreMocks: true,
			environmentOptions: {
				jsdom: {
					resources: 'usable',
				},
			},
			coverage: {
				provider: 'istanbul',
				reportsDirectory: 'coverage',
				reporters: ['text-summary', 'html'],
			},
		},
		plugins: [/*fs()*/],
		server: { host: '0.0.0.0', port: 8000 },
		clearScreen: false,
		build: {
			minify: 'esbuild',
			sourcemap: true
		},
		esbuild: {
			pure: mode === 'production' ? [ 'console.log' ] : [],
			keepNames: true,
		},
	}
})
