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
