import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export const defaultConfig = {
	plugins: [tsconfigPaths() as any],
	clearScreen: false,
	build: {
		minify: 'esbuild' as const,
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
	}
};


export default defineConfig(({mode}) => {
	const envPort = Number(loadEnv(mode, process.cwd()).VITE_PORT);

	return ({
		...defaultConfig,
		esbuild: {
			pure: mode === 'production' ? ['console.log'] : [],
			keepNames: true,
		},
		server: {
			port: !isNaN(envPort) ? envPort : 8000,
		}
	});
});
