import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DesktopOrderSummary } from "./order-summary";

describe("DesktopOrderSummary", () => {
	it("does not add tax when no real tax amount is provided", () => {
		render(
			<DesktopOrderSummary
				subtotalAmountMinor={19_995}
				shippingAmountMinor={0}
				currencyCode="TWD"
			/>,
		);

		expect(screen.queryByText("Tax")).toBeNull();
		expect(screen.getAllByText("NT$19,995").length).toBe(2);
	});
});
