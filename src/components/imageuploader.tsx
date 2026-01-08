import { type LucideIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface ImageUploaderProps {
	inputId: string;
	label: string;
	disabled?: boolean;
	images: string[];
	onChange: (images: string[]) => void;
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

		// Check if adding these files would exceed max
		const remainingSlots = maxImages - images.length;
		if (files.length > remainingSlots) {
			setError(`You can only upload ${remainingSlots} more image(s)`);
			return;
		}

		const newImages: string[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			// Check file size
			if (file.size > maxSizeMB * 1024 * 1024) {
				setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
				continue;
			}

			// Check file type
			if (
				!acceptFormats.split(",").some((format) => file.type === format.trim())
			) {
				setError(`${file.name} is not a supported format`);
				continue;
			}

			// Convert to base64
			try {
				const base64 = await fileToBase64(file);
				newImages.push(base64);
			} catch (err) {
				setError(`Failed to process ${file.name}`);
				console.error(err);
			}
		}

		if (newImages.length > 0) {
			onChange([...images, ...newImages]);
		}
	};

	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		handleFileSelect(e.target.files);
		// Reset input so same file can be selected again
		e.target.value = "";
	};

	const handleRemoveImage = (index: number) => {
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

			{/* Upload Area */}
			{canAddMore && (
				<div
					onClick={triggerFileInput}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					className={`relative w-full rounded-lg border-2 border-dashed transition-all cursor-pointer ${
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
					<div className="flex flex-col items-center justify-center py-8 px-4 text-foreground hover:text-white ">
						{Icon ? (
							<Icon size={32} className=" mb-3" />
						) : (
							<Upload size={32} className=" mb-3" />
						)}
						<p className="text-sm font-medium mb-1">
							Click to upload or drag and drop
						</p>
						<p className="text-xs ">
							{acceptFormats
								.split(",")
								.map((f) => f.split("/")[1].toUpperCase())
								.join(", ")}{" "}
							(max {maxSizeMB}MB each)
						</p>
						<p className="text-xs mt-1">
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

			{/* Image Previews */}
			{images.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-2">
					{images.map((image, index) => (
						<div
							key={image}
							className="relative group aspect-square rounded-lg overflow-hidden border border-primary bg-muted"
						>
							<img
								src={image}
								alt={`Upload ${index + 1}`}
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
							{/* Image Number */}
							<div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
								{index + 1}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Info Text */}
			{images.length >= maxImages && (
				<div className="text-xs text-foreground/60 bg-accent px-3 py-2 rounded-lg">
					Maximum number of images reached ({maxImages})
				</div>
			)}
		</div>
	);
};

export default ImageUploader;
