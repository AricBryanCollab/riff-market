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
	role: UserRole | null;
}

export interface AuthResponse {
	success: boolean;
	user: { id: string; email: string };
}

export interface SignOutResponse {
	message: string;
}

export type SessionData = {
	userId?: string;
	role?: UserRole;
};
