import { defineConfig } from 'vite';
import {EsLinter, linterPlugin, TypeScriptLinter} from "vite-plugin-linter";
// import fs from 'vite-plugin-fs';

export default defineConfig(configEnv => {
	return {
		plugins: [linterPlugin({
			include: ["./src/**/*.ts", "./src/**/*.tsx"],
			linters: [new EsLinter({ configEnv: configEnv }), new TypeScriptLinter()],
		})],
		server: { host: '0.0.0.0', port: 8000 },
		clearScreen: false,
		build: {
			minify: 'esbuild',
			sourcemap: false
		},
		esbuild: {
			pure: configEnv.mode === 'production' ? [ 'console.log' ] : [],
			keepNames: true,
		},
	}
})
