import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { AppDialog } from "@/components/app-dialog";
import Navbar from "@/components/navbar";
import PageNotFound from "@/components/page-not-found";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import Toast from "@/components/toast";
import { useAuthUser } from "@/hooks/use-auth-user";
import { optionalAuthUserQueryOpt } from "@/lib/tanstack-query/auth-user-query";
import TanStackAppDevtools from "@/lib/tanstack-query/devtools";
import { useThemeStore } from "@/store/theme";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(optionalAuthUserQueryOpt),

	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "RiffMarket",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/png",
				href: "guitar-pick.png",
			},
		],
	}),

	shellComponent: RootDocument,
	notFoundComponent: () => <PageNotFound />,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const { data: user } = useAuthUser();
	const previewTheme = useThemeStore((state) => state.previewTheme);

	return (
		<html lang="en" className={previewTheme ?? user?.theme ?? "light"}>
			<head>
				<HeadContent />
			</head>
			<body>
				<div className="root">
					<Navbar />
					{children}
					<TanStackAppDevtools />
					<AppDialog type="signin" title="RiffMarket LogIn">
						<SignInForm />
					</AppDialog>

					<AppDialog
						type="signup"
						maxWidth="max-w-lg"
						title="Register at RiffMarket"
					>
						<SignUpForm />
					</AppDialog>
					<Toast />
				</div>
				<Scripts />
			</body>
		</html>
	);
}
