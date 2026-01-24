import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["src/**/*.test.{ts,tsx}"],
		exclude: ["src/**/*.browser.test.{ts,tsx}"],
		environment: "jsdom",
		setupFiles: ["src/test/vitest.setup.ts"],
	},
});
