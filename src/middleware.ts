import { createMiddleware } from "@tanstack/react-start";
import type { RequestServerResult } from "@tanstack/start-client-core";
import type { User } from "generated/prisma/client";
import { findUserById } from "@/data/auth-repo";
import {
	createRequestContext,
	logger,
	toErrorDetails,
	updateRequestContext,
	withRequestContext,
} from "@/lib/logger";
import { useAppSession } from "@/utils/session";

export const requestLoggerMiddleware = createMiddleware().server(
	async ({ next, request, context }) => {
		const requestContext = createRequestContext(request);
		let nextResult:
			| Response
			| RequestServerResult<object, unknown, unknown>
			| undefined;

		return withRequestContext(requestContext, async () => {
			try {
				nextResult = await next({
					context: context && (context as Record<string, unknown>),
				});
				return nextResult as
					| Response
					| RequestServerResult<object, unknown, unknown>;
			} catch (error) {
				updateRequestContext({
					statusCode: 500,
					outcome: "error",
					error: toErrorDetails(error),
				});
				throw error;
			} finally {
				const response =
					nextResult instanceof Response
						? nextResult
						: nextResult?.response || new Response(null, { status: 500 });
				const statusCode = response?.status ?? 500;
				const durationMs =
					Date.now() - (requestContext.requestStartAt || Date.now());
				const hasServerError = statusCode >= 500;
				const outcome = hasServerError
					? "error"
					: statusCode >= 400
						? "warning"
						: "success";

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
				throw new Error("Access denied, your role is not allowed for this");
			}

			return next();
		});
