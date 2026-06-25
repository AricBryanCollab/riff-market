import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

const { cloudinaryMock, compressImageMock } = vi.hoisted(() => {
	const cloudinaryMock = {
		deleteImage: vi.fn(),
		unsignedUploadImage: vi.fn(),
	} as const;
	const compressImageMock = vi.fn();

	return {
		cloudinaryMock,
		compressImageMock,
	};
});

vi.mock("@/env", () => ({
	env: {
		CLOUDINARY_UPLOAD_PRESET: "test-preset",
	},
}));

vi.mock("@/utils/cloudinary", () => cloudinaryMock);
vi.mock("@/utils/compress-image", () => ({
	compressImage: compressImageMock,
}));

import { CloudinaryProfilePictureAssets } from "./profile-picture-assets";

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

describe("profile picture assets", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("compresses and uploads a profile picture to Cloudinary", async () => {
		const assets = new CloudinaryProfilePictureAssets();
		const profilePic = makeImage("avatar.jpg");
		(compressImageMock as Mock).mockImplementation(withCompressedImage);
		(cloudinaryMock.unsignedUploadImage as Mock).mockResolvedValue({
			secure_url: "https://cdn.example.com/avatar.jpg",
			public_id: "avatar",
		});

		await expect(assets.uploadProfilePicture(profilePic)).resolves.toEqual({
			url: "https://cdn.example.com/avatar.jpg",
			publicId: "avatar",
		});
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
	});

	it("rejects uploads missing required Cloudinary metadata", async () => {
		const assets = new CloudinaryProfilePictureAssets();
		(compressImageMock as Mock).mockImplementation(withCompressedImage);
		(cloudinaryMock.unsignedUploadImage as Mock).mockResolvedValue({
			secure_url: "https://cdn.example.com/avatar.jpg",
		});

		await expect(
			assets.uploadProfilePicture(makeImage("avatar.jpg")),
		).rejects.toThrow("Image upload did not return required public ID");
	});
});
