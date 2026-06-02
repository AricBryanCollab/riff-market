import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
	deleteUserService,
	getUserByIdService,
	updateValidatedUserProfilePicService,
	updateValidatedUserService,
} from "@/actions/user";
import {
	udpateUserSchema,
	updateProfilePictureSchema,
} from "@/lib/zod/user-validation";
import { authenticatedServerFunctionMiddleware } from "@/server/function-middleware";

const deleteCurrentUserSchema = z.object({
	email: z.string().email("Enter the email address on your account"),
});

const profilePictureFormDataValidator = (data: FormData) => {
	if (!(data instanceof FormData)) {
		throw new Error("Expected profile picture form data");
	}

	const profilePic = data.get("profilePic");

	const parsed = updateProfilePictureSchema.safeParse({ profilePic });

	if (!parsed.success) {
		throw new Error(z.prettifyError(parsed.error));
	}

	return parsed.data;
};

export const getCurrentUserFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) => {
		const result = await getUserByIdService(context.user.id);

		if ("error" in result) {
			throw new Error(result.error);
		}

		return result.data;
	});

export const updateCurrentUserFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(udpateUserSchema)
	.handler(async ({ context, data }) => {
		const result = await updateValidatedUserService(context.user.id, data);

		if ("error" in result) {
			throw new Error(result.error);
		}

		return result;
	});

export const updateCurrentUserProfilePictureFn = createServerFn({
	method: "POST",
})
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(profilePictureFormDataValidator)
	.handler(async ({ context, data }) => {
		const result = await updateValidatedUserProfilePicService(
			context.user.id,
			data.profilePic,
		);

		if (result && typeof result === "object" && "error" in result) {
			throw new Error(result.error);
		}

		return {
			message: "Profile picture has been updated successfully",
			profilePic: result,
		};
	});

export const deleteCurrentUserFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(deleteCurrentUserSchema)
	.handler(async ({ context, data }) => {
		const result = await deleteUserService(context.user.id, data.email);

		if ("error" in result) {
			throw new Error(result.error);
		}

		await context.session.clear();

		return result;
	});
