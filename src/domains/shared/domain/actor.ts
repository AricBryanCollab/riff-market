export const actorRoles = ["ADMIN", "SELLER", "CUSTOMER"] as const;

export type ActorRole = (typeof actorRoles)[number];

export interface Actor {
	readonly id: string;
	readonly role: ActorRole;
}

export function isActorRole(value: string): value is ActorRole {
	return actorRoles.includes(value as ActorRole);
}
