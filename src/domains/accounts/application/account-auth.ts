import type {
	AccountAuthUser,
	AccountSignInData,
	AccountSignUpData,
} from "@/domains/accounts/dto/account-auth";
import type { ActorRole } from "@/domains/shared/domain/actor";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type AccountAuthErrorCode =
	| "ACCOUNT_AUTH_EMAIL_TAKEN"
	| "ACCOUNT_AUTH_INVALID_CREDENTIALS";

export type AccountAuthError = AppError<AccountAuthErrorCode>;

export interface AccountCredentials {
	readonly id: string;
	readonly email: string;
	readonly role: ActorRole;
	readonly passwordHash: string;
}

export interface AccountCredentialsReadPort {
	findCredentialsByEmail(email: string): Promise<AccountCredentials | null>;
}

export interface AccountRegistrationData {
	readonly firstName: string;
	readonly lastName: string;
	readonly email: string;
	readonly passwordHash: string;
	readonly role: ActorRole;
}

export interface AccountRegistrationPort {
	createAccount(
		data: AccountRegistrationData,
	): Promise<Result<AccountAuthUser, AccountAuthError>>;
}

export interface AccountPasswordPort {
	hashPassword(password: string): Promise<string>;
	verifyPassword(password: string, passwordHash: string): Promise<boolean>;
}

export async function signUpAccount(
	data: AccountSignUpData,
	accounts: AccountRegistrationPort,
	passwords: AccountPasswordPort,
): Promise<Result<AccountAuthUser, AccountAuthError>> {
	const passwordHash = await passwords.hashPassword(data.password);
	return accounts.createAccount({
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
		role: data.role,
		passwordHash,
	});
}

export async function signInAccount(
	data: AccountSignInData,
	accounts: AccountCredentialsReadPort,
	passwords: AccountPasswordPort,
): Promise<Result<AccountAuthUser, AccountAuthError>> {
	const account = await accounts.findCredentialsByEmail(data.email);

	if (!account) {
		return err(invalidCredentialsError());
	}

	const isValidPassword = await passwords.verifyPassword(
		data.password,
		account.passwordHash,
	);

	if (!isValidPassword) {
		return err(invalidCredentialsError());
	}

	return ok({
		id: account.id,
		email: account.email,
		role: account.role,
	});
}

function invalidCredentialsError(): AccountAuthError {
	return accountAuthError(
		"ACCOUNT_AUTH_INVALID_CREDENTIALS",
		"Invalid email or password",
	);
}

export function accountEmailTakenError(): AccountAuthError {
	return accountAuthError("ACCOUNT_AUTH_EMAIL_TAKEN", "User already exists");
}

function accountAuthError(
	code: AccountAuthErrorCode,
	message: string,
): AccountAuthError {
	return {
		code,
		message,
		kind: "validation",
	};
}
