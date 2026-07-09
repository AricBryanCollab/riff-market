import { describe, expect, it } from "vitest";
import {
	clearAuthSession,
	establishAuthSession,
	signInAccountService,
} from "./account-auth-service";

describe("account auth service", () => {
	it("establishes the auth session and returns the public auth response", async () => {
		const sessionUpdates: unknown[] = [];

		const response = await establishAuthSession(
			{
				id: "user-1",
				email: "angus@example.com",
				role: "CUSTOMER",
			},
			async () => ({
				update: async (data) => {
					sessionUpdates.push(data);
				},
				clear: async () => {
					throw new Error("clear should not be called");
				},
			}),
		);

		expect(sessionUpdates).toEqual([{ userId: "user-1", role: "CUSTOMER" }]);
		expect(response).toEqual({
			success: true,
			user: { id: "user-1", email: "angus@example.com" },
		});
	});

	it("clears the auth session for sign out delivery", async () => {
		let cleared = false;

		const response = await clearAuthSession(async () => ({
			update: async () => {
				throw new Error("update should not be called");
			},
			clear: async () => {
				cleared = true;
			},
		}));

		expect(cleared).toBe(true);
		expect(response).toEqual({ message: "Sign out is successful" });
	});

	it("throws request errors for account auth failures", async () => {
		await expect(
			signInAccountService(
				{ email: "missing@example.com", password: "secret" },
				{ findCredentialsByEmail: async () => null },
				{
					hashPassword: async (password) => `hashed-${password}`,
					verifyPassword: async () => false,
				},
			),
		).rejects.toMatchObject({
			message: "Invalid email or password",
			status: 400,
		});
	});
});
