import type { UserRole } from "@/types/enum";

export interface SignInRequest {
	email: string;
	password: string;
}

export interface SignUpRequest {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	confirmPassword: string;
	role: UserRole;
}

export type SessionData = {
	userId?: string;
	role?: UserRole;
};
