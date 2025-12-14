import { SessionData } from "@/types/auth";
import { useSession } from "@tanstack/react-start/server";

export function useAppSession() {
	return useSession<SessionData>({
		name:"auth",
		password: process.env.SESSION_SECRET!,
		cookie: {
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			httpOnly: true
		}
	})
}