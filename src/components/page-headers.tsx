import { ShopPageListingActions } from "@/components/listing-actions";
import { Body, H3 } from "@/components/ui/typography";
import useShopSearchFilters from "@/hooks/use-shop-search-filters";

export function ShopPageHeader() {
	const { searchParams, setSearch } = useShopSearchFilters();
	const searchTerm = searchParams.search || "";

	const handleSearchChange = (value: string) => {
		setSearch(value || undefined);
	};
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
				<ShopPageListingActions
					searchTerm={searchTerm}
					handleSearchTerm={handleSearchChange}
				/>
			</div>
		</div>
	);
}
