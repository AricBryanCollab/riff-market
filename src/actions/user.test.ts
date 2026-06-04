import { afterEach, describe, expect, it, type Mock, vi } from "vitest";
import type { UserProfile } from "@/types/user";

const { userRepoMock, cloudinaryMock } = vi.hoisted(() => {
	const userRepoMock = {
		deleteUser: vi.fn(),
		getAllUsers: vi.fn(),
		getUserById: vi.fn(),
		updateProfilePicture: vi.fn(),
		updateUser: vi.fn(),
	} as const;

	const cloudinaryMock = {
		deleteImage: vi.fn(),
		getPublicId: vi.fn((url: string) => {
			const filename = url.split("/").pop();
			return filename ? filename.split(".")[0] : "";
		}),
		unsignedUploadImage: vi.fn(),
	} as const;

	return {
		userRepoMock,
		cloudinaryMock,
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
vi.mock("@/utils/cloudinary", () => cloudinaryMock);

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

describe("user actions", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("deleteUserService", () => {
		it("deletes the profile picture asset after deleting the user", async () => {
			const user = makeUser({
				profilePic: "https://res.cloudinary.com/riff/image/upload/avatar.jpg",
			});

			(userRepoMock.getUserById as Mock).mockResolvedValue(user);
			(cloudinaryMock.deleteImage as Mock).mockResolvedValue({ result: "ok" });
			(userRepoMock.deleteUser as Mock).mockResolvedValue(undefined);

			const result = await deleteUserService(user.id, user.email);

			expect(result).toEqual({
				message: "Account has been deleted successfully",
				deletedUserId: user.id,
			});
			expect(userRepoMock.deleteUser).toHaveBeenCalledWith(user.id);
			expect(cloudinaryMock.getPublicId).toHaveBeenCalledWith(user.profilePic);
			expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("avatar");
			expect(
				(userRepoMock.deleteUser as Mock).mock.invocationCallOrder[0],
			).toBeLessThan(
				(cloudinaryMock.deleteImage as Mock).mock.invocationCallOrder[0],
			);
		});

		it("skips profile picture cleanup when the user has no profile picture", async () => {
			const user = makeUser();

			(userRepoMock.getUserById as Mock).mockResolvedValue(user);
			(userRepoMock.deleteUser as Mock).mockResolvedValue(undefined);

			const result = await deleteUserService(user.id, user.email);

			expect(result).toEqual({
				message: "Account has been deleted successfully",
				deletedUserId: user.id,
			});
			expect(cloudinaryMock.getPublicId).not.toHaveBeenCalled();
			expect(cloudinaryMock.deleteImage).not.toHaveBeenCalled();
			expect(userRepoMock.deleteUser).toHaveBeenCalledWith(user.id);
		});

		it("still returns success when profile picture cleanup fails after user deletion", async () => {
			const user = makeUser({
				profilePic: "https://res.cloudinary.com/riff/image/upload/avatar.jpg",
			});

			(userRepoMock.getUserById as Mock).mockResolvedValue(user);
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

			(userRepoMock.getUserById as Mock).mockResolvedValue(user);
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

			(userRepoMock.getUserById as Mock).mockResolvedValue(user);
			(cloudinaryMock.deleteImage as Mock).mockResolvedValue({ result: "ok" });
			(userRepoMock.updateProfilePicture as Mock).mockResolvedValue(undefined);

			const result = await updateValidatedUserProfilePicService(user.id, null);

			expect(result).toBeNull();
			expect(userRepoMock.updateProfilePicture).toHaveBeenCalledWith(
				user.id,
				null,
			);
			expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("avatar");
			expect(
				(userRepoMock.updateProfilePicture as Mock).mock.invocationCallOrder[0],
			).toBeLessThan(
				(cloudinaryMock.deleteImage as Mock).mock.invocationCallOrder[0],
			);
		});
	});
});
