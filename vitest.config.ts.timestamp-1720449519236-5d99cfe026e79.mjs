// vitest.config.ts
import { defineConfig as defineConfig2 } from "file:///C:/Users/Christopher/repos/pokerogue/node_modules/vitest/dist/config.js";

// vite.config.ts
import { defineConfig } from "file:///C:/Users/Christopher/repos/pokerogue/node_modules/vite/dist/node/index.js";
import tsconfigPaths from "file:///C:/Users/Christopher/repos/pokerogue/node_modules/vite-tsconfig-paths/dist/index.mjs";
var defaultConfig = {
  plugins: [tsconfigPaths()],
  server: { host: "0.0.0.0", port: 8e3 },
  clearScreen: false,
  build: {
    minify: "esbuild",
    sourcemap: false
  },
  rollupOptions: {
    onwarn(warning, warn) {
      if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
        return;
      }
      warn(warning);
    }
  }
};
var vite_config_default = defineConfig(({ mode }) => ({
  ...defaultConfig,
  esbuild: {
    pure: mode === "production" ? ["console.log"] : [],
    keepNames: true
  }
}));

// vitest.config.ts
var vitest_config_default = defineConfig2(({ mode }) => ({
  ...defaultConfig,
  test: {
    setupFiles: ["./src/test/vitest.setup.ts"],
    server: {
      deps: {
        inline: ["vitest-canvas-mock"],
        optimizer: {
          web: {
            include: ["vitest-canvas-mock"]
          }
        }
      }
    },
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        resources: "usable"
      }
    },
    threads: false,
    trace: true,
    restoreMocks: true,
    watch: false,
    coverage: {
      provider: "istanbul",
      reportsDirectory: "coverage",
      reporters: ["text-summary", "html"]
    }
  },
  esbuild: {
    pure: mode === "production" ? ["console.log"] : [],
    keepNames: true
  }
}));
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyIsICJ2aXRlLmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXENocmlzdG9waGVyXFxcXHJlcG9zXFxcXHBva2Vyb2d1ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQ2hyaXN0b3BoZXJcXFxccmVwb3NcXFxccG9rZXJvZ3VlXFxcXHZpdGVzdC5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0NocmlzdG9waGVyL3JlcG9zL3Bva2Vyb2d1ZS92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XHJcbmltcG9ydCB7IGRlZmF1bHRDb25maWcgfSBmcm9tICcuL3ZpdGUuY29uZmlnJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoe21vZGV9KSA9PiAoe1xyXG5cdC4uLmRlZmF1bHRDb25maWcsXHJcblx0dGVzdDoge1xyXG5cdFx0c2V0dXBGaWxlczogWycuL3NyYy90ZXN0L3ZpdGVzdC5zZXR1cC50cyddLFxyXG5cdFx0c2VydmVyOiB7XHJcblx0XHRcdGRlcHM6IHtcclxuXHRcdFx0XHRpbmxpbmU6IFsndml0ZXN0LWNhbnZhcy1tb2NrJ10sXHJcblx0XHRcdFx0b3B0aW1pemVyOiB7XHJcblx0XHRcdFx0XHR3ZWI6IHtcclxuXHRcdFx0XHRcdFx0aW5jbHVkZTogWyd2aXRlc3QtY2FudmFzLW1vY2snXSxcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblx0XHRlbnZpcm9ubWVudDogJ2pzZG9tJyBhcyBjb25zdCxcclxuXHRcdGVudmlyb25tZW50T3B0aW9uczoge1xyXG5cdFx0XHRqc2RvbToge1xyXG5cdFx0XHRcdHJlc291cmNlczogJ3VzYWJsZScsXHJcblx0XHRcdH0sXHJcblx0XHR9LFxyXG5cdFx0dGhyZWFkczogZmFsc2UsXHJcblx0XHR0cmFjZTogdHJ1ZSxcclxuXHRcdHJlc3RvcmVNb2NrczogdHJ1ZSxcclxuXHRcdHdhdGNoOiBmYWxzZSxcclxuXHRcdGNvdmVyYWdlOiB7XHJcblx0XHRcdHByb3ZpZGVyOiAnaXN0YW5idWwnIGFzIGNvbnN0LFxyXG5cdFx0XHRyZXBvcnRzRGlyZWN0b3J5OiAnY292ZXJhZ2UnIGFzIGNvbnN0LFxyXG5cdFx0XHRyZXBvcnRlcnM6IFsndGV4dC1zdW1tYXJ5JywgJ2h0bWwnXSxcclxuXHRcdH0sXHJcblx0fSxcclxuXHRlc2J1aWxkOiB7XHJcblx0XHRwdXJlOiBtb2RlID09PSAncHJvZHVjdGlvbicgPyBbICdjb25zb2xlLmxvZycgXSA6IFtdLFxyXG5cdFx0a2VlcE5hbWVzOiB0cnVlLFxyXG5cdH0sXHJcbn0pKVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXENocmlzdG9waGVyXFxcXHJlcG9zXFxcXHBva2Vyb2d1ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQ2hyaXN0b3BoZXJcXFxccmVwb3NcXFxccG9rZXJvZ3VlXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9DaHJpc3RvcGhlci9yZXBvcy9wb2tlcm9ndWUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XHJcblxyXG5leHBvcnQgY29uc3QgZGVmYXVsdENvbmZpZyA9IHtcclxuXHRwbHVnaW5zOiBbdHNjb25maWdQYXRocygpIGFzIGFueV0sXHJcblx0c2VydmVyOiB7IGhvc3Q6ICcwLjAuMC4wJywgcG9ydDogODAwMCB9LFxyXG5cdGNsZWFyU2NyZWVuOiBmYWxzZSxcclxuXHRidWlsZDoge1xyXG5cdFx0bWluaWZ5OiAnZXNidWlsZCcgYXMgY29uc3QsXHJcblx0XHRzb3VyY2VtYXA6IGZhbHNlLFxyXG5cdH0sXHJcblx0cm9sbHVwT3B0aW9uczoge1xyXG5cdFx0b253YXJuKHdhcm5pbmcsIHdhcm4pIHtcclxuXHRcdFx0Ly8gU3VwcHJlc3MgXCJNb2R1bGUgbGV2ZWwgZGlyZWN0aXZlcyBjYXVzZSBlcnJvcnMgd2hlbiBidW5kbGVkXCIgd2FybmluZ3NcclxuXHRcdFx0aWYgKHdhcm5pbmcuY29kZSA9PT0gXCJNT0RVTEVfTEVWRUxfRElSRUNUSVZFXCIpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0d2Fybih3YXJuaW5nKTtcclxuXHRcdH0sXHJcblx0fVxyXG59O1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoe21vZGV9KSA9PiAoe1xyXG5cdC4uLmRlZmF1bHRDb25maWcsXHJcblx0ZXNidWlsZDoge1xyXG5cdFx0cHVyZTogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gWyAnY29uc29sZS5sb2cnIF0gOiBbXSxcclxuXHRcdGtlZXBOYW1lczogdHJ1ZSxcclxuXHR9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFMsU0FBUyxnQkFBQUEscUJBQW9COzs7QUNBakMsU0FBUyxvQkFBb0I7QUFDclUsT0FBTyxtQkFBbUI7QUFFbkIsSUFBTSxnQkFBZ0I7QUFBQSxFQUM1QixTQUFTLENBQUMsY0FBYyxDQUFRO0FBQUEsRUFDaEMsUUFBUSxFQUFFLE1BQU0sV0FBVyxNQUFNLElBQUs7QUFBQSxFQUN0QyxhQUFhO0FBQUEsRUFDYixPQUFPO0FBQUEsSUFDTixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsRUFDWjtBQUFBLEVBQ0EsZUFBZTtBQUFBLElBQ2QsT0FBTyxTQUFTLE1BQU07QUFFckIsVUFBSSxRQUFRLFNBQVMsMEJBQTBCO0FBQzlDO0FBQUEsTUFDRDtBQUNBLFdBQUssT0FBTztBQUFBLElBQ2I7QUFBQSxFQUNEO0FBQ0Q7QUFHQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFDLEtBQUksT0FBTztBQUFBLEVBQ3hDLEdBQUc7QUFBQSxFQUNILFNBQVM7QUFBQSxJQUNSLE1BQU0sU0FBUyxlQUFlLENBQUUsYUFBYyxJQUFJLENBQUM7QUFBQSxJQUNuRCxXQUFXO0FBQUEsRUFDWjtBQUNELEVBQUU7OztBRDFCRixJQUFPLHdCQUFRQyxjQUFhLENBQUMsRUFBQyxLQUFJLE9BQU87QUFBQSxFQUN4QyxHQUFHO0FBQUEsRUFDSCxNQUFNO0FBQUEsSUFDTCxZQUFZLENBQUMsNEJBQTRCO0FBQUEsSUFDekMsUUFBUTtBQUFBLE1BQ1AsTUFBTTtBQUFBLFFBQ0wsUUFBUSxDQUFDLG9CQUFvQjtBQUFBLFFBQzdCLFdBQVc7QUFBQSxVQUNWLEtBQUs7QUFBQSxZQUNKLFNBQVMsQ0FBQyxvQkFBb0I7QUFBQSxVQUMvQjtBQUFBLFFBQ0Q7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBLElBQ0EsYUFBYTtBQUFBLElBQ2Isb0JBQW9CO0FBQUEsTUFDbkIsT0FBTztBQUFBLFFBQ04sV0FBVztBQUFBLE1BQ1o7QUFBQSxJQUNEO0FBQUEsSUFDQSxTQUFTO0FBQUEsSUFDVCxPQUFPO0FBQUEsSUFDUCxjQUFjO0FBQUEsSUFDZCxPQUFPO0FBQUEsSUFDUCxVQUFVO0FBQUEsTUFDVCxVQUFVO0FBQUEsTUFDVixrQkFBa0I7QUFBQSxNQUNsQixXQUFXLENBQUMsZ0JBQWdCLE1BQU07QUFBQSxJQUNuQztBQUFBLEVBQ0Q7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNSLE1BQU0sU0FBUyxlQUFlLENBQUUsYUFBYyxJQUFJLENBQUM7QUFBQSxJQUNuRCxXQUFXO0FBQUEsRUFDWjtBQUNELEVBQUU7IiwKICAibmFtZXMiOiBbImRlZmluZUNvbmZpZyIsICJkZWZpbmVDb25maWciXQp9Cg==
