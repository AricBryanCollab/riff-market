import { useRef, useState } from "react";

export interface ImageFile {
	file: File;
	preview: string;
}

const useUploadImage = (
	images: ImageFile[],
	maxImages: number,
	maxSizeMB: number,
	onChange: (images: ImageFile[]) => void,
) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState<string>("");
	const acceptFormats = "image/jpeg,image/png,image/webp";

	const handleFileSelect = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		setError("");

		const remainingSlots = maxImages - images.length;
		if (files.length > remainingSlots) {
			setError(`You can only upload ${remainingSlots} more image(s)`);
			return;
		}

		const newImages: ImageFile[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			if (file.size > maxSizeMB * 1024 * 1024) {
				setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
				continue;
			}

			if (
				!acceptFormats.split(",").some((format) => file.type === format.trim())
			) {
				setError(`${file.name} is not a supported format`);
				continue;
			}

			const preview = URL.createObjectURL(file);
			newImages.push({ file, preview });
		}

		if (newImages.length > 0) {
			onChange([...images, ...newImages]);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		handleFileSelect(e.target.files);
		e.target.value = "";
	};

	const handleRemoveImage = (index: number) => {
		URL.revokeObjectURL(images[index].preview);

		const newImages = images.filter((_, i) => i !== index);
		onChange(newImages);
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
		acceptFormats,
		triggerFileInput,
		handleDragEnter,
		handleRemoveImage,
		handleDrop,
		handleInputChange,
		handleDragLeave,
		handleDragOver,
	};
};

export default useUploadImage;
