import { defineConfig } from 'vite';
import fs from 'vite-plugin-fs';

export default defineConfig({
	plugins: [fs()],
	server: { host: '0.0.0.0', port: 8000 },
	clearScreen: false,
})
