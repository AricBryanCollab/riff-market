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
}

export type SessionData = {
	userId?: string;
	email?: string;
	role?: UserRole;
};
