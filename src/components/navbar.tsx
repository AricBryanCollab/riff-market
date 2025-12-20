import Button from "@/components/button";

const Navbar = () => {
	return (
		<header className="w-full border-b border-border bg-background">
			<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
				{/* Left: Logo + Brand + Main Menu */}
				<div className="flex items-center gap-8">
					{/* Logo + Name */}
					<div className="flex items-center gap-2">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold">
							R
						</div>
						<span className="text-lg font-semibold text-foreground">
							RiffMarket
						</span>
					</div>

					{/* Main Menu */}
					<ul className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground">
						<li>
							<a href="#" className="hover:text-foreground transition">
								Shop
							</a>
						</li>
						<li>
							<a href="#" className="hover:text-foreground transition">
								Learn
							</a>
						</li>
						<li>
							<a href="#" className="hover:text-foreground transition">
								Guide
							</a>
						</li>
						<li>
							<a href="#" className="hover:text-foreground transition">
								Community
							</a>
						</li>
					</ul>
				</div>

				{/* Right: Auth Actions */}
				<div className="flex items-center gap-3">
					<Button variant="outline">Login</Button>
					<Button variant="primary">Get Started</Button>
				</div>
			</nav>
		</header>
	);
};

export default Navbar;
