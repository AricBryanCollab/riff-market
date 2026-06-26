import { afterEach, describe, expect, it, vi } from "vitest";

const { loggerMock, prismaMock } = vi.hoisted(() => {
	const prismaMock = {
		user: {
			delete: vi.fn(),
		},
	};
	const loggerMock = {
		error: vi.fn(),
	};

	return { loggerMock, prismaMock };
});

vi.mock("@/data/connect-db", () => ({
	prisma: prismaMock,
}));

vi.mock("@/lib/logger", () => ({
	logger: loggerMock,
}));

import { deleteUser } from "./user-repo";

describe("user repo", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("deletes a user by id", async () => {
		prismaMock.user.delete.mockResolvedValue({ id: "user-1" });

		await deleteUser("user-1");

		expect(prismaMock.user.delete).toHaveBeenCalledWith({
			where: { id: "user-1" },
		});
	});
});
