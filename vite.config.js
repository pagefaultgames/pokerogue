import { resolve } from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
// import fs from 'vite-plugin-fs';

export default defineConfig(({ mode }) => {
	return {
		plugins: [tsconfigPaths()],
		server: { host: '0.0.0.0', port: 8000 },
		clearScreen: false,
		build: {
			minify: 'esbuild',
			sourcemap: false,
		},
		rollupOptions: {
			onwarn(warning, warn) {
				// Suppress "Module level directives cause errors when bundled" warnings
				if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
				  return;
				}
				warn(warning);
			},
		},
		resolve: {
			alias: {
				"#enums": resolve('./src/enums')
			}
		},
		esbuild: {
			pure: mode === 'production' ? [ 'console.log' ] : [],
			keepNames: true,
		},
	}
})
