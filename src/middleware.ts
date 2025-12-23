import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import type { User } from "generated/prisma/client";

import { findUserById } from "@/data/auth.repo";
import { useAppSession } from "@/utils/session";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const session = await useAppSession();

	if (!session?.id) {
		throw redirect({ to: "/" });
	}

	const user = await findUserById(session.id);
	if (!user) {
		throw redirect({ to: "/" });
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
