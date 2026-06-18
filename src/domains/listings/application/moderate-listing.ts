import type { Actor } from "@/domains/shared/domain/actor";
import {
	Listing,
	ListingLifecycleError,
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
	| "MODERATE_LISTING_SAVE_FAILED";

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
	): Promise<ListingModerationResult | null>;
}

export interface ListingModerationNotifierPort {
	notifyListingApproved(input: ListingModerationResult): Promise<void>;
	notifyListingDeclined(input: ListingModerationResult): Promise<void>;
}

export class ModerateListing {
	constructor(
		private readonly listings: ListingModerationRepositoryPort,
		private readonly notifier: ListingModerationNotifierPort,
	) {}

	async execute(
		actor: Actor,
		command: ModerateListingCommand,
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

		const snapshot = await this.listings.findListingForModeration(
			command.listingId,
		);

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

		const savedListing = await this.listings.saveListingStatus(
			listing.id,
			listing.status,
		);

		if (!savedListing) {
			return {
				ok: false,
				error: {
					kind: "unexpected",
					code: "MODERATE_LISTING_SAVE_FAILED",
					message: "Failed to save listing moderation result",
				},
			};
		}

		if (listing.status === "APPROVED") {
			await this.notifier.notifyListingApproved(savedListing);
		}

		if (listing.status === "DECLINED") {
			await this.notifier.notifyListingDeclined(savedListing);
		}

		return {
			ok: true,
			value: savedListing,
		};
	}
}
