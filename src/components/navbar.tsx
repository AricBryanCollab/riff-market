import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import UserMenu from "@/components/usermenu";
import { navbarItems } from "@/constants/navbarItems";

interface NavbarItemProps {
	name: string;
	link: string;
}

const Navbar = () => {
	const [query, setQuery] = useState("");
	const navigate = useNavigate();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (query.trim()) {
			navigate({ to: "/shop" });
		}
	};

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

				<search className="hidden sm:flex flex-1 max-w-md mx-4">
					<form onSubmit={handleSearch} className="w-full">
						<div className="relative">
							<Search
								className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
								aria-hidden="true"
							/>
							<label htmlFor="navbar-search" className="sr-only">
								Search gear
							</label>
							<Input
								id="navbar-search"
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search gear..."
								className="pl-10"
							/>
						</div>
					</form>
				</search>

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
