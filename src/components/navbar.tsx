import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
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
	const [query, setQuery] = useState("");
	const navigate = useNavigate();
	const { user } = useUserStore();

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (query.trim()) {
			navigate({ to: "/shop", search: { q: query.trim() } });
		}
	};

	return (
		<header className="w-full sticky top-0 z-50 border-b border-border bg-background">
			<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
				<div className="flex items-center gap-8">
					<div className="flex items-center gap-2">
						<Link to="/">
							<img
								src="/logo.png"
								alt="app-logo"
								className="size-9 rounded-xl"
							/>
						</Link>
						<span className="text-lg font-semibold tracking-wider text-foreground">
							RiffMarket
						</span>
					</div>

					<ul className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
						{navbarItems.map((nav) => (
							<NavbarItem key={nav.id} name={nav.name} link={nav.link} />
						))}
						{user && <NavbarItem name="Settings" link="/settings" />}
					</ul>
				</div>

				<form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md mx-4">
					<div className="relative w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search gear..."
							className="pl-10"
						/>
					</div>
				</form>

				<div className="flex items-center gap-4">
					<UserMenu />

					<button
						type="button"
						onClick={toggleMobileMenu}
						className="lg:hidden cursor-pointer p-2 text-foreground hover:text-primary transition-colors"
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

			<div
				className={`absolute w-[35%] right-0 z-50 lg:hidden border-t border-border bg-background shadow-lg transition-all duration-300 ease-in-out ${
					isMobileMenuOpen
						? "translate-y-0 opacity-100 pointer-events-auto"
						: "-translate-y-30 opacity-0 pointer-events-none"
				}`}
			>
				<ul className="flex flex-col p-4 gap-4 text-sm font-medium">
					{navbarItems.map((nav) => (
						<NavbarItem
							key={nav.id}
							name={nav.name}
							link={nav.link}
							onClick={closeMobileMenu}
						/>
					))}
					{user && <NavbarItem name="Settings" link="/settings" />}
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
				className="hover:text-foreground transition-colors"
			>
				{name}
			</Link>
		</li>
	);
};

export default Navbar;
