import { UserRole } from "./enum";

export interface SignUpRequest {
	email: string;
	password: string;
}

export type SessionData = {
	userId?: string;
	email?: string;
	role?: UserRole;
}