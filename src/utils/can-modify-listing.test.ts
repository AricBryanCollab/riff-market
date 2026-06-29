import { describe, expect, it } from "vitest";
import {
	canModifyListing,
	isListingActionDisabled,
} from "./can-modify-listing";

describe("canModifyListing", () => {
	it("returns true when user is ADMIN", () => {
		const user = { id: "admin-1", role: "ADMIN" } as const;
		expect(canModifyListing(user as never, "seller-1")).toBe(true);
	});

	it("returns true when SELLER owns the listing", () => {
		const user = { id: "seller-1", role: "SELLER" } as const;
		expect(canModifyListing(user as never, "seller-1")).toBe(true);
	});

	it("returns false when SELLER does not own the listing", () => {
		const user = { id: "seller-1", role: "SELLER" } as const;
		expect(canModifyListing(user as never, "seller-2")).toBe(false);
	});

	it("returns false when user is CUSTOMER", () => {
		const user = { id: "customer-1", role: "CUSTOMER" } as const;
		expect(canModifyListing(user as never, "seller-1")).toBe(false);
	});

	it("returns false when user is null", () => {
		expect(canModifyListing(null, "seller-1")).toBe(false);
	});
});

describe("isListingActionDisabled", () => {
	describe("edit action", () => {
		it("returns false when canEditOrDelete is true and not pending", () => {
			expect(isListingActionDisabled("edit", true, false, false)).toBe(false);
		});

		it("returns true when canEditOrDelete is false", () => {
			expect(isListingActionDisabled("edit", false, false, false)).toBe(true);
		});

		it("returns true when isPending is true", () => {
			expect(isListingActionDisabled("edit", true, true, false)).toBe(true);
		});
	});

	describe("delete action", () => {
		it("returns false when canEditOrDelete is true and not pending", () => {
			expect(isListingActionDisabled("delete", true, false, false)).toBe(false);
		});

		it("returns true when canEditOrDelete is false", () => {
			expect(isListingActionDisabled("delete", false, false, false)).toBe(true);
		});

		it("returns true when isPending is true", () => {
			expect(isListingActionDisabled("delete", true, true, false)).toBe(true);
		});
	});

	describe("approve action", () => {
		it("returns false when not approved and not pending", () => {
			expect(isListingActionDisabled("approve", true, false, false)).toBe(
				false,
			);
		});

		it("returns true when isApproved is true", () => {
			expect(isListingActionDisabled("approve", true, false, true)).toBe(true);
		});

		it("returns true when isPending is true", () => {
			expect(isListingActionDisabled("approve", true, true, false)).toBe(true);
		});
	});

	describe("decline action", () => {
		it("returns false when not approved and not pending", () => {
			expect(isListingActionDisabled("decline", true, false, false)).toBe(
				false,
			);
		});

		it("returns true when isApproved is true", () => {
			expect(isListingActionDisabled("decline", true, false, true)).toBe(true);
		});

		it("returns true when isPending is true", () => {
			expect(isListingActionDisabled("decline", true, true, false)).toBe(true);
		});
	});

	describe("unknown action", () => {
		it("returns false for unknown actions", () => {
			expect(isListingActionDisabled("unknown", true, true, true)).toBe(false);
		});
	});
});
