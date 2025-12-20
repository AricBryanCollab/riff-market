import { useSession } from "@tanstack/react-start/server";
import type { SessionData } from "@/types/auth";

export function useAppSession() {
	const sessionSecret = process.env.SESSION_SECRET;
	if (!sessionSecret) {
		throw new Error("SESSION_SECRET environment variable is not defined");
	}
	return useSession<SessionData>({
		name: "auth",
		password: sessionSecret,
		cookie: {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			httpOnly: true,
		},
	});
}
