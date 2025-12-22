import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import Dialog from "@/components/dialog";
import Navbar from "@/components/navbar";
import PageNotFound from "@/components/pagenotfound";

import SignInForm from "@/components/signinform";
import SignUpForm from "@/components/signupform";
import { ThemeProvider } from "@/components/themeprovider";
import Toast from "@/components/toast";
import TanStackQueryDevtools from "@/lib/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
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
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<div className="root">
					<ThemeProvider defaultTheme="light">
						<Navbar />
						{children}
						<TanStackDevtools
							config={{
								position: "bottom-right",
							}}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
								TanStackQueryDevtools,
							]}
						/>
						<Dialog type="signin" title="RiffMarket LogIn">
							<SignInForm />
						</Dialog>

						<Dialog
							type="signup"
							maxWidth="max-w-lg"
							title="Register at RiffMarket"
						>
							<SignUpForm />
						</Dialog>
						<Toast />
					</ThemeProvider>
				</div>
				<Scripts />
			</body>
		</html>
	);
}
