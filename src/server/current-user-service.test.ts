import { afterEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@/types/user";

const actionMocks = vi.hoisted(() => ({
	deleteUserService: vi.fn(),
	getUserByIdService: vi.fn(),
	updateValidatedUserProfilePicService: vi.fn(),
	updateValidatedUserService: vi.fn(),
}));

vi.mock("@/actions/user", () => actionMocks);

import {
	CurrentUserRequestError,
	getCurrentUser,
	updateCurrentUserProfilePicture,
	validateCurrentUserUpdateInput,
} from "./current-user-service";

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

describe("current-user service", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("unwraps the authenticated user from the action result", async () => {
		const user = makeUser();
		actionMocks.getUserByIdService.mockResolvedValue({ data: user });

		await expect(getCurrentUser(user.id)).resolves.toEqual(user);

		expect(actionMocks.getUserByIdService).toHaveBeenCalledWith(user.id);
	});

	it("normalizes action errors into request errors", async () => {
		actionMocks.getUserByIdService.mockResolvedValue({
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

	it("surfaces profile picture action errors", async () => {
		actionMocks.updateValidatedUserProfilePicService.mockResolvedValue({
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
