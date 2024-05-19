import { defineConfig } from 'vite';
// import fs from 'vite-plugin-fs';

export default defineConfig(({ mode }) => {
	return {
		plugins: [/*fs()*/],
		server: {
			headers: {
				'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
				'X-Content-Type-Options': 'nosniff'
			},
			host: '0.0.0.0',
			port: 8000
		},
		clearScreen: false,
		build: {
			minify: 'esbuild',
			sourcemap: false
		},
		esbuild: {
			pure: mode === 'production' ? [ 'console.log' ] : [],
			keepNames: true,
		},
	}
})
