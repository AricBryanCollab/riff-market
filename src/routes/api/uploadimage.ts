import { createFileRoute } from "@tanstack/react-router";
import { uploadHandler } from "@/utils/uploadthing";

export const Route = createFileRoute("/api/uploadimage")({
	server: {
		handlers: {
			POST: async ({ request }) => uploadHandler(request),
			GET: async ({ request }) => uploadHandler(request),
		},
	},
});
