import z from "zod";
import {
	deleteUserService,
	getUserByIdService,
	updateValidatedUserProfilePicService,
	updateValidatedUserService,
} from "@/actions/user";
import {
	type UpdateUserInput,
	updateProfilePictureSchema,
	updateUserSchema,
} from "@/lib/zod/user-validation";

type ActionError = {
	error: string;
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
		throw new CurrentUserRequestError(result.error, {
			details: result.details,
			status: result.error === "User not found" ? 404 : 400,
		});
	}

	return result as UnwrappedActionResult<TResult>;
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
	const result = await getUserByIdService(userId);
	return unwrapActionResult(result).data;
}

export async function updateCurrentUser(userId: string, data: UpdateUserInput) {
	return unwrapActionResult(await updateValidatedUserService(userId, data));
}

export async function updateCurrentUserProfilePicture(
	userId: string,
	profilePic: File | null,
) {
	return unwrapActionResult(
		await updateValidatedUserProfilePicService(userId, profilePic),
	);
}

export async function deleteCurrentUser(userId: string, email: string) {
	return unwrapActionResult(await deleteUserService(userId, email));
}

export function toProfilePictureResponse(profilePic: string | null) {
	return {
		message: "Profile picture has been updated successfully",
		profilePic,
	};
}
