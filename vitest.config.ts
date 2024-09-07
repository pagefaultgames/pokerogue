import { defineProject, UserWorkspaceConfig } from 'vitest/config';
import { defaultConfig } from './vite.config';

export const defaultProjectTestConfig: UserWorkspaceConfig["test"] = {
	setupFiles: ['./src/test/vitest.setup.ts'],
	server: {
		deps: {
			inline: ['vitest-canvas-mock'],
			//@ts-ignore
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
}

export default defineProject(({ mode }) => ({
	...defaultConfig,
	test: {
		...defaultProjectTestConfig,
		name: "main",
		include: ["./src/test/**/*.{test,spec}.ts"],
		exclude: ["./src/test/pre.test.ts"],
	},
	esbuild: {
		pure: mode === 'production' ? [ 'console.log' ] : [],
		keepNames: true,
	},
}))
