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
