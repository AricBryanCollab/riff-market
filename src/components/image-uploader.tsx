import { cva } from "class-variance-authority";
import {
	ChevronLeft,
	ChevronRight,
	type LucideIcon,
	Upload,
	X,
} from "lucide-react";
import useUploadImage, {
	type ImageFile,
	type ImageFileChange,
	isNewImageFile,
} from "@/hooks/use-upload-image";

interface ImageUploaderProps<TImage extends ImageFile> {
	inputId: string;
	label: string;
	images: TImage[];
	onChange: (images: ImageFileChange<TImage>) => void;
	maxImages?: number;
	icon?: LucideIcon;
}

const imageUploaderDropZoneVariants = cva(
	"relative w-full h-full min-h-62.5 rounded-lg border border-dashed transition-[background-color,border-color] cursor-pointer",
	{
		variants: {
			dragActive: {
				true: "border-foreground/60 bg-muted",
				false:
					"border-foreground/20 bg-muted/50 hover:border-foreground/40 hover:bg-muted",
			},
		},
		defaultVariants: {
			dragActive: false,
		},
	},
);

const ImageUploader = <TImage extends ImageFile>({
	inputId,
	label,
	images,
	onChange,
	maxImages = 5,
	icon: Icon,
}: ImageUploaderProps<TImage>) => {
	const {
		dragActive,
		error,
		canAddMore,
		fileInputRef,
		acceptFormats,
		maxSizeMB,
		triggerFileInput,
		handleDragEnter,
		handleRemoveImage,
		handleMoveImage,
		handleDrop,
		handleInputChange,
		handleDragLeave,
		handleDragOver,
	} = useUploadImage(images, maxImages, onChange);

	const getImageLabel = (imageFile: ImageFile) =>
		isNewImageFile(imageFile) ? imageFile.file.name : "Existing listing photo";

	return (
		<div className="flex flex-col gap-3 my-2">
			<label
				htmlFor={inputId}
				className="block text-sm leading-snug font-medium text-foreground"
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
							className={imageUploaderDropZoneVariants({ dragActive })}
						>
							<input
								ref={fileInputRef}
								id={inputId}
								type="file"
								multiple
								accept={acceptFormats}
								onChange={handleInputChange}
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
								<p className="text-xs text-foreground/60 mt-1 tabular-nums">
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
									className="group flex flex-col gap-1.5 min-w-0"
								>
									<div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
										<img
											src={imageFile.preview}
											alt={getImageLabel(imageFile)}
											className="w-full h-full object-cover rounded-lg outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
										/>
										<div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
											{images.length > 1 && (
												<div className="flex items-center gap-1">
													<button
														type="button"
														onClick={() => handleMoveImage(index, -1)}
														disabled={index === 0}
														className="relative cursor-pointer bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity shadow-lg hover:bg-black/80 disabled:pointer-events-none disabled:opacity-30 after:absolute after:top-1/2 after:left-1/2 after:h-10 after:w-8 after:-translate-1/2"
														title="Move image earlier"
														aria-label="Move image earlier"
													>
														<ChevronLeft size={16} />
													</button>
													<button
														type="button"
														onClick={() => handleMoveImage(index, 1)}
														disabled={index === images.length - 1}
														className="relative cursor-pointer bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity shadow-lg hover:bg-black/80 disabled:pointer-events-none disabled:opacity-30 after:absolute after:top-1/2 after:left-1/2 after:h-10 after:w-8 after:-translate-1/2"
														title="Move image later"
														aria-label="Move image later"
													>
														<ChevronRight size={16} />
													</button>
												</div>
											)}
											<button
												type="button"
												onClick={() => handleRemoveImage(index)}
												className="relative ml-auto cursor-pointer bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity shadow-lg hover:bg-red-600 after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-1/2"
												title="Remove image"
												aria-label="Remove image"
											>
												<X size={16} />
											</button>
										</div>
									</div>
									<div className="flex gap-1.5 px-0.5 text-xs text-foreground/60">
										<span className="font-medium text-foreground tabular-nums">
											{index + 1}
										</span>
										<span className="truncate">{getImageLabel(imageFile)}</span>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="flex items-center justify-center h-full min-h-25 rounded-lg border border-dashed border-foreground/10 bg-muted/30">
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
