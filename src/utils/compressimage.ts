import sharp from "sharp";

type ImageFormat = "jpeg" | "webp";

interface CompressImageOptions {
	maxSize?: number;
	quality?: number;
	format?: ImageFormat;
}

interface CompressImageInput {
	file: File;
	options?: CompressImageOptions;
}

const defaultOptions: Required<CompressImageOptions> = {
	maxSize: 2400,
	quality: 85,
	format: "jpeg",
};

export async function compressImage({ file, options }: CompressImageInput) {
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const finalOptions = { ...defaultOptions, ...options };
	const { maxSize, quality, format } = finalOptions;

	let pipeline = sharp(buffer).resize(maxSize, maxSize, {
		fit: "inside",
		withoutEnlargement: true,
	});

	if (format === "webp") {
		pipeline = pipeline.webp({ quality });
	} else {
		pipeline = pipeline.jpeg({ quality });
	}

	const compressedBuffer = await pipeline.toBuffer();

	return {
		buffer: compressedBuffer,
		originalSize: buffer.length,
		compressedSize: compressedBuffer.length,
		mime: format === "webp" ? "image/webp" : "image/jpeg",
	};
}
