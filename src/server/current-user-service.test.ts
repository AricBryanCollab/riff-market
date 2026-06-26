import { afterEach, describe, expect, it, vi } from "vitest";

const accountServiceMocks = vi.hoisted(() => ({
	deleteAccount: vi.fn(),
	getAccountProfile: vi.fn(),
	updateAccountProfilePicture: vi.fn(),
	updateAccountProfile: vi.fn(),
}));

vi.mock("@/server/account-service", () => accountServiceMocks);

import {
	getCurrentUser,
	getOptionalCurrentUser,
	updateCurrentUserProfilePicture,
	validateCurrentUserUpdateInput,
} from "./current-user-service";
import { RequestError } from "./request-error";

describe("current-user service", () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	it("normalizes missing account errors into request errors", async () => {
		accountServiceMocks.getAccountProfile.mockResolvedValue({
			code: "ACCOUNT_PROFILE_NOT_FOUND",
			error: "User not found",
			kind: "not-found",
			message: "User not found",
		});

		await expect(getCurrentUser("missing-user")).rejects.toMatchObject({
			code: "ACCOUNT_PROFILE_NOT_FOUND",
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
			message: "User not found",
		});

		await expect(getOptionalCurrentUser("missing-user")).resolves.toBeNull();
	});

	it("surfaces unexpected optional current user lookup errors as server errors", async () => {
		accountServiceMocks.getAccountProfile.mockResolvedValue({
			code: "ACCOUNT_PROFILE_LOOKUP_FAILED",
			error: "Database unavailable",
			kind: "unexpected",
			message: "Database unavailable",
		});

		await expect(getOptionalCurrentUser("user-1")).rejects.toMatchObject({
			message: "Database unavailable",
			status: 500,
		});
	});

	it("surfaces conflict current-user lookup errors with conflict status", async () => {
		accountServiceMocks.getAccountProfile.mockResolvedValue({
			code: "ACCOUNT_PROFILE_CONFLICT",
			error: "Account is in a conflicting state",
			kind: "conflict",
			message: "Account is in a conflicting state",
		});

		await expect(getCurrentUser("user-1")).rejects.toMatchObject({
			message: "Account is in a conflicting state",
			status: 409,
		});
	});

	it("validates and normalizes current-user update input", () => {
		expect(validateCurrentUserUpdateInput({ firstName: "  Angus  " })).toEqual({
			firstName: "Angus",
		});
	});

	it("throws request errors for invalid current-user update input", () => {
		expect(() => validateCurrentUserUpdateInput({})).toThrow(RequestError);
	});

	it("surfaces profile picture account-service errors", async () => {
		accountServiceMocks.updateAccountProfilePicture.mockResolvedValue({
			code: "ACCOUNT_PROFILE_PICTURE_UPDATE_FAILED",
			kind: "unexpected",
			message: "Failed to update the user profile picture",
			error: "Failed to update the user profile picture",
			details: "upload failed",
		});

		await expect(
			updateCurrentUserProfilePicture("user-1", null),
		).rejects.toMatchObject({
			code: "ACCOUNT_PROFILE_PICTURE_UPDATE_FAILED",
			message: "Failed to update the user profile picture",
			details: "upload failed",
			status: 500,
		});
	});
});
