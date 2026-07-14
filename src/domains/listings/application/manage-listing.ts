import {
	Listing,
	ListingLifecycleError,
	type ListingSnapshot,
	type ListingStatus,
} from "@/domains/listings/domain/listing";
import { normalizeListingBrand } from "@/domains/listings/domain/listing-brand";
import { isValidInitialStock } from "@/domains/listings/domain/listing-stock";
import type { Actor } from "@/domains/shared/domain/actor";
import { Money } from "@/domains/shared/domain/money";
import type { AppError, Result } from "@/domains/shared/domain/result";
import { err, ok } from "@/domains/shared/domain/result";
import type { ImageAssetRef } from "@/domains/shared/domain/image-asset";
import { toListingMoneyPersistence } from "./listing-money";

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

export type CreateListingCommand<TUploadInput> = Required<ListingMutationFields> & {
	readonly imageFiles: TUploadInput[];
};

export type ListingImageUpdateItem =
	| {
			readonly kind: "existing";
			readonly imageId: string;
	  }
	| {
			readonly kind: "new";
			readonly index: number;
	  };

export type ListingImageUpdate = {
	readonly items: ListingImageUpdateItem[];
};

export type UpdateListingCommand<TUploadInput> = ListingMutationFields & {
	readonly listingId: string;
	readonly imageFiles?: TUploadInput[];
	readonly imageUpdate?: ListingImageUpdate;
};

export type RemoveListingCommand = {
	readonly listingId: string;
};

export type ListingImageCleanupSource = {
	readonly listingId: string;
	readonly sellerId: string;
};

type ListingPersistenceFields = {
	readonly name: string;
	readonly category: string;
	readonly condition: string;
	readonly brand: string;
	readonly model: string;
	readonly description: string;
	readonly priceAmountMinor: number;
	readonly currencyCode: string;
	readonly stock: number;
};

export type CreateListingPersistenceInput = ListingPersistenceFields & {
	readonly sellerId: string;
	readonly images: ImageAssetRef[];
	readonly status: ListingStatus;
	readonly isApproved: boolean;
};

export type UpdateListingPersistenceInput =
	Partial<ListingPersistenceFields> & {
		readonly images?: ImageAssetRef[];
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
	readonly priceAmountMinor: number;
	readonly currencyCode: string;
	readonly stock: number;
	readonly isApproved: boolean;
	readonly listingStatus: ListingStatus;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
};

