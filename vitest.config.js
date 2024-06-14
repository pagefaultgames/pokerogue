import { defineConfig } from 'vitest/config';
import path from 'path';
// import fs from 'vite-plugin-fs';

export default defineConfig(({ mode }) => {
	return {
		plugins: [/*fs()*/],
		clearScreen: false,
		build: {
			minify: 'esbuild',
			sourcemap: true
		},
		resolve: {
			alias: {
				"#enums": path.resolve('./src/enums')
			}
		},
		esbuild: {
			pure: mode === 'production' ? [ 'console.log' ] : [],
			keepNames: true,
		},
	}
})
