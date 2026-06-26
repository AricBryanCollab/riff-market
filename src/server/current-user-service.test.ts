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
	getOptionalCurrentUser,
	updateCurrentUserProfilePicture,
	validateCurrentUserUpdateInput,
} from "./current-user-service";

describe("current-user service", () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	it("normalizes missing account errors into request errors", async () => {
		accountServiceMocks.getAccountProfile.mockResolvedValue({
			code: "ACCOUNT_PROFILE_NOT_FOUND",
			error: "User not found",
			kind: "not-found",
		});

		await expect(getCurrentUser("missing-user")).rejects.toMatchObject({
			message: "User not found",
			status: 404,
		});
	});

	it("returns null for optional current user reads without a user id", async () => {
		await expect(getOptionalCurrentUser(null)).resolves.toBeNull();
		expect(accountServiceMocks.getAccountProfile).not.toHaveBeenCalled();
	});

	it("returns null for optional current user reads with a stale user id", async () => {
		accountServiceMocks.getAccountProfile.mockResolvedValue({
			code: "ACCOUNT_PROFILE_NOT_FOUND",
			error: "User not found",
			kind: "not-found",
		});

		await expect(getOptionalCurrentUser("missing-user")).resolves.toBeNull();
	});

	it("surfaces unexpected optional current user lookup errors as server errors", async () => {
		accountServiceMocks.getAccountProfile.mockResolvedValue({
			error: "Database unavailable",
			kind: "unexpected",
		});

		await expect(getOptionalCurrentUser("user-1")).rejects.toMatchObject({
			message: "Database unavailable",
			status: 500,
		});
	});

	it("surfaces conflict current-user lookup errors with conflict status", async () => {
		accountServiceMocks.getAccountProfile.mockResolvedValue({
			error: "Account is in a conflicting state",
			kind: "conflict",
		});

		await expect(getCurrentUser("user-1")).rejects.toMatchObject({
			message: "Account is in a conflicting state",
			status: 409,
		});
	});

	it("keeps legacy account errors without a kind as bad requests", async () => {
		accountServiceMocks.getAccountProfile.mockResolvedValue({
			error: "Database unavailable",
		});

		await expect(getOptionalCurrentUser("user-1")).rejects.toMatchObject({
			message: "Database unavailable",
			status: 400,
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
			kind: "unexpected",
		});

		await expect(
			updateCurrentUserProfilePicture("user-1", null),
		).rejects.toMatchObject({
			message: "Failed to update the user profile picture",
			details: "upload failed",
			status: 500,
		});
	});
});
