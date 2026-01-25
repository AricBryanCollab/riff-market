import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDialogStore } from "@/store/dialog";

const HeroSection = () => {
	const { setOpenDialog } = useDialogStore();

	return (
		<div className="text-center py-16">
			<h1 className="text-4xl md:text-5xl font-bold text-foreground">
				Buy & Sell Music Gear
			</h1>
			<p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
				The marketplace for musicians. Find your next instrument or give your
				gear a new home.
			</p>
			<div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
				<Button asChild size="lg">
					<Link to="/shop">Shop Now</Link>
				</Button>
				<Button
					variant="outline"
					size="lg"
					onClick={() => setOpenDialog("signup")}
				>
					Start Selling
				</Button>
			</div>
		</div>
	);
};

export default HeroSection;
