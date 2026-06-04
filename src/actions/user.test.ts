import { Prisma } from "generated/prisma/client";
import { afterEach, describe, expect, it, type Mock, vi } from "vitest";
import type { UserProfile } from "@/types/user";

const { userRepoMock, cloudinaryMock, compressImageMock, loggerMock } =
	vi.hoisted(() => {
		const userRepoMock = {
			deleteUser: vi.fn(),
			getAllUsers: vi.fn(),
			getUserById: vi.fn(),
			getUserProfilePictureValueById: vi.fn(),
			updateProfilePicture: vi.fn(),
			updateUser: vi.fn(),
		} as const;

		const cloudinaryMock = {
			deleteImage: vi.fn(),
			unsignedUploadImage: vi.fn(),
		} as const;

		const compressImageMock = vi.fn();
		const loggerMock = {
			error: vi.fn(),
		};

		return {
			userRepoMock,
			cloudinaryMock,
			compressImageMock,
			loggerMock,
		};
	});

vi.mock("@/env", () => ({
	env: {
		CLOUDINARY_UPLOAD_PRESET: "test-preset",
	},
}));

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => ({
		handler: vi.fn(),
		inputValidator() {
			return this;
		},
		middleware() {
			return this;
		},
	}),
}));

vi.mock("@/data/user-repo", () => userRepoMock);
vi.mock("@/lib/logger", () => ({
	logger: loggerMock,
}));
vi.mock("@/utils/cloudinary", () => cloudinaryMock);
vi.mock("@/utils/compress-image", () => ({
	compressImage: compressImageMock,
}));

import {
	deleteUserService,
	updateValidatedUserProfilePicService,
} from "./user";

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
	return {
		id: "user-1",
		firstName: "Angus",
		lastName: "Young",
		email: "angus@example.com",
		role: "CUSTOMER",
		theme: "light",
		phone: null,
		profilePic: null,
		address: null,
		...overrides,
	};
}

function mockExistingUser(user: UserProfile) {
	(userRepoMock.getUserById as Mock).mockResolvedValue(user);
	(userRepoMock.getUserProfilePictureValueById as Mock).mockResolvedValue(
		user.profilePic,
	);
}

function makeImage(name: string) {
	return new File([`bytes-${name}`], name, {
		type: "image/jpeg",
	});
}

function withCompressedImage(): Promise<{
	buffer: Buffer;
	originalSize: number;
	compressedSize: number;
	mime: string;
}> {
	return Promise.resolve({
		buffer: Buffer.from("compressed"),
		originalSize: 10,
		compressedSize: 8,
		mime: "image/jpeg",
	});
}

