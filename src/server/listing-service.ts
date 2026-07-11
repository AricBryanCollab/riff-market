import { z } from "zod";
import {
	type CreateListingCommand,
	createListing,
	type ListingCommandDependencies,
	type ListingMutationResult,
	type RemoveListingCommand,
	removeListing,
	type UpdateListingCommand,
	updateListing,
} from "@/domains/listings/application/manage-listing";
import {
	type ListingModerationResult,
	type ModerateListingCommand,
	moderateListing,
} from "@/domains/listings/application/moderate-listing";
import type {
	ListingMutationResponseDto,
	ListingRemovalResponseDto,
} from "@/domains/listings/dto/listing-command";
import {
	createListingFormSchema,
	updateListingFormSchema,
} from "@/domains/listings/dto/listing-form";
import type { Actor } from "@/domains/shared/domain/actor";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	RequestError,
	unwrapResultOrThrowRequestError,
} from "@/server/request-error";

const moderateListingInputSchema = z.object({
	listingId: z.string().trim().min(1, "Listing ID is required"),
	decision: z.enum(["APPROVE", "DECLINE"]),
});

export type ModerateListingInput = z.infer<typeof moderateListingInputSchema>;
export type CreateListingInput = z.infer<typeof createListingFormSchema>;
export type UpdateListingInput = {
	readonly listingId: string;
	readonly data: z.infer<typeof updateListingFormSchema>;
};
export type RemoveListingInput = {
	readonly listingId: string;
};

export type ListingMutationResponse = ListingMutationResponseDto;
export type RemoveListingResponse = ListingRemovalResponseDto;

export type ListingCommandServiceDependencies = ListingCommandDependencies<File>;

export type ListingModerationWorkflow = {
	readonly moderateListing: (
		actor: Actor,
		command: ModerateListingCommand,
	) => ReturnType<typeof moderateListing>;
};

export type ListingModerationServiceDependencies = ListingModerationWorkflow;

export function validateModerateListingInput(
	data: unknown,
): ModerateListingInput {
	const parsed = moderateListingInputSchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid listing moderation request", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export function validateCreateListingFormData(
	data: FormData,
): CreateListingInput {
	if (!(data instanceof FormData)) {
		throw new RequestError("Expected listing form data");
	}

	const parsed = createListingFormSchema.safeParse({
		name: getRequiredString(data, "name"),
		category: getRequiredString(data, "category"),
		condition: getRequiredString(data, "condition"),
		brand: getRequiredString(data, "brand"),
		model: getRequiredString(data, "model"),
		description: getRequiredString(data, "description"),
		price: getRequiredString(data, "price"),
		stock: Number(getRequiredString(data, "stock")),
		images: getImageFiles(data),
	});

	if (!parsed.success) {
		throw new RequestError("Invalid listing data", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export function validateUpdateListingFormData(
	data: FormData,
): UpdateListingInput {
	if (!(data instanceof FormData)) {
		throw new RequestError("Expected listing form data");
	}

	const listingId = getRequiredString(data, "listingId");
	const rawData: Record<string, unknown> = {};

	for (const key of [
		"name",
		"category",
		"condition",
		"brand",
		"model",
		"description",
		"price",
	] as const) {
		if (data.has(key)) {
			rawData[key] = getRequiredString(data, key);
		}
	}

	if (data.has("stock")) {
		rawData.stock = Number(getRequiredString(data, "stock"));
	}

	const images = getImageFiles(data);
	if (images.length > 0) {
		rawData.images = images;
	}
	if (data.has("imageUpdateMode")) {
		rawData.imageUpdateMode = getRequiredString(data, "imageUpdateMode");
		rawData.imageUpdateItems = getImageUpdateItems(data);
	}

	const parsed = updateListingFormSchema.safeParse(rawData);

	if (!parsed.success) {
		throw new RequestError("Invalid listing data", {
			details: z.flattenError(parsed.error),
		});
	}

	return {
		listingId,
		data: parsed.data,
	};
}

export function validateRemoveListingInput(data: unknown): RemoveListingInput {
	const parsed = z
		.object({
			listingId: z.string().trim().min(1, "Listing ID is required"),
		})
		.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid listing removal request", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function createListingForCurrentUser(
	user: ServerUserContext,
	input: CreateListingInput,
	dependencies?: ListingCommandServiceDependencies,
): Promise<ListingMutationResponse> {
	const commandDependencies =
		dependencies ?? (await createListingCommandInfrastructure());
	const actor = toActor(user);
	const command = toCreateListingCommand(input);
	const result = await createListing(actor, command, commandDependencies);
	const listing = unwrapResultOrThrowRequestError(result);

	return toMutationResponse("New listing has been added", listing);
}

export async function updateListingForCurrentUser(
	user: ServerUserContext,
	input: UpdateListingInput,
	dependencies?: ListingCommandServiceDependencies,
): Promise<ListingMutationResponse> {
	const commandDependencies =
		dependencies ?? (await createListingCommandInfrastructure());
	const actor = toActor(user);
	const command = toUpdateListingCommand(input);
	const result = await updateListing(actor, command, commandDependencies);
	const listing = unwrapResultOrThrowRequestError(result);

	return toMutationResponse("Listing has been updated", listing);
}

export async function removeListingForCurrentUser(
	user: ServerUserContext,
	input: RemoveListingInput,
	dependencies?: ListingCommandServiceDependencies,
): Promise<RemoveListingResponse> {
	const commandDependencies =
		dependencies ?? (await createListingCommandInfrastructure());
	const actor = toActor(user);
	const command = toRemoveListingCommand(input);
	const result = await removeListing(actor, command, commandDependencies);
	const removal = unwrapResultOrThrowRequestError(result);

	return {
		message: removal.message,
		listing: removal,
	};
}

export async function moderateListingForCurrentUser(
	user: ServerUserContext,
	input: ModerateListingInput,
	dependencies?: ListingModerationServiceDependencies,
): Promise<ListingModerationResult> {
	const moderationWorkflow =
		dependencies ?? (await createPrismaListingModerationDependencies());
	const actor = toActor(user);
	const command = toCommand(input);
	const result = await moderationWorkflow.moderateListing(actor, command);

	return unwrapResultOrThrowRequestError(result);
}

async function createListingCommandInfrastructure(): Promise<ListingCommandServiceDependencies> {
	const [{ prisma }, commands, imageAssets, mediaCleanup] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/listings/infrastructure/prisma-listing-commands"),
		import("@/domains/listings/infrastructure/listing-image-assets"),
		import(
			"@/domains/media/infrastructure/prisma-listing-media-cleanup-staging"
		),
	]);

	return {
		listings: new commands.PrismaListingCommandRepository(prisma),
		images: new imageAssets.CloudinaryListingImageManager(
			new mediaCleanup.PrismaListingMediaCleanupStaging(prisma),
		),
	};
}

async function createPrismaListingModerationDependencies(): Promise<ListingModerationServiceDependencies> {
	const [{ prisma }, moderation] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/listings/infrastructure/prisma-listing-moderation"),
	]);

	return {
		moderateListing: (actor, command) =>
			prisma.$transaction((transaction) =>
				moderateListing(
					actor,
					command,
					new moderation.PrismaListingModerationRepository(transaction),
					new moderation.PrismaListingModerationNotifier(transaction),
				),
			),
	};
}

