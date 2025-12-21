import { apiFetch } from "@/lib/tanstack-query/fetch";

import type { SignInInput, SignUpInput } from "@/lib/zod/auth.validation";
import type { AuthResponse, SignOutResponse } from "@/types/auth";

export function signIn(data: SignInInput) {
	return apiFetch<AuthResponse>("/api/auth/signin", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function signUp(data: SignUpInput) {
	return apiFetch<AuthResponse>("/api/auth/signup", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function signOut() {
	return apiFetch<SignOutResponse>("/api/auth/signout", {
		method: "POST",
	});
}
