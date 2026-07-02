import { createMiddleware, createServerOnlyFn } from "@tanstack/react-start";
import type { RequestServerResult } from "@tanstack/start-client-core";
import type { User } from "generated/prisma/client";
import {
	getRequestLogOutcome,
	getRequestLogStatusCode,
} from "@/server/request-log-status";

const getRequestLoggerDependencies = createServerOnlyFn(async () => {
	return await import("@/lib/logger");
});

const getAuthMiddlewareDependencies = createServerOnlyFn(async () => {
	const [{ findUserById }, { updateRequestContext }, { useAppSession }] =
		await Promise.all([
			import("@/data/auth-repo"),
			import("@/lib/logger"),
			import("@/utils/session"),
		]);

	return { findUserById, updateRequestContext, useAppSession };
});

export const requestLoggerMiddleware = createMiddleware().server(
	async ({ next, request, context }) => {
		const {
			createRequestContext,
			logger,
			toErrorDetails,
			updateRequestContext,
			withRequestContext,
		} = await getRequestLoggerDependencies();
		const requestContext = createRequestContext(request);
		let nextResult:
			| Response
			| RequestServerResult<object, unknown, unknown>
			| undefined;
		let didThrow = false;
		let thrownError: unknown;

		return withRequestContext(requestContext, async () => {
			try {
				nextResult = await next({
					context: context && (context as Record<string, unknown>),
				});
				return nextResult as
					| Response
					| RequestServerResult<object, unknown, unknown>;
			} catch (error) {
				didThrow = true;
				thrownError = error;
				const statusCode = getRequestLogStatusCode(undefined, {
					didThrow,
					error,
				});
				updateRequestContext({
					statusCode,
					outcome: getRequestLogOutcome(statusCode),
					error: toErrorDetails(error),
				});
				throw error;
			} finally {
				const statusCode = getRequestLogStatusCode(nextResult, {
					didThrow,
					error: thrownError,
				});
				const durationMs =
					Date.now() - (requestContext.requestStartAt || Date.now());
				const outcome = getRequestLogOutcome(statusCode);

				updateRequestContext({
					statusCode,
					durationMs,
					outcome,
				});

				logger.info("request_completed", {
					status_code: statusCode,
					outcome,
					duration_ms: durationMs,
					resource: requestContext.path,
				});
			}
		});
	},
);

export const authMiddleware = createMiddleware().server(
	async ({ next, context }) => {
		const { findUserById, updateRequestContext, useAppSession } =
			await getAuthMiddlewareDependencies();
		const session = await useAppSession();

		const userId = session.data.userId;

		if (!session.data || !userId) {
			return new Response(
				JSON.stringify({ error: "Access Denied. Unauthorized" }),
				{
					status: 401,
				},
			);
		}

		const user = await findUserById(userId);
		if (!user) {
			return new Response(JSON.stringify({ error: "User not found" }), {
				status: 401,
			});
		}

		updateRequestContext({
			userId: user.id,
			userRole: user.role,
		});

		return next({
			context: {
				...(context ? (context as Record<string, unknown>) : {}),
				...user,
			},
		});
	},
);

export const roleMiddleware = (allowedRoles: string[]) =>
	createMiddleware()
		.middleware([authMiddleware])
		.server(async ({ next, context }) => {
			const { role } = context as User;

			if (!allowedRoles.includes(role)) {
				return new Response(
					JSON.stringify({
						error: "Access denied, your role is not allowed for this",
					}),
					{ status: 403 },
				);
			}

			return next();
		});
