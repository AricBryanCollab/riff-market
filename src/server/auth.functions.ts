import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import {
	clearAuthSession,
	establishAuthSession,
	signInAccountService,
	signUpAccountService,
	validateSignInRequest,
	validateSignUpRequest,
} from "@/server/account-auth-service";
import { publicServerFunctionMiddleware } from "@/server/function-middleware";
import { useAppSession } from "@/utils/session";

export const signInFn = createServerFn({ method: "POST" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator(validateSignInRequest)
	.handler(async ({ data }) => {
		return establishAuthSession(
			await signInAccountService(data),
			useAppSession,
		);
	});

export const signUpFn = createServerFn({ method: "POST" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator(validateSignUpRequest)
	.handler(async ({ data }) => {
		const response = await establishAuthSession(
			await signUpAccountService(data),
			useAppSession,
		);

		setResponseStatus(201);

		return response;
	});

export const signOutFn = createServerFn({ method: "POST" })
	.middleware(publicServerFunctionMiddleware)
	.handler(async () => {
		return clearAuthSession(useAppSession);
	});
