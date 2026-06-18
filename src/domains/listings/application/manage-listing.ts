import {
	Listing,
	ListingLifecycleError,
	type ListingSnapshot,
	type ListingStatus,
} from "@/domains/listings/domain/listing";
import type { Actor } from "@/domains/shared/domain/actor";
import type { AppError, Result } from "@/domains/shared/domain/result";
import { err, ok } from "@/domains/shared/domain/result";
import type { ImageAssetRef } from "@/types/image-asset";
import { toProductMoneyPersistence } from "./product-money";

export type ListingMutationFields = {
	readonly name?: string;
	readonly category?: string;
	readonly condition?: string;
	readonly brand?: string;
	readonly model?: string;
	readonly description?: string;
	readonly price?: number;
	readonly stock?: number;
};

export type CreateListingCommand = Required<ListingMutationFields> & {
	readonly imageFiles: File[];
};

export type UpdateListingCommand = ListingMutationFields & {
	readonly listingId: string;
	readonly imageFiles?: File[];
};

export type RemoveListingCommand = {
	readonly listingId: string;
};

export type ListingMutationPersistenceInput = ListingMutationFields & {
	readonly sellerId?: string;
	readonly images?: ImageAssetRef[];
	readonly priceCents?: number;
	readonly currencyCode?: string;
	readonly status: ListingStatus;
	readonly isApproved: boolean;
};

export type ListingMutationResult = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: string;
	readonly condition?: string;
	readonly brand: string;
	readonly model: string;
	readonly images: ImageAssetRef[];
	readonly description: string;
	readonly price: number;
	readonly priceCents?: number | null;
	readonly currencyCode?: string | null;
	readonly stock: number;
	readonly isApproved: boolean;
	readonly listingStatus: ListingStatus;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
};

export type ListingRemovalSnapshot = ListingSnapshot & {
	readonly images: ImageAssetRef[];
	readonly referenceCounts: {
		readonly legacyOrderItems: number;
		readonly sellerOrderItems: number;
		readonly reviews: number;
		readonly favorites: number;
	};
};

export type ListingRemovalResult = {
	readonly listingId: string;
	readonly mode: "DELETED" | "WITHDRAWN";
	readonly message: string;
};

export type ListingCommandErrorCode =
	| "LISTING_COMMAND_UNAUTHORIZED"
	| "LISTING_COMMAND_NOT_FOUND"
	| "LISTING_COMMAND_INVALID_TRANSITION"
	| "LISTING_COMMAND_SAVE_FAILED"
	| "LISTING_COMMAND_IMAGE_UPLOAD_FAILED";

export type ListingCommandError = AppError<ListingCommandErrorCode>;

export interface ListingCommandRepositoryPort {
	createListing(
		input: ListingMutationPersistenceInput,
	): Promise<ListingMutationResult | null>;
	findListingForMutation(
		listingId: string,
	): Promise<ListingRemovalSnapshot | null>;
	updateListing(
		listingId: string,
		input: ListingMutationPersistenceInput,
	): Promise<ListingMutationResult | null>;
	deleteListing(listingId: string): Promise<boolean>;
	saveListingStatus(
		listingId: string,
		status: ListingStatus,
	): Promise<ListingMutationResult | null>;
}

export interface ListingImageManagerPort {
	uploadImages(imageFiles: File[]): Promise<ImageAssetRef[]>;
	cleanupImagesBestEffort(images: ImageAssetRef[]): Promise<void>;
}

export class CreateListing {
	constructor(
		private readonly listings: ListingCommandRepositoryPort,
		private readonly images: ListingImageManagerPort,
	) {}

	async execute(
		actor: Actor,
		command: CreateListingCommand,
	): Promise<Result<ListingMutationResult, ListingCommandError>> {
		if (!canManageListings(actor)) {
			return err(
				unauthorizedError("Only sellers or admins can create listings"),
			);
		}

		let uploadedImages: ImageAssetRef[];
		try {
			uploadedImages = await this.images.uploadImages(command.imageFiles);
		} catch (error) {
			return err(imageUploadError(error));
		}

		try {
			const listing = await this.listings.createListing({
				...toPersistenceFields(command),
				sellerId: actor.id,
				images: uploadedImages,
				status: "PENDING",
				isApproved: false,
			});

			if (!listing) {
				await this.images.cleanupImagesBestEffort(uploadedImages);
				return err(saveFailedError("Failed to create listing"));
			}

			return ok(listing);
		} catch (error) {
			await this.images.cleanupImagesBestEffort(uploadedImages);
			throw error;
		}
	}
}

export class UpdateListing {
	constructor(
		private readonly listings: ListingCommandRepositoryPort,
		private readonly images: ListingImageManagerPort,
	) {}

