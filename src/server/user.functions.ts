import { createServerFn } from "@tanstack/react-start";
import { requestLoggerMiddleware } from "@/middleware";
import {
	deleteCurrentUser,
	getCurrentUser,
	toProfilePictureResponse,
	updateCurrentUser,
	updateCurrentUserProfilePicture,
	validateCurrentUserUpdateInput,
	validateDeleteCurrentUserInput,
	validateProfilePictureFormData,
} from "@/server/current-user-service";
import { authenticatedServerFunctionMiddleware } from "@/server/function-middleware";
import { useAppSession } from "@/utils/session";

export const getOptionalCurrentUserFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.handler(async () => {
		const session = await useAppSession();
		const userId = session.data.userId;

		if (!userId) {
			return null;
		}

		try {
			return await getCurrentUser(userId);
		} catch {
			return null;
		}
	});

export const getCurrentUserFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) => getCurrentUser(context.user.id));

export const updateCurrentUserFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateCurrentUserUpdateInput)
	.handler(async ({ context, data }) =>
		updateCurrentUser(context.user.id, data),
	);

export const updateCurrentUserProfilePictureFn = createServerFn({
	method: "POST",
})
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateProfilePictureFormData)
	.handler(async ({ context, data }) => {
		const profilePic = await updateCurrentUserProfilePicture(
			context.user.id,
			data.profilePic,
		);

		return toProfilePictureResponse(profilePic);
	});

export const deleteCurrentUserFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateDeleteCurrentUserInput)
	.handler(async ({ context, data }) => {
		const result = await deleteCurrentUser(context.user.id, data.email);

		await context.session.clear();

		return result;
	});
