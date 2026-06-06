import { createMiddleware } from "@tanstack/react-start";
import { findUserById } from "@/data/auth-repo";
import { updateRequestContext } from "@/lib/logger";
import { requestLoggerMiddleware } from "@/middleware";
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
		throw new Error("Access Denied. Unauthorized");
	}

	const user = await findUserById(userId);

	if (!user) {
		throw new Error("User not found");
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
				throw new Error("Access denied, your role is not allowed for this");
			}

			return next();
		});

export const authenticatedServerFunctionMiddleware = [
	requestLoggerMiddleware,
	serverAuthMiddleware,
] as const;
