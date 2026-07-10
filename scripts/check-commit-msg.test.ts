import { describe, expect, it } from "vitest";
import { validate } from "./check-commit-msg";

describe("validate", () => {
	it("accepts typed lowercase titles", () => {
		expect(validate("feat: add cart drawer")).toEqual({ ok: true });
	});

	it("accepts capital-led titles", () => {
		expect(validate("Allow capital-led commit titles")).toEqual({ ok: true });
	});

	it("accepts capital-led titles that contain a colon", () => {
		expect(validate("WIP: temporary")).toEqual({ ok: true });
		expect(validate("HTTP: add header")).toEqual({ ok: true });
		expect(validate("Allow: this")).toEqual({ ok: true });
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
			suggestion: "feat: add cart",
		});
	});

	it("rejects unknown typed-looking lowercase prefixes as freeform", () => {
		const result = validate("refactor: share listing fields");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.suggestion).toBe("Refactor: share listing fields");
			expect(result.reason).toContain("invalid commit title format");
			expect(result.reason).not.toContain("[commit]");
		}
	});

	it("suggests inserting space after the colon", () => {
		expect(validate("feat:add cart")).toEqual({
			ok: false,
			reason: 'typed commit titles must use ": " after the type.',
			suggestion: "feat: add cart",
		});
	});

	it("rejects empty typed descriptions", () => {
		expect(validate("feat: ")).toEqual({
			ok: false,
			reason: "typed commit titles need a non-empty description.",
		});
	});

	it("suggests capitalizing lowercase freeform titles", () => {
		const result = validate("add cart drawer");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.suggestion).toBe("Add cart drawer");
			expect(result.reason).toContain("invalid commit title format");
			expect(result.reason).not.toContain("[commit]");
		}
	});
});
