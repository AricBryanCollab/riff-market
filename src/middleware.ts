import { createMiddleware } from "@tanstack/react-start";
import type { User } from "generated/prisma/client";

import { findUserById } from "@/data/auth.repo";
import { useAppSession } from "@/utils/session";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
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

	return next({ context: user });
});

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
