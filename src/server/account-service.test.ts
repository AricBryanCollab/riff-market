import { describe, expect, it } from "vitest";
import type {
	AccountDeletionPort,
	AccountProfileReadPort,
	AccountProfileWritePort,
} from "@/domains/accounts/application/account-profile";
import type {
	AccountProfile,
	AccountProfileUpdate,
} from "@/domains/accounts/dto/account-profile";
import {
	deleteCurrentUser,
	getCurrentUser,
	getOptionalCurrentUser,
	updateCurrentUser,
	validateCurrentUserUpdateInput,
	validateDeleteCurrentUserInput,
} from "./account-service";
import { RequestError } from "./request-error";

function makeAccount(overrides: Partial<AccountProfile> = {}): AccountProfile {
	return {
		id: "user-1",
		firstName: "Pat",
		lastName: "Buyer",
		email: "pat@example.com",
		role: "CUSTOMER",
		theme: "light",
		phone: null,
		profilePic: null,
		address: null,
		...overrides,
	};
}

class InMemoryAccounts
	implements
		AccountProfileReadPort,
		AccountProfileWritePort,
		AccountDeletionPort
{
	findByIdCalls = 0;

	constructor(private accounts: AccountProfile[] = []) {}

	async findById(userId: string): Promise<AccountProfile | null> {
		this.findByIdCalls += 1;
		return this.accounts.find((account) => account.id === userId) ?? null;
	}

	async updateProfile(
		userId: string,
		data: AccountProfileUpdate,
	): Promise<AccountProfile> {
		const account = this.accounts.find((entry) => entry.id === userId);
		if (!account) {
			throw new Error(`Account ${userId} not found`);
		}

		const updated = { ...account, ...data };
		this.accounts = this.accounts.map((entry) =>
			entry.id === userId ? updated : entry,
		);
		return updated;
	}

	async deleteAccount(userId: string): Promise<void> {
		this.accounts = this.accounts.filter((entry) => entry.id !== userId);
	}
}

describe("account service", () => {
	it("returns the current user profile", async () => {
		const accounts = new InMemoryAccounts([makeAccount()]);

		await expect(getCurrentUser("user-1", accounts)).resolves.toEqual(
			makeAccount(),
		);
	});

	it("throws a 404 request error for a missing current user", async () => {
		const accounts = new InMemoryAccounts();

		await expect(getCurrentUser("missing", accounts)).rejects.toMatchObject({
			code: "ACCOUNT_PROFILE_NOT_FOUND",
			status: 404,
		});
	});

	it("returns null for optional reads without a user id", async () => {
		const accounts = new InMemoryAccounts([makeAccount()]);

		await expect(getOptionalCurrentUser(null, accounts)).resolves.toBeNull();
		expect(accounts.findByIdCalls).toBe(0);
	});

	it("returns null for optional reads with a stale user id", async () => {
		const accounts = new InMemoryAccounts();

		await expect(
			getOptionalCurrentUser("missing", accounts),
		).resolves.toBeNull();
	});

	it("updates the current user profile", async () => {
		const accounts = new InMemoryAccounts([makeAccount()]);

		await expect(
			updateCurrentUser("user-1", { firstName: "Angus" }, accounts),
		).resolves.toEqual(makeAccount({ firstName: "Angus" }));
	});

	it("deletes the current user after email confirmation", async () => {
		const accounts = new InMemoryAccounts([makeAccount()]);

		await expect(
			deleteCurrentUser("user-1", "pat@example.com", accounts),
		).resolves.toEqual({
			message: "Account has been deleted successfully",
			deletedUserId: "user-1",
		});
		await expect(accounts.findById("user-1")).resolves.toBeNull();
	});

	it("validates and normalizes current-user update input", () => {
		expect(validateCurrentUserUpdateInput({ firstName: "  Angus  " })).toEqual({
			firstName: "Angus",
		});
	});

	it("throws request errors for invalid current-user update input", () => {
		expect(() => validateCurrentUserUpdateInput({})).toThrow(RequestError);
	});

	it("throws request errors for invalid account deletion input", () => {
		expect(() =>
			validateDeleteCurrentUserInput({ email: "not-an-email" }),
		).toThrow(RequestError);
	});
});
