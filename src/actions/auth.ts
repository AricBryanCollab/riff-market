import { createServerFn } from "@tanstack/react-start";

import { createUser, findUserByEmail, findUserById } from "@/data/auth.repo";
import {
	type SignInInput,
	type SignUpInput,
	signInSchema,
	signUpSchema,
} from "@/lib/zod/auth.validation";
import type { SignInRequest, SignUpRequest } from "@/types/auth";
import { toHashPassword, validatePassword } from "@/utils/bcrypt";
import { useAppSession } from "@/utils/session";

// Sign Up : Register a User
export async function signUpService(rawData: SignUpRequest) {
	const session = await useAppSession();
	const parsed = signUpSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid sign up data",
			details: parsed.error,
		};
	}

	const data: SignUpInput = parsed.data;

	const existingUser = await findUserByEmail(data.email);

	if (existingUser) {
		return { error: "User already exists" };
	}

	const hashedPassword = await toHashPassword(data.password);

	const userAndSettings = await createUser({
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
		password: hashedPassword,
		role: "CUSTOMER",
	});

	const { user } = userAndSettings;

	await session.update({ userId: user.id });

	return {
		success: true,
		user: { id: user.id, email: user.email },
	};
}

// Sign In : Log in a User with session
export async function signInService(rawData: SignInRequest) {
	const session = await useAppSession();
	const parsed = signInSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid sign in data",
			details: parsed.error,
		};
	}

	const data: SignInInput = parsed.data;

	const user = await findUserByEmail(data.email);
	if (!user) {
		return { error: "Invalid email or password" };
	}

	const isValid = await validatePassword(data.password, user.password);
	if (!isValid) {
		return { error: "Invalid email or password" };
	}

	await session.update({ userId: user.id });

	return { success: true, user: { id: user.id, email: user.email } };
}

//  Get User Data
export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await useAppSession();
		const userId = session.data.userId;

		if (!userId) {
			return { error: "User is not authenticated" };
		}

		return await findUserById(userId);
	},
);

// Sign Out: Remove User session
export async function signOutService() {
	const session = await useAppSession();
	await session.clear();
}
