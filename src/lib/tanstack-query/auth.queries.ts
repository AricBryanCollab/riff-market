import { apiFetch } from "@/lib/tanstack-query/fetch";

import type { SignInInput, SignUpInput } from "@/lib/zod/auth.validation";

// TODO: replace void with proper response type
export function signIn(data: SignInInput) {
	return apiFetch<void>("/api/auth/signin", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function signUp(data: SignUpInput) {
	return apiFetch<void>("/api/auth/signup", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function signOut() {
	return apiFetch<void>("/api/auth/signout", {
		method: "POST",
	});
}
