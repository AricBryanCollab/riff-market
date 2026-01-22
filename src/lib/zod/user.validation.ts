import z from "zod";
import { themeClasses } from "@/constants/themeClasses";

const profilePictureFile = z
	.instanceof(File)
	.refine(
		(file) => file.size <= 4 * 1024 * 1024,
		"File size must be less than 4MB",
	)
	.refine(
		(file) =>
			["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
				file.type,
			),
		"File must be a JPEG, PNG, or WebP image",
	);

export const udpateUserSchema = z
	.object({
		firstName: z.string().trim().min(1, "First name is required").optional(),
		lastName: z.string().trim().min(1, "Last name is required").optional(),
		theme: z.enum(themeClasses).optional(),
		phone: z
			.string()
			.trim()
			.regex(/^[0-9]+$/, "Phone number must contain only digits (0-9)")
			.optional()
			.nullable(),
		address: z
			.string()
			.trim()
			.min(10, "Please provide a valid address")
			.optional()
			.nullable(),
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

export type UpdateUserInput = z.infer<typeof udpateUserSchema>;
export type UpdateProfilePicture = z.infer<typeof updateProfilePictureSchema>;