describe("user actions", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("deleteUserService", () => {
		it("deletes the profile picture asset after deleting the user", async () => {
			const user = makeUser({
				profilePic: "https://res.cloudinary.com/riff/image/upload/avatar.jpg",
			});

			mockExistingUser(user);
			(cloudinaryMock.deleteImage as Mock).mockResolvedValue({ result: "ok" });
			(userRepoMock.deleteUser as Mock).mockResolvedValue(undefined);

			const result = await deleteUserService(user.id, user.email);

			expect(result).toEqual({
				message: "Account has been deleted successfully",
				deletedUserId: user.id,
			});
			expect(userRepoMock.deleteUser).toHaveBeenCalledWith(user.id);
			expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("avatar");
			expect(
				(userRepoMock.deleteUser as Mock).mock.invocationCallOrder[0],
			).toBeLessThan(
				(cloudinaryMock.deleteImage as Mock).mock.invocationCallOrder[0],
			);
		});

		it("skips profile picture cleanup when the user has no profile picture", async () => {
			const user = makeUser();

			mockExistingUser(user);
			(userRepoMock.deleteUser as Mock).mockResolvedValue(undefined);

			const result = await deleteUserService(user.id, user.email);

			expect(result).toEqual({
				message: "Account has been deleted successfully",
				deletedUserId: user.id,
			});
			expect(cloudinaryMock.deleteImage).not.toHaveBeenCalled();
			expect(userRepoMock.deleteUser).toHaveBeenCalledWith(user.id);
		});

		it("still returns success when profile picture cleanup fails after user deletion", async () => {
			const user = makeUser({
				profilePic: "https://res.cloudinary.com/riff/image/upload/avatar.jpg",
			});

			mockExistingUser(user);
			(cloudinaryMock.deleteImage as Mock).mockRejectedValue(
				new Error("cloudinary failed"),
			);

			const result = await deleteUserService(user.id, user.email);

			expect(result).toEqual({
				message: "Account has been deleted successfully",
				deletedUserId: user.id,
			});
			expect(userRepoMock.deleteUser).toHaveBeenCalledWith(user.id);
		});

		it("does not delete the profile picture asset when user deletion fails", async () => {
			const user = makeUser({
				profilePic: "https://res.cloudinary.com/riff/image/upload/avatar.jpg",
			});

			mockExistingUser(user);
			(userRepoMock.deleteUser as Mock).mockRejectedValue(
				new Error("delete failed"),
			);

			await expect(deleteUserService(user.id, user.email)).rejects.toThrow(
				"delete failed",
			);
			expect(cloudinaryMock.deleteImage).not.toHaveBeenCalled();
		});
	});

	describe("updateValidatedUserProfilePicService", () => {
		it("uses profile picture cleanup when removing a profile picture", async () => {
			const user = makeUser({
				profilePic: "https://res.cloudinary.com/riff/image/upload/avatar.jpg",
			});

			mockExistingUser(user);
			(cloudinaryMock.deleteImage as Mock).mockResolvedValue({ result: "ok" });
			(userRepoMock.updateProfilePicture as Mock).mockResolvedValue(undefined);

			const result = await updateValidatedUserProfilePicService(user.id, null);

			expect(result).toBeNull();
			expect(userRepoMock.updateProfilePicture).toHaveBeenCalledWith(
				user.id,
				Prisma.JsonNull,
			);
			expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("avatar");
			expect(
				(userRepoMock.updateProfilePicture as Mock).mock.invocationCallOrder[0],
			).toBeLessThan(
				(cloudinaryMock.deleteImage as Mock).mock.invocationCallOrder[0],
			);
		});

		it("replaces a profile picture before cleaning up the previous asset", async () => {
			const user = makeUser({
				profilePic: "https://res.cloudinary.com/riff/image/upload/old.jpg",
			});
			const newProfilePicUrl =
				"https://res.cloudinary.com/riff/image/upload/new.jpg";
			const profilePic = makeImage("new.jpg");

			mockExistingUser(user);
			(compressImageMock as Mock).mockImplementation(withCompressedImage);
			(cloudinaryMock.unsignedUploadImage as Mock).mockResolvedValue({
				secure_url: newProfilePicUrl,
				public_id: "new",
			});
			(cloudinaryMock.deleteImage as Mock).mockResolvedValue({ result: "ok" });
			(userRepoMock.updateProfilePicture as Mock).mockResolvedValue(undefined);

			const result = await updateValidatedUserProfilePicService(
				user.id,
				profilePic,
			);

			expect(result).toBe(newProfilePicUrl);
			expect(compressImageMock).toHaveBeenCalledWith({
				file: profilePic,
				options: {
					maxSize: 800,
					quality: 85,
					format: "jpeg",
				},
			});
			expect(cloudinaryMock.unsignedUploadImage).toHaveBeenCalledWith({
				buffer: Buffer.from("compressed"),
				filename: profilePic.name,
				uploadPreset: "test-preset",
			});
			expect(userRepoMock.updateProfilePicture).toHaveBeenCalledWith(user.id, {
				url: newProfilePicUrl,
				publicId: "new",
			});
			expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("old");
			expect(
				(userRepoMock.updateProfilePicture as Mock).mock.invocationCallOrder[0],
			).toBeLessThan(
				(cloudinaryMock.deleteImage as Mock).mock.invocationCallOrder[0],
			);
		});

		it("cleans up the uploaded profile picture when the database update fails", async () => {
			const user = makeUser({
				profilePic: "https://res.cloudinary.com/riff/image/upload/old.jpg",
			});
			const newProfilePicUrl =
				"https://res.cloudinary.com/riff/image/upload/new.jpg";

			mockExistingUser(user);
			(compressImageMock as Mock).mockImplementation(withCompressedImage);
			(cloudinaryMock.unsignedUploadImage as Mock).mockResolvedValue({
				secure_url: newProfilePicUrl,
				public_id: "new",
			});
			(userRepoMock.updateProfilePicture as Mock).mockRejectedValue(
				new Error("db failed"),
			);
			(cloudinaryMock.deleteImage as Mock).mockResolvedValue({ result: "ok" });

			const result = await updateValidatedUserProfilePicService(
				user.id,
				makeImage("new.jpg"),
			);

			expect(result).toEqual({
				error: "Failed to update the user profile picture",
				details: "db failed",
			});
			expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("new");
			expect(
				(userRepoMock.updateProfilePicture as Mock).mock.invocationCallOrder[0],
			).toBeLessThan(
				(cloudinaryMock.deleteImage as Mock).mock.invocationCallOrder[0],
			);
		});

		it("still returns the new profile picture when previous asset cleanup fails", async () => {
			const cleanupError = new Error("cloudinary failed");
			const user = makeUser({
				profilePic: "https://res.cloudinary.com/riff/image/upload/old.jpg",
			});
			const newProfilePicUrl =
				"https://res.cloudinary.com/riff/image/upload/new.jpg";

			mockExistingUser(user);
			(compressImageMock as Mock).mockImplementation(withCompressedImage);
			(cloudinaryMock.unsignedUploadImage as Mock).mockResolvedValue({
				secure_url: newProfilePicUrl,
				public_id: "new",
			});
			(userRepoMock.updateProfilePicture as Mock).mockResolvedValue(undefined);
			(cloudinaryMock.deleteImage as Mock).mockRejectedValue(cleanupError);

			const result = await updateValidatedUserProfilePicService(
				user.id,
				makeImage("new.jpg"),
			);

			expect(result).toBe(newProfilePicUrl);
			expect(userRepoMock.updateProfilePicture).toHaveBeenCalledWith(user.id, {
				url: newProfilePicUrl,
				publicId: "new",
			});
			expect(loggerMock.error).toHaveBeenCalledWith(
				"Failed to clean up orphaned replaced profile picture asset",
				cleanupError,
			);
		});
	});
});
