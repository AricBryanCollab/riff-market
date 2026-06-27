import { describe, expect, it } from "vitest";
import { RequestError } from "@/server/request-error";
import {
	clearAuthSession,
	establishAuthSession,
	signInAccountService,
	validateSignInRequest,
	validateSignUpRequest,
} from "./account-auth-service";

describe("account auth service", () => {
	it("validates sign in server-function input", () => {
		expect(
			validateSignInRequest({
				email: " angus@example.com ",
				password: " secret ",
			}),
		).toEqual({
			email: "angus@example.com",
			password: "secret",
		});
	});

	it("validates sign up server-function input with a concrete default role", () => {
		expect(
			validateSignUpRequest({
				firstName: " Angus ",
				lastName: " Young ",
				email: " angus@example.com ",
				password: "secret",
				confirmPassword: "secret",
			}),
		).toEqual({
			firstName: "Angus",
			lastName: "Young",
			email: "angus@example.com",
			password: "secret",
			confirmPassword: "secret",
			role: "CUSTOMER",
		});
	});

	it("rejects invalid sign up server-function input", () => {
		expect(() =>
			validateSignUpRequest({
				firstName: "",
				lastName: "Young",
				email: "angus@example.com",
				password: "secret",
				confirmPassword: "different",
				role: "CUSTOMER",
			}),
		).toThrow(
			expect.objectContaining({
				details: expect.objectContaining({
					fieldErrors: expect.objectContaining({
						firstName: expect.any(Array),
						confirmPassword: expect.any(Array),
					}),
				}),
			}),
		);
	});

	it("rejects malformed auth emails", () => {
		expect(() =>
			validateSignInRequest({
				email: "not-an-email",
				password: "secret",
			}),
		).toThrow(RequestError);

		expect(() =>
			validateSignUpRequest({
				firstName: "Angus",
				lastName: "Young",
				email: "not-an-email",
				password: "secret",
				confirmPassword: "secret",
				role: "CUSTOMER",
			}),
		).toThrow(RequestError);

		expect(() =>
			validateSignUpRequest({
				firstName: "Angus",
				lastName: "Young",
				email: "not-an-email",
				password: "secret",
				confirmPassword: "secret",
				role: "CUSTOMER",
			}),
		).toThrow(
			expect.objectContaining({
				details: expect.objectContaining({
					fieldErrors: expect.objectContaining({
						email: ["Invalid email address"],
					}),
				}),
			}),
		);
	});

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
