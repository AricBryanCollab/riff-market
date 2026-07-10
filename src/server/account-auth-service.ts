import { z } from "zod";
import type {
	AccountCredentialsReadPort,
	AccountPasswordPort,
	AccountRegistrationPort,
} from "@/domains/accounts/application/account-auth";
import {
	signInAccount,
	signUpAccount,
} from "@/domains/accounts/application/account-auth";
import type { AccountAuthUser } from "@/domains/accounts/dto/account-auth";
import { bcryptAccountPasswords } from "@/domains/accounts/infrastructure/bcrypt-passwords";
import { PrismaAccountAuth } from "@/domains/accounts/infrastructure/prisma-account-auth";
import {
	type SignInInput,
	type SignUpInput,
	signInSchema,
	signUpSchema,
} from "@/lib/zod/auth-validation";
import { RequestError, toRequestError } from "@/server/request-error";

type AuthSessionData = {
	readonly userId: string;
	readonly role: AccountAuthUser["role"];
};

export type AuthSession = {
	readonly update: (data: AuthSessionData) => Promise<unknown>;
	readonly clear: () => Promise<unknown>;
};

export type AuthSessionProvider = () => Promise<AuthSession>;

export function validateSignInRequest(data: unknown): SignInInput {
	const parsed = signInSchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid sign in data", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export function validateSignUpRequest(data: unknown): SignUpInput {
	const parsed = signUpSchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid sign up data", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function establishAuthSession(
	user: AccountAuthUser,
	getSession: AuthSessionProvider,
) {
	const session = await getSession();

	await session.update({
		userId: user.id,
		role: user.role,
	});

	return {
		success: true,
		user: {
			id: user.id,
			email: user.email,
		},
	};
}

export async function clearAuthSession(getSession: AuthSessionProvider) {
	const session = await getSession();

	await session.clear();

	return { message: "Sign out is successful" };
}

export async function signUpAccountService(
	data: SignUpInput,
	accounts?: AccountRegistrationPort,
	passwords?: AccountPasswordPort,
): Promise<AccountAuthUser> {
	const result = await signUpAccount(
		toSignUpCommand(data),
		accounts ?? (await createPrismaAccountAuth()),
		passwords ?? bcryptAccountPasswords,
	);

	if (!result.ok) {
		throw toRequestError(result.error);
	}

	return result.value;
}

export async function signInAccountService(
	data: SignInInput,
	accounts?: AccountCredentialsReadPort,
	passwords?: AccountPasswordPort,
): Promise<AccountAuthUser> {
	const result = await signInAccount(
		data,
		accounts ?? (await createPrismaAccountAuth()),
		passwords ?? bcryptAccountPasswords,
	);

	if (!result.ok) {
		throw toRequestError(result.error);
	}

	return result.value;
}

function toSignUpCommand(data: SignUpInput) {
	return {
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
		password: data.password,
		role: data.role,
	};
}

async function createPrismaAccountAuth() {
	const { prisma } = await import("@/data/connect-db");
	return new PrismaAccountAuth(prisma);
}
