import { useRef, useState } from "react";
import {
	isAllowedImageMimeType,
	LISTING_IMAGE_MAX_BYTES,
} from "@/domains/shared/domain/image-upload";

export type ExistingImageFile = {
	readonly kind: "existing";
	readonly imageId: string;
	readonly url: string;
	readonly preview: string;
};

export type NewImageFile = {
	readonly kind: "new";
	readonly file: File;
	readonly preview: string;
};

export type ImageFile = ExistingImageFile | NewImageFile;
export type ImageFileChange<TImage extends ImageFile> = Array<
	TImage | NewImageFile
>;

export function existingImageFile(image: {
	readonly imageId: string;
	readonly url: string;
}): ExistingImageFile {
	return {
		kind: "existing",
		imageId: image.imageId,
		url: image.url,
		preview: image.url,
	};
}

export function isNewImageFile(image: ImageFile): image is NewImageFile {
	return image.kind === "new";
}

export function isExistingImageFile(
	image: ImageFile,
): image is ExistingImageFile {
	return image.kind === "existing";
}

const LISTING_IMAGE_MAX_MB = LISTING_IMAGE_MAX_BYTES / (1024 * 1024);
const ACCEPT_FORMATS = "image/jpeg,image/png,image/webp";

function validateIncomingFiles(
	files: readonly File[],
	remainingSlots: number,
): { accepted: File[]; error: string } {
	if (files.length > remainingSlots) {
		return {
			accepted: [],
			error: `You can only upload ${remainingSlots} more image(s)`,
		};
	}

	const accepted: File[] = [];
	let error = "";

	for (const file of files) {
		if (file.size <= 0 || file.size > LISTING_IMAGE_MAX_BYTES) {
			error = `${file.name} exceeds ${LISTING_IMAGE_MAX_MB}MB limit`;
		} else if (!isAllowedImageMimeType(file.type)) {
			error = `${file.name} is not a supported format`;
		} else {
			accepted.push(file);
		}
	}

	return { accepted, error };
}

function moveItem<T>(
	items: readonly T[],
	index: number,
	direction: -1 | 1,
): T[] | null {
	const target = index + direction;
	if (target < 0 || target >= items.length) return null;

	const next = [...items];
	const [item] = next.splice(index, 1);
	next.splice(target, 0, item);
	return next;
}

const useUploadImage = <TImage extends ImageFile>(
	images: TImage[],
	maxImages: number,
	onChange: (images: ImageFileChange<TImage>) => void,
) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState<string>("");

	const handleFileSelect = (files: FileList | null) => {
		if (!files || files.length === 0) return;

		const { accepted, error } = validateIncomingFiles(
			Array.from(files),
			maxImages - images.length,
		);
		setError(error);

		if (accepted.length > 0) {
			onChange([
				...images,
				...accepted.map(
					(file): NewImageFile => ({
						kind: "new",
						file,
						preview: URL.createObjectURL(file),
					}),
				),
			]);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		handleFileSelect(e.target.files);
		e.target.value = "";
	};

	const handleRemoveImage = (index: number) => {
		const image = images[index];

		if (image && isNewImageFile(image)) {
			URL.revokeObjectURL(image.preview);
		}

		const remainingImages = images.filter((_, i) => i !== index);
		onChange(remainingImages);
		setError("");
	};

	const handleMoveImage = (index: number, direction: -1 | 1) => {
		const reorderedImages = moveItem(images, index, direction);
		if (!reorderedImages) return;

		onChange(reorderedImages);
		setError("");
	};

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const files = e.dataTransfer.files;
		handleFileSelect(files);
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const canAddMore = images.length < maxImages;

	return {
		dragActive,
		error,
		canAddMore,
		fileInputRef,
		acceptFormats: ACCEPT_FORMATS,
		maxSizeMB: LISTING_IMAGE_MAX_MB,
		triggerFileInput,
		handleDragEnter,
		handleRemoveImage,
		handleMoveImage,
		handleDrop,
		handleInputChange,
		handleDragLeave,
		handleDragOver,
	};
};

export default useUploadImage;
