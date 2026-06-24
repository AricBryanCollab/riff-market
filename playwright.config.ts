import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { requireSafeTestDatabaseUrl } from "./src/test/prisma-test-data";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;
const testDatabaseUrl = requireSafeTestDatabaseUrl(
	process.env.TEST_DATABASE_URL,
	"TEST_DATABASE_URL",
);

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	webServer: {
		command: `bun --bun vite dev --host 127.0.0.1 --port ${port} --strictPort`,
		url: baseURL,
		reuseExistingServer: false,
		timeout: 60_000,
		stdout: "ignore",
		stderr: "pipe",
		env: {
			DATABASE_URL: testDatabaseUrl,
			TEST_DATABASE_URL: testDatabaseUrl,
			SESSION_SECRET: process.env.SESSION_SECRET ?? "x".repeat(32),
			CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "local",
			CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "local",
			CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "local",
			CLOUDINARY_UPLOAD_PRESET:
				process.env.CLOUDINARY_UPLOAD_PRESET ?? "local",
		},
	},
	projects: [
		{
			name: "setup db",
			testMatch: /.*\.setup\.ts/,
			teardown: "cleanup db",
		},
		{
			name: "cleanup db",
			testMatch: /.*\.teardown\.ts/,
		},
		{
			name: "chromium",
			testMatch: /.*\.spec\.ts/,
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup db"],
		},
	],
});
