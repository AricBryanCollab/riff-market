import { Link } from "@tanstack/react-router";
import Button from "@/components/button";
import { useDialogStore } from "@/store/dialog";

const HeroSection = () => {
	const { setOpenDialog } = useDialogStore();

	return (
		<div className="text-center py-16">
			<h1 className="text-4xl md:text-5xl font-secondary font-bold text-foreground">
				Buy & Sell Music Gear
			</h1>
			<p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
				The marketplace for musicians. Find your next instrument or give your
				gear a new home.
			</p>
			<div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
				<Link to="/shop">
					<Button variant="primary" fontSize="text-lg">
						Shop Now
					</Button>
				</Link>
				<Button
					variant="outline"
					fontSize="text-lg"
					action={() => setOpenDialog("signup")}
				>
					Start Selling
				</Button>
			</div>
		</div>
	);
};

export default HeroSection;
