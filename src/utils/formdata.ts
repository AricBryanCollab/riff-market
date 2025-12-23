import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { ProductCategory } from "@/types/enum";
import type {
	CreateProductRequest,
	UpdateProductRequest,
} from "@/types/product";

interface ParsedFormData<T> {
	data: T;
	files: {
		fieldName: string;
		originalName: string;
		savedPath: string;
		relativePath: string;
		mimeType: string;
		size: number;
	}[];
}

export async function parseProductFormData(
	formData: FormData,
	options: {
		uploadDir?: string;
		isUpdate?: boolean;
		maxFileSize?: number;
	} = {},
): Promise<ParsedFormData<CreateProductRequest | UpdateProductRequest>> {
	const {
		uploadDir = join(process.cwd(), "uploads", "products"),
		isUpdate = false,
		maxFileSize = 5 * 1024 * 1024, // 5MB
	} = options;

	const allowedImageTypes = [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/webp",
	];
	const files: ParsedFormData<
		CreateProductRequest | UpdateProductRequest
	>["files"] = [];

	// Create upload directory
	await mkdir(uploadDir, { recursive: true });

	// Parse images
	const imageFiles = formData.getAll("images") as File[];

	for (const file of imageFiles) {
		if (file.size === 0) continue;

		// Validate file type
		if (!allowedImageTypes.includes(file.type)) {
			throw new Error(
				`Invalid image type: ${file.type}. Allowed types: ${allowedImageTypes.join(", ")}`,
			);
		}

		// Validate file size
		if (file.size > maxFileSize) {
			throw new Error(
				`Image ${file.name} exceeds maximum size of ${maxFileSize / (1024 * 1024)}MB`,
			);
		}

		// Generate unique filename
		const fileExtension = file.name.split(".").pop() || "jpg";
		const uniqueFilename = `${randomUUID()}.${fileExtension}`;
		const filePath = join(uploadDir, uniqueFilename);
		const relativePath = join("uploads", "products", uniqueFilename);

		// Save file
		const buffer = Buffer.from(await file.arrayBuffer());
		await writeFile(filePath, buffer);

		files.push({
			fieldName: "images",
			originalName: file.name,
			savedPath: filePath,
			relativePath: relativePath.replace(/\\/g, "/"), // normalize for cross-platform
			mimeType: file.type,
			size: file.size,
		});
	}

	// Parse form fields
	const data: CreateProductRequest | UpdateProductRequest = {};

	if (!isUpdate) {
		data.name = formData.get("name") as string;
		data.category = formData.get("category") as ProductCategory;
		data.brand = formData.get("brand") as string;
		data.model = formData.get("model") as string;
		data.description = formData.get("description") as string;
		data.price = parseFloat(formData.get("price") as string);
		data.stock = parseInt(formData.get("stock") as string, 10);

		if (!data.name || !data.category || !data.brand || !data.model) {
			throw new Error("Missing required fields");
		}

		if (Number.isNaN(data.price) || data.price <= 0) {
			throw new Error("Invalid price");
		}

		if (Number.isNaN(data.stock) || data.stock < 0) {
			throw new Error("Invalid stock quantity");
		}

		if (files.length === 0) {
			throw new Error("At least one product image is required");
		}
	} else {
		// Optional fields for update
		const name = formData.get("name");
		if (name) data.name = name as string;

		const category = formData.get("category");
		if (category) data.category = category as ProductCategory;

		const brand = formData.get("brand");
		if (brand) data.brand = brand as string;

		const model = formData.get("model");
		if (model) data.model = model as string;

		const description = formData.get("description");
		if (description) data.description = description as string;

		const price = formData.get("price");
		if (price) {
			data.price = parseFloat(price as string);
			if (Number.isNaN(data.price) || data.price <= 0) {
				throw new Error("Invalid price");
			}
		}

		const stock = formData.get("stock");
		if (stock) {
			data.stock = parseInt(stock as string, 10);
			if (Number.isNaN(data.stock) || data.stock < 0) {
				throw new Error("Invalid stock quantity");
			}
		}
	}

	return { data, files };
}

export function getImagePaths(
	files: ParsedFormData<CreateProductRequest | UpdateProductRequest>["files"],
): string[] {
	return files.map((file) => file.relativePath);
}

export function hasUpdates(data: UpdateProductRequest): boolean {
	return Object.keys(data).length > 0;
}
