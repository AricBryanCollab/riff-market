import { type LucideIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface ImageFile {
	file: File;
	preview: string;
}

interface ImageUploaderProps {
	inputId: string;
	label: string;
	disabled?: boolean;
	images: ImageFile[];
	onChange: (images: ImageFile[]) => void;
	maxImages?: number;
	icon?: LucideIcon;
	acceptFormats?: string;
	maxSizeMB?: number;
}

const ImageUploader = ({
	inputId,
	label,
	disabled,
	images,
	onChange,
	maxImages = 5,
	icon: Icon,
	acceptFormats = "image/jpeg,image/png,image/webp,image/gif",
	maxSizeMB = 5,
}: ImageUploaderProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState<string>("");

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

		if (disabled) return;

		const files = e.dataTransfer.files;
		handleFileSelect(files);
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const canAddMore = images.length < maxImages;

	return (
		<div className="flex flex-col gap-1 my-2">
			<label
				htmlFor={inputId}
				className="block text-sm font-semibold tracking-wide text-foreground"
			>
				{label}
			</label>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="flex flex-col gap-3">
					{canAddMore && (
						<div
							onClick={triggerFileInput}
							onDragEnter={handleDragEnter}
							onDragLeave={handleDragLeave}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							className={`relative w-full h-full min-h-62.5 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
								dragActive
									? "border-primary bg-accent"
									: "border-primary bg-muted hover:bg-accent"
							} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							<input
								ref={fileInputRef}
								id={inputId}
								type="file"
								multiple
								accept={acceptFormats}
								onChange={handleInputChange}
								disabled={disabled}
								className="hidden"
							/>
							<div className="flex flex-col items-center justify-center h-full py-8 px-4">
								{Icon ? (
									<Icon size={32} className="text-foreground/60 mb-3" />
								) : (
									<Upload size={32} className="text-foreground/60 mb-3" />
								)}
								<p className="text-sm font-medium text-foreground mb-1">
									Click to upload or drag and drop
								</p>
								<p className="text-xs text-foreground/60 text-center">
									{acceptFormats
										.split(",")
										.map((f) => f.split("/")[1].toUpperCase())
										.join(", ")}{" "}
									(max {maxSizeMB}MB each)
								</p>
								<p className="text-xs text-foreground/60 mt-1">
									{images.length} / {maxImages} images uploaded
								</p>
							</div>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
							{error}
						</div>
					)}

					{/* Max Images Info */}
					{images.length >= maxImages && (
						<div className="text-xs text-foreground/60 bg-accent px-3 py-2 rounded-lg">
							Maximum number of images reached ({maxImages})
						</div>
					)}
				</div>

				{/* Image Preview - Right Side */}
				<div className="flex flex-col gap-3">
					{images.length > 0 ? (
						<div className="grid grid-cols-2 gap-3 h-full">
							{images.map((imageFile, index) => (
								<div
									key={imageFile.preview}
									className="relative group aspect-square rounded-lg overflow-hidden border border-primary bg-muted"
								>
									<img
										src={imageFile.preview}
										alt={imageFile.file.name}
										className="w-full h-full object-cover"
									/>
									{/* Remove Button */}
									{!disabled && (
										<button
											type="button"
											onClick={() => handleRemoveImage(index)}
											className="absolute top-2 right-2 cursor-pointer bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
											title="Remove image"
										>
											<X size={16} />
										</button>
									)}
									{/* Image Number & File Name */}
									<div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1">
										<div className="font-semibold">{index + 1}</div>
										<div className="truncate">{imageFile.file.name}</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="flex items-center justify-center h-full min-h-25 rounded-lg border-2 border-dashed border-primary/30 bg-muted/50">
							<p className="text-sm text-foreground/60">
								No images uploaded yet
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ImageUploader;
