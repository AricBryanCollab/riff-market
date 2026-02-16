import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UserMenu from "./user-menu";

vi.mock("@/hooks/use-cart-details", () => ({
	default: () => ({
		cartCount: 3,
	}),
}));

vi.mock("@/hooks/use-sign-out", () => ({
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

const mockUseAuthUser = vi.fn();

vi.mock("@/hooks/use-auth-user", () => ({
	useAuthUser: () => mockUseAuthUser(),
}));

describe("UserMenu", () => {
	it("shows login actions when no user is present", async () => {
		mockUseAuthUser.mockReturnValue({ data: null });

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
		mockUseAuthUser.mockReturnValue({
			data: {
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
