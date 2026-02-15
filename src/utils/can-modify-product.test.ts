import { describe, expect, it } from "vitest";
import { canModifyProduct, isActionDisabled } from "./can-modify-product";

describe("canModifyProduct", () => {
	it("returns true when user is ADMIN", () => {
		const user = { id: "admin-1", role: "ADMIN" } as const;
		expect(canModifyProduct(user as never, "seller-1")).toBe(true);
	});

	it("returns true when SELLER owns the product", () => {
		const user = { id: "seller-1", role: "SELLER" } as const;
		expect(canModifyProduct(user as never, "seller-1")).toBe(true);
	});

	it("returns false when SELLER does not own the product", () => {
		const user = { id: "seller-1", role: "SELLER" } as const;
		expect(canModifyProduct(user as never, "seller-2")).toBe(false);
	});

	it("returns false when user is CUSTOMER", () => {
		const user = { id: "customer-1", role: "CUSTOMER" } as const;
		expect(canModifyProduct(user as never, "seller-1")).toBe(false);
	});

	it("returns false when user is null", () => {
		expect(canModifyProduct(null, "seller-1")).toBe(false);
	});
});

describe("isActionDisabled", () => {
	describe("edit action", () => {
		it("returns false when canEditOrDelete is true and not pending", () => {
			expect(isActionDisabled("edit", true, false, false)).toBe(false);
		});

		it("returns true when canEditOrDelete is false", () => {
			expect(isActionDisabled("edit", false, false, false)).toBe(true);
		});

		it("returns true when isPending is true", () => {
			expect(isActionDisabled("edit", true, true, false)).toBe(true);
		});
	});

	describe("delete action", () => {
		it("returns false when canEditOrDelete is true and not pending", () => {
			expect(isActionDisabled("delete", true, false, false)).toBe(false);
		});

		it("returns true when canEditOrDelete is false", () => {
			expect(isActionDisabled("delete", false, false, false)).toBe(true);
		});

		it("returns true when isPending is true", () => {
			expect(isActionDisabled("delete", true, true, false)).toBe(true);
		});
	});

	describe("approve action", () => {
		it("returns false when not approved and not pending", () => {
			expect(isActionDisabled("approve", true, false, false)).toBe(false);
		});

		it("returns true when isApproved is true", () => {
			expect(isActionDisabled("approve", true, false, true)).toBe(true);
		});

		it("returns true when isPending is true", () => {
			expect(isActionDisabled("approve", true, true, false)).toBe(true);
		});
	});

	describe("decline action", () => {
		it("returns false when not approved and not pending", () => {
			expect(isActionDisabled("decline", true, false, false)).toBe(false);
		});

		it("returns true when isApproved is true", () => {
			expect(isActionDisabled("decline", true, false, true)).toBe(true);
		});

		it("returns true when isPending is true", () => {
			expect(isActionDisabled("decline", true, true, false)).toBe(true);
		});
	});

	describe("unknown action", () => {
		it("returns false for unknown actions", () => {
			expect(isActionDisabled("unknown", true, true, true)).toBe(false);
		});
	});
});
