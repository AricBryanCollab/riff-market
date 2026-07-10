import type { ActorRole } from "@/domains/shared/domain/actor";

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
	role: ActorRole;
}

export type SessionData = {
	userId?: string;
	role?: ActorRole;
};
