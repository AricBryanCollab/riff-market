import { describe, expect, it } from "vitest";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	moderateListingForCurrentUser,
	validateUpdateListingFormData,
} from "@/server/listing-service";

function imageFile(name: string) {
	return new File([`bytes-${name}`], name, { type: "image/jpeg" });
}

describe("listing moderation", () => {
	it("maps admin user and approve input into workflow command", async () => {
		const calls: unknown[] = [];
		const workflow = {
			moderate: async (actor: unknown, command: unknown) => {
				calls.push({ actor, command });

				return {
					ok: true as const,
					value: {
						id: "listing-1",
						name: "Telecaster",
						sellerId: "seller-1",
						status: "APPROVED" as const,
						isApproved: true,
					},
				};
			},
		};

		await moderateListingForCurrentUser(
			adminUser(),
			{ listingId: "listing-1", decision: "APPROVE" },
			workflow,
		);

		expect(calls).toEqual([
			{
				actor: { id: "admin-1", role: "ADMIN" },
				command: { listingId: "listing-1", decision: "APPROVE" },
			},
		]);
	});

	it("maps workflow failures into request errors", async () => {
		const workflow = {
			moderate: async () => ({
				ok: false as const,
				error: {
					kind: "not-found" as const,
					code: "MODERATE_LISTING_NOT_FOUND" as const,
					message: "Listing not found",
				},
			}),
		};

		await expect(
			moderateListingForCurrentUser(
				adminUser(),
				{ listingId: "missing", decision: "APPROVE" },
				workflow,
			),
		).rejects.toMatchObject({
			name: "RequestError",
			code: "MODERATE_LISTING_NOT_FOUND",
			status: 404,
			message: "Listing not found",
		});
	});
});

describe("listing service validation", () => {
	it("validates ordered listing image updates from form data", () => {
		const formData = new FormData();
		formData.append("listingId", "listing-1");
		formData.append("imageUpdateMode", "replace");
		formData.append(
			"imageUpdateItem",
			JSON.stringify({
				kind: "existing",
				imageId: "second",
			}),
		);
		formData.append(
			"imageUpdateItem",
			JSON.stringify({
				kind: "new",
				index: 0,
			}),
		);
		formData.append("image", imageFile("new.jpg"));

		const input = validateUpdateListingFormData(formData);

		expect(input).toMatchObject({
			listingId: "listing-1",
			data: {
				imageUpdateMode: "replace",
				imageUpdateItems: [
					{
						kind: "existing",
						imageId: "second",
					},
					{
						kind: "new",
						index: 0,
					},
				],
			},
		});
		expect(input.data.images?.[0]?.name).toBe("new.jpg");
	});
});

function adminUser(): ServerUserContext {
	return {
		id: "admin-1",
		email: "admin@example.com",
		firstName: "Admin",
		lastName: "User",
		role: "ADMIN",
	};
}
