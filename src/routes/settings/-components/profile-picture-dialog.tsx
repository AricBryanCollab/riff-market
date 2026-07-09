import { Save } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { BodySmall } from "@/components/ui/typography";
import {
	isAllowedImageMimeType,
	PROFILE_IMAGE_MAX_BYTES,
} from "@/domains/shared/domain/image-upload";
import useUpdateProfilePicture from "@/hooks/use-update-profile-picture";

const PROFILE_IMAGE_MAX_MB = PROFILE_IMAGE_MAX_BYTES / (1024 * 1024);
const ACCEPT_FORMATS = "image/jpeg,image/png,image/webp";
const PROFILE_PHOTO_INPUT_ID = "profilePic";
const PROFILE_PHOTO_DESCRIPTION_ID = "profile-photo-description";

export function ProfilePictureDialog() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [error, setError] = useState("");
	const { handleUpdateProfilePicture, loadingUpdateProfilePicture } =
		useUpdateProfilePicture();

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null;
		setError("");
		setSelectedFile(null);

		if (!file) {
			return;
		}

		if (!isAllowedImageMimeType(file.type)) {
			setError("Choose a JPEG, PNG, or WEBP image.");
			return;
		}

		if (file.size <= 0 || file.size > PROFILE_IMAGE_MAX_BYTES) {
			setError(`Choose an image under ${PROFILE_IMAGE_MAX_MB}MB.`);
			return;
		}

		setSelectedFile(file);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!selectedFile) return;

		handleUpdateProfilePicture(selectedFile);
	};

	return (
		<form onSubmit={handleSubmit}>
			<FieldGroup className="gap-4">
				<Field data-invalid={error ? true : undefined}>
					<FieldLabel htmlFor={PROFILE_PHOTO_INPUT_ID}>
						Profile photo
					</FieldLabel>
					<Input
						id={PROFILE_PHOTO_INPUT_ID}
						type="file"
						accept={ACCEPT_FORMATS}
						onChange={handleFileChange}
						aria-describedby={PROFILE_PHOTO_DESCRIPTION_ID}
						aria-invalid={error ? true : undefined}
					/>
					<FieldDescription id={PROFILE_PHOTO_DESCRIPTION_ID}>
						JPEG, PNG, or WEBP. Maximum {PROFILE_IMAGE_MAX_MB}MB.
					</FieldDescription>
					{selectedFile && (
						<BodySmall className="truncate leading-6">
							Selected: {selectedFile.name}
						</BodySmall>
					)}
					{error && <FieldError>{error}</FieldError>}
				</Field>
				<div className="flex justify-end">
					<LoadingButton
						type="submit"
						loading={loadingUpdateProfilePicture}
						disabled={!selectedFile}
					>
						<Save data-icon="inline-start" />
						Save photo
					</LoadingButton>
				</div>
			</FieldGroup>
		</form>
	);
}
