import { Link } from "@tanstack/react-router";
import UserMenu from "@/components/usermenu";
import { navbarItems } from "@/constants/navbarItems";

interface NavbarItemProps {
	name: string;
	link: string;
}

const Navbar = () => {
	return (
		<header className="w-full border-b border-border bg-background">
			<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
				{/* Left: Logo + Brand + Main Menu */}
				<div className="flex items-center gap-8">
					{/* Logo + Name */}
					<div className="flex items-center gap-2">
						{/* <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold">
							R
						</div> */}
						<Link to="/">
							<img
								src="/logo.png"
								alt="app-logo"
								className="size-9 rounded-xl"
							/>
						</Link>
						<span className="text-lg font-semibold font-secondary tracking-wider text-foreground">
							RiffMarket
						</span>
					</div>

					{/* Main Menu */}
					<ul className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground">
						{navbarItems.map((nav) => {
							return (
								<NavbarItem key={nav.id} name={nav.name} link={nav.link} />
							);
						})}
					</ul>
				</div>

				{/* Right: Auth Actions */}
				<UserMenu />
			</nav>
		</header>
	);
};

const NavbarItem = ({ name, link }: NavbarItemProps) => {
	return (
		<li>
			<Link to={link} className="hover:text-foreground transition">
				{name}
			</Link>
		</li>
	);
};

export default Navbar;
