import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import UserMenu from "@/components/usermenu";
import { navbarItems } from "@/constants/navbarItems";
import { useUserStore } from "@/store/user";

interface NavbarItemProps {
	name: string;
	link: string;
	onClick?: () => void;
}

const Navbar = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const { user } = useUserStore();

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	return (
		<header className="w-full sticky top-0 z-50 border-b border-border bg-background">
			<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
				{/* Left: Logo + Brand + Main Menu */}
				<div className="flex items-center gap-8">
					{/* Logo + Name */}
					<div className="flex items-center gap-2">
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

					{/* Desktop Menu */}
					<ul className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground">
						{navbarItems.map((nav) => {
							return (
								<NavbarItem key={nav.id} name={nav.name} link={nav.link} />
							);
						})}
						{user && <NavbarItem name="Settings" link="/settings" />}
					</ul>
				</div>

				{/* Right: Auth Actions + Mobile Menu Button */}
				<div className="flex items-center gap-4">
					<UserMenu />

					{/* Mobile Menu Button */}
					<button
						type="button"
						onClick={toggleMobileMenu}
						className="md:hidden cursor-pointer p-2 text-foreground hover:text-primary transition-colors"
						aria-label="Toggle menu"
					>
						{isMobileMenuOpen ? (
							<X className="size-6" />
						) : (
							<Menu className="size-6" />
						)}
					</button>
				</div>
			</nav>

			{/* Mobile Dropdown Menu */}
			<div
				className={`absolute w-[35%] right-0 z-50 md:hidden border-t border-border bg-background shadow-lg transition-all duration-300 ease-in-out ${
					isMobileMenuOpen
						? "translate-y-0 opacity-100 pointer-events-auto"
						: "-translate-y-30 opacity-0 pointer-events-none"
				}`}
			>
				<ul className="flex flex-col px-4 py-4 space-y-4 text-sm font-medium">
					{navbarItems.map((nav) => {
						return (
							<NavbarItem
								key={nav.id}
								name={nav.name}
								link={nav.link}
								onClick={closeMobileMenu}
							/>
						);
					})}
				</ul>
			</div>
		</header>
	);
};

const NavbarItem = ({ name, link, onClick }: NavbarItemProps) => {
	return (
		<li>
			<Link
				to={link}
				onClick={onClick}
				className="text-foreground hover:text-primary hover:underline duration-200 transition-colors"
			>
				{name}
			</Link>
		</li>
	);
};

export default Navbar;
