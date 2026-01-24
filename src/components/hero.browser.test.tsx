import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Hero from "./hero";

describe("Hero", () => {
	it("renders title, caption, and background image", () => {
		const image = "/hero.jpg";

		const { container } = render(
			<Hero image={image} title="Shop the drop" caption="Limited run" />,
		);

		expect(screen.getByText("Shop the drop")).toBeInTheDocument();
		expect(screen.getByText("Limited run")).toBeInTheDocument();

		const background = container.querySelector("div[style]");
		expect(background).toHaveStyle({ backgroundImage: `url(${image})` });
	});
});
