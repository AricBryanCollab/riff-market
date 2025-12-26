import type { FileRouter } from "uploadthing/server";
import {
	createRouteHandler,
	createUploadthing,
	UploadThingError,
} from "uploadthing/server";
import { useAppSession } from "@/utils/session";

const f = createUploadthing();

const useUploadRouter = {
	imageUploader: f({
		image: {
			maxFileSize: "4MB",
			maxFileCount: 3,
		},
	})
		.middleware(async () => {
			const session = useAppSession();
			const user = (await session).data;

			if (!session)
				throw new UploadThingError("User unauthorized, access denied");

			return { userId: user.userId };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log("Upload complete for userId:", metadata.userId);

			console.log("file url", file.ufsUrl);
			return { uploadedBy: metadata.userId };
		}),
} satisfies FileRouter;

export type UploadRouter = typeof useUploadRouter;

export const uploadHandler = createRouteHandler({
	router: useUploadRouter,
});
