import { randomBytes } from "node:crypto";
import { access, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function fileToTempPath(file: File): Promise<string> {
	// Generate unique filename
	const uniqueName = `${Date.now()}-${randomBytes(8).toString("hex")}-${file.name}`;

	// Use system temp directory
	const tempDir = tmpdir();
	const filePath = join(tempDir, uniqueName);

	// Convert File to Buffer
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	// Write to temp location
	await writeFile(filePath, buffer);
	await access(filePath);

	return filePath;
}

export async function deleteTempFile(filePath: string): Promise<void> {
	try {
		await unlink(filePath);
	} catch (error) {
		console.error(`Failed to delete temp file: ${filePath}`, error);
	}
}

export async function filesToTempPaths(files: File[]): Promise<string[]> {
	return Promise.all(files.map(fileToTempPath));
}
