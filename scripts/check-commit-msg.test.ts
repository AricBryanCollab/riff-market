import { describe, expect, it } from "vitest";
import { validate } from "./check-commit-msg";

const INVALID_FORMAT_REASON = [
	"invalid commit title format.",
	"expected either:",
	"  <type>: <lowercase action title>",
	"  <Title starting with a capital letter>",
	"allowed types: init, feat, component, hooks, api, style, layout, structure, chore, docs, fix, ref",
].join("\n");

describe("validate", () => {
	it("accepts typed lowercase titles", () => {
		expect(validate("feat: add cart drawer")).toEqual({ ok: true });
	});

	it("accepts allowed type ref", () => {
		expect(validate("ref: share listing fields")).toEqual({ ok: true });
	});

	it("accepts capital-led titles", () => {
		expect(validate("Allow capital-led commit titles")).toEqual({ ok: true });
	});

	it.each([
		"WIP: temporary",
		"HTTP: add header",
		"Allow: this",
	])("accepts capital-led title %s", (title) => {
		expect(validate(title)).toEqual({ ok: true });
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
		expect(validate("feat: add 🚀")).toEqual({
			ok: false,
			reason:
				"commit title must use plain ASCII characters only (no emoji/unicode).",
		});
	});

	it("suggests lowercase for cased typed titles", () => {
		expect(validate("Feat: Add Cart")).toEqual({
			ok: false,
			reason: "typed commit titles must be lowercase.",
			suggestion: "feat: add cart",
		});
	});

	it("suggests capitalizing unknown lowercase type prefixes", () => {
		expect(validate("refactor: share listing fields")).toEqual({
			ok: false,
			reason: INVALID_FORMAT_REASON,
			suggestion: "Refactor: share listing fields",
		});
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
		expect(validate("add cart drawer")).toEqual({
			ok: false,
			reason: INVALID_FORMAT_REASON,
			suggestion: "Add cart drawer",
		});
	});
});
