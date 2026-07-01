import { describe, expect, it } from "vitest";
import { validateUpdateListingFormData } from "@/server/listing-service";

function imageFile(name: string) {
	return new File([`bytes-${name}`], name, { type: "image/jpeg" });
}

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
