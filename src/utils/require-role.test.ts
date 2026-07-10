import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { optionalAuthUserQueryOpt } from "@/lib/tanstack-query/auth-user-query";
import type { UserProfile } from "@/types/user";
import { requireAuthUser, requireRole } from "./require-role";

const userFunctionsMocks = vi.hoisted(() => ({
	getOptionalCurrentUserFn: vi.fn(),
}));

vi.mock("@/server/user.functions", () => userFunctionsMocks);

beforeEach(() => {
	vi.resetAllMocks();
});

describe("requireAuthUser", () => {
	it("loads a current user after the root loader previously cached guest auth state", async () => {
		const user = makeUser();
		const queryClient = makeQueryClient();

		queryClient.setQueryData(optionalAuthUserQueryOpt.queryKey, null);
		userFunctionsMocks.getOptionalCurrentUserFn.mockResolvedValue(user);

		await expect(requireAuthUser(queryClient)).resolves.toEqual(user);
	});

	it("redirects to the requested route when no current user can be resolved", async () => {
		const queryClient = makeQueryClient();

		userFunctionsMocks.getOptionalCurrentUserFn.mockResolvedValue(null);

		await expectRedirectTo(
			requireAuthUser(queryClient, "/sign-in"),
			"/sign-in",
		);
	});
});

describe("requireRole", () => {
	it("allows an authenticated user with an allowed role", async () => {
		const user = makeUser({ role: "SELLER" });
		const queryClient = makeQueryClient();

		queryClient.setQueryData(optionalAuthUserQueryOpt.queryKey, user);

		await expect(
			requireRole(queryClient, ["ADMIN", "SELLER"]),
		).resolves.toEqual(user);
	});

	it("redirects an authenticated user without an allowed role", async () => {
		const user = makeUser({ role: "CUSTOMER" });
		const queryClient = makeQueryClient();

		queryClient.setQueryData(optionalAuthUserQueryOpt.queryKey, user);

		await expectRedirectTo(
			requireRole(queryClient, ["SELLER"]),
			"/unauthorized",
		);
	});

	it("redirects when no authenticated user can be resolved", async () => {
		const queryClient = makeQueryClient();

		userFunctionsMocks.getOptionalCurrentUserFn.mockResolvedValue(null);

		await expectRedirectTo(
			requireRole(queryClient, ["SELLER"]),
			"/unauthorized",
		);
	});
});

function makeQueryClient() {
	return new QueryClient();
}

async function expectRedirectTo(promise: Promise<unknown>, to: string) {
	await expect(promise).rejects.toMatchObject({
		options: {
			to,
		},
	});
}

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
	return {
		id: "user-1",
		firstName: "Angus",
		lastName: "Young",
		email: "angus@example.com",
		role: "CUSTOMER",
		theme: "dark",
		phone: null,
		profilePic: null,
		address: null,
		...overrides,
	};
}
