import z from "zod";
import {
	type UpdateUserInput,
	updateProfilePictureSchema,
	updateUserSchema,
} from "@/lib/zod/user-validation";
import {
	deleteAccount,
	getAccountProfile,
	updateAccountProfile,
	updateAccountProfilePicture,
} from "@/server/account-service";
import { isAppErrorKind, toAppErrorStatus } from "@/server/app-error-status";

type ActionError = {
	code?: string;
	error: string;
	kind?: string;
	details?: unknown;
};

type UnwrappedActionResult<TResult> = TResult extends ActionError
	? never
	: TResult;

export class CurrentUserRequestError extends Error {
	readonly details?: unknown;
	readonly status: number;

	constructor(
		message: string,
		options: { details?: unknown; status?: number } = {},
	) {
		super(message);
		this.name = "CurrentUserRequestError";
		this.details = options.details;
		this.status = options.status ?? 400;
	}
}

const deleteCurrentUserSchema = z.object({
	email: z.email("Enter the email address on your account"),
});

export type DeleteCurrentUserInput = z.infer<typeof deleteCurrentUserSchema>;

function isActionError(value: unknown): value is ActionError {
	return (
		typeof value === "object" &&
		value !== null &&
		"error" in value &&
		typeof value.error === "string"
	);
}

function unwrapActionResult<TResult>(
	result: TResult,
): UnwrappedActionResult<TResult> {
	if (isActionError(result)) {
		throw toCurrentUserRequestError(result);
	}

	return result as UnwrappedActionResult<TResult>;
}

function toCurrentUserRequestError(error: ActionError) {
	return new CurrentUserRequestError(error.error, {
		details: error.details,
		status: toCurrentUserStatus(error.kind),
	});
}

function toCurrentUserStatus(kind: ActionError["kind"]) {
	return isAppErrorKind(kind) ? toAppErrorStatus(kind) : 400;
}

function isMissingCurrentUserError(error: ActionError) {
	return error.code === "ACCOUNT_PROFILE_NOT_FOUND";
}

export function validateCurrentUserUpdateInput(data: unknown): UpdateUserInput {
	const parsed = updateUserSchema.safeParse(data);

	if (!parsed.success) {
		throw new CurrentUserRequestError("Invalid user data to update", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export function validateDeleteCurrentUserInput(
	data: unknown,
): DeleteCurrentUserInput {
	const parsed = deleteCurrentUserSchema.safeParse(data);

	if (!parsed.success) {
		throw new CurrentUserRequestError("Invalid account deletion request", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export function validateProfilePictureFormData(data: FormData) {
	if (!(data instanceof FormData)) {
		throw new CurrentUserRequestError("Expected profile picture form data");
	}

	const profilePic = data.get("profilePic");
	const parsed = updateProfilePictureSchema.safeParse({ profilePic });

	if (!parsed.success) {
		throw new CurrentUserRequestError("Invalid profile picture", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function getCurrentUser(userId: string) {
	const result = await getAccountProfile(userId);
	return unwrapActionResult(result).data;
}

export async function getOptionalCurrentUser(
	userId: string | null | undefined,
) {
	if (!userId) {
		return null;
	}

	const result = await getAccountProfile(userId);

	if (isActionError(result)) {
		if (isMissingCurrentUserError(result)) {
			return null;
		}

		throw toCurrentUserRequestError(result);
	}

	return result.data;
}

export async function updateCurrentUser(userId: string, data: UpdateUserInput) {
	return unwrapActionResult(await updateAccountProfile(userId, data));
}

export async function updateCurrentUserProfilePicture(
	userId: string,
	profilePic: File | null,
) {
	const result = unwrapActionResult(
		await updateAccountProfilePicture(userId, profilePic),
	);

	return result.profilePic;
}

export async function deleteCurrentUser(userId: string, email: string) {
	return unwrapActionResult(await deleteAccount(userId, email));
}

export function toProfilePictureResponse(profilePic: string | null) {
	return {
		message: "Profile picture has been updated successfully",
		profilePic,
	};
}