	async execute(
		actor: Actor,
		command: UpdateListingCommand,
	): Promise<Result<ListingMutationResult, ListingCommandError>> {
		const existing = await this.listings.findListingForMutation(
			command.listingId,
		);

		if (!existing) {
			return err(notFoundError());
		}

		if (!canModifyListing(actor, existing.sellerId)) {
			return err(
				unauthorizedError("Unauthorized, user cannot modify this listing"),
			);
		}

		const uploadedImagesResult = await this.uploadReplacementImages(command);
		if (!uploadedImagesResult.ok) {
			return uploadedImagesResult;
		}

		const uploadedImages = uploadedImagesResult.value;
		const status = actor.role === "ADMIN" ? "APPROVED" : "PENDING";

		try {
			const listing = await this.listings.updateListing(command.listingId, {
				...toPersistenceFields(command),
				...(uploadedImages ? { images: uploadedImages } : {}),
				status,
				isApproved: status === "APPROVED",
			});

			if (!listing) {
				if (uploadedImages) {
					await this.images.cleanupImagesBestEffort(uploadedImages);
				}
				return err(saveFailedError("Failed to update listing"));
			}

			if (uploadedImages) {
				await this.images.cleanupImagesBestEffort(existing.images);
			}

			return ok(listing);
		} catch (error) {
			if (uploadedImages) {
				await this.images.cleanupImagesBestEffort(uploadedImages);
			}
			throw error;
		}
	}

	private async uploadReplacementImages(
		command: UpdateListingCommand,
	): Promise<Result<ImageAssetRef[] | undefined, ListingCommandError>> {
		if (!command.imageFiles || command.imageFiles.length === 0) {
			return ok(undefined);
		}

		try {
			return ok(await this.images.uploadImages(command.imageFiles));
		} catch (error) {
			return err(imageUploadError(error));
		}
	}
}

export class RemoveListing {
	constructor(
		private readonly listings: ListingCommandRepositoryPort,
		private readonly images: ListingImageManagerPort,
	) {}

	async execute(
		actor: Actor,
		command: RemoveListingCommand,
	): Promise<Result<ListingRemovalResult, ListingCommandError>> {
		const existing = await this.listings.findListingForMutation(
			command.listingId,
		);

		if (!existing) {
			return err(notFoundError());
		}

		if (!canModifyListing(actor, existing.sellerId)) {
			return err(
				unauthorizedError("Unauthorized, user cannot modify this listing"),
			);
		}

		if (hasReferences(existing)) {
			return this.withdrawReferencedListing(actor, existing);
		}

		const deleted = await this.listings.deleteListing(existing.id);

		if (!deleted) {
			return err(saveFailedError("Failed to delete listing"));
		}

		await this.images.cleanupImagesBestEffort(existing.images);

		return ok({
			listingId: existing.id,
			mode: "DELETED",
			message: "Product deleted successfully",
		});
	}

	private async withdrawReferencedListing(
		actor: Actor,
		existing: ListingRemovalSnapshot,
	): Promise<Result<ListingRemovalResult, ListingCommandError>> {
		const listing = Listing.reconstitute(existing);

		try {
			listing.withdraw(actor);
		} catch (error) {
			if (error instanceof ListingLifecycleError) {
				return err({
					kind: "conflict",
					code: "LISTING_COMMAND_INVALID_TRANSITION",
					message: error.message,
					details: { code: error.code },
				});
			}

			throw error;
		}

		const saved = await this.listings.saveListingStatus(
			listing.id,
			listing.status,
		);

		if (!saved) {
			return err(saveFailedError("Failed to withdraw listing"));
		}

		return ok({
			listingId: listing.id,
			mode: "WITHDRAWN",
			message: "Product withdrawn successfully",
		});
	}
}

function canManageListings(actor: Actor) {
	return actor.role === "SELLER" || actor.role === "ADMIN";
}

function canModifyListing(actor: Actor, sellerId: string) {
	return (
		actor.role === "ADMIN" || (actor.role === "SELLER" && actor.id === sellerId)
	);
}

function hasReferences(snapshot: ListingRemovalSnapshot) {
	return Object.values(snapshot.referenceCounts).some((count) => count > 0);
}

function toPersistenceFields(
	fields: ListingMutationFields,
): ListingMutationFields & {
	readonly priceCents?: number;
	readonly currencyCode?: string;
} {
	const priceData =
		fields.price !== undefined ? toProductMoneyPersistence(fields.price) : {};

	return {
		...(fields.name !== undefined && { name: fields.name }),
		...(fields.category !== undefined && { category: fields.category }),
		...(fields.condition !== undefined && { condition: fields.condition }),
		...(fields.brand !== undefined && { brand: fields.brand }),
		...(fields.model !== undefined && { model: fields.model }),
		...(fields.description !== undefined && {
			description: fields.description,
		}),
		...priceData,
		...(fields.stock !== undefined && { stock: fields.stock }),
	};
}

function unauthorizedError(message: string): ListingCommandError {
	return {
		kind: "authorization",
		code: "LISTING_COMMAND_UNAUTHORIZED",
		message,
	};
}

function notFoundError(): ListingCommandError {
	return {
		kind: "not-found",
		code: "LISTING_COMMAND_NOT_FOUND",
		message: "Listing not found",
	};
}

function saveFailedError(message: string): ListingCommandError {
	return {
		kind: "unexpected",
		code: "LISTING_COMMAND_SAVE_FAILED",
		message,
	};
}

function imageUploadError(error: unknown): ListingCommandError {
	return {
		kind: "unexpected",
		code: "LISTING_COMMAND_IMAGE_UPLOAD_FAILED",
		message: "Failed to upload images",
		details: error instanceof Error ? error.message : String(error),
	};
}
