import { afterEach, describe, expect, it, vi } from "vitest";

const accountServiceMocks = vi.hoisted(() => ({
	deleteAccount: vi.fn(),
	getAccountProfile: vi.fn(),
	updateAccountProfilePicture: vi.fn(),
	updateAccountProfile: vi.fn(),
}));

vi.mock("@/server/account-service", () => accountServiceMocks);

import {
	CurrentUserRequestError,
	getCurrentUser,
	updateCurrentUserProfilePicture,
	validateCurrentUserUpdateInput,
} from "./current-user-service";

describe("current-user service", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("normalizes missing account errors into request errors", async () => {
		accountServiceMocks.getAccountProfile.mockResolvedValue({
			error: "User not found",
		});

		await expect(getCurrentUser("missing-user")).rejects.toMatchObject({
			message: "User not found",
			status: 404,
		});
	});

	it("validates and normalizes current-user update input", () => {
		expect(validateCurrentUserUpdateInput({ firstName: "  Angus  " })).toEqual({
			firstName: "Angus",
		});
	});

	it("throws request errors for invalid current-user update input", () => {
		expect(() => validateCurrentUserUpdateInput({})).toThrow(
			CurrentUserRequestError,
		);
	});

	it("surfaces profile picture account-service errors", async () => {
		accountServiceMocks.updateAccountProfilePicture.mockResolvedValue({
			error: "Failed to update the user profile picture",
			details: "upload failed",
		});

		await expect(
			updateCurrentUserProfilePicture("user-1", null),
		).rejects.toMatchObject({
			message: "Failed to update the user profile picture",
			details: "upload failed",
			status: 400,
		});
	});
});
