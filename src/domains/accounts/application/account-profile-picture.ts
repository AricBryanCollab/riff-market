import type {
	AccountProfilePictureAsset,
	AccountProfilePictureUpdateResult,
} from "@/domains/accounts/dto/account-profile-picture";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type AccountProfilePictureErrorCode =
	| "ACCOUNT_PROFILE_NOT_FOUND"
	| "ACCOUNT_PROFILE_PICTURE_UPDATE_FAILED";

export type AccountProfilePictureError =
	AppError<AccountProfilePictureErrorCode>;

export interface AccountProfilePictureState {
	readonly profilePic: AccountProfilePictureAsset | null;
}

export interface AccountProfilePictureReadPort {
	findProfilePictureStateByUserId(
		userId: string,
	): Promise<AccountProfilePictureState | null>;
}

export interface AccountProfilePictureWritePort {
	updateProfilePicture(
		userId: string,
		profilePic: AccountProfilePictureAsset | null,
	): Promise<void>;
}

export interface AccountProfilePictureUploadPort<TUploadInput> {
	uploadProfilePicture(
		profilePic: TUploadInput,
	): Promise<AccountProfilePictureAsset>;
}

export interface AccountProfilePictureCleanupPort {
	deleteProfilePictureAsset(
		profilePic: AccountProfilePictureAsset,
	): Promise<void>;
}

export interface AccountProfilePictureLogger {
	error(message: string, error: unknown): void;
}

export type UpdateAccountProfilePictureCommand<TUploadInput> = {
	readonly userId: string;
} & (
	| {
			readonly kind: "remove";
	  }
	| {
			readonly kind: "replace";
			readonly profilePic: TUploadInput;
	  }
);

export async function updateAccountProfilePicture<TUploadInput>(
	command: UpdateAccountProfilePictureCommand<TUploadInput>,
	accounts: AccountProfilePictureReadPort & AccountProfilePictureWritePort,
	imageAssets: AccountProfilePictureUploadPort<TUploadInput> &
		AccountProfilePictureCleanupPort,
	logger: AccountProfilePictureLogger = noopLogger,
): Promise<
	Result<AccountProfilePictureUpdateResult, AccountProfilePictureError>
> {
	const account = await accounts.findProfilePictureStateByUserId(
		command.userId,
	);

	if (!account) {
		return err(accountNotFoundError());
	}

	let uploadedProfilePic: AccountProfilePictureAsset | null = null;
	let nextProfilePic: AccountProfilePictureAsset | null = null;

	try {
		if (command.kind === "replace") {
			uploadedProfilePic = await imageAssets.uploadProfilePicture(
				command.profilePic,
			);
			nextProfilePic = uploadedProfilePic;
		}

		await accounts.updateProfilePicture(command.userId, nextProfilePic);
	} catch (error) {
		await cleanupProfilePictureAsset(
			uploadedProfilePic,
			imageAssets,
			logger,
			"Failed to clean up orphaned uploaded profile picture after update failure",
		);
		logger.error("Failed to update profile picture", error);

		return err(profilePictureUpdateFailedError(error));
	}

	await cleanupProfilePictureAsset(
		account.profilePic,
		imageAssets,
		logger,
		command.kind === "remove"
			? "Failed to clean up orphaned removed profile picture asset"
			: "Failed to clean up orphaned replaced profile picture asset",
	);

	return ok({ profilePic: nextProfilePic?.url ?? null });
}

async function cleanupProfilePictureAsset(
	profilePic: AccountProfilePictureAsset | null,
	imageAssets: AccountProfilePictureCleanupPort,
	logger: AccountProfilePictureLogger,
	logMessage: string,
) {
	if (!profilePic) {
		return;
	}

	try {
		await imageAssets.deleteProfilePictureAsset(profilePic);
	} catch (error) {
		logger.error(logMessage, error);
	}
}

function accountNotFoundError(): AccountProfilePictureError {
	return {
		code: "ACCOUNT_PROFILE_NOT_FOUND",
		message: "User not found",
		kind: "not-found",
	};
}

function profilePictureUpdateFailedError(
	error: unknown,
): AccountProfilePictureError {
	return {
		code: "ACCOUNT_PROFILE_PICTURE_UPDATE_FAILED",
		message: "Failed to update the user profile picture",
		kind: "unexpected",
		details: getErrorMessage(error, "Internal server error"),
	};
}

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

const noopLogger: AccountProfilePictureLogger = {
	error() {},
};
