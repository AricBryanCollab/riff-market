import { describe, expect, it } from "vitest";
import type {
	AccountAuthUser,
	AccountSignUpData,
} from "@/domains/accounts/dto/account-auth";
import { ok, type Result } from "@/domains/shared/domain/result";
import type {
	AccountAuthError,
	AccountCredentials,
	AccountCredentialsReadPort,
	AccountPasswordPort,
	AccountRegistrationData,
	AccountRegistrationPort,
} from "./account-auth";
import { signInAccount, signUpAccount } from "./account-auth";

describe("account auth use cases", () => {
	it("signs up a new account with a hashed password", async () => {
		const accounts = new InMemoryAuthAccounts();
		const passwords = new FakePasswords();
		const data = makeSignUpData();

		const result = await signUpAccount(data, accounts, passwords);

		expect(result).toEqual({
			ok: true,
			value: {
				id: "user-1",
				email: data.email,
				role: data.role,
			},
		});
		await expect(accounts.findCredentialsByEmail(data.email)).resolves.toEqual({
			id: "user-1",
			email: data.email,
			role: data.role,
			passwordHash: "hashed-secret",
		});
	});

	it("signs in an account with matching credentials", async () => {
		const existingAccount = makeCredentials();
		const accounts = new InMemoryAuthAccounts([existingAccount]);
		const passwords = new FakePasswords();

		const result = await signInAccount(
			{ email: existingAccount.email, password: "secret" },
			accounts,
			passwords,
		);

		expect(result).toEqual({
			ok: true,
			value: {
				id: existingAccount.id,
				email: existingAccount.email,
				role: existingAccount.role,
			},
		});
	});

	it("rejects sign in when the account is missing", async () => {
		const result = await signInAccount(
			{ email: "missing@example.com", password: "secret" },
			new InMemoryAuthAccounts(),
			new FakePasswords(),
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ACCOUNT_AUTH_INVALID_CREDENTIALS",
				message: "Invalid email or password",
				kind: "validation",
			},
		});
	});

	it("rejects signup with an admin role even when transport validation is bypassed", async () => {
		const result = await signUpAccount(
			makeSignUpData({ role: "ADMIN" }),
			new InMemoryAuthAccounts(),
			new FakePasswords(),
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ACCOUNT_AUTH_INVALID_SIGNUP_ROLE",
				message: "Admin accounts cannot be created via self-registration",
				kind: "validation",
			},
		});
	});

	it("rejects sign in when the password does not match", async () => {
		const existingAccount = makeCredentials();
		const result = await signInAccount(
			{ email: existingAccount.email, password: "wrong" },
			new InMemoryAuthAccounts([existingAccount]),
			new FakePasswords(),
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ACCOUNT_AUTH_INVALID_CREDENTIALS",
				message: "Invalid email or password",
				kind: "validation",
			},
		});
	});
});

function makeSignUpData(
	overrides: Partial<AccountSignUpData> = {},
): AccountSignUpData {
	return {
		firstName: "Angus",
		lastName: "Young",
		email: "angus@example.com",
		password: "secret",
		role: "CUSTOMER",
		...overrides,
	};
}

function makeCredentials(
	overrides: Partial<AccountCredentials> = {},
): AccountCredentials {
	return {
		id: "user-1",
		email: "angus@example.com",
		role: "CUSTOMER",
		passwordHash: "hashed-secret",
		...overrides,
	};
}

class InMemoryAuthAccounts
	implements AccountCredentialsReadPort, AccountRegistrationPort
{
	private readonly accounts = new Map<string, AccountCredentials>();

	constructor(accounts: readonly AccountCredentials[] = []) {
		for (const account of accounts) {
			this.accounts.set(account.email, account);
		}
	}

	async findCredentialsByEmail(
		email: string,
	): Promise<AccountCredentials | null> {
		return this.accounts.get(email) ?? null;
	}

	async createAccount(
		data: AccountRegistrationData,
	): Promise<Result<AccountAuthUser, AccountAuthError>> {
		const account = {
			id: "user-1",
			email: data.email,
			role: data.role,
			passwordHash: data.passwordHash,
		};
		this.accounts.set(data.email, account);

		return ok({
			id: account.id,
			email: account.email,
			role: account.role,
		});
	}
}

class FakePasswords implements AccountPasswordPort {
	async hashPassword(password: string): Promise<string> {
		return `hashed-${password}`;
	}

	async verifyPassword(
		password: string,
		passwordHash: string,
	): Promise<boolean> {
		return passwordHash === `hashed-${password}`;
	}
}
