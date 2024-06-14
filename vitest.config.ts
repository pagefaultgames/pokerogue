import { defineConfig } from 'vitest/config';
import { defaultConfig } from './vite.config';

export default defineConfig(({mode}) => ({
	...defaultConfig,
	test: {
		setupFiles: ['./src/test/vitest.setup.ts'],
		server: {
			deps: {
				inline: ['vitest-canvas-mock'],
				optimizer: {
					web: {
						include: ['vitest-canvas-mock'],
					}
				}
			}
		},
		environment: 'jsdom' as const,
		environmentOptions: {
			jsdom: {
				resources: 'usable',
			},
		},
		threads: false,
		trace: true,
		restoreMocks: true,
		watch: false,
		coverage: {
			provider: 'istanbul' as const,
			reportsDirectory: 'coverage' as const,
			reporters: ['text-summary', 'html'],
		},
	},
	esbuild: {
		pure: mode === 'production' ? [ 'console.log' ] : [],
		keepNames: true,
	},
}))
