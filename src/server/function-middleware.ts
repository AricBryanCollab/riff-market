import { createMiddleware } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { findUserById } from "@/data/auth-repo";
import { logger, updateRequestContext } from "@/lib/logger";
import { requestLoggerMiddleware } from "@/middleware";
import { RequestError } from "@/server/request-error";
import type { UserRole } from "@/types/enum";
import { useAppSession } from "@/utils/session";

export type ServerUserContext = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: UserRole;
};

export const serverAuthMiddleware = createMiddleware({
	type: "function",
}).server(async ({ next }) => {
	const session = await useAppSession();
	const userId = session.data.userId;

	if (!userId) {
		throw new RequestError("Access Denied. Unauthorized", {
			code: "AUTHENTICATION_REQUIRED",
			status: 401,
		});
	}

	const user = await findUserById(userId);

	if (!user) {
		throw new RequestError("User not found", {
			code: "AUTHENTICATED_USER_NOT_FOUND",
			status: 401,
		});
	}

	const serverUser: ServerUserContext = {
		id: user.id,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		role: user.role as UserRole,
	};

	updateRequestContext({
		userId: serverUser.id,
		userRole: serverUser.role,
	});

	return next({
		context: {
			session,
			user: serverUser,
		},
	});
});

export const createServerRoleMiddleware = (allowedRoles: UserRole[]) =>
	createMiddleware({ type: "function" })
		.middleware([serverAuthMiddleware])
		.server(async ({ context, next }) => {
			if (!allowedRoles.includes(context.user.role)) {
				throw new RequestError(
					"Access denied, your role is not allowed for this",
					{
						code: "ROLE_NOT_ALLOWED",
						status: 403,
					},
				);
			}

			return next();
		});

export const requestErrorMiddleware = createMiddleware({
	type: "function",
}).server(async ({ next }) => {
	try {
		return await next();
	} catch (error) {
		if (error instanceof RequestError) {
			setResponseStatus(error.status);
			throw error;
		}

		const fallbackMessage = "Failed to process request";
		logger.error(fallbackMessage, error);
		const requestError = new RequestError(fallbackMessage, {
			cause: error,
			status: 500,
		});
		setResponseStatus(requestError.status);
		throw requestError;
	}
});

export const publicServerFunctionMiddleware = [
	requestLoggerMiddleware,
	requestErrorMiddleware,
] as const;

export const authenticatedServerFunctionMiddleware = [
	requestLoggerMiddleware,
	requestErrorMiddleware,
	serverAuthMiddleware,
] as const;

export const createRoleServerFunctionMiddleware = (allowedRoles: UserRole[]) =>
	[
		requestLoggerMiddleware,
		requestErrorMiddleware,
		createServerRoleMiddleware(allowedRoles),
	] as const;
