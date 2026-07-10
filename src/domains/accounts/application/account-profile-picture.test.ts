import { describe, expect, it, vi } from "vitest";
import type { AccountProfilePictureAsset } from "@/domains/accounts/dto/account-profile-picture";
import {
	type AccountProfilePictureCleanupPort,
	type AccountProfilePictureLogger,
	type AccountProfilePictureReadPort,
	type AccountProfilePictureState,
	type AccountProfilePictureUploadPort,
	type AccountProfilePictureWritePort,
	updateAccountProfilePicture,
} from "./account-profile-picture";

describe("account profile picture use case", () => {
	it("returns not found when updating a missing account", async () => {
		const events: string[] = [];
		const accounts = new InMemoryProfilePictures([], events);
		const imageAssets = new FakeImageAssets(events);
		const logger = new FakeLogger();

		const result = await updateAccountProfilePicture(
			{
				userId: "missing-user",
				kind: "replace",
				profilePic: { name: "new.jpg" },
			},
			accounts,
			imageAssets,
			logger,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ACCOUNT_PROFILE_NOT_FOUND",
				message: "User not found",
				kind: "not-found",
			},
		});
		expect(events).toEqual([]);
	});

	it("removes a profile picture before cleaning up the old asset", async () => {
		const events: string[] = [];
		const oldProfilePic = makeProfilePicture("old");
		const accounts = new InMemoryProfilePictures(
			[{ userId: "user-1", profilePic: oldProfilePic }],
			events,
		);
		const imageAssets = new FakeImageAssets(events);

		const result = await updateAccountProfilePicture(
			{ userId: "user-1", kind: "remove" },
			accounts,
			imageAssets,
		);

		expect(result).toEqual({
			ok: true,
			value: { profilePic: null },
		});
		await expect(
			accounts.findProfilePictureStateByUserId("user-1"),
		).resolves.toEqual({ profilePic: null });
		expect(events).toEqual(["save:null", "delete:old"]);
	});

	it("returns an update error when removing a profile picture fails to persist", async () => {
		const events: string[] = [];
		const persistenceError = new Error("db failed");
		const oldProfilePic = makeProfilePicture("old");
		const accounts = new InMemoryProfilePictures(
			[{ userId: "user-1", profilePic: oldProfilePic }],
			events,
			{ updateError: persistenceError },
		);
		const imageAssets = new FakeImageAssets(events);
		const logger = new FakeLogger();

		const result = await updateAccountProfilePicture(
			{ userId: "user-1", kind: "remove" },
			accounts,
			imageAssets,
			logger,
		);

		expect(result).toEqual({
			ok: false,
			error: {
				code: "ACCOUNT_PROFILE_PICTURE_UPDATE_FAILED",
				message: "Failed to update the user profile picture",
				kind: "unexpected",
				details: "db failed",
			},
		});
		await expect(
			accounts.findProfilePictureStateByUserId("user-1"),
		).resolves.toEqual({ profilePic: oldProfilePic });
		expect(events).toEqual(["save:null"]);
		expect(logger.error).toHaveBeenCalledWith(
			"Failed to update profile picture",
			persistenceError,
		);
	});

	it("replaces a profile picture before cleaning up the old asset", async () => {
		const events: string[] = [];
		const oldProfilePic = makeProfilePicture("old");
		const newProfilePic = makeProfilePicture("new");
		const accounts = new InMemoryProfilePictures(
			[{ userId: "user-1", profilePic: oldProfilePic }],
			events,
		);
		const imageAssets = new FakeImageAssets(events, {
			uploadedProfilePic: newProfilePic,
		});

		const result = await updateAccountProfilePicture(
			{
				userId: "user-1",
				kind: "replace",
				profilePic: { name: "new.jpg" },
			},
			accounts,
			imageAssets,
		);

		expect(result).toEqual({
			ok: true,
			value: { profilePic: newProfilePic.url },
		});
		await expect(
			accounts.findProfilePictureStateByUserId("user-1"),
		).resolves.toEqual({ profilePic: newProfilePic });
		expect(events).toEqual(["upload:new.jpg", "save:new", "delete:old"]);
	});

	it("cleans up the uploaded asset when persistence fails", async () => {
		const events: string[] = [];
		const persistenceError = new Error("db failed");
		const oldProfilePic = makeProfilePicture("old");
		const newProfilePic = makeProfilePicture("new");
		const accounts = new InMemoryProfilePictures(
			[{ userId: "user-1", profilePic: oldProfilePic }],
			events,
			{ updateError: persistenceError },
		);
		const imageAssets = new FakeImageAssets(events, {
			uploadedProfilePic: newProfilePic,
		});
		const logger = new FakeLogger();

		const result = await updateAccountProfilePicture(
			{
				userId: "user-1",
				kind: "replace",
				profilePic: { name: "new.jpg" },
			},
			accounts,
			imageAssets,
			logger,
		);

		expect(result).toEqual({
			ok: false,
			error: {
				code: "ACCOUNT_PROFILE_PICTURE_UPDATE_FAILED",
				message: "Failed to update the user profile picture",
				kind: "unexpected",
				details: "db failed",
			},
		});
		await expect(
			accounts.findProfilePictureStateByUserId("user-1"),
		).resolves.toEqual({ profilePic: oldProfilePic });
		expect(events).toEqual(["upload:new.jpg", "save:new", "delete:new"]);
		expect(logger.error).toHaveBeenCalledWith(
			"Failed to update profile picture",
			persistenceError,
		);
	});

	it("keeps the successful replacement when old asset cleanup fails", async () => {
		const events: string[] = [];
		const cleanupError = new Error("cleanup failed");
		const oldProfilePic = makeProfilePicture("old");
		const newProfilePic = makeProfilePicture("new");
		const accounts = new InMemoryProfilePictures(
			[{ userId: "user-1", profilePic: oldProfilePic }],
			events,
		);
		const imageAssets = new FakeImageAssets(events, {
			deleteError: cleanupError,
			uploadedProfilePic: newProfilePic,
		});
		const logger = new FakeLogger();

		const result = await updateAccountProfilePicture(
			{
				userId: "user-1",
				kind: "replace",
				profilePic: { name: "new.jpg" },
			},
			accounts,
			imageAssets,
			logger,
		);

		expect(result).toEqual({
			ok: true,
			value: { profilePic: newProfilePic.url },
		});
		await expect(
			accounts.findProfilePictureStateByUserId("user-1"),
		).resolves.toEqual({ profilePic: newProfilePic });
		expect(events).toEqual(["upload:new.jpg", "save:new", "delete:old"]);
		expect(logger.error).toHaveBeenCalledWith(
			"Failed to clean up orphaned replaced profile picture asset",
			cleanupError,
		);
	});
});

