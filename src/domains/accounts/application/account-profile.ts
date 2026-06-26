import type {
	AccountDeletionResult,
	AccountProfile,
	AccountProfileUpdate,
} from "@/domains/accounts/dto/account-profile";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type AccountProfileErrorCode =
	| "ACCOUNT_PROFILE_NOT_FOUND"
	| "ACCOUNT_DELETE_EMAIL_MISMATCH";

export type AccountProfileError = AppError<AccountProfileErrorCode>;

export interface AccountProfileReadPort {
	findById(userId: string): Promise<AccountProfile | null>;
}

export interface AccountProfileWritePort {
	updateProfile(
		userId: string,
		data: AccountProfileUpdate,
	): Promise<AccountProfile>;
}

export interface AccountDeletionPort {
	deleteAccount(userId: string): Promise<void>;
}

export async function getAccountProfile(
	userId: string,
	accounts: AccountProfileReadPort,
): Promise<Result<AccountProfile, AccountProfileError>> {
	const account = await accounts.findById(userId);

	if (!account) {
		return err(accountNotFoundError());
	}

	return ok(account);
}

export async function updateAccountProfile(
	command: {
		readonly userId: string;
		readonly data: AccountProfileUpdate;
	},
	accounts: AccountProfileReadPort & AccountProfileWritePort,
): Promise<Result<AccountProfile, AccountProfileError>> {
	const account = await accounts.findById(command.userId);

	if (!account) {
		return err(accountNotFoundError());
	}

	return ok(await accounts.updateProfile(command.userId, command.data));
}

export async function deleteAccount(
	command: {
		readonly userId: string;
		readonly email: string;
	},
	accounts: AccountProfileReadPort & AccountDeletionPort,
): Promise<Result<AccountDeletionResult, AccountProfileError>> {
	const account = await accounts.findById(command.userId);

	if (!account) {
		return err(accountNotFoundError());
	}

	if (account.email !== command.email) {
		return err(
			accountError(
				"ACCOUNT_DELETE_EMAIL_MISMATCH",
				"Email verification failed for account deletion",
				"validation",
			),
		);
	}

	await accounts.deleteAccount(command.userId);

	return ok({
		message: "Account has been deleted successfully",
		deletedUserId: command.userId,
	});
}

function accountNotFoundError(): AccountProfileError {
	return accountError(
		"ACCOUNT_PROFILE_NOT_FOUND",
		"User not found",
		"not-found",
	);
}

function accountError(
	code: AccountProfileErrorCode,
	message: string,
	kind: AccountProfileError["kind"],
): AccountProfileError {
	return {
		code,
		message,
		kind,
	};
}
