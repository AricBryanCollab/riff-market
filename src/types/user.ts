import type { UserRole } from "@/types/enum";

export interface UserProfile {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: UserRole;
	theme: string;
	phone: string | null;
	profilePic: string | null;
	address: string | null;
}

export interface UpdateUserRequest {
	firstName?: string;
	lastName?: string;
	phone?: string | null;
	address?: string | null;
	theme?: string;
}

export interface UpdateUserProfilePictureRequest {
	profilePic: File;
}
