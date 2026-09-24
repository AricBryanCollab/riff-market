import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent, DragEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LISTING_IMAGE_MAX_BYTES } from "@/domains/shared/domain/image-upload";
import useUploadImage, {
	existingImageFile,
	type ImageFile,
	type NewImageFile,
} from "./use-upload-image";

function makeFile(name: string, type = "image/png", size?: number) {
	const file = new File(["x"], name, { type });
	if (size !== undefined) {
		Object.defineProperty(file, "size", { value: size });
	}
	return file;
}

function newImage(file: File): NewImageFile {
	return { kind: "new", file, preview: `blob:${file.name}` };
}

function inputChange(files: File[]) {
	const target = { files, value: "C:\\fakepath\\file" };
	return {
		target,
		event: { target } as unknown as ChangeEvent<HTMLInputElement>,
	};
}

function drop(files: File[]) {
	return {
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
		dataTransfer: { files },
	} as unknown as DragEvent;
}

function setup(images: ImageFile[] = [], maxImages = 5) {
	const onChange = vi.fn();
	const { result } = renderHook(() =>
		useUploadImage(images, maxImages, onChange),
	);
	return { result, onChange };
}

const existing = existingImageFile({
	imageId: "img-1",
	url: "https://cdn.example.com/1.jpg",
});

beforeEach(() => {
	URL.createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}`);
	URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("useUploadImage file selection", () => {
	it("appends valid files as new images after the current ones", () => {
		const { result, onChange } = setup([existing]);
		const a = makeFile("a.png");
		const b = makeFile("b.jpg", "image/jpeg");
		const { event, target } = inputChange([a, b]);

		act(() => result.current.handleInputChange(event));

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith([existing, newImage(a), newImage(b)]);
		expect(result.current.error).toBe("");
		expect(target.value).toBe("");
	});

	it("rejects the whole batch when it exceeds the remaining slots", () => {
		const { result, onChange } = setup([existing], 3);
		const { event } = inputChange([
			makeFile("a.png"),
			makeFile("b.png"),
			makeFile("c.png"),
		]);

		act(() => result.current.handleInputChange(event));

		expect(onChange).not.toHaveBeenCalled();
		expect(URL.createObjectURL).not.toHaveBeenCalled();
		expect(result.current.error).toBe("You can only upload 2 more image(s)");
	});

	it("skips invalid files, keeps valid ones, and reports the last error", () => {
		const { result, onChange } = setup();
		const good = makeFile("good.webp", "image/webp");
		const { event } = inputChange([
			makeFile("big.png", "image/png", LISTING_IMAGE_MAX_BYTES + 1),
			good,
			makeFile("doc.gif", "image/gif"),
		]);

		act(() => result.current.handleInputChange(event));

		expect(onChange).toHaveBeenCalledWith([newImage(good)]);
		expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
		expect(result.current.error).toBe("doc.gif is not a supported format");
	});

	it("treats an empty file as over the size limit and skips onChange when nothing is valid", () => {
		const { result, onChange } = setup();
		const { event } = inputChange([
			makeFile("doc.gif", "image/gif"),
			makeFile("empty.png", "image/png", 0),
		]);

		act(() => result.current.handleInputChange(event));

		expect(onChange).not.toHaveBeenCalled();
		expect(result.current.error).toBe("empty.png exceeds 10MB limit");
	});

	it("keeps the previous error on an empty selection and clears it on the next valid one", () => {
		const { result, onChange } = setup();

		act(() =>
			result.current.handleInputChange(
				inputChange([makeFile("doc.gif", "image/gif")]).event,
			),
		);
		act(() => result.current.handleInputChange(inputChange([]).event));
		expect(result.current.error).toBe("doc.gif is not a supported format");

		act(() =>
			result.current.handleInputChange(inputChange([makeFile("a.png")]).event),
		);
		expect(result.current.error).toBe("");
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it("accepts dropped files through the same rules", () => {
		const { result, onChange } = setup();
		const a = makeFile("a.png");

		act(() => result.current.handleDragEnter(drop([])));
		expect(result.current.dragActive).toBe(true);

		act(() => result.current.handleDrop(drop([a])));

		expect(result.current.dragActive).toBe(false);
		expect(onChange).toHaveBeenCalledWith([newImage(a)]);
	});
});

describe("useUploadImage reorder", () => {
	const a = newImage(makeFile("a.png"));
	const b = newImage(makeFile("b.png"));
	const c = newImage(makeFile("c.png"));

	it("moves an image one step in either direction", () => {
		const { result, onChange } = setup([a, b, c]);

		act(() => result.current.handleMoveImage(0, 1));
		act(() => result.current.handleMoveImage(2, -1));

		expect(onChange).toHaveBeenNthCalledWith(1, [b, a, c]);
		expect(onChange).toHaveBeenNthCalledWith(2, [a, c, b]);
	});

	it("clears the error after a move", () => {
		const { result } = setup([a, b]);

		act(() =>
			result.current.handleInputChange(
				inputChange([makeFile("doc.gif", "image/gif")]).event,
			),
		);
		act(() => result.current.handleMoveImage(0, 1));

		expect(result.current.error).toBe("");
	});

	it("ignores moves past either end and keeps the error", () => {
		const { result, onChange } = setup([a, b]);

		act(() =>
			result.current.handleInputChange(
				inputChange([makeFile("doc.gif", "image/gif")]).event,
			),
		);
		act(() => result.current.handleMoveImage(0, -1));
		act(() => result.current.handleMoveImage(1, 1));

		expect(onChange).not.toHaveBeenCalled();
		expect(result.current.error).toBe("doc.gif is not a supported format");
	});
});
