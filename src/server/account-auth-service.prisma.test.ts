import type { PrismaClient } from "generated/prisma/client";
import { beforeEach, expect, it } from "vitest";
import type { AccountPasswordPort } from "@/domains/accounts/application/account-auth";
import { PrismaAccountAuth } from "@/domains/accounts/infrastructure/prisma-account-auth";
import {
	signInAccountService,
	signUpAccountService,
} from "@/server/account-auth-service";
import {
	describeDb,
	setupPrismaTestDatabase,
} from "@/test/prisma-vitest-support";

describeDb("account auth service Prisma integration", () => {
	let db: PrismaClient;
	let accounts: PrismaAccountAuth;
	const testDb = setupPrismaTestDatabase();

	beforeEach(() => {
		db = testDb.client;
		accounts = new PrismaAccountAuth(db);
	});

	it("signs up persisted accounts and creates default settings", async () => {
		const result = await signUpAccountService(
			{
				firstName: "Angus",
				lastName: "Young",
				email: "angus@example.com",
				password: "secret",
				confirmPassword: "secret",
				role: "CUSTOMER",
			},
			accounts,
			new FakePasswords(),
		);

		expect(result).toMatchObject({
			success: true,
			user: {
				email: "angus@example.com",
				role: "CUSTOMER",
			},
		});
		await expect(
			db.userSettings.findUnique({
				where: {
					userId: "success" in result ? result.user.id : "missing",
				},
				select: {
					theme: true,
					phone: true,
					address: true,
					profilePic: true,
				},
			}),
		).resolves.toEqual({
			theme: "light",
			phone: null,
			address: null,
			profilePic: null,
		});
	});

	it("signs in persisted accounts with matching credentials", async () => {
		await signUpAccountService(
			{
				firstName: "Angus",
				lastName: "Young",
				email: "angus@example.com",
				password: "secret",
				confirmPassword: "secret",
				role: "SELLER",
			},
			accounts,
			new FakePasswords(),
		);

		await expect(
			signInAccountService(
				{ email: "angus@example.com", password: "secret" },
				accounts,
				new FakePasswords(),
			),
		).resolves.toMatchObject({
			success: true,
			user: {
				email: "angus@example.com",
				role: "SELLER",
			},
		});
	});

	it("maps duplicate persisted sign-up emails to account auth errors", async () => {
		const passwords = new FakePasswords();
		const request = {
			firstName: "Angus",
			lastName: "Young",
			email: "angus@example.com",
			password: "secret",
			confirmPassword: "secret",
			role: "CUSTOMER" as const,
		};

		await expect(
			signUpAccountService(request, accounts, passwords),
		).resolves.toMatchObject({
			success: true,
		});
		await expect(
			signUpAccountService(request, accounts, passwords),
		).resolves.toEqual({
			error: "User already exists",
		});
	});
});

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
