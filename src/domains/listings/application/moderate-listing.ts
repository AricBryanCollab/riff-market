import type { Actor } from "@/domains/shared/domain/actor";
import {
	Listing,
	ListingLifecycleError,
	type ListingLifecycleEvent,
	type ListingSnapshot,
	type ListingStatus,
} from "../domain/listing";

export type ListingModerationDecision = "APPROVE" | "DECLINE";

export type ModerateListingCommand = {
	readonly listingId: string;
	readonly decision: ListingModerationDecision;
};

export type ListingModerationResult = {
	readonly id: string;
	readonly name: string;
	readonly sellerId: string;
	readonly status: ListingStatus;
	readonly isApproved: boolean;
};

export type ListingModerationErrorKind =
	| "authorization"
	| "not-found"
	| "validation"
	| "conflict"
	| "unexpected";

export type ListingModerationErrorCode =
	| "MODERATE_LISTING_UNAUTHORIZED"
	| "MODERATE_LISTING_NOT_FOUND"
	| "MODERATE_LISTING_INVALID_DECISION"
	| "MODERATE_LISTING_INVALID_TRANSITION"
	| "MODERATE_LISTING_EVENT_MISSING"
	| "MODERATE_LISTING_STALE_STATUS";

export type ListingModerationError = {
	readonly kind: ListingModerationErrorKind;
	readonly code: ListingModerationErrorCode;
	readonly message: string;
	readonly details?: unknown;
};

export type ModerateListingResult =
	| { readonly ok: true; readonly value: ListingModerationResult }
	| { readonly ok: false; readonly error: ListingModerationError };

export interface ListingModerationRepositoryPort {
	findListingForModeration(listingId: string): Promise<ListingSnapshot | null>;
	saveListingStatus(
		listingId: string,
		status: ListingStatus,
		expectedStatus: ListingStatus,
	): Promise<ListingModerationResult | null>;
}

export interface ListingModerationNotifierPort {
	notifyListingApproved(
		input: ListingModerationResult,
		event: ListingApprovedEvent,
	): Promise<void>;
	notifyListingDeclined(
		input: ListingModerationResult,
		event: ListingDeclinedEvent,
	): Promise<void>;
}

export interface ListingModerationWorkflowPort {
	moderate(
		actor: Actor,
		command: ModerateListingCommand,
	): Promise<ModerateListingResult>;
}

export type ListingApprovedEvent = Extract<
	ListingLifecycleEvent,
	{ readonly eventName: "ListingApproved" }
>;

export type ListingDeclinedEvent = Extract<
	ListingLifecycleEvent,
	{ readonly eventName: "ListingDeclined" }
>;

type ListingModerationEvent = ListingApprovedEvent | ListingDeclinedEvent;

export async function moderateListing(
	actor: Actor,
	command: ModerateListingCommand,
	listings: ListingModerationRepositoryPort,
	notifier: ListingModerationNotifierPort,
): Promise<ModerateListingResult> {
	if (actor.role !== "ADMIN") {
		return {
			ok: false,
			error: {
				kind: "authorization",
				code: "MODERATE_LISTING_UNAUTHORIZED",
				message: "Only admins can moderate listings",
			},
		};
	}

	if (command.decision !== "APPROVE" && command.decision !== "DECLINE") {
		return {
			ok: false,
			error: {
				kind: "validation",
				code: "MODERATE_LISTING_INVALID_DECISION",
				message: "Listing moderation decision is invalid",
			},
		};
	}

	const snapshot = await listings.findListingForModeration(command.listingId);

	if (!snapshot) {
		return {
			ok: false,
			error: {
				kind: "not-found",
				code: "MODERATE_LISTING_NOT_FOUND",
				message: "Listing not found",
			},
		};
	}

	const listing = Listing.reconstitute(snapshot);

	try {
		if (command.decision === "APPROVE") {
			listing.approve(actor);
		} else {
			listing.decline(actor);
		}
	} catch (error) {
		if (error instanceof ListingLifecycleError) {
			return {
				ok: false,
				error: {
					kind: "conflict",
					code: "MODERATE_LISTING_INVALID_TRANSITION",
					message: error.message,
					details: { code: error.code },
				},
			};
		}

		throw error;
	}

	const moderationEvent = getModerationEvent(
		listing.pullDomainEvents(),
		listing.status,
	);
	if (!moderationEvent) {
		return {
			ok: false,
			error: {
				kind: "unexpected",
				code: "MODERATE_LISTING_EVENT_MISSING",
				message: "Listing moderation event was not recorded",
			},
		};
	}

	const savedListing = await listings.saveListingStatus(
		listing.id,
		listing.status,
		snapshot.status,
	);

	if (!savedListing) {
		return {
			ok: false,
			error: {
				kind: "conflict",
				code: "MODERATE_LISTING_STALE_STATUS",
				message: "Listing status changed before moderation completed",
			},
		};
	}

	await notifyModerationResult(notifier, savedListing, moderationEvent);

	return {
		ok: true,
		value: savedListing,
	};
}

async function notifyModerationResult(
	notifier: ListingModerationNotifierPort,
	listing: ListingModerationResult,
	event: ListingModerationEvent,
): Promise<void> {
	switch (event.eventName) {
		case "ListingApproved":
			await notifier.notifyListingApproved(listing, event);
			return;
		case "ListingDeclined":
			await notifier.notifyListingDeclined(listing, event);
			return;
	}
}

function getModerationEvent(
	events: readonly ListingLifecycleEvent[],
	status: ListingStatus,
): ListingModerationEvent | undefined {
	if (status === "APPROVED") {
		return events.find(isListingApprovedEvent);
	}

	if (status === "DECLINED") {
		return events.find(isListingDeclinedEvent);
	}

	return undefined;
}

function isListingApprovedEvent(
	event: ListingLifecycleEvent,
): event is ListingApprovedEvent {
	return event.eventName === "ListingApproved";
}

function isListingDeclinedEvent(
	event: ListingLifecycleEvent,
): event is ListingDeclinedEvent {
	return event.eventName === "ListingDeclined";
}
