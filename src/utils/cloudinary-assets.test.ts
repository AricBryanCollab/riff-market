import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

const { cloudinaryMock } = vi.hoisted(() => ({
	cloudinaryMock: {
		deleteImage: vi.fn(),
	},
}));

vi.mock("@/utils/cloudinary", () => cloudinaryMock);

import {
	deleteCloudinaryImageAsset,
	deleteCloudinaryImageAssets,
	tryDeleteCloudinaryImageAssets,
} from "./cloudinary-assets";

describe("cloudinary asset utilities", () => {
	afterEach(() => {
		vi.clearAllMocks();
		(cloudinaryMock.deleteImage as Mock).mockResolvedValue({ result: "ok" });
	});

	it("deletes an image asset with a stored public id without parsing the URL", async () => {
		await deleteCloudinaryImageAsset({
			url: "https://res.cloudinary.com/riff/image/upload/v123/products/telecaster.jpg",
			publicId: "products/telecaster",
		});

		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith(
			"products/telecaster",
		);
	});

	it("deletes multiple image assets", async () => {
		await deleteCloudinaryImageAssets([
			{
				url: "https://cdn.example.com/old1.jpg",
				publicId: "old1",
			},
			{
				url: "https://cdn.example.com/old2.jpg",
				publicId: "old2",
			},
		]);

		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("old1");
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("old2");
	});

	it("can settle best-effort image asset deletions", async () => {
		(cloudinaryMock.deleteImage as Mock).mockImplementation((id: string) => {
			if (id === "old2") {
				return Promise.reject(new Error("delete failed"));
			}

			return Promise.resolve({ result: "ok" });
		});

		const result = await tryDeleteCloudinaryImageAssets([
			{
				url: "https://cdn.example.com/old1.jpg",
				publicId: "old1",
			},
			{
				url: "https://cdn.example.com/old2.jpg",
				publicId: "old2",
			},
		]);

		expect(result).toMatchObject([
			{ status: "fulfilled" },
			{ status: "rejected" },
		]);
	});
});
