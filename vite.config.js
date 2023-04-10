import { defineConfig } from 'vite';
import fs from 'vite-plugin-fs';

export default defineConfig({
	plugins: [/*fs()*/],
	server: { host: 'localhost', port: 8000 },
	clearScreen: false,
})
