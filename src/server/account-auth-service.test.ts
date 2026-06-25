import { describe, expect, it } from "vitest";
import {
	signInAccountService,
	signUpAccountService,
} from "./account-auth-service";

describe("account auth service", () => {
	it("returns validation errors for invalid sign up requests", async () => {
		const result = await signUpAccountService({
			firstName: "",
			lastName: "Young",
			email: "angus@example.com",
			password: "secret",
			confirmPassword: "different",
			role: "CUSTOMER",
		});

		expect(result).toMatchObject({
			error: "Invalid sign up data",
		});
	});

	it("returns validation errors for invalid sign in requests", async () => {
		const result = await signInAccountService({ email: "", password: "" });

		expect(result).toMatchObject({
			error: "Invalid sign in data",
		});
	});
});
