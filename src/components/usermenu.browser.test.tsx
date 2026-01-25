import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import UserMenu from "./usermenu";

vi.mock("@/hooks/useCartDetails", () => ({
	default: () => ({
		cartCount: 3,
	}),
}));

vi.mock("@/hooks/useSignOut", () => ({
	useSignOut: () => ({
		loading: false,
		signOut: vi.fn(),
	}),
}));

const mockSetOpenDialog = vi.fn();
const mockUseDialogStore = vi.fn(() => ({
	setOpenDialog: mockSetOpenDialog,
}));

vi.mock("@/store/dialog", () => ({
	useDialogStore: () => mockUseDialogStore(),
}));

const mockUseUserStore = vi.fn();

vi.mock("@/store/user", () => ({
	useUserStore: () => mockUseUserStore(),
}));

describe("UserMenu", () => {
	it("shows login actions when no user is present", async () => {
		mockUseUserStore.mockReturnValue({ user: null });

		render(<UserMenu />);

		const loginButton = await screen.findByRole("button", {
			name: /login/i,
		});
		fireEvent.click(loginButton);

		expect(mockSetOpenDialog).toHaveBeenCalledWith("signin");
		expect(
			screen.getByRole("button", { name: /get started/i }),
		).toBeInTheDocument();
	});

	it("shows cart and logout when a customer is logged in", async () => {
		mockUseUserStore.mockReturnValue({
			user: {
				firstName: "Aric",
				lastName: "Dev",
				role: "CUSTOMER",
				profilePic: null,
			},
		});

		render(<UserMenu />);

		expect(
			await screen.findByRole("button", { name: /logout/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /shopping cart/i }),
		).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
	});
});
