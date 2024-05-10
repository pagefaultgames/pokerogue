import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
// import fs from 'vite-plugin-fs';

export default defineConfig(({ mode }) => {
	process.env = {...process.env, ...loadEnv(mode, process.cwd())};


	return {
		plugins: [/*fs()*/, react()],
		server: {
			host: '0.0.0.0',
			port: 8000,
			proxy: {
				"/api": {
					target: "http://"+process.env.VITE_API_BASE_URL+":"+process.env.VITE_API_PORT,
					changeOrigin: true,
					secure: false,
					rewrite: path => path.replace(/^\/api/, '')
				},
			},
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