export type ListingRemovalSnapshot = ListingSnapshot & {
	readonly images: ImageAssetRef[];
	readonly referenceCounts: {
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
	| "LISTING_COMMAND_INVALID_IMAGES"
	| "LISTING_COMMAND_INVALID_STOCK"
	| "LISTING_COMMAND_IMAGE_UPLOAD_FAILED";

export type ListingCommandError = AppError<ListingCommandErrorCode>;

export interface ListingCommandRepositoryPort {
	createListing(
		input: CreateListingPersistenceInput,
	): Promise<ListingMutationResult | null>;
	findListingForMutation(
		listingId: string,
	): Promise<ListingRemovalSnapshot | null>;
	updateListing(
		listingId: string,
		input: UpdateListingPersistenceInput,
	): Promise<ListingMutationResult | null>;
	deleteListing(listingId: string): Promise<boolean>;
	saveListingStatus(
		listingId: string,
		status: ListingStatus,
	): Promise<ListingMutationResult | null>;
}

export interface ListingImageManagerPort<TUploadInput> {
	uploadImages(imageFiles: TUploadInput[]): Promise<ImageAssetRef[]>;
	cleanupUploadedImagesBestEffort(images: ImageAssetRef[]): Promise<void>;
	cleanupPersistedImagesBestEffort(
		images: ImageAssetRef[],
		source: ListingImageCleanupSource,
	): Promise<void>;
}

export type ListingCommandDependencies<TUploadInput> = {
	readonly listings: ListingCommandRepositoryPort;
	readonly images: ListingImageManagerPort<TUploadInput>;
};

export async function createListing<TUploadInput>(
	actor: Actor,
	command: CreateListingCommand<TUploadInput>,
	dependencies: ListingCommandDependencies<TUploadInput>,
): Promise<Result<ListingMutationResult, ListingCommandError>> {
	const { listings, images } = dependencies;

	if (!canManageListings(actor)) {
		return err(unauthorizedError("Only sellers or admins can create listings"));
	}

	if (!isValidInitialStock(command.stock)) {
		return err(invalidStockError("New listings must have at least 1 stock"));
	}

	let uploadedImages: ImageAssetRef[];
	try {
		uploadedImages = await images.uploadImages(command.imageFiles);
	} catch (error) {
		return err(imageUploadError(error));
	}

	if (uploadedImages.length === 0) {
		return err(invalidImagesError("Listing must keep at least one image"));
	}

	const price = toListingMoneyPersistence(command.price);

	try {
		const saved = await listings.createListing({
			sellerId: actor.id,
			name: command.name,
			category: command.category,
			condition: command.condition,
			brand: normalizeListingBrand(command.brand),
			model: command.model,
			description: command.description,
			priceAmountMinor: price.priceAmountMinor,
			currencyCode: price.currencyCode,
			stock: command.stock,
			status: "PENDING",
			isApproved: false,
			images: uploadedImages,
		});

		if (!saved) {
			await images.cleanupUploadedImagesBestEffort(uploadedImages);
			return err(saveFailedError("Failed to create listing"));
		}

		return ok(saved);
	} catch (error) {
		await images.cleanupUploadedImagesBestEffort(uploadedImages);
		throw error;
	}
}

export async function updateListing<TUploadInput>(
	actor: Actor,
	command: UpdateListingCommand<TUploadInput>,
	dependencies: ListingCommandDependencies<TUploadInput>,
): Promise<Result<ListingMutationResult, ListingCommandError>> {
	const { listings, images } = dependencies;
	const existing = await listings.findListingForMutation(command.listingId);

	if (!existing) {
		return err(notFoundError());
	}

	if (!canModifyListing(actor, existing.sellerId)) {
		return err(
			unauthorizedError("Unauthorized, user cannot modify this listing"),
		);
	}

	const imageUpdateResult = await prepareImageUpdate(command, existing, images);
	if (!imageUpdateResult.ok) {
		return imageUpdateResult;
	}

	const imageUpdate = imageUpdateResult.value;
	const listing = Listing.fromExisting(existing);
	listing.applyEdit(actor, {
		...(command.name !== undefined && { name: command.name }),
		...(command.brand !== undefined && { brand: command.brand }),
		...(command.model !== undefined && { model: command.model }),
		...(command.category !== undefined && { category: command.category }),
		...(command.condition !== undefined && { condition: command.condition }),
		...(command.description !== undefined && {
			description: command.description,
		}),
		...(command.stock !== undefined && { stock: command.stock }),
		...(command.price !== undefined && {
			price: toListingMoney(command.price),
		}),
	});

	try {
		const saved = await listings.updateListing(command.listingId, {
			...toUpdatePersistenceFields(listing, command),
			...(imageUpdate.nextImages ? { images: imageUpdate.nextImages } : {}),
		});

		if (!saved) {
			if (imageUpdate.uploadedImages.length > 0) {
				await images.cleanupUploadedImagesBestEffort(
					imageUpdate.uploadedImages,
				);
			}
			return err(saveFailedError("Failed to update listing"));
		}

		if (imageUpdate.removedImages.length > 0) {
			await images.cleanupPersistedImagesBestEffort(
				imageUpdate.removedImages,
				toImageCleanupSource(existing),
			);
		}

		return ok(saved);
	} catch (error) {
		if (imageUpdate.uploadedImages.length > 0) {
			await images.cleanupUploadedImagesBestEffort(imageUpdate.uploadedImages);
		}
		throw error;
	}
}

export async function removeListing<TUploadInput>(
	actor: Actor,
	command: RemoveListingCommand,
	dependencies: ListingCommandDependencies<TUploadInput>,
): Promise<Result<ListingRemovalResult, ListingCommandError>> {
	const { listings, images } = dependencies;
	const existing = await listings.findListingForMutation(command.listingId);

	if (!existing) {
		return err(notFoundError());
	}

	if (!canModifyListing(actor, existing.sellerId)) {
		return err(
			unauthorizedError("Unauthorized, user cannot modify this listing"),
		);
	}

	if (hasReferences(existing)) {
		return withdrawReferencedListing(actor, existing, listings);
	}

	const deleted = await listings.deleteListing(existing.id);

	if (!deleted) {
		return err(saveFailedError("Failed to delete listing"));
	}

	await images.cleanupPersistedImagesBestEffort(
		existing.images,
		toImageCleanupSource(existing),
	);

	return ok({
		listingId: existing.id,
		mode: "DELETED",
		message: "Listing deleted successfully",
	});
}

function toImageCleanupSource(
	listing: Pick<ListingRemovalSnapshot, "id" | "sellerId">,
): ListingImageCleanupSource {
	return {
		listingId: listing.id,
		sellerId: listing.sellerId,
	};
}

type ImageUpdatePlan = {
	readonly nextImages?: ImageAssetRef[];
	readonly uploadedImages: ImageAssetRef[];
	readonly removedImages: ImageAssetRef[];
};

async function prepareImageUpdate<TUploadInput>(
	command: UpdateListingCommand<TUploadInput>,
	existing: ListingRemovalSnapshot,
	images: ListingImageManagerPort<TUploadInput>,
): Promise<Result<ImageUpdatePlan, ListingCommandError>> {
	const hasNewImages = command.imageFiles && command.imageFiles.length > 0;
	const imageUpdate =
		command.imageUpdate ??
		(hasNewImages
			? {
					items: command.imageFiles?.map((_, index) => ({
						kind: "new" as const,
						index,
					})),
				}
			: undefined);

	if (!hasNewImages && !imageUpdate) {
		return ok({
			uploadedImages: [],
			removedImages: [],
		});
	}

	let uploadedImages: ImageAssetRef[] = [];

	try {
		uploadedImages = hasNewImages
			? await images.uploadImages(command.imageFiles ?? [])
			: [];
	} catch (error) {
		return err(imageUploadError(error));
	}

	const nextImagesResult = getOrderedImages({
		existingImages: existing.images,
		uploadedImages,
		imageUpdateItems: imageUpdate?.items ?? [],
	});
	if (!nextImagesResult.ok) {
		await images.cleanupUploadedImagesBestEffort(uploadedImages);
		return nextImagesResult;
	}

	const nextImages = nextImagesResult.value;

	if (nextImages.length === 0) {
		await images.cleanupUploadedImagesBestEffort(uploadedImages);
		return err(invalidImagesError("Listing must keep at least one image"));
	}

	return ok({
		nextImages,
		uploadedImages,
		removedImages: getRemovedImages(existing.images, nextImages),
	});
}

function getOrderedImages({
	existingImages,
	uploadedImages,
	imageUpdateItems,
}: {
	readonly existingImages: readonly ImageAssetRef[];
	readonly uploadedImages: readonly ImageAssetRef[];
	readonly imageUpdateItems: readonly ListingImageUpdateItem[];
}): Result<ImageAssetRef[], ListingCommandError> {
	const existingImagesById = new Map(
		existingImages.map((image) => [image.publicId, image]),
	);
	const orderedImages: ImageAssetRef[] = [];
	const usedExistingImageIds = new Set<string>();
	const usedNewIndexes = new Set<number>();

	for (const item of imageUpdateItems) {
		if (item.kind === "existing") {
			if (usedExistingImageIds.has(item.imageId)) {
				return err(invalidImagesError("Listing image order has duplicates"));
			}

			const image = existingImagesById.get(item.imageId);
			if (!image) {
				return err(invalidImagesError("Retained listing image was not found"));
			}

			usedExistingImageIds.add(item.imageId);
			orderedImages.push(image);
			continue;
		}

		if (usedNewIndexes.has(item.index)) {
			return err(invalidImagesError("Listing image order has duplicates"));
		}

		const image = uploadedImages[item.index];
		if (!image) {
			return err(invalidImagesError("Uploaded listing image was not found"));
		}

		usedNewIndexes.add(item.index);
		orderedImages.push(image);
	}

	return ok(orderedImages);
}

function getRemovedImages(
	existingImages: readonly ImageAssetRef[],
	retainedImages: readonly ImageAssetRef[],
) {
	const retainedImageIds = new Set(
		retainedImages.map((image) => image.publicId),
	);

	return existingImages.filter(
		(image) => !retainedImageIds.has(image.publicId),
	);
}

async function withdrawReferencedListing(
	actor: Actor,
	existing: ListingRemovalSnapshot,
	listings: ListingCommandRepositoryPort,
): Promise<Result<ListingRemovalResult, ListingCommandError>> {
	const listing = Listing.fromExisting(existing);

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

	const saved = await listings.saveListingStatus(listing.id, listing.status);

	if (!saved) {
		return err(saveFailedError("Failed to withdraw listing"));
	}

	return ok({
		listingId: listing.id,
		mode: "WITHDRAWN",
		message: "Listing withdrawn successfully",
	});
}

function canManageListings(actor: Actor) {
	return actor.role === "SELLER" || actor.role === "ADMIN";
}

export function canModifyListing(actor: Actor, sellerId: string) {
	return (
		actor.role === "ADMIN" || (actor.role === "SELLER" && actor.id === sellerId)
	);
}

function hasReferences(snapshot: ListingRemovalSnapshot) {
	return Object.values(snapshot.referenceCounts).some((count) => count > 0);
}

function toListingMoney(price: string | number): Money {
	const persistence = toListingMoneyPersistence(price);
	return Money.fromMinor(persistence.priceAmountMinor, persistence.currencyCode);
}

function toUpdatePersistenceFields(
	listing: Listing,
	command: ListingMutationFields,
): UpdateListingPersistenceInput {
	return {
		...(command.name !== undefined && { name: listing.name }),
		...(command.category !== undefined && { category: listing.category }),
		...(command.condition !== undefined && { condition: listing.condition }),
		...(command.brand !== undefined && { brand: listing.brand }),
		...(command.model !== undefined && { model: listing.model }),
		...(command.description !== undefined && {
			description: listing.description,
		}),
		...(command.price !== undefined && {
			priceAmountMinor: listing.price.amountMinor,
			currencyCode: listing.price.currencyCode,
		}),
		...(command.stock !== undefined && { stock: listing.stock }),
		status: listing.status,
		isApproved: listing.isApproved,
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

function invalidImagesError(message: string): ListingCommandError {
	return {
		kind: "validation",
		code: "LISTING_COMMAND_INVALID_IMAGES",
		message,
	};
}

function invalidStockError(message: string): ListingCommandError {
	return {
		kind: "validation",
		code: "LISTING_COMMAND_INVALID_STOCK",
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
