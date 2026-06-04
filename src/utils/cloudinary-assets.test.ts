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

	it("deletes an image asset by deriving the public id from its URL", async () => {
		await deleteCloudinaryImageAsset(
			"https://res.cloudinary.com/riff/image/upload/avatar.jpg",
		);

		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("avatar");
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

	it("preserves folder paths after a Cloudinary version segment", async () => {
		await deleteCloudinaryImageAsset(
			"https://res.cloudinary.com/riff/image/upload/v123/products/telecaster.jpg",
		);

		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith(
			"products/telecaster",
		);
	});

	it("preserves folder paths after transformation and version segments", async () => {
		await deleteCloudinaryImageAsset(
			"https://res.cloudinary.com/riff/image/upload/c_fill,w_400/v123/products/strat.jpg",
		);

		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("products/strat");
	});

	it("preserves folder paths after transformation segments without a version", async () => {
		await deleteCloudinaryImageAsset(
			"https://res.cloudinary.com/riff/image/upload/c_fill,w_400/e_grayscale/products/strat.jpg",
		);

		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("products/strat");
	});

	it("falls back to the filename for non-Cloudinary URLs", async () => {
		await deleteCloudinaryImageAsset("https://cdn.example.com/old.jpg");

		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("old");
	});

	it("deletes multiple image assets", async () => {
		await deleteCloudinaryImageAssets([
			"https://cdn.example.com/old1.jpg",
			"https://cdn.example.com/old2.jpg",
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
			"https://cdn.example.com/old1.jpg",
			"https://cdn.example.com/old2.jpg",
		]);

		expect(result).toMatchObject([
			{ status: "fulfilled" },
			{ status: "rejected" },
		]);
	});
});
