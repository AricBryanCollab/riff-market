import { describe, expect, it } from "vitest";
import type {
	AccountProfile,
	AccountProfileUpdate,
} from "@/domains/accounts/dto/account-profile";
import {
	type AccountDeletionPort,
	type AccountProfileReadPort,
	type AccountProfileWritePort,
	deleteAccount,
	updateAccountProfile,
} from "./account-profile";

describe("account profile use cases", () => {
	it("updates an existing account profile", async () => {
		const account = makeAccount();
		const update = { firstName: "Malcolm", theme: "dark" };
		const accounts = new InMemoryAccounts([account]);

		const result = await updateAccountProfile(
			{
				userId: account.id,
				data: update,
			},
			accounts,
		);

		expect(result).toEqual({
			ok: true,
			value: makeAccount(update),
		});
		await expect(accounts.findById(account.id)).resolves.toEqual(
			makeAccount(update),
		);
	});

	it("rejects a phone number that is not 10-12 digits", async () => {
		const account = makeAccount();
		const accounts = new InMemoryAccounts([account]);

		const result = await updateAccountProfile(
			{
				userId: account.id,
				data: { phone: "123" },
			},
			accounts,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ACCOUNT_PROFILE_INVALID_PHONE_NUMBER",
				kind: "validation",
			},
		});
		await expect(accounts.findById(account.id)).resolves.toEqual(account);
	});

	it("accepts a valid phone number and allows clearing it", async () => {
		const account = makeAccount({ phone: "0123456789" });
		const accounts = new InMemoryAccounts([account]);

		const updated = await updateAccountProfile(
			{
				userId: account.id,
				data: { phone: "098765432109" },
			},
			accounts,
		);

		expect(updated).toEqual({
			ok: true,
			value: makeAccount({ phone: "098765432109" }),
		});

		const cleared = await updateAccountProfile(
			{
				userId: account.id,
				data: { phone: null },
			},
			accounts,
		);

		expect(cleared).toEqual({
			ok: true,
			value: makeAccount({ phone: null }),
		});
	});

	it("rejects an address shorter than 5 characters", async () => {
		const account = makeAccount();
		const accounts = new InMemoryAccounts([account]);

		const result = await updateAccountProfile(
			{
				userId: account.id,
				data: { address: "1 st" },
			},
			accounts,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ACCOUNT_PROFILE_INVALID_ADDRESS",
				kind: "validation",
			},
		});
		await expect(accounts.findById(account.id)).resolves.toEqual(account);
	});

	it("accepts a valid address and allows clearing it", async () => {
		const account = makeAccount({ address: "123 Market St" });
		const accounts = new InMemoryAccounts([account]);

		const updated = await updateAccountProfile(
			{
				userId: account.id,
				data: { address: "456 Mission St" },
			},
			accounts,
		);

		expect(updated).toEqual({
			ok: true,
			value: makeAccount({ address: "456 Mission St" }),
		});

		const cleared = await updateAccountProfile(
			{
				userId: account.id,
				data: { address: null },
			},
			accounts,
		);

		expect(cleared).toEqual({
			ok: true,
			value: makeAccount({ address: null }),
		});
	});

	it("does not update a missing account profile", async () => {
		const account = makeAccount();
		const accounts = new InMemoryAccounts([account]);

		const result = await updateAccountProfile(
			{
				userId: "missing",
				data: { firstName: "Malcolm" },
			},
			accounts,
		);

		expect(result).toMatchObject({
			ok: false,
			error: { code: "ACCOUNT_PROFILE_NOT_FOUND" },
		});
		await expect(accounts.findById(account.id)).resolves.toEqual(account);
		await expect(accounts.findById("missing")).resolves.toBeNull();
	});

	it("deletes an account after email confirmation", async () => {
		const account = makeAccount();
		const accounts = new InMemoryAccounts([account]);

		const result = await deleteAccount(
			{
				userId: account.id,
				email: account.email,
			},
			accounts,
		);

		expect(result).toEqual({
			ok: true,
			value: {
				message: "Account has been deleted successfully",
				deletedUserId: account.id,
			},
		});
		await expect(accounts.findById(account.id)).resolves.toBeNull();
	});

	it("rejects account deletion when confirmation email does not match", async () => {
		const account = makeAccount();
		const accounts = new InMemoryAccounts([account]);

		const result = await deleteAccount(
			{
				userId: account.id,
				email: "wrong@example.com",
			},
			accounts,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ACCOUNT_DELETE_EMAIL_MISMATCH",
				message: "Email verification failed for account deletion",
				kind: "validation",
			},
		});
		await expect(accounts.findById(account.id)).resolves.toEqual(account);
	});
});

function makeAccount(overrides: Partial<AccountProfile> = {}): AccountProfile {
	return {
		id: "user-1",
		firstName: "Angus",
		lastName: "Young",
		email: "angus@example.com",
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
	private readonly accounts = new Map<string, AccountProfile>();

	constructor(accounts: readonly AccountProfile[] = []) {
		for (const account of accounts) {
			this.accounts.set(account.id, account);
		}
	}

	async findById(userId: string): Promise<AccountProfile | null> {
		return this.accounts.get(userId) ?? null;
	}

	async updateProfile(
		userId: string,
		data: AccountProfileUpdate,
	): Promise<AccountProfile> {
		const account = this.accounts.get(userId);

		if (!account) {
			throw new Error(`Cannot update missing account ${userId}`);
		}

		const updatedAccount = { ...account, ...data };
		this.accounts.set(userId, updatedAccount);
		return updatedAccount;
	}

	async deleteAccount(userId: string): Promise<void> {
		this.accounts.delete(userId);
	}
}
