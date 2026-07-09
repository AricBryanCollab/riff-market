import z from "zod";
import { themeClasses } from "@/constants/theme-classes";
import { isValidPhoneNumber } from "@/domains/accounts/domain/phone-number";
import { isValidProfileAddress } from "@/domains/accounts/domain/profile-address";
import {
	isAllowedImageMimeType,
	PROFILE_IMAGE_MAX_BYTES,
} from "@/domains/shared/domain/image-upload";

const emptyStringAsNull = z
	.string()
	.trim()
	.length(0)
	.transform(() => null);

const profilePictureFile = z
	.instanceof(File)
	.refine(
		(file) => file.size > 0 && file.size <= PROFILE_IMAGE_MAX_BYTES,
		`File size must be less than ${PROFILE_IMAGE_MAX_BYTES / (1024 * 1024)}MB`,
	)
	.refine(
		(file) => isAllowedImageMimeType(file.type),
		"File must be a JPEG, PNG, or WebP image",
	);

export const updateUserSchema = z
	.object({
		firstName: z.string().trim().min(1, "First name is required").optional(),
		lastName: z.string().trim().min(1, "Last name is required").optional(),
		theme: z.enum(themeClasses).optional(),
		phone: z
			.union([
				emptyStringAsNull,
				z
					.string()
					.trim()
					.refine(isValidPhoneNumber, "Phone number must be 10-12 digits"),
				z.null(),
			])
			.optional(),
		address: z
			.union([
				emptyStringAsNull,
				z
					.string()
					.trim()
					.refine(
						isValidProfileAddress,
						"Address must be at least 5 characters",
					),
				z.null(),
			])
			.optional(),
	})
	.refine(
		(data) =>
			data.firstName !== undefined ||
			data.lastName !== undefined ||
			data.theme !== undefined ||
			data.phone !== undefined ||
			data.address !== undefined,
		{
			message: "At least one field at user data be provided for update",
		},
	);

export const updateProfilePictureSchema = z.object({
	profilePic: profilePictureFile,
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfilePicture = z.infer<typeof updateProfilePictureSchema>;
