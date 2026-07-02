import { createMiddleware, createServerOnlyFn } from "@tanstack/react-start";
import { requestLoggerMiddleware } from "@/middleware";
import { RequestError } from "@/server/request-error";
import type { UserRole } from "@/types/enum";

export type ServerUserContext = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: UserRole;
};

type AppSession = Awaited<
	ReturnType<typeof import("@/utils/session").useAppSession>
>;
type ServerUserLookup =
	| { readonly kind: "anonymous"; readonly session: AppSession }
	| { readonly kind: "missing-user"; readonly session: AppSession }
	| {
			readonly kind: "authenticated";
			readonly session: AppSession;
			readonly user: ServerUserContext;
	  };

const getServerUserLookupDependencies = createServerOnlyFn(async () => {
	const [
		{ prisma },
		{ PrismaAccountLookup },
		{ updateRequestContext },
		{ useAppSession },
	] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/accounts/infrastructure/prisma-account-lookup"),
		import("@/lib/logger"),
		import("@/utils/session"),
	]);
	const accountLookup = new PrismaAccountLookup(prisma);

	return {
		findUserById: (userId: string) => accountLookup.findById(userId),
		updateRequestContext,
		useAppSession,
	};
});

const setServerResponseStatus = createServerOnlyFn(async (status: number) => {
	const { setResponseStatus } = await import("@tanstack/react-start/server");
	setResponseStatus(status);
});

const logUnexpectedRequestError = createServerOnlyFn(async (error: unknown) => {
	const { logger } = await import("@/lib/logger");
	const fallbackMessage = "Failed to process request";

	logger.error(fallbackMessage, error);

	return fallbackMessage;
});

export const serverAuthMiddleware = createMiddleware({
	type: "function",
}).server(async ({ next }) => {
	const lookup = await getServerUserLookup();

	if (lookup.kind === "anonymous") {
		throw new RequestError("Access Denied. Unauthorized", {
			code: "AUTHENTICATION_REQUIRED",
			status: 401,
		});
	}

	if (lookup.kind === "missing-user") {
		throw new RequestError("User not found", {
			code: "AUTHENTICATED_USER_NOT_FOUND",
			status: 401,
		});
	}

	return next({
		context: {
			session: lookup.session,
			user: lookup.user,
		},
	});
});

export const getOptionalServerUserContext = createServerOnlyFn(
	async (): Promise<ServerUserContext | null> => {
		const lookup = await getServerUserLookup();

		return lookup.kind === "authenticated" ? lookup.user : null;
	},
);

const getServerUserLookup = createServerOnlyFn(
	async (): Promise<ServerUserLookup> => {
		const { findUserById, updateRequestContext, useAppSession } =
			await getServerUserLookupDependencies();
		const session = await useAppSession();
		const userId = session.data.userId;

		if (!userId) {
			return { kind: "anonymous", session };
		}

		const user = await findUserById(userId);

		if (!user) {
			return { kind: "missing-user", session };
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

		return { kind: "authenticated", session, user: serverUser };
	},
);

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
			await setServerResponseStatus(error.status);
			throw error;
		}

		const fallbackMessage = await logUnexpectedRequestError(error);
		const requestError = new RequestError(fallbackMessage, {
			cause: error,
			status: 500,
		});
		await setServerResponseStatus(requestError.status);
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
