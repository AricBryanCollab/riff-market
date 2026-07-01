import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UserMenu from "./user-menu";

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
		"@tanstack/react-query",
	);

	return {
		...actual,
		useQuery: () => ({ data: { count: 0 } }),
		useQueryClient: () => ({
			prefetchQuery: vi.fn(),
		}),
	};
});

vi.mock("@tanstack/react-router", () => ({
	ClientOnly: ({ children }: { children: unknown }) =>
		typeof children === "function" ? children() : children,
}));

vi.mock("@/components/app-dropdown", () => ({
	AppDropdown: ({ trigger }: { trigger: unknown }) => <>{trigger}</>,
}));

vi.mock("@/components/avatar", () => ({
	default: () => <div data-testid="avatar" />,
}));

vi.mock("@/components/navbar-icon-buttons", () => ({
	default: ({ ariaLabel, count }: { ariaLabel: string; count: number }) => (
		<button type="button" aria-label={ariaLabel}>
			{count}
		</button>
	),
}));

vi.mock("@/store/cart", () => ({
	useCartStore: (
		selector: (state: {
			items: Array<{ quantity: number; listingId: string }>;
		}) => unknown,
	) => selector({ items: [{ quantity: 3, listingId: "listing-1" }] }),
}));

vi.mock("@/hooks/use-notifications", () => ({
	default: () => ({
		notifications: [],
		isLoading: false,
		isEmptyNotifications: true,
		markAsReadMutate: vi.fn(),
	}),
	notificationCountQueryOpt: {},
	notificationsQueryOpt: {},
}));

vi.mock("@/hooks/use-cart-details", () => ({
	cartDetailsQueryOpt: vi.fn(),
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