function makeProfilePicture(id: string): AccountProfilePictureAsset {
	return {
		url: `https://res.cloudinary.com/riff/image/upload/${id}.jpg`,
		publicId: id,
	};
}

class InMemoryProfilePictures
	implements AccountProfilePictureReadPort, AccountProfilePictureWritePort
{
	private readonly accounts = new Map<string, AccountProfilePictureState>();

	constructor(
		accounts: readonly ({
			readonly userId: string;
		} & AccountProfilePictureState)[] = [],
		private readonly events: string[] = [],
		private readonly options: {
			readonly updateError?: Error;
		} = {},
	) {
		for (const account of accounts) {
			this.accounts.set(account.userId, { profilePic: account.profilePic });
		}
	}

	async findProfilePictureStateByUserId(
		userId: string,
	): Promise<AccountProfilePictureState | null> {
		return this.accounts.get(userId) ?? null;
	}

	async updateProfilePicture(
		userId: string,
		profilePic: AccountProfilePictureAsset | null,
	): Promise<void> {
		this.events.push(`save:${profilePic?.publicId ?? "null"}`);

		if (this.options.updateError) {
			throw this.options.updateError;
		}

		this.accounts.set(userId, { profilePic });
	}
}

class FakeImageAssets
	implements
		AccountProfilePictureUploadPort<{ readonly name: string }>,
		AccountProfilePictureCleanupPort
{
	constructor(
		private readonly events: string[] = [],
		private readonly options: {
			readonly deleteError?: Error;
			readonly uploadedProfilePic?: AccountProfilePictureAsset;
		} = {},
	) {}

	async uploadProfilePicture(profilePic: {
		readonly name: string;
	}): Promise<AccountProfilePictureAsset> {
		this.events.push(`upload:${profilePic.name}`);
		return this.options.uploadedProfilePic ?? makeProfilePicture("uploaded");
	}

	async deleteProfilePictureAsset(
		profilePic: AccountProfilePictureAsset,
	): Promise<void> {
		this.events.push(`delete:${profilePic.publicId}`);

		if (this.options.deleteError) {
			throw this.options.deleteError;
		}
	}
}

class FakeLogger implements AccountProfilePictureLogger {
	readonly error = vi.fn();
}
