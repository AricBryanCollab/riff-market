import { lazy, Suspense } from "react";

const TanStackAppDevtoolsPanel = import.meta.env.DEV
	? lazy(async () => {
			const [reactDevtools, routerDevtools, queryDevtools] = await Promise.all([
				import("@tanstack/react-devtools"),
				import("@tanstack/react-router-devtools"),
				import("@tanstack/react-query-devtools"),
			]);

			const TanStackDevtools = reactDevtools.TanStackDevtools;
			const TanStackRouterDevtoolsPanel =
				routerDevtools.TanStackRouterDevtoolsPanel;
			const ReactQueryDevtoolsPanel = queryDevtools.ReactQueryDevtoolsPanel;

			return {
				default: function TanStackAppDevtoolsPanelImpl() {
					return (
						<TanStackDevtools
							config={{
								position: "bottom-right",
							}}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
								{
									name: "Tanstack Query",
									render: <ReactQueryDevtoolsPanel />,
								},
							]}
						/>
					);
				},
			};
		})
	: null;

function TanStackAppDevtools() {
	if (!TanStackAppDevtoolsPanel) {
		return null;
	}

	return (
		<Suspense fallback={null}>
			<TanStackAppDevtoolsPanel />
		</Suspense>
	);
}

export default TanStackAppDevtools;
