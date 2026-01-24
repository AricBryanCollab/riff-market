/// <reference types="@vitest/browser/providers/playwright" />
import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vite.config";

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			include: ["src/**/*.browser.test.{ts,tsx}"],
			setupFiles: ["src/test/vitest-browser.setup.ts"],
			browser: {
				enabled: true,
				provider: "playwright",
				headless: true,
				api: {
					host: "127.0.0.1",
					port: 63315,
				},
				instances: [{ browser: "chromium" }],
			},
		},
	}),
);