function toActor(user: ServerUserContext): Actor {
	return {
		id: user.id,
		role: user.role,
	};
}

function toCommand(input: ModerateListingInput): ModerateListingCommand {
	return {
		listingId: input.listingId,
		decision: input.decision,
	};
}

function toCreateListingCommand(
	input: CreateListingInput,
): CreateListingCommand<File> {
	return {
		name: input.name,
		category: input.category,
		condition: input.condition,
		brand: input.brand,
		model: input.model,
		description: input.description,
		price: input.price,
		stock: input.stock,
		imageFiles: input.images,
	};
}

function toUpdateListingCommand(
	input: UpdateListingInput,
): UpdateListingCommand<File> {
	return {
		listingId: input.listingId,
		...(input.data.name !== undefined && { name: input.data.name }),
		...(input.data.category !== undefined && { category: input.data.category }),
		...(input.data.condition !== undefined && {
			condition: input.data.condition,
		}),
		...(input.data.brand !== undefined && { brand: input.data.brand }),
		...(input.data.model !== undefined && { model: input.data.model }),
		...(input.data.description !== undefined && {
			description: input.data.description,
		}),
		...(input.data.price !== undefined && { price: input.data.price }),
		...(input.data.stock !== undefined && { stock: input.data.stock }),
		...(input.data.images !== undefined && { imageFiles: input.data.images }),
		...(input.data.imageUpdateMode !== undefined && {
			imageUpdate: {
				items: input.data.imageUpdateItems ?? [],
			},
		}),
	};
}

function toRemoveListingCommand(
	input: RemoveListingInput,
): RemoveListingCommand {
	return {
		listingId: input.listingId,
	};
}

function toMutationResponse(
	message: string,
	listing: ListingMutationResult,
): ListingMutationResponse {
	return {
		message,
		listing: {
			...listing,
			images: listing.images.map((image) => ({
				imageId: image.publicId,
				url: image.url,
			})),
			createdAt: listing.createdAt?.toISOString(),
			updatedAt: listing.updatedAt?.toISOString(),
		},
	};
}

function getRequiredString(data: FormData, key: string) {
	const value = data.get(key);

	return typeof value === "string" ? value : "";
}

function getImageFiles(data: FormData) {
	return data
		.getAll("image")
		.filter((value): value is File => value instanceof File);
}

function getImageUpdateItems(data: FormData) {
	return data
		.getAll("imageUpdateItem")
		.filter((value): value is string => typeof value === "string")
		.map(parseImageUpdateItem);
}

function parseImageUpdateItem(value: string) {
	try {
		return JSON.parse(value);
	} catch (error) {
		throw new RequestError("Invalid listing image order", {
			details: error instanceof Error ? error.message : String(error),
		});
	}
}
