import type { Actor } from "./actor";

export type DomainEventPayload = Readonly<Record<string, unknown>>;

export interface DomainEventMetadata {
	readonly actor?: Actor;
	readonly correlationId?: string;
	readonly causationId?: string;
}

export interface DomainEvent<
	TName extends string = string,
	TPayload extends DomainEventPayload = DomainEventPayload,
> {
	readonly eventId: string;
	readonly eventName: TName;
	readonly occurredAt: Date;
	readonly aggregateId: string;
	readonly payload: TPayload;
	readonly metadata?: DomainEventMetadata;
}

export interface RecordsDomainEvents {
	pullDomainEvents(): DomainEvent[];
}

export type CreateDomainEventInput<
	TName extends string,
	TPayload extends DomainEventPayload,
> = Omit<DomainEvent<TName, TPayload>, "eventId" | "occurredAt"> & {
	readonly eventId?: string;
	readonly occurredAt?: Date;
};

export function createDomainEvent<
	TName extends string,
	TPayload extends DomainEventPayload,
>(
	input: CreateDomainEventInput<TName, TPayload>,
): DomainEvent<TName, TPayload> {
	return {
		...input,
		eventId: input.eventId ?? createDomainEventId(),
		occurredAt: input.occurredAt ?? new Date(),
	};
}

function createDomainEventId() {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}

	return `event_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
