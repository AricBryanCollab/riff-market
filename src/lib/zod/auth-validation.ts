import { z } from "zod";
import { selfAssignableRoles } from "@/domains/accounts/application/account-auth";
import {
	isValidPassword,
	MIN_PASSWORD_LENGTH,
} from "@/domains/accounts/domain/password";

const passwordPolicyMessage = `Password must be at least ${MIN_PASSWORD_LENGTH} characters and include uppercase, lowercase, a number, and a special character`;

const passwordSchema = z
	.string()
	.refine(isValidPassword, passwordPolicyMessage);

export const signUpSchema = z
	.object({
		firstName: z.string().trim().min(1, "First name is required"),
		lastName: z.string().trim().min(1, "Last name is required"),
		email: z
			.string()
			.trim()
			.min(1, "Email is required")
			.email("Invalid email address"),
		password: passwordSchema,
		confirmPassword: passwordSchema,
		role: z.enum(selfAssignableRoles).optional().default("CUSTOMER"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Invalid email address"),
	password: z.string().trim().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
