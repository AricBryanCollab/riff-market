import { describe, expect, it } from "vitest";
import { validate } from "./check-commit-msg";

describe("validate", () => {
	it("accepts typed lowercase titles", () => {
		expect(validate("feat: add cart drawer")).toEqual({ ok: true });
	});

	it("accepts capital-led titles", () => {
		expect(validate("Allow capital-led commit titles")).toEqual({ ok: true });
	});

	it("accepts merge and revert subjects", () => {
		expect(validate("Merge branch 'main' into feature")).toEqual({ ok: true });
		expect(validate('Revert "feat: add cart drawer"')).toEqual({ ok: true });
	});

	it("rejects empty titles", () => {
		expect(validate("")).toEqual({
			ok: false,
			reason: "empty commit title is not allowed.",
		});
	});

	it("rejects non-ascii titles", () => {
		const result = validate("feat: add 🚀");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toContain("ASCII");
		}
	});

	it("suggests lowercase for cased typed titles", () => {
		expect(validate("Feat: Add Cart")).toEqual({
			ok: false,
			reason: "typed commit titles must be lowercase.",
			try: "feat: add cart",
		});
	});

	it("suggests closest type for unknown prefixes", () => {
		expect(validate("refactor: share listing fields")).toEqual({
			ok: false,
			reason: 'unknown type "refactor". Did you mean "ref"?',
			try: "ref: share listing fields",
		});
	});

	it("suggests inserting space after the colon", () => {
		expect(validate("feat:add cart")).toEqual({
			ok: false,
			reason: 'typed commit titles must use ": " after the type.',
			try: "feat: add cart",
		});
	});

	it("suggests capitalizing lowercase freeform titles", () => {
		const result = validate("add cart drawer");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.try).toBe("Add cart drawer");
			expect(result.reason).toContain("invalid commit title format");
		}
	});
});
