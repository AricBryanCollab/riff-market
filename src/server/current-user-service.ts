import z from "zod";
import {
	type UpdateUserInput,
	updateProfilePictureSchema,
	updateUserSchema,
} from "@/lib/zod/user-validation";
import {
	type AccountServiceError,
	deleteAccount,
	getAccountProfile,
	updateAccountProfile,
	updateAccountProfilePicture,
} from "@/server/account-service";
import { RequestError, toRequestError } from "@/server/request-error";

const deleteCurrentUserSchema = z.object({
	email: z.email("Enter the email address on your account"),
});

export type DeleteCurrentUserInput = z.infer<typeof deleteCurrentUserSchema>;

function isAccountServiceError(value: unknown): value is AccountServiceError {
	return (
		typeof value === "object" &&
		value !== null &&
		"code" in value &&
		typeof value.code === "string" &&
		"kind" in value &&
		typeof value.kind === "string" &&
		"message" in value &&
		typeof value.message === "string"
	);
}

function unwrapActionResult<TResult>(
	result: TResult | AccountServiceError,
): TResult {
	if (isAccountServiceError(result)) {
		throw toRequestError(result);
	}

	return result;
}

function isMissingCurrentUserError(error: AccountServiceError) {
	return error.code === "ACCOUNT_PROFILE_NOT_FOUND";
}

export function validateCurrentUserUpdateInput(data: unknown): UpdateUserInput {
	const parsed = updateUserSchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid user data to update", {
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
		throw new RequestError("Invalid account deletion request", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export function validateProfilePictureFormData(data: FormData) {
	if (!(data instanceof FormData)) {
		throw new RequestError("Expected profile picture form data");
	}

	const profilePic = data.get("profilePic");
	const parsed = updateProfilePictureSchema.safeParse({ profilePic });

	if (!parsed.success) {
		throw new RequestError("Invalid profile picture", {
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

	if (isAccountServiceError(result)) {
		if (isMissingCurrentUserError(result)) {
			return null;
		}

		throw toRequestError(result);
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
