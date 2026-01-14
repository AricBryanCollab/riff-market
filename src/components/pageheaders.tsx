import ProductActions from "@/components/productactions";
import { Body, H3 } from "@/components/typography";

interface ProductHeaderProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
}

export function ShopPageHeader({
	searchTerm,
	onSearchChange,
}: ProductHeaderProps) {
	return (
		<div className="flex flex-col gap-6 rounded-xl bg-white p-4 md:flex-row md:items-center md:justify-between">
			<div>
				<H3 className="tracking-wider">Browse Music Tools</H3>
				<Body className="mt-1">
					Discover guitars, pedals, keyboards, and accessories in this
					community-based marketplace
				</Body>
			</div>

			<div className="flex flex-col md:flex-row items-center gap-2">
				<ProductActions
					searchTerm={searchTerm}
					handleSearchTerm={onSearchChange}
				/>
			</div>
		</div>
	);
}
