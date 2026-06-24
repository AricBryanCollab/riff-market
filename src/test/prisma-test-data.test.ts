import { describe, expect, it } from "vitest";
import { requireSafeTestDatabaseUrl } from "./prisma-test-data";

describe("database-backed test URL guard", () => {
	it("accepts database names that clearly identify disposable test databases", () => {
		const url = "postgresql://user:pass@localhost:5432/riff_market_test";

		expect(requireSafeTestDatabaseUrl(url, "TEST_DATABASE_URL")).toBe(url);
		expect(
			requireSafeTestDatabaseUrl(
				"postgresql://user:pass@localhost:5432/test-riff-market",
				"TEST_DATABASE_URL",
			),
		).toBe("postgresql://user:pass@localhost:5432/test-riff-market");
	});

	it("rejects non-test database names before cleanup can run", () => {
		expect(() =>
			requireSafeTestDatabaseUrl(
				"postgresql://user:pass@localhost:5432/riff_market",
				"DATABASE_URL",
			),
		).toThrow(
			/DATABASE_URL points to database "riff_market".*delete rows.*TEST_DATABASE_URL/,
		);
	});

	it("rejects missing and malformed URLs", () => {
		expect(() => requireSafeTestDatabaseUrl(undefined)).toThrow(
			/TEST_DATABASE_URL is required/,
		);
		expect(() => requireSafeTestDatabaseUrl("not a url")).toThrow(
			/TEST_DATABASE_URL must be a valid database URL/,
		);
	});
});
