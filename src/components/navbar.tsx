import { Link } from "@tanstack/react-router";
import UserMenu from "@/components/user-menu";
import { navbarItems } from "@/constants/navbar-items";

interface NavbarItemProps {
	name: string;
	link: string;
}

const Navbar = () => {
	return (
		<header className="w-full border-b border-border bg-background">
			<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
				<div className="flex items-center gap-8">
					<Link
						to="/"
						className="text-lg font-semibold tracking-wider text-foreground"
					>
						RiffMarket
					</Link>

					<ul className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
						{navbarItems.map((nav) => (
							<NavbarItem key={nav.id} name={nav.name} link={nav.link} />
						))}
					</ul>
				</div>

				<UserMenu />
			</nav>
		</header>
	);
};

const NavbarItem = ({ name, link }: NavbarItemProps) => {
	return (
		<li>
			<Link to={link} className="hover:text-foreground transition-colors">
				{name}
			</Link>
		</li>
	);
};

export default Navbar;
