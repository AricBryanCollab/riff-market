import {
	isValidPassword,
	MIN_PASSWORD_LENGTH,
} from "@/domains/accounts/domain/password";
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

export const selfAssignableRoles = ["SELLER", "CUSTOMER"] as const;

export type SelfAssignableRole = (typeof selfAssignableRoles)[number];

export type AccountAuthErrorCode =
	| "ACCOUNT_AUTH_EMAIL_TAKEN"
	| "ACCOUNT_AUTH_INVALID_CREDENTIALS"
	| "ACCOUNT_AUTH_INVALID_PASSWORD"
	| "ACCOUNT_AUTH_INVALID_SIGNUP_ROLE";

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
	if (!isSelfAssignableRole(data.role)) {
		return err(invalidSignupRoleError());
	}

	if (!isValidPassword(data.password)) {
		return err(invalidPasswordError());
	}

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

	const passwordMatches = await passwords.verifyPassword(
		data.password,
		account.passwordHash,
	);

	if (!passwordMatches) {
		return err(invalidCredentialsError());
	}

	return ok({
		id: account.id,
		email: account.email,
		role: account.role,
	});
}

function isSelfAssignableRole(role: ActorRole): role is SelfAssignableRole {
	return selfAssignableRoles.includes(role as SelfAssignableRole);
}

function invalidCredentialsError(): AccountAuthError {
	return accountAuthError(
		"ACCOUNT_AUTH_INVALID_CREDENTIALS",
		"Invalid email or password",
	);
}

function invalidPasswordError(): AccountAuthError {
	return accountAuthError(
		"ACCOUNT_AUTH_INVALID_PASSWORD",
		`Password must be at least ${MIN_PASSWORD_LENGTH} characters and include uppercase, lowercase, a number, and a special character`,
	);
}

function invalidSignupRoleError(): AccountAuthError {
	return accountAuthError(
		"ACCOUNT_AUTH_INVALID_SIGNUP_ROLE",
		"Admin accounts cannot be created via self-registration",
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
