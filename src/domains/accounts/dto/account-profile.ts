import type { ActorRole } from "@/domains/shared/domain/actor";

export interface AccountProfile {
	readonly id: string;
	readonly firstName: string;
	readonly lastName: string;
	readonly email: string;
	readonly role: ActorRole;
	readonly theme: string;
	readonly phone: string | null;
	readonly profilePic: string | null;
	readonly address: string | null;
}

export interface AccountProfileUpdate {
	readonly firstName?: string;
	readonly lastName?: string;
	readonly phone?: string | null;
	readonly address?: string | null;
	readonly theme?: string;
}

export interface AccountDeletionResult {
	readonly message: string;
	readonly deletedUserId: string;
}
