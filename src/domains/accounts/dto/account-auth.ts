import type { ActorRole } from "@/domains/shared/domain/actor";

export interface AccountAuthUser {
	readonly id: string;
	readonly email: string;
	readonly role: ActorRole;
}

export interface AccountSignUpData {
	readonly firstName: string;
	readonly lastName: string;
	readonly email: string;
	readonly password: string;
	readonly role: ActorRole;
}

export interface AccountSignInData {
	readonly email: string;
	readonly password: string;
}
