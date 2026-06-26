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
	type ListingModerationNotifierPort,
	type ListingModerationRepositoryPort,
	type ListingModerationResult,
	type ModerateListingCommand,
	moderateListing,
} from "@/domains/listings/application/moderate-listing";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	createProductSchema,
	updateProductSchema,
} from "@/lib/zod/product-validation";
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
export type CreateListingInput = z.infer<typeof createProductSchema>;
export type UpdateListingInput = {
	readonly listingId: string;
	readonly data: z.infer<typeof updateProductSchema>;
};
export type RemoveListingInput = {
	readonly listingId: string;
};

export type ListingMutationResponse = {
	readonly message: string;
	readonly product: {
		readonly id: string;
		readonly sellerId: string;
		readonly name: string;
		readonly category: string;
		readonly condition?: string;
		readonly brand: string;
		readonly model: string;
		readonly images: string[];
		readonly description: string;
		readonly price: number;
		readonly priceCents?: number | null;
		readonly currencyCode?: string | null;
		readonly stock: number;
		readonly isApproved: boolean;
		readonly listingStatus: string;
		readonly createdAt?: string;
		readonly updatedAt?: string;
	};
};

export type RemoveListingResponse = {
	readonly message: string;
	readonly product: {
		readonly listingId: string;
		readonly mode: "DELETED" | "WITHDRAWN";
		readonly message: string;
	};
};

export type ListingCommandServiceDependencies = ListingCommandDependencies;

export type ListingModerationExecutionDependencies = {
	readonly repository: ListingModerationRepositoryPort;
	readonly notifier: ListingModerationNotifierPort;
};

export type ListingModerationServiceDependencies =
	ListingModerationExecutionDependencies & {
		readonly runInTransaction?: <T>(
			handler: (
				dependencies: ListingModerationExecutionDependencies,
			) => Promise<T>,
		) => Promise<T>;
	};

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

	const parsed = createProductSchema.safeParse({
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

	const parsed = updateProductSchema.safeParse(rawData);

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

	return toMutationResponse("New product has been added", listing);
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

	return toMutationResponse("Product has been updated", listing);
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
		product: removal,
	};
}

export async function moderateListingForCurrentUser(
	user: ServerUserContext,
	input: ModerateListingInput,
	dependencies?: ListingModerationServiceDependencies,
): Promise<ListingModerationResult> {
	const moderationDependencies =
		dependencies ?? (await createPrismaListingModerationDependencies());

	if (moderationDependencies.runInTransaction) {
		return moderationDependencies.runInTransaction((transactionDependencies) =>
			moderateListingWithDependencies(user, input, transactionDependencies),
		);
	}

	return moderateListingWithDependencies(user, input, moderationDependencies);
}

async function moderateListingWithDependencies(
	user: ServerUserContext,
	input: ModerateListingInput,
	dependencies: ListingModerationExecutionDependencies,
): Promise<ListingModerationResult> {
	const actor = toActor(user);
	const command = toCommand(input);
	const result = await moderateListing(
		actor,
		command,
		dependencies.repository,
		dependencies.notifier,
	);

	return unwrapResultOrThrowRequestError(result);
}

async function createListingCommandInfrastructure(): Promise<ListingCommandServiceDependencies> {
	const [{ prisma }, commands, imageAssets] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/listings/infrastructure/prisma-listing-commands"),
		import("@/domains/listings/infrastructure/listing-image-assets"),
	]);

	return {
		listings: new commands.PrismaListingCommandRepository(prisma),
		images: new imageAssets.CloudinaryListingImageManager(),
	};
}

async function createPrismaListingModerationDependencies(): Promise<ListingModerationServiceDependencies> {
	const [{ prisma }, moderation] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/listings/infrastructure/prisma-listing-moderation"),
	]);

	return {
		repository: new moderation.PrismaListingModerationRepository(prisma),
		notifier: new moderation.PrismaListingModerationNotifier(prisma),
		runInTransaction: (handler) =>
			prisma.$transaction((transaction) =>
				handler({
					repository: new moderation.PrismaListingModerationRepository(
						transaction,
					),
					notifier: new moderation.PrismaListingModerationNotifier(transaction),
				}),
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
): CreateListingCommand {
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
): UpdateListingCommand {
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
		product: {
			...listing,
			images: listing.images.map((image) => image.url),
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
