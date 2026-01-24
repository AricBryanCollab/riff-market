import { useNavigate } from "@tanstack/react-router";
import Button from "@/components/button";

const PageNotFound = () => {
	const navigate = useNavigate();
	return (
		<div className="flex flex-col gap-6 min-h-screen justify-center items-center">
			<div className="flex flex-col gap-2 justify-center items-center">
				<h1 className="text-4xl font-semibold tracking-wider">
					Page Not Found
				</h1>
				<p className="text-muted-foreground w-md text-center">
					The page you had navigated is not available. Click on the button below
					to go back to our home page.
				</p>
			</div>
			<Button action={() => navigate({ to: "/" })} variant="outline">
				Home Page
			</Button>
		</div>
	);
};

export default PageNotFound;
