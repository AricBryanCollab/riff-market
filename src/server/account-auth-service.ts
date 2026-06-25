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
import type { AppError } from "@/domains/shared/domain/result";
import {
	type SignUpInput,
	signInSchema,
	signUpSchema,
} from "@/lib/zod/auth-validation";
import type { SignInRequest, SignUpRequest } from "@/types/auth";

type AccountAuthServiceError = {
	readonly error: string;
	readonly details?: unknown;
};

export type AccountAuthServiceResult =
	| {
			readonly success: true;
			readonly user: AccountAuthUser;
	  }
	| AccountAuthServiceError;

export async function signUpAccountService(
	rawData: SignUpRequest,
	accounts?: AccountRegistrationPort,
	passwords?: AccountPasswordPort,
): Promise<AccountAuthServiceResult> {
	const parsed = signUpSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid sign up data",
			details: parsed.error,
		};
	}

	const result = await signUpAccount(
		toSignUpCommand(parsed.data),
		accounts ?? (await createPrismaAccountAuth()),
		passwords ?? bcryptAccountPasswords,
	);

	if (!result.ok) {
		return toAccountAuthServiceError(result.error);
	}

	return { success: true, user: result.value };
}

export async function signInAccountService(
	rawData: SignInRequest,
	accounts?: AccountCredentialsReadPort,
	passwords?: AccountPasswordPort,
): Promise<AccountAuthServiceResult> {
	const parsed = signInSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid sign in data",
			details: parsed.error,
		};
	}

	const result = await signInAccount(
		parsed.data,
		accounts ?? (await createPrismaAccountAuth()),
		passwords ?? bcryptAccountPasswords,
	);

	if (!result.ok) {
		return toAccountAuthServiceError(result.error);
	}

	return { success: true, user: result.value };
}

export function toPublicAuthResponse(result: {
	readonly success: true;
	readonly user: AccountAuthUser;
}) {
	return {
		success: true,
		user: {
			id: result.user.id,
			email: result.user.email,
		},
	};
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

function toAccountAuthServiceError(error: AppError): AccountAuthServiceError {
	return {
		error: error.message,
		...(error.details === undefined ? {} : { details: error.details }),
	};
}

async function createPrismaAccountAuth() {
	const { prisma } = await import("@/data/connect-db");
	return new PrismaAccountAuth(prisma);
}
